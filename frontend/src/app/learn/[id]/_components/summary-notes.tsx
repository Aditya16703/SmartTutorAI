"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, RefreshCcw, Brain, Eye, EyeOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import React, { useState } from "react";
import GenerationTimer from "./generation-timer";
import { Button } from "@/components/ui/button";
import { invokeAgentWorkflow } from "../../actions/learning-space";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import MermaidDiagram from "./mermaid-diagram";

export default function SummaryNotes({
  learningSpaceId,
  userId,
  summaryNotes,
  fileUrl,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  summaryNotes?: string | null;
  fileUrl?: string | null;
  language?: string;
}) {
  const [generationStatus, setGenerationStatus] = useState<'normal' | 'long' | 'retry'>('normal');
  const [timerKey, setTimerKey] = useState(0);
  const [studyMode, setStudyMode] = useState(false);
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());

  const summaryNotesContent = summaryNotes;

  const handleRetry = async () => {
    setGenerationStatus('normal');
    setTimerKey(prev => prev + 1);
    try {
      await invokeAgentWorkflow(learningSpaceId, userId, language);
    } catch (err) {
      console.error("Retry failed:", err);
    }
  };

  // Parse the summary notes content
  const getDisplayContent = () => {
    if (!summaryNotesContent) return "No summary notes available";
    
    try {
      // Try to parse as JSON in case it's stored as JSON string
      const summaryString = typeof summaryNotesContent === 'string' 
        ? summaryNotesContent 
        : JSON.stringify(summaryNotesContent);
        
      const parsed = JSON.parse(summaryString);
      if (parsed.summary) {
        return parsed.summary; // Return the summary from the object
      }
      return summaryString; 
    } catch {
      // If it's not JSON, return as string
      return typeof summaryNotesContent === 'string' 
        ? summaryNotesContent 
        : JSON.stringify(summaryNotesContent);
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-foreground">Summary Notes</span>
          </div>
          
          {summaryNotesContent && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStudyMode(!studyMode);
                  setRevealedWords(new Set());
                }}
                className={`h-8 gap-2 px-3 transition-all ${studyMode ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground"}`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {studyMode ? "Study Mode: On" : "Study Mode"}
                </span>
                {studyMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {summaryNotesContent ? (
          <div className="prose max-w-none dark:prose-invert">
            <div className="bg-background rounded-lg p-6 border border-border group relative">
               <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed font-serif text-lg">
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      if (!inline && match && match[1] === "mermaid") {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    strong({ children }) {
                      const text = String(children);
                      if (!studyMode) return <strong>{children}</strong>;
                      
                      const isRevealed = revealedWords.has(text);
                      return (
                        <span 
                          onClick={() => {
                            const newSet = new Set(revealedWords);
                            if (newSet.has(text)) newSet.delete(text);
                            else newSet.add(text);
                            setRevealedWords(newSet);
                          }}
                          className={`inline-block transition-all duration-300 rounded px-1 cursor-pointer font-bold ${
                            isRevealed 
                              ? "bg-primary/10 text-primary" 
                              : "bg-muted-foreground/20 text-transparent blur-[4px] select-none hover:bg-muted-foreground/30"
                          }`}
                        >
                          {children}
                        </span>
                      );
                    }
                  }}
                >
                  {getDisplayContent()}
                </ReactMarkdown>
               </div>
               
               {/* Feedback Overlay */}
               <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors border border-border shadow-sm bg-background">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors border border-border shadow-sm bg-background">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/10 flex flex-col items-center justify-center text-center">
              <h4 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Generating Summary Notes...
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs text-center">
                {fileUrl 
                  ? "Our AI agents are analyzing your PDF and extracting key takeaways. This usually takes 20-40 seconds."
                  : "Our AI agents are synthesizing your topic and generating a personalized learning path. This usually takes 15-30 seconds."}
              </p>
              <GenerationTimer 
                key={timerKey}
                onStatusChange={(s: 'normal' | 'long' | 'retry') => setGenerationStatus(s)} 
              />
            </div>
            
            <div className="space-y-4 px-2">
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>

            {generationStatus === 'retry' && (
              <Button 
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="w-full bg-background border-dashed border-primary/30 text-primary hover:bg-primary/10"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Restart Generation Attempt
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}