import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  HomeIcon,
  Globe,
  Smartphone,
  Code,
  Rocket,
  LineChart,
  HelpCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { createClientSupabaseClient } from "@/lib/supabase/client";

export default function CreateWorkspaceModal({
  isCreateModalOpen,
  setIsCreateModalOpen,
}: {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(4);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    purpose: "",
    type: "",
    category: "",
  });
  const supabase = createClientSupabaseClient();

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return newWorkspace.purpose !== "";
      case 2:
        return newWorkspace.type !== "";
      case 3:
        return newWorkspace.category !== "";
      case 4:
        return newWorkspace.name.trim() !== "";
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setCreateError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setCreateError(null);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setNewWorkspace({ name: "", purpose: "", type: "", category: "" });
    setCreateError(null);
  };

  const handleModalClose = (open: boolean) => {
    setIsCreateModalOpen(open);
    if (!open) {
      resetModal();
    }
  };

  const createWorkspace = async () => {
    if (
      !newWorkspace.name ||
      !newWorkspace.purpose ||
      !newWorkspace.type ||
      !newWorkspace.category
    ) {
      setCreateError("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create workspace
      const { data: createdWorkspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: newWorkspace.name,
          purpose: newWorkspace.purpose,
          type: newWorkspace.type,
          category: newWorkspace.category,
          owner_id: user.id,
        })
        .select()
        .single();

      if (workspaceError || !createdWorkspace) {
        throw new Error(
          workspaceError?.message || "Failed to create workspace"
        );
      }

      // Create workspace member entry for the owner (use upsert to avoid duplicates)
      const { error: memberError } = await supabase
        .from("workspace_members")
        .upsert(
          {
            workspace_id: createdWorkspace.id, // Use the new workspace's UUID
            user_id: user.id,
            email: user.email,
            role: "owner",
            status: "active",
            joined_at: new Date().toISOString(),
          },
          {
            onConflict: "workspace_id,user_id",
          }
        );

      if (memberError) {
        console.error("❌ Failed to create workspace member:", memberError);
        throw new Error("Failed to add user to workspace");
      }

      // Create default space with the NEW workspace ID
      const { data: space, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name: "General",
          description: "Default space for general projects",
          icon: "hash",
          is_private: false,
          workspace_id: createdWorkspace.id, // ✅ Using NEW workspace ID
        })
        .select()
        .single();

      if (spaceError || !space) {
        console.error("❌ Failed to create space:", spaceError);
        throw new Error(
          spaceError?.message || "Failed to create default space"
        );
      }

      // Create space member entry (use upsert to avoid duplicates)
      const { error: spaceMemberError } = await supabase
        .from("space_members")
        .upsert(
          {
            space_id: space.id,
            user_id: user.id,
            role: "admin",
          },
          {
            onConflict: "space_id,user_id",
          }
        );

      if (spaceMemberError) {
        console.error("❌ Failed to create space member:", spaceMemberError);
      }

      // Create default project with the NEW workspace ID
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: "Getting Started",
          space_id: space.id,
          workspace_id: createdWorkspace.id, // ✅ Using NEW workspace ID
        })
        .select()
        .single();

      if (projectError || !project) {
        console.error("❌ Failed to create project:", projectError);
        throw new Error(
          projectError?.message || "Failed to create default project"
        );
      }

      // Create default statuses for the NEW workspace's default space
      const defaultStatuses = [
        { name: "To Do", color: "gray", position: 0, type: "space" },
        { name: "In Progress", color: "blue", position: 1, type: "space" },
        { name: "Done", color: "green", position: 2, type: "space" },
      ];

      const { error: statusError } = await supabase.from("statuses").insert(
        defaultStatuses.map((status) => ({
          ...status,
          workspace_id: createdWorkspace.id, // ✅ Using NEW workspace ID
          space_id: space.id, // Associate with the default space
        }))
      );

      if (statusError) {
        console.error("❌ Failed to create default statuses:", statusError);
      } else {
        console.log(
          "✅ Created default statuses for workspace:",
          createdWorkspace.id
        );
      }

      const {
        data: { profile },
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (
        profile?.email_notifications === "All" ||
        (profile?.email_notifications === "Default" &&
          ["workspace"].includes("workspace") &&
          ["created", "updated", "deleted"].includes("created"))
      ) {
        try {
          const response = await fetch("/api/send-email-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              eventType: "created",
              entityType: "workspace",
              entityName: newWorkspace.name,
              description: `Created workspace "${newWorkspace.name}"`,
              workspaceId: createdWorkspace.id,
            }),
          });

          const result = await response.json();

          if (result.success) {
            console.log("Test email sent successfully");
          } else {
            console.error("Failed to send test email");
          }
        } catch (error) {
          console.error("Failed to send test email");
        }
      }

      // Reset form and close modal
      resetModal();
      setIsCreateModalOpen(false);

      window.location.href = `/${createdWorkspace.workspace_id}/home`;
    } catch (err: any) {
      console.error("💥 Error creating workspace:", err);
      setCreateError(err.message || "An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                What's the purpose of your workspace?
              </h3>
              <p className="text-gray-600">
                This helps us customize your experience
              </p>
            </div>
            <RadioGroup
              value={newWorkspace.purpose}
              onValueChange={(value) =>
                setNewWorkspace((prev) => ({ ...prev, purpose: value }))
              }
              className="grid grid-cols-1 gap-4"
            >
              <div className="relative">
                <RadioGroupItem
                  value="work"
                  id="work-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="work-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Briefcase className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">Work</span>
                      <p className="text-sm text-gray-500">
                        For professional projects and teams
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="personal"
                  id="personal-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="personal-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <HomeIcon className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">Personal</span>
                      <p className="text-sm text-gray-500">
                        For personal projects and goals
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                What type of project are you working on?
              </h3>
              <p className="text-gray-600">
                Choose the category that best fits your project
              </p>
            </div>
            <RadioGroup
              value={newWorkspace.type}
              onValueChange={(value) =>
                setNewWorkspace((prev) => ({ ...prev, type: value }))
              }
              className="grid grid-cols-1 gap-4"
            >
              <div className="relative">
                <RadioGroupItem
                  value="web"
                  id="web-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="web-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Globe className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">Web Application</span>
                      <p className="text-sm text-gray-500">
                        Websites, web apps, and online platforms
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="mobile"
                  id="mobile-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="mobile-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Smartphone className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">Mobile Application</span>
                      <p className="text-sm text-gray-500">
                        iOS, Android, and cross-platform apps
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="saas"
                  id="saas-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="saas-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Code className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">SaaS Product</span>
                      <p className="text-sm text-gray-500">
                        Software as a Service platforms
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                What category best describes your project?
              </h3>
              <p className="text-gray-600">
                This helps us provide relevant templates and features
              </p>
            </div>
            <RadioGroup
              value={newWorkspace.category}
              onValueChange={(value) =>
                setNewWorkspace((prev) => ({ ...prev, category: value }))
              }
              className="grid grid-cols-1 gap-4"
            >
              <div className="relative">
                <RadioGroupItem
                  value="software development"
                  id="software-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="software-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Code className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">Software Development</span>
                      <p className="text-sm text-gray-500">
                        Building applications and software products
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="mvp"
                  id="mvp-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="mvp-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Rocket className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">MVP Development</span>
                      <p className="text-sm text-gray-500">
                        Minimum viable product and startup projects
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="marketing"
                  id="marketing-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="marketing-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <LineChart className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">Marketing Campaign</span>
                      <p className="text-sm text-gray-500">
                        Marketing projects and campaigns
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="other"
                  id="other-step"
                  className="sr-only peer"
                />
                <Label
                  htmlFor="other-step"
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <HelpCircle className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <span className="font-medium">Other</span>
                      <p className="text-sm text-gray-500">
                        Something else not listed above
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                What's the name of your workspace?
              </h3>
              <p className="text-gray-600">
                Choose a name that represents your project or team
              </p>
            </div>
            <div>
              <Label htmlFor="workspace-name-step">Workspace Name</Label>
              <Input
                id="workspace-name-step"
                placeholder="e.g. My Awesome Project"
                value={newWorkspace.name}
                onChange={(e) =>
                  setNewWorkspace((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-2"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {createError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isCreating}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNextStep() || isCreating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={createWorkspace}
                disabled={!canProceedToNextStep() || isCreating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
