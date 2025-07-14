"use server";

import { Anthropic } from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/database.types";
import { createEventServer } from "./actions/events";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { PriorityWeights } from "@/components/workspace/ai/priority-scoring-config";
import { getOptimalTeamAssignment } from "@/lib/supabase-vector-service";
import type {
  TeamMember,
  EnhancedStoryGenerationParams,
} from "@/types";
import type { EnhancedSprint } from "@/lib/sprint-creation-service";
import SprintCreationService from "@/lib/sprint-creation-service";
import { DEFAULT_WEIGHTS } from "@/types";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Define the story generation parameters
export type StoryGenerationParams = {
  featureDescription: string;
  numberOfStories?: number;
  userRoles?: string[];
  complexity?: "simple" | "moderate" | "complex";
  workspaceId: string;
  spaceId?: string;
  projectId?: string;
  priorityWeights?: PriorityWeights;
  teamMembers?: TeamMember[];
  useTAWOS?: boolean;
};

// Use the UserStory type from the main types file
import type { UserStory } from "@/types";

/**
 * Generate user stories using TAWOS approach with Supabase vector data
 */
export async function generateTAWOSStories(
  params: EnhancedStoryGenerationParams
): Promise<{
  stories: UserStory[];
  error?: string;
}> {
  try {
    const {
      featureDescription,
      numberOfStories = 3,
      complexity = "moderate",
      priorityWeights = DEFAULT_WEIGHTS,
      teamMembers = [],
      workspaceId,
      useTAWOS = true,
    } = params;

    let tawosPatterns: any[] = [];
    let antiPatterns: string[] = [];
    let storyTemplates: any[] = [];

    if (useTAWOS) {
      try {
        const {
          getTAWOSSuccessPatterns,
          getStoryTemplates,
          getTeamPerformanceData,
        } = await import("@/lib/supabase-vector-service");

        // Get success patterns and anti-patterns
        const patternsResult = await getTAWOSSuccessPatterns(
          featureDescription,
          complexity
        );
        tawosPatterns = patternsResult.patterns;
        antiPatterns = patternsResult.antiPatterns;

        // Get story templates based on similar successful stories
        const templatesResult = await getStoryTemplates(
          featureDescription,
          complexity,
          numberOfStories
        );
        storyTemplates = templatesResult.templates;

        console.log(
          `Found ${tawosPatterns.length} success patterns, ${antiPatterns.length} anti-patterns, and ${storyTemplates.length} story templates from Supabase`
        );
      } catch (error) {
        console.warn(
          "Failed to get TAWOS patterns (Supabase/OpenAI may be unavailable), falling back to standard generation:",
          error
        );
        // Continue with empty patterns - the system will still work
        tawosPatterns = [];
        antiPatterns = [];
        storyTemplates = [];
      }
    }

    // Create enhanced prompt with TAWOS data
    const tawosContext =
      tawosPatterns.length > 0
        ? `
    Based on TAWOS success patterns with ${
      tawosPatterns.length
    } similar successful stories:
    - Average completion rate: ${(
      (tawosPatterns.reduce((sum, p) => sum + p.metadata.completionRate, 0) /
        tawosPatterns.length) *
      100
    ).toFixed(1)}%
    - Common success patterns: ${tawosPatterns
      .slice(0, 3)
      .map((p) => p.metadata.successPattern)
      .join(", ")}
    - Anti-patterns to avoid: ${antiPatterns.slice(0, 5).join(", ")}
    `
        : "";

    const teamContext =
      teamMembers.length > 0
        ? `
    Team composition:
    ${teamMembers
      .map((m) => `- ${m.name} (${m.role}, ${m.level}): ${m.skills.join(", ")}`)
      .join("\n")}
    
    Consider team member skills and levels when assigning stories and estimating complexity.
    `
        : "";

    // Prepare example stories from templates (if available)
    const exampleStoriesSection =
      storyTemplates.length > 0
        ? `\nEXAMPLES OF SUCCESSFUL USER STORIES (JSON):\n${storyTemplates
            .slice(0, 2)
            .map((t, i) => `Example ${i + 1}:\n${JSON.stringify(t, null, 2)}`)
            .join("\n\n")}\n`
        : "";

    const prompt = `
      Generate ${numberOfStories} high-quality user stories for the following feature:
      
      "${featureDescription}"
      
      ${tawosContext}
      
      ${teamContext}
      
      ${exampleStoriesSection}
      
      Complexity level: ${complexity}
      
      Priority weights:
    - Business Value (${priorityWeights.businessValue}%): Impact on business goals and revenue
    - User Impact (${priorityWeights.userImpact}%): Effect on user experience and satisfaction
    - Complexity (${priorityWeights.complexity}%): Technical difficulty and implementation effort
    - Risk (${priorityWeights.risk}%): Potential issues and uncertainties
    - Dependencies (${priorityWeights.dependencies}%): Reliance on other components or systems
    
      CRITICAL REQUIREMENTS:
      1. Each story MUST follow the exact format: "As a [role], I want [capability], so that [benefit]"
      2. Use specific, measurable acceptance criteria (3-5 criteria per story)
      3. Provide accurate story point estimates using Fibonacci sequence (1, 2, 3, 5, 8, 13)
      4. Calculate business value scores (1-5) based on priority weights
      5. Assign priority levels (Critical/High/Medium/Low) based on weighted scoring
      6. Include relevant technical tags for skill matching (e.g., "React", "API", "Database")
      7. Add detailed requirements and estimated time in hours
      8. Consider breaking complex features into sub-stories
      9. AVOID FBI Sentinel anti-patterns:
         - Requirements confusion (vague acceptance criteria)
         - Scope overload (too many features in one story)
         - Missing dependencies
         - Unrealistic time estimates
      
      TAWOS SUCCESS PATTERNS TO FOLLOW:
      - Clear, specific user roles
      - Measurable outcomes in acceptance criteria
      - Realistic story point estimates
      - Proper dependency identification
      - Team skill alignment
      
      IMPORTANT: Return ONLY a valid JSON array. Do not include any explanations, markdown formatting, or text outside the JSON array.
      
      CRITICAL JSON FORMATTING REQUIREMENTS:
      - Return ONLY a valid JSON array with ${numberOfStories} stories
      - Do not include any explanations, markdown formatting, or text outside the JSON array
      - Ensure all strings are properly quoted and escaped
      - No trailing commas in objects or arrays
      - All arrays and objects must be properly closed
      - Use simple quotes and avoid special characters that could break JSON
      - Every property name must be in double quotes
      - Every string value must be in double quotes
      - Escape any quotes within string values with backslash
      
      Return the results as a JSON array with the following structure for each story:
      [
        {
          "title": "Concise story title",
          "priority": "High",
          "storyPoints": 5,
          "estimatedTime": 16,
          "role": "specific user role",
          "want": "specific capability or feature",
          "benefit": "clear business or user benefit",
          "description": "detailed description of the story",
          "acceptanceCriteria": ["specific, measurable criterion 1", "criterion 2", "criterion 3"],
          "requirements": ["specific requirement 1", "requirement 2"],
          "antiPatternWarnings": ["warning 1", "warning 2"],
          "tags": ["technical tag 1", "technical tag 2"],
          "successPattern": "success pattern this story follows",
          "completionRate": 0.85
          "businessValue": 4,
        }
      ]
      
      Ensure all JSON is properly formatted with no trailing commas and all strings are properly escaped.
    `;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = message.content[0].text;

    // Parse the JSON response with robust error handling
    let stories: UserStory[] = [];

    try {
      // Try to extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const jsonString = jsonMatch[0];

        // Try multiple parsing strategies
        const parsingStrategies = [
          // Strategy 1: Direct parsing
          () => JSON.parse(jsonString),

          // Strategy 2: Basic cleaning
          () =>
            JSON.parse(
              jsonString
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                .replace(/\\"/g, '"')
                .replace(/\\n/g, " ")
                .replace(/\\t/g, " ")
                .replace(/\s+/g, " ")
                .replace(/,\s*([}\]])/g, "$1")
                .trim()
            ),

          // Strategy 3: Aggressive cleaning
          () => {
            let cleaned = jsonString
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
              .replace(/\\"/g, '"')
              .replace(/\\n/g, " ")
              .replace(/\\t/g, " ")
              .replace(/\s+/g, " ")
              .replace(/,\s*([}\]])/g, "$1")
              .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
              .replace(
                /:\s*([a-zA-Z][a-zA-Z0-9\s\-_.,!?()]*[a-zA-Z0-9])\s*([,}])/g,
                ':"$1"$2'
              )
              .replace(/:\s*\[([^\]]*)\]/g, (match, content) => {
                const items = content.split(",").map((item: string) => {
                  const trimmed = item.trim();
                  if (trimmed.startsWith('"') && trimmed.endsWith('"'))
                    return trimmed;
                  if (trimmed.startsWith("'") && trimmed.endsWith("'"))
                    return `"${trimmed.slice(1, -1)}"`;
                  if (!trimmed.startsWith('"') && trimmed.length > 0)
                    return `"${trimmed}"`;
                  return trimmed;
                });
                return `:[${items.join(",")}]`;
              })
              .trim();

            // Fix quote balance
            const quoteCount = (cleaned.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) {
              cleaned += '"';
            }

            return JSON.parse(cleaned);
          },
        ];

        let parsedSuccessfully = false;

        for (let i = 0; i < parsingStrategies.length; i++) {
          try {
            const result = parsingStrategies[i]();
            if (Array.isArray(result)) {
              stories = result;
              console.log(
                `Successfully parsed JSON using strategy ${i + 1} with ${
                  stories.length
                } stories`
              );
              parsedSuccessfully = true;
              break;
            }
          } catch (error: unknown) {
            console.log(`Strategy ${i + 1} failed:`, (error as Error).message);
          }
        }

        if (!parsedSuccessfully) {
          console.log(
            "All parsing strategies failed, attempting manual extraction..."
          );

          // Manual extraction as last resort
          const extractedStories = extractPartialStories(
            jsonString,
            numberOfStories,
            params.priorityWeights || {
              businessValue: priorityWeights.businessValue,
              userImpact: priorityWeights.userImpact,
              complexity: priorityWeights.complexity,
              risk: priorityWeights.risk,
              dependencies: priorityWeights.dependencies,
            }
          );
          if (extractedStories.length > 0) {
            stories = extractedStories;
            console.log(`Manually extracted ${stories.length} stories`);
          }
        }
      }

      // If we still don't have stories, generate fallback stories
      if (stories.length === 0) {
        if (storyTemplates.length > 0) {
          // Use story templates as fallback if available
          stories = storyTemplates.slice(0, numberOfStories);
          console.log(`Used ${stories.length} story templates as fallback`);
        } else {
          console.log("No stories extracted, generating fallback stories");
          stories = generateFallbackStories(params, numberOfStories);
        }
      }
      // If we have fewer than requested, fill with templates if available
      if (stories.length < numberOfStories && storyTemplates.length > 0) {
        const needed = numberOfStories - stories.length;
        stories.push(...storyTemplates.slice(0, needed));
        console.log(`Added ${needed} story templates to fill missing stories`);
      }
      // If still not enough, use generic fallback
      if (stories.length < numberOfStories) {
        const additionalStories = generateFallbackStories(
          params,
          numberOfStories - stories.length
        );
        stories.push(...additionalStories);
      }

      // Set priority weight values for all stories (overriding AI-generated 1-5 scores)
      stories = stories.map((story) => ({
        ...story,
        businessValue: priorityWeights.businessValue,
        userImpact: priorityWeights.userImpact,
        complexity: priorityWeights.complexity,
        risk: priorityWeights.risk,
        // Don't override dependencies field as it should remain string[]
      }));

      // Add IDs and enhance with team assignment
      const enhancedStories = await Promise.all(
        stories.map(async (story, index) => {
          const { id, ...storyWithoutId } = story;
          const enhancedStory: UserStory = {
            id: `t${nanoid(12)}`,
            ...storyWithoutId,
          };

          // Assign team member if available
          if (teamMembers.length > 0) {
            try {
              const assignment = await getOptimalTeamAssignment(
                {
                  title: story.title,
                  description: story.description || "",
                  tags: story.tags || [],
                  complexity,
                  priority: story.priority || "Medium",
                },
                teamMembers
              );

              if (assignment.assignedMember) {
                enhancedStory.assignedTeamMember = assignment.assignedMember;
                // Add assignment confidence to the story metadata
                enhancedStory.description = `${
                  enhancedStory.description || ""
                }\n\nTeam Assignment: ${assignment.reason} (Confidence: ${(
                  assignment.confidence * 100
                ).toFixed(0)}%)`;
              } else {
                console.log(
                  `❌ No team member assigned to story "${story.title}"`
                );
              }
            } catch (error: unknown) {
              console.warn(
                "Failed to assign team member (Supabase may be unavailable):",
                error
              );
              // Fallback to simple assignment based on skills
              const bestMatch = teamMembers.find((member) =>
                member.skills.some((skill) =>
                  (story.tags || []).some(
                    (tag) =>
                      skill.toLowerCase().includes(tag.toLowerCase()) ||
                      tag.toLowerCase().includes(skill.toLowerCase())
                  )
                )
              );
              if (bestMatch) {
                enhancedStory.assignedTeamMember = bestMatch;
                enhancedStory.description = `${
                  enhancedStory.description || ""
                }\n\nTeam Assignment: ${bestMatch.name} (skill match fallback)`;
              } else {
                console.log(
                  `❌ No fallback assignment possible for story "${story.title}"`
                );
              }
            }
          } else {
            console.log(`No team members available for story "${story.title}"`);
          }

          return enhancedStory;
        })
      );

      return { stories: enhancedStories };
    } catch (parseError: unknown) {
      console.error("Error parsing AI response:", parseError);
      return {
        stories: [],
        error: "Failed to parse AI response. Please try again.",
      };
    }
  } catch (error: unknown) {
    console.error("Error in generateTAWOSStories:", error);
    return {
      stories: [],
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Extract partial stories from malformed JSON
 */
function extractPartialStories(
  jsonString: string,
  numberOfStories: number,
  priorityWeights: PriorityWeights
): UserStory[] {
  const stories: UserStory[] = [];

  // Simple pattern matching to find story-like content
  const storyBlocks = jsonString.split(/\},\s*\{/).map((block, index) => {
    if (!block.startsWith("{")) block = "{" + block;
    if (!block.endsWith("}")) block = block + "}";
    return { block, index };
  });

  for (let i = 0; i < Math.min(storyBlocks.length, numberOfStories); i++) {
    const { block } = storyBlocks[i];

    // Extract basic fields using regex patterns
    const titleMatch = block.match(/"title"\s*:\s*"([^"]*)"/);
    const roleMatch = block.match(/"role"\s*:\s*"([^"]*)"/);
    const wantMatch = block.match(/"want"\s*:\s*"([^"]*)"/);
    const benefitMatch = block.match(/"benefit"\s*:\s*"([^"]*)"/);
    const storyPointsMatch = block.match(/"storyPoints"\s*:\s*(\d+)/);
    const businessValueMatch = block.match(/"businessValue"\s*:\s*(\d+)/);
    const priorityMatch = block.match(/"priority"\s*:\s*"([^"]*)"/);

    // Create story object with extracted or default values
    const story: UserStory = {
      id: `t${nanoid(12)}`,
      title: titleMatch ? titleMatch[1] : `Extracted Story ${i + 1}`,
      role: roleMatch ? roleMatch[1] : "User",
      want: wantMatch ? wantMatch[1] : "to complete this feature",
      benefit: benefitMatch
        ? benefitMatch[1]
        : "to achieve the desired outcome",
      acceptanceCriteria: [
        "Feature is implemented according to requirements",
        "All acceptance criteria are met",
        "Feature is tested and working correctly",
      ],
      storyPoints: storyPointsMatch ? parseInt(storyPointsMatch[1]) : 5,
      businessValue: priorityWeights.businessValue,
      userImpact: priorityWeights.userImpact,
      complexity: priorityWeights.complexity,
      risk: priorityWeights.risk,
      // dependencies should remain string[] type
      priority: (priorityMatch ? priorityMatch[1] : "Medium") as
        | "Low"
        | "Medium"
        | "High"
        | "Critical",
      tags: ["feature"],
      requirements: ["Implement the requested functionality"],
      estimatedTime: 8,
      description: "Extracted from malformed JSON",
      antiPatternWarnings: ["Extracted from malformed JSON"],
      successPattern: "Extraction pattern",
      completionRate: 0.7,
    };

    stories.push(story);
  }

  return stories;
}

