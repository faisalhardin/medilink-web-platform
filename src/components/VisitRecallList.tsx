import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "context/ModalContext";
import { ListRecalls } from "@requests/recall";
import { Recall } from "@models/recall";
import { RecallDetailModal } from "./RecallDetailModal";

interface VisitRecallListProps {
  visitId: number;
  refreshKey?: number;
}

const typeLabelKey: Record<string, string> = {
  control: "recall.form.typeControl",
  appointment: "recall.form.typeAppointment",
  other: "recall.form.typeOther",
};

const formatScheduled = (dateString: string) =>
  new Date(dateString).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function VisitRecallList({ visitId, refreshKey = 0 }: VisitRecallListProps) {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecalls = useCallback(async () => {
    if (!visitId) return;
    try {
      setLoading(true);
      const data = await ListRecalls({ visit_id: visitId, limit: 50, offset: 0 });
      setRecalls(data);
    } catch (error) {
      console.error("Failed to load visit recalls:", error);
      setRecalls([]);
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    fetchRecalls();
  }, [fetchRecalls, refreshKey]);

  if (loading && recalls.length === 0) {
    return (
      <div className="mb-4 text-sm text-gray-400">
        {t("recall.loading", "Loading recalls…")}
      </div>
    );
  }

  if (recalls.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-500 mb-2">
        {t("recall.visitList.title", "Recalls from this visit")}
      </p>
      <div className="flex flex-wrap gap-2">
        {recalls.map((recall) => {
          const typeKey = recall.recall_type ? typeLabelKey[recall.recall_type] : undefined;
          const typeLabel =
            typeKey && recall.recall_type
              ? t(typeKey, recall.recall_type)
              : recall.recall_type;

          return (
            <button
              key={recall.id}
              type="button"
              onClick={() =>
                openModal(
                  <RecallDetailModal recall={recall} />,
                  { onClose: fetchRecalls, maxWidth: "lg" }
                )
              }
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs text-gray-700 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="font-medium text-gray-900 text-xs">
                {formatScheduled(recall.scheduled_at)}
              </span>
              {typeLabel && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                  {typeLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VisitRecallList;
