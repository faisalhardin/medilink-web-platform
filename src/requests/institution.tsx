import { CommonResponse } from "@models/common";
import { ResupplyProductRequest } from "@models/product";
import authedClient from "@utils/apiClient";
import { INSTITUTION_PATH } from "constants/constants";


export const GetInsitution = async () => {
    try {
        const response = await authedClient.get(
            `/v1/institution`, {
                withCredentials: true,
              }
          );

        return await response.data
    } catch (error) {
        console.error("Error fetching institution data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export async function ResupplyProduct(payload: ResupplyProductRequest): Promise<CommonResponse<void>> {
    try {
        const response = await authedClient.post(
            `${INSTITUTION_PATH}/product/resupply`,
            payload,
        );
        const responseData = await response.data;
        return responseData;
    } catch (error) {
        throw error;
    }
}