import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { enUS, id as idLocale } from 'date-fns/locale';

type Props = {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
};

const toIso = (date: Date) => format(date, 'yyyy-MM-dd');

const parseIso = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDay = (iso: string, locale: typeof enUS) => {
  if (!iso) return '';
  return format(parseIso(iso), 'd MMM yyyy', { locale });
};

const weekRangeBars = (week: Date[], month: Date, fromIso: string, rangeEnd: string) => {
  if (!fromIso || !rangeEnd || fromIso === rangeEnd) return [];
  const fromDate = parseIso(fromIso);
  const toDate = parseIso(rangeEnd);
  const bars: { key: string; left: string; right: string }[] = [];
  let start = -1;
  const flush = (end: number) => {
    if (start < 0) return;
    const col = 100 / 7;
    const left = start * col;
    const right = (6 - end) * col;
    bars.push({ key: `${toIso(week[start])}-${toIso(week[end])}`, left: `${left}%`, right: `${right}%` });
    start = -1;
  };
  week.forEach((day, index) => {
    const inside = isSameMonth(day, month) && isWithinInterval(day, { start: fromDate, end: toDate });
    if (inside && start < 0) start = index;
    if (!inside && start >= 0) flush(index - 1);
  });
  if (start >= 0) flush(week.length - 1);
  return bars;
};

