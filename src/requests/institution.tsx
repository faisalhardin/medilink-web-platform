import { getToken } from "@utils/storage";
import apiClient from "@utils/apiClient";


export const GetInsitution = async () => {
    try {
        
        const token = getToken();
        const response = await apiClient.get(
            `/v1/institution`, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
          );

        return await response.data
    } catch (error) {
        console.error("Error fetching institution data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}