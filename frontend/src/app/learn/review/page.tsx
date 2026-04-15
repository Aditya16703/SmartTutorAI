import React from "react";
import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import GlobalReviewClient from "./_components/global-review-client";

export const metadata = {
  title: "Daily Review | SmartTutorAI",
  description: "Review all your due flashcards from all learning spaces in one place.",
};

export default async function GlobalReviewPage() {
  const cUser = await currentUser();
  if (!cUser) redirect("/");

  const supabase = await createClient();

  const { data: learningSpaces, error } = await supabase
    .from("learning_space")
    .select("id, topic, flashcards")
    .eq("user_id", cUser.id);

  if (error || !learningSpaces) {
    redirect("/learn");
  }

  // Aggregate all cards that have SRS data and are due
  const now = new Date();
  const allDueCards: any[] = [];

  learningSpaces.forEach(space => {
    const flashcardData = space.flashcards as { flashcards?: any[] } | null;
    if (flashcardData?.flashcards) {
      flashcardData.flashcards.forEach(card => {
        // Count as due if no SRS exists yet, or if nextReviewDate is now/past
        const isDue = !card.srs || new Date(card.srs.nextReviewDate) <= now;
        if (isDue) {
          allDueCards.push({
            ...card,
            learningSpaceId: space.id,
            topic: space.topic
          });
        }
      });
    }
  });

  if (allDueCards.length === 0) {
    redirect("/learn");
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <GlobalReviewClient initialCards={allDueCards} />
      </div>
    </main>
  );
}
