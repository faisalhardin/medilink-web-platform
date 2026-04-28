import authedClient from '@utils/apiClient';
import {
  AnamnesaData,
  SaveAnamnesaRequest,
  SaveAnamnesaResponse,
  NurseOption,
} from '@models/anamnesa';

export const getAnamnesa = async (visitId: number): Promise<AnamnesaData | null> => {
  try {
    const response = await authedClient.get(`/v1/visit/${visitId}/anamnesa`, {
      withCredentials: true,
    });
    return response.data.data ?? null;
  } catch (error) {
    console.error('Error fetching anamnesa:', error);
    return null;
  }
};

export const saveAnamnesa = async (
  visitId: number,
  payload: SaveAnamnesaRequest
): Promise<SaveAnamnesaResponse> => {
  const response = await authedClient.post(`/v1/visit/${visitId}/anamnesa`, payload, {
    withCredentials: true,
  });
  return response.data;
};

export const searchNurses = async (q: string): Promise<NurseOption[]> => {
  try {
    const response = await authedClient.get('/v1/nurse/search', {
      params: { q },
      withCredentials: true,
    });
    return response.data.data ?? [];
  } catch (error) {
    console.error('Error searching nurses:', error);
    return [];
  }
};
