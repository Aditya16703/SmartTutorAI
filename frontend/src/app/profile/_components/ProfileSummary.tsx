"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, BookOpen, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

interface User {
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
}

interface ProfileSummaryProps {
  user: User | null;
  studentProfile: StudentProfile | null;
}

export default function ProfileSummary({
  user,
  studentProfile,
}: ProfileSummaryProps) {
  // Add loading state for user
  if (!user) {
    return (
      <Card className="glass-panel border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const userInitials = (user?.first_name?.[0] || 'U') + (user?.last_name?.[0] || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="glass-panel border-0 shadow-xl overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary via-secondary to-primary/50 opacity-100" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="w-6 h-6 text-primary" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* User Info */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-muted/30 dark:bg-muted/10 border border-border/20 transition-all hover:border-primary/20">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-24 h-24 bg-background rounded-full flex items-center justify-center border-4 border-background overflow-hidden">
                <span className="text-primary text-3xl font-black">
                  {userInitials}
                </span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {user?.first_name || 'User'} {user?.last_name || ''}
              </h2>
              <p className="text-muted-foreground font-medium">{user?.email || 'No email'}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                  Student
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider border border-secondary/20">
                  Active Member
                </span>
              </div>
            </div>
          </div>

          {studentProfile ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Grade Level */}
              <div className="group relative px-5 py-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/30 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">Grade Level</h3>
                </div>
                <p className="text-lg font-medium text-blue-700 dark:text-blue-300 ml-1">
                  {studentProfile.grade_level || "Not specified"}
                </p>
              </div>

              {/* Language */}
              <div className="group relative px-5 py-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-800/30 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Primary Language</h3>
                </div>
                <p className="text-lg font-medium text-emerald-700 dark:text-emerald-300 ml-1 capitalize">
                  {studentProfile.language || "English"}
                </p>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-orange-500/10 dark:bg-orange-500/5 border border-orange-200/50 dark:border-orange-500/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <span className="text-white text-xl font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 dark:text-orange-400 text-lg mb-1">
                    Profile Incomplete
                  </h3>
                  <p className="text-orange-700/80 dark:text-orange-400/60 font-medium">
                    Please complete your student profile details below to unlock personalized AI tutoring in your regional language.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}