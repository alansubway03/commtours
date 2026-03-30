import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSafeHttpUrl } from "@/lib/safeExternalUrl";
import { getTourById } from "@/lib/data/tours";
import { getTourReviewSummary, getTourReviews } from "@/lib/data/reviews";
import { canonicalTourRegion } from "@/lib/canonicalTourRegion";
import { filterDeparturesForDisplay } from "@/lib/departureDisplay";
import { AffiliateButton } from "@/components/AffiliateButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TourReviewForm } from "@/components/TourReviewForm";
import { TourReviewList } from "@/components/TourReviewList";
import { TOUR_TYPE_LABELS } from "@/types/tour";

const AFFILIATE_EXTRA_LABEL: Record<string, string> = {
  egl: "東瀛遊 官網報名",
  jetour: "捷旅 官網報名",
  goldjoy: "金怡 官網報名",
  wwpkg: "縱橫遊 官網報名",
};
import { Plane, Ship, Mountain, Waves, Calendar, MapPin, CalendarDays } from "lucide-react";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  longhaul: Plane,
  cruise: Ship,
  cruise_ticket: Ship,
  hiking: Mountain,
  diving: Waves,
  festival: Calendar,
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

function parsePriceValue(priceRange: string): string | undefined {
  const nums = priceRange.replace(/[$,]/g, "").match(/\d+/g);
  if (!nums || nums.length === 0) return undefined;
  const parsed = nums.map(Number).filter((n) => Number.isFinite(n));
  if (parsed.length === 0) return undefined;
  return String(Math.min(...parsed));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tour = await getTourById(id);
  if (!tour) return { title: "團體詳情" };
  const ogImage = getSafeHttpUrl(tour.image_url);
  const canonical = `/tours/${tour.id}`;
  return {
    title: `${tour.title} - 香港出發長線團`,
    description: `${tour.destination} · ${tour.days} 天 · ${tour.price_range}`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${tour.title} - 香港出發長線團 | CommTours`,
      description: `${tour.destination} · ${tour.days} 天 · ${tour.price_range}`,
      url: canonical,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: `${tour.title} - 香港出發長線團 | CommTours`,
      description: `${tour.destination} · ${tour.days} 天 · ${tour.price_range}`,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tour = await getTourById(id);
  if (!tour) notFound();
  const [reviewSummary, reviewList] = await Promise.all([
    getTourReviewSummary(id),
    getTourReviews(id),
  ]);

  const Icon = TYPE_ICONS[tour.type] ?? Plane;
  const regionLabel = canonicalTourRegion(tour);
  const departuresShown = filterDeparturesForDisplay(tour.departure_date_statuses ?? []);

  const safeWingon = getSafeHttpUrl(tour.affiliate_links.wingon);
  const safeTrip = getSafeHttpUrl(tour.affiliate_links.tripdotcom);
  const safeOthers = (tour.affiliate_links.others ?? [])
    .map((x, i) => {
      const url = getSafeHttpUrl(x.url);
      if (!url) return null;
      return { label: x.label || "前往連結", url, i };
    })
    .filter((x): x is { label: string; url: string; i: number } => x !== null);
  const safeDynamic = Object.entries(tour.affiliate_links as Record<string, unknown>)
    .filter(
      ([k, v]) =>
        k !== "others" &&
        k !== "wingon" &&
        k !== "tripdotcom" &&
        typeof v === "string"
    )
    .map(([k, v]) => {
      const url = getSafeHttpUrl(v);
      if (!url) return null;
      return { key: k, url };
    })
    .filter((x): x is { key: string; url: string } => x !== null);
  const hasAnyAffiliate =
    !!safeWingon ||
    !!safeTrip ||
    safeOthers.length > 0 ||
    safeDynamic.length > 0;
  const primaryOfferUrl =
    safeWingon ??
    safeTrip ??
    safeOthers[0]?.url ??
    safeDynamic[0]?.url;
  const imageUrl = getSafeHttpUrl(tour.image_url);
  const canonical = `${SITE_URL}/tours/${tour.id}`;
  const priceValue = parsePriceValue(tour.price_range);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.title,
    description: `${tour.destination} · ${tour.days} 天 · ${tour.price_range}`,
    category: TOUR_TYPE_LABELS[tour.type],
    brand: {
      "@type": "Brand",
      name: tour.agency,
    },
    image: imageUrl ? [imageUrl] : undefined,
    url: canonical,
    offers: primaryOfferUrl
      ? {
          "@type": "Offer",
          priceCurrency: "HKD",
          price: priceValue,
          availability: "https://schema.org/InStock",
          url: primaryOfferUrl,
        }
      : undefined,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首頁",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "旅行團列表",
        item: `${SITE_URL}/tours`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tour.title,
        item: canonical,
      },
    ],
  };

  return (
    <div className="container px-4 py-6 md:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav
        aria-label="麵包屑導覽"
        className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:underline">
          首頁
        </Link>
        <span>/</span>
        <Link href="/tours" className="hover:underline">
          旅行團列表
        </Link>
        <span>/</span>
        <span className="max-w-[70vw] truncate">{tour.title}</span>
      </nav>
      <div className="mb-4 md:mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tours">← 返回列表</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={
                getSafeHttpUrl(tour.image_url) ||
                "https://placehold.co/800x340?text=無圖片"
              }
              alt={tour.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <Icon className="h-3 w-3" />
                {TOUR_TYPE_LABELS[tour.type]}
              </Badge>
              {regionLabel !== "—" && (
                <Badge variant="outline" className="border-white/80 bg-black/40 text-white">
                  {regionLabel}
                </Badge>
              )}
              <Badge variant="outline" className="border-white/80 bg-black/40 text-white">
                {tour.days} 天
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">{tour.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tour.destination}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {tour.days} 天
                </span>
                <span>{tour.agency}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">價錢範圍</h3>
                <p className="text-xl font-bold text-price">{tour.price_range}</p>
              </div>
              {departuresShown.length > 0 ? (
                <div>
                  <h3 className="mb-2 font-semibold">出發日期與成團狀況</h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {departuresShown.map(({ date, status }, i) => (
                      <li key={`${date}-${i}`} className="flex flex-wrap items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{date}</span>
                        <Badge variant={status === "成團" ? "default" : "secondary"} className="text-xs">
                          {status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {tour.features.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">特色</h3>
                  <div className="flex flex-wrap gap-2">
                    {tour.features.map((f) => (
                      <Badge key={f} variant="secondary">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {tour.last_updated && (
                <p className="text-xs text-muted-foreground">
                  最後更新：{tour.last_updated}
                </p>
              )}
            </CardContent>
          </Card>

          <TourReviewForm tourId={tour.id} />
          <TourReviewList summary={reviewSummary} reviews={reviewList} />
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <h3 className="font-semibold">報名 / 查價</h3>
              <p className="text-sm text-muted-foreground">
                前往旅行社官網完成報名或查詢最新價格
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {safeWingon && (
                <AffiliateButton vendor="wingon" href={safeWingon} className="w-full" />
              )}
              {safeTrip && (
                <AffiliateButton vendor="tripdotcom" href={safeTrip} className="w-full" />
              )}
              {safeOthers.map(({ label, url, i }) => (
                <Button key={`${url}-${i}`} asChild variant="outline" className="w-full">
                  <Link href={url} target="_blank" rel="noopener noreferrer sponsored">
                    {label}
                  </Link>
                </Button>
              ))}
              {safeDynamic.map(({ key, url }) => (
                <Button key={key} asChild className="w-full">
                  <Link href={url} target="_blank" rel="noopener noreferrer sponsored">
                    {AFFILIATE_EXTRA_LABEL[key] ?? `${key} 官網報名`}
                  </Link>
                </Button>
              ))}
              {!hasAnyAffiliate && (
                <Button variant="outline" disabled className="w-full">
                  暫無報名連結
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
