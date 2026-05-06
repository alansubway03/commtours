export function buildTrackedRedirectUrl(params: {
  targetUrl: string;
  tourId: string;
  agencyName: string;
  vendor: string;
}) {
  const qs = new URLSearchParams({
    target: params.targetUrl,
    tourId: params.tourId,
    agency: params.agencyName,
    vendor: params.vendor,
  });
  return `/api/referral/redirect?${qs.toString()}`;
}
