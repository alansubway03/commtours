import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "私隱政策",
  description: "CommTours 私隱政策。",
};

export default function PrivacyPage() {
  return (
    <div className="container px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">私隱政策</h1>
          <p className="text-sm text-muted-foreground">最後更新：{new Date().toISOString().slice(0, 10)}</p>
        </header>

        <section className="space-y-3 text-muted-foreground">
          <p>
            本私隱政策說明 CommTours（下稱「本平台」）如何收集、使用、保留及披露你的資料。你使用本平台即表示你已閱讀並理解本私隱政策。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. 我們收集的資料</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>視乎你使用功能，本平台可能收集：</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>你主動提供的資料（例如聯絡我們時提供的姓名、電郵、訊息內容）。</li>
              <li>技術資料（例如裝置/瀏覽器類型、IP 位址、基本存取紀錄），用於安全與網站運作。</li>
              <li>Cookie 或同類技術（如適用），用於偏好設定與流量分析。</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. 使用目的</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>我們可能為以下目的使用資料：</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>回覆查詢、提供支援與合作跟進。</li>
              <li>改善平台功能、內容品質與使用體驗。</li>
              <li>防止濫用、欺詐或安全事件。</li>
              <li>符合法律或監管要求（如適用）。</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. 第三方服務</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              本平台可能使用第三方基礎設施與服務供應商（例如託管、資料庫、分析工具等）以提供服務。該等供應商可能按其服務需要處理相關資料。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. 資料保留</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              我們只會在達成收集目的所需期間內保留資料，或按法律要求保留。其後會刪除或匿名化處理（如適用）。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. 你的權利</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>你可就你的個人資料提出查詢、更正或刪除要求（視乎適用法律）。</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. 聯絡我們</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>如對本私隱政策有任何疑問，請到「聯絡我們」頁面與我們聯繫。</p>
          </div>
        </section>
      </div>
    </div>
  );
}

