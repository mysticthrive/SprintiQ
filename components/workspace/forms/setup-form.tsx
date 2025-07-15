"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Check,
  ChevronRight,
  Briefcase,
  Home,
  Globe,
  Smartphone,
  Code,
  Rocket,
  LineChart,
  Headphones,
  HelpCircle,
  Users,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Zap,
  Building2,
  Palette,
  Camera,
  ShoppingCart,
  GraduationCap,
  Heart,
  Sparkles,
} from "lucide-react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type WorkspaceFormData = {
  purpose: string;
  type: string;
  category: string;
  name: string;
  invites: { email: string; role: string }[];
};

const initialFormData: WorkspaceFormData = {
  purpose: "",
  type: "",
  category: "",
  name: "",
  invites: [],
};

// Add BaselineData type

type BaselineData = {
  storyCreationTime: number;
  backlogGroomingTime: number;
  storiesPerSession: number;
  currentMethod: "manual" | "templates" | "other_tools";
  teamSize: number;
  experienceLevel: "beginner" | "intermediate" | "expert";
};

const initialBaselineData: BaselineData = {
  storyCreationTime: 0,
  backlogGroomingTime: 0,
  storiesPerSession: 0,
  currentMethod: "manual",
  teamSize: 1,
  experienceLevel: "beginner",
};

