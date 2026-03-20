/**
 * 依標題／目的地推斷側邊欄「地區」分類，修正 DB 誤標（例如歐洲團被寫成亞洲）。
 * 須與 components/FilterSidebar.tsx 的 REGIONS 一致。
 */

export const CANONICAL_REGIONS = [
  "歐洲",
  "北美",
  "亞洲",
  "澳洲/紐西蘭",
  "南美",
  "中東",
  "非洲",
  "極地",
] as const;

export type CanonicalRegion = (typeof CANONICAL_REGIONS)[number];

function countMatches(text: string, pattern: RegExp): number {
  const m = text.match(pattern);
  return m ? m.length : 0;
}

/** 只掃標題＋目的地，避免誤標的 region 干擾推斷 */
function inferFromText(blob: string): CanonicalRegion | null {
  const b = blob;

  if (/南極|北極|格陵蘭|北極圈(?!.*日本)/.test(b)) return "極地";

  if (
    countMatches(
      b,
      /肯亞|坦桑尼亞|南非|納米比亞|津巴布韋|博茨瓦納|埃塞俄比亞|摩洛哥|突尼西亞|馬達加斯加|非洲/g
    ) > 0
  )
    return "非洲";

  if (
    countMatches(
      b,
      /巴西|阿根廷|智利|秘魯|玻利維亞|厄瓜多爾|哥倫比亞|南美|亞馬遜(?!日本)|伊瓜蘇/g
    ) > 0
  )
    return "南美";

  if (
    countMatches(
      b,
      /澳洲|澳大利亞|悉尼|墨爾本|黃金海岸|大堡礁|紐西蘭|新西蘭|皇后鎮|大洋洲/g
    ) > 0
  )
    return "澳洲/紐西蘭";

  if (
    countMatches(
      b,
      /杜拜|迪拜|阿聯酋|阿布扎比|卡塔爾|多哈|約旦|佩特拉|以色列|死海|伊朗|沙地|沙特|中東|埃及(?!尼羅河郵輪)/g
    ) > 0 ||
    /土耳其|伊斯坦堡|伊斯坦布爾|卡帕多奇亞|棉花堡/.test(b)
  ) {
    const euT = countMatches(
      b,
      /希臘|意大利|義大利|法國|瑞士|德國|西班牙|葡萄牙|荷蘭|比利時|奧地利|捷克|北歐|西歐|東歐|歐洲/g
    );
    if (euT === 0) return "中東";
  }

  /** 北歐須先於北美：避免「純美國度」等誤觸「美國」；極光單獨不判歐（黃刀鎮屬北美） */
  if (
    countMatches(
      b,
      /冰島|芬蘭|挪威|瑞典|丹麥|北歐|波羅的海|峽灣/g
    ) > 0
  )
    return "歐洲";

  if (
    countMatches(
      b,
      /美國(?!度)|加拿大|洛杉磯|舊金山|紐約|溫哥華|多倫多|黃刀鎮|阿拉斯加|夏威夷|北美|加勒比(?!海郵)/g
    ) > 0
  )
    return "北美";

  const eu = countMatches(
    b,
    /瑞士|法國|義大利|意大利|西班牙|英國|英倫|德國|德倫|荷蘭|比利時|奧地利|捷克|斯洛伐克|斯洛文尼亞|克羅地亞|匈牙利|羅馬尼亞|保加利亞|波蘭|愛沙尼亞|拉脫維亞|立陶宛|冰島|挪威|瑞典|芬蘭|丹麥|葡萄牙|希臘|西歐|東歐|北歐|南歐|中欧|中歐|歐洲|地中海(?!郵輪.*新加坡)|峽灣|列支敦士登|摩納哥|梵蒂岡|莫斯科|聖彼得堡|俄羅斯(?!伯力)|烏克蘭|巴塞隆拿|阿姆斯特丹|法蘭克福|維也納|布拉格|羅馬|巴黎|倫敦|威尼斯|米蘭|佛羅倫斯|萊茵河|多瑙河|波羅的海|北歐極光|東歐|西葡|瑞法|德捷|英愛/g
  );

  const as = countMatches(
    b,
    /日本|韓國|泰國|泰北|越南|新加坡|星洲|馬來西亞|新馬|星馬|印尼|峇厘|巴厘|菲律賓|台灣|臺灣|尼泊爾|不丹|斯里蘭卡|柬埔寨|吳哥|緬甸|寮國|老撾|清邁|曼谷|首爾|東京|大阪|沖繩|北海道|九州|富士|桂林|雲南|新疆|西藏|內蒙古|上海|北京|西安|張家界|長江三峽|黃山|九寨|華東|華南|絲綢之路|喜馬拉雅|南亞|東南亞|東北亞|亞洲(?!航空)|孟加|加德滿都|河內|胡志明|峴港|芽莊|普吉|清萊|江原道|濟州/g
  );

  if (eu > as) return "歐洲";
  if (as > eu) return "亞洲";

  return null;
}

const RAW_TO_CANONICAL: Record<string, CanonicalRegion> = {
  Europe: "歐洲",
  歐洲: "歐洲",
  西歐: "歐洲",
  東歐: "歐洲",
  北歐: "歐洲",
  南歐: "歐洲",
  中欧: "歐洲",
  中歐: "歐洲",
  Americas: "北美",
  北美: "北美",
  "North America": "北美",
  Asia: "亞洲",
  亞洲: "亞洲",
  Oceania: "澳洲/紐西蘭",
  澳洲: "澳洲/紐西蘭",
  紐西蘭: "澳洲/紐西蘭",
  "South America": "南美",
  南美: "南美",
  "Middle East": "中東",
  中東: "中東",
  Africa: "非洲",
  非洲: "非洲",
  Polar: "極地",
  極地: "極地",
};

export function canonicalTourRegion(tour: {
  title: string;
  destination: string;
  region: string;
}): CanonicalRegion | string {
  const blob = `${tour.title} ${tour.destination}`;
  const inferred = inferFromText(blob);
  if (inferred) return inferred;

  const r = (tour.region || "").trim();
  if (RAW_TO_CANONICAL[r]) return RAW_TO_CANONICAL[r];

  if ((CANONICAL_REGIONS as readonly string[]).includes(r)) return r as CanonicalRegion;

  return r || "—";
}
