"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StudentProfileDialog from "./StudentProfileDialog";
import { handleCreateProfileAction } from "../actions/student-profile";

interface StudentProfileData {
  grade_level: string;
  gender: string;
  language: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface StudentProfile {
  id: string;
  user_id: string;
  grade_level: string;
  gender: string;
  language: string;
}

interface StudentProfileHandlerProps {
  user: User;
  studentProfile: StudentProfile | null;
}

export default function StudentProfileHandler({
  user,
  studentProfile,
}: StudentProfileHandlerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(!studentProfile);
  const router = useRouter();

  const handleCreateProfile = async (profileData: StudentProfileData) => {
    try {
      const response = await handleCreateProfileAction({
        grade_level: profileData.grade_level,
        gender: profileData.gender,
        language: profileData.language,
        userId: user.id,
      });

      if (!response.error) {
        setIsDialogOpen(false);
        router.refresh();
      } else {
        throw new Error("Failed to create profile");
      }
    } catch (error) {
      console.error("Error creating student profile:", error);
      // Handle error (maybe show a toast notification)
    }
  };

  if (!studentProfile) {
    return (
      <StudentProfileDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateProfile={handleCreateProfile}
        userName={user.first_name || "Student"}
      />
    );
  }

  return null;
}
