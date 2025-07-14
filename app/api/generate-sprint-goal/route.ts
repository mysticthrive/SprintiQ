import { NextRequest, NextResponse } from "next/server";
import { SprintCreationService } from "@/lib/sprint-creation-service";

export async function POST(req: NextRequest) {
  try {
    const { stories, projectContext } = await req.json();
    const service = new SprintCreationService();
    const goal = await service.generateSprintGoal(stories, projectContext);
    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error generating sprint goal:", error);
    return NextResponse.json(
      { error: "Failed to generate sprint goal." },
      { status: 500 }
    );
  }
}
