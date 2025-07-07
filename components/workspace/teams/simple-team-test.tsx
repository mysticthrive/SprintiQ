"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleTeamTest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClientSupabaseClient();

  const testTeamMembers = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Step 1: Get all teams
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*");

      testResults.step1_teams = {
        success: !teamsError,
        error: teamsError?.message,
        count: teams?.length || 0,
        data: teams,
      };

      if (teams && teams.length > 0) {
        const firstTeam = teams[0];
        testResults.first_team = firstTeam;

        // Step 2: Get team members for the first team
        const { data: teamMembers, error: teamMembersError } = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", firstTeam.id);

        testResults.step2_team_members = {
          success: !teamMembersError,
          error: teamMembersError?.message,
          count: teamMembers?.length || 0,
          data: teamMembers,
        };

        if (teamMembers && teamMembers.length > 0) {
          const firstMember = teamMembers[0];
          testResults.first_member = firstMember;

          // Step 3: Get the profile for the first member (if user_id exists)
          if (firstMember.user_id) {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", firstMember.user_id)
              .single();

            testResults.step3_profile = {
              success: !profileError,
              error: profileError?.message,
              data: profile,
            };
          }

          // Step 4: Get the role for the first member
          if (firstMember.role_id) {
            const { data: role, error: roleError } = await supabase
              .from("roles")
              .select("*")
              .eq("id", firstMember.role_id)
              .single();

            testResults.step4_role = {
              success: !roleError,
              error: roleError?.message,
              data: role,
            };
          }

          // Step 5: Get the level for the first member
          if (firstMember.level_id) {
            const { data: level, error: levelError } = await supabase
              .from("levels")
              .select("*")
              .eq("id", firstMember.level_id)
              .single();

            testResults.step5_level = {
              success: !levelError,
              error: levelError?.message,
              data: level,
            };
          }
        }
      }

      setResults(testResults);
    } catch (error) {
      console.error("Simple team test error:", error);
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
        <CardTitle>Simple Team Members Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testTeamMembers} disabled={loading}>
          {loading ? "Testing..." : "Test Team Members"}
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
