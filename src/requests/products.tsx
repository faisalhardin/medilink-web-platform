import { CommonResponse } from "@models/common";
import { ListProductParams, Product } from "@models/product";
import { getToken } from "@utils/storage"
import axios from "axios";
import { PRODUCT_URL_PATH } from "constants/constants";

export async function InsertProduct(payload: Product): Promise<CommonResponse<Product>> {
    try {
        const token = getToken();
        const response = await axios.post(
            `${PRODUCT_URL_PATH}`,
            payload,
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


export async function ListProducts(params?: ListProductParams): Promise<CommonResponse<Product[]>> {
    try {
      const token = getToken();
      const response = await axios.get(
          `${PRODUCT_URL_PATH}`, 
          {
              withCredentials: true,
              headers: {
                  Authorization: `Bearer ${token}`,
              },
              params: params
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
