"use client";

import React, { useState } from "react";
import { BookOpen, Clock, ExternalLink, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface Citation {
  label: string;         // "Page 12", "2:34", "Section 3"
  url?: string | null;   // deep link into source
  excerpt: string;       // text snippet from source
  score: number;         // relevance 0-1
}

interface CitationPillsProps {
  citations: Citation[];
  ragGrounded: boolean;
  className?: string;
}

/**
 * CitationPills
 * =============
 * Renders source citations returned by the RAG doubt solver.
 * Each pill shows the source label (page / timestamp) and expands
 * to reveal the verbatim excerpt on click.
 *
 * Design goals:
 *  - Non-intrusive by default (collapsed pills)
 *  - Click-to-expand individual excerpts
 *  - External link opens source at exact position
 *  - Score-based opacity to visually rank relevance
 */
export default function CitationPills({
  citations,
  ragGrounded,
  className = "",
}: CitationPillsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!citations || citations.length === 0) return null;

  const isYouTubeLabel = (label: string) =>
    /^\d+:\d{2}$/.test(label.trim());

  const toggle = (i: number) =>
    setExpandedIndex(expandedIndex === i ? null : i);

  return (
    <div className={`mt-3 space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        <Sparkles className="w-3 h-3 text-primary" />
        {ragGrounded ? "Grounded Sources" : "Related Sources"}
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {citations.map((citation, i) => {
          const isVideo = isYouTubeLabel(citation.label);
          const isExpanded = expandedIndex === i;
          const opacity = Math.max(0.5, citation.score);

          return (
            <div key={i} className="w-full">
              {/* Pill button */}
              <button
                onClick={() => toggle(i)}
                className={`
                  group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium
                  transition-all duration-200 cursor-pointer
                  ${isExpanded
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted/60 border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/20"
                  }
                `}
                style={{ opacity }}
                title={`Relevance: ${Math.round(citation.score * 100)}%`}
              >
                {isVideo ? (
                  <Clock className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <BookOpen className="w-3 h-3 flex-shrink-0" />
                )}
                <span>{citation.label}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 ml-0.5 opacity-60" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                )}
              </button>

              {/* Expanded excerpt panel */}
              {isExpanded && (
                <div className="mt-1.5 ml-2 pl-3 border-l-2 border-primary/30 bg-muted/30 rounded-r-lg p-2.5 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">
                    {citation.excerpt}
                  </p>
                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {isVideo ? "Jump to timestamp" : "View in source"}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
