import { RefreshTokenResponse } from "@models/login";
import authedClient from "@utils/apiClient";
import axios from "axios";
import { AUTH_URL } from "constants/constants";

export async function RefreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await axios.post(
          `${AUTH_URL}/refresh`, 
          {
            refresh_token: refreshToken
          },
        );
      return await response.data.data;
    } catch (error) {
      throw error;
    }
  }

  export async function Logout(): Promise<RefreshTokenResponse> {
    try {
      const response = await authedClient.post(
          `${AUTH_URL}/logout`, 
          {},
        );
      return await response.data.data;
    } catch (error) {
      throw error;
    }
  }