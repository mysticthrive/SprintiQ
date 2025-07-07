"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, TestTube, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  isEmailAllowed,
  checkAllowedUsersTable,
  debugEmailAuthorization,
} from "@/lib/auth-utils";

export default function TestAuthPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "success" | "error" | "denied"
  >("idle");

  const testEmailAuth = async () => {
    if (!email) {
      setResult("Please enter an email address");
      setTestStatus("error");
      return;
    }

    setIsLoading(true);
    setResult("Testing...");
    setTestStatus("idle");

    try {
      // Check if table exists
      const tableExists = await checkAllowedUsersTable();
      if (!tableExists) {
        setResult(
          "ERROR: allowed_users table is not accessible. Please run the SQL script first."
        );
        setTestStatus("error");
        return;
      }

      // Test the email authorization
      const isAllowed = await isEmailAllowed(email);
      setResult(`Email: ${email}\nAllowed: ${isAllowed ? "YES" : "NO"}`);
      setTestStatus(isAllowed ? "success" : "denied");

      // Run debug function
      await debugEmailAuthorization(email);
    } catch (error) {
      setResult(`Error: ${error}`);
      setTestStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case "denied":
        return <XCircle className="w-6 h-6 text-red-400" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-orange-400" />;
      default:
        return <TestTube className="w-6 h-6 text-emerald-300" />;
    }
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "denied":
        return "bg-red-500/10 border-red-500/20";
      case "error":
        return "bg-orange-500/10 border-orange-500/20";
      default:
        return "bg-emerald-950/30 border-emerald-500/20";
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

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-emerald-500/20">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center space-x-3">
              <Image
                src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/sprintiq-logo.png"
                alt="SprintiQ Logo"
                width={200}
                height={40}
                priority
                className="h-auto"
              />
            </Link>
          </div>

          {/* Test Icon */}
          <div className="mb-6 text-center">
            <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <TestTube className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Email Authorization Test
            </h1>
            <p className="text-emerald-100/90 text-lg leading-relaxed">
              Test if an email address is authorized to access SprintiQ
            </p>
          </div>

          {/* Test Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-emerald-100 mb-3">
                Email to test:
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                  onKeyPress={(e) => e.key === "Enter" && testEmailAuth()}
                />
              </div>
            </div>

            {/* Results */}
            {result && (
              <div
                className={`p-6 rounded-xl backdrop-blur-sm border ${getStatusColor()} transition-all duration-300`}
              >
                <div className="flex items-start space-x-3">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <pre className="text-emerald-100 text-sm whitespace-pre-wrap font-mono">
                      {result}
                    </pre>
                  </div>
                </div>
              </div>
            )}
            <Button
              onClick={testEmailAuth}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none h-14"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Testing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5" />
                  <span>Test Email Authorization</span>
                </div>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center space-y-4">
            <Button
              asChild
              variant="outline"
              className="w-full bg-emerald-950/30 border-emerald-500/30 text-white hover:bg-emerald-950/40 h-14 hover:border-emerald-400/50 rounded-xl transition-all duration-200"
            >
              <Link href="/">Back to Home</Link>
            </Button>

            <div className="text-center">
              <p className="text-emerald-100/80 text-sm">
                Need help?{" "}
                <a
                  href="mailto:support@sprintiq.ai"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200 hover:underline"
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
