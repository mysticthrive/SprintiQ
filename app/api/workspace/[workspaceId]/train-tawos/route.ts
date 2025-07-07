import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

// Types
interface TAWOSIssue {
  ID: number;
  Jira_ID: number;
  Issue_Key: string;
  URL: string;
  Title: string;
  Description: string;
  Description_Text: string;
  Description_Code: string;
  Type: string;
  Priority: string;
  Status: string;
  Resolution: string | null;
  Creation_Date: string;
  Estimation_Date: string;
  Resolution_Date: string | null;
  Last_Updated: string;
  Story_Point: number;
  Timespent: number | null;
  In_Progress_Minutes: number;
  Total_Effort_Minutes: number;
  Resolution_Time_Minutes: number;
  Title_Changed_After_Estimation: number;
  Description_Changed_After_Estimation: number;
  Story_Point_Changed_After_Estimation: number;
  Pull_Request_URL: string;
  Creator_ID: number;
  Reporter_ID: number;
  Assignee_ID: number | null;
  Project_ID: number;
  Sprint_ID: number | null;
}

interface VectorStory {
  id: string;
  embedding: number[];
  metadata: {
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
    estimatedTime: number;
    completionRate: number;
    successPattern: string;
    antiPatterns: string[];
    originalIssueKey: string;
    originalType: string;
    originalStatus: string;
    resolutionTime: number;
    totalEffort: number;
    complexity: "simple" | "moderate" | "complex";
  };
  created_at: string;
  updated_at: string;
}

/**
 * Generate embedding for text using OpenAI API
 */
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
 * Convert TAWOS issue to user story format
 */
