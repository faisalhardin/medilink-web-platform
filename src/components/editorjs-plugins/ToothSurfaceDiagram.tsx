import React from 'react';
import { ToothSurfaceDiagramProps, Surface } from './types';
import { getSurfacesForToothType } from './odontogramCodes';


const getOcclusalToothPath = () => {
    return <path
      d="M 50 20 L 150 20 L 150 110 L 50 110 Z 
         M 80 50 L 120 50 L 120 80 L 80 80 Z
         M 50 20 L 80 50 L 80 80 L 50 110 Z
         M 80 80 L 120 80 L 150 110 L 50 110 Z
         M 120 50 L 150 20 L 150 110 L 120 80 Z
         M 50 20 L 80 50 L 120 50 L 150 20 Z"
      fill="#ffffff"
      stroke="#374151"
      strokeWidth="1"
    />
  };

const getIncisalToothPath = () => {
    return <path
              d="M 50 20 L 150 20 L 150 110 L 50 110 Z 
              M 50 20 L 91 65 L 50 110 Z
              M 91 65 L 109 66 L 150 110  L 50 110 Z
              M 109 65 L 150 20  L 150 110 Z
               M 50 20 L 91 66 L 109 66 L 150 20 Z
              "
              fill="#ffffff"
              stroke="#374151"
              strokeWidth="1"
            />
};

const getTrapezoidPath = (area: any, surface: Surface, swapMD: boolean = false) => {
    const { x, y, width, height } = area;
    
    switch (surface) {
      case 'V': // Vestibular - top wider
        return `M ${x} ${y} L ${x + width} ${y} L ${x + width * 0.7} ${y + height} L ${x + width * 0.3} ${y + height} Z`;
      case 'L': // Lingual - bottom wider  
        return `M ${x + width * 0.3} ${y} L ${x + width * 0.7} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
      case 'M': // Mesial - left side (or right if swapped)
        if (swapMD) {
          return `M ${x} ${y + height * 0.33} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height * 0.66} Z`;
        }
        return `M ${x} ${y} L ${x + width} ${y + height * 0.33} L ${x + width} ${y + height * 0.66} L ${x} ${y + height} Z`;
      case 'D': // Distal - right side (or left if swapped)
        if (swapMD) {
          return `M ${x} ${y} L ${x + width} ${y + height * 0.33} L ${x + width} ${y + height * 0.66} L ${x} ${y + height} Z`;
        }
        return `M ${x} ${y + height * 0.33} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height * 0.66} Z`;
      default: // O, I - keep rectangular
        return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    }
  };

const getTrianglePath = (area: any, surface: Surface, swapMD: boolean = false) => {
    const { x, y, width, height } = area;
    
    switch (surface) {
        case 'V': // Vestibular - top wider
          return `M ${x} ${y} L ${x + width} ${y} L ${x + width * 0.6} ${y + height} L ${x + width * 0.4} ${y + height} Z`;
        case 'L': // Lingual - bottom wider  
          return `M ${x + width * 0.4} ${y} L ${x + width * 0.6} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
        case 'M': // Mesial - left side (or right if swapped)
          if (swapMD) {
            return `M ${x + width* 0.2} ${y + height * 0.5} L ${x + width} ${y} L ${x + width} ${y + height} Z`;
          }
          return `M ${x} ${y} L ${x + width * 0.8} ${y + height * 0.5} L ${x} ${y + height} Z`;
        case 'D': // Distal - right side (or left if swapped)
          if (swapMD) {
            return `M ${x} ${y} L ${x + width * 0.8} ${y + height * 0.5} L ${x} ${y + height} Z`;
          }
          return `M ${x + width* 0.2} ${y + height * 0.5} L ${x + width} ${y} L ${x + width} ${y + height} Z`;
        default: // O, I - keep rectangular
          return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
      }
  };

