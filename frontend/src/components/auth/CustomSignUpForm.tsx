"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CustomSignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    // Validation
    if (!firstName || !lastName) {
      toast.error("First and Last name are required.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // Create sign up
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
        unsafeMetadata: {
          middleName: middleName || "",
        }
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      if (err.errors) {
        err.errors.forEach((e: any) => toast.error(e.message));
      } else {
        toast.error("Failed to sign up.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code
  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== "complete") {
        console.log(JSON.stringify(completeSignUp, null, 2));
        toast.error("Verification incomplete. Please check the code.");
      } else {
        await setActive({ session: completeSignUp.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      if (err.errors) {
        err.errors.forEach((e: any) => toast.error(e.message));
      } else {
        toast.error("Invalid verification code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-2xl border-border rounded-[2rem] bg-card overflow-hidden">
        <CardHeader className="p-8 text-center bg-muted/30">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black text-foreground">Verify Email</CardTitle>
          <CardDescription className="text-muted-foreground font-medium mt-2">
            Enter the code sent to <span className="font-bold text-foreground">{emailAddress}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={onPressVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-bold ml-1">Verification Code</Label>
              <Input
                id="code"
                placeholder="123456"
                value={code}
                className="rounded-xl h-12 text-center text-2xl tracking-[0.5em] font-black border-border focus:ring-primary"
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-lg shadow-lg hover:shadow-primary/30 transition-all"
              disabled={isLoading || code.length < 6}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Verify Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-border rounded-[2rem] bg-card overflow-hidden">
      <CardHeader className="p-8 text-center bg-muted/30">
        <CardTitle className="text-4xl font-black text-foreground tracking-tight">Create Account</CardTitle>
        <CardDescription className="text-muted-foreground font-medium mt-2">
          Join EduAI and transform your learning journey
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-bold ml-1 flex items-center gap-1">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                className="rounded-xl h-12 border-border focus:ring-primary bg-background/50"
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-bold ml-1 flex items-center gap-1">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                className="rounded-xl h-12 border-border focus:ring-primary bg-background/50"
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName" className="text-sm font-bold ml-1">
              Middle Name <span className="text-muted-foreground text-[10px] uppercase tracking-tighter ml-1">(Optional)</span>
            </Label>
            <Input
              id="middleName"
              placeholder="Edward"
              value={middleName}
              className="rounded-xl h-12 border-border focus:ring-primary bg-background/50"
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold ml-1 flex items-center gap-1">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={emailAddress}
              className="rounded-xl h-12 border-border focus:ring-primary bg-background/50"
              onChange={(e) => setEmailAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="password" className="text-sm font-bold ml-1 flex items-center gap-1">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  className="rounded-xl h-12 border-border focus:ring-primary bg-background/50 pr-10"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-bold ml-1 flex items-center gap-1">
                Confirm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                className={`rounded-xl h-12 border-border focus:ring-primary bg-background/50 ${
                  confirmPassword && password !== confirmPassword ? "border-destructive ring-1 ring-destructive" : ""
                }`}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {confirmPassword && password !== confirmPassword && (
            <div className="flex items-center gap-2 text-destructive text-xs font-bold bg-destructive/10 p-3 rounded-lg animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4" />
              Passwords do not match
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg hover:shadow-primary/30 transition-all mt-4 group"
            disabled={isLoading || !emailAddress || !password || password !== confirmPassword}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : (
              <>
                Create Account
                <CheckCircle2 className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              </>
            )}
          </Button>

          {/* Required for Clerk Bot Protection */}
          <div id="clerk-captcha" />
        </form>
      </CardContent>
      <CardFooter className="p-8 pt-0 text-center">
        <p className="w-full text-sm font-bold text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline ml-1">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
