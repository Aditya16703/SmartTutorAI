"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { BookOpen } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md group-hover:shadow-primary/50 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold tracking-wide text-foreground transition-all">EduAI</span>
          </Link>

          <div className="flex items-center space-x-4 md:space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <SignedIn>
                <Link
                  href="/learn"
                  className="px-4 py-2 rounded-full text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all font-bold"
                >
                  Learn
                </Link>

                <Link
                  href="/analysis"
                  className="px-4 py-2 rounded-full text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all font-bold"
                >
                  Analysis
                </Link>

                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-full text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all font-bold"
                >
                  Profile
                </Link>
              </SignedIn>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <ModeToggle />
              <SignedOut>
                <SignInButton>
                  <Button
                    variant="ghost"
                    className="font-bold text-foreground/80 hover:text-primary hover:bg-muted/50"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                    Get Started
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 border-2 border-background shadow-sm hover:scale-105 transition-transform",
                    },
                  }}
                />
              </SignedIn>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <ModeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-foreground/70 hover:text-primary hover:bg-muted/50 focus:outline-none transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden glass-panel border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <SignedIn>
              <Link
                href="/learn"
                className="block px-3 py-2 text-base font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Learn
              </Link>

              <Link
                href="/analysis"
                className="block px-3 py-2 text-base font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Analysis
              </Link>

              <Link
                href="/profile"
                className="block px-3 py-2 text-base font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
            </SignedIn>

            {/* Mobile Auth Buttons */}
            <div className="pt-4 pb-3 border-t border-border space-y-2">
              <SignedOut>
                <SignInButton forceRedirectUrl={"/learn"}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground/80 font-bold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton forceRedirectUrl={"/learn"}>
                  <Button
                    className="w-full bg-primary text-primary-foreground font-bold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center px-3 py-2 gap-3">
                  <UserButton
                    appearance={{
                      elements: {
                         avatarBox: "w-8 h-8",
                      },
                    }}
                  />
                  <span className="text-sm font-bold text-foreground/80">
                    Your Account
                  </span>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
