"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";

interface ProfileAnimationsProps {
  children: React.ReactNode;
}

export default function ProfileAnimations({ children }: ProfileAnimationsProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1], 
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]" 
        />
      </div>

      <div className="max-w-4xl mx-auto pt-28 pb-16 px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4 border border-primary/20">
            <Settings className="w-4 h-4" />
            <span>Account Settings</span>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-3">
            Profile Settings
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Customize your learning journey and manage your personal preferences.
          </p>
        </motion.div>

        {children}
      </div>
    </div>
  );
}
