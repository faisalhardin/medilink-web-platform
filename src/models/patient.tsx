

export interface Patient {
    uuid: string;
    nik: string;
    name: string;
    place_of_birth: string;
    date_of_birth: string;
    address: string;
    religion: string;
}

export interface GetPatientParam {
    // patient_ids: number[];
    date_of_birth?: string;
    name?: string;
    institution_id?: number;
    nik?: string;
}