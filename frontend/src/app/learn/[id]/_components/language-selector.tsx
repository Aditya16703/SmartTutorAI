"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { updateLearningSpaceAction, clearLearningSpaceContentAction, invokeAgentWorkflow } from "../../actions/learning-space";

interface LanguageSelectorProps {
  learningSpaceId: string;
  userId: string;
  currentLanguage?: string;
}

export default function LanguageSelector({
  learningSpaceId,
  userId,
  currentLanguage = "English",
}: LanguageSelectorProps) {
  const [language, setLanguage] = useState(currentLanguage);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === language) return;

    setLanguage(newLanguage);
    setIsRegenerating(true);
    
    // Show immediate feedback
    toast.info(`Regenerating content in ${newLanguage}...`, {
      description: "This may take a minute. Existing content will be overwritten.",
      duration: 5000,
    });

    try {
      // First, clear existing content to avoid showing stale data in the wrong language
      await clearLearningSpaceContentAction(learningSpaceId);
      
      // Update the language selection in the database
      await updateLearningSpaceAction(learningSpaceId, { language: newLanguage });

      // Invoke the backend workflow to regenerate content in the new language
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
      // Revert language selection on error
      setLanguage(language); 
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Select
          value={language}
          onValueChange={handleLanguageChange}
          disabled={isRegenerating}
        >
          <SelectTrigger className="w-[140px] h-9 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
              <SelectValue placeholder="Language" />
            </div>
          </SelectTrigger>
          <SelectContent>
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
    </div>
  );
}
