"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import WeeklySurveyModal from "./weekly-survey-modal";
import { createClientSupabaseClient } from "@/lib/supabase/client";

export default function WeeklySurveyModalWrapper() {
  const { user, isLoading } = useAuth();
  const [showSurvey, setShowSurvey] = useState(false);
  const [checked, setChecked] = useState(false);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    if (!user || isLoading) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    async function checkSurvey() {
      // Check remind-later flag
      const remindLater = localStorage.getItem("weeklySurveyRemindLater");
      if (remindLater) {
        const remindTime = parseInt(remindLater, 10);
        if (Date.now() - remindTime < 24 * 60 * 60 * 1000) {
          setChecked(true);
          return;
        } else {
          localStorage.removeItem("weeklySurveyRemindLater");
        }
      }
      // Get registration date
      if (!user) return;
      const { data: userProfile } = await supabase
        .from("users")
        .select("created_at")
        .eq("id", user.id)
        .single();
      // Get latest survey
      const { data: lastSurvey } = await supabase
        .from("weekly_progress_surveys")
        .select("survey_date")
        .eq("user_id", user.id)
        .order("survey_date", { ascending: false })
        .limit(1)
        .single();
      const now = new Date();
      let lastSurveyDate = lastSurvey?.survey_date
        ? new Date(lastSurvey.survey_date)
        : userProfile?.created_at
        ? new Date(userProfile.created_at)
        : null;
      if (!lastSurveyDate) {
        setChecked(true);
        return;
      }
      const diffDays =
        (now.getTime() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24);
      if (!cancelled) setShowSurvey(diffDays >= 7);
      setChecked(true);
    }
    checkSurvey();
    return () => {
      cancelled = true;
    };
  }, [user, isLoading, supabase]);

  if (!user || !checked) return null;
  return (
    <WeeklySurveyModal
      open={showSurvey}
      onClose={() => setShowSurvey(false)}
      userId={user.id}
    />
  );
}
