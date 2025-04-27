

export interface Patient {
  uuid: string;
  nik: string;
  name: string;
  place_of_birth: string;
  date_of_birth: string;
  address: string;
  sex: string;
  religion: string;
}

export interface RegisterPatient {
  name: string;
  nik: string;
  sex: string;
  date_of_birth: string;
  place_of_birth: string;
  religion: string;
  address: string;
}

export interface GetPatientParam {
  date_of_birth?: string;
  name?: string;
  institution_id?: number;
  nik?: string;
}

export interface GetPatientVisitDetailedResponse {
  id: number;
  action: string;
  status: string;
  notes: string;
  name: string;
  sex: string;
  id_mst_institution: number;
  id_mst_journey_board: number;
  journey_point_id: number;
  create_time: string;
  update_time: string;
  service_point_name: string;
  service_point_id: number;
  column_update_time: number;
  patient_checkpoints: PatientVisitDetail[];
  patient: Patient;
}

export interface PatientVisit {
  id: number;
  action: string;
  status: string;
  notes: string;
  name: string;
  sex: string;
  id_mst_institution: number;
  id_mst_journey_board: number;
  journey_point_id: number;
  create_time: string;
  update_time: string;
  service_point_name: string;
  service_point_id: number;
  column_update_time: number;
  patient: Patient;
}

export interface PatientVisitDetail {
  id?: number;
  name_mst_journey_point?: string;
  journey_point_id: number;
  id_patient_visit: number;
  notes: Record<string, any>;
  service_point_id?: number;
  contributors?: string;
}

export interface UpdatePatientVisitPayload {
  id: number;
  action?: string;
  status?: string;
  notes?: string;
  name?: string;
  sex?: string;
  id_mst_journey_board?: number;
  journey_point_id?: number;
}

export interface GetPatientVisitParam {
  visit_id?: number;
  journey_board_id?: number;
}

export interface PatientVisitsComponentProps {
  patientUUID: string;
}

export interface PatientVisitDetailComponentProps {
  patientVisitId: number;
}

export interface UpsertPatientVisitDetailParam {
  id?: number;
  id_trx_patient_visit: number;
  touchpoint_name?: string;
  name_mst_journey_point?: string;
  id_mst_journey_point: number;
  notes: Record<string, any>;
}