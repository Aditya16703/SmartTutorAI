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
import { motion, AnimatePresence } from "framer-motion";
import { generateFlashcardsAction } from "../../actions/learning-space";
import { toast } from "sonner";
import GenerationTimer from "./generation-timer";

interface Flashcard {
  front: string;
  back: string;
}

export default function Flashcards({
  learningSpaceId,
  userId,
  initialFlashcards,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  initialFlashcards: any | null;
  language?: string;
}) {
  const [cards, setCards] = useState<Flashcard[]>(initialFlashcards?.flashcards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'normal' | 'long' | 'retry'>('normal');

  useEffect(() => {
    if (initialFlashcards?.flashcards) {
      setCards(initialFlashcards.flashcards);
    }
  }, [initialFlashcards]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationStatus('normal');
      const res = await generateFlashcardsAction(learningSpaceId, userId, language);
      if (res.error) {
        toast.error("Generation Failed", { description: res.error });
        setIsGenerating(false);
      } else if (res.success) {
        setCards(res.flashcards.flashcards);
        setCurrentIndex(0);
        setIsFlipped(false);
        toast.success("Flashcards ready!");
        setIsGenerating(false);
      }
    } catch (err) {
      toast.error("Generation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
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

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-900 shadow-sm overflow-hidden min-h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 dark:text-indigo-100">Interactive Flashcards</span>
          </div>
          {cards.length > 0 && !isGenerating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center py-6 min-h-[300px]">
        {isGenerating ? (
          <div className="text-center space-y-4 py-12">
            <div className="relative">
              <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-100">Creating Study Deck...</h3>
            <GenerationTimer 
               onStatusChange={(s) => setGenerationStatus(s)} 
            />
          </div>
        ) : cards.length > 0 ? (
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
                   className="absolute inset-0 w-full h-full bg-white dark:bg-indigo-900/40 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800 shadow-md p-8 flex flex-col items-center justify-center backface-hidden"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4">Question</span>
                  <p className="text-xl font-semibold text-center text-gray-800 dark:text-white leading-relaxed">
                    {cards[currentIndex].front}
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-indigo-500/60 text-xs italic">
                    <RotateCw className="w-3 h-3" /> Click to flip
                  </div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 w-full h-full bg-indigo-600 rounded-2xl border-2 border-indigo-500 shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-100/70 mb-4">Answer</span>
                  <p className="text-xl font-medium text-center text-white leading-relaxed">
                    {cards[currentIndex].back}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                  className="rounded-full h-12 w-12 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>

                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full">
                  {currentIndex + 1} / {cards.length}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextCard}
                  disabled={currentIndex === cards.length - 1}
                  className="rounded-full h-12 w-12 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-indigo-300 italic">
                Tip: Spacebar to flip, arrow keys to navigate.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 max-w-sm">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-2 rotate-3">
              <Layers className="w-10 h-10 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-indigo-100">Ready for Active Recall?</h3>
              <p className="text-sm text-gray-600 dark:text-indigo-300 mt-2">
                Turn your summary notes into interactive flashcards to test your memory and study faster.
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg h-12 text-lg font-medium"
            >
              <Sparkles className="w-5 h-5 mr-2" />
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
