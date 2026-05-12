import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getSafeHttpUrl } from "@/lib/safeExternalUrl";
import { cn } from "@/lib/utils";

/** 站內導流（相對路徑）；getSafeHttpUrl 只接受 http(s)，否則永安／Trip 按鈕會被誤判為不安全而不渲染 */
function safeAffiliateHref(href: string): string | null {
  const t = href.trim();
  if (t.startsWith("/api/referral/redirect?")) return t;
  return getSafeHttpUrl(t);
}

type AffiliateVendor = "wingon" | "tripdotcom";

interface AffiliateButtonProps {
  vendor: AffiliateVendor;
  href: string;
  className?: string;
}

export function AffiliateButton({ vendor: _vendor, href, className }: AffiliateButtonProps) {
  void _vendor;
  const safe = safeAffiliateHref(href);
  if (!safe) return null;
  return (
    <Button asChild size="sm" className={cn("min-w-0", className)}>
      <Link
        href={safe}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex w-full min-w-0 items-center justify-center gap-1.5"
        aria-label="了解更多（於新分頁開啟旅行社連結）"
      >
        了解更多
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}
