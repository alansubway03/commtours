import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchPopover } from "@/components/SearchPopover";
import { CommToursLogo } from "@/components/CommToursLogo";
import { getCurrentMember } from "@/lib/memberAuth";
import Link from "next/link";

export async function Navbar() {
  const member = await getCurrentMember();
  const memberLabel = member?.memberName?.trim() ? member.memberName : "登入";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="container flex h-14 items-center justify-between gap-2 px-4 sm:h-16">
        <CommToursLogo />
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild>
            <Link href="/">首頁</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/reviews">旅程分享</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/about">關於我們</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/member">{memberLabel}</Link>
          </Button>
          <SearchPopover />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
