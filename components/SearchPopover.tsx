"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { TOUR_TYPES, TOUR_TYPE_LABELS } from "@/types/tour";
import { Search } from "lucide-react";

const MONTHS = [
  "不限",
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export function SearchPopover() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState([12]);
  const [types, setTypes] = useState<string[]>([]);
  const [month, setMonth] = useState("不限");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (panelRef.current?.contains(el)) return;
      if (el.closest("[data-search-panel]")) return;
      if (el.closest("button[data-search-trigger]")) return;
      setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

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
    setOpen(false);
    router.push(`/tours?${params.toString()}`);
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen((v) => !v)}
        data-search-trigger
        aria-label="搜尋行程"
      >
        <Search className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] bg-neutral-950/55"
            aria-label="關閉篩選"
            onClick={() => setOpen(false)}
          />
          <div
            data-search-panel
            className="fixed left-1/2 top-[max(4.5rem,12vh)] z-[101] w-[min(calc(100vw-1.5rem),380px)] -translate-x-1/2 rounded-xl border-2 border-border bg-card p-5 text-card-foreground shadow-2xl"
          >
          <p className="mb-3 text-base font-semibold text-foreground">篩選行程</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">目的地</Label>
              <Input
                placeholder="例如：歐洲、澳洲"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 h-8"
              />
            </div>
            <div>
              <Label className="text-xs">最少天數：{days[0]} 天</Label>
              <Slider
                min={7}
                max={30}
                step={1}
                value={days}
                onValueChange={setDays}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="search-month" className="text-xs">
                出發月份
              </Label>
              {/* 原生 select：選單由系統繪製，不會像 Radix Portal 一樣觸發「外點關閉」 */}
              <select
                id="search-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="mt-1 flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">類型</span>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                {TOUR_TYPES.map((t) => (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-1.5 text-xs"
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
            <Button onClick={handleSearch} size="sm" className="mt-2 w-full gap-2">
              <Search className="h-3.5 w-3.5" />
              搜尋
            </Button>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
