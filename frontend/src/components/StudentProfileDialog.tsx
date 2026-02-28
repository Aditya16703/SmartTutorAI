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
  subjects_of_interest: string[];
  learning_goals: string[];
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
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const grades = [
    {
      value: "elementary",
      label: "Elementary (K-5)",
      description: "Ages 5-11",
    },
    {
      value: "middle",
      label: "Middle School (6-8)",
      description: "Ages 11-14",
    },
    { value: "high", label: "High School (9-12)", description: "Ages 14-18" },
    { value: "college", label: "College/University", description: "Ages 18+" },
    {
      value: "adult",
      label: "Adult Learning",
      description: "Professional development",
    },
  ];

  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Art",
    "Music",
    "Physical Education",
    "Computer Science",
    "Foreign Languages",
    "Literature",
  ];

  const goals = [
    "Improve grades",
    "Prepare for exams",
    "Learn new skills",
    "Career advancement",
    "Personal interest",
    "College preparation",
    "Professional certification",
  ];

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleGoalToggle = (goal: string) => {
    setLearningGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleCreateProfile = async () => {
    if (
      !selectedGrade ||
      selectedSubjects.length === 0 ||
      learningGoals.length === 0
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await onCreateProfile({
        grade_level: selectedGrade,
        subjects_of_interest: selectedSubjects,
        learning_goals: learningGoals,
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

          {/* Subjects Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Which subjects are you interested in? (Select at least one)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((subject) => (
                <Button
                  key={subject}
                  variant={
                    selectedSubjects.includes(subject) ? "default" : "outline"
                  }
                  className="justify-start"
                  onClick={() => handleSubjectToggle(subject)}
                >
                  {subject}
                </Button>
              ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              What are your learning goals? (Select at least one)
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {goals.map((goal) => (
                <Button
                  key={goal}
                  variant={learningGoals.includes(goal) ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => handleGoalToggle(goal)}
                >
                  {goal}
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
              selectedSubjects.length === 0 ||
              learningGoals.length === 0 ||
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
