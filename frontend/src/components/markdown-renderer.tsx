"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import MermaidDiagram from "@/app/learn/[id]/_components/mermaid-diagram";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  studyMode?: boolean;
  revealedWords?: Set<string>;
  onToggleWord?: (word: string) => void;
}

export default function MarkdownRenderer({
  content,
  className = "",
  studyMode = false,
  revealedWords,
  onToggleWord,
}: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`prose max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const rawCode = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return <MermaidDiagram chart={rawCode} />;
            }

            // Block code with syntax header and copy button
            if (rawCode.includes("\n") || language) {
              const isCopied = copiedCode === rawCode;
              return (
                <div className="relative my-4 rounded-lg overflow-hidden border border-border bg-muted/40 group not-prose">
                  {language && (
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-muted/80 border-b border-border text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                      <span>{language}</span>
                      <button
                        onClick={() => handleCopyCode(rawCode)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-background/80"
                        title="Copy code"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  <div className="p-3.5 overflow-x-auto font-mono text-xs text-foreground leading-relaxed">
                    <code>{rawCode}</code>
                  </div>
                </div>
              );
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs border border-border/50 not-prose"
                {...props}
              >
                {children}
              </code>
            );
          },
          strong({ children }) {
            const text = String(children);
            if (!studyMode) return <strong>{children}</strong>;

            const isRevealed = revealedWords?.has(text);
            return (
              <span
                onClick={() => onToggleWord && onToggleWord(text)}
                className={`inline-block transition-all duration-300 rounded px-1 cursor-pointer font-bold ${
                  isRevealed
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/20 text-transparent blur-[4px] select-none hover:bg-muted-foreground/30"
                }`}
                title={isRevealed ? "Click to hide" : "Click to reveal"}
              >
                {children}
              </span>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm text-left border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-muted/70 px-4 py-2.5 font-semibold text-foreground border-b border-border">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2.5 border-b border-border/50 text-muted-foreground">
                {children}
              </td>
            );
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
