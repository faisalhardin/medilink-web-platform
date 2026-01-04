import PatientDetailComponent from "@components/PatientDetailComponent";
import { useParams } from "react-router-dom";

const PatientDetail = () => {
    const { uuid } = useParams<{ uuid: string }>();
    return (
        <PatientDetailComponent  patient_uuid={uuid as string} />
    )
}

export default PatientDetail;