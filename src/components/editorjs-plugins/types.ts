// Types for the odontogram plugin

import { Surface } from './odontogramCodes';

// Re-export Surface for convenience
export type { Surface } from './odontogramCodes';

export interface ToothSurfaceData {
  surface: Surface;
  code: string; // amf, gif, car, etc.
  condition: string; // Display name
  color: string; // Color code
  pattern?: 'solid' | 'hatched' | 'outline' | 'text' | 'symbol';
  notes?: string;
}

export interface ToothData {
  id: string; // FDI: "18", "31", etc.
  status?: string; // sou, non, une, mis, etc.
  surfaces: ToothSurfaceData[];
  wholeToothCode?: string; // For fmc, poc, ipx, etc.
  generalNotes?: string;
}

export interface OdontogramData {
  teeth: { [key: string]: ToothData };
}

export interface OdontogramToolConfig {
  readOnly?: boolean;
}

export interface ToothSurfaceModalProps {
  toothId: string;
  toothData?: ToothData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toothData: ToothData) => void;
}

export interface DentitionDiagramProps {
  teethData?: { [key: string]: ToothData };
  onToothClick: (toothId: string) => void;
  isEditable: boolean;
}

export interface ToothSurfaceDiagramProps {
  toothId: string;
  toothData?: ToothData;
  onSurfaceClick: (surface: Surface) => void;
  selectedSurface?: Surface;
}

export interface SurfaceIndicatorsProps {
  toothData: ToothData;
  toothPosition: { x: number; y: number; width: number; height: number };
}

// FDI tooth positions and names
export const TOOTH_NAMES: { [key: string]: string } = {
  // Upper Right (Quadrant 1)
  '18': 'Upper Right Third Molar',
  '17': 'Upper Right Second Molar',
  '16': 'Upper Right First Molar',
  '15': 'Upper Right Second Premolar',
  '14': 'Upper Right First Premolar',
  '13': 'Upper Right Canine',
  '12': 'Upper Right Lateral Incisor',
  '11': 'Upper Right Central Incisor',
  
  // Upper Left (Quadrant 2)
  '21': 'Upper Left Central Incisor',
  '22': 'Upper Left Lateral Incisor',
  '23': 'Upper Left Canine',
  '24': 'Upper Left First Premolar',
  '25': 'Upper Left Second Premolar',
  '26': 'Upper Left First Molar',
  '27': 'Upper Left Second Molar',
  '28': 'Upper Left Third Molar',
  
  // Lower Left (Quadrant 3)
  '38': 'Lower Left Third Molar',
  '37': 'Lower Left Second Molar',
  '36': 'Lower Left First Molar',
  '35': 'Lower Left Second Premolar',
  '34': 'Lower Left First Premolar',
  '33': 'Lower Left Canine',
  '32': 'Lower Left Lateral Incisor',
  '31': 'Lower Left Central Incisor',
  
  // Lower Right (Quadrant 4)
  '41': 'Lower Right Central Incisor',
  '42': 'Lower Right Lateral Incisor',
  '43': 'Lower Right Canine',
  '44': 'Lower Right First Premolar',
  '45': 'Lower Right Second Premolar',
  '46': 'Lower Right First Molar',
  '47': 'Lower Right Second Molar',
  '48': 'Lower Right Third Molar',
};