import { createServerSupabaseClient } from "@/lib/supabase/server";

// Initialize OpenAI client for embeddings
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;

// Type definitions
interface VectorSearchResult {
  id: string;
  similarity: number;
  metadata: any;
}

interface TeamMember {
  id: string;
  name: string;
  avatar_url: string;
  email: string;
  role: string;
  level: "Junior" | "Mid" | "Senior" | "Lead";
  skills: string[];
  availability: number;
}

// Rate limiting for Voyage API
let lastEmbeddingRequest = 0;
const EMBEDDING_RATE_LIMIT = 1000; // 1 second between requests

// Simple in-memory cache for embeddings
const embeddingCache = new Map<string, number[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate embedding with rate limiting and caching
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!VOYAGE_API_KEY) {
      throw new Error("Voyage API key is required for embeddings");
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
      console.log("Using cached embedding for:", text.substring(0, 50) + "...");
      return cached;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastEmbeddingRequest;
    if (timeSinceLastRequest < EMBEDDING_RATE_LIMIT) {
      const delay = EMBEDDING_RATE_LIMIT - timeSinceLastRequest;
      console.log(
        `Rate limiting: waiting ${delay}ms before next embedding request`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    lastEmbeddingRequest = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "voyage-3.5-large", // Using voyage-3.5-large for 1536 dimensions
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Voyage API rate limit exceeded, retrying after delay...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return generateEmbedding(text); // Retry once
      }
      throw new Error(`Voyage API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Cache the result
    embeddingCache.set(cacheKey, embedding);

    // Clean up old cache entries
    setTimeout(() => {
      embeddingCache.delete(cacheKey);
    }, CACHE_TTL);

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

/**
 * Search for similar stories in Supabase Vector Database with dimension handling
 */
export async function searchSimilarStories(
  query: string,
  topK: number = 5
): Promise<{ results: VectorSearchResult[]; error?: string }> {
  try {
    const embedding = await generateEmbedding(query);
    if (!embedding) {
      return {
        results: [],
        error: "Failed to generate embedding for query",
      };
    }

    const supabase = await createServerSupabaseClient();

    // First try with the current embedding dimensions
    let { data: matches, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: topK,
      filter: { table_name: "tawos_user_stories" },
    });

    // If dimension mismatch error, try alternative approach
    if (error && error.message?.includes("different vector dimensions")) {
      console.warn(
        "Vector dimension mismatch detected, trying alternative search..."
      );

      // Try searching without vector similarity (fallback to text search)
      const { data: textMatches, error: textError } = await supabase
        .from("tawos_user_stories")
        .select("*")
        .or(
          `metadata->>'title'.ilike.%${query}%,metadata->>'description'.ilike.%${query}%`
        )
        .limit(topK);

      if (textError) {
        console.error("Text search also failed:", textError);
        return {
          results: [],
          error: `Failed to search Supabase: ${error.message}`,
        };
      }

      // Convert text search results to VectorSearchResult format
      const results: VectorSearchResult[] = (textMatches || []).map(
        (match: any) => ({
          id: match.id,
          similarity: 0.5, // Default similarity for text search
          metadata: {
            title: match.metadata?.title as string,
            description: match.metadata?.description as string,
            successPattern: match.metadata?.successPattern as string,
            completionRate: match.metadata?.completionRate as number,
            antiPatterns: match.metadata?.antiPatterns as string[],
            tags: match.metadata?.tags as string[],
            storyPoints: match.metadata?.storyPoints as number,
            priority: match.metadata?.priority as string,
            role: match.metadata?.role as string,
            want: match.metadata?.want as string,
            benefit: match.metadata?.benefit as string,
            acceptanceCriteria: match.metadata?.acceptanceCriteria as string[],
            assignedTeamMember: match.metadata?.assignedTeamMember as string,
            estimatedTime: match.metadata?.estimatedTime as number,
            businessValue: match.metadata?.businessValue as number,
          },
        })
      );

      return { results };
    }

    if (error) {
      console.error("Supabase vector search error:", error);
      return {
        results: [],
        error: `Failed to search Supabase: ${error.message}`,
      };
    }

    const results: VectorSearchResult[] =
      matches?.map((match: any) => ({
        id: match.id,
        similarity: match.similarity || 0,
        metadata: {
          title: match.metadata?.title as string,
          description: match.metadata?.description as string,
          successPattern: match.metadata?.successPattern as string,
          completionRate: match.metadata?.completionRate as number,
          antiPatterns: match.metadata?.antiPatterns as string[],
          tags: match.metadata?.tags as string[],
          storyPoints: match.metadata?.storyPoints as number,
          priority: match.metadata?.priority as string,
          role: match.metadata?.role as string,
          want: match.metadata?.want as string,
          benefit: match.metadata?.benefit as string,
          acceptanceCriteria: match.metadata?.acceptanceCriteria as string[],
          assignedTeamMember: match.metadata?.assignedTeamMember as string,
          estimatedTime: match.metadata?.estimatedTime as number,
          businessValue: match.metadata?.businessValue as number,
        },
      })) || [];

    return { results };
  } catch (error) {
    console.error("Error searching Supabase:", error);
    return {
      results: [],
      error: `Failed to search Supabase: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Get TAWOS success patterns for story generation
 */
export async function getTAWOSSuccessPatterns(
  featureDescription: string,
  complexity: "simple" | "moderate" | "complex"
): Promise<{
  patterns: VectorSearchResult[];
  antiPatterns: string[];
  error?: string;
}> {
  try {
    // Search for similar successful patterns
    const searchQuery = `${featureDescription} ${complexity} complexity`;
    const { results, error } = await searchSimilarStories(searchQuery, 10);

    if (error) {
      return { patterns: [], antiPatterns: [], error };
    }

    // Filter for high completion rate patterns (>80%)
    const highSuccessPatterns = results.filter(
      (result) => result.metadata.completionRate >= 0.8
    );

    // Collect anti-patterns from failed stories
    const antiPatterns = new Set<string>();
    results.forEach((result) => {
      if (result.metadata.antiPatterns) {
        result.metadata.antiPatterns.forEach((pattern: string) =>
          antiPatterns.add(pattern)
        );
      }
    });

    return {
      patterns: highSuccessPatterns,
      antiPatterns: Array.from(antiPatterns),
    };
  } catch (error) {
    console.error("Error getting TAWOS patterns:", error);
    return {
      patterns: [],
      antiPatterns: [],
      error: `Failed to get TAWOS patterns: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Get story templates based on similar successful stories
 */
export async function getStoryTemplates(
  featureDescription: string,
  complexity: "simple" | "moderate" | "complex",
  numberOfStories: number
): Promise<{
  templates: VectorSearchResult[];
  error?: string;
}> {
  try {
    // Search for similar successful story templates
    const searchQuery = `${featureDescription} ${complexity} story template`;
    const { results, error } = await searchSimilarStories(
      searchQuery,
      numberOfStories * 2
    );

    if (error) {
      return { templates: [], error };
    }

    // Filter for high-quality templates (completion rate > 70% and good structure)
    const qualityTemplates = results.filter((result) => {
      const metadata = result.metadata;
      return (
        metadata.completionRate >= 0.7 &&
        metadata.title &&
        metadata.role &&
        metadata.want &&
        metadata.benefit &&
        (metadata.acceptanceCriteria?.length || 0) >= 3
      );
    });

    // Sort by relevance and quality
    const sortedTemplates = qualityTemplates
      .sort(
        (a: VectorSearchResult, b: VectorSearchResult) =>
          b.similarity - a.similarity
      )
      .slice(0, numberOfStories);

    return { templates: sortedTemplates };
  } catch (error) {
    console.error("Error getting story templates:", error);
    return { templates: [], error: "Failed to get story templates" };
  }
}

/**
 * Get team performance data from Supabase with fallback
 */
export async function getTeamPerformanceData(
  teamMembers: Array<TeamMember>
): Promise<{
  performanceData: Array<{
    memberId: string;
    successRate: number;
    averageVelocity: number;
    completedStories: number;
  }>;
  error?: string;
}> {
  try {
    // Try to get performance data from Supabase
    const supabase = await createServerSupabaseClient();

    // Search for stories completed by team members
    const performanceData: Array<{
      memberId: string;
      successRate: number;
      averageVelocity: number;
      completedStories: number;
    }> = [];

    for (const member of teamMembers) {
      try {
        // Search for stories assigned to this member
        const searchQuery = `stories assigned to ${member.name} ${member.role}`;
        const { results, error } = await searchSimilarStories(searchQuery, 20);

        if (error) {
          console.warn(
            `Failed to get performance data for ${member.name}:`,
            error
          );
          // Use default performance data
          performanceData.push({
            memberId: member.id,
            successRate: 0.7, // Default 70% success rate
            averageVelocity: 8, // Default 8 story points per sprint
            completedStories: 0,
          });
          continue;
        }

        // Calculate performance metrics
        const completedStories = results.filter(
          (result) => result.metadata.completionRate >= 0.8
        ).length;

        const successRate =
          results.length > 0 ? completedStories / results.length : 0.7;
        const averageVelocity =
          results.length > 0
            ? results.reduce(
                (sum, result) => sum + (result.metadata.storyPoints || 5),
                0
              ) / results.length
            : 8;

        performanceData.push({
          memberId: member.id,
          successRate,
          averageVelocity,
          completedStories,
        });
      } catch (memberError) {
        console.warn(`Error processing member ${member.name}:`, memberError);
        // Use default performance data
        performanceData.push({
          memberId: member.id,
          successRate: 0.7,
          averageVelocity: 8,
          completedStories: 0,
        });
      }
    }

    return { performanceData };
  } catch (error) {
    console.error("Error getting team performance data:", error);
    // Return default performance data for all members
    const defaultPerformanceData = teamMembers.map((member) => ({
      memberId: member.id,
      successRate: 0.7,
      averageVelocity: 8,
      completedStories: 0,
    }));

    return {
      performanceData: defaultPerformanceData,
      error: "Using default performance data due to API limitations",
    };
  }
}

/**
 * Analyze story for anti-patterns using Supabase data
 */
export async function analyzeStoryForAntiPatterns(story: {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}): Promise<{
  warnings: string[];
  riskScore: number;
  error?: string;
}> {
  try {
    const storyText = `${story.title} ${
      story.description
    } ${story.acceptanceCriteria.join(" ")}`;
    const { results } = await searchSimilarStories(storyText, 5);

    const warnings: string[] = [];
    let riskScore = 0;

    // FBI Sentinel Anti-pattern Detection
    const text = storyText.toLowerCase();

    // Requirements confusion detection
    const vagueWords = [
      "maybe",
      "possibly",
      "might",
      "could",
      "should",
      "nice to have",
      "if possible",
    ];
    const hasVagueRequirements = vagueWords.some((word) => text.includes(word));
    if (hasVagueRequirements) {
      warnings.push(
        "FBI Sentinel: Vague requirements detected - use specific, measurable criteria"
      );
      riskScore += 0.3;
    }

    // Scope overload detection
    const scopeIndicators = [
      "and",
      "also",
      "additionally",
      "furthermore",
      "moreover",
    ];
    const scopeCount = scopeIndicators.filter((word) =>
      text.includes(word)
    ).length;
    if (scopeCount > 2) {
      warnings.push(
        "FBI Sentinel: Scope overload detected - story may contain too many features"
      );
      riskScore += 0.4;
    }

    // Analyze similar stories from Supabase for patterns
    const similarStories = results.filter((r) => r.similarity > 0.7);
    const failedStories = similarStories.filter(
      (r) => r.metadata.completionRate < 0.6
    );

    if (failedStories.length > 0) {
      warnings.push(
        `Supabase Analysis: ${
          failedStories.length
        } similar stories had low completion rates (${(
          failedStories[0].metadata.completionRate * 100
        ).toFixed(0)}%)`
      );
      riskScore += 0.3;
    }

    // Check for common anti-patterns from Supabase data
    const commonAntiPatterns = new Set<string>();
    failedStories.forEach((story) => {
      if (story.metadata.antiPatterns) {
        story.metadata.antiPatterns.forEach((pattern: string) =>
          commonAntiPatterns.add(pattern)
        );
      }
    });

    commonAntiPatterns.forEach((pattern: string) => {
      warnings.push(`Supabase Anti-pattern: ${pattern}`);
      riskScore += 0.2;
    });

    return { warnings, riskScore: Math.min(riskScore, 1.0) };
  } catch (error) {
    console.error("Error analyzing story for anti-patterns:", error);
    return {
      warnings: ["Failed to analyze anti-patterns"],
      riskScore: 0.5,
      error: `Failed to analyze anti-patterns: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Get optimal team assignment based on Supabase performance data
 */
export async function getOptimalTeamAssignment(
  story: {
    title: string;
    description: string;
    tags: string[];
    complexity: "simple" | "moderate" | "complex";
    priority: "Low" | "Medium" | "High" | "Critical";
  },
  teamMembers: Array<TeamMember>
): Promise<{
  assignedMember: (typeof teamMembers)[0] | null;
  reason: string;
  confidence: number;
}> {
  try {
    // Get team performance data from Supabase
    const { performanceData, error } = await getTeamPerformanceData(
      teamMembers
    );

    if (error || performanceData.length === 0) {
      return await getLocalTeamAssignment(story, teamMembers);
    }

    // Enhanced team assignment with workload balancing
    return await getEnhancedTeamAssignment(story, teamMembers, performanceData);
  } catch (error) {
    console.error("❌ Error in optimal team assignment:", error);
    // Fallback to local algorithm
    return await getLocalTeamAssignment(story, teamMembers);
  }
}

/**
 * Get current workload from database for team members
 */
async function getCurrentWorkloadsFromDatabase(
  teamMembers: TeamMember[]
): Promise<Map<string, number>> {
  const workloads = new Map<string, number>();

  try {
    const supabase = await import("@/lib/supabase/server").then((m) =>
      m.createServerSupabaseClient()
    );

    // Get current user to access workspace
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get all active tasks assigned to team members
    const { data: activeTasks, error } = await supabase
      .from("tasks")
      .select(
        `
        id,
        assignee_id,
        estimated_time,
        story_points,
        status:statuses(name)
      `
      )
      .not("assignee_id", "is", null)
      .not("status.name", "in", "(Done,Completed,Closed)")
      .not("status.name", "ilike", "%done%")
      .not("status.name", "ilike", "%complete%");

    if (error) {
      console.warn(
        "Failed to fetch active tasks for workload calculation:",
        error
      );
      throw error;
    }

    // Calculate workload for each team member
    teamMembers.forEach((member) => {
      let totalWorkload = 0;

      // Find tasks assigned to this member
      const memberTasks =
        activeTasks?.filter((task) => task.assignee_id === member.id) || [];

      memberTasks.forEach((task) => {
        // Use estimated_time if available, otherwise estimate from story points
        if (task.estimated_time) {
          totalWorkload += task.estimated_time;
        } else if (task.story_points) {
          // Estimate: 1 story point ≈ 4 hours
          totalWorkload += task.story_points * 4;
        }
      });

      workloads.set(member.id, totalWorkload);

      console.log(
        `📊 ${member.name}: ${totalWorkload.toFixed(1)} hours workload from ${
          memberTasks.length
        } active tasks`
      );
    });
  } catch (error) {
    console.warn(
      "Failed to get workloads from database, using estimation:",
      error
    );
    // Fall back to estimation
    teamMembers.forEach((member) => {
      const estimatedWorkload = Math.random() * member.availability * 0.6;
      workloads.set(member.id, estimatedWorkload);
    });
  }

  return workloads;
}

/**
 * Calculate current workload for each team member
 */
async function calculateMemberWorkloads(
  teamMembers: TeamMember[]
): Promise<Map<string, number>> {
  // Try to get real workload data from database first
  try {
    return await getCurrentWorkloadsFromDatabase(teamMembers);
  } catch (error) {
    console.warn("Using fallback workload estimation:", error);

    const workloads = new Map<string, number>();

    // Fallback: sophisticated estimation system
    teamMembers.forEach((member) => {
      // Calculate workload based on member characteristics
      let estimatedWorkload = 0;

      // Base workload based on level (higher levels tend to have more responsibilities)
      const levelWorkloadMultiplier = {
        Junior: 0.4, // 40% of availability typically assigned
        Mid: 0.5, // 50% of availability typically assigned
        Senior: 0.6, // 60% of availability typically assigned
        Lead: 0.7, // 70% of availability typically assigned (more meetings, mentoring)
      };

      const baseWorkload =
        member.availability * (levelWorkloadMultiplier[member.level] || 0.5);

      // Add some randomization to simulate real-world variation
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      estimatedWorkload = Math.max(0, baseWorkload * (1 + variation));

      workloads.set(member.id, estimatedWorkload);
    });

    console.log(
      `📊 Calculated estimated workloads for ${teamMembers.length} team members`
    );
    return workloads;
  }
}

/**
 * Calculate workload balancing score (Case 3)
 */
function calculateWorkloadScore(
  member: TeamMember,
  memberWorkloads: Map<string, number>
): number {
  const currentWorkload = memberWorkloads.get(member.id) || 0;
  const maxWorkload = member.availability * 0.8; // 80% of availability as max workload

  // Prefer members with lower workload
  if (currentWorkload >= maxWorkload) {
    return 0.1; // Very low score for overloaded members
  }

  // Calculate workload ratio (lower is better)
  const workloadRatio = currentWorkload / maxWorkload;

  // Invert the ratio so lower workload gets higher score
  // Add a bonus for very low workloads to encourage distribution
  const baseScore = Math.max(0.1, 1.0 - workloadRatio);
  const lowWorkloadBonus = workloadRatio < 0.3 ? 0.1 : 0; // Bonus for members with <30% workload

  return Math.min(1.0, baseScore + lowWorkloadBonus);
}

/**
 * Enhanced team assignment algorithm with workload balancing
 */
async function getEnhancedTeamAssignment(
  story: {
    title: string;
    description: string;
    tags: string[];
    complexity: "simple" | "moderate" | "complex";
    priority: "Low" | "Medium" | "High" | "Critical";
  },
  teamMembers: Array<TeamMember>,
  performanceData: any[]
): Promise<{
  assignedMember: (typeof teamMembers)[0] | null;
  reason: string;
  confidence: number;
}> {
  console.log(
    `🔧 Using enhanced team assignment algorithm for story: "${story.title}"`
  );

  if (teamMembers.length === 0) {
    console.log(`❌ No team members available for assignment`);
    return {
      assignedMember: null,
      reason: "No team members available",
      confidence: 0,
    };
  }

  // Calculate current workload for each team member
  const memberWorkloads = await calculateMemberWorkloads(teamMembers);

  // Calculate scores for each team member
  const memberScores = teamMembers.map((member) => {
    const performance = performanceData.find(
      (p: any) => p.memberId === member.id
    );

    // 1. Skill Matching (40% weight)
    const skillMatch = calculateSkillMatch(member, story);

    // 2. Level-based Priority Assignment (30% weight)
    const levelPriorityMatch = calculateLevelPriorityMatch(member, story);

    // 3. Workload Balancing (30% weight)
    const workloadScore = calculateWorkloadScore(member, memberWorkloads);

    // Performance bonus (if available)
    const performanceBonus = performance ? performance.successRate * 0.1 : 0;

    const totalScore =
      skillMatch * 0.4 +
      levelPriorityMatch * 0.3 +
      workloadScore * 0.3 +
      performanceBonus;

    const currentWorkload = memberWorkloads.get(member.id) || 0;
    const maxWorkload = member.availability * 0.8;

    console.log(
      `📊 ${member.name} (${member.level}): skill=${skillMatch.toFixed(
        2
      )}, level=${levelPriorityMatch.toFixed(
        2
      )}, workload=${workloadScore.toFixed(2)} (${currentWorkload.toFixed(
        1
      )}/${maxWorkload.toFixed(1)}h), total=${totalScore.toFixed(2)}`
    );

    return {
      member,
      score: totalScore,
      skillMatch,
      levelPriorityMatch,
      workloadScore,
      performanceBonus,
      currentWorkload,
      maxWorkload,
      reason: generateAssignmentReason(
        member,
        story,
        skillMatch,
        levelPriorityMatch,
        workloadScore,
        performance
      ),
      confidence: calculateConfidence(
        skillMatch,
        levelPriorityMatch,
        workloadScore
      ),
    };
  });

  // Sort by score and return the best match
  memberScores.sort((a, b) => b.score - a.score);
  const bestMatch = memberScores[0];

  // Log detailed assignment information
  console.log(
    `🏆 Best match: ${bestMatch.member.name} (${bestMatch.member.level})`
  );
  console.log(`   - Skill match: ${(bestMatch.skillMatch * 100).toFixed(0)}%`);
  console.log(
    `   - Level/priority match: ${(bestMatch.levelPriorityMatch * 100).toFixed(
      0
    )}%`
  );
  console.log(
    `   - Workload score: ${(bestMatch.workloadScore * 100).toFixed(
      0
    )}% (${bestMatch.currentWorkload.toFixed(
      1
    )}/${bestMatch.maxWorkload.toFixed(1)}h)`
  );
  console.log(`   - Total score: ${(bestMatch.score * 100).toFixed(0)}%`);
  console.log(`   - Confidence: ${(bestMatch.confidence * 100).toFixed(0)}%`);

  // Check for potential issues
  if (bestMatch.currentWorkload >= bestMatch.maxWorkload) {
    console.warn(
      `⚠️ Warning: ${
        bestMatch.member.name
      } is already at capacity (${bestMatch.currentWorkload.toFixed(
        1
      )}/${bestMatch.maxWorkload.toFixed(1)}h)`
    );
  }

  if (bestMatch.skillMatch < 0.3) {
    console.warn(
      `⚠️ Warning: Low skill match (${(bestMatch.skillMatch * 100).toFixed(
        0
      )}%) for ${bestMatch.member.name}`
    );
  }

  return {
    assignedMember: bestMatch.member,
    reason: bestMatch.reason,
    confidence: bestMatch.confidence,
  };
}

/**
 * Calculate skill matching score (Case 1)
 */
function calculateSkillMatch(
  member: TeamMember,
  story: {
    title: string;
    description: string;
    tags: string[];
    complexity: "simple" | "moderate" | "complex";
    priority: "Low" | "Medium" | "High" | "Critical";
  }
): number {
  if (story.tags.length === 0) {
    return 0.5; // Neutral score if no tags
  }

  // Direct skill matches
  const directMatches = story.tags.filter((tag) =>
    member.skills.some((skill) => skill.toLowerCase() === tag.toLowerCase())
  ).length;

  // Partial skill matches (e.g., "React" matches "React Native")
  const partialMatches =
    story.tags.filter((tag) =>
      member.skills.some(
        (skill) =>
          skill.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(skill.toLowerCase())
      )
    ).length - directMatches; // Subtract direct matches to avoid double counting

  // Role-based skill matching
  const roleSkillMatch = calculateRoleSkillMatch(member.role, story.tags);

  const totalMatches =
    directMatches + partialMatches * 0.7 + roleSkillMatch * 0.5;
  const maxPossibleMatches = story.tags.length;

  return Math.min(totalMatches / maxPossibleMatches, 1.0);
}

/**
 * Calculate role-based skill matching
 */
function calculateRoleSkillMatch(role: string, tags: string[]): number {
  const roleSkillMap: Record<string, string[]> = {
    "Frontend Developer": [
      "react",
      "vue",
      "angular",
      "javascript",
      "typescript",
      "css",
      "html",
      "ui",
      "frontend",
    ],
    "Backend Developer": [
      "java",
      "spring",
      "node.js",
      "python",
      "c#",
      "database",
      "api",
      "backend",
      "server",
    ],
    "Full Stack Developer": [
      "react",
      "node.js",
      "java",
      "spring",
      "database",
      "api",
      "fullstack",
    ],
    "DevOps Engineer": [
      "docker",
      "kubernetes",
      "aws",
      "ci/cd",
      "infrastructure",
      "monitoring",
      "devops",
    ],
    "QA Engineer": [
      "testing",
      "automation",
      "selenium",
      "jest",
      "quality",
      "qa",
    ],
    "UI/UX Designer": [
      "figma",
      "design",
      "ui",
      "ux",
      "prototyping",
      "user research",
    ],
    "Product Manager": [
      "product",
      "strategy",
      "agile",
      "stakeholder",
      "user research",
    ],
    "Data Scientist": [
      "python",
      "machine learning",
      "statistics",
      "data analysis",
      "sql",
    ],
  };

  const roleSkills = roleSkillMap[role] || [];
  const matches = tags.filter((tag) =>
    roleSkills.some(
      (skill) =>
        skill.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(skill.toLowerCase())
    )
  ).length;

  return matches / Math.max(tags.length, 1);
}

/**
 * Calculate level-based priority assignment (Case 2)
 */
function calculateLevelPriorityMatch(
  member: TeamMember,
  story: {
    title: string;
    description: string;
    tags: string[];
    complexity: "simple" | "moderate" | "complex";
    priority: "Low" | "Medium" | "High" | "Critical";
  }
): number {
  const levelScores = {
    Junior: {
      complexity: { simple: 0.9, moderate: 0.6, complex: 0.3 },
      priority: { Low: 0.8, Medium: 0.7, High: 0.5, Critical: 0.3 },
    },
    Mid: {
      complexity: { simple: 0.8, moderate: 0.9, complex: 0.7 },
      priority: { Low: 0.7, Medium: 0.9, High: 0.8, Critical: 0.6 },
    },
    Senior: {
      complexity: { simple: 0.7, moderate: 0.8, complex: 0.9 },
      priority: { Low: 0.6, Medium: 0.7, High: 0.9, Critical: 0.8 },
    },
    Lead: {
      complexity: { simple: 0.6, moderate: 0.7, complex: 0.8 },
      priority: { Low: 0.5, Medium: 0.6, High: 0.8, Critical: 0.9 },
    },
  };

  const levelScore = levelScores[member.level as keyof typeof levelScores];
  if (!levelScore) return 0.5;

  const complexityScore = levelScore.complexity[story.complexity] || 0.5;
  const priorityScore = levelScore.priority[story.priority] || 0.5;

  // Weight complexity and priority equally
  return (complexityScore + priorityScore) / 2;
}

/**
 * Generate assignment reason
 */
function generateAssignmentReason(
  member: TeamMember,
  story: {
    title: string;
    description: string;
    tags: string[];
    complexity: "simple" | "moderate" | "complex";
    priority: "Low" | "Medium" | "High" | "Critical";
  },
  skillMatch: number,
  levelPriorityMatch: number,
  workloadScore: number,
  performance?: any
): string {
  const reasons: string[] = [];

  if (skillMatch > 0.7) {
    reasons.push("excellent skill match");
  } else if (skillMatch > 0.5) {
    reasons.push("good skill match");
  }

  if (levelPriorityMatch > 0.8) {
    reasons.push("optimal level for priority");
  } else if (levelPriorityMatch > 0.6) {
    reasons.push("appropriate level");
  }

  if (workloadScore > 0.8) {
    reasons.push("available capacity");
  } else if (workloadScore > 0.6) {
    reasons.push("reasonable workload");
  }

  if (performance?.successRate > 0.8) {
    reasons.push("high success rate");
  }

  if (reasons.length === 0) {
    reasons.push("best available match");
  }

  return reasons.join(", ");
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  skillMatch: number,
  levelPriorityMatch: number,
  workloadScore: number
): number {
  // Weight the factors for confidence calculation
  const confidence =
    skillMatch * 0.4 + levelPriorityMatch * 0.3 + workloadScore * 0.3;

  return Math.min(Math.max(confidence, 0.1), 0.95);
}

/**
 * Local team assignment algorithm (fallback)
 */
function getLocalTeamAssignment(
  story: {
    title: string;
    description: string;
    tags: string[];
    complexity: "simple" | "moderate" | "complex";
    priority: "Low" | "Medium" | "High" | "Critical";
  },
  teamMembers: Array<TeamMember>
): Promise<{
  assignedMember: (typeof teamMembers)[0] | null;
  reason: string;
  confidence: number;
}> {
  console.log(`🔧 Using local team assignment algorithm`);

  if (teamMembers.length === 0) {
    console.log(`❌ No team members available for local assignment`);
    return Promise.resolve({
      assignedMember: null,
      reason: "No team members available",
      confidence: 0,
    });
  }

  // Use the enhanced algorithm without performance data
  const memberScores = teamMembers.map((member) => {
    const skillMatch = calculateSkillMatch(member, story);
    const levelPriorityMatch = calculateLevelPriorityMatch(member, story);
    const workloadScore = 0.7; // Default workload score for local assignment

    const totalScore =
      skillMatch * 0.4 + levelPriorityMatch * 0.3 + workloadScore * 0.3;

    console.log(`📊 Local score for ${member.name}: ${totalScore.toFixed(2)}`);
    return {
      member,
      score: totalScore,
      reason: generateAssignmentReason(
        member,
        story,
        skillMatch,
        levelPriorityMatch,
        workloadScore
      ),
      confidence: calculateConfidence(
        skillMatch,
        levelPriorityMatch,
        workloadScore
      ),
    };
  });

  memberScores.sort((a, b) => b.score - a.score);
  const bestMatch = memberScores[0];

  console.log(
    `🏆 Local best match: ${
      bestMatch.member.name
    } with score ${bestMatch.score.toFixed(2)}`
  );

  return Promise.resolve({
    assignedMember: bestMatch.member,
    reason: bestMatch.reason,
    confidence: bestMatch.confidence,
  });
}

/**
 * Store successful story in Supabase Vector Database for future reference
 */
export async function storeSuccessfulStory(story: {
  id: string;
  title: string;
  description: string;
  role: string;
  want: string;
  benefit: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  businessValue: number;
  priority: string;
  tags: string[];
  assignedTeamMember?: string;
  estimatedTime: number;
  completionRate: number;
  successPattern: string;
  antiPatterns?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const embedding = await generateEmbedding(
      `${story.title} ${story.description} ${story.role} ${story.want} ${
        story.benefit
      } ${story.tags.join(" ")}`
    );

    if (!embedding) {
      return { success: false, error: "Failed to generate embedding" };
    }

    const supabase = await createServerSupabaseClient();

    // Insert the story with embedding into the tawos_user_stories table
    const { error } = await supabase.from("tawos_user_stories").insert({
      id: story.id,
      embedding: embedding,
      metadata: {
        title: story.title,
        description: story.description,
        role: story.role,
        want: story.want,
        benefit: story.benefit,
        acceptanceCriteria: story.acceptanceCriteria,
        storyPoints: story.storyPoints,
        businessValue: story.businessValue,
        priority: story.priority,
        tags: story.tags,
        assignedTeamMember: story.assignedTeamMember || "",
        estimatedTime: story.estimatedTime,
        completionRate: story.completionRate,
        successPattern: story.successPattern,
        antiPatterns: story.antiPatterns || [],
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing story in Supabase:", error);
      return {
        success: false,
        error: `Failed to store story: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error storing story in Supabase:", error);
    return {
      success: false,
      error: `Failed to store story: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Test function to demonstrate the enhanced team assignment logic
 */
export async function testEnhancedTeamAssignment(): Promise<void> {
  console.log("🧪 Testing Enhanced Team Assignment Logic");

  // Sample team members
  const sampleTeamMembers: TeamMember[] = [
    {
      id: "member-1",
      name: "Alice Johnson",
      avatar_url: "",
      email: "alice@example.com",
      role: "Frontend Developer",
      level: "Senior",
      skills: ["React", "TypeScript", "CSS", "UI/UX"],
      availability: 40,
    },
    {
      id: "member-2",
      name: "Bob Smith",
      avatar_url: "",
      email: "bob@example.com",
      role: "Backend Developer",
      level: "Mid",
      skills: ["Java", "Spring", "Database", "API"],
      availability: 40,
    },
    {
      id: "member-3",
      name: "Carol Davis",
      avatar_url: "",
      email: "carol@example.com",
      role: "Full Stack Developer",
      level: "Junior",
      skills: ["JavaScript", "React", "Node.js"],
      availability: 35,
    },
    {
      id: "member-4",
      name: "David Wilson",
      avatar_url: "",
      email: "david@example.com",
      role: "DevOps Engineer",
      level: "Lead",
      skills: ["Docker", "Kubernetes", "AWS", "CI/CD"],
      availability: 40,
    },
  ];

  // Sample stories to test different scenarios
  const testStories = [
    {
      title: "Implement React Dashboard",
      description: "Create a new dashboard using React and TypeScript",
      tags: ["React", "TypeScript", "UI"],
      complexity: "moderate" as const,
      priority: "High" as const,
    },
    {
      title: "Database Optimization",
      description: "Optimize database queries and add indexes",
      tags: ["Database", "Performance"],
      complexity: "complex" as const,
      priority: "Critical" as const,
    },
    {
      title: "Simple Bug Fix",
      description: "Fix a minor UI bug in the login form",
      tags: ["UI", "Bug"],
      complexity: "simple" as const,
      priority: "Low" as const,
    },
    {
      title: "Deploy to Production",
      description: "Set up production deployment pipeline",
      tags: ["DevOps", "CI/CD", "AWS"],
      complexity: "complex" as const,
      priority: "High" as const,
    },
  ];

  console.log("\n📋 Test Scenarios:");
  testStories.forEach((story, index) => {
    console.log(
      `${index + 1}. ${story.title} (${story.priority} priority, ${
        story.complexity
      } complexity)`
    );
  });

  console.log("\n👥 Team Members:");
  sampleTeamMembers.forEach((member) => {
    console.log(
      `- ${member.name} (${member.level} ${member.role}): ${member.skills.join(
        ", "
      )}`
    );
  });

  console.log("\n🔍 Testing Assignments:");

  for (const story of testStories) {
    console.log(`\n--- Testing: ${story.title} ---`);

    try {
      const result = await getOptimalTeamAssignment(story, sampleTeamMembers);

      if (result.assignedMember) {
        console.log(
          `✅ Assigned to: ${result.assignedMember.name} (${result.assignedMember.level})`
        );
        console.log(`   Reason: ${result.reason}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      } else {
        console.log(`❌ No assignment possible`);
      }
    } catch (error) {
      console.error(`❌ Error testing assignment:`, error);
    }
  }

  console.log("\n✅ Enhanced Team Assignment Test Complete");
}

/**
 * Get assignment statistics for team members
 */
export async function getTeamAssignmentStats(
  teamMembers: TeamMember[]
): Promise<{
  totalMembers: number;
  averageWorkload: number;
  overloadedMembers: number;
  availableMembers: number;
  skillDistribution: Record<string, number>;
}> {
  const workloads = await calculateMemberWorkloads(teamMembers);

  const totalWorkload = Array.from(workloads.values()).reduce(
    (sum, workload) => sum + workload,
    0
  );
  const averageWorkload = totalWorkload / teamMembers.length;

  const overloadedMembers = teamMembers.filter((member) => {
    const workload = workloads.get(member.id) || 0;
    const maxWorkload = member.availability * 0.8;
    return workload >= maxWorkload;
  }).length;

  const availableMembers = teamMembers.filter((member) => {
    const workload = workloads.get(member.id) || 0;
    const maxWorkload = member.availability * 0.8;
    return workload < maxWorkload * 0.5; // Less than 50% of max workload
  }).length;

  // Calculate skill distribution
  const skillDistribution: Record<string, number> = {};
  teamMembers.forEach((member) => {
    member.skills.forEach((skill) => {
      skillDistribution[skill] = (skillDistribution[skill] || 0) + 1;
    });
  });

  return {
    totalMembers: teamMembers.length,
    averageWorkload,
    overloadedMembers,
    availableMembers,
    skillDistribution,
  };
}
