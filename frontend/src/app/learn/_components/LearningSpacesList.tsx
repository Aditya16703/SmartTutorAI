"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
        className="text-center py-20 bg-background/50 backdrop-blur-sm rounded-3xl border border-dashed border-border"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          No Learning Spaces Yet
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Create your first learning space to start your personalized AI-powered learning journey.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="items-center sm:items-start">
            <div className="mx-auto sm:mx-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl">Delete Learning Space</DialogTitle>
            <DialogDescription className="text-base pt-1">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{deleteTarget?.topic}&rdquo;
              </span>
              ? All generated content, notes, quizzes, and mind maps will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-lg">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learning Spaces Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                className={`glass-card cursor-pointer group hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${
                  deletingId === space.id ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Graduate Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            {formatDate(space.created_at)}
                        </div>
                        {space.language && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            <Globe className="w-3 h-3" />
                            {LANGUAGE_DISPLAY[space.language.toLowerCase()] || space.language}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {space.topic}
                      </CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4 py-1 px-2 rounded-full bg-background/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                       {/* Language Switcher */}
                       <QuickLanguageSelector 
                          learningSpaceId={space.id} 
                          userId={space.user_id} 
                       />

                       {/* Delete Action */}
                      <button
                        onClick={(e) => handleDeleteClick(e, space)}
                        disabled={deletingId === space.id}
                        className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete space"
                      >
                        {deletingId === space.id ? (
                          <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                         <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {space.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {space.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                          Continue Learning <ChevronRight className="w-4 h-4" />
                      </span>
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
