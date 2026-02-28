"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StudentProfileData {
  grade_level: string;
  gender: string;
  language: string;
}

interface StudentProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: (profileData: StudentProfileData) => void;
  userName: string;
}

export default function StudentProfileDialog({
  isOpen,
  onClose,
  onCreateProfile,
  userName,
}: StudentProfileDialogProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const grades = [
    {
      value: "Elementary (K-5)",
      label: "Elementary (K-5)",
      description: "Ages 5-11",
    },
    {
      value: "Middle School (6-8)",
      label: "Middle School (6-8)",
      description: "Ages 11-14",
    },
    {
      value: "High School (9-12)",
      label: "High School (9-12)",
      description: "Ages 14-18",
    },
    {
      value: "College/University",
      label: "College/University",
      description: "Ages 18+",
    },
    {
      value: "adult",
      label: "Adult Learning",
      description: "Professional development",
    },
  ];

  const genders = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" },
    { value: "prefer-not-to-say", label: "Prefer not to say" },
  ];

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "हिन्दी (Hindi)" },
    { value: "tamil", label: "தமிழ் (Tamil)" },
    { value: "telugu", label: "తెలుగు (Telugu)" },
    { value: "marathi", label: "मराठी (Marathi)" },
    { value: "bengali", label: "বাংলা (Bengali)" },
    { value: "kannada", label: "ಕನ್ನಡ (Kannada)" },
    { value: "gujarati", label: "ગુજરાતી (Gujarati)" },
    { value: "malayalam", label: "മലയാളം (Malayalam)" },
    { value: "punjabi", label: "ਪੰਜਾਬੀ (Punjabi)" },
    { value: "odia", label: "ଓଡ଼ିଆ (Odia)" },
    { value: "assamese", label: "অসমীয়া (Assamese)" },
    { value: "urdu", label: "اردو (Urdu)" },
  ];

  const handleCreateProfile = async () => {
    if (!selectedGrade || !selectedGender || !selectedLanguage) {
      return;
    }

    setIsLoading(true);
    try {
      await onCreateProfile({
        grade_level: selectedGrade,
        gender: selectedGender,
        language: selectedLanguage,
      });
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to EduAI, {userName}! 🎓
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Let&apos;s create your learning profile to personalize your
            educational journey
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grade Level Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              What&apos;s your current grade level?
            </h3>
            <div className="grid gap-3">
              {grades.map((grade) => (
                <Card
                  key={grade.value}
                  className={`cursor-pointer transition-all ${
                    selectedGrade === grade.value
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedGrade(grade.value)}
                >
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {grade.label}
                        </CardTitle>
                        <CardDescription>{grade.description}</CardDescription>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedGrade === grade.value
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Gender Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">What is your gender?</h3>
            <div className="grid grid-cols-2 gap-2">
              {genders.map((gender) => (
                <Button
                  key={gender.value}
                  variant={
                    selectedGender === gender.value ? "default" : "outline"
                  }
                  className="justify-start"
                  onClick={() => setSelectedGender(gender.value)}
                >
                  {gender.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              What is your preferred language for learning?
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((language) => (
                <Button
                  key={language.value}
                  variant={
                    selectedLanguage === language.value ? "default" : "outline"
                  }
                  className="justify-start"
                  onClick={() => setSelectedLanguage(language.value)}
                >
                  {language.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={handleCreateProfile}
            disabled={
              !selectedGrade ||
              !selectedGender ||
              !selectedLanguage ||
              isLoading
            }
            className="w-full"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Your Profile...
              </>
            ) : (
              "Create My Learning Profile"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
