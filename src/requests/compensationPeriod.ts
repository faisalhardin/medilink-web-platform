import authedClient from '@utils/apiClient';
import { COMPENSATION_PERIOD_PATH } from 'constants/constants';
import type {
  CompensationPeriod,
  FinalizePeriodResponse,
  ListCompensationPeriodsResponse,
  ListPeriodStaffResponse,
  PeriodStaffHeader,
} from '@models/compensation';

function data<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const ListCompensationPeriods = async (): Promise<ListCompensationPeriodsResponse> => {
  const response = await authedClient.get(COMPENSATION_PERIOD_PATH, {
    params: { limit: 100, offset: 0 },
  });
  return data(response);
};

export const CreateCompensationPeriod = async (body: {
  label: string;
  period_start: string;
  period_end: string;
}): Promise<CompensationPeriod> => {
  const response = await authedClient.post(COMPENSATION_PERIOD_PATH, body);
  return data(response);
};

export const GetCompensationPeriod = async (periodId: string): Promise<CompensationPeriod> => {
  const response = await authedClient.get(`${COMPENSATION_PERIOD_PATH}/${periodId}`);
  return data(response);
};

export const ListPeriodStaff = async (periodId: string): Promise<ListPeriodStaffResponse> => {
  const response = await authedClient.get(`${COMPENSATION_PERIOD_PATH}/${periodId}/staffs`, {
    params: { limit: 200, offset: 0 },
  });
  return data(response);
};

export const GetPeriodStaff = async (
  periodId: string,
  staffId: string
): Promise<PeriodStaffHeader> => {
  const response = await authedClient.get(
    `${COMPENSATION_PERIOD_PATH}/${periodId}/staff/${staffId}`
  );
  return data(response);
};

export const DraftCompensationPeriod = async (periodId: string): Promise<CompensationPeriod> => {
  const response = await authedClient.post(`${COMPENSATION_PERIOD_PATH}/${periodId}/draft`);
  return data(response);
};

export const FinalizeCompensationPeriod = async (
  periodId: string
): Promise<FinalizePeriodResponse> => {
  const response = await authedClient.post(`${COMPENSATION_PERIOD_PATH}/${periodId}/finalize`);
  return data(response);
};

export const ReopenCompensationPeriod = async (periodId: string): Promise<CompensationPeriod> => {
  const response = await authedClient.post(`${COMPENSATION_PERIOD_PATH}/${periodId}/reopen`);
  return data(response);
};

export const DeleteCompensationPeriod = async (periodId: string): Promise<{ success: boolean }> => {
  const response = await authedClient.delete(`${COMPENSATION_PERIOD_PATH}/${periodId}`);
  return data(response);
};
