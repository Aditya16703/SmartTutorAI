"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Layers,
  Sparkles,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface Flashcard {
  front: string;
  back: string;
  learningSpaceId: string;
  topic: string;
  srs?: {
    efactor: number;
    interval: number;
    repetition: number;
    nextReviewDate: string;
  };
}

// SM-2 Algorithm
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

export default function GlobalReviewClient({ initialCards }: { initialCards: Flashcard[] }) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const supabase = createClient();

  const handleSRSAction = async (quality: number) => {
    const currentCard = cards[currentIndex];
    const srs = currentCard.srs || { efactor: 2.5, interval: 0, repetition: 0, nextReviewDate: new Date().toISOString() };

    const { repetition, efactor, interval } = calculateSM2(
      quality, srs.repetition, srs.efactor, srs.interval
    );

    const nextReview = new Date();
    if (interval > 0) nextReview.setDate(nextReview.getDate() + interval);

    const updatedSrs = { efactor, interval, repetition, nextReviewDate: nextReview.toISOString() };

    // 1. Sync to Supabase (Individual Card Update)
    // To do this strictly, we fetch the current space's flashcards, find the card by 'front' text, update its srs, and save back the whole object.
    try {
        const { data: spaceData } = await supabase
            .from("learning_space")
            .select("flashcards")
            .eq("id", currentCard.learningSpaceId)
            .single();

        if (spaceData?.flashcards) {
            const list = (spaceData.flashcards as any).flashcards || [];
            const updatedList = list.map((c: any) => 
                c.front === currentCard.front ? { ...c, srs: updatedSrs } : c
            );

            await supabase
                .from("learning_space")
                .update({ flashcards: { flashcards: updatedList } })
                .eq("id", currentCard.learningSpaceId);
        }
    } catch (e) {
        console.error("Failed to sync global SRS:", e);
    }

    setReviewedCount(prev => prev + 1);
    
    // Move to next card
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setSessionFinished(true);
    }
  };

  if (sessionFinished) {
    return (
      <div className="text-center py-20 px-4">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md mx-auto"
        >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4">Daily Review Done!</h1>
            <p className="text-xl text-muted-foreground mb-8">
                You just mastered {reviewedCount} key concepts. Your brain is getting stronger!
            </p>
            <Button 
                onClick={() => window.location.href = "/learn"}
                size="lg"
                className="w-full h-14 text-lg font-bold rounded-2xl"
            >
                Back to Dashboard
            </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = "/learn"}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Exit
        </Button>
        <div className="text-sm font-bold bg-primary/10 text-primary px-4 py-1.5 rounded-full">
            Reviewing {currentIndex + 1} of {cards.length}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="mb-4 text-center">
            <span className="text-xs font-black uppercase tracking-widest text-secondary bg-secondary/10 px-3 py-1 rounded-md">
                Topic: {cards[currentIndex].topic}
            </span>
        </div>

        <div 
          className="relative h-80 w-full cursor-pointer perspective-1000"
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
            <div className="absolute inset-0 w-full h-full bg-card rounded-[2.5rem] border-2 border-border shadow-xl p-12 flex flex-col items-center justify-center backface-hidden">
                <p className="text-3xl font-bold text-center leading-tight">
                    {cards[currentIndex]?.front}
                </p>
                <div className="mt-auto flex items-center gap-2 text-primary/60 text-sm font-medium italic">
                    <RotateCw className="w-4 h-4" /> Click to reveal answer
                </div>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 w-full h-full bg-primary rounded-[2.5rem] border-2 border-primary shadow-2xl p-12 flex flex-col items-center justify-center backface-hidden"
              style={{ transform: "rotateY(180deg)" }}
            >
                <p className="text-2xl font-medium text-center text-primary-foreground leading-relaxed">
                    {cards[currentIndex]?.back}
                </p>
            </div>
          </motion.div>
        </div>

        <div className="mt-12">
            {isFlipped ? (
                <div className="grid grid-cols-3 gap-4">
                    <Button 
                        variant="outline" 
                        className="h-20 rounded-3xl border-red-200 hover:bg-red-50 text-red-600 flex flex-col gap-1"
                        onClick={() => handleSRSAction(1)}
                    >
                        <span className="text-lg font-black font-sans uppercase">Hard</span>
                        <span className="text-[10px] opacity-60">Try again today</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-20 rounded-3xl border-green-200 hover:bg-green-50 text-green-600 flex flex-col gap-1"
                        onClick={() => handleSRSAction(4)}
                    >
                        <span className="text-lg font-black font-sans uppercase">Good</span>
                        <span className="text-[10px] opacity-60">See in few days</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-20 rounded-3xl border-blue-200 hover:bg-blue-50 text-blue-600 flex flex-col gap-1"
                        onClick={() => handleSRSAction(5)}
                    >
                        <span className="text-lg font-black font-sans uppercase">Easy</span>
                        <span className="text-[10px] opacity-60">See much later</span>
                    </Button>
                </div>
            ) : (
                <div className="flex justify-center">
                    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                        <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
