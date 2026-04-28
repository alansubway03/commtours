import type { Metadata } from "next";
import Link from "next/link";
import { getTours } from "@/lib/data/tours";
import { ReviewShareFormClient } from "@/components/ReviewShareFormClient";

export const metadata: Metadata = {
  title: "分享行程",
  description: "選擇旅行團並提交你的參團評分與分享。",
};

export default async function ReviewSharePage() {
  const tours = await getTours();
  const items = tours.map((tour) => ({
    id: tour.id,
    agency: tour.agency,
    destination: tour.destination,
  }));

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">分享行程</h1>
          <p className="text-sm text-muted-foreground">
            直接填 form 提交分享，按旅行社與國家分類配對對應旅行團資料。
          </p>
          <p className="text-sm">
            <Link href="/reviews" className="text-primary hover:underline">
              ← 返回旅程分享列表
            </Link>
          </p>
        </header>

        <ReviewShareFormClient tours={items} />
      </div>
    </div>
  );
}
