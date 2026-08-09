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
  id_trx_patient_visit?: number;
  create_time?: string;
  patient?: Patient;
}

export interface RecallQueryParams extends CommonQueryParams {
  patient_uuid?: string;
  visit_id?: number;
}

export interface CreateRecallPayload {
  patient_uuid: string;
  scheduled_at: string;
  recall_type?: string;
  notes?: string;
  id_trx_patient_visit?: number;
}

export interface UpdateRecallPayload {
  id: number;
  scheduled_at?: string;
  recall_type?: string;
  notes?: string;
}

export interface DeleteRecallPayload {
  id: number;
}

