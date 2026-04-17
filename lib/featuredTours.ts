export const FEATURED_TOUR_TAG = "熱門行程";

export function hasFeaturedTag(features: string[] | null | undefined): boolean {
  if (!Array.isArray(features)) return false;
  return features.includes(FEATURED_TOUR_TAG);
}