/**
 * Create enhanced sprint with AI support and proper capacity management
 */
export async function createSprintFromStories(
  stories: UserStory[],
  teamMembers: TeamMember[],
  sprintDuration: number = 2
): Promise<{
  sprint: EnhancedSprint | null;
  error?: string;
}> {
  try {
    if (stories.length === 0) {
      return {
        sprint: null,
        error: "No stories available for sprint planning",
      };
    }

    if (teamMembers.length === 0) {
      return {
        sprint: null,
        error: "No team members available for sprint planning",
      };
    }

    // Calculate team capacity based on 8 hours per story point
    const totalWeeklyHours = teamMembers.reduce(
      (sum, member) => sum + (member.availability || 40),
      0
    );
    const sprintHours = totalWeeklyHours * sprintDuration;
    const sprintCapacity = Math.floor(sprintHours / 8); // 1 story point = 8 hours

    // Ensure sprint capacity doesn't exceed 10 points per team member
    const maxCapacityPerMember = 10;
    const maxTotalCapacity = teamMembers.length * maxCapacityPerMember;
    const finalCapacity = Math.min(sprintCapacity, maxTotalCapacity);

    console.log(
      `Team capacity: ${sprintCapacity} points, Max allowed: ${maxTotalCapacity} points, Using: ${finalCapacity} points`
    );

    // Sort stories by priority (Critical > High > Medium > Low) and then by story points
    const sortedStories = [...stories].sort((a, b) => {
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const aPriority = priorityOrder[a.priority || "Medium"];
      const bPriority = priorityOrder[b.priority || "Medium"];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // For same priority, prefer smaller stories first
      return (a.storyPoints || 0) - (b.storyPoints || 0);
    });

    // Group stories by dependencies to ensure dependent stories are in the same sprint
    const dependencyGroups = groupStoriesByDependencies(sortedStories);

    // Distribute stories based on capacity and dependencies
    let currentCapacity = finalCapacity;
    const sprintStories: UserStory[] = [];
    const remainingStories: UserStory[] = [];

    for (const group of dependencyGroups) {
      const groupStoryPoints = group.reduce(
        (sum, story) => sum + (story.storyPoints || 0),
        0
      );

      if (groupStoryPoints <= currentCapacity) {
        // Add entire group to sprint
        sprintStories.push(...group);
        currentCapacity -= groupStoryPoints;
      } else {
        // Group is too large, add individual stories that fit
        for (const story of group) {
          const storyPoints = story.storyPoints || 1;
          if (storyPoints <= currentCapacity) {
            sprintStories.push(story);
            currentCapacity -= storyPoints;
          } else {
            remainingStories.push(story);
          }
        }
      }
    }

    // Create enhanced sprint using the sprint creation service
    const sprintCreationService = new SprintCreationService({
      sprintDuration: sprintDuration * 7, // Convert weeks to days
      workingDaysPerWeek: 5,
      hoursPerDay: 8,
      velocityBuffer: 0.8,
    });

    const enhancedSprints = await sprintCreationService.createDetailedSprints(
      sprintStories,
      { totalStoryPoints: finalCapacity, totalHours: sprintHours },
      teamMembers,
      { startDate: new Date().toISOString() }
    );

    if (enhancedSprints.length === 0) {
      return {
        sprint: null,
        error: "Failed to create enhanced sprint",
      };
    }

    return { sprint: enhancedSprints[0] };
  } catch (error) {
    console.error("Error creating sprint:", error);
    return {
      sprint: null,
      error: "Failed to create sprint. Please try again.",
    };
  }
}

