import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const currentLanguage = i18n.language;
    const isEnglish = currentLanguage === 'en';

    const switchLanguage = () => {
        const newLanguage = isEnglish ? 'id' : 'en';
        i18n.changeLanguage(newLanguage);
    };

    return (
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Language</span>
            <button
                onClick={switchLanguage}
                className={`relative inline-flex items-center h-8 w-20 transition-all duration-300 ease-in-out ${
                    isEnglish 
                        ? 'bg-gray-300' 
                        : 'bg-blue-600'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                style={{ borderRadius: '2px' }}
                type="button"
                aria-label={`Switch to ${isEnglish ? 'Bahasa Indonesia' : 'English'}`}
            >
                {/* EN label - always on the left */}
                <span 
                    className={`absolute left-2 top-0 h-8 flex items-center justify-center text-xs font-semibold transition-colors duration-300 z-20 ${
                        isEnglish 
                            ? 'text-gray-800' 
                            : 'text-white opacity-30'
                    }`}
                >
                    EN
                </span>
                
                {/* ID label - always on the right */}
                <span 
                    className={`absolute right-2 top-0 h-8 flex items-center justify-center text-xs font-semibold transition-colors duration-300 z-20 ${
                        isEnglish 
                            ? 'text-gray-600 opacity-70' 
                            : 'text-gray-800'
                    }`}
                >
                    ID
                </span>
                
                {/* White knob - moves to indicate active language */}
                <span
                    className={`absolute top-1 h-6 w-9 bg-white transition-all duration-300 ease-in-out z-10 ${
                        isEnglish ? 'left-1' : 'right-1'
                    }`}
                    style={{ borderRadius: '2px' }}
                />
            </button>
        </div>
    );
};

export default LanguageSwitcher;

