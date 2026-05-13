import { PatientVisitComponent } from '@components/PatientVisitDetail';
import { useRouteParams } from '../hooks/useRouteParams';

interface PatientVisitDetailPageProps {
  id?: string;
  isModal?: boolean;
}

export default function PatientVisitDetailPage(props: PatientVisitDetailPageProps) {
  const { id } = useRouteParams(props);
  const visitId = id ? parseInt(id, 10) : 0;

  return <PatientVisitComponent patientVisitId={visitId} />;
}
