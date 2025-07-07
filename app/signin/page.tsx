"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(
        err.message ||
          "Google sign-in is not available. Please use email sign-in."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - Branding & Info */}
        <div className="text-center lg:text-left space-y-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-3 mb-8 group"
          >
            <Image
              src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/sprintiq-logo.png"
              alt="SprintiQ Logo"
              width={200}
              height={40}
              priority // Preload the logo as it's above the fold [^3]
              className="h-auto"
            />
          </Link>

          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent leading-tight">
              Welcome
              <br />
              <span className="text-emerald-300">back</span>
            </h1>
            <p className="text-emerald-100/90 text-xl leading-relaxed max-w-md mx-auto lg:mx-0">
              Sign in to your account and continue managing your projects with
              ease
            </p>
          </div>

          {/* Feature highlights */}
          <div className="hidden lg:block space-y-4 pt-8">
            <div className="flex items-center space-x-3 text-emerald-100">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Access all your projects instantly</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-100">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Secure and encrypted connection</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-100">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Sync across all your devices</span>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="w-full max-w-md mx-auto lg:max-w-none">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Sign in to your account
              </h2>
              <p className="text-emerald-100/80">
                Welcome back! Please enter your details
              </p>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="mb-6 bg-red-500/10 border-red-500/20 backdrop-blur-sm"
              >
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-emerald-100"
                >
                  Email address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-400 transition-colors duration-200" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-12 h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-emerald-100"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-400 transition-colors duration-200" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-300 hover:text-emerald-200 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember"
                    className="border-emerald-400/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-emerald-100/90 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none h-14"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-500/30" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-emerald-950/40 text-emerald-100/80 rounded-full backdrop-blur-sm border border-emerald-500/20">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            {/* Social Sign In */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center h-12 bg-emerald-950/30 border-emerald-500/30 text-white hover:bg-emerald-950/40 hover:border-emerald-400/50 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              onClick={handleGoogleSignIn}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </Button>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-emerald-100/80">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-200 hover:underline"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
