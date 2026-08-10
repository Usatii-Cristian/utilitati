'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowUpRightIcon, CheckIcon, CloseIcon, CopyIcon } from '@/components/icons';
import { accentFor } from '@/data/tools';
import { copyToClipboard } from '@/lib/storage';
import { faviconUrl, type HubTool } from '@/lib/tools';

interface DetailsPopoverProps {
  tool: HubTool | null;
  onClose: () => void;
}

export function DetailsPopover({ tool, onClose }: DetailsPopoverProps) {
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC inchide, iar scroll-ul din spate se blocheaza cat timp modalul e deschis.
  useEffect(() => {
    if (!tool) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown, true);
    // focusam panoul (tabIndex -1), nu un buton — asa ESC/Tab merg fara inel de focus agresiv
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown, true);
      window.clearTimeout(focusTimer);
    };
  }, [tool, onClose]);

  useEffect(() => setCopied(false), [tool]);

  const handleCopy = useCallback(async () => {
    if (!tool) return;
    const ok = await copyToClipboard(tool.url);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [tool]);

  const accent = tool ? accentFor(tool.category) : '#c9f24e';

  return (
    <AnimatePresence>
      {tool && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
        >
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            style={{ '--accent': accent } as React.CSSProperties}
            className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[20px] border border-white/10 bg-ink-900/95 p-5 outline-none pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_60px_-12px_rgba(0,0,0,0.9)] sm:rounded-[18px] sm:p-6 sm:pb-6"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
              style={{ background: accent }}
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/15 sm:hidden"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Închide detaliile"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-chalk-500 transition-colors hover:bg-white/[0.08] hover:text-chalk-100 sm:right-4 sm:top-4"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            <div className="relative flex items-start gap-3 pr-10 pt-2 sm:pt-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconUrl(tool.url)}
                alt=""
                width={44}
                height={44}
                referrerPolicy="no-referrer"
                className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] object-contain p-2"
              />
              <div className="min-w-0">
                <h2
                  id="details-title"
                  className="text-lg font-bold tracking-[-0.015em] text-chalk-100 sm:text-xl"
                >
                  {tool.name}
                </h2>
                <span
                  className="mt-1.5 inline-block rounded-full border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.12em]"
                  style={{ borderColor: `${accent}30`, color: accent, background: `${accent}0f` }}
                >
                  {tool.category}
                </span>
              </div>
            </div>

            <p className="relative mt-4 text-[13.5px] font-medium leading-relaxed text-chalk-300">
              {tool.shortDescription}
            </p>

            <div className="relative mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
              <p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-chalk-700">
                De ce îl deschid
              </p>
              <p className="text-[13px] leading-relaxed text-chalk-300">{tool.details}</p>
            </div>

            <div className="relative mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-ink-950 transition-transform duration-200 active:scale-[0.98]"
                style={{ background: accent, boxShadow: `0 10px 34px -14px ${accent}` }}
              >
                Deschide
                <ArrowUpRightIcon className="h-4 w-4" strokeWidth={2.2} />
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-chalk-300 transition-colors hover:border-white/20 hover:text-chalk-100"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                {copied ? 'Copiat' : 'Copiază link'}
              </button>
            </div>

            <p className="relative mt-3 break-all text-center font-mono text-[10.5px] text-chalk-700">
              {tool.url}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
