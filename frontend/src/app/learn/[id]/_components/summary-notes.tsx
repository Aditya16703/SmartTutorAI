"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import React, { useState } from "react";
import GenerationTimer from "./generation-timer";
import { Button } from "@/components/ui/button";
import { invokeAgentWorkflow } from "../../actions/learning-space";

export default function SummaryNotes({
  learningSpaceId,
  userId,
  summaryNotes,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  summaryNotes?: string | null;
  language?: string;
}) {
  const [generationStatus, setGenerationStatus] = useState<'normal' | 'long' | 'retry'>('normal');
  const [timerKey, setTimerKey] = useState(0);
  const isGenerating = !summaryNotes;
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
    <Card className="bg-white dark:bg-card border-blue-200 dark:border-blue-900 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10" />
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 dark:text-white">Summary Notes</span>
          </div>
          {/* {!isGenerating && notes && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSpeech}
                className={`text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 ${
                  isSpeaking ? "bg-blue-100 dark:bg-blue-900/50" : ""
                }`}
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 animate-pulse" />
                ) : (
                  <Volume1 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          )} */}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {summaryNotesContent ? (
          <div className="prose prose-blue max-w-none dark:prose-invert">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-100 dark:border-slate-800">
               <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-serif text-lg">
                <ReactMarkdown>{getDisplayContent()}</ReactMarkdown>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
              Generating Summary Notes...
            </h4>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <GenerationTimer 
              key={timerKey}
              onStatusChange={(s: 'normal' | 'long' | 'retry') => setGenerationStatus(s)} 
            />
            
            {generationStatus === 'retry' && (
              <Button 
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="mt-4 bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry Generation
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}