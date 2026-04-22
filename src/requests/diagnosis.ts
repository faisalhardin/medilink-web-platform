import authedClient from '@utils/apiClient';
import {
  ICD10Option,
  DoctorOption,
  DiagnosisEntry,
  SaveDiagnosisRequest,
  SaveDiagnosisResponse,
  GetDiagnosisHistoryResponse,
} from '@models/diagnosis';

export const searchICD10 = async (q: string, limit = 10): Promise<ICD10Option[]> => {
  try {
    const response = await authedClient.get('/v1/icd10/search', {
      params: { q, limit },
      withCredentials: true,
    });
    return response.data.data ?? [];
  } catch (error) {
    console.error('Error searching ICD-10:', error);
    return [];
  }
};

export const getVisitDiagnoses = async (visitId: number): Promise<DiagnosisEntry[]> => {
  try {
    const response = await authedClient.get(`/v1/visit/${visitId}/diagnosis`, {
      withCredentials: true,
    });
    return response.data.data ?? [];
  } catch (error) {
    console.error('Error fetching visit diagnoses:', error);
    return [];
  }
};

export const saveVisitDiagnoses = async (
  visitId: number,
  payload: SaveDiagnosisRequest
): Promise<SaveDiagnosisResponse> => {
  const response = await authedClient.post(`/v1/visit/${visitId}/diagnosis`, payload, {
    withCredentials: true,
  });
  return response.data;
};

export const deleteDiagnosis = async (visitId: number, diagnosisId: number): Promise<void> => {
  await authedClient.delete(`/v1/visit/${visitId}/diagnosis/${diagnosisId}`, {
    withCredentials: true,
  });
};

export const getDiagnosisHistory = async (
  patientUuid: string,
  limit = 20,
  offset = 0
): Promise<GetDiagnosisHistoryResponse> => {
  try {
    const response = await authedClient.get(`/v1/patient/${patientUuid}/diagnosis/history`, {
      params: { limit, offset },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching diagnosis history:', error);
    return { data: [], total: 0, limit, offset };
  }
};

export const searchDoctors = async (q: string): Promise<DoctorOption[]> => {
  try {
    const response = await authedClient.get('/v1/doctor/search', {
      params: { q },
      withCredentials: true,
    });
    return response.data.data ?? [];
  } catch (error) {
    console.error('Error searching doctors:', error);
    return [];
  }
};
