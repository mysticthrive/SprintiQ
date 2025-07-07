"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextEditor } from "@/components/ui/text-editor";
import type { TaskDescriptionProps } from "../types";
import { cn } from "@/lib/utils";

// Import markdownToHtml from text-editor
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return "";

  // Process markdown in order of most specific to least specific
  return (
    markdown
      // Headers (## and #)
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold">$1</h1>')
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Lists
      .replace(/^- (.*$)/gm, (match, content) => {
        return `<ul class="list-disc ml-4"><li>${content}</li></ul>`;
      })
      // Only convert double line breaks to paragraphs
      .replace(/\n\n+/g, "</p><p>")
      // Wrap content in paragraphs if not already wrapped
      .replace(/^(.+)$/gm, (match) => {
        if (!match.startsWith("<") || !match.endsWith(">")) {
          return `<p>${match}</p>`;
        }
        return match;
      })
      // Clean up any empty paragraphs
      .replace(/<p>\s*<\/p>/g, "")
      // Clean up multiple consecutive <br> tags
      .replace(/<br\s*\/?>\s*<br\s*\/?>/g, "<br>")
  );
};

export function TaskDescription({
  task,
  editedDescription,
  isEditingDescription,
  isEditingTaskName,
  editedTaskName,
  loading,
  onStartEdit,
  onSave,
  onCancel,
  onDescriptionChange,
  onEditTaskName,
  onSaveTaskName,
  onCancelTaskName,
  onTaskNameChange,
  children,
}: TaskDescriptionProps & { children?: React.ReactNode }) {
  // Convert markdown-style content to HTML when starting edit
  const handleStartEdit = () => {
    // Pass the original content to maintain formatting
    onStartEdit();
  };

  return (
    <div className="flex-1 p-3 overflow-y-auto">
      {/* Task Title */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-3">
          <span className="text-xs p-1 font-medium workspace-sidebar-text border rounded-md">
            Task
          </span>
          |
          <span className="text-xs p-1 font-medium workspace-sidebar-text border rounded-md">
            {task.task_id}
          </span>
        </div>
        {isEditingTaskName ? (
          <div className="flex items-center gap-2">
            <Input
              value={editedTaskName}
              onChange={(e) => onTaskNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSaveTaskName();
                } else if (e.key === "Escape") {
                  onCancelTaskName();
                }
              }}
              className="text-xl font-semibold border workspace-border p-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-2 focus:workspace-ring bg-transparent"
              placeholder="Task name"
              autoFocus
            />
            <Button
              size="sm"
              onClick={onSaveTaskName}
              disabled={loading}
              className="workspace-primary hover:workspace-primary-hover"
            >
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelTaskName}>
              Cancel
            </Button>
          </div>
        ) : (
          <h1 className="text-xl font-semibold workspace-sidebar-text">
            {task.name}
          </h1>
        )}
      </div>

      {/* Description */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-medium workspace-sidebar-text">
            Description
          </h3>
        </div>

        {isEditingDescription ? (
          <div>
            <TextEditor
              key={`edit-${task.id}`}
              value={editedDescription}
              onChange={(value) => onDescriptionChange(value)}
              placeholder="Add a description..."
              className="w-full min-h-[200px] workspace-sidebar-text workspace-header-bg"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={loading}
                className="workspace-primary hover:workspace-primary-hover"
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="workspace-header-bg border workspace-border rounded-lg p-4 min-h-[200px] cursor-pointer hover:workspace-hover workspace-sidebar-text"
            onClick={handleStartEdit}
          >
            {task.description ? (
              <>
                <div
                  className={cn("prose prose-sm max-w-none focus:outline-none")}
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(task.description),
                  }}
                />
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
          [contenteditable]:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          .prose h1 {
            font-size: 1.5em;
            font-weight: 600;
            margin: 1em 0;
          }
          .prose h2 {
            font-size: 1.25em;
            font-weight: 600;
            margin: 1em 0;
          }
          .prose h3 {
            font-size: 1.1em;
            font-weight: 600;
            margin: 1em 0;
          }
          .prose ul {
            list-style-type: disc;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .prose ol {
            list-style-type: decimal;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .prose li {
            margin: 0.5em 0;
          }
          .prose blockquote {
            border-left: 3px solid #e5e7eb;
            padding-left: 1em;
            margin: 1em 0;
            color: #6b7280;
          }
          .prose pre {
            background: #f3f4f6;
            padding: 1em;
            border-radius: 0.375rem;
            margin: 1em 0;
            font-family: monospace;
          }
        `,
                  }}
                />
              </>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Click to add a description...
              </div>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
