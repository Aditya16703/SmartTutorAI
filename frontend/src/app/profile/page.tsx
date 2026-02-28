import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import React from "react";
import { redirect } from "next/navigation";
import ProfileSummary from "./_components/ProfileSummary";
import ProfileForm from "./_components/ProfileForm";
import ProfileAnimations from "./_components/ProfileAnimations";

export const metadata = {
  title: "Profile | EduAI",
  description: "Manage your student profile and learning preferences",
};

export default async function Page() {
  // get the current user
  const cUser = await currentUser();

  if (!cUser) {
    redirect("/");
  }

  // check if this user exists in the database
  const supabase = await createClient();

  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", cUser?.id)
    .single();

  if (!user) {
    // create a new user in the database
    const { data: newUser, error } = await supabase.from("users").insert({
      id: cUser?.id,
      email: cUser?.emailAddresses[0]?.emailAddress,
      first_name: cUser?.firstName,
      last_name: cUser?.lastName,
    }).select().single();
    
    console.log("created user", newUser, error);
    user = newUser;
  }

  const { data: studentProfile } = await supabase
    .from("student_profile")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  return (
    <ProfileAnimations>
      <div className="space-y-8">
        {/* Profile Summary */}
        <ProfileSummary user={user} studentProfile={studentProfile} />

        {/* Profile Form */}
        <ProfileForm user={user} studentProfile={studentProfile} />
      </div>
    </ProfileAnimations>
  );
}
