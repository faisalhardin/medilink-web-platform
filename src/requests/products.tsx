import { CommonResponse } from "@models/common";
import { ListOrderProductRequest, OrderProductRequest } from "@models/patient";
import { AssignedProductRequest, InsertProductRequest, ListProductParams, Product } from "@models/product";
import authedClient from "@utils/apiClient";
import { PATIENT_PATH, PATIENT_VISIT_PATH, PATIENT_VISIT_PRODUCT_ORDER_PATH, PRODUCT_URL_PATH } from "constants/constants";

export async function InsertProduct(payload: InsertProductRequest): Promise<CommonResponse<Product>> {
    try {
        const response = await authedClient.post(
            `${PRODUCT_URL_PATH}`,
            payload,
            {
                withCredentials: true,
            }
        );
        const responseData = await response.data;
        return responseData;
    } catch (error) {
        throw error;
    }
}

export async function UpdateProduct(payload: Partial<InsertProductRequest>): Promise<CommonResponse<any>> {
    try {
        const response = await authedClient.patch(
            `${PRODUCT_URL_PATH}`,
            payload,
            {
                withCredentials: true,
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
      const response = await authedClient.get(
          `${PRODUCT_URL_PATH}`, 
          {
              withCredentials: true,
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
        const response = await authedClient.get(
            `${PATIENT_PATH}`, {
                withCredentials: true,
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
        const response = await authedClient.post(
            `${PATIENT_VISIT_PATH}/${id_dtl_patient_visit}/product`,
            payload,
            {
                withCredentials: true,
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
        const response = await authedClient.get(
            `${PATIENT_PATH}`, {
                withCredentials: true,
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
        const response = await authedClient.post(
            `${PATIENT_VISIT_PRODUCT_ORDER_PATH}`,
            payload,
            {
                withCredentials: true,
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
        const response = await authedClient.get(
            `${PATIENT_VISIT_PRODUCT_ORDER_PATH}`, {
                withCredentials: true,
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