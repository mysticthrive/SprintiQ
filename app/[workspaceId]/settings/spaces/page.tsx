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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import {
  Globe,
  Lock,
  MoreHorizontal,
  Search,
  Plus,
  Users,
  FolderOpen,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  User,
  Shield,
  Crown,
  Loader2,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import CreateSpaceModal from "@/components/workspace/modals/create-space-modal";
import type {
  Space,
  Project,
  Workspace,
  Profile,
  Tag as TagType,
  Status,
} from "@/lib/database.types";
import {
  getStatusColor,
  tagColorClasses,
} from "@/components/workspace/views/task-detail-view/utils";

interface SpaceWithDetails extends Space {
  projects: Project[];
  owner?: Profile;
  memberCount: number;
  taskCount: number;
  statuses: Status[];
  tags: TagType[];
}

interface WorkspaceWithOwner extends Workspace {
  owner?: Profile;
}

export default function SpacesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [spaces, setSpaces] = useState<SpaceWithDetails[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceWithOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updatingSpaces, setUpdatingSpaces] = useState<Set<string>>(new Set());

  const currentUserRole = workspace?.owner_id === user?.id ? "owner" : "member";
  const canManageSpaces = currentUserRole === "owner";

  const fetchWorkspaceData = useCallback(async () => {
    try {
      console.log("Fetching workspace data for:", workspaceId);

      // Fetch workspace info first
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

      // Set workspace first (without owner for now)
      setWorkspace(workspaceData);

      // Fetch spaces with their projects - simplified query
      const { data: spacesData, error: spacesError } = await supabase
        .from("spaces")
        .select("*")
        .eq("workspace_id", workspaceData.id)
        .order("created_at", { ascending: false });

      if (spacesError) {
        console.error("Spaces error:", spacesError);
        throw spacesError;
      }

      console.log("Spaces found:", spacesData?.length || 0);

      // Fetch projects for each space separately to avoid join issues
      const spacesWithProjects = await Promise.all(
        (spacesData || []).map(async (space) => {
          try {
            // Get projects for this space
            const { data: projects, error: projectsError } = await supabase
              .from("projects")
              .select("*")
              .eq("space_id", space.id);

            if (projectsError) {
              console.error(
                "Projects error for space",
                space.id,
                ":",
                projectsError
              );
              return {
                ...space,
                projects: [],
                memberCount: 0,
                taskCount: 0,
                statuses: [],
                tags: [],
              };
            }

            // Optional: Get additional counts (with fallbacks)
            let memberCount = 0;
            let taskCount = 0;
            let statuses: Status[] = [];
            let tags: TagType[] = [];

            // Only try to get member count for private spaces
            if (space.is_private) {
              try {
                const { data: spaceMembers } = await supabase
                  .from("space_members")
                  .select("*")
                  .eq("space_id", space.id);
                memberCount = (spaceMembers || []).length;
              } catch (error) {
                console.warn(
                  "Could not fetch member count for space",
                  space.id
                );
              }
            }

            // Try to get task count
            if (projects && projects.length > 0) {
              try {
                const { count } = await supabase
                  .from("tasks")
                  .select("*", { count: "exact", head: true })
                  .in(
                    "project_id",
                    projects.map((p) => p.id)
                  );
                taskCount = count || 0;
              } catch (error) {
                console.warn("Could not fetch task count for space", space.id);
              }
            }

            // Try to get statuses
            try {
              const { data: statusesData } = await supabase
                .from("statuses")
                .select("*")
                .eq("space_id", space.id);
              statuses = statusesData || [];
            } catch (error) {
              console.warn("Could not fetch statuses for space", space.id);
            }

            // Try to get unique tags used in this space
            if (projects && projects.length > 0) {
              try {
                const { data: taskTagsData } = await supabase
                  .from("task_tags")
                  .select(
                    `
                    tag_id,
                    tags(id, name, color),
                    tasks!inner(project_id)
                  `
                  )
                  .in(
                    "tasks.project_id",
                    projects.map((p) => p.id)
                  );

                // Extract unique tags
                const uniqueTagsMap = new Map();
                (taskTagsData || []).forEach((tt: any) => {
                  const tag = tt.tags;
                  if (tag && !uniqueTagsMap.has(tag.id)) {
                    uniqueTagsMap.set(tag.id, tag);
                  }
                });
                tags = Array.from(uniqueTagsMap.values()) as TagType[];
              } catch (error) {
                console.warn("Could not fetch tags for space", space.id);
              }
            }

            return {
              ...space,
              projects: projects || [],
              memberCount,
              taskCount,
              statuses,
              tags,
            };
          } catch (spaceError) {
            console.error("Error processing space", space.id, ":", spaceError);
            return {
              ...space,
              projects: [],
              memberCount: 0,
              taskCount: 0,
              statuses: [],
              tags: [],
            };
          }
        })
      );

      console.log("Spaces enriched successfully");
      setSpaces(spacesWithProjects);
    } catch (error: any) {
      console.error("Error fetching spaces data:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      toast({
        title: "Error loading spaces",
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

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch =
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVisibility =
      selectedVisibility === "all" ||
      (selectedVisibility === "public" && !space.is_private) ||
      (selectedVisibility === "private" && space.is_private);

    return matchesSearch && matchesVisibility;
  });

  const toggleSpaceVisibility = async (
    spaceId: string,
    currentVisibility: boolean
  ) => {
    setUpdatingSpaces((prev) => new Set([...prev, spaceId]));

    try {
      const { error } = await supabase
        .from("spaces")
        .update({ is_private: !currentVisibility })
        .eq("id", spaceId);

      if (error) throw error;

      // Update local state
      setSpaces((prev) =>
        prev.map((space) =>
          space.id === spaceId
            ? { ...space, is_private: !currentVisibility }
            : space
        )
      );

      toast({
        title: "Space visibility updated",
        description: `Space is now ${
          !currentVisibility ? "private" : "public"
        }.`,
        browserNotificationTitle: "Space visibility updated",
        browserNotificationBody: `Space is now ${
          !currentVisibility ? "private" : "public"
        }.`,
      });
    } catch (error: any) {
      console.error("Error updating space visibility:", error);
      toast({
        title: "Error updating space",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdatingSpaces((prev) => {
        const newSet = new Set(prev);
        newSet.delete(spaceId);
        return newSet;
      });
    }
  };

  const deleteSpace = async (spaceId: string, spaceName: string) => {
    setUpdatingSpaces((prev) => new Set([...prev, spaceId]));

    try {
      // Check if space has projects
      const space = spaces.find((s) => s.id === spaceId);
      if (space && space.projects.length > 0) {
        toast({
          title: "Cannot delete space",
          description: "Please delete all projects in this space first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("spaces")
        .delete()
        .eq("id", spaceId);

      if (error) throw error;

      // Update local state
      setSpaces((prev) => prev.filter((space) => space.id !== spaceId));

      toast({
        title: "Space deleted",
        description: `"${spaceName}" has been deleted successfully.`,
        browserNotificationTitle: "Space deleted",
        browserNotificationBody: `"${spaceName}" has been deleted successfully.`,
      });
    } catch (error: any) {
      console.error("Error deleting space:", error);
      toast({
        title: "Error deleting space",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdatingSpaces((prev) => {
        const newSet = new Set(prev);
        newSet.delete(spaceId);
        return newSet;
      });
    }
  };

  const handleSpaceCreated = async (
    newSpace: Space & { projects: Project[] }
  ) => {
    // Refresh the spaces list to get updated data
    await fetchWorkspaceData();
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
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
            <h1 className="text-2xl font-bold">Spaces</h1>
            <p className="text-gray-600">
              Manage spaces in your workspace. Spaces help organize projects and
              control access.
            </p>
          </div>
          {canManageSpaces && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="workspace"
              className="text-xs p-2 h-8"
            >
              <Plus className="h-4 w-4" />
              Create Space
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedVisibility}
              onValueChange={setSelectedVisibility}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All spaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All spaces</SelectItem>
                <SelectItem value="public">Public spaces</SelectItem>
                <SelectItem value="private">Private spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Spaces Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            Spaces ({filteredSpaces.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Overview of all spaces in your workspace with their projects and
            settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSpaces.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {searchQuery || selectedVisibility !== "all"
                  ? "No spaces found"
                  : "No spaces yet"}
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                {searchQuery || selectedVisibility !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first space to organize your projects"}
              </p>
              {canManageSpaces &&
                !searchQuery &&
                selectedVisibility === "all" && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="workspace"
                    className="text-xs p-2 h-8"
                  >
                    <Plus className="h-4 w-4" />
                    Create Space
                  </Button>
                )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Space</TableHead>
                  <TableHead className="text-sm">Visibility</TableHead>
                  <TableHead className="text-sm">Projects</TableHead>
                  <TableHead className="text-sm">Tasks</TableHead>
                  <TableHead className="text-sm">Members</TableHead>
                  <TableHead className="text-sm">Statuses</TableHead>
                  <TableHead className="text-sm">Tags</TableHead>
                  <TableHead className="text-sm">Created</TableHead>
                  {canManageSpaces && (
                    <TableHead className="w-[50px] text-sm">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium bg-${space.icon}-500`}
                        >
                          {space.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {space.name}
                          </div>
                          {space.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {space.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={space.is_private ? "secondary" : "outline"}
                        className="flex items-center gap-1 w-fit text-xs"
                      >
                        {space.is_private ? (
                          <>
                            <Lock className="h-4 w-4" />
                            Private
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4" />
                            Public
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-xs">{space.projects.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{space.taskCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-xs">
                          {space.is_private
                            ? space.memberCount
                            : "All workspace members"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs text-xs">
                        {space.statuses.slice(0, 3).map((status) => (
                          <Badge
                            key={status.id}
                            variant="outline"
                            className={`text-xs ${getStatusColor(status)}`}
                          >
                            {status.name}
                          </Badge>
                        ))}
                        {space.statuses.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{space.statuses.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs text-xs">
                        {space.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className={`text-xs ${tagColorClasses[tag.color]}`}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {space.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{space.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {format(new Date(space.created_at), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    {canManageSpaces && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {updatingSpaces.has(space.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                toggleSpaceVisibility(
                                  space.id,
                                  space.is_private
                                )
                              }
                              disabled={updatingSpaces.has(space.id)}
                            >
                              {space.is_private ? (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Make Public
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Make Private
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600 focus:text-red-600"
                                  disabled={updatingSpaces.has(space.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Space
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Space
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {space.name}"? This action cannot be undone.
                                    {space.projects.length > 0 && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                        <strong>Warning:</strong> This space
                                        contains {space.projects.length}{" "}
                                        project(s). Please delete all projects
                                        first.
                                      </div>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="text-xs">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteSpace(space.id, space.name)
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-xs"
                                    disabled={space.projects.length > 0}
                                  >
                                    Delete Space
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

      {/* Create Space Modal */}
      {workspace && (
        <CreateSpaceModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={handleSpaceCreated}
          workspace={workspace}
        />
      )}
    </div>
  );
}
