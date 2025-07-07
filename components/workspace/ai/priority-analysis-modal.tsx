import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Flag, Goal, Users, User } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { priorityConfig } from "@/components/workspace/views/project/types";
import { cn, getColorByIndex } from "@/lib/utils";
import { TeamMember } from "@/types";

interface UserStory {
  id: string;
  title: string;
  priority?: "Low" | "Medium" | "High" | "Critical";
  assignedTeamMember?: TeamMember;
}

interface PriorityAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: UserStory[];
}

export default function PriorityAnalysisModal({
  isOpen,
  onClose,
  stories,
}: PriorityAnalysisModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [priorityData, setPriorityData] = useState<
    Array<{
      name: string;
      value: number;
      color: string;
    }>
  >([]);
  const [assigneeData, setAssigneeData] = useState<
    Array<{
      name: string;
      value: number;
      color: string;
      memberId: string;
      memberName: string;
      memberRole: string;
    }>
  >([]);

  useEffect(() => {
    // Calculate priority distribution
    const priorityCounts = stories.reduce((acc, story) => {
      const priority = story.priority?.toLowerCase() || "none";
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityChartData = Object.entries(priorityConfig).map(
      ([key, config]) => ({
        name: config.label,
        value: priorityCounts[key.toLowerCase()] || 0,
        color:
          getColorByIndex(
            config.color.replace("text-", "").replace("-600", "")
          ) || "#BDBDBD",
      })
    );

    // Add "No Priority" category
    priorityChartData.push({
      name: "No Priority",
      value: priorityCounts["none"] || 0,
      color: getColorByIndex("gray") || "#BDBDBD",
    });

    setPriorityData(priorityChartData);

    // Calculate assignee distribution
    const assigneeCounts = stories.reduce((acc, story) => {
      if (story.assignedTeamMember) {
        const memberId = story.assignedTeamMember.id;
        if (!acc[memberId]) {
          acc[memberId] = {
            count: 0,
            member: story.assignedTeamMember,
          };
        }
        acc[memberId].count += 1;
      } else {
        // Unassigned stories
        if (!acc["unassigned"]) {
          acc["unassigned"] = {
            count: 0,
            member: null,
          };
        }
        acc["unassigned"].count += 1;
      }
      return acc;
    }, {} as Record<string, { count: number; member: TeamMember | null }>);

    const assigneeChartData = Object.entries(assigneeCounts).map(
      ([memberId, data], index) => ({
        name: data.member ? data.member.name : "Unassigned",
        value: data.count,
        color:
          getColorByIndex(
            ["blue", "green", "purple", "orange", "pink", "cyan"][index % 6]
          ) || "#BDBDBD",
        memberId,
        memberName: data.member ? data.member.name : "Unassigned",
        memberRole: data.member ? data.member.role : "Unassigned",
      })
    );

    setAssigneeData(assigneeChartData);
  }, [stories]);

  const filteredStoriesByPriority = selectedPriority
    ? stories.filter(
        (story) =>
          (story.priority?.toLowerCase() || "none") === selectedPriority
      )
    : stories;

  const filteredStoriesByAssignee = selectedAssignee
    ? stories.filter(
        (story) =>
          (story.assignedTeamMember?.id || "unassigned") === selectedAssignee
      )
    : stories;

  const priorityTotal = priorityData.reduce((sum, item) => sum + item.value, 0);
  const assigneeTotal = assigneeData.reduce((sum, item) => sum + item.value, 0);

  const getAvatarInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0]?.toUpperCase() || "";
    }
    if (email) {
      return email[0]?.toUpperCase() || "";
    }
    return "?";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Story Analysis</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="priority" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="priority" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Priority Analysis
            </TabsTrigger>
            <TabsTrigger value="assignee" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assignee Analysis
            </TabsTrigger>
          </TabsList>

          {/* Priority Analysis Tab */}
          <TabsContent value="priority" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Priority Distribution Chart */}
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          className="text-sm"
                          label={({ name, value }) =>
                            `${name}: ${value} (${
                              priorityTotal > 0
                                ? Math.round((value / priorityTotal) * 100)
                                : 0
                            }%)`
                          }
                        >
                          {priorityData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              className="cursor-pointer"
                              onClick={() =>
                                setSelectedPriority(
                                  entry.name === "No Priority"
                                    ? "none"
                                    : entry.name.toLowerCase()
                                )
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `${value} (${
                              priorityTotal > 0
                                ? Math.round((value / priorityTotal) * 100)
                                : 0
                            }%)`
                          }
                          wrapperClassName="text-sm p-1"
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Filter and Story List */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedPriority === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPriority(null)}
                  >
                    All
                  </Button>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPriority(key)}
                      className={cn(
                        config.color,
                        selectedPriority === key
                          ? "border workspace-component-active-border"
                          : ""
                      )}
                    >
                      {selectedPriority === key ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Goal className="h-4 w-4 mr-2" />
                      )}
                      {config.label}
                    </Button>
                  ))}
                  <Button
                    variant={
                      selectedPriority === "none" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedPriority("none")}
                  >
                    No Priority
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredStoriesByPriority.map((story) => (
                    <Card key={story.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{story.title}</span>
                        {story.priority && (
                          <Badge
                            className={cn(
                              priorityConfig[
                                story.priority.toLowerCase() as keyof typeof priorityConfig
                              ]?.bgColor,
                              "hover:workspace-hover"
                            )}
                          >
                            <span
                              className={
                                priorityConfig[
                                  story.priority.toLowerCase() as keyof typeof priorityConfig
                                ]?.color
                              }
                            >
                              {story.priority}
                            </span>
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Assignee Analysis Tab */}
          <TabsContent value="assignee" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Assignee Distribution Chart */}
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assigneeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          className="text-sm"
                          label={({ name, value }) =>
                            `${name}: ${value} (${
                              assigneeTotal > 0
                                ? Math.round((value / assigneeTotal) * 100)
                                : 0
                            }%)`
                          }
                        >
                          {assigneeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              className="cursor-pointer"
                              onClick={() =>
                                setSelectedAssignee(entry.memberId)
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `${value} (${
                              assigneeTotal > 0
                                ? Math.round((value / assigneeTotal) * 100)
                                : 0
                            }%)`
                          }
                          wrapperClassName="text-sm p-1"
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Assignee Filter and Story List */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedAssignee === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAssignee(null)}
                  >
                    All
                  </Button>
                  {assigneeData.map((assignee) => (
                    <Button
                      key={assignee.memberId}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAssignee(assignee.memberId)}
                      className={cn(
                        selectedAssignee === assignee.memberId
                          ? "border workspace-component-active-border"
                          : ""
                      )}
                    >
                      {selectedAssignee === assignee.memberId ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <User className="h-4 w-4 mr-2" />
                      )}
                      {assignee.memberName}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredStoriesByAssignee.map((story) => (
                    <Card key={story.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{story.title}</span>
                        <div className="flex items-center gap-2">
                          {story.assignedTeamMember ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={
                                    story.assignedTeamMember.avatar_url ||
                                    undefined
                                  }
                                />
                                <AvatarFallback className="text-xs">
                                  {getAvatarInitials(
                                    story.assignedTeamMember.name,
                                    story.assignedTeamMember.email
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-600">
                                {story.assignedTeamMember.name}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Unassigned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
