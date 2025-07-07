"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Loader2, X, Search } from "lucide-react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Workspace, Space, Project } from "@/lib/database.types";
import { createEventServer } from "@/app/[workspaceId]/actions/events";
import JiraIntegrationModal from "./integration-modal";

// Space icons options
const spaceIcons = [
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-500" },
  { value: "pink", label: "Pink", color: "bg-pink-500" },
];

interface CreateSpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newSpace: Space & { projects: Project[] }) => void;
  workspace: Workspace;
  spaces?: Space[];
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function CreateSpaceModal({
  open,
  onOpenChange,
  onSuccess,
  workspace,
  spaces = [],
}: CreateSpaceModalProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("blue");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(
    []
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [enableIntegration, setEnableIntegration] = useState(false);
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [pendingSpaceData, setPendingSpaceData] = useState<{
    name: string;
    description: string;
    icon: string;
    isPrivate: boolean;
    selectedMembers: Set<string>;
  } | null>(null);
  const [newlyCreatedSpace, setNewlyCreatedSpace] = useState<Space | null>(
    null
  );

  // Fetch workspace members
  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      if (!open) {
        // Reset state when modal closes
        setWorkspaceMembers([]);
        setSelectedMembers(new Set());
        setCurrentUser(null);
        return;
      }

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError);
          return;
        }

        if (user) {
          setCurrentUser({ id: user.id, email: user.email || "" });
          // Automatically add current user to selected members
          setSelectedMembers(new Set([user.id]));
        }

        // First get workspace members
        const { data: members, error: membersError } = await supabase
          .from("workspace_members")
          .select("id, user_id, email, role")
          .eq("workspace_id", workspace.id)
          .eq("status", "active");

        if (membersError) {
          console.error("Error fetching workspace members:", membersError);
          return;
        }

        if (!members || members.length === 0) {
          setWorkspaceMembers([]);
          return;
        }

        // Then get profiles for these members
        const userIds = members.map((m) => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          // Still set members without profiles
          setWorkspaceMembers(
            members.map((member) => ({ ...member, profile: undefined }))
          );
          return;
        }

        // Combine members with their profiles
        const membersWithProfiles = members.map((member) => {
          const profile = profiles?.find((p) => p.id === member.user_id);
          return {
            ...member,
            profile: profile
              ? {
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url,
                }
              : undefined,
          };
        });

        setWorkspaceMembers(membersWithProfiles);
      } catch (error) {
        console.error("Unexpected error:", error);
        setWorkspaceMembers([]);
      }
    };

    fetchWorkspaceMembers();
  }, [open, workspace.id]); // Use workspace.id instead of workspaceId

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      // Don't allow removing current user
      if (currentUser && userId === currentUser.id) return;
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const filteredMembers = workspaceMembers.filter((member) => {
    if (!searchQuery) return true;

    const email = member.email?.toLowerCase() || "";
    const name = member.profile?.full_name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    return email.includes(query) || name.includes(query);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Always create the space first
    await createSpace();
  };

  const createSpace = async () => {
    setIsLoading(true);

    try {
      // Create the space
      const { data: space, error } = await supabase
        .from("spaces")
        .insert({
          name: pendingSpaceData?.name || name,
          description: pendingSpaceData?.description || description,
          icon: pendingSpaceData?.icon || icon,
          is_private: pendingSpaceData?.isPrivate || isPrivate,
          workspace_id: workspace.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create a default project for the space
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: "Getting Started",
          space_id: space.id,
          workspace_id: workspace.id,
        })
        .select()
        .single();

      if (projectError) {
        throw projectError;
      }

      // Handle space members if it's a private space
      const membersToAdd = pendingSpaceData?.selectedMembers || selectedMembers;
      if ((pendingSpaceData?.isPrivate || isPrivate) && membersToAdd.size > 0) {
        const spaceMembers = Array.from(membersToAdd).map((userId) => ({
          space_id: space.id,
          user_id: userId,
          role: userId === currentUser?.id ? "admin" : "member",
        }));

        const { error: membersError } = await supabase
          .from("space_members")
          .insert(spaceMembers);

        if (membersError) {
          console.error("Error adding space members:", membersError);
          // Don't throw error here as space was created successfully
        }
      }

      // Create event for space creation
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await createEventServer({
          type: "created",
          entityType: "space",
          entityId: space.id,
          entityName: space.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          description: `Created space "${space.name}"`,
          metadata: {
            icon: space.icon,
            isPrivate: space.is_private,
            memberCount: membersToAdd.size,
          },
        });
      }

      const {
        data: { profile },
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (
        profile?.email_notifications === "All" ||
        (profile?.email_notifications === "Default" &&
          ["space"].includes("space") &&
          ["created", "updated", "deleted"].includes("created"))
      ) {
        try {
          const response = await fetch("/api/send-email-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user?.id,
              eventType: "created",
              entityType: "space",
              entityName: space.name,
              description: `Created space "${space.name}"`,
              workspaceId: workspace.id,
            }),
          });

          const result = await response.json();

          if (result.success) {
            console.log("Test email sent successfully");
          } else {
            console.error("Failed to send test email");
          }
        } catch (error) {
          console.error("Failed to send test email");
        }
      }

      toast({
        title: "Space created",
        description: `${space.name} space has been created successfully.`,
        browserNotificationTitle: "Space created",
        browserNotificationBody: `${space.name} space has been created successfully.`,
      });

      // Reset form
      setName("");
      setDescription("");
      setIcon("blue");
      setIsPrivate(false);
      setSelectedMembers(new Set());
      setSearchQuery("");
      setEnableIntegration(false);
      setPendingSpaceData(null);
      setNewlyCreatedSpace(space);

      // Close modal
      onOpenChange(false);

      // Create the space with projects object
      const newSpaceWithProjects = {
        ...space,
        projects: [project],
      };

      // Callback with the new space and its project
      if (onSuccess) {
        onSuccess(newSpaceWithProjects);
      }

      // Dispatch custom event for sidebar synchronization
      window.dispatchEvent(
        new CustomEvent("spaceCreated", {
          detail: { space: newSpaceWithProjects },
        })
      );

      // If integration is enabled, open the integration modal with the new space
      if (enableIntegration) {
        // Wait a bit for the space to be available in the list
        setTimeout(() => {
          setIntegrationModalOpen(true);
        }, 100);
      }
    } catch (error: any) {
      console.error("Error creating space:", error);
      toast({
        title: "Error creating space",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrationSuccess = (integration: any) => {
    // Close the integration modal
    setIntegrationModalOpen(false);

    // Clear the newly created space state
    setNewlyCreatedSpace(null);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a Space</DialogTitle>
          <DialogDescription>
            A Space represents teams, departments, or groups, each with its own
            Lists, workflows, and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div>
              <Label>Icon & name</Label>
              <div className="flex items-center gap-2 mt-1">
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="w-12 h-12 p-0 justify-center border-2">
                    <div
                      className={`w-8 h-8 ${
                        spaceIcons.find((i) => i.value === icon)?.color ||
                        "bg-blue-500"
                      } rounded-md flex items-center justify-center text-white font-medium`}
                    >
                      {name.charAt(0).toUpperCase() || "S"}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {spaceIcons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 ${icon.color} rounded-sm mr-2`}
                          ></div>
                          {icon.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marketing, Engineering, HR"
                  className="flex-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">
                Description{" "}
                <span className="text-gray-500 text-sm">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this space for?"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private">Make Private</Label>
                <p className="text-sm text-gray-500">
                  Only you and invited members have access
                </p>
              </div>
              <Switch
                id="private"
                variant="workspace"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="integration">Enable Integration</Label>
                <p className="text-sm text-gray-500">
                  Connect this space to an external project management platform
                </p>
              </div>
              <Switch
                id="integration"
                variant="workspace"
                checked={enableIntegration}
                onCheckedChange={setEnableIntegration}
              />
            </div>

            {isPrivate && (
              <div className="space-y-2">
                <Label>Share only with:</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.from(selectedMembers).map((memberId) => {
                    const member = workspaceMembers.find(
                      (m) => m.user_id === memberId
                    );
                    if (!member) return null;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center bg-gray-100 rounded-full pl-1 pr-2 py-1"
                      >
                        <Avatar className="h-6 w-6 mr-1">
                          <AvatarImage src={member.profile?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.profile?.full_name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm mr-1">
                          {member.profile?.full_name || member.email}
                        </span>
                        {/* Don't allow removing current user */}
                        {currentUser?.id !== member.user_id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 rounded-full hover:bg-gray-200"
                            onClick={() => toggleMember(member.user_id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    variant="workspace"
                    placeholder="Search or enter email..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-48 border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No members found
                      </div>
                    ) : (
                      filteredMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                          onClick={() => toggleMember(member.user_id)}
                        >
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage
                                src={member.profile?.avatar_url || ""}
                              />
                              <AvatarFallback>
                                {getInitials(member.profile?.full_name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {member.profile?.full_name || "Unnamed"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.email}
                              </div>
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedMembers.has(member.user_id)}
                            onCheckedChange={() => toggleMember(member.user_id)}
                            className="h-5 w-5"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="workspace" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Space"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <JiraIntegrationModal
        open={integrationModalOpen}
        onOpenChange={setIntegrationModalOpen}
        onSuccess={handleIntegrationSuccess}
        workspace={workspace}
        spaces={spaces}
        newlyCreatedSpace={newlyCreatedSpace || undefined}
      />
    </Dialog>
  );
}
