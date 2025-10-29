import React, { useState, useEffect } from 'react';
import { ToothSurfaceModalProps, ToothData, Surface } from './types';
import { ODONTOGRAM_CODES, getCodesBySurface, getWholeToothCodes, SURFACE_NAMES } from './odontogramCodes';
import { ToothSurfaceDiagram } from './ToothSurfaceDiagram';

export const ToothSurfaceModal: React.FC<ToothSurfaceModalProps> = ({
  toothId,
  toothData,
  isOpen,
  onClose,
  onSave
}) => {
  const [selectedSurface, setSelectedSurface] = useState<Surface | undefined>();
  const [wholeToothCode, setWholeToothCode] = useState<string>('');
  const [surfaceConditions, setSurfaceConditions] = useState<{ [key in Surface]?: string }>({});
  const [surfaceNotes, setSurfaceNotes] = useState<{ [key in Surface]?: string }>({});
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Initialize form data when modal opens or toothData changes
  useEffect(() => {
    if (isOpen && toothData) {
      // Migrate old status to wholeToothCode if status exists but wholeToothCode doesn't
      const initialCode = toothData.wholeToothCode || (toothData.status && toothData.status !== 'sou' ? toothData.status : '');
      setWholeToothCode(initialCode || '');
      setGeneralNotes(toothData.generalNotes || '');
      
      // Initialize surface conditions
      const conditions: { [key in Surface]?: string } = {};
      const notes: { [key in Surface]?: string } = {};
      
      toothData.surfaces.forEach(surface => {
        conditions[surface.surface] = surface.code;
        notes[surface.surface] = surface.notes || '';
      });
      
      setSurfaceConditions(conditions);
      setSurfaceNotes(notes);
    }
  }, [isOpen, toothData]);

  const handleSurfaceClick = (surface: Surface) => {
    setSelectedSurface(surface);
  };

  const handleSurfaceConditionChange = (surface: Surface, code: string) => {
    setSurfaceConditions(prev => ({
      ...prev,
      [surface]: code
    }));
  };

  const handleSurfaceNotesChange = (surface: Surface, notes: string) => {
    setSurfaceNotes(prev => ({
      ...prev,
      [surface]: notes
    }));
  };

  const handleSave = () => {
    // Build surfaces array
    const surfaces = Object.entries(surfaceConditions)
      .filter(([_, code]) => code && code !== '')
      .map(([surface, code]) => {
        const codeData = ODONTOGRAM_CODES.find(c => c.code === code);
        return {
          surface: surface as Surface,
          code: code!,
          condition: codeData?.name || code!,
          color: codeData?.color || '#000000',
          pattern: codeData?.pattern || 'solid',
          notes: surfaceNotes[surface as Surface] || ''
        };
      });

    // Create updated tooth data
    const updatedToothData: ToothData = {
      id: toothId,
      surfaces,
      wholeToothCode: wholeToothCode || undefined,
      generalNotes: generalNotes || undefined
    };

    onSave(updatedToothData);
    onClose();
  };

  // Note: Tooth type detection is handled in ToothSurfaceDiagram component

  const getAvailableCodesForSurface = (surface: Surface) => {
    return getCodesBySurface(surface);
  };

  const getSelectedSurfaceCode = () => {
    if (!selectedSurface) return '';
    return surfaceConditions[selectedSurface] || '';
  };

  const getSelectedSurfaceNotes = () => {
    if (!selectedSurface) return '';
    return surfaceNotes[selectedSurface] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Tooth {toothId} - Surface Marking
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - Tooth diagram */}
            <div>
              <ToothSurfaceDiagram
                toothId={toothId}
                toothData={toothData}
                onSurfaceClick={handleSurfaceClick}
                selectedSurface={selectedSurface}
              />
            </div>

            {/* Right side - Controls */}
            <div className="space-y-6">
              {/* Whole Tooth Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Whole Tooth Condition
                </label>
                <select
                  value={wholeToothCode}
                  onChange={(e) => setWholeToothCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {getWholeToothCodes().map(code => (
                    <option key={code.code} value={code.code}>
                      {code.code} - {code.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a condition that applies to the entire tooth (e.g., unerupted, missing, etc.)
                </p>
              </div>

              {/* Surface-specific controls */}
              {selectedSurface && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    {selectedSurface} - {SURFACE_NAMES[selectedSurface as keyof typeof SURFACE_NAMES]}
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Surface condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition
                      </label>
                      <select
                        value={getSelectedSurfaceCode()}
                        onChange={(e) => handleSurfaceConditionChange(selectedSurface, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select condition</option>
                        {getAvailableCodesForSurface(selectedSurface).map(code => (
                          <option key={code.code} value={code.code}>
                            {code.code} - {code.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Surface notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={getSelectedSurfaceNotes()}
                        onChange={(e) => handleSurfaceNotesChange(selectedSurface, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add notes for this surface..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* General notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Notes
                </label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add general notes for this tooth..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
