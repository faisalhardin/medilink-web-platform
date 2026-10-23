import authedClient from '@utils/apiClient';
import { VISIT_COMMISSIONS_PATH } from 'constants/constants';
import type {
  BlanketCommissionRequest,
  BlanketCommissionResponse,
  PatchCommissionRequest,
  PatchCommissionResponse,
} from '@models/compensation';

function data<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const PatchVisitCommission = async (
  id: number,
  body: PatchCommissionRequest
): Promise<PatchCommissionResponse> => {
  const response = await authedClient.patch(`${VISIT_COMMISSIONS_PATH}/${id}`, body);
  return data(response);
};

export const ApplyBlanketCommission = async (
  body: BlanketCommissionRequest
): Promise<BlanketCommissionResponse> => {
  const response = await authedClient.post(`${VISIT_COMMISSIONS_PATH}/blanket`, body);
  return data(response);
};

export const ArchiveVisitCommission = async (id: number): Promise<{ success: boolean }> => {
  const response = await authedClient.delete(`${VISIT_COMMISSIONS_PATH}/${id}`);
  return data(response);
};
