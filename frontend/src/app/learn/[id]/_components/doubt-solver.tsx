"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, Send, Loader2, Bot, User, Sparkles,
  ThumbsUp, ThumbsDown, Database, AlertCircle, Brain, Lightbulb,
  Compass, HelpCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import CitationPills from "./citation-pills";
import MarkdownRenderer from "@/components/markdown-renderer";

interface Citation {
  label: string;
  url?: string | null;
  excerpt: string;
  score: number;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  citations?: Citation[];
  ragGrounded?: boolean;
  mode?: "direct" | "socratic";
  hintTier?: number;
}

interface DoubtSolverProps {
  learningSpaceId: string;
  userId: string;
  language?: string;
}

export default function DoubtSolver({
  learningSpaceId,
  userId,
  language = "English",
}: DoubtSolverProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [pedagogyMode, setPedagogyMode] = useState<"direct" | "socratic">("direct");
  const [lastQuestion, setLastQuestion] = useState<string>("");
  const [ragStatus, setRagStatus] = useState<{
    indexed: boolean;
    chunkCount: number;
    sourceTypes: string[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch chat history on mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("doubt_messages")
          .select("id, role, content, created_at")
          .eq("learning_space_id", learningSpaceId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(30);

        if (error) {
          console.warn("Could not fetch doubt history:", error.message);
        } else if (data) {
          setMessages(
            data.map((m: any) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              created_at: m.created_at,
            }))
          );
        }
      } catch (e) {
        console.warn("Doubt history fetch error:", e);
      } finally {
        setIsFetchingHistory(false);
      }
    }

    fetchHistory();
  }, [learningSpaceId, userId]);

  // Check RAG indexing status on mount
  useEffect(() => {
    async function checkRagStatus() {
      try {
        const agentApi =
          process.env.NEXT_PUBLIC_AGENT_API || "http://localhost:8000";
        const res = await fetch(
          `${agentApi}/api/doubt/rag-status/${learningSpaceId}`
        );
        if (res.ok) {
          const data = await res.json();
          setRagStatus(data);
        }
      } catch (e) {
        // Non-fatal, just hide badge
      }
    }

    checkRagStatus();
  }, [learningSpaceId]);

  const executeDoubtQuery = async (
    questionText: string,
    mode: "direct" | "socratic" = pedagogyMode,
    hintTier?: number
  ) => {
    if (!questionText || isLoading) return;

    if (!hintTier) {
      const userMessage: Message = { role: "user", content: questionText };
      setMessages((prev) => [...prev, userMessage]);
      setLastQuestion(questionText);
      setInput("");
    }

    setIsLoading(true);

    try {
      const agentApi =
        process.env.NEXT_PUBLIC_AGENT_API || "http://localhost:8000";
      const res = await fetch(`${agentApi}/api/doubt/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learning_space_id: learningSpaceId,
          user_id: userId,
          question: questionText,
          language,
          mode,
          hint_tier: hintTier,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const aiMessage: Message = {
        role: "assistant",
        content: data.answer || "Sorry, I couldn't generate an answer.",
        citations: data.citations || [],
        ragGrounded: data.rag_grounded || false,
        mode: data.mode || mode,
        hintTier: data.hint_tier || hintTier,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Doubt solver error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I ran into an error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    executeDoubtQuery(question, pedagogyMode);
  };

  const handleRequestHint = (tier: number) => {
    const targetQ = lastQuestion || input.trim();
    if (!targetQ) return;
    executeDoubtQuery(targetQ, "socratic", tier);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-foreground text-base">AI Doubt Solver</span>
              <p className="text-xs text-muted-foreground font-normal">
                Grounded academic tutor with LaTeX math & Socratic hints
              </p>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Mode Selector */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setPedagogyMode("direct")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  pedagogyMode === "direct"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Direct mode: Clear, comprehensive answers"
              >
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Direct</span>
              </button>
              <button
                type="button"
                onClick={() => setPedagogyMode("socratic")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  pedagogyMode === "socratic"
                    ? "bg-background text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Socratic mode: Guided questioning & 3-tier progressive hints"
              >
                <Brain className="w-3 h-3 text-primary" />
                <span>Socratic</span>
              </button>
            </div>

            {/* Language Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              {language}
            </div>

            {/* RAG status badge */}
            {ragStatus && (
              <div
                className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  ragStatus.indexed
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-amber-500/10 text-amber-600"
                }`}
                title={
                  ragStatus.indexed
                    ? `${ragStatus.chunkCount} source chunks indexed`
                    : "Source not indexed yet"
                }
              >
                <Database className="w-2.5 h-2.5" />
                {ragStatus.indexed ? `${ragStatus.chunkCount} chunks` : "Fallback"}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col" style={{ minHeight: "340px", maxHeight: "560px" }}>
        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ minHeight: "220px", maxHeight: "400px" }}
        >
          {isFetchingHistory ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Your AI Tutor is ready!
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {ragStatus?.indexed
                    ? `Grounded in ${ragStatus.chunkCount} source chunks with exact citations & LaTeX formula support.`
                    : "Ask anything about this topic — equations, proofs, and concepts supported."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md border border-border">
                  <Lightbulb className="w-3 h-3 text-amber-500" /> Direct answers
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md border border-border">
                  <Brain className="w-3 h-3 text-primary" /> Socratic guidance
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md border border-border">
                  $E = mc^2$ LaTeX formulas
                </span>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.role === "user"
                      ? "bg-primary"
                      : "bg-muted border border-border"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-primary-foreground" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>

                {/* Bubble + Citations */}
                <div
                  className={`max-w-[85%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  } flex flex-col gap-1`}
                >
                  {/* Socratic indicator tag */}
                  {msg.role === "assistant" && msg.mode === "socratic" && (
                    <div className="flex items-center gap-1 text-[10px] text-primary font-medium px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      <Brain className="w-2.5 h-2.5" />
                      {msg.hintTier === 1
                        ? "Socratic Nudge (Level 1)"
                        : msg.hintTier === 2
                        ? "Socratic Clue & Strategy (Level 2)"
                        : msg.hintTier === 3
                        ? "Step-by-step Solution (Level 3)"
                        : "Socratic Guided Thinking"}
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed group relative ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground border border-border rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer
                        content={msg.content}
                        className="text-sm leading-relaxed"
                      />
                    )}

                    {msg.role === "assistant" && (
                      <div className="absolute -bottom-6 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-bold">
                          <ThumbsUp className="w-3 h-3" /> Helpful
                        </button>
                        <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500 font-bold">
                          <ThumbsDown className="w-3 h-3" /> Still confused
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Citations — only for assistant messages */}
                  {msg.role === "assistant" &&
                    msg.citations &&
                    msg.citations.length > 0 && (
                      <CitationPills
                        citations={msg.citations}
                        ragGrounded={msg.ragGrounded ?? false}
                        className="w-full mt-1"
                      />
                    )}
                </div>
              </div>
            ))
          )}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-2 flex-row">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-muted border border-border">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-muted border border-border">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Socratic Progressive Scaffolding Hint Bar */}
        {pedagogyMode === "socratic" && (
          <div className="px-3 py-1.5 bg-primary/5 border-t border-border flex items-center justify-between text-xs gap-2">
            <span className="text-muted-foreground text-[11px] flex items-center gap-1">
              <Compass className="w-3 h-3 text-primary" /> Need a hint?
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleRequestHint(1)}
                disabled={isLoading || (!lastQuestion && !input.trim())}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-background hover:bg-muted border border-border text-foreground disabled:opacity-40 transition-colors"
                title="Level 1: Gentle Nudge"
              >
                🥉 Nudge
              </button>
              <button
                type="button"
                onClick={() => handleRequestHint(2)}
                disabled={isLoading || (!lastQuestion && !input.trim())}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-background hover:bg-muted border border-border text-foreground disabled:opacity-40 transition-colors"
                title="Level 2: Formula & Strategy Clue"
              >
                🥈 Clue
              </button>
              <button
                type="button"
                onClick={() => handleRequestHint(3)}
                disabled={isLoading || (!lastQuestion && !input.trim())}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 disabled:opacity-40 transition-colors font-semibold"
                title="Level 3: Full Step-by-Step Resolution"
              >
                🥇 Solution
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-border p-3 flex gap-2 items-end bg-card">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              pedagogyMode === "socratic"
                ? `Ask for guidance in ${language}... (Socratic mode on)`
                : `Ask a doubt in ${language}... (Enter to send)`
            }
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
