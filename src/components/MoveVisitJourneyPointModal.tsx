import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useModal } from 'context/ModalContext';
import { JourneyBoard, JourneyPoint } from '@models/journey';
import { UpdatePatientVisitPayload } from '@models/patient';
import { GetJourneyPoints } from '@requests/journey';
import { UpdatePatientVisit } from '@requests/patient';
import { showErrorToast, showSuccessToast } from '@utils/toast';
import { dispatchPatientVisitUpdated } from '@utils/visitEvents';
import { Id } from 'types';

const selectClassName =
  'w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 pr-9 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';

interface MoveVisitJourneyPointModalProps {
  visitId: number;
  currentBoardId: number;
  currentJourneyPointId: Id;
  boards: JourneyBoard[];
  journeyPoints: JourneyPoint[];
  onMoved: () => void;
}

function sortJourneyPoints(points: JourneyPoint[]): JourneyPoint[] {
  return [...points].sort((a, b) => a.position - b.position);
}

function DestinationSelect({
  id,
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={selectClassName}
        >
          {children}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          aria-hidden="true"
        />
      </div>
    </label>
  );
}

export function MoveVisitJourneyPointModal({
  visitId,
  currentBoardId,
  currentJourneyPointId,
  boards,
  journeyPoints,
  onMoved,
}: MoveVisitJourneyPointModalProps) {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const currentPointId = String(currentJourneyPointId);

  const initialPoints = useMemo(() => sortJourneyPoints(journeyPoints), [journeyPoints]);

  const [selectedBoardId, setSelectedBoardId] = useState(currentBoardId);
  const [selectedPointId, setSelectedPointId] = useState(currentPointId);
  const [pointsByBoardId, setPointsByBoardId] = useState<Record<number, JourneyPoint[]>>(() =>
    currentBoardId ? { [currentBoardId]: initialPoints } : {},
  );
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const boardOptions = useMemo(() => {
    if (boards.some((board) => board.id === currentBoardId) || !currentBoardId) {
      return boards;
    }
    return [{ id: currentBoardId, name: t('journey.journeyBoard') }, ...boards];
  }, [boards, currentBoardId, t]);

  const selectedPoints = pointsByBoardId[selectedBoardId] ?? [];
  const boardChanged = selectedBoardId !== currentBoardId;
  const pointChanged = selectedPointId !== currentPointId;
  const canMove =
    selectedPointId !== '' &&
    (boardChanged || pointChanged) &&
    !isSubmitting &&
    !isLoadingPoints;

  const handleBoardChange = async (nextBoardId: number) => {
    setSelectedBoardId(nextBoardId);

    const cached = pointsByBoardId[nextBoardId];
    if (cached) {
      setSelectedPointId(
        nextBoardId === currentBoardId ? currentPointId : String(cached[0]?.id ?? ''),
      );
      return;
    }

    setIsLoadingPoints(true);
    setSelectedPointId('');
    try {
      const points = sortJourneyPoints(await GetJourneyPoints(nextBoardId) || []);
      setPointsByBoardId((prev) => ({ ...prev, [nextBoardId]: points }));
      setSelectedPointId(
        nextBoardId === currentBoardId ? currentPointId : String(points[0]?.id ?? ''),
      );
    } catch {
      showErrorToast(t('journey.moveFailed'));
    } finally {
      setIsLoadingPoints(false);
    }
  };

  const handleMove = async () => {
    if (!canMove) return;

    try {
      setIsSubmitting(true);
      const payload: UpdatePatientVisitPayload = {
        id: visitId,
        journey_point_id: selectedPointId,
      };
      if (boardChanged) {
        payload.board_id = selectedBoardId;
      }
      await UpdatePatientVisit(payload);
      showSuccessToast(t('journey.moveSuccess'));
      dispatchPatientVisitUpdated();
      onMoved();
      closeModal();
    } catch {
      showErrorToast(t('journey.moveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="mb-4 text-center text-base font-semibold text-gray-900">
        {t('journey.moveVisit')}
      </h2>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {t('journey.selectDestination')}
      </p>

      <div className="space-y-3">
        <DestinationSelect
          id="move-visit-board"
          label={t('journey.board')}
          value={String(selectedBoardId)}
          onChange={(value) => {
            void handleBoardChange(Number(value));
          }}
        >
          {boardOptions.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </DestinationSelect>

        <DestinationSelect
          id="move-visit-list"
          label={t('journey.list')}
          value={selectedPointId}
          disabled={isLoadingPoints || selectedPoints.length === 0}
          onChange={setSelectedPointId}
        >
          {isLoadingPoints ? (
            <option value="">{t('journey.loadingPoints')}</option>
          ) : selectedPoints.length === 0 ? (
            <option value="">{t('journey.selectJourneyPoint')}</option>
          ) : (
            selectedPoints.map((point) => (
              <option key={String(point.id)} value={String(point.id)}>
                {point.name}
              </option>
            ))
          )}
        </DestinationSelect>
      </div>

      <button
        type="button"
        onClick={() => {
          void handleMove();
        }}
        disabled={!canMove}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {t('journey.move')}
      </button>
    </div>
  );
}
