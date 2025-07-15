"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain,
  Shield,
  FileText,
  BarChart3,
  Info,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Save,
  ChartGantt,
  Loader2,
  Wand2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { nanoid } from "nanoid";

import type { UserStory, TeamMember } from "@/types";
import type { EnhancedSprint } from "@/lib/sprint-creation-service";
import {
  createEnhancedSprint,
  calculateManualSprintAnalysis,
} from "@/lib/sprint-creation-service";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import {
  getPriorityColor,
  getRiskColor,
  getUtilizationColor,
} from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { trackStoryGenerationSession } from "@/app/[workspaceId]/ai-actions";

interface SprintAssistantProps {
  stories: UserStory[];
  teamMembers: TeamMember[];
  onSprintCreated: (sprint: EnhancedSprint) => void;
  onClose: () => void;
  onSaveSprints: (
    sprints: EnhancedSprint[] | ManualSprint[],
    type: "ai" | "manual"
  ) => void;
}

interface ManualSprint {
  id: string;
  name: string;
  duration: number; // in weeks
  selectedStories: UserStory[];
  capacity: number;
  utilization: number;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

// Move this outside the component so it is available globally
async function analyzeManualSprint(
  sprint: ManualSprint,
  teamMembers: TeamMember[]
) {
  const analyzed = await calculateManualSprintAnalysis(
    sprint.selectedStories,
    teamMembers,
    {
      name: sprint.name,
      goal: sprint.goal || "",
      startDate: sprint.startDate || "",
      endDate: sprint.endDate || "",
      duration: sprint.duration,
      capacity: sprint.capacity,
    }
  );
  return analyzed;
}

export default function SprintAssistant({
  stories,
  teamMembers,
  onSprintCreated,
  onClose,
  onSaveSprints,
}: SprintAssistantProps) {
  const [creationMode, setCreationMode] = useState<"manual" | "ai">("ai");
  const [manualSprints, setManualSprints] = useState<ManualSprint[]>([]);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set()
  );
  const [sprintName, setSprintName] = useState("");
  const [sprintDuration, setSprintDuration] = useState(2);
  const [isCreating, setIsCreating] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aiSprints, setAISprints] = useState<EnhancedSprint[]>([]);
  const [showSprintsModal, setShowSprintsModal] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<EnhancedSprint | null>(
    null
  );
  const [showSprintDetails, setShowSprintDetails] = useState(false);
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintStartDate, setSprintStartDate] = useState<string>("");
  const [selectedManualSprint, setSelectedManualSprint] =
    useState<ManualSprint | null>(null);
  const [showManualSprintDetails, setShowManualSprintDetails] = useState(false);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const { user } = useAuth();
  // Manual sprints creation timer
  const manualSprintStartRef = useRef<number | null>(null);

  // Calculate end date based on start date and duration
  const sprintEndDate = useMemo(() => {
    if (!sprintStartDate) return "";
    const start = new Date(sprintStartDate);
    if (isNaN(start.getTime())) return "";
    const end = new Date(start);
    end.setDate(start.getDate() + sprintDuration * 7 - 1);
    return end.toISOString().slice(0, 10);
  }, [sprintStartDate, sprintDuration]);

  const { toast } = useEnhancedToast();

  // Calculate team capacity for 2-week sprints
  const teamCapacity = useMemo(() => {
    const totalWeeklyHours = teamMembers.reduce(
      (sum, member) => sum + (member.availability || 40),
      0
    );
    const sprintHours = totalWeeklyHours * sprintDuration;
    const sprintPoints = Math.floor(sprintHours / 8); // 1 story point = 8 hours

    return {
      totalHours: sprintHours,
      totalStoryPoints: sprintPoints,
      weeklyHours: totalWeeklyHours,
      memberCapacities: teamMembers.map((member) => ({
        ...member,
        weeklyHours: member.availability || 40,
        sprintHours: (member.availability || 40) * sprintDuration,
        sprintPoints: Math.floor(
          ((member.availability || 40) * sprintDuration) / 8
        ),
      })),
    };
  }, [teamMembers, sprintDuration]);

  // Calculate unselected stories
  const unselectedStories = useMemo(() => {
    // Only exclude stories that are already assigned to a created sprint
    const assignedIds = new Set(
      manualSprints.flatMap((s) => s.selectedStories.map((story) => story.id))
    );
    return stories.filter((story) => !assignedIds.has(story.id));
  }, [stories, manualSprints]);

  // Generate warnings and recommendations
  useEffect(() => {
    const newWarnings: string[] = [];
    const newRecommendations: string[] = [];

    // Capacity warnings
    if (manualSprints.length > 0) {
      manualSprints.forEach((sprint, index) => {
        if (sprint.utilization > 100) {
          newWarnings.push(
            `Sprint ${
              sprint.name
            } is over capacity (${sprint.utilization.toFixed(1)}%)`
          );
        }
        if (sprint.utilization < 60) {
          newRecommendations.push(
            `Sprint ${
              sprint.name
            } is under-utilized (${sprint.utilization.toFixed(
              1
            )}%). Consider adding more stories.`
          );
        }
      });
    }

    // Dependency warnings
    const storiesWithDependencies = stories.filter(
      (s) => s.dependencies && s.dependencies.length > 0
    );
    if (storiesWithDependencies.length > 0) {
      newWarnings.push(
        `${storiesWithDependencies.length} stories have dependencies. Ensure they're in the same sprint.`
      );
    }

    // Priority recommendations
    const highPriorityStories = stories.filter(
      (s) => s.priority === "High" || s.priority === "Critical"
    );
    if (highPriorityStories.length > 0) {
      newRecommendations.push(
        `Prioritize ${highPriorityStories.length} high-priority stories in early sprints.`
      );
    }

    setWarnings(newWarnings);
    setRecommendations(newRecommendations);
  }, [manualSprints, stories]);

  const handleCreateManualSprint = () => {
    if (!sprintName.trim()) {
      toast({
        title: "Sprint name required",
        description: "Please enter a name for the sprint.",
        variant: "destructive",
      });
      return;
    }
    if (!sprintGoal.trim()) {
      toast({
        title: "Sprint goal required",
        description: "Please enter a goal for the sprint.",
        variant: "destructive",
      });
      return;
    }
    if (!sprintStartDate) {
      toast({
        title: "Start date required",
        description: "Please select a start date for the sprint.",
        variant: "destructive",
      });
      return;
    }

    const selectedStoryObjects = stories.filter((story) =>
      selectedStories.has(story.id)
    );
    if (selectedStoryObjects.length === 0) {
      toast({
        title: "No stories selected",
        description: "Please select at least one story for the sprint.",
        variant: "destructive",
      });
      return;
    }

    const totalStoryPoints = selectedStoryObjects.reduce(
      (sum, story) => sum + (story.storyPoints || 0),
      0
    );
    const utilization =
      (totalStoryPoints / teamCapacity.totalStoryPoints) * 100;

    const newSprint: ManualSprint = {
      id: `st${nanoid(6)}`,
      name: sprintName,
      duration: sprintDuration,
      selectedStories: selectedStoryObjects,
      capacity: teamCapacity.totalStoryPoints,
      utilization,
      goal: sprintGoal,
      startDate: sprintStartDate,
      endDate: sprintEndDate,
    };

    setManualSprints([...manualSprints, newSprint]);
    setSelectedStories(new Set());
    setSprintName("");
    setSprintGoal("");
    setSprintStartDate("");
    setShowManualModal(false);

    toast({
      title: "Sprint created",
      description: `Created ${sprintName} with ${selectedStoryObjects.length} stories.`,
    });

    // Start timer for manual sprints creation if not already started
    if (!manualSprintStartRef.current) {
      manualSprintStartRef.current = Date.now();
    }
  };

  const handleCreateAISprint = async () => {
    setIsCreating(true);
    const sprintGenStart = Date.now();
    try {
      const sprints = await createEnhancedSprint(stories, teamMembers, {
        sprintDuration: sprintDuration * 7, // Convert weeks to days
        workingDaysPerWeek: 5,
        hoursPerDay: 8,
        velocityBuffer: 0.8,
        priorityWeights: {
          businessValue: 30,
          userImpact: 25,
          complexity: 20,
          risk: 15,
          dependencies: 10,
        },
      });
      setAISprints(Array.isArray(sprints) ? sprints : [sprints]);
      toast({
        title: "AI Sprints created",
        description: `Created ${
          Array.isArray(sprints) ? sprints.length : 1
        } sprints using AI optimization.`,
      });
      // Track sprints_creation duration
      if (user) {
        const sprintGenDuration = Date.now() - sprintGenStart;
        await trackStoryGenerationSession({
          userId: user.id,
          storyCount: Array.isArray(sprints) ? sprints.length : 1,
          feature: `AI-Optimized Sprints for ${stories.length} stories`,
          complexity: "moderate", // or infer from stories if needed
          teamSize: teamMembers.length,
          timestamp: sprintGenDuration,
          eventType: "sprints_creation",
        });
      }
    } catch (error) {
      toast({
        title: "Sprint creation failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the sprint.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStorySelection = (storyId: string, selected: boolean) => {
    const newSelected = new Set(selectedStories);
    if (selected) {
      newSelected.add(storyId);
    } else {
      newSelected.delete(storyId);
    }
    setSelectedStories(newSelected);
  };

  const handleRemoveSprint = (sprintId: string) => {
    setManualSprints(manualSprints.filter((s) => s.id !== sprintId));
  };

  const handleGenerateAIGoal = async () => {
    if (selectedStories.size === 0) {
      toast({
        title: "No stories selected",
        description: "Please select stories first to generate a goal.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingGoal(true);
    try {
      const selectedStoryObjects = stories.filter((story) =>
        selectedStories.has(story.id)
      );

      const response = await fetch("/api/generate-sprint-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: selectedStoryObjects,
          projectContext: {
            startDate: sprintStartDate || new Date().toISOString(),
          },
        }),
      });
      const data = await response.json();
      if (data.goal) {
        setSprintGoal(data.goal);
        toast({
          title: "AI Goal Generated",
          description: "Generated a meaningful sprint goal using AI.",
        });
      } else {
        throw new Error(data.error || "Failed to generate AI goal.");
      }
    } catch (error) {
      toast({
        title: "Goal generation failed",
        description: "Could not generate AI goal. Please enter one manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingGoal(false);
    }
  };

  const handleSaveManualSprints = async () => {
    // ... existing code ...
    // Track sprints_creation duration for manual method
    if (user && manualSprintStartRef.current) {
      const manualDuration = Date.now() - manualSprintStartRef.current;
      await trackStoryGenerationSession({
        userId: user.id,
        storyCount: manualSprints.length,
        feature: `Manual Sprints for ${stories.length} stories`,
        complexity: "moderate",
        teamSize: teamMembers.length,
        timestamp: manualDuration,
        eventType: "sprints_creation",
        method: "manual",
      });
      manualSprintStartRef.current = null;
    }
    onSaveSprints(manualSprints, "manual");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChartGantt className="h-5 w-5" />
            Sprint Assistant
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={creationMode}
          onValueChange={(value) => setCreationMode(value as "manual" | "ai")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manual Creation
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Team Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Team Members:</span>
                    <span className="font-semibold">{teamMembers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Hours:</span>
                    <span className="font-semibold">
                      {teamCapacity.weeklyHours}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sprint Duration:</span>
                    <span className="font-semibold">
                      {sprintDuration} weeks
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sprint Capacity:</span>
                    <span className="font-semibold">
                      {teamCapacity.totalStoryPoints} story points
                    </span>
                  </div>
                  <Progress
                    value={(teamCapacity.totalStoryPoints / 10) * 100}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Based on 8 hours per story point
                  </p>
                </CardContent>
              </Card>

              {/* Warnings & Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">
                        Warnings
                      </h4>
                      <ul className="space-y-1">
                        {warnings.map((warning, index) => (
                          <li
                            key={index}
                            className="text-sm text-red-600 flex items-start gap-2"
                          >
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="text-sm text-blue-600 flex items-start gap-2"
                          >
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Manual Sprints */}
            {manualSprints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Created Sprints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {manualSprints.map((sprint) => (
                      <div key={sprint.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{sprint.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {sprint.selectedStories.length} stories •{" "}
                              {sprint.duration} weeks
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${getUtilizationColor(
                                sprint.utilization
                              )}`}
                            >
                              {sprint.utilization.toFixed(1)}% utilization
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {sprint.selectedStories.reduce(
                                (sum, s) => sum + (s.storyPoints || 0),
                                0
                              )}{" "}
                              / {sprint.capacity} points
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {sprint.selectedStories.map((story) => (
                            <Badge
                              key={story.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {story.title}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveSprint(sprint.id)}
                          >
                            Remove Sprint
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedManualSprint(sprint);
                              setShowManualSprintDetails(true);
                            }}
                          >
                            View Analysis
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Save Sprints Button for Manual Tab */}
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="workspace"
                      disabled={manualSprints.length === 0}
                      onClick={handleSaveManualSprints}
                    >
                      Save Sprints
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Stories */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Available Stories ({unselectedStories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {unselectedStories.map((story) => (
                      <div
                        key={story.id}
                        className="flex items-center gap-3 p-2 border rounded"
                      >
                        <Checkbox
                          checked={selectedStories.has(story.id)}
                          onCheckedChange={(checked) =>
                            handleStorySelection(story.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{story.title}</h4>
                            <Badge
                              className={`text-xs ${getPriorityColor(
                                story.priority || "Medium"
                              )}`}
                            >
                              {story.priority || "Medium"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {story.storyPoints || 0} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {story.description}
                          </p>
                          {story.dependencies &&
                            story.dependencies.length > 0 && (
                              <span className="text-xs text-orange-600 flex items-center gap-1">
                                {story.dependencies?.length ?? 0} deps
                              </span>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Create Sprint Button */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sprint-name">Sprint Name:</Label>
                  <Input
                    id="sprint-name"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    placeholder="Enter sprint name"
                    className="w-48"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sprint-duration">Duration:</Label>
                  <Select
                    value={sprintDuration.toString()}
                    onValueChange={(value) =>
                      setSprintDuration(parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-32">
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
              <Button
                onClick={() => setShowManualModal(true)}
                disabled={selectedStories.size === 0 || !sprintName.trim()}
              >
                Create Sprint
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* AI Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ai-duration">Sprint Duration:</Label>
                    <Select
                      value={sprintDuration.toString()}
                      onValueChange={(value) =>
                        setSprintDuration(parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-32">
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

                  <div className="space-y-2">
                    <h4 className="font-semibold">AI Features:</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Priority-based story ordering
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Dependency-aware grouping
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Team capacity optimization
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Risk assessment & mitigation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        AI-powered sprint goal generation
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Team Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Capacity:</span>
                      <span className="font-semibold">
                        {teamCapacity.totalStoryPoints} story points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Stories:</span>
                      <span className="font-semibold">{stories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Story Points:</span>
                      <span className="font-semibold">
                        {stories.reduce(
                          (sum, s) => sum + (s.storyPoints || 0),
                          0
                        )}{" "}
                        points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Sprints:</span>
                      <span className="font-semibold">
                        {Math.ceil(
                          stories.reduce(
                            (sum, s) => sum + (s.storyPoints || 0),
                            0
                          ) / teamCapacity.totalStoryPoints
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stories Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Stories Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-rose-600">
                      {stories.filter((s) => s.priority === "Critical").length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Critical Priority
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-orange-600">
                      {stories.filter((s) => s.priority === "High").length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      High Priority
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        stories.filter(
                          (s) => s.dependencies && s.dependencies.length > 0
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      With Dependencies
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCreateAISprint}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating
                  ? "Creating AI Sprints & Goals..."
                  : "Create AI-Optimized Sprints"}
              </Button>
              <Button
                className="w-full"
                disabled={aiSprints.length === 0 && !showSprintsModal}
                onClick={() => setShowSprintsModal(true)}
              >
                Show Generated Sprints
              </Button>
            </div>
            <Dialog open={showSprintsModal} onOpenChange={setShowSprintsModal}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
                <DialogTitle>
                  <span className="sr-only">Generated Sprints</span>
                </DialogTitle>
                {/* Sticky header */}
                <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h2 className="text-xl font-bold">Generated Sprints</h2>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-3 py-0.5 text-xs font-semibold">
                        Sprints: {aiSprints.length}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 px-3 py-0.5 text-xs font-semibold">
                        Stories:{" "}
                        {aiSprints.reduce(
                          (sum, s) => sum + s.stories.length,
                          0
                        )}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200 px-3 py-0.5 text-xs font-semibold">
                        Points:{" "}
                        {aiSprints.reduce(
                          (sum, s) => sum + s.metrics.totalStoryPoints,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSprintsModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>
                <div className="space-y-8 p-6">
                  {aiSprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className="bg-white dark:bg-neutral-900 shadow-lg rounded-xl border mb-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedSprint(sprint);
                        setShowSprintDetails(true);
                      }}
                    >
                      {/* Sprint header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 border-b">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-bold">
                            {sprint.name}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 text-xs font-semibold">
                            {sprint.stories.length} stories
                          </span>
                          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 text-xs font-semibold">
                            {sprint.metrics.totalStoryPoints} pts
                          </span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200 px-2 py-0.5 text-xs font-semibold">
                            {sprint.metrics.utilization.storyPoints.toFixed(0)}%
                            utilized
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              sprint.riskAssessment.riskLevel === "High"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                : sprint.riskAssessment.riskLevel === "Medium"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {sprint.riskAssessment.riskLevel}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-col items-end">
                          <span>
                            {sprint.documentation.keyDates.startDate} -{" "}
                            {sprint.documentation.keyDates.endDate}
                          </span>
                          <span className="mt-1 font-semibold text-gray-700 dark:text-gray-200">
                            {sprint.goal}
                          </span>
                        </div>
                      </div>
                      {/* Sprint content */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                        {/* Stories */}
                        <div>
                          <h4 className="font-semibold mb-3">Stories</h4>
                          <ul className="space-y-3">
                            {sprint.stories.map((story) => (
                              <li
                                key={story.id}
                                className="flex items-start gap-3 bg-muted rounded-lg p-3 border-l-4"
                                style={{
                                  borderColor: priorityColor(story.priority),
                                }}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-base">
                                      {story.title}
                                    </span>
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadgeColor(
                                        story.priority
                                      )}`}
                                    >
                                      {story.priority || "Medium"}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      {story.storyPoints || 0} pts
                                    </span>
                                    {story.dependencies &&
                                      story.dependencies.length > 0 && (
                                        <span className="text-xs text-orange-600 flex items-center gap-1">
                                          {story.dependencies?.length ?? 0} deps
                                        </span>
                                      )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {story.description}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Metrics & Recommendations */}
                        <div className="flex flex-col gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">
                              Sprint Metrics
                            </h4>
                            <ul className="text-sm space-y-1">
                              <li>
                                Total Points:{" "}
                                <b>{sprint.metrics.totalStoryPoints}</b>
                              </li>
                              <li>
                                Total Hours: <b>{sprint.metrics.totalHours}</b>
                              </li>
                              <li>
                                Utilization:{" "}
                                <b>
                                  {sprint.metrics.utilization.storyPoints.toFixed(
                                    1
                                  )}
                                  %
                                </b>
                              </li>
                              <li>
                                Avg Value:{" "}
                                <b>{sprint.metrics.avgBusinessValue}</b>
                              </li>
                              <li>
                                Avg Complexity:{" "}
                                <b>{sprint.metrics.avgComplexity}</b>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">
                              Recommendations
                            </h4>
                            {sprint.recommendations.length === 0 && (
                              <div className="text-xs text-muted-foreground">
                                No recommendations
                              </div>
                            )}
                            {sprint.recommendations.map((rec, idx) => (
                              <div
                                key={idx}
                                className={`rounded px-3 py-2 mb-2 text-xs font-medium ${
                                  rec.priority === "critical"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                    : rec.priority === "high"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                }`}
                              >
                                {rec.type}: {rec.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <div className="justify-end mt-4 w-full">
              <Button
                variant="workspace"
                disabled={aiSprints.length === 0}
                onClick={() => onSaveSprints(aiSprints, "ai")}
                className="w-full"
              >
                <Save className="w-4 h-4" /> Save Sprints
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Manual Sprint Creation Modal */}
        <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Manual Sprint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">
                  Selected Stories ({selectedStories.size})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stories
                    .filter((story) => selectedStories.has(story.id))
                    .map((story) => (
                      <div
                        key={story.id}
                        className="flex items-center gap-2 p-2 border rounded"
                      >
                        <Badge
                          className={`text-xs ${getPriorityColor(
                            story.priority || "Medium"
                          )}`}
                        >
                          {story.priority || "Medium"}
                        </Badge>
                        <span className="text-sm">{story.title}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {story.storyPoints || 0} pts
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              {/* Sprint Goal */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sprint-goal">Sprint Goal:</Label>
                  <Input
                    id="sprint-goal"
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    placeholder="Enter sprint goal or generate with AI"
                    className="w-80"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAIGoal}
                    disabled={isGeneratingGoal || selectedStories.size === 0}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingGoal ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {selectedStories.size > 0 && (
                  <p className="text-xs text-muted-foreground">
                    AI will analyze your selected stories to create a meaningful
                    sprint goal.
                  </p>
                )}
              </div>

              {/* Start Date and End Date */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sprint-start-date">Start Date:</Label>
                  <Input
                    id="sprint-start-date"
                    type="date"
                    value={sprintStartDate}
                    onChange={(e) => setSprintStartDate(e.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sprint-end-date">End Date:</Label>
                  <Input
                    id="sprint-end-date"
                    type="date"
                    value={sprintEndDate}
                    disabled
                    className="w-44 bg-muted"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Story Points:{" "}
                    {stories
                      .filter((story) => selectedStories.has(story.id))
                      .reduce(
                        (sum, story) => sum + (story.storyPoints || 0),
                        0
                      )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Capacity: {teamCapacity.totalStoryPoints} points
                  </p>
                </div>
                <Button onClick={handleCreateManualSprint}>
                  Create Sprint
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Sprint Details Modal */}
        <Dialog open={showSprintDetails} onOpenChange={setShowSprintDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedSprint?.name} - Detailed Analysis
              </DialogTitle>
            </DialogHeader>
            {selectedSprint && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">
                    <Info className="h-4 w-4 mr-1" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="stories">
                    <FileText className="h-4 w-4 mr-1" />
                    Stories
                  </TabsTrigger>
                  <TabsTrigger value="risks">
                    <Shield className="h-4 w-4 mr-1" />
                    Risks
                  </TabsTrigger>
                  <TabsTrigger value="metrics">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Metrics
                  </TabsTrigger>
                  <TabsTrigger value="docs">
                    <FileText className="h-4 w-4 mr-1" />
                    Docs
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Sprint Goal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <p className="text-sm">{selectedSprint.goal}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="text-sm space-y-1">
                          <div>
                            Start:{" "}
                            {selectedSprint.documentation.keyDates.startDate}
                          </div>
                          <div>
                            End: {selectedSprint.documentation.keyDates.endDate}
                          </div>
                          <div>Duration: {selectedSprint.duration} weeks</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Key Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {selectedSprint.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-2 bg-muted rounded"
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                rec.priority === "critical"
                                  ? "bg-red-500"
                                  : rec.priority === "high"
                                  ? "bg-orange-500"
                                  : rec.priority === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {rec.message}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {rec.action}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="stories" className="space-y-4">
                  <div className="space-y-2">
                    {selectedSprint.stories.map((story) => (
                      <div key={story.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{story.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {story.storyPoints} pts
                            </Badge>
                            <Badge
                              className={getPriorityColor(
                                story.priority || "medium"
                              )}
                            >
                              {story.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {story.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span>
                            Priority Score: {story.priorityScore?.toFixed(1)}
                          </span>
                          <span>
                            Dependency Score:{" "}
                            {story.dependencyScore?.toFixed(1)}
                          </span>
                          <span>Business Value: {story.businessValue}</span>
                          <span>Complexity: {story.complexity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="risks" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Risk Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Overall Risk:</span>
                            <Badge
                              className={getRiskColor(
                                selectedSprint.riskAssessment.riskLevel
                              )}
                            >
                              {selectedSprint.riskAssessment.riskLevel.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Risk Score:</span>
                            <span className="font-medium">
                              {selectedSprint.riskAssessment.riskScore}/5
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Confidence:</span>
                            <span className="font-medium">
                              {Math.round(
                                selectedSprint.riskAssessment.confidence * 100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Risk Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {Object.entries(
                            selectedSprint.riskAssessment.riskFactors
                          ).map(([factor, value]) => (
                            <div
                              key={factor}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm capitalize">
                                {factor.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className="font-medium">
                                {value.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Mitigation Strategies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {selectedSprint.mitigationStrategies.map(
                          (strategy, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 p-2 bg-muted rounded"
                            >
                              <div
                                className={`w-2 h-2 rounded-full mt-2 ${
                                  strategy.priority === "critical"
                                    ? "bg-red-500"
                                    : strategy.priority === "high"
                                    ? "bg-orange-500"
                                    : strategy.priority === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {strategy.description}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Action: {strategy.action}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Effort: {strategy.effort}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Capacity Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Story Count:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.storyCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Total Story Points:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.totalStoryPoints}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Total Hours:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.totalHours}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              Story Points Utilization:
                            </span>
                            <span
                              className={`font-medium ${getUtilizationColor(
                                selectedSprint.metrics.utilization.storyPoints
                              )}`}
                            >
                              {Math.round(
                                selectedSprint.metrics.utilization.storyPoints
                              )}
                              %
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Hours Utilization:</span>
                            <span
                              className={`font-medium ${getUtilizationColor(
                                selectedSprint.metrics.utilization.hours
                              )}`}
                            >
                              {Math.round(
                                selectedSprint.metrics.utilization.hours
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Priority Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Critical:</span>
                            <span className="font-medium">
                              {
                                selectedSprint.metrics.priorityDistribution
                                  .critical
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">High:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.priorityDistribution.high}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Medium:</span>
                            <span className="font-medium">
                              {
                                selectedSprint.metrics.priorityDistribution
                                  .medium
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Low:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.priorityDistribution.low}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Quality Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Avg Business Value:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.avgBusinessValue}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Avg Complexity:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.avgComplexity}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Over Capacity:</span>
                            <span className="font-medium">
                              {selectedSprint.metrics.isOverCapacity ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="docs" className="space-y-4">
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sprint Documentation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Overview</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedSprint.documentation.overview}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Objectives</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {selectedSprint.documentation.objectives.map(
                              (objective, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                  {objective}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Success Criteria</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {selectedSprint.documentation.success_criteria.map(
                              (criterion, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  {criterion}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Risk Summary</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedSprint.documentation.riskSummary}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Sprint Detailed Analysis Modal */}
        <Dialog
          open={showManualSprintDetails}
          onOpenChange={setShowManualSprintDetails}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedManualSprint?.name} - Detailed Analysis
              </DialogTitle>
            </DialogHeader>
            {selectedManualSprint && (
              <ManualSprintAnalysisContent
                sprint={selectedManualSprint}
                teamMembers={teamMembers}
                onClose={() => setShowManualSprintDetails(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for color
function priorityColor(priority: string | undefined) {
  switch (priority) {
    case "Critical":
      return "#ef4444"; // red-500
    case "High":
      return "#f59e42"; // orange-400
    case "Medium":
      return "#3b82f6"; // blue-500
    case "Low":
      return "#10b981"; // green-500
    default:
      return "#6b7280"; // gray-500
  }
}
function priorityBadgeColor(priority: string | undefined) {
  switch (priority) {
    case "Critical":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
    case "High":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200";
    case "Medium":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
    case "Low":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200";
  }
}

// Add this new component at the end of the file
function ManualSprintAnalysisContent({
  sprint,
  teamMembers,
  onClose,
}: {
  sprint: ManualSprint;
  teamMembers: TeamMember[];
  onClose: () => void;
}) {
  const [analyzed, setAnalyzed] = useState<null | EnhancedSprint>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    analyzeManualSprint(sprint, teamMembers).then((result: EnhancedSprint) => {
      setAnalyzed(result);
      setLoading(false);
    });
  }, [sprint, teamMembers]);
  if (loading || !analyzed)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Analyzing sprint...
      </div>
    );
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">
          <Info className="h-4 w-4 mr-1" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="stories">
          <FileText className="h-4 w-4 mr-1" />
          Stories
        </TabsTrigger>
        <TabsTrigger value="risks">
          <Shield className="h-4 w-4 mr-1" />
          Risks
        </TabsTrigger>
        <TabsTrigger value="metrics">
          <BarChart3 className="h-4 w-4 mr-1" />
          Metrics
        </TabsTrigger>
        <TabsTrigger value="docs">
          <FileText className="h-4 w-4 mr-1" />
          Docs
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Sprint Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-sm">{analyzed.goal}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-sm space-y-1">
                <div>Start: {analyzed.documentation.keyDates.startDate}</div>
                <div>End: {analyzed.documentation.keyDates.endDate}</div>
                <div>Duration: {analyzed.duration} weeks</div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Key Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {analyzed.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-muted rounded"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      rec.priority === "critical"
                        ? "bg-red-500"
                        : rec.priority === "high"
                        ? "bg-orange-500"
                        : rec.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{rec.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {rec.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="stories" className="space-y-4">
        <div className="space-y-2">
          {analyzed.stories.map((story) => (
            <div key={story.id} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{story.title}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{story.storyPoints} pts</Badge>
                  <Badge
                    className={getPriorityColor(story.priority || "medium")}
                  >
                    {story.priority}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {story.description}
              </p>
              <div className="flex items-center gap-4 text-xs">
                <span>Business Value: {story.businessValue}</span>
                <span>Complexity: {story.complexity}</span>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="risks" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Risk:</span>
                  <Badge
                    className={getRiskColor(analyzed.riskAssessment.riskLevel)}
                  >
                    {analyzed.riskAssessment.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk Score:</span>
                  <span className="font-medium">
                    {analyzed.riskAssessment.riskScore}/5
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confidence:</span>
                  <span className="font-medium">
                    {Math.round(analyzed.riskAssessment.confidence * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {Object.entries(analyzed.riskAssessment.riskFactors).map(
                  ([factor, value]) => (
                    <div
                      key={factor}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">
                        {factor.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mitigation Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {analyzed.mitigationStrategies.map((strategy, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-muted rounded"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      strategy.priority === "critical"
                        ? "bg-red-500"
                        : strategy.priority === "high"
                        ? "bg-orange-500"
                        : strategy.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {strategy.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Action: {strategy.action}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Effort: {strategy.effort}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="metrics" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Capacity Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Story Count:</span>
                  <span className="font-medium">
                    {analyzed.metrics.storyCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Story Points:</span>
                  <span className="font-medium">
                    {analyzed.metrics.totalStoryPoints}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Hours:</span>
                  <span className="font-medium">
                    {analyzed.metrics.totalHours}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Story Points Utilization:</span>
                  <span
                    className={`font-medium ${getUtilizationColor(
                      analyzed.metrics.utilization.storyPoints
                    )}`}
                  >
                    {Math.round(analyzed.metrics.utilization.storyPoints)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hours Utilization:</span>
                  <span
                    className={`font-medium ${getUtilizationColor(
                      analyzed.metrics.utilization.hours
                    )}`}
                  >
                    {Math.round(analyzed.metrics.utilization.hours)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critical:</span>
                  <span className="font-medium">
                    {analyzed.metrics.priorityDistribution.critical}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">High:</span>
                  <span className="font-medium">
                    {analyzed.metrics.priorityDistribution.high}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium:</span>
                  <span className="font-medium">
                    {analyzed.metrics.priorityDistribution.medium}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low:</span>
                  <span className="font-medium">
                    {analyzed.metrics.priorityDistribution.low}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Business Value:</span>
                  <span className="font-medium">
                    {analyzed.metrics.avgBusinessValue}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Complexity:</span>
                  <span className="font-medium">
                    {analyzed.metrics.avgComplexity}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Over Capacity:</span>
                  <span className="font-medium">
                    {analyzed.metrics.isOverCapacity ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="docs" className="space-y-4">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sprint Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  {analyzed.documentation.overview}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Objectives</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analyzed.documentation.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Success Criteria</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analyzed.documentation.success_criteria.map(
                    (criterion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {criterion}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Risk Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {analyzed.documentation.riskSummary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
