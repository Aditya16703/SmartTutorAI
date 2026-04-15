"use client";

import React from "react";
import SummaryNotes from "./summary-notes";
import Flashcards from "./flashcards";
import Recommendations from "./recommendations";
import UploadedSources from "./sources";
import AudioOverview from "./audio-overview";
import Quiz from "./quiz";
import DoubtSolver from "./doubt-solver";
import { useLearningSpaceRealtime } from "./use-learning-space-realtime";
import { WifiOff, RefreshCw } from "lucide-react";

interface LearningSpace {
  id: string;
  summary_notes?: string | null;
  flashcards?: unknown | null;
  recommendations?: unknown | null;
  quiz?: unknown | null;
  audio_overview?: unknown | null;
  file_url?: string | null;
  language?: string;
}

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface LearningSpaceContentProps {
  learningSpace: LearningSpace;
  user: User;
}

export default function LearningSpaceContent({
  learningSpace: initialSpace,
  user,
}: LearningSpaceContentProps) {
  const { lastUpdate, connectionStatus, reconnect } = useLearningSpaceRealtime(
    initialSpace.id
  );

  // Merge initial data with realtime updates
  const learningSpace = lastUpdate ? { ...initialSpace, ...lastUpdate } : initialSpace;

  return (
    <div className="flex flex-col space-y-4">
      {connectionStatus === "error" && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg flex items-center justify-between text-sm shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>Connection to AI updates lost. Some content might not load automatically.</span>
          </div>
          <button 
            onClick={reconnect}
            className="flex items-center gap-1.5 font-medium hover:text-red-700 transition-colors px-3 py-1 rounded-md hover:bg-red-100/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reconnect
          </button>
        </div>
      )}
      <MainGrid learningSpace={learningSpace} user={user} />
    </div>
  );
}

function MainGrid({ learningSpace, user }: { learningSpace: LearningSpace; user: User }) {
  // Safe data access helper
  const getSafeData = (data: LearningSpace, key: keyof LearningSpace, fallback: unknown = null) => {
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
          fileUrl={getSafeData(learningSpace, "file_url")}
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

        <DoubtSolver
          learningSpaceId={learningSpace.id}
          userId={user.id}
          language={language}
        />
      </div>
    </div>
  );
}
