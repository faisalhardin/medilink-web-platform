interface FolderTabProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    className?: string;
}

const FolderTab = ({ label, isActive, onClick, className = '' }: FolderTabProps) => {
    return (
        <div
            onClick={onClick}
            className={`px-7 py-2.5 text-sm transition-all relative rounded-t-xl rounded-b-none cursor-pointer ${
                isActive
                    ? 'bg-white text-gray-600 font-semibold border border-b-0'
                    : 'bg-gray-300 text-gray-500 hover:text-gray-800'
            } ${className}`}
        >
            {label}
            {!isActive && (
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
            )}
        </div>
    );
};

export default FolderTab;

