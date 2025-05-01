import { PatientVisitComponent } from '@components/PatientVisitDetail'
import { useParams } from 'react-router-dom';

export const PatientVisitDetailPage = () => {
    const { id } = useParams();
    const numericId = id ? parseInt(id, 10) : 0;

    return (
        <PatientVisitComponent patientVisitId={numericId} />
    )
}
