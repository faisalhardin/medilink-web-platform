import { PatientVisitsComponent } from "@components/PatientComponent";
import { useParams } from "react-router-dom";

const PatientDetail = () => {
    const { uuid } = useParams<{ uuid: string }>();
    return (
        <PatientVisitsComponent  patient_uuid={uuid as string} limit={5} offset={1}/>
    )
}

export default PatientDetail;