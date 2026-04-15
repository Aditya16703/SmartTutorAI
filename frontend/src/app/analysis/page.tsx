import React from "react";
import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProgressDashboard from "../learn/_components/ProgressDashboard";

export const metadata = {
  title: "Performance Analysis | SmartTutorAI",
  description: "Detailed analysis of your learning progress, quiz scores, and mastery streaks.",
};

function calculateStreak(attempts: { completed_at: string }[]): number {
  if (!attempts || attempts.length === 0) return 0;
  const days = new Set(attempts.map((a) => new Date(a.completed_at).toLocaleDateString("en-CA")));
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

export default async function AnalysisPage() {
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  let cUser = await currentUser();

  if (!cUser && isTestMode) {
    cUser = { id: "user_test_e2e_001" } as any;
  }
  if (!cUser) redirect("/");

  const supabase = await createClient();
  const { data: studentProfile } = await supabase
    .from("student_profile")
    .select("*")
    .eq("user_id", cUser.id)
    .single();

  const { data: learningSpaces } = await supabase
    .from("learning_space")
    .select("*")
    .eq("user_id", cUser.id);

  const { data: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", cUser.id)
    .order("completed_at", { ascending: false });

  if (!studentProfile) redirect("/profile");

  const spaces = learningSpaces || [];
  const topicsStudied = spaces.filter((s) => s.summary_notes != null).length;
  const now = new Date();
  let totalDueFlashcards = 0;
  spaces.forEach(space => {
    const flashcardData = space.flashcards as any;
    if (flashcardData?.flashcards) {
      totalDueFlashcards += flashcardData.flashcards.filter((c: any) => 
        !c.srs || new Date(c.srs.nextReviewDate) <= now
      ).length;
    }
  });

  const completedAttempts = quizAttempts || [];
  const averageScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0), 0) / completedAttempts.length
    : null;

  const currentStreak = calculateStreak(completedAttempts as any);

  const stats = {
    topicsStudied,
    averageScore,
    currentStreak,
    totalDueFlashcards,
    xp: studentProfile?.xp || 0,
    lastActive: completedAttempts.length > 0 ? completedAttempts[0].completed_at : null,
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Performance Analysis</h1>
            <p className="text-muted-foreground">Deep dive into your learning journey and academic excellence.</p>
          </div>
          
          <ProgressDashboard stats={stats} />
          
          {/* Detailed Analysis Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Mastery History</h3>
              <div className="space-y-4">
                {quizAttempts?.slice(0, 5).map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div>
                      <div className="font-medium text-sm">Quiz Milestone</div>
                      <div className="text-xs text-muted-foreground">{new Date(attempt.completed_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {Math.round((attempt.score / (attempt.total_questions || 1)) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Learning Consistency</h3>
              <div className="flex flex-col justify-center items-center h-48 bg-muted/20 rounded-lg border border-dashed border-border">
                <div className="text-4xl mb-4">🔥</div>
                <div className="text-2xl font-bold">{currentStreak} Day Streak</div>
                <div className="text-sm text-muted-foreground">Keep it going to unlock adaptive rewards!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