/**
 * Group stories by dependencies to ensure dependent stories are in the same sprint
 */
function groupStoriesByDependencies(stories: UserStory[]): UserStory[][] {
  const groups: UserStory[][] = [];
  const visited = new Set<string>();

  for (const story of stories) {
    if (visited.has(story.id)) continue;

    const group = findDependencyGroup(story, stories, visited);
    groups.push(group);
  }

  return groups;
}

/**
 * Find all stories that are dependent on each other
 */
function findDependencyGroup(
  story: UserStory,
  allStories: UserStory[],
  visited: Set<string>
): UserStory[] {
  const group: UserStory[] = [];
  const queue: UserStory[] = [story];

  while (queue.length > 0) {
    const currentStory = queue.shift()!;
    if (visited.has(currentStory.id)) continue;

    visited.add(currentStory.id);
    group.push(currentStory);

    // Find stories that depend on this story
    const dependents = allStories.filter(
      (s) => s.dependencies && s.dependencies.includes(currentStory.id)
    );

    // Find stories that this story depends on
    const dependencies = allStories.filter(
      (s) =>
        currentStory.dependencies && currentStory.dependencies.includes(s.id)
    );

    queue.push(...dependents, ...dependencies);
  }

  return group;
}

// For embeddings, we'll use a helper function
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is required for embeddings");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-ada-002", // Using ada-002 for 1536 dimensions (compatible with pgvector)
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

/**
 * Save a generated user story to the database
 */
