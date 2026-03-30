import type { MetadataRoute } from "next";
import { getTours } from "@/lib/data/tours";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tours = await getTours();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/tours`,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/disclaimer`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const tourPages: MetadataRoute.Sitemap = tours.map((tour) => ({
    url: `${SITE_URL}/tours/${tour.id}`,
    lastModified: tour.last_updated ? new Date(tour.last_updated) : undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticPages, ...tourPages];
}
