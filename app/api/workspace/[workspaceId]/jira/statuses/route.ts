import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import JiraAPI from "@/lib/jira-api";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    console.log("Statuses API called for workspace:", params.workspaceId);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Statuses request body:", body);

    const { jira_domain, jira_email, jira_api_token, projectKey } = body;

    console.log("Extracted fields:", {
      hasDomain: !!jira_domain,
      hasEmail: !!jira_email,
      hasToken: !!jira_api_token,
      hasProjectKey: !!projectKey,
      projectKey: projectKey,
    });

    if (!jira_domain || !jira_email || !jira_api_token || !projectKey) {
      console.log("Missing fields:", {
        missingDomain: !jira_domain,
        missingEmail: !jira_email,
        missingToken: !jira_api_token,
        missingProjectKey: !projectKey,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Jira API
    const jiraApi = new JiraAPI({
      domain: jira_domain,
      email: jira_email,
      apiToken: jira_api_token,
    });

    console.log("Fetching statuses for project:", projectKey);

    // Fetch statuses for the project
    const statuses = await jiraApi.getProjectStatuses(projectKey);

    console.log("Retrieved statuses:", statuses?.length || 0);

    return NextResponse.json({
      success: true,
      statuses,
    });
  } catch (error) {
    console.error("Error fetching Jira statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch Jira statuses" },
      { status: 500 }
    );
  }
}
