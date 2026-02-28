"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Settings, Save, Loader2, GraduationCap, Languages, Users, CircleCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type?: string;
}

interface StudentProfile {
  id: string;
  user_id: string;
  grade_level: string;
  language: string;
  gender: string;
}

interface ProfileFormProps {
  user: UserData | null;
  studentProfile: StudentProfile | null;
}

export default function ProfileForm({
  user,
  studentProfile,
}: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    grade_level: studentProfile?.grade_level || "",
    language: studentProfile?.language || "english",
    gender: studentProfile?.gender || "",
  });

  // Track the original language to detect changes
  const originalLanguage = studentProfile?.language || "english";

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("User not found", {
        description: "Please log in again to update your profile.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        grade_level: formData.grade_level,
        language: formData.language,
        gender: formData.gender,
      };

      console.log("Updating profile with:", profileData);

      let response;
      if (studentProfile) {
        // Update existing profile
        response = await supabase
          .from("student_profile")
          .update(profileData)
          .eq("user_id", user.id)
          .select();
      } else {
        // Insert new profile
        response = await supabase
          .from("student_profile")
          .insert({
            ...profileData,
            user_id: user.id,
          })
          .select();
      }

      if (response.error) {
        console.error("Supabase error:", response.error);
        toast.error("Update failed", {
          description: response.error.message,
        });
      } else {
        // Log if language changed, but we no longer auto-regenerate to save API quota
        const languageChanged = formData.language !== originalLanguage;
        if (languageChanged) {
          console.log(`Language changed from ${originalLanguage} to ${formData.language}. Auto-regeneration skipped to save quota.`);
        }

        toast.success("Profile updated", {
          description: languageChanged 
            ? `Your preferences were saved. New content will be generated in ${formData.language}.`
            : "Your changes have been saved successfully.",
          icon: <CircleCheck className="w-5 h-5 text-green-500" />,
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add loading state for user at the beginning of component
  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto glass-panel border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 animate-spin text-primary" />
            Loading settings...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
        <Card className="max-w-3xl mx-auto glass-panel border-0 shadow-2xl overflow-hidden group">
        <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary/50" />
        
        <CardHeader className="pb-10 border-b border-border/10 px-8 pt-10">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              Learning Preferences
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground font-medium">
              Fine-tune how AI generates your educational content
            </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-10">
             {/* Editable Profile Fields */}
             <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Language */}
                    <div className="space-y-3">
                        <Label htmlFor="language" className="text-sm font-bold flex items-center gap-2 text-foreground/80 tracking-wider">
                            <Languages className="w-4 h-4 text-primary" /> PREFERRED LANGUAGE
                        </Label>
                        <div className="relative group/select">
                          <select
                              id="language"
                              value={formData.language}
                              onChange={(e) => handleValueChange("language", e.target.value)}
                              disabled={isLoading}
                              className="appearance-none flex h-12 w-full rounded-2xl border border-border/40 bg-muted/30 dark:bg-muted/10 px-4 py-2 text-base font-medium ring-offset-background hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                              <option value="english">English</option>
                              <option value="hindi">हिन्दी (Hindi)</option>
                              <option value="tamil">தமிழ் (Tamil)</option>
                              <option value="telugu">తెలుగు (Telugu)</option>
                              <option value="marathi">मराठी (Marathi)</option>
                              <option value="bengali">বাংলা (Bengali)</option>
                              <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                              <option value="gujarati">ગુજરાતી (Gujarati)</option>
                              <option value="malayalam">മലയാളം (Malayalam)</option>
                              <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                              <option value="odia">ଓଡ଼ିଆ (Odia)</option>
                              <option value="assamese">অসমীয়া (Assamese)</option>
                              <option value="urdu">اردو (Urdu)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/select:text-primary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium px-1">
                          AI will generate summaries and audio in this language.
                        </p>
                    </div>

                    {/* Grade Level */}
                    <div className="space-y-3">
                        <Label htmlFor="gradeLevel" className="text-sm font-bold flex items-center gap-2 text-foreground/80 tracking-wider">
                            <GraduationCap className="w-4 h-4 text-secondary" /> ACADEMIC LEVEL
                        </Label>
                        <div className="relative group/select">
                          <select
                              id="gradeLevel"
                              value={formData.grade_level}
                              onChange={(e) => handleValueChange("grade_level", e.target.value)}
                              disabled={isLoading}
                              className="appearance-none flex h-12 w-full rounded-2xl border border-border/40 bg-muted/30 dark:bg-muted/10 px-4 py-2 text-base font-medium ring-offset-background hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                                  <option value="">Select Level</option>
                                  <option value="Elementary (K-5)">Elementary (K-5)</option>
                                  <option value="Middle School (6-8)">Middle School (6-8)</option>
                                  <option value="High School (9-12)">High School (9-12)</option>
                                  <option value="College/University">College/University</option>
                                  <option value="Graduate School">Graduate School</option>
                                  <option value="Professional">Professional</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/select:text-secondary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-3">
                        <Label htmlFor="gender" className="text-sm font-bold flex items-center gap-2 text-foreground/80 tracking-wider">
                            <Users className="w-4 h-4 text-blue-500" /> GENDER
                        </Label>
                        <div className="relative group/select">
                          <select
                              id="gender"
                              value={formData.gender}
                              onChange={(e) => handleValueChange("gender", e.target.value)}
                              disabled={isLoading}
                              className="appearance-none flex h-12 w-full rounded-2xl border border-border/40 bg-muted/30 dark:bg-muted/10 px-4 py-2 text-base font-medium ring-offset-background hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                                  <option value="">Select Gender</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="others">Others</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/select:text-blue-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                    </div>
                </div>
             </div>

             <AnimatePresence mode="wait">
              <Button 
                  key={isLoading ? "loading" : "idle"}
                  type="submit" 
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform active:scale-[0.98]" 
                  disabled={isLoading}
              >
                  {isLoading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Saving Preferences...
                  </motion.div>
                  ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                      <Save className="h-6 w-6" />
                      Save Changes
                  </motion.div>
                  )}
              </Button>
             </AnimatePresence>
            </form>
        </CardContent>
        </Card>
    </motion.div>
  );
}