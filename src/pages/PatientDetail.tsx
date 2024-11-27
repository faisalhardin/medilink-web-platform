import { PatientVisitsComponent } from "@components/PatientComponent";
import { useParams } from "react-router-dom";

const PatientDetail = () => {
    const { uuid } = useParams<{ uuid: string }>();
    return (
        <PatientVisitsComponent  patientUUID={uuid as string}/>
    )
}

export default PatientDetail;