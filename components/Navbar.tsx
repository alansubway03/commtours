import { Button } from "@/components/ui/button";
import { SearchPopover } from "@/components/SearchPopover";
import { CommToursLogo } from "@/components/CommToursLogo";
import { getCurrentMember } from "@/lib/memberAuth";
import Link from "next/link";

export async function Navbar() {
  const member = await getCurrentMember();
  const memberLabel = member?.memberName?.trim() ? member.memberName : "登入";

  const isGuest = !member?.memberName?.trim();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="container flex h-14 items-center justify-between gap-3 px-4 sm:h-16">
        <CommToursLogo />
        <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" className="text-foreground/90 hover:bg-muted hover:text-foreground" asChild>
            <Link href="/">首頁</Link>
          </Button>
          <Button variant="ghost" className="text-foreground/90 hover:bg-muted hover:text-foreground" asChild>
            <Link href="/reviews">旅程分享</Link>
          </Button>
          <Button variant="ghost" className="text-foreground/90 hover:bg-muted hover:text-foreground" asChild>
            <Link href="/about">關於我們</Link>
          </Button>
          <SearchPopover />
          {isGuest ? (
            <Link
              href="/member"
              className="ml-0.5 inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              登入
            </Link>
          ) : (
            <Button
              variant="ghost"
              className="ml-0.5 max-w-[9rem] shrink-0 truncate text-foreground/90 hover:bg-muted hover:text-foreground sm:max-w-[12rem]"
              asChild
            >
              <Link href="/member" title={memberLabel}>
                {memberLabel}
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
