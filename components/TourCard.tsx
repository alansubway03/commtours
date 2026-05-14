import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AffiliateButton } from "@/components/AffiliateButton";
import { pickPrimaryAffiliate } from "@/lib/affiliateLinks";
import { buildTrackedRedirectUrl } from "@/lib/referralUrls";
import { getSafeHttpUrl } from "@/lib/safeExternalUrl";
import type { Tour } from "@/types/tour";
import { TOUR_TYPE_LABELS } from "@/types/tour";
import { Plane, Ship, Mountain, Waves, Calendar } from "lucide-react";

const TYPE_ICONS: Record<Tour["type"], React.ComponentType<{ className?: string }>> = {
  longhaul: Plane,
  cruise: Ship,
  cruise_ticket: Ship,
  hiking: Mountain,
  diving: Waves,
  festival: Calendar,
};

interface TourCardProps {
  tour: Tour;
  showAffiliate?: boolean;
  agencyScore?: number;
}

function destinationOrRegionLine(tour: Tour): string | null {
  const d = (tour.destination ?? "").trim();
  const r = (tour.region ?? "").trim();
  const bad = (s: string) => !s || s === "—" || s === "-";
  if (!bad(d)) return d;
  if (!bad(r)) return r;
  return null;
}

export function TourCard({ tour, showAffiliate = true, agencyScore }: TourCardProps) {
  const Icon = TYPE_ICONS[tour.type];
  const primary = pickPrimaryAffiliate(tour.affiliate_links as Record<string, unknown>);
  const firstLink = primary?.url;
  const placeLine = destinationOrRegionLine(tour);
  const safeWingon = getSafeHttpUrl(tour.affiliate_links.wingon);
  const safeTrip = getSafeHttpUrl(tour.affiliate_links.tripdotcom);
  const trackedWingon = safeWingon
    ? buildTrackedRedirectUrl({
        targetUrl: safeWingon,
        tourId: tour.id,
        agencyName: tour.agency,
        vendor: "wingon",
      })
    : null;
  const trackedTrip = safeTrip
    ? buildTrackedRedirectUrl({
        targetUrl: safeTrip,
        tourId: tour.id,
        agencyName: tour.agency,
        vendor: "tripdotcom",
      })
    : null;
  const trackedPrimary = firstLink
    ? buildTrackedRedirectUrl({
        targetUrl: firstLink,
        tourId: tour.id,
        agencyName: tour.agency,
        vendor: "primary",
      })
    : null;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/tours/${tour.id}`} className="block shrink-0">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={
              getSafeHttpUrl(tour.image_url) ||
              "https://placehold.co/400x200?text=無圖片"
            }
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <Badge variant="secondary" className="gap-1">
              <Icon className="h-3 w-3" />
              {TOUR_TYPE_LABELS[tour.type]}
            </Badge>
            {(tour.days != null && tour.days > 0) && (
              <Badge variant="outline" className="border-background/80 bg-background/80 text-foreground">
                {tour.days} 天
              </Badge>
            )}
          </div>
        </div>
      </Link>
      <Link href={`/tours/${tour.id}`} className="block shrink-0">
        <CardHeader className="space-y-0 p-0 px-6 pb-2 pt-4">
          <div className="min-h-[3.5rem] sm:min-h-[3.75rem]">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug sm:text-[1.05rem]">{tour.title}</h3>
          </div>
          <p className="mt-2.5 line-clamp-2 min-h-[2.75rem] text-sm leading-snug">
            <span className="font-medium text-foreground/90">{tour.agency}</span>
            {typeof agencyScore === "number" ? (
              <span className="ml-1 font-semibold text-amber-700">{agencyScore.toFixed(1)}⭐</span>
            ) : null}
            {placeLine ? (
              <span className="text-muted-foreground"> · {placeLine}</span>
            ) : null}
          </p>
        </CardHeader>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-3 p-0 px-6 pb-2 pt-0">
        <div className="min-h-[2.75rem]">
          <div className="flex flex-wrap gap-1.5">
            {tour.features.slice(0, 3).map((f) => (
              <Badge key={f} variant="outline" className="text-xs">
                {f}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-lg font-semibold leading-snug text-price">
          {tour.price_range.includes("-")
            ? `${tour.price_range.split("-")[0]?.trim()} 起`
            : tour.price_range}
        </p>
      </CardContent>
      {showAffiliate && firstLink && (
        <CardFooter className="mt-auto flex flex-wrap gap-2 border-t border-border p-0 px-6 pb-4 pt-4">
          {trackedWingon && (
            <AffiliateButton vendor="wingon" href={trackedWingon} className="flex-1" />
          )}
          {trackedTrip && (
            <AffiliateButton vendor="tripdotcom" href={trackedTrip} className="flex-1" />
          )}
          {!trackedWingon && !trackedTrip && trackedPrimary && (
            <Button size="sm" className="min-w-0 flex-1" asChild>
              <Link href={trackedPrimary} target="_blank" rel="noopener noreferrer sponsored">
                了解更多
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
      {showAffiliate && !firstLink && (
        <CardFooter className="mt-auto border-t border-border p-0 px-6 pb-4 pt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/tours/${tour.id}`}>查看詳情</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
