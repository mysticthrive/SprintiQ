"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import {
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  GitBranch,
  Zap,
  Trello,
} from "lucide-react";
import type {
  Workspace,
  Space,
  JiraIntegration,
  JiraProject,
} from "@/lib/database.types";

interface IntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (integration: JiraIntegration) => void;
  workspace: Workspace;
  spaces: Space[];
  existingIntegration?: JiraIntegration;
}

interface IntegrationPlatform {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  available: boolean;
}

const INTEGRATION_PLATFORMS: IntegrationPlatform[] = [
  {
    id: "jira",
    name: "Jira",
    description: "Connect to Jira Cloud or Server",
    icon: GitBranch,
    color: "bg-blue-500",
    available: true,
  },
  {
    id: "azure-devops",
    name: "Azure DevOps",
    description: "Connect to Microsoft Azure DevOps",
    icon: Zap,
    color: "bg-purple-500",
    available: false, // Not implemented yet
  },
  {
    id: "asana",
    name: "Asana",
    description: "Connect to Asana workspace",
    icon: Trello,
    color: "bg-orange-500",
    available: false, // Not implemented yet
  },
];

interface JiraProjectOption {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead?: {
    displayName: string;
    emailAddress: string;
  };
  url: string;
}

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: {
    id: string;
    name: string;
    statusCategory: {
      key: string;
      colorName: string;
    };
  };
  priority: {
    id: string;
    name: string;
  };
  assignee?: {
    displayName: string;
    emailAddress: string;
  };
  created: string;
  updated: string;
  duedate?: string;
  parent?: {
    id: string;
    key: string;
  };
  subtasks?: Array<{
    id: string;
    key: string;
  }>;
}

interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    key: string;
    colorName: string;
  };
}

type Step = 1 | 2 | 3 | 4;

