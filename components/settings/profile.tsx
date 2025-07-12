"use client";

import { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  User,
  Mail,
  Lock,
  CheckIcon,
  Globe,
  Clock,
  Save,
  Loader2,
  X,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/provider/theme-provider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { cn, getAvatarInitials } from "@/lib/utils";
import { ThemeColors } from "@/types";
import { Profile } from "@/lib/database.types";
import { updateProfile } from "@/app/[workspaceId]/settings/profile/actions";
import { Slider } from "@/components/ui/slider";
import SettingsProfileViewLoading from "@/app/[workspaceId]/settings/profile/loading";
import { ScrollArea } from "../ui/scroll-area";

interface ProfileFormProps {
  profile: Profile | null;
  email: string | undefined;
}

export function SettingsProfileView({ profile, email }: ProfileFormProps) {
  const { color, setColor } = useTheme();
  const { theme, setTheme } = useTheme();

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState(profile?.language ?? "English");
  const [startOfWeek, setStartOfWeek] = useState(
    profile?.start_of_week || "Sunday"
  );
  const [timeFormat, setTimeFormat] = useState(
    profile?.time_format || "12-hour"
  );
  const [dateFormat, setDateFormat] = useState(
    profile?.date_format || "mm/dd/yyyy"
  );
  const [isLoading, setIsLoading] = useState(false);

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength classification
  const getPasswordStrength = (
    password: string
  ): { level: "Weak" | "Medium" | "Strong"; score: number; color: string } => {
    if (!password) return { level: "Weak", score: 0, color: "text-gray-400" };

    let score = 0;
    const criteria = [
      password.length >= 8,
      /(?=.*[a-z])/.test(password),
      /(?=.*[A-Z])/.test(password),
      /(?=.*\d)/.test(password),
      /(?=.*[@$!%*?&])/.test(password),
    ];

    score = criteria.filter(Boolean).length;

    if (score <= 2) return { level: "Weak", score, color: "text-red-500" };
    if (score <= 4) return { level: "Medium", score, color: "text-yellow-500" };
    return { level: "Strong", score, color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("At least 8 characters long");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("At least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("At least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("At least one number");
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push("At least one special character (@$!%*?&)");
    }

    return errors;
  };

  // Handle password change with validation
  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    if (password) {
      const errors = validatePassword(password);
      setPasswordErrors(errors);
      setShowPasswordRequirements(true);
    } else {
      setPasswordErrors([]);
      setShowPasswordRequirements(false);
    }
  };

  // Check if passwords match
  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordMismatch = Boolean(confirmPassword && !passwordsMatch);

  // Avatar upload state
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [timezones, setTimezones] = useState<any[]>([]);
  const [timezone, setTimezone] = useState<string>(profile?.timezone || "");
  const [timezoneSearch, setTimezoneSearch] = useState("");

  useEffect(() => {
    // Fetch all timezones from the API
    fetch("/api/timezones")
      .then((res) => res.json())
      .then((data) => setTimezones(data));
  }, []);

  // Get the selected timezone object for display
  const selectedTimezone = timezones.find((tz) => tz.id === timezone);

  console.log("timezone", timezones);

  const handleAvatarFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedAvatarFile(file);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedImageBlob(croppedBlob);
    const url = URL.createObjectURL(croppedBlob);
    setCroppedImageUrl(url);
    setShowCropModal(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("language", language);
      formData.append("timezone", timezone);
      formData.append("startOfWeek", startOfWeek);
      formData.append("timeFormat", timeFormat);
      formData.append("dateFormat", dateFormat);
      formData.append("removeAvatar", "true"); // Flag to remove avatar

      await updateProfile(formData);

      // Clear local avatar state
      setCroppedImageBlob(null);
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
        setCroppedImageUrl("");
      }

      console.log("Avatar removed successfully");
    } catch (error) {
      console.error("Failed to remove avatar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = (open: boolean) => {
    setShowCropModal(open);
    if (!open) {
      // Clean up when modal closes without saving
      setSelectedAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    // Validate passwords before saving
    if (newPassword) {
      const errors = validatePassword(newPassword);
      if (errors.length > 0) {
        console.error("Password does not meet requirements:", errors);
        return;
      }

      if (!passwordsMatch) {
        console.error("Passwords do not match");
        return;
      }
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("language", language);
      formData.append("timezone", timezone);
      formData.append("startOfWeek", startOfWeek);
      formData.append("timeFormat", timeFormat);
      formData.append("dateFormat", dateFormat);

      // Add avatar if cropped image exists
      if (croppedImageBlob) {
        formData.append("avatar", croppedImageBlob, "avatar.jpg");
      }

      // Add current avatar URL to preserve it if no new avatar
      formData.append("currentAvatarUrl", profile?.avatar_url || "");

      // Only include password if both fields are filled and valid
      if (
        newPassword &&
        confirmPassword &&
        passwordsMatch &&
        passwordErrors.length === 0
      ) {
        formData.append("newPassword", newPassword);
        formData.append("confirmPassword", confirmPassword);
      }

      const result = await updateProfile(formData);

      if (result && !result.success) {
        console.error("Failed to update profile:", result.message);
        return;
      }

      // Clear password fields after successful save
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors([]);
      setShowPasswordRequirements(false);

      // Clear avatar upload state
      setCroppedImageBlob(null);
      setSelectedAvatarFile(null);
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
        setCroppedImageUrl("");
      }

      // You might want to add a toast notification here for success
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      // You might want to add a toast notification here for error
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <SettingsProfileViewLoading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full p-6 container mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">My Settings</h1>
        <p className="workspace-sidebar-text mb-8">
          Your personal information and account security settings.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Profile Form */}
        <div className="flex flex-col gap-4">
          <div className=" flex gap-6">
            <div className="space-y-4 w-96">
              <h3 className="text-lg font-semibold">Profile</h3>
              <p className="text-sm text-muted-foreground">
                Your personal information and account security settings.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="grid gap-4">
                <Label htmlFor="avatar-upload">Avatar</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 workspace">
                    <AvatarImage
                      src={
                        croppedImageUrl || (profile?.avatar_url ?? undefined)
                      }
                      alt={"User Avatar"}
                    />
                    <AvatarFallback className="workspace-component-bg workspace-component-active-color text-3xl">
                      {getAvatarInitials(profile?.full_name, profile?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileSelect}
                    ref={fileInputRef}
                  />
                  <div className="flex gap-2">
                    <Label htmlFor="avatar-upload">
                      <Button variant="outline" type="button" asChild>
                        <span className="flex items-center gap-2 cursor-pointer">
                          <Upload className="h-4 w-4" />
                          Change Avatar
                        </span>
                      </Button>
                    </Label>
                    {(profile?.avatar_url || croppedImageUrl) && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      variant="workspace"
                      value={fullName}
                      placeholder="Your full name"
                      className="pl-9"
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      variant="workspace"
                      value={profile?.email ?? ""}
                      disabled
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      variant="workspace"
                      placeholder="Enter New Password"
                      className="pl-9 pr-10"
                      value={newPassword}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Password Strength:
                        </span>
                        <span
                          className={`text-sm font-semibold ${passwordStrength.color}`}
                        >
                          {passwordStrength.level}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.level === "Weak"
                              ? "bg-red-500"
                              : passwordStrength.level === "Medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Requirements */}
                  {showPasswordRequirements && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                      <p className="text-sm font-medium mb-2">
                        Password Requirements:
                      </p>
                      <ul className="space-y-1 text-xs">
                        {[
                          "At least 8 characters long",
                          "At least one lowercase letter",
                          "At least one uppercase letter",
                          "At least one number",
                          "At least one special character (@$!%*?&)",
                        ].map((requirement) => {
                          const isMet = !passwordErrors.includes(requirement);
                          return (
                            <li
                              key={requirement}
                              className={`flex items-center gap-2 ${
                                isMet
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isMet ? (
                                <CheckIcon className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {requirement}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      variant="workspace"
                      placeholder="Confirm New Password"
                      className="pl-9 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Match Validation */}
                  {confirmPassword && (
                    <div className="mt-2">
                      {passwordsMatch ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckIcon className="h-3 w-3" />
                          Passwords match
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        {language}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-2 space-y-1">
                      <DropdownMenuItem
                        onSelect={() => setLanguage("English")}
                        className="cursor-pointer hover:workspace-hover "
                      >
                        English
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setLanguage("Spanish")}
                        className="cursor-pointer hover:workspace-hover "
                      >
                        Spanish
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setLanguage("French")}
                        className="cursor-pointer hover:workspace-hover "
                      >
                        French
                      </DropdownMenuItem>
                      {/* Add more languages as needed */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span>
                          {selectedTimezone
                            ? `${selectedTimezone.country} / ${
                                selectedTimezone.city
                              } (${selectedTimezone.abbreviation}) UTC${
                                selectedTimezone.utc_offset >= 0 ? "+" : ""
                              }${selectedTimezone.utc_offset}`
                            : "Select Timezone"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      <div className="p-2 w-full">
                        <Input
                          placeholder="Search timezone..."
                          value={timezoneSearch}
                          onChange={(e) => setTimezoneSearch(e.target.value)}
                          className="w-full mb-2"
                        />
                      </div>
                      <ScrollArea className="h-[200px]">
                        {(!Array.isArray(timezones) ||
                          timezones.length === 0) && (
                          <DropdownMenuItem disabled>
                            No timezones found
                          </DropdownMenuItem>
                        )}
                        {(Array.isArray(timezones) ? timezones : [])
                          .filter((tz) => {
                            const q = timezoneSearch.toLowerCase();
                            return (
                              tz.country?.toLowerCase().includes(q) ||
                              tz.city?.toLowerCase().includes(q) ||
                              tz.abbreviation?.toLowerCase().includes(q) ||
                              tz.label?.toLowerCase().includes(q)
                            );
                          })
                          .map((tz) => (
                            <DropdownMenuItem
                              key={tz.id}
                              onSelect={() => setTimezone(tz.id)}
                              className="w-full flex items-center justify-between hover:workspace-hover cursor-pointer"
                            >
                              <span>
                                {tz.country} / {tz.city} ({tz.abbreviation}){" "}
                              </span>{" "}
                              <span>
                                UTC
                                {tz.utc_offset >= 0 ? "+" : ""}
                                {tz.utc_offset}
                              </span>
                            </DropdownMenuItem>
                          ))}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
          <hr className="workspace-border" />
          <div className=" flex gap-6">
            <div className="space-y-4 w-96">
              <h3 className="text-lg font-semibold">Time & Date format</h3>
              <p className="text-sm text-muted-foreground">
                Select the way times & dates are displayed.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4">
                <Label>Start of the calendar week</Label>
                <RadioGroup
                  value={startOfWeek}
                  onValueChange={setStartOfWeek}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      variant="workspace"
                      value="Sunday"
                      id="start-sunday"
                    />
                    <Label htmlFor="start-sunday">Sunday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      variant="workspace"
                      value="Monday"
                      id="start-monday"
                    />
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
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      variant="workspace"
                      value="24-hour"
                      id="time-24hour"
                    />
                    <Label htmlFor="time-24hour">24 hour</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      variant="workspace"
                      value="12-hour"
                      id="time-12hour"
                    />
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
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      variant="workspace"
                      value="mm/dd/yyyy"
                      id="date-mmddyyyy"
                    />
                    <Label htmlFor="date-mmddyyyy">mm/dd/yyyy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      variant="workspace"
                      value="dd/mm/yyyy"
                      id="date-ddmmyyyy"
                    />
                    <Label htmlFor="date-ddmmyyyy">dd/mm/yyyy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      variant="workspace"
                      value="yyyy/mm/dd"
                      id="date-yyyymmdd"
                    />
                    <Label htmlFor="date-yyyymmdd">yyyy/mm/dd</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
        <hr className="workspace-border" />
        {/* Theme Color Selector */}
        <div className=" flex gap-6">
          <div className="space-y-4 w-96">
            <h3 className="text-lg font-semibold">Theme color</h3>
            <p className="text-sm text-muted-foreground">
              Choose a preferred theme for the app.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {ThemeColors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border-2 transition-all",
                  color === c.name
                    ? "border border-2 border-workspace-primary"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c.hex }}
                aria-label={`Select ${c.label} theme color`}
                title={c.label}
              >
                {color === c.name && (
                  <CheckIcon className="h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
        <hr className="workspace-border" />
        {/* Appearance Selector */}
        <div className=" flex gap-6 mb-3">
          <div className="space-y-4 w-96">
            <h3 className="text-lg font-semibold">Appearance</h3>
            <p className="text-sm text-muted-foreground">
              Choose light or dark mode, or switch your mode automatically based
              on your system settings.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:scale-105",
                theme === "light"
                  ? "border-workspace-primary bg-muted/50"
                  : "border-transparent hover:border-muted"
              )}
            >
              <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-2 w-[20px] rounded-lg bg-[#ecedef]" />
                  <div className="h-2 w-[60px] rounded-lg bg-[#ecedef]" />
                </div>
              </div>
              <span className="text-sm font-medium">Light</span>
              {theme === "light" && (
                <CheckIcon className="h-4 w-4 text-workspace-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:scale-105",
                theme === "dark"
                  ? "border-workspace-primary bg-muted/50"
                  : "border-transparent hover:border-muted"
              )}
            >
              <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-2 w-[20px] rounded-lg bg-slate-400" />
                  <div className="h-2 w-[60px] rounded-lg bg-slate-400" />
                </div>
              </div>
              <span className="text-sm font-medium">Dark</span>
              {theme === "dark" && (
                <CheckIcon className="h-4 w-4 text-workspace-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:scale-105",
                theme === "system"
                  ? "border-workspace-primary bg-muted/50"
                  : "border-transparent hover:border-muted"
              )}
            >
              <div className="space-y-2 rounded-sm bg-gray-200 p-2">
                <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-gray-300" />
                  <div className="h-2 w-[100px] rounded-lg bg-gray-300" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-gray-100 p-2 shadow-sm">
                  <div className="h-2 w-[20px] rounded-lg bg-gray-300" />
                  <div className="h-2 w-[60px] rounded-lg bg-gray-300" />
                </div>
              </div>
              <span className="text-sm font-medium">Auto</span>
              {theme === "system" && (
                <CheckIcon className="h-4 w-4 text-workspace-primary" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 pb-6 pr-8">
        <Button
          variant="workspace"
          className="rounded-full h-12 w-12 hover:scale-105 transition-all duration-300 p-0 hover:workspace-primary-hover"
          onClick={handleSave}
          disabled={
            isLoading ||
            Boolean(
              newPassword && (passwordErrors.length > 0 || passwordMismatch)
            )
          }
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Save className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={showCropModal}
        onOpenChange={handleModalClose}
        imageFile={selectedAvatarFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

// Image Crop Modal Component
interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
}

function ImageCropModal({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [crop, setCrop] = useState({ x: 50, y: 50, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropSize, setCropSize] = useState([200]);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      setImageLoaded(false);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Update crop size when slider changes
  useEffect(() => {
    setCrop((prev) => ({ ...prev, size: cropSize[0] }));
  }, [cropSize]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Center the crop area when image loads
    if (containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const size = cropSize[0];
      setCrop({
        x: Math.max(0, (container.width - size) / 2),
        y: Math.max(0, (container.height - size) / 2),
        size: size,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize") => {
    e.preventDefault();
    e.stopPropagation();

    if (action === "drag") {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setDragStart({
        x: e.clientX - containerRect.left - crop.x,
        y: e.clientY - containerRect.top - crop.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      const newX = e.clientX - containerRect.left - dragStart.x;
      const newY = e.clientY - containerRect.top - dragStart.y;

      setCrop((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(newX, containerRect.width - prev.size)),
        y: Math.max(0, Math.min(newY, containerRect.height - prev.size)),
      }));
    } else if (isResizing) {
      const newSize = Math.max(
        100,
        Math.min(
          Math.min(containerRect.width, containerRect.height) - 20,
          e.clientX - containerRect.left - crop.x + dragStart.x
        )
      );

      setCrop((prev) => ({
        ...prev,
        size: newSize,
        x: Math.max(0, Math.min(prev.x, containerRect.width - newSize)),
        y: Math.max(0, Math.min(prev.y, containerRect.height - newSize)),
      }));
      setCropSize([newSize]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCropSave = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;

    // Calculate the actual image dimensions within the container
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // Calculate scale factors
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    // Calculate crop coordinates relative to the actual image
    const cropX = (crop.x - (imgRect.left - containerRect.left)) * scaleX;
    const cropY = (crop.y - (imgRect.top - containerRect.top)) * scaleY;
    const cropSize = crop.size * Math.min(scaleX, scaleY);

    // Set canvas size
    canvas.width = 200;
    canvas.height = 200;

    // Draw the cropped image
    ctx.drawImage(
      img,
      Math.max(0, cropX),
      Math.max(0, cropY),
      cropSize,
      cropSize,
      0,
      0,
      200,
      200
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/jpeg",
      0.8
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Your Avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Size Control Slider */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Crop Size</Label>
            <Slider
              value={cropSize}
              onValueChange={setCropSize}
              max={Math.min(320, 400)}
              min={100}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>{crop.size}px</span>
              <span>Large</span>
            </div>
          </div>

          {imageUrl && (
            <div
              ref={containerRef}
              className="relative w-full h-80 border rounded-lg overflow-hidden bg-gray-100"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="w-full h-full object-contain"
                draggable={false}
                onLoad={handleImageLoad}
              />

              {/* Crop overlay - only show when image is loaded */}
              {imageLoaded && (
                <>
                  {/* Dark overlay around crop area */}
                  <div className="absolute inset-0 bg-black/50 pointer-events-none" />

                  {/* Crop area */}
                  <div
                    className="absolute border-2 border-workspace-primary bg-transparent"
                    style={{
                      left: crop.x,
                      top: crop.y,
                      width: crop.size,
                      height: crop.size,
                      cursor: isDragging ? "grabbing" : "grab",
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, "drag")}
                  >
                    {/* Corner handles for resizing */}
                    <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-workspace-primary rounded-full cursor-nw-resize"
                      onMouseDown={(e) => handleMouseDown(e, "resize")}
                    />
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-workspace-primary rounded-full cursor-ne-resize"
                      onMouseDown={(e) => handleMouseDown(e, "resize")}
                    />
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-workspace-primary rounded-full cursor-sw-resize"
                      onMouseDown={(e) => handleMouseDown(e, "resize")}
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-workspace-primary rounded-full cursor-se-resize"
                      onMouseDown={(e) => handleMouseDown(e, "resize")}
                    />

                    {/* Center crosshair */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-4 h-0.5 bg-workspace-primary" />
                      <div className="w-0.5 h-4 bg-workspace-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="workspace"
            onClick={handleCropSave}
            disabled={!imageLoaded}
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
