'use client';

import { motion } from 'framer-motion';

import { accentFor, DEFAULT_ACCENT } from '@/data/tools';
import { ALL_CATEGORIES } from '@/lib/tools';

interface CategoryFilterProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
  counts: Record<string, number>;
}

export function CategoryFilter({ categories, active, onSelect, counts }: CategoryFilterProps) {
  const pills = [ALL_CATEGORIES, ...categories];

  return (
    <div
      role="tablist"
      aria-label="Filtrare pe categorie"
      className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {pills.map((category, index) => {
        const isAll = category === ALL_CATEGORIES;
        const isActive = category === active;
        const accent = isAll ? DEFAULT_ACCENT : accentFor(category);
        const label = isAll ? 'Toate' : category;

        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category)}
            title={index < 9 ? `${label} — tasta ${index + 1}` : label}
            style={{ '--pill': accent } as React.CSSProperties}
            className={[
              'relative shrink-0 snap-start rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-colors duration-200',
              isActive
                ? 'border-transparent text-ink-950'
                : 'border-white/10 text-chalk-300 hover:border-white/20 hover:text-chalk-100',
            ].join(' ')}
          >
            {isActive && (
              <motion.span
                layoutId="pill-bg"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--pill)',
                  boxShadow: '0 6px 26px -8px var(--pill)',
                }}
              />
            )}
            <span className="relative flex items-center gap-1.5 whitespace-nowrap">
              {!isActive && (
                <span
                  className="h-1.5 w-1.5 rounded-full opacity-70"
                  style={{ background: 'var(--pill)' }}
                />
              )}
              {label}
              <span
                className={[
                  'font-mono text-[10px] tabular-nums',
                  isActive ? 'text-ink-950/[0.55]' : 'text-chalk-700',
                ].join(' ')}
              >
                {counts[category] ?? 0}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