export async function saveUserStory(
  story: UserStory,
  workspaceId: string,
  spaceId: string,
  projectId: string
): Promise<{ success: boolean; error?: string; taskId?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the first status for the project (usually "To Do" or similar)
    const { data: statuses } = await supabase
      .from("statuses")
      .select("status_id")
      .eq("project_id", projectId)
      .order("position", { ascending: true })
      .limit(1);

    if (!statuses || statuses.length === 0) {
      return { success: false, error: "No status found for this project" };
    }

    const statusId = statuses[0].status_id;

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Format the acceptance criteria as a markdown list
    const formattedAcceptanceCriteria = story.acceptanceCriteria
      .map((criterion) => `- ${criterion}`)
      .join("\n");

    // Create the description with the full user story and acceptance criteria
    const description = `
## User Story
As a ${story.role}, I want ${story.want}, so that ${story.benefit}.

## Acceptance Criteria
${formattedAcceptanceCriteria}

## Metadata
- Story Points: ${
      story.storyPoints ? Math.round(story.storyPoints) : "Not estimated"
    }
- Priority: ${story.priority || "Not specified"}
    `.trim();

    // Generate a task ID
    const taskId = `t${nanoid(12)}`;

    // --- NEW: Build embedding input string ---
    const embeddingInput = [
      story.title,
      description,
      story.businessValue !== undefined
        ? `Business Value: ${story.businessValue}`
        : "",
      story.estimatedTime !== undefined
        ? `Estimated Time: ${story.estimatedTime}`
        : "",
      story.storyPoints !== undefined
        ? `Story Points: ${story.storyPoints}`
        : "",
      story.antiPatternWarnings ? story.antiPatternWarnings.join("; ") : "",
      story.requirements ? story.requirements.join("; ") : "",
      story.tags ? story.tags.join(", ") : "",
      story.risk !== undefined ? `Risk: ${story.risk}` : "",
      story.dependencies ? story.dependencies.join(", ") : "",
      story.complexity !== undefined ? `Complexity: ${story.complexity}` : "",
      story.priority ? `Priority: ${story.priority}` : "",
      (story as any).start_date
        ? `Start Date: ${(story as any).start_date}`
        : "",
      (story as any).due_date ? `Due Date: ${(story as any).due_date}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    let embedding = null;
    try {
      embedding = await generateEmbedding(embeddingInput);
    } catch (embeddingError) {
      console.warn("Failed to generate embedding for story:", embeddingError);
    }

    // Insert the story as a task
    const { error } = await supabase.from("tasks").insert({
      task_id: taskId,
      name: story.title,
      description,
      status_id: statusId,
      priority: story.priority?.toLowerCase() || "medium",
      project_id: projectId,
      space_id: spaceId,
      velocity: story.velocity,
      workspace_id: workspaceId,
      created_by: user.id,
      embedding: embedding,
    });

    if (error) {
      console.error("Error saving user story:", error);
      return { success: false, error: error.message };
    }

    // Revalidate the project page to show the new task
    revalidatePath(`/${workspaceId}/space/${spaceId}/project/${projectId}`);

    return { success: true, taskId };
  } catch (error) {
    console.error("Error saving user story:", error);
    return {
      success: false,
      error: "An error occurred while saving the story. Please try again.",
    };
  }
}

// Validate if a project ID exists
export async function validateProjectId(
  projectId: string,
  workspaceId: string
): Promise<{
  exists: boolean;
  projectName?: string;
  spaceId?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    // First get the workspace UUID from workspace_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return { exists: false, error: "Workspace not found" };
    }

    // Then find the project using project_id and workspace UUID
    const { data: project, error } = await supabase
      .from("projects")
      .select("name, space_id")
      .eq("project_id", projectId)
      .eq("workspace_id", workspace.id)
      .single();

    if (error) {
      return { exists: false, error: error.message };
    }

    return {
      exists: true,
      projectName: project.name,
      spaceId: project.space_id,
    };
  } catch (e: any) {
    console.error("Error validating project ID:", e);
    return {
      exists: false,
      error: e.message || "Failed to validate project ID",
    };
  }
}

// Create a task with AI assistance
export async function createTaskWithAI(
  projectId: string,
  taskName: string,
  description: string,
  workspaceId: string
): Promise<{
  success: boolean;
  taskId?: string;
  taskName?: string;
  projectId?: string;
  spaceId?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // First get the workspace UUID from workspace_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Get project details using project_id and workspace UUID
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, space_id")
      .eq("project_id", projectId)
      .eq("workspace_id", workspace.id)
      .single();

    if (projectError) {
      return {
        success: false,
        error: `Project not found: ${projectError.message}`,
      };
    }

    // Try to find a status for this project in multiple ways
    let statusId = null;

    // 1. First try project-specific statuses
    const { data: projectStatuses } = await supabase
      .from("statuses")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("project_id", project.id)
      .order("position", { ascending: true })
      .limit(1);

    if (projectStatuses && projectStatuses.length > 0) {
      statusId = projectStatuses[0].id;
    } else {
      // 2. Try space-level statuses
      const { data: spaceStatuses } = await supabase
        .from("statuses")
        .select("id")
        .eq("workspace_id", workspace.id)
        .eq("space_id", project.space_id)
        .is("project_id", null)
        .order("position", { ascending: true })
        .limit(1);

      if (spaceStatuses && spaceStatuses.length > 0) {
        statusId = spaceStatuses[0].id;
      } else {
        // 3. Finally, try workspace-level statuses
        const { data: workspaceStatuses } = await supabase
          .from("statuses")
          .select("id")
          .eq("workspace_id", workspace.id)
          .is("space_id", null)
          .is("project_id", null)
          .order("position", { ascending: true })
          .limit(1);

        if (workspaceStatuses && workspaceStatuses.length > 0) {
          statusId = workspaceStatuses[0].id;
        }
      }
    }

    if (!statusId) {
      return {
        success: false,
        error:
          "No status found for this project. Please create a status first.",
      };
    }

    // Generate embedding for the task
    let embedding = null;
    if (description || taskName) {
      const textToEmbed = description || taskName;
      try {
        embedding = await generateEmbedding(textToEmbed);
      } catch (embeddingError) {
        console.warn(
          "Failed to generate embedding, continuing without it:",
          embeddingError
        );
        // Continue without embedding if it fails
      }
    }

    // Create the task
    const { data: newTask, error: taskError } = await supabase
      .from("tasks")
      .insert({
        name: taskName,
        description: description || null,
        status_id: statusId,
        project_id: project.id,
        space_id: project.space_id,
        workspace_id: workspace.id,
        created_by: user.id,
        embedding: embedding,
        priority: "medium", // Set default priority
      })
      .select("id, task_id, name")
      .single();

    if (taskError) {
      return {
        success: false,
        error: `Failed to create task: ${taskError.message}`,
      };
    }

    // Create event for task creation
    try {
      await createEventServer({
        type: "created",
        entityType: "task",
        entityId: newTask.id,
        entityName: newTask.name,
        userId: user.id,
        workspaceId: workspace.id,
        spaceId: project.space_id,
        projectId: project.id,
        description: `Created task "${newTask.name}" with AI assistance`,
        metadata: {
          projectId,
          aiAssisted: true,
        },
      });
    } catch (eventError) {
      console.warn(
        "Failed to create event, but task was created successfully:",
        eventError
      );
      // Don't fail the task creation if event creation fails
    }

    // Revalidate the project page
    revalidatePath(
      `/${workspaceId}/space/${project.space_id}/project/${projectId}`
    );

    // Dispatch custom event for sidebar synchronization (client-side only)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("taskCreated", {
          detail: { task: newTask, project },
        })
      );
    }

    return {
      success: true,
      taskId: newTask.task_id,
      taskName: newTask.name,
      projectId,
      spaceId: project.space_id,
    };
  } catch (e: any) {
    console.error("Error creating task with AI:", e);
    return { success: false, error: e.message || "Failed to create task" };
  }
}

// Find similar tasks with AI
export async function findSimilarTasksWithAI(
  query: string,
  workspaceId: string,
  limit = 5
): Promise<{ tasks: Task[] | null; error: string | null }> {
  try {
    const supabase = await createServerSupabaseClient();

    // First get the workspace UUID from workspace_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return { tasks: null, error: "Workspace not found" };
    }

    // Generate embedding for the query
    let queryEmbedding = null;
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (embeddingError) {
      console.warn(
        "Failed to generate embedding for search, using text search instead:",
        embeddingError
      );
    }

    let similarTasks;
    let dbError;

    if (queryEmbedding) {
      // Use vector similarity search if embedding is available
      const result = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, avatar_url),
          status:statuses(*),
          task_tags(tag:tags(*))
        `
        )
        .eq("workspace_id", workspace.id)
        .not("embedding", "is", null)
        .order("embedding <-> " + JSON.stringify(queryEmbedding)) // Order by cosine distance
        .limit(limit);

      similarTasks = result.data;
      dbError = result.error;
    } else {
      // Fallback to text search if embedding fails
      const result = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, avatar_url),
          status:statuses(*),
          task_tags(tag:tags(*))
        `
        )
        .eq("workspace_id", workspace.id)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      similarTasks = result.data;
      dbError = result.error;
    }

    if (dbError) {
      return { tasks: null, error: dbError.message };
    }

    return { tasks: similarTasks as Task[], error: null };
  } catch (e: any) {
    console.error("Error finding similar tasks:", e);
    return { tasks: null, error: e.message || "Failed to find similar tasks" };
  }
}

// Action to generate a task description using AI
export async function generateTaskDescription(
  prompt: string
): Promise<{ description: string | null; error: string | null }> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 200,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `Generate a concise and clear task description based on the following input: "${prompt}". Focus on what needs to be done.`,
        },
      ],
    });
    return { description: message.content[0].text, error: null };
  } catch (e: any) {
    console.error("Error generating task description:", e);
    return {
      description: null,
      error: e.message || "Failed to generate description.",
    };
  }
}

/**
 * Generate suggestions for space/project/status names based on feature description
 */
export async function generateProjectSuggestions(
  featureDescription: string,
  stories: UserStory[]
): Promise<{
  spaceName?: string;
  projectName?: string;
  statusNames?: string[];
  statusColors?: string[];
  error?: string;
}> {
  try {
    // Check if Claude API key is configured
    if (!process.env.CLAUDE_API_KEY) {
      return {
        error:
          "Claude API key is not configured. Please add CLAUDE_API_KEY to your environment variables.",
      };
    }

    const storiesSummary = stories.map((s) => ({
      title: s.title,
      priority: s.priority,
      complexity: s.storyPoints,
    }));

    const prompt = `
      Based on these user stories: ${JSON.stringify(storiesSummary, null, 2)}
      
      Generate appropriate names and workflow for:
      1. A space name (workspace area) - should be broad and encompassing
      2. A project name - should be specific to these stories
      3. Status workflow that makes sense for these stories, considering:
         - Story priorities (${stories.map((s) => s.priority).join(", ")})
         - Story points/complexity levels
         - Dependencies between stories
         - Common agile/scrum practices
      
      For the status workflow:
      - Suggest 4-6 statuses that make sense for this project
      - Each status should have a color from: red, blue, green, yellow, purple, pink, indigo, orange, teal, cyan, gray
      - Consider including specialized statuses if needed (e.g., "Design Review" for UI stories)
      - Status names should be clear and actionable
      
      Return ONLY a valid JSON object with this exact structure:
      {
        "spaceName": "suggested space name",
        "projectName": "suggested project name", 
        "statusNames": ["Status 1", "Status 2", "Status 3", "Status 4"],
        "statusColors": ["color1", "color2", "color3", "color4"]
      }
    `;

    console.log("Generating project suggestions with AI...");

    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = message.content[0].text;
    console.log(
      "AI suggestions response received:",
      text.slice(0, 200) + "..."
    );

    try {
      // First try to extract JSON from the response (in case there's additional text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let suggestions;

      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(text);
      }

      // Validate the response structure
      if (
        !suggestions.spaceName ||
        !suggestions.projectName ||
        !suggestions.statusNames ||
        !suggestions.statusColors ||
        !Array.isArray(suggestions.statusNames) ||
        !Array.isArray(suggestions.statusColors) ||
        suggestions.statusNames.length !== suggestions.statusColors.length
      ) {
        console.error("Invalid suggestions structure:", suggestions);
        return {
          spaceName: "New Space",
          projectName: "New Project",
          statusNames: ["To Do", "In Progress", "Review", "Done"],
          statusColors: ["gray", "blue", "yellow", "green"],
          error: "AI returned incomplete suggestions. Using defaults.",
        };
      }

      // Validate status colors
      const validColors = [
        "red",
        "blue",
        "green",
        "yellow",
        "purple",
        "pink",
        "indigo",
        "orange",
        "teal",
        "cyan",
        "gray",
      ];
      suggestions.statusColors = suggestions.statusColors.map(
        (color: string) => {
          const validColor = validColors.find(
            (c) => c === color.toLowerCase() || color.toLowerCase().includes(c)
          );
          return validColor || "gray";
        }
      );

      console.log("Successfully parsed suggestions:", suggestions);

      return {
        spaceName: suggestions.spaceName,
        projectName: suggestions.projectName,
        statusNames: suggestions.statusNames,
        statusColors: suggestions.statusColors,
      };
    } catch (parseError) {
      console.error("Failed to parse AI suggestions response:", parseError);
      console.error("AI response text:", text);
      return {
        spaceName: "New Space",
        projectName: "New Project",
        statusNames: ["To Do", "In Progress", "Review", "Done"],
        statusColors: ["gray", "blue", "yellow", "green"],
        error: "Failed to parse AI suggestions. Using defaults.",
      };
    }
  } catch (error) {
    console.error("Error generating project suggestions:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return {
          error:
            "Claude API key is invalid or missing. Please check your configuration.",
        };
      }
      if (error.message.includes("quota")) {
        return {
          error:
            "Claude API quota exceeded. Please check your Claude usage limits.",
        };
      }
    }

    return {
      spaceName: "New Space",
      projectName: "New Project",
      statusNames: ["To Do", "In Progress", "Review", "Done"],
      statusColors: ["gray", "blue", "yellow", "green"],
      error: "Failed to generate suggestions.",
    };
  }
}

/**
 * Helper function to get default status colors as names
 */
function getDefaultStatusColorName(index: number): string {
  const colors = ["indigo", "yellow", "green", "red", "purple"];
  return colors[index % colors.length];
}

/**
 * Create a new space and project with AI-generated content
 * @param workspaceId The workspace ID
 * @param spaceName The name of the new space (empty string if using existing space)
 * @param projectName The name of the new project
 * @param statusNames Array of status names
 * @param statusColors Optional array of status colors
 * @param existingSpaceId The ID of an existing space to create the project in
 */
export async function createSpaceAndProject(
  workspaceId: string,
  spaceName: string,
  projectName: string,
  statusNames: string[],
  statusColors?: string[],
  existingSpaceId?: string
): Promise<{
  success: boolean;
  spaceId?: string;
  projectId?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get workspace UUID
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return { success: false, error: "Workspace not found" };
    }

    let spaceId;
    let spaceUuid;

    // If using existing space
    if (existingSpaceId && existingSpaceId.length > 0) {
      const { data: existingSpace, error: spaceError } = await supabase
        .from("spaces")
        .select("id, space_id")
        .eq("space_id", existingSpaceId)
        .eq("workspace_id", workspace.id)
        .single();

      if (spaceError || !existingSpace) {
        return { success: false, error: "Existing space not found" };
      }

      spaceId = existingSpace.space_id;
      spaceUuid = existingSpace.id;
    }
    // Create new space
    else if (spaceName.length > 0) {
      const { data: newSpace, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name: spaceName,
          description: `Space for ${spaceName} related projects`,
          icon: "blue",
          is_private: false,
          workspace_id: workspace.id,
        })
        .select("id, space_id")
        .single();

      if (spaceError || !newSpace) {
        return {
          success: false,
          error: `Failed to create space: ${spaceError?.message}`,
        };
      }

      // Add user as space member
      await supabase.from("space_members").insert({
        space_id: newSpace.id,
        user_id: user.id,
        role: "admin",
      });

      spaceId = newSpace.space_id;
      spaceUuid = newSpace.id;
    } else {
      return {
        success: false,
        error: "Either spaceName or existingSpaceId must be provided",
      };
    }

    // Create project
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: projectName,
        space_id: spaceUuid,
        workspace_id: workspace.id,
      })
      .select("id, project_id")
      .single();

    if (projectError || !newProject) {
      return {
        success: false,
        error: `Failed to create project: ${projectError?.message}`,
      };
    }

    // Create statuses for the project with colors
    const statusInserts = statusNames.map((statusName, index) => ({
      name: statusName,
      color:
        statusColors && statusColors[index]
          ? statusColors[index] // Save color name directly
          : getDefaultStatusColorName(index), // Use color name instead of hex
      position: index,
      type: "project", // Required field - these are project-specific statuses
      project_id: newProject.id,
      space_id: spaceUuid,
      workspace_id: workspace.id,
    }));

    const { data: createdStatuses, error: statusError } = await supabase
      .from("statuses")
      .insert(statusInserts)
      .select();

    if (statusError) {
      console.error("Failed to create statuses:", statusError);
      return {
        success: false,
        error: `Failed to create statuses: ${statusError.message}`,
      };
    }

    return {
      success: true,
      spaceId: spaceId,
      projectId: newProject.project_id,
    };
  } catch (error) {
    console.error("Error creating space and project:", error);
    return {
      success: false,
      error: "Failed to create space and project",
    };
  }
}

/**
 * Helper function to get tag colors
 */
function getTagColor(tagName: string): string {
  const colorMap: Record<string, string> = {
    "ai-generated": "#8b5cf6",
    "user-story": "#10b981",
    high: "#f59e0b",
    medium: "#3B82F6",
    low: "#10b981",
    critical: "#ef4444",
  };
  return colorMap[tagName] || "#6b7280";
}

/**
 * Generate relevant tags based on story content
 */
function generateStoryTags(story: UserStory): string[] {
  const tags = new Set<string>();

  // Extract keywords from title, role, want, and benefit sections
  const textToAnalyze = [
    story.title,
    story.role,
    story.want,
    story.benefit,
    ...story.acceptanceCriteria,
  ]
    .join(" ")
    .toLowerCase();

  // Common domain areas and features
  const domainAreas = {
    // User Interface
    ui: [
      "ui",
      "interface",
      "design",
      "layout",
      "responsive",
      "mobile",
      "desktop",
      "theme",
      "style",
    ],

    // User Experience
    ux: [
      "ux",
      "experience",
      "usability",
      "accessibility",
      "a11y",
      "workflow",
      "journey",
    ],

    // Development Areas
    frontend: [
      "frontend",
      "front-end",
      "client",
      "browser",
      "spa",
      "react",
      "vue",
      "angular",
    ],
    backend: [
      "backend",
      "back-end",
      "server",
      "api",
      "database",
      "storage",
      "cache",
    ],

    // Features
    auth: [
      "authentication",
      "authorization",
      "login",
      "signup",
      "password",
      "oauth",
    ],
    data: [
      "data",
      "database",
      "storage",
      "crud",
      "sync",
      "backup",
      "import",
      "export",
    ],
    integration: [
      "integration",
      "api",
      "webhook",
      "sync",
      "connect",
      "third-party",
    ],
    security: ["security", "encryption", "protection", "privacy", "compliance"],

    // User Types
    roles: [
      "admin",
      "user",
      "customer",
      "manager",
      "developer",
      "moderator",
      "editor",
    ],

    // Common Features
    common: [
      "search",
      "filter",
      "sort",
      "notification",
      "report",
      "dashboard",
      "analytics",
      "settings",
    ],
  };

  // Analyze text for each domain area
  for (const [domain, keywords] of Object.entries(domainAreas)) {
    for (const keyword of keywords) {
      if (textToAnalyze.includes(keyword)) {
        // For some domains, use the keyword itself as the tag
        if (["roles", "common"].includes(domain)) {
          tags.add(keyword);
        } else {
          // For technical domains, use the domain as the tag
          tags.add(domain);
        }
        break; // Break after finding first match in this domain
      }
    }
  }

  // Extract specific feature names (words following "implement", "add", "create", "enable", "support")
  const featureRegex =
    /(?:implement|add|create|enable|support)\s+([a-z0-9-]+(?:\s+[a-z0-9-]+){0,2})/g;
  let match;
  while ((match = featureRegex.exec(textToAnalyze)) !== null) {
    const feature = match[1].trim().replace(/\s+/g, "-");
    if (feature.length > 3) {
      // Only add if feature name is meaningful
      tags.add(feature);
    }
  }

  return Array.from(tags);
}

/**
 * Save a new team member to the database
 */
export async function saveTeamMember(
  teamMember: TeamMember,
  workspaceId: string
): Promise<{ success: boolean; error?: string; memberId?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get workspace UUID
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Find or create a default team for AI-generated members
    let { data: defaultTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("name", "AI Generated Team")
      .single();

    if (!defaultTeam) {
      // Create a default team for AI-generated members
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: "AI Generated Team",
          description:
            "Team created automatically for AI-generated story assignments",
          workspace_id: workspace.id,
        })
        .select("id")
        .single();

      if (teamError) {
        console.error("Error creating default team:", teamError);
        return { success: false, error: "Failed to create team for member" };
      }

      defaultTeam = newTeam;
    }

    // Find or create role
    let { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("name", teamMember.role)
      .single();

    if (!role) {
      // Create a new role if it doesn't exist
      const { data: newRole, error: roleError } = await supabase
        .from("roles")
        .insert({
          name: teamMember.role,
          description: `Role for ${teamMember.role}`,
        })
        .select("id")
        .single();

      if (roleError) {
        console.error("Error creating role:", roleError);
        return { success: false, error: "Failed to create role for member" };
      }

      role = newRole;
    }

    // Map level to database level
    const levelMap: Record<string, string> = {
      Junior: "Junior",
      Mid: "Mid-Level",
      Senior: "Senior",
      Lead: "Lead",
    };

    const levelName = levelMap[teamMember.level] || "Mid-Level";

    // Find or create level
    let { data: level } = await supabase
      .from("levels")
      .select("id")
      .eq("name", levelName)
      .single();

    if (!level) {
      // Create a new level if it doesn't exist
      const { data: newLevel, error: levelError } = await supabase
        .from("levels")
        .insert({
          name: levelName,
          description: `Level: ${levelName}`,
        })
        .select("id")
        .single();

      if (levelError) {
        console.error("Error creating level:", levelError);
        return { success: false, error: "Failed to create level for member" };
      }

      level = newLevel;
    }

    // Check if member already exists by email across all teams in the workspace
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id, team_id")
      .eq("email", teamMember.email)
      .eq("team_id", defaultTeam.id)
      .single();

    if (existingMember) {
      // Member already exists in this team, return success with existing ID
      return { success: true, memberId: existingMember.id };
    }

    // Check if member exists in any other team in the workspace
    const { data: existingMemberInOtherTeam } = await supabase
      .from("team_members")
      .select("id, team_id")
      .eq("email", teamMember.email)
      .neq("team_id", defaultTeam.id)
      .single();

    if (existingMemberInOtherTeam) {
      return { success: true, memberId: existingMemberInOtherTeam.id };
    }

    // Validate and sanitize the team member data
    const memberName =
      teamMember.name?.trim() || `AI Generated ${teamMember.role}`;
    const memberEmail =
      teamMember.email?.trim() || `ai-generated-${Date.now()}@example.com`;

    console.log("Saving team member with data:", {
      name: memberName,
      email: memberEmail,
      role: teamMember.role,
      level: teamMember.level,
      skills: teamMember.skills,
      availability: teamMember.availability,
    });

    const { data: newMember, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: defaultTeam.id,
        name: memberName,
        email: memberEmail,
        role_id: role.id,
        level_id: level.id,
        description: `AI-generated member with skills: ${teamMember.skills.join(
          ", "
        )}`,
        is_registered: false,
        workspace_id: workspace.id,
        weekly_hours: teamMember.availability,
      })
      .select("id")
      .single();

    if (memberError) {
      console.error("Error creating team member:", memberError);
      return { success: false, error: "Failed to create team member" };
    }

    return { success: true, memberId: newMember.id };
  } catch (error) {
    console.error("Error saving team member:", error);
    return {
      success: false,
      error:
        "An error occurred while saving the team member. Please try again.",
    };
  }
}

export async function saveUserStoryToDestination(
  story: UserStory,
  workspaceId: string,
  destination: {
    type: "existing" | "new";
    spaceId?: string;
    projectId?: string;
    spaceName?: string;
    projectName?: string;
    statusNames?: string[];
    sprintId?: string;
    statusId?: string; // <-- Add this
  },
  priorityWeights?: PriorityWeights
): Promise<{ success: boolean; error?: string; taskId?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get workspace UUID
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    let spaceId: string;
    let projectId: string;
    let statusId: string;

    // Handle existing space/project
    if (
      !destination.sprintId &&
      (!destination.spaceId || !destination.projectId)
    ) {
      return {
        success: false,
        error: "Space ID and project ID are required for existing destinations",
      };
    }

    // For sprint mode, we only need spaceId and sprintId
    if (destination.sprintId) {
      if (!destination.spaceId) {
        return {
          success: false,
          error: "Space ID is required for sprint destinations",
        };
      }
      spaceId = destination.spaceId;
      // In sprint mode, we don't have a projectId
      projectId = ""; // Set to empty string for sprint mode
    } else {
      // For project mode, we need both spaceId and projectId
      if (!destination.spaceId || !destination.projectId) {
        return {
          success: false,
          error:
            "Space ID and project ID are required for project destinations",
        };
      }
      spaceId = destination.spaceId;
      projectId = destination.projectId;
    }

    // Find a status for this project or sprint
    if (destination.sprintId) {
      // For sprint mode, use the provided statusId or find one
      if (destination.statusId) {
        statusId = destination.statusId;
      } else {
        return {
          success: false,
          error: "Status ID is required for sprint destinations.",
        };
      }
    } else {
      // For project mode, find status by project_id
      const { data: projectStatuses } = await supabase
        .from("statuses")
        .select("id")
        .eq("workspace_id", workspace.id)
        .eq("project_id", projectId)
        .order("position", { ascending: true })
        .limit(1);

      if (projectStatuses && projectStatuses.length > 0) {
        statusId = projectStatuses[0].id;
      } else {
        return {
          success: false,
          error: "No status found for this project.",
        };
      }
    }

    // Save assigned team member if it's a new member (ID starts with 'member-')
    let assignedMemberId: string | undefined;
    if (
      story.assignedTeamMember &&
      story.assignedTeamMember.id.startsWith("member-")
    ) {
      // This is a new team member that needs to be saved
      const memberResult = await saveTeamMember(
        story.assignedTeamMember,
        workspaceId
      );
      if (memberResult.success && memberResult.memberId) {
        assignedMemberId = memberResult.memberId;
      }
    }

    // If we have an assigned team member, try to find their user ID
    let assigneeId: string | undefined;
    if (story.assignedTeamMember) {
      if (assignedMemberId) {
        // Get the user ID from the saved/existing team member
        const { data: savedMember } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("id", assignedMemberId)
          .single();

        if (savedMember?.user_id) {
          assigneeId = savedMember.user_id;
        }
      } else if (!story.assignedTeamMember.id.startsWith("member-")) {
        // This is an existing team member, try to find their user ID
        const { data: existingMember } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("id", story.assignedTeamMember.id)
          .single();

        if (existingMember?.user_id) {
          assigneeId = existingMember.user_id;
        }
      }
    }

    // Format the acceptance criteria as a markdown list
    const formattedAcceptanceCriteria = story.acceptanceCriteria
      .map((criterion) => `- ${criterion}`)
      .join("\n");

    // Format requirements if they exist
    const formattedRequirements =
      story.requirements && story.requirements.length > 0
        ? story.requirements.map((req) => `- ${req}`).join("\n")
        : "None specified";

    // Format anti-pattern warnings if they exist
    const formattedAntiPatterns =
      story.antiPatternWarnings && story.antiPatternWarnings.length > 0
        ? story.antiPatternWarnings
            .map((warning) => `- ⚠️ ${warning}`)
            .join("\n")
        : "None detected";

    // Create enhanced description with all TAWOS metadata
    const description = `
      ## User Story
      As a **${story.role}**, I want **${story.want}**, so that **${
      story.benefit
    }**.

      ## Acceptance Criteria
      ${formattedAcceptanceCriteria}

      ## Story Details
      - **Story Points**: ${
        story.storyPoints ? Math.round(story.storyPoints) : "Not estimated"
      }
      - **Business Value Weight**: ${
        story.businessValue ? Math.round(story.businessValue) : "Not specified"
      }%
      - **User Impact Weight**: ${
        story.userImpact ? Math.round(story.userImpact) : "Not specified"
      }%
      - **Complexity Weight**: ${
        story.complexity ? Math.round(story.complexity) : "Not specified"
      }%
      - **Risk Weight**: ${
        story.risk ? Math.round(story.risk) : "Not specified"
      }%
      - **Dependencies**: ${
        story.dependencies && story.dependencies.length > 0
          ? story.dependencies.join(", ")
          : "None specified"
      }
      - **Priority**: ${story.priority || "Medium"}
      - **Estimated Time**: ${
        story.estimatedTime
          ? `${Math.round(story.estimatedTime)} hours`
          : "Not estimated"
      }
      - **Success Pattern**: ${story.successPattern || "Not specified"}
      - **Completion Rate**: ${
        story.completionRate
          ? `${Math.round(story.completionRate * 100)}%`
          : "Not specified"
      }
      - **Velocity**: ${
        story.velocity
          ? `${Math.round(story.velocity)} points/sprint`
          : "Not specified"
      }

      ## Requirements
      ${formattedRequirements}

      ## Anti-Pattern Warnings
      ${formattedAntiPatterns}
    `.trim();

    // Generate tags for the story
    const storyTags = generateStoryTags(story);

    // Use the story's ID as the task ID
    const taskId = story.id;

    // --- NEW: Build embedding input string ---
    const embeddingInput = [
      story.title,
      description,
      story.businessValue !== undefined
        ? `Business Value: ${story.businessValue}`
        : "",
      story.estimatedTime !== undefined
        ? `Estimated Time: ${story.estimatedTime}`
        : "",
      story.storyPoints !== undefined
        ? `Story Points: ${story.storyPoints}`
        : "",
      story.antiPatternWarnings ? story.antiPatternWarnings.join("; ") : "",
      story.requirements ? story.requirements.join("; ") : "",
      story.tags ? story.tags.join(", ") : "",
      story.risk !== undefined ? `Risk: ${story.risk}` : "",
      story.dependencies ? story.dependencies.join(", ") : "",
      story.complexity !== undefined ? `Complexity: ${story.complexity}` : "",
      story.priority ? `Priority: ${story.priority}` : "",
      (story as any).start_date
        ? `Start Date: ${(story as any).start_date}`
        : "",
      (story as any).due_date ? `Due Date: ${(story as any).due_date}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    let embedding = null;
    try {
      embedding = await generateEmbedding(embeddingInput);
    } catch (embeddingError) {
      console.warn("Failed to generate embedding for story:", embeddingError);
    }

    // Prepare external data for TAWOS metadata
    const externalData = {
      tawos: {
        storyPoints: story.storyPoints,
        businessValue: priorityWeights?.businessValue || story.businessValue,
        userImpact: priorityWeights?.userImpact || story.userImpact,
        complexity: priorityWeights?.complexity || story.complexity,
        risk: priorityWeights?.risk || story.risk,
        dependencies: priorityWeights?.dependencies || story.dependencies,
        estimatedTime: story.estimatedTime,
        successPattern: story.successPattern,
        completionRate: story.completionRate,
        velocity: story.velocity,
        antiPatternWarnings: story.antiPatternWarnings,
        requirements: story.requirements,
        tags: story.tags,
        assignedTeamMember: story.assignedTeamMember
          ? {
              name: story.assignedTeamMember.name,
              role: story.assignedTeamMember.role,
              level: story.assignedTeamMember.level,
              skills: story.assignedTeamMember.skills,
              availability: story.assignedTeamMember.availability,
            }
          : null,
        suggestedDependencies: story.suggestedDependencies,
        childTaskIds: story.childTaskIds,
        parentTaskId: story.parentTaskId,
        role: story.role,
        want: story.want,
        benefit: story.benefit,
        acceptanceCriteria: story.acceptanceCriteria,
      },
      generatedAt: new Date().toISOString(),
      aiGenerated: true,
      version: "1.0",
    };

    // Insert the story as a task without parent_task_id initially
    const { data: insertedTask, error: taskError } = await supabase
      .from("tasks")
      .insert({
        task_id: `t${nanoid(12)}`,
        name: story.title,
        description,
        status_id: destination.statusId || statusId,
        priority: story.priority?.toLowerCase() || "medium",
        project_id: destination.sprintId ? null : projectId, // null for sprint mode
        space_id: spaceId,
        estimated_time: story.estimatedTime
          ? Math.round(story.estimatedTime)
          : null,
        story_points: story.storyPoints ? Math.round(story.storyPoints) : null,
        business_value:
          priorityWeights?.businessValue || story.businessValue || null,
        user_impact: priorityWeights?.userImpact,
        complexity: priorityWeights?.complexity,
        risk: priorityWeights?.risk,
        dependency_score: story.dependencyScore,
        velocity: story.velocity ? Math.round(story.velocity) : null,
        assignee_id: assigneeId || null,
        workspace_id: workspace.id,
        created_by: user.id,
        type: "ai-generated",
        external_data: externalData,
        pending_sync: false,
        sync_status: "synced",
        embedding: embedding,
        sprint_id: destination.sprintId || null,
      })
      .select("id, task_id")
      .single();

    if (taskError) {
      console.error("Error saving user story:", taskError);
      return { success: false, error: taskError.message };
    }

    // Handle parent-child relationships after task creation
    if (story.parentTaskId) {
      // Find the parent task's internal ID
      const { data: parentTask } = await supabase
        .from("tasks")
        .select("id")
        .eq("task_id", story.parentTaskId)
        .single();

      if (parentTask) {
        // Update the current task with the parent's internal ID
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ parent_task_id: parentTask.id })
          .eq("id", insertedTask.id);

        if (updateError) {
          console.error(
            "Error updating parent task relationship:",
            updateError
          );
          // Don't fail the whole operation if parent update fails
        }
      }
    }

    // If this story has child stories, update their parent_task_id
    if (story.childTaskIds && story.childTaskIds.length > 0) {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ parent_task_id: insertedTask.id })
        .in("task_id", story.childTaskIds);

      if (updateError) {
        console.error("Error updating child tasks:", updateError);
        // Don't fail the whole operation if child update fails
      }
    }

    // Create tags for the task
    for (const tagName of storyTags) {
      // First try to find existing tag
      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .eq("workspace_id", workspace.id)
        .single();

      let tagId;
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // Create new tag
        const { data: newTag } = await supabase
          .from("tags")
          .insert({
            name: tagName,
            color: getTagColor(tagName),
            workspace_id: workspace.id,
          })
          .select("id")
          .single();

        tagId = newTag?.id;
      }

      // Link tag to task
      if (tagId) {
        await supabase.from("task_tags").insert({
          task_id: insertedTask.id,
          tag_id: tagId,
        });
      }
    }

    // Revalidate the project page to show the new task
    revalidatePath(`/${workspaceId}/space/${spaceId}/project/${projectId}`);

    return { success: true, taskId: insertedTask.task_id };
  } catch (error) {
    console.error("Error saving user story to destination:", error);
    return {
      success: false,
      error: "An error occurred while saving the story. Please try again.",
    };
  }
}

