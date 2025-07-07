"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  Settings,
  LogOut,
  Monitor,
  Sun,
  Moon,
  Check,
  ChevronDown,
  UserPlus,
  Building,
  Loader2,
  PaintRoller,
  Hash,
  CheckSquare,
  Folder,
  Goal,
  Snail,
  Users,
  Building2,
  Bell,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/provider/theme-provider";
import type { Theme } from "@/components/provider/theme-provider";
import type { Workspace } from "@/lib/database.types";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getUnreadEventsCount } from "@/lib/events";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import AIAssistantSidebar from "../ai/ai-assistant-sidebar";
import SwitchWorkspaceModal from "../modals/switch-workspace-modal";
import CreateWorkspaceModal from "../modals/create-workspace-modal";
import { getStatusColor } from "@/lib/utils";
import { colorThemes } from "@/types";

// Types
interface WorkspaceHeaderProps {
  workspace: Workspace;
  user: SupabaseUser;
}

interface SearchResult {
  id: string;
  type: "task" | "project" | "space";
  title: string;
  subtitle?: string;
  status?: string;
  color?: string;
  priority?: string;
  url: string;
  icon: React.ReactNode;
}

interface ThemeToggleButtonProps {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
}

interface ThemeSettingsButtonProps {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  colorTheme: string;
  handleColorChange: (color: string) => void;
}

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearchOpen: boolean;
  isSearching: boolean;
  onSearchSelect: (result: SearchResult) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

interface HeaderActionsProps {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  colorTheme: string;
  handleColorChange: (color: string) => void;
  onAIAssistantOpen: () => void;
  workspaceId: string;
  router: ReturnType<typeof useRouter>;
}

interface WorkspaceDropdownProps {
  workspace: Workspace;
  workspaceId: string;
  router: ReturnType<typeof useRouter>;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onCreateModalOpen: () => void;
  onSwitchWorkspaceModalOpen: () => void;
}

// Constants
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULTS_LIMITS = {
  tasks: 10,
  projects: 5,
  spaces: 3,
} as const;

const PRIORITY_COLORS = {
  high: "text-red-600",
  medium: "text-yellow-600",
  low: "text-green-600",
  default: "text-gray-600",
} as const;

// Utility functions
const getPriorityColor = (priority: string): string => {
  return (
    PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] ||
    PRIORITY_COLORS.default
  );
};

const applyColorTheme = (colorValue: string): void => {
  const root = document.documentElement;
  colorThemes.forEach((theme) => {
    root.classList.remove(`theme-${theme.value}`);
  });
  root.classList.add(`theme-${colorValue}`);
};

// Components
const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  theme,
  setTheme,
}) => {
  const handleToggle = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme, setTheme]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
};

