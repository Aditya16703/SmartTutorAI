"use client";

import { motion } from "framer-motion";
import { BookOpen, Heart, Globe2, Lightbulb, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SignUpButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary pb-0">
      {/* ─── Top Brand Bar ───────────────────────────────── */}
      <div className="bg-primary text-primary-foreground py-3 px-6 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 fill-primary-foreground text-secondary" />
            <span className="font-extrabold tracking-wide text-lg text-primary-foreground">EduAI</span>
          </Link>
          <div className="ml-auto flex items-center gap-4 md:gap-6">
             <Link href="/" className="hidden md:block text-sm font-bold hover:text-secondary transition-colors text-primary-foreground">Home</Link>
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

      {/* ─── Hero / Story Section ────────────────────────── */}
      <section className="relative pt-20 pb-16 px-4 bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-primary font-bold text-sm mb-8 border border-primary/20">
              <Heart className="w-4 h-4 fill-primary" />
              <span>About Us</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-foreground">
              Bridging the Gap in <span className="text-primary">Rural Education</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium mb-12">
              We started with a simple question: Why should a student&apos;s potential be limited by the language they speak or the village they live in? 
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── The Story ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-extrabold mb-4 text-foreground">The Problem</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                In rural India, millions of bright students struggle with outdated curricula and language barriers. The best online resources and digital tutoring platforms are often exclusively in English, isolating those who only speak regional dialects. Furthermore, high-quality, personalized tutoring is an expensive luxury.
              </p>
            </div>
            
            <div className="w-full h-[2px] bg-border" />

            <div>
              <h2 className="text-3xl font-extrabold mb-4 text-foreground">The EduAI Solution</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                EduAI is an intelligent platform leveraging cutting-edge Generative AI to completely erase these barriers. We provide a world-class personal tutor experience that is fully functional in over 13 Indian languages.
              </p>
              <br/>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether a student needs a complex PDF summarized in Hindi, an audio explanation in Tamil, or spaced-repetition flashcards in Bengali, our AI handles it instantly. 
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-[2rem] overflow-hidden shadow-2xl border-8 border-card">
              <Image 
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000" 
                alt="Rural students learning" 
                width={1000}
                height={600}
                className="w-full h-[600px] object-cover opacity-90" 
              />
            </div>
            
            <div className="absolute -bottom-10 -left-10 bg-secondary p-8 rounded-3xl shadow-xl w-64 rotate-[-3deg]">
              <Lightbulb className="w-10 h-10 text-primary mb-4" />
              <p className="text-2xl font-black text-secondary-foreground leading-tight">Every Child Deserves to Learn in their Mother Tongue.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── The Impact ──────────────────────────────────── */}
      <section className="bg-card py-24 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-16 text-foreground">The Impact We Bring</h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            <motion.div 
              initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}}
              className="p-10 bg-background rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-accent text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Erasing Geography</h3>
              <p className="text-muted-foreground leading-relaxed">
                A student in a remote village now has access to the same pedagogical quality as a student in a top-tier metropolitan school, bridging the urban-rural divide.
              </p>
            </motion.div>

            <motion.div 
              initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.1}}
              className="p-10 bg-background rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-secondary/20 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Empowering Teachers</h3>
              <p className="text-muted-foreground leading-relaxed">
                EduAI doesn&apos;t replace teachers; it superpowers them. Rural educators use our platform to generate quizzes and lesson summaries, saving hours of manual work.
              </p>
            </motion.div>

            <motion.div 
              initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}}
              className="p-10 bg-background rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Personalized Pacing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Through adaptive AI quizzes and dynamic flashcards, the system learns what the student struggles with and adjusts the material to ensure true mastery.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Developer & Contact ──────────────────────────────────── */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-4xl mx-auto rounded-[3rem] bg-card border-2 border-border p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4 text-foreground">Developed By</h2>
          <h3 className="text-2xl font-black text-primary mb-8">Aditya Singh Chauhan</h3>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-muted-foreground font-medium text-lg">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-secondary/10 rounded-xl text-secondary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </span>
              <a href="mailto:ac3413452@gmail.com" className="hover:text-primary transition-colors">ac3413452@gmail.com</a>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </span>
              <a href="tel:+917000860594" className="hover:text-primary transition-colors">+91 7000860594</a>
            </div>
          </div>
        </div>
      </section>


      {/* ─── Footer CTA ──────────────────────────────────── */}
      <section className="bg-primary py-20 px-4">
        <div className="max-w-4xl mx-auto text-center text-primary-foreground">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Join the Movement</h2>
          <p className="text-xl mb-10 opacity-90 leading-relaxed font-medium">
            Discover how simple interactions with AI can completely transform studying. Let&apos;s make learning accessible to all.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/process">
              <Button size="lg" className="px-10 h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black text-lg rounded-2xl shadow-lg transition-transform hover:scale-105 w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" className="px-10 h-16 bg-card hover:bg-background text-primary font-black text-lg rounded-2xl shadow-lg transition-transform hover:scale-105 w-full sm:w-auto border-none">
                Start Learning Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