/**
 * Analyze story content and suggest dependencies
 */
export async function analyzeStoryDependencies(stories: UserStory[]): Promise<{
  suggestions: {
    storyId: string;
    suggestedDependencies: {
      taskId: string;
      reason: string;
      confidence: number;
    }[];
  }[];
  error?: string;
}> {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      return {
        suggestions: [],
        error: "Claude API key is not configured",
      };
    }

    const prompt = `
      Analyze these user stories and suggest logical dependencies between them.
      Consider:
      1. Prerequisites (e.g., authentication before accessing features)
      2. Sequential dependencies (e.g., setup before configuration)
      3. Common patterns (e.g., data model before CRUD operations)
      4. Technical dependencies (e.g., API endpoints before UI implementation)
      
      For each story, suggest other stories that should be completed first.
      Provide a confidence score (0-1) and a clear reason for each suggestion.
      
      Stories to analyze:
      ${stories
        .map(
          (story) => `
        ID: ${story.id}
        Title: ${story.title}
        Role: ${story.role}
        Want: ${story.want}
        Benefit: ${story.benefit}
        Acceptance Criteria:
        ${story.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}
      `
        )
        .join("\n")}
      
      Return ONLY a valid JSON array with this exact structure, without any markdown formatting or additional text:
      [
        {
          "storyId": "story_id",
          "suggestedDependencies": [
            {
              "taskId": "dependent_story_id",
              "reason": "Clear explanation of why this dependency exists",
              "confidence": 0.95
            }
          ]
        }
      ]
    `;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = message.content[0].text;

    // Clean the response text by removing markdown formatting and any extra text
    const cleanText = text
      .replace(/```json\n?|\n?```/g, "") // Remove markdown code block formatting
      .replace(/^[^\[]*/, "") // Remove any text before the first [
      .replace(/[^\]]*$/, "") // Remove any text after the last ]
      .trim();

    try {
      const suggestions = JSON.parse(cleanText);

      // Validate the suggestions structure
      if (!Array.isArray(suggestions)) {
        console.error("Invalid suggestions format:", suggestions);
        return {
          suggestions: [],
          error: "Invalid suggestions format received from AI",
        };
      }

      return { suggestions };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw AI response:", text);
      console.error("Cleaned text:", cleanText);
      return {
        suggestions: [],
        error: "Failed to parse story dependencies",
      };
    }
  } catch (error) {
    console.error("Error analyzing story dependencies:", error);
    return {
      suggestions: [],
      error: "Failed to analyze story dependencies",
    };
  }
}

