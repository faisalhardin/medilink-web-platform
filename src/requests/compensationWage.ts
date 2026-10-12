import authedClient from '@utils/apiClient';
import { COMPENSATION_STAFF_WAGE_PATH, COMPENSATION_WAGE_PATH } from 'constants/constants';
import type {
  DeleteStaffWageResponse,
  GenerateStaffWageSnapshotsRequest,
  ListStaffWagesResponse,
  StaffWageSnapshot,
  StaffWageSnapshotsResponse,
  UpdateStaffWageSnapshotRequest,
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

export const ListStaffWageSnapshots = async (): Promise<StaffWageSnapshotsResponse> => {
  const response = await authedClient.get(COMPENSATION_STAFF_WAGE_PATH);
  return data(response);
};

export const UpdateStaffWageSnapshot = async (
  id: number,
  body: UpdateStaffWageSnapshotRequest,
): Promise<StaffWageSnapshot> => {
  const response = await authedClient.patch(`${COMPENSATION_STAFF_WAGE_PATH}/${id}`, body);
  return data(response);
};

export const GenerateStaffWageSnapshots = async (
  body: GenerateStaffWageSnapshotsRequest,
): Promise<StaffWageSnapshotsResponse> => {
  const response = await authedClient.post(`${COMPENSATION_STAFF_WAGE_PATH}/generate`, body);
  return data(response);
};
