"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOUR_TYPES, TOUR_TYPE_LABELS } from "@/types/tour";
import { Search } from "lucide-react";

const MONTHS = [
  "不限",
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [destination, setDestination] = useState(searchParams.get("destination") ?? "");
  const [days, setDays] = useState([Number(searchParams.get("days")) || 12]);
  const [types, setTypes] = useState<string[]>(
    searchParams.get("types")?.split(",").filter(Boolean) ?? []
  );
  const [month, setMonth] = useState(searchParams.get("month") ?? "不限");

  const toggleType = (t: string) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (days[0] > 0) params.set("days", String(days[0]));
    if (types.length) params.set("types", types.join(","));
    if (month && month !== "不限") params.set("month", month);
    startTransition(() => {
      router.push(`/tours?${params.toString()}`);
    });
  };

  return (
    <div className="w-full max-w-4xl rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>目的地</Label>
          <Input
            placeholder="例如：歐洲、澳洲"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>最少天數：{days[0]} 天</Label>
          <Slider
            min={7}
            max={30}
            step={1}
            value={days}
            onValueChange={setDays}
          />
        </div>
        <div className="space-y-2">
          <Label>出發月份</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleSearch}
            disabled={isPending}
            className="w-full gap-2 sm:w-auto"
          >
            <Search className="h-4 w-4" />
            搜尋
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <span className="text-sm text-muted-foreground">類型：</span>
        {TOUR_TYPES.map((t) => (
          <label
            key={t}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              checked={types.includes(t)}
              onCheckedChange={() => toggleType(t)}
            />
            {TOUR_TYPE_LABELS[t]}
          </label>
        ))}
      </div>
    </div>
  );
}
