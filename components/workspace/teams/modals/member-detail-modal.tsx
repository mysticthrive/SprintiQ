"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { getAvatarInitials } from "@/lib/utils";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface MemberDetailModalProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export default function MemberDetailModal({
  member,
  open,
  onOpenChange,
  onRefresh,
}: MemberDetailModalProps) {
  const { toast } = useEnhancedToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    description: "",
    role_id: "",
    level_id: "",
    weekly_hours: 40,
  });

  const supabase = createClientSupabaseClient();

  // Initialize form data when member changes
  useState(() => {
    if (member) {
      setFormData({
        name: getMemberDisplayName(),
        email: member.email || "",
        description: member.description || "",
        role_id: member.role_id || "none",
        level_id: member.level_id || "none",
        weekly_hours: member.weekly_hours || 40,
      });
    }
  });

  if (!member) return null;

  const getMemberDisplayName = () => {
    if (member.is_registered && member.profile) {
      return member.profile.full_name || member.profile.email || "Unknown User";
    }
    return member.name || "Unknown User";
  };

  const getMemberEmail = () => {
    if (member.is_registered && member.profile) {
      return member.profile.email;
    }
    return member.email;
  };

  const getMemberAvatar = () => {
    if (member.is_registered && member.profile) {
      return member.profile.avatar_url || undefined;
    }
    return undefined;
  };

  const getMemberInitials = () => {
    if (member.is_registered && member.profile) {
      return getAvatarInitials(member.profile.full_name, member.profile.email);
    }
    return getAvatarInitials(null, member.email);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update team member basic info
      const { error: memberError } = await supabase
        .from("team_members")
        .update({
          name: formData.name,
          email: formData.email,
          description: formData.description,
          role_id: formData.role_id === "none" ? null : formData.role_id,
          level_id: formData.level_id === "none" ? null : formData.level_id,
          weekly_hours: formData.weekly_hours,
        })
        .eq("id", member.id);

      if (memberError) throw memberError;

      // If member is registered and has a profile, update the profile name
      if (
        member.is_registered &&
        member.user_id &&
        formData.name !== getMemberDisplayName()
      ) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.name,
          })
          .eq("id", member.user_id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
          // Don't throw here as the member update was successful
        }
      }

      toast({
        title: "Success",
        description: "Member details updated successfully",
      });

      setIsEditing(false);
      onRefresh();
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "Error",
        description: "Failed to update member details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: getMemberDisplayName(),
      email: member.email || "",
      description: member.description || "",
      role_id: member.role_id || "none",
      level_id: member.level_id || "none",
      weekly_hours: member.weekly_hours || 40,
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="workspace-text">
                Member Details
              </DialogTitle>
              <DialogDescription className="workspace-text-muted">
                Detailed information about this team member
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={loading}
                    className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                    className="workspace-primary text-white hover:workspace-primary-hover"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={getMemberAvatar()}
                alt={getMemberDisplayName()}
              />
              <AvatarFallback className="text-lg workspace-sidebar-header-gradient text-white">
                {getMemberInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold workspace-text">
                {getMemberDisplayName()}
              </h3>
              <p className="workspace-text-muted">{getMemberEmail()}</p>
              <Badge
                variant={member.is_registered ? "default" : "secondary"}
                className={`mt-1 ${
                  member.is_registered
                    ? "workspace-primary text-white"
                    : "workspace-component-bg text-workspace-primary border-workspace-primary"
                }`}
              >
                {member.is_registered ? "Registered" : "Unregistered"}
              </Badge>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium workspace-text-secondary"
              >
                Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 workspace-surface border workspace-border"
                  disabled={loading}
                />
              ) : (
                <p className="text-sm mt-1 workspace-text">
                  {getMemberDisplayName()}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium workspace-text-secondary"
              >
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 workspace-surface border workspace-border"
                  disabled={loading}
                />
              ) : (
                <p className="text-sm mt-1 workspace-text">{member.email}</p>
              )}
            </div>

            <div>
              <Label
                htmlFor="description"
                className="text-sm font-medium workspace-text-secondary"
              >
                Description
              </Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 workspace-surface border workspace-border"
                  rows={3}
                  disabled={loading}
                />
              ) : (
                <p className="text-sm mt-1 workspace-text">
                  {member.description || "No description provided"}
                </p>
              )}
            </div>

            {/* Role and Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium workspace-text-secondary">
                  Role
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.role_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role_id: value })
                    }
                  >
                    <SelectTrigger className="mt-1 workspace-surface border workspace-border">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Role</SelectItem>
                      {member.role && (
                        <SelectItem value={member.role.id}>
                          {member.role.name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <p className="text-sm mt-1 workspace-text">
                      {member.role?.name || "No Role Assigned"}
                    </p>
                    {member.role?.description && (
                      <p className="text-xs workspace-text-muted mt-1">
                        {member.role.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium workspace-text-secondary">
                  Level
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.level_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level_id: value })
                    }
                  >
                    <SelectTrigger className="mt-1 workspace-surface border workspace-border">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Level</SelectItem>
                      {member.level && (
                        <SelectItem value={member.level.id}>
                          {member.level.name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <p className="text-sm mt-1 workspace-text">
                      {member.level?.name || "No Level Assigned"}
                    </p>
                    {member.level?.description && (
                      <p className="text-xs workspace-text-muted mt-1">
                        {member.level.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Hours */}
            <div>
              <Label
                htmlFor="weekly_hours"
                className="text-sm font-medium workspace-text-secondary"
              >
                Weekly Working Hours
              </Label>
              {isEditing ? (
                <Input
                  id="weekly_hours"
                  type="number"
                  min="0"
                  max="168"
                  value={formData.weekly_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weekly_hours: parseInt(e.target.value) || 40,
                    })
                  }
                  className="mt-1 workspace-surface border workspace-border"
                  disabled={loading}
                />
              ) : (
                <p className="text-sm mt-1 workspace-text">
                  {member.weekly_hours || 40} hours per week
                </p>
              )}
            </div>

            {/* Additional Info */}
            <div>
              <Label className="text-sm font-medium workspace-text-secondary">
                Member Since
              </Label>
              <p className="text-sm mt-1 workspace-text">
                {new Date(member.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
