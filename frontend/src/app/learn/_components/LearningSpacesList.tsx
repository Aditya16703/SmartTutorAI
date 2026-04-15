"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, BookOpen, Clock, ChevronRight, AlertTriangle, Globe } from "lucide-react";
import QuickLanguageSelector from "./QuickLanguageSelector";

interface LearningSpace {
  id: string;
  topic: string;
  description?: string;
  created_at: string;
  user_id: string;
  language?: string;
}

const LANGUAGE_DISPLAY: Record<string, string> = {
  english: "English",
  hindi: "हिन्दी",
  tamil: "தமிழ்",
  telugu: "తెలుగు",
  marathi: "मराठी",
  bengali: "বাংলা",
  kannada: "ಕನ್ನಡ",
  gujarati: "ગુજરાતી",
  malayalam: "മലയാളം",
  punjabi: "ਪੰਜਾਬੀ",
  odia: "ଓଡ଼ିଆ",
  assamese: "অসমীয়া",
  urdu: "اردو"
};

interface LearningSpacesListProps {
  spaces: LearningSpace[];
  onSpaceClick: (spaceId: string) => void;
  onDeleteSpace: (spaceId: string) => Promise<void>;
}

export default function LearningSpacesList({
  spaces,
  onSpaceClick,
  onDeleteSpace,
}: LearningSpacesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LearningSpace | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleDeleteClick = (e: React.MouseEvent, space: LearningSpace) => {
    e.stopPropagation();
    setDeleteTarget(space);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const spaceId = deleteTarget.id;
    setDeleteTarget(null);
    setDeletingId(spaceId);
    try {
      await onDeleteSpace(spaceId);
    } finally {
      setDeletingId(null);
    }
  };

  if (spaces.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 bg-background rounded-3xl border-2 border-dashed border-border"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-black text-foreground mb-2 whitespace-pre-wrap">
          No Learning Spaces Yet
        </h3>
        <p className="text-muted-foreground font-bold mb-8 max-w-md mx-auto">
          Create your first learning space to start your personalized AI-powered learning journey.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl" showCloseButton={false}>
          <DialogHeader className="items-center sm:items-start">
            <div className="mx-auto sm:mx-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">Delete Learning Space</DialogTitle>
            <DialogDescription className="text-base pt-1 font-bold text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-black text-foreground">
                &ldquo;{deleteTarget?.topic}&rdquo;
              </span>
              ? All generated content, notes, and quizzes will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl font-bold border-border">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm font-bold"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learning Spaces Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {spaces.map((space, index) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <Card
                onClick={() => onSpaceClick(space.id)}
                className={`bg-card border-border border-2 cursor-pointer group hover:border-primary/50 transition-all duration-500 rounded-[2rem] hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden ${
                  deletingId === space.id ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="pb-4 relative z-10 pt-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-xs font-black tracking-widest uppercase border border-secondary/30">
                            <Clock className="w-3 h-3" />
                            {formatDate(space.created_at)}
                        </div>
                        {space.language && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest uppercase border border-primary/20">
                            <Globe className="w-3 h-3" />
                            {LANGUAGE_DISPLAY[space.language.toLowerCase()] || space.language}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-2xl font-black line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
                        {space.topic}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pb-8">
                  {space.description && (
                    <p className="text-muted-foreground font-bold line-clamp-2 leading-relaxed">
                      {space.description}
                    </p>
                  )}

                  <div className="pt-4 flex items-center justify-between border-t border-border/50">
                      <span className="text-sm font-black text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 uppercase tracking-widest">
                          Continue Learning <ChevronRight className="w-4 h-4" />
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                         <QuickLanguageSelector 
                            learningSpaceId={space.id} 
                            userId={space.user_id} 
                         />
                        </div>
                        <button
                          onClick={(e) => handleDeleteClick(e, space)}
                          disabled={deletingId === space.id}
                          className="p-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-destructive/20"
                          title="Delete space"
                        >
                          {deletingId === space.id ? (
                            <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
