import authedClient from '@utils/apiClient';
import {
  Granularity,
  ProductStatisticsResponse,
} from '@models/productStatistics';

export const getProductStatistics = async (
  startTime: string,
  endTime: string,
  granularity: Granularity,
  productId?: number
): Promise<ProductStatisticsResponse | null> => {
  try {
    const response = await authedClient.get('/v1/institution/product/statistics', {
      params: {
        start_time: startTime,
        end_time: endTime,
        granularity,
        ...(productId != null ? { product_id: productId } : {}),
      },
      withCredentials: true,
    });
    return response.data.data ?? null;
  } catch (error) {
    console.error('Error fetching product statistics:', error);
    return null;
  }
};
