import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Goal, Plus, X, Users, User } from "lucide-react";
import { UserStory, TeamMember } from "@/types";
import { fetchTeamsForAssignment } from "@/lib/team-service";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface EditStoryModalProps {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (story: UserStory) => void;
}

export default function EditStoryModal({
  story,
  isOpen,
  onClose,
  onSave,
}: EditStoryModalProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { toast } = useEnhancedToast();

  const [editingStory, setEditingStory] = useState<UserStory | null>(story);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

  // Update editingStory when story prop changes
  if (story?.id !== editingStory?.id) {
    setEditingStory(story);
  }

  // Load team members when modal opens
  useEffect(() => {
    if (isOpen && workspaceId) {
      loadTeamMembers();
    }
  }, [isOpen, workspaceId]);

  const loadTeamMembers = async () => {
    setIsLoadingTeamMembers(true);
    try {
      const { teamMembers: members, error } = await fetchTeamsForAssignment(
        workspaceId
      );

      if (error) {
        console.error("Error loading team members:", error);
        toast({
          title: "Error loading team members",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setTeamMembers(members);
      console.log(`Loaded ${members.length} team members for assignment`);
    } catch (error) {
      console.error("Exception loading team members:", error);
      toast({
        title: "Error loading team members",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTeamMembers(false);
    }
  };

  const handleSave = () => {
    if (!editingStory) return;
    onSave(editingStory);
  };

  const getAvatarInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0]?.toUpperCase() || "";
    }
    if (email) {
      return email[0]?.toUpperCase() || "";
    }
    return "?";
  };

  const getMemberDisplayName = (member: TeamMember) => {
    return member.name || member.email || "Unknown Member";
  };

  const getMemberDetails = (member: TeamMember) => {
    const details = [];
    if (member.role) details.push(member.role);
    if (member.level) details.push(member.level);
    if (member.availability) details.push(`${member.availability}h/week`);
    return details.join(" • ");
  };

  if (!editingStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Story</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={editingStory.title}
              onChange={(e) =>
                setEditingStory({ ...editingStory, title: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={editingStory.role}
                onChange={(e) =>
                  setEditingStory({ ...editingStory, role: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={editingStory.priority}
                onValueChange={(value) =>
                  setEditingStory({
                    ...editingStory,
                    priority: value as "Low" | "Medium" | "High" | "Critical",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="Low"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Goal className="mr-2 h-4 w-4 text-green-500" /> Low
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="Medium"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Goal className="mr-2 h-4 w-4 text-blue-500" /> Medium
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="High"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Goal className="mr-2 h-4 w-4 text-yellow-500" /> High
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="Critical"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Goal className="mr-2 h-4 w-4 text-red-500" /> Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team Member Assignment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Team Member
            </Label>
            <Select
              value={editingStory.assignedTeamMember?.id || "unassigned"}
              onValueChange={(value) => {
                if (value === "unassigned") {
                  // Clear assignment
                  setEditingStory({
                    ...editingStory,
                    assignedTeamMember: undefined,
                  });
                } else {
                  // Set assignment
                  const selectedMember = teamMembers.find(
                    (member) => member.id === value
                  );
                  if (selectedMember) {
                    setEditingStory({
                      ...editingStory,
                      assignedTeamMember: selectedMember,
                    });
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member or leave unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="unassigned"
                  className="hover:workspace-hover cursor-pointer"
                >
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    Unassigned
                  </div>
                </SelectItem>
                {isLoadingTeamMembers ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                      Loading team members...
                    </div>
                  </SelectItem>
                ) : (
                  teamMembers.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                      className="hover:workspace-hover cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getAvatarInitials(member.name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {getMemberDisplayName(member)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getMemberDetails(member)}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Show current assignment details */}
            {editingStory.assignedTeamMember && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        editingStory.assignedTeamMember.avatar_url || undefined
                      }
                    />
                    <AvatarFallback className="text-sm">
                      {getAvatarInitials(
                        editingStory.assignedTeamMember.name,
                        editingStory.assignedTeamMember.email
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {getMemberDisplayName(editingStory.assignedTeamMember)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getMemberDetails(editingStory.assignedTeamMember)}
                    </div>
                    {editingStory.assignedTeamMember.skills &&
                      editingStory.assignedTeamMember.skills.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">
                            Skills:{" "}
                          </span>
                          <span className="text-xs text-gray-700">
                            {editingStory.assignedTeamMember.skills.join(", ")}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Want</Label>
            <Textarea
              value={editingStory.want}
              onChange={(e) =>
                setEditingStory({ ...editingStory, want: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Benefit</Label>
            <Textarea
              value={editingStory.benefit}
              onChange={(e) =>
                setEditingStory({ ...editingStory, benefit: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Story Points</Label>
            <Select
              value={editingStory.storyPoints?.toString()}
              onValueChange={(value) =>
                setEditingStory({
                  ...editingStory,
                  storyPoints: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 8, 13].map((points) => (
                  <SelectItem key={points} value={points.toString()}>
                    {points} points
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Business Value (1-5)</Label>
            <Select
              value={editingStory.businessValue?.toString()}
              onValueChange={(value) =>
                setEditingStory({
                  ...editingStory,
                  businessValue: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Acceptance Criteria</Label>
            {editingStory.acceptanceCriteria.map(
              (criteria: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={criteria}
                    onChange={(e) => {
                      const newCriteria = [...editingStory.acceptanceCriteria];
                      newCriteria[index] = e.target.value;
                      setEditingStory({
                        ...editingStory,
                        acceptanceCriteria: newCriteria,
                      });
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newCriteria =
                        editingStory.acceptanceCriteria.filter(
                          (_: string, i: number) => i !== index
                        );
                      setEditingStory({
                        ...editingStory,
                        acceptanceCriteria: newCriteria,
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingStory({
                  ...editingStory,
                  acceptanceCriteria: [...editingStory.acceptanceCriteria, ""],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Criterion
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {editingStory.tags?.map((tag: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      const newTags = editingStory.tags?.filter(
                        (_: string, i: number) => i !== index
                      );
                      setEditingStory({
                        ...editingStory,
                        tags: newTags,
                      });
                    }}
                  />
                </Badge>
              ))}
              <Input
                className="w-24 h-6"
                placeholder="Add tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    const newTag = e.currentTarget.value.trim();
                    if (newTag) {
                      setEditingStory({
                        ...editingStory,
                        tags: [...(editingStory.tags || []), newTag],
                      });
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="workspace" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