/**
 * Generate fallback stories when JSON parsing fails
 */
function generateFallbackStories(
  params: EnhancedStoryGenerationParams,
  count: number
): UserStory[] {
  const {
    featureDescription,
    complexity = "moderate",
    priorityWeights,
    teamMembers = [],
  } = params;

  // Parse the feature description to extract role, want, and benefit
  const roleMatch = featureDescription.match(/As a ([^,]+)/);
  const wantMatch = featureDescription.match(/I want ([^,]+)/);
  const benefitMatch = featureDescription.match(/so that ([^,]+)/);

  const baseRole = roleMatch ? roleMatch[1].trim() : "User";
  const baseWant = wantMatch ? wantMatch[1].trim() : "to complete this feature";
  const baseBenefit = benefitMatch
    ? benefitMatch[1].trim()
    : "to achieve the desired outcome";

  const fallbackStories: UserStory[] = [];

  for (let i = 0; i < count; i++) {
    // Create variations of the base story
    const variations = [
      { role: baseRole, want: baseWant, benefit: baseBenefit },
      {
        role: `${baseRole} Manager`,
        want: `to manage ${baseWant}`,
        benefit: `to ensure ${baseBenefit}`,
      },
      {
        role: `${baseRole} Administrator`,
        want: `to configure ${baseWant}`,
        benefit: `to optimize ${baseBenefit}`,
      },
      {
        role: `${baseRole} Developer`,
        want: `to implement ${baseWant}`,
        benefit: `to deliver ${baseBenefit}`,
      },
      {
        role: `${baseRole} Tester`,
        want: `to validate ${baseWant}`,
        benefit: `to ensure quality ${baseBenefit}`,
      },
    ];

    const variation = variations[i % variations.length];

    const fallbackStory: UserStory = {
      id: `t${nanoid(12)}`,
      title: `Fallback Story ${i + 1}: ${variation.want}`,
      role: variation.role,
      want: variation.want,
      benefit: variation.benefit,
      acceptanceCriteria: [
        "Feature is implemented according to requirements",
        "All acceptance criteria are met",
        "Feature is tested and working correctly",
      ],
      storyPoints:
        complexity === "simple" ? 3 : complexity === "complex" ? 8 : 5,
      businessValue: priorityWeights?.businessValue || 25,
      userImpact: priorityWeights?.userImpact || 20,
      complexity: priorityWeights?.complexity || 20,
      risk: priorityWeights?.risk || 15,
      dependencies: [], // dependencies should be string array, not number

      priority: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] as
        | "Low"
        | "Medium"
        | "High",
      tags: ["fallback", "feature", complexity],
      requirements: [
        "Implement the requested functionality",
        "Follow coding standards",
        "Include proper error handling",
        "Add unit tests",
      ],
      estimatedTime:
        complexity === "simple" ? 4 : complexity === "complex" ? 12 : 8,
      description: `Fallback story generated due to JSON parsing error: ${featureDescription}`,
      antiPatternWarnings: [
        "Generated as fallback due to parsing error",
        "Review and refine requirements",
        "Consider edge cases",
      ],
      successPattern: "Basic implementation pattern with proper testing",
      completionRate: 0.7,
    };

    fallbackStories.push(fallbackStory);
  }

  return fallbackStories;
}

