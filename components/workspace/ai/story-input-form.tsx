import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, Users, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PriorityScoringConfig, {
  PriorityWeights,
} from "./priority-scoring-config";
import TeamMemberForm from "./team-member-form";
import { DEFAULT_WEIGHTS, type TeamMember } from "@/types";

interface StoryInputFormProps {
  onSubmit: (story: {
    role: string;
    want: string;
    benefit: string;
    numberOfStories: number;
    complexity: "simple" | "moderate" | "complex";
    teamMembers: TeamMember[];
  }) => void;
  isLoading?: boolean;
  weights: PriorityWeights;
  onWeightsChange: (weights: PriorityWeights) => void;
  onWeightsReset: () => void;
}

export default function StoryInputForm({
  onSubmit,
  isLoading = false,
  weights,
  onWeightsChange,
  onWeightsReset,
}: StoryInputFormProps) {
  const [role, setRole] = useState("");
  const [want, setWant] = useState("");
  const [benefit, setBenefit] = useState("");
  const [storyCount, setStoryCount] = useState<string>("3");
  const [customCount, setCustomCount] = useState<number>(1);
  const [complexity, setComplexity] = useState<
    "simple" | "moderate" | "complex"
  >("moderate");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);

  const handleGenerateStories = () => {
    onSubmit({
      role,
      want,
      benefit,
      numberOfStories:
        storyCount === "custom" ? customCount : parseInt(storyCount),
      complexity,
      teamMembers,
    });
  };

  const isValid =
    role.trim() &&
    want.trim() &&
    benefit.trim() &&
    (storyCount !== "custom" || (customCount > 0 && customCount <= 20)) &&
    teamMembers.length > 0;

  return (
    <div className="space-y-6">
      {/* Story Input Section */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">User Story Input</span>
        </div>
        <hr className="my-3 workspace-border" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">As a...</Label>
              <Textarea
                id="role"
                placeholder="e.g., Product Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="resize-none h-20 text-xs placeholder:text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="want">I want...</Label>
              <Textarea
                id="want"
                placeholder="e.g., to generate user stories using AI trained on real successful project patterns"
                value={want}
                onChange={(e) => setWant(e.target.value)}
                className="resize-none h-20 text-xs placeholder:text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="benefit">So that...</Label>
            <Textarea
              id="benefit"
              placeholder="e.g., I can quickly create high-quality backlogs based on proven practices"
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              className="resize-none h-20 text-xs placeholder:text-xs"
            />
          </div>
        </div>
      </div>

      <hr className="my-3 workspace-border" />

      {/* Configuration Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </span>
        </div>

        <div className="space-y-4">
          {/* Number of Stories */}
          <div className="flex items-center justify-between">
            <Label>Number of Stories</Label>
            <div className="flex gap-2">
              <Select value={storyCount} onValueChange={setStoryCount}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Stories</SelectItem>
                  <SelectItem value="5">5 Stories</SelectItem>
                  <SelectItem value="10">10 Stories</SelectItem>
                  <SelectItem value="custom">Custom Count</SelectItem>
                </SelectContent>
              </Select>
              {storyCount === "custom" && (
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={customCount}
                  onChange={(e) => {
                    setCustomCount(
                      Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                    );
                  }}
                  className="w-24"
                  placeholder="Count"
                />
              )}
            </div>
          </div>

          {/* Complexity Selection */}
          <div className="flex items-center justify-between">
            <Label>Complexity</Label>
            <Select
              value={complexity}
              onValueChange={(value: "simple" | "moderate" | "complex") =>
                setComplexity(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="complex">Complex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {storyCount === "custom" && customCount > 10 && (
            <p className="text-sm text-muted-foreground">
              Large numbers of stories may take longer to generate.
            </p>
          )}
        </div>
      </div>

      <hr className="my-3 workspace-border" />

      {/* Team Members Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTeamForm(!showTeamForm)}
          >
            {showTeamForm ? "Hide" : "Add Team Members"}
          </Button>
        </div>

        {showTeamForm && (
          <TeamMemberForm
            teamMembers={teamMembers}
            onTeamMembersChange={setTeamMembers}
          />
        )}

        {!showTeamForm && teamMembers.length > 0 && (
          <div className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">
              {teamMembers.length} team member
              {teamMembers.length !== 1 ? "s" : ""} added
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              {teamMembers.slice(0, 3).map((member) => (
                <span
                  key={member.id}
                  className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
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
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{member.name}</span>
                    <span className="text-[10px] font-medium">
                      {member.role}
                    </span>
                  </div>
                </span>
              ))}
              {teamMembers.length > 3 && (
                <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1 border rounded-full">
                  <Users className="h-3 w-3" />+{teamMembers.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {teamMembers.length === 0 && (
          <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team members added</p>
            <p className="text-xs">
              Add team members to enable automatic assignment. You can create
              new members or select from existing teams.
            </p>
          </div>
        )}
      </div>

      <hr className="my-3 workspace-border" />

      {/* Priority Weights */}
      <PriorityScoringConfig
        weights={weights}
        onChange={onWeightsChange}
        onReset={onWeightsReset}
      />

      <Button
        onClick={handleGenerateStories}
        className="w-full"
        variant="workspace"
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Stories
          </>
        )}
      </Button>
    </div>
  );
}
