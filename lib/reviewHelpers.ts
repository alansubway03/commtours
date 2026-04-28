export function reviewOverallAverage(item: {
  itineraryRating: number;
  mealRating: number;
  hotelRating: number;
  guideRating: number;
  valueRating?: number;
}): number {
  const scores = [item.itineraryRating, item.mealRating, item.hotelRating, item.guideRating];
  if (typeof item.valueRating === "number" && Number.isFinite(item.valueRating)) {
    scores.push(item.valueRating);
  }
  return scores.reduce((sum, n) => sum + n, 0) / scores.length;
}

export function commentPreview(comment: string, maxLen = 50): string {
  const t = comment.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}
