import axios from "axios";
import { PATIENT_PATH, PATIENT_VISIT_PATH } from "constants/constants";
import { getToken } from "@utils/storage";
import { GetPatientParam, GetPatientVisitParam, Patient, PatientVisit, RegisterPatient } from "@models/patient";
import { CommonResponse } from "@models/common";


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