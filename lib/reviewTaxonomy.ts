const EUROPE_KEYWORDS = [
  "歐洲",
  "英國",
  "法國",
  "德國",
  "意大利",
  "義大利",
  "西班牙",
  "葡萄牙",
  "瑞士",
  "奧地利",
  "捷克",
  "匈牙利",
  "荷蘭",
  "比利時",
  "挪威",
  "瑞典",
  "芬蘭",
  "丹麥",
  "希臘",
  "土耳其",
];

const NORTH_AMERICA_KEYWORDS = [
  "北美",
  "美國",
  "加拿大",
  "阿拉斯加",
  "墨西哥",
  "洛杉磯",
  "紐約",
  "溫哥華",
  "多倫多",
];
const ASIA_KEYWORDS = [
  "亞洲",
  "日本",
  "韓國",
  "台灣",
  "泰國",
  "越南",
  "新加坡",
  "馬來西亞",
  "中國",
  "印度",
  "尼泊爾",
];
const AFRICA_KEYWORDS = ["非洲", "南非", "摩洛哥", "肯亞", "坦桑尼亞", "埃及", "博茨瓦納", "津巴布韋"];
const AUSTRALIA_KEYWORDS = [
  "澳洲",
  "澳大利亞",
  "悉尼",
  "墨爾本",
  "布里斯本",
  "珀斯",
  "塔斯曼尼亞",
  "新西蘭",
  "紐西蘭",
];
const SOUTH_AMERICA_KEYWORDS = ["南美", "巴西", "阿根廷", "智利", "秘魯", "玻利維亞", "厄瓜多爾"];
const MIDDLE_EAST_KEYWORDS = ["中東", "杜拜", "迪拜", "阿聯酋", "阿布扎比", "卡塔爾", "以色列", "約旦", "沙特"];
const POLAR_CRUISE_KEYWORDS = ["極地", "郵輪", "南極", "北極", "格陵蘭", "極光郵輪", "cruise", "Cruise"];

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function toCountryCategory(destination: string): string {
  const text = destination.trim();
  if (!text) return "亞洲";
  if (containsAny(text, POLAR_CRUISE_KEYWORDS)) return "極地及郵輪";
  if (containsAny(text, MIDDLE_EAST_KEYWORDS)) return "中東";
  if (containsAny(text, SOUTH_AMERICA_KEYWORDS)) return "南美";
  if (containsAny(text, NORTH_AMERICA_KEYWORDS)) return "北美";
  if (containsAny(text, ASIA_KEYWORDS)) return "亞洲";
  if (containsAny(text, EUROPE_KEYWORDS)) return "歐洲";
  if (containsAny(text, AUSTRALIA_KEYWORDS)) return "澳洲/紐西蘭";
  if (containsAny(text, AFRICA_KEYWORDS)) return "非洲";
  return "亞洲";
}
