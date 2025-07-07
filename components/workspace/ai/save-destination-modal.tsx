import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Wand2, X } from "lucide-react";

interface Space {
  space_id: string;
  name: string;
  projects: {
    project_id: string;
    name: string;
  }[];
}

interface SaveDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  spaces: Space[];
  isLoading: boolean;
  destinationType: "existing" | "new";
  selectedSpaceId: string;
  selectedProjectId: string;
  newSpaceName: string;
  newProjectName: string;
  newStatusNames: string[];
  newStatusColors: string[];
  isGeneratingSuggestions: boolean;
  onDestinationTypeChange: (type: "existing" | "new") => void;
  onSelectedSpaceChange: (spaceId: string) => void;
  onSelectedProjectChange: (projectId: string) => void;
  onNewSpaceNameChange: (name: string) => void;
  onNewProjectNameChange: (name: string) => void;
  onNewStatusNamesChange: (names: string[]) => void;
  onNewStatusColorsChange: (colors: string[]) => void;
  onAIAssist: () => void;
}

export default function SaveDestinationModal({
  isOpen,
  onClose,
  onSave,
  spaces,
  isLoading,
  destinationType,
  selectedSpaceId,
  selectedProjectId,
  newSpaceName,
  newProjectName,
  newStatusNames,
  newStatusColors,
  isGeneratingSuggestions,
  onDestinationTypeChange,
  onSelectedSpaceChange,
  onSelectedProjectChange,
  onNewSpaceNameChange,
  onNewProjectNameChange,
  onNewStatusNamesChange,
  onNewStatusColorsChange,
  onAIAssist,
}: SaveDestinationModalProps) {
  const isSaveDisabled =
    destinationType === "existing"
      ? !selectedSpaceId || !selectedProjectId
      : !newSpaceName || !newProjectName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Save Stories</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onAIAssist}
              disabled={isGeneratingSuggestions && destinationType == "new"}
            >
              {isGeneratingSuggestions ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Wand2 className="h-4 w-4 mr-1" />
              )}
              AI Suggest
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup
            value={destinationType}
            onValueChange={(value) =>
              onDestinationTypeChange(value as "existing" | "new")
            }
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="existing"
                id="existing"
                variant="workspace"
              />
              <Label htmlFor="existing">Use Existing Space/Project</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" variant="workspace" />
              <Label htmlFor="new">Create New Space/Project</Label>
            </div>
          </RadioGroup>

          {destinationType === "existing" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Space</Label>
                <Select
                  value={selectedSpaceId}
                  onValueChange={onSelectedSpaceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a space" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map((space) => (
                      <SelectItem key={space.space_id} value={space.space_id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSpaceId && (
                <div className="space-y-2">
                  <Label>Select Project</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={onSelectedProjectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces
                        .find((s) => s.space_id === selectedSpaceId)
                        ?.projects.map((project) => (
                          <SelectItem
                            key={project.project_id}
                            value={project.project_id}
                          >
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {destinationType === "new" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Space Name</Label>
                <Input
                  value={newSpaceName}
                  onChange={(e) => onNewSpaceNameChange(e.target.value)}
                  placeholder="Enter space name"
                />
              </div>
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={newProjectName}
                  onChange={(e) => onNewProjectNameChange(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label>Statuses</Label>
                <div className="space-y-2">
                  {newStatusNames.map((status, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={status}
                        onChange={(e) => {
                          const newNames = [...newStatusNames];
                          newNames[index] = e.target.value;
                          onNewStatusNamesChange(newNames);
                        }}
                        placeholder={`Status ${index + 1}`}
                      />
                      <Select
                        value={newStatusColors[index]}
                        onValueChange={(color) => {
                          const newColors = [...newStatusColors];
                          newColors[index] = color;
                          onNewStatusColorsChange(newColors);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gray">Gray</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="yellow">Yellow</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          onNewStatusNamesChange(
                            newStatusNames.filter((_, i) => i !== index)
                          );
                          onNewStatusColorsChange(
                            newStatusColors.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onNewStatusNamesChange([...newStatusNames, ""]);
                      onNewStatusColorsChange([...newStatusColors, "gray"]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Status
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="workspace"
            onClick={onSave}
            disabled={isSaveDisabled}
          >
            Save Stories
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
