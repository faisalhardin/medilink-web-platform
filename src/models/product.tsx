
export interface Product {
    id: number;
    name: string;
    price: number;
    is_item: boolean;
    is_treatment: boolean;
    quantity: number;
    unit_type: string;
  }

  export interface InsertProductRequest {
    name: string;
    price: number;
    is_item: boolean;
    is_treatment: boolean;
    quantity: number;
    unit_type: string;
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
  id: number;
  quantity: number;
  name: string
  unit_type: string;
  price: number;
  total_price: number;
  discount_rate?: number;
  discount_price?: number;
  adjusted_price?: number;
  is_item?: boolean;
  is_treatment?: boolean;
}


export interface TrxVisitProduct {
  id: number;
  id_trx_institution_product: number;
  id_trx_patient_visit: number;
  id_dtl_patient_visit: number;
  name: string;
  quantity: number;
  unit_type: string;
  price: number;
  discount_rate: number;
  discount_price: number;
  total_price: number;
  adjusted_price: number;
  is_item: boolean;
  is_treatment: boolean;
  
}

export interface ProductPanelProps {
  product_id: number;
  name: string;
  orderedProduct?: TrxVisitProduct;
  cartProduct?: CheckoutProduct;
}

export interface ProductOrderConfirmationProps {
  products: CheckoutProduct[];
  visitID: number;
  subTotal: number;
  onRemoveItem: (id: string) => void;
  onClose: () => void;
  updateSelectedProducts: (products: CheckoutProduct[]) => void;
  onMakeOrder: () => void;
}

// src/components/Checkout/types.ts
export interface CheckoutProductX {
  id: number;
  name: string;
  price: number;
  image?: string;
}

export interface CartItem extends CheckoutProductX {
  quantity: number;
}
