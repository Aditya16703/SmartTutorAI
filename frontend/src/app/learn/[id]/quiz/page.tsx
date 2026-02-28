import React from "react";
import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import QuizSection from "./_components/quiz-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id: topicId } = await params;

  return {
    title: `Quiz - Learning Space ${topicId}`,
    description: `Take a quiz for your learning space`,
  };
}

export default async function QuizPage({ params }: PageProps) {
  const { id: topicId } = await params;

  // Get the current user
  const cUser = await currentUser();
  if (!cUser) {
    redirect("/");
  }

  const supabase = await createClient();

  // Get user from database
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", cUser?.id)
    .single();

  if (!user) {
    redirect("/learn");
  }

  // Fetch the specific learning space - UPDATE: select both quiz columns
  const { data: learningSpace } = await supabase
    .from("learning_space")
    .select("*")
    .eq("id", topicId)
    .single();

  if (!learningSpace) {
    notFound();
  }

  const quizData = learningSpace.quiz;

  // UPDATE: If no quiz data exists in either column
  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-6 h-6" />
                Quiz Not Available
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                <p className="text-amber-700 dark:text-amber-300">
                  No quiz has been generated for this learning space yet.
                </p>
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
                  Please go back to the learning space and generate a quiz first.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/learn">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Learning Spaces
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href={`/learn/${topicId}`}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Generate Quiz
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* UPDATE: Pass quizData instead of learningSpace.quiz */}
        <QuizSection quizData={quizData} />
      </div>
    </div>
  );
}