import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';


interface NavListProps {
    name: string;
    request: () => Promise<NavListItem[]>
}

export const NavList = (paramProps:NavListProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [items, setItems] = useState<NavListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<HTMLButtonElement>(null);

    const toggleList = () => {
        setIsOpen(!isOpen);
    };

    const fetchItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await paramProps.request();
            setItems(response);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data when the list is opened
    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen]);

    return (
        <>
            <button 
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                onClick={toggleList} 
                ref={listRef}
            >
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    {paramProps.name}
                </div>
                <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="ml-6 mt-1 space-y-1">
                    {isLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                        </div>
                    ) : error ? (
                        <div className="px-3 py-2 text-sm text-red-600">{error}</div>
                    ) : (
                        items.map((item) => (
                            <GetNavLink key={item.id} id={item.id} name={item.name} pageURL={item.pageURL} />
                        ))
                    )}
                </div>
            )}
        </>
    );
}


export interface NavListItem {
    id: number;
    name: string;
    pageURL: string;
}


const GetNavLink = (props:{pageURL:string, id:number, name:string}) => {
    return (
        <NavLink 
            to={props.pageURL}
            className={({ isActive }) => 
                `block px-3 py-2 text-sm text-gray-600 rounded-md transition-colors duration-200 ${
                    isActive 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'hover:bg-gray-50 hover:text-gray-900'
                }`
            }
        >
            {props.name}
        </NavLink>
    )
}