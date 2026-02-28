import React from "react";
import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LearningSpacesManager from "./_components/LearningSpacesManager";

export const metadata = {
  title: "Learn",
  description: "Learn with AI-powered personalized learning",
};

export default async function Page() {
  console.log("=== LEARN PAGE DEBUG ===");
  
  // get the current user
  const cUser = await currentUser();
  console.log("Clerk User ID:", cUser?.id);
  console.log("Clerk User Name:", cUser?.firstName, cUser?.lastName);

  if (!cUser) {
    console.log("❌ No Clerk user - redirecting to /");
    redirect("/");
  }

  const supabase = await createClient();

  // Try to get existing user, or create new one
  const { data: initialUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", cUser.id)
    .single();

  let user = initialUser;

  console.log("✅ User query result:", user);
  console.log("❌ User query error:", userError);

  // If user doesn't exist, create them
  if (!user) {
    console.log("🔄 Creating new user in database...");
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: cUser.id,
        first_name: cUser.firstName,
        last_name: cUser.lastName,
        email: cUser.emailAddresses[0]?.emailAddress,
        user_type: 'student'
      })
      .select()
      .single();
    
    console.log("✅ New user created:", newUser);
    console.log("❌ New user error:", createError);
    
    user = newUser;
  }

  if (!user) {
    console.log("❌ No user after creation attempt - redirecting to /profile");
    redirect("/profile");
  }

  // Fetch student profile and learning spaces in parallel
  const [profileResult, spacesResult] = await Promise.all([
    supabase
      .from("student_profile")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("learning_space")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const { data: studentProfile } = profileResult;
  const { data: learningSpaces } = spacesResult;

  // If no student profile exists, redirect to profile creation
  if (!studentProfile) {
    redirect("/profile");
  }

  return (
    <div>
      <LearningSpacesManager
        userId={user.id}
        initialSpaces={learningSpaces || []}
        studentProfile={studentProfile}
      />
    </div>
  );
}