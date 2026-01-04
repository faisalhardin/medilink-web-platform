import { PATIENT_PATH, PATIENT_VISIT_DETAIL_PATH, PATIENT_VISIT_PATH } from "constants/constants";
import { GetPatientParam, GetPatientVisitParam, UpsertPatientVisitDetailParam, Patient, PatientVisit, PatientVisitDetail, RegisterPatient, UpdatePatientVisitPayload, GetPatientVisitDetailedResponse, InsertPatientVisitPayload, PatientVisitDetailed } from "@models/patient";
import { CommonResponse } from "@models/common";
import { ArchiveJourneyPointRequest } from "@models/journey";
import authedClient from "@utils/apiClient";

export const RegisterPatientRequest = async (patientForm: RegisterPatient): Promise<Patient> => {
    try {    
        const response = await authedClient.post(
            `${PATIENT_PATH}`, patientForm, {
                withCredentials: true,
              }
          );

        if (response.status >= 400) {
            throw new Error;
        }

        const responseData = await response.data;
        return responseData.data;
    } catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export const GetPatientByUUID = async (patient_uuid: string): Promise<Patient> => {
    try {
        const response = await authedClient.get(
            `${PATIENT_PATH}/${patient_uuid}`, {
                withCredentials: true,
            }
        );
        if (response.status >= 400) {
            throw new Error;
        }
        const responseData = await response.data;
        return responseData.data;
    }
    catch (error) {
        console.error("Error fetching response data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}

export const UpdatePatient = async (patientData: Partial<Patient>): Promise<CommonResponse<null>> => {
    try {
        const response = await authedClient.put(
            `${PATIENT_PATH}`, 
            patientData,
            {
                withCredentials: true,
            }
        );
        if (response.status >= 400) {
            throw new Error;
        }
        const responseData = await response.data;
        return responseData.data;

    } catch (error) {
        console.error("Error updating patient:", error);
        throw error;
    }
}

export const ListPatients = async (param:GetPatientParam | null): Promise<Patient[]> => {
    try {
        const response = await authedClient.get(
            `${PATIENT_PATH}`, {
                withCredentials: true,
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
        const response = await authedClient.post(
            `${PATIENT_VISIT_PATH}`, payload, {
                withCredentials: true,
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
        const response = await authedClient.get(
            `${PATIENT_PATH}/${patientID}/visit`, {
                withCredentials: true,
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
        const response = await authedClient.get(
            `${PATIENT_VISIT_PATH}/detailed`, {
                withCredentials: true,
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
      const response = await authedClient.patch(
          `${PATIENT_VISIT_PATH}/${params.id}`, 
          params,
          {
              withCredentials: true,
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
      const response = await authedClient.get(
          `${PATIENT_VISIT_PATH}/${patientVisitID}`, 
          {
              withCredentials: true,              
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
        const response = await authedClient.get(
            `${PATIENT_VISIT_PATH}`, {
                withCredentials: true,
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
        const response = await authedClient.post(
            `${PATIENT_VISIT_DETAIL_PATH}`, patientVisitDetail, {
                withCredentials: true,
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
        const response = await authedClient.get(
            `${PATIENT_VISIT_PATH}/${id}/detail`, {
                withCredentials: true,
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


export async function ArchiveVisit(params:ArchiveJourneyPointRequest) {
    try {
      const response = await authedClient.patch(
          `${PATIENT_VISIT_PATH}/archive`, 
          params,
          {
            withCredentials: true,
          }
        );
  
      if (response.status >= 400) {
        throw new Error;
      }
    } catch (error) {
      throw error;
    }
  }