export const ToothSurfaceDiagram: React.FC<ToothSurfaceDiagramProps> = ({
  toothId,
  toothData,
  onSurfaceClick,
  selectedSurface
}) => {
  // Determine tooth type based on tooth ID
  const getToothType = (toothId: string): 'incisor' | 'canine' | 'premolar' | 'molar' => {
    const toothNum = parseInt(toothId);
    const toothNumMod = toothNum % 10;
    if (toothNumMod <= 2) return 'incisor';
    if (toothNumMod === 3) return 'canine';
    if (toothNumMod <= 5) return 'premolar';
    return 'molar';
  };

  // Get quadrant from tooth ID (first digit)
  const getQuadrantFromToothId = (toothId: string): number => {
    return parseInt(toothId[0]);
  };

  const toothType = getToothType(toothId);
  const quadrant = getQuadrantFromToothId(toothId);
  const swapMD = quadrant === 1 || quadrant === 4;
  const applicableSurfaces = getSurfacesForToothType(toothType);

  const getSurfaceAreasOcclusal = (swapMD: boolean) => {
    if (swapMD) {
      // For quadrants 1 and 4, swap M and D positions
      return {
        O: { x: 80, y: 50, width: 40, height: 30, label: 'Occlusal' },
        I: { x: 80, y: 50, width: 40, height: 30, label: 'Incisal' },
        M: { x: 120, y: 20, width: 30, height: 90, label: 'Mesial' }, // Swapped to right
        D: { x: 50, y: 20, width: 30, height: 90, label: 'Distal' }, // Swapped to left
        V: { x: 50, y: 20, width: 100, height: 30, label: 'Vestibular' },
        L: { x: 50, y: 80, width: 100, height: 30, label: 'Lingual' }
      };
    }
    return {
      O: { x: 80, y: 50, width: 40, height: 30, label: 'Occlusal' },
      I: { x: 80, y: 50, width: 40, height: 30, label: 'Incisal' },
      M: { x: 50, y: 20, width: 30, height: 90, label: 'Mesial' }, // Left
      D: { x: 120, y: 20, width: 30, height: 90, label: 'Distal' }, // Right
      V: { x: 50, y: 20, width: 100, height: 30, label: 'Vestibular' },
      L: { x: 50, y: 80, width: 100, height: 30, label: 'Lingual' }
    };
  };

  const getSurfaceAreasIncisor = (swapMD: boolean) => {
    if (swapMD) {
      // For quadrants 1 and 4, swap M and D positions
      return {
        O: { x: 0, y: 0, width: 0, height: 0, label: 'Occlusal' },
        I: { x: 0, y: 0, width: 0, height: 0, label: 'Incisal' },
        M: { x: 100, y: 20, width: 50, height: 90, label: 'Mesial' }, // Swapped to right
        D: { x: 50, y: 20, width: 50, height: 90, label: 'Distal' }, // Swapped to left
        V: { x: 50, y: 20, width: 100, height: 45, label: 'Vestibular' },
        L: { x: 50, y: 66, width: 100, height: 45, label: 'Lingual' }
      };
    }
    return {
      O: { x: 0, y: 0, width: 0, height: 0, label: 'Occlusal' },
      I: { x: 0, y: 0, width: 0, height: 0, label: 'Incisal' },
      M: { x: 50, y: 20, width: 50, height: 90, label: 'Mesial' }, // Left
      D: { x: 100, y: 20, width: 50, height: 90, label: 'Distal' }, // Right
      V: { x: 50, y: 20, width: 100, height: 45, label: 'Vestibular' },
      L: { x: 50, y: 66, width: 100, height: 45, label: 'Lingual' }
    };
  };

  const isOcclusal = (toothType: 'incisor' | 'canine' | 'premolar' | 'molar') => {
    return toothType === 'molar' || toothType === 'premolar';
  };

  const surfaceAreas = (toothType: 'incisor' | 'canine' | 'premolar' | 'molar') => {
    return isOcclusal(toothType) ? getSurfaceAreasOcclusal(swapMD) : getSurfaceAreasIncisor(swapMD);
  };
  const getSurfaceColor = (surface: Surface) => {
    if (!toothData) return '#f3f4f6';
    
    const surfaceData = toothData.surfaces.find(s => s.surface === surface);
    return surfaceData ? surfaceData.color : '#f3f4f6';
  };

  const getSurfacePattern = (surface: Surface) => {
    if (!toothData) return 'solid';
    
    const surfaceData = toothData.surfaces.find(s => s.surface === surface);
    return surfaceData?.pattern || 'solid';
  };

  const isSurfaceMarked = (surface: Surface) => {
    if (!toothData) return false;
    return toothData.surfaces.some(s => s.surface === surface);
  };

  const renderSurfacePattern = (surface: Surface, _area: any) => {
    const pattern = getSurfacePattern(surface);
    
    if (pattern === 'hatched') {
      return (
        <defs>
          <pattern id={`hatch-${surface}`} patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="#000" strokeWidth="0.5"/>
          </pattern>
        </defs>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Surface Selection
        </h4>
        
        <div className="relative">
          <svg
            viewBox="0 0 200 150"
            className="w-full h-auto"
            style={{ minHeight: '300px' }}
          >
            {/* 5-segment tooth outline - middle rectangle (O) with trapezoid segments (M, D, V, L) */}
            {isOcclusal(toothType) ?  getOcclusalToothPath() : getIncisalToothPath() }
            {/* Surface areas - only show applicable surfaces */}
            {applicableSurfaces.map(surface => {
              const area = surfaceAreas(toothType)[surface];
              const isMarked = isSurfaceMarked(surface as Surface);
              const isSelected = selectedSurface === surface;
              const color = getSurfaceColor(surface as Surface);
              
              return (
                <g key={surface}>
                  {renderSurfacePattern(surface as Surface, area)}
                  
                  {/* Surface clickable area */}
                  <path
                   d={ isOcclusal(toothType) ? getTrapezoidPath(area, surface as Surface, swapMD) : getTrianglePath(area, surface as Surface, swapMD)}
                    fill={isMarked ? color : 'transparent'}
                    fillOpacity={isMarked ? 0.7 : 0}
                    stroke={isSelected ? '#3b82f6' : isMarked ? '#000' : '#d1d5db'}
                    strokeWidth={isSelected ? 3 : isMarked ? 2 : 0}
                    strokeDasharray={isMarked ? 'none' : '5,5'}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => onSurfaceClick(surface as Surface)}
                  />
                  
                  {/* Surface label */}
                  <text
                    x={area.x + (area.width / 2) + (!isOcclusal(toothType) ? ((swapMD ? (surface === 'M' ? 1 : surface === 'D' ? -1 : 0) : (surface === 'M' ? -1 : surface === 'D' ? 1 : 0))) * 10 : 0)}
                    y={area.y + area.height / 2}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-700 pointer-events-none"
                  >
                    {surface }
                  </text>
                  
                  {/* Pattern overlay for hatched surfaces */}
                  {isMarked && getSurfacePattern(surface as Surface) === 'hatched' && (
                    <rect
                      x={area.x}
                      y={area.y}
                      width={area.width}
                      height={area.height}
                      fill={`url(#hatch-${surface})`}
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}   
          </svg>
        </div>
        
        {/* Surface legend - only show applicable surfaces */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {applicableSurfaces.map(surface => {
            const area = surfaceAreas(toothType)[surface];
            return (
              <div
                key={surface}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  selectedSurface === surface
                    ? 'bg-blue-100 border-blue-300'
                    : isSurfaceMarked(surface as Surface)
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => onSurfaceClick(surface as Surface)}
              >
                <div className="font-medium">{surface}</div>
                <div className="text-gray-600">{area.label}</div>
              </div>
            );
          })}
        </div>
        
        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-600 text-center">
          Click on a surface to mark it with a condition
        </div>
      </div>
    </div>
  );
};
