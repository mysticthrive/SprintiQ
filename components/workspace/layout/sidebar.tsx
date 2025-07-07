"use client";

import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  BellOff,
  User,
  LogOut,
  CircleHelp,
  Brain,
  Building2,
} from "lucide-react";
import type { Workspace, Profile } from "@/lib/database.types";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import InboxModal from "../modals/inbox-modal";
import InviteMembersModal from "../modals/invite-members-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingLink } from "@/components/ui/loading-link";
import { getAvatarInitials } from "@/lib/utils";

interface WorkspaceSidebarProps {
  workspace: Workspace;
  profile: Profile | null;
}

export default function WorkspaceSidebar({
  workspace,
  profile,
}: WorkspaceSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isInviteMembersModalOpen, setIsInviteMembersModalOpen] =
    useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const navigation = [
    { name: "Home", href: `/${workspaceId}/home`, icon: Home },
    { name: "Teams", href: `/${workspaceId}/teams`, icon: Users },
    {
      name: "Workspaces",
      href: `/${workspaceId}/settings/workspaces`,
      icon: Building2,
    },
    // { name: "Analytics", href: `/${workspaceId}/analytics`, icon: BarChart3 },
    {
      name: "Settings",
      href: `/${workspaceId}/settings/users`,
      icon: Settings,
    },
    { name: "Agents", href: `/${workspaceId}/agents`, icon: Brain },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } workspace-primary-sidebar-bg text-white flex flex-col transition-all duration-300 relative rounded-xl border border-white/10 backdrop-blur-sm shadow-2xl overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Workspace Header */}
      <div className="relative p-2 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex p-2">
            <Image
              src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/sprintiq-logo.png"
              alt="sprintiq-logo"
              width={140}
              height={140}
            />
          </div>
        )}

        {isCollapsed && (
          <div className="flex justify-center">
            <div className="relative group">
              <Image
                src="/images/sprint-icon.png"
                alt="sprintiq-logo"
                width={80}
                height={80}
                className="p-2"
              />
            </div>
          </div>
        )}

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 rounded-full flex items-center justify-center hover:from-gray-700 hover:to-gray-800 transition-all duration-300 z-10 shadow-lg backdrop-blur-sm ${
            isHovered
              ? "opacity-100 scale-100 translate-x-0"
              : "opacity-0 scale-95 translate-x-2"
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-white/80" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-white/80" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 px-2 pb-2 space-y-2 relative z-10 ${
          isCollapsed ? "pt-2 px-3" : "pt-5 px-2"
        }`}
      >
        {navigation.map((item, index) => {
          let isActive = false;

          // Helper function to check if path matches with both /app and non-/app prefixes
          const pathMatches = (basePath: string) => {
            return (
              pathname === basePath ||
              pathname === `/app${basePath}` ||
              pathname.startsWith(`${basePath}/`) ||
              pathname.startsWith(`/app${basePath}/`)
            );
          };

          // Home: active for exact home paths
          if (item.name === "Home") {
            isActive =
              pathname === `/${workspaceId}/space` ||
              pathname === `/${workspaceId}/task` ||
              pathname === `/app/${workspaceId}` ||
              pathname === `/${workspaceId}/home` ||
              pathname === `/app/${workspaceId}/home`;
          }

          // Teams: active for teams paths
          else if (item.name === "Teams") {
            isActive = pathMatches(`/${workspaceId}/teams`);
          }

          // Workspaces: active for workspaces settings paths
          else if (item.name === "Workspaces") {
            isActive = pathMatches(`/${workspaceId}/settings/workspaces`);
          }

          // Analytics: active for analytics paths
          else if (item.name === "Analytics") {
            isActive = pathMatches(`/${workspaceId}/analytics`);
          }

          // Settings: active for settings paths (excluding workspaces)
          else if (item.name === "Settings") {
            isActive =
              (pathname.startsWith(`/${workspaceId}/settings`) ||
                pathname.startsWith(`/app/${workspaceId}/settings`)) &&
              !pathname.startsWith(`/${workspaceId}/settings/workspaces`) &&
              !pathname.startsWith(`/app/${workspaceId}/settings/workspaces`);
          }

          // Agents: active for agents paths
          else if (item.name === "Agents") {
            isActive = pathMatches(`/${workspaceId}/agents`);
          }

          // Default: exact match
          else {
            isActive = pathname === item.href;
          }

          return (
            <LoadingLink
              key={item.name}
              href={item.href}
              loadingMessage={`Loading ${item.name.toLowerCase()}...`}
              className={`pb-2 ${
                isCollapsed ? "flex flex-col items-center" : ""
              }`}
            >
              <div
                className={`group flex items-center p-2 mb-2 ${
                  isCollapsed ? "justify-center " : ""
                } text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? "text-white shadow-lg border border-workspace-primary workspace-icon-gradient"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 workspace-primary rounded-full" />
                )}

                {/* Icon */}
                <div className={`relative ${isCollapsed ? "" : "mr-4"}`}>
                  <item.icon
                    className={`h-4 w-4 transform group-hover:scale-110 transition-transform duration-200 ${
                      isActive ? "text-workspace-primary-light" : "text-current"
                    }`}
                  />
                </div>

                {/* Label */}
                {!isCollapsed && (
                  <span className="font-medium tracking-wide text-xs">
                    {item.name}
                  </span>
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
              </div>
              {isCollapsed && <span className="text-[10px]">{item.name}</span>}
            </LoadingLink>
          );
        })}
      </nav>

      {/* Invite Members Button */}
      <div className="p-2 relative z-10">
        <button
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center flex-col gap-1" : ""
          }`}
          onClick={() => setIsInviteMembersModalOpen(true)}
        >
          {isCollapsed ? (
            <div
              className={`flex items-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 border border-transparent backdrop-blur-sm group flex items-center`}
            >
              <UserPlus className="h-4 w-4 transform group-hover:scale-110 transition-transform duration-200" />
            </div>
          ) : (
            <div
              className={`w-full flex flex-1 items-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 border border-transparent backdrop-blur-sm group flex items-center`}
            >
              <UserPlus className="mr-3 h-4 w-4 transform group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium text-xs">Invite Members</span>
            </div>
          )}
          {isCollapsed && (
            <span className="font-medium text-[10px]">Invite</span>
          )}
        </button>
      </div>

      {/* User Dropdown Session */}
      <div className="p-2 relative z-10 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center" : "justify-start space-x-3"
              } text-left hover:bg-white/10 rounded-xl p-2 transition-all duration-200 group`}
            >
              <div className="relative">
                <Avatar className="h-8 w-8 transition-all duration-200">
                  <AvatarImage
                    src={profile?.avatar_url ?? undefined}
                    alt={profile?.email ?? user?.email ?? "User"}
                  />
                  <AvatarFallback className="workspace-sidebar-header-gradient text-white font-semibold text-sm">
                    {getAvatarInitials(
                      profile?.full_name,
                      profile?.email ?? user?.email
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold truncate text-white/90 group-hover:text-white transition-colors">
                    {profile?.full_name ||
                      profile?.email ||
                      user?.email ||
                      "Guest User"}
                  </h3>
                  <p className="text-xs text-white/60 font-medium">
                    {user?.user_metadata?.role || "Admin"}
                  </p>
                </div>
              )}
              {!isCollapsed && (
                <ChevronDown className="h-4 w-4 text-white/60 group-hover:text-white/80 transition-colors ml-auto" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="ml-2 w-64">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
                <BellOff className="mr-1 h-4 w-4" />
                Mute Notifications
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
                  For 30 minutes
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
                  For 1 hour
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
                  Until tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
                  Until next week
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
              onClick={() => router.push(`/${workspaceId}/settings/profile`)}
            >
              <User className="mr-1 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
              onClick={() => router.push(`/${workspaceId}/settings/profile`)}
            >
              <Settings className="mr-1 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
              <BellOff className="mr-1 h-4 w-4" />
              Notification Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="workspace-hover my-2" />
            <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
              <CircleHelp className="mr-1 h-4 w-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-rose-500 text-xs hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer rounded-lg m-1 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Inbox Modal (kept for potential future use, though button is removed) */}
      <InboxModal
        open={isInboxOpen}
        onOpenChange={setIsInboxOpen}
        workspace={workspace}
      />

      {/* Invite Members Modal */}
      <InviteMembersModal
        open={isInviteMembersModalOpen}
        onOpenChange={setIsInviteMembersModalOpen}
        workspace={workspace}
      />
    </div>
  );
}
