<!-- ======================= HERO ======================= -->

<h1 align="center">
   SmartTutorAI
</h1>

<p align="center">
  <b>Intelligent AI Tutor that transforms any topic or PDF into a complete interactive Learning Space</b>
</p>

<p align="center">
  Built with Next.js • FastAPI • LangGraph • Gemini • Supabase
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
    <img src="https://img.shields.io/badge/LLM-Gemini%202.0-blue?style=for-the-badge" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge" />
  </a>

</p>

---

##  Overview

**SmartTutorAI** is a next-generation AI learning platform that automatically generates a complete personalized learning environment from:

- A raw topic  
- An uploaded PDF  

Instead of passive reading, students get a **fully interactive AI learning experience**.

---

##  Key Highlights

- AI-generated structured summary notes  
- Interactive MCQ quizzes with explanations  
- Active-recall flashcards  
- Podcast-style audio learning  
- AI-curated recommendations  
- LangGraph multi-node workflow  
- Secure authentication (Clerk)  
- Supabase real-time persistence  
- Production-grade async architecture  

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
flowchart LR
    A[User Input] --> B[Next.js Frontend]
    B --> C[FastAPI Backend]
    C --> D[LangGraph Workflow]
    D --> E[Google Gemini]
    E --> F[Supabase Database]
    F --> G[Reactive UI Update]
