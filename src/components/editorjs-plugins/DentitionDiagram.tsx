import React, { useState } from 'react';
import { DentitionDiagramProps, Surface, ToothData } from './types';
import { SurfaceIndicators } from './SurfaceIndicators';
import { getSurfacesForToothType, ODONTOGRAM_CODES_MAP, normalizeWholeToothCode } from './odontogramCodes';
import i18n from 'i18n/config';

export const DentitionDiagram: React.FC<DentitionDiagramProps> = ({
  teethData = {},
  onToothClick,
  isEditable,
  version
}) => {
  const [viewMode, setViewMode] = useState<'diagram' | 'table'>('diagram');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (toothId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toothId)) {
        newSet.delete(toothId);
      } else {
        newSet.add(toothId);
      }
      return newSet;
    });
  };
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

  // Generate individual surface segment paths for occlusal teeth (molars/premolars)
  const getOcclusalToothSegments = (x: number, y: number, width: number, height: number, swapMD: boolean = false) => {
    const w = width;
    const h = height;
    
    // Middle rectangle dimensions (Occlusal area)
    const middleW = w * 0.4; // 40% of total width
    const middleH = h * 0.4; // 40% of total height
    const middleX = x + (w - middleW) / 2; // Center the middle rectangle
    const middleY = y + (h - middleH) / 2; // Center the middle rectangle
    
    const mPath = `M ${x} ${y} L ${middleX} ${middleY} L ${middleX} ${middleY + middleH} L ${x} ${y + h} Z`; // Left trapezoid
    const dPath = `M ${middleX + middleW} ${middleY} L ${x + w} ${y} L ${x + w} ${y + h} L ${middleX + middleW} ${middleY + middleH} Z`; // Right trapezoid
    
    return {
      M: swapMD ? dPath : mPath,
      O: `M ${middleX} ${middleY} L ${middleX + middleW} ${middleY} L ${middleX + middleW} ${middleY + middleH} L ${middleX} ${middleY + middleH} Z`, // Center rectangle
      D: swapMD ? mPath : dPath,
      V: `M ${x} ${y} L ${x + w} ${y} L ${middleX + middleW} ${middleY} L ${middleX} ${middleY} Z`, // Top trapezoid
      L: `M ${middleX} ${middleY + middleH} L ${middleX + middleW} ${middleY + middleH} L ${x + w} ${y + h} L ${x} ${y + h} Z` // Bottom trapezoid
    };
  };

  // Generate individual surface segment paths for incisal teeth (incisors/canines) - NO middle segment
  const getIncisalToothSegments = (x: number, y: number, width: number, height: number, swapMD: boolean = false) => {
    const w = width;
    const h = height;
    
    // For incisors/canines, we create 4 trapezoid segments without a middle rectangle
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    
    const mPath = `M ${x} ${y} L ${centerX - w * 0.1} ${centerY} L ${centerX - w * 0.1} ${y + h * 0.5} L ${x} ${y + h} Z`; // Left trapezoid
    const dPath = `M ${centerX + w * 0.1} ${centerY} L ${x + w} ${y} L ${x + w} ${y + h} L ${centerX + w * 0.1} ${y + h * 0.5} Z`; // Right trapezoid
    
    return {
      M: swapMD ? dPath : mPath,
      D: swapMD ? mPath : dPath,
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

  // Helper functions for formatting tooth conditions
  const getWholeToothConditionsText = (toothData: ToothData): string => {
    if (!toothData || !toothData.wholeToothCode) return '';
    const codes = normalizeWholeToothCode(toothData.wholeToothCode);
    return codes.length > 0 ? codes.join('-') : '';
  };

  const getSurfaceConditionsText = (toothData: ToothData): string => {
    if (!toothData || !toothData.surfaces || toothData.surfaces.length === 0) return '';
    const surfaceConditions = toothData.surfaces
      .filter(s => s.code && s.code !== '')
      .map(s => `${s.surface} ${s.code}`)
      .join(' ');
    return surfaceConditions;
  };

  const getToothConditionText = (toothData: ToothData | undefined): string => {
    if (!toothData) return '—';
    const wholeToothText = getWholeToothConditionsText(toothData);
    const surfaceText = getSurfaceConditionsText(toothData);
    const parts = [surfaceText, wholeToothText].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : '—';
  };

  const hasNotes = (toothData: ToothData | undefined): boolean => {
    if (!toothData) return false;
    if (toothData.generalNotes && toothData.generalNotes.trim()) return true;
    return toothData.surfaces.some(s => s.notes && s.notes.trim());
  };

  // Combine all teeth for table view
  const allTeeth = [...upperTeeth, ...lowerTeeth];

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6">
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 text-center">
          Odontogram
        </h3>
        
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md border border-gray-300 bg-white p-1">
            <button
              onClick={() => setViewMode('diagram')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'diagram'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="Switch to diagram view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="Switch to table view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {viewMode === 'diagram' && (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <svg
            viewBox="0 -10 400 120"
            className="w-full h-auto"
            style={{ minWidth: '600px', minHeight: '150px' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <polygon
              points="196,7 204,7 200,17"
              fill="#64748b"
            />
            
            {/* Upper jaw teeth */}
            {upperTeeth.map((tooth) => {
              const toothType = getToothType(tooth.id);
              const quadrant = getQuadrantFromToothId(tooth.id);
              const swapMD = quadrant === 1 || quadrant === 4;
              const applicableSurfaces = getSurfacesForToothType(toothType);
              const segments = toothType === 'incisor' || toothType === 'canine' 
                ? getIncisalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height, swapMD)
                : getOcclusalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height, swapMD);
              
              return (
                <g key={tooth.id}>


                  {/* Whole tooth symbols only indicators*/}
                  {(() => {
                    const toothData = teethData[tooth.id];
                    if (!toothData) return null;
                    const codes = Array.isArray(toothData.wholeToothCode) 
                      ? toothData.wholeToothCode 
                      : (toothData.wholeToothCode ? [toothData.wholeToothCode] : []);
                    return codes.length > 0 ? (
                      <SurfaceIndicators
                        toothData={toothData}
                        toothPosition={tooth}
                      />
                    ) : null;
                  })()}
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
              const quadrant = getQuadrantFromToothId(tooth.id);
              const swapMD = quadrant === 1 || quadrant === 4;
              const applicableSurfaces = getSurfacesForToothType(toothType);
              const segments = toothType === 'incisor' || toothType === 'canine' 
                ? getIncisalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height, swapMD)
                : getOcclusalToothSegments(tooth.x, tooth.y, tooth.width, tooth.height, swapMD);
              
              return (
                <g key={tooth.id}>

                  {/* Whole tooth symbols only indicators*/}
                  {(() => {
                    const toothData = teethData[tooth.id];
                    if (!toothData) return null;
                    const codes = Array.isArray(toothData.wholeToothCode) 
                      ? toothData.wholeToothCode 
                      : (toothData.wholeToothCode ? [toothData.wholeToothCode] : []);
                    return codes.length > 0 ? (
                      <SurfaceIndicators
                        toothData={toothData}
                        toothPosition={tooth}
                      />
                    ) : null;
                  })()}
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
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-20 px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Tooth Code
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tooth Condition
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {allTeeth.map((tooth) => {
                  const toothData = teethData[tooth.id];
                  const conditionText = getToothConditionText(toothData);
                  const isExpanded = expandedRows.has(tooth.id);
                  const showNotes = hasNotes(toothData);
                  
                  return (
                    <React.Fragment key={tooth.id}>
                      {/* Main row */}
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="w-20 px-2 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            
                            {tooth.id}
                            {showNotes && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpansion(tooth.id);
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
                              >
                                <svg 
                                  className="w-4 h-4 transition-transform" 
                                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td 
                          className={`px-3 py-2 text-xs text-gray-700 ${isEditable ? 'cursor-pointer' : ''}`}
                          onClick={() => isEditable && onToothClick(tooth.id)}
                        >
                          {conditionText}
                        </td>
                      </tr>
                      
                      {/* Expandable notes row */}
                      {isExpanded && showNotes && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={2} className="px-2 py-3">
                            <div className="space-y-2 text-xs">
                              {/* General Notes */}
                              {toothData?.generalNotes && toothData.generalNotes.trim() && (
                                <div>
                                  <span className="font-semibold text-gray-700">General Notes:</span>
                                  <div className="text-gray-600 mt-1 ml-2 whitespace-pre-wrap">{toothData.generalNotes}</div>
                                </div>
                              )}
                              
                              {/* Surface Notes */}
                              {toothData?.surfaces.some(s => s.notes && s.notes.trim()) && (
                                <div>
                                  <span className="font-semibold text-gray-700">Surface Notes:</span>
                                  <div className="mt-1 ml-2 space-y-1">
                                    {toothData.surfaces
                                      .filter(s => s.notes && s.notes.trim())
                                      .map(surface => (
                                        <div key={surface.surface} className="text-gray-600">
                                          <span className="font-medium">{surface.surface}:</span> {surface.notes}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-xxs text-gray-500 text-center mt-2 flex items-center justify-end gap-2">
          <ReadOnlyBanner isReadOnly={!isEditable} />
          <VersionBanner version={version} />
        </div>
      </div>
    </div>
  );
};

const VersionBanner: React.FC<{ version: string }> = ({ version }) => {
  if (version === '1.0') {
    return <LegacyReadOnlyBanner version={version} />;
  }
  return (
    <div className='relative group'>
      <div className='flex items-center gap-1' style={{ cursor: 'help' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        Version {version}
      </div>      
    </div>
  )
}


const ReadOnlyBanner: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => {
  if (isReadOnly) {
    return (
      <div 
        style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          padding: '2px 2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#991b1b',
        }}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div className='text-xxs'>
          <strong>{i18n.t('editor.odontogram.readOnlyTitle', 'Read-Only')}</strong>
        </div>
      </div>
    )
   }

}

const LegacyReadOnlyBanner: React.FC<{ version: string }> = ({ version }) => {
    return (
      <div 
        style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '2px 2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#92400e',
          cursor: 'default'
        }}
        title={i18n.t(
          'editor.odontogram.legacyVersionTooltip', 
          'Legacy version',
          { version }
        )}
      >
        <svg 
          width="8" 
          height="8" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div className='text-xxs'>
          Version {version}
        </div>
      </div>
    )
  
}