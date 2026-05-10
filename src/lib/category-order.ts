import type { Category } from "@/lib/types";

// Desired display order on the home page. Each entry is a list of slug
// substrings (case-insensitive); a category is matched to the first entry
// whose patterns include any of its slug's parts. Categories that don't
// match any group fall to the bottom in alphabetical order.
//
// Source-of-truth grouping requested by the owner (May 2026):
//   готовая еда → сладости/десерты → овощи/фрукты/ягоды/зелень →
//   хлеб/выпечка → мясо/птица → молочка/сыр/яйца → рыба/морепродукты →
//   колбасы/деликатесы → напитки → заморозка → бакалея → масла →
//   чай/кофе → орехи → остальное.
const GROUPS: Array<{ key: string; patterns: RegExp[] }> = [
  { key: "ready", patterns: [/pitstsa|burger|sushi|shashlyk|hinkal|supy|salaty/] },
  { key: "sweets", patterns: [/sladost|desert|cake|конфет|мёд|med/i] },
  { key: "produce", patterns: [/ovoshchi|frukt|yagod|zelen|зелен/i] },
  { key: "bakery", patterns: [/khleb|bakery|vypechk/i] },
  { key: "meat", patterns: [/myaso|ptits|kurica|chicken/i] },
  { key: "dairy", patterns: [/molochk|moloko|syry|yaitsa|tvor|sliv|cheese|egg|dairy/i] },
  { key: "fish", patterns: [/ryba|fish|moreprod|seafood/i] },
  { key: "deli", patterns: [/kolbas|sosisk|delikates|sausage|deli/i] },
  { key: "drinks", patterns: [/napitk|drink|sok|voda|water|sok|chay-kofe-no/i] },
  { key: "frozen", patterns: [/zamoroz|frozen|morozhen|ice/i] },
  { key: "grocery", patterns: [/bakaleya|krup|makaron|grech|ris|grocery|spetsii|spice|solenya|konserv/i] },
  { key: "oils", patterns: [/masl|oil|sous|sauce|uksus/i] },
  { key: "tea_coffee", patterns: [/chay|kofe|tea|coffee/i] },
  { key: "nuts", patterns: [/orekh|orehi|nuts|sukhofrukt|dried/i] },
];

function priorityForCategory(cat: Category): number {
  const slug = cat.slug.toLowerCase();
  const name = cat.name.toLowerCase();
  for (let i = 0; i < GROUPS.length; i++) {
    for (const p of GROUPS[i].patterns) {
      if (p.test(slug) || p.test(name)) return i;
    }
  }
  return GROUPS.length;
}

export function sortCategoriesByGroup(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const pa = priorityForCategory(a);
    const pb = priorityForCategory(b);
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, "ru");
  });
}
