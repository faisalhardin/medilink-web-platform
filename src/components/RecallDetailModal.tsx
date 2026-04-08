import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useModal } from "context/ModalContext";
import { UpdateRecall } from "@requests/recall";
import { Recall, UpdateRecallPayload } from "@models/recall";

interface RecallDetailModalProps {
  recall: Recall;
}

interface EditFormValues {
  scheduled_at: string;
  recall_type: string;
  notes: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const toDatetimeLocal = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
  `T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const toISOWithTimezone = (date: Date): string => {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const tzHH = pad(Math.floor(absOffset / 60));
  const tzMM = pad(absOffset % 60);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${tzHH}:${tzMM}`
  );
};

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function RecallDetailModal({ recall }: RecallDetailModalProps) {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormValues>({
    defaultValues: {
      scheduled_at: toDatetimeLocal(new Date(recall.scheduled_at)),
      recall_type: recall.recall_type || "",
      notes: recall.notes || "",
    },
  });

  const onSubmit = async (data: EditFormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload: UpdateRecallPayload = {
        id: recall.id,
        scheduled_at: toISOWithTimezone(new Date(data.scheduled_at)),
        recall_type: data.recall_type || undefined,
        notes: data.notes || undefined,
      };

      await UpdateRecall(payload);
      closeModal();
    } catch {
      setSubmitError(
        t("recall.form.updateError", "Failed to update recall. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    reset();
    setSubmitError(null);
    setIsEditing(false);
  };

  const statusKey = (recall.status ?? "pending").toLowerCase();
  const statusClass = statusColors[statusKey] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("recall.detail.title", "Recall Details")}
          </h2>
        </div>
        {recall.status && (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {recall.status}
          </span>
        )}
      </div>

      {/* Patient info — always read-only */}
      <div className="mb-5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <p className="text-[11px] font-medium text-blue-500 uppercase tracking-wide mb-0.5">
          {t("recall.detail.patient", "Patient")}
        </p>
        <p className="text-sm font-semibold text-gray-900">
          {recall.patient_name || recall.patient_uuid}
        </p>
      </div>

      {isEditing ? (
        /* ── Edit form ─────────────────────────────────────────────────── */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Scheduled date & time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("recall.form.scheduledTime", "Scheduled date & time")} *
            </label>
            <input
              type="datetime-local"
              {...register("scheduled_at", { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
            />
            {errors.scheduled_at && (
              <p className="mt-1 text-xs text-red-600">
                {t("recall.form.scheduledTimeRequired", "Date and time are required.")}
              </p>
            )}
          </div>

          {/* Appointment type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("recall.form.type", "Appointment type")}
            </label>
            <select
              {...register("recall_type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
            >
              <option value="">{t("recall.form.typeNone", "— Select type —")}</option>
              <option value="control">{t("recall.form.typeControl", "Control")}</option>
              <option value="appointment">{t("recall.form.typeAppointment", "Appointment")}</option>
              <option value="other">{t("recall.form.typeOther", "Other")}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("recall.form.notes", "Notes")}
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder={t("recall.form.notesPlaceholder", "Optional notes for the appointment…")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white resize-none"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {t("recall.form.saveChanges", "Save changes")}
            </button>
          </div>
        </form>
      ) : (
        /* ── Detail view ───────────────────────────────────────────────── */
        <>
          <div className="space-y-4">
            {/* Scheduled time */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                {t("recall.detail.scheduledAt", "Scheduled")}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                {formatDateTime(recall.scheduled_at)}
              </div>
            </div>

            {/* Appointment type */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                {t("recall.detail.type", "Appointment type")}
              </p>
              {recall.recall_type ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {recall.recall_type}
                </span>
              ) : (
                <p className="text-sm text-gray-400 italic">{t("recall.detail.noType", "No type specified")}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                {t("recall.detail.notes", "Notes")}
              </p>
              {recall.notes ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{recall.notes}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">{t("recall.detail.noNotes", "No notes")}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t("common.close", "Close")}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              {t("recall.detail.edit", "Edit")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default RecallDetailModal;
