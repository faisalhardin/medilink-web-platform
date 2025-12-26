import authedClient from "@utils/apiClient";

// Type definitions for API requests and responses
export interface OdontogramEvent {
  event_id?: string;
  visit_id: number;
  journey_point_id: string;
  event_type: string;
  tooth_id: string;
  patient_uuid: string;
  event_data: Record<string, any>;
  unix_timestamp?: number;
}

export interface OdontogramSnapshotResponse {
  snapshot: {
    teeth: Record<string, any>;
  };
  max_logical_timestamp: number;
  max_sequence_number: number;
  last_updated: number;
}

export interface GetOdontogramLogsParams {
  patient_uuid: string;
  event_id?: string;
  tooth_id?: string;
  event_type?: string;
  visit_id?: number;
  from_sequence?: number;
  to_sequence?: number;
}

export interface GetOdontogramLogsResponse {
  events: OdontogramEvent[];
  max_logical_timestamp: number;
  max_sequence_number: number;
  total: number;
}

export interface PostOdontogramEventsRequest {
  events: OdontogramEvent[];
}

/**
 * Fetches the odontogram snapshot for a patient
 * @param params - Query parameters
 * @param params.patientUuid - Patient UUID (required)
 * @param params.sequenceNumber - Optional sequence number for historical snapshot
 * @param params.visitId - Optional visit ID to filter snapshot by visit
 * @returns Snapshot response with complete odontogram state
 */
export async function GetOdontogramSnapshot(params: {
  patientUuid: string;
  sequenceNumber?: number;
  visitId?: number;
}): Promise<OdontogramSnapshotResponse> {
  try {
    const queryParams: Record<string, string> = {
      patient_uuid: params.patientUuid,
    };

    if (params.visitId !== undefined) {
      queryParams.visit_id = params.visitId.toString();
    }

    if (params.sequenceNumber !== undefined) {
      queryParams.sequence_number = params.sequenceNumber.toString();
    }

    const response = await authedClient.get("/v1/odontogram", {
      params: queryParams,
      withCredentials: true,
    });

    if (response.status >= 400) {
      throw new Error(`Failed to fetch odontogram snapshot: ${response.status}`);
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching odontogram snapshot:", error);
    throw error;
  }
}

/**
 * Posts odontogram events to the API
 * @param events - Array of odontogram events to send
 * @returns Success response
 */
export async function PostOdontogramEvents(
  events: OdontogramEvent[]
): Promise<string> {
  try {
    const response = await authedClient.post(
      "/v1/odontogram/logs",
      { events },
      {
        withCredentials: true,
      }
    );

    if (response.status >= 400) {
      throw new Error(`Failed to post odontogram events: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error posting odontogram events:", error);
    throw error;
  }
}

/**
 * Gets odontogram event logs with optional filters
 * @param params - Query parameters for filtering logs
 * @returns Event logs response
 */
export async function GetOdontogramLogs(
  params: GetOdontogramLogsParams
): Promise<GetOdontogramLogsResponse> {
  try {
    const response = await authedClient.get("/v1/odontogram/logs", {
      params,
      withCredentials: true,
    });

    if (response.status >= 400) {
      throw new Error(`Failed to fetch odontogram logs: ${response.status}`);
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching odontogram logs:", error);
    throw error;
  }
}

