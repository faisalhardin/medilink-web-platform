

export interface Patient {
    uuid: string;
    nik: string;
    name: string;
    place_of_birth: string;
    date_of_birth: string;
    address: string;
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
    mst_journey_point_id_update_unix_time: number;
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