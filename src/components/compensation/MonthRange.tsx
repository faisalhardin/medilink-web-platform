import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { enUS, id as idLocale } from 'date-fns/locale';

type Props = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
};

const MAX_MONTH_SPAN = 12;
const COLUMNS = 4;

const monthIndex = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + (month - 1);
};

const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const yearOf = (value: string) => Number(value.slice(0, 4)) || new Date().getFullYear();

const formatMonth = (value: string, locale: typeof enUS, pattern = 'MMMM yyyy') => {
  if (!value) return '';
  const [year, month] = value.split('-').map(Number);
  return format(new Date(year, month - 1, 1), pattern, { locale });
};

const orderRange = (anchor: string, other: string) => {
  if (monthIndex(other) >= monthIndex(anchor)) return [anchor, other] as const;
  return [other, anchor] as const;
};

const spanTooLong = (start: string, end: string) =>
  Boolean(start && end && monthIndex(end) - monthIndex(start) + 1 > MAX_MONTH_SPAN);

const rowBars = (row: number[], year: number, fromValue: string, toValue: string) => {
  if (!fromValue || !toValue || fromValue === toValue) return [];
  const startIndex = monthIndex(fromValue);
  const endIndex = monthIndex(toValue);
  const bars: { key: string; left: string; right: string }[] = [];
  let start = -1;
  const flush = (end: number) => {
    if (start < 0) return;
    const col = 100 / COLUMNS;
    const left = start * col;
    const right = (COLUMNS - 1 - end) * col;
    bars.push({
      key: `${year}-${row[start]}-${row[end]}`,
      left: `${left}%`,
      right: `${right}%`,
    });
    start = -1;
  };
  row.forEach((month, index) => {
    const valueIndex = year * 12 + month;
    const inside = valueIndex >= startIndex && valueIndex <= endIndex;
    if (inside && start < 0) start = index;
    if (!inside && start >= 0) flush(index - 1);
  });
  if (start >= 0) flush(row.length - 1);
  return bars;
};

