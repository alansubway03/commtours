import crypto from "crypto";

export const REFERRAL_PARTNER = "commtours";

function compactAgencyCode(input: string): string {
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  return cleaned || "AGENCY";
}

export function generateRefId(agencyName: string): string {
  const code = compactAgencyCode(agencyName);
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CT-${code}-${day}-${random}`;
}

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
