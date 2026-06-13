import Image from "next/image";
import Link from "next/link";

/** 導覽列品牌圖標（全站唯一 logo，透明底 PNG）。 */
export function CommToursLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center py-1.5 pl-0.5 pr-1 sm:pl-1 sm:pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`}
      aria-label="CommTours 首頁"
    >
      <Image
        src="/logo.png?v=20260613"
        alt="CommTours"
        width={512}
        height={512}
        className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
        priority
        sizes="(min-width: 640px) 48px, 40px"
        unoptimized
      />
    </Link>
  );
}
