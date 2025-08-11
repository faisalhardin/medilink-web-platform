import { CommonResponse } from "@models/common";
import { OrderProductRequest } from "@models/patient";
import { Product } from "@models/product";
import { getToken } from "@utils/storage";
import axios from "axios";
import { PATIENT_VISIT_PRODUCT_ORDER_PATH } from "constants/constants";

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