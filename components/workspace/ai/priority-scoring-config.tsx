import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { DEFAULT_WEIGHTS } from "@/types";

export interface PriorityWeights {
  businessValue: number;
  userImpact: number;
  complexity: number;
  risk: number;
  dependencies: number;
}

interface PriorityScoringConfigProps {
  weights: PriorityWeights;
  onChange: (weights: PriorityWeights) => void;
  onReset: () => void;
}

export default function PriorityScoringConfig({
  weights,
  onChange,
  onReset,
}: PriorityScoringConfigProps) {
  const [localWeights, setLocalWeights] = useState<PriorityWeights>(weights);
  const [totalWeight, setTotalWeight] = useState(100);

  useEffect(() => {
    const total =
      localWeights.businessValue +
      localWeights.userImpact +
      localWeights.complexity +
      localWeights.risk +
      localWeights.dependencies;
    setTotalWeight(total);
  }, [localWeights]);

  // Update local weights when props change
  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleWeightChange = (key: keyof PriorityWeights, value: number) => {
    const newWeights = { ...localWeights, [key]: value };
    setLocalWeights(newWeights);
    onChange(newWeights);
  };

  const handleReset = () => {
    setLocalWeights(DEFAULT_WEIGHTS);
    onChange(DEFAULT_WEIGHTS);
    onReset();
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 30) return "bg-green-500";
    if (weight >= 20) return "bg-blue-500";
    if (weight >= 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Priority Scoring Weights</span>
        <Button
          variant="outline"
          className="text-xs h-8 p-1"
          onClick={handleReset}
        >
          <RefreshCw className="h-3 w-3" />
          Reset to Default
        </Button>
      </div>
      <div className="space-y-4">
        {Object.entries(localWeights).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={key} className="capitalize text-xs">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <Badge className={getWeightColor(value)}>{value}%</Badge>
            </div>
            <Slider
              id={key}
              variant="workspace"
              min={0}
              max={100}
              step={5}
              value={[value]}
              onValueChange={([newValue]) =>
                handleWeightChange(key as keyof PriorityWeights, newValue)
              }
            />
          </div>
        ))}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-xs">Total Weight:</span>
          <Badge
            variant={totalWeight === 100 ? "default" : "destructive"}
            className="text-xs"
          >
            {totalWeight}%
          </Badge>
        </div>

        {totalWeight !== 100 && (
          <div className="mt-4 p-2 bg-destructive/10 text-destructive rounded-md text-sm">
            Total weight must equal 100%. Current total: {totalWeight}%
          </div>
        )}
      </div>
    </div>
  );
}