export default function SetupWorkspaceForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WorkspaceFormData>(initialFormData);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baselineData, setBaselineData] =
    useState<BaselineData>(initialBaselineData);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  const updateFormData = (field: keyof WorkspaceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) return;

    // Check if email already exists in invites
    if (formData.invites.some((invite) => invite.email === inviteEmail)) return;

    setFormData((prev) => ({
      ...prev,
      invites: [...prev.invites, { email: inviteEmail, role: "member" }],
    }));
    setInviteEmail("");
  };

  const removeInvite = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      invites: prev.invites.filter((invite) => invite.email !== email),
    }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.purpose) return;
    if (step === 2 && !formData.type) return;
    if (step === 3 && !formData.category) return;
    if (step === 4 && !formData.name) return;
    if (
      step === 5 &&
      (!baselineData.storyCreationTime ||
        !baselineData.backlogGroomingTime ||
        !baselineData.storiesPerSession ||
        !baselineData.currentMethod ||
        !baselineData.teamSize ||
        !baselineData.experienceLevel)
    )
      return;
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const createWorkspace = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: formData.name,
          purpose: formData.purpose,
          type: formData.type,
          category: formData.category,
          owner_id: user.id,
        })
        .select()
        .single();

      if (workspaceError || !workspace) {
        throw new Error(
          workspaceError?.message || "Failed to create workspace"
        );
      }

      // Create default space
      const { data: space, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name: "General",
          workspace_id: workspace.id,
        })
        .select()
        .single();

      if (spaceError || !space) {
        throw new Error(
          spaceError?.message || "Failed to create default space"
        );
      }

      // Create default project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: "Getting Started",
          space_id: space.id,
          workspace_id: workspace.id,
        })
        .select()
        .single();

      if (projectError || !project) {
        throw new Error(
          projectError?.message || "Failed to create default project"
        );
      }

      // Add invites
      if (formData.invites.length > 0) {
        const invites = formData.invites.map((invite) => ({
          workspace_id: workspace.id,
          email: invite.email,
          role: invite.role,
          status: "pending",
          user_id: "00000000-0000-0000-0000-000000000000",
        }));

        const { error: inviteError } = await supabase
          .from("workspace_members")
          .insert(invites);

        if (inviteError) {
          console.error("Failed to add invites:", inviteError);
        }
      }

      // Save baseline survey answers
      await supabase.from("user_baselines").insert({
        user_id: user.id,
        baseline_story_time_ms: baselineData.storyCreationTime * 60 * 1000,
        baseline_grooming_time_ms: baselineData.backlogGroomingTime * 60 * 1000,
        baseline_planning_time_ms: 0, // Not collected in survey
        baseline_stories_per_session: baselineData.storiesPerSession,
        baseline_method: baselineData.currentMethod,
        team_size: baselineData.teamSize,
        experience_level: baselineData.experienceLevel,
        measurement_date: new Date().toISOString(),
      });

      // Redirect to workspace using short ID
      router.push(`/${workspace.workspace_id}/home`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl w-full relative z-10">
        <Card className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden min-h-[700px]">
          <div className="flex h-full">
            {/* Left Sidebar */}
            <div className="w-1/3 bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-700 p-8 flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center mb-6">
                  <Image
                    src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/sprintiq-logo.png"
                    alt="SprintiQ Logo"
                    width={150}
                    height={40}
                    priority // Preload the logo as it's above the fold [^3]
                    className="h-auto"
                  />
                </div>
                <h1 className="text-xl font-bold mb-1 text-white">
                  Create Your Workspace
                </h1>
                <p className="text-emerald-100 text-xs">
                  Let's set up your perfect workspace in just a few steps
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex-1">
                <div className="space-y-6">
                  {[
                    {
                      step: 1,
                      label: "Purpose",
                      description: "What's your workspace for?",
                    },
                    {
                      step: 2,
                      label: "Type",
                      description: "What type of projects?",
                    },
                    {
                      step: 3,
                      label: "Category",
                      description: "Industry or focus area",
                    },
                    {
                      step: 4,
                      label: "Name",
                      description: "Name your workspace",
                    },
                    {
                      step: 5,
                      label: "Survey",
                      description: "User Survey",
                    },
                    { step: 6, label: "Team", description: "Invite your team" },
                    {
                      step: 7,
                      label: "Ready",
                      description: "Launch your workspace",
                    },
                  ].map(({ step: i, label, description }) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 flex-shrink-0 ${
                          step >= i
                            ? "bg-white text-emerald-600 shadow-lg scale-110"
                            : step === i
                            ? "bg-emerald-500 text-white border-2 border-white"
                            : "bg-emerald-800/50 text-emerald-200 border-2 border-emerald-500/30"
                        }`}
                      >
                        {step > i ? <Check className="h-4 w-4" /> : i}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-semibold transition-colors ${
                            step >= i
                              ? "text-white"
                              : step === i
                              ? "text-emerald-100"
                              : "text-emerald-300/70"
                          }`}
                        >
                          {label}
                        </div>
                        <div
                          className={`text-sm transition-colors ${
                            step >= i
                              ? "text-emerald-100"
                              : step === i
                              ? "text-emerald-200/80"
                              : "text-emerald-400/50"
                          }`}
                        >
                          {description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mt-8">
                  <div className="h-2 bg-emerald-800/30 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-white rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${((step - 1) / 7) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-emerald-100/80 text-sm mt-2 text-center">
                    Step {step} of 7
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="mt-8 space-y-3">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-xl transition-all duration-200"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}

                {step < 7 && (
                  <Button
                    onClick={nextStep}
                    disabled={
                      (step === 1 && !formData.purpose) ||
                      (step === 2 && !formData.type) ||
                      (step === 3 && !formData.category) ||
                      (step === 4 && !formData.name) ||
                      (step === 5 &&
                        (!baselineData.storyCreationTime ||
                          !baselineData.backlogGroomingTime ||
                          !baselineData.storiesPerSession ||
                          !baselineData.currentMethod ||
                          !baselineData.teamSize ||
                          !baselineData.experienceLevel))
                    }
                    className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {step === 6
                      ? formData.invites.length > 0
                        ? "Continue"
                        : "Skip for now"
                      : "Continue"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {step === 7 && (
                  <Button
                    onClick={createWorkspace}
                    disabled={isLoading}
                    className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none py-3"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Rocket className="h-4 w-4" />
                        <span>Launch Workspace</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
              {error && (
                <Alert
                  variant="destructive"
                  className="mb-8 bg-red-50 border-red-200 rounded-xl"
                >
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Step 1: Purpose */}
              {step === 1 && (
                <div className="h-full flex flex-col justify-center">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      What's your workspace for?
                    </h2>
                    <p className="text-slate-300 text-xl max-w-2xl mx-auto">
                      This helps us customize your experience with the right
                      tools and templates.
                    </p>
                  </div>

                  <RadioGroup
                    value={formData.purpose}
                    onValueChange={(value) => updateFormData("purpose", value)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                  >
                    <div className="relative">
                      <RadioGroupItem
                        value="Work"
                        id="work"
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="work"
                        className="flex flex-col items-center justify-center bg-slate-800/50 border-2 border-slate-600/50 rounded-3xl p-12 cursor-pointer peer-focus:ring-4 peer-focus:ring-emerald-200/30 peer-checked:border-emerald-400 peer-checked:bg-emerald-900/30 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 group relative"
                      >
                        {/* Check icon for selected state */}
                        {formData.purpose === "Work" && (
                          <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <Briefcase className="h-10 w-10 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white mb-3">
                          Work
                        </span>
                        <span className="text-slate-300 text-center leading-relaxed">
                          Professional projects, team collaboration, and
                          business workflows
                        </span>
                      </Label>
                    </div>

                    <div className="relative">
                      <RadioGroupItem
                        value="Personal"
                        id="personal"
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="personal"
                        className="flex flex-col items-center h-full justify-center bg-slate-800/50 border-2 border-slate-600/50 rounded-3xl p-12 cursor-pointer peer-focus:ring-4 peer-focus:ring-emerald-200/30 peer-checked:border-emerald-400 peer-checked:bg-emerald-900/30 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 group relative"
                      >
                        {/* Check icon for selected state */}
                        {formData.purpose === "Personal" && (
                          <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <Home className="h-10 w-10 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white mb-3">
                          Personal
                        </span>
                        <span className="text-slate-300 text-center leading-relaxed">
                          Individual projects, personal goals, and creative
                          endeavors
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Step 2: Type */}
              {step === 2 && (
                <div className="h-full flex flex-col justify-center">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      What type of projects will you work on?
                    </h2>
                    <p className="text-slate-300 text-xl max-w-2xl mx-auto">
                      We'll configure the perfect tools and integrations for
                      your workflow.
                    </p>
                  </div>

                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) => updateFormData("type", value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
                  >
                    {[
                      {
                        value: "Web",
                        icon: Globe,
                        description: "Web applications and websites",
                      },
                      {
                        value: "Mobile",
                        icon: Smartphone,
                        description: "iOS and Android applications",
                      },
                      {
                        value: "SaaS",
                        icon: Code,
                        description: "Software as a Service platforms",
                      },
                    ].map(({ value, icon: Icon, description }) => (
                      <div key={value} className="relative">
                        <RadioGroupItem
                          value={value}
                          id={value.toLowerCase()}
                          className="sr-only peer"
                        />
                        <Label
                          htmlFor={value.toLowerCase()}
                          className="flex flex-col items-center justify-center bg-slate-800/50 border-2 border-slate-600/50 rounded-2xl p-8 cursor-pointer peer-focus:ring-4 peer-focus:ring-emerald-200/30 peer-checked:border-emerald-400 peer-checked:bg-emerald-900/30 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 group relative"
                        >
                          {/* Check icon for selected state */}
                          {formData.type === value && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <span className="text-xl font-bold text-white mb-2">
                            {value}
                          </span>
                          <span className="text-sm text-slate-300 text-center">
                            {description}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 3: Category */}
              {step === 3 && (
                <div className="h-full flex flex-col justify-center">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      What industry or focus area?
                    </h2>
                    <p className="text-slate-300 text-xl max-w-2xl mx-auto">
                      We'll set up relevant templates and workflows for your
                      specific needs.
                    </p>
                  </div>

                  <RadioGroup
                    value={formData.category}
                    onValueChange={(value) => updateFormData("category", value)}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
                  >
                    {[
                      { value: "Software Development", icon: Code },
                      { value: "MVP", icon: Rocket },
                      { value: "Startup", icon: Building2 },
                      { value: "Marketing", icon: LineChart },
                      { value: "Design", icon: Palette },
                      { value: "Content", icon: Camera },
                      { value: "E-commerce", icon: ShoppingCart },
                      { value: "Education", icon: GraduationCap },
                      { value: "Healthcare", icon: Heart },
                      { value: "IT", icon: Code },
                      { value: "Support", icon: Headphones },
                      { value: "Other", icon: HelpCircle },
                    ].map(({ value, icon: Icon }) => (
                      <div key={value} className="relative">
                        <RadioGroupItem
                          value={value}
                          id={value.toLowerCase().replace(/\s+/g, "-")}
                          className="sr-only peer"
                        />
                        <Label
                          htmlFor={value.toLowerCase().replace(/\s+/g, "-")}
                          className="flex flex-col h-full items-center justify-center bg-slate-800/50 border-2 border-slate-600/50 rounded-2xl p-6 cursor-pointer peer-focus:ring-4 peer-focus:ring-emerald-200/30 peer-checked:border-emerald-400 peer-checked:bg-emerald-900/30 hover:border-emerald-400/50 hover:shadow-md transition-all duration-300 group min-h-[120px] relative"
                        >
                          {/* Check icon for selected state */}
                          {formData.category === value && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-white text-center leading-tight">
                            {value}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 4: Workspace Name */}
              {step === 4 && (
                <div className="h-full flex flex-col justify-center">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      Name your workspace
                    </h2>
                    <p className="text-slate-300 text-xl max-w-2xl mx-auto">
                      Choose a name that represents your team, project, or
                      organization.
                    </p>
                  </div>

                  <div className="max-w-lg mx-auto">
                    <Label
                      htmlFor="workspace-name"
                      className="text-white font-semibold mb-4 block text-lg"
                    >
                      Workspace Name
                    </Label>
                    <Input
                      id="workspace-name"
                      placeholder="e.g. Acme Corp, My Startup, Creative Projects"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      className="h-16 bg-slate-800/50 border-2 border-slate-600/50 text-white placeholder:text-slate-400 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/30 transition-all duration-200 hover:bg-slate-800/70 hover:border-emerald-400/50 text-lg px-6"
                    />
                    <p className="text-sm text-slate-400 mt-3">
                      You can always change this later in your workspace
                      settings.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Survey */}
              {step === 5 && (
                <div className="h-full flex flex-col justify-center">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      User Survey
                    </h2>
                    <p className="text-slate-300 text-xl max-w-2xl mx-auto">
                      Help us understand your current process so we can tailor
                      your experience.
                    </p>
                  </div>
                  <div className="max-w-lg mx-auto space-y-6">
                    {/* Story Creation Time */}
                    <div>
                      <Label className="block text-sm font-medium mb-2 text-white">
                        How long does it typically take you to create ONE user
                        story? (minutes)
                      </Label>
                      <Input
                        type="number"
                        value={baselineData.storyCreationTime || ""}
                        onChange={(e) =>
                          setBaselineData({
                            ...baselineData,
                            storyCreationTime: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="e.g., 15"
                        min={1}
                        max={240}
                        required
                        className="w-full p-2 border rounded-md bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Include time for research, writing, and defining
                        acceptance criteria
                      </p>
                    </div>
                    {/* Backlog Grooming Time */}
                    <div>
                      <Label className="block text-sm font-medium mb-2 text-white">
                        How long do your backlog grooming sessions typically
                        last? (minutes)
                      </Label>
                      <Input
                        type="number"
                        value={baselineData.backlogGroomingTime || ""}
                        onChange={(e) =>
                          setBaselineData({
                            ...baselineData,
                            backlogGroomingTime: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="e.g., 60"
                        min={15}
                        max={480}
                        required
                        className="w-full p-2 border rounded-md bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                      />
                    </div>
                    {/* Stories Per Session */}
                    <div>
                      <Label className="block text-sm font-medium mb-2 text-white">
                        How many stories do you typically create/refine per
                        grooming session?
                      </Label>
                      <Input
                        type="number"
                        value={baselineData.storiesPerSession || ""}
                        onChange={(e) =>
                          setBaselineData({
                            ...baselineData,
                            storiesPerSession: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="e.g., 5"
                        min={1}
                        max={50}
                        required
                        className="w-full p-2 border rounded-md bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                      />
                    </div>
                    {/* Current Method */}
                    <div>
                      <Label className="block text-sm font-medium mb-2 text-white">
                        How do you currently create user stories?
                      </Label>
                      <Select
                        value={baselineData.currentMethod}
                        onValueChange={(value) =>
                          setBaselineData({
                            ...baselineData,
                            currentMethod:
                              value as BaselineData["currentMethod"],
                          })
                        }
                        required
                      >
                        <SelectTrigger className="w-full p-2 border rounded-md bg-slate-800/50 border-slate-600/50 text-white">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">
                            Manual writing from scratch
                          </SelectItem>
                          <SelectItem value="templates">
                            Using templates/examples
                          </SelectItem>
                          <SelectItem value="other_tools">
                            Other AI/automation tools
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Team Size */}
                    <div>
                      <Label className="block text-sm font-medium mb-2 text-white">
                        What's your team size?
                      </Label>
                      <Select
                        value={String(baselineData.teamSize)}
                        onValueChange={(value) =>
                          setBaselineData({
                            ...baselineData,
                            teamSize: parseInt(value),
                          })
                        }
                        required
                      >
                        <SelectTrigger className="w-full p-2 border rounded-md bg-slate-800/50 border-slate-600/50 text-white">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Just me</SelectItem>
                          <SelectItem value="2">2-3 people</SelectItem>
                          <SelectItem value="5">4-6 people</SelectItem>
                          <SelectItem value="10">7-12 people</SelectItem>
                          <SelectItem value="20">13+ people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Experience Level */}
                    <div>
                      <Label className="block text-sm font-medium mb-2 text-white">
                        Your experience with agile/user stories?
                      </Label>
                      <Select
                        value={baselineData.experienceLevel}
                        onValueChange={(value) =>
                          setBaselineData({
                            ...baselineData,
                            experienceLevel:
                              value as BaselineData["experienceLevel"],
                          })
                        }
                        required
                      >
                        <SelectTrigger className="w-full p-2 border rounded-md bg-slate-800/50 border-slate-600/50 text-white">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">
                            Beginner (&lt; 1 year)
                          </SelectItem>
                          <SelectItem value="intermediate">
                            Intermediate (1-3 years)
                          </SelectItem>
                          <SelectItem value="expert">
                            Expert (3+ years)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Invite People */}
              {step === 6 && (
                <div className="h-full flex flex-col justify-center">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      Invite your team
                    </h2>
                    <p className="text-slate-300 text-xl max-w-2xl mx-auto">
                      Add team members to collaborate on projects together. You
                      can skip this step and invite people later.
                    </p>
                  </div>

                  <div className="max-w-lg mx-auto space-y-8">
                    <div>
                      <Label
                        htmlFor="invite-email"
                        className="text-white font-semibold mb-4 block text-lg"
                      >
                        Email Address
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="colleague@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1 h-14 bg-slate-800/50 border-2 border-slate-600/50 text-white placeholder:text-slate-400 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/30 transition-all duration-200"
                          onKeyPress={(e) => e.key === "Enter" && addInvite()}
                        />
                        <Button
                          onClick={addInvite}
                          disabled={!inviteEmail.includes("@")}
                          className="bg-emerald-600 hover:bg-emerald-700 px-8 h-14 rounded-2xl font-semibold transition-all duration-200"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {formData.invites.length > 0 && (
                      <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-600/30">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-emerald-400" />
                          Team Members ({formData.invites.length})
                        </h3>
                        <div className="space-y-3">
                          {formData.invites.map((invite) => (
                            <div
                              key={invite.email}
                              className="flex items-center justify-between bg-slate-800/50 border border-slate-600/50 p-4 rounded-xl"
                            >
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-white font-semibold text-sm">
                                    {invite.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-white font-medium">
                                    {invite.email}
                                  </span>
                                  <div className="text-sm text-slate-400">
                                    Member
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInvite(invite.email)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 7: Thank You with Canvas Fireworks */}
              {step === 7 && (
                <div className="h-full flex flex-col justify-center text-center relative z-20">
                  <div className="flex justify-center mb-12 relative">
                    <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-pulse relative">
                      <Check className="h-16 w-16 text-white" />
                      {/* Sparkle effects around the check */}
                      <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-emerald-400/20 animate-spin" />
                      <Sparkles className="absolute -bottom-2 -left-2 h-6 w-6 text-emerald-400/20 animate-ping" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h2 className="text-5xl font-bold text-white mb-6 animate-bounce">
                      🎉 You're all set! 🎉
                    </h2>
                    <div className="bg-slate-800/50 border border-slate-600/30 rounded-2xl p-8 max-w-2xl mx-auto backdrop-blur-md">
                      <p className="text-slate-300 text-xl leading-relaxed mb-4">
                        Your workspace{" "}
                        <span className="font-bold text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded-lg">
                          {formData.name}
                        </span>{" "}
                        is ready to go!
                      </p>
                      <p className="text-slate-400">
                        We've set up everything you need to start managing your{" "}
                        {formData.category.toLowerCase()} projects.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
