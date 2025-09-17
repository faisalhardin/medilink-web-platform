import { CommonQueryParams } from "./common";
import { JourneyPoint } from "./journey";
import { CheckoutProduct, Product } from "./product";


export interface Patient {
  uuid: string;
  nik: string;
  name: string;
  place_of_birth: string;
  date_of_birth: string;
  address: string;
  sex: string;
  religion: string;
  phone_number: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  blood_type: string;
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
  patient_ids?: string;
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
  patient_journeypoints: PatientVisitDetail[];
  patient: Patient;
  journey_point: JourneyPoint;
  product_cart: Product[];
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
  service_point_id?: number;
  column_update_time: number;
  patient: Patient;
  product_cart: Product[];
}

export interface PatientVisitDetailed extends PatientVisit {
  patient_journeypoints: PatientVisitDetail[];
}

export interface UpdatePatientVisitRequest {
  id: number;
  action?: string;
  status?: string;
  notes?: string;
  name?: string;
  sex?: string;
  id_mst_journey_board?: number;
  journey_point_id?: number;
  service_point_name?: string;
  service_point_id?: number;
  column_update_time?: number;
  patient?: Patient;
  product_cart?: CheckoutProduct[];
}

export interface PatientVisitDetail {
  id?: number;
  id_trx_patient_visit?: number;
  name_mst_journey_point?: string;
  journey_point_id: number;
  id_patient_visit: number;
  notes: Record<string, any>;
  service_point_id?: number;
  contributors?: string;
  create_time?: string;
}

export interface InsertPatientVisitPayload {
  patient_uuid: string;
  journey_point_id: number;
  notes: Record<string, any>;
}

export interface UpdatePatientVisitPayload {
  id: number;
  action?: string;
  status?: string;
  notes?: string;
  name?: string;
  sex?: string;
  id_mst_journey_board?: number;
  journey_point_id?: string;
  product_cart?: CheckoutProduct[];
}

export interface OrderProductRequest {
  visit_id: number;
  products?: CheckoutProduct[];
}

export interface ListOrderProductRequest {
  visit_product_id?: number;
  visit_id?: number;
}

export interface GetPatientVisitParam extends CommonQueryParams {
  visit_id?: number;
  journey_board_id?: number;
  patient_uuid?: string;
}

export interface PatientVisitsComponentProps extends GetPatientVisitParam {
  patient?: Patient;
  isInDrawer?: boolean;
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
  notes?: Record<string, any>;
  service_point_id?: number;
}

export interface PatientPageProps {
  journey_board_id?: number;
  
}