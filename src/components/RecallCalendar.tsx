import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { ListRecalls } from "@requests/recall";
import { Recall } from "@models/recall";
import { useModal } from "context/ModalContext";
import { CreateRecallModal } from "./CreateRecallModal";
import { RecallDetailModal } from "./RecallDetailModal";
import { formatDateTimeWithOffset } from "@utils/common";

type RecallCalendarView = "month" | "week" | "threeDays" | "day";

interface RecallCalendarProps {
  patientUUID?: string;
  defaultView?: RecallCalendarView;
}

// ─── date helpers ────────────────────────────────────────────────────────────

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatISODateTime = (date: Date) => date.toISOString();

const startOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfDay(d);
};

const endOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toLocalDateKey = (value: string | Date) =>
  formatDateTimeWithOffset(value instanceof Date ? value : new Date(value)).split("T")[0];

const groupRecallsByDay = (recalls: Recall[]) =>
  recalls.reduce<Record<string, Recall[]>>((acc, recall) => {
    const key = toLocalDateKey(recall.scheduled_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(recall);
    return acc;
  }, {});

const sortRecallsByTime = (recalls: Recall[]) =>
  [...recalls].sort(
    (a, b) =>
      new Date(a.scheduled_at).getTime() -
      new Date(b.scheduled_at).getTime()
  );

// ─── RecallCalendar ───────────────────────────────────────────────────────────

const VALID_VIEWS: RecallCalendarView[] = ["month", "week", "threeDays", "day"];

/** Minimum column width (px) for day / 3-day / week; below this the grid scrolls horizontally. */
const MIN_MULTI_DAY_COLUMN_PX = 180;

function parseDateParam(raw: string | null, view: RecallCalendarView): Date {
  if (!raw) return startOfDay(new Date());
  if (view === "month") {
    // Expect YYYY-MM
    const [year, month] = raw.split("-").map(Number);
    if (year && month) return startOfDay(new Date(year, month - 1, 1));
  } else {
    // Expect YYYY-MM-DD
    const parts = raw.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return startOfDay(new Date(parts[0], parts[1] - 1, parts[2]));
    }
  }
  return startOfDay(new Date());
}

