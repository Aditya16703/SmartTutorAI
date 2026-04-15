"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
});

interface MermaidProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      try {
        ref.current.removeAttribute("data-processed");
        mermaid.contentLoaded();
      } catch (err) {
        console.error("Mermaid parsing error:", err);
      }
    }
  }, [chart]);

  return (
    <div className="flex justify-center my-6 overflow-x-auto bg-white/50 dark:bg-black/20 rounded-xl p-4 border border-border/50 shadow-inner">
      <div ref={ref} className="mermaid">
        {chart}
      </div>
    </div>
  );
}
