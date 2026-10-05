import authedClient from '@utils/apiClient';
import { COMPENSATION_WAGE_PATH } from 'constants/constants';
import type {
  DeleteStaffWageResponse,
  ListStaffWagesResponse,
  UpsertStaffWageRequest,
  UpsertStaffWageResponse,
} from '@models/compensation';

function data<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const ListWages = async (staffId?: string): Promise<ListStaffWagesResponse> => {
  const response = await authedClient.get(COMPENSATION_WAGE_PATH, {
    params: staffId ? { staff_id: staffId } : undefined,
  });
  return data(response);
};

export const UpsertWage = async (body: UpsertStaffWageRequest): Promise<UpsertStaffWageResponse> => {
  const response = await authedClient.put(COMPENSATION_WAGE_PATH, body);
  return data(response);
};

export const DeleteWage = async (wageId: number): Promise<DeleteStaffWageResponse> => {
  const response = await authedClient.delete(`${COMPENSATION_WAGE_PATH}/${wageId}`);
  return data(response);
};
