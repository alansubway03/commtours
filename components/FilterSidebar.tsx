"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { AGENCY_FILTER_OPTIONS } from "@/lib/agencies";
import { X } from "lucide-react";

const REGIONS = ["歐洲", "北美", "亞洲", "澳洲/紐西蘭", "南美", "中東", "非洲", "極地"];
const MONTHS = ["不限", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const types = searchParams.get("types")?.split(",").filter(Boolean) ?? [];
  const regions = searchParams.get("regions")?.split(",").filter(Boolean) ?? [];
  const agencies =
    searchParams.get("agencies")?.split(",").filter(Boolean) ?? [];
  const daysMin = Number(searchParams.get("daysMin")) || 7;
  const daysMax = Number(searchParams.get("daysMax")) || 30;
  const priceMin = Number(searchParams.get("priceMin")) || 0;
  const priceMax = Number(searchParams.get("priceMax")) || 100000;
  const month = searchParams.get("month") ?? "不限";
  const noShopping = searchParams.get("noShopping") === "1";

  const updateParams = (updates: Record<string, string | number>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === "" || v === "不限" || (typeof v === "number" && (k === "priceMin" || k === "daysMin") && v === 0))
        next.delete(k);
      else next.set(k, String(v));
    });
    router.push(`/tours?${next.toString()}`);
  };

  const toggleArray = (key: "types" | "regions" | "agencies", value: string) => {
    const current = searchParams.get(key)?.split(",").filter(Boolean) ?? [];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    updateParams({ [key]: next.join(",") });
  };

  const clearAll = () => router.push("/tours");

  return (
    <aside className="space-y-6 rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">篩選</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="h-4 w-4" />
          清除
        </Button>
      </div>

      <div className="space-y-2">
        <Label>旅行社</Label>
        <div className="flex flex-col gap-2">
          {AGENCY_FILTER_OPTIONS.map((a) => (
            <label
              key={a.slug}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={agencies.includes(a.slug)}
                onCheckedChange={() => toggleArray("agencies", a.slug)}
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>類型</Label>
        <div className="flex flex-col gap-2">
          {TOUR_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={types.includes(t)}
                onCheckedChange={() => toggleArray("types", t)}
              />
              {TOUR_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>地區</Label>
        <div className="flex flex-col gap-2">
          {REGIONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={regions.includes(r)}
                onCheckedChange={() => toggleArray("regions", r)}
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>天數範圍</Label>
        <div className="flex gap-2">
          <Select
            value={String(daysMin)}
            onValueChange={(v) => updateParams({ daysMin: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} 天
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="self-center text-muted-foreground">至</span>
          <Select
            value={String(daysMax)}
            onValueChange={(v) => updateParams({ daysMax: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} 天
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>預算（約 HK$）</Label>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>${(priceMin / 1000).toFixed(0)}k</span>
          <span>-</span>
          <span>${(priceMax / 1000).toFixed(0)}k</span>
        </div>
        <Slider
          min={0}
          max={100000}
          step={5000}
          value={[priceMin, priceMax]}
          onValueChange={([a, b]) => {
            updateParams({ priceMin: a, priceMax: b });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>出發月份</Label>
        <Select value={month} onValueChange={(v) => updateParams({ month: v })}>
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

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={noShopping}
            onCheckedChange={(c) => updateParams({ noShopping: c ? "1" : "0" })}
          />
          無購物團
        </label>
      </div>
    </aside>
  );
}
