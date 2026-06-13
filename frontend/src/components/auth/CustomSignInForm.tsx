"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CustomSignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back!");
        router.push("/");
      } else {
        console.log(JSON.stringify(result, null, 2));
        toast.error("Something went wrong. Please check your credentials.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      if (err.errors) {
        err.errors.forEach((e: any) => toast.error(e.message));
      } else {
        toast.error("Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-border rounded-[2rem] bg-card overflow-hidden">
      <CardHeader className="p-8 text-center bg-muted/30">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-4xl font-black text-foreground tracking-tight">Welcome Back</CardTitle>
        <CardDescription className="text-muted-foreground font-medium mt-2">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <Label htmlFor="password" className="text-sm font-bold flex items-center gap-1">
                Password <span className="text-destructive">*</span>
              </Label>
              <Link href="/sign-up" className="text-[10px] uppercase tracking-tighter text-primary font-bold hover:underline">
                Forgot Password?
              </Link>
            </div>
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

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg hover:shadow-primary/30 transition-all mt-4 group"
            disabled={isLoading || !emailAddress || !password}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : (
              <>
                Sign In
                <LogIn className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          {/* Required for Clerk Bot Protection */}
          <div id="clerk-captcha" />
        </form>
      </CardContent>
      <CardFooter className="p-8 pt-0 text-center">
        <p className="w-full text-sm font-bold text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline ml-1">
            Create Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
