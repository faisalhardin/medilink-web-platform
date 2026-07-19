import authedClient from '@utils/apiClient';
import { ListProducts } from '@requests/products';
import { Product } from '@models/product';
import {
  ProcedureProductOption,
  ICD9CMOption,
  ProcedureEntry,
  SaveProcedureRequest,
  SaveProcedureResponse,
  GetProcedureHistoryResponse,
} from '@models/procedure';

export const searchProcedureProducts = async (
  q: string,
  limit = 10
): Promise<ProcedureProductOption[]> => {
  try {
    const response = await ListProducts({
      name: q,
      limit,
      isTreatment: true,
    });
    const products = (response ? (response as Product[]) : []) ?? [];
    return products.map((p) => ({ id: p.id, name: p.name }));
  } catch (error) {
    console.error('Error searching procedure products:', error);
    return [];
  }
};

export const searchICD9CM = async (q: string, limit = 10): Promise<ICD9CMOption[]> => {
  try {
    const response = await authedClient.get('/v1/icd9cm/search', {
      params: { q, limit },
      withCredentials: true,
    });
    return response.data.data ?? [];
  } catch (error) {
    console.error('Error searching ICD-9-CM:', error);
    return [];
  }
};

export const getVisitProcedures = async (visitId: number): Promise<ProcedureEntry[]> => {
  try {
    const response = await authedClient.get(`/v1/visit/${visitId}/procedure`, {
      withCredentials: true,
    });
    return response.data.data ?? [];
  } catch (error) {
    console.error('Error fetching visit procedures:', error);
    return [];
  }
};

export const saveVisitProcedures = async (
  visitId: number,
  payload: SaveProcedureRequest
): Promise<SaveProcedureResponse> => {
  const response = await authedClient.post(`/v1/visit/${visitId}/procedure`, payload, {
    withCredentials: true,
  });
  return response.data;
};

export const deleteProcedure = async (visitId: number, procedureId: number): Promise<void> => {
  await authedClient.delete(`/v1/visit/${visitId}/procedure/${procedureId}`, {
    withCredentials: true,
  });
};

export const getProcedureHistory = async (
  patientUuid: string,
  limit = 20,
  offset = 0
): Promise<GetProcedureHistoryResponse> => {
  try {
    const response = await authedClient.get(`/v1/patient/${patientUuid}/procedure/history`, {
      params: { limit, offset },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching procedure history:', error);
    return { data: [], total: 0, limit, offset };
  }
};
