import React from 'react';
import { DentitionDiagramProps } from './types';

export const DentitionDiagram: React.FC<DentitionDiagramProps> = ({
  teethData = {},
  onToothClick,
  isEditable
}) => {
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

  // Generate tooth positions for upper jaw (quadrants 1 & 2)
  const upperTeeth = [
    // Quadrant 1 (Upper Right) - 18 to 11
    { id: '18', x: 20, y: 20, width: 12, height: 16 },
    { id: '17', x: 35, y: 20, width: 12, height: 16 },
    { id: '16', x: 50, y: 20, width: 12, height: 16 },
    { id: '15', x: 65, y: 20, width: 12, height: 16 },
    { id: '14', x: 80, y: 20, width: 12, height: 16 },
    { id: '13', x: 95, y: 20, width: 12, height: 16 },
    { id: '12', x: 110, y: 20, width: 12, height: 16 },
    { id: '11', x: 125, y: 20, width: 12, height: 16 },
    
    // Quadrant 2 (Upper Left) - 21 to 28
    { id: '21', x: 155, y: 20, width: 12, height: 16 },
    { id: '22', x: 170, y: 20, width: 12, height: 16 },
    { id: '23', x: 185, y: 20, width: 12, height: 16 },
    { id: '24', x: 200, y: 20, width: 12, height: 16 },
    { id: '25', x: 215, y: 20, width: 12, height: 16 },
    { id: '26', x: 230, y: 20, width: 12, height: 16 },
    { id: '27', x: 245, y: 20, width: 12, height: 16 },
    { id: '28', x: 260, y: 20, width: 12, height: 16 },
  ];

  // Generate tooth positions for lower jaw (quadrants 3 & 4)
  const lowerTeeth = [
    // Quadrant 3 (Lower Left) - 38 to 31
    { id: '38', x: 20, y: 60, width: 12, height: 16 },
    { id: '37', x: 35, y: 60, width: 12, height: 16 },
    { id: '36', x: 50, y: 60, width: 12, height: 16 },
    { id: '35', x: 65, y: 60, width: 12, height: 16 },
    { id: '34', x: 80, y: 60, width: 12, height: 16 },
    { id: '33', x: 95, y: 60, width: 12, height: 16 },
    { id: '32', x: 110, y: 60, width: 12, height: 16 },
    { id: '31', x: 125, y: 60, width: 12, height: 16 },
    
    // Quadrant 4 (Lower Right) - 41 to 48
    { id: '41', x: 155, y: 60, width: 12, height: 16 },
    { id: '42', x: 170, y: 60, width: 12, height: 16 },
    { id: '43', x: 185, y: 60, width: 12, height: 16 },
    { id: '44', x: 200, y: 60, width: 12, height: 16 },
    { id: '45', x: 215, y: 60, width: 12, height: 16 },
    { id: '46', x: 230, y: 60, width: 12, height: 16 },
    { id: '47', x: 245, y: 60, width: 12, height: 16 },
    { id: '48', x: 260, y: 60, width: 12, height: 16 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Dental Chart - FDI Notation
        </h3>
        
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 300 100"
            className="w-full h-auto"
            style={{ minHeight: '200px' }}
          >
            {/* Upper jaw label */}
            <text x="150" y="10" textAnchor="middle" className="text-sm font-medium fill-gray-600">
              Upper Jaw
            </text>
            
            {/* Upper jaw teeth */}
            {upperTeeth.map((tooth) => (
              <g key={tooth.id}>
                <rect
                  x={tooth.x}
                  y={tooth.y}
                  width={tooth.width}
                  height={tooth.height}
                  fill={getToothColor(tooth.id)}
                  stroke={getToothStrokeColor(tooth.id)}
                  strokeWidth={getToothStrokeWidth(tooth.id)}
                  className={isEditable ? 'cursor-pointer hover:opacity-80' : ''}
                  onClick={() => isEditable && onToothClick(tooth.id)}
                />
                <text
                  x={tooth.x + tooth.width / 2}
                  y={tooth.y + tooth.height / 2 + 2}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700"
                >
                  {tooth.id}
                </text>
              </g>
            ))}
            
            {/* Lower jaw label */}
            <text x="150" y="90" textAnchor="middle" className="text-sm font-medium fill-gray-600">
              Lower Jaw
            </text>
            
            {/* Lower jaw teeth */}
            {lowerTeeth.map((tooth) => (
              <g key={tooth.id}>
                <rect
                  x={tooth.x}
                  y={tooth.y}
                  width={tooth.width}
                  height={tooth.height}
                  fill={getToothColor(tooth.id)}
                  stroke={getToothStrokeColor(tooth.id)}
                  strokeWidth={getToothStrokeWidth(tooth.id)}
                  className={isEditable ? 'cursor-pointer hover:opacity-80' : ''}
                  onClick={() => isEditable && onToothClick(tooth.id)}
                />
                <text
                  x={tooth.x + tooth.width / 2}
                  y={tooth.y + tooth.height / 2 + 2}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700"
                >
                  {tooth.id}
                </text>
              </g>
            ))}
            
            {/* Quadrant labels */}
            <text x="10" y="15" className="text-xs fill-gray-500">Q1</text>
            <text x="280" y="15" className="text-xs fill-gray-500">Q2</text>
            <text x="10" y="55" className="text-xs fill-gray-500">Q3</text>
            <text x="280" y="55" className="text-xs fill-gray-500">Q4</text>
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
