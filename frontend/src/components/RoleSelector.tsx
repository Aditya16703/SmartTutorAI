"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { GraduationCap, BookOpen, Loader2 } from "lucide-react";

interface RoleSelectorProps {
  onRoleSelect: (role: "teacher" | "student") => void;
  userFirstName: string;
}

export default function RoleSelector({
  onRoleSelect,
  userFirstName,
}: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<
    "teacher" | "student" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = async (role: "teacher" | "student") => {
    setSelectedRole(role);
    setIsLoading(true);

    try {
      await onRoleSelect(role);
    } catch (error) {
      console.error("Error selecting role:", error);
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-12 pb-24 px-4 font-sans">
      <div className="max-w-4xl w-full mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
              <BookOpen className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">
              Welcome, {userFirstName}! 👋
            </h1>
            <p className="text-xl text-muted-foreground font-bold max-w-lg mx-auto leading-relaxed">
              To personalize your experience, please tell us how you&apos;ll be using the platform.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-12">
          {/* Teacher Card */}
          <Card
            className={`group cursor-pointer transition-all duration-500 rounded-[2.5rem] p-4 border-4 overflow-hidden relative ${
              selectedRole === "teacher"
                ? "border-primary bg-primary/5 shadow-2xl"
                : "border-border bg-card hover:border-primary/30 hover:shadow-xl hover:-translate-y-2"
            }`}
            onClick={() => !isLoading && handleRoleSelect("teacher")}
          >
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                 <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black text-foreground mb-2">
                Teacher
              </CardTitle>
              <CardDescription className="text-muted-foreground font-bold text-base px-4">
                Empower your classroom with AI-generated lesson plans and student insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-8">
               {[
                 "Create AI Lesson Plans",
                 "Monitor Student Growth",
                 "Auto-Assessment Tools"
               ].map((feature, i) => (
                 <div key={i} className="flex items-center text-sm font-bold text-foreground/80 bg-primary/5 rounded-full px-4 py-2 border border-primary/10">
                   <div className="w-2 h-2 rounded-full bg-primary mr-3" />
                   {feature}
                 </div>
               ))}
            </CardContent>
          </Card>

          {/* Student Card */}
          <Card
            className={`group cursor-pointer transition-all duration-500 rounded-[2.5rem] p-4 border-4 overflow-hidden relative ${
              selectedRole === "student"
                ? "border-secondary bg-secondary/5 shadow-2xl"
                : "border-border bg-card hover:border-secondary/30 hover:shadow-xl hover:-translate-y-2"
            }`}
            onClick={() => !isLoading && handleRoleSelect("student")}
          >
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                 <BookOpen className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-3xl font-black text-foreground mb-2">
                Student
              </CardTitle>
              <CardDescription className="text-muted-foreground font-bold text-base px-4">
                Learn faster with personalized summaries, audio, and interactive quizzes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-8">
               {[
                 "Personalized Learning Path",
                 "AI-Powered Tutoring",
                 "Performance Inisghts"
               ].map((feature, i) => (
                 <div key={i} className="flex items-center text-sm font-bold text-foreground/80 bg-secondary/5 rounded-full px-4 py-2 border border-secondary/20">
                   <div className="w-2 h-2 rounded-full bg-secondary-foreground mr-3" />
                   {feature}
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

        {isLoading && (
          <div className="flex justify-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl text-primary-foreground font-black tracking-wide">
              <Loader2 className="w-6 h-6 animate-spin" />
              Setting up your workspace...
            </div>
          </div>
        )}

        <div className="text-center mt-16 text-muted-foreground font-bold text-sm bg-muted/30 py-4 px-8 rounded-full max-w-fit mx-auto border border-border">
          <p>
            You can always change your focus later in your settings.
          </p>
        </div>
      </div>
    </div>
  );
}
