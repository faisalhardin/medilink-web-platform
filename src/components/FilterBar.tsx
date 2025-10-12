import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, XMarkIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';


interface TimeRange {
  preset?: string;
  startDate?: string;
  endDate?: string;
  label?: string;
}

interface TimePreset {
  label: string;
  value: string;
  icon: string;
  startDate: () => Date | null;
  endDate: () => Date | null;
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'dateRange' | 'timeRange' | 'multiSelect' | 'search' | 'number' | 'boolean';
  icon: string;
  options?: FilterOption[];
  timePresets?: TimePreset[];
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
}

interface FilterBarProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  defaultFilters?: TimePreset;
}

export const FilterPresetToday = {
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
}

export function FilterBar({ onFiltersChange, defaultFilters }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dateRangeState, setDateRangeState] = useState<{
    startDate: string | null;
    endDate: string | null;
    isSelectingStart: boolean;
  }>({
    startDate: null,
    endDate: null,
    isSelectingStart: true
  });
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultFilters) {
      handleTimePresetSelect(defaultFilters as TimePreset);
      onFiltersChange?.(defaultFilters);
    }
  }, [])

  const timePresets: TimePreset[] = [
    {
      label: 'Last hour',
      value: 'last_hour',
      icon: '🕐',
      startDate: () => new Date(Date.now() - 60 * 60 * 1000),
      endDate: () => new Date()
    },
      FilterPresetToday,
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
  ];

  const filterConfigs: FilterConfig[]  = [
    {
      key: 'timeRange',
      label: 'Time Range',
      type: 'timeRange',
      icon: '🕒',
      timePresets
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    // const handleClickOutside = (event: MouseEvent) => {
    //   if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
    //     setOpenDropdown(null);
    //   }
    // };

    // if (openDropdown) {
    //   document.addEventListener('mousedown', handleClickOutside);
    // }

    // return () => {
    //   document.removeEventListener('mousedown', handleClickOutside);
    // };
  }, [openDropdown]);

  const handleTimePresetSelect = (preset: TimePreset) => {
    const startDateValue = preset.startDate();
    const endDateValue = preset.endDate();
    
    if (!startDateValue || !endDateValue) {
      return;
    }
    
    // Format dates consistently for storage
    const formatDateForStorage = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const timeRange: TimeRange = {
      preset: preset.value,
      startDate: formatDateForStorage(startDateValue),
      endDate: formatDateForStorage(endDateValue),
      label: preset.label
    };

    handleFilterChange('timeRange', timeRange);
  };

  const handleCalendarDateClick = (selectedDate: string) => {
    if (dateRangeState.isSelectingStart) {
      // First click: Set start date and wait for end date
      setDateRangeState(prev => ({
        ...prev,
        startDate: selectedDate,
        isSelectingStart: false
      }));
    } else {
      // Second click: Set end date and complete the range
      const startDate = new Date(dateRangeState.startDate!);
      const endDate = new Date(selectedDate);
      
      // Ensure start date is before end date
      const [rangeStart, rangeEnd] = startDate.getTime() < endDate.getTime()
        ? [startDate, endDate]
        : [endDate, startDate];
      
      const finalRange: TimeRange = {
        startDate: formatDateForStorage(rangeStart),
        endDate: formatDateForStorage(rangeEnd),
        preset: undefined,
        label: `${formatDateForStorage(rangeStart)} to ${formatDateForStorage(rangeEnd)}`
      };
      
      // Apply the filter and close dropdown
      setActiveFilters(prev => ({ ...prev, timeRange: finalRange }));
      onFiltersChange?.({ ...activeFilters, timeRange: finalRange });
      setOpenDropdown(null);
      
      // Reset state for next selection
      setDateRangeState({
        startDate: null,
        endDate: null,
        isSelectingStart: true
      });
    }
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
    onFiltersChange?.({});
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const formatDateForStorage = (date: Date) => {
    // Format date for storage/API - use local date but in ISO format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calendar component for date range selection
  const CalendarComponent = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }
      
      return days;
    };

    const formatDateForComparison = (date: Date) => {
      // Create date in local timezone to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const normalizeDateForComparison = (dateStr: string) => {
      // Handle both formats: "2024-01-15" and "2024-01-15T00:00:00+07:00"
      return dateStr.split('T')[0];
    };


    const isDateSelected = (day: number) => {
      if (!day) return false;
      const dateStr = formatDateForComparison(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      
      // Check activeFilters first (for when calendar is reopened)
      const activeTimeRange = activeFilters.timeRange;
      if (activeTimeRange?.startDate && activeTimeRange?.endDate) {
        return normalizeDateForComparison(activeTimeRange.startDate) === dateStr || 
               normalizeDateForComparison(activeTimeRange.endDate) === dateStr;
      }
      
      // Check dateRangeState (for during selection)
      return dateRangeState.startDate === dateStr || dateRangeState.endDate === dateStr;
    };


    const getRangePosition = (day: number) => {
      if (!day) return null;
      const dateStr = formatDateForComparison(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      const currentDate = new Date(dateStr);
      
      // Check activeFilters first
      const activeTimeRange = activeFilters.timeRange;
      if (activeTimeRange?.startDate && activeTimeRange?.endDate) {
        const startDate = new Date(activeTimeRange.startDate);
        const endDate = new Date(activeTimeRange.endDate);
        
        if (currentDate >= startDate && currentDate <= endDate) {
          if (normalizeDateForComparison(activeTimeRange.startDate) === dateStr) return 'start';
          if (normalizeDateForComparison(activeTimeRange.endDate) === dateStr) return 'end';
          return 'middle';
        }
      }
      
      // Check dateRangeState
      if (dateRangeState.startDate && dateRangeState.endDate) {
        const startDate = new Date(dateRangeState.startDate);
        const endDate = new Date(dateRangeState.endDate);
        
        if (currentDate >= startDate && currentDate <= endDate) {
          if (dateStr === dateRangeState.startDate) return 'start';
          if (dateStr === dateRangeState.endDate) return 'end';
          return 'middle';
        }
      }
      
      return null;
    };

    const handleDateClick = (day: number) => {
      if (!day) return;
      const dateStr = formatDateForComparison(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      handleCalendarDateClick(dateStr);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const days = getDaysInMonth(currentMonth);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="w-full">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-xs text-gray-500 text-center py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day || 0)}
              disabled={!day}
              className={`
                h-8 w-full text-xs transition-colors relative
                ${!day ? 'invisible' : ''}
                ${(() => {
                  const rangePosition = getRangePosition(day || 0);
                  const isSelected = isDateSelected(day || 0);
                  let selectedStyle = '';
                  if (isSelected) {
                    selectedStyle = 'bg-blue-500 text-white font-medium z-10';
                  } 
                  if (rangePosition === 'start') {
                    return `${selectedStyle} rounded-none`;
                  }
                  if (rangePosition === 'end') {
                    return `${selectedStyle}  rounded-none`;
                  } else if (rangePosition === 'middle') {
                    return 'bg-blue-100 text-blue-700 rounded-l-none rounded-r-none';
                  } else {
                    return 'hover:bg-gray-100 text-gray-700';
                  }
                })()}
                ${!dateRangeState.isSelectingStart && day && dateRangeState.startDate
                  ? 'hover:bg-blue-50'
                  : ''
                }
              `}
            >
              {day}
            </button>
          ))}
        </div>

      </div>
    );
  };

  const formatFilterValue = (key: string, value: any) => {
    if (key === 'timeRange' && value) {
      return value.label || 'Custom range';
    }
    return value;
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
                  <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 shadow-lg z-50">
                    <div className="p-4">
                      {config.type === 'timeRange' ? (
                        <div className="space-y-4">
                          {/* Calendar Component */}
                          <CalendarComponent />
                          
                          {/* Quick preset shortcuts */}
                          <div className="pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 mb-2">Quick Select:</div>
                            <div className="flex flex-wrap gap-1">
                              {timePresets.map((preset) => (
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
