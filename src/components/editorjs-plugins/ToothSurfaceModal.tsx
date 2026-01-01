import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ToothSurfaceModalProps, ToothData, Surface } from './types';
import { ODONTOGRAM_CODES_MAP, getCodesBySurface, getWholeToothCodes, SURFACE_NAMES, normalizeWholeToothCode } from './odontogramCodes';
import { ToothSurfaceDiagram } from './ToothSurfaceDiagram';

export const ToothSurfaceModal: React.FC<ToothSurfaceModalProps> = ({
  toothId,
  toothData,
  isOpen,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();
  const [selectedSurface, setSelectedSurface] = useState<Surface | undefined>();
  const [wholeToothCodes, setWholeToothCodes] = useState<string[]>([]);
  const [surfaceConditions, setSurfaceConditions] = useState<{ [key in Surface]?: string }>({});
  const [surfaceNotes, setSurfaceNotes] = useState<{ [key in Surface]?: string }>({});
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [tagInputValue, setTagInputValue] = useState<string>('');
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const lastInitializedToothId = useRef<string | null>(null);
  const generalNotesRef = useRef<string>('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasFocusedRef = useRef<boolean>(false);
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const tagInputWasFocusedRef = useRef<boolean>(false);

  // Helper function to get translated code name
  const getTranslatedCodeName = (code: string): string => {
    return t(`editor.odontogram.odontogramCodes.${code}`, { defaultValue: ODONTOGRAM_CODES_MAP[code]?.name || code });
  };

  // Helper function to get translated surface name
  const getTranslatedSurfaceName = (surface: Surface): string => {
    return t(`editor.odontogram.surfaceNames.${surface}`, { defaultValue: SURFACE_NAMES[surface] || surface });
  };

  // Initialize form data when modal opens or toothId changes
  useEffect(() => {
    // Only initialize when modal opens with a different tooth
    if (isOpen && toothData && lastInitializedToothId.current !== toothId) {
      // Normalize wholeToothCode to array (handles both string and array)
      let initialCodes: string[] = [];
      if (toothData.wholeToothCode) {
        initialCodes = normalizeWholeToothCode(toothData.wholeToothCode);
      } else if (toothData.status && toothData.status !== 'sou') {
        // Migrate old status to wholeToothCode for backward compatibility
        initialCodes = [toothData.status];
      }
      setWholeToothCodes(initialCodes);
      const initialNotes = toothData.generalNotes || '';
      setGeneralNotes(initialNotes);
      generalNotesRef.current = initialNotes;
      
      // Initialize surface conditions
      const conditions: { [key in Surface]?: string } = {};
      const notes: { [key in Surface]?: string } = {};
      
      toothData.surfaces.forEach(surface => {
        conditions[surface.surface] = surface.code;
        notes[surface.surface] = surface.notes || '';
      });
      
      setSurfaceConditions(conditions);
      setSurfaceNotes(notes);
      lastInitializedToothId.current = toothId;
    }
    
    // Reset when modal closes
    if (!isOpen) {
      lastInitializedToothId.current = null;
      generalNotesRef.current = '';
      wasFocusedRef.current = false;
      tagInputWasFocusedRef.current = false;
    }
  }, [isOpen, toothId]); // Use toothId instead of toothData to prevent re-initialization

  // Restore focus to textarea if it was focused but lost focus due to re-render
  useEffect(() => {
    if (wasFocusedRef.current && textareaRef.current) {
      const activeElement = document.activeElement;
      // Only restore if focus moved to another element in the modal (not user-initiated blur)
      if (activeElement && activeElement !== textareaRef.current && activeElement.closest('.bg-white.rounded-lg')) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (textareaRef.current && wasFocusedRef.current) {
            // Restore cursor position
            const cursorPos = textareaRef.current.selectionStart || generalNotes.length;
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(cursorPos, cursorPos);
          }
        });
      }
    }
  });

  // Restore focus to tag input if it was focused but lost focus due to re-render
  useEffect(() => {
    if (tagInputWasFocusedRef.current && tagInputRef.current) {
      const activeElement = document.activeElement;
      // Only restore if focus moved to another element in the modal (not user-initiated blur)
      if (activeElement && activeElement !== tagInputRef.current && activeElement.closest('.bg-white.rounded-lg')) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (tagInputRef.current && tagInputWasFocusedRef.current) {
            tagInputRef.current.focus();
          }
        });
      }
    }
  });

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
    console.log("surfaceNotes", surfaceNotes);
  };

  const handleSave = () => {
    // Build surfaces array - include surfaces that have either a code OR notes
    // Get all unique surfaces from both conditions and notes
    const allSurfaces = new Set<Surface>([
      ...Object.keys(surfaceConditions) as Surface[],
      ...Object.keys(surfaceNotes) as Surface[]
    ]);

    const surfaces = Array.from(allSurfaces)
      .filter((surface) => {
        const hasCode = surfaceConditions[surface] && surfaceConditions[surface] !== '';
        const hasNotes = surfaceNotes[surface] && surfaceNotes[surface] !== null && surfaceNotes[surface]?.trim() !== '';
        return hasCode || hasNotes; // Include if has code OR notes
      })
      .map((surface) => {
        const code = surfaceConditions[surface] || '';
        const notes = surfaceNotes[surface] || '';
        const codeData = code ? ODONTOGRAM_CODES_MAP[code] : null;
        
        return {
          surface: surface as Surface,
          code: code || '', // Allow empty code if notes exist
          condition: codeData?.name || code || '',
          color: codeData?.color || '#000000',
          pattern: codeData?.pattern || 'solid',
          notes: notes
        };
      });

    // Use ref value for generalNotes to ensure we get the latest value
    const notesToSave = generalNotesRef.current || generalNotes;

    // Create updated tooth data
    const updatedToothData: ToothData = {
      id: toothId,
      surfaces,
      wholeToothCode: wholeToothCodes.length > 0 ? wholeToothCodes : undefined,
      generalNotes: notesToSave || undefined
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

  // Get filtered autocomplete suggestions
  const getAutocompleteSuggestions = () => {
    const allCodes = getWholeToothCodes();
    const selectedCodeSet = new Set(wholeToothCodes);
    
    // Filter out already selected codes
    let filteredCodes = allCodes.filter(code => !selectedCodeSet.has(code.code));
    
    // If there's input, filter by search term
    if (tagInputValue.trim()) {
      const searchTerm = tagInputValue.toLowerCase();
      filteredCodes = filteredCodes.filter(code => {
        const codeLower = code.code.toLowerCase();
        const nameLower = code.name.toLowerCase();
        const translatedName = getTranslatedCodeName(code.code).toLowerCase();
        return codeLower.includes(searchTerm) || nameLower.includes(searchTerm) || translatedName.includes(searchTerm);
      });
    }
    
    // Limit to 10 suggestions when searching, show more when just focused
    return filteredCodes.slice(0, tagInputValue.trim() ? 10 : 100);
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInputValue(value);
    // Keep autocomplete open when typing (filtering)
    if (showAutocomplete) {
      setHighlightedIndex(-1);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation to prevent events from reaching elements behind the modal
    e.stopPropagation();
    
    const suggestions = getAutocompleteSuggestions();
    
    if (e.key === 'Enter' && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      e.preventDefault();
      addTag(suggestions[highlightedIndex].code);
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      addTag(suggestions[0].code);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowAutocomplete(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && tagInputValue === '' && wholeToothCodes.length > 0) {
      e.preventDefault();
      // Remove last tag when backspace is pressed on empty input
      removeTag(wholeToothCodes[wholeToothCodes.length - 1]);
      // Ensure focus stays on the input after removing tag
      requestAnimationFrame(() => {
        if (tagInputRef.current) {
          tagInputRef.current.focus();
        }
      });
    }
  };

  const addTag = (code: string) => {
    if (!wholeToothCodes.includes(code)) {
      setWholeToothCodes(prev => [...prev, code]);
      setTagInputValue('');
      setShowAutocomplete(false);
      setHighlightedIndex(-1);
    }
  };

  const removeTag = (code: string) => {
    setWholeToothCodes(prev => prev.filter(c => c !== code));
    // Ensure focus stays on the input after removing tag
    requestAnimationFrame(() => {
      if (tagInputRef.current && tagInputWasFocusedRef.current) {
        tagInputRef.current.focus();
      }
    });
  };

  const handleSuggestionClick = (code: string) => {
    addTag(code);
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => {
      const testRegex = new RegExp(`^${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gi');
      return testRegex.test(part) ? (
        <span key={index} className="text-blue-600 font-semibold">{part}</span>
      ) : (
        <span key={index}>{part}</span>
      );
    });
  };

  // Compute current toothData for live updates in the diagram
  const currentToothData: ToothData | undefined = useMemo(() => {
    if (!toothData) return undefined;
    
    // Build surfaces array from current state
    const surfaces = Object.entries(surfaceConditions)
      .filter(([_, code]) => code && code !== '')
      .map(([surface, code]) => {
        const codeData = ODONTOGRAM_CODES_MAP[code];
        return {
          surface: surface as Surface,
          code: code!,
          condition: codeData?.name || code!,
          color: codeData?.color || '#000000',
          pattern: codeData?.pattern || 'solid',
          notes: surfaceNotes[surface as Surface] || ''
        };
      });

    return {
      id: toothId,
      surfaces,
      wholeToothCode: wholeToothCodes.length > 0 ? wholeToothCodes : undefined,
      generalNotes: generalNotes || toothData.generalNotes
    };
  }, [toothData, toothId, surfaceConditions, surfaceNotes, wholeToothCodes, generalNotes]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            {t('editor.odontogram.tooth')} {toothId} - {t(`editor.odontogram.toothNames.${toothId}`) || t('editor.odontogram.unknownTooth')}
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
                toothData={currentToothData}
                onSurfaceClick={handleSurfaceClick}
                selectedSurface={selectedSurface}
              />
            </div>

            {/* Right side - Controls */}
            <div className="space-y-6">
              {/* Whole Tooth Condition - Tag Input */}
              <div className="relative">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('editor.odontogram.wholeToothConditions')}
                </label>
                <div className="relative">
                  {/* Input field with chips */}
                  <div
                    className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-text"
                    onClick={() => {
                      const input = document.getElementById('tag-input');
                      input?.focus();
                      // Show all options when clicking on the input container
                      setShowAutocomplete(true);
                      setHighlightedIndex(-1);
                    }}
                  >
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Existing chips */}
                      {wholeToothCodes.map(code => {
                        const codeData = ODONTOGRAM_CODES_MAP[code];
                        return (
                          <span
                            key={code}
                            className="chip-tooltip-group relative inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 cursor-help"
                          >
                            {code}
                            
                            {/* Custom tooltip - shows only on hover */}
                            {codeData && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg hidden [.chip-tooltip-group:hover_&]:block pointer-events-none whitespace-nowrap z-50">
                                {getTranslatedCodeName(code)}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                  <div className="border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTag(code);
                              }}
                              className="ml-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded px-0.5 transition-colors"
                              aria-label={`Remove ${code}`}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                      {/* Input field */}
                      <input
                        ref={tagInputRef}
                        id="tag-input"
                        type="text"
                        value={tagInputValue}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        onFocus={() => {
                          tagInputWasFocusedRef.current = true;
                          // Show all options when input is focused
                          setShowAutocomplete(true);
                          setHighlightedIndex(-1);
                        }}
                        onBlur={(e) => {
                          // Only hide autocomplete if focus is not moving to another element in the modal
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (!relatedTarget || !relatedTarget.closest('.bg-white.rounded-lg')) {
                            setShowAutocomplete(false);
                            tagInputWasFocusedRef.current = false;
                          }
                        }}
                        placeholder={wholeToothCodes.length === 0 ? t('editor.odontogram.typeToSearchConditions') : ""}
                        className="flex-1 min-w-[120px] outline-none text-sm sm:text-base bg-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Autocomplete dropdown */}
                  {showAutocomplete && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getAutocompleteSuggestions().length > 0 ? (
                        getAutocompleteSuggestions().map((code, index) => {
                          const isHighlighted = index === highlightedIndex;
                          return (
                            <button
                              key={code.code}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input blur
                                handleSuggestionClick(code.code);
                              }}
                              onMouseEnter={() => setHighlightedIndex(index)}
                              className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 transition-colors ${
                                isHighlighted ? 'bg-gray-100' : ''
                              }`}
                            >
                              <span className="font-medium">{code.code}</span>
                              <span className="text-gray-500 ml-2">-</span>
                              <span className="text-gray-700 ml-2">
                                {highlightMatch(getTranslatedCodeName(code.code), tagInputValue)}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 text-center">
                          {tagInputValue.trim() ? t('editor.odontogram.noMatchingConditions') : t('editor.odontogram.allConditionsSelected')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('editor.odontogram.typeToSearchHint')}
                </p>
              </div>

              {/* Surface-specific controls */}
              {selectedSurface && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                    {selectedSurface} - {getTranslatedSurfaceName(selectedSurface)}
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Surface condition */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        {t('editor.odontogram.condition')}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={getSelectedSurfaceCode()}
                          onChange={(e) => handleSurfaceConditionChange(selectedSurface, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">
                            {getSelectedSurfaceCode() 
                              ? t('editor.odontogram.removeCondition', { defaultValue: 'Remove condition' })
                              : t('editor.odontogram.selectCondition')
                            }
                          </option>
                          {getAvailableCodesForSurface(selectedSurface).map(code => (
                            <option key={code.code} value={code.code}>
                              {code.code} - {getTranslatedCodeName(code.code)}
                            </option>
                          ))}
                        </select>
                        {getSelectedSurfaceCode() && (
                          <button
                            type="button"
                            onClick={() => handleSurfaceConditionChange(selectedSurface, '')}
                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            title={t('editor.odontogram.removeCondition', { defaultValue: 'Remove condition' })}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Surface notes */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        {t('editor.odontogram.notes')}
                      </label>
                      <textarea
                        value={getSelectedSurfaceNotes()}
                        onChange={(e) => handleSurfaceNotesChange(selectedSurface, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('editor.odontogram.addNotesForSurface')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* General notes */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('editor.odontogram.generalNotes')}
                </label>
                <textarea
                  ref={textareaRef}
                  value={generalNotes}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setGeneralNotes(newValue);
                    generalNotesRef.current = newValue;
                  }}
                  onKeyDown={(e) => {
                    // Stop propagation to prevent other handlers from interfering
                    e.stopPropagation();
                  }}
                  onFocus={() => {
                    wasFocusedRef.current = true;
                  }}
                  onBlur={() => {
                    wasFocusedRef.current = false;
                  }}
                  rows={3}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('editor.odontogram.addNotesForTooth')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm sm:text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm sm:text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('editor.odontogram.saveChanges')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
