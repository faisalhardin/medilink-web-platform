import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';


interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'dateRange' | 'multiSelect' | 'search' | 'number' | 'boolean';
  icon: string;
  options?: FilterOption[];
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
}

interface FilterBarProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
}

export function FilterBar({ onFiltersChange }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    // Add event listener when dropdown is open
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);


  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange',
      icon: '📅'
    },
  ];

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

  const formatFilterValue = (key: string, value: any) => {
    if (key === 'dateRange' && value) {
      const { startDate, endDate } = value;
      if (startDate && endDate) {
        return `${startDate} - ${endDate}`;
      } else if (startDate) {
        return `From ${startDate}`;
      } else if (endDate) {
        return `Until ${endDate}`;
      }
    }
    return value;
  };

  return (
    <div ref={filterBarRef} className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
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
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      {config.type === 'dateRange' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => {
                                const currentRange = activeFilters.dateRange || {};
                                handleFilterChange('dateRange', {
                                  ...currentRange,
                                  startDate: e.target.value
                                });
                              }}
                              value={activeFilters.dateRange?.startDate || ''}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => {
                                const currentRange = activeFilters.dateRange || {};
                                handleFilterChange('dateRange', {
                                  ...currentRange,
                                  endDate: e.target.value
                                });
                              }}
                              value={activeFilters.dateRange?.endDate || ''}
                            />
                          </div>
                        </div>
                      ) : (
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
              return (
                <div
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <span className="mr-1">{config?.icon}</span>
                  <span className="mr-2">
                    {config?.label}: {formatFilterValue(key, value)}
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
    </div>
  );
}

export default FilterBar;
