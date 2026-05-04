import Link from "next/link";

export function Footer() {
  const footerGroups: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "探索行程",
      links: [
        { label: "長線旅行團", href: "/tours?type=longhaul" },
        { label: "郵輪假期", href: "/tours?type=cruise" },
        { label: "節慶主題", href: "/tours?type=festival" },
        { label: "行山路線", href: "/tours?type=hiking" },
      ],
    },
    {
      title: "平台資訊",
      links: [
        { label: "關於我們", href: "/about" },
        { label: "旅程分享", href: "/reviews" },
        { label: "聯絡合作", href: "/contact" },
      ],
    },
    {
      title: "條款與政策",
      links: [
        { label: "使用條款", href: "/terms" },
        { label: "私隱政策", href: "/privacy" },
        { label: "免責聲明", href: "/disclaimer" },
      ],
    },
    {
      title: "快速入口",
      links: [
        { label: "全部行程", href: "/tours" },
        { label: "熱門精選", href: "/tours?sort=popular" },
        { label: "無購物團", href: "/tours?noShopping=1" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#2a57a3] bg-[#05245a] text-white">
      <div className="container px-4 py-8">
        <div className="grid gap-6 md:grid-cols-12">
          {footerGroups.map((group) => (
            <div key={group.title} className="md:col-span-2 md:border-l md:border-[#2a57a3] md:pl-4">
              <h4 className="mb-3 text-sm font-semibold tracking-wide text-white">{group.title}</h4>
              <ul className="space-y-1.5 text-sm text-[#c0d4ff]">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[#8eb6ff]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-lg border border-[#2a57a3] bg-[#0a2f6b] p-4 md:col-span-2">
            <h4 className="mb-2 text-sm font-semibold">合作與支援</h4>
            <p className="text-sm text-[#c0d4ff]">商務合作、行程更新或平台查詢：</p>
            <Link
              href="mailto:info@commtours.com"
              className="mt-3 inline-block text-sm font-medium text-[#8eb6ff] hover:text-white"
            >
              info@commtours.com
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-[#2a57a3] pt-6 text-center text-sm text-[#c0d4ff]">
          © {new Date().getFullYear()} CommTours. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
