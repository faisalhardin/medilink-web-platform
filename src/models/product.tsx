
export interface Product {
    id: number;
    name: string;
    id_mst_product?: number;
    price?: number;
    is_item?: boolean;
    is_treatment?: boolean;
    quantity: number;
    unit_type?: string;
  }

export interface ListProductParams {
  ids?: number[];
  name?: string;
  idMstProduct?: number[];
  idMstProducts?: number[];
  idMstInstitution?: number;
  isItem?: boolean;
  isTreatment?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
  fromTime?: string; // ISO date string format
  toTime?: string; // ISO date string format
}

// Add this new interface
export interface AssignedProductRequest {
  products: CheckoutProduct[];
}

export interface CheckoutProduct {
  product_id: number;
  quantity: number;
  discount_rate?: number;
  discount_price?: number;
  adjusted_price?: number;
}


export interface TrxVisitProduct {
  id: number;
  id_trx_institution_product: number;
  id_trx_patient_visit: number;
  id_dtl_patient_visit: number;
  quantity: number;
  unit_type: string;
  price: number;
  discount_rate: number;
  discount_price: number;
  total_price: number;
  adjusted_price: number;
}