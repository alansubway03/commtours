import Image from "next/image";
import Link from "next/link";

/** 導覽列品牌：左上角專用圓形 logo 圖。 */
export function CommToursLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center ${className ?? ""}`}
      aria-label="CommTours 首頁"
    >
      <Image
        src="/logo-header-circle.png?v=20260427a"
        alt="CommTours"
        width={1024}
        height={1024}
        className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
        priority
        sizes="(min-width: 640px) 44px, 40px"
        unoptimized
      />
    </Link>
  );
}
