"use client";

import React from "react";
import SummaryNotes from "./summary-notes";
import Flashcards from "./flashcards";
import Recommendations from "./recommendations";
import UploadedSources from "./sources";
import AudioOverview from "./audio-overview";
import Quiz from "./quiz";
import { useLearningSpaceRealtime } from "./use-learning-space-realtime";
import { AlertCircle, RefreshCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LearningSpaceContentProps {
  learningSpace: any;
  user: any;
}

export default function LearningSpaceContent({
  learningSpace: initialSpace,
  user,
}: LearningSpaceContentProps) {
  const { lastUpdate, connectionStatus, errorDetails } = useLearningSpaceRealtime(
    initialSpace.id
  );

  // Merge initial data with realtime updates
  const learningSpace = lastUpdate ? { ...initialSpace, ...lastUpdate } : initialSpace;

  if (connectionStatus === "error") {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 border p-4 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1 space-y-3 text-red-900 dark:text-red-200">
            <h3 className="font-semibold text-lg">Connection Error</h3>
            <div className="text-sm">
              <p>
                We&apos;re having trouble connecting to the live update service (Realtime). 
                {errorDetails && <span className="block mt-1 font-mono text-xs opacity-70">{errorDetails}</span>}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="bg-white hover:bg-red-50 text-red-600 border-red-200 shadow-sm"
                >
                  <RefreshCcw className="w-3 h-3 mr-2" />
                  Refresh Page
                </Button>
                <p className="text-xs text-red-700/70 dark:text-red-400/70 italic">
                  Tip: Check if &quot;Realtime&quot; is enabled in your Supabase Dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        <MainGrid learningSpace={learningSpace} user={user} />
      </div>
    );
  }

  return <MainGrid learningSpace={learningSpace} user={user} />;
}

function MainGrid({ learningSpace, user }: { learningSpace: any; user: any }) {
  // Safe data access helper
  const getSafeData = (data: any, key: string, fallback: any = null) => {
    return data && data[key] !== undefined ? data[key] : fallback;
  };

  const language = getSafeData(learningSpace, "language", "English");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Summary Notes */}
        <SummaryNotes
          learningSpaceId={learningSpace.id}
          userId={user.id}
          summaryNotes={getSafeData(learningSpace, "summary_notes")}
          language={language}
        />

        {/* Flashcards (Replaced Mindmap) */}
        <Flashcards
          learningSpaceId={learningSpace.id}
          userId={user.id}
          initialFlashcards={getSafeData(learningSpace, "flashcards")}
          language={language}
        />

        {/* Recommendations */}
        <Recommendations
          learningSpaceId={learningSpace.id}
          userId={user.id}
          recommendations={getSafeData(learningSpace, "recommendations")}
          language={language}
        />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Uploaded Sources */}
        <UploadedSources learningSpace={learningSpace} />

        {/* Audio Overview */}
        <AudioOverview
          learningSpaceId={learningSpace.id}
          userId={user.id}
          audio_overview={getSafeData(learningSpace, "audio_overview")}
          language={language}
        />

        <Quiz 
          learningSpaceId={learningSpace.id} 
          userId={user.id} 
          quiz={getSafeData(learningSpace, "quiz")}
          language={language}
        />
      </div>
    </div>
  );
}
