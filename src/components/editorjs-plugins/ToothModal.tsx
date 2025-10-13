import React, { useState, useEffect } from 'react';
import { ToothModalProps, DENTAL_CONDITIONS, TOOTH_STATUSES, TOOTH_NAMES } from './types';

export const ToothModal: React.FC<ToothModalProps> = ({
  toothId,
  toothData,
  isOpen,
  onClose,
  onSave
}) => {
  const [condition, setCondition] = useState(toothData?.condition || '');
  const [notes, setNotes] = useState(toothData?.notes || '');
  const [status, setStatus] = useState<'normal' | 'attention' | 'urgent'>(toothData?.status || 'normal');

  useEffect(() => {
    if (toothData) {
      setCondition(toothData.condition || '');
      setNotes(toothData.notes || '');
      setStatus(toothData.status || 'normal');
    } else {
      setCondition('');
      setNotes('');
      setStatus('normal');
    }
  }, [toothData]);

  const handleSave = () => {
    const updatedToothData = {
      id: toothId,
      condition: condition || undefined,
      notes: notes || undefined,
      status: status
    };
    onSave(updatedToothData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Tooth {toothId}
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
          <p className="text-sm text-gray-600 mt-1">
            {TOOTH_NAMES[toothId] || 'Unknown tooth'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Condition Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select condition</option>
              {DENTAL_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex space-x-2">
              {TOOTH_STATUSES.map((statusOption) => (
                <button
                  key={statusOption.value}
                  onClick={() => setStatus(statusOption.value as 'normal' | 'attention' | 'urgent')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    status === statusOption.value
                      ? statusOption.color
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {statusOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes about this tooth..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
