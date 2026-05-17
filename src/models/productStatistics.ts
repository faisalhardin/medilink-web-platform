export type Granularity = 'hour' | 'day' | 'week';

export interface ProductStatisticsPeriod {
  start: string;
  end: string;
}

export interface ProductStatisticsProductItem {
  product_id: number;
  name: string;
  unit_price: number;
  total_quantity: number;
  total_revenue: number;
}

export interface ProductStatisticsBucket {
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_quantity: number;
  products: ProductStatisticsProductItem[];
}

export interface ProductStatisticsSummaryItem {
  product_id: number;
  name: string;
  unit_price: number;
  total_quantity: number;
  total_revenue: number;
}

export interface ProductStatisticsSummary {
  total_revenue: number;
  total_quantity: number;
  top_products_by_revenue: ProductStatisticsSummaryItem[];
  top_products_by_quantity: ProductStatisticsSummaryItem[];
}

export interface ProductStatisticsResponse {
  period: ProductStatisticsPeriod;
  granularity: Granularity;
  utc_offset: string;
  buckets: ProductStatisticsBucket[];
  summary: ProductStatisticsSummary;
}

export interface ProductStatisticsParams {
  startTime: string;
  endTime: string;
  granularity: Granularity;
  productId?: number;
}
