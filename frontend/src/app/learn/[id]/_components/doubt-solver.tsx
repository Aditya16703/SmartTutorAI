"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Loader2, Bot, User, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
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
        const { data } = await supabase
          .from("doubt_messages")
          .select("*")
          .eq("learning_space_id", learningSpaceId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (data && data.length > 0) {
          setMessages(
            data.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              created_at: m.created_at,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch doubt history:", err);
      } finally {
        setIsFetchingHistory(false);
      }
    }
    fetchHistory();
  }, [learningSpaceId, userId]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    // Optimistically add the user message
    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
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
          question,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const aiMessage: Message = {
        role: "assistant",
        content: data.answer || "Sorry, I couldn't generate an answer.",
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
      // Re-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-foreground text-base">AI Doubt Solver</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Ask anything about this topic
            </p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            {language}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex flex-col" style={{ minHeight: "340px", maxHeight: "480px" }}>
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: "220px", maxHeight: "340px" }}>
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
                <p className="font-semibold text-foreground text-sm">Your AI Tutor is ready!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask a doubt about this topic — in any language.
                </p>
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

                {/* Bubble */}
                <div
                  className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed group relative ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground border border-border rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  
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

        {/* Input area */}
        <div className="border-t border-border p-3 flex gap-2 items-end bg-card">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a doubt in ${language}... (Enter to send)`}
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
