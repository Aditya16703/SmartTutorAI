"use server";

import { createClient } from "@/utils/supabase/server";

interface StudentProfileData {
  grade_level: string;
  gender: string;
  language: string;
  userId: string;
}

export const handleCreateProfileAction = async (
  profileData: StudentProfileData
) => {
  "use server";
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("student_profile")
      .insert([
        {
          grade_level: profileData.grade_level,
          gender: profileData.gender,
          language: profileData.language,
          user_id: profileData.userId,
        },
      ])
      .select();
    if (!error) {
      return { success: true };
    } else {
      console.error("Error creating student profile:", error);
      return { error: "Failed to create profile" };
    }
  } catch (error) {
    console.error("Error creating student profile:", error);
    // Handle error (maybe show a toast notification)
    return { error: "Internal server error" };
  }
};
