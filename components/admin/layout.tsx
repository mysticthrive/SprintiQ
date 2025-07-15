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
  Clock,
  Home,
  Building2,
  Mail,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/provider/theme-provider";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [workspacesModalOpen, setWorkspacesModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);
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

  // Fetch only workspaces where user is owner
  useEffect(() => {
    if (!workspacesModalOpen || !user) return;
    setLoadingWorkspaces(true);
    setWorkspacesError(null);
    const supabase =
      require("@/lib/supabase/client").createClientSupabaseClient();
    supabase
      .from("workspaces")
      .select("id, name, purpose, workspace_id, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }: any) => {
        if (error) setWorkspacesError("Failed to load workspaces");
        else setWorkspaces(data || []);
        setLoadingWorkspaces(false);
      });
  }, [workspacesModalOpen, user]);

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="h-screen flex flex-col workspace-bg p-2 gap-2">
      <Dialog open={workspacesModalOpen} onOpenChange={setWorkspacesModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Your Workspaces</DialogTitle>
          </DialogHeader>
          {loadingWorkspaces ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading workspaces...</span>
            </div>
          ) : workspacesError ? (
            <div className="text-red-500 text-center py-4">
              {workspacesError}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-gray-600 text-center py-4">
              No workspaces found.
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/${ws.workspace_id}/home`}
                    className="block"
                    onClick={() => setWorkspacesModalOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left py-2 h-auto"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ws.name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {ws.purpose}
                        </span>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
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
                    <AvatarFallback className="workspace-sidebar-header-gradient text-white font-semibold text-sm">
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
                  className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors flex items-center gap-2"
                  onClick={() => setWorkspacesModalOpen(true)}
                >
                  <Building2 className="h-4 w-4" />
                  Workspaces
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
            <Link
              href="/admin/time-track"
              className={
                "group flex items-center p-2 mb-2 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden " +
                (pathname === "/admin/time-track"
                  ? "hover:workspace-hover workspace-sidebar-text bg-gray-500/10 font-bold"
                  : "hover:workspace-hover workspace-sidebar-text")
              }
            >
              <Clock className="h-4 w-4 mr-4" />
              <span>Time Track</span>
            </Link>
            <Link
              href="/admin/emails"
              className={
                "group flex items-center p-2 mb-2 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden " +
                (pathname === "/admin/emails"
                  ? "hover:workspace-hover workspace-sidebar-text bg-gray-500/10 font-bold"
                  : "hover:workspace-hover workspace-sidebar-text")
              }
            >
              <Mail className="h-4 w-4 mr-4" />
              <span>Emails</span>
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
