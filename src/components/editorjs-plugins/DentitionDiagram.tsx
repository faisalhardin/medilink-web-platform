import React from 'react';
import { DentitionDiagramProps, Surface } from './types';
import { SurfaceIndicators } from './SurfaceIndicators';
import { getSurfacesForToothType, ODONTOGRAM_CODES_MAP } from './odontogramCodes';

export const DentitionDiagram: React.FC<DentitionDiagramProps> = ({
  teethData = {},
  onToothClick,
  isEditable
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

  // Generate individual surface segment paths for occlusal teeth (molars/premolars)
  const getOcclusalToothSegments = (x: number, y: number, width: number, height: number) => {
    const w = width;
    const h = height;
    
    // Middle rectangle dimensions (Occlusal area)
    const middleW = w * 0.4; // 40% of total width
    const middleH = h * 0.4; // 40% of total height
    const middleX = x + (w - middleW) / 2; // Center the middle rectangle
    const middleY = y + (h - middleH) / 2; // Center the middle rectangle
    
    return {
      M: `M ${x} ${y} L ${middleX} ${middleY} L ${middleX} ${middleY + middleH} L ${x} ${y + h} Z`, // Left trapezoid
      O: `M ${middleX} ${middleY} L ${middleX + middleW} ${middleY} L ${middleX + middleW} ${middleY + middleH} L ${middleX} ${middleY + middleH} Z`, // Center rectangle
      D: `M ${middleX + middleW} ${middleY} L ${x + w} ${y} L ${x + w} ${y + h} L ${middleX + middleW} ${middleY + middleH} Z`, // Right trapezoid
      V: `M ${x} ${y} L ${x + w} ${y} L ${middleX + middleW} ${middleY} L ${middleX} ${middleY} Z`, // Top trapezoid
      L: `M ${middleX} ${middleY + middleH} L ${middleX + middleW} ${middleY + middleH} L ${x + w} ${y + h} L ${x} ${y + h} Z` // Bottom trapezoid
    };
  };

  // Generate individual surface segment paths for incisal teeth (incisors/canines) - NO middle segment
  const getIncisalToothSegments = (x: number, y: number, width: number, height: number) => {
    const w = width;
    const h = height;
    
    // For incisors/canines, we create 4 trapezoid segments without a middle rectangle
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    
    return {
      M: `M ${x} ${y} L ${centerX - w * 0.1} ${centerY} L ${centerX - w * 0.1} ${y + h * 0.5} L ${x} ${y + h} Z`, // Left trapezoid
      D: `M ${centerX + w * 0.1} ${centerY} L ${x + w} ${y} L ${x + w} ${y + h} L ${centerX + w * 0.1} ${y + h * 0.5} Z`, // Right trapezoid
      V: `M ${x} ${y} L ${x + w} ${y} L ${centerX + w * 0.1} ${centerY} L ${centerX - w * 0.1} ${centerY} Z`, // Top trapezoid
      L: `M ${centerX - w * 0.1} ${centerY} L ${centerX + w * 0.1} ${centerY} L ${x + w} ${y + h} L ${x} ${y + h} Z` // Bottom trapezoid
    };
  };

  // Get surface color for a specific tooth surface
  const getSurfaceColor = (toothId: string, surface: Surface): string => {
    if (!teethData) return 'transparent';
    const tooth = teethData[toothId];
    if (!tooth) return 'transparent';
    
    const surfaceData = tooth.surfaces.find(s => s.surface === surface);
    return surfaceData ? surfaceData.color : 'transparent';
  };

  const getSurfaceStrokeWidth = (toothId: string, surface: Surface): string => {
    if (!teethData) return '0.3';
    const tooth = teethData[toothId];
    if (!tooth) return '0.3';
    
    const surfaceData = tooth.surfaces.find(s => s.surface === surface && ODONTOGRAM_CODES_MAP[s.code].pattern === 'outline');
    return surfaceData ? '1' : '0.3';
  };

  // Helper function to calculate tooth position in proper dental chart layout
  const getToothPosition = (index: number, _isUpper: boolean, quadrant: number) => {
    // Uniform rectangular tooth size for all teeth
    const width = 16;
    const height = 20;
    
    // Calculate base positions for each quadrant
    let baseX, baseY;
    const toothSpacing = 20; // Space between teeth
    
    if (quadrant === 1) { // Upper Right
      baseX = 50;
      baseY = 30;
    } else if (quadrant === 2) { // Upper Left  
      baseX = 210;
      baseY = 30;
    } else if (quadrant === 3) { // Lower Left
      baseX = 210;
      baseY = 70;
    } else { // Lower Right
      baseX = 50;
      baseY = 70;
    }
    
    // Position teeth in a horizontal line with proper spacing
    const x = baseX + (index * toothSpacing);
    const y = baseY;
    
    return { x: x - width/2, y: y - height/2, width, height };
  };

  // Generate tooth positions for upper jaw (quadrants 1 & 2)
  const upperTeeth = [
    // Quadrant 1 (Upper Right) - 18 to 11
    { id: '18', ...getToothPosition(0, true, 1) },
    { id: '17', ...getToothPosition(1, true, 1) },
    { id: '16', ...getToothPosition(2, true, 1) },
    { id: '15', ...getToothPosition(3, true, 1) },
    { id: '14', ...getToothPosition(4, true, 1) },
    { id: '13', ...getToothPosition(5, true, 1) },
    { id: '12', ...getToothPosition(6, true, 1) },
    { id: '11', ...getToothPosition(7, true, 1) },
    
    // Quadrant 2 (Upper Left) - 21 to 28
    { id: '21', ...getToothPosition(0, true, 2) },
    { id: '22', ...getToothPosition(1, true, 2) },
    { id: '23', ...getToothPosition(2, true, 2) },
    { id: '24', ...getToothPosition(3, true, 2) },
    { id: '25', ...getToothPosition(4, true, 2) },
    { id: '26', ...getToothPosition(5, true, 2) },
    { id: '27', ...getToothPosition(6, true, 2) },
    { id: '28', ...getToothPosition(7, true, 2) },
  ];

  // Generate tooth positions for lower jaw (quadrants 3 & 4)
  // Arranged left to right: 48, 47, ..., 41, 31, ..., 38
  const lowerTeeth = [
    // Quadrant 4 (Lower Right) - 48 to 41 (left to right, back to front)
    { id: '48', ...getToothPosition(0, false, 4) },
    { id: '47', ...getToothPosition(1, false, 4) },
    { id: '46', ...getToothPosition(2, false, 4) },
    { id: '45', ...getToothPosition(3, false, 4) },
    { id: '44', ...getToothPosition(4, false, 4) },
    { id: '43', ...getToothPosition(5, false, 4) },
    { id: '42', ...getToothPosition(6, false, 4) },
    { id: '41', ...getToothPosition(7, false, 4) },
    
    // Quadrant 3 (Lower Left) - 31 to 38 (left to right, front to back)
    { id: '31', ...getToothPosition(0, false, 3) },
    { id: '32', ...getToothPosition(1, false, 3) },
    { id: '33', ...getToothPosition(2, false, 3) },
    { id: '34', ...getToothPosition(3, false, 3) },
    { id: '35', ...getToothPosition(4, false, 3) },
    { id: '36', ...getToothPosition(5, false, 3) },
    { id: '37', ...getToothPosition(6, false, 3) },
    { id: '38', ...getToothPosition(7, false, 3) },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Dental Chart - FDI Notation
        </h3>
        
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 400 100"
            className="w-full h-auto"
            style={{ minHeight: '200px' }}
          >
            <polygon
              points="196,7 204,7 200,17"
              fill="#64748b"
            />
            
            {/* Upper jaw teeth */}
            {upperTeeth.map((tooth) => {
              const toothType = getToothType(tooth.id);
              const applicableSurfaces = getSurfacesForToothType(toothType);
              const segments = toothType === 'incisor' || toothType === 'canine' 
                ? getIncisalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height)
                : getOcclusalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height);
              
              return (
                <g key={tooth.id}>


                  {/* Whole tooth symbols only indicators*/}
                  {teethData[tooth.id]?.wholeToothCode && (
                    <SurfaceIndicators
                      toothData={teethData[tooth.id]}
                      toothPosition={tooth}
                    />
                  )}
                  {/* Render individual surface segments */}
                  {applicableSurfaces.map(surface => (
                    <path
                      key={surface}
                      d={segments[surface as keyof typeof segments]}
                      fill={getSurfaceColor(tooth.id, surface as Surface)}
                      stroke="#374151"
                      strokeWidth={getSurfaceStrokeWidth(tooth.id, surface as Surface)}
                      className="pointer-events-none"
                    />
                  ))}
                  
                  {/* Clickable overlay for tooth interaction */}
                  <rect
                    x={tooth.x}
                    y={tooth.y}
                    width={tooth.width}
                    height={tooth.height}
                    fill="transparent"
                    className={isEditable ? 'cursor-pointer hover:opacity-80' : ''}
                    onClick={() => isEditable && onToothClick(tooth.id)}
                  />
                  
                  <text
                    x={tooth.x + tooth.width / 2}
                    y={tooth.y + tooth.height - 35}
                    textAnchor="middle"
                    className="text-xxs font-medium fill-gray-700"
                  >
                    {tooth.id}
                  </text>
                  
                  
                </g>
              );
            })}
            {/* Lower jaw arrow */}
           
            
            {/* Lower jaw teeth */}
            {lowerTeeth.map((tooth) => {
              const toothType = getToothType(tooth.id);
              const applicableSurfaces = getSurfacesForToothType(toothType);
              const segments = toothType === 'incisor' || toothType === 'canine' 
                ? getIncisalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height)
                : getOcclusalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height);
              
              return (
                <g key={tooth.id}>

                  {/* Whole tooth symbols only indicators*/}
                  {teethData[tooth.id]?.wholeToothCode && (
                    <SurfaceIndicators
                      toothData={teethData[tooth.id]}
                      toothPosition={tooth}
                    />
                  )}
                  {/* Render individual surface segments */}
                  {applicableSurfaces.map(surface => (
                    <path
                      key={surface}
                      d={segments[surface as keyof typeof segments]}
                      fill={getSurfaceColor(tooth.id, surface as Surface)}
                      stroke="#374151"
                      strokeWidth={getSurfaceStrokeWidth(tooth.id, surface as Surface)}
                      className="pointer-events-none"
                    />
                  ))}
                  
                  {/* Clickable overlay for tooth interaction */}
                  <rect
                    x={tooth.x}
                    y={tooth.y}
                    width={tooth.width}
                    height={tooth.height}
                    fill="transparent"
                    className={isEditable ? 'cursor-pointer hover:opacity-80' : ''}
                    onClick={() => isEditable && onToothClick(tooth.id)}
                  />
                  
                  <text
                    x={tooth.x + tooth.width / 2}
                    y={tooth.y + tooth.height + 20}
                    textAnchor="middle"
                    className="text-xxs font-medium fill-gray-700"
                  >
                    {tooth.id}
                  </text>
                  
                  
                </g>
              );
            })}
             <polygon
              points="196,93 204,93 200,83"
              fill="#64748b"
            />
            
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-400"></div>
            <span>No data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-400"></div>
            <span>Has data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-400"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400"></div>
            <span>Attention</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-400"></div>
            <span>Urgent</span>
          </div>
        </div>
      </div>
    </div>
  );
};
