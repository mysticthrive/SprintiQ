"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsProfileViewLoading() {
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
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
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
                <Skeleton className="h-10 w-20 rounded-md" />
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
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
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
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
            <Skeleton className="h-20 w-40 rounded-md" />
            <Skeleton className="h-20 w-40 rounded-md" />
            <Skeleton className="h-20 w-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
