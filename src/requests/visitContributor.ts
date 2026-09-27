import authedClient from '@utils/apiClient';
import { PATIENT_VISIT_PATH } from 'constants/constants';
import type {
  ListVisitContributorsResponse,
  VisitContributor,
} from '@models/compensation';

function data<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const ListVisitContributors = async (
  visitId: number | string
): Promise<ListVisitContributorsResponse> => {
  const response = await authedClient.get(`${PATIENT_VISIT_PATH}/${visitId}/contributors`);
  return data(response);
};

export const AddVisitContributor = async (
  visitId: number | string,
  staffId: string
): Promise<VisitContributor> => {
  const response = await authedClient.post(`${PATIENT_VISIT_PATH}/${visitId}/contributors`, {
    staff_id: staffId,
  });
  return data<{ contributor: VisitContributor }>(response).contributor;
};

export const DeleteVisitContributor = async (
  visitId: number | string,
  staffId: string
): Promise<{ success: boolean }> => {
  const response = await authedClient.delete(
    `${PATIENT_VISIT_PATH}/${visitId}/contributors/${staffId}`
  );
  return data(response);
};
