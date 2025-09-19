import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown } from 'lucide-react';

const LoadingHeader = () => {
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
    <header className="w-full bg-white border-b border-gray-200 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        {/* Desktop Layout - Mantido exatamente igual */}
        <div className="hidden md:flex items-center justify-between px-6 py-4">
          {/* Left side - Logo and navigation */}
          <div className="flex items-center space-x-8">
            {/* ONUS Logo */}
            <div className="flex items-center">
              <img src="/logo1.svg" alt="ONUS Logo" className="h-10 w-auto" />
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold text-lg">Market</a>
              <div className="flex items-center space-x-1">
                <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold text-lg">Trade</a>
                <ChevronDown className="w-6 h-6 text-gray-700" />
              </div>
              <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold text-lg">Futures</a>
              <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold text-lg">Insights</a>
              <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold text-lg">Newsroom</a>
              <a href="#" className="text-gray-900 hover:text-blue-600 font-semibold text-lg">Support</a>
            </nav>
          </div>
          
          {/* Right side - Language selector, Wallet button and 3 images */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-3">
              <span 
                onClick={() => changeLanguage('vi')}
                className={`text-sm cursor-pointer hover:text-gray-700 transition-colors ${
                  i18n.language === 'vi' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                }`}
              >
                Tiếng Việt
              </span>
              <div className="w-px h-4 bg-gray-300"></div>
              <span 
                onClick={() => changeLanguage('en')}
                className={`text-sm cursor-pointer hover:text-gray-700 transition-colors ${
                  i18n.language === 'en' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                }`}
              >
                English
              </span>
            </div>
            
            {/* Wallet Button - With spinner instead of $0 */}
            <button className="flex items-center space-x-2 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700">
              <img src="/wallet.svg" alt="Wallet" className="w-5 h-5" />
              <div className="w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </button>
            
            {/* Desktop Images */}
            <div className="flex items-center space-x-4">
              <img src="/bars-header.svg" alt="Image 1" className="w-8 h-8" />
              <img src="/receive-square.svg" alt="Image 2" className="w-8 h-8" />
              <img src="/avatar-default.svg" alt="Image 3" className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Mobile Layout - Totalmente refeito */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <img src="/logo1.svg" alt="ONUS Logo" className="h-8 w-auto" />
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
            <div className="border-t border-gray-200 bg-white">
              <div className="px-4 py-4 space-y-4">
                {/* Navigation Links */}
                <nav className="space-y-3">
                  <a href="#" className="block text-gray-900 hover:text-blue-600 font-medium text-base py-1">Market</a>
                  <a href="#" className="block text-gray-900 hover:text-blue-600 font-medium text-base py-1">Trade</a>
                  <a href="#" className="block text-gray-900 hover:text-blue-600 font-medium text-base py-1">Futures</a>
                  <a href="#" className="block text-gray-900 hover:text-blue-600 font-medium text-base py-1">Insights</a>
                  <a href="#" className="block text-gray-900 hover:text-blue-600 font-medium text-base py-1">Newsroom</a>
                  <a href="#" className="block text-gray-900 hover:text-blue-600 font-medium text-base py-1">Support</a>
                </nav>
                
                {/* Language Selector */}
                <div className="pt-3 border-t border-gray-200">
                  <span className="block text-sm font-medium text-gray-600 mb-2">Idioma / Language</span>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => changeLanguage('vi')}
                      className={`text-sm cursor-pointer hover:text-gray-700 transition-colors ${
                        i18n.language === 'vi' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                      }`}
                    >
                      Tiếng Việt
                    </button>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`text-sm cursor-pointer hover:text-gray-700 transition-colors ${
                        i18n.language === 'en' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
                
                {/* Wallet and Icons */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700">
                      <img src="/wallet.svg" alt="Wallet" className="w-4 h-4" />
                      <div className="w-3 h-3 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      <img src="/bars-header.svg" alt="Image 1" className="w-6 h-6" />
                      <img src="/receive-square.svg" alt="Image 2" className="w-6 h-6" />
                      <img src="/avatar-default.svg" alt="Image 3" className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default LoadingHeader;