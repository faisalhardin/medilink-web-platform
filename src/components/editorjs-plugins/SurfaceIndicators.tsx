import React from 'react';
import { SurfaceIndicatorsProps, Surface, ToothSurfaceData } from './types';
import { getSurfacesForToothType, normalizeWholeToothCode, getMostCriticalCode } from './odontogramCodes';

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

  const renderWholeToothSymbol = (toothId: string) => {
    // Normalize wholeToothCode to array
    const codes = normalizeWholeToothCode(toothData.wholeToothCode);
    if (codes.length === 0) return null;
    
    const quadrant = toothId.slice(0, 1);
    
    // Get the most critical code (highest priority)
    const primaryCode = getMostCriticalCode(codes);
    if (!primaryCode) return null;
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Handle different whole tooth symbols
    switch (primaryCode) {
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
            cy={centerY}
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
            points={`${centerX},${y + height + 7} ${x + 4},${y + height + 1} ${x + width - 4},${y + height + 1}`}
            fill="#000000"
            stroke="#000000"
            strokeWidth="1"
          />
          )
          
        } 
        return (
          <polygon
              points={`${centerX},${y - 7} ${x + width - 4},${y - 1} ${x + 4},${y - 1}`}
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
            y={centerY + 5}
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
            points={`${centerX},${y + height + 7} ${x + 4},${y + height + 1} ${x + width - 4},${y + height + 1}`}
            fill="transparent"
            stroke="#000000"
            strokeWidth="1"
          />
          )
          
        } 
        return (
          <polygon
              points={`${centerX},${y - 7} ${x + width - 4},${y - 1} ${x + 4},${y - 1}`}
              fill="transparent"
              stroke="#000000"
              strokeWidth="1"
            />
          
        );
      case 'rrx':
        
        return (
          <text
            x={centerX}
            y={centerY + 5}
            textAnchor="middle"
            className=" font-bold fill-black"
          >
            V
          </text>
        );
      case 'fmc':
      case 'onl':
      case 'inl':
        <rect x={centerX - 4} y={centerY - 4} width={8} height={8} fill="#000000"/>
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
        return (
          <>
            <text
              x={centerX}
              y={centerY - 13}
              textAnchor="middle"
              className="text-xxs font-bold"
            >
              {primaryCode}
            </text>
            <text
              x={centerX}
              y={centerY + 5}
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
            y={centerY-13}
            textAnchor="middle"
            className="text-xxs font-bold"
          >
            {primaryCode}
          </text>
        );

      default:
        return null;
    }
  };

  // Render the symbol and "*" indicator if there are more codes
  const renderSymbolWithIndicator = () => {
    const symbol = renderWholeToothSymbol(toothData.id);
    if (!symbol) return null;
    
    const codes = normalizeWholeToothCode(toothData.wholeToothCode);
    const hasMoreCodes = codes.length > 1;
    
    if (!hasMoreCodes) return symbol;
    
    // If there are more codes, add "*" indicator
    // Position "*" in top-right corner of the tooth
    return (
      <g>
        {symbol}
        <text
          x={x + width - 4}
          y={y + 8}
          textAnchor="end"
          className="text-xs font-bold fill-black"
          style={{ fontSize: '10px' }}
        >
          *
        </text>
      </g>
    );
  };

  return (
    <g>
      {/* Surface indicators - only show applicable surfaces */}
      {toothData.surfaces
        .filter(surface => applicableSurfaces.includes(surface.surface))
        .map(surface => 
          renderSurfaceIndicator(surface.surface, surface)
        )}
      
      {/* Surface notation labels */}
      {/* {toothData.surfaces
        .filter(surface => applicableSurfaces.includes(surface.surface))
        .map(surface => {
          const pos = surfacePositions[surface.surface];
          return (
            <text
              key={`label-${surface.surface}`}
              x={pos.x}
              y={pos.y - 2}
              textAnchor="top"
              className="text-xs font-bold fill-black pointer-events-none"
              style={{ fontSize: '8px' }}
            >
              {surface.surface}
            </text>
          );
        })} */}
      
      {/* Whole tooth symbols */}
      {renderSymbolWithIndicator()}
    </g>
  );
};
