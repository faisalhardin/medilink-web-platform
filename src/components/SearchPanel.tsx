import React, { useState, useRef, useEffect } from 'react';

interface SearchResult {
  id: string;
  name: string;
}

const SearchPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Mock search function - in a real app, this would call an API or search a dataset
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Simulate search results
    const mockResults: SearchResult[] = [
      { id: '1', name: `${term} result 1` },
      { id: '2', name: `${term} result 2` },
      { id: '3', name: `${term} result 3` },
      { id: '4', name: `${term} result 4` },
    ];
    
    setSearchResults(mockResults);
    setShowResults(true);
  };

  const handleResultClick = (result: SearchResult) => {
    setSearchTerm(result.name);
    setShowResults(false);
    // Here you can also do something with the selected result
    console.log('Selected:', result);
  };

  // Handle clicks outside of the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    // Add event listener when the dropdown is shown
    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  return (
    <div className="w-[300px] mx-auto my-5">
      <div ref={searchContainerRef} className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="w-full p-2.5 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
          onFocus={() => setShowResults(searchResults.length > 0)}
        />
        
        {showResults && (
          <ul className="absolute w-full max-h-[300px] overflow-y-auto mt-0 p-0 list-none border border-gray-300 border-t-0 rounded-b-md bg-white z-10 shadow-md">
            {searchResults.map((result) => (
              <li 
                key={result.id} 
                onClick={() => handleResultClick(result)}
                className="p-2.5 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
              >
                {result.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
