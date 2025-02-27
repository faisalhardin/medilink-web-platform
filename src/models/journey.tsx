export type JourneyBoard = {
    id: number;
    name: string;
}

export type Id = number | string;

export type JourneyPoint = {
    id: Id;
    name: string;
    position: number;
    board_id: number;
} 

export type PatientVisitTask = {
    id: Id;
    columnId: Id;
    notes?: string;
    status?: string;
    patient_name?: string;
    create_time?: string;
    update_time?: string;
    service_point_name?: string;
    sex?: string;
    column_update_time: number;
  };
  