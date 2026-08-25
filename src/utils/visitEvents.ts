export const PATIENT_VISIT_UPDATED_EVENT = 'patient-visit-updated';

export function dispatchPatientVisitUpdated(): void {
  window.dispatchEvent(new CustomEvent(PATIENT_VISIT_UPDATED_EVENT));
}
