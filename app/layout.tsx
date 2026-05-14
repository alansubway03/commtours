import type { Metadata, Viewport } from "next";
import { Noto_Sans_HK } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PWARegister } from "@/components/PWARegister";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://commtours.com";

/** Noto Sans HK = 思源黑體（香港）網頁版，與 Adobe「思源黑體」同源 */
const sourceHanSans = Noto_Sans_HK({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-hk",
  display: "swap",
  adjustFontFallback: true,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "PingFang HK",
    "PingFang TC",
    "Microsoft JhengHei",
    "Heiti TC",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "COMMTOURS | 尋找最適合你的旅行團",
    template: "%s | CommTours",
  },
  description:
    "連結世界，比較精彩。一站篩選香港出發的歐洲深度、潛水、極光、郵輪等長線及特色團體行程，享早鳥優惠。",
  openGraph: {
    title: "COMMTOURS | 尋找最適合你的旅行團",
    description:
      "連結世界，比較精彩。一站篩選香港出發的長線及特色團體行程。",
    type: "website",
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png?v=20260507c", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png?v=20260507c", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffb35c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body className={`${sourceHanSans.variable} min-h-screen font-sans antialiased`}>
        <PWARegister />
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
