import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X,
  Plus,
  UserPlus,
  Users,
  Building,
  Search,
  Mail,
  Clock,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TEAM_ROLES, TEAM_LEVELS, ROLE_SKILLS, type TeamMember } from "@/types";
import {
  fetchTeamsForAssignment,
  type TeamMemberForAssignment,
} from "@/lib/team-service";
import { useParams } from "next/navigation";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamMemberFormProps {
  teamMembers: TeamMember[];
  onTeamMembersChange: (members: TeamMember[]) => void;
}

export default function TeamMemberForm({
  teamMembers,
  onTeamMembersChange,
}: TeamMemberFormProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { toast } = useEnhancedToast();

  const [mode, setMode] = useState<"create" | "select">("create");
  const [existingTeamMembers, setExistingTeamMembers] = useState<
    TeamMemberForAssignment[]
  >([]);
  const [selectedExistingMembers, setSelectedExistingMembers] = useState<
    Set<string>
  >(new Set());
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: "",
    email: "",
    role: "",
    level: "Mid",
    skills: [],
    availability: 40,
  });
  const [newSkill, setNewSkill] = useState("");

  // Load existing teams on component mount
  useEffect(() => {
    if (mode === "select") {
      loadExistingTeams();
    }
  }, [mode, workspaceId]);

  const loadExistingTeams = async () => {
    setIsLoadingExisting(true);
    try {
      console.log("Loading existing teams for workspace:", workspaceId);

      // Validate workspace ID
      if (!workspaceId || workspaceId.trim() === "") {
        console.error("Invalid workspace ID:", workspaceId);
        toast({
          title: "Error loading teams",
          description: "Invalid workspace ID",
          variant: "destructive",
        });
        return;
      }

      const { teamMembers: existingMembers, error } =
        await fetchTeamsForAssignment(workspaceId);

      if (error) {
        console.error("Error loading teams:", error);
        toast({
          title: "Error loading teams",
          description: error,
          variant: "destructive",
        });
        return;
      }

      console.log(
        `Loaded ${existingMembers.length} existing team members for workspace ${workspaceId}`
      );

      // Log some details about the loaded members for debugging
      if (existingMembers.length > 0) {
        console.log("Sample team members loaded:");
        existingMembers.slice(0, 3).forEach((member) => {
          console.log(
            `- ${member.name} (${member.role}) from team: ${member.teamName}`
          );
        });
      }

      setExistingTeamMembers(existingMembers);
    } catch (error) {
      console.error("Error loading existing teams:", error);
      toast({
        title: "Error loading teams",
        description: "Failed to load existing teams",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExisting(false);
    }
  };

  // Filter team members based on search query and exclude already added members
  const existingIds = new Set(teamMembers.map((member) => member.id));
  const filteredTeamMembers = existingTeamMembers.filter((member) => {
    // First filter out already added members
    if (existingIds.has(member.id)) {
      return false;
    }

    // Then apply search filter
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.teamName.toLowerCase().includes(query) ||
      member.skills.some((skill) => skill.toLowerCase().includes(query))
    );
  });

  const handleAddMember = () => {
    if (
      newMember.name &&
      newMember.email &&
      newMember.role &&
      newMember.level &&
      newMember.skills
    ) {
      const member: TeamMember = {
        id: `member-${Date.now()}`,
        name: newMember.name,
        avatar_url: "",
        email: newMember.email,
        role: newMember.role,
        level: newMember.level as "Junior" | "Mid" | "Senior" | "Lead",
        skills: newMember.skills,
        availability: newMember.availability || 40,
      };

      onTeamMembersChange([...teamMembers, member]);
      setNewMember({
        name: "",
        email: "",
        role: "",
        level: "Mid",
        skills: [],
        availability: 40,
      });
    }
  };

  const handleAddExistingMembers = () => {
    const selectedMembers = existingTeamMembers.filter((member) =>
      selectedExistingMembers.has(member.id)
    );

    const convertedMembers: TeamMember[] = selectedMembers.map((member) => ({
      id: member.id,
      name: member.name,
      avatar_url: member.avatar_url,
      email: member.email,
      role: member.role,
      level: member.level,
      skills: member.skills,
      availability: member.availability,
    }));

    // Filter out members that are already in the current team members list
    const existingIds = new Set(teamMembers.map((member) => member.id));
    const newMembers = convertedMembers.filter(
      (member) => !existingIds.has(member.id)
    );
    const duplicateCount = convertedMembers.length - newMembers.length;

    if (newMembers.length === 0) {
      toast({
        title: "No new members added",
        description: "All selected members are already in the team.",
        variant: "destructive",
      });
      return;
    }

    onTeamMembersChange([...teamMembers, ...newMembers]);
    setSelectedExistingMembers(new Set());

    // Show appropriate toast message
    if (duplicateCount > 0) {
      toast({
        title: "Members added",
        description: `Added ${newMembers.length} new member(s). ${duplicateCount} member(s) were already in the team.`,
      });
    } else {
      toast({
        title: "Team members added",
        description: `Added ${newMembers.length} team member(s) from existing teams.`,
      });
    }
  };

  const handleRemoveMember = (id: string) => {
    onTeamMembersChange(teamMembers.filter((member) => member.id !== id));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && newMember.skills) {
      setNewMember({
        ...newMember,
        skills: [...newMember.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    if (newMember.skills) {
      setNewMember({
        ...newMember,
        skills: newMember.skills.filter((s) => s !== skill),
      });
    }
  };

  const handleRoleChange = (role: string) => {
    setNewMember({
      ...newMember,
      role,
      skills: ROLE_SKILLS[role] || [],
    });
  };

  const handleExistingMemberToggle = (memberId: string) => {
    const newSelected = new Set(selectedExistingMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedExistingMembers(newSelected);
  };

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedExistingMembers);
    // Only add members that are not already in the current team
    filteredTeamMembers.forEach((member) => {
      if (!existingIds.has(member.id)) {
        newSelected.add(member.id);
      }
    });
    setSelectedExistingMembers(newSelected);
  };

  const handleClearAllFiltered = () => {
    const newSelected = new Set(selectedExistingMembers);
    // Only remove members from the filtered list
    filteredTeamMembers.forEach((member) => {
      newSelected.delete(member.id);
    });
    setSelectedExistingMembers(newSelected);
  };

  const isFormValid =
    newMember.name &&
    newMember.email &&
    newMember.role &&
    newMember.level &&
    newMember.skills &&
    newMember.skills.length > 0;

  const isExistingMembersValid = selectedExistingMembers.size > 0;

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            variant={mode === "create" ? "workspace" : "outline"}
            size="sm"
            onClick={() => setMode("create")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New
          </Button>
          <Button
            variant={mode === "select" ? "workspace" : "outline"}
            size="sm"
            onClick={() => setMode("select")}
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            Select from Teams
          </Button>
        </div>

        {mode === "create" ? (
          /* Create New Member Form */
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newMember.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={newMember.level}
                  onValueChange={(level) =>
                    setNewMember({ ...newMember, level: level as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability (hours/week)</Label>
              <Input
                id="availability"
                type="number"
                min="0"
                max="80"
                value={newMember.availability}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    availability: parseInt(e.target.value) || 40,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSkill}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {newMember.skills?.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAddMember}
              disabled={!isFormValid}
              className="w-full"
              variant="workspace"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        ) : (
          /* Select from Existing Teams */
          <div className="space-y-4">
            {isLoadingExisting ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  Loading teams...
                </p>
              </div>
            ) : existingTeamMembers.length > 0 ? (
              <div className="space-y-6">
                {/* Header with Results Counter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">
                      Available Team Members
                    </Label>
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        {filteredTeamMembers.length} of{" "}
                        {existingTeamMembers.length}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedExistingMembers.size} selected
                  </Badge>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, role, email, team, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Select All / Clear All Buttons */}
                {filteredTeamMembers.length > 0 && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSelectAllFiltered}
                      className="flex-1 h-9"
                      variant="outline"
                      size="sm"
                    >
                      <Users className="h-3 w-3 mr-2" />
                      Select All
                    </Button>
                    <Button
                      onClick={handleClearAllFiltered}
                      className="flex-1 h-9"
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-3 w-3 mr-2" />
                      Clear All
                    </Button>
                  </div>
                )}

                {/* Team Members List */}
                <ScrollArea className="h-80">
                  {filteredTeamMembers.length > 0 ? (
                    filteredTeamMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`group relative p-4 mb-2 border rounded-lg transition-all duration-200 hover:shadow-sm ${
                          selectedExistingMembers.has(member.id)
                            ? "border-workspace-primary"
                            : "border-border hover:border-workspace-primary"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            variant="workspace"
                            checked={selectedExistingMembers.has(member.id)}
                            onCheckedChange={() =>
                              handleExistingMemberToggle(member.id)
                            }
                            className="mt-1"
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="text-xs font-bold text-workspace-primary workspace-component-bg">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            {/* Header with Name and Role */}
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">
                                  {member.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
                                >
                                  {member.role}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs px-2 py-0.5 ${
                                    member.level === "Senior"
                                      ? "bg-blue-100 text-blue-800"
                                      : member.level === "Lead"
                                      ? "bg-purple-100 text-purple-800"
                                      : member.level === "Mid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {member.level}
                                </Badge>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5 flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {member.teamName}
                              </Badge>
                            </div>

                            {/* Contact and Team Info */}
                            <div className="text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {member.availability}h/week
                                </span>
                              </div>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1">
                              {member.skills.slice(0, 4).map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 bg-background"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {member.skills.length > 4 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 bg-background"
                                >
                                  +{member.skills.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {selectedExistingMembers.has(member.id) && (
                          <div className="absolute bottom-2 right-2">
                            <div className="w-6 h-6 workspace-component-bg rounded-full flex items-center justify-center">
                              <Check className="h-5 w-5 text-workspace-primary" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        No team members found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search terms or check spelling
                      </p>
                    </div>
                  ) : existingTeamMembers.length > 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        All team members already added
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All available team members are already part of this team
                      </p>
                    </div>
                  ) : null}
                </ScrollArea>

                {/* Add Selected Members Button */}
                <Button
                  onClick={handleAddExistingMembers}
                  disabled={!isExistingMembersValid}
                  className="w-full h-10"
                  variant="workspace"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Selected Members ({selectedExistingMembers.size})
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No teams found</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Create teams in the Teams section first
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/${workspaceId}/settings/teams`, "_blank")
                  }
                >
                  <Building className="h-4 w-4 mr-2" />
                  Go to Teams
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Existing Team Members */}
        {teamMembers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                Current Team Members ({teamMembers.length})
              </Label>
            </div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="group relative p-4 border rounded-lg bg-card hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs font-bold text-workspace-primary workspace-component-bg">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Header with Name and Role */}
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {member.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0.5"
                          >
                            {member.role}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs px-2 py-0.5 ${
                              member.level === "Senior"
                                ? "bg-blue-100 text-blue-800"
                                : member.level === "Lead"
                                ? "bg-purple-100 text-purple-800"
                                : member.level === "Mid"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {member.level}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Contact and Availability Info */}
                      <div className="text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {member.availability}h/week
                          </span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 4).map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="text-xs px-2 py-0.5 bg-background"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {member.skills.length > 4 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0.5 bg-background"
                          >
                            +{member.skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
