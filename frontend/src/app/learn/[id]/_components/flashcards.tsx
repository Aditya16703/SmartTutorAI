"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Layers,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { generateFlashcardsAction, updateLearningSpaceAction } from "../../actions/learning-space";
import { toast } from "sonner";
import GenerationTimer from "./generation-timer";
import { Skeleton } from "@/components/ui/skeleton";

interface SRSData {
  efactor: number;
  interval: number;
  repetition: number;
  nextReviewDate: string;
}

interface Flashcard {
  front: string;
  back: string;
  question?: string; // New protocol
  answer?: string;   // New protocol
  srs?: SRSData;
}

// SM-2 Algorithm helper
function calculateSM2(quality: number, repetition: number, efactor: number, interval: number) {
  let newRepetition = repetition;
  let newInterval = interval;
  let newEfactor = efactor;

  if (quality >= 3) {
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * efactor);
    }
    newRepetition += 1;
  } else {
    newRepetition = 0;
    newInterval = 1;
  }

  newEfactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEfactor < 1.3) newEfactor = 1.3;

  return { repetition: newRepetition, efactor: newEfactor, interval: newInterval };
}

const initSRS = (card: any): Flashcard => {
  // Protocol Adapter: Map question/answer to front/back if needed
  const normalizedCard = {
    front: card.question || card.front || "",
    back: card.answer || card.back || "",
    srs: card.srs || { efactor: 2.5, interval: 0, repetition: 0, nextReviewDate: new Date().toISOString() }
  };
  return normalizedCard;
};

export default function Flashcards({
  learningSpaceId,
  userId,
  initialFlashcards,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialFlashcards: any | null;
  language?: string;
}) {
  const [cards, setCards] = useState<Flashcard[]>(() => {
    const rawData = initialFlashcards?.data || initialFlashcards?.flashcards || [];
    return rawData.map(initSRS);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyAll, setStudyAll] = useState(false);

  useEffect(() => {
    const rawData = initialFlashcards?.data || initialFlashcards?.flashcards;
    if (rawData) {
      setCards(rawData.map(initSRS));
    }
  }, [initialFlashcards]);

  const now = new Date();
  const displayCards = studyAll ? cards : cards.filter(c => !c.srs || new Date(c.srs.nextReviewDate) <= now);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await generateFlashcardsAction(learningSpaceId, userId, language);
      if (res.error) {
        toast.error("Generation Failed", { description: res.error });
        setIsGenerating(false);
      } else if (res.success) {
        const rawData = res.flashcards?.data || res.flashcards?.flashcards || [];
        const newCards = rawData.map(initSRS);
        setCards(newCards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setStudyAll(false);
        toast.success("Flashcards ready!");
        setIsGenerating(false);
      }
    } catch {
      toast.error("Generation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < displayCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleSRSAction = async (quality: number) => {
    if (!displayCards[currentIndex]) return;
    const cardIndexInAll = cards.findIndex(c => c.front === displayCards[currentIndex].front);
    if (cardIndexInAll === -1) return;

    const card = cards[cardIndexInAll];
    const currentSrs = card.srs!;
    
    const { repetition, efactor, interval } = calculateSM2(
      quality, currentSrs.repetition, currentSrs.efactor, currentSrs.interval
    );
    
    const nextReview = new Date();
    if (interval > 0) {
      nextReview.setDate(nextReview.getDate() + interval);
    }

    const updatedCard = {
      ...card,
      srs: { efactor, interval, repetition, nextReviewDate: nextReview.toISOString() }
    };

    const newCards = [...cards];
    newCards[cardIndexInAll] = updatedCard;

    // Optimistic Update
    setCards(newCards);
    setIsFlipped(false);
    
    // Automatically manage index bounds when deck size shrinks
    if (currentIndex >= displayCards.length - 1) {
      setCurrentIndex(Math.max(0, displayCards.length - 2)); 
    }

    // Sync to backend silently
    updateLearningSpaceAction(learningSpaceId, { flashcards: { flashcards: newCards } })
      .catch(() => console.error("SRS Background sync failed"));
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden min-h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-foreground">Interactive Flashcards</span>
          </div>
          {cards.length > 0 && !isGenerating && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStudyAll(!studyAll)}
                className={`text-sm ${studyAll ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
              >
                {studyAll ? "Study Due" : "Study All"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                className="text-primary hover:bg-primary/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center py-6 min-h-[300px]">
        {isGenerating ? (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2 mb-6">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <h3 className="text-lg font-medium text-foreground">Creating Study Deck...</h3>
              <GenerationTimer onStatusChange={() => {}} />
            </div>
            
            <div className="relative h-64 w-full">
              <Skeleton className="absolute inset-0 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-8 w-2/3" />
                <div className="mt-auto flex gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Skeleton>
            </div>
          </div>
        ) : displayCards.length > 0 ? (
          <div className="w-full max-w-md space-y-8">
            {/* Flashcard Component */}
            <div 
              className="relative h-64 w-full cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div 
                   className="absolute inset-0 w-full h-full bg-card rounded-2xl border-2 border-border shadow-md p-8 flex flex-col items-center justify-center backface-hidden"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-4">Question</span>
                  <p className="text-xl font-semibold text-center text-foreground leading-relaxed">
                    {displayCards[currentIndex]?.front}
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-primary/60 text-xs italic">
                    <RotateCw className="w-3 h-3" /> Click to flip
                  </div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 w-full h-full bg-primary rounded-2xl border-2 border-primary shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/70 mb-4">Answer</span>
                  <p className="text-xl font-medium text-center text-primary-foreground leading-relaxed">
                    {displayCards[currentIndex]?.back}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
              {isFlipped ? (
                <div className="flex w-full items-center justify-between gap-3 px-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-red-200 hover:bg-red-50 text-red-600 font-medium h-12 rounded-xl"
                    onClick={() => handleSRSAction(1)}
                  >
                    Hard <span className="text-xs ml-1 opacity-60">(&lt;1d)</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-green-200 hover:bg-green-50 text-green-600 font-medium h-12 rounded-xl"
                    onClick={() => handleSRSAction(4)}
                  >
                    Good
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-600 font-medium h-12 rounded-xl"
                    onClick={() => handleSRSAction(5)}
                  >
                    Easy <span className="text-xs ml-1 opacity-60">(+4d)</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevCard}
                    disabled={currentIndex === 0}
                    className="rounded-full h-12 w-12 border-border hover:bg-muted"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>

                  <div className="text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full">
                    {currentIndex + 1} / {displayCards.length}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextCard}
                    disabled={currentIndex === displayCards.length - 1}
                    className="rounded-full h-12 w-12 border-border hover:bg-muted"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground italic h-4">
                {!isFlipped && "Tip: Click card to flip and reveal answer."}
              </p>
            </div>
          </div>
        ) : cards.length > 0 ? (
          <div className="text-center space-y-6 max-w-sm">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">You&apos;re All Caught Up!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You&apos;ve successfully reviewed all cards due for today. Excellent work!
              </p>
            </div>
            <Button
              onClick={() => setStudyAll(true)}
              variant="outline"
              className="w-full text-primary border-primary hover:bg-primary/5 shadow-sm h-12 text-lg font-bold"
            >
              Study Anyway
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-6 max-w-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-2 rotate-3">
              <Layers className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Ready for Active Recall?</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Turn your summary notes into interactive flashcards to test your memory and study faster.
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-12 text-lg font-bold"
            >
              <Sparkles className="w-5 h-5 mr-2 text-secondary" />
              Generate Flashcards
            </Button>
          </div>
        )}
      </CardContent>
      
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </Card>
  );
}