/**
 * Create a new sprint folder in a space
 */
export async function createSprintFolder({
  name,
  spaceId,
  durationWeeks = 2,
  sprintStartDayId = null,
}: {
  name: string;
  spaceId: string;
  durationWeeks?: number;
  sprintStartDayId?: string | null;
}): Promise<{ success: boolean; sprintFolder?: any; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: sprintFolder, error } = await supabase
      .from("sprint_folders")
      .insert({
        name,
        space_id: spaceId,
        duration_week: durationWeeks,
        sprint_start_day_id: sprintStartDayId,
      })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, sprintFolder };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Create multiple sprints in a sprint folder
 */
export async function createSprints({
  sprints,
  sprintFolderId,
  spaceId,
  workspaceId,
}: {
  sprints: Array<{
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
    sprint_id?: string;
    duration?: number;
  }>;
  sprintFolderId: string;
  spaceId: string;
  workspaceId: string;
}): Promise<{
  success: boolean;
  createdSprints?: any[];
  createdStatuses?: any[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const inserts = sprints.map((s) => ({
      name: s.name,
      goal: s.goal || null,
      start_date: s.startDate || null,
      end_date: s.endDate || null,
      sprint_folder_id: sprintFolderId,
      space_id: spaceId,
      duration: s.duration,
    }));

    const { data: newSprint, error } = await supabase
      .from("sprints")
      .insert(inserts)
      .select();

    if (error || !newSprint) {
      return {
        success: false,
        error: `Failed to create project: ${error?.message}`,
      };
    }

    const statusInserts = sprints.map((s, idx) => ({
      name: "Backlog",
      color: "gray",
      position: 0,
      type: "sprint",
      sprint_id: newSprint[idx].id,
      space_id: spaceId,
      workspace_id: workspaceId,
    }));

    const { data: createdStatuses, error: statusError } = await supabase
      .from("statuses")
      .insert(statusInserts)
      .select();

    if (statusError) {
      console.error("Failed to create statuses:", statusError);
      return {
        success: false,
        error: `Failed to create statuses: ${statusError.message}`,
      };
    }

    return { success: true, createdSprints: newSprint, createdStatuses };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
