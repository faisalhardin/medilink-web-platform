import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useModal } from "context/ModalContext";
import { useDrawer } from "hooks/useDrawer";
import Drawer from "./Drawer";
import { PatientListComponent, PatientRegistrationComponent } from "./PatientComponent";
import { CreateRecall } from "@requests/recall";
import { CreateRecallPayload } from "@models/recall";
import { Patient } from "@models/patient";
import { formatDate } from "@utils/common";

interface CreateRecallModalProps {
  initialDate: Date;
}

interface RecallFormValues {
  scheduled_at: string;
  recall_type: string;
  notes: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const toDatetimeLocal = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
  `T${pad(date.getHours())}:${pad(date.getMinutes())}`;

// Produces an ISO-8601 string that preserves the browser's local timezone offset,
// e.g. "2026-03-13T09:00:00+07:00" instead of the UTC "2026-03-13T02:00:00.000Z".
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

export function CreateRecallModal({ initialDate }: CreateRecallModalProps) {
  const { t } = useTranslation();
  const { closeModal } = useModal();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const patientDrawer = useDrawer();
  const registerPatientDrawer = useDrawer();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RecallFormValues>({
    defaultValues: {
      scheduled_at: toDatetimeLocal(initialDate),
      recall_type: "",
      notes: "",
    },
  });

  useEffect(() => {
    const d = new Date(initialDate);
    d.setHours(9, 0, 0, 0);
    setValue("scheduled_at", toDatetimeLocal(d));
  }, [initialDate, setValue]);

  const onSubmit = async (data: RecallFormValues) => {
    if (!selectedPatient) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload: CreateRecallPayload = {
        patient_uuid: selectedPatient.uuid,
        scheduled_at: toISOWithTimezone(new Date(data.scheduled_at)),
        recall_type: data.recall_type || undefined,
        notes: data.notes || undefined,
      };

      await CreateRecall(payload);
      closeModal();
    } catch {
      setSubmitError(
        t("recall.form.submitError", "Failed to save recall. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t("recall.form.title", "New Recall Appointment")}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {t(
            "recall.form.subtitle",
            "Schedule a reminder for a follow-up or control visit."
          )}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Patient selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("recall.form.patient", "Patient")} *
            </label>

            <div className="flex gap-3">
              {/* Select trigger — mirrors VisitForm pattern */}
              <div className="relative flex-1">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                  value={selectedPatient?.uuid ?? ""}
                  onClick={patientDrawer.openDrawer}
                  onChange={() => { }}
                >
                  <option value="" disabled hidden>
                    {t("recall.form.searchPatient", "Choose patient from database…")}
                  </option>
                  {selectedPatient && (
                    <option value={selectedPatient.uuid}>
                      {selectedPatient.name}
                    </option>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Register new patient button */}
              {!selectedPatient && (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={registerPatientDrawer.openDrawer}
                    title={t("patient.registerNewPatient", "Register new patient")}
                    className="flex items-center justify-center h-full px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {t("patient.registerNewPatient", "Register new patient")}
                  </div>
                </div>
              )}

              {/* Clear selection button when a patient is already selected */}
              {selectedPatient && (
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  title={t("recall.form.changePatient", "Change patient")}
                  className="flex items-center justify-center h-full px-3 border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Selected patient card */}
            {selectedPatient && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-900 text-sm">{selectedPatient.name}</p>
                {selectedPatient.nik && <p><span className="font-medium">NIK:</span> {selectedPatient.nik}</p>}
                {selectedPatient.date_of_birth && (
                  <p><span className="font-medium">{t("patient.dob", "DOB")}:</span> {formatDate(selectedPatient.date_of_birth)}</p>
                )}
                {selectedPatient.sex && (
                  <p><span className="font-medium">{t("common.sex", "Sex")}:</span> {selectedPatient.sex}</p>
                )}
              </div>
            )}
          </div>

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
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatient}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {t("recall.form.save", "Save recall")}
            </button>
          </div>
        </form>
      </div>

      {/* Patient search drawer */}
      <Drawer
        isOpen={patientDrawer.isOpen}
        onClose={patientDrawer.closeDrawer}
        title={t("patient.selectPatient", "Select Patient")}
        maxWidth="lg"
        position="right"
      >
        <PatientListComponent
          isInDrawer
          onPatientSelect={(patient) => {
            setSelectedPatient(patient);
            patientDrawer.closeDrawer();
          }}
        />
      </Drawer>

      {/* Register new patient drawer */}
      <Drawer
        isOpen={registerPatientDrawer.isOpen}
        onClose={registerPatientDrawer.closeDrawer}
        title={t("patient.registerPatient", "Register Patient")}
        maxWidth="lg"
        position="right"
      >
        <PatientRegistrationComponent
          isInDrawer
          onPatientSelect={(patient) => {
            setSelectedPatient(patient);
            registerPatientDrawer.closeDrawer();
          }}
        />
      </Drawer>
    </>
  );
}

export default CreateRecallModal;
