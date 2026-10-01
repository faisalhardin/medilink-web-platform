import authedClient from '@utils/apiClient';
import { WORKSHEET_PATH } from 'constants/constants';
import type {
  FinalizeWorksheetResponse,
  ListVisitCommissionsResponse,
  ListWorksheetsResponse,
  Worksheet,
  WorksheetGenerateStatus,
  WorksheetStatus,
} from '@models/compensation';

function data<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const CreateWorksheet = async (body: {
  staff_id: string;
  label: string;
  period_start: string;
  period_end: string;
}): Promise<Worksheet> => {
  const response = await authedClient.post(WORKSHEET_PATH, body);
  return data(response);
};

export const ListWorksheets = async (params: {
  staff_id?: string;
  status?: WorksheetStatus;
  compensation_period_uuid?: string;
  period_start?: string;
  period_end?: string;
  cursor?: string;
  limit?: number;
}): Promise<ListWorksheetsResponse> => {
  const response = await authedClient.get(WORKSHEET_PATH, { params });
  return data(response);
};

export const ListWorksheetsForPeriod = async (
  compensationPeriodUuid: string,
  staffId?: string
): Promise<Worksheet[]> => {
  const worksheets: Worksheet[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page += 1) {
    const resp = await ListWorksheets({
      compensation_period_uuid: compensationPeriodUuid,
      staff_id: staffId,
      limit: 100,
      cursor,
    });
    worksheets.push(...(resp.worksheets ?? []));
    if (!resp.next_cursor) break;
    cursor = resp.next_cursor;
  }
  return worksheets;
};

export const ListWorksheetsByDates = async (
  periodStart: string,
  periodEnd: string
): Promise<Worksheet[]> => {
  const worksheets: Worksheet[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page += 1) {
    const resp = await ListWorksheets({
      period_start: periodStart.slice(0, 10),
      period_end: periodEnd.slice(0, 10),
      limit: 100,
      cursor,
    });
    worksheets.push(...(resp.worksheets ?? []));
    if (!resp.next_cursor) break;
    cursor = resp.next_cursor;
  }
  return worksheets;
};

export const GetWorksheet = async (id: string): Promise<Worksheet> => {
  const response = await authedClient.get(`${WORKSHEET_PATH}/${id}`);
  return data(response);
};

export const ListWorksheetCommissions = async (
  id: string
): Promise<ListVisitCommissionsResponse> => {
  const response = await authedClient.get(`${WORKSHEET_PATH}/${id}/commissions`, {
    params: { limit: 500, offset: 0 },
  });
  return data(response);
};

export const GenerateWorksheetCommissions = async (id: string): Promise<{
  uuid: string;
  status: WorksheetStatus;
  generate_status: WorksheetGenerateStatus;
}> => {
  const response = await authedClient.post(`${WORKSHEET_PATH}/${id}/generate`);
  return data(response);
};

export const PatchWorksheet = async (
  id: string,
  body: {
    label?: string;
    period_start?: string;
    period_end?: string;
    compensation_period_uuid?: string | null;
  }
): Promise<Worksheet> => {
  const response = await authedClient.patch(`${WORKSHEET_PATH}/${id}`, body);
  return data(response);
};

export const FinalizeWorksheet = async (id: string): Promise<FinalizeWorksheetResponse> => {
  const response = await authedClient.post(`${WORKSHEET_PATH}/${id}/finalize`);
  return data(response);
};
