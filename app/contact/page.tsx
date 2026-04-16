import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "聯絡我們",
  description: "聯絡 CommTours 合作與查詢。",
};

const CONTACT_EMAIL = "info@commtours.com";

export default function ContactPage() {
  return (
    <div className="container px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">聯絡我們</h1>
          <p className="text-muted-foreground">
            合作上架、資料更正/下架、或一般查詢，都可以用以下方式聯絡。
          </p>
        </header>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">電郵</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              請電郵至{" "}
              <Link className="font-medium text-foreground underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("CommTours 查詢")}`}>
                  立即發送電郵
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/privacy">查看私隱政策</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              如你要求更正/下架資料，建議附上：旅行社名稱、行程名稱、相關連結、以及你希望更正的內容。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

