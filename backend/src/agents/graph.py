from langgraph.graph import StateGraph, START, END
from src.agents.state import AgentState
from src.agents.nodes.node_summarise import run_node_summary_notes
from src.agents.nodes.node_quiz import run_node_quiz
from src.agents.nodes.node_recommendation import run_node_recommendation
from src.agents.nodes.node_flashcards import run_node_flashcards
from src.agents.nodes.node_audio_summary import run_node_audio_overview
from src.agents.nodes.node_verifier import run_node_verifier
from src.agents.nodes.node_enrichment import run_node_enrichment

def create_agent_graph():
    # define the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    # Summarize runs first, then the rest run sequentially
    workflow.add_node("summarise", run_node_summary_notes)
    workflow.add_node("quiz", run_node_quiz)
    workflow.add_node("recommendation", run_node_recommendation)
    workflow.add_node("flashcards", run_node_flashcards)
    workflow.add_node("audio_summary", run_node_audio_overview)
    workflow.add_node("verify", run_node_verifier)
    workflow.add_node("enrichment", run_node_enrichment)

    # Set Entry Point
    workflow.add_edge(START, "summarise")

    # Add Edges (Fan-out: everything runs in parallel after summary is ready)
    workflow.add_edge("summarise", "quiz")
    workflow.add_edge("summarise", "recommendation")
    workflow.add_edge("summarise", "flashcards")
    workflow.add_edge("summarise", "enrichment")
    workflow.add_edge("summarise", "verify")
    
    # Audio summary depends on verification
    workflow.add_edge("verify", "audio_summary")
    
    # All terminal nodes point to END
    workflow.add_edge("quiz", END)
    workflow.add_edge("recommendation", END)
    workflow.add_edge("flashcards", END)
    workflow.add_edge("enrichment", END)
    workflow.add_edge("audio_summary", END)

    return workflow.compile()

AgentGraphWorkflow = create_agent_graph()
