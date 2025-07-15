"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-emerald-500/20">
          {/* Logo */}
          <div className="mb-8">
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

          {/* Access Denied Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Access Denied
            </h1>
            <p className="text-emerald-100/90 text-lg leading-relaxed">
              Sorry, your email address is not authorized to access SprintiQ at
              this time.
            </p>
          </div>

          {/* Alert */}
          <div className="mb-8 bg-red-500/10 border-red-500/20 text-red-300 backdrop-blur-sm flex gap-2 items-start p-2 rounded-md">
            <Mail className="h-4 w-4 text-rose-400 mt-1" />
            <span className="text-rose-400 flex-1 text-left">
              This application is currently in restricted access mode. Only
              authorized users can create accounts and access the platform.
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] h-14"
            >
              <Link href="/">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </Button>

            <div className="text-center">
              <p className="text-emerald-100/80 text-sm">
                Need access?{" "}
                <a
                  href="/contact"
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
