"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Lightbulb, ExternalLink } from "lucide-react";
import React, { useState, useEffect } from "react";
import GenerationTimer from "./generation-timer";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateRecommendationsAction } from "../../actions/learning-space";
import { toast } from "sonner";

type Recommendation = {
  title: string;
  description: string;
  url: string | null;
};

export default function Recommendations({
  learningSpaceId,
  userId,
  recommendations,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendations?: any;
  language?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'normal' | 'long' | 'retry'>('normal');
  const [timerKey, setTimerKey] = useState(0);
  const [recommendationsList, setRecommendationsList] = useState<Recommendation[]>([]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationStatus('normal');
      setTimerKey(prev => prev + 1);
      const res = await generateRecommendationsAction(learningSpaceId, userId, language);
      if (res.error) {
        toast.error("Recommendations Generation Failed", { description: res.error });
        setIsGenerating(false);
      } else if (res.success) {
        toast.success("Recommendations generated successfully!");
        window.location.reload();
      }
    } catch {
      toast.error("Recommendations generation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseRecommendations = (data: any): Recommendation[] => {
      if (!data) return [];
      
      try {
        if (typeof data === 'string') {
          const parsed = JSON.parse(data);
          return parsed.recommendations || parsed || [];
        }
        if (data.recommendations && Array.isArray(data.recommendations)) {
          return data.recommendations;
        }
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      } catch {
        return [];
      }
    };

    const updatedRecommendations = parseRecommendations(recommendations);
    setRecommendationsList(updatedRecommendations);
  }, [recommendations]);

  const hasRecommendations = recommendationsList.length > 0;

  if (!hasRecommendations && !isGenerating) {
    return (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-foreground">Recommended Materials</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Learning Recommendations
          </h3>
          <p className="text-sm text-muted-foreground font-medium mb-5 max-w-md mx-auto">
            Get personalized book, article, and video recommendations based on your learning materials.
          </p>
          <Button
            onClick={handleGenerate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all font-bold"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Generate Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-foreground italic">Generating Recommendations...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Lightbulb className="w-6 h-6 text-primary animate-bounce" />
          </div>
          <p className="text-sm font-bold text-foreground mb-4">
            Please wait while we generate personalized learning resources for you.
          </p>
          <div className="flex flex-col items-center gap-4">
            <GenerationTimer 
              key={timerKey}
              onStatusChange={(s: 'normal' | 'long' | 'retry') => setGenerationStatus(s)} 
            />
            
            {generationStatus === 'retry' && (
              <Button 
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                className="bg-background border-border text-foreground hover:bg-muted shadow-sm font-bold"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry Generation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-foreground">Recommended Materials</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendationsList.map((rec, index) => (
          <div
            key={index}
            className="bg-primary/5 p-4 rounded-lg border border-primary/10 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="font-bold text-foreground">{rec.title}</h3>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                  {rec.description}
                </p>
              </div>
              {rec.url && rec.url !== "NULL" && rec.url !== "null" && (
                <a
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 hover:bg-primary/5 px-3 py-1.5 rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Read more
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}