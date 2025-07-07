"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Crown,
  Shield,
  User,
  UserX,
  Search,
  MoreHorizontal,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import InviteMembersModal from "@/components/workspace/modals/invite-members-modal";

interface WorkspaceMemberWithProfile {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string | null;
  role: string;
  status: "active" | "pending";
  invited_at: string;
  joined_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  isOwner: boolean;
}

interface WorkspaceData {
  id: string;
  name: string;
  owner_id: string;
}

const roleConfig = {
  owner: {
    label: "Owner",
    description: "Full access to all workspace features and settings",
    icon: Crown,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  admin: {
    label: "Admin",
    description: "Can manage spaces, people, billing, and workspace settings",
    icon: Shield,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  member: {
    label: "Member",
    description: "Can access all public items in the workspace",
    icon: User,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  limited_member: {
    label: "Limited Member",
    description: "Can only access items shared with them",
    icon: User,
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  guest: {
    label: "Guest",
    description: "Limited access to shared items only",
    icon: UserX,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export default function UsersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [members, setMembers] = useState<WorkspaceMemberWithProfile[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  const currentUserRole = members.find(
    (member) => member.user_id === user?.id
  )?.role;
  const isCurrentUserOwnerOrAdmin =
    currentUserRole === "owner" || currentUserRole === "admin";

  const fetchWorkspaceData = async () => {
    try {
      // Fetch workspace info
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id, name, owner_id")
        .eq("workspace_id", workspaceId)
        .single();

      if (workspaceError) throw workspaceError;
      setWorkspace(workspaceData);

      // Fetch workspace members
      const { data: membersData, error: membersError } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceData.id)
        .order("invited_at", { ascending: false });

      if (membersError) throw membersError;

      // Get user profiles for active members only
      const activeMembers = membersData.filter((m) => m.status === "active");
      const userIds = activeMembers.map((m) => m.user_id);

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else {
          profiles = profilesData || [];
        }
      }

      // Combine members with profiles
      const membersWithProfiles = membersData.map((member) => {
        // For pending members, don't try to match profile since user_id might be inviter's ID
        if (member.status === "pending") {
          return {
            ...member,
            profile: undefined,
            isOwner: false, // Pending users are never owners
          };
        }

        // For active members, match with their profile
        const profile = profiles.find((p) => p.id === member.user_id);
        return {
          ...member,
          profile: profile
            ? {
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
              }
            : undefined,
          isOwner: member.user_id === workspaceData.owner_id,
        };
      });

      setMembers(membersWithProfiles);
    } catch (error: any) {
      console.error("Error fetching workspace data:", error);
      toast({
        title: "Error",
        description: "Failed to load workspace members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!isCurrentUserOwnerOrAdmin) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to change user roles",
        variant: "destructive",
      });
      return;
    }

    setUpdatingRoles((prev) => new Set([...prev, memberId]));

    try {
      const { error } = await supabase
        .from("workspace_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      // Update local state
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );

      toast({
        title: "Success",
        description: "User role updated successfully",
        browserNotificationTitle: "User role updated",
        browserNotificationBody: "User role updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating member role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingRoles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    if (!isCurrentUserOwnerOrAdmin) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to remove users",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      // Update local state
      setMembers((prev) => prev.filter((member) => member.id !== memberId));

      toast({
        title: "Success",
        description: `Removed ${memberEmail} from workspace`,
        browserNotificationTitle: "User removed",
        browserNotificationBody: `"${memberEmail}" has been removed from the workspace.`,
      });
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove user from workspace",
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (memberId: string, memberEmail: string) => {
    // In a real app, this would trigger an email
    toast({
      title: "Invitation Resent",
      description: `Invitation resent to ${memberEmail}`,
    });
  };

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceData();
    }
  }, [workspaceId]);

  // Filter members based on search and filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !searchQuery ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profile?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || member.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage workspace members and their permissions
          </p>
        </div>
        {isCurrentUserOwnerOrAdmin && (
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            variant="workspace"
            className="text-xs p-2 h-8"
          >
            <UserPlus className="h-4 w-4" />
            Invite Users
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">{activeMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold">{pendingMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Crown className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins & Owners</p>
                <p className="text-2xl font-bold">
                  {
                    activeMembers.filter(
                      (m) => m.role === "owner" || m.role === "admin"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="limited_member">Limited Member</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({filteredMembers.length})</CardTitle>
          <CardDescription>
            Manage your workspace members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => {
              const roleInfo =
                roleConfig[member.role as keyof typeof roleConfig];
              const RoleIcon = roleInfo?.icon || User;
              const isUpdating = updatingRoles.has(member.id);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {(member.profile?.full_name || member.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {member.profile?.full_name || "Pending User"}
                        </h3>
                        {member.status === "pending" && (
                          <Badge
                            variant="outline"
                            className="text-yellow-600 border-yellow-300"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.status === "active" && member.joined_at
                          ? `Joined ${format(
                              new Date(member.joined_at),
                              "MMM d, yyyy"
                            )}`
                          : `Invited ${format(
                              new Date(member.invited_at),
                              "MMM d, yyyy"
                            )}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <Badge
                      variant="outline"
                      className={`${roleInfo?.color} flex items-center gap-1`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleInfo?.label}
                    </Badge>

                    {/* Role Update (if not owner and user has permission) */}
                    {!member.isOwner &&
                      isCurrentUserOwnerOrAdmin &&
                      member.status === "active" && (
                        <Select
                          value={member.role}
                          onValueChange={(newRole) =>
                            updateMemberRole(member.id, newRole)
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="limited_member">
                              Limited Member
                            </SelectItem>
                            <SelectItem value="guest">Guest</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                    {/* Actions Menu */}
                    {isCurrentUserOwnerOrAdmin && !member.isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                resendInvitation(member.id, member.email || "")
                              }
                            >
                              Resend Invitation
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.email}{" "}
                                  from this workspace? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    removeMember(member.id, member.email || "")
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No members found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "No members match your current filters"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Members Modal */}
      {workspace && (
        <InviteMembersModal
          open={isInviteModalOpen}
          onOpenChange={(open) => {
            setIsInviteModalOpen(open);
            if (!open) {
              // Refresh data when modal closes to show new invitations
              fetchWorkspaceData();
            }
          }}
          workspace={{
            id: workspace.id,
            name: workspace.name,
          }}
        />
      )}
    </div>
  );
}
