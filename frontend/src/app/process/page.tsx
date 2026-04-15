"use client";

import { motion } from "framer-motion";
import { BookOpen, Sparkles, NotebookText, Music, BadgeCheck, Layers, FileText, ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function ProcessPage() {
  const steps = [
    {
      icon: <FileText className="w-8 h-8 text-primary" />,
      title: "1. The Simple Prompt or Upload",
      description: "Everything starts with a simple input. A student can type a topic like 'Photosynthesis' or upload an entire textbook PDF chapter. The AI instantly reads and comprehends the material contextually.",
      bgColor: "bg-accent",
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800"
    },
    {
      icon: <NotebookText className="w-8 h-8 text-blue-500" />,
      title: "2. Smart Summary Generation",
      description: "Our AI breaks down complex academic jargon into simple, digestible Summary Notes. It automatically translates the entire summary into the student's selected regional language (e.g., Hindi, Tamil, Bengali) while preserving technical accuracy.",
      bgColor: "bg-blue-500/10",
      image: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&q=80&w=800"
    },
    {
      icon: <Music className="w-8 h-8 text-secondary" />,
      title: "3. Multilingual Audio Lectures",
      description: "Not everyone learns best by reading. The platform instantly generates an Audio Overview from the summaries. Students can listen to their lessons narrated clearly in their mother tongue, perfect for auditory learners or learning on the go.",
      bgColor: "bg-secondary/20",
      image: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=800"
    },
    {
      icon: <BadgeCheck className="w-8 h-8 text-emerald-500" />,
      title: "4. Adaptive Quizzes",
      description: "To test mastery, the AI dynamically generates multiple-choice quizzes based strictly on the uploaded content. As the student answers, the AI learns their weak points and provides instant feedback and explanations.",
      bgColor: "bg-emerald-500/10",
      image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=800"
    },
    {
      icon: <Layers className="w-8 h-8 text-purple-500" />,
      title: "5. Active Flashcards & Recommendations",
      description: "Long-term retention is secured using Active Flashcards. The AI uses spaced-repetition algorithms to test the student over time. Finally, the Recommendation engine suggests related topics to expand their knowledge naturally.",
      bgColor: "bg-purple-500/10",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary pb-0">
      {/* ─── Top Brand Bar ───────────────────────────────── */}
      <div className="bg-primary text-primary-foreground py-3 px-6 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 fill-primary-foreground text-secondary" />
            <span className="font-extrabold tracking-wide text-lg text-primary-foreground">EduAI</span>
          </Link>
          <div className="ml-auto flex items-center gap-6">
             <Link href="/" className="hidden md:block text-sm font-bold hover:text-secondary transition-colors text-primary-foreground">Home</Link>
             <Link href="/about" className="hidden md:block text-sm font-bold hover:text-secondary transition-colors text-primary-foreground">Our Story</Link>
          </div>
        </div>
      </div>

      {/* ─── Hero Section ────────────────────────── */}
      <section className="relative pt-20 pb-16 px-4 bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/20 text-secondary font-bold text-sm mb-8 border border-secondary/50">
              <Sparkles className="w-4 h-4 text-secondary fill-secondary" />
              <span>The Magic Behind the Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-foreground">
              How <span className="text-primary">EduAI Works</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium mb-12">
              From a single topic prompt to a complete, personalized, multilingual learning module in seconds. Here is the step-by-step process.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Pipeline Timeline ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              key={index} 
              className="relative mb-8"
            >
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                 <div className="absolute left-10 top-24 bottom-[-3rem] w-1 bg-border hidden md:block" />
              )}
              
              <div className="bg-card rounded-[2rem] p-8 md:p-12 shadow-sm border border-border flex flex-col md:flex-row gap-12 items-center relative z-10 hover:shadow-lg transition-shadow duration-300">
                 
                 {/* Content */}
                 <div className="flex-1">
                    <div className={`w-20 h-20 rounded-3xl ${step.bgColor} flex items-center justify-center mb-8 shadow-sm border border-border`}>
                       {step.icon}
                    </div>
                    <h2 className="text-3xl font-extrabold mb-4 text-foreground">{step.title}</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                       {step.description}
                    </p>
                 </div>

                 {/* Image representation */}
                 <div className="w-full md:w-5/12 h-[250px] md:h-[300px] rounded-[1.5rem] overflow-hidden shadow-inner border-4 border-background shrink-0">
                    <Image 
                      src={step.image} 
                      alt={step.title} 
                      width={800}
                      height={500}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90" 
                    />
                 </div>
              </div>
              
              {/* Arrow downwards on mobile */}
              {index !== steps.length - 1 && (
                 <div className="flex justify-center my-6 md:hidden">
                    <ArrowDown className="w-8 h-8 text-border" />
                 </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────── */}
      <section className="bg-card py-20 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-foreground">Ready to generate your first lesson?</h2>
          <Link href="/learn">
             <Button size="lg" className="px-12 h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl rounded-2xl shadow-md transition-transform hover:scale-105">
               Try EduAI Now <ArrowRight className="ml-2 w-6 h-6" />
             </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
