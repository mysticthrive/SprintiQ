// Test script for enhanced sprint goal generation
const { SprintCreationService } = require("./lib/sprint-creation-service");

// Sample user stories for testing
const sampleStories = [
  {
    id: "1",
    title: "User Authentication System",
    description:
      "As a user, I want to securely log into the application so that I can access my personalized dashboard and data.",
    role: "User",
    want: "to securely log into the application",
    benefit: "so that I can access my personalized dashboard and data",
    priority: "High",
    storyPoints: 8,
    businessValue: 4,
    tags: ["authentication", "security", "frontend"],
  },
  {
    id: "2",
    title: "User Dashboard Interface",
    description:
      "As a user, I want to view my personalized dashboard with key metrics and data visualizations so that I can make informed decisions.",
    role: "User",
    want: "to view my personalized dashboard with key metrics and data visualizations",
    benefit: "so that I can make informed decisions",
    priority: "High",
    storyPoints: 13,
    businessValue: 5,
    tags: ["dashboard", "analytics", "frontend"],
  },
  {
    id: "3",
    title: "Password Reset Functionality",
    description:
      "As a user, I want to reset my password through email verification so that I can regain access to my account when I forget my credentials.",
    role: "User",
    want: "to reset my password through email verification",
    benefit:
      "so that I can regain access to my account when I forget my credentials",
    priority: "Medium",
    storyPoints: 5,
    businessValue: 3,
    tags: ["authentication", "email", "security"],
  },
];

async function testSprintGoalGeneration() {
  console.log("Testing Enhanced Sprint Goal Generation\n");

  const service = new SprintCreationService();

  try {
    console.log("Sample Stories:");
    sampleStories.forEach((story, index) => {
      console.log(`${index + 1}. ${story.title}`);
      console.log(`   Role: ${story.role}`);
      console.log(`   Want: ${story.want}`);
      console.log(`   Benefit: ${story.benefit}`);
      console.log(
        `   Priority: ${story.priority}, Points: ${story.storyPoints}, Business Value: ${story.businessValue}/5`
      );
      console.log(`   Tags: ${story.tags.join(", ")}\n`);
    });

    console.log("Generating AI-powered sprint goal...\n");

    const goal = await service.generateSprintGoal(sampleStories, {
      startDate: new Date().toISOString(),
    });

    console.log("Generated Sprint Goal:");
    console.log(`"${goal}"\n`);

    console.log("Analysis:");
    console.log(
      "- This goal should focus on user authentication and dashboard functionality"
    );
    console.log(
      "- It should emphasize the business value of secure access and informed decision-making"
    );
    console.log(
      "- It should avoid technical jargon and focus on user outcomes"
    );
  } catch (error) {
    console.error("Error testing sprint goal generation:", error);
  }
}

// Run the test
testSprintGoalGeneration();
