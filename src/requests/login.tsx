import { RefreshTokenResponse } from "@models/login";
import { getRefreshToken, getToken } from "@utils/storage";
import axios from "axios";
import { AUTH_URL_PATH } from "constants/constants";

export async function RefreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await axios.post(
          `${AUTH_URL_PATH}/refresh`, 
          {
            refresh_token: refreshToken
          },
        );
      return await response.data.data;
    } catch (error) {
      throw error;
    }
  }