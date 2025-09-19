import React from "react";
import { createPortal } from "react-dom";
import "react-phone-number-input/style.css";
import PhoneInput, {
  getCountries,
  getCountryCallingCode,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import flags from "react-phone-number-input/flags";

const PhoneField = ({
  value,
  onChange,
  defaultCountry = "BR",
  onCountryChange,
  onFocus,
  onBlur,
  style,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef(null);
  const [dropdownPos, setDropdownPos] = React.useState({
    top: 0,
    left: 0,
    width: 280,
  });

  const countries = React.useMemo(() => getCountries(), []);

  const FlagIcon = ({ code, size = 20 }) => {
    const Icon = flags[code];
    if (!Icon)
      return <span style={{ width: size, height: Math.round(size * 0.7) }} />;
    return (
      <Icon
        title={en[code] || code}
        style={{
          width: size,
          height: Math.round(size * 0.7),
          borderRadius: 3,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
          display: "block",
        }}
      />
    );
  };

  const selectedCalling = React.useMemo(() => {
    try {
      return defaultCountry ? getCountryCallingCode(defaultCountry) : "";
    } catch {
      return "";
    }
  }, [defaultCountry]);

  const filteredCountries = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((cc) => {
      const name = (en[cc] || cc).toLowerCase();
      const ddi = (() => {
        try {
          return getCountryCallingCode(cc);
        } catch {
          return "";
        }
      })();
      return (
        name.includes(q) ||
        ("+" + ddi).includes(q) ||
        ddi.includes(q) ||
        cc.toLowerCase().includes(q)
      );
    });
  }, [countries, query]);

  const recalcDropdownPosition = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const left = Math.max(8, rect.left + 10);
    const top = rect.bottom + 6;
    const width = Math.min(300, Math.max(260, rect.width - 40));
    setDropdownPos({ top, left, width });
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    recalcDropdownPosition();
    const onDocClick = (e) => {
      const root = document.getElementById("phone-country-dropdown-root");
      if (root && root.contains(e.target)) return;
      if (containerRef.current && containerRef.current.contains(e.target))
        return;
      setIsOpen(false);
    };
    const onScroll = () => recalcDropdownPosition();
    const onResize = () => recalcDropdownPosition();
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, recalcDropdownPosition]);
  return (
    <div ref={containerRef} style={{ position: "relative", ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: isFocused ? "2px solid #6a33f5" : "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#fff",
          padding: 10,
          gap: 10,
        }}
        onFocus={() => {
          setIsFocused(true);
          onFocus && onFocus();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur && onBlur();
        }}
      >
        {/* Bandeira + DDI custom com dropdown */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((v) => !v);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            marginRight: 6,
            borderRight: "1px solid #e5e7eb",
            background: "#fafafa",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <span style={{ lineHeight: 1 }}>
            <FlagIcon code={defaultCountry} />
          </span>
          <span style={{ color: "#111827", fontWeight: 600 }}>
            {selectedCalling ? "+" + selectedCalling : "+"}
          </span>
          <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M4 6l4 4 4-4"
              stroke="#6b7280"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Input de telefone */}
        <div style={{ flex: 1 }}>
          <PhoneInput
            international
            country={defaultCountry}
            defaultCountry={defaultCountry}
            value={value}
            onChange={onChange}
            onCountryChange={onCountryChange}
            flags={flags}
            style={{ width: "100%" }}
          />
        </div>
      </div>
      {/* Dropdown custom de países (portal para fora do modal) */}
      {isOpen &&
        createPortal(
          <div
            id="phone-country-dropdown-root"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 100000,
              width: dropdownPos.width,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
              <input
                autoFocus
                placeholder="Search country or DDI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto", padding: 6 }}>
              {filteredCountries.map((cc) => {
                const name = en[cc] || cc;
                let code = "";
                try {
                  code = getCountryCallingCode(cc);
                } catch {}
                return (
                  <button
                    key={cc}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      onCountryChange && onCountryChange(cc);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <span>
                      <FlagIcon code={cc} />
                    </span>
                    <span
                      style={{
                        flex: 1,
                        textAlign: "left",
                        fontSize: 13,
                        color: "#111827",
                      }}
                    >
                      {name}
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      {code ? "+" + code : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}

      {/* Estilização adicional do componente da lib */}
      <style>{`
        .PhoneInput { width: 100%; }
        .PhoneInput input { border: none; outline: none; font-size: 15px; width: 100%; }
        /* Esconde o seletor nativo da lib para usarmos o custom */
        .PhoneInputCountry { display: none !important; }
      `}</style>
    </div>
  );
};

export default PhoneField;
