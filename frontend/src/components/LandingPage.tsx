"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  BadgeCheck,
  Map,
  Music,
  NotebookText,
  ArrowRight,
  Sparkles,
  Globe2,
  Zap,
  Users,
  BookOpen,
  GraduationCap,
  Languages,
  Heart,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const features = [
    {
      icon: <NotebookText className="w-7 h-7" />,
      title: "Smart Summary Notes",
      description:
        "AI generates concise, personalized summaries from any PDF or topic in your regional language.",
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      icon: <Music className="w-7 h-7" />,
      title: "Audio Overview",
      description:
        "Listen to your lessons in 13 Indian languages — perfect for learning on the go.",
      color: "orange",
      gradient: "from-orange-500 to-amber-500",
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
    },

    {
      icon: <BadgeCheck className="w-7 h-7" />,
      title: "Adaptive Quizzes",
      description:
        "Test your mastery with AI-powered quizzes and instant feedback in your language.",
      color: "green",
      gradient: "from-green-500 to-emerald-500",
      bg: "bg-green-500/10 dark:bg-green-500/20",
    },
  ];

  const stats = [
    {
      icon: <Languages className="w-6 h-6" />,
      value: "13+",
      label: "Indian Languages",
    },
    { icon: <Zap className="w-6 h-6" />, value: "AI", label: "Powered" },
    {
      icon: <Heart className="w-6 h-6" />,
      value: "Free",
      label: "For Everyone",
    },
    {
      icon: <Globe2 className="w-6 h-6" />,
      value: "Rural",
      label: "First Approach",
    },
  ];

  const languages = [
    "हिन्दी",
    "தமிழ்",
    "తెలుగు",
    "मराठी",
    "বাংলা",
    "ಕನ್ನಡ",
    "ગુજરાતી",
    "മലയാളം",
    "ਪੰਜਾਬੀ",
    "ଓଡ଼ିଆ",
    "অসমীয়া",
    "اردو",
    "English",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ─── Hero Section ──────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 hero-gradient">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, 60, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[700px] h-[700px] bg-violet-500/15 dark:bg-violet-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2],
              x: [0, 80, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[10%] -right-[10%] w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[120px]"
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Learning for India</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Education Without
                <br />
                <span className="gradient-text">Boundaries.</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
                Bringing world-class AI tutoring to every village in India.
                Learn in{" "}
                <span className="font-semibold text-foreground">
                  your own language
                </span>
                , at your own pace — summaries, quizzes, audio, and mindmaps
                generated instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <SignedOut>
                  <SignUpButton>
                    <Button
                      size="lg"
                      className="px-8 h-14 text-lg rounded-2xl shadow-xl shadow-primary/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all hover:scale-[1.02] hover:shadow-2xl"
                    >
                      Start Learning Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </SignUpButton>
                  <SignInButton>
                    <Button
                      variant="outline"
                      size="lg"
                      className="px-8 h-14 text-lg rounded-2xl border-2 border-primary/20 hover:bg-primary/5 transition-all"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/learn">
                    <Button
                      size="lg"
                      className="px-10 h-14 text-lg rounded-2xl shadow-xl shadow-primary/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all hover:scale-[1.02]"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </SignedIn>
              </div>

              {/* Language tags */}
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs px-3 py-1 rounded-full bg-muted/80 dark:bg-muted/50 text-muted-foreground font-medium border border-border/50"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: Visual Hero Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="glow-card rounded-3xl bg-card/80 dark:bg-card/60 backdrop-blur-xl border border-border/50 p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-muted-foreground font-mono">
                      EduAI Learning Space
                    </span>
                  </div>

                  {/* Mock content */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-500/20 dark:to-blue-500/20 rounded-2xl p-5 border border-violet-200/30 dark:border-violet-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <NotebookText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        <span className="font-semibold text-sm">
                          Summary Notes
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 bg-violet-200/50 dark:bg-violet-500/30 rounded-full w-full" />
                        <div className="h-2.5 bg-violet-200/50 dark:bg-violet-500/30 rounded-full w-4/5" />
                        <div className="h-2.5 bg-violet-200/50 dark:bg-violet-500/30 rounded-full w-3/5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl p-4 border border-orange-200/30 dark:border-orange-500/20">
                        <Music className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-2" />
                        <span className="text-xs font-medium">
                          Audio Ready
                        </span>
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ scaleY: [0.3, 1, 0.3] }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                              className="w-1 h-4 bg-orange-500/60 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="bg-green-500/10 dark:bg-green-500/20 rounded-2xl p-4 border border-green-200/30 dark:border-green-500/20">
                        <BadgeCheck className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                        <span className="text-xs font-medium">Quiz</span>
                        <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                          5/5
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-bold"
                >
                  ✨ AI-Powered
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -bottom-3 -left-3 bg-card dark:bg-card border border-border shadow-xl px-4 py-2 rounded-2xl text-sm font-semibold flex items-center gap-2"
                >
                  <Languages className="w-4 h-4 text-primary" />
                  हिन्दी में सीखें
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Impact Stats ──────────────────────────────────── */}
      <section className="py-16 px-4 border-y border-border/50 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={item}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-6">
              Your Personal{" "}
              <span className="gradient-text">AI Tutor</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to master your subjects, designed for students
              in every corner of India.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={item}>
                <Card className="glow-card h-full border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group bg-card/50 dark:bg-card/30 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <div
                        className={`text-${feature.color}-600 dark:text-${feature.color}-400`}
                      >
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold mb-2">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Mission Section ──────────────────────────────── */}
      <section className="py-24 px-4 bg-muted/30 dark:bg-muted/10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Our Mission
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-8">
              Democratizing Education
              <br />
              <span className="gradient-text">Across Rural India</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/25">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3">
                &ldquo;शिक्षा सबका अधिकार है&rdquo;
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Education is everyone&apos;s right. We believe no student should
                be left behind because of language or location.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3">Learn in Your Language</h3>
              <p className="text-muted-foreground leading-relaxed">
                From Hindi to Tamil, Bengali to Odia — AI generates all content
                in your mother tongue, making learning natural.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/25">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3">Bridge the Gap</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI tutoring that adapts to every grade level — from primary
                school to university, with personalized content.
              </p>
            </motion.div>
          </div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <blockquote className="text-2xl md:text-3xl font-semibold italic text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              &ldquo;The highest education is that which does not merely give us
              information but makes our life in harmony with all
              existence.&rdquo;
            </blockquote>
            <p className="text-muted-foreground mt-4 font-medium">
              — Rabindranath Tagore
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />

            <div className="relative z-10 p-12 md:p-16 text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform
                <br />
                Your Learning?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of students across India who are learning smarter
                with AI — in their own language, at their own pace.
              </p>
              <SignedOut>
                <SignUpButton>
                  <Button
                    size="lg"
                    className="px-12 h-14 text-lg rounded-2xl bg-white text-indigo-700 hover:bg-white/90 shadow-xl hover:scale-[1.02] transition-all font-bold"
                  >
                    Get Started for Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/learn">
                  <Button
                    size="lg"
                    className="px-12 h-14 text-lg rounded-2xl bg-white text-indigo-700 hover:bg-white/90 shadow-xl hover:scale-[1.02] transition-all font-bold"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-muted/20 dark:bg-muted/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">EduAI</span>
            </div>
            <p className="text-muted-foreground mb-3 max-w-md">
              Empowering every student in India with AI-powered learning tools
              in their own language.
            </p>
            <p className="text-sm text-muted-foreground/60 flex items-center gap-1.5">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
