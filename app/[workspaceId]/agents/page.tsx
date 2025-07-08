"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  generateTAWOSStories,
  generateProjectSuggestions,
  saveUserStoryToDestination,
  saveTeamMember,
  createSpaceAndProject,
  analyzeStoryDependencies,
} from "@/app/[workspaceId]/ai-actions";
import {
  Pencil,
  Copy,
  X,
  Brain,
  SaveAll,
  FileChartPie,
  GitBranch,
  Network,
  TextSearch,
  Target,
  DatabaseZap,
  ChartGantt,
  Goal,
  Clock,
  BriefcaseBusiness,
} from "lucide-react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

import { createClientSupabaseClient } from "@/lib/supabase/client";
import { nanoid } from "nanoid";
import { useParams } from "next/navigation";
import { PriorityWeights } from "@/components/workspace/ai/priority-scoring-config";
import StoryInputForm from "@/components/workspace/ai/story-input-form";
import SprintAssistant from "@/components/workspace/ai/sprint-assistant";
import type { EnhancedSprint } from "@/lib/sprint-creation-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import SaveProgressModal from "@/components/workspace/ai/save-progress-modal";
import {
  DEFAULT_WEIGHTS,
  type TeamMember,
  type Sprint,
  UserStory,
} from "@/types";
import { getPriorityColor } from "@/lib/utils";
import EditStoryModal from "@/components/workspace/ai/edit-story-modal";
import SaveDestinationModal from "@/components/workspace/ai/save-destination-modal";
import { EmptyFolderSvg } from "@/components/svg/EmptyFolderSvg";
import { cn } from "@/lib/utils";
import { createEventServer } from "../actions/events";
import PriorityAnalysisModal from "@/components/workspace/ai/priority-analysis-modal";
import StoryDependenciesModal from "@/components/workspace/ai/story-dependencies-modal";
import StoryDependenciesVisualization from "@/components/workspace/ai/story-dependencies-visualization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Space {
  id: string;
  space_id: string;
  name: string;
  projects: Project[];
}

interface Project {
  id: string;
  project_id: string;
  name: string;
}

export default function AgentsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [priorityWeights, setPriorityWeights] =
    useState<PriorityWeights>(DEFAULT_WEIGHTS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStories, setGeneratedStories] = useState<UserStory[]>([]);

  // Destination state
  const [destinationType, setDestinationType] = useState<"existing" | "new">(
    "existing"
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // New destination state
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newStatusNames, setNewStatusNames] = useState<string[]>([]);
  const [newStatusColors, setNewStatusColors] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Available spaces and projects
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // Edit state
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add loading state
  const [loadingState, setLoadingState] = useState<{
    isOpen: boolean;
    currentStep: string;
    progress: number;
  }>({
    isOpen: false,
    currentStep: "",
    progress: 0,
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPriorityAnalysis, setShowPriorityAnalysis] = useState(false);
  const [showDependenciesModal, setShowDependenciesModal] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showSprintAssistant, setShowSprintAssistant] = useState(false);
  const [selectedStoryForDependencies, setSelectedStoryForDependencies] =
    useState<UserStory | null>(null);
  const [isAnalyzingDependencies, setIsAnalyzingDependencies] = useState(false);
  const [showAnalyzingModal, setShowAnalyzingModal] = useState(false);
  const [currentSprint, setCurrentSprint] = useState<EnhancedSprint | null>(
    null
  );

  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  // Load available spaces and projects
  useEffect(() => {
    loadSpacesAndProjects();
  }, [workspaceId]);

  const loadSpacesAndProjects = async () => {
    setIsLoadingSpaces(true);
    try {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", workspaceId)
        .single();

      if (!workspace) return;

      const { data: spaces } = await supabase
        .from("spaces")
        .select(
          `
          id,
          space_id,
          name,
          projects:projects(id, project_id, name)
        `
        )
        .eq("workspace_id", workspace.id)
        .order("name");

      setAvailableSpaces(spaces || []);
    } catch (error) {
      console.error("Error loading spaces:", error);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const handleDuplicateStory = (story: UserStory) => {
    const duplicatedStory = {
      ...story,
      id: nanoid(),
      title: `${story.title} (Copy)`,
    };
    setGeneratedStories([...generatedStories, duplicatedStory]);
  };

  const handleStorySubmit = async (story: {
    role: string;
    want: string;
    benefit: string;
    numberOfStories: number;
    complexity: "simple" | "moderate" | "complex";
    teamMembers: TeamMember[];
  }) => {
    setIsGenerating(true);
    try {
      // Update the team members state so Sprint Assistant can use it
      setTeamMembers(story.teamMembers);

      const params = {
        featureDescription: `As a ${story.role}, I want ${story.want}, so that ${story.benefit}`,
        numberOfStories: story.numberOfStories,
        complexity: story.complexity,
        workspaceId,
        priorityWeights,
        teamMembers: story.teamMembers,
        useTAWOS: true,
      };

      const { stories, error } = await generateTAWOSStories(params);

      if (error) {
        toast({
          title: "Generation failed",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setGeneratedStories(stories);

      toast({
        title: "Stories generated",
        description: `Successfully generated ${stories.length} user stories using TAWOS AI.`,
        browserNotificationTitle: "Stories generated",
        browserNotificationBody: `Successfully generated ${stories.length} user stories using TAWOS AI.`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetWeights = () => {
    setPriorityWeights(DEFAULT_WEIGHTS);
  };

  const handleAIAssist = async () => {
    if (!generatedStories.length) {
      toast({
        title: "No stories generated",
        description:
          "Please generate some stories first before using AI assist.",
        variant: "destructive",
        browserNotificationTitle: "No stories generated",
        browserNotificationBody:
          "Please generate some stories first before using AI assist.",
      });
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      // Get suggestions from AI
      const suggestions = await generateProjectSuggestions(
        generatedStories[0].want, // Use the first story as context
        generatedStories
      );

      if (suggestions.error) {
        toast({
          title: "Failed to get suggestions",
          description: suggestions.error,
          variant: "destructive",
        });
        return;
      }

      // Update state with suggestions
      setNewSpaceName(suggestions.spaceName || "");
      setNewProjectName(suggestions.projectName || "");
      setNewStatusNames(
        suggestions.statusNames || ["To Do", "In Progress", "Review", "Done"]
      );
      setNewStatusColors(
        suggestions.statusColors || ["gray", "blue", "yellow", "green"]
      );

      // Switch to "new" destination type
      setDestinationType("new");

      toast({
        title: "AI suggestions generated",
        description:
          "Space and project names have been suggested based on your stories.",
        browserNotificationTitle: "AI suggestions generated",
        browserNotificationBody:
          "Space and project names have been suggested based on your stories.",
      });
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleSaveAll = async () => {
    setLoadingState({
      isOpen: true,
      currentStep: "Preparing to save stories...",
      progress: 0,
    });

    try {
      let spaceId: string | undefined = selectedSpaceId;
      let projectId: string | undefined = selectedProjectId;
      let spaceUuid: string | undefined;
      let projectUuid: string | undefined;

      // Get current user for events
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to save stories.",
          variant: "destructive",
        });
        return;
      }

      // Get workspace UUID
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", workspaceId)
        .single();

      if (!workspace) {
        toast({
          title: "Error",
          description: "Workspace not found.",
          variant: "destructive",
        });
        return;
      }

      // If creating new space/project
      if (destinationType === "new") {
        setLoadingState({
          isOpen: true,
          currentStep: "Creating new space and project...",
          progress: 10,
        });

        const result = await createSpaceAndProject(
          workspaceId,
          newSpaceName,
          newProjectName,
          newStatusNames.length
            ? newStatusNames
            : ["To Do", "In Progress", "Review", "Done"],
          newStatusColors.length
            ? newStatusColors
            : ["gray", "blue", "yellow", "green"]
        );

        if (!result.success) {
          toast({
            title: "Failed to create space/project",
            description: result.error,
            variant: "destructive",
          });
          setLoadingState({ isOpen: false, currentStep: "", progress: 0 });
          return;
        }

        spaceId = result.spaceId;
        projectId = result.projectId;

        // Get the UUIDs for the new space and project
        const { data: newSpace } = await supabase
          .from("spaces")
          .select("id")
          .eq("space_id", spaceId)
          .single();

        const { data: newProject } = await supabase
          .from("projects")
          .select("id")
          .eq("project_id", projectId)
          .single();

        if (newSpace && newProject) {
          spaceUuid = newSpace.id;
          projectUuid = newProject.id;

          // Create event for space creation
          await createEventServer({
            type: "created",
            entityType: "space",
            entityId: newSpace.id,
            entityName: newSpaceName,
            userId: user.id,
            workspaceId: workspace.id,
            spaceId: newSpace.id,
            description: `Created space "${newSpaceName}" with AI-generated stories`,
            metadata: {
              aiGenerated: true,
              storyCount: generatedStories.length,
            },
          });

          // Create event for project creation
          await createEventServer({
            type: "created",
            entityType: "project",
            entityId: newProject.id,
            entityName: newProjectName,
            userId: user.id,
            workspaceId: workspace.id,
            spaceId: newSpace.id,
            projectId: newProject.id,
            description: `Created project "${newProjectName}" with AI-generated stories`,
            metadata: {
              aiGenerated: true,
              storyCount: generatedStories.length,
            },
          });
        }

        await loadSpacesAndProjects();
      } else {
        // Get UUIDs for existing space and project
        const { data: existingSpace } = await supabase
          .from("spaces")
          .select("id")
          .eq("space_id", spaceId)
          .single();

        const { data: existingProject } = await supabase
          .from("projects")
          .select("id")
          .eq("project_id", projectId)
          .single();

        if (existingSpace && existingProject) {
          spaceUuid = existingSpace.id;
          projectUuid = existingProject.id;
        }
      }

      // Type guard to ensure we have valid IDs before saving stories
      if (!spaceId || !projectId || !spaceUuid || !projectUuid) {
        toast({
          title: "Missing information",
          description: "Space or project ID is missing.",
          variant: "destructive",
        });
        setLoadingState({ isOpen: false, currentStep: "", progress: 0 });
        return;
      }

      // Save new team members first
      setLoadingState({
        isOpen: true,
        currentStep: "Saving new team members...",
        progress: 15,
      });

      // Only save team members that are newly created (have IDs starting with 'member-')
      const newTeamMembers = generatedStories
        .map((story) => story.assignedTeamMember)
        .filter((member) => member && member.id.startsWith("member-"))
        .filter(
          (member, index, arr) =>
            arr.findIndex((m) => m?.email === member?.email) === index
        ) as TeamMember[];

      let savedMembersCount = 0;
      for (const member of newTeamMembers) {
        try {
          const result = await saveTeamMember(member, workspaceId);
          if (result.success) {
            savedMembersCount++;
          }
        } catch (error) {
          console.error("Error saving team member:", error);
        }
      }

      if (newTeamMembers.length > 0) {
        toast({
          title: "Team members saved",
          description: `Successfully saved ${savedMembersCount} of ${newTeamMembers.length} new team members.`,
          browserNotificationTitle: "Team members saved",
          browserNotificationBody: `Successfully saved ${savedMembersCount} of ${newTeamMembers.length} new team members.`,
        });
      }

      // Calculate progress increment per story
      const baseProgress = destinationType === "new" ? 30 : 20;
      const progressPerStory = (100 - baseProgress) / generatedStories.length;

      // Save all stories
      let successCount = 0;
      for (let i = 0; i < generatedStories.length; i++) {
        const story = generatedStories[i];
        try {
          setLoadingState({
            isOpen: true,
            currentStep: `Saving story ${i + 1} of ${
              generatedStories.length
            }: "${story.title}"`,
            progress: baseProgress + progressPerStory * i,
          });

          const saveResult = await saveUserStoryToDestination(
            story,
            workspaceId,
            {
              type: "existing", // Always use "existing" here because we've already created the space/project if needed
              spaceId,
              projectId,
            },
            priorityWeights
          );

          if (saveResult.success) {
            successCount++;
          }
        } catch (error) {
          console.error("Error saving story:", error);
        }
      }

      setLoadingState({
        isOpen: true,
        currentStep: "Completing save operation...",
        progress: 100,
      });

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
          ["story"].includes("story") &&
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
              entityType: "story",
              entityName: "AI-generated stories",
              description: `${successCount} of ${generatedStories.length} stories generated.`,
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
        title: "Stories saved",
        description: `Successfully saved ${successCount} of ${generatedStories.length} stories.`,
        variant:
          successCount === generatedStories.length ? "default" : "destructive",
        browserNotificationTitle: "Stories saved",
        browserNotificationBody: `Successfully saved ${successCount} of ${generatedStories.length} stories.`,
      });

      if (successCount === generatedStories.length) {
        setGeneratedStories([]);
        setShowSaveModal(false);
      }
    } catch (error) {
      console.error("Error saving all stories:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving stories.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setLoadingState({ isOpen: false, currentStep: "", progress: 0 });
      }, 1000);
    }
  };

  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  // Add delete handler
  const handleDeleteStory = (storyId: string) => {
    setGeneratedStories((prev) => prev.filter((s) => s.id !== storyId));
    toast({
      title: "Story deleted",
      description: "The story has been removed from the list.",
      browserNotificationTitle: "Story deleted",
      browserNotificationBody: "The story has been removed from the list.",
    });
  };

  // Add edit handler
  const handleEditStory = (story: UserStory) => {
    setEditingStory(story);
    setShowEditModal(true);
  };

  // Add save edit handler
  const handleSaveEdit = (updatedStory: UserStory) => {
    setGeneratedStories((prev) =>
      prev.map((s) => (s.id === updatedStory.id ? updatedStory : s))
    );
    setShowEditModal(false);
    setEditingStory(null);
    toast({
      title: "Story updated",
      description: "The story has been successfully updated.",
      browserNotificationTitle: "Story updated",
      browserNotificationBody: "The story has been successfully updated.",
    });
  };

  const handleManageDependencies = (story: UserStory) => {
    setSelectedStoryForDependencies(story);
    setShowDependenciesModal(true);
  };

  const handleSaveDependencies = (
    parentStory: UserStory,
    childStories: UserStory[]
  ) => {
    setGeneratedStories((prev) =>
      prev.map((story) => {
        if (story.id === parentStory.id) {
          return {
            ...story,
            childTaskIds: childStories.map((s) => s.id),
          };
        }
        if (childStories.some((s) => s.id === story.id)) {
          return {
            ...story,
            parentTaskId: parentStory.id,
          };
        }
        if (
          story.parentTaskId === parentStory.id &&
          !childStories.some((s) => s.id === story.id)
        ) {
          return {
            ...story,
            parentTaskId: undefined,
          };
        }
        return story;
      })
    );
    setShowDependenciesModal(false);
    setSelectedStoryForDependencies(null);
  };

  const handleAnalyzeDependencies = async () => {
    if (generatedStories.length < 2) {
      toast({
        title: "Not enough stories",
        description: "Generate at least 2 stories to analyze dependencies.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingDependencies(true);
    setShowAnalyzingModal(true);
    try {
      const { suggestions, error } = await analyzeStoryDependencies(
        generatedStories
      );

      if (error) {
        toast({
          title: "Analysis failed",
          description: error,
          variant: "destructive",
        });
        return;
      }

      // Update stories with suggested dependencies
      setGeneratedStories((prev) =>
        prev.map((story) => {
          const suggestion = suggestions.find((s) => s.storyId === story.id);
          if (suggestion) {
            return {
              ...story,
              suggestedDependencies: suggestion.suggestedDependencies,
            };
          }
          return story;
        })
      );

      toast({
        title: "Dependencies analyzed",
        description: "Suggested dependencies have been added to the stories.",
        browserNotificationTitle: "Dependencies analyzed",
        browserNotificationBody:
          "Suggested dependencies have been added to the stories.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description:
          "An unexpected error occurred while analyzing dependencies.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingDependencies(false);
      setShowAnalyzingModal(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center border-b workspace-border p-3">
          <div className="flex items-center">
            <Brain className="h-4 w-4 mr-1" />
            <h1 className="text-md">AI Story Generator</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/${workspaceId}/agents/tawos-training`)
                  }
                  className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-1 h-6 hover:workspace-hover"
                >
                  <DatabaseZap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Training Data</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSprintAssistant(true)}
                  className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-1 h-6 hover:workspace-hover"
                  disabled={!generatedStories.length || !teamMembers.length}
                >
                  <ChartGantt className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Sprint Assistant</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyzeDependencies}
                  className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-1 h-6 hover:workspace-hover"
                  disabled={!generatedStories.length || isAnalyzingDependencies}
                >
                  <TextSearch className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Analyze Dependencies</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVisualization(true)}
                  className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-1 h-6 hover:workspace-hover"
                  disabled={!generatedStories.length}
                >
                  <Network className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Visualization</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPriorityAnalysis(true)}
                  className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-1 h-6 hover:workspace-hover relative"
                  disabled={!generatedStories.length}
                >
                  {generatedStories.length > 0 && (
                    <>
                      <div className="absolute rounded-full workspace-primary-bg w-2 h-2 top-0 right-0" />
                      <div className="absolute rounded-full border workspace-component-active-border w-2 h-2 top-0 right-0 animate-pulse-wave" />
                    </>
                  )}
                  <FileChartPie className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Priority Analysis</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-1 h-6 hover:workspace-hover"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 p-3">
          {/* Left Column - Story Generation Form */}
          <div className="space-y-6 workspace-secondary-sidebar-bg rounded-xl p-3 overflow-y-auto h-[calc(100vh-154px)]">
            <StoryInputForm
              onSubmit={handleStorySubmit}
              isLoading={isGenerating}
              weights={priorityWeights}
              onWeightsChange={setPriorityWeights}
              onWeightsReset={handleResetWeights}
            />
          </div>

          {/* Right Column - Generated Stories */}
          <div className="">
            <Card className="flex flex-col">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">
                  Generated Stories
                  <hr className="my-3 workspace-border" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-224px)] px-4">
                  {generatedStories.length > 0 ? (
                    <div className="space-y-4 pb-4">
                      {generatedStories.map((story) => (
                        <Card
                          key={story.id}
                          className={cn(
                            "p-4",
                            story.parentTaskId &&
                              "border-l-4 border-blue-500 pl-3"
                          )}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{story.title}</h3>
                                {story.parentTaskId && (
                                  <Badge variant="outline" className="text-xs">
                                    Sub-story
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={`${getPriorityColor(
                                    story.priority
                                  )} text-xs flex items-center`}
                                >
                                  <Goal className="h-3 w-3 mr-1" />
                                  {story.priority}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="flex items-center"
                                >
                                  <Target className="h-3 w-3 mr-1" />
                                  {story.storyPoints} pts
                                </Badge>
                                {story.estimatedTime && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-500/10 border-blue-500/10 text-blue-500 flex items-center"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {story.estimatedTime}h
                                  </Badge>
                                )}
                                {story.assignedTeamMember && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={story.assignedTeamMember.avatar_url}
                                      alt={story.assignedTeamMember.name}
                                    />
                                    <AvatarFallback className="text-xs font-bold text-workspace-primary workspace-component-bg">
                                      {story.assignedTeamMember.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </div>
                            {story.parentTaskId && (
                              <div className="text-sm text-muted-foreground">
                                Parent story:{" "}
                                {
                                  generatedStories.find(
                                    (s) => s.id === story.parentTaskId
                                  )?.title
                                }
                              </div>
                            )}
                            <p className="text-sm text-muted-foreground">
                              As a{" "}
                              <span className="font-medium">{story.role}</span>,
                              I want{" "}
                              <span className="font-medium">{story.want}</span>,
                              so that{" "}
                              <span className="font-medium">
                                {story.benefit}
                              </span>
                            </p>
                            <div className="mt-2">
                              <h4 className="text-sm font-semibold mb-1">
                                Acceptance Criteria:
                              </h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {story.acceptanceCriteria.map(
                                  (criteria, index) => (
                                    <li key={index}>{criteria}</li>
                                  )
                                )}
                              </ul>
                            </div>
                            {story.requirements &&
                              story.requirements.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="text-sm font-semibold mb-1">
                                    Requirements:
                                  </h4>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {story.requirements.map((req, index) => (
                                      <li key={index}>{req}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            {story.antiPatternWarnings &&
                              story.antiPatternWarnings.length > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <h4 className="text-sm font-semibold mb-1 text-yellow-800">
                                    ⚠️ Anti-pattern Warnings:
                                  </h4>
                                  <ul className="list-disc list-inside text-sm space-y-1 text-yellow-700">
                                    {story.antiPatternWarnings.map(
                                      (warning, index) => (
                                        <li key={index}>{warning}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            {story.tags && story.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {story.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {story.suggestedDependencies &&
                              story.suggestedDependencies.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold mb-2">
                                    Suggested Dependencies
                                  </h4>
                                  <hr className="my-2 workspace-border" />
                                  <div className="space-y-2">
                                    {story.suggestedDependencies.map(
                                      (dep, index) => {
                                        const dependentStory =
                                          generatedStories.find(
                                            (s) => s.id === dep.taskId
                                          );
                                        if (!dependentStory) return null;
                                        return (
                                          <div
                                            key={index}
                                            className="p-2 workspace-component-bg rounded-lg text-sm"
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium workspace-component-active-color">
                                                {dependentStory.title}
                                              </span>
                                              <Badge variant="workspace">
                                                {Math.round(
                                                  dep.confidence * 100
                                                )}
                                                % confidence
                                              </Badge>
                                            </div>
                                            <p className="workspace-component-active-color mt-1 ">
                                              {dep.reason}
                                            </p>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}
                            <div className="flex items-center justify-end space-x-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageDependencies(story)}
                              >
                                <GitBranch className="h-4 w-4 mr-1" />
                                Manage Dependencies
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditStory(story)}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicateStory(story)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Duplicate
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteStory(story.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground ">
                      <div className="text-xs text-center h-[calc(100vh-240px)] grid items-center">
                        <div className="flex flex-col items-center justify-center max-w-[230px] mx-auto">
                          <div className="flex items-center justify-center mb-4 w-12 h-12">
                            <EmptyFolderSvg color="#666" />
                          </div>
                          No stories generated yet. Use the form on the left to
                          create stories.
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            <Button
              variant="workspace"
              onClick={() => setShowSaveModal(true)}
              disabled={!generatedStories.length}
              className={cn(
                "absolute bottom-6 right-6 text-white h-12 w-12 rounded-full hover:workspace-primary-hover",
                !generatedStories.length && "disabled:opacity-0"
              )}
            >
              <SaveAll className="h-8 w-8" />
            </Button>
          </div>
        </div>

        {/* Edit Story Modal */}
        <EditStoryModal
          story={editingStory}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingStory(null);
          }}
          onSave={handleSaveEdit}
        />

        {/* Save Destination Modal */}
        <SaveDestinationModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveAll}
          spaces={availableSpaces}
          isLoading={isLoadingSpaces}
          destinationType={destinationType}
          selectedSpaceId={selectedSpaceId}
          selectedProjectId={selectedProjectId}
          newSpaceName={newSpaceName}
          newProjectName={newProjectName}
          newStatusNames={newStatusNames}
          newStatusColors={newStatusColors}
          isGeneratingSuggestions={isGeneratingSuggestions}
          onDestinationTypeChange={(type) => setDestinationType(type)}
          onSelectedSpaceChange={setSelectedSpaceId}
          onSelectedProjectChange={setSelectedProjectId}
          onNewSpaceNameChange={setNewSpaceName}
          onNewProjectNameChange={setNewProjectName}
          onNewStatusNamesChange={setNewStatusNames}
          onNewStatusColorsChange={setNewStatusColors}
          onAIAssist={handleAIAssist}
        />

        {/* Progress Modal */}
        <SaveProgressModal
          isOpen={loadingState.isOpen}
          currentStep={loadingState.currentStep}
          progress={loadingState.progress}
        />

        {/* Priority Analysis Modal */}
        <PriorityAnalysisModal
          isOpen={showPriorityAnalysis}
          onClose={() => setShowPriorityAnalysis(false)}
          stories={generatedStories}
        />

        {/* Story Dependencies Modal */}
        <StoryDependenciesModal
          stories={generatedStories}
          selectedStory={selectedStoryForDependencies}
          isOpen={showDependenciesModal}
          onClose={() => {
            setShowDependenciesModal(false);
            setSelectedStoryForDependencies(null);
          }}
          onSave={handleSaveDependencies}
        />

        {/* Story Dependencies Visualization Modal */}
        <Dialog open={showVisualization} onOpenChange={setShowVisualization}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Story Dependencies Visualization</DialogTitle>
            </DialogHeader>
            <StoryDependenciesVisualization
              stories={generatedStories}
              onClose={() => setShowVisualization(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Sprint Assistant Modal */}
        <Dialog
          open={showSprintAssistant}
          onOpenChange={setShowSprintAssistant}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sprint Planning Assistant</DialogTitle>
            </DialogHeader>
            <SprintAssistant
              stories={generatedStories}
              teamMembers={teamMembers}
              onSprintCreated={(sprint) => {
                setCurrentSprint(sprint);
                toast({
                  title: "Enhanced Sprint created",
                  description: `Enhanced sprint "${sprint.name}" with ${sprint.stories.length} stories created successfully.`,
                });
              }}
              onClose={() => setShowSprintAssistant(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Analyzing Dependencies Modal */}
        <Dialog open={showAnalyzingModal} onOpenChange={setShowAnalyzingModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TextSearch className="h-5 w-5" />
                Analyzing Dependencies
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-gray-900">
                  Analyzing story dependencies...
                </p>
                <p className="text-sm text-gray-600">
                  AI is analyzing {generatedStories.length} stories to identify
                  relationships and dependencies
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
