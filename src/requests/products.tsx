import { CommonResponse } from "@models/common";
import { ListOrderProductRequest, OrderProductRequest } from "@models/patient";
import { AssignedProductRequest, InsertProductRequest, ListProductParams, Product } from "@models/product";
import { getToken } from "@utils/storage"
import axios from "axios";
import { PATIENT_PATH, PATIENT_VISIT_PATH, PATIENT_VISIT_PRODUCT_ORDER_PATH, PRODUCT_URL_PATH } from "constants/constants";

export async function InsertProduct(payload: InsertProductRequest): Promise<CommonResponse<Product>> {
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
      const responseData = response.data;
      return responseData.data;
    } catch (error) {
        throw error;
    }
  }

export async function GetAssignedProducts(param: number) {
    try {
        const token = getToken();
        const response = await axios.get(
            `${PATIENT_PATH}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: param,
            }
        );

        const responseData = await response.data;
        return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export async function AssignProductToVisit(payload: AssignedProductRequest, id_dtl_patient_visit : number) {
    try {
        const token = getToken();
        const response = await axios.post(
            `${PATIENT_VISIT_PATH}/${id_dtl_patient_visit}/product`,
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

export async function RemoveAssignedProduct(param: number) {
    try {
        const token = getToken();
        const response = await axios.get(
            `${PATIENT_PATH}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: param,
            }
        );

        const responseData = await response.data;
        return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export async function OrderProduct(payload: OrderProductRequest): Promise<CommonResponse<Product>> {
    try {
        const token = getToken();
        const response = await axios.post(
            `${PATIENT_VISIT_PRODUCT_ORDER_PATH}`,
            payload,
            {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`
                },
            }
        );
        const responseData = await response.data;
        return responseData;
    } catch (error:any) {
        if(error.response.data.error_messages.length > 0) {
            alert(error.response.data.error_messages[0].error_description)
        }
        throw error;
    }
}

export async function ListOrderedProduct(param: ListOrderProductRequest) {
    try {
        const token = getToken();
        const response = await axios.get(
            `${PATIENT_VISIT_PRODUCT_ORDER_PATH}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: param,
            }
        );
        const responseData = await response.data;
        return responseData.data;
    } catch (error:any) {
        if(error.response.data.error_messages.length > 0) {
            console.error(error.response.data.error_messages[0]);
        }
        throw error;
    }
}