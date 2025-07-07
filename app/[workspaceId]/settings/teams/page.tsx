"use client";

import { useState, useEffect, useCallback } from "react";
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
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  MoreHorizontal,
  Search,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  User,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { Workspace, Profile } from "@/lib/database.types";

interface Team {
  id: string;
  name: string;
  description: string | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "admin" | "member";
  created_at: string;
}

interface TeamWithDetails extends Team {
  members: (TeamMember & { profile: Profile })[];
  memberCount: number;
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  profile: Profile;
}

export default function TeamsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(
    null
  );
  const [updatingTeams, setUpdatingTeams] = useState<Set<string>>(new Set());

  // Create team form state
  const [createTeamName, setCreateTeamName] = useState("");
  const [createTeamDescription, setCreateTeamDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Add members form state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  const currentUserRole = workspace?.owner_id === user?.id ? "owner" : "member";
  const canManageTeams = currentUserRole === "owner";

  const fetchWorkspaceData = useCallback(async () => {
    try {
      console.log("Fetching workspace data for:", workspaceId);

      // Fetch workspace info
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("workspace_id", workspaceId)
        .single();

      if (workspaceError) {
        console.error("Workspace error:", workspaceError);
        throw workspaceError;
      }

      if (!workspaceData) {
        throw new Error("Workspace not found");
      }

      console.log("Workspace found:", workspaceData.name);
      setWorkspace(workspaceData);

      // Fetch workspace members
      const { data: membersData, error: membersError } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceData.id)
        .eq("status", "active");

      if (membersError) {
        console.error("Members error:", membersError);
        console.error("Members error details:", {
          message: membersError?.message,
          code: membersError?.code,
          details: membersError?.details,
          hint: membersError?.hint,
        });
      } else {
        // Fetch profiles for members separately
        const userIds = (membersData || []).map((m) => m.user_id);
        let profiles: any[] = [];

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, email")
            .in("id", userIds);

          if (profilesError) {
            console.error("Profiles error:", profilesError);
          } else {
            profiles = profilesData || [];
          }
        }

        // Combine members with profiles
        const membersWithProfiles = (membersData || []).map((member) => {
          const profile = profiles.find((p) => p.id === member.user_id);
          return {
            ...member,
            profile: profile || {
              id: member.user_id,
              full_name: null,
              avatar_url: null,
              email: member.email || null,
            },
          };
        });

        setWorkspaceMembers(membersWithProfiles);
      }

      // Fetch teams with their members
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("workspace_id", workspaceData.id)
        .order("created_at", { ascending: false });

      if (teamsError) {
        console.error("Teams error:", teamsError);
        console.error("Teams error details:", {
          message: teamsError?.message,
          code: teamsError?.code,
          details: teamsError?.details,
          hint: teamsError?.hint,
        });
        // Set empty teams if there's an error
        setTeams([]);
      } else {
        console.log("Teams found:", (teamsData || []).length);

        // Fetch team members for each team
        const teamsWithMembers = await Promise.all(
          (teamsData || []).map(async (team) => {
            try {
              // Get team members
              const { data: teamMembers, error: membersError } = await supabase
                .from("team_members")
                .select("*")
                .eq("team_id", team.id);

              if (membersError) {
                console.error(
                  "Team members error for team",
                  team.id,
                  ":",
                  membersError
                );
                return {
                  ...team,
                  members: [],
                  memberCount: 0,
                };
              }

              // Get profiles for team members
              const memberUserIds = (teamMembers || []).map((m) => m.user_id);
              let memberProfiles: any[] = [];

              if (memberUserIds.length > 0) {
                const { data: profilesData, error: profilesError } =
                  await supabase
                    .from("profiles")
                    .select("id, full_name, avatar_url, email")
                    .in("id", memberUserIds);

                if (profilesError) {
                  console.error(
                    "Member profiles error for team",
                    team.id,
                    ":",
                    profilesError
                  );
                } else {
                  memberProfiles = profilesData || [];
                }
              }

              // Combine team members with profiles
              const membersWithProfiles = (teamMembers || []).map((member) => {
                const profile = memberProfiles.find(
                  (p) => p.id === member.user_id
                );
                return {
                  ...member,
                  profile: profile || {
                    id: member.user_id,
                    full_name: null,
                    avatar_url: null,
                    email: null,
                  },
                };
              });

              return {
                ...team,
                members: membersWithProfiles,
                memberCount: membersWithProfiles.length,
              };
            } catch (teamError) {
              console.error("Error processing team", team.id, ":", teamError);
              return {
                ...team,
                members: [],
                memberCount: 0,
              };
            }
          })
        );

        setTeams(teamsWithMembers);
      }
    } catch (error: any) {
      console.error("Error fetching teams data:", error);
      toast({
        title: "Error loading teams",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, workspaceId, toast]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const createTeam = async () => {
    if (!createTeamName.trim()) return;

    setIsCreating(true);
    try {
      // Note: You'll need to create a teams table with columns:
      // id, name, description, workspace_id, created_at, updated_at
      const { data: team, error } = await supabase
        .from("teams")
        .insert({
          name: createTeamName.trim(),
          description: createTeamDescription.trim() || null,
          workspace_id: workspace?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add the creator as team admin
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: team.id,
          user_id: user?.id,
          role: "admin",
        });

      if (memberError) {
        console.error("Error adding team creator as admin:", memberError);
      }

      toast({
        title: "Team created",
        description: `"${createTeamName}" has been created successfully.`,
        browserNotificationTitle: "Team created",
        browserNotificationBody: `"${createTeamName}" has been created successfully.`,
      });

      // Reset form and refresh data
      setCreateTeamName("");
      setCreateTeamDescription("");
      setIsCreateModalOpen(false);
      await fetchWorkspaceData();
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({
        title: "Error creating team",
        description: error.message || "Teams feature requires database setup",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addMembersToTeam = async () => {
    if (!selectedTeam || selectedMembers.size === 0) return;

    setIsAddingMembers(true);
    try {
      const memberInserts = Array.from(selectedMembers).map((userId) => ({
        team_id: selectedTeam.id,
        user_id: userId,
        role: "member" as const,
      }));

      const { error } = await supabase
        .from("team_members")
        .insert(memberInserts);

      if (error) throw error;

      toast({
        title: "Members added",
        description: `${selectedMembers.size} member(s) added to "${selectedTeam.name}".`,
        browserNotificationTitle: "Members added",
        browserNotificationBody: `${selectedMembers.size} member(s) added to "${selectedTeam.name}".`,
      });

      // Reset and refresh
      setSelectedMembers(new Set());
      setIsAddMembersModalOpen(false);
      setSelectedTeam(null);
      await fetchWorkspaceData();
    } catch (error: any) {
      console.error("Error adding members:", error);
      toast({
        title: "Error adding members",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsAddingMembers(false);
    }
  };

  const removeTeamMember = async (
    teamId: string,
    userId: string,
    memberName: string
  ) => {
    setUpdatingTeams((prev) => new Set([...prev, teamId]));

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: `${memberName} has been removed from the team.`,
        browserNotificationTitle: "Member removed",
        browserNotificationBody: `${memberName} has been removed from the team.`,
      });

      await fetchWorkspaceData();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Error removing member",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdatingTeams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }
  };

  const deleteTeam = async (teamId: string, teamName: string) => {
    setUpdatingTeams((prev) => new Set([...prev, teamId]));

    try {
      // First delete team members
      await supabase.from("team_members").delete().eq("team_id", teamId);

      // Then delete the team
      const { error } = await supabase.from("teams").delete().eq("id", teamId);

      if (error) throw error;

      toast({
        title: "Team deleted",
        description: `"${teamName}" has been deleted successfully.`,
        browserNotificationTitle: "Team deleted",
        browserNotificationBody: `"${teamName}" has been deleted successfully.`,
      });

      await fetchWorkspaceData();
    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error deleting team",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdatingTeams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }
  };

  const availableMembers = workspaceMembers.filter(
    (member) =>
      !selectedTeam?.members.some(
        (teamMember) => teamMember.user_id === member.user_id
      )
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-gray-600">
              Create and manage teams to organize your workspace members
              effectively.
            </p>
          </div>
          {canManageTeams && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="workspace"
              className="text-xs p-2 h-8"
            >
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-5 w-5" />
            Teams ({filteredTeams.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Manage teams and their members in your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {searchQuery ? "No teams found" : "No teams yet"}
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first team to organize your workspace members"}
              </p>
              {canManageTeams && !searchQuery && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="workspace"
                  className="text-xs p-2 h-8"
                >
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Team</TableHead>
                  <TableHead className="text-sm">Members</TableHead>
                  <TableHead className="text-sm">Created</TableHead>
                  {canManageTeams && (
                    <TableHead className="w-[50px] text-sm">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div>
                        <div className="text-xs font-medium">{team.name}</div>
                        {team.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {team.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {(team as any).team_members
                            .slice(0, 3)
                            .map((member: any) => (
                              <Avatar
                                key={member.id}
                                className="h-6 w-6 border-2 border-white"
                              >
                                <AvatarImage
                                  src={member.profile.avatar_url || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {member.profile.full_name
                                    ?.charAt(0)
                                    .toUpperCase() ||
                                    member.profile.email
                                      ?.charAt(0)
                                      .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          {team.memberCount} member
                          {team.memberCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {format(new Date(team.created_at), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    {canManageTeams && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {updatingTeams.has(team.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTeam(team);
                                setIsAddMembersModalOpen(true);
                              }}
                              disabled={updatingTeams.has(team.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                              Add Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600 focus:text-red-600"
                                  disabled={updatingTeams.has(team.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Team
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Team
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{team.name}
                                    "? This action cannot be undone. All team
                                    members will be removed from this team.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="text-xs">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteTeam(team.id, team.name)
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-xs"
                                  >
                                    Delete Team
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Team Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a team to organize workspace members for better
              collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="Enter team name"
                value={createTeamName}
                onChange={(e) => setCreateTeamName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="team-description">Description (optional)</Label>
              <Textarea
                id="team-description"
                placeholder="Enter team description"
                value={createTeamDescription}
                onChange={(e) => setCreateTeamDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={createTeam}
              variant="workspace"
              disabled={!createTeamName.trim() || isCreating}
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Members Modal */}
      <Dialog
        open={isAddMembersModalOpen}
        onOpenChange={setIsAddMembersModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members to {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Select workspace members to add to this team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableMembers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                All workspace members are already in this team.
              </p>
            ) : (
              availableMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={member.user_id}
                    checked={selectedMembers.has(member.user_id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedMembers);
                      if (checked) {
                        newSelected.add(member.user_id);
                      } else {
                        newSelected.delete(member.user_id);
                      }
                      setSelectedMembers(newSelected);
                    }}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={member.profile.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {member.profile.full_name?.charAt(0).toUpperCase() ||
                          member.profile.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {member.profile.full_name || member.profile.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.profile.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMembersModalOpen(false);
                setSelectedMembers(new Set());
                setSelectedTeam(null);
              }}
              disabled={isAddingMembers}
            >
              Cancel
            </Button>
            <Button
              onClick={addMembersToTeam}
              disabled={selectedMembers.size === 0 || isAddingMembers}
              variant="workspace"
            >
              {isAddingMembers && <Loader2 className="h-4 w-4 animate-spin" />}
              Add {selectedMembers.size} Member
              {selectedMembers.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
