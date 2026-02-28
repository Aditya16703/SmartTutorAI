"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Languages, Loader2 } from "lucide-react";
import { invokeAgentWorkflow, clearLearningSpaceContentAction, updateLearningSpaceAction } from "../actions/learning-space";
import { toast } from "sonner";

interface QuickLanguageSelectorProps {
  learningSpaceId: string;
  userId: string;
}

export default function QuickLanguageSelector({
  learningSpaceId,
  userId,
}: QuickLanguageSelectorProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    setIsRegenerating(true);
    
    toast.info(`Regenerating content in ${newLanguage}...`, {
      description: "Your learning space is being updated. This may take a minute.",
      duration: 5000,
    });

    try {
      // 1. Update the language selection in the database first
      await updateLearningSpaceAction(learningSpaceId, { language: newLanguage });
      
      // 2. Clear existing content first to avoid race conditions and stale data
      await clearLearningSpaceContentAction(learningSpaceId);
      
      // 3. Invoke the backend workflow to regenerate content in the new language
      const result = await invokeAgentWorkflow(learningSpaceId, userId, newLanguage);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Regeneration started", {
        description: `Your learning space is being updated to ${newLanguage}.`,
      });
    } catch (error) {
      console.error("Error regenerating content:", error);
      toast.error("Failed to start regeneration", {
        description: "Please try again later.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select onValueChange={handleLanguageChange} disabled={isRegenerating}>
        <SelectTrigger 
          className="p-2 h-auto w-auto rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border-none bg-transparent shadow-none"
          title="Change language"
        >
          {isRegenerating ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Languages className="w-4 h-4" />
          )}
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="English">English</SelectItem>
          <SelectItem value="Hindi">हिन्दी (Hindi)</SelectItem>
          <SelectItem value="Tamil">தமிழ் (Tamil)</SelectItem>
          <SelectItem value="Telugu">తెలుగు (Telugu)</SelectItem>
          <SelectItem value="Marathi">मराठी (Marathi)</SelectItem>
          <SelectItem value="Bengali">বাংলা (Bengali)</SelectItem>
          <SelectItem value="Kannada">ಕನ್ನಡ (Kannada)</SelectItem>
          <SelectItem value="Gujarati">ગુજરાતી (Gujarati)</SelectItem>
          <SelectItem value="Malayalam">മലയാളം (Malayalam)</SelectItem>
          <SelectItem value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
          <SelectItem value="Odia">ଓଡ଼ିଆ (Odia)</SelectItem>
          <SelectItem value="Assamese">অসমীয়া (Assamese)</SelectItem>
          <SelectItem value="Urdu">اردو (Urdu)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
