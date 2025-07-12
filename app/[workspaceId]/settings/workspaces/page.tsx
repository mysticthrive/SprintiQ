"use client";

import WorkspacesLoading from "./loading";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Building2,
  Users,
  Settings,
  Crown,
  Calendar,
  Loader2,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Briefcase,
  Home,
  Globe,
  Code,
  Rocket,
  LineChart,
  Headphones,
  HelpCircle,
  Zap,
  Palette,
  Camera,
  ShoppingCart,
  GraduationCap,
  Heart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { Workspace } from "@/lib/database.types";
import CreateWorkspaceModal from "@/components/workspace/modals/create-workspace-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface WorkspaceWithStats extends Workspace {
  memberCount: number;
  spacesCount: number;
  projectsCount: number;
  isOwner: boolean;
  role: string;
  status: string;
  invitedAt: string;
  joinedAt: string | null;
  invitedBy?: {
    full_name: string | null;
    email: string;
  };
}

const workspacePurposes = [
  { id: "project_management", label: "Project Management", icon: Briefcase },
  { id: "personal", label: "Personal", icon: Home },
  { id: "team_collaboration", label: "Team Collaboration", icon: Users },
  { id: "client_work", label: "Client Work", icon: Briefcase },
  { id: "startup", label: "Startup", icon: Rocket },
  { id: "freelancing", label: "Freelancing", icon: Globe },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "non_profit", label: "Non-profit", icon: Heart },
  { id: "consulting", label: "Consulting", icon: LineChart },
  { id: "creative", label: "Creative", icon: Palette },
  { id: "other", label: "Other", icon: HelpCircle },
];

