"use client";

import type React from "react";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/app/[workspaceId]/settings/profile/actions";
import type { Profile } from "@/lib/database.types";
import { Lock, Mail, User, Upload, Globe, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface ProfileFormProps {
  profile: Profile | null;
  email: string | undefined;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const [username, setUsername] = useState(profile?.username || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [company, setCompany] = useState(profile?.company || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    profile?.avatar_url || null
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // New states for language, timezone, and date/time format
  const [language, setLanguage] = useState(profile?.language || "English");
  const [timezone, setTimezone] = useState(
    profile?.timezone || "America/New_York"
  ); // Default to US/Eastern
  const [notifyTimezoneChanges, setNotifyTimezoneChanges] = useState(
    profile?.notify_timezone_changes || true
  );
  const [startOfWeek, setStartOfWeek] = useState(
    profile?.start_of_week || "Sunday"
  );
  const [timeFormat, setTimeFormat] = useState(
    profile?.time_format || "12-hour"
  );
  const [dateFormat, setDateFormat] = useState(
    profile?.date_format || "mm/dd/yyyy"
  );

  // Effect to update preview URL when avatarFile changes
  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreviewUrl(url);
      return () => URL.revokeObjectURL(url); // Clean up URL object
    } else if (profile?.avatar_url) {
      setAvatarPreviewUrl(profile.avatar_url);
    } else {
      setAvatarPreviewUrl(null);
    }
  }, [avatarFile, profile?.avatar_url]);

  // Client-side password validation
  useEffect(() => {
    if (newPassword && newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
    } else if (
      newPassword &&
      confirmPassword &&
      newPassword !== confirmPassword
    ) {
      setPasswordError("Passwords do not match.");
    } else {
      setPasswordError(null);
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword && passwordError) {
      // Prevent submission if client-side password validation fails
      return;
    }

    const formData = new FormData(event.currentTarget);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }
    formData.append("currentAvatarUrl", profile?.avatar_url || "");

    // Only append password fields if they are not empty
    if (newPassword) {
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);
    }

    // Append new settings fields
    formData.append("language", language);
    formData.append("timezone", timezone);
    formData.append(
      "notifyTimezoneChanges",
      notifyTimezoneChanges ? "on" : "off"
    );
    formData.append("startOfWeek", startOfWeek);
    formData.append("timeFormat", timeFormat);
    formData.append("dateFormat", dateFormat);

    formAction(formData);
    // Clear password fields after submission attempt
    setNewPassword("");
    setConfirmPassword("");
  };

  const timezones = [
    "America/New_York", // US/Eastern
    "America/Los_Angeles", // US/Pacific
    "Europe/London",
    "Europe/Warsaw",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className=" flex gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Profile</h3>
          <p className="text-sm text-muted-foreground">
            Your personal information and account security settings.
          </p>
        </div>
        <div className="flex-1 space-y-6">
          <div className="grid gap-4">
            <Label htmlFor="avatar-upload">Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={
                    avatarPreviewUrl ||
                    "/placeholder.svg?height=80&width=80&query=user avatar"
                  }
                  alt={fullName || username || "User Avatar"}
                />
                <AvatarFallback>
                  {(fullName || username || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setAvatarFile(e.target.files ? e.target.files[0] : null)
                }
                disabled={isPending}
              />
              <Label htmlFor="avatar-upload">
                <Button
                  variant="outline"
                  type="button"
                  asChild
                  disabled={isPending}
                >
                  <span className="flex items-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Change Avatar
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          <div className="grid gap-4">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="pl-9"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="pl-9"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                value={email || ""}
                disabled
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter New Password"
                className="pl-9"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>
        </div>
      </div>
      {state && (
        <p
          className={`text-sm ${
            state.success ? "text-green-500" : "text-red-500"
          }`}
        >
          {state.message}
        </p>
      )}

      <Separator className="my-8" />

      {/* Language & Region */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Language & Region</h3>
        <p className="text-sm text-muted-foreground">
          Customize your language and region.
        </p>
      </div>

      <div className="grid gap-4">
        <Label htmlFor="language">Language</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={isPending}
            >
              <Globe className="mr-2 h-4 w-4" />
              {language}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
            <DropdownMenuItem onSelect={() => setLanguage("English")}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLanguage("Spanish")}>
              Spanish
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLanguage("French")}>
              French
            </DropdownMenuItem>
            {/* Add more languages as needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4">
        <Label htmlFor="timezone">Timezone</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={isPending}
            >
              <Clock className="mr-2 h-4 w-4" />
              {timezone}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
            {timezones.map((tz) => (
              <DropdownMenuItem key={tz} onSelect={() => setTimezone(tz)}>
                {tz}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="notifyTimezoneChanges"
          name="notifyTimezoneChanges"
          checked={notifyTimezoneChanges}
          onCheckedChange={(checked) => setNotifyTimezoneChanges(!!checked)}
          disabled={isPending}
        />
        <Label htmlFor="notifyTimezoneChanges">
          Notify me of Timezone changes
        </Label>
      </div>

      <Separator className="my-8" />

      {/* Time & Date format */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Time & Date format</h3>
        <p className="text-sm text-muted-foreground">
          Select the way times & dates are displayed.
        </p>
      </div>

      <div className="grid gap-4">
        <Label>Start of the calendar week</Label>
        <RadioGroup
          value={startOfWeek}
          onValueChange={setStartOfWeek}
          className="flex flex-col space-y-2"
          disabled={isPending}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Sunday" id="start-sunday" />
            <Label htmlFor="start-sunday">Sunday</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Monday" id="start-monday" />
            <Label htmlFor="start-monday">Monday</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-4">
        <Label>Time format</Label>
        <RadioGroup
          value={timeFormat}
          onValueChange={setTimeFormat}
          className="flex flex-col space-y-2"
          disabled={isPending}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="24-hour" id="time-24hour" />
            <Label htmlFor="time-24hour">24 hour</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="12-hour" id="time-12hour" />
            <Label htmlFor="time-12hour">12 hour</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-4">
        <Label>Date format</Label>
        <RadioGroup
          value={dateFormat}
          onValueChange={setDateFormat}
          className="flex flex-col space-y-2"
          disabled={isPending}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mm/dd/yyyy" id="date-mmddyyyy" />
            <Label htmlFor="date-mmddyyyy">mm/dd/yyyy</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dd/mm/yyyy" id="date-ddmmyyyy" />
            <Label htmlFor="date-ddmmyyyy">dd/mm/yyyy</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yyyy/mm/dd" id="date-yyyymmdd" />
            <Label htmlFor="date-yyyymmdd">yyyy/mm/dd</Label>
          </div>
        </RadioGroup>
      </div>

      <Button
        type="submit"
        disabled={isPending || !!passwordError}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
