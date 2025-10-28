import React from 'react';
import { DentitionDiagramProps } from './types';
import { SurfaceIndicators } from './SurfaceIndicators';

export const DentitionDiagram: React.FC<DentitionDiagramProps> = ({
  teethData = {},
  onToothClick,
  isEditable
}) => {
  // 5-segment tooth shape: middle rectangle (O) with trapezoid segments (M, D, V, L)
  const getToothPath = (_toothId: string, x: number, y: number, width: number, height: number): string => {
    const w = width;
    const h = height;
    
    // Middle rectangle dimensions (Occlusal area)
    const middleW = w * 0.6; // 60% of total width
    const middleH = h * 0.4; // 40% of total height
    const middleX = x + (w - middleW) / 2; // Center the middle rectangle
    const middleY = y + (h - middleH) / 2; // Center the middle rectangle
    
    // Create the 5-segment shape
    return `M ${x} ${y}
            L ${x + w} ${y}
            L ${x + w} ${y + h}
            L ${x} ${y + h}
            Z
            M ${middleX} ${middleY}
            L ${middleX + middleW} ${middleY}
            L ${middleX + middleW} ${middleY + middleH}
            L ${middleX} ${middleY + middleH}
            Z`;
  };
  const getToothColor = (toothId: string) => {
    if (!teethData) return '#f3f4f6'; // Default gray if no data
    const tooth = teethData[toothId];
    if (!tooth) return '#f3f4f6'; // Default gray
    
    switch (tooth.status) {
      case 'urgent':
        return '#fecaca'; // Red
      case 'attention':
        return '#fde68a'; // Yellow
      case 'normal':
        return '#d1fae5'; // Green
      default:
        return '#dbeafe'; // Blue
    }
  };

  const getToothStrokeColor = (toothId: string) => {
    if (!teethData) return '#9ca3af'; // Default gray stroke if no data
    const tooth = teethData[toothId];
    if (!tooth) return '#9ca3af'; // Default gray stroke
    
    switch (tooth.status) {
      case 'urgent':
        return '#dc2626'; // Red
      case 'attention':
        return '#d97706'; // Yellow
      case 'normal':
        return '#059669'; // Green
      default:
        return '#2563eb'; // Blue
    }
  };

  const getToothStrokeWidth = (toothId: string) => {
    if (!teethData) return '1'; // Default stroke width if no data
    const tooth = teethData[toothId];
    return tooth ? '2' : '1';
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
  const lowerTeeth = [
    // Quadrant 3 (Lower Left) - 38 to 31
    { id: '38', ...getToothPosition(0, false, 3) },
    { id: '37', ...getToothPosition(1, false, 3) },
    { id: '36', ...getToothPosition(2, false, 3) },
    { id: '35', ...getToothPosition(3, false, 3) },
    { id: '34', ...getToothPosition(4, false, 3) },
    { id: '33', ...getToothPosition(5, false, 3) },
    { id: '32', ...getToothPosition(6, false, 3) },
    { id: '31', ...getToothPosition(7, false, 3) },
    
    // Quadrant 4 (Lower Right) - 41 to 48
    { id: '41', ...getToothPosition(0, false, 4) },
    { id: '42', ...getToothPosition(1, false, 4) },
    { id: '43', ...getToothPosition(2, false, 4) },
    { id: '44', ...getToothPosition(3, false, 4) },
    { id: '45', ...getToothPosition(4, false, 4) },
    { id: '46', ...getToothPosition(5, false, 4) },
    { id: '47', ...getToothPosition(6, false, 4) },
    { id: '48', ...getToothPosition(7, false, 4) },
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
            {upperTeeth.map((tooth) => (
              <g key={tooth.id}>
                <path
                  d={getToothPath(tooth.id, tooth.x, tooth.y, tooth.width, tooth.height)}
                  fill={getToothColor(tooth.id)}
                  stroke={getToothStrokeColor(tooth.id)}
                  strokeWidth={getToothStrokeWidth(tooth.id)}
                  className={isEditable ? 'cursor-pointer hover:opacity-80' : ''}
                  onClick={() => isEditable && onToothClick(tooth.id)}
                />
                <text
                  x={tooth.x + tooth.width / 2}
                  y={tooth.y + tooth.height - 25}
                  textAnchor="middle"
                  className="text-xxs font-medium fill-gray-700"
                >
                  {tooth.id}
                </text>
                
                {/* Surface indicators */}
                {teethData[tooth.id] && (
                  <SurfaceIndicators
                    toothData={teethData[tooth.id]}
                    toothPosition={tooth}
                  />
                )}
              </g>
            ))}
            {/* Lower jaw arrow */}
           
            
            {/* Lower jaw teeth */}
            
            {lowerTeeth.map((tooth) => (
              <g key={tooth.id}>
                <path
                  d={getToothPath(tooth.id, tooth.x, tooth.y, tooth.width, tooth.height)}
                  fill={getToothColor(tooth.id)}
                  stroke={getToothStrokeColor(tooth.id)}
                  strokeWidth={getToothStrokeWidth(tooth.id)}
                  className={isEditable ? 'cursor-pointer hover:opacity-80' : ''}
                  onClick={() => isEditable && onToothClick(tooth.id)}
                />
                <text
                  x={tooth.x + tooth.width / 2}
                  y={tooth.y + tooth.height + 10}
                  textAnchor="middle"
                  className="text-xxs font-medium fill-gray-700"
                >
                  {tooth.id}
                </text>
                
                {/* Surface indicators */}
                {teethData[tooth.id] && (
                  <SurfaceIndicators
                    toothData={teethData[tooth.id]}
                    toothPosition={tooth}
                  />
                )}
              </g>
            ))}
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
