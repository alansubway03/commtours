import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PWARegister } from "@/components/PWARegister";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CommTours | 香港出發長線及特色團比價",
    template: "%s | CommTours",
  },
  description:
    "連結世界，比較精彩。一站篩選香港出發的歐洲深度、潛水、極光、郵輪等長線及特色團體行程，享早鳥優惠。",
  openGraph: {
    title: "CommTours | 香港出發長線及特色團比價",
    description:
      "連結世界，比較精彩。一站篩選香港出發的長線及特色團體行程。",
    type: "website",
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
  // 瀏覽器分頁／加入主畫面圖示：使用 app/icon.png、app/apple-icon.png（與 public/logo.png 同圖，由 prepare-logo 同步）
};

export const viewport: Viewport = {
  themeColor: "#545b6a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PWARegister />
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
