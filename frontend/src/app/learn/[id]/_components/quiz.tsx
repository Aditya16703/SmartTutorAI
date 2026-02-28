"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Trophy, ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateQuizAction } from "../../actions/learning-space";
import GenerationTimer from "./generation-timer";
import { toast } from "sonner";

export default function Quiz({
  learningSpaceId,
  userId,
  quiz: initialQuiz,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  quiz?: any;
  language?: string;
}) {
  const router = useRouter();
  const [quizData, setQuizData] = useState<any>(initialQuiz);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setQuizData(initialQuiz);
  }, [initialQuiz]);

  const [generationStatus, setGenerationStatus] = useState<'normal' | 'long' | 'retry'>('normal');
  const [timerKey, setTimerKey] = useState(0);

  const handleGenerateQuiz = async () => {
    try {
      setIsGenerating(true);
      setGenerationStatus('normal');
      setTimerKey(prev => prev + 1);
      const res = await generateQuizAction(learningSpaceId, userId, language);
      if (res.error) {
        toast.error("Quiz Generation Failed", { description: res.error });
        setIsGenerating(false);
      } else if (res.success) {
        toast.success("Quiz generated successfully!");
        window.location.reload();
      }
    } catch (err) {
      toast.error("Quiz generation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  const handleTakeQuiz = () => {
    if (!quizData) return;
    router.push(`/learn/${learningSpaceId}/quiz`);
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-900 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 dark:text-green-100">Knowledge Quiz</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3 mb-3">
            <Trophy className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-green-100 mb-1">
                Test Your Knowledge
              </h4>
              <p className="text-sm text-gray-600 dark:text-green-200/80">
                Challenge yourself with questions based on your learning materials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-green-300/70 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>~10 minutes</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>Multiple choice</span>
            </div>
          </div>

          {quizData && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Ready:</strong> {quizData.questions?.length || 0} questions generated
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                <strong>Topic:</strong> {quizData.title}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {quizData ? (
              <Button
                onClick={handleTakeQuiz}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-0"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Take Quiz Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerateQuiz}
                disabled={isGenerating && generationStatus !== 'retry'}
                className={`w-full text-white border-0 ${
                  generationStatus === 'retry' 
                    ? "bg-amber-600 hover:bg-amber-700 animate-pulse" 
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                }`}
              >
                {isGenerating ? (
                  generationStatus === 'retry' ? (
                    "Retry Generation?"
                  ) : (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating Quiz...
                    </>
                  )
                ) : (
                  "Generate Quiz"
                )}
              </Button>
            )}
            {isGenerating && (
              <GenerationTimer 
                key={timerKey}
                onStatusChange={(s: 'normal' | 'long' | 'retry') => setGenerationStatus(s)} 
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}