const MonthRange = ({ from, to, onChange }: Props) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('id') ? idLocale : enUS;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [hoverValue, setHoverValue] = useState('');
  const [visibleYear, setVisibleYear] = useState(() => yearOf(from));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 8;
      const gap = 8;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openAbove = spaceBelow < height && spaceAbove > spaceBelow;
      let top = openAbove ? rect.top - height - gap : rect.bottom + gap;
      top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
      let left = rect.left;
      if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
      if (left < margin) left = margin;
      setPanelPos({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, visibleYear, draftFrom, draftTo, hoverValue]);

  const openPanel = () => {
    setDraftFrom(from);
    setDraftTo(to);
    setHoverValue('');
    setVisibleYear(yearOf(from || currentMonthValue()));
    setOpen(true);
  };

  const previewTo = draftFrom && !draftTo && hoverValue && hoverValue !== draftFrom ? hoverValue : '';
  const [shownFrom, shownTo] = previewTo
    ? orderRange(draftFrom, previewTo)
    : [draftFrom, draftTo];
  const rangeTooLong = spanTooLong(shownFrom, shownTo);

  const pickMonth = (value: string) => {
    if (!draftFrom || draftTo) {
      setDraftFrom(value);
      setDraftTo('');
      return;
    }
    const [nextFrom, nextTo] = orderRange(draftFrom, value);
    setDraftFrom(nextFrom);
    setDraftTo(nextTo);
  };

  const applyThisMonth = () => {
    const month = currentMonthValue();
    setDraftFrom(month);
    setDraftTo(month);
    setVisibleYear(yearOf(month));
  };

  const apply = () => {
    if (!draftFrom || !draftTo || spanTooLong(draftFrom, draftTo)) return;
    onChange(draftFrom, draftTo);
    setOpen(false);
  };

  const todayValue = currentMonthValue();
  const months = Array.from({ length: 12 }, (_, month) => month);

  return (
    <div ref={rootRef} className="relative w-max max-w-full">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="flex h-9 w-max max-w-full items-center gap-2 rounded-full bg-white px-3 text-left text-[13px] outline-none ring-1 ring-[#D7E3F4] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20"
      >
        <span className="shrink-0 font-medium text-[#0B57D0]">{t('compensation.monthFrom')}</span>
        <span className={`min-w-0 truncate ${from ? 'text-[#0D1B2A]' : 'text-[#8A97AB]'}`}>
          {from ? formatMonth(from, locale) : t('compensation.rangeEmpty')}
        </span>
        <span className="shrink-0 text-[#8A97AB]" aria-hidden="true">→</span>
        <span className="shrink-0 font-medium text-[#0B57D0]">{t('compensation.monthTo')}</span>
        <span className={`min-w-0 truncate ${to ? 'text-[#0D1B2A]' : 'text-[#8A97AB]'}`}>
          {to ? formatMonth(to, locale) : t('compensation.rangeEmpty')}
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t('compensation.dateRange')}
          className="fixed z-[70] w-[320px] max-w-[calc(100vw-1rem)] rounded-[24px] border border-[#E6EEF8] bg-white p-4 shadow-[0_16px_40px_rgba(13,27,42,0.12)]"
          style={{ top: panelPos.top, left: panelPos.left }}
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyThisMonth}
              className="rounded-full px-3 py-2 text-left text-[13px] font-medium text-[#3D4F6F] hover:bg-[#F4F8FF] hover:text-[#0B57D0]"
            >
              {t('compensation.thisMonth')}
            </button>
          </div>
          <div className="mb-3 mt-4 grid grid-cols-2 gap-2">
            <div className={`rounded-2xl px-3 py-2 ring-1 ${draftFrom && !draftTo ? 'ring-[#0B57D0]' : 'ring-[#D7E3F4]'}`}>
              <p className="text-[13px] font-medium text-[#0B57D0]">{t('compensation.monthFrom')}</p>
              <p className="truncate text-sm text-[#0D1B2A]">{shownFrom ? formatMonth(shownFrom, locale, 'MMM yyyy') : t('compensation.rangeEmpty')}</p>
            </div>
            <div className={`rounded-2xl px-3 py-2 ring-1 ${draftFrom && draftTo ? 'ring-[#0B57D0]' : 'ring-[#D7E3F4]'}`}>
              <p className="text-[13px] font-medium text-[#0B57D0]">{t('compensation.monthTo')}</p>
              <p className="truncate text-sm text-[#0D1B2A]">{shownTo ? formatMonth(shownTo, locale, 'MMM yyyy') : t('compensation.rangeEmpty')}</p>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="rounded-full px-3 py-1 text-sm text-[#0B57D0] hover:bg-[#F4F8FF]"
              onClick={() => setVisibleYear((year) => year - 1)}
              aria-label={t('common.previous')}
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-[#0D1B2A]">{visibleYear}</p>
            <button
              type="button"
              className="rounded-full px-3 py-1 text-sm text-[#0B57D0] hover:bg-[#F4F8FF]"
              onClick={() => setVisibleYear((year) => year + 1)}
              aria-label={t('common.next')}
            >
              ›
            </button>
          </div>
          <div>
            {Array.from({ length: 12 / COLUMNS }, (_, rowIndex) => {
              const row = months.slice(rowIndex * COLUMNS, rowIndex * COLUMNS + COLUMNS);
              const bars = rowBars(row, visibleYear, shownFrom, shownTo);
              return (
                <div key={row[0]} className="relative grid grid-cols-4">
                  {bars.map((bar) => (
                    <span
                      key={bar.key}
                      className="pointer-events-none absolute top-1/2 z-0 h-7 -translate-y-1/2 rounded-full bg-[#E8F1FF]"
                      style={{ left: bar.left, right: bar.right }}
                    />
                  ))}
                  {row.map((month) => {
                    const value = `${visibleYear}-${String(month + 1).padStart(2, '0')}`;
                    const endpoint = value === shownFrom || (shownTo !== '' && value === shownTo);
                    const label = format(new Date(visibleYear, month, 1), 'MMM', { locale });
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={formatMonth(value, locale)}
                        onClick={() => pickMonth(value)}
                        onMouseEnter={() => setHoverValue(value)}
                        onMouseLeave={() => setHoverValue('')}
                        className="relative z-10 flex h-11 items-center justify-center text-[13px] text-[#0D1B2A]"
                      >
                        <span
                          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 ${/* endpoint ? 'bg-[#0B57D0] text-white' : '' */ ''} ${value === todayValue && !endpoint ? 'ring-1 ring-[#0B57D0]' : ''}`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {rangeTooLong ? (
            <p className="mt-3 text-[13px] text-[#9B2C2C]">{t('compensation.monthRangeLimit')}</p>
          ) : null}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-full px-4 text-sm font-semibold text-[#3D4F6F] hover:bg-[#F4F8FF]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={!draftFrom || !draftTo || rangeTooLong}
              onClick={apply}
              className="h-9 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white hover:bg-[#0847B0] disabled:cursor-not-allowed disabled:bg-[#D7E3F4] disabled:text-[#8A97AB]"
            >
              {t('compensation.applyRange')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MonthRange;
