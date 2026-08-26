import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface CurrentJourneyPointBadgeProps {
  journeyPointName?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function CurrentJourneyPointBadge({
  journeyPointName,
  disabled = false,
  onClick,
}: CurrentJourneyPointBadgeProps) {
  const { t } = useTranslation();

  return journeyPointName ? (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t('journey.currentPoint')}
      title={t('journey.moveVisit')}
      className="mb-1 inline-flex max-w-full items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="truncate">{journeyPointName}</span>
      <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-blue-700" aria-hidden="true" />
    </button>
  ) : null;
}
