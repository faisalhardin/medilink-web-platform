import React from 'react';

export type FolderLabelColor = 'violet' | 'emerald' | 'amber' | 'blue' | 'rose' | 'gray';

export interface FolderLabelDef {
  text: string;
  color?: FolderLabelColor;
}

interface FolderLabelsProps {
  labels: FolderLabelDef[];
  children: React.ReactNode;
  /** Extra classes on the outer wrapper (e.g. for spacing in a list) */
  className?: string;
}

const colorMap: Record<FolderLabelColor, { tab: string; border: string; bg: string }> = {
  violet: { tab: 'bg-violet-500 text-white', border: 'border-violet-400', bg: 'bg-violet-50/40' },
  emerald: { tab: 'bg-emerald-500 text-white', border: 'border-emerald-400', bg: 'bg-emerald-50/40' },
  amber:  { tab: 'bg-amber-400 text-white',   border: 'border-amber-400',   bg: 'bg-amber-50/40'   },
  blue:   { tab: 'bg-blue-500 text-white',    border: 'border-blue-400',    bg: 'bg-blue-50/40'    },
  rose:   { tab: 'bg-rose-500 text-white',    border: 'border-rose-400',    bg: 'bg-rose-50/40'    },
  gray:   { tab: 'bg-gray-400 text-white',    border: 'border-gray-400',    bg: 'bg-gray-50/40'    },
};

/**
 * FolderLabels wraps any card-like child with one or more folder-tab labels
 * anchored to the top-left edge, styled like physical folder dividers.
 *
 * Usage:
 *   <FolderLabels labels={[{ text: 'NEW', color: 'violet' }, { text: 'URGENT', color: 'rose' }]}>
 *     <MyCard />
 *   </FolderLabels>
 */
export const FolderLabels = ({ labels, children, className = '' }: FolderLabelsProps) => {
  if (!labels.length) return <>{children}</>;

  // Derive the primary color from the first label for the card border/bg tint.
  const primaryColor = labels[0].color ?? 'violet';
  const { border, bg } = colorMap[primaryColor];

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tab strip — in normal flow so its height naturally drives the gap; no hardcoded pt */}
      <div className="flex items-end gap-[2px] self-start pl-[2px]">
        {labels.map((label, i) => {
          const color = label.color ?? 'violet';
          const { tab } = colorMap[color];
          return (
            <div
              key={i}
              className={`${tab} rounded-t px-2 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wide`}
            >
              {label.text}
            </div>
          );
        })}
      </div>

      {/* Card outline — pulls up 1px to merge top border visually with tab bottom */}
      <div className={`-mt-px overflow-hidden rounded border-2 ${border} ${bg}`}>
        {children}
      </div>
    </div>
  );
};
