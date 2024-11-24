import { PatientVisitsComponent, PatientListComponent, PatientRegistration } from "@components/PatientComponent";
import { GetPatientParam } from "@models/patient";

const PatientPage = () => {

    const patientParams:GetPatientParam = {
        date_of_birth: "",
        institution_id: 0,
        name: "",
        nik: ""
      };
    return (
        <>
            <PatientListComponent/>
        </>
    )
}

export default PatientPage

export const PatientDetail = () => {
    return
}