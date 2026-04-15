import Image from "next/image";
import Link from "next/link";

/** 導覽列品牌：白底 COMMTOURS 方圖，`/logo-brand.png` 與全站品牌圖同步。 */
export function CommToursLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center ${className ?? ""}`}
      aria-label="CommTours 首頁"
    >
      <Image
        src="/logo-brand.png"
        alt="CommTours"
        width={1024}
        height={1024}
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
        priority
        sizes="(min-width: 640px) 48px, 44px"
        unoptimized
      />
    </Link>
  );
}
