# import modules
import logging
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import SummaryNoteOutput
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback
from src.utils.pdf_extractor import extract_text_from_url, describe_pdf_visuals
from src.utils.youtube_extractor import fetch_youtube_transcript

# -------------- Agent Node - Notes Summary ----------------
# Primary model: DeepSeek  |  Fallback: Gemini Flash

logger = logging.getLogger(__name__)


def run_node_summary_notes(state: AgentState):
    """LLM call to generate summary notes for student (DeepSeek → Gemini fallback)."""

    logger.info("node_summary_notes running.... [primary: DeepSeek]")
    logger.info(state)

    target_lang = state['student_profile'].get("language", "english")

    # Build human message content dynamically
    user_content = [
        {"type": "text",
         "text": "Topic: " + str(state['user_prompt']['topic']) + ". \n\nIMPORTANT: Generate the summary in " + str(target_lang) + " ONLY."}
    ]

    # Extract text FAST if URL exists
    url = (state['user_prompt'].get('file_url') or '').strip()
    extracted_content = ""

    if url:
        if "youtube.com" in url or "youtu.be" in url:
            logger.info("🎬 Processing YouTube Source...")
            extracted_content = fetch_youtube_transcript(url)
        else:
            logger.info("📄 Processing Document Source (Text Only Pass)...")
            extracted_content = extract_text_from_url(url)

        if extracted_content:
            user_content[0]["text"] += f"\n\nSource Material Content:\n{extracted_content}"
        else:
            logger.warning("Source extraction failed. Falling back to URL.")
            user_content[0]["text"] += f"\n\nReference source URL: {url}"
    else:
        logger.info("🧠 No file provided. Topic research only.")

    prompt_template = ChatPromptTemplate([
        ("system", """You are an expert academic tutor. Create personalized educational content following these guidelines:
            
            Student Profile:
            - Class Level: {grade_level}
            - Language: {language} 
            - Gender: {gender}
            - Style: {adaptivity_style}
            
            Content Requirements:
            1. Create concise, well-structured summary notes on the topic.
            2. {style_instructions}
            3. Use bullet points and simple language appropriate for {grade_level}.
            4. Include practical examples and analogies.
            5. Provide content in {language} ONLY. This is a CRITICAL REQUIREMENT. 
            6. If the source material or topic title is in a different language, you MUST TRANSLATE EVERYTHING to {language}.
            7. DO NOT use any other language than {language} in your output.
            8. VISUAL LEARNING: Include at least one Mermaid.js diagram (graph TD or mindmap) to visualize the core concepts, relationship flows, or processes described. Use the language `mermaid` for the code block.
            9. Ensure the Mermaid diagram labels are also in {language}.
            """),
        ("user", "{user_content}")
    ])

    try:
        response = call_with_fallback(
            task="summary",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "gender": state['student_profile'].get("gender", ""),
                "adaptivity_style": state['student_profile'].get("adaptivity_level", "standard"),
                "style_instructions": (
                    "EXPLAIN LIKE I'M 5: Use extreme simplicity, very basic words, and 2x more analogies than usual."
                    if state['student_profile'].get("adaptivity_level") == "simple"
                    else "ACADEMIC ADVANCED: Use rigorous terminology, assume basic knowledge, and provide deeper conceptual insights."
                    if state['student_profile'].get("adaptivity_level") == "advanced"
                    else "Standard academic explanation appropriate for the grade level."
                ),
                "user_content": user_content[0]["text"],
            },
            structured_schema=SummaryNoteOutput,
            temperature=0.1,
        )

        logger.info(f"Summary generated in {target_lang}")

        # Robustly extract summary text from response (handle both dict and object)
        summary_text = ""
        if isinstance(response, dict):
            summary_text = response.get("summary", "")
        elif hasattr(response, "summary"):
            summary_text = response.summary
        else:
            summary_text = str(response)

        logger.info(f"Summary text extracted, length: {len(summary_text)}")

        # Save the summary notes as RAW TEXT to ensure DB compatibility
        if summary_text:
            supabase_service.update_learning_space(
                state["learning_space_id"],
                {"summary_notes": summary_text}
            )
            logger.info("✅ Summary notes saved to database")
        else:
            logger.warning("⚠️ No summary text found to save")

        return {
            "summary_notes": summary_text,
            "raw_source_text": extracted_content
        }

    except Exception as e:
        logger.error(f"Failed to generate summary notes: {e}")
        return {}
