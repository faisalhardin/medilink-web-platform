import { JourneyPoint, JourneyBoard, RenameJourneyPointRequest, ArchiveJourneyPointRequest, CreateJourneyPointRequest } from "@models/journey"
import authedClient from "@utils/apiClient";
import { JOURNEY_URL_PATH } from "constants/constants";

export async function CreateJourneyPoint(params:CreateJourneyPointRequest): Promise<JourneyPoint> {
  try {
    const response = await authedClient.post(
        `${JOURNEY_URL_PATH}/point`, 
        params,
        {
          withCredentials: true,
        }
      );
    return await response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function ArchiveJourneyPoint(params: ArchiveJourneyPointRequest): Promise<void> {
  try {
    const response = await authedClient.patch(
      `${JOURNEY_URL_PATH}/point/archive`,
      params,
      {
        withCredentials: true,
      }
    );

    if (response.status >= 400) {
      throw new Error;
    }
  } catch (error) {
    throw error;
  }
}

export async function GetJourneyPoints(boardID:number): Promise<JourneyPoint[]> {
  try {
    const response = await authedClient.get(
        `${JOURNEY_URL_PATH}/board/${boardID}`, {
            withCredentials: true,
        }
    );
    return await response.data.data.journey_points;
  } catch (error) {
    throw error;
  }
}

export async function UpdateJourneyPoint(params:JourneyPoint): Promise<JourneyPoint> {
    try {
      const response = await authedClient.patch(
          `${JOURNEY_URL_PATH}/point/${params.id}`, 
          params,
          {
              withCredentials: true,
          }
      );
      return await response.data.data.journey_points;
    } catch (error) {
      throw error;
    }
  }
  
  export async function UpdateServicePoint(params:JourneyPoint): Promise<JourneyPoint> {
    try {
      const response = await authedClient.patch(
        `${JOURNEY_URL_PATH}/point/${params.id}`, 
          params,
          {
              withCredentials: true,     
          }
      );
      return await response.data.data.journey_points;
    } catch (error) {
      throw error;
    }
  }

export async function GetJourneyBoards(): Promise<JourneyBoard[]> {
  try {
    const response = await authedClient.get(
      `${JOURNEY_URL_PATH}/board`, 
        {
            withCredentials: true,            
        }
    );
    return await response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function RenameJourneyPoint(params:RenameJourneyPointRequest): Promise<RenameJourneyPointRequest> {
  try {
    const response = await authedClient.patch(
        `${JOURNEY_URL_PATH}/point/rename`, 
        params,
        {
          withCredentials: true,
        }
      );

    if (response.status >= 400) {
      throw new Error;
    }
    const responseData = await response.data;
    return responseData;
  } catch (error) {
    throw error;
  }
}