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
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/tours/${tour.id}`} className="block">
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
        <CardHeader className="pb-2">
          <h3 className="line-clamp-2 font-semibold leading-tight">{tour.title}</h3>
          <p className="mt-1.5 text-sm leading-snug">
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
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1">
          {tour.features.slice(0, 3).map((f) => (
            <Badge key={f} variant="outline" className="text-xs">
              {f}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-lg font-semibold text-price">
          {tour.price_range.includes("-")
            ? `${tour.price_range.split("-")[0]?.trim()} 起`
            : tour.price_range}
        </p>
      </CardContent>
      {showAffiliate && firstLink && (
        <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
          {trackedWingon && (
            <AffiliateButton vendor="wingon" href={trackedWingon} />
          )}
          {trackedTrip && (
            <AffiliateButton vendor="tripdotcom" href={trackedTrip} />
          )}
          {!trackedWingon && !trackedTrip && trackedPrimary && (
            <Button size="sm" className="flex-1" asChild>
              <Link href={trackedPrimary} target="_blank" rel="noopener noreferrer sponsored">
                {primary?.shortLabel ?? "官網報名"}
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
      {showAffiliate && !firstLink && (
        <CardFooter className="border-t pt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/tours/${tour.id}`}>查看詳情</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
