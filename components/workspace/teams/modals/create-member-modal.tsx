"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { Team, Role, Level, Profile } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreateMemberModalProps {
  team: Team | null;
  roles: Role[];
  levels: Level[];
  profiles: Profile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateMemberModal({
  team,
  roles,
  levels,
  profiles,
  open,
  onOpenChange,
  onSuccess,
}: CreateMemberModalProps) {
  const { toast } = useEnhancedToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    isRegistered: "unregistered",
    selectedUserId: "",
    roleId: "",
    levelId: "",
    description: "",
    weeklyHours: 40,
  });

  const supabase = createClientSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team) {
      toast({
        title: "Error",
        description: "No team selected",
        variant: "destructive",
      });
      return;
    }

    if (!formData.roleId || !formData.levelId) {
      toast({
        title: "Error",
        description: "Please select a role and level",
        variant: "destructive",
      });
      return;
    }

    if (formData.isRegistered === "registered" && !formData.selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a registered user",
        variant: "destructive",
      });
      return;
    }

    if (formData.isRegistered === "unregistered" && !formData.email) {
      toast({
        title: "Error",
        description: "Please enter an email for unregistered user",
        variant: "destructive",
      });
      return;
    }

    if (formData.isRegistered === "unregistered" && !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for unregistered user",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const memberData = {
        team_id: team.id,
        name:
          formData.name ||
          (formData.isRegistered === "registered"
            ? profiles.find((p) => p.id === formData.selectedUserId)
                ?.full_name || "Unknown User"
            : formData.email?.split("@")[0] || "Unknown User"),
        role_id: formData.roleId,
        level_id: formData.levelId,
        description: formData.description || null,
        is_registered: formData.isRegistered === "registered",
        user_id:
          formData.isRegistered === "registered"
            ? formData.selectedUserId
            : null,
        email: formData.isRegistered === "unregistered" ? formData.email : null,
        weekly_hours: formData.weeklyHours,
      };

      const { error } = await supabase.from("team_members").insert(memberData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member added successfully",
      });

      setFormData({
        name: "",
        email: "",
        isRegistered: "unregistered",
        selectedUserId: "",
        roleId: "",
        levelId: "",
        description: "",
        weeklyHours: 40,
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating member:", error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = (value: string) => {
    setFormData({
      ...formData,
      isRegistered: value,
      selectedUserId: "",
      email: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Add a new member to {team?.name || "the team"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* User Type Selection */}
            <div className="grid gap-2">
              <Label>User Type</Label>
              <RadioGroup
                value={formData.isRegistered}
                onValueChange={handleUserTypeChange}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="registered"
                    variant="workspace"
                    id="registered"
                  />
                  <Label htmlFor="registered">Registered User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="unregistered"
                    variant="workspace"
                    id="unregistered"
                  />
                  <Label htmlFor="unregistered">Unregistered User</Label>
                </div>
              </RadioGroup>
            </div>

            {/* User Selection/Email Input */}
            {formData.isRegistered === "registered" ? (
              <div className="grid gap-2">
                <Label htmlFor="user">Select User</Label>
                <Select
                  value={formData.selectedUserId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, selectedUserId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a registered user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback className="text-xs font-bold text-workspace-primary workspace-component-bg">
                              {profile.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {profile.full_name || profile.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, roleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level Selection */}
            <div className="grid gap-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.levelId}
                onValueChange={(value) =>
                  setFormData({ ...formData, levelId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weekly Hours */}
            <div className="grid gap-2">
              <Label htmlFor="weeklyHours">Weekly Working Hours</Label>
              <Input
                id="weeklyHours"
                type="number"
                min="0"
                max="168"
                value={formData.weeklyHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weeklyHours: parseInt(e.target.value) || 40,
                  })
                }
                placeholder="40"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Number of hours this member works per week (0-168)
              </p>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter member description"
                disabled={loading}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="workspace" disabled={loading}>
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
