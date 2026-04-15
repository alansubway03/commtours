export function reviewOverallAverage(item: {
  itineraryRating: number;
  mealRating: number;
  hotelRating: number;
  guideRating: number;
}): number {
  return (item.itineraryRating + item.mealRating + item.hotelRating + item.guideRating) / 4;
}

export function commentPreview(comment: string, maxLen = 50): string {
  const t = comment.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}
