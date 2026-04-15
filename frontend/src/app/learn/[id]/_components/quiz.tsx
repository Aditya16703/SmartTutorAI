"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Trophy, ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateQuizAction } from "../../actions/learning-space";
import GenerationTimer from "./generation-timer";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Quiz({
  learningSpaceId,
  userId,
  quiz: initialQuiz,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quiz?: any;
  language?: string;
}) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch {
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
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-foreground">Knowledge Quiz</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-start gap-3 mb-3">
            <Trophy className="w-5 h-5 text-secondary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Test Your Knowledge
              </h4>
              <p className="text-sm text-muted-foreground">
                Challenge yourself with questions based on your learning materials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
            <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                <strong>Ready:</strong> {quizData.questions?.length || 0} questions generated
              </p>
              <p className="text-sm text-primary/80 mt-1">
                <strong>Topic:</strong> {quizData.title}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {isGenerating && generationStatus !== 'retry' ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ) : quizData ? (
              <Button
                onClick={handleTakeQuiz}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-bold"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Take Quiz Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerateQuiz}
                disabled={isGenerating && generationStatus !== 'retry'}
                className={`w-full text-primary-foreground font-bold border-0 ${
                  generationStatus === 'retry' 
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 animate-pulse" 
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isGenerating ? (
                  generationStatus === 'retry' ? (
                    "Retry Generation?"
                  ) : (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
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