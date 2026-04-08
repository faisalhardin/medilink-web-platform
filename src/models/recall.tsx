import { CommonQueryParams } from "./common";
import { Patient } from "./patient";

export interface Recall {
  id: number;
  patient_name: string;
  patient_uuid: string;
  scheduled_at: string;
  recall_type?: string;
  notes?: string;
  status?: string;
  patient?: Patient;
}

export interface RecallQueryParams extends CommonQueryParams {
  patient_uuid?: string;
}

export interface CreateRecallPayload {
  patient_uuid: string;
  scheduled_at: string;
  recall_type?: string;
  notes?: string;
}

export interface UpdateRecallPayload {
  id: number;
  scheduled_at?: string;
  recall_type?: string;
  notes?: string;
}

