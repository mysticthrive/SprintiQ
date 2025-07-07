import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserStory, TeamMember, Sprint } from "@/types";

interface SprintAssistantProps {
  stories: UserStory[];
  teamMembers: TeamMember[];
  onSprintCreated: (sprint: Sprint) => void;
}

export default function SprintAssistant({
  stories,
  teamMembers,
  onSprintCreated,
}: SprintAssistantProps) {
  const [sprintDuration, setSprintDuration] = useState<number>(2);
  const [sprintName, setSprintName] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // Calculate team velocity based on historical data or estimates
  const calculateTeamVelocity = (): number => {
    if (teamMembers.length === 0) return 0;

    // Calculate average velocity per team member
    const totalVelocity = teamMembers.reduce((sum, member) => {
      // Estimate velocity based on level and availability
      const levelMultiplier = {
        Junior: 0.6,
        Mid: 1.0,
        Senior: 1.4,
        Lead: 1.2,
      };

      const baseVelocity = 8; // Base story points per sprint
      const availabilityFactor = member.availability / 40; // Normalize to 40h week

      return (
        sum + baseVelocity * levelMultiplier[member.level] * availabilityFactor
      );
    }, 0);

    return Math.round(totalVelocity);
  };

  // Calculate sprint capacity
  const calculateSprintCapacity = (): number => {
    const teamVelocity = calculateTeamVelocity();
    return teamVelocity * sprintDuration;
  };

  // Optimize story distribution
  const optimizeStoryDistribution = (): {
    sprintStories: UserStory[];
    remainingStories: UserStory[];
    warnings: string[];
    recommendations: string[];
  } => {
    const capacity = calculateSprintCapacity();
    const sortedStories = [...stories].sort((a, b) => {
      // Sort by priority first, then by story points
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const aPriority = priorityOrder[a.priority || "Medium"];
      const bPriority = priorityOrder[b.priority || "Medium"];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return (a.storyPoints || 0) - (b.storyPoints || 0);
    });

    let currentCapacity = capacity;
    const sprintStories: UserStory[] = [];
    const remainingStories: UserStory[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for overload risk
    const totalStoryPoints = stories.reduce(
      (sum, story) => sum + (story.storyPoints || 0),
      0
    );
    if (totalStoryPoints > capacity * 1.2) {
      warnings.push(
        "⚠️ Sprint overload risk: Total story points exceed recommended capacity by 20%"
      );
      recommendations.push(
        "Consider extending sprint duration or reducing story scope"
      );
    }

    // Check velocity variation coefficient
    const velocities = teamMembers.map((member) => member.velocity || 8);
    if (velocities.length > 1) {
      const mean =
        velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      const variance =
        velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        velocities.length;
      const coefficient = Math.sqrt(variance) / mean;

      if (coefficient > 0.3) {
        warnings.push(
          "⚠️ High velocity variation: Team velocity varies significantly, consider capacity planning"
        );
        recommendations.push(
          "Pair junior developers with seniors for knowledge transfer"
        );
      }
    }

    for (const story of sortedStories) {
      const storyPoints = story.storyPoints || 1;

      if (storyPoints <= currentCapacity) {
        sprintStories.push(story);
        currentCapacity -= storyPoints;
      } else {
        remainingStories.push(story);
      }
    }

    // FBI Sentinel Anti-pattern Detection
    const criticalStories = sprintStories.filter(
      (s) => s.priority === "Critical"
    );
    if (criticalStories.length > 2) {
      warnings.push(
        "🚨 FBI Sentinel Anti-pattern: Too many critical stories may lead to scope overload"
      );
      recommendations.push(
        "Limit critical stories to 1-2 per sprint to maintain focus"
      );
    }

    const largeStories = sprintStories.filter((s) => (s.storyPoints || 0) > 8);
    if (largeStories.length > 1) {
      warnings.push(
        "🚨 FBI Sentinel Anti-pattern: Large stories detected - consider breaking down stories larger than 8 points"
      );
      recommendations.push(
        "Break large stories into smaller, more manageable pieces"
      );
    }

    // Check for skill distribution
    const skillDistribution = new Map<string, number>();
    sprintStories.forEach((story) => {
      story.tags?.forEach((tag) => {
        skillDistribution.set(tag, (skillDistribution.get(tag) || 0) + 1);
      });
    });

    const overloadedSkills = Array.from(skillDistribution.entries())
      .filter(([skill, count]) => count > 2)
      .map(([skill]) => skill);

    if (overloadedSkills.length > 0) {
      warnings.push(
        `⚠️ Skill overload detected: ${overloadedSkills.join(
          ", "
        )} skills are heavily used`
      );
      recommendations.push(
        "Consider redistributing stories to balance skill requirements"
      );
    }

    // Check for dependencies
    const storiesWithDependencies = sprintStories.filter(
      (s) => s.suggestedDependencies && s.suggestedDependencies.length > 0
    );
    if (storiesWithDependencies.length > 0) {
      warnings.push(
        "⚠️ Dependencies detected: Some stories have dependencies that may affect sprint flow"
      );
      recommendations.push(
        "Review story dependencies and ensure proper sequencing"
      );
    }

    // Check for anti-pattern warnings in stories
    const storiesWithAntiPatterns = sprintStories.filter(
      (s) => s.antiPatternWarnings && s.antiPatternWarnings.length > 0
    );
    if (storiesWithAntiPatterns.length > 0) {
      warnings.push(
        `🚨 FBI Sentinel Anti-patterns detected in ${storiesWithAntiPatterns.length} stories`
      );
      recommendations.push(
        "Review and refine stories with anti-pattern warnings"
      );
    }

    return { sprintStories, remainingStories, warnings, recommendations };
  };

  const handleCreateSprint = () => {
    setIsCreating(true);

    setTimeout(() => {
      const { sprintStories, remainingStories, warnings, recommendations } =
        optimizeStoryDistribution();
      const teamVelocity = calculateTeamVelocity();
      const capacity = calculateSprintCapacity();

      const sprint: Sprint = {
        id: `sprint-${Date.now()}`,
        name: sprintName || `Sprint ${new Date().toLocaleDateString()}`,
        duration: sprintDuration,
        capacity,
        stories: sprintStories,
        teamMembers,
        velocity: teamVelocity,
        startDate: new Date(),
        endDate: new Date(
          Date.now() + sprintDuration * 7 * 24 * 60 * 60 * 1000
        ),
        status: "Planning",
      };

      onSprintCreated(sprint);
      setIsCreating(false);
    }, 1000);
  };

  const { sprintStories, remainingStories, warnings, recommendations } =
    optimizeStoryDistribution();
  const teamVelocity = calculateTeamVelocity();
  const capacity = calculateSprintCapacity();
  const utilization =
    sprintStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0) / capacity;

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Sprint Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Sprint Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sprintName">Sprint Name</Label>
            <Input
              id="sprintName"
              placeholder="Sprint 1"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (weeks)</Label>
            <Select
              value={sprintDuration.toString()}
              onValueChange={(value) => setSprintDuration(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 week</SelectItem>
                <SelectItem value="2">2 weeks</SelectItem>
                <SelectItem value="3">3 weeks</SelectItem>
                <SelectItem value="4">4 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Team Size</span>
            </div>
            <span className="text-2xl font-bold">{teamMembers.length}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Velocity</span>
            </div>
            <span className="text-2xl font-bold">{teamVelocity}</span>
            <span className="text-xs text-muted-foreground">pts/sprint</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Capacity</span>
            </div>
            <span className="text-2xl font-bold">{capacity}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Warnings
            </Label>
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded"
                >
                  {warning}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Recommendations
            </Label>
            <div className="space-y-1">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="text-sm text-green-700 bg-green-50 p-2 rounded"
                >
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sprint Preview */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sprint Preview</Label>
          <div className="flex items-center justify-between text-sm">
            <span>Stories in Sprint: {sprintStories.length}</span>
            <span>Utilization: {Math.round(utilization * 100)}%</span>
          </div>

          <ScrollArea className="h-40">
            <div className="space-y-2">
              {sprintStories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium">{story.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {story.assignedTeamMember?.name || "Unassigned"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{story.storyPoints} pts</Badge>
                    <Badge
                      className={
                        story.priority === "Critical" ? "bg-red-500" : ""
                      }
                    >
                      {story.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {remainingStories.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {remainingStories.length} stories will remain for next sprint
            </div>
          )}
        </div>

        {/* Create Sprint Button */}
        <Button
          onClick={handleCreateSprint}
          disabled={isCreating || stories.length === 0}
          className="w-full"
          variant="workspace"
        >
          {isCreating ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Creating Sprint...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Create Sprint
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
