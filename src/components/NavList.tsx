import React, { useState, useEffect, useRef } from 'react';


interface NavListProps {
    name: string;
    request: () => Promise<NavListItem[]>
}

export const NavList = (paramProps:NavListProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [items, setItems] = useState<NavListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<HTMLLIElement>(null);

    const toggleList = () => {
        setIsOpen(!isOpen);
    };

    const fetchItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("before request")
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
            <li className="w-full rounded button-style-1" onClick={toggleList} ref={listRef}>
                {paramProps.name}
                
            </li>
            {isOpen && (
                <ul>
                    {isLoading ? (
                        <li>Loading...</li>
                    ) : error ? (
                        <li>{error}</li>
                    ) : (
                        items.map((item) => (
                            <li key={item.id} className=" rounded button-style-1 pl-7">
                                {item.name}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </>
    );
}


export interface NavListItem {
    id: number;
    name: string;
}
