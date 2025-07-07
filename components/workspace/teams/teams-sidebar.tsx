"use client";

import { useState } from "react";
import type {
  Team,
  TeamMember,
  Role,
  Level,
  Profile,
} from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  Bot,
  Crown,
  Star,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { getAvatarInitials } from "@/lib/utils";
import CreateTeamModal from "./modals/create-team-modal";
import CreateMemberModal from "./modals/create-member-modal";
import EditTeamModal from "./modals/edit-team-modal";
import DeleteTeamModal from "./modals/delete-team-modal";
import AIAssistantModal from "./modals/ai-assistant-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamsSidebarProps {
  teams: Team[];
  roles: Role[];
  levels: Level[];
  profiles: Profile[];
  workspaceId: string;
  onRefresh: () => void;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  view: "dashboard" | "list";
  setView: (view: "dashboard" | "list") => void;
}

export default function TeamsSidebar({
  teams,
  roles,
  levels,
  profiles,
  workspaceId,
  onRefresh,
  selectedTeam,
  setSelectedTeam,
  view,
  setView,
}: TeamsSidebarProps) {
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
  const [teamForMember, setTeamForMember] = useState<Team | null>(null);
  const [teamForEdit, setTeamForEdit] = useState<Team | null>(null);
  const [teamForDelete, setTeamForDelete] = useState<Team | null>(null);

  const handleCreateTeam = () => {
    setIsCreateTeamModalOpen(true);
  };

  const handleAIAssistant = () => {
    setIsAIAssistantModalOpen(true);
  };

  const handleAddMember = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeam(team);
    setTeamForMember(team);
    setIsCreateMemberModalOpen(true);
  };

  const handleEditTeam = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeam(team);
    setTeamForEdit(team);
    setIsEditTeamModalOpen(true);
  };

  const handleDeleteTeam = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeam(team);
    setTeamForDelete(team);
    setIsDeleteTeamModalOpen(true);
  };

  const handleCreateMemberModalClose = (open: boolean) => {
    setIsCreateMemberModalOpen(open);
    if (!open) {
      setTeamForMember(null);
    }
  };

  const getMemberDisplayName = (member: TeamMember) => {
    if (member.is_registered && member.profile) {
      return member.profile.full_name || member.profile.email || "Unknown User";
    }
    return member.email || "Unknown User";
  };

  const getMemberAvatar = (member: TeamMember) => {
    if (member.is_registered && member.profile) {
      return member.profile.avatar_url || undefined;
    }
    return undefined;
  };

  const getMemberInitials = (member: TeamMember) => {
    if (member.is_registered && member.profile) {
      return getAvatarInitials(member.profile.full_name, member.profile.email);
    }
    return getAvatarInitials(null, member.email);
  };

  const getRoleIcon = (roleName: string) => {
    const role = roleName.toLowerCase();
    if (role.includes("manager") || role.includes("lead"))
      return <Crown className="h-3 w-3" />;
    if (role.includes("senior")) return <Star className="h-3 w-3" />;
    return <Sparkles className="h-3 w-3" />;
  };

  return (
    <div className="w-80 workspace-secondary-sidebar-bg border-r workspace-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b workspace-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 workspace-primary rounded-lg">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold workspace-text">Teams</h2>
            <p className="text-xs workspace-text-muted">
              {teams.length} team{teams.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 workspace-surface rounded-lg">
          <Button
            variant={view === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("dashboard")}
            className={`flex-1 text-xs ${
              view === "dashboard"
                ? "workspace-primary text-white"
                : "workspace-text-secondary hover:workspace-text"
            }`}
          >
            Dashboard
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className={`flex-1 text-xs ${
              view === "list"
                ? "workspace-primary text-white"
                : "workspace-text-secondary hover:workspace-text"
            }`}
          >
            List
          </Button>
        </div>
      </div>

      {/* Teams List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`group cursor-pointer p-3 rounded-lg border transition-all duration-200 ${
              selectedTeam?.id === team.id
                ? "workspace-surface border-workspace-primary shadow-sm"
                : "workspace-surface border workspace-border hover:border-workspace-primary hover:workspace-hover"
            }`}
            onClick={() => setSelectedTeam(team)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 workspace-primary rounded-md">
                  <Users className="h-3 w-3 text-white" />
                </div>
                <h3 className="font-medium workspace-text text-sm truncate">
                  {team.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleAddMember(team, e)}
                  className="h-6 w-6 text-xs workspace-text-secondary hover:workspace-hover"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-xs workspace-text-secondary hover:workspace-hover"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      onClick={(e) => handleEditTeam(team, e)}
                      className="text-xs cursor-pointer hover:workspace-hover"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteTeam(team, e)}
                      className="text-red-600 focus:text-red-600 text-xs hover:workspace-hover cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="text-xs workspace-component-bg text-workspace-primary border-workspace-primary"
              >
                {(team as any).team_members?.length || 0} members
              </Badge>
              <div className="flex -space-x-2">
                {(team as any).team_members
                  ?.slice(0, 3)
                  .map((member: any, index: number) => (
                    <Avatar
                      key={member.id}
                      className="h-6 w-6 border-2 border-white"
                    >
                      <AvatarImage
                        src={getMemberAvatar(member)}
                        alt={getMemberDisplayName(member)}
                      />
                      <AvatarFallback className="text-xs workspace-sidebar-header-gradient text-white">
                        {getMemberInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                {(team as any).team_members?.length > 3 && (
                  <div className="h-6 w-6 workspace-surface-secondary border-2 border-white rounded-full flex items-center justify-center">
                    <span className="text-xs workspace-text-secondary font-medium">
                      +{(team as any).team_members.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {team.description && (
              <p className="text-xs workspace-text-muted mt-2 line-clamp-2">
                {team.description}
              </p>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 workspace-text-muted mx-auto mb-4" />
            <h3 className="text-sm font-medium workspace-text mb-2">
              No teams yet
            </h3>
            <p className="text-xs workspace-text-muted mb-4">
              Create your first team to get started
            </p>
            <Button
              size="sm"
              onClick={handleCreateTeam}
              className="workspace-primary text-white hover:workspace-primary-hover"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Team
            </Button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t workspace-border space-y-2">
        <Button
          onClick={handleCreateTeam}
          className="w-full workspace-primary text-white hover:workspace-primary-hover"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
        <Button
          variant="outline"
          onClick={handleAIAssistant}
          className="w-full workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
          size="sm"
        >
          <Bot className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </div>

      {/* Modals */}
      <CreateTeamModal
        open={isCreateTeamModalOpen}
        onOpenChange={setIsCreateTeamModalOpen}
        onSuccess={onRefresh}
      />

      <CreateMemberModal
        open={isCreateMemberModalOpen}
        onOpenChange={handleCreateMemberModalClose}
        team={teamForMember}
        roles={roles}
        levels={levels}
        profiles={profiles}
        onSuccess={onRefresh}
      />

      <EditTeamModal
        open={isEditTeamModalOpen}
        onOpenChange={setIsEditTeamModalOpen}
        team={teamForEdit}
        onSuccess={onRefresh}
      />

      <DeleteTeamModal
        open={isDeleteTeamModalOpen}
        onOpenChange={setIsDeleteTeamModalOpen}
        team={teamForDelete}
        onSuccess={onRefresh}
      />

      <AIAssistantModal
        team={null}
        roles={roles}
        levels={levels}
        profiles={profiles}
        open={isAIAssistantModalOpen}
        onOpenChange={setIsAIAssistantModalOpen}
        onSuccess={onRefresh}
      />
    </div>
  );
}
