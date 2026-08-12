'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { GhostIcon } from '@/components/icons';
import { ToolCard } from '@/components/ToolCard';
import type { LocalStatus } from '@/lib/desktop';
import type { HubTool } from '@/lib/tools';

interface ToolGridProps {
  tools: HubTool[];
  pinned: ReadonlySet<string>;
  /** Starea locala per tool, cheie = tool.name (gol in browser). */
  statuses: Record<string, LocalStatus>;
  onTogglePin: (id: string) => void;
  onOpenDetails: (tool: HubTool) => void;
  onAfterLaunch?: () => void;
  query: string;
  onReset: () => void;
}

export function ToolGrid({
  tools,
  pinned,
  statuses,
  onTogglePin,
  onOpenDetails,
  onAfterLaunch,
  query,
  onReset,
}: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="flex flex-col items-center justify-center rounded-card border border-dashed border-white/10 bg-white/[0.015] px-6 py-16 text-center"
      >
        <GhostIcon className="h-10 w-10 text-chalk-700" />
        <p className="mt-4 text-[15px] font-semibold text-chalk-300">Nimic pe aici.</p>
        <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-chalk-700">
          {query ? (
            <>
              Niciun tool nu se potrivește cu{' '}
              <span className="font-mono text-chalk-500">“{query}”</span>. Încearcă alt cuvânt sau
              schimbă categoria.
            </>
          ) : (
            <>Categoria asta e goală deocamdată. Adaugă tool-uri în data/tools.ts.</>
          )}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-full border border-acid/35 bg-acid/10 px-4 py-2 text-[12.5px] font-medium text-acid transition-colors hover:bg-acid/20"
        >
          Resetează filtrele
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3.5 xl:grid-cols-4"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            index={index}
            pinned={pinned.has(tool.id)}
            status={statuses[tool.name]}
            onTogglePin={onTogglePin}
            onOpenDetails={onOpenDetails}
            onAfterLaunch={onAfterLaunch}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
