"use client";

import { Loader2 } from "lucide-react";

interface LoadingPageProps {
  message?: string;
  className?: string;
}

export function LoadingPage({
  message = "Loading...",
  className,
}: LoadingPageProps) {
  return (
    <div
      className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}
    >
      <div className="flex flex-col items-center space-y-4 p-8 bg-card rounded-lg shadow-lg border animate-in fade-in zoom-in duration-300">
        <div className="animate-spin">
          <Loader2 className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-in fade-in slide-in-from-bottom-2 duration-500">
          {message}
        </p>
      </div>
    </div>
  );
}

// Minimalist loading overlay for quick transitions
export function LoadingOverlay({ className }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center animate-in fade-in duration-200 ${className}`}
    >
      <div className="animate-spin">
        <Loader2 className="w-6 h-6 text-primary" />
      </div>
    </div>
  );
}
