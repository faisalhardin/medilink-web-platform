import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getProductStatistics } from '@requests/productStatistics';
import {
  Granularity,
  ProductStatisticsResponse,
} from '@models/productStatistics';
import { formatPrice } from '@utils/common';
import {
  buildStatisticsTimeRange,
  dateToInputValue,
  daysBetweenInclusive,
  exceedsMaxRangeDays,
  getDefault7DayRange,
  isEndBeforeOrEqualStart,
  mergeEndDateInput,
  mergeStartDateInput,
  mergeTimeInput,
  timeToInputValue,
} from '@utils/productStatisticsTime';

const MAX_RANGE_DAYS = 31;
const HOUR_GRANULARITY_MAX_DAYS = 3;

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
];

type ChartPoint = {
  label: string;
  revenue: number;
  quantity: number;
};

function formatAxisLabel(periodStart: string, granularity: Granularity): string {
  const date = parseISO(periodStart);
  if (granularity === 'hour') return format(date, 'HH:mm');
  if (granularity === 'week') return format(date, 'MMM d');
  return format(date, 'MMM d');
}

function SummaryRow({
  totalRevenue,
  totalQuantity,
  topProductName,
  topProductRevenue,
}: {
  totalRevenue: number;
  totalQuantity: number;
  topProductName?: string;
  topProductRevenue?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-4 py-4 sm:grid-cols-3">
      <div className="rounded-lg bg-blue-50 px-4 py-3">
        <p className="text-xs font-medium text-blue-600">Total revenue</p>
        <p className="mt-1 text-lg font-semibold text-blue-900">
          {formatPrice(totalRevenue)}
        </p>
      </div>
      <div className="rounded-lg bg-emerald-50 px-4 py-3">
        <p className="text-xs font-medium text-emerald-600">Total quantity</p>
        <p className="mt-1 text-lg font-semibold text-emerald-900">{totalQuantity}</p>
      </div>
      <TopProductCard
        topProductName={topProductName}
        topProductRevenue={topProductRevenue}
      />
    </div>
  );
}

function TopProductCard({
  topProductName,
  topProductRevenue,
}: {
  topProductName?: string;
  topProductRevenue?: number;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium text-gray-600">Top product</p>
      <p className="mt-1 truncate text-sm font-semibold text-gray-900">
        {topProductName ?? '—'}
      </p>
      {topProductRevenue != null && (
        <p className="text-xs text-gray-500">{formatPrice(topProductRevenue)}</p>
      )}
    </div>
  );
}

