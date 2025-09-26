import { RefreshTokenResponse } from "@models/login";
import axios from "axios";
import { AUTH_URL, JWT_TOKEN_KEY } from "constants/constants";

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
      const token = sessionStorage.getItem(JWT_TOKEN_KEY);
      const response = await axios.post(
          `${AUTH_URL}/logout`, 
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      return await response.data.data;
    } catch (error) {
      throw error;
    }
  }