function convertIssueToStory(issue: TAWOSIssue): {
  story: VectorStory;
  textForEmbedding: string;
} {
  // Extract role from issue type and description
  const role = extractRole(issue.Type, issue.Description_Text);

  // Extract want and benefit from title and description
  const { want, benefit } = extractWantAndBenefit(
    issue.Title,
    issue.Description_Text
  );

  // Generate acceptance criteria
  const acceptanceCriteria = generateAcceptanceCriteria(
    issue.Type,
    issue.Description_Text
  );

  // Calculate business value based on priority and type
  const businessValue = calculateBusinessValue(issue.Priority, issue.Type);

  // Generate tags based on content
  const tags = generateTags(issue.Type, issue.Description_Text, issue.Title);

  // Calculate completion rate based on status and resolution
  const completionRate = calculateCompletionRate(
    issue.Status,
    issue.Resolution
  );

  // Generate success pattern
  const successPattern = generateSuccessPattern(
    issue.Type,
    issue.Status,
    issue.Resolution
  );

  // Generate anti-patterns
  const antiPatterns = generateAntiPatterns(
    issue.Type,
    issue.Status,
    issue.Resolution
  );

  // Determine complexity
  const complexity = determineComplexity(
    issue.Story_Point,
    issue.Total_Effort_Minutes
  );

  // Calculate estimated time in hours
  const estimatedTime = Math.round(issue.Total_Effort_Minutes / 60);

  const story: VectorStory = {
    id: uuidv4(),
    embedding: [], // Will be filled later
    metadata: {
      title: issue.Title,
      description: issue.Description_Text || issue.Description,
      role,
      want,
      benefit,
      acceptanceCriteria,
      storyPoints: issue.Story_Point,
      businessValue,
      priority: issue.Priority,
      tags,
      estimatedTime,
      completionRate,
      successPattern,
      antiPatterns,
      originalIssueKey: issue.Issue_Key,
      originalType: issue.Type,
      originalStatus: issue.Status,
      resolutionTime: issue.Resolution_Time_Minutes,
      totalEffort: issue.Total_Effort_Minutes,
      complexity,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Create text for embedding
  const textForEmbedding = `${issue.Title} ${
    issue.Description_Text || issue.Description
  } ${role} ${want} ${benefit} ${tags.join(" ")}`;

  return { story, textForEmbedding };
}

// Helper functions (same as in train-tawos-data.ts)
function extractRole(type: string, description: string): string {
  const text = (description || "").toLowerCase();

  if (type.toLowerCase() === "bug") {
    return "QA Engineer";
  } else if (type.toLowerCase() === "feature") {
    if (
      text.includes("ui") ||
      text.includes("design") ||
      text.includes("frontend")
    ) {
      return "UI/UX Designer";
    } else if (
      text.includes("api") ||
      text.includes("backend") ||
      text.includes("database")
    ) {
      return "Backend Developer";
    } else {
      return "Product Manager";
    }
  } else if (type.toLowerCase() === "enhancement") {
    return "Full Stack Developer";
  } else if (type.toLowerCase() === "task") {
    return "Developer";
  } else {
    return "User";
  }
}

function extractWantAndBenefit(
  title: string,
  description: string
): { want: string; benefit: string } {
  const text = `${title} ${description || ""}`.toLowerCase();

  let want = "to complete this feature";
  if (
    text.includes("implement") ||
    text.includes("add") ||
    text.includes("create")
  ) {
    want = "to have this functionality implemented";
  } else if (
    text.includes("fix") ||
    text.includes("resolve") ||
    text.includes("correct")
  ) {
    want = "to have this issue fixed";
  } else if (
    text.includes("improve") ||
    text.includes("enhance") ||
    text.includes("optimize")
  ) {
    want = "to have this improved";
  }

  let benefit = "to achieve the desired outcome";
  if (text.includes("user experience") || text.includes("ux")) {
    benefit = "to improve user experience";
  } else if (text.includes("performance") || text.includes("speed")) {
    benefit = "to improve performance";
  } else if (text.includes("security") || text.includes("secure")) {
    benefit = "to improve security";
  } else if (text.includes("reliability") || text.includes("stability")) {
    benefit = "to improve reliability";
  }

  return { want, benefit };
}

function generateAcceptanceCriteria(
  type: string,
  description: string
): string[] {
  const criteria: string[] = [];
  const text = (description || "").toLowerCase();

  if (type.toLowerCase() === "bug") {
    criteria.push("The bug is fixed and no longer occurs");
    criteria.push("The fix does not introduce new bugs");
    criteria.push("The fix is tested and verified");
  } else if (type.toLowerCase() === "feature") {
    criteria.push("The feature is implemented according to requirements");
    criteria.push("The feature is tested and working correctly");
    criteria.push("The feature is documented");
  } else if (type.toLowerCase() === "enhancement") {
    criteria.push("The enhancement improves the existing functionality");
    criteria.push("The enhancement is backward compatible");
    criteria.push("The enhancement is tested and verified");
  } else {
    criteria.push("The task is completed according to requirements");
    criteria.push("The task is tested and verified");
    criteria.push("The task meets quality standards");
  }

  if (text.includes("ui") || text.includes("design")) {
    criteria.push("The UI is responsive and works on all devices");
    criteria.push("The design follows the established design system");
  }

  if (text.includes("api") || text.includes("backend")) {
    criteria.push("The API endpoints are properly documented");
    criteria.push("The API includes proper error handling");
  }

  if (text.includes("security")) {
    criteria.push("Security requirements are met");
    criteria.push("The implementation follows security best practices");
  }

  return criteria;
}

function calculateBusinessValue(priority: string, type: string): number {
  let value = 3;

  switch (priority.toLowerCase()) {
    case "critical":
      value = 5;
      break;
    case "high":
      value = 4;
      break;
    case "medium":
      value = 3;
      break;
    case "low":
      value = 2;
      break;
  }

  switch (type.toLowerCase()) {
    case "bug":
      value = Math.max(value - 1, 1);
      break;
    case "feature":
      value = Math.min(value + 1, 5);
      break;
  }

  return value;
}

function generateTags(
  type: string,
  description: string,
  title: string
): string[] {
  const tags: string[] = [];
  const text = `${title} ${description || ""}`.toLowerCase();

  tags.push(type.toLowerCase());

  if (
    text.includes("react") ||
    text.includes("frontend") ||
    text.includes("ui")
  ) {
    tags.push("frontend", "react");
  }
  if (
    text.includes("api") ||
    text.includes("backend") ||
    text.includes("database")
  ) {
    tags.push("backend", "api");
  }
  if (
    text.includes("auth") ||
    text.includes("authentication") ||
    text.includes("login")
  ) {
    tags.push("authentication", "security");
  }
  if (text.includes("test") || text.includes("testing")) {
    tags.push("testing", "qa");
  }
  if (text.includes("design") || text.includes("ui/ux")) {
    tags.push("design", "ui-ux");
  }
  if (text.includes("performance") || text.includes("optimization")) {
    tags.push("performance", "optimization");
  }
  if (text.includes("mobile") || text.includes("responsive")) {
    tags.push("mobile", "responsive");
  }

  return [...new Set(tags)];
}

function calculateCompletionRate(
  status: string,
  resolution: string | null
): number {
  if (
    status.toLowerCase() === "done" &&
    resolution?.toLowerCase() === "fixed"
  ) {
    return 1.0;
  } else if (status.toLowerCase() === "done") {
    return 0.9;
  } else if (status.toLowerCase() === "in progress") {
    return 0.5;
  } else if (status.toLowerCase() === "to do") {
    return 0.0;
  } else {
    return 0.7;
  }
}

function generateSuccessPattern(
  type: string,
  status: string,
  resolution: string | null
): string {
  if (
    status.toLowerCase() === "done" &&
    resolution?.toLowerCase() === "fixed"
  ) {
    switch (type.toLowerCase()) {
      case "bug":
        return "Thorough testing and validation approach";
      case "feature":
        return "Incremental development with regular feedback";
      case "enhancement":
        return "Careful analysis of existing functionality";
      default:
        return "Clear requirements and systematic implementation";
    }
  } else {
    return "Standard development process";
  }
}

function generateAntiPatterns(
  type: string,
  status: string,
  resolution: string | null
): string[] {
  const antiPatterns: string[] = [];

  if (status.toLowerCase() !== "done") {
    antiPatterns.push("Incomplete implementation");
  }

  if (
    type.toLowerCase() === "bug" &&
    status.toLowerCase() === "done" &&
    resolution?.toLowerCase() !== "fixed"
  ) {
    antiPatterns.push("Insufficient testing");
  }

  if (type.toLowerCase() === "feature") {
    antiPatterns.push("Scope creep");
    antiPatterns.push("Lack of user feedback");
  }

  return antiPatterns;
}

function determineComplexity(
  storyPoints: number,
  totalEffort: number
): "simple" | "moderate" | "complex" {
  const effortHours = totalEffort / 60;

  if (storyPoints <= 3 && effortHours <= 8) {
    return "simple";
  } else if (storyPoints <= 8 && effortHours <= 24) {
    return "moderate";
  } else {
    return "complex";
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { issues }: { issues: TAWOSIssue[] } = await request.json();

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: "No valid issues provided" },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting TAWOS training for ${issues.length} issues`);

    // Step 1: Remove duplicates within the imported file
    const uniqueIssues = new Map<string, TAWOSIssue>();
    const duplicateInFile: string[] = [];

    for (const issue of issues) {
      if (uniqueIssues.has(issue.Issue_Key)) {
        duplicateInFile.push(issue.Issue_Key);
      } else {
        uniqueIssues.set(issue.Issue_Key, issue);
      }
    }

    const uniqueIssuesArray = Array.from(uniqueIssues.values());
    console.log(
      `📊 Removed ${duplicateInFile.length} duplicates from file, ${uniqueIssuesArray.length} unique issues remaining`
    );

    // Step 2: Convert unique issues to stories
    const stories: VectorStory[] = [];
    const embeddingTexts: string[] = [];

    for (const issue of uniqueIssuesArray) {
      const { story, textForEmbedding } = convertIssueToStory(issue);
      stories.push(story);
      embeddingTexts.push(textForEmbedding);
    }

    // Step 3: Check for existing stories in database by originalIssueKey
    const issueKeys = stories.map((story) => story.metadata.originalIssueKey);

    const { data: existingStories, error: checkError } = await supabase
      .from("tawos_user_stories")
      .select("metadata")
      .in("metadata->originalIssueKey", issueKeys);

    if (checkError) {
      console.error("Error checking existing stories:", checkError);
    }

    const existingIssueKeys = new Set(
      existingStories
        ?.map((story) => (story.metadata as any)?.originalIssueKey)
        .filter(Boolean) || []
    );

    // Step 4: Filter out stories that already exist in database
    const newStories: VectorStory[] = [];
    const newEmbeddingTexts: string[] = [];
    const duplicateInDB: string[] = [];

    stories.forEach((story, index) => {
      if (existingIssueKeys.has(story.metadata.originalIssueKey)) {
        duplicateInDB.push(story.metadata.originalIssueKey);
      } else {
        newStories.push(story);
        newEmbeddingTexts.push(embeddingTexts[index]);
      }
    });

    console.log(
      `📊 Found ${existingIssueKeys.size} existing stories in DB, ${newStories.length} new stories to process`
    );

    // If no new stories to process, return early
    if (newStories.length === 0) {
      console.log("✅ No new stories to process - all items already exist");
      return NextResponse.json({
        success: true,
        totalProcessed: issues.length,
        totalSuccess: 0,
        totalFailed: 0,
        duplicateInFile: duplicateInFile.length,
        duplicateInDB: duplicateInDB.length,
        existingCount: existingIssueKeys.size,
        newCount: 0,
      });
    }

    // Step 5: Generate embeddings in batches for new stories only
    const BATCH_SIZE = 10; // Smaller batch size for API
    const batches = [];
    for (let i = 0; i < newStories.length; i += BATCH_SIZE) {
      batches.push({
        stories: newStories.slice(i, i + BATCH_SIZE),
        texts: newEmbeddingTexts.slice(i, i + BATCH_SIZE),
      });
    }

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Generate embeddings for this batch
      const embeddings = await Promise.all(
        batch.texts.map((text) => generateEmbedding(text))
      );

      // Update stories with embeddings
      const storiesWithEmbeddings = batch.stories.map((story, index) => ({
        ...story,
        embedding: embeddings[index] || [],
      }));

      // Filter out stories without embeddings
      const validStories = storiesWithEmbeddings.filter(
        (story) => story.embedding.length > 0
      );

      if (validStories.length > 0) {
        // Store in Supabase
        const { error } = await supabase
          .from("tawos_user_stories")
          .insert(validStories);

        if (error) {
          console.error(`Error storing batch ${batchIndex + 1}:`, error);
          totalFailed += validStories.length;
        } else {
          totalSuccess += validStories.length;
        }
      } else {
        totalFailed += batch.stories.length;
      }

      totalProcessed += batch.stories.length;

      // Add delay between batches
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `✅ Training completed: ${totalSuccess} new stories stored, ${existingIssueKeys.size} already existed, ${totalFailed} failed`
    );

    return NextResponse.json({
      success: true,
      totalProcessed: issues.length,
      totalSuccess,
      totalFailed,
      duplicateInFile: duplicateInFile.length,
      duplicateInDB: duplicateInDB.length,
      existingCount: existingIssueKeys.size,
      newCount: newStories.length,
    });
  } catch (error) {
    console.error("Error in TAWOS training:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// New endpoint for streaming progress updates
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const { searchParams } = new URL(request.url);
  const trainingId = searchParams.get("trainingId");

  if (!trainingId) {
    return NextResponse.json(
      { error: "Training ID required" },
      { status: 400 }
    );
  }

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // This would be connected to a real-time progress tracking system
      // For now, we'll simulate progress updates
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          const data = JSON.stringify({
            progress,
            currentStep: `Processing batch ${Math.floor(progress / 10)}...`,
            totalProcessed: Math.floor((progress / 100) * 3000), // Assuming 3000 total items
            totalSuccess: Math.floor((progress / 100) * 2800), // Assuming 2800 successful
            failed: Math.floor((progress / 100) * 200), // Assuming 200 failed
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } else {
          clearInterval(interval);
          controller.close();
        }
      }, 2000); // Update every 2 seconds
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
