

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
    create_time: string;
    updateTime: string;
  }

  export interface PatientVisitsComponentProps {
    patientUUID: string;
  }