import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "免責聲明",
  description: "CommTours 免責聲明。",
};

export default function DisclaimerPage() {
  return (
    <div className="container px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">免責聲明</h1>
          <p className="text-sm text-muted-foreground">最後更新：{new Date().toISOString().slice(0, 10)}</p>
        </header>

        <section className="space-y-3 text-muted-foreground">
          <p>
            本平台所提供之旅行團資訊（包括但不限於價錢、出發日期、成團狀況、名額、行程內容、圖片、條款及優惠）僅供參考。
          </p>
          <p className="font-medium text-foreground">
            一切以旅行社／供應商官網及其最終確認為準。用戶在報名或付款前，請務必自行核對最新資料。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第三方交易</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              本平台不處理任何報名、付款、退款或售後服務。點擊連結後所進行的任何交易，均由第三方旅行社／供應商負責。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">更新延遲與錯誤</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              我們會盡力維持資料正確與更新，但資料可能因來源更新、系統延遲或其他原因而出現差異或錯誤。本平台不就此承擔任何責任。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">聯盟／贊助連結（如適用）</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              本平台部分外部連結可能屬聯盟或贊助性質；你透過該等連結完成交易，本平台可能獲取佣金或其他回報，但不會因此影響你向第三方支付的最終條款（以第三方為準）。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

