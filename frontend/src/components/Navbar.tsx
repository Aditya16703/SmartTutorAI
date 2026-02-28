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

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 group-hover:from-violet-600 group-hover:to-indigo-600 dark:group-hover:from-violet-400 dark:group-hover:to-indigo-400 transition-all">EduAI</span>
          </Link>

          <div className="flex items-center space-x-4 md:space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <SignedIn>
                <Link
                  href="/learn"
                  className="px-4 py-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-all font-medium"
                >
                  Learn
                </Link>

                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-all font-medium"
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
                    className="rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/50"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
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
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-foreground/70 hover:text-primary hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
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
        <div className="md:hidden glass-panel border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <SignedIn>
              <Link
                href="/learn"
                className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Learn
              </Link>

              <Link
                href="/profile"
                className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
            </SignedIn>

            {/* Mobile Auth Buttons */}
            <div className="pt-4 pb-3 border-t border-border/10 space-y-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-base font-medium text-foreground/80">Theme</span>
                <ModeToggle />
              </div>
              <SignedOut>
                <SignInButton forceRedirectUrl={"/learn"}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground/80"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton forceRedirectUrl={"/learn"}>
                  <Button
                    className="w-full bg-primary text-primary-foreground"
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
                  <span className="text-sm font-medium text-foreground/80">
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
