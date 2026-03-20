import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使用條款",
  description: "CommTours 使用條款。",
};

export default function TermsPage() {
  return (
    <div className="container px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">使用條款</h1>
          <p className="text-sm text-muted-foreground">最後更新：{new Date().toISOString().slice(0, 10)}</p>
        </header>

        <section className="space-y-3 text-muted-foreground">
          <p>
            歡迎使用 CommTours（下稱「本平台」）。你使用本平台即表示你同意本使用條款。如你不同意，請停止使用本平台。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. 平台性質</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>本平台提供旅行團資料整理、搜尋及比較等資訊服務，僅供參考。</p>
            <p>
              報名、付款、合約成立、退款及售後安排均由第三方旅行社／供應商及其網站或渠道處理，本平台並非交易一方。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. 資料準確性與更新</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              我們會盡力維持資料更新，但不保證資訊（包括價錢、出發日、成團狀況、名額、行程內容、圖片、條款等）即時或完全準確。
            </p>
            <p>最終資料以旅行社／供應商官網或正式文件為準。</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. 第三方連結</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              本平台可能提供第三方網站連結。第三方網站內容、服務、可用性、價格及政策由其自行負責，本平台不作任何保證或承擔責任。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. 知識產權</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              本平台的介面設計、文字、商標（如適用）及程式等受知識產權法例保障。未經許可，不得複製、改作、發佈或用作商業用途。
            </p>
            <p>第三方旅行社／供應商的商標、圖片及內容版權屬其持有人，本平台僅作識別與資訊展示用途。</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. 責任限制</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              在法律允許範圍內，本平台對因使用或無法使用本平台、或因依賴本平台資訊而引致的任何損失（包括直接或間接損失）概不負責。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. 條款變更</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>我們可不時更新本條款。更新後你繼續使用本平台，即視為接受更新內容。</p>
          </div>
        </section>
      </div>
    </div>
  );
}

