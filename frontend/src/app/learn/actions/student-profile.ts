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
          xp: 0, // Initialize mastery XP
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
    return { error: "Internal server error" };
  }
};

export const handleUpdateXpAction = async (userId: string, amount: number) => {
  "use server";
  try {
    const supabase = await createClient();
    
    // Fetch current XP
    const { data: profile } = await supabase
      .from("student_profile")
      .select("xp")
      .eq("user_id", userId)
      .single();
    
    const currentXp = (profile as any)?.xp || 0;
    const newXp = currentXp + amount;

    const { error } = await supabase
      .from("student_profile")
      .update({ xp: newXp, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true, newXp };
  } catch (error) {
    console.error("Error updating XP:", error);
    return { error: "Failed to update mastery XP" };
  }
};

