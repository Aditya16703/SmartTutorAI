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
  Music,
  NotebookText,
  ArrowRight,
  Sparkles,
  Globe2,
  Zap,
  BookOpen,
  GraduationCap,
  Languages,
  Heart,
  Lightbulb,
  Layers,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";

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
      icon: <NotebookText className="w-8 h-8" />,
      title: "Smart Summary Notes",
      description:
        "AI generates concise, personalized summaries from any PDF or topic in your regional language.",
    },
    {
      icon: <Music className="w-8 h-8" />,
      title: "Audio Overview",
      description:
        "Listen to your lessons in 13 Indian languages — perfect for learning on the go.",
    },
    {
      icon: <BadgeCheck className="w-8 h-8" />,
      title: "Adaptive Quizzes",
      description:
        "Test your mastery with AI-powered quizzes and instant feedback in your language.",
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Active Flashcards",
      description:
        "Retain knowledge easily with AI-created spaced-repetition flashcards in your preferred language.",
    },
  ];

  const stats = [
    {
      icon: <Languages className="w-8 h-8" />,
      value: "13+",
      label: "Indian Languages",
    },
    { icon: <Zap className="w-8 h-8" />, value: "100%", label: "AI Powered" },
    {
      icon: <Heart className="w-8 h-8" />,
      value: "0₹",
      label: "Completely Free",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      value: "7+",
      label: "AI Study Tools",
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
    "English"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary pb-0">
      {/* ─── Top Brand Bar ───────────────────────────────── */}
      <div className="bg-primary text-primary-foreground py-3 px-6 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <BookOpen className="w-6 h-6 fill-primary-foreground text-secondary" />
          <span className="font-extrabold tracking-wide text-lg text-primary-foreground">EduAI</span>
          <div className="ml-auto flex items-center gap-4 md:gap-6">
             <Link href="/about" className="hidden md:block text-sm font-bold hover:text-secondary transition-colors text-primary-foreground">Our Story</Link>
             <Link href="/process" className="hidden md:block text-sm font-bold hover:text-secondary transition-colors text-primary-foreground">How It Works</Link>
             <div className="flex items-center gap-2">
                <ModeToggle />
                <SignedOut>
                   <SignInButton>
                     <button className="text-sm font-bold hover:text-secondary transition-colors py-2 px-4 rounded-lg hover:bg-black/10 text-primary-foreground">Login</button>
                   </SignInButton>
                </SignedOut>
                <SignedIn>
                   <Link href="/learn" className="text-sm font-bold hover:text-secondary transition-colors flex items-center gap-1 bg-white/10 py-2 px-4 rounded-lg text-primary-foreground">
                      Dashboard <ChevronRight className="w-4 h-4" />
                   </Link>
                </SignedIn>
             </div>
          </div>
        </div>
      </div>

      {/* ─── Hero Section ──────────────────────────────────── */}
      <section className="relative pt-16 pb-24 px-4 overflow-hidden bg-card shadow-sm border-b border-border">
        {/* 3D Warm Perspective Grid Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{ perspective: "1000px" }}>
            <div 
              className="absolute inset-x-[-50%] top-[30%] h-[150%] w-[200%] opacity-60 dark:opacity-30"
              style={{
                transform: "rotateX(75deg)",
                transformOrigin: "top center",
                backgroundImage: `linear-gradient(to right, var(--color-ring) 2px, transparent 2px),
                                  linear-gradient(to bottom, var(--color-ring) 2px, transparent 2px)`,
                backgroundSize: "80px 80px",
                maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)"
              }} 
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-primary font-bold text-sm mb-8 border border-primary/20">
                <Globe2 className="w-4 h-4" />
                <span>Empowering India&apos;s Future</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-foreground">
                Education for <br />
                <span className="text-primary">Every Child.</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed font-medium">
                Bringing world-class AI learning to every village in India.
                Learn in your own language, at your own pace, with complete ease.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <SignedOut>
                  <SignUpButton>
                    <Button
                      size="lg"
                      className="px-8 h-14 text-lg rounded-xl shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all font-bold hover:shadow-primary/30 group"
                    >
                      Start Learning Free
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/learn">
                    <Button
                      size="lg"
                      className="px-8 h-14 text-lg rounded-xl shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all font-bold hover:shadow-primary/30 group"
                    >
                      Enter Dashboard
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </SignedIn>
                
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 h-14 text-lg rounded-xl border-2 border-primary text-primary hover:bg-accent hover:text-primary transition-all font-bold bg-background"
                  >
                    Our Story
                  </Button>
                </Link>
              </div>

              {/* Language tags */}
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs px-3 py-1.5 rounded-full bg-background text-muted-foreground font-bold border border-border"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: Photographic Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] border border-border">
               <Image 
                  src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1000&q=80" 
                  alt="Students learning together" 
                  width={1000}
                  height={750}
                  className="w-full h-full object-cover"
                />
                
                {/* Yellow Accent Corner */}
                <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-secondary rounded-full blur-3xl opacity-30 dark:opacity-20 pointer-events-none" />
              </div>

              {/* Data Floating Badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 top-12 bg-card border border-border px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary fill-primary" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground">100%</p>
                  <p className="text-muted-foreground font-bold text-sm">Free Education</p>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 bottom-12 bg-secondary px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-secondary-foreground"
              >
                 <Sparkles className="w-5 h-5 text-amber-900" />
                 13+ Regional Languages
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Impact Stats Banner ──────────────────────────── */}
      <section className="bg-primary py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x-2 divide-primary-foreground/20"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={item}
                className="text-center text-primary-foreground px-4"
              >
                <div className="inline-flex items-center justify-center mb-4 text-secondary">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-black mb-2">
                  {stat.value}
                </div>
                <div className="text-base font-bold text-primary-foreground/90 uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Our Impact / Mission ─────────────────────────── */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-7xl mx-auto text-center">
           <span className="text-sm font-bold text-primary uppercase tracking-wider">
               Our Mission
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-16 text-foreground">
               Empowering The Most Vulnerable
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
               {/* Mission 1 */}
               <motion.div initial={{opacity:0, y: 20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="bg-card rounded-[2rem] overflow-hidden shadow-md border border-border text-left hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="h-56 bg-muted overflow-hidden">
                      <Image 
                        src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600" 
                        width={600}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" 
                        alt="School" 
                      />
                  </div>
                  <div className="p-8">
                     <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mb-6">
                        <Lightbulb className="w-7 h-7 text-primary" />
                     </div>
                     <h3 className="text-2xl font-bold mb-3 text-foreground">&ldquo;शिक्षा सबका अधिकार है&rdquo;</h3>
                     <p className="text-muted-foreground font-medium leading-relaxed">We believe no child should be left behind due to geography or language barriers.</p>
                  </div>
               </motion.div>

               {/* Mission 2 */}
               <motion.div initial={{opacity:0, y: 20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.1}} className="bg-card rounded-[2rem] overflow-hidden shadow-md border border-border text-left hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="h-56 bg-muted overflow-hidden">
                      <Image 
                        src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600" 
                        width={600}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" 
                        alt="Reading" 
                      />
                  </div>
                  <div className="p-8">
                     <div className="w-14 h-14 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                        <Languages className="w-7 h-7 text-secondary" />
                     </div>
                     <h3 className="text-2xl font-bold mb-3 text-foreground">Learn in Mother Tongue</h3>
                     <p className="text-muted-foreground font-medium leading-relaxed">Complete course transformation in 13+ native languages to preserve local dialects.</p>
                  </div>
               </motion.div>

               {/* Mission 3 */}
               <motion.div initial={{opacity:0, y: 20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.2}} className="bg-card rounded-[2rem] overflow-hidden shadow-md border border-border text-left hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="h-56 bg-muted overflow-hidden">
                      <Image 
                        src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600" 
                        width={600}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" 
                        alt="Student" 
                      />
                  </div>
                  <div className="p-8">
                     <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                        <GraduationCap className="w-7 h-7 text-emerald-500" />
                     </div>
                     <h3 className="text-2xl font-bold mb-3 text-foreground">Bridging the Gap</h3>
                     <p className="text-muted-foreground font-medium leading-relaxed">Providing high-end AI tutoring specifically tuned for the rural curriculum.</p>
                  </div>
               </motion.div>
            </div>
        </div>
      </section>

      {/* ─── Features (Tools) ─────────────────────────────── */}
      <section className="py-24 px-4 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">
              Tools Designed for the <span className="text-primary">Indian Classroom</span>
            </h2>
            <div className="w-24 h-1.5 bg-secondary mx-auto rounded-full" />
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={item}>
                <Card className="h-full border-2 border-border bg-card shadow-sm hover:border-primary hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                  <CardHeader className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-background text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold mb-3 text-foreground">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground font-medium leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Story CTA Section ────────────────────────────── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto bg-primary rounded-[3rem] overflow-hidden shadow-2xl relative">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full blur-[80px]" />
          
          <div className="grid md:grid-cols-2 p-12 md:p-16 items-center gap-12 relative z-10">
             <div>
                <h2 className="text-4xl md:text-5xl font-black text-primary-foreground mb-6">Shape Your Academic Future</h2>
                <p className="text-primary-foreground/90 text-xl font-medium mb-10 leading-relaxed">
                   Experience high-quality AI education designed to help you excel. Try out our interactive dashboard today. 
                </p>
                <Link href="/learn">
                  <Button size="lg" className="px-10 h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black text-xl rounded-2xl shadow-lg transition-transform hover:scale-105">
                     View Live Dashboard
                  </Button>
                </Link>
             </div>
             
             <div className="hidden md:block relative h-full">
                <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800" className="rounded-3xl shadow-2xl rotate-3 scale-105 border-8 border-white/20 opacity-90" alt="Child Learning" />
                <div className="absolute -bottom-6 -left-6 bg-card px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                     <BadgeCheck className="w-6 h-6 text-emerald-500" />
                   </div>
                   <div className="font-bold text-foreground text-lg">Verified Impact</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="bg-card border-t border-border py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black text-foreground tracking-tight">EduAI</span>
            </div>
            <p className="text-muted-foreground font-bold mb-6 max-w-2xl text-xl leading-relaxed italic">
               &ldquo;The highest education is that which does not merely give us information but makes our life in harmony with all existence.&rdquo;
               <span className="block mt-2 text-sm not-italic font-black text-primary">— Rabindranath Tagore</span>
            </p>
            <div className="w-12 h-1.5 bg-secondary rounded-full mb-8" />
            <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
              Made with <Heart className="w-4 h-4 text-primary fill-primary" /> for India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
