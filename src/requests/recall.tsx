import { RECALL_PATH } from "constants/constants";
import authedClient from "@utils/apiClient";
import { Recall, RecallQueryParams, CreateRecallPayload, UpdateRecallPayload } from "@models/recall";
import { CommonResponse } from "@models/common";

export const ListRecalls = async (params: RecallQueryParams): Promise<Recall[]> => {
  try {
    const response = await authedClient.get(
      `${RECALL_PATH}`,
      {
        withCredentials: true,
        params,
      }
    );

    const responseData = await response.data;
    if (!responseData.data) {
      return [];
    }

    return responseData.data;
  } catch (error) {
    console.error("Error fetching recalls:", error);
    throw error;
  }
};

export const CreateRecall = async (payload: CreateRecallPayload): Promise<CommonResponse<Recall>> => {
  try {
    const response = await authedClient.post(
      `${RECALL_PATH}`,
      payload,
      {
        withCredentials: true,
      }
    );

    const responseData = await response.data;
    return responseData.data;
  } catch (error) {
    console.error("Error creating recall:", error);
    throw error;
  }
};

export const UpdateRecall = async (payload: UpdateRecallPayload): Promise<CommonResponse<Recall>> => {
  try {
    const response = await authedClient.patch(
      `${RECALL_PATH}`,
      payload,
      { withCredentials: true }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating recall:", error);
    throw error;
  }
};

export const GetNextRecallByPatient = async (patientUUID: string): Promise<Recall | null> => {
  try {
    const response = await authedClient.get(
      `${RECALL_PATH}/patient/${patientUUID}/next`,
      {
        withCredentials: true,
      }
    );

    const responseData = await response.data;
    return responseData.data ?? null;
  } catch (error) {
    console.error("Error fetching next recall by patient:", error);
    throw error;
  }
};

