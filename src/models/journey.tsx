
export type Id = number | string;

export type JourneyPoint = {
    id: Id;
    name: string;
} 

export type PatientVisitTask = {
    id: Id;
    columnId: Id;
    notes: string;
    status: string;
  };
  