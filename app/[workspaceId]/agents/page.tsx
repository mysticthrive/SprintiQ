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
  createSpaceAndProject,
  analyzeStoryDependencies,
  createSprintFolder,
  createSprints,
  trackStoryGenerationSession,
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
  Calendar,
  SquareCheckBig,
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
import { DEFAULT_WEIGHTS, type TeamMember, UserStory } from "@/types";
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
import { motion, AnimatePresence } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";

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
  const [newSprintFolderName, setNewSprintFolderName] = useState<string>("");
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
  const [sprintType, setSprintType] = useState<"ai" | "manual" | null>(null);
  const [selectedStoryForDependencies, setSelectedStoryForDependencies] =
    useState<UserStory | null>(null);
  const [isAnalyzingDependencies, setIsAnalyzingDependencies] = useState(false);
  const [showAnalyzingModal, setShowAnalyzingModal] = useState(false);
  const [currentSprint, setCurrentSprint] = useState<EnhancedSprint | null>(
    null
  );

  // Progressive reveal state
  const [visibleCount, setVisibleCount] = useState(0);

  // Reveal stories one by one when generatedStories changes
  useEffect(() => {
    if (!generatedStories.length) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount((prev) => {
        if (prev < generatedStories.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
      if (i >= generatedStories.length) {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedStories]);

  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  // Add state for sessionId and start time
  const [storyGenSessionId, setStoryGenSessionId] = useState<string | null>(
    null
  );
  const [storyGenStartTime, setStoryGenStartTime] = useState<number | null>(
    null
  );
  const [storyGenGenStartTime, setStoryGenGenStartTime] = useState<
    number | null
  >(null);

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
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to generate stories.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }
      // Track session start for story_creation
      const feature = `As a ${story.role}, I want ${story.want}, so that ${story.benefit}`;
      const startTime = Date.now();
      setStoryGenStartTime(startTime);
      // Track session start for story_generation (local variable)
      const genStartTime = Date.now();
      const sessionRes = await trackStoryGenerationSession({
        userId: user.id,
        storyCount: 0, // Will update after save
        feature,
        complexity: story.complexity,
        teamSize: story.teamMembers.length,
        timestamp: 0, // Will update with duration after save
        eventType: "story_creation",
      });
      if (sessionRes.success && sessionRes.sessionId) {
        setStoryGenSessionId(sessionRes.sessionId);
      }
      // Update the team members state so Sprint Assistant can use it
      setTeamMembers(story.teamMembers);

      const params = {
        featureDescription: feature,
        numberOfStories: story.numberOfStories,
        complexity: story.complexity,
        workspaceId,
        priorityWeights,
        teamMembers: story.teamMembers,
        useTAWOS: true,
      };

      // Start generation
      const { stories, error } = await generateTAWOSStories(params);

      // Track story_generation duration (always save to DB)
      if (user) {
        const genDuration = Date.now() - genStartTime;
        await trackStoryGenerationSession({
          userId: user.id,
          storyCount: stories ? stories.length : 0,
          feature,
          complexity: story.complexity,
          teamSize: story.teamMembers.length,
          timestamp: genDuration,
          eventType: "story_generation",
        });
      }

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
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const [sprintFolder, setSprintFolder] = useState<any>(null);
  const [createdSprints, setCreatedSprints] = useState<any[]>([]);
  const [storiesBySprint, setStoriesBySprint] = useState<
    Record<string, UserStory[]>
  >({});

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
      let createdProjectStatuses: any[] | undefined = undefined;
      let createdSprintStatuses: any[] | undefined = undefined;

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

      // --- PROJECT MODE (no sprints) ---
      if (!createdSprints || createdSprints.length === 0) {
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
          createdProjectStatuses = (result as any).createdStatuses ?? [];

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
          // Existing project/space
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

        if (!spaceId || !projectId || !spaceUuid || !projectUuid) {
          toast({
            title: "Missing information",
            description: "Space or project ID is missing.",
            variant: "destructive",
          });
          setLoadingState({ isOpen: false, currentStep: "", progress: 0 });
          return;
        }

        // Get statuses for the project if not already available
        if (!createdProjectStatuses || createdProjectStatuses.length === 0) {
          const { data: statuses } = await supabase
            .from("statuses")
            .select("id")
            .eq("project_id", projectUuid)
            .order("position", { ascending: true });
          createdProjectStatuses = statuses ?? [];
        }
        const firstStatusId =
          createdProjectStatuses.length > 0
            ? createdProjectStatuses[0].id
            : undefined;
        if (!firstStatusId) {
          toast({
            title: "No statuses found",
            description: "Could not find a status for the project.",
            variant: "destructive",
          });
          setLoadingState({ isOpen: false, currentStep: "", progress: 0 });
          return;
        }

        setLoadingState({
          isOpen: true,
          currentStep: "Saving stories...",
          progress: 50,
        });
        for (const story of generatedStories) {
          const result = await saveUserStoryToDestination(story, workspaceId, {
            type: destinationType,
            spaceId: spaceUuid,
            projectId: projectUuid,
            statusId: firstStatusId,
            spaceName: newSpaceName,
            projectName: newProjectName,
          });
          if (!result.success) {
            toast({
              title: "Failed to save story",
              description: result.error,
              variant: "destructive",
            });
          }
        }
        setLoadingState({
          isOpen: false,
          currentStep: "Saved succesful",
          progress: 100,
        });
        toast({
          title: "Stories saved!",
          description: "All generated stories have been saved.",
          sendBrowserNotification: true,
          browserNotificationTitle: "Stories saved!",
          browserNotificationBody: "All generated stories have been saved.",
        });
        setShowSaveModal(false);
      } else {
        // --- SPRINT MODE (sprints exist) ---
        if (createdSprints && createdSprints.length > 0) {
          let sprintSpaceUuid = spaceUuid;

          // SPRINT + NEW SPACE FLOW
          if (destinationType === "new") {
            // 1. Create new space
            const { data: newSpace, error: spaceError } = await supabase
              .from("spaces")
              .insert({
                name: newSpaceName,
                description: `Space for ${newSpaceName} related projects`,
                icon: "blue",
                is_private: false,
                workspace_id: workspace.id,
              })
              .select("id, space_id")
              .single();
            if (spaceError || !newSpace) {
              toast({
                title: "Failed to create space",
                description: spaceError?.message,
                variant: "destructive",
              });
              return;
            }
            sprintSpaceUuid = newSpace.id;

            // 2. Add user as member
            const { error: memberError } = await supabase
              .from("space_members")
              .insert({
                space_id: sprintSpaceUuid,
                user_id: user.id,
                role: "admin",
              });

            // 3. Verify membership
            const { data: memberCheck, error: checkError } = await supabase
              .from("space_members")
              .select("*")
              .eq("space_id", sprintSpaceUuid)
              .eq("user_id", user.id)
              .single();
            if (!memberCheck) {
              toast({
                title: "Membership insert failed",
                description:
                  checkError?.message ||
                  "User is not a member of the new space.",
                variant: "destructive",
              });
              return;
            }
          } else {
            // SPRINT + EXISTING SPACE FLOW
            // Use the selected existing space
            if (!selectedSpaceId) {
              toast({
                title: "No space selected",
                description:
                  "Please select an existing space for the sprint folder.",
                variant: "destructive",
              });
              return;
            }

            // Get the UUID of the selected space
            const { data: existingSpace } = await supabase
              .from("spaces")
              .select("id")
              .eq("space_id", selectedSpaceId)
              .single();

            if (!existingSpace) {
              toast({
                title: "Space not found",
                description: "The selected space could not be found.",
                variant: "destructive",
              });
              return;
            }

            sprintSpaceUuid = existingSpace.id;
          }

          if (!sprintSpaceUuid) {
            toast({
              title: "Missing space UUID",
              description: "Sprint space UUID is required but was not found.",
              variant: "destructive",
            });
            setLoadingState({ isOpen: false, currentStep: "", progress: 0 });
            return;
          }

          // 4. Create sprint folder (always use sprintSpaceUuid)
          setLoadingState({
            isOpen: true,
            currentStep: "Creating sprint folder...",
            progress: 20,
          });

          // Use user-provided sprint folder name or generate one
          const sprintFolderName =
            newSprintFolderName ||
            (destinationType === "new"
              ? `${newProjectName || "Project"} Sprints`
              : "Sprint Folder");

          // Calculate total duration for the sprint folder
          const totalDurationWeeks =
            createdSprints && createdSprints.length > 0
              ? createdSprints.reduce(
                  (sum, sprint) => sum + (sprint.duration || 2),
                  0
                )
              : 2;

          // Determine the first sprint's start date (earliest)
          let sprintStartDayId: string | null = null;
          if (createdSprints && createdSprints.length > 0) {
            // Find the earliest start date
            const sprintsWithStart = createdSprints.filter((s) => s.startDate);
            if (sprintsWithStart.length > 0) {
              const firstSprint = sprintsWithStart.reduce((a, b) =>
                new Date(a.startDate) < new Date(b.startDate) ? a : b
              );
              const startDate = firstSprint.startDate;
              if (startDate) {
                // Get day of week as string (e.g., 'Monday')
                const dayOfWeek = new Date(startDate).toLocaleDateString(
                  "en-US",
                  { weekday: "long" }
                );
                // Query days table for id
                const { data: dayRow, error: dayError } = await supabase
                  .from("days")
                  .select("id")
                  .eq("name", dayOfWeek)
                  .single();
                if (dayRow && dayRow.id) {
                  sprintStartDayId = dayRow.id;
                }
              }
            }
          }

          const sprintFolderResult = await createSprintFolder({
            name: sprintFolderName,
            spaceId: sprintSpaceUuid,
            durationWeeks: totalDurationWeeks,
            sprintStartDayId,
          });
          if (!sprintFolderResult.success || !sprintFolderResult.sprintFolder) {
            toast({
              title: "Failed to create sprint folder",
              description: sprintFolderResult.error,
              variant: "destructive",
            });
            return;
          }
          setSprintFolder(sprintFolderResult.sprintFolder);

          // 5. Continue with sprints and stories (use sprintSpaceUuid for all inserts)
          setLoadingState({
            isOpen: true,
            currentStep: "Creating sprints...",
            progress: 30,
          });
          // Create sprints without setting sprint_id (let database generate UUID)
          const sprintsToCreate = createdSprints.map((sprint: any) => ({
            name: sprint.name,
            goal: sprint.goal,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            duration: sprint.duration,
          }));

          const sprintsResult = await createSprints({
            sprints: sprintsToCreate,
            sprintFolderId: sprintFolderResult.sprintFolder.id,
            spaceId: sprintSpaceUuid,
            workspaceId: workspace.id,
          });
          if (!sprintsResult.success || !sprintsResult.createdSprints) {
            toast({
              title: "Failed to create sprints",
              description: sprintsResult.error,
              variant: "destructive",
            });
            return;
          }

          // Create mapping from original sprint IDs to new sprint internal IDs
          const originalToInternalSprintMap: Record<string, string> = {};
          sprintsResult.createdSprints.forEach(
            (newSprint: any, index: number) => {
              const originalSprintId = createdSprints[index].id;
              originalToInternalSprintMap[originalSprintId] = newSprint.id;
            }
          );

          setCreatedSprints(sprintsResult.createdSprints);
          createdSprintStatuses = sprintsResult.createdStatuses;

          // Map sprintId to backlog statusId
          const sprintBacklogStatusMap: Record<string, string> = {};
          if (createdSprintStatuses) {
            for (const status of createdSprintStatuses) {
              if (status.sprint_id) {
                sprintBacklogStatusMap[status.sprint_id] = status.id;
              }
            }
          }

          // Debug: Check what sprint IDs are in the stories
          const storySprintIds = new Set(
            generatedStories.map((s) => s.sprintId).filter(Boolean)
          );

          // Update stories to use new internal sprint IDs
          const updatedStories = generatedStories.map((story) => {
            if (story.sprintId && originalToInternalSprintMap[story.sprintId]) {
              return {
                ...story,
                sprintId: originalToInternalSprintMap[story.sprintId],
              };
            }
            return story;
          });
          setGeneratedStories(updatedStories);

          // --- Group by sprint for UI and saving ---
          const bySprint: Record<string, UserStory[]> = {};
          for (const story of updatedStories) {
            if (!story.sprintId) continue;
            if (!bySprint[story.sprintId]) {
              bySprint[story.sprintId] = [];
            }
            bySprint[story.sprintId].push(story);
          }
          setStoriesBySprint(bySprint);

          setLoadingState({
            isOpen: true,
            currentStep: "Saving stories...",
            progress: 50,
          });
          for (const sprintStories of Object.values(bySprint)) {
            for (const story of sprintStories) {
              const result = await saveUserStoryToDestination(
                story,
                workspaceId,
                {
                  type: destinationType,
                  spaceId: sprintSpaceUuid, // use UUID
                  projectId: projectUuid, // use UUID
                  sprintId: story.sprintId,
                  statusId: story.sprintId
                    ? sprintBacklogStatusMap[story.sprintId]
                    : undefined,
                }
              );
              if (!result.success) {
                console.error("[Save] Failed to save story", {
                  story,
                  error: result.error,
                });
                toast({
                  title: "Failed to save story",
                  description: result.error,
                  variant: "destructive",
                });
              }
            }
          }
        }

        setLoadingState({
          isOpen: false,
          currentStep: "Stories saved!",
          progress: 100,
        });

        toast({
          title: "Stories and sprints saved!",
          description: "All generated stories and sprints have been saved.",
          sendBrowserNotification: true,
          browserNotificationTitle: "Stories and sprints saved!",
          browserNotificationBody:
            "All generated stories and sprints have been saved.",
        });
        // Optionally, refresh or redirect
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while saving stories and sprints.",
        variant: "destructive",
      });
      setLoadingState({ isOpen: false, currentStep: "", progress: 0 });
    } finally {
      // After all stories are saved successfully, update the session row
      if (storyGenSessionId && storyGenStartTime) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const duration = Date.now() - storyGenStartTime;
          await supabase
            .from("time_tracking_sessions")
            .update({
              story_count: generatedStories.length,
              timestamp: duration, // duration in ms
            })
            .eq("session_id", storyGenSessionId)
            .eq("user_id", user.id);
        }
      }
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

  // Handler for SprintAssistant's Save Sprints button
  const handleSaveSprintsFromAssistant = (
    sprints: any[],
    type: "ai" | "manual"
  ) => {
    // LOG: Entry point
    // Group stories by sprint
    let bySprint: Record<string, UserStory[]> = {};
    let allStories: UserStory[] = [];
    if (type === "manual") {
      sprints.forEach((sprint: any) => {
        // Add a marker for manual
        sprint.created_by = "manual";
        bySprint[sprint.id] = sprint.selectedStories.map(
          (story: UserStory) => ({ ...story, sprintId: sprint.id })
        );
        allStories = allStories.concat(bySprint[sprint.id]);
      });
      setCreatedSprints(sprints);
    } else {
      sprints.forEach((sprint: any) => {
        // Add a marker for ai
        sprint.created_by = "ai";
        bySprint[sprint.id] = (sprint.stories || []).map(
          (story: UserStory) => ({ ...story, sprintId: sprint.id })
        );
        allStories = allStories.concat(bySprint[sprint.id]);
      });
      setCreatedSprints(sprints);
    }
    setStoriesBySprint(bySprint);
    setShowSprintAssistant(false);
    setSprintType(type);
    setGeneratedStories(allStories); // For fallback/compatibility
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
          <div className="space-y-6 workspace-secondary-sidebar-bg rounded-xl py-3 border workspace-border">
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
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full py-24">
                      {/* Animated progress bar */}
                      <div className="w-full flex flex-col items-center mb-8">
                        <motion.div className="w-48 h-2 rounded-full bg-emerald-100 overflow-hidden mb-3">
                          <motion.div
                            className="h-2 bg-emerald-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut",
                            }}
                          />
                        </motion.div>
                        <motion.div
                          className="text-base font-semibold text-gray-700 tracking-wide"
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut",
                          }}
                        >
                          Generating stories...
                        </motion.div>
                      </div>
                      {/* Skeleton cards reveal */}
                      <div className="w-full max-w-xl space-y-4">
                        {[...Array(4)].map((_, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: idx * 0.3,
                              duration: 0.5,
                              type: "spring",
                            }}
                            className="workspace-header-bg border workspace-border rounded-lg shadow-sm p-4 flex flex-col gap-3"
                            style={{ minHeight: 120 }}
                          >
                            <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                            <div className="flex gap-2 mt-2">
                              <div className="h-6 w-16 bg-emerald-100 rounded-full animate-pulse" />
                              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                              <div className="h-6 w-12 bg-gray-100 rounded-full animate-pulse" />
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded animate-pulse mt-2" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : Object.keys(storiesBySprint).length > 0 ? (
                    <div className="space-y-8 pb-4">
                      {Object.entries(storiesBySprint).map(
                        ([sprintId, stories], idx) => {
                          // Find sprint meta from createdSprints
                          const sprintMeta = createdSprints.find(
                            (s) => s.id === sprintId
                          );
                          return (
                            <div key={sprintId} className="mb-6">
                              <div className="flex flex-col gap-2 mb-2">
                                <div className="flex flex-row items-center justify-between">
                                  <span className="font-bold text-workspace-primary text-base flex items-center">
                                    <ChartGantt className="h-5 w-5 mr-2" />
                                    {sprintMeta?.name || `Sprint ${idx + 1}`}
                                  </span>
                                  <div className="flex gap-2 ml-4 flex-wrap">
                                    {sprintMeta?.duration && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-rose-500/10 text-rose-600"
                                      >
                                        <Calendar className="w-3 h-3 mr-1" />{" "}
                                        {sprintMeta.duration} weeks
                                      </Badge>
                                    )}
                                    {sprintMeta?.startDate &&
                                      sprintMeta?.endDate && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-yellow-500/10 text-yellow-600"
                                        >
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {sprintMeta.startDate
                                            ? new Date(
                                                sprintMeta.startDate
                                              ).toLocaleDateString()
                                            : ""}
                                          {" - "}
                                          {sprintMeta.endDate
                                            ? new Date(
                                                sprintMeta.endDate
                                              ).toLocaleDateString()
                                            : ""}
                                        </Badge>
                                      )}

                                    <Badge
                                      variant="secondary"
                                      className="bg-green-500/10 text-green-600"
                                    >
                                      <SquareCheckBig className="w-3 h-3 mr-1" />{" "}
                                      {stories.length} stories
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-500/10 text-blue-600"
                                    >
                                      <Target className="w-3 h-3 mr-1" />
                                      {stories.reduce(
                                        (sum, s) => sum + (s.storyPoints || 0),
                                        0
                                      )}{" "}
                                      pts
                                    </Badge>
                                  </div>
                                </div>
                                {sprintMeta?.goal && (
                                  <span className="rounded-md text-xs border workspace-border p-2">
                                    {sprintMeta.goal}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-4 pl-2 border-l-2">
                                {/* Keep original story card rendering here */}
                                {stories.map((story, idx) => (
                                  <motion.div
                                    key={story.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{
                                      delay: idx * 0.25,
                                      duration: 0.5,
                                      type: "spring",
                                    }}
                                  >
                                    <Card
                                      className={cn(
                                        "p-4",
                                        story.parentTaskId &&
                                          "border-l-4 border-blue-500 pl-3"
                                      )}
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">
                                              <Typewriter
                                                words={[story.title]}
                                                typeSpeed={30}
                                                cursor={false}
                                              />
                                            </h3>
                                            {story.parentTaskId && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                Sub-story
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              transition={{
                                                delay: idx * 0.25 + 0.2,
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 20,
                                              }}
                                            >
                                              <Badge
                                                variant="secondary"
                                                className={`${getPriorityColor(
                                                  story.priority
                                                )} text-xs flex items-center`}
                                              >
                                                <Goal className="h-3 w-3 mr-1" />
                                                {story.priority}
                                              </Badge>
                                            </motion.div>
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              transition={{
                                                delay: idx * 0.25 + 0.3,
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 20,
                                              }}
                                            >
                                              <Badge
                                                variant="secondary"
                                                className="flex items-center bg-gray-500/10 text-gray-600"
                                              >
                                                <Target className="h-3 w-3 mr-1" />
                                                {story.storyPoints} pts
                                              </Badge>
                                            </motion.div>
                                            {story.estimatedTime && (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{
                                                  delay: idx * 0.25 + 0.4,
                                                  type: "spring",
                                                  stiffness: 400,
                                                  damping: 20,
                                                }}
                                              >
                                                <Badge
                                                  variant="secondary"
                                                  className="bg-blue-500/10 text-blue-500 flex items-center"
                                                >
                                                  <Clock className="h-3 w-3 mr-1" />
                                                  {story.estimatedTime}h
                                                </Badge>
                                              </motion.div>
                                            )}
                                            {story.assignedTeamMember && (
                                              <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                  src={
                                                    story.assignedTeamMember
                                                      .avatar_url
                                                  }
                                                  alt={
                                                    story.assignedTeamMember
                                                      .name
                                                  }
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
                                                (s) =>
                                                  s.id === story.parentTaskId
                                              )?.title
                                            }
                                          </div>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                          As a{" "}
                                          <span className="font-medium">
                                            <Typewriter
                                              words={[story.role]}
                                              typeSpeed={30}
                                              cursor={false}
                                            />
                                          </span>
                                          , I want{" "}
                                          <span className="font-medium">
                                            <Typewriter
                                              words={[story.want]}
                                              typeSpeed={30}
                                              cursor={false}
                                            />
                                          </span>
                                          , so that{" "}
                                          <span className="font-medium">
                                            <Typewriter
                                              words={[story.benefit]}
                                              typeSpeed={30}
                                              cursor={false}
                                            />
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
                                                {story.requirements.map(
                                                  (req, index) => (
                                                    <li key={index}>{req}</li>
                                                  )
                                                )}
                                              </ul>
                                            </div>
                                          )}
                                        {story.antiPatternWarnings &&
                                          story.antiPatternWarnings.length >
                                            0 && (
                                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                              <h4 className="text-sm font-semibold mb-1 text-yellow-800">
                                                ⚠️ Anti-pattern Warnings:
                                              </h4>
                                              <ul className="list-disc list-inside text-sm space-y-1 text-yellow-700">
                                                {story.antiPatternWarnings.map(
                                                  (warning, index) => (
                                                    <li key={index}>
                                                      {warning}
                                                    </li>
                                                  )
                                                )}
                                              </ul>
                                            </div>
                                          )}
                                        {story.tags &&
                                          story.tags.length > 0 && (
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
                                          story.suggestedDependencies.length >
                                            0 && (
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
                                                        (s) =>
                                                          s.id === dep.taskId
                                                      );
                                                    if (!dependentStory)
                                                      return null;
                                                    return (
                                                      <div
                                                        key={index}
                                                        className="p-2 workspace-component-bg rounded-lg text-sm"
                                                      >
                                                        <div className="flex items-center justify-between">
                                                          <span className="font-medium workspace-component-active-color">
                                                            {
                                                              dependentStory.title
                                                            }
                                                          </span>
                                                          <Badge variant="workspace">
                                                            {Math.round(
                                                              dep.confidence *
                                                                100
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
                                      </div>
                                    </Card>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : generatedStories.length > 0 ? (
                    <AnimatePresence>
                      <div className="space-y-4 pb-4">
                        {generatedStories
                          .slice(0, visibleCount)
                          .map((story, idx) => (
                            <motion.div
                              key={story.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{
                                delay: idx * 0.25,
                                duration: 0.5,
                                type: "spring",
                              }}
                            >
                              <Card
                                className={cn(
                                  "p-4",
                                  story.parentTaskId &&
                                    "border-l-4 border-blue-500 pl-3"
                                )}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold">
                                        <Typewriter
                                          words={[story.title]}
                                          typeSpeed={30}
                                          cursor={false}
                                        />
                                      </h3>
                                      {story.parentTaskId && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Sub-story
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                          delay: idx * 0.25 + 0.2,
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 20,
                                        }}
                                      >
                                        <Badge
                                          className={`${getPriorityColor(
                                            story.priority
                                          )} text-xs flex items-center`}
                                        >
                                          <Goal className="h-3 w-3 mr-1" />
                                          {story.priority}
                                        </Badge>
                                      </motion.div>
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                          delay: idx * 0.25 + 0.3,
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 20,
                                        }}
                                      >
                                        <Badge
                                          variant="secondary"
                                          className="flex items-center bg-gray-500/10 text-gray-600"
                                        >
                                          <Target className="h-3 w-3 mr-1" />
                                          {story.storyPoints} pts
                                        </Badge>
                                      </motion.div>
                                      {story.estimatedTime && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{
                                            delay: idx * 0.25 + 0.4,
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 20,
                                          }}
                                        >
                                          <Badge
                                            variant="secondary"
                                            className="bg-blue-500/10 text-blue-500 flex items-center"
                                          >
                                            <Clock className="h-3 w-3 mr-1" />
                                            {story.estimatedTime}h
                                          </Badge>
                                        </motion.div>
                                      )}
                                      {story.assignedTeamMember && (
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage
                                            src={
                                              story.assignedTeamMember
                                                .avatar_url
                                            }
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
                                    <span className="font-medium">
                                      <Typewriter
                                        words={[story.role]}
                                        typeSpeed={30}
                                        cursor={false}
                                      />
                                    </span>
                                    , I want{" "}
                                    <span className="font-medium">
                                      <Typewriter
                                        words={[story.want]}
                                        typeSpeed={30}
                                        cursor={false}
                                      />
                                    </span>
                                    , so that{" "}
                                    <span className="font-medium">
                                      <Typewriter
                                        words={[story.benefit]}
                                        typeSpeed={30}
                                        cursor={false}
                                      />
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
                                          {story.requirements.map(
                                            (req, index) => (
                                              <li key={index}>{req}</li>
                                            )
                                          )}
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
                                      onClick={() =>
                                        handleManageDependencies(story)
                                      }
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
                                      onClick={() =>
                                        handleDuplicateStory(story)
                                      }
                                    >
                                      <Copy className="h-4 w-4 mr-1" />
                                      Duplicate
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteStory(story.id)
                                      }
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                      </div>
                    </AnimatePresence>
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
          newSprintFolderName={newSprintFolderName}
          isGeneratingSuggestions={isGeneratingSuggestions}
          onDestinationTypeChange={(type) => setDestinationType(type)}
          onSelectedSpaceChange={setSelectedSpaceId}
          onSelectedProjectChange={setSelectedProjectId}
          onNewSpaceNameChange={setNewSpaceName}
          onNewProjectNameChange={setNewProjectName}
          onNewStatusNamesChange={setNewStatusNames}
          onNewStatusColorsChange={setNewStatusColors}
          onNewSprintFolderNameChange={setNewSprintFolderName}
          onAIAssist={handleAIAssist}
          isSprintStructure={Object.keys(storiesBySprint).length > 0}
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
              onSaveSprints={handleSaveSprintsFromAssistant}
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
