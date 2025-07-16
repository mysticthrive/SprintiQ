"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  RefreshCw,
  Server,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Play,
  Wrench,
} from "lucide-react";
import { mcpService } from "@/lib/mcp/service";
import {
  MCPClientConfig,
  MCPTool,
  MCPServerInfo,
  MCPToolResult,
} from "@/lib/mcp/types";

interface MCPConnection {
  name: string;
  url: string;
  authType: "none" | "bearer" | "apikey";
  authToken?: string;
  status: "connected" | "disconnected" | "error";
  lastHealthCheck?: Date;
  serverInfo?: MCPServerInfo;
  tools?: MCPTool[];
  error?: string;
}

export default function MCPManager() {
  const [connections, setConnections] = useState<MCPConnection[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<MCPConnection>>({
    name: "",
    url: "",
    authType: "none",
  });
  const [toolResults, setToolResults] = useState<{
    [key: string]: MCPToolResult;
  }>({});
  const [selectedTool, setSelectedTool] = useState<{
    server: string;
    tool: string;
  } | null>(null);
  const [toolParams, setToolParams] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const connectedServers = mcpService.getConnectedServers();
      const healthStatus = await mcpService.healthCheck();

      const loadedConnections: MCPConnection[] = [];

      for (const serverName of connectedServers) {
        try {
          const serverInfo = await mcpService.getServerInfoFromClient(
            serverName
          );
          const tools = await mcpService.listToolsFromClient(serverName);

          // Note: In a real implementation, you'd store connection configs in a database
          loadedConnections.push({
            name: serverName,
            url: "stored-url", // This would come from your database
            authType: "none", // This would come from your database
            status: healthStatus[serverName] ? "connected" : "error",
            lastHealthCheck: new Date(),
            serverInfo,
            tools,
          });
        } catch (error) {
          loadedConnections.push({
            name: serverName,
            url: "stored-url",
            authType: "none",
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      setConnections(loadedConnections);
    } catch (error) {
      console.error("Failed to load connections:", error);
      toast({
        title: "Error",
        description: "Failed to load MCP connections",
        variant: "destructive",
      });
    }
  };

  const handleAddConnection = async () => {
    if (!newConnection.name || !newConnection.url) {
      toast({
        title: "Error",
        description: "Name and URL are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const config: MCPClientConfig = {
        serverUrl: newConnection.url,
        auth:
          newConnection.authType !== "none"
            ? {
                type: newConnection.authType as "bearer" | "apikey",
                token: newConnection.authToken || "",
              }
            : undefined,
        timeout: 30000,
        retries: 3,
      };

      await mcpService.connectToServer(newConnection.name, config);

      toast({
        title: "Success",
        description: `Connected to ${newConnection.name}`,
      });

      setNewConnection({ name: "", url: "", authType: "none" });
      setShowAddForm(false);
      await loadConnections();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (serverName: string) => {
    setLoading(true);
    try {
      await mcpService.disconnectFromServer(serverName);
      toast({
        title: "Success",
        description: `Disconnected from ${serverName}`,
      });
      await loadConnections();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHealthCheck = async () => {
    setLoading(true);
    try {
      await loadConnections();
      toast({
        title: "Success",
        description: "Health check completed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh health check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTool = async () => {
    if (!selectedTool) return;

    setLoading(true);
    try {
      let params = {};
      if (toolParams.trim()) {
        params = JSON.parse(toolParams);
      }

      const result = await mcpService.callTool(
        selectedTool.server,
        selectedTool.tool,
        params,
        {
          workspaceId: "test-workspace",
          userId: "test-user",
          permissions: ["read", "write"],
        }
      );

      setToolResults((prev) => ({
        ...prev,
        [`${selectedTool.server}:${selectedTool.tool}`]: result,
      }));

      toast({
        title: result.success ? "Success" : "Error",
        description: result.success
          ? "Tool executed successfully"
          : result.error,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "disconnected":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "disconnected":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">MCP Server Manager</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshHealthCheck}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add MCP Server</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  value={newConnection.name || ""}
                  onChange={(e) =>
                    setNewConnection((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g., jira-server"
                />
              </div>
              <div>
                <Label htmlFor="url">Server URL</Label>
                <Input
                  id="url"
                  value={newConnection.url || ""}
                  onChange={(e) =>
                    setNewConnection((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                  placeholder="https://api.example.com/mcp"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="authType">Authentication</Label>
              <Select
                value={newConnection.authType}
                onValueChange={(value) =>
                  setNewConnection((prev) => ({
                    ...prev,
                    authType: value as any,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newConnection.authType !== "none" && (
              <div>
                <Label htmlFor="authToken">
                  {newConnection.authType === "bearer"
                    ? "Bearer Token"
                    : "API Key"}
                </Label>
                <Input
                  id="authToken"
                  type="password"
                  value={newConnection.authToken || ""}
                  onChange={(e) =>
                    setNewConnection((prev) => ({
                      ...prev,
                      authToken: e.target.value,
                    }))
                  }
                  placeholder="Enter your token/key"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddConnection} disabled={loading}>
                {loading ? "Connecting..." : "Connect"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="connections" className="w-full">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="test">Test Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {connections.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No MCP servers connected. Add a server to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection) => (
                <Card key={connection.name}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          {connection.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {connection.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(connection.status)}>
                          {getStatusIcon(connection.status)}
                          {connection.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(connection.name)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Version:</strong>{" "}
                        {connection.serverInfo?.version || "Unknown"}
                      </div>
                      <div>
                        <strong>Tools:</strong> {connection.tools?.length || 0}
                      </div>
                      <div>
                        <strong>Last Check:</strong>{" "}
                        {connection.lastHealthCheck?.toLocaleString() ||
                          "Never"}
                      </div>
                      <div>
                        <strong>Auth Type:</strong> {connection.authType}
                      </div>
                    </div>
                    {connection.error && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{connection.error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tools">
          <div className="space-y-4">
            {connections.map(
              (connection) =>
                connection.tools &&
                connection.tools.length > 0 && (
                  <Card key={connection.name}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        {connection.name} Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {connection.tools.map((tool) => (
                          <div
                            key={tool.name}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{tool.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {tool.description}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedTool({
                                    server: connection.name,
                                    tool: tool.name,
                                  })
                                }
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Test
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
            )}
          </div>
        </TabsContent>

        <TabsContent value="test">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test MCP Tool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="toolSelect">Select Tool</Label>
                  <Select
                    value={
                      selectedTool
                        ? `${selectedTool.server}:${selectedTool.tool}`
                        : ""
                    }
                    onValueChange={(value) => {
                      const [server, tool] = value.split(":");
                      setSelectedTool({ server, tool });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tool to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((connection) =>
                        connection.tools?.map((tool) => (
                          <SelectItem
                            key={`${connection.name}:${tool.name}`}
                            value={`${connection.name}:${tool.name}`}
                          >
                            {connection.name}: {tool.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="toolParams">Parameters (JSON)</Label>
                  <Textarea
                    id="toolParams"
                    value={toolParams}
                    onChange={(e) => setToolParams(e.target.value)}
                    placeholder='{"param1": "value1", "param2": "value2"}'
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleTestTool}
                  disabled={!selectedTool || loading}
                >
                  {loading ? "Testing..." : "Test Tool"}
                </Button>

                {selectedTool &&
                  toolResults[
                    `${selectedTool.server}:${selectedTool.tool}`
                  ] && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Result:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                        {JSON.stringify(
                          toolResults[
                            `${selectedTool.server}:${selectedTool.tool}`
                          ],
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