function toDateParam(date: Date, view: RecallCalendarView): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  if (view === "month") return `${y}-${m}`;
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function RecallCalendar({ patientUUID, defaultView = "month" }: RecallCalendarProps) {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();

  const useUrl = !patientUUID;

  // ── URL-driven state ────────────────────────────────────────────────────────
  // When useUrl, we derive view/anchorDate directly from searchParams so that
  // browser back/forward (which updates searchParams) automatically re-renders
  // the calendar at the correct position — no separate sync effect needed.

  const urlView = useMemo<RecallCalendarView>(() => {
    const param = searchParams.get("view") as RecallCalendarView | null;
    return param && VALID_VIEWS.includes(param) ? param : defaultView;
  }, [searchParams, defaultView]);

  const urlAnchorDate = useMemo<Date>(
    () => parseDateParam(searchParams.get("date"), urlView),
    [searchParams, urlView]
  );

  // ── Local state fallback (used only when patientUUID is provided) ───────────
  const [localView, setLocalView] = useState<RecallCalendarView>(defaultView);
  const [localAnchorDate, setLocalAnchorDate] = useState<Date>(startOfDay(new Date()));

  const view = useUrl ? urlView : localView;
  const anchorDate = useUrl ? urlAnchorDate : localAnchorDate;

  // Write view+date into the URL. Wrapped in a ref-guarded callback so we never
  // push duplicate entries: the first call (mount) replaces the current entry,
  // every subsequent call pushes a new one for back/forward support.
  const mountedRef = useRef(false);
  const setView = useCallback(
    (v: RecallCalendarView) => {
      if (useUrl) {
        setSearchParams({ view: v, date: toDateParam(anchorDate, v) });
      } else {
        setLocalView(v);
      }
    },
    [useUrl, anchorDate, setSearchParams]
  );
  const setAnchorDate = useCallback(
    (d: Date) => {
      if (useUrl) {
        setSearchParams({ view, date: toDateParam(d, view) });
      } else {
        setLocalAnchorDate(d);
      }
    },
    [useUrl, view, setSearchParams]
  );
  const setViewAndAnchorDate = useCallback(
    (v: RecallCalendarView, d: Date) => {
      if (useUrl) {
        setSearchParams({ view: v, date: toDateParam(d, v) });
      } else {
        setLocalView(v);
        setLocalAnchorDate(d);
      }
    },
    [useUrl, setSearchParams]
  );

  // Initialise URL params on first mount if they are absent (e.g. bare /recall).
  useEffect(() => {
    if (!useUrl) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (!searchParams.get("view") || !searchParams.get("date")) {
        setSearchParams(
          { view: urlView, date: toDateParam(urlAnchorDate, urlView) },
          { replace: true }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    if (view === "month") {
      return {
        from: startOfMonth(anchorDate),
        to: endOfMonth(anchorDate),
      };
    }
    const visibleDays =
      view === "day" ? 1 : view === "threeDays" ? 3 : 7;
    const from = startOfDay(anchorDate);
    const to = addDays(from, visibleDays);
    return { from, to };
  }, [anchorDate, view]);

  const visibleDays = useMemo(() => {
    if (view === "day") return 1;
    if (view === "threeDays") return 3;
    if (view === "week") return 7;
    return 0;
  }, [view]);

  const recallTimeModify = (recall: Recall) => {
    recall.scheduled_at = formatDateTimeWithOffset(new Date(recall.scheduled_at));
    return recall;
  };

  const fetchRecalls = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const recallsData = await ListRecalls({
        from_time: formatISODateTime(dateRange.from),
        to_time: formatISODateTime(dateRange.to),
        patient_uuid: patientUUID,
        limit: 200,
        offset: 0,
      });
      setRecalls(recallsData.map(recallTimeModify));
    } catch {
      setError("Failed to load recalls");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to, patientUUID]);

  useEffect(() => {
    fetchRecalls();
  }, [fetchRecalls]);

  const groupedRecalls = useMemo(() => groupRecallsByDay(recalls), [recalls]);

  const monthGrid = useMemo(() => {
    if (view !== "month") return [];

    const start = startOfMonth(anchorDate);
    const end = endOfMonth(anchorDate);

    const gridStart = addDays(start, -start.getDay());
    const gridEnd = addDays(end, 6 - end.getDay());

    const days: Date[] = [];
    let current = gridStart;
    while (current <= gridEnd) {
      days.push(current);
      current = addDays(current, 1);
    }

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [anchorDate, view]);

  const days = useMemo(() => {
    if (view === "month") return [];
    const result: Date[] = [];
    for (let i = 0; i < visibleDays; i++) {
      result.push(addDays(dateRange.from, i));
    }
    return result;
  }, [dateRange.from, visibleDays, view]);

  const handlePrev = () => {
    if (view === "month") {
      const d = new Date(anchorDate);
      d.setMonth(d.getMonth() - 1);
      setAnchorDate(startOfMonth(d));
    } else {
      setAnchorDate(addDays(anchorDate, -visibleDays));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      const d = new Date(anchorDate);
      d.setMonth(d.getMonth() + 1);
      setAnchorDate(startOfMonth(d));
    } else {
      setAnchorDate(addDays(anchorDate, visibleDays));
    }
  };

  const handleToday = () => setAnchorDate(startOfDay(new Date()));

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const calendarTitle = useMemo(() => {
    const { from } = dateRange;
    if (view === "month") {
      return from.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    }
    if (visibleDays === 1) {
      return from.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    // week and threeDays — show only the first date of the range
    return from.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [dateRange, visibleDays, view]);

  const openDetailModal = (recall: Recall) => {
    openModal(
      <RecallDetailModal recall={recall} />,
      { onClose: fetchRecalls, maxWidth: 'lg' }
    );
  };

  const openAddRecall = (day: Date) => {
    const initialDate = new Date(day);
    initialDate.setHours(9, 0, 0, 0);
    openModal(
      <CreateRecallModal initialDate={initialDate} />,
      { onClose: fetchRecalls, maxWidth: 'lg' }
    );
  };

  // ── date circle that morphs into a + button on hover ────────────────────────
  const DateCircle = ({
    day,
    size,
    isToday,
    dimmed,
  }: {
    day: Date;
    size: "sm" | "lg";
    isToday: boolean;
    dimmed?: boolean;
  }) => {
    const key = toLocalDateKey(day);
    const circleClass =
      size === "lg"
        ? "w-7 h-7 sm:w-8 sm:h-8 text-sm sm:text-base"
        : "w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs";

    return (
      <div className={`relative inline-flex items-center justify-center ${circleClass}`}>
        {/* Date number — fades out on hover */}
        <span
          className={`inline-flex items-center justify-center w-full h-full rounded-full font-semibold transition-opacity duration-150 ${isToday ? "bg-blue-600 text-white" : dimmed ? "text-gray-400" : "text-gray-900"
            } ${hoveredDay === key ? "opacity-0" : "opacity-100"}`}
        >
          {day.getDate()}
        </span>

        {/* + button — fades in on hover, covers circle exactly */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openAddRecall(day);
          }}
          className={`absolute inset-0 p-1 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-opacity duration-150 shadow-sm ${hoveredDay === key ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          title={t("recall.addAppointment", "Add appointment")}
        >
          <svg
            className={size === "lg" ? "w-4 h-4" : "w-3 h-3"}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col rounded-xl shadow-sm border border-gray-200 bg-white">
      {/* ── Top header ───────────────────────────────────────────────────── */}

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("recall.title", "Recall Calendar")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("recall.subtitle", "See upcoming control and follow-up appointments")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t("recall.today", "Today")}
          </button>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={handlePrev}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
            >
              ›
            </button>
          </div>

          {/* View selector dropdown */}
          <select
            value={view}
            onChange={(e) => setView(e.target.value as RecallCalendarView)}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="day">{t("recall.dayView", "Day")}</option>
            <option value="threeDays">{t("recall.threeDaysView", "3 days")}</option>
            <option value="week">{t("recall.weekView", "Week")}</option>
            <option value="month">{t("recall.monthView", "Month")}</option>
          </select>
        </div>
      </div>

      {/* ── Range title ───────────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700">{calendarTitle}</div>
      </div>

      {/* ── Body — no overflow scroll on this shell; calendar grows with content ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-2 text-sm text-gray-600">{t("recall.loading", "Loading recalls…")}</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="px-4 py-3">
            <div className="rounded-md bg-red-50 p-3 flex items-center">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10A8 8 0 11.001 9.999 8 8 0 0118 10zm-8-4a1 1 0 00-.894.553L8.382 9H6a1 1 0 100 2h2.618l.724 2.447A1 1 0 0011 14h.01a1 1 0 00.894-1.447L11.618 11H14a1 1 0 100-2h-2.382l-.724-2.447A1 1 0 0010 6z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* ── Month view ────────────────────────────────────────────────── */}
        {!isLoading && !error && view === "month" && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200 text-[11px] sm:text-xs font-medium text-gray-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                <div key={label} className="px-2 py-1.5 text-center uppercase tracking-wide">
                  {label}
                </div>
              ))}
            </div>

            <div
              className="flex-1 grid border-t border-gray-200"
              style={{ gridTemplateRows: `repeat(${monthGrid.length}, minmax(0, 1fr))` }}
            >
              {monthGrid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
                  {week.map((day) => {
                    const key = formatDateTimeWithOffset(day).split("T")[0];
                    const dayRecalls = sortRecallsByTime(groupedRecalls[key] || []);
                    const isToday = sameDay(day, new Date());
                    const isCurrentMonth = day.getMonth() === anchorDate.getMonth();

                    return (
                      <div
                        key={key}
                        onClick={() => setViewAndAnchorDate("threeDays", day)}
                        className="h-[110px] sm:h-[130px] w-full border-r border-gray-200 last:border-r-0 bg-white flex flex-col overflow-y-hidden overflow-x-hidden cursor-pointer hover:bg-blue-50 transition-colors duration-100"
                        onMouseEnter={() => setHoveredDay(key)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        {/* Cell header */}
                        <div className="px-2 pt-1 pb-0.5 flex items-center text-[11px] sm:text-xs bg-gray-50">
                          <DateCircle day={day} size="sm" isToday={isToday} dimmed={!isCurrentMonth} />
                        </div>

                        {/* Recall items — visual only, the cell itself is the clickable unit */}
                        <div className="flex-1 p-1.5 pb-1.5 space-y-1.5">
                          {dayRecalls.slice(0, 3).map((recall) => (
                            <div
                              key={recall.id}
                              className="border border-blue-100 bg-blue-50 rounded-sm px-1 py-0.5 text-[10px] leading-tight"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-blue-900 mr-1 whitespace-normal break-words">
                                  {formatTime(recall.scheduled_at)}
                                </span>
                                {recall.recall_type && (
                                  <span className="inline-flex items-center px-1 rounded-full text-[9px] font-medium bg-blue-100 text-blue-800">
                                    {recall.recall_type}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-800 whitespace-normal break-words">
                                {recall.patient_name || recall.patient_uuid}
                              </div>
                            </div>
                          ))}
                          {dayRecalls.length > 3 && (
                            <div className="text-[10px] text-gray-500">
                              +{dayRecalls.length - 3} {t("recall.more", "more")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Day / 3-day / Week view ───────────────────────────────────── */}
        {!isLoading && !error && view !== "month" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-auto overflow-y-hidden">
            <div
              className="flex-1 grid gap-px bg-gray-200 h-full min-h-[160px]"
              style={{
                width: "100%",
                minWidth: `${days.length * MIN_MULTI_DAY_COLUMN_PX}px`,
                gridTemplateColumns: `repeat(${days.length}, minmax(${MIN_MULTI_DAY_COLUMN_PX}px, 1fr))`,
              }}
            >
              {days.map((day) => {
                const key = toLocalDateKey(day);
                const dayRecalls = sortRecallsByTime(groupedRecalls[key] || []);
                const isToday = sameDay(day, new Date());

                return (
                  <div
                    key={key}
                    className="bg-white flex flex-col h-full min-h-[160px]"
                    onMouseEnter={() => setHoveredDay(key)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Column header */}
                    <div
                      className={`px-3 py-2 border-b text-xs sm:text-sm flex items-center justify-center ${isToday ? "bg-blue-50" : "bg-gray-50"}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`text-[10px] uppercase tracking-wide font-medium ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <DateCircle day={day} size="lg" isToday={isToday} />
                      </div>
                    </div>

                    {/* Items */}
                    <div className="flex-1 px-3 py-2 space-y-2 min-w-0">
                      {dayRecalls.length === 0 && (
                        <div className="text-[11px] text-gray-400 italic">
                          {t("recall.noAppointments", "No recalls scheduled")}
                        </div>
                      )}
                      {dayRecalls.map((recall) => (
                        <div
                          key={recall.id}
                          onClick={() => openDetailModal(recall)}
                          className="border border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md rounded-md px-2 py-1.5 text-xs shadow-sm cursor-pointer transition-all duration-100 select-none"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-blue-900">
                              {formatTime(recall.scheduled_at)}
                            </span>
                            {recall.recall_type && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                {recall.recall_type}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-800 truncate">
                            {recall.patient_name || recall.patient_uuid}
                          </div>
                          {recall.notes && (
                            <div className="mt-0.5 text-[10px] text-gray-600 line-clamp-2">
                              {recall.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
