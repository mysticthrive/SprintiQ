"use client";

import { useState } from "react";
import type {
  Team,
  TeamMember,
  Role,
  Level,
  Profile,
} from "@/lib/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Bot, Crown, Star, Sparkles } from "lucide-react";
import { getAvatarInitials } from "@/lib/utils";
import MemberDetailModal from "./modals/member-detail-modal";
import CreateMemberModal from "./modals/create-member-modal";
import AIAssistantModal from "./modals/ai-assistant-modal";

interface TeamsListProps {
  teams: Team[];
  roles: Role[];
  levels: Level[];
  profiles: Profile[];
  workspaceId: string;
  onRefresh: () => void;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
}

export default function TeamsList({
  teams,
  roles,
  levels,
  profiles,
  workspaceId,
  onRefresh,
  selectedTeam,
  setSelectedTeam,
}: TeamsListProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isMemberDetailModalOpen, setIsMemberDetailModalOpen] = useState(false);
  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsMemberDetailModalOpen(true);
  };

  const handleCreateMember = (team: Team) => {
    setSelectedTeam(team);
    setIsCreateMemberModalOpen(true);
  };

  const handleAIAssistant = (team: Team) => {
    setSelectedTeam(team);
    setIsAIAssistantModalOpen(true);
  };

  const getMemberDisplayName = (member: TeamMember) => {
    if (member.is_registered && member.profile) {
      return member.profile.full_name || member.profile.email || "Unknown User";
    }
    return member.name || "Unknown User";
  };

  const getMemberEmail = (member: TeamMember) => {
    if (member.is_registered && member.profile) {
      return member.profile.email;
    }
    return member.email;
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
    <div className="h-full overflow-y-auto workspace-header-bg">
      <div className="p-3 border-b workspace-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 workspace-component-bg rounded-md items-center flex justify-center">
              <Users className="w-4 w-4 workspace-component-active-color" />
            </div>
            <div>
              <span className="text-sm font-bold">Teams List</span>
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-[10px] workspace-header-text">
                  Manage your teams and their members with precision
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-3">
        {selectedTeam ? (
          <Card className="workspace-surface border workspace-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 workspace-primary rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold workspace-text">
                      {selectedTeam.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="workspace-component-bg text-workspace-primary border-workspace-primary"
                    >
                      {(selectedTeam as any).team_members?.length || 0} members
                    </Badge>
                  </div>
                  {selectedTeam.description && (
                    <CardDescription className="workspace-text-muted ml-11">
                      {selectedTeam.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTeam(null)}
                    className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
                  >
                    ← Back to Teams
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIAssistant(selectedTeam)}
                    className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateMember(selectedTeam)}
                    className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {(selectedTeam as any).team_members &&
              (selectedTeam as any).team_members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(selectedTeam as any).team_members.map(
                    (member: any, memberIndex: number) => (
                      <Card
                        key={member.id}
                        className="group/member cursor-pointer hover:shadow-md transition-all duration-300 workspace-surface border workspace-border hover:border-workspace-primary"
                        onClick={() => handleMemberClick(member)}
                        style={{
                          animationDelay: `${memberIndex * 50}ms`,
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={getMemberAvatar(member)}
                                alt={getMemberDisplayName(member)}
                              />
                              <AvatarFallback className="workspace-sidebar-header-gradient text-white font-semibold">
                                {getMemberInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium workspace-text truncate">
                                  {getMemberDisplayName(member)}
                                </h3>
                                {member.is_registered ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700 border-green-200 text-xs"
                                  >
                                    Registered
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-orange-200 text-orange-700 text-xs"
                                  >
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm workspace-text-muted truncate">
                                {getMemberEmail(member)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                  {getRoleIcon(member.role?.name || "Member")}
                                  <span className="text-xs workspace-text-secondary">
                                    {member.role?.name || "Member"}
                                  </span>
                                </div>
                                <span className="text-xs workspace-text-muted">
                                  •
                                </span>
                                <span className="text-xs workspace-text-secondary">
                                  {member.level?.name || "Mid-Level"}
                                </span>
                                <span className="text-xs workspace-text-muted">
                                  •
                                </span>
                                <span className="text-xs workspace-text-secondary">
                                  {member.weekly_hours || 40}h/week
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 workspace-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium workspace-text mb-2">
                    No members yet
                  </h3>
                  <p className="workspace-text-muted mb-4">
                    Add team members to get started
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => handleCreateMember(selectedTeam)}
                      className="workspace-primary text-white hover:workspace-primary-hover"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAIAssistant(selectedTeam)}
                      className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      AI Assistant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, index) => (
              <Card
                key={team.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-300 workspace-surface border workspace-border hover:border-workspace-primary"
                onClick={() => setSelectedTeam(team)}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 workspace-primary rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="workspace-text group-hover:text-workspace-primary transition-colors duration-200">
                        {team.name}
                      </CardTitle>
                      <CardDescription className="workspace-text-muted">
                        {(team as any).team_members?.length || 0} members
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {team.description && (
                    <p className="text-sm workspace-text-muted mb-4">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 workspace-primary rounded-full" />
                      <span className="text-xs workspace-text-secondary">
                        Active Team
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 workspace-text-muted hover:workspace-text"
                    >
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {teams.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="h-16 w-16 workspace-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-medium workspace-text mb-2">
                  No teams yet
                </h3>
                <p className="workspace-text-muted mb-6">
                  Create your first team to start managing members
                </p>
                <Button className="workspace-primary text-white hover:workspace-primary-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <MemberDetailModal
        member={selectedMember}
        open={isMemberDetailModalOpen}
        onOpenChange={setIsMemberDetailModalOpen}
        onRefresh={onRefresh}
      />

      <CreateMemberModal
        team={selectedTeam}
        roles={roles}
        levels={levels}
        profiles={profiles}
        open={isCreateMemberModalOpen}
        onOpenChange={setIsCreateMemberModalOpen}
        onSuccess={onRefresh}
      />

      <AIAssistantModal
        team={selectedTeam}
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