function GranularityToggle({
  granularity,
  hourGranularityDisabled,
  onChange,
}: {
  granularity: Granularity;
  hourGranularityDisabled: boolean;
  onChange: (g: Granularity) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {GRANULARITY_OPTIONS.map((opt) => {
        const disabled = opt.value === 'hour' && hourGranularityDisabled;
        const active = granularity === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${active
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function StatisticsChart({
  chartData,
  expanded,
}: {
  chartData: ChartPoint[];
  expanded: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={expanded ? 360 : 280}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={(v) => formatPrice(v)}
          width={90}
        />
        <YAxis
          yAxisId="quantity"
          orientation="right"
          tick={{ fontSize: 11, fill: '#6b7280' }}
        />
        <Tooltip
          formatter={(value, name, entry) => {
            const num = typeof value === 'number' ? value : Number(value);
            const isRevenue =
              entry?.dataKey === 'revenue' ||
              String(name).toLowerCase() === 'revenue';
            return isRevenue ? formatPrice(num) : num;
          }}
          labelStyle={{ color: '#374151' }}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar
          yAxisId="revenue"
          dataKey="revenue"
          name="Revenue"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
        <Line
          yAxisId="quantity"
          type="monotone"
          dataKey="quantity"
          name="Quantity"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const ProductOrderStatistics = () => {
  const defaultRange = useMemo(() => getDefault7DayRange(), []);
  const [expanded, setExpanded] = useState(false);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [appliedStart, setAppliedStart] = useState(defaultRange.start);
  const [appliedEnd, setAppliedEnd] = useState(defaultRange.end);
  const [appliedGranularity, setAppliedGranularity] = useState<Granularity>('day');
  const [data, setData] = useState<ProductStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryRange = expanded
    ? { start: appliedStart, end: appliedEnd }
    : defaultRange;
  const queryGranularity: Granularity = expanded ? appliedGranularity : 'day';

  const draftRangeDays = daysBetweenInclusive(startDate, endDate);
  const hourGranularityDisabled = draftRangeDays > HOUR_GRANULARITY_MAX_DAYS;

  const draftRangeError = isEndBeforeOrEqualStart(startDate, endDate)
    ? 'End time must be after start time.'
    : exceedsMaxRangeDays(startDate, endDate, MAX_RANGE_DAYS)
      ? `Time range must not exceed ${MAX_RANGE_DAYS} days.`
      : null;

  const isDirty =
    expanded &&
    (startDate.getTime() !== appliedStart.getTime() ||
      endDate.getTime() !== appliedEnd.getTime() ||
      granularity !== appliedGranularity);

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { startTime, endTime } = buildStatisticsTimeRange(
      queryRange.start,
      queryRange.end
    );
    const result = await getProductStatistics(
      startTime,
      endTime,
      queryGranularity
    );
    if (!result) {
      setError('Failed to load product statistics.');
      setData(null);
    } else {
      setData(result);
    }
    setIsLoading(false);
  }, [queryRange.start, queryRange.end, queryGranularity]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    if (expanded && hourGranularityDisabled && granularity === 'hour') {
      setGranularity('day');
    }
  }, [expanded, hourGranularityDisabled, granularity]);

  const chartData = useMemo<ChartPoint[]>(
    () =>
      (data?.buckets ?? []).map((bucket) => ({
        label: formatAxisLabel(bucket.period_start, queryGranularity),
        revenue: bucket.total_revenue,
        quantity: bucket.total_quantity,
      })),
    [data?.buckets, queryGranularity]
  );

  const isEmpty =
    !isLoading &&
    !error &&
    (data?.buckets.length === 0 || data?.summary.total_quantity === 0);

  const topProduct = data?.summary.top_products_by_revenue[0];

  const handleStartDateChange = (value: string) => {
    const nextStart = mergeStartDateInput(startDate, value);
    setStartDate(nextStart);
    if (nextStart > endDate) {
      setEndDate(mergeEndDateInput(endDate, value));
    }
  };

  const handleEndDateChange = (value: string) => {
    const nextEnd = mergeEndDateInput(endDate, value);
    if (nextEnd < startDate) {
      setStartDate(mergeStartDateInput(startDate, value));
    }
    setEndDate(nextEnd);
  };

  const handleStartTimeChange = (value: string) => {
    setStartDate(mergeTimeInput(startDate, value));
  };

  const handleEndTimeChange = (value: string) => {
    setEndDate(mergeTimeInput(endDate, value));
  };

  const handleToggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) {
        setStartDate(appliedStart);
        setEndDate(appliedEnd);
        setGranularity(appliedGranularity);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftRangeError) return;
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setAppliedGranularity(granularity);
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm transition-all ${expanded ? 'w-full' : 'w-full max-w-3xl'
        }`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Product orders</h2>
          <p className="text-xs text-gray-500">
            {expanded ? 'Custom time range' : 'Last 7 days'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleExpanded}
          className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label={expanded ? 'Collapse statistics' : 'Expand statistics'}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <ArrowsPointingInIcon className="h-5 w-5" />
          ) : (
            <ArrowsPointingOutIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {expanded && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-4 border-b border-gray-100 px-4 py-4"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            From
            <div className="flex gap-2">
              <input
                type="date"
                value={dateToInputValue(startDate)}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800"
              />
              <input
                type="time"
                value={timeToInputValue(startDate)}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            To
            <div className="flex gap-2">
              <input
                type="date"
                value={dateToInputValue(endDate)}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800"
              />
              <input
                type="time"
                value={timeToInputValue(endDate)}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800"
              />
            </div>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Granularity</span>
            <GranularityToggle
              granularity={granularity}
              hourGranularityDisabled={hourGranularityDisabled}
              onChange={setGranularity}
            />
          </div>
          {isDirty && (
            <div className="flex flex-col gap-1">
              {draftRangeError && (
                <p className="text-xs text-amber-600">{draftRangeError}</p>
              )}
              <button
                type="submit"
                disabled={!!draftRangeError}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
        </form>
      )}

      {expanded && data && !isLoading && !error && (
        <SummaryRow
          totalRevenue={data.summary.total_revenue}
          totalQuantity={data.summary.total_quantity}
          topProductName={topProduct?.name}
          topProductRevenue={topProduct?.total_revenue}
        />
      )}

      <div className={`px-4 pb-4 ${expanded ? 'pt-2' : 'pt-1'}`}>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && error && (
          <p className="py-12 text-center text-sm text-red-600">{error}</p>
        )}

        {!isLoading && !error && isEmpty && (
          <p className="py-12 text-center text-sm text-gray-500">
            No orders in this period.
          </p>
        )}

        {!isLoading && !error && !isEmpty && chartData.length > 0 && (
          <StatisticsChart chartData={chartData} expanded={expanded} />
        )}
      </div>
    </div>
  );
};

export default ProductOrderStatistics;
