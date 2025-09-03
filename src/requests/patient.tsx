import axios from "axios";
import { PATIENT_PATH, PATIENT_VISIT_DETAIL_PATH, PATIENT_VISIT_PATH } from "constants/constants";
import { getToken } from "@utils/storage";
import { GetPatientParam, GetPatientVisitParam, UpsertPatientVisitDetailParam, Patient, PatientVisit, PatientVisitDetail, RegisterPatient, UpdatePatientVisitPayload, GetPatientVisitDetailedResponse, InsertPatientVisitPayload, PatientVisitDetailed } from "@models/patient";
import { CommonResponse } from "@models/common";

export const RegisterPatientRequest = async (patientForm: RegisterPatient): Promise<CommonResponse<null>> => {
    try {
        const token = getToken();
        const response = await axios.post(
            `${PATIENT_PATH}`, patientForm, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
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

export const ListPatients = async (param:GetPatientParam | null): Promise<Patient[]> => {
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
        if (responseData.data == null) {
            return [];
        } 
        
        return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export const InsertPatientVisit = async (payload:InsertPatientVisitPayload): Promise<CommonResponse<null>> => {
    try {
        const token = getToken();
        const response = await axios.post(
            `${PATIENT_VISIT_PATH}`, payload, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
          );
        const responseData = await response.data;
        return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate theerror
        throw error;
    }
}


export const ListVisitsByPatient = async (patientID:string): Promise<PatientVisit[]> => {
    try {
        const token = getToken();
        const response = await axios.get(
            `${PATIENT_PATH}/${patientID}/visit`, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
          );

          const responseData = response.data;
          if (responseData.data == null) {
              return [];
          } 

          return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export const ListVisitsDetailed = async (params :GetPatientVisitParam): Promise<PatientVisitDetailed[]> => {
    try {
        const token = getToken();
        const response = await axios.get(
            `${PATIENT_VISIT_PATH}/detailed`, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                params: params,
              },
          );

          const responseData = response.data;
          if (responseData.data == null) {
              return [];
          } 

          return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export async function UpdatePatientVisit(params:UpdatePatientVisitPayload): Promise<PatientVisit> {
    try {
      const token = getToken();
      const response = await axios.patch(
          `${PATIENT_VISIT_PATH}/${params.id}`, 
          params,
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
      return await response.data.data.journey_points;
    } catch (error) {
      throw error;
    }
  }

  export async function GetPatientVisitDetailedByID(patientVisitID:number): Promise<GetPatientVisitDetailedResponse> {
    try {
      const token = getToken();
      const response = await axios.get(
          `${PATIENT_VISIT_PATH}/${patientVisitID}`, 
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
      return await response.data.data;
    } catch (error) {
      throw error;
    }
  }

export const ListVisitsByParams = async (params:GetPatientVisitParam): Promise<PatientVisit[]> => {
    try {
        const token = getToken();
        const response = await axios.get(
            `${PATIENT_VISIT_PATH}`, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                params: params,
              }
          );
          const responseData = response.data;
          if (responseData.data == null) {
              return [];
          } 

          return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}



export const UpsertPatientVisitDetailRequest = async (patientVisitDetail: UpsertPatientVisitDetailParam): Promise<CommonResponse<PatientVisitDetail>> => {
    try {
        const token = getToken();
        const response = await axios.post(
            `${PATIENT_VISIT_DETAIL_PATH}`, patientVisitDetail, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
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

export const GetPatientVisitDetailRequest = async (id: number): Promise<CommonResponse<PatientVisitDetail[]>> => {
    try {
        const token = getToken();
        const response = await axios.get(
            `${PATIENT_VISIT_PATH}/${id}/detail`, {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
          );
          const responseData = response.data;
          return responseData;
      } catch (error) {
          console.error("Error fetching response data:", error);
          // Optional: throw or return a rejected promise to propagate the error
          return {
            data: [],
            message: "Error fetching data",
          };
      }
  }