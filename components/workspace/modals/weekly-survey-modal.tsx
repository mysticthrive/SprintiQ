import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import {
  CheckCircle,
  CalendarCheck,
  Sparkles,
  Clock,
  SquareCheckBig,
  ChartNoAxesCombined,
  Laugh,
  Angry,
  Frown,
  Annoyed,
  Smile,
  Bot,
  Link,
  Dock,
  Zap,
  Users,
  HelpCircle,
  Plus,
  GraduationCap,
  ShieldCheck,
  CircleCheck,
  ThumbsUp,
  Sparkle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const challenges = [
  "Learning curve with new interface",
  "AI suggestions not matching my style",
  "Integration issues with existing tools",
  "Story quality concerns",
  "Performance/speed issues",
  "Team adoption challenges",
  "Missing features I need",
  "Other",
];

export type WeeklySurveyData = {
  timeInvestment: number;
  storiesCreated: number;
  timeSavingsPerceived: number;
  satisfactionLevel: number;
  challengesFaced: string[];
  wouldRecommend: null | boolean;
  specificImprovements: string;
};

const initialWeeklyData: WeeklySurveyData = {
  timeInvestment: 0,
  storiesCreated: 0,
  timeSavingsPerceived: 0,
  satisfactionLevel: 3,
  challengesFaced: [],
  wouldRecommend: null,
  specificImprovements: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

export default function WeeklySurveyModal({ open, onClose, userId }: Props) {
  const [weeklyData, setWeeklyData] =
    useState<WeeklySurveyData>(initialWeeklyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClientSupabaseClient();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [remindLaterChecked, setRemindLaterChecked] = useState(false);

  useEffect(() => {
    // Try to fetch registration date and calculate week number
    async function fetchWeek() {
      const { data: userProfile } = await supabase
        .from("users")
        .select("created_at")
        .eq("id", userId)
        .single();
      if (userProfile?.created_at) {
        const regDate = new Date(userProfile.created_at);
        const now = new Date();
        const diffWeeks =
          Math.floor(
            (now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
          ) + 1;
        setCurrentWeek(diffWeeks);
      }
    }
    if (userId) fetchWeek();
  }, [userId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (step < totalSteps) {
      // Don't submit if not on the last step
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await supabase.from("weekly_progress_surveys").insert({
        user_id: userId,
        survey_date: new Date().toISOString().slice(0, 10),
        time_investment_hours: weeklyData.timeInvestment,
        stories_created: weeklyData.storiesCreated,
        perceived_time_savings: weeklyData.timeSavingsPerceived,
        satisfaction_level: weeklyData.satisfactionLevel,
        challenges_faced: weeklyData.challengesFaced,
        would_recommend: weeklyData.wouldRecommend,
        specific_improvements: weeklyData.specificImprovements,
      });
      localStorage.removeItem("weeklySurveyRemindLater");
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit survey");
    } finally {
      setLoading(false);
    }
  };

  const handleRemindLater = () => {
    localStorage.setItem("weeklySurveyRemindLater", Date.now().toString());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl mx-auto p-0 border-0 rounded-2xl shadow-2xl overflow-hidden">
        <DialogTitle className="sr-only">Weekly Progress Survey</DialogTitle>
        {/* Header */}
        <div className="workspace-primary px-8 py-6 flex items-center gap-4">
          <CalendarCheck className="h-10 w-10 text-white drop-shadow-lg" />
          <div>
            <div className="text-lg font-semibold text-white flex items-center gap-2">
              Week {currentWeek} Progress Check
              <Sparkles className="h-5 w-5 text-white/80 animate-pulse" />
            </div>
            <div className="text-white/90 text-sm">
              Help us understand how SprintiQ is working for you this week.
            </div>
          </div>
        </div>
        {/* Stepper Progress Bar */}
        <div className="w-full px-8 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300
                  ${
                    step === s
                      ? "workspace-primary text-white scale-110"
                      : step > s
                      ? "workspace-component-bg text-workspace-primary"
                      : "bg-gray-200 text-gray-400 border-gray-200"
                  }
                `}
                >
                  {step > s ? (
                    <CheckCircle className="h-5 w-5 text-workspace-primary" />
                  ) : (
                    s
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    step === s ? "text-workspace-primary" : "text-gray-400"
                  }`}
                >
                  {s === 1 && "Time"}
                  {s === 2 && "Satisfaction"}
                  {s === 3 && "Challenges"}
                  {s === 4 && "Recommend"}
                  {s === 5 && "Final"}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 workspace-primary rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
        {/* Thank You State */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <CheckCircle className="h-16 w-16 text-workspace-primary mb-4 animate-bounce" />
            <div className="text-2xl font-bold text-workspace-primary mb-2">
              Thank you for your feedback!
            </div>
            <div className="text-gray-600 text-center max-w-md">
              Your input helps us improve SprintiQ for you and your team.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
            {/* Step 1: Time investment & stories created */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Time Investment */}
                <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Hours spent using SprintiQ
                    this week
                  </label>
                  <Input
                    type="number"
                    variant="workspace"
                    step="0.5"
                    value={weeklyData.timeInvestment || ""}
                    onChange={(e) =>
                      setWeeklyData({
                        ...weeklyData,
                        timeInvestment: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 2.5"
                    min={0}
                    max={40}
                    required
                    className="mt-1"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Estimate your total hours for this week.
                  </div>
                </div>
                {/* Stories Created */}
                <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                    <SquareCheckBig className="w-4 h-4" /> Stories
                    created/refined this week
                  </label>
                  <Input
                    type="number"
                    variant="workspace"
                    value={weeklyData.storiesCreated || ""}
                    onChange={(e) =>
                      setWeeklyData({
                        ...weeklyData,
                        storiesCreated: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 12"
                    min={0}
                    max={200}
                    required
                    className="mt-1"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    How many user stories did you work on?
                  </div>
                </div>
              </div>
            )}
            {/* Step 2: Perceived time savings & satisfaction */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Perceived Time Savings */}
                <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                    <ChartNoAxesCombined className="w-4 h-4" /> Perceived time
                    savings (%)
                  </label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="range"
                      min={0}
                      max={100}
                      value={weeklyData.timeSavingsPerceived}
                      onChange={(e) =>
                        setWeeklyData({
                          ...weeklyData,
                          timeSavingsPerceived: parseInt(e.target.value),
                        })
                      }
                      className="flex-1 workspace-accent"
                    />
                    <span className="text-lg font-semibold w-12 text-workspace-primary">
                      {weeklyData.timeSavingsPerceived}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>No savings</span>
                    <span>Massive savings</span>
                  </div>
                </div>
                {/* Satisfaction Level */}
                <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                    <Laugh className="w-4 h-4" /> Overall satisfaction this week
                  </label>
                  <div className="flex space-x-2 mt-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          setWeeklyData({
                            ...weeklyData,
                            satisfactionLevel: rating,
                          })
                        }
                        className={`w-12 h-12 flex items-center rounded-full transition-all duration-150 text-3xl shadow-sm ${
                          weeklyData.satisfactionLevel === rating
                            ? " scale-110"
                            : "bg-transparent text-gray-400"
                        }`}
                      >
                        {rating === 1 && (
                          <Angry
                            className={`w-8 h-8 ${
                              weeklyData.satisfactionLevel === rating
                                ? "text-workspace-primary"
                                : "text-gray-500"
                            }`}
                          />
                        )}
                        {rating === 2 && (
                          <Frown
                            className={`w-8 h-8 ${
                              weeklyData.satisfactionLevel === rating
                                ? "text-workspace-primary"
                                : "text-gray-500"
                            }`}
                          />
                        )}
                        {rating === 3 && (
                          <Annoyed
                            className={`w-8 h-8 ${
                              weeklyData.satisfactionLevel === rating
                                ? "text-workspace-primary"
                                : "text-gray-500"
                            }`}
                          />
                        )}
                        {rating === 4 && (
                          <Smile
                            className={`w-8 h-8 ${
                              weeklyData.satisfactionLevel === rating
                                ? "text-workspace-primary"
                                : "text-gray-500"
                            }`}
                          />
                        )}
                        {rating === 5 && (
                          <Laugh
                            className={`w-8 h-8 ${
                              weeklyData.satisfactionLevel === rating
                                ? "text-workspace-primary"
                                : "text-gray-500"
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    1 = Not satisfied, 5 = Extremely satisfied
                  </div>
                </div>
              </div>
            )}
            {/* Step 3: Challenges faced */}
            {step === 3 && (
              <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                  <CircleCheck className="w-4 h-4" /> Challenges faced (select
                  all that apply)
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {challenges.map((challenge, idx) => {
                    const icon =
                      challenge === "Learning curve with new interface" ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : challenge ===
                        "AI suggestions not matching my style" ? (
                        <Bot className="w-4 h-4" />
                      ) : challenge ===
                        "Integration issues with existing tools" ? (
                        <Link className="w-4 h-4" />
                      ) : challenge === "Story quality concerns" ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : challenge === "Performance/speed issues" ? (
                        <Zap className="w-4 h-4" />
                      ) : challenge === "Team adoption challenges" ? (
                        <Users className="w-4 h-4" />
                      ) : challenge === "Missing features I need" ? (
                        <HelpCircle className="w-4 h-4" />
                      ) : challenge === "Other" ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        ""
                      );
                    const selected =
                      weeklyData.challengesFaced.includes(challenge);
                    return (
                      <button
                        key={challenge}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setWeeklyData({
                              ...weeklyData,
                              challengesFaced:
                                weeklyData.challengesFaced.filter(
                                  (c) => c !== challenge
                                ),
                            });
                          } else {
                            setWeeklyData({
                              ...weeklyData,
                              challengesFaced: [
                                ...weeklyData.challengesFaced,
                                challenge,
                              ],
                            });
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 
                          ${
                            selected
                              ? "workspace-component-bg text-workspace-primary border-workspace-primary scale-105 shadow-md"
                              : "bg-white text-gray-700 border-gray-200 hover:workspace-component-bg hover:border-workspace-primary hover:text-workspace-primary"
                          }
                        `}
                        aria-pressed={selected}
                      >
                        {icon && <span className="text-lg">{icon}</span>}
                        {challenge}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Step 4: Would recommend & improvements */}
            {step === 4 && (
              <div className="grid grid-cols-1 gap-8">
                {/* Would Recommend */}
                <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" /> Would you recommend
                    SprintiQ?
                  </label>
                  <div className="flex space-x-4 mt-2">
                    <label
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all duration-150 text-sm font-medium shadow-sm ${
                        weeklyData.wouldRecommend === true
                          ? "workspace-component-bg workspace-component-active-border text-workspace-primary"
                          : "bg-white border-gray-200 text-gray-600 hover:workspace-component-bg hover:workspace-component-active-border"
                      }`}
                    >
                      <Input
                        type="radio"
                        name="recommend"
                        value="yes"
                        variant="workspace"
                        checked={weeklyData.wouldRecommend === true}
                        onChange={() =>
                          setWeeklyData({
                            ...weeklyData,
                            wouldRecommend: true,
                          })
                        }
                      />
                      Yes
                    </label>
                    <label
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all duration-150 text-sm font-medium shadow-sm ${
                        weeklyData.wouldRecommend === false
                          ? "workspace-component-bg workspace-component-active-border text-workspace-primary"
                          : "bg-white border-gray-200 text-gray-600 hover:workspace-component-bg hover:workspace-component-active-border"
                      }`}
                    >
                      <Input
                        type="radio"
                        name="recommend"
                        value="no"
                        variant="workspace"
                        checked={weeklyData.wouldRecommend === false}
                        onChange={() =>
                          setWeeklyData({
                            ...weeklyData,
                            wouldRecommend: false,
                          })
                        }
                      />
                      No
                    </label>
                  </div>
                </div>
                {/* Specific Improvements */}
                <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Specific improvements
                    noticed (optional)
                  </label>
                  <Textarea
                    value={weeklyData.specificImprovements}
                    onChange={(e) =>
                      setWeeklyData({
                        ...weeklyData,
                        specificImprovements: e.target.value,
                      })
                    }
                    variant="workspace"
                    rows={3}
                    placeholder="e.g., Stories are more consistent, team understands requirements better, less back-and-forth with developers..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="flex flex-col items-center justify-center py-20 px-8">
                <CheckCircle className="h-16 w-16 text-workspace-primary mb-4 animate-bounce" />
                <div className="text-2xl font-bold text-workspace-primary mb-2">
                  Thank you for your feedback!
                </div>
                <div className="text-gray-600 text-center max-w-md">
                  Your input helps us improve SprintiQ for you and your team.
                </div>
              </div>
            )}
            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm mb-4 mt-4">{error}</div>
            )}
            {/* Stepper Navigation */}
            <div className="flex justify-between gap-3 pt-8 mt-8 border-t border-gray-100 sticky bottom-0 bg-white z-10">
              {step === 1 ? (
                <div className="flex items-center">
                  <Checkbox
                    id="remind-later-checkbox"
                    checked={remindLaterChecked}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setRemindLaterChecked(isChecked);
                      if (isChecked) {
                        handleRemindLater();
                      }
                    }}
                    variant="workspace"
                    className="mr-2"
                  />
                  <label
                    htmlFor="remind-later-checkbox"
                    className="text-sm text-gray-700 select-none cursor-pointer"
                  >
                    Remind me later
                  </label>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="rounded-lg px-6 py-2"
                >
                  Back
                </Button>
              )}
              {step < totalSteps ? (
                <Button
                  type="button"
                  variant="workspace"
                  onClick={() => {
                    setStep(step + 1);
                  }}
                  className="rounded-lg px-8 py-2 font-semibold shadow-md"
                  disabled={
                    (step === 1 &&
                      (!weeklyData.timeInvestment ||
                        !weeklyData.storiesCreated)) ||
                    (step === 2 && weeklyData.satisfactionLevel === 0)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="workspace"
                  disabled={loading}
                  className="rounded-lg px-8 py-2 font-semibold shadow-md"
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