export default function IntegrationModal({
  open,
  onOpenChange,
  onSuccess,
  workspace,
  spaces,
  existingIntegration,
}: IntegrationModalProps) {
  const params = useParams();
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [jiraDomain, setJiraDomain] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [hasSuccessfulConnection, setHasSuccessfulConnection] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<
    JiraProjectOption[]
  >([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [projectIssues, setProjectIssues] = useState<
    Record<string, JiraIssue[]>
  >({});
  const [projectStatuses, setProjectStatuses] = useState<
    Record<string, JiraStatus[]>
  >({});
  const [isImporting, setIsImporting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (existingIntegration) {
        setSelectedPlatform("jira");
        setJiraDomain(existingIntegration.jira_domain);
        setJiraEmail(existingIntegration.jira_email);
        setJiraApiToken(existingIntegration.jira_api_token);
        setConnectionTested(true);
        setConnectionSuccess(true);
        setHasSuccessfulConnection(true);
        setCurrentStep(2);
      } else {
        if (
          !hasSuccessfulConnection &&
          !jiraDomain &&
          !jiraEmail &&
          !jiraApiToken
        ) {
          setSelectedPlatform("");
          setJiraDomain("");
          setJiraEmail("");
          setJiraApiToken("");
          setConnectionTested(false);
          setConnectionSuccess(false);
          setCurrentStep(1);
        } else if (hasSuccessfulConnection) {
          setConnectionTested(true);
          setConnectionSuccess(true);
          setCurrentStep(2);
        }
      }
      setSelectedProjects(new Set());
      setSelectedSpaceId(spaces.length > 0 ? spaces[0].id : "");
      if (availableProjects.length === 0) {
        setAvailableProjects([]);
      }
    }
  }, [open, existingIntegration, spaces, hasSuccessfulConnection]);

  const testConnection = async () => {
    if (!jiraDomain || !jiraEmail || !jiraApiToken) {
      toast({
        title: "Missing information",
        description: "Please fill in all Jira connection details.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionTested(false);

    try {
      const response = await fetch(
        `/api/workspace/${params.workspaceId}/jira/test-connection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jira_domain: jiraDomain,
            jira_email: jiraEmail,
            jira_api_token: jiraApiToken,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setConnectionSuccess(true);
        setConnectionTested(true);
        setHasSuccessfulConnection(true);
        toast({
          title: "Connection successful",
          description: "Successfully connected to Jira!",
        });

        await fetchProjects();
      } else {
        setConnectionSuccess(false);
        setConnectionTested(true);
        setHasSuccessfulConnection(false);
        toast({
          title: "Connection failed",
          description:
            result.error ||
            "Could not connect to Jira. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Jira connection test error:", error);
      setConnectionSuccess(false);
      setConnectionTested(true);
      setHasSuccessfulConnection(false);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Jira.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch(
        `/api/workspace/${params.workspaceId}/jira/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jira_domain: jiraDomain,
            jira_email: jiraEmail,
            jira_api_token: jiraApiToken,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.projects) {
        setAvailableProjects(result.projects);
      } else {
        throw new Error(result.error || "Failed to fetch projects");
      }
    } catch (error: any) {
      console.error("Failed to fetch Jira projects:", error);
      toast({
        title: "Failed to fetch projects",
        description: "Could not retrieve projects from Jira.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchIssuesAndStatuses = async () => {
    if (selectedProjects.size === 0) {
      toast({
        title: "No projects selected",
        description: "Please select at least one project to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingIssues(true);
    const issues: Record<string, JiraIssue[]> = {};
    const statuses: Record<string, JiraStatus[]> = {};

    try {
      for (const projectKey of selectedProjects) {
        const response = await fetch(
          `/api/workspace/${params.workspaceId}/jira/issues`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jira_domain: jiraDomain,
              jira_email: jiraEmail,
              jira_api_token: jiraApiToken,
              project_key: projectKey,
            }),
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          issues[projectKey] = result.issues;
          statuses[projectKey] = result.statuses;
        } else {
          console.error(
            `Failed to fetch data for project ${projectKey}:`,
            result.error
          );
        }
      }

      setProjectIssues(issues);
      setProjectStatuses(statuses);
      setCurrentStep(4);
    } catch (error: any) {
      console.error("Failed to fetch issues and statuses:", error);
      toast({
        title: "Failed to fetch data",
        description: "Could not retrieve issues and statuses from Jira.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const importData = async () => {
    if (selectedProjects.size === 0) {
      toast({
        title: "No projects selected",
        description: "Please select at least one project to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch(
        `/api/workspace/${params.workspaceId}/jira/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jira_domain: jiraDomain,
            jira_email: jiraEmail,
            jira_api_token: jiraApiToken,
            space_id: selectedSpaceId,
            selected_projects: Array.from(selectedProjects),
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.data.projects} projects, ${result.data.tasks} tasks, and ${result.data.statuses} statuses.`,
          sendBrowserNotification: true,
          browserNotificationTitle: "Jira Import Complete",
          browserNotificationBody: `Successfully imported ${result.data.tasks} tasks from Jira.`,
        });

        // Reset form
        setSelectedPlatform("");
        setJiraDomain("");
        setJiraEmail("");
        setJiraApiToken("");
        setConnectionTested(false);
        setConnectionSuccess(false);
        setHasSuccessfulConnection(false);
        setSelectedProjects(new Set());
        setAvailableProjects([]);
        setProjectIssues({});
        setProjectStatuses({});
        setCurrentStep(1);

        // Close modal
        onOpenChange(false);

        // Callback with the integration
        if (onSuccess) {
          const integration = {
            id: "", // Will be set by the import process
            workspace_id: workspace.id,
            jira_domain: jiraDomain,
            jira_email: jiraEmail,
            jira_api_token: jiraApiToken,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          onSuccess(integration as JiraIntegration);
        }
      } else {
        throw new Error(result.error || "Failed to import data");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data from Jira.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const toggleProjectSelection = (projectKey: string) => {
    const newSelection = new Set(selectedProjects);
    if (newSelection.has(projectKey)) {
      newSelection.delete(projectKey);
    } else {
      newSelection.add(projectKey);
    }
    setSelectedProjects(newSelection);
  };

  const clearForm = () => {
    setSelectedPlatform("");
    setJiraDomain("");
    setJiraEmail("");
    setJiraApiToken("");
    setConnectionTested(false);
    setConnectionSuccess(false);
    setHasSuccessfulConnection(false);
    setSelectedProjects(new Set());
    setAvailableProjects([]);
    setProjectIssues({});
    setProjectStatuses({});
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep === 1 && selectedPlatform) {
      setCurrentStep(2);
    } else if (currentStep === 2 && connectionSuccess) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      fetchIssuesAndStatuses();
    }
  };

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label>Select Integration Platform</Label>
        <p className="text-sm text-gray-500 mt-1">
          Choose the project management platform you want to connect to.
        </p>
      </div>

      <div className="grid gap-3">
        {INTEGRATION_PLATFORMS.map((platform) => (
          <div
            key={platform.id}
            className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedPlatform === platform.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            } ${!platform.available ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => {
              if (platform.available) {
                setSelectedPlatform(platform.id);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color} text-white`}
              >
                <platform.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{platform.name}</h3>
                <p className="text-sm text-gray-500">{platform.description}</p>
              </div>
              {selectedPlatform === platform.id && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
              {!platform.available && (
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="jira-domain">Jira Domain</Label>
        <Input
          id="jira-domain"
          value={jiraDomain}
          onChange={(e) => setJiraDomain(e.target.value)}
          placeholder="your-domain.atlassian.net"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="jira-email">Email Address</Label>
        <Input
          id="jira-email"
          type="email"
          value={jiraEmail}
          onChange={(e) => setJiraEmail(e.target.value)}
          placeholder="your-email@company.com"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="jira-api-token">API Token</Label>
        <Input
          id="jira-api-token"
          type="password"
          value={jiraApiToken}
          onChange={(e) => setJiraApiToken(e.target.value)}
          placeholder="Enter your Jira API token"
          className="mt-1"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          You can create an API token in your{" "}
          <a
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Atlassian account settings
          </a>
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={testConnection}
        disabled={
          isTestingConnection || !jiraDomain || !jiraEmail || !jiraApiToken
        }
        className="w-full"
      >
        {isTestingConnection ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing Connection...
          </>
        ) : (
          "Test Connection"
        )}
      </Button>

      {connectionTested && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md ${
            connectionSuccess
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {connectionSuccess ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="text-sm">
            {connectionSuccess
              ? "Connection successful!"
              : "Connection failed. Please check your credentials."}
          </span>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label>Select Projects to Import</Label>
        <p className="text-sm text-gray-500 mt-1">
          Choose which Jira projects you want to import into this workspace.
        </p>
      </div>

      <div>
        <Label htmlFor="space-select">Target Space</Label>
        <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a space" />
          </SelectTrigger>
          <SelectContent>
            {spaces.map((space) => (
              <SelectItem key={space.id} value={space.id}>
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-sm mr-2 ${
                      space.icon === "blue"
                        ? "bg-blue-500"
                        : space.icon === "green"
                        ? "bg-green-500"
                        : space.icon === "red"
                        ? "bg-red-500"
                        : space.icon === "purple"
                        ? "bg-purple-500"
                        : space.icon === "yellow"
                        ? "bg-yellow-500"
                        : space.icon === "pink"
                        ? "bg-pink-500"
                        : "bg-blue-500"
                    }`}
                  />
                  {space.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoadingProjects ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading projects...</span>
        </div>
      ) : (
        <ScrollArea className="h-48 border rounded-md p-2">
          <div className="space-y-2">
            {availableProjects.map((project) => (
              <div key={project.key} className="flex items-center space-x-3">
                <Checkbox
                  id={`project-${project.key}`}
                  checked={selectedProjects.has(project.key)}
                  onCheckedChange={() => toggleProjectSelection(project.key)}
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`project-${project.key}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {project.name} ({project.key})
                  </Label>
                  {project.description && (
                    <p className="text-xs text-gray-500 truncate">
                      {project.description}
                    </p>
                  )}
                </div>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <Label>Review Data for Import</Label>
        <p className="text-sm text-gray-500 mt-1">
          Review the issues and statuses that will be imported from the selected
          projects.
        </p>
      </div>

      {Array.from(selectedProjects).map((projectKey) => {
        const issues = projectIssues[projectKey] || [];
        const statuses = projectStatuses[projectKey] || [];
        const project = availableProjects.find((p) => p.key === projectKey);

        return (
          <div key={projectKey} className="border rounded-md p-3">
            <h4 className="font-medium mb-2">
              {project?.name} ({projectKey})
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Statuses ({statuses.length})
                </h5>
                <div className="space-y-1">
                  {statuses.slice(0, 5).map((status) => (
                    <div key={status.id} className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status.statusCategory.colorName === "green"
                            ? "bg-green-500"
                            : status.statusCategory.colorName === "yellow"
                            ? "bg-yellow-500"
                            : status.statusCategory.colorName === "red"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className="text-xs">{status.name}</span>
                    </div>
                  ))}
                  {statuses.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{statuses.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Issues ({issues.length})
                </h5>
                <div className="space-y-1">
                  {issues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="text-xs">
                      <div className="font-medium">{issue.key}</div>
                      <div className="text-gray-500 truncate">
                        {issue.summary}
                      </div>
                    </div>
                  ))}
                  {issues.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{issues.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {existingIntegration ? "Update Integration" : "Connect Integration"}
          </DialogTitle>
          <DialogDescription>
            {existingIntegration
              ? "Update your integration settings and project connections."
              : "Connect your workspace to an external project management platform."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div
            className={`flex items-center ${
              currentStep >= 1 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              1
            </div>
            <span className="ml-2 text-sm">Platform</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div
            className={`flex items-center ${
              currentStep >= 2 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              2
            </div>
            <span className="ml-2 text-sm">Credentials</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div
            className={`flex items-center ${
              currentStep >= 3 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              3
            </div>
            <span className="ml-2 text-sm">Projects</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div
            className={`flex items-center ${
              currentStep >= 4 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 4 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              4
            </div>
            <span className="ml-2 text-sm">Import</span>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {renderCurrentStep()}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={clearForm}
            disabled={isLoading || isImporting}
          >
            Clear Form
          </Button>

          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isLoading || isImporting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}

          {currentStep < 4 && (
            <Button
              type="button"
              variant="outline"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !selectedPlatform) ||
                (currentStep === 2 && !connectionSuccess) ||
                (currentStep === 3 && selectedProjects.size === 0) ||
                isLoading ||
                isImporting ||
                isLoadingIssues
              }
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {currentStep === 4 && (
            <Button
              type="button"
              onClick={importData}
              disabled={isImporting || selectedProjects.size === 0}
              variant="workspace"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Data"
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
