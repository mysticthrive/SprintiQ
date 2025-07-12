"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/provider/theme-provider";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // User metadata may have full_name, avatar_url
  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Admin";
  const avatarUrl = user?.user_metadata?.avatar_url || undefined;
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="h-screen flex flex-col workspace-bg p-2 gap-2">
      <header className="bg-emerald-700 p-3 rounded-xl shadow flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/images/sprint-icon.png"
            height={32}
            width={32}
            alt="icon"
          />
          <span className="text-lg font-bold text-white">SprintiQ Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="rounded-full hover:bg-emerald-500/10"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-white" />
              ) : (
                <Moon className="h-5 w-5 text-white" />
              )}
            </Button>
          )}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center rounded-md gap-2 focus:outline-none hover:bg-emerald-500/10 p-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback>
                      {getAvatarInitials(fullName, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-white/90 max-w-xs truncate flex items-center gap-2">
                    {fullName} <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="text-xs text-rose-500 hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer rounded-lg m-1 transition-colors flex items-center gap-2"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-row overflow-hidden h-full">
        <aside className="w-64 workspace-secondary-sidebar-bg text-white flex flex-col transition-all duration-300 relative rounded-l-xl border-r">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <nav className="flex-1 px-2 pt-5 pb-2 space-y-2 relative z-10">
            <Link
              href="/admin/dashboard"
              className={
                "group flex items-center p-2 mb-2 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden " +
                (pathname === "/admin/dashboard"
                  ? "hover:workspace-hover workspace-sidebar-text bg-gray-500/10 font-bold"
                  : "hover:workspace-hover workspace-sidebar-text")
              }
            >
              <LayoutDashboard className="h-4 w-4 mr-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/users"
              className={
                "group flex items-center p-2 mb-2 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden " +
                (pathname === "/admin/users"
                  ? "hover:workspace-hover workspace-sidebar-text bg-gray-500/10 font-bold"
                  : "hover:workspace-hover workspace-sidebar-text")
              }
            >
              <Users className="h-4 w-4 mr-4" />
              <span>Users</span>
            </Link>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 overflow-auto workspace-header-bg rounded-r-xl p-8 shadow-inner">
          {children}
        </main>
      </div>
    </div>
  );
}
