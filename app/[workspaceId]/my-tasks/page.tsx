"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import {
  Filter,
  Calendar,
  User,
  CheckSquare,
  Plus,
  Loader2,
  Goal,
  CircleUser,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  getAvatarInitials,
  getPriorityColor,
  getStatusTypeBgColor,
  getStatusTypeColor,
  getStatusTypeText,
  getStatusTypeTextColor,
} from "@/lib/utils";
import {
  formatDateRange,
  stripFormatting,
} from "@/components/workspace/views/project/utils";
import { tagColorClasses } from "@/components/workspace/views/task-detail-view/utils";
import type {
  Task,
  Workspace,
  Status,
  Tag as TagType,
} from "@/lib/database.types";
import MyTasksLoading from "./loading";

interface MyTasksPageProps {}

interface TaskWithDetails extends Omit<Task, "status"> {
  space: { name: string; space_id: string };
  project?: { name: string; project_id: string };
  sprint?: { name: string; sprint_id: string };
  status?: {
    name: string;
    status_type_id: string | null;
    status_type?: { name: string };
  };
}

interface FilterState {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  createdBy: string[];
  tags: string[];
  dueDate: { from?: Date; to?: Date };
  createdDate: { from?: Date; to?: Date };
}

interface SortState {
  field:
    | "name"
    | "priority"
    | "due_date"
    | "created_at"
    | "status"
    | "assignee";
  direction: "asc" | "desc";
}

const priorityConfig = {
  low: { label: "Low", color: "text-green-500" },
  medium: { label: "Medium", color: "text-blue-500" },
  high: { label: "High", color: "text-yellow-500" },
  critical: { label: "Critical", color: "text-red-500" },
};

export default function MyTasksPage({}: MyTasksPageProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();
  const { toast } = useEnhancedToast();
  const router = useRouter();

  // State
  const [assignedTasks, setAssignedTasks] = useState<TaskWithDetails[]>([]);
  const [createdTasks, setCreatedTasks] = useState<TaskWithDetails[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState("assigned");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    priority: [],
    assignee: [],
    createdBy: [],
    tags: [],
    dueDate: {},
    createdDate: {},
  });

  const [sort, setSort] = useState<SortState>({
    field: "due_date",
    direction: "asc",
  });

  // Filter and sort tasks
  const filteredAndSortedAssignedTasks = useMemo(() => {
    let filtered = assignedTasks;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(searchLower) ||
          (task.description &&
            stripFormatting(task.description)
              .toLowerCase()
              .includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(
        (task) =>
          task.status?.status_type?.name &&
          filters.status.includes(task.status.status_type.name)
      );
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(
        (task) => task.priority && filters.priority.includes(task.priority)
      );
    }

    // Apply assignee filter
    if (filters.assignee.length > 0) {
      filtered = filtered.filter(
        (task) =>
          task.assignee_id && filters.assignee.includes(task.assignee_id)
      );
    }

    // Apply created by filter
    if (filters.createdBy.length > 0) {
      filtered = filtered.filter(
        (task) => task.created_by && filters.createdBy.includes(task.created_by)
      );
    }

    // Apply due date filter
    if (filters.dueDate.from || filters.dueDate.to) {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        if (filters.dueDate.from && taskDate < filters.dueDate.from)
          return false;
        if (filters.dueDate.to && taskDate > filters.dueDate.to) return false;
        return true;
      });
    }

    // Apply created date filter
    if (filters.createdDate.from || filters.createdDate.to) {
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.created_at);
        if (filters.createdDate.from && taskDate < filters.createdDate.from)
          return false;
        if (filters.createdDate.to && taskDate > filters.createdDate.to)
          return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "priority":
          aValue = a.priority || "";
          bValue = b.priority || "";
          break;
        case "due_date":
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "status":
          aValue = a.status?.name || "";
          bValue = b.status?.name || "";
          break;
        case "assignee":
          aValue = a.assignee?.full_name || "";
          bValue = b.assignee?.full_name || "";
          break;
        default:
          return 0;
      }

      if (sort.direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Debug logging
    console.log("Filtered assigned tasks:", {
      original: assignedTasks.length,
      filtered: filtered.length,
      filters: filters,
      sort: sort,
    });

    return filtered;
  }, [assignedTasks, filters, sort]);

  const filteredAndSortedCreatedTasks = useMemo(() => {
    let filtered = createdTasks;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(searchLower) ||
          (task.description &&
            stripFormatting(task.description)
              .toLowerCase()
              .includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(
        (task) =>
          task.status?.status_type?.name &&
          filters.status.includes(task.status.status_type.name)
      );
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(
        (task) => task.priority && filters.priority.includes(task.priority)
      );
    }

    // Apply assignee filter
    if (filters.assignee.length > 0) {
      filtered = filtered.filter(
        (task) =>
          task.assignee_id && filters.assignee.includes(task.assignee_id)
      );
    }

    // Apply created by filter
    if (filters.createdBy.length > 0) {
      filtered = filtered.filter(
        (task) => task.created_by && filters.createdBy.includes(task.created_by)
      );
    }

    // Apply due date filter
    if (filters.dueDate.from || filters.dueDate.to) {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        if (filters.dueDate.from && taskDate < filters.dueDate.from)
          return false;
        if (filters.dueDate.to && taskDate > filters.dueDate.to) return false;
        return true;
      });
    }

    // Apply created date filter
    if (filters.createdDate.from || filters.createdDate.to) {
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.created_at);
        if (filters.createdDate.from && taskDate < filters.createdDate.from)
          return false;
        if (filters.createdDate.to && taskDate > filters.createdDate.to)
          return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "priority":
          aValue = a.priority || "";
          bValue = b.priority || "";
          break;
        case "due_date":
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "status":
          aValue = a.status?.name || "";
          bValue = b.status?.name || "";
          break;
        case "assignee":
          aValue = a.assignee?.full_name || "";
          bValue = b.assignee?.full_name || "";
          break;
        default:
          return 0;
      }

      if (sort.direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [createdTasks, filters, sort]);

  // Load data
  useEffect(() => {
    if (user && workspaceId) {
      loadData();
    }
  }, [user, workspaceId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load workspace
      const { data: workspaceData } = await supabase
        .from("workspaces")
        .select("*")
        .eq("workspace_id", workspaceId)
        .single();

      if (workspaceData) {
        setWorkspace(workspaceData);
      }

      // Load statuses
      const { data: statusesData } = await supabase
        .from("statuses")
        .select("*")
        .eq("workspace_id", workspaceData?.id)
        .order("position", { ascending: true });

      setStatuses(statusesData || []);

      // Load tags
      const { data: tagsData } = await supabase
        .from("tags")
        .select("*")
        .eq("workspace_id", workspaceData?.id)
        .order("name", { ascending: true });

      setTags(tagsData || []);

      // Load workspace members
      const { data: membersData } = await supabase
        .from("workspace_members")
        .select("id, user_id, email, role")
        .eq("workspace_id", workspaceData?.id)
        .eq("status", "active");

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", userIds);

        const formattedMembers = membersData.map((member) => {
          const profile = profilesData?.find((p) => p.id === member.user_id);
          return {
            id: member.user_id,
            full_name: profile?.full_name || "Unknown User",
            email: profile?.email || member.email || "",
            avatar_url: profile?.avatar_url || null,
          };
        });

        setWorkspaceMembers(formattedMembers);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load workspace data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load tasks when workspace and user are available
  useEffect(() => {
    if (workspace && user?.id) {
      loadTasks();
    }
  }, [workspace, user?.id]);

  const loadTasks = async () => {
    if (!workspace || !user?.id) {
      return;
    }

    try {
      setLoadingTasks(true);

      // Load assigned tasks with proper joins
      const { data: assignedTasksData, error: assignedError } = await supabase
        .from("tasks")
        .select(
          `
          id,
          task_id,
          name,
          description,
          status_id,
          priority,
          assignee_id,
          project_id,
          sprint_id,
          space_id,
          workspace_id,
          start_date,
          due_date,
          parent_task_id,
          created_at,
          updated_at,
          created_by,
          embedding,
          status:statuses(name, status_type_id, status_type:status_types(name)),
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
          space:spaces(name, space_id),
          project:projects(name, project_id),
          sprint:sprints!tasks_sprint_id_fkey(name, sprint_id)
        `
        )
        .eq("workspace_id", workspace.id)
        .eq("assignee_id", user.id)
        .order("created_at", { ascending: false });

      // Load created tasks with proper joins
      const { data: createdTasksData, error: createdError } = await supabase
        .from("tasks")
        .select(
          `
          id,
          task_id,
          name,
          description,
          status_id,
          priority,
          assignee_id,
          project_id,
          sprint_id,
          space_id,
          workspace_id,
          start_date,
          due_date,
          parent_task_id,
          created_at,
          updated_at,
          created_by,
          embedding,
          status:statuses(name, status_type_id, status_type:status_types(name)),
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
          space:spaces(name, space_id),
          project:projects(name, project_id),
          sprint:sprints!tasks_sprint_id_fkey(name, sprint_id)
        `
        )
        .eq("workspace_id", workspace.id)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Transform the data to match TaskWithDetails interface
      const transformTask = (task: any): TaskWithDetails => ({
        ...task,
        space: task.space || { name: "Unknown Space", space_id: task.space_id },
        project: task.project || undefined,
        sprint: task.sprint || undefined,
        task_tags: [], // We'll load tags separately if needed
      });

      const transformedAssigned = (assignedTasksData || []).map(transformTask);
      const transformedCreated = (createdTasksData || []).map(transformTask);

      setAssignedTasks(transformedAssigned);
      setCreatedTasks(transformedCreated);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoadingTasks(false);
    }
  };

  if (loading) {
    return <MyTasksLoading />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b workspace-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="workspace-component-bg w-8 h-8 flex items-center justify-center rounded-md">
              <CheckSquare className="h-4 w-4 workspace-component-active-color" />
            </div>
            <div>
              <h1 className="text-sm workspace-sidebar-text">My Tasks</h1>
              <p className="text-xs workspace-text-muted">
                Manage tasks assigned to you and tasks you've created
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator for tasks */}
      <div>
        {loadingTasks && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading tasks...</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="py-2 px-3 flex items-center justify-between border-b workspace-border">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1">
              <TabsTrigger
                value="assigned"
                className="flex items-center gap-2 mr-1 text-xs hover:workspace-component-bg data-[state=active]:workspace-component-bg data-[state=active]:workspace-component-active-color rounded-lg"
              >
                <User className="h-4 w-4" />
                <span>Assigned to Me ({assignedTasks.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="created"
                className="flex items-center gap-2 text-xs hover:workspace-component-bg data-[state=active]:workspace-component-bg data-[state=active]:workspace-component-active-color rounded-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Created by Me ({createdTasks.length})</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs p-2 h-7 ${
                      Object.values(filters).some((filter) =>
                        Array.isArray(filter)
                          ? filter.length > 0
                          : typeof filter === "string"
                          ? filter !== ""
                          : typeof filter === "object"
                          ? Object.keys(filter).length > 0
                          : false
                      )
                        ? "border-workspace-primary text-workspace-primary"
                        : ""
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {Object.values(filters).some((filter) =>
                      Array.isArray(filter)
                        ? filter.length > 0
                        : typeof filter === "string"
                        ? filter !== ""
                        : typeof filter === "object"
                        ? Object.keys(filter).length > 0
                        : false
                    ) && (
                      <div className="ml-2 w-2 h-2 workspace-primary-light rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filters</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFilters({
                            search: "",
                            status: [],
                            priority: [],
                            assignee: [],
                            createdBy: [],
                            tags: [],
                            dueDate: {},
                            createdDate: {},
                          })
                        }
                      >
                        Clear all
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {/* Search */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">
                          Search
                        </label>
                        <Input
                          placeholder="Search tasks..."
                          value={filters.search}
                          onChange={(e) =>
                            setFilters({ ...filters, search: e.target.value })
                          }
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">
                          Status
                        </label>
                        <Select
                          value={filters.status[0] || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              status: value === "all" ? [] : [value],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="not-started">
                              Not Started
                            </SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">
                          Priority
                        </label>
                        <Select
                          value={filters.priority[0] || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              priority: value === "all" ? [] : [value],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All priorities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {Object.entries(priorityConfig).map(
                              ([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">
                          Sort by
                        </label>
                        <Select
                          value={`${sort.field}-${sort.direction}`}
                          onValueChange={(value) => {
                            const [field, direction] = value.split("-");
                            setSort({
                              field: field as any,
                              direction: direction as any,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="due_date-asc">
                              Due Date (Earliest)
                            </SelectItem>
                            <SelectItem value="due_date-desc">
                              Due Date (Latest)
                            </SelectItem>
                            <SelectItem value="priority-asc">
                              Priority (Low to High)
                            </SelectItem>
                            <SelectItem value="priority-desc">
                              Priority (High to Low)
                            </SelectItem>
                            <SelectItem value="created_at-desc">
                              Created (Newest)
                            </SelectItem>
                            <SelectItem value="created_at-asc">
                              Created (Oldest)
                            </SelectItem>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name-desc">
                              Name (Z-A)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "list" ? "board" : "list")
                }
                className="text-xs p-2 h-7"
              >
                {viewMode === "list" ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
                {viewMode === "list" ? "Board" : "List"}
              </Button>
            </div>
          </div>
          <TabsContent value="assigned" className="flex-1 p-3">
            {viewMode === "list" ? (
              <div className="space-y-4">
                {filteredAndSortedAssignedTasks.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {assignedTasks.length === 0
                            ? "No assigned tasks"
                            : "No tasks match your filters"}
                        </h3>
                        <p className="text-gray-500">
                          {assignedTasks.length === 0
                            ? "You don't have any tasks assigned to you yet."
                            : "Try adjusting your search or filter criteria."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 mb-2">
                      Showing {filteredAndSortedAssignedTasks.length} of{" "}
                      {assignedTasks.length} assigned tasks
                    </div>
                    {filteredAndSortedAssignedTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="hover:shadow-md transition-shadow cursor-pointer workspace-secondary-sidebar-bg"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-grow">
                              <div className="flex-shrink-0">
                                <CheckSquare className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm truncate">
                                  {task.name}
                                </h4>
                                {task.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {stripFormatting(task.description)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {task.status && (
                                <Badge
                                  className={`text-xs ${getStatusTypeTextColor(
                                    task.status.status_type?.name ?? ""
                                  )} ${getStatusTypeBgColor(
                                    task.status.status_type?.name ?? ""
                                  )}`}
                                >
                                  {getStatusTypeText(
                                    task.status.status_type?.name ?? ""
                                  )}
                                </Badge>
                              )}
                              {task.priority ? (
                                <div
                                  className={`px-2 py-1 text-xs flex items-center gap-1 rounded-full ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  <Goal
                                    className={`w-4 h-4 ${
                                      priorityConfig[
                                        task.priority as keyof typeof priorityConfig
                                      ]?.color
                                    }`}
                                  />
                                  {priorityConfig[
                                    task.priority as keyof typeof priorityConfig
                                  ]?.label || task.priority}
                                </div>
                              ) : (
                                <div
                                  className={`px-2 py-1 text-xs flex items-center gap-1 rounded-full bg-gray-500/10`}
                                >
                                  <Goal className={`w-4 h-4 `} />
                                  No priority
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {task.assignee && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Avatar className="h-5 w-5 mr-1">
                                    <AvatarImage
                                      src={
                                        task.assignee.avatar_url ?? undefined
                                      }
                                      alt={task.assignee.full_name ?? undefined}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {getAvatarInitials(
                                        task.assignee.full_name,
                                        task.assignee.email
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="hidden sm:inline">
                                    {task.assignee.full_name}
                                  </span>
                                </div>
                              )}
                              {task.due_date && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {new Date(
                                      task.due_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <BoardView tasks={filteredAndSortedAssignedTasks} />
            )}
          </TabsContent>

          <TabsContent value="created" className="flex-1 p-3">
            {viewMode === "list" ? (
              <div className="space-y-4">
                {filteredAndSortedCreatedTasks.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {createdTasks.length === 0
                            ? "No created tasks"
                            : "No tasks match your filters"}
                        </h3>
                        <p className="text-gray-500">
                          {createdTasks.length === 0
                            ? "You haven't created any tasks yet."
                            : "Try adjusting your search or filter criteria."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 mb-2">
                      Showing {filteredAndSortedCreatedTasks.length} of{" "}
                      {createdTasks.length} created tasks
                    </div>
                    {filteredAndSortedCreatedTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="hover:shadow-md transition-shadow cursor-pointer workspace-secondary-sidebar-bg"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-grow">
                              <div className="flex-shrink-0">
                                <CheckSquare className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm truncate">
                                  {task.name}
                                </h4>
                                {task.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {stripFormatting(task.description)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {task.status && (
                                <Badge
                                  className={`text-xs ${getStatusTypeTextColor(
                                    task.status.status_type?.name ?? ""
                                  )} ${getStatusTypeBgColor(
                                    task.status.status_type?.name ?? ""
                                  )}`}
                                >
                                  {getStatusTypeText(
                                    task.status.status_type?.name ?? ""
                                  )}
                                </Badge>
                              )}
                              {task.priority ? (
                                <div
                                  className={`px-2 py-1 text-xs flex items-center gap-1 rounded-full ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  <Goal
                                    className={`w-4 h-4 ${
                                      priorityConfig[
                                        task.priority as keyof typeof priorityConfig
                                      ]?.color
                                    }`}
                                  />
                                  {priorityConfig[
                                    task.priority as keyof typeof priorityConfig
                                  ]?.label || task.priority}
                                </div>
                              ) : (
                                <div
                                  className={`px-2 py-1 text-xs flex items-center gap-1 rounded-full bg-gray-500/10`}
                                >
                                  <Goal className={`w-4 h-4 `} />
                                  No priority
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {task.assignee && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Avatar className="h-5 w-5 mr-1">
                                    <AvatarImage
                                      src={
                                        task.assignee.avatar_url ?? undefined
                                      }
                                      alt={task.assignee.full_name ?? undefined}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {getAvatarInitials(
                                        task.assignee.full_name,
                                        task.assignee.email
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="hidden sm:inline">
                                    {task.assignee.full_name}
                                  </span>
                                </div>
                              )}
                              {task.due_date && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {new Date(
                                      task.due_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <BoardView tasks={filteredAndSortedCreatedTasks} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Board View Component
function BoardView({ tasks }: { tasks: TaskWithDetails[] }) {
  // Define the 4 main status types in the correct order
  const mainStatusTypes = ["not-started", "active", "done", "closed"];

  // Group tasks by status type name
  const statusGroups = tasks.reduce((groups, task) => {
    const statusTypeName = task.status?.status_type?.name || "not-started";

    // Debug: Log each task's status info
    console.log("Task grouping:", {
      taskName: task.name,
      statusName: task.status?.name,
      statusTypeName: statusTypeName,
    });

    if (!groups[statusTypeName]) {
      groups[statusTypeName] = [];
    }
    groups[statusTypeName].push(task);
    return groups;
  }, {} as Record<string, TaskWithDetails[]>);
  console.log(mainStatusTypes);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {mainStatusTypes.map((statusType) => {
        const statusTasks = statusGroups[statusType] || [];
        return (
          <div
            key={statusType}
            className={`space-y-2 ${getStatusTypeBgColor(
              statusType
            )} p-2 rounded-md`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: getStatusTypeColor(statusType),
                  }}
                />
                <h3 className="font-medium text-sm capitalize">
                  {statusType.replace("-", " ")}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {statusTasks.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {statusTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-3 hover:shadow-sm transition-shadow cursor-pointer border-l-3 workspace-secondary-sidebar-bg"
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckSquare className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">
                        {task.name}
                      </h4>

                      {task.description && (
                        <p className="text-xs workspace-sidebar-text mb-3 line-clamp-2">
                          {stripFormatting(task.description)}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {task.priority ? (
                            <div className="h-6 w-6 p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm">
                              <Goal
                                className={`w-4 h-4 ${
                                  priorityConfig[
                                    task.priority as keyof typeof priorityConfig
                                  ]?.color
                                }`}
                              />
                            </div>
                          ) : (
                            <div className="h-6 w-6 p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm">
                              <Goal className="w-4 h-4 " />
                            </div>
                          )}

                          {task.task_tags && task.task_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {task.task_tags.map((taskTag: any) => (
                                <span
                                  key={taskTag.tag.id}
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    tagColorClasses[taskTag.tag.color]
                                  } group relative`}
                                >
                                  {taskTag.tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {task.due_date ? (
                            <div className="flex items-center h-6 p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center h-6 w-6 p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm">
                              <Calendar className="h-4 w-4 " />
                            </div>
                          )}
                        </div>
                        {task.assignee ? (
                          <div className="flex items-center text-xs text-gray-500">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={task.assignee.avatar_url ?? undefined}
                                alt={task.assignee.full_name ?? undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {getAvatarInitials(
                                  task.assignee.full_name,
                                  task.assignee.email
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          <div className="flex items-center h-6 w-6 p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm">
                            <CircleUser className="h-4 w-4 " />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
