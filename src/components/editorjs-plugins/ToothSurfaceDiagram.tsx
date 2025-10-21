import React from 'react';
import { ToothSurfaceDiagramProps, Surface } from './types';
import { getSurfacesForToothType } from './odontogramCodes';

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

  const toothType = getToothType(toothId);
  const applicableSurfaces = getSurfacesForToothType(toothType);

  // Surface click areas for 5-segment layout - trapezoid segments around middle rectangle
  const surfaceAreas = {
    O: { x: 70, y: 50, width: 60, height: 50, label: 'Occlusal' }, // Middle rectangle - chewing surface
    I: { x: 70, y: 50, width: 60, height: 0, label: 'Incisal' }, // Middle rectangle - cutting edge
    M: { x: 50, y: 50, width: 20, height: 50, label: 'Mesial' }, // Left trapezoid segment
    D: { x: 130, y: 50, width: 20, height: 50, label: 'Distal' }, // Right trapezoid segment
    V: { x: 70, y: 20, width: 60, height: 30, label: 'Vestibular' }, // Top trapezoid segment
    L: { x: 70, y: 100, width: 60, height: 30, label: 'Lingual' } // Bottom trapezoid segment
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
          Tooth {toothId} - Surface Selection
        </h4>
        
        <div className="relative">
          <svg
            viewBox="0 0 200 150"
            className="w-full h-auto"
            style={{ minHeight: '300px' }}
          >
            {/* 5-segment tooth outline - middle rectangle (O) with trapezoid segments (M, D, V, L) */}
            <path
              d="M 50 20 L 150 20 L 150 130 L 50 130 Z M 70 50 L 130 50 L 130 100 L 70 100 Z"
              fill="#ffffff"
              stroke="#374151"
              strokeWidth="2"
            />
            
            {/* Surface areas - only show applicable surfaces */}
            {applicableSurfaces.map(surface => {
              const area = surfaceAreas[surface];
              const isMarked = isSurfaceMarked(surface as Surface);
              const isSelected = selectedSurface === surface;
              const color = getSurfaceColor(surface as Surface);
              
              return (
                <g key={surface}>
                  {renderSurfacePattern(surface as Surface, area)}
                  
                  {/* Surface clickable area */}
                  <rect
                    x={area.x}
                    y={area.y}
                    width={area.width}
                    height={area.height}
                    fill={isMarked ? color : 'transparent'}
                    fillOpacity={isMarked ? 0.7 : 0}
                    stroke={isSelected ? '#3b82f6' : isMarked ? '#000' : '#d1d5db'}
                    strokeWidth={isSelected ? 3 : isMarked ? 2 : 1}
                    strokeDasharray={isMarked ? 'none' : '5,5'}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => onSurfaceClick(surface as Surface)}
                  />
                  
                  {/* Surface label */}
                  <text
                    x={area.x + area.width / 2}
                    y={area.y + area.height / 2}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-700 pointer-events-none"
                  >
                    {surface}
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
            
            {/* Tooth number in center */}
            <text
              x="100"
              y="90"
              textAnchor="middle"
              className="text-lg font-bold fill-gray-900"
            >
              {toothId}
            </text>
          </svg>
        </div>
        
        {/* Surface legend - only show applicable surfaces */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {applicableSurfaces.map(surface => {
            const area = surfaceAreas[surface];
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
