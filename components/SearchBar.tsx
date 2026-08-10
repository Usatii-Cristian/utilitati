'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';

import { CloseIcon, SearchIcon } from '@/components/icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  shown: number;
  total: number;
}

export function SearchBar({ value, onChange, inputRef, shown, total }: SearchBarProps) {
  return (
    <div className="group relative">
      <div
        className="pointer-events-none absolute inset-0 rounded-[13px] opacity-0 blur-[14px] transition-opacity duration-500 group-focus-within:opacity-100"
        style={{ background: 'radial-gradient(60% 140% at 50% 50%, rgba(201,242,78,0.22), transparent 70%)' }}
      />

      <div className="relative flex items-center gap-3 rounded-[13px] border border-white/10 bg-white/[0.03] px-3.5 backdrop-blur-xl transition-colors duration-300 focus-within:border-acid/45 sm:px-4">
        <SearchIcon className="h-[18px] w-[18px] shrink-0 text-chalk-500 transition-colors group-focus-within:text-acid" />

        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Caută tool, descriere sau domeniu…"
          aria-label="Caută în tool-uri"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-12 w-full min-w-0 bg-transparent font-mono text-[13px] tracking-tight text-chalk-100 outline-none placeholder:text-chalk-700 sm:h-[54px] sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />

        <div className="flex shrink-0 items-center gap-2">
          <AnimatePresence initial={false}>
            {value.length > 0 && (
              <motion.button
                key="clear"
                type="button"
                onClick={() => {
                  onChange('');
                  inputRef.current?.focus();
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                aria-label="Golește căutarea"
                className="grid h-7 w-7 place-items-center rounded-full text-chalk-500 transition-colors hover:bg-white/[0.08] hover:text-chalk-100"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>

          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="kbd">{value ? 'esc' : '/'}</span>
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between px-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-chalk-700">
        <span>
          <span className="text-acid">{shown}</span> din {total} tool-uri
        </span>
        <span className="hidden sm:inline">
          <span className="kbd mr-1">1</span>…<span className="kbd mx-1">9</span> categorie
        </span>
      </div>
    </div>
  );
}
