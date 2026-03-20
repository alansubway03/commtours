import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchPopover } from "@/components/SearchPopover";
import { CommToursLogo } from "@/components/CommToursLogo";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-2 px-4 sm:h-16">
        <CommToursLogo />
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild>
            <Link href="/">首頁</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/about">關於我們</Link>
          </Button>
          <SearchPopover />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
