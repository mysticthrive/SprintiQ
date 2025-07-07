"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface SlackChannelMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  onMappingSaved?: () => void;
}

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_mpim: boolean;
  is_im: boolean;
  is_channel: boolean;
  is_group: boolean;
  is_general: boolean;
  is_member: boolean;
  is_archived?: boolean;
  num_members: number;
}

export function SlackChannelMappingModal({
  isOpen,
  onClose,
  workspaceId,
  entityType,
  entityId,
  entityName,
  onMappingSaved,
}: SlackChannelMappingModalProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useEnhancedToast();

  useEffect(() => {
    if (isOpen && workspaceId) {
      loadChannels();
    }
  }, [isOpen, workspaceId]);

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/slack/channels?workspaceId=${workspaceId}`
      );
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      } else {
        toast({
          title: "Failed to load channels",
          description: "Could not load Slack channels.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
      toast({
        title: "Failed to load channels",
        description: "Could not load Slack channels.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChannel) {
      toast({
        title: "No channel selected",
        description: "Please select a Slack channel.",
        variant: "destructive",
      });
      return;
    }

    const channel = channels.find((c) => c.id === selectedChannel);
    if (!channel) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/slack/channel-mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.is_private ? "private" : "public",
          entityType,
          entityId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Channel mapping saved",
          description: `Successfully mapped ${entityName} to #${channel.name}`,
        });
        onMappingSaved?.();
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Failed to save mapping",
          description: error.error || "Could not save channel mapping.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save mapping:", error);
      toast({
        title: "Failed to save mapping",
        description: "Could not save channel mapping.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect to Slack Channel</DialogTitle>
          <DialogDescription>
            Choose a Slack channel to receive notifications for {entityName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="channel">Slack Channel</Label>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading channels...
                  </div>
                ) : (
                  channels
                    .filter(
                      (channel) => channel.is_channel && !channel.is_archived
                    )
                    .map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name}
                        {channel.is_private && " (private)"}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedChannel || isSaving}>
            {isSaving ? "Saving..." : "Save Mapping"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
