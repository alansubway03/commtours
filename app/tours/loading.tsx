import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToursLoading() {
  return (
    <div className="container px-4 py-8">
      <header className="mb-8">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="mt-2 h-5 w-64" />
      </header>
      <div className="mb-6 h-12 rounded-lg bg-muted/50" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <Skeleton className="h-64 w-56 shrink-0 rounded-lg lg:w-56" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-4 h-7 w-24" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="aspect-[2/1] w-full" />
                </CardHeader>
                <CardContent className="space-y-2.5 p-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-28" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
