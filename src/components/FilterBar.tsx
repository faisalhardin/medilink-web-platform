import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, XMarkIcon, FunnelIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface TimeRange {
  preset?: string;
  startDate?: string;
  endDate?: string;
  label?: string;
}

interface FilterBarProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
}

export function FilterBar({ onFiltersChange }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [customDateMode, setCustomDateMode] = useState<Record<string, boolean>>({});
  const filterBarRef = useRef<HTMLDivElement>(null);

  // New Relic-style time presets
  const timePresets = [
    {
      label: 'Last 30 minutes',
      value: 'last_30_minutes',
      icon: '⚡',
      startDate: () => new Date(Date.now() - 30 * 60 * 1000),
      endDate: () => new Date()
    },
    {
      label: 'Last hour',
      value: 'last_hour',
      icon: '🕐',
      startDate: () => new Date(Date.now() - 60 * 60 * 1000),
      endDate: () => new Date()
    },
    {
      label: 'Today',
      value: 'today',
      icon: '📅',
      startDate: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      },
      endDate: () => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return today;
      }
    },
    {
      label: 'Yesterday',
      value: 'yesterday',
      icon: '📆',
      startDate: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return yesterday;
      },
      endDate: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);
        return yesterday;
      }
    },
    {
      label: 'Last 3 days',
      value: 'last_3_days',
      icon: '📊',
      startDate: () => {
        const date = new Date();
        date.setDate(date.getDate() - 3);
        date.setHours(0, 0, 0, 0);
        return date;
      },
      endDate: () => new Date()
    },
    {
      label: 'Last 7 days',
      value: 'last_7_days',
      icon: '📈',
      startDate: () => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        date.setHours(0, 0, 0, 0);
        return date;
      },
      endDate: () => new Date()
    },
    {
      label: 'Last 30 days',
      value: 'last_30_days',
      icon: '📉',
      startDate: () => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        date.setHours(0, 0, 0, 0);
        return date;
      },
      endDate: () => new Date()
    },
    {
      label: 'Last 3 months',
      value: 'last_3_months',
      icon: '📋',
      startDate: () => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        date.setHours(0, 0, 0, 0);
        return date;
      },
      endDate: () => new Date()
    }
  ];

  const filterConfigs = [
    {
      key: 'timeRange',
      label: 'Time Range',
      type: 'timeRange',
      icon: '🕒',
      timePresets
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      icon: '📊',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' }
      ]
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleTimePresetSelect = (preset: any) => {
    const startDate = preset.startDate().toISOString().split('T')[0];
    const endDate = preset.endDate().toISOString().split('T')[0];
    
    const timeRange: TimeRange = {
      preset: preset.value,
      startDate,
      endDate,
      label: preset.label
    };

    handleFilterChange('timeRange', timeRange);
    // setCustomDateMode(prev => ({ ...prev, timeRange: false }));
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const currentRange = activeFilters.timeRange || {};
    const newRange: TimeRange = {
      ...currentRange,
      [field]: value,
      preset: undefined, // Clear preset when using custom dates
      label: undefined
    };

    // Generate label for custom range
    if (newRange.startDate && newRange.endDate) {
      newRange.label = `${newRange.startDate} to ${newRange.endDate}`;
    } else if (newRange.startDate) {
      newRange.label = `From ${newRange.startDate}`;
    } else if (newRange.endDate) {
      newRange.label = `Until ${newRange.endDate}`;
    }

    handleFilterChange('timeRange', newRange);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
    setOpenDropdown(null);
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setCustomDateMode({});
    onFiltersChange?.({});
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const toggleCustomDateMode = (filterKey: string) => {
    setCustomDateMode(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const formatFilterValue = (key: string, value: any) => {
    if (key === 'timeRange' && value) {
      return value.label || 'Custom range';
    }
    return value;
  };

  const getActiveTimePreset = (timeRange: TimeRange) => {
    if (timeRange.preset) {
      return timePresets.find(preset => preset.value === timeRange.preset);
    }
    return null;
  };

  return (
    <div ref={filterBarRef} className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Main Filter Bar */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {/* Filter Icon */}
          <div className="flex items-center text-gray-500">
            <FunnelIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center space-x-2">
            {filterConfigs.map((config) => (
              <div key={config.key} className="relative">
                <button
                  onClick={() => toggleDropdown(config.key)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200
                    ${activeFilters[config.key] 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{config.icon}</span>
                  {config.label}
                  <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                    openDropdown === config.key ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {openDropdown === config.key && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      {config.type === 'timeRange' ? (
                        <div className="space-y-3">
                          {/* New Relic-style header */}
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">Select Time Range</span>
                            </div>
                            <button
                              onClick={() => toggleCustomDateMode(config.key)}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                customDateMode[config.key]
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              Custom
                            </button>
                          </div>

                          {!customDateMode[config.key] ? (
                            /* Preset Options */
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {config.timePresets?.map((preset) => {
                                const isActive = activeFilters.timeRange?.preset === preset.value;
                                return (
                                  <button
                                    key={preset.value}
                                    onClick={() => handleTimePresetSelect(preset)}
                                    className={`
                                      w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-150 flex items-center justify-between
                                      ${isActive
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-gray-700 hover:bg-gray-50'
                                      }
                                    `}
                                  >
                                    <div className="flex items-center">
                                      <span className="mr-2">{preset.icon}</span>
                                      {preset.label}
                                    </div>
                                    {isActive && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            /* Custom Date Range */
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                                <CalendarIcon className="h-4 w-4" />
                                <span>Custom Date Range</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                                    value={activeFilters.timeRange?.startDate || ''}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    End Date
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                                    value={activeFilters.timeRange?.endDate || ''}
                                  />
                                </div>
                              </div>

                              {/* Quick preset shortcuts in custom mode */}
                              <div className="pt-2 border-t border-gray-100">
                                <div className="text-xs text-gray-500 mb-2">Quick Select:</div>
                                <div className="flex flex-wrap gap-1">
                                  {timePresets.slice(2, 6).map((preset) => (
                                    <button
                                      key={preset.value}
                                      onClick={() => handleTimePresetSelect(preset)}
                                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular select options */
                        <div className="space-y-1">
                          {config.options?.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleFilterChange(config.key, option.value)}
                              className={`
                                w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150
                                ${activeFilters[config.key] === option.value
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                                }
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Clear All Button */}
        {Object.keys(activeFilters).length > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-150"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 mr-2">Active filters:</span>
            {Object.entries(activeFilters).map(([key, value]) => {
              const config = filterConfigs.find(c => c.key === key);
              const displayValue = formatFilterValue(key, value);
              
              return (
                <div
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <span className="mr-1">{config?.icon}</span>
                  <span className="mr-2">
                    {config?.label}: {displayValue}
                  </span>
                  <button
                    onClick={() => removeFilter(key)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
