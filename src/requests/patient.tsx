import axios from "axios";
import { PATIENT_PATH } from "constants/constants";
import { getToken } from "@utils/storage";
import { GetPatientParam, Patient, PatientVisit } from "@models/patient";


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
        console.error("Error fetching institution data:", error);
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

          const responseData = await response.data;
          if (responseData.data == null) {
              return [];
          } 

          return responseData.data;
    } catch (error) {
        console.error("Error fetching institution data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}