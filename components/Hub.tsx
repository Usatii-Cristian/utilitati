'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CategoryFilter } from '@/components/CategoryFilter';
import { DetailsPopover } from '@/components/DetailsPopover';
import { SearchBar } from '@/components/SearchBar';
import { ToolGrid } from '@/components/ToolGrid';
import { readJSON, STORAGE_KEYS, writeJSON } from '@/lib/storage';
import {
  ALL_CATEGORIES,
  categories,
  countByCategory,
  hubTools,
  selectTools,
  type HubTool,
} from '@/lib/tools';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const PILLS = [ALL_CATEGORIES, ...categories];

const COUNTS: Record<string, number> = Object.fromEntries(
  PILLS.map((category) => [category, countByCategory(category)]),
);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

export function Hub() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [pinned, setPinned] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [activeTool, setActiveTool] = useState<HubTool | null>(null);
  const [restored, setRestored] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Restaurare din localStorage (inainte de primul paint dupa hidratare) ────
  useIsomorphicLayoutEffect(() => {
    const savedPins = readJSON<string[]>(STORAGE_KEYS.pins, []);
    const knownIds = new Set(hubTools.map((tool) => tool.id));
    setPinned(new Set(savedPins.filter((id) => knownIds.has(id))));

    const savedCategory = readJSON<string>(STORAGE_KEYS.category, ALL_CATEGORIES);
    if (savedCategory === ALL_CATEGORIES || categories.includes(savedCategory)) {
      setCategory(savedCategory);
    }

    setRestored(true);
  }, []);

  // ── Persistenta ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restored) return;
    writeJSON(STORAGE_KEYS.pins, [...pinned]);
  }, [pinned, restored]);

  useEffect(() => {
    if (!restored) return;
    writeJSON(STORAGE_KEYS.category, category);
  }, [category, restored]);

  const togglePin = useCallback((id: string) => {
    setPinned((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
  }, []);

  // ── Scurtaturi de tastatura ────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) return;

      // Ctrl/Cmd+K — focus pe cautare
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (event.metaKey || event.ctrlKey) return;

      if (event.key === 'Escape') {
        if (activeTool) return; // modalul isi trateaza singur ESC
        if (query) {
          setQuery('');
          return;
        }
        inputRef.current?.blur();
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (event.key === '/') {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        const target = PILLS[Number(event.key) - 1];
        if (target) {
          event.preventDefault();
          setCategory(target);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTool, query]);

  const visible = useMemo(() => selectTools(query, category, pinned), [query, category, pinned]);

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col px-4 pb-14 sm:px-6 lg:px-8">
      <header className="sticky top-0 z-30 -mx-4 bg-ink-950/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <a
            href="/"
            className="group flex items-baseline gap-[3px] text-[17px] font-extrabold tracking-[-0.03em] text-chalk-100 sm:text-[19px]"
          >
            LINK
            <span className="font-mono text-acid transition-transform duration-300 group-hover:rotate-12">
              //
            </span>
            HUB
          </a>

          <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-chalk-700 sm:block">
            {pinned.size > 0 ? `${pinned.size} fixate` : 'fără fricțiune'}
          </p>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          inputRef={inputRef}
          shown={visible.length}
          total={hubTools.length}
        />

        <div className="mt-3">
          <CategoryFilter
            categories={categories}
            active={category}
            onSelect={setCategory}
            counts={COUNTS}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-ink-950/80 to-transparent" />
      </header>

      <main className="mt-5 flex-1">
        <ToolGrid
          tools={visible}
          pinned={pinned}
          onTogglePin={togglePin}
          onOpenDetails={setActiveTool}
          query={query}
          onReset={reset}
        />
      </main>

      <footer className="mt-12 flex flex-col items-center gap-2 border-t border-white/[0.06] pt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-chalk-700">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <span>
            <span className="kbd">/</span> caută
          </span>
          <span>
            <span className="kbd">esc</span> golește
          </span>
          <span>
            <span className="kbd">1</span>–<span className="kbd">9</span> categorie
          </span>
          <span className="hidden sm:inline">
            <span className="kbd">↵</span> deschide
          </span>
        </p>
        <p className="text-chalk-700/60">
          date locale · zero login · adaugă tool-uri în data/tools.ts
        </p>
      </footer>

      <DetailsPopover tool={activeTool} onClose={() => setActiveTool(null)} />
    </div>
  );
}
