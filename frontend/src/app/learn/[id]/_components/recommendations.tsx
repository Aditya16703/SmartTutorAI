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
  recommendations?: any;
  language?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
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
    } catch (err) {
      toast.error("Recommendations generation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Parse the initial recommendations data
    const parseRecommendations = (data: any): Recommendation[] => {
      if (!data) return [];
      
      try {
        // If it's a string, parse it as JSON
        if (typeof data === 'string') {
          const parsed = JSON.parse(data);
          return parsed.recommendations || parsed || [];
        }
        // If it's already an object with recommendations array
        if (data.recommendations && Array.isArray(data.recommendations)) {
          return data.recommendations;
        }
        // If it's already an array
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      } catch {
        // If parsing fails, return empty array
        return [];
      }
    };

    // Set state whenever recommendations prop changes
    const updatedRecommendations = parseRecommendations(recommendations);
    setRecommendationsList(updatedRecommendations);
  }, [recommendations]);

  const hasRecommendations = recommendationsList.length > 0;

  if (!hasRecommendations && !isGenerating) {
    // Show generate button
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-yellow-200 dark:border-amber-900 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 dark:text-amber-100">Recommended Materials</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-7 h-7 text-yellow-500 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-amber-100 mb-2">
            Learning Recommendations
          </h3>
          <p className="text-sm text-gray-600 dark:text-yellow-200/80 mb-5 max-w-md mx-auto">
            Get personalized book, article, and video recommendations based on your learning materials.
          </p>
          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg border-0"
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
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-yellow-200 dark:border-amber-900 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 dark:text-amber-100 italic">Generating Recommendations...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Lightbulb className="w-6 h-6 text-yellow-500 dark:text-amber-400 animate-bounce" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-yellow-200/90 mb-4">
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
                className="bg-white dark:bg-yellow-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/40 shadow-sm"
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
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-900 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 dark:text-yellow-100">Recommended Materials</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendationsList.map((rec, index) => (
          <div
            key={index}
            className="bg-white dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-sm transition-all duration-200"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-yellow-100">{rec.title}</h3>
                <p className="text-sm text-gray-600 dark:text-yellow-200/80 line-clamp-2">
                  {rec.description}
                </p>
              </div>
              {rec.url && rec.url !== "NULL" && rec.url !== "null" && (
                <a
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 px-3 py-1.5 rounded-md transition-colors"
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