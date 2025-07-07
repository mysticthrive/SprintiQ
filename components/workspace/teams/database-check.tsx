"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatabaseCheck() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClientSupabaseClient();

  const checkTables = async () => {
    setLoading(true);
    const tableResults: any = {};

    try {
      // Check teams table
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id")
        .limit(1);

      tableResults.teams = {
        exists: !teamsError,
        error: teamsError?.message,
        data: teamsData,
      };

      // Check roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id")
        .limit(1);

      tableResults.roles = {
        exists: !rolesError,
        error: rolesError?.message,
        data: rolesData,
      };

      // Check levels table
      const { data: levelsData, error: levelsError } = await supabase
        .from("levels")
        .select("id")
        .limit(1);

      tableResults.levels = {
        exists: !levelsError,
        error: levelsError?.message,
        data: levelsData,
      };

      // Check team_members table
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from("team_members")
        .select("id")
        .limit(1);

      tableResults.team_members = {
        exists: !teamMembersError,
        error: teamMembersError?.message,
        data: teamMembersData,
      };

      setResults(tableResults);
    } catch (error) {
      console.error("Database check error:", error);
      setResults({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Database Tables Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkTables} disabled={loading}>
          {loading ? "Checking..." : "Check Database Tables"}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Results:</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
