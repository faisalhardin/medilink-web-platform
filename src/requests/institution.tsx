import axios from "axios";
import { INSTITUTION_PATH } from "constants/constants";
import { getToken } from "@utils/storage";


export const GetInsitution = async () => {
    try {
        const token = getToken();
        const response = await axios.get(
            `${INSTITUTION_PATH}`, {
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