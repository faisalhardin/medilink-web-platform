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
      <div className="mt-4 text-[13px] text-[#5C6B80]">
        {t("recall.loading", "Loading recalls…")}
      </div>
    );
  }

  if (recalls.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-[13px] font-medium text-[#5C6B80]">
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
              className="inline-flex items-center gap-2 rounded-full bg-[#F4F8FF] px-3 py-1.5 text-left text-xs text-[#3D4F6F] ring-1 ring-[#D7E3F4] hover:bg-[#E8F1FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0]"
            >
              <span className="text-xs font-medium text-[#0D1B2A]">
                {formatScheduled(recall.scheduled_at)}
              </span>
              {typeLabel && (
                <span className="rounded-full bg-[#E8F1FF] px-1.5 py-0.5 text-xs font-medium capitalize text-[#0B57D0]">
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
