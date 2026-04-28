import { EncounterPageComponent } from '@components/EncounterPage';
import { useRouteParams } from '../hooks/useRouteParams';

interface PatientVisitDetailPageProps {
  id?: string;
  isModal?: boolean;
}

export default function PatientVisitDetailPage(props: PatientVisitDetailPageProps) {
  const { id } = useRouteParams(props);
  const visitId = id ? parseInt(id, 10) : 0;

  return <EncounterPageComponent visitId={visitId} isModal={!!props.isModal} />;
}
