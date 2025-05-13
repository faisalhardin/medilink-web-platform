import { PatientVisitComponent } from '@components/PatientVisitDetail'
import { useRouteParams } from '../hooks/useRouteParams';

interface PatientVisitDetailPageProps {
  id?: string; // Optional because it might come from useParams() instead
}

 export default function PatientVisitDetailPage (props: PatientVisitDetailPageProps) {
    const { id } = useRouteParams(props);
    console.log("id", id);
    const numericId = id ? parseInt(id, 10) : 0;

    return (
        <PatientVisitComponent patientVisitId={numericId} />
    )
}
