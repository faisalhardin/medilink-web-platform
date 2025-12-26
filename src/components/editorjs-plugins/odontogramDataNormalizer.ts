import { ToothData, ToothSurfaceData } from './types';
import { ODONTOGRAM_CODES_MAP } from './odontogramCodes';

/**
 * Normalizes tooth data by overriding backend colors/patterns with client-side definitions
 * This ensures consistent visual representation regardless of backend data
 */
export const normalizeToothData = (toothData: ToothData): ToothData => {
  if (!toothData) return toothData;

  const normalized: ToothData = {
    ...toothData,
    surfaces: toothData.surfaces?.map(normalizeSurfaceData) || []
  };

  return normalized;
};

/**
 * Normalizes a single surface data by looking up the code in ODONTOGRAM_CODES_MAP
 * and using the client-side color, pattern, and symbol definitions
 */
export const normalizeSurfaceData = (surfaceData: ToothSurfaceData): ToothSurfaceData => {
  const codeDefinition = ODONTOGRAM_CODES_MAP[surfaceData.code];
  
  if (!codeDefinition) {
    // If code not found, return as-is
    console.warn(`[OdontogramNormalizer] Unknown code: ${surfaceData.code}`);
    return surfaceData;
  }

  return {
    ...surfaceData,
    // Override with client-side definitions
    color: codeDefinition.color,
    pattern: codeDefinition.pattern,
    condition: codeDefinition.name, // Use official name from client-side
  };
};

/**
 * Normalizes an entire odontogram data object (all teeth)
 */
export const normalizeOdontogramData = (odontogramData: { teeth: { [key: string]: ToothData } }): { teeth: { [key: string]: ToothData } } => {
  if (!odontogramData || !odontogramData.teeth) {
    return { teeth: {} };
  }

  const normalizedTeeth: { [key: string]: ToothData } = {};
  
  Object.keys(odontogramData.teeth).forEach(toothId => {
    normalizedTeeth[toothId] = normalizeToothData(odontogramData.teeth[toothId]);
  });

  return {
    ...odontogramData,
    teeth: normalizedTeeth
  };
};


