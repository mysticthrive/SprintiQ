import { NextRequest, NextResponse } from "next/server";
import {
  testEnhancedTeamAssignment,
  getTeamAssignmentStats,
} from "@/lib/supabase-vector-service";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Starting team assignment test...");

    // Run the test
    await testEnhancedTeamAssignment();

    return NextResponse.json({
      success: true,
      message:
        "Team assignment test completed successfully. Check server logs for detailed results.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in team assignment test:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to run team assignment test",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamMembers } = body;

    if (!teamMembers || !Array.isArray(teamMembers)) {
      return NextResponse.json(
        {
          success: false,
          error: "teamMembers array is required",
        },
        { status: 400 }
      );
    }

    // Get team assignment statistics
    const stats = await getTeamAssignmentStats(teamMembers);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting team assignment stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get team assignment statistics",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
