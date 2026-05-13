import { useRouteParams } from '../hooks/useRouteParams';
import { EncounterPageComponent } from '@components/EncounterPage';

interface EncounterPageProps {
  id?: string;
}

export default function EncounterPage(props: EncounterPageProps) {
  const { id } = useRouteParams(props);
  const visitId = id ? parseInt(id, 10) : 0;

  return <EncounterPageComponent visitId={visitId} />;
}
