
export interface Product {
    id?: number;
    name: string;
    id_mst_product?: number;
    price?: number;
    is_item?: boolean;
    is_treatment?: boolean;
    quantity: number;
    unit_type?: string;
  }

export interface ListProductParams {
  name?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  is_item?: boolean;
  is_treatment?: boolean;
}