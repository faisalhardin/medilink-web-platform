import type { ContributionSource, ContributionSourceType } from '@models/compensation';

const TYPE_LABELS: Record<ContributionSourceType, string> = {
  procedure: 'Procedure',
  diagnosis: 'Diagnosis',
  anamnesa: 'Anamnesa',
  journey: 'Journey',
  manual: 'Manual',
};

const TYPE_LABELS_ID: Record<ContributionSourceType, string> = {
  procedure: 'Prosedur',
  diagnosis: 'Diagnosis',
  anamnesa: 'Anamnesa',
  journey: 'Journey',
  manual: 'Manual',
};

/** Chip text: type + optional label (e.g. "Procedure: Scaling"). */
export function formatSourceChip(
  source: ContributionSource,
  locale: 'en' | 'id' = 'en'
): string {
  const typeLabel =
    locale === 'id' ? TYPE_LABELS_ID[source.type] : TYPE_LABELS[source.type];
  if (source.label) {
    return `${typeLabel}: ${source.label}`;
  }
  return typeLabel;
}

export function sourceTypeColor(
  type: ContributionSourceType
): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' {
  switch (type) {
    case 'procedure':
      return 'primary';
    case 'diagnosis':
      return 'info';
    case 'anamnesa':
      return 'secondary';
    case 'journey':
      return 'default';
    case 'manual':
      return 'warning';
    default:
      return 'default';
  }
}

export function typeLabel(
  type: ContributionSourceType,
  locale: 'en' | 'id' = 'en'
): string {
  return locale === 'id' ? TYPE_LABELS_ID[type] : TYPE_LABELS[type];
}
