import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const { i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 bg-transparent overflow-hidden">
      {/* Desktop version - Mantido exatamente igual */}
      <div className="hidden md:flex items-center justify-start w-full px-10 py-4">
        <div className="flex items-center space-x-8 ml-8">
          <div className="flex flex-col items-start">
            <img src="/logo1.svg" alt="ONUS Logo" className="h-9 w-auto" />
            <img src="/teste.png" alt="Sub Logo" className="h-4 w-auto mt-2" />
          </div>
          
          <div className="flex items-center space-x-5 ml-20">
            <span 
              onClick={() => changeLanguage('vi')}
              className={`text-lg cursor-pointer hover:text-gray-700 transition-colors ${
                i18n.language === 'vi' ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              Tiếng Việt
            </span>
            <div className="w-px h-5 bg-gray-300"></div>
            <span 
              onClick={() => changeLanguage('en')}
              className={`text-lg cursor-pointer hover:text-gray-700 transition-colors ${
                i18n.language === 'en' ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              English
            </span>
          </div>
        </div>
      </div>

      {/* Mobile version - Totalmente refeita */}
      <div className="md:hidden w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between w-full px-4 py-3">
          {/* Logo */}
          <div className="flex flex-col items-start flex-shrink-0">
            <img src="/logo1.svg" alt="ONUS Logo" className="h-7 w-auto" />
            <img src="/teste.png" alt="Sub Logo" className="h-2.5 w-auto mt-0.5" />
          </div>
          
          {/* Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-700" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
            <div className="px-4 py-3 space-y-3">
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-medium text-gray-600">Idioma / Language</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => changeLanguage('vi')}
                    className={`text-base cursor-pointer hover:text-gray-700 transition-colors ${
                      i18n.language === 'vi' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`text-base cursor-pointer hover:text-gray-700 transition-colors ${
                      i18n.language === 'en' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
