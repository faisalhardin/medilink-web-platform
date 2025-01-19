import { JourneyPoint } from "@models/journey"
import JourneyBoard from "@pages/JourneyBoard"
import { getToken } from "@utils/storage"
import axios from "axios";
import { JOURNEY_URL_PATH } from "constants/constants";


export async function GetJourneyPoints(): Promise<JourneyPoint[]> {
  try {
    const token = getToken();
    const response = await axios.get(
        `${JOURNEY_URL_PATH}/board/1`, {
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
