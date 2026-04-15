import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center text-foreground hover:opacity-90"
            >
              <Image
                src="/logo-brand.png"
                alt="CommTours"
                width={1024}
                height={1024}
                className="h-12 w-12 shrink-0 object-contain opacity-95"
                sizes="48px"
                unoptimized
              />
            </Link>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  關於我們
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">合作</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  聯絡我們
                </Link>
              </li>
              <li>
                <Link href="/tours" className="hover:text-foreground">
                  團體列表
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">服務條款</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  使用條款
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  私隱政策
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-foreground">
                  免責聲明
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CommTours. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