export default function WorkspacesPage() {
  const { user } = useAuth();
  const { toast } = useEnhancedToast();
  const router = useRouter();
  const params = useParams();
  const currentWorkspaceId = params.workspaceId as string;
  const supabase = createClientSupabaseClient();

  const [workspaces, setWorkspaces] = useState<WorkspaceWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(
    null
  );

  // New workspace form data
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    purpose: "",
    type: "",
    category: "",
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] =
    useState<WorkspaceWithStats | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete (clear owner) state
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get all workspace memberships (active and pending)
      const { data: workspaceMemberships, error } = await supabase
        .from("workspace_members")
        .select(
          `
          role,
          status,
          invited_at,
          joined_at,
          workspace_id,
          workspaces!inner (*)
        `
        )
        .eq("user_id", user.id)
        .in("status", ["active", "pending"]);

      if (error) {
        console.error("Error fetching workspaces:", error);
        toast({
          title: "Error",
          description: "Failed to load workspaces",
          variant: "destructive",
        });
        return;
      }

      if (!workspaceMemberships || workspaceMemberships.length === 0) {
        setWorkspaces([]);
        return;
      }

      // Get stats for each workspace and inviter info for invited workspaces
      const workspacesWithStats = await Promise.all(
        workspaceMemberships.map(async (membership: any) => {
          const workspace = membership.workspaces;
          const isOwner = workspace.owner_id === user.id;

          // Get member count (only for active workspaces)
          let memberCount = 0;
          let spacesCount = 0;
          let projectsCount = 0;

          if (membership.status === "active") {
            const { count: members } = await supabase
              .from("workspace_members")
              .select("*", { count: "exact", head: true })
              .eq("workspace_id", workspace.id)
              .eq("status", "active");

            const { count: spaces } = await supabase
              .from("spaces")
              .select("*", { count: "exact", head: true })
              .eq("workspace_id", workspace.id);

            const { count: projects } = await supabase
              .from("projects")
              .select("*", { count: "exact", head: true })
              .eq("workspace_id", workspace.id);

            memberCount = members || 0;
            spacesCount = spaces || 0;
            projectsCount = projects || 0;
          }

          // Get inviter info for invited workspaces (not owned by user)
          let invitedBy = undefined;
          if (!isOwner && workspace.owner_id) {
            const { data: inviterProfile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", workspace.owner_id)
              .single();

            if (inviterProfile) {
              invitedBy = inviterProfile;
            }
          }

          return {
            ...workspace,
            memberCount,
            spacesCount,
            projectsCount,
            isOwner,
            role: membership.role,
            status: membership.status,
            invitedAt: membership.invited_at,
            joinedAt: membership.joined_at,
            invitedBy,
          };
        })
      );

      // Sort workspaces: owned first, then active, then pending, then by creation date
      workspacesWithStats.sort((a, b) => {
        if (a.isOwner && !b.isOwner) return -1;
        if (!a.isOwner && b.isOwner) return 1;
        if (a.status === "active" && b.status === "pending") return -1;
        if (a.status === "pending" && b.status === "active") return 1;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setWorkspaces(workspacesWithStats);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async () => {
    if (
      !newWorkspace.name ||
      !newWorkspace.purpose ||
      !newWorkspace.type ||
      !newWorkspace.category
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create workspace
      const { data: createdWorkspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: newWorkspace.name,
          purpose: newWorkspace.purpose,
          type: newWorkspace.type,
          category: newWorkspace.category,
          owner_id: user.id,
        })
        .select()
        .single();

      if (workspaceError || !createdWorkspace) {
        throw new Error(
          workspaceError?.message || "Failed to create workspace"
        );
      }

      // Create workspace member entry for the owner
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: createdWorkspace.id,
          user_id: user.id,
          email: user.email,
          role: "owner",
          status: "active",
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error("Failed to create workspace member:", memberError);
      }

      // Create default space
      const { data: space, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name: "General",
          description: "Default space for general projects",
          icon: "hash",
          is_private: false,
          workspace_id: createdWorkspace.id,
        })
        .select()
        .single();

      if (spaceError || !space) {
        console.error("Failed to create space:", spaceError);
      } else {
        // Create space member entry
        await supabase.from("space_members").insert({
          space_id: space.id,
          user_id: user.id,
          role: "admin",
        });

        // Create default project
        await supabase.from("projects").insert({
          name: "Getting Started",
          space_id: space.id,
          workspace_id: createdWorkspace.id,
        });
      }

      toast({
        title: "Success",
        description: "Workspace created successfully",
        browserNotificationTitle: "Workspace created",
        browserNotificationBody: "Workspace created successfully",
      });

      setCreateModalOpen(false);
      setNewWorkspace({ name: "", purpose: "", type: "", category: "" });
      fetchWorkspaces();
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const switchToWorkspace = (workspaceShortId: string) => {
    if (workspaceShortId === currentWorkspaceId) return;

    setSwitchingWorkspace(workspaceShortId);
    router.push(`/${workspaceShortId}/home`);
  };

  const getPurposeIcon = (purpose: string) => {
    const purposeConfig = workspacePurposes.find((p) => p.id === purpose);
    return purposeConfig ? purposeConfig.icon : HelpCircle;
  };

  const getPurposeLabel = (purpose: string) => {
    const purposeConfig = workspacePurposes.find((p) => p.id === purpose);
    return purposeConfig ? purposeConfig.label : purpose;
  };

  const acceptInvitation = async (workspaceId: string) => {
    try {
      // First get the current user's profile to ensure we have their email
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user?.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Update the workspace member record
      const { error } = await supabase
        .from("workspace_members")
        .update({
          status: "active",
          joined_at: new Date().toISOString(),
          user_id: user?.id, // Update with actual user ID
        })
        .eq("workspace_id", workspaceId)
        .eq("email", userProfile.email); // Match by email instead of user_id

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Workspace invitation accepted",
        browserNotificationTitle: "Workspace invitation accepted",
        browserNotificationBody: "Workspace invitation accepted",
      });

      fetchWorkspaces();
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  const declineInvitation = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Workspace invitation declined",
        browserNotificationTitle: "Workspace invitation declined",
        browserNotificationBody: "Workspace invitation declined",
      });

      fetchWorkspaces();
    } catch (error: any) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    }
  };

  // Edit handler
  const openEditModal = (workspace: WorkspaceWithStats) => {
    setWorkspaceToEdit(workspace);
    setEditName(workspace.name);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!workspaceToEdit) return;
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ name: editName })
        .eq("id", workspaceToEdit.id);
      if (error) throw error;
      toast({ title: "Success", description: "Workspace name updated." });
      setEditModalOpen(false);
      setWorkspaceToEdit(null);
      fetchWorkspaces();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update name",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete (clear owner_id) handler
  const handleClearOwner = async (workspace: WorkspaceWithStats) => {
    setDeleteLoadingId(workspace.id);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ owner_id: null })
        .eq("id", workspace.id);
      if (error) throw error;
      toast({ title: "Success", description: "Workspace owner removed." });
      fetchWorkspaces();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove owner",
        variant: "destructive",
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <WorkspacesLoading />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and create new ones
          </p>
        </div>
        {/* Create Workspace Modal */}
        <Button
          variant="workspace"
          onClick={() => setCreateModalOpen(true)}
          className="text-xs p-2 h-8"
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </Button>
      </div>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workspaces found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first workspace to get started
          </p>
          <Button
            variant="workspace"
            onClick={() => setCreateModalOpen(true)}
            className="text-xs p-2 h-8"
          >
            <Plus className="h-4 w-4" />
            Create Workspace
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Invitations Section */}
          {workspaces.some((w) => w.status === "pending") && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-amber-700">
                Pending Invitations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces
                  .filter((workspace) => workspace.status === "pending")
                  .map((workspace) => {
                    const PurposeIcon = getPurposeIcon(workspace.purpose);

                    return (
                      <Card
                        key={workspace.id}
                        className="relative transition-all "
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <PurposeIcon className="h-5 w-5 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate">
                                  {workspace.name}
                                </CardTitle>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-amber-600 border-amber-300"
                                  >
                                    Invitation Pending
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div>
                            <CardDescription className="capitalize">
                              {getPurposeLabel(workspace.purpose)} •{" "}
                              {workspace.type}
                            </CardDescription>
                            {workspace.invitedBy && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Invited by{" "}
                                {workspace.invitedBy.full_name ||
                                  workspace.invitedBy.email}
                              </p>
                            )}
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Invited{" "}
                                {format(
                                  new Date(workspace.invitedAt),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => acceptInvitation(workspace.id)}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => declineInvitation(workspace.id)}
                              className="flex-1"
                            >
                              Decline
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Active Workspaces Section */}
          {workspaces.some((w) => w.status === "active") && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Workspaces</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces
                  .filter((workspace) => workspace.status === "active")
                  .map((workspace) => {
                    const PurposeIcon = getPurposeIcon(workspace.purpose);
                    const isCurrentWorkspace =
                      workspace.workspace_id === currentWorkspaceId;
                    const isSwitching =
                      switchingWorkspace === workspace.workspace_id;

                    return (
                      <Card
                        key={workspace.id}
                        className={`relative transition-all hover:shadow-lg ${
                          isCurrentWorkspace
                            ? "ring-1 workspace-ring bg-workspace-primary-50"
                            : ""
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 w-10 h-10 flex items-center justify-center workspace-component-bg text-workspace-primary font-semibold rounded-lg">
                                {workspace.name.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate">
                                  {workspace.name}
                                </CardTitle>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge
                                    variant={
                                      workspace.isOwner
                                        ? "workspace"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {workspace.isOwner ? (
                                      <>
                                        <Crown className="h-3 w-3 mr-1" />
                                        Owner
                                      </>
                                    ) : (
                                      <>
                                        <Users className="h-3 w-3 mr-1" />
                                        {workspace.role}
                                      </>
                                    )}
                                  </Badge>
                                  {isCurrentWorkspace && (
                                    <Badge
                                      variant="workspaceSecondary"
                                      className="text-xs"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Current
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:workspace-hover h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    switchToWorkspace(workspace.workspace_id)
                                  }
                                  disabled={isCurrentWorkspace || isSwitching}
                                  className="cursor-pointer hover:workspace-hover"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {isCurrentWorkspace
                                    ? "Current Workspace"
                                    : "Switch to Workspace"}
                                </DropdownMenuItem>
                                {workspace.isOwner && (
                                  <>
                                    <DropdownMenuItem
                                      className="cursor-pointer hover:workspace-hover"
                                      onClick={() => openEditModal(workspace)}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 cursor-pointer hover:workspace-hover"
                                      onClick={() =>
                                        handleClearOwner(workspace)
                                      }
                                      disabled={
                                        deleteLoadingId === workspace.id
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {deleteLoadingId === workspace.id
                                        ? "Removing..."
                                        : "Delete"}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div>
                            <CardDescription className="capitalize">
                              {getPurposeLabel(workspace.purpose)} •{" "}
                              {workspace.type}
                            </CardDescription>
                            {!workspace.isOwner && workspace.invitedBy && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Created by{" "}
                                {workspace.invitedBy.full_name ||
                                  workspace.invitedBy.email}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {workspace.memberCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Members
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {workspace.spacesCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Spaces
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {workspace.projectsCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Projects
                              </div>
                            </div>
                          </div>

                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {workspace.isOwner ? "Created" : "Joined"}{" "}
                                  {format(
                                    new Date(
                                      workspace.isOwner
                                        ? workspace.created_at
                                        : workspace.joinedAt ||
                                          workspace.invitedAt
                                    ),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-2 flex-1">
                                <Switch
                                  variant="workspace"
                                  checked={isCurrentWorkspace}
                                  disabled={isCurrentWorkspace || isSwitching}
                                  onCheckedChange={() => {
                                    if (!isCurrentWorkspace && !isSwitching) {
                                      switchToWorkspace(workspace.workspace_id);
                                    }
                                  }}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {isCurrentWorkspace ? "Active" : "Switch"}
                                </span>
                              </div>
                              {isSwitching && (
                                <Loader2 className="h-4 w-4 animate-spin text-workspace-primary" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
      <CreateWorkspaceModal
        isCreateModalOpen={createModalOpen}
        setIsCreateModalOpen={setCreateModalOpen}
      />
      {/* Edit Workspace Name Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workspace Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Workspace name"
              disabled={editLoading}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleEditSubmit}
              disabled={editLoading || !editName.trim()}
            >
              {editLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
