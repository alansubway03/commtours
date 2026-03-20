"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function TourDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-12">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">無法載入團體詳情</h2>
      <p className="text-center text-muted-foreground">
        {error.message || "請稍後再試或返回列表。"}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/tours">返回列表</Link>
        </Button>
        <Button onClick={reset}>重試</Button>
      </div>
    </div>
  );
}
