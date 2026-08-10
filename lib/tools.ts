import { categoryOrder, tools, type Tool } from '@/data/tools';

/** Tool cu campurile derivate de care are nevoie UI-ul. */
export interface HubTool extends Tool {
  /** Cheie stabila pentru React + localStorage (derivata din URL + nume). */
  id: string;
  /** Hostname curat, afisat monospace pe card. */
  host: string;
  /** Text pre-normalizat pentru cautare (fara diacritice, lowercase). */
  haystack: string;
}

export const ALL_CATEGORIES = '__all__';

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Scoate diacriticele si trece la lowercase, ca sa mearga "sters" == "sters". */
export function normalize(input: string): string {
  return input.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
}

function slugify(input: string): string {
  return normalize(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** URL-ul catre favicon-ul serviciului Google (fallback pe emoji in UI). */
export function faviconUrl(url: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostOf(url))}&sz=${size}`;
}

export const hubTools: HubTool[] = tools.map((tool) => ({
  ...tool,
  id: `${slugify(tool.name)}--${slugify(hostOf(tool.url))}`,
  host: hostOf(tool.url),
  haystack: normalize(
    [tool.name, tool.shortDescription, tool.details, tool.category, tool.url].join('   '),
  ),
}));

/** Categoriile prezente in date, in ordinea din `categoryOrder`, restul la final. */
export const categories: string[] = (() => {
  const present = new Set(hubTools.map((tool) => tool.category));
  const ordered = categoryOrder.filter((category) => present.has(category));
  const extras = [...present].filter((category) => !ordered.includes(category));
  return [...ordered, ...extras];
})();

export function countByCategory(category: string): number {
  if (category === ALL_CATEGORIES) return hubTools.length;
  return hubTools.filter((tool) => tool.category === category).length;
}

/** Filtrare (categorie + text) urmata de sortare: pinned primele, apoi alfabetic. */
export function selectTools(
  query: string,
  category: string,
  pinned: ReadonlySet<string>,
): HubTool[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);

  const filtered = hubTools.filter((tool) => {
    if (category !== ALL_CATEGORIES && tool.category !== category) return false;
    return terms.every((term) => tool.haystack.includes(term));
  });

  return filtered.sort((a, b) => {
    const pinDelta = Number(pinned.has(b.id)) - Number(pinned.has(a.id));
    if (pinDelta !== 0) return pinDelta;
    return a.name.localeCompare(b.name, 'ro', { sensitivity: 'base' });
  });
}
