'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useState, type MouseEvent as ReactMouseEvent } from 'react';

import { ArrowUpRightIcon, CheckIcon, CopyIcon, InfoIcon, StarIcon } from '@/components/icons';
import { accentFor } from '@/data/tools';
import { copyToClipboard } from '@/lib/storage';
import { faviconUrl, type HubTool } from '@/lib/tools';

interface ToolCardProps {
  tool: HubTool;
  /** Pozitia in grid — da stagger-ul la aparitie. */
  index: number;
  pinned: boolean;
  onTogglePin: (id: string) => void;
  onOpenDetails: (tool: HubTool) => void;
}

function Favicon({ tool }: { tool: HubTool }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border border-white/[0.08] bg-white/[0.04] text-[14px] leading-none sm:h-9 sm:w-9 sm:text-[15px]">
        {tool.emoji ?? '🔗'}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- export static: fara next/image optimizer
    <img
      src={faviconUrl(tool.url)}
      alt=""
      width={36}
      height={36}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className="h-8 w-8 shrink-0 rounded-[9px] border border-white/[0.08] bg-white/[0.04] object-contain p-1.5 sm:h-9 sm:w-9"
    />
  );
}

export function ToolCard({ tool, index, pinned, onTogglePin, onOpenDetails }: ToolCardProps) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const accent = accentFor(tool.category);

  const open = useCallback(() => {
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  }, [tool.url]);

  const handleCopy = useCallback(
    async (event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const ok = await copyToClipboard(tool.url);
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    },
    [tool.url],
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14, scale: reduceMotion ? 1 : 0.97 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 320,
          damping: 30,
          mass: 0.7,
          delay: reduceMotion ? 0 : Math.min(index * 0.028, 0.36),
        },
      }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 460, damping: 40 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      style={{ '--accent': accent } as React.CSSProperties}
      role="link"
      tabIndex={0}
      aria-label={`${tool.name} — deschide ${tool.host} într-un tab nou`}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      className="group relative flex cursor-pointer select-none flex-col overflow-hidden rounded-card border border-white/[0.075] bg-white/[0.024] p-3 transition-[border-color,box-shadow,background-color] duration-300 hover:border-[color:var(--accent)]/45 hover:bg-white/[0.04] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_50px_-24px_var(--accent)] sm:p-4"
    >
      {/* Blush de accent in coltul din stanga-sus, apare la hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: accent }}
      />

      {pinned && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
          style={{ background: accent, boxShadow: `0 0 14px ${accent}` }}
        />
      )}

      <header className="relative flex items-start gap-2 pr-[56px] sm:gap-2.5 sm:pr-[54px]">
        <Favicon tool={tool} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[13.5px] font-semibold leading-tight tracking-[-0.01em] text-chalk-100 sm:text-[15px]">
            {tool.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-chalk-700 transition-colors group-hover:text-[color:var(--accent)] sm:text-[10.5px]">
            <span className="truncate">{tool.host}</span>
            <ArrowUpRightIcon className="h-3 w-3 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </p>
        </div>
      </header>

      <p className="mt-2.5 text-[12px] leading-[1.45] text-chalk-500 sm:text-[12.5px]">
        {tool.shortDescription}
      </p>

      <footer className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span
          className="truncate rounded-full border px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[0.06em] sm:px-2 sm:text-[9.5px] sm:tracking-[0.1em]"
          style={{
            borderColor: `${accent}30`,
            color: accent,
            background: `${accent}0f`,
          }}
        >
          {tool.category}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copiază linkul către ${tool.name}`}
          title="Copiază link"
          className="hover-reveal grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03] text-chalk-500 opacity-0 transition-all duration-200 hover:border-white/20 hover:text-chalk-100 focus-visible:opacity-100 group-hover:opacity-100 sm:h-7 sm:w-7"
        >
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5" style={{ color: accent }} />
          ) : (
            <CopyIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </footer>

      {/* Actiuni care NU deschid linkul */}
      <div className="absolute right-2 top-2 flex items-center gap-0.5">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onTogglePin(tool.id);
          }}
          aria-pressed={pinned}
          aria-label={pinned ? `Elimină ${tool.name} din favorite` : `Fixează ${tool.name} sus`}
          title={pinned ? 'Nu mai fixa' : 'Fixează sus'}
          className="grid h-7 w-7 place-items-center rounded-md transition-colors duration-200 hover:bg-white/[0.08]"
          style={{ color: pinned ? accent : undefined }}
        >
          <StarIcon
            filled={pinned}
            className={pinned ? 'h-[15px] w-[15px]' : 'h-[15px] w-[15px] text-chalk-700 hover:text-chalk-300'}
          />
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenDetails(tool);
          }}
          aria-label={`Detalii despre ${tool.name}`}
          title="Detalii"
          className="grid h-7 w-7 place-items-center rounded-md text-chalk-700 transition-colors duration-200 hover:bg-white/[0.08] hover:text-chalk-100"
        >
          <InfoIcon className="h-[15px] w-[15px]" />
        </button>
      </div>
    </motion.article>
  );
}
