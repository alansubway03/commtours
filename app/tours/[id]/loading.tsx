import { Skeleton } from "@/components/ui/skeleton";

export default function TourDetailLoading() {
  return (
    <div className="container px-4 py-8">
      <Skeleton className="mb-6 h-8 w-24" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="aspect-[21/9] w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl lg:col-span-1" />
      </div>
    </div>
  );
}
