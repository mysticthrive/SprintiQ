export interface JiraCredentials {
  domain: string;
  email: string;
  apiToken: string;
}

export interface JiraProject {
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

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
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
  };
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    key: string;
    colorName: string;
  };
}

class JiraAPI {
  private credentials: JiraCredentials;

  constructor(credentials: JiraCredentials) {
    this.credentials = credentials;
  }

  private getAuthHeader(): string {
    const auth = Buffer.from(
      `${this.credentials.email}:${this.credentials.apiToken}`
    ).toString("base64");
    return `Basic ${auth}`;
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `https://${this.credentials.domain}/rest/api/3${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Jira API error response:", errorText);
        throw new Error(
          `Jira API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Jira API request failed:", error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest("/myself");
      return true;
    } catch (error: any) {
      console.error("Jira connection test failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        credentials: {
          domain: this.credentials.domain,
          email: this.credentials.email,
          hasToken: !!this.credentials.apiToken,
        },
      });
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.makeRequest("/myself");
      return response;
    } catch (error: any) {
      console.error("Failed to get current user:", error);
      throw error;
    }
  }

  async getProjects(): Promise<JiraProject[]> {
    try {
      const response = await this.makeRequest("/project");

      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      }

      if (response && Array.isArray(response.values)) {
        return response.values;
      }

      if (response && response.projects && Array.isArray(response.projects)) {
        return response.projects;
      }

      console.error("Unexpected Jira projects response format:", response);
      return [];
    } catch (error) {
      console.error("Failed to fetch Jira projects:", error);
      throw error;
    }
  }

  async getProjectIssues(
    projectKey: string,
    maxResults: number = 100
  ): Promise<JiraIssue[]> {
    try {
      const jql = `project = ${projectKey} ORDER BY created DESC`;
      const response = await this.makeRequest(
        `/search?jql=${encodeURIComponent(
          jql
        )}&maxResults=${maxResults}&expand=names,schema`
      );
      return response.issues || [];
    } catch (error) {
      console.error(`Failed to fetch issues for project ${projectKey}:`, error);
      throw error;
    }
  }

  async getIssue(issueIdOrKey: string): Promise<JiraIssue> {
    try {
      const response = await this.makeRequest(`/issue/${issueIdOrKey}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch issue ${issueIdOrKey}:`, error);
      throw error;
    }
  }

  async getIssueByKey(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.makeRequest(`/issue/${issueKey}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch issue by key ${issueKey}:`, error);
      throw error;
    }
  }

  async getProjectStatuses(projectKey: string): Promise<JiraStatus[]> {
    try {
      const response = await this.makeRequest(
        `/project/${projectKey}/statuses`
      );
      const statuses: JiraStatus[] = [];

      // Flatten all statuses from different issue types
      response.forEach((issueType: any) => {
        if (issueType.statuses) {
          statuses.push(...issueType.statuses);
        }
      });

      // Remove duplicates based on status ID
      const uniqueStatuses = statuses.filter(
        (status, index, self) =>
          index === self.findIndex((s) => s.id === status.id)
      );

      return uniqueStatuses;
    } catch (error) {
      console.error(
        `Failed to fetch statuses for project ${projectKey}:`,
        error
      );
      throw error;
    }
  }

  async getProjectIssueTypes(projectKey: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/project/${projectKey}`);
      return response.issueTypes || [];
    } catch (error) {
      console.error(
        `Failed to fetch issue types for project ${projectKey}:`,
        error
      );
      throw error;
    }
  }

  async getPriorities(): Promise<any[]> {
    try {
      const response = await this.makeRequest("/priority");
      return response || [];
    } catch (error) {
      console.error("Failed to fetch priorities:", error);
      throw error;
    }
  }

  async createProject(projectData: {
    key: string;
    name: string;
    description?: string;
    projectTypeKey?: string;
    leadAccountId?: string;
  }): Promise<JiraProject> {
    try {
      const payload = {
        key: projectData.key,
        name: projectData.name,
        description: projectData.description || "",
        projectTypeKey: projectData.projectTypeKey || "software",
        leadAccountId: projectData.leadAccountId,
      };

      const response = await this.makeRequest("/project", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response;
    } catch (error) {
      console.error("Failed to create Jira project:", error);
      throw error;
    }
  }

  async createIssue(
    projectKey: string,
    issueData: {
      summary: string;
      description?: string;
      issueType: string;
      priority?: string;
      assignee?: string;
    }
  ): Promise<JiraIssue> {
    try {
      const payload = {
        fields: {
          project: {
            key: projectKey,
          },
          summary: issueData.summary,
          description: issueData.description
            ? {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: issueData.description,
                      },
                    ],
                  },
                ],
              }
            : undefined,
          issuetype: {
            name: issueData.issueType,
          },
          priority: issueData.priority
            ? {
                name: issueData.priority,
              }
            : undefined,
          assignee: issueData.assignee
            ? {
                name: issueData.assignee,
              }
            : undefined,
        },
      };

      const response = await this.makeRequest("/issue", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response;
    } catch (error) {
      console.error("Failed to create Jira issue:", error);
      throw error;
    }
  }

  async updateIssue(
    issueKey: string,
    updates: {
      summary?: string;
      description?: string;
      priority?: string;
      assignee?: string;
      status?: string;
    }
  ): Promise<void> {
    try {
      const payload = {
        fields: {
          summary: updates.summary,
          description: updates.description
            ? {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: updates.description,
                      },
                    ],
                  },
                ],
              }
            : undefined,
          priority: updates.priority
            ? {
                name: updates.priority,
              }
            : undefined,
          assignee: updates.assignee
            ? {
                name: updates.assignee,
              }
            : undefined,
        },
      };

      await this.makeRequest(`/issue/${issueKey}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Update status if provided
      if (updates.status) {
        await this.makeRequest(`/issue/${issueKey}/transitions`, {
          method: "POST",
          body: JSON.stringify({
            transition: {
              id: updates.status,
            },
          }),
        });
      }
    } catch (error) {
      console.error(`Failed to update Jira issue ${issueKey}:`, error);
      throw error;
    }
  }

  async getIssueTransitions(issueKey: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/issue/${issueKey}/transitions`);
      return response.transitions || [];
    } catch (error) {
      console.error(
        `Failed to fetch transitions for issue ${issueKey}:`,
        error
      );
      throw error;
    }
  }
}

export default JiraAPI;
