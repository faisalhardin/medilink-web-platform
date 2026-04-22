import { useRouteParams } from '../hooks/useRouteParams';
import { DiagnosisPageComponent } from '@components/DiagnosisPage';

interface DiagnosisPageProps {
  id?: string;
}

export default function DiagnosisPage(props: DiagnosisPageProps) {
  const { id } = useRouteParams(props);
  const visitId = id ? parseInt(id, 10) : 0;

  return <DiagnosisPageComponent visitId={visitId} />;
}
