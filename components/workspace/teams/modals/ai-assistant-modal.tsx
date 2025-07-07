"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { Team, Role, Level, Profile } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Plus, X, Sparkles, Users, Target } from "lucide-react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface AIAssistantModalProps {
  team: Team | null;
  roles: Role[];
  levels: Level[];
  profiles: Profile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface GeneratedMember {
  name: string;
  email: string;
  role: string;
  level: string;
  description: string;
  skills: string[];
  experience: string;
}

export default function AIAssistantModal({
  team,
  roles,
  levels,
  profiles,
  open,
  onOpenChange,
  onSuccess,
}: AIAssistantModalProps) {
  const { toast } = useEnhancedToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [projectIdea, setProjectIdea] = useState("");
  const [projectType, setProjectType] = useState("");
  const [generatedMembers, setGeneratedMembers] = useState<GeneratedMember[]>(
    []
  );
  const [selectedMembers, setSelectedMembers] = useState<GeneratedMember[]>([]);

  const supabase = createClientSupabaseClient();

  // Enhanced role suggestions based on project type
  const getRoleSuggestions = (projectType: string, idea: string) => {
    const suggestions: { role: string; level: string; skills: string[] }[] = [];

    const lowerIdea = idea.toLowerCase();
    const lowerType = projectType.toLowerCase();

    // Web Development
    if (
      lowerType.includes("web") ||
      lowerIdea.includes("website") ||
      lowerIdea.includes("web app")
    ) {
      suggestions.push(
        {
          role: "Front-end Developer",
          level: "Mid-Level",
          skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
        },
        {
          role: "Back-end Developer",
          level: "Mid-Level",
          skills: ["Node.js", "Express", "PostgreSQL", "REST APIs"],
        },
        {
          role: "UI/UX Designer",
          level: "Mid-Level",
          skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
        }
      );
    }

    // Mobile Development
    if (
      lowerType.includes("mobile") ||
      lowerIdea.includes("mobile app") ||
      lowerIdea.includes("ios") ||
      lowerIdea.includes("android")
    ) {
      suggestions.push(
        {
          role: "Mobile Developer",
          level: "Mid-Level",
          skills: ["React Native", "iOS", "Android", "Mobile UI/UX"],
        },
        {
          role: "Back-end Developer",
          level: "Mid-Level",
          skills: ["Node.js", "Firebase", "APIs", "Database Design"],
        }
      );
    }

    // AI/ML Projects
    if (
      lowerType.includes("ai") ||
      lowerType.includes("machine learning") ||
      lowerIdea.includes("ai") ||
      lowerIdea.includes("ml")
    ) {
      suggestions.push(
        {
          role: "AI/ML Engineer",
          level: "Senior",
          skills: ["Python", "TensorFlow", "PyTorch", "Data Science"],
        },
        {
          role: "Data Scientist",
          level: "Mid-Level",
          skills: ["Python", "Pandas", "Scikit-learn", "Data Analysis"],
        },
        {
          role: "Back-end Developer",
          level: "Mid-Level",
          skills: ["Python", "FastAPI", "Docker", "Cloud Services"],
        }
      );
    }

    // E-commerce
    if (
      lowerType.includes("e-commerce") ||
      lowerIdea.includes("shop") ||
      lowerIdea.includes("store")
    ) {
      suggestions.push(
        {
          role: "Full-stack Developer",
          level: "Mid-Level",
          skills: ["React", "Node.js", "Stripe", "E-commerce"],
        },
        {
          role: "UI/UX Designer",
          level: "Mid-Level",
          skills: ["Figma", "E-commerce UX", "Conversion Optimization"],
        },
        {
          role: "Product Manager",
          level: "Mid-Level",
          skills: ["Product Strategy", "User Research", "Analytics"],
        }
      );
    }

    // SaaS/B2B
    if (
      lowerType.includes("saas") ||
      lowerType.includes("b2b") ||
      lowerIdea.includes("platform")
    ) {
      suggestions.push(
        {
          role: "Full-stack Developer",
          level: "Senior",
          skills: ["React", "Node.js", "PostgreSQL", "Microservices"],
        },
        {
          role: "Product Manager",
          level: "Mid-Level",
          skills: ["Product Strategy", "B2B SaaS", "Customer Development"],
        },
        {
          role: "DevOps Engineer",
          level: "Mid-Level",
          skills: ["AWS", "Docker", "CI/CD", "Infrastructure"],
        }
      );
    }

    // Default suggestions for any project
    if (suggestions.length === 0) {
      suggestions.push(
        {
          role: "Project Manager",
          level: "Mid-Level",
          skills: ["Agile", "Scrum", "Team Leadership", "Risk Management"],
        },
        {
          role: "Full-stack Developer",
          level: "Mid-Level",
          skills: ["React", "Node.js", "Database Design", "APIs"],
        },
        {
          role: "UI/UX Designer",
          level: "Mid-Level",
          skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
        }
      );
    }

    return suggestions;
  };

  const generateMembers = async () => {
    if (!projectIdea.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project idea",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      // Get role suggestions based on project type and idea
      const roleSuggestions = getRoleSuggestions(projectType, projectIdea);

      // Generate realistic team members
      const sampleMembers: GeneratedMember[] = roleSuggestions.map(
        (suggestion, index) => {
          const names = [
            "Alex Chen",
            "Sarah Rodriguez",
            "Marcus Johnson",
            "Emily Watson",
            "David Kim",
            "Lisa Thompson",
            "James Wilson",
            "Maria Garcia",
            "Robert Lee",
            "Jennifer Brown",
            "Michael Davis",
            "Amanda White",
          ];

          const domains = [
            "gmail.com",
            "outlook.com",
            "company.com",
            "startup.io",
          ];

          const name = names[index % names.length];
          const email = `${name.toLowerCase().replace(" ", ".")}@${
            domains[index % domains.length]
          }`;

          const experience =
            suggestion.level === "Senior"
              ? "5+ years of experience in the field"
              : suggestion.level === "Mid-Level"
              ? "3+ years of experience with modern technologies"
              : "1+ years of experience, eager to learn and grow";

          return {
            name,
            email,
            role: suggestion.role,
            level: suggestion.level,
            description: `Experienced ${suggestion.role.toLowerCase()} with expertise in ${suggestion.skills
              .slice(0, 2)
              .join(", ")} and ${experience}.`,
            skills: suggestion.skills,
            experience,
          };
        }
      );

      // Add a few more specialized roles based on project complexity
      if (roleSuggestions.length < 4) {
        const additionalRoles = [
          {
            name: "Quality Assurance Engineer",
            email: "qa.engineer@company.com",
            role: "QA Engineer",
            level: "Mid-Level",
            description:
              "Experienced QA engineer with expertise in automated testing, manual testing, and quality assurance processes.",
            skills: ["Selenium", "Jest", "Manual Testing", "Test Planning"],
            experience: "3+ years of experience in software testing",
          },
          {
            name: "DevOps Engineer",
            email: "devops.engineer@company.com",
            role: "DevOps Engineer",
            level: "Mid-Level",
            description:
              "DevOps specialist with experience in CI/CD pipelines, cloud infrastructure, and deployment automation.",
            skills: ["Docker", "Kubernetes", "AWS", "CI/CD"],
            experience: "3+ years of experience in DevOps and infrastructure",
          },
        ];

        sampleMembers.push(
          ...additionalRoles.slice(0, 4 - roleSuggestions.length)
        );
      }

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setGeneratedMembers(sampleMembers);
      toast({
        title: "Success",
        description: `AI has generated ${
          sampleMembers.length
        } team members based on your ${projectType || "project"} idea`,
      });
    } catch (error) {
      console.error("Error generating members:", error);
      toast({
        title: "Error",
        description: "Failed to generate team members",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const addMember = (member: GeneratedMember) => {
    if (!selectedMembers.find((m) => m.email === member.email)) {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const removeMember = (email: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.email !== email));
  };

  const saveMembers = async () => {
    if (!team || selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one member to add",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Find default level IDs
      const getLevelId = (levelName: string) => {
        const level = levels.find((l) =>
          l.name.toLowerCase().includes(levelName.toLowerCase().split("-")[0])
        );
        return level?.id || levels[0]?.id;
      };

      // Create members
      const memberPromises = selectedMembers.map(async (member) => {
        // Find or create role
        let roleId = roles.find((r) =>
          r.name.toLowerCase().includes(member.role.toLowerCase())
        )?.id;

        if (!roleId) {
          // Create a new role if it doesn't exist
          const { data: newRole } = await supabase
            .from("roles")
            .insert({ name: member.role })
            .select()
            .single();
          roleId = newRole?.id;
        }

        if (!roleId) {
          throw new Error(`Failed to create role: ${member.role}`);
        }

        const levelId = getLevelId(member.level);

        // Create team member
        return supabase.from("team_members").insert({
          team_id: team.id,
          name: member.name,
          role_id: roleId,
          level_id: levelId,
          email: member.email,
          description: member.description,
          is_registered: false,
        });
      });

      await Promise.all(memberPromises);

      toast({
        title: "Success",
        description: `${selectedMembers.length} members added to the team`,
      });

      setProjectIdea("");
      setProjectType("");
      setGeneratedMembers([]);
      setSelectedMembers([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving members:", error);
      toast({
        title: "Error",
        description: "Failed to save team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-workspace-primary" />
            AI Team Assistant
            <Sparkles className="h-4 w-4 text-workspace-primary" />
          </DialogTitle>
          <DialogDescription>
            Describe your project idea and AI will suggest the perfect team
            members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Type and Idea Input */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project-type" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Project Type
              </Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web Development</SelectItem>
                  <SelectItem value="mobile">Mobile Development</SelectItem>
                  <SelectItem value="ai">AI/Machine Learning</SelectItem>
                  <SelectItem value="e-commerce">E-commerce</SelectItem>
                  <SelectItem value="saas">SaaS/B2B Platform</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-idea" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Project Description
              </Label>
              <Textarea
                id="project-idea"
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                placeholder="Describe your project idea, requirements, goals, and any specific technologies or features you have in mind..."
                rows={4}
                disabled={generating}
                className="resize-none"
              />
            </div>

            <Button
              onClick={generateMembers}
              disabled={!projectIdea.trim() || generating}
              className="w-full workspace-primary text-white hover:workspace-primary-hover"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI is analyzing your project...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Generate Team Members
                </>
              )}
            </Button>
          </div>

          {/* Generated Members */}
          {generatedMembers.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                AI Generated Team Members ({generatedMembers.length})
              </h3>
              <div className="grid gap-4">
                {generatedMembers.map((member, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg workspace-surface border workspace-border hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="font-semibold text-lg workspace-text">
                            {member.name}
                          </div>
                          <div className="text-sm workspace-text-muted">
                            {member.email}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Badge
                            variant="secondary"
                            className="workspace-component-bg text-workspace-primary border-workspace-primary"
                          >
                            {member.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-workspace-primary text-workspace-primary"
                          >
                            {member.level}
                          </Badge>
                        </div>

                        <div className="text-sm workspace-text-secondary">
                          {member.description}
                        </div>

                        <div>
                          <div className="text-xs font-medium workspace-text-muted mb-1">
                            Key Skills:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {member.skills.map((skill, skillIndex) => (
                              <Badge
                                key={skillIndex}
                                variant="outline"
                                className="text-xs workspace-surface-secondary border workspace-border workspace-text-secondary"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addMember(member)}
                        disabled={selectedMembers.some(
                          (m) => m.email === member.email
                        )}
                        className="ml-4 workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-workspace-primary" />
                Selected Members ({selectedMembers.length})
              </h3>
              <div className="grid gap-3">
                {selectedMembers.map((member, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg workspace-component-bg border-workspace-primary"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium workspace-text">
                          {member.name}
                        </div>
                        <div className="text-sm workspace-text-muted">
                          {member.email}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="workspace-primary text-white"
                          >
                            {member.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-workspace-primary text-workspace-primary"
                          >
                            {member.level}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMember(member.email)}
                        className="ml-4 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="workspace-surface-secondary border workspace-border workspace-text-secondary hover:workspace-hover"
          >
            Cancel
          </Button>
          <Button
            onClick={saveMembers}
            disabled={selectedMembers.length === 0 || loading}
            className="workspace-primary text-white hover:workspace-primary-hover"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Members...
              </>
            ) : (
              `Add ${selectedMembers.length} Member${
                selectedMembers.length !== 1 ? "s" : ""
              } to Team`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
