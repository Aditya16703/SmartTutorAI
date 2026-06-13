<!-- ======================= HERO ======================= -->

<!-- ======================= HERO ======================= -->

<h1 align="center">
   SmartTutorAI
</h1>

<p align="center">
  <b>Intelligent AI Tutor that transforms any topic, PDF, or YouTube video into a complete interactive Learning Space</b>
</p>

<p align="center">
  Built with Next.js 15 • FastAPI • LangGraph • Multi-LLM Routing • Supabase
</p>

<p align="center">

  <a href="#">
    <img src="https://img.shields.io/badge/_Live_Demo-Coming_Soon-22c55e?style=for-the-badge" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Auth-Clerk-purple?style=for-the-badge" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/LLM-Gemini%202.5-blue?style=for-the-badge" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge" />
  </a>

</p>

---

## 🌟 Overview

**SmartTutorAI** is an advanced, AI-native personalized learning platform that instantly converts raw study topics, uploaded PDFs, or **YouTube videos** into an interactive, multi-modal learning workspace. Rather than passive reading, students are guided through structured summaries, active-recall drills, real-time audio, and an AI tutor that adapts to their learning level and language.

---

## ⚡ Key Highlights

### 🧠 Personalized Learning Experience
* **Adaptive AI Summaries:** Custom-tailored structured notes with auto-generated **Mermaid.js diagrams** (mindmaps/concept flows) for visual learners.
* **Interactive MCQ Quizzes:** Dynamically generated quizzes with detailed explanations and real-time performance logging.
* **Active-Recall Flashcards:** Systematically generated cards designed to reinforce long-term memory retention.
* **Podcast-Style Audio Learning:** Converts written concepts into engaging, high-quality audio summaries using **ElevenLabs** with automated fallbacks.
* **Adaptive Study Profile:** Auto-scales vocabulary and terminology based on the student's grade level, style (standard, simple, advanced), and language preference.

### 💬 Interactive Q&A Support
* **AI Doubt Solver:** An embedded context-aware chatbot that answer follow-up questions grounded in the study notes and recent chat history.

### ⚙️ Production-Grade Architecture
* **LangGraph Multi-Node Workflow:** Orchestrates complex, parallel AI agent tasks (notes, quizzes, flashcards, recommendations) in a fast fan-out topology.
* **Resilient LLM Routing:** A custom routing engine with a **Circuit Breaker** pattern that tracks model latencies, manages API rate limits, and automatically falls back to Gemini on service degradation.
* **Real-time Persistence & Auth:** Integrated with **Supabase (PostgreSQL)** for caching/telemetry and **Clerk** for secure user authentication.
* **Asynchronous Background Processing:** Supports concurrent task execution, background worker limits, and job cancellation patterns.


---

##  Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,python,fastapi,postgres,supabase" />
</p>

<p align="center">
  <b>Next.js • React • TypeScript • Tailwind • FastAPI • Supabase • LangChain • LangGraph • Gemini</b>
</p>

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    %% Frontend Subgraph
    subgraph Frontend [Next.js Client Layer]
        UI[User UI Dashboard]
        Auth[Clerk Authentication]
        Input[Inputs: PDF / Topic / YouTube Link]
    end

    %% Backend Subgraph
    subgraph Backend [FastAPI Service Layer]
        API[API Endpoints: /invoke, /ask, /audio-summary]
        JM[Job Manager: Concurrency & Cancellation]
    end

    %% Agentic Workflow Subgraph
    subgraph LangGraph [LangGraph Workflow Engine]
        InitState[Initial State Initialization]
        SummNode[Summarizer Agent Node]
        
        subgraph FanOut [Parallel Execution Nodes]
            QuizNode[Quiz Node]
            FlashNode[Flashcard Node]
            RecNode[Recommendation Node]
            EnrichNode[Enrichment Node]
            VerifyNode[Verification Node]
        end
        
        AudioNode[Audio Summary Node]
    end

    %% Model & External Services Subgraph
    subgraph AIServices [AI Routing & Synthesis Layer]
        Router[Model Router & Circuit Breaker]
        LLMs[LLMs: Gemini / Groq / Mistral / DeepSeek]
        TTS[TTS Synthesis: ElevenLabs / gTTS]
    end

    %% Data Subgraph
    subgraph Data [Supabase Data & Storage Layer]
        DB[(Supabase Postgres Database)]
        Storage[(Supabase Audio Storage Bucket)]
    end

    %% Connections
    Input --> UI
    UI --> Auth
    UI -->|HTTP POST Request| API
    API --> JM
    JM -->|Triggers| InitState
    
    InitState --> SummNode
    SummNode -->|Parallel Fan-Out| QuizNode
    SummNode -->|Parallel Fan-Out| FlashNode
    SummNode -->|Parallel Fan-Out| RecNode
    SummNode -->|Parallel Fan-Out| EnrichNode
    SummNode -->|Parallel Fan-Out| VerifyNode
    
    VerifyNode --> AudioNode
    
    SummNode & QuizNode & FlashNode & RecNode & EnrichNode & VerifyNode & AudioNode -->|Queries & Verification| Router
    Router --> LLMs
    AudioNode --> TTS
    
    %% Storage & Database updates
    TTS -->|Upload MP3| Storage
    SummNode & QuizNode & FlashNode & RecNode & EnrichNode -->|Persist JSON/Text| DB
    DB -->|Reactive Data Fetch| UI
    Storage -->|Serve Public Audio URL| UI

