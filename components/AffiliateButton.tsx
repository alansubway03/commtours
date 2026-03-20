import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getSafeHttpUrl } from "@/lib/safeExternalUrl";

type AffiliateVendor = "wingon" | "tripdotcom";

const VENDOR_LABELS: Record<AffiliateVendor, string> = {
  wingon: "經永安報名",
  tripdotcom: "經 Trip.com 查價",
};

interface AffiliateButtonProps {
  vendor: AffiliateVendor;
  href: string;
  className?: string;
}

export function AffiliateButton({ vendor, href, className }: AffiliateButtonProps) {
  const safe = getSafeHttpUrl(href);
  if (!safe) return null;
  return (
    <Button asChild size="sm" className={className}>
      <Link
        href={safe}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex items-center gap-1.5"
      >
        {VENDOR_LABELS[vendor]}
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}
