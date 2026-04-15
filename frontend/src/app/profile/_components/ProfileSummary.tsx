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
  if (!user) {
    return (
      <Card className="bg-card border-border shadow-md">
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
      <Card className="bg-card border-border shadow-xl overflow-hidden group relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-100" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="w-6 h-6 text-primary" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* User Info */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-muted/20 border border-border transition-all hover:border-primary/20">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-primary/20 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-24 h-24 bg-background rounded-full flex items-center justify-center border-4 border-background overflow-hidden shadow-inner">
                <span className="text-primary text-3xl font-black">
                  {userInitials}
                </span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-foreground mb-1">
                {user?.first_name || 'User'} {user?.last_name || ''}
              </h2>
              <p className="text-muted-foreground font-bold">{user?.email || 'No email'}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                  Student
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-xs font-black uppercase tracking-widest border border-secondary/30">
                  Active Member
                </span>
              </div>
            </div>
          </div>

          {studentProfile ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Grade Level */}
              <div className="group relative px-6 py-8 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-black text-foreground uppercase tracking-wider text-sm">Grade Level</h3>
                </div>
                <p className="text-2xl font-black text-primary ml-1">
                  {studentProfile.grade_level || "Not specified"}
                </p>
              </div>

              {/* Language */}
              <div className="group relative px-6 py-8 rounded-2xl bg-secondary/5 border border-secondary/20 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <h3 className="font-black text-foreground uppercase tracking-wider text-sm">Primary Language</h3>
                </div>
                <p className="text-2xl font-black text-secondary-foreground ml-1 capitalize">
                  {studentProfile.language || "English"}
                </p>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <span className="text-white text-2xl font-black">!</span>
                </div>
                <div>
                  <h3 className="font-black text-primary text-xl mb-2">
                    Profile Incomplete
                  </h3>
                  <p className="text-muted-foreground font-bold leading-relaxed">
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