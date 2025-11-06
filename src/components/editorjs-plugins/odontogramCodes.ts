// Indonesian Odontogram Codes based on InfoDRG standards
// Reference: https://infodrg.com/kaidah-penulisan-odontogram/

export interface OdontogramCode {
  code: string;
  name: string;
  description: string;
  color: string;
  pattern: 'solid' | 'hatched' | 'outline' | 'text' | 'symbol';
  symbol?: string; // For text/symbol patterns
  appliesTo: 'surface' | 'wholeTooth' | 'both';
  surfaces?: string[]; // Which surfaces this applies to
  category: 'status' | 'pathology' | 'missing' | 'restoration' | 'indirect' | 'advanced' | 'prosthetic';
}

export const ODONTOGRAM_CODES: OdontogramCode[] = [
  // Basic Tooth Status
  {
    code: 'sou',
    name: 'Sound',
    description: 'Healthy tooth, no abnormalities',
    color: '#ffffff',
    pattern: 'solid',
    appliesTo: 'wholeTooth',
    category: 'status'
  },
  {
    code: 'non',
    name: 'No Information',
    description: 'Unknown condition',
    color: '#000000',
    pattern: 'text',
    symbol: 'non',
    appliesTo: 'wholeTooth',
    category: 'status'
  },
  {
    code: 'une',
    name: 'Unerupted',
    description: 'Tooth not erupted (needs X-ray)',
    color: '#000000',
    pattern: 'text',
    symbol: 'une',
    appliesTo: 'wholeTooth',
    category: 'status'
  },
  {
    code: 'pre',
    name: 'Partial Erupted',
    description: 'Partially visible tooth',
    color: '#000000',
    pattern: 'text',
    symbol: 'pre',
    appliesTo: 'wholeTooth',
    category: 'status'
  },
  {
    code: 'imx',
    name: 'Impacted',
    description: 'Impacted tooth (needs X-ray)',
    color: '#000000',
    pattern: 'text',
    symbol: 'imx',
    appliesTo: 'wholeTooth',
    category: 'status'
  },
  {
    code: 'ano',
    name: 'Anomali',
    description: 'Anatomical abnormality',
    color: '#000000',
    pattern: 'text',
    symbol: 'ano',
    appliesTo: 'wholeTooth',
    category: 'status'
  },

  // Pathological Conditions
  {
    code: 'car',
    name: 'Caries',
    description: 'Cavity',
    color: '#ffffff',
    pattern: 'outline',
    appliesTo: 'surface',
    category: 'pathology'
  },
  {
    code: 'cfr',
    name: 'Crown Fractured',
    description: 'Crown fracture - part of crown is broken',
    color: '#000000',
    pattern: 'symbol',
    appliesTo: 'wholeTooth',
    symbol: '#',
    category: 'pathology'
  },
  {
    code: 'nvt',
    name: 'Non Vital',
    description: 'Tooth has lost vitality (necrotic pulp)',
    color: '#000000',
    pattern: 'symbol',
    appliesTo: 'wholeTooth',
    symbol: 'triangle',
    category: 'pathology'
  },
  {
    code: 'nca',
    name: 'Non-Cavitated Caries',
    description: 'Early caries',
    color: '#dc2626',
    pattern: 'solid',
    appliesTo: 'surface',
    surfaces: ['M', 'O', 'D', 'V', 'L'],
    category: 'pathology'
  },
  {
    code: 'fra',
    name: 'Fracture',
    description: 'Broken tooth',
    color: '#000000',
    pattern: 'symbol',
    symbol: 'diagonal',
    appliesTo: 'wholeTooth',
    category: 'pathology'
  },
  {
    code: 'rrx',
    name: 'Radix',
    description: 'Root remains',
    color: '#000000',
    pattern: 'symbol',
    symbol: 'V',
    appliesTo: 'wholeTooth',
    category: 'pathology'
  },
  {
    code: 'per',
    name: 'Persistent',
    description: 'Retained primary tooth',
    color: '#000000',
    pattern: 'text',
    symbol: 'per',
    appliesTo: 'wholeTooth',
    category: 'pathology'
  },
  {
    code: 'una',
    name: 'Unavaluable',
    description: 'Cannot evaluate',
    color: '#000000',
    pattern: 'text',
    symbol: 'una',
    appliesTo: 'wholeTooth',
    category: 'pathology'
  },

  // Missing Teeth
  {
    code: 'mis',
    name: 'Missing',
    description: 'Extracted tooth',
    color: '#000000',
    pattern: 'symbol',
    symbol: 'X',
    appliesTo: 'wholeTooth',
    category: 'missing'
  },
  {
    code: 'mam',
    name: 'Missing Ante Mortem',
    description: 'Extracted pre-death (DVI)',
    color: '#000000',
    pattern: 'symbol',
    symbol: 'X',
    appliesTo: 'wholeTooth',
    category: 'missing'
  },
  {
    code: 'mpm',
    name: 'Missing Post Mortem',
    description: 'Lost post-death (DVI)',
    color: '#000000',
    pattern: 'symbol',
    symbol: 'O',
    appliesTo: 'wholeTooth',
    category: 'missing'
  },

  // Restorations (Fillings)
  {
    code: 'amf',
    name: 'Amalgam Filling',
    description: 'Metal filling',
    color: '#000000',
    pattern: 'solid',
    appliesTo: 'surface',
    surfaces: ['M', 'O', 'D', 'V', 'L'],
    category: 'restoration'
  },
  {
    code: 'gif',
    name: 'Glass Ionomer',
    description: 'GIC filling',
    color: '#16a34a',
    pattern: 'solid',
    appliesTo: 'surface',
    surfaces: ['M', 'O', 'D', 'V', 'L'],
    category: 'restoration'
  },
  {
    code: 'cof',
    name: 'Composite',
    description: 'Composite filling',
    color: '#16a34a',
    pattern: 'solid',
    appliesTo: 'surface',
    surfaces: ['M', 'O', 'D', 'V', 'L'],
    category: 'restoration'
  },
  {
    code: 'tif',
    name: 'Temporary',
    description: 'Temporary filling',
    color: '#3b82f6',
    pattern: 'solid',
    appliesTo: 'surface',
    surfaces: ['M', 'O', 'D', 'V', 'L'],
    category: 'restoration'
  },
  {
    code: 'fis',
    name: 'Fissure Sealant',
    description: 'Preventive sealant',
    color: '#ebc3da',
    pattern: 'solid',
    appliesTo: 'surface',
    surfaces: ['O'],
    category: 'restoration'
  },

  // Indirect Restorations
  {
    code: 'inl',
    name: 'Inlay',
    description: 'Inlay restoration',
    color: '#000000',
    pattern: 'solid',
    appliesTo: 'wholeTooth',
    category: 'indirect'
  },
  {
    code: 'onl',
    name: 'Onlay',
    description: 'Onlay restoration',
    color: '#000000',
    pattern: 'solid',
    appliesTo: 'wholeTooth',
    category: 'indirect'
  },
  {
    code: 'fmc',
    name: 'Full Metal Crown',
    description: 'Metal crown',
    color: '#000000',
    pattern: 'solid',
    appliesTo: 'wholeTooth',
    category: 'indirect'
  },
  {
    code: 'poc',
    name: 'Porcelain Crown',
    description: 'Ceramic crown',
    color: '#16a34a',
    pattern: 'outline',
    appliesTo: 'wholeTooth',
    category: 'indirect'
  },
  {
    code: 'mpc',
    name: 'Metal-Porcelain Crown',
    description: 'PFM crown',
    color: '#16a34a',
    pattern: 'outline',
    appliesTo: 'wholeTooth',
    category: 'indirect'
  },
  {
    code: 'gmc',
    name: 'Gold Metal Crown',
    description: 'Gold crown',
    color: '#dc2626',
    pattern: 'outline',
    appliesTo: 'wholeTooth',
    category: 'indirect'
  },

  // Advanced Treatments
  {
    code: 'rct',
    name: 'Root Canal Treatment',
    description: 'Endodontic treatment',
    color: '#000000',
    pattern: 'symbol',
    symbol: 'diagonal',
    appliesTo: 'wholeTooth',
    category: 'advanced'
  },
  {
    code: 'ipx',
    name: 'Implant',
    description: 'Dental implant',
    color: '#6b7280',
    pattern: 'text',
    symbol: 'ipx',
    appliesTo: 'wholeTooth',
    category: 'advanced'
  },
  {
    code: 'meb',
    name: 'Metal Bridge',
    description: 'Metal bridge',
    color: '#000000',
    pattern: 'outline',
    appliesTo: 'wholeTooth',
    category: 'advanced'
  },
  {
    code: 'pob',
    name: 'Porcelain Bridge',
    description: 'Ceramic bridge',
    color: '#16a34a',
    pattern: 'outline',
    appliesTo: 'wholeTooth',
    category: 'advanced'
  },
  {
    code: 'pon',
    name: 'Pontic',
    description: 'Artificial tooth',
    color: '#6b7280',
    pattern: 'symbol',
    symbol: 'X',
    appliesTo: 'wholeTooth',
    category: 'advanced'
  },
  {
    code: 'abu',
    name: 'Abutment',
    description: 'Bridge support',
    color: '#6b7280',
    pattern: 'outline',
    appliesTo: 'wholeTooth',
    category: 'advanced'
  },

  // Prosthetics
  {
    code: 'prd',
    name: 'Partial Denture',
    description: 'Removable partial',
    color: '#000000',
    pattern: 'text',
    symbol: 'prd',
    appliesTo: 'wholeTooth',
    category: 'prosthetic'
  },
  {
    code: 'acr',
    name: 'Acrylic',
    description: 'Acrylic denture',
    color: '#ec4899',
    pattern: 'solid',
    appliesTo: 'wholeTooth',
    category: 'prosthetic'
  },
  {
    code: 'fld',
    name: 'Full Denture',
    description: 'Complete denture',
    color: '#000000',
    pattern: 'outline',
    appliesTo: 'wholeTooth',
    category: 'prosthetic'
  }
];

// Create a map for fast O(1) code lookups
export const ODONTOGRAM_CODES_MAP: Record<string, OdontogramCode> = 
  ODONTOGRAM_CODES.reduce((acc, code) => {
    acc[code.code] = code;
    return acc;
  }, {} as Record<string, OdontogramCode>);

// Helper functions
export const getCodeByCode = (code: string): OdontogramCode | undefined => {
  return ODONTOGRAM_CODES_MAP[code];
};

export const getCodesByCategory = (category: string): OdontogramCode[] => {
  return ODONTOGRAM_CODES.filter(c => c.category === category);
};

export const getCodesBySurface = (surface: string): OdontogramCode[] => {
  return ODONTOGRAM_CODES.filter(c => 
    c.appliesTo === 'surface' && 
    (!c.surfaces || c.surfaces.includes(surface))
  );
};

export const getWholeToothCodes = (): OdontogramCode[] => {
  return ODONTOGRAM_CODES.filter(c => c.appliesTo === 'wholeTooth' || c.appliesTo === 'both');
};

// Priority order for whole tooth codes (lower number = higher priority)
// 1. Missing/Status (missing: mis, mam, mpm + status: non, une, pre, imx, ano)
// 2. Pathology (pathology: car, cfr, nvt, nca, fra, rrx, per, una)
// 3. Restoration/Indirect/Advanced/Prosthetic (all other categories)
export const getCodePriority = (code: string): number => {
  const codeData = ODONTOGRAM_CODES_MAP[code];
  if (!codeData) return 999; // Unknown codes have lowest priority
  
  switch (codeData.category) {
    case 'missing':
    case 'status':
      return 1; // Highest priority
    case 'pathology':
      return 2; // Second priority
    case 'restoration':
    case 'indirect':
    case 'advanced':
    case 'prosthetic':
      return 3; // Third priority
    default:
      return 999;
  }
};

// Get the most critical (highest priority) code from an array
export const getMostCriticalCode = (codes: string[]): string | null => {
  if (!codes || codes.length === 0) return null;
  
  // Sort by priority, then by order in ODONTOGRAM_CODES array
  const sortedCodes = [...codes].sort((a, b) => {
    const priorityA = getCodePriority(a);
    const priorityB = getCodePriority(b);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, maintain order as in ODONTOGRAM_CODES
    const indexA = ODONTOGRAM_CODES.findIndex(c => c.code === a);
    const indexB = ODONTOGRAM_CODES.findIndex(c => c.code === b);
    return indexA - indexB;
  });
  
  return sortedCodes[0];
};

// Normalize wholeToothCode to array format (handles both string and array)
export const normalizeWholeToothCode = (code: string | string[] | undefined): string[] => {
  if (!code) return [];
  if (Array.isArray(code)) return code.filter(c => c && c !== '');
  return code ? [code] : [];
};

// Surface definitions
export const SURFACES = ['M', 'O', 'I', 'D', 'V', 'L'] as const;
export type Surface = typeof SURFACES[number];

export const SURFACE_NAMES: Record<Surface, string> = {
  M: 'Mesial',
  O: 'Occlusal',
  I: 'Incisal',
  D: 'Distal',
  V: 'Vestibular',
  L: 'Lingual'
};

export const SURFACE_DESCRIPTIONS: Record<Surface, string> = {
  M: 'Surface toward center/front',
  O: 'Chewing/biting surface (top)',
  I: 'Cutting/biting edge (incisors/canines)',
  D: 'Surface toward back',
  V: 'Outer/cheek-facing surface',
  L: 'Inner/tongue-facing surface'
};

// Get applicable surfaces for tooth type
export const getSurfacesForToothType = (toothType: 'incisor' | 'canine' | 'premolar' | 'molar'): Surface[] => {
  switch (toothType) {
    case 'incisor':
    case 'canine':
      return ['M', 'D', 'V', 'L']; // No occlusal surface
    case 'premolar':
    case 'molar':
      return ['M', 'O', 'D', 'V', 'L']; // Has occlusal surface
    default:
      return ['M', 'O', 'D', 'V', 'L'];
  }
};
