import { PriorityWeights } from "@/components/workspace/ai/priority-scoring-config";

export type Color =
  | "green"
  | "blue"
  | "red"
  | "gray"
  | "orange"
  | "pink"
  | "cyan"
  | "brown"
  | "purple"
  | "yellow";

export const ThemeColors: { name: Color; hex: string; label: string }[] = [
  { name: "green", hex: "#00BC7D", label: "Green" },
  { name: "blue", hex: "#3B82F6", label: "Blue" },
  { name: "red", hex: "#EF4444", label: "Red" },
  { name: "gray", hex: "#6B7280", label: "Gray" },
  { name: "orange", hex: "#F97316", label: "Orange" },
  { name: "pink", hex: "#EC4899", label: "Pink" },
  { name: "cyan", hex: "#06B6D4", label: "Cyan" },
  { name: "brown", hex: "#FE9A00", label: "Brown" },
  { name: "purple", hex: "#8B5CF6", label: "Purple" },
];

export const PieChartColors: { name: Color; hex: string; label: string }[] = [
  { name: "green", hex: "#00BC7D", label: "Green" },
  { name: "blue", hex: "#3B82F6", label: "Blue" },
  { name: "yellow", hex: "#F59E0B", label: "Yellow" },
  { name: "red", hex: "#EF4444", label: "Red" },
  { name: "gray", hex: "#6B7280", label: "Gray" },
  { name: "orange", hex: "#F97316", label: "Orange" },
  { name: "pink", hex: "#EC4899", label: "Pink" },
  { name: "cyan", hex: "#06B6D4", label: "Cyan" },
  { name: "brown", hex: "#FE9A00", label: "Brown" },
  { name: "purple", hex: "#8B5CF6", label: "Purple" },
];

export const timezones = [
  "America/New_York", // US/Eastern
  "America/Los_Angeles", // US/Pacific
  "Europe/London",
  "Europe/Warsaw",
  "Asia/Tokyo",
  "Australia/Sydney",
];

// Enhanced UserStory interface with TAWOS features
export interface UserStory {
  id: string;
  title: string;
  role: string;
  want: string;
  benefit: string;
  acceptanceCriteria: string[];
  storyPoints?: number;
  businessValue?: number;
  priority?: "Low" | "Medium" | "High" | "Critical";
  description?: string;
  tags?: string[];
  parentTaskId?: string;
  childTaskIds?: string[];
  suggestedDependencies?: {
    taskId: string;
    reason: string;
    confidence: number;
  }[];
  // New TAWOS-specific fields
  requirements?: string[];
  estimatedTime?: number; // in hours
  assignedTeamMember?: TeamMember;
  antiPatternWarnings?: string[];
  successPattern?: string;
  completionRate?: number;
  velocity?: number;
}

// Team member interface
export interface TeamMember {
  id: string;
  name: string;
  avatar_url: string;
  email: string;
  role: string;
  level: "Junior" | "Mid" | "Senior" | "Lead";
  skills: string[];
  availability: number; // hours per sprint
  velocity?: number; // story points per sprint
}

// Sprint interface
export interface Sprint {
  id: string;
  name: string;
  duration: number; // in weeks
  capacity: number; // total story points
  stories: UserStory[];
  teamMembers: TeamMember[];
  velocity: number;
  startDate?: Date;
  endDate?: Date;
  status: "Planning" | "Active" | "Completed";
}

// Enhanced story generation parameters
export interface EnhancedStoryGenerationParams {
  featureDescription: string;
  numberOfStories?: number;
  complexity?: "simple" | "moderate" | "complex";
  priorityWeights?: PriorityWeights;
  teamMembers?: TeamMember[];
  workspaceId: string;
  useTAWOS?: boolean; // Enable TAWOS-enhanced generation
}

// Pinecone search result
export interface PineconeSearchResult {
  id: string;
  score: number;
  metadata: {
    title: string;
    description: string;
    role?: string;
    want?: string;
    benefit?: string;
    acceptanceCriteria?: string[];
    successPattern: string;
    completionRate: number;
    antiPatterns?: string[];
    tags: string[];
    storyPoints: number;
    priority: string;
    businessValue?: number;
    estimatedTime?: number;
    assignedTeamMember?: string;
  };
}

export const DEFAULT_WEIGHTS = {
  businessValue: 30,
  userImpact: 25,
  complexity: 20,
  risk: 15,
  dependencies: 10,
};

export const colorThemes = [
  { name: "Green", value: "green", color: "bg-emerald-500" },
  { name: "Blue", value: "blue", color: "bg-blue-500" },
  { name: "Red", value: "red", color: "bg-red-500" },
  { name: "Gray", value: "gray", color: "bg-gray-500" },
  { name: "Orange", value: "orange", color: "bg-orange-500" },
  { name: "Pink", value: "pink", color: "bg-pink-500" },
  { name: "Cyan", value: "cyan", color: "bg-cyan-500" },
  { name: "Brown", value: "brown", color: "bg-yellow-500" },
  { name: "Purple", value: "purple", color: "bg-purple-500" },
];

export const STATUS_COLORS = [
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-500" },
  { name: "Red", value: "red", class: "bg-red-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Cyan", value: "cyan", class: "bg-cyan-500" },
  { name: "Gray", value: "gray", class: "bg-gray-500" },
];

// Team member roles and levels
export const TEAM_ROLES = [
  "Product Manager",
  "Scrum Master",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "QA Engineer",
  "UI/UX Designer",
  "Data Scientist",
  "System Architect",
];

export const TEAM_LEVELS = ["Junior", "Mid", "Senior", "Lead"];

// Default skills for each role
export const ROLE_SKILLS: Record<string, string[]> = {
  "Product Manager": [
    "Product Strategy",
    "User Research",
    "Agile",
    "Stakeholder Management",
  ],
  "Scrum Master": [
    "Agile",
    "Scrum",
    "Team Facilitation",
    "Process Improvement",
  ],
  "Frontend Developer": [
    "React",
    "Vue",
    "Angular",
    "JavaScript",
    "TypeScript",
    "CSS",
    "HTML",
  ],
  "Backend Developer": [
    "Java",
    "Spring",
    "Node.js",
    "Python",
    "C#",
    "Database Design",
  ],
  "Full Stack Developer": [
    "React",
    "Node.js",
    "Java",
    "Spring",
    "Database",
    "DevOps",
  ],
  "DevOps Engineer": [
    "Docker",
    "Kubernetes",
    "AWS",
    "CI/CD",
    "Infrastructure",
    "Monitoring",
  ],
  "QA Engineer": [
    "Testing",
    "Automation",
    "Selenium",
    "Jest",
    "Quality Assurance",
  ],
  "UI/UX Designer": [
    "Figma",
    "Adobe XD",
    "User Research",
    "Prototyping",
    "Design Systems",
  ],
  "Data Scientist": [
    "Python",
    "Machine Learning",
    "Statistics",
    "Data Analysis",
    "SQL",
  ],
  "System Architect": [
    "System Design",
    "Architecture Patterns",
    "Scalability",
    "Security",
  ],
};
