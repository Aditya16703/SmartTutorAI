import React from "react";
import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import LanguageSelector from "./_components/language-selector";
import LearningSpaceContent from "./_components/learning-space-content";
import BackToLearnButton from "./_components/back-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata() {
  return {
    title: `Learning Space`,
    description: `AI-powered learning space`,
  };
}

export default async function LearningSpacePage({ params }: PageProps) {
  const { id: topicId } = await params;
  
  // Get the current user
  const cUser = await currentUser();
  if (!cUser) {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch user and learning space in parallel
  const [userResult, spaceResult] = await Promise.all([
    supabase.from("users").select("*").eq("id", cUser.id).single(),
    supabase.from("learning_space").select("*").eq("id", topicId),
  ]);

  const { data: user } = userResult;
  const { data: learningSpaces, error: spaceError } = spaceResult;

  if (!user) {
    redirect("/learn");
  }

  if (spaceError) {
    console.error("Error fetching learning space:", spaceError);
  }

  if (!learningSpaces || learningSpaces.length === 0) {
    notFound();
  }

  const learningSpace = learningSpaces[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <BackToLearnButton />

          <div className="flex items-center gap-4 mb-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {learningSpace.topic || "Untitled Topic"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Created {formatDate(learningSpace.created_at)}
                </p>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex flex-col items-end gap-2">
              <LanguageSelector 
                key={learningSpace.language} // Force re-render if language changes from external sync
                learningSpaceId={learningSpace.id}
                userId={user.id} 
                currentLanguage={learningSpace.language || 'English'}
              />
              {learningSpace.language && (
                <span className="text-xs font-bold text-primary/60 uppercase tracking-widest px-1">
                  Active: {learningSpace.language}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content (Wrapped in Realtime Client Component) */}
        <LearningSpaceContent learningSpace={learningSpace} user={user} />
      </div>
    </div>
  );
}

// internal helper functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSafeData(data: any, key: string, fallback: any = null) {
  return data && data[key] !== undefined ? data[key] : fallback;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "Recently";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Recently";
  }
}