import React from 'react';
import { SurfaceIndicatorsProps, Surface, ToothSurfaceData } from './types';
import { getSurfacesForToothType, normalizeWholeToothCode, getCodePriority, ODONTOGRAM_CODES } from './odontogramCodes';

export const SurfaceIndicators: React.FC<SurfaceIndicatorsProps> = ({
  toothData,
  toothPosition
}) => {
  const { x, y, width, height } = toothPosition;

  // Determine tooth type based on tooth ID
  const getToothType = (toothId: string): 'incisor' | 'canine' | 'premolar' | 'molar' => {
    const toothNum = parseInt(toothId);
    const toothNumMod = toothNum % 10;
    if (toothNumMod <= 2) return 'incisor';
    if (toothNumMod === 3) return 'canine';
    if (toothNumMod <= 5) return 'premolar';
    return 'molar';
  };

  const toothType = getToothType(toothData.id);
  const applicableSurfaces = getSurfacesForToothType(toothType);

  // Surface positions for 5-segment layout - trapezoid segments around middle rectangle
  const surfacePositions: { [key in Surface]: { x: number; y: number; size: number } } = {
    M: { x: x + width * 0.1, y: y + height / 2, size: 4 }, // Left trapezoid segment (mesial)
    O: { x: x + width / 2, y: y + height / 2, size: 4 }, // Middle rectangle (occlusal - chewing surface)
    I: { x: x + width / 2, y: y + height / 2, size: 4 }, // Middle rectangle (incisal - cutting edge)
    D: { x: x + width * 0.9, y: y + height / 2, size: 4 }, // Right trapezoid segment (distal)
    V: { x: x + width / 2, y: y + height * 0.2, size: 4 }, // Top trapezoid segment (vestibular)
    L: { x: x + width / 2, y: y + height * 0.8, size: 4 } // Bottom trapezoid segment (lingual)
  };

  const renderSurfaceIndicator = (surface: Surface, surfaceData: ToothSurfaceData) => {
    const pos = surfacePositions[surface];
    const { color, pattern } = surfaceData;

    if (pattern === 'hatched') {
      return (
        <g key={surface}>
          <defs>
            <pattern id={`hatch-${toothData.id}-${surface}`} patternUnits="userSpaceOnUse" width="2" height="2">
              <path d="M 0,2 l 2,-2 M -1,1 l 2,-2 M 1,3 l 2,-2" stroke={color} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <circle
            cx={pos.x}
            cy={pos.y}
            r={pos.size}
            fill={`url(#hatch-${toothData.id}-${surface})`}
            stroke={color}
            strokeWidth="1"
          />
        </g>
      );
    }

    if (pattern === 'outline') {
      return (
        <circle
          key={surface}
          cx={pos.x}
          cy={pos.y}
          r={pos.size}
          fill="transparent"
          stroke={color}
          strokeWidth="2"
        />
      );
    }

    // Default solid pattern
    return (
      <circle
        key={surface}
        cx={pos.x}
        cy={pos.y}
        r={pos.size}
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
    );
  };

  // Get position category for a code (TOP, MIDDLE, BOTTOM)
  const getSymbolPosition = (code: string): 'TOP' | 'MIDDLE' | 'BOTTOM' => {
    // TOP position: Text symbols (vestibular side)
    if (['non', 'une', 'pre', 'imx', 'ano', 'per', 'una', 'ipx'].includes(code)) {
      return 'TOP';
    }
    // BOTTOM position: Triangle symbols (rct, nvt)
    if (['rct', 'nvt'].includes(code)) {
      return 'BOTTOM';
    }
    // MIDDLE position: All other symbols
    return 'MIDDLE';
  };

  // Render a single symbol for a specific code with vertical offset
  const renderSingleSymbol = (code: string, quadrant: string, verticalOffset: number = 0) => {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const position = getSymbolPosition(code);
    
    // Calculate base Y position based on position category and quadrant
    let baseY: number;
    if (position === 'TOP') {
      // Upper jaw: above tooth, Lower jaw: below tooth
      baseY = (quadrant === '1' || quadrant === '2') ? y - 4 : y + height +8;
    } else if (position === 'BOTTOM') {
      // Upper jaw: below tooth, Lower jaw: above tooth
      baseY = (quadrant === '1' || quadrant === '2') ? y + height + 2 : y - 2;
    } else {
      // MIDDLE: always centered
      baseY = centerY;
    }
    
    // Apply vertical offset for stacking
    const symbolY = baseY + verticalOffset;

    // Handle different whole tooth symbols
    switch (code) {
      case 'mis':
      case 'mam':
        return (
          <g>
            <line
              x1={x + 4}
              y1={y + 4}
              x2={x + width - 4}
              y2={y + height - 4}
              stroke="#000000"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1={x + width - 4}
              y1={y + 4}
              x2={x + 4}
              y2={y + height - 4}
              stroke="#000000"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        );

      case 'mpm':
        return (
          <circle
            cx={centerX}
            cy={symbolY}
            r={Math.min(width, height) / 2}
            fill="transparent"
            stroke="#000000"
            strokeWidth="2"
          />
        );

      case 'rct':
        if (quadrant === '1' || quadrant === '2') {
          return (
            <polygon
              points={`${centerX},${symbolY + 6} ${x + 4},${symbolY} ${x + width - 4},${symbolY}`}
              fill="#000000"
              stroke="#000000"
              strokeWidth="1"
            />
          );
        } 
        return (
          <polygon
            points={`${centerX},${symbolY - 6} ${x + width - 4},${symbolY} ${x + 4},${symbolY}`}
            fill="#000000"
            stroke="#000000"
            strokeWidth="1"
          />
        );
      case 'fra':
        return (
          <line
            x1={x + 4}
            y1={y + height - 4}
            x2={x + width - 4}
            y2={y + 4}
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );

      case 'cfr':
        return (
          <text
            x={centerX}
            y={symbolY + 5}
            textAnchor="middle"
            className=" font-bold fill-black"
          >
            #
          </text>
        );

      case 'nvt':
        if (quadrant === '1' || quadrant === '2') {
          return (
            <polygon
              points={`${centerX},${symbolY + 6} ${x + 4},${symbolY} ${x + width - 4},${symbolY}`}
              fill="transparent"
              stroke="#000000"
              strokeWidth="1"
            />
          );
        } 
        return (
          <polygon
            points={`${centerX},${symbolY - 6} ${x + width - 4},${symbolY} ${x + 4},${symbolY}`}
            fill="transparent"
            stroke="#000000"
            strokeWidth="1"
          />
        );
      case 'rrx':
        return (
          <text
            x={centerX}
            y={symbolY + 5}
            textAnchor="middle"
            className=" font-bold fill-black"
          >
            V
          </text>
        );
      case 'fmc':
      case 'onl':
      case 'inl':
        return (
          <rect
            x={centerX - width/2}
            y={centerY - height/2}
            width={width}
            height={height}
            fill="#000000"
          />
        );
      case 'mpc':
      case 'poc':
        return (
          <rect
            x={centerX - width/2}
            y={centerY - height/2}
            width={width}
            height={height}
            fill="#16a34a"
            stroke="#000000"
            strokeWidth="2"
          />
        );
      case 'gmc':
        return (
          <rect
            x={centerX - width/2}
            y={centerY - height/2}
            width={width}
            height={height}
            fill="#dc2626"
            stroke="#000000"
            strokeWidth="2"
          />
        );
      case 'ipx':
        return (
          <rect
            x={centerX - width/2}
            y={centerY - height/2}
            width={width}
            height={height}
            fill="#6b7280"
            stroke="#000000"
            strokeWidth="2"
          />
        );
      case 'abu':
        return (
          <rect
            x={centerX - width/2}
            y={centerY - height/2}
            width={width}
            height={height}
            fill="#c2c2c2"
            stroke="#000000"
            strokeWidth="2"
          />
        );
      case 'prd':
          // Upper jaw: above tooth, Lower jaw: below tooth
        const baseYText = (quadrant === '1' || quadrant === '2') ? y - 4 : y + height +8;
        return (
          <>
            <text
              x={centerX}
              y={baseYText}
              textAnchor="middle"
              className="text-xxs font-bold"
            >
              {code}
            </text>
            <text
             x={centerX}
             y={symbolY + 5}
             textAnchor="middle"
              className=" font-bold fill-black"
            >
              X
            </text>
          </>
        );
      case 'acr':
        return (
          <rect
            x={centerX - width/2}
            y={centerY - height/2}
            width={width}
            height={height}
            fill="#ebc3da"
            stroke="#000000"
            strokeWidth="2"
          />
        );
      case 'fld':
        return(
          <>
          <line
              x1={x}
              y1={y }
              x2={x + width}
              y2={y}
              stroke="#000000"
              strokeWidth="3"
            />
            <line
              x1={x}
              y1={y + height}
              x2={x + width}
              y2={y}
              stroke="#000000"
              strokeWidth="3"
            />
          </>
          
        )
      case 'non':
      case 'une':
      case 'pre':
      case 'imx':
      case 'ano':
      case 'per':
      case 'una':
        return (
          <text
            x={centerX}
            y={symbolY}
            textAnchor="middle"
            className="text-xxs font-bold"
          >
            {code}
          </text>
        );

      default:
        return null;
    }
  };

  // Render all whole tooth symbols stacked vertically by position category
  const renderAllWholeToothSymbols = () => {
    const codes = normalizeWholeToothCode(toothData.wholeToothCode);
    if (codes.length === 0) return null;
    
    const quadrant = toothData.id.slice(0, 1);
    
    // Sort codes by priority
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
    
    // Group codes by position category
    const topCodes: string[] = [];
    const middleCodes: string[] = [];
    const bottomCodes: string[] = [];
    
    sortedCodes.forEach(code => {
      const position = getSymbolPosition(code);
      if (position === 'TOP') {
        topCodes.push(code);
      } else if (position === 'BOTTOM') {
        bottomCodes.push(code);
      } else {
        middleCodes.push(code);
      }
    });
    
    const symbolSpacing = 1; // Vertical spacing between stacked symbols
    const result: JSX.Element[] = [];
    
    // Render TOP position symbols (stacked)
    topCodes.forEach((code, index) => {
      const offset = (quadrant === '1' || quadrant === '2') 
        ? -index * symbolSpacing 
        : index * symbolSpacing;
      const symbol = renderSingleSymbol(code, quadrant, offset);
      if (symbol) {
        result.push(
          <g key={`top-${code}-${index}`}>
            {symbol}
          </g>
        );
      }
    });
    
    // Render MIDDLE position symbols (stacked)
    middleCodes.forEach((code, index) => {
      const offset = (index - (middleCodes.length - 1) / 2) * symbolSpacing;
      const symbol = renderSingleSymbol(code, quadrant, offset);
      if (symbol) {
        result.push(
          <g key={`middle-${code}-${index}`}>
            {symbol}
          </g>
        );
      }
    });
    
    // Render BOTTOM position symbols (stacked)
    bottomCodes.forEach((code, index) => {
      const offset = (quadrant === '1' || quadrant === '2') 
        ? index * symbolSpacing 
        : -index * symbolSpacing;
      const symbol = renderSingleSymbol(code, quadrant, offset);
      if (symbol) {
        result.push(
          <g key={`bottom-${code}-${index}`}>
            {symbol}
          </g>
        );
      }
    });
    
    return result.length > 0 ? <g>{result}</g> : null;
  };


  return (
    <g>
      {/* Surface indicators - only show applicable surfaces */}
      {toothData.surfaces
        .filter(surface => applicableSurfaces.includes(surface.surface))
        .map(surface => 
          renderSurfaceIndicator(surface.surface, surface)
        )}
      
      {/* Whole tooth symbols - all stacked vertically by position */}
      {renderAllWholeToothSymbols()}
    </g>
  );
};
