import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
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

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
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
  icons: {
    icon: [{ url: "/favicon.png?v=20260424b", type: "image/png" }],
    shortcut: ["/favicon.png?v=20260424b"],
    apple: [{ url: "/apple-icon.png?v=20260424b", type: "image/png" }],
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
    <html lang="zh-HK" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} min-h-screen antialiased`}
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
