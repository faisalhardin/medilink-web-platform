import { JourneyPoint, JourneyBoard, RenameJourneyPointRequest, ArchiveJourneyPointRequest, CreateJourneyPointRequest } from "@models/journey"
import { PatientVisit } from "@models/patient";
import { getToken } from "@utils/storage"
import axios from "axios";
import { JOURNEY_URL_PATH } from "constants/constants";

export async function CreateJourneyPoint(params:CreateJourneyPointRequest): Promise<JourneyPoint> {
  try {
    const token = getToken();
    const response = await axios.post(
        `${JOURNEY_URL_PATH}/point`, 
        params,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );
    return await response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function GetJourneyPoints(boardID:number): Promise<JourneyPoint[]> {
  try {
    const token = getToken();
    const response = await axios.get(
        `${JOURNEY_URL_PATH}/board/${boardID}`, {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    );
    return await response.data.data.journey_points;
  } catch (error) {
    throw error;
  }
}

export async function UpdateJourneyPoint(params:JourneyPoint): Promise<JourneyPoint> {
    try {
      const token = getToken();
      const response = await axios.patch(
          `${JOURNEY_URL_PATH}/point/${params.id}`, 
          params,
          {
              withCredentials: true,
              headers: {
                  Authorization: `Bearer ${token}`
              },
              
          }
      );
      return await response.data.data.journey_points;
    } catch (error) {
      throw error;
    }
  }
  
  export async function UpdateServicePoint(params:JourneyPoint): Promise<JourneyPoint> {
    try {
      const token = getToken();
      const response = await axios.patch(
          `${JOURNEY_URL_PATH}/point/${params.id}`, 
          params,
          {
              withCredentials: true,
              headers: {
                  Authorization: `Bearer ${token}`
              },
              
          }
      );
      return await response.data.data.journey_points;
    } catch (error) {
      throw error;
    }
  }

export async function GetJourneyBoards(): Promise<JourneyBoard[]> {
  try {
    const token = getToken();
    const response = await axios.get(
        `${JOURNEY_URL_PATH}/board`, 
        {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${token}`
            },
            
        }
    );
    return await response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function RenameJourneyPoint(params:RenameJourneyPointRequest): Promise<RenameJourneyPointRequest> {
  try {
    const token = getToken();
    const response = await axios.patch(
        `${JOURNEY_URL_PATH}/point/rename`, 
        params,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          },
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