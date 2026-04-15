import React from "react";
import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LearningSpacesManager from "./_components/LearningSpacesManager";
import ProgressDashboard from "./_components/ProgressDashboard";
import AdminDebugPanel from "./_components/AdminDebugPanel";

export const metadata = {
  title: "Learn | SmartTutorAI",
  description: "Learn with AI-powered personalized pedagogy",
};

/** Calculate study streak (consecutive days with quiz attempts, counting today) */
function calculateStreak(attempts: { completed_at: string }[]): number {
  if (!attempts || attempts.length === 0) return 0;

  const days = new Set(
    attempts.map((a) =>
      new Date(a.completed_at).toLocaleDateString("en-CA") // YYYY-MM-DD
    )
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    if (days.has(key)) {
      streak++;
    } else {
      if (i === 0) continue; 
      break;
    }
  }
  return streak;
}

export default async function Page() {
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  let cUser = await currentUser();

  // E2E Mock Session
  if (!cUser && isTestMode) {
    cUser = { id: "user_test_e2e_001", firstName: "Test", lastName: "Admin", emailAddresses: [{ emailAddress: "test@smarttutor.ai" }] } as any;
  }

  if (!cUser) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", cUser.id)
    .single();

  if (!user && !isTestMode) {
    redirect("/profile");
  }

  // Use mock user data if missing in DB during Test Mode
  const effectiveUser = user || (isTestMode ? { id: cUser.id, first_name: "Test", last_name: "Admin" } : null);
  if (!effectiveUser) redirect("/profile");

  // Fetch student profile, learning spaces, and quiz attempts in parallel
  const [profileResult, spacesResult, attemptsResult] = await Promise.all([
    supabase
      .from("student_profile")
      .select("*")
      .eq("user_id", effectiveUser.id)
      .single(),
    supabase
      .from("learning_space")
      .select("*")
      .eq("user_id", effectiveUser.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("quiz_attempts")
      .select("score, total_questions, completed_at")
      .eq("user_id", effectiveUser.id)
      .order("completed_at", { ascending: false }),
  ]);

  const { data: studentProfile } = profileResult;
  const { data: learningSpaces } = spacesResult;
  const { data: quizAttempts } = attemptsResult;

  if (!studentProfile) {
    redirect("/profile");
  }

  // Compute progress stats
  const spaces = learningSpaces || [];
  const topicsStudied = spaces.filter((s) => s.summary_notes != null).length;

  // Global SRS: Count due flashcards across all spaces
  const now = new Date();
  let totalDueFlashcards = 0;
  spaces.forEach(space => {
    const flashcardData = space.flashcards as { flashcards?: { srs?: { nextReviewDate: string } }[] } | null;
    if (flashcardData?.flashcards) {
      const dueInSpace = flashcardData.flashcards.filter(c => 
        !c.srs || new Date(c.srs.nextReviewDate) <= now
      ).length;
      totalDueFlashcards += dueInSpace;
    }
  });

  const completedAttempts = quizAttempts || [];
  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce(
          (sum, a) =>
            sum + (a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0),
          0
        ) / completedAttempts.length
      : null;

  const currentStreak = calculateStreak(completedAttempts as { completed_at: string }[]);
  const lastActive =
    completedAttempts.length > 0 ? completedAttempts[0].completed_at : null;

  const progressStats = {
    topicsStudied,
    averageScore,
    currentStreak,
    lastActive,
    totalDueFlashcards,
    xp: studentProfile?.xp || 0,
  };

  return (
    <main className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Learning Spaces</h1>
          <p className="text-muted-foreground">Access your personalized study paths and AI-generated resources.</p>
        </div>
        
        <LearningSpacesManager
          userId={user.id}
          initialSpaces={learningSpaces || []}
          studentProfile={studentProfile}
        />
      </div>

      <AdminDebugPanel />
    </main>
  );
}