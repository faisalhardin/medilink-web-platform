import { useRef, useState, useEffect } from 'react';

interface HorizontalScrollProps {
    children: React.ReactNode;
    className?: string;
    scrollBarPosition?: 'top' | 'bottom';
    showScrollButtons?: boolean;
}

const HorizontalScroll = ({ 
    children, 
    className = '', 
    scrollBarPosition = 'top',
    showScrollButtons = false 
}: HorizontalScrollProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollContentRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        if (scrollContainerRef.current && scrollContentRef.current) {
            const container = scrollContainerRef.current;
            const content = scrollContentRef.current;
            
            const maxScroll = content.scrollWidth - container.clientWidth;
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < maxScroll - 1);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        updateScrollButtons();
        
        container.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);

        // Check on content changes
        const resizeObserver = new ResizeObserver(updateScrollButtons);
        if (scrollContentRef.current) {
            resizeObserver.observe(scrollContentRef.current);
        }

        return () => {
            container.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
            resizeObserver.disconnect();
        };
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            const newPosition = 
                direction === 'left' 
                    ? scrollContainerRef.current.scrollLeft - scrollAmount
                    : scrollContainerRef.current.scrollLeft + scrollAmount;
            
            scrollContainerRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
        }
    };

    const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (scrollContainerRef.current && scrollContentRef.current) {
            const scrollbar = e.currentTarget;
            const clickX = e.clientX - scrollbar.getBoundingClientRect().left;
            const scrollbarWidth = scrollbar.offsetWidth;
            const contentWidth = scrollContentRef.current.scrollWidth;
            const containerWidth = scrollContainerRef.current.clientWidth;
            const scrollableWidth = contentWidth - containerWidth;
            
            const percentage = clickX / scrollbarWidth;
            const newScrollPosition = percentage * scrollableWidth;
            
            scrollContainerRef.current.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth'
            });
        }
    };

    const getScrollbarThumbPosition = () => {
        if (scrollContainerRef.current && scrollContentRef.current) {
            const container = scrollContainerRef.current;
            const content = scrollContentRef.current;
            const scrollableWidth = content.scrollWidth - container.clientWidth;
            const scrollbarWidth = container.clientWidth;
            const thumbWidth = Math.max((container.clientWidth / content.scrollWidth) * scrollbarWidth, 40);
            const maxThumbPosition = scrollbarWidth - thumbWidth;
            
            if (scrollableWidth <= 0) return 0;
            
            const percentage = container.scrollLeft / scrollableWidth;
            return percentage * maxThumbPosition;
        }
        return 0;
    };

    const getScrollbarThumbWidth = () => {
        if (scrollContainerRef.current && scrollContentRef.current) {
            const container = scrollContainerRef.current;
            const content = scrollContentRef.current;
            const scrollbarWidth = container.clientWidth;
            const thumbWidth = (container.clientWidth / content.scrollWidth) * scrollbarWidth;
            return Math.max(thumbWidth, 40);
        }
        return 100;
    };

    const needsScrollbar = () => {
        if (scrollContainerRef.current && scrollContentRef.current) {
            return scrollContentRef.current.scrollWidth > scrollContainerRef.current.clientWidth;
        }
        return false;
    };

    return (
        <div className={`relative ${className}`}>
            {/* Custom Scrollbar */}
            {needsScrollbar() && (
                <div 
                    className={`absolute ${scrollBarPosition === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 h-2 bg-gray-200 rounded-full cursor-pointer z-10`}
                    onClick={handleScrollbarClick}
                >
                    <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-150 hover:bg-blue-600"
                        style={{
                            width: `${getScrollbarThumbWidth()}px`,
                            transform: `translateX(${getScrollbarThumbPosition()}px)`,
                        }}
                    />
                </div>
            )}

            {/* Scroll Buttons */}
            {showScrollButtons && (
                <>
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
                            aria-label="Scroll left"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
                            aria-label="Scroll right"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </>
            )}

            {/* Scrollable Content */}
            <div
                ref={scrollContainerRef}
                className={`overflow-x-auto overflow-y-hidden ${scrollBarPosition === 'top' ? 'pt-3' : 'pb-3'}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={updateScrollButtons}
            >
                <style>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <div ref={scrollContentRef} className="flex">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default HorizontalScroll;

