"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import {
  Upload,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  DatabaseZap,
  Clock,
  FileCheck,
  AlertTriangle,
  Info,
  Sparkles,
  Target,
  Users,
  BarChart3,
} from "lucide-react";
import { useParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrainingStatus {
  isTraining: boolean;
  progress: number;
  currentStep: string;
  totalProcessed: number;
  totalSuccess: number;
  failed: number;
  duplicateInFile: number;
  duplicateInDB: number;
  existingCount: number;
  newCount: number;
}

export default function TAWOSTrainingInterface() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    isTraining: false,
    progress: 0,
    currentStep: "",
    totalProcessed: 0,
    totalSuccess: 0,
    failed: 0,
    duplicateInFile: 0,
    duplicateInDB: 0,
    existingCount: 0,
    newCount: 0,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useEnhancedToast();

  const [totalIssues, setTotalIssues] = useState<number>(0);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON file",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        toast({
          title: "Invalid JSON format",
          description: "The JSON file should contain an array of issues",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setPreviewData(data.slice(0, 5)); // Show first 5 items as preview
      setTotalIssues(data.length);

      toast({
        title: "File loaded",
        description: `Loaded ${data.length} issues from ${file.name}`,
        sendBrowserNotification: true,
        browserNotificationTitle: "Training File Loaded",
        browserNotificationBody: `Successfully loaded ${data.length} issues from ${file.name} for training.`,
      });
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Please check that the file is valid JSON",
        variant: "destructive",
      });
    }
  };

  const handleStartTraining = async () => {
    if (!selectedFile) return;

    const currentStartTime = Date.now();
    setStartTime(currentStartTime);

    setTrainingStatus({
      isTraining: true,
      progress: 0,
      currentStep: "Reading file...",
      totalProcessed: 0,
      totalSuccess: 0,
      failed: 0,
      duplicateInFile: 0,
      duplicateInDB: 0,
      existingCount: 0,
      newCount: 0,
    });

    try {
      const text = await selectedFile.text();
      const issues = JSON.parse(text);
      const totalIssues = issues.length;

      // Update progress for file reading
      setTrainingStatus((prev) => ({
        ...prev,
        progress: 5,
        currentStep: "Preparing chunked processing...",
      }));

      // Process in chunks to avoid payload size limits
      const CHUNK_SIZE = 50; // Process 50 issues at a time
      const chunks = [];
      for (let i = 0; i < issues.length; i += CHUNK_SIZE) {
        chunks.push(issues.slice(i, i + CHUNK_SIZE));
      }

      console.log(
        `Processing ${totalIssues} issues in ${chunks.length} chunks of ${CHUNK_SIZE} each`
      );

      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalFailed = 0;
      let totalDuplicateInFile = 0;
      let totalDuplicateInDB = 0;
      let totalExistingCount = 0;
      let totalNewCount = 0;

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const chunkNumber = chunkIndex + 1;

        setTrainingStatus((prev) => ({
          ...prev,
          currentStep: `Processing chunk ${chunkNumber}/${chunks.length} (${chunk.length} issues)...`,
          progress: Math.round((chunkIndex / chunks.length) * 90), // Use 90% for processing
        }));

        try {
          const response = await fetch(
            `/api/workspace/${workspaceId}/train-tawos`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ issues: chunk }),
            }
          );

          if (!response.ok) {
            if (response.status === 413) {
              throw new Error(
                `Chunk ${chunkNumber} is too large. Try reducing the chunk size.`
              );
            }
            throw new Error(
              `Training failed for chunk ${chunkNumber}: ${response.statusText}`
            );
          }

          const result = await response.json();

          // Accumulate results
          totalProcessed += result.totalProcessed || 0;
          totalSuccess += result.totalSuccess || 0;
          totalFailed += result.totalFailed || 0;
          totalDuplicateInFile += result.duplicateInFile || 0;
          totalDuplicateInDB += result.duplicateInDB || 0;
          totalExistingCount += result.existingCount || 0;
          totalNewCount += result.newCount || 0;

          console.log(
            `✅ Chunk ${chunkNumber}/${chunks.length} completed: ${result.totalSuccess} new stories`
          );

          // Update progress with accumulated results
          setTrainingStatus((prev) => ({
            ...prev,
            totalProcessed,
            totalSuccess,
            failed: totalFailed,
            duplicateInFile: totalDuplicateInFile,
            duplicateInDB: totalDuplicateInDB,
            existingCount: totalExistingCount,
            newCount: totalNewCount,
          }));

          // Add delay between chunks to avoid overwhelming the server
          if (chunkIndex < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${chunkNumber}:`, chunkError);
          totalFailed += chunk.length;

          // Continue with next chunk instead of failing completely
          toast({
            title: `Chunk ${chunkNumber} failed`,
            description:
              chunkError instanceof Error
                ? chunkError.message
                : "Unknown error",
            variant: "destructive",
          });
        }
      }

      // Final status update
      setTrainingStatus({
        isTraining: false,
        progress: 100,
        currentStep: "Training completed!",
        totalProcessed,
        totalSuccess,
        failed: totalFailed,
        duplicateInFile: totalDuplicateInFile,
        duplicateInDB: totalDuplicateInDB,
        existingCount: totalExistingCount,
        newCount: totalNewCount,
      });

      toast({
        title:
          totalSuccess > 0 ? "Training completed" : "No new data to process",
        description: (() => {
          const parts = [];
          if (totalSuccess > 0) {
            parts.push(`Added ${totalSuccess} new stories`);
          }
          if (totalDuplicateInFile > 0) {
            parts.push(`${totalDuplicateInFile} duplicates in file`);
          }
          if (totalDuplicateInDB > 0) {
            parts.push(`${totalDuplicateInDB} already in database`);
          }
          if (totalFailed > 0) {
            parts.push(`${totalFailed} failed`);
          }
          return parts.length > 0 ? parts.join(", ") : "No new data was added";
        })(),
        sendBrowserNotification: true,
        browserNotificationTitle: "TAWOS Training Complete",
        browserNotificationBody: `Successfully processed ${totalSuccess} new stories from your training data.`,
      });
    } catch (error) {
      console.error("Training error:", error);
      setTrainingStatus((prev) => ({
        ...prev,
        isTraining: false,
        currentStep: "Training failed",
      }));

      toast({
        title: "Training failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 workspace-component-bg rounded-xl">
            <DatabaseZap className="h-6 w-6 text-workspace-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              TAWOS Data Training
            </h1>
            <p className="text-sm text-gray-600">
              Upload Jira issues to train the AI story generation system
            </p>
          </div>
        </div>
      </div>

      {/* Main Training Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-workspace-primary" />
            Training Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">
                Upload Training Data
              </h3>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-workspace-primary-200 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={trainingStatus.isTraining}
                      className="px-6 py-2"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Select JSON File
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Choose a JSON file containing TAWOS Jira issues
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* File Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 workspace-component-bg rounded-full mx-auto">
                      <FileCheck className="h-8 w-8 text-workspace-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {totalIssues} issues
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        onClick={handleStartTraining}
                        variant="workspace"
                        disabled={trainingStatus.isTraining}
                        className="flex items-center gap-2"
                      >
                        <DatabaseZap className="h-4 w-4" />
                        Start Training
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearFile}
                        disabled={trainingStatus.isTraining}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Data Preview */}
                  {previewData.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">
                          Data Preview
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          First 5 issues
                        </Badge>
                      </div>
                      <ScrollArea className="h-64">
                        <div className="space-y-3 pr-4">
                          {previewData.map((issue, index) => (
                            <div
                              key={index}
                              className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                                    {issue.Title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {issue.Issue_Key}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {issue.Type}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        issue.Priority === "High" &&
                                          "bg-red-50 text-red-700 border-red-200",
                                        issue.Priority === "Medium" &&
                                          "bg-yellow-50 text-yellow-700 border-yellow-200",
                                        issue.Priority === "Low" &&
                                          "bg-green-50 text-green-700 border-green-200"
                                      )}
                                    >
                                      {issue.Priority}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    <Target className="h-3 w-3 mr-1" />
                                    {issue.Story_Point} pts
                                  </Badge>
                                  {issue.Total_Effort_Minutes && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      {Math.round(
                                        issue.Total_Effort_Minutes / 60
                                      )}
                                      h
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Training Progress */}
          {trainingStatus.isTraining && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">
                        {trainingStatus.currentStep}
                      </span>
                      <p className="text-sm text-blue-700">
                        Processing your training data...
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress
                      value={trainingStatus.progress}
                      className="w-full h-2"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">
                        Progress: {trainingStatus.progress}%
                      </span>
                      {trainingStatus.totalProcessed > 0 && (
                        <span className="text-blue-700">
                          Processed: {trainingStatus.totalProcessed} items
                        </span>
                      )}
                    </div>
                  </div>

                  {trainingStatus.progress > 0 &&
                    trainingStatus.progress < 100 &&
                    startTime > 0 && (
                      <div className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-lg">
                        {(() => {
                          const elapsedTime = (Date.now() - startTime) / 1000; // seconds
                          const progressRatio = trainingStatus.progress / 100;
                          const estimatedTotalTime =
                            elapsedTime / progressRatio;
                          const remainingTime =
                            estimatedTotalTime - elapsedTime;

                          if (remainingTime > 60) {
                            return `Estimated time remaining: ${Math.round(
                              remainingTime / 60
                            )} minutes`;
                          } else if (remainingTime > 10) {
                            return `Estimated time remaining: ${Math.round(
                              remainingTime
                            )} seconds`;
                          } else {
                            return "Almost done...";
                          }
                        })()}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Results */}
          {!trainingStatus.isTraining && trainingStatus.totalProcessed > 0 && (
            <Card
              className={cn(
                "shadow-sm",
                trainingStatus.totalSuccess > 0
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      trainingStatus.totalSuccess > 0
                        ? "bg-green-100"
                        : "bg-blue-100"
                    )}
                  >
                    {trainingStatus.totalSuccess > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        trainingStatus.totalSuccess > 0
                          ? "text-green-800"
                          : "text-blue-800"
                      )}
                    >
                      {trainingStatus.totalSuccess > 0
                        ? "Training Completed Successfully"
                        : "No New Data to Process"}
                    </span>
                    <p
                      className={cn(
                        "text-sm",
                        trainingStatus.totalSuccess > 0
                          ? "text-green-700"
                          : "text-blue-700"
                      )}
                    >
                      {trainingStatus.totalSuccess > 0
                        ? `${trainingStatus.totalSuccess} new stories added to the training database`
                        : "All items were already processed or duplicates"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">
                      {trainingStatus.totalProcessed}
                    </div>
                    <div className="text-xs text-gray-600">Total Processed</div>
                  </div>

                  {trainingStatus.totalSuccess > 0 && (
                    <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {trainingStatus.totalSuccess}
                      </div>
                      <div className="text-xs text-green-600">New Stories</div>
                    </div>
                  )}

                  {trainingStatus.duplicateInFile > 0 && (
                    <div className="text-center p-3 bg-orange-100 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-700">
                        {trainingStatus.duplicateInFile}
                      </div>
                      <div className="text-xs text-orange-600">
                        File Duplicates
                      </div>
                    </div>
                  )}

                  {trainingStatus.duplicateInDB > 0 && (
                    <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {trainingStatus.duplicateInDB}
                      </div>
                      <div className="text-xs text-blue-600">DB Duplicates</div>
                    </div>
                  )}

                  {trainingStatus.failed > 0 && (
                    <div className="text-center p-3 bg-red-100 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-700">
                        {trainingStatus.failed}
                      </div>
                      <div className="text-xs text-red-600">Failed</div>
                    </div>
                  )}
                </div>

                {trainingStatus.totalSuccess === 0 &&
                  (trainingStatus.duplicateInDB > 0 ||
                    trainingStatus.duplicateInFile > 0) && (
                    <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          No New Data Added
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        {trainingStatus.duplicateInDB > 0 &&
                        trainingStatus.duplicateInFile > 0
                          ? `All items were duplicates (${trainingStatus.duplicateInFile} in file, ${trainingStatus.duplicateInDB} in database).`
                          : trainingStatus.duplicateInDB > 0
                          ? `All ${trainingStatus.duplicateInDB} items already exist in database.`
                          : `All ${trainingStatus.duplicateInFile} items were duplicates in the file.`}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-gray-600" />
            Instructions & Format
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* JSON Format */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">JSON Format</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <pre className="text-xs overflow-x-auto text-gray-700">
                  {`{
  "ID": 1,
  "Issue_Key": "AUTH-001",
  "Title": "Implement Google OAuth authentication",
  "Description_Text": "Users should be able to authenticate...",
  "Type": "Feature",
  "Priority": "High",
  "Status": "Done",
  "Resolution": "Fixed",
  "Story_Point": 8,
  "Total_Effort_Minutes": 1920
}`}
                </pre>
              </div>
            </div>

            {/* Required Fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Required Fields</h3>
              </div>
              <div className="space-y-2">
                {[
                  {
                    field: "Issue_Key",
                    desc: "Unique identifier for the issue",
                  },
                  { field: "Title", desc: "Issue title" },
                  { field: "Description_Text", desc: "Detailed description" },
                  {
                    field: "Type",
                    desc: "Issue type (Feature, Bug, Enhancement, Task)",
                  },
                  {
                    field: "Priority",
                    desc: "Priority level (Critical, High, Medium, Low)",
                  },
                  {
                    field: "Status",
                    desc: "Current status (Done, In Progress, To Do)",
                  },
                  { field: "Story_Point", desc: "Story point estimation" },
                  {
                    field: "Total_Effort_Minutes",
                    desc: "Total effort in minutes",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-6 h-6 workspace-component-bg rounded-full flex-shrink-0">
                      <span className="text-xs font-bold text-workspace-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {item.field}
                      </div>
                      <div className="text-xs text-gray-600">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="p-4 bg-workspace-primary-50 border border-workspace-primary rounded-lg">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-workspace-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-workspace-primary">
                  AI Training Process
                </p>
                <p className="text-sm text-workspace-primary mt-1">
                  The training process converts each Jira issue into a user
                  story format and generates embeddings for AI-powered story
                  generation. This may take several minutes for large datasets.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
