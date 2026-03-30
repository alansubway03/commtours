import Image from "next/image";
import Link from "next/link";

/** 導覽列品牌：源檔 public/logo.png（最長邊 512px，Retina 足夠；此處顯示約 48px 高為常見工具列比例） */
export function CommToursLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 font-semibold ${className ?? ""}`}
      aria-label="CommTours 首頁"
    >
      <Image
        src="/logo.png"
        alt="CommTours"
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 object-contain"
        priority
        sizes="48px"
        unoptimized
      />
      <span className="hidden font-semibold text-foreground sm:inline">
        CommTours
      </span>
    </Link>
  );
}