const WorksheetDateRange = ({ start, end, onChange }: Props) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('id') ? idLocale : enUS;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [hoverIso, setHoverIso] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(start ? parseIso(start) : new Date()));

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
  }, [open, visibleMonth, draftStart, draftEnd]);

  const openPanel = () => {
    setDraftStart(start);
    setDraftEnd(end);
    setHoverIso('');
    setVisibleMonth(startOfMonth(start ? parseIso(start) : new Date()));
    setOpen(true);
  };

  const rangeEnd = draftEnd || (draftStart && hoverIso && hoverIso !== draftStart ? hoverIso : '');
  const from = draftStart && rangeEnd && draftStart > rangeEnd ? rangeEnd : draftStart;
  const to = draftStart && rangeEnd && draftStart > rangeEnd ? draftStart : rangeEnd;

  const pickDay = (iso: string) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(iso);
      setDraftEnd('');
      return;
    }
    if (iso < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(iso);
      return;
    }
    setDraftEnd(iso);
  };

  const applyPreset = (nextStart: Date, nextEnd: Date) => {
    setDraftStart(toIso(nextStart));
    setDraftEnd(toIso(nextEnd));
    setVisibleMonth(startOfMonth(nextStart));
  };

  const apply = () => {
    if (!draftStart || !draftEnd) return;
    onChange(draftStart, draftEnd);
    setOpen(false);
  };

  const clear = () => {
    setDraftStart('');
    setDraftEnd('');
    onChange('', '');
    setOpen(false);
  };

  const cancel = () => setOpen(false);

  const today = new Date();
  const presets = [
    { id: 'last7', label: t('compensation.last7Days'), start: subDays(today, 6), end: today },
    { id: 'last30', label: t('compensation.last30Days'), start: subDays(today, 29), end: today },
    { id: 'thisMonth', label: t('compensation.thisMonth'), start: startOfMonth(today), end: endOfMonth(today) },
  ];

  const weekdays = eachDayOfInterval({
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 }),
  });
  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 }),
  });

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
        <span className="shrink-0 font-medium text-[#0B57D0]">{t('compensation.periodStart')}</span>
        <span className={`min-w-0 truncate ${start ? 'text-[#0D1B2A]' : 'text-[#8A97AB]'}`}>
          {start ? formatDay(start, locale) : t('compensation.rangeEmpty')}
        </span>
        <span className="shrink-0 text-[#8A97AB]" aria-hidden>→</span>
        <span className="shrink-0 font-medium text-[#0B57D0]">{t('compensation.periodEnd')}</span>
        <span className={`min-w-0 truncate ${end ? 'text-[#0D1B2A]' : 'text-[#8A97AB]'}`}>
          {end ? formatDay(end, locale) : t('compensation.rangeEmpty')}
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.start, preset.end)}
                  className="rounded-full px-3 py-2 text-left text-[13px] font-medium text-[#3D4F6F] hover:bg-[#F4F8FF] hover:text-[#0B57D0]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className={`rounded-2xl px-3 py-2 ring-1 ${draftStart && !draftEnd ? 'ring-[#0B57D0]' : 'ring-[#D7E3F4]'}`}>
                  <p className="text-[10px] font-medium text-[#0B57D0]">{t('compensation.periodStart')}</p>
                  <p className="text-sm text-[#0D1B2A]">{draftStart ? formatDay(draftStart, locale) : t('compensation.rangeEmpty')}</p>
                </div>
                <div className={`rounded-2xl px-3 py-2 ring-1 ${draftStart && draftEnd ? 'ring-[#0B57D0]' : 'ring-[#D7E3F4]'}`}>
                  <p className="text-[10px] font-medium text-[#0B57D0]">{t('compensation.periodEnd')}</p>
                  <p className="text-sm text-[#0D1B2A]">{draftEnd ? formatDay(draftEnd, locale) : t('compensation.rangeEmpty')}</p>
                </div>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <button type="button" className="rounded-full px-3 py-1 text-sm text-[#0B57D0] hover:bg-[#F4F8FF]" onClick={() => setVisibleMonth((month) => subMonths(month, 1))} aria-label={t('common.previous')}>
                  ‹
                </button>
                <p className="text-sm font-semibold text-[#0D1B2A]">
                  {format(visibleMonth, 'MMMM yyyy', { locale })}
                </p>
                <button type="button" className="rounded-full px-3 py-1 text-sm text-[#0B57D0] hover:bg-[#F4F8FF]" onClick={() => setVisibleMonth((month) => addMonths(month, 1))} aria-label={t('common.next')}>
                  ›
                </button>
              </div>
              <div>
                <div className="grid grid-cols-7 text-center text-[11px] text-[#8A97AB]">
                  {weekdays.map((day) => (
                    <span key={day.toISOString()}>{format(day, 'EEEEE', { locale })}</span>
                  ))}
                </div>
                <div className="mt-1">
                  {Array.from({ length: monthDays.length / 7 }, (_, weekIndex) => {
                    const week = monthDays.slice(weekIndex * 7, weekIndex * 7 + 7);
                    const bars = weekRangeBars(week, visibleMonth, from, to);
                    return (
                      <div key={toIso(week[0])} className="relative grid grid-cols-7">
                        {bars.map((bar) => (
                          <span
                            key={bar.key}
                            className="pointer-events-none absolute top-1/2 z-0 h-7 -translate-y-1/2 rounded-full bg-[#E8F1FF]"
                            style={{ left: bar.left, right: bar.right }}
                          />
                        ))}
                        {week.map((day) => {
                          const iso = toIso(day);
                          const inMonth = isSameMonth(day, visibleMonth);
                          const endpoint = inMonth && ((draftStart && isSameDay(day, parseIso(draftStart))) || (draftEnd && isSameDay(day, parseIso(draftEnd))));
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => pickDay(iso)}
                              onMouseEnter={() => setHoverIso(iso)}
                              onMouseLeave={() => setHoverIso('')}
                              className={`relative z-10 flex h-10 items-center justify-center text-[13px] ${inMonth ? 'text-[#0D1B2A]' : 'text-[#C5D0E0]'}`}
                            >
                              <span className={`inline-flex h-8 w-8 shrink-0 grow-0 items-center justify-center rounded-full aspect-square ${isSameDay(day, today) && !endpoint ? 'ring-1 ring-[#0B57D0]' : ''}`}>
                                {format(day, 'd')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button type="button" onClick={clear} className="h-9 rounded-full px-3 text-sm font-medium text-[#5C6B80] hover:bg-[#F4F8FF]">
                  {t('compensation.clearRange')}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={cancel} className="h-9 rounded-full px-4 text-sm font-semibold text-[#3D4F6F] hover:bg-[#F4F8FF]">
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={!draftStart || !draftEnd}
                    onClick={apply}
                    className="h-9 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white hover:bg-[#0847B0] disabled:cursor-not-allowed disabled:bg-[#D7E3F4] disabled:text-[#8A97AB]"
                  >
                    {t('compensation.applyRange')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WorksheetDateRange;