const ThemeSettingsButton: React.FC<ThemeSettingsButtonProps> = ({
  theme,
  setTheme,
  colorTheme,
  handleColorChange,
}) => {
  const currentColorTheme = useMemo(
    () => colorThemes.find((t) => t.value === colorTheme),
    [colorTheme]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" title="Theme Settings">
          <PaintRoller className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer hover:workspace-hover">
            <Monitor className="mr-2 h-4 w-4" />
            <span>Mode</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {[
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "Auto" },
            ].map(({ value, icon: Icon, label }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setTheme(value as Theme)}
                className="cursor-pointer hover:workspace-hover group"
              >
                <Icon className="mr-2 h-4 w-4 group-hover:scale-110 transition-all" />
                <span>{label}</span>
                {theme === value && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer hover:workspace-hover">
            <div
              className={`mr-2 h-4 w-4 rounded-full ${currentColorTheme?.color}`}
            />
            <span>Color</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {colorThemes.map((themeOption) => (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => handleColorChange(themeOption.value)}
                className="cursor-pointer hover:workspace-hover group"
              >
                <div
                  className={`mr-2 h-4 w-4 rounded-full ${themeOption.color} group-hover:scale-110 transition-all`}
                />
                <span>{themeOption.name}</span>
                {colorTheme === themeOption.value && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearchOpen,
  isSearching,
  onSearchSelect,
  searchInputRef,
}) => {
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      if (searchQuery.trim()) {
        // This will be handled by parent component
      }
    },
    [searchQuery]
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      // This will be handled by parent component
    }, 200);
  }, []);

  const renderSearchResults = useCallback(() => {
    if (searchResults.length === 0 && !isSearching && searchQuery.trim()) {
      return <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>;
    }

    if (searchResults.length === 0) return null;

    const groupedResults = {
      tasks: searchResults.filter((r) => r.type === "task"),
      projects: searchResults.filter((r) => r.type === "project"),
      spaces: searchResults.filter((r) => r.type === "space"),
    };

    return (
      <>
        {groupedResults.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {groupedResults.tasks.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => onSearchSelect(result)}
                className="flex items-center justify-between p-3 cursor-pointer hover:workspace-hover"
              >
                <div className="flex items-center space-x-3 flex-1 truncate">
                  <div className="text-blue-500">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {result.priority && (
                    <span
                      className={`text-xs font-medium ${getPriorityColor(
                        result.priority
                      )}`}
                    >
                      <Goal className="h-3 w-3 inline mr-1" />
                    </span>
                  )}
                  {result.status && (
                    <span className="flex items-center gap-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded w-[72px]">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          result.color || "gray"
                        )}`}
                      />
                      <span className="truncate flex-1">{result.status}</span>
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groupedResults.projects.length > 0 && (
          <CommandGroup heading="Projects">
            {groupedResults.projects.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => onSearchSelect(result)}
                className="flex items-center space-x-3 p-3 cursor-pointer hover:workspace-hover"
              >
                <div className="text-green-500">{result.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groupedResults.spaces.length > 0 && (
          <CommandGroup heading="Spaces">
            {groupedResults.spaces.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => onSearchSelect(result)}
                className="flex items-center space-x-3 p-3 cursor-pointer hover:workspace-hover"
              >
                <div className="text-purple-500">{result.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </>
    );
  }, [searchResults, isSearching, searchQuery, onSearchSelect]);

  return (
    <div className="flex-1 max-w-lg relative">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors z-10" />
        <Input
          ref={searchInputRef}
          placeholder="Search everything... (Press '/' to focus)"
          className="pl-10 pr-16 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 transition-colors"
          variant="workspace"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {isSearching && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400">
            <Loader2 className="animate-spin h-4 w-4" />
          </div>
        )}
        <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-600 dark:text-gray-400 opacity-100 group-hover:opacity-100">
          /
        </kbd>
      </div>

      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 workspace-header-bg border workspace-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <Command className="workspace-header-bg border workspace-border">
            <CommandList>{renderSearchResults()}</CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

const HeaderActions: React.FC<HeaderActionsProps> = ({
  theme,
  setTheme,
  colorTheme,
  handleColorChange,
  onAIAssistantOpen,
  workspaceId,
  router,
}) => {
  const handleSettingsNavigation = useCallback(
    (path: string) => {
      router.push(`/${workspaceId}${path}`);
    },
    [router, workspaceId]
  );

  return (
    <div className="flex items-center space-x-1">
      <ThemeToggleButton theme={theme} setTheme={setTheme} />
      <ThemeSettingsButton
        theme={theme}
        setTheme={setTheme}
        colorTheme={colorTheme}
        handleColorChange={handleColorChange}
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={onAIAssistantOpen}
        title="AI Assistant"
      >
        <Snail className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Header Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuItem
            className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
            onClick={() => handleSettingsNavigation("/settings/users")}
          >
            <Users className="mr-1 h-4 w-4" />
            Users
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
            onClick={() => handleSettingsNavigation("/settings/spaces")}
          >
            <Globe className="mr-1 h-4 w-4" />
            Spaces
          </DropdownMenuItem>
          <DropdownMenuSeparator className="workspace-border my-2" />
          <DropdownMenuItem
            className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
            onClick={() => handleSettingsNavigation("/settings/notifications")}
          >
            <Bell className="mr-1 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
            onClick={() => handleSettingsNavigation("/settings/workspaces")}
          >
            <Building2 className="mr-1 h-4 w-4" />
            Workspaces
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  workspace,
  workspaceId,
  router,
  isDropdownOpen,
  setIsDropdownOpen,
  onCreateModalOpen,
  onSwitchWorkspaceModalOpen,
}) => {
  const handleSettingsClick = useCallback(() => {
    router.push(`/${workspaceId}/settings/workspaces`);
  }, [router, workspaceId]);

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 w-full text-left hover:workspace-hover rounded-xl p-2 transition-all duration-200 group">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate workspace-text text-right">
              {workspace.name}'s Workspace
            </h2>
          </div>
          <div className="relative">
            <div className="w-6 h-6 workspace-sidebar-header-gradient rounded-md flex items-center justify-center group-hover:scale-110">
              <span className="text-white font-bold text-lg drop-shadow-sm">
                {workspace.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60 mr-2">
        <DropdownMenuItem
          className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
          onClick={handleSettingsClick}
        >
          <Settings className="mr-1 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors">
          <UserPlus className="mr-1 h-4 w-4" />
          Manage Users
        </DropdownMenuItem>
        <DropdownMenuSeparator className="workspace-border my-2" />
        <DropdownMenuItem
          className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
          onClick={onCreateModalOpen}
        >
          <Building className="mr-1 h-4 w-4" />
          Create New Workspace
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs hover:workspace-hover cursor-pointer rounded-lg m-1 transition-colors"
          onClick={onSwitchWorkspaceModalOpen}
        >
          <LogOut className="mr-1 h-4 w-4" />
          Switch Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Main Component
export default function WorkspaceHeader({
  workspace,
  user,
}: WorkspaceHeaderProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  // State
  const [colorTheme, setColorTheme] = useState("green");
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSwitchWorkspaceModalOpen, setIsSwitchWorkspaceModalOpen] =
    useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    setMounted(true);
    const savedColorTheme = localStorage.getItem("color-theme");
    if (savedColorTheme) {
      setColorTheme(savedColorTheme);
      applyColorTheme(savedColorTheme);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(
          (e.target as HTMLElement)?.tagName || ""
        )
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, workspace.id]);

  useEffect(() => {
    if (!user?.id || !workspace?.id) return;

    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await loadUnreadCount();
        await loadRecentEvents();
      }
    };

    loadData();

    const channelName = `header_events_${workspace.id}_${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `and(workspace_id=eq.${workspace.id},user_id=eq.${user.id})`,
        },
        () => {
          if (mounted) {
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, workspace?.id, supabase]);

  // Functions
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !workspace.id) return;

      setIsSearching(true);
      try {
        const results: SearchResult[] = [];

        // Search tasks
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select(
            `
          id, task_id, name, description, priority,
          status:statuses(name, color),
          project:projects(name, project_id),
          space:spaces(name)
        `
          )
          .eq("workspace_id", workspace.id)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(SEARCH_RESULTS_LIMITS.tasks);

        if (!tasksError && tasks) {
          tasks.forEach((task: any) => {
            results.push({
              id: task.id,
              type: "task",
              title: task.name,
              subtitle: `${task.project?.name || "No Project"} • ${
                task.space?.name || "No Space"
              }`,
              status: task.status?.name,
              color: task.status?.color,
              priority: task.priority,
              url: `/${workspace.workspace_id}/task/${task.task_id}`,
              icon: <CheckSquare className="h-4 w-4" />,
            });
          });
        }

        // Search projects
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select(
            `
          id, project_id, name, description,
          space:spaces(name)
        `
          )
          .eq("workspace_id", workspace.id)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(SEARCH_RESULTS_LIMITS.projects);

        if (!projectsError && projects) {
          projects.forEach((project: any) => {
            results.push({
              id: project.id,
              type: "project",
              title: project.name,
              subtitle: `Project in ${project.space?.name || "Unknown Space"}`,
              url: `/${workspace.workspace_id}/project/${project.project_id}`,
              icon: <Folder className="h-4 w-4" />,
            });
          });
        }

        // Search spaces
        const { data: spaces, error: spacesError } = await supabase
          .from("spaces")
          .select("id, space_id, name, description")
          .eq("workspace_id", workspace.id)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(SEARCH_RESULTS_LIMITS.spaces);

        if (!spacesError && spaces) {
          spaces.forEach((space: any) => {
            results.push({
              id: space.id,
              type: "space",
              title: space.name,
              subtitle: "Space",
              url: `/${workspace.workspace_id}/space/${space.space_id}`,
              icon: <Hash className="h-4 w-4" />,
            });
          });
        }

        setSearchResults(results);
        setIsSearchOpen(results.length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [workspace.id, workspace.workspace_id, supabase]
  );

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id || !workspace?.id) return;
    const count = await getUnreadEventsCount(user.id, workspace.id);
    setUnreadCount(count);
  }, [user?.id, workspace?.id]);

  const loadRecentEvents = useCallback(async () => {
    if (!user?.id || !workspace?.id) return;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching recent events:", error);
    } else {
      setRecentEvents(data || []);
    }
  }, [user?.id, workspace?.id, supabase]);

  const handleColorChange = useCallback((colorValue: string) => {
    setColorTheme(colorValue);
    localStorage.setItem("color-theme", colorValue);
    applyColorTheme(colorValue);
  }, []);

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      router.push(result.url);
      setIsSearchOpen(false);
      setSearchQuery("");
      searchInputRef.current?.blur();
    },
    [router]
  );

  if (!mounted) {
    return null;
  }

  return (
    <>
      <header className="workspace-header-bg p-2 rounded-xl">
        <div className="flex items-center justify-between">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            isSearchOpen={isSearchOpen}
            isSearching={isSearching}
            onSearchSelect={handleSearchSelect}
            searchInputRef={searchInputRef}
          />

          <div className="flex items-center space-x-1">
            <HeaderActions
              theme={theme}
              setTheme={setTheme}
              colorTheme={colorTheme}
              handleColorChange={handleColorChange}
              onAIAssistantOpen={() => setIsAIAssistantOpen(true)}
              workspaceId={workspaceId}
              router={router}
            />

            <WorkspaceDropdown
              workspace={workspace}
              workspaceId={workspaceId}
              router={router}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              onCreateModalOpen={() => setIsCreateModalOpen(true)}
              onSwitchWorkspaceModalOpen={() =>
                setIsSwitchWorkspaceModalOpen(true)
              }
            />
          </div>
        </div>
      </header>

      <AIAssistantSidebar
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        user={user}
      />

      <SwitchWorkspaceModal
        open={isSwitchWorkspaceModalOpen}
        onOpenChange={setIsSwitchWorkspaceModalOpen}
        currentWorkspaceId={workspaceId}
      />

      <CreateWorkspaceModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
      />
    </>
  );
}
