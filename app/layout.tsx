import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PWARegister } from "@/components/PWARegister";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
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
    icon: [{ url: "/favicon.png?v=20260505a", type: "image/png" }],
    shortcut: ["/favicon.png?v=20260505a"],
    apple: [{ url: "/apple-icon.png?v=20260505a", type: "image/png" }],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} min-h-screen antialiased`}
      >
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
