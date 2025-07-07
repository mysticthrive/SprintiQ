"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupabaseTest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClientSupabaseClient();

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      testResults.authentication = {
        success: !authError,
        error: authError?.message,
        user: user ? { id: user.id, email: user.email } : null,
      };

      // Test 2: Check if we can access any table (profiles should exist)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      testResults.profiles = {
        success: !profilesError,
        error: profilesError?.message,
        data: profilesData,
      };

      // Test 3: Check if we can access workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1);

      testResults.workspaces = {
        success: !workspacesError,
        error: workspacesError?.message,
        data: workspacesData,
      };

      // Test 4: Check if we can access teams (if it exists)
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id")
        .limit(1);

      testResults.teams = {
        success: !teamsError,
        error: teamsError?.message,
        data: teamsData,
      };

      // Test 5: Check if we can access roles (if it exists)
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id")
        .limit(1);

      testResults.roles = {
        success: !rolesError,
        error: rolesError?.message,
        data: rolesData,
      };

      // Test 6: Check if we can access levels (if it exists)
      const { data: levelsData, error: levelsError } = await supabase
        .from("levels")
        .select("id")
        .limit(1);

      testResults.levels = {
        success: !levelsError,
        error: levelsError?.message,
        data: levelsData,
      };

      // Test 7: Check if we can access team_members (if it exists)
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from("team_members")
        .select("id")
        .limit(1);

      testResults.team_members = {
        success: !teamMembersError,
        error: teamMembersError?.message,
        data: teamMembersData,
      };

      setResults(testResults);
    } catch (error) {
      console.error("Supabase test error:", error);
      setResults({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={loading}>
          {loading ? "Running Tests..." : "Run Supabase Tests"}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results:</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
