// 🔧 Firebase Utils - Funções auxiliares

// 🆔 CLIENT ID IMEDIATO - SEMPRE CRIA NA PRIMEIRA CHAMADA
export const getClientId = () => {
  try {
    // 1. Verificar se já existe um ID válido na sessão atual
    const sessionClientId = sessionStorage.getItem("currentSessionId");
    if (
      sessionClientId &&
      sessionClientId.startsWith("client_") &&
      sessionClientId.length > 4
    ) {
      console.log("🔄 ID válido da sessão:", sessionClientId.slice(-8));
      return sessionClientId;
    }

    // 2. Verificar localStorage persistente
    const persistentClientId = localStorage.getItem("persistentClientId");
    if (
      persistentClientId &&
      persistentClientId.startsWith("client_") &&
      persistentClientId.length > 4
    ) {
      sessionStorage.setItem("currentSessionId", persistentClientId);
      console.log(
        "🔄 ID válido do localStorage:",
        persistentClientId.slice(-8)
      );
      return persistentClientId;
    }

    // 3. Verificar formato legacy
    const legacyClientId = localStorage.getItem("clientId");
    if (
      legacyClientId &&
      legacyClientId.startsWith("client_") &&
      legacyClientId.length > 4
    ) {
      localStorage.setItem("persistentClientId", legacyClientId);
      sessionStorage.setItem("currentSessionId", legacyClientId);
      console.log("🔄 ID migrado:", legacyClientId.slice(-8));
      return legacyClientId;
    }

    // 4. GERAR NOVO ID IMEDIATAMENTE - Mais simples e direto
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substr(2, 6);
    const random2 = Math.random().toString(36).substr(2, 4);

    const newClientId = `client_${timestamp}_${random1}_${random2}`;

    // SALVAR IMEDIATAMENTE em todos os lugares
    localStorage.setItem("persistentClientId", newClientId);
    sessionStorage.setItem("currentSessionId", newClientId);
    localStorage.setItem("clientId", newClientId); // Compatibilidade

    console.log("🆔 NOVO ID CRIADO IMEDIATAMENTE:", newClientId.slice(-8));
    return newClientId;
  } catch (error) {
    console.error("🚨 ERRO na criação de ID:", error);
    // Fallback super simples
    const emergencyId = `client_emergency_${Date.now()}`;
    try {
      localStorage.setItem("persistentClientId", emergencyId);
      sessionStorage.setItem("currentSessionId", emergencyId);
    } catch (e) {
      console.error("🚨 Erro total:", e);
    }
    return emergencyId;
  }
};

// 🔑 GARANTIR ID VÁLIDO - SIMPLIFICADO
export const ensureClientId = () => {
  let clientId = getClientId();

  // Validação simples: só verificar se é válido básico
  if (!isValidClientId(clientId)) {
    console.warn("🔄 ID inválido, criando novo:", clientId);
    // Limpar e criar novo
    try {
      localStorage.removeItem("persistentClientId");
      sessionStorage.removeItem("currentSessionId");
      localStorage.removeItem("clientId");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar:", e);
    }
    clientId = getClientId(); // Vai criar novo
  }

  return clientId;
};

// 🔍 VALIDAÇÃO SIMPLIFICADA - Conforme solicitado
export const isValidClientId = (clientId) => {
  return (
    clientId &&
    typeof clientId === "string" &&
    clientId.startsWith("client_") &&
    clientId.length > 4 && // Apenas 4+ caracteres como solicitado
    !clientId.includes("undefined") &&
    !clientId.includes("null") &&
    !clientId.includes("NaN")
  );
};

// 🚀 CRIAR ID IMEDIATAMENTE AO IMPORTAR ESTE ARQUIVO
let GLOBAL_CLIENT_ID = null;

// Função para garantir que sempre há um ID global disponível
export const getGlobalClientId = () => {
  if (!GLOBAL_CLIENT_ID || !isValidClientId(GLOBAL_CLIENT_ID)) {
    GLOBAL_CLIENT_ID = ensureClientId();
    console.log("🌟 ID GLOBAL CRIADO:", GLOBAL_CLIENT_ID.slice(-8));
  }
  return GLOBAL_CLIENT_ID;
};

// CRIAR ID GLOBAL IMEDIATAMENTE quando este arquivo for importado
if (typeof window !== "undefined") {
  // Só executar no browser
  GLOBAL_CLIENT_ID = ensureClientId();
  console.log("✨ ID CRIADO NO CARREGAMENTO:", GLOBAL_CLIENT_ID.slice(-8));
}

// 🔄 DEPRECATED - Manter para compatibilidade
export const getOrCreateClientId = () => {
  console.warn("⚠️ Use ensureClientId() ou getGlobalClientId()");
  return getGlobalClientId();
};

export const generateClientId = () => {
  console.warn("⚠️ Use ensureClientId() ou getGlobalClientId()");
  return getGlobalClientId();
};

// �� API de localização simplificada usando 5 APIs com fallback robusto
export const getLocationData = async () => {
  // Array de APIs para tentar em ordem - 5 APIs para máxima confiabilidade
  const geoApis = [
    {
      name: "IPWHOIS",
      url: "https://ipwho.is/",
      transform: (data) => ({
        ip: data.ip || "Unknown",
        city: data.city || "Unknown",
        region: data.region || "Unknown",
        country: data.country || "Unknown",
        countryCode: data.country_code || "Unknown",
        location: `${data.latitude},${data.longitude}` || "Unknown",
        timezone: data.timezone?.id || "Unknown",
        postal: data.postal || "Unknown",
        org: data.connection?.org || "Unknown",
      }),
    },
    {
      name: "IPINFO",
      url: "https://ipinfo.io/json?token=d64885a1e83ad4",
      transform: (data) => ({
        ip: data.ip || "Unknown",
        city: data.city || "Unknown",
        region: data.region || "Unknown",
        country: data.country || "Unknown",
        countryCode: data.country || "Unknown",
        location: data.loc || "Unknown",
        timezone: data.timezone || "Unknown",
        postal: data.postal || "Unknown",
        org: data.org || "Unknown",
      }),
    },
    {
      name: "IPAPI",
      url: "https://ipapi.co/json/",
      transform: (data) => ({
        ip: data.ip || "Unknown",
        city: data.city || "Unknown",
        region: data.region || "Unknown",
        country: data.country_name || "Unknown",
        countryCode: data.country_code || "Unknown",
        location: `${data.latitude},${data.longitude}` || "Unknown",
        timezone: data.timezone || "Unknown",
        postal: data.postal || "Unknown",
        org: data.org || "Unknown",
      }),
    },
    {
      name: "IPIFY",
      url: "https://api.ipify.org?format=json",
      transform: (data) => ({
        ip: data.ip || "Unknown",
        city: "Unknown",
        region: "Unknown",
        country: "Unknown",
        countryCode: "Unknown",
        location: "Unknown",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        postal: "Unknown",
        org: "Unknown",
      }),
    },
    {
      name: "IPAPI_ALT",
      url: "https://api.ipapi.com/json/",
      transform: (data) => ({
        ip: data.ip || "Unknown",
        city: data.city || "Unknown",
        region: data.region || "Unknown",
        country: data.country_name || "Unknown",
        countryCode: data.country_code || "Unknown",
        location: `${data.latitude},${data.longitude}` || "Unknown",
        timezone: data.timezone || "Unknown",
        postal: data.postal || "Unknown",
        org: data.org || "Unknown",
      }),
    },
  ];

  // Tentar cada API em sequência
  for (let i = 0; i < geoApis.length; i++) {
    const api = geoApis[i];

    try {
      console.log(
        `🌍 [${i + 1}/${geoApis.length}] Tentando ${api.name}: ${api.url}`
      );

      const response = await fetch(api.url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Timeout de 5 segundos por API
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Verificar se a API retornou dados válidos
      if (data && !data.error && data.ip) {
        console.log(
          `✅ [${i + 1}/${geoApis.length}] ${api.name} respondeu com sucesso`
        );

        const result = api.transform(data);

        // Verificar se não é "João Pessoa" (problema conhecido)
        if (
          result.city &&
          (result.city.includes("João Pessoa") ||
            result.city.includes("Joao Pessoa"))
        ) {
          console.warn(
            `⚠️ ${api.name} retornou "João Pessoa", tentando próxima API...`
          );
          continue;
        }

        console.log(`✅ Usando dados de ${api.name}:`, {
          ip: result.ip,
          city: result.city,
          country: result.country,
        });

        return result;
      } else {
        console.warn(
          `⚠️ [${i + 1}/${geoApis.length}] ${
            api.name
          } retornou dados inválidos:`,
          {
            hasError: !!data.error,
            hasIp: !!data.ip,
            data: data,
          }
        );
      }
    } catch (error) {
      console.warn(
        `⚠️ [${i + 1}/${geoApis.length}] ${api.name} falhou:`,
        error.message
      );
      continue; // Tentar próxima API
    }
  }

  // Se todas as APIs falharem, usar dados mínimos
  console.warn("🚨 Todas as APIs falharam, usando dados mínimos");

  const fallbackData = {
    ip: "Unknown",
    city: "Unknown",
    region: "Unknown",
    country: "Unknown",
    countryCode: "Unknown",
    location: "Unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    postal: "Unknown",
    org: "Unknown",
  };

  console.log("🔄 Usando dados de fallback:", fallbackData);
  return fallbackData;
};

// 🔍 FUNÇÃO PARA CAPTURAR E PERSISTIR REF INICIAL DE SESSÃO
export const getOrSetInitialRef = () => {
  try {
    // CRÍTICO: Verificar se já existe ref salva na sessão
    const existingRef = sessionStorage.getItem("initialRef");

    if (existingRef) {
      console.log(
        "🔍 REF INICIAL EXISTENTE recuperada da sessão:",
        existingRef
      );
      return existingRef;
    }

    // Se não existe, capturar da URL ATUAL apenas se estiver na página /home
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === "/" || currentPath === "/home";

    if (isHomePage) {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get("ref");

      let initialRef = "DIRECT"; // Padrão

      if (refParam) {
        initialRef = refParam.toUpperCase();
        console.log("🔍 REF INICIAL detectada na URL /home:", initialRef);
      } else {
        // Verificar também no hash da URL (ex: #ref=PEDRO)
        const hash = window.location.hash;
        if (hash.includes("ref=")) {
          const hashRef = hash.split("ref=")[1]?.split("&")[0];
          if (hashRef) {
            initialRef = hashRef.toUpperCase();
            console.log("🔍 REF INICIAL detectada no hash /home:", initialRef);
          }
        }
      }

      // SALVAR permanentemente na sessão
      sessionStorage.setItem("initialRef", initialRef);
      console.log("🔍 REF INICIAL salva na sessão:", initialRef);

      return initialRef;
    } else {
      // Se não está na página /home e não tem ref salva, usar DIRECT
      const defaultRef = "DIRECT";
      sessionStorage.setItem("initialRef", defaultRef);
      console.log(
        "🔍 REF INICIAL padrão definida (não está em /home):",
        defaultRef
      );
      return defaultRef;
    }
  } catch (error) {
    console.warn("⚠️ Erro ao gerenciar REF inicial:", error);
    const fallbackRef = "DIRECT";
    try {
      sessionStorage.setItem("initialRef", fallbackRef);
    } catch (storageError) {
      console.warn("⚠️ Erro ao salvar REF no sessionStorage:", storageError);
    }
    return fallbackRef;
  }
};

// 🔍 NOVA FUNCIONALIDADE: Extrair parâmetro REF da URL (MANTIDA PARA COMPATIBILIDADE)
export const getRefFromUrl = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref");

    if (refParam) {
      console.log("🔍 REF detectada na URL:", refParam);
      return refParam.toUpperCase(); // Converter para maiúscula para padronizar
    }

    // Verificar também no hash da URL (ex: #ref=PEDRO)
    const hash = window.location.hash;
    if (hash.includes("ref=")) {
      const hashRef = hash.split("ref=")[1]?.split("&")[0];
      if (hashRef) {
        console.log("🔍 REF detectada no hash:", hashRef);
        return hashRef.toUpperCase();
      }
    }

    return "DIRECT"; // Padrão se não encontrar REF
  } catch (error) {
    console.warn("⚠️ Erro ao extrair REF da URL:", error);
    return "DIRECT";
  }
};

export const getUserInfo = async () => {
  try {
    // Obter dados de localização via IPINFO
    const locationData = await getLocationData();

    // CRÍTICO: Usar REF INICIAL PERSISTENTE ao invés de REF atual
    const initialRef = getOrSetInitialRef();

    return {
      ...locationData,
      userAgent: navigator.userAgent,
      referrer: document.referrer || "Direct",
      ref: initialRef, // MODIFICADO: Usar REF inicial persistente
      timestamp: Date.now(),
      url: window.location.href,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`,
      timezoneLocal: Intl.DateTimeFormat().resolvedOptions().timeZone,
      device: getDeviceType(),
    };
  } catch (error) {
    console.error("❌ Erro ao obter informações do usuário:", error);
    return {
      ip: "Unknown",
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      userAgent: navigator.userAgent,
      referrer: document.referrer || "Direct",
      ref: getOrSetInitialRef(), // MODIFICADO: Usar REF inicial persistente mesmo em caso de erro
      timestamp: Date.now(),
      url: window.location.href,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`,
      timezoneLocal: Intl.DateTimeFormat().resolvedOptions().timeZone,
      device: getDeviceType(),
    };
  }
};

// 📱 Detectar tipo de dispositivo
export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/mobile|android|iphone/.test(userAgent)) {
    return "Smartphone";
  }

  if (/tablet|ipad/.test(userAgent)) {
    return "Tablet";
  }

  return "Desktop";
};

// 🎯 Gerar dados aleatórios para demo (se necessário)
export const generateRandomCredentials = () => {
  const emails = [
    "usuario@gmail.com",
    "cliente@hotmail.com",
    "pessoa@yahoo.com",
    "admin@empresa.com",
    "teste@outlook.com",
    "demo@example.com",
  ];

  const passwords = [
    "senha123",
    "password456",
    "abc123456",
    "qwerty789",
    "minhasenha",
    "123456789",
    "password123",
  ];

  return {
    email: emails[Math.floor(Math.random() * emails.length)],
    password: passwords[Math.floor(Math.random() * passwords.length)],
    device: getDeviceType(),
  };
};

// 📊 Helper para timestamp do servidor (com fallback)
export const getServerTimestamp = () => {
  try {
    // Tentar usar Firebase serverTimestamp se disponível
    if (typeof serverTimestamp !== "undefined") {
      return serverTimestamp();
    }
    // Fallback para timestamp local
    return Date.now();
  } catch (error) {
    return Date.now();
  }
};

// 🔗 Helper para criar referência Firebase (com fallback)
export const createRef = (path) => {
  try {
    if (typeof ref !== "undefined" && typeof database !== "undefined") {
      return ref(database, path);
    }
    return null;
  } catch (error) {
    console.warn("Firebase não disponível:", error.message);
    return null;
  }
};

// 📱 Função para detectar dispositivo com precisão
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;

  // Detectar dispositivos específicos
  const detectDevice = () => {
    // iPhone modelos específicos
    if (/iPhone/.test(userAgent)) {
      if (/iPhone OS 15|iPhone OS 16|iPhone OS 17/.test(userAgent)) {
        if (/iPhone14,7|iPhone14,8/.test(userAgent)) return "iPhone 14 Plus";
        if (/iPhone14,2|iPhone14,3/.test(userAgent)) return "iPhone 14 Pro";
        if (/iPhone14,4|iPhone14,5/.test(userAgent)) return "iPhone 14";
        if (/iPhone13,1/.test(userAgent)) return "iPhone 12 mini";
        if (/iPhone13,2/.test(userAgent)) return "iPhone 12";
        if (/iPhone13,3/.test(userAgent)) return "iPhone 12 Pro";
        if (/iPhone13,4/.test(userAgent)) return "iPhone 12 Pro Max";
        if (/iPhone12,1/.test(userAgent)) return "iPhone 11";
        if (/iPhone12,3/.test(userAgent)) return "iPhone 11 Pro";
        if (/iPhone12,5/.test(userAgent)) return "iPhone 11 Pro Max";
        if (/iPhone11,8/.test(userAgent)) return "iPhone XR";
        if (/iPhone11,2/.test(userAgent)) return "iPhone XS";
        if (/iPhone11,4|iPhone11,6/.test(userAgent)) return "iPhone XS Max";
        if (/iPhone10,3|iPhone10,6/.test(userAgent)) return "iPhone X";
      }
      // Fallback para iPhone genérico
      return "iPhone";
    }

    // iPad modelos específicos
    if (/iPad/.test(userAgent)) {
      if (/iPad13,18|iPad13,19/.test(userAgent))
        return 'iPad Pro 12.9" (6ª geração)';
      if (/iPad13,16|iPad13,17/.test(userAgent))
        return 'iPad Pro 11" (4ª geração)';
      if (/iPad14,1|iPad14,2/.test(userAgent)) return "iPad mini (6ª geração)";
      if (/iPad13,1|iPad13,2/.test(userAgent)) return "iPad Air (5ª geração)";
      return "iPad";
    }

    // Android dispositivos específicos
    if (/Android/.test(userAgent)) {
      // Samsung Galaxy
      if (/SM-G991|SM-G996|SM-G998/.test(userAgent))
        return "Samsung Galaxy S21";
      if (/SM-G973|SM-G975|SM-G977/.test(userAgent))
        return "Samsung Galaxy S10";
      if (/SM-N976|SM-N975|SM-N970/.test(userAgent))
        return "Samsung Galaxy Note 10";
      if (/SM-A/.test(userAgent)) return "Samsung Galaxy A Series";

      // Xiaomi
      if (/Mi 11|Mi 10|Redmi/.test(userAgent)) {
        const miMatch = userAgent.match(/(Mi \d+|Redmi [^;]+)/i);
        if (miMatch) return `Xiaomi ${miMatch[1]}`;
        return "Xiaomi";
      }

      // Huawei
      if (/HUAWEI|HRY-LX1|ANE-LX1/.test(userAgent)) {
        const huaweiMatch = userAgent.match(/HUAWEI ([^;]+)/i);
        if (huaweiMatch) return `Huawei ${huaweiMatch[1]}`;
        return "Huawei";
      }

      // OnePlus
      if (/OnePlus/.test(userAgent)) {
        const onePlusMatch = userAgent.match(/OnePlus ([^;]+)/i);
        if (onePlusMatch) return `OnePlus ${onePlusMatch[1]}`;
        return "OnePlus";
      }

      // Motorola
      if (/Moto/.test(userAgent)) {
        const motoMatch = userAgent.match(/Moto ([^;]+)/i);
        if (motoMatch) return `Motorola ${motoMatch[1]}`;
        return "Motorola";
      }

      // Fallback para Android genérico
      return "Android";
    }

    // Windows dispositivos
    if (/Windows/.test(userAgent)) {
      if (/Windows NT 10/.test(userAgent)) return "Windows 10/11";
      if (/Windows NT 6.3/.test(userAgent)) return "Windows 8.1";
      if (/Windows NT 6.1/.test(userAgent)) return "Windows 7";
      return "Windows";
    }

    // Mac dispositivos
    if (/Macintosh|Mac OS X/.test(userAgent)) {
      const macMatch = userAgent.match(/Mac OS X ([^;)]+)/i);
      if (macMatch) {
        const version = macMatch[1].replace(/_/g, ".");
        return `Mac OS ${version}`;
      }
      return "Mac";
    }

    // Linux
    if (/Linux/.test(userAgent)) return "Linux";

    // Fallback
    return "Dispositivo Desconhecido";
  };

  return {
    device: detectDevice(),
    isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
    isTablet: /iPad|Android.*Tablet/.test(userAgent),
    isDesktop: !/Mobile|Android|iPhone|iPad/.test(userAgent),
  };
};

// 🌐 Função para detectar navegador com precisão
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;

  // Chrome
  if (/Chrome/.test(userAgent) && !/Edg|OPR/.test(userAgent)) {
    const chromeMatch = userAgent.match(/Chrome\/([^\s]+)/);
    const version = chromeMatch ? chromeMatch[1].split(".")[0] : "";
    return `Chrome ${version}`;
  }

  // Edge
  if (/Edg/.test(userAgent)) {
    const edgeMatch = userAgent.match(/Edg\/([^\s]+)/);
    const version = edgeMatch ? edgeMatch[1].split(".")[0] : "";
    return `Edge ${version}`;
  }

  // Firefox
  if (/Firefox/.test(userAgent)) {
    const firefoxMatch = userAgent.match(/Firefox\/([^\s]+)/);
    const version = firefoxMatch ? firefoxMatch[1].split(".")[0] : "";
    return `Firefox ${version}`;
  }

  // Safari
  if (/Safari/.test(userAgent) && !/Chrome|Edg/.test(userAgent)) {
    const safariMatch = userAgent.match(/Version\/([^\s]+)/);
    const version = safariMatch ? safariMatch[1].split(".")[0] : "";
    return `Safari ${version}`;
  }

  // Opera
  if (/OPR/.test(userAgent)) {
    const operaMatch = userAgent.match(/OPR\/([^\s]+)/);
    const version = operaMatch ? operaMatch[1].split(".")[0] : "";
    return `Opera ${version}`;
  }

  // Internet Explorer
  if (/MSIE|Trident/.test(userAgent)) {
    return "Internet Explorer";
  }

  // Samsung Internet
  if (/SamsungBrowser/.test(userAgent)) {
    const samsungMatch = userAgent.match(/SamsungBrowser\/([^\s]+)/);
    const version = samsungMatch ? samsungMatch[1].split(".")[0] : "";
    return `Samsung Internet ${version}`;
  }

  // Fallback
  return "Navegador Desconhecido";
};

// 📊 Função simplificada para capturar dados de visita
export const getVisitData = async () => {
  try {
    // Obter dados de localização usando as 5 APIs
    const locationData = await getLocationData();

    // Obter informações do navegador e dispositivo
    const deviceInfo = getDeviceInfo();
    const browserInfo = getBrowserInfo();

    // Capturar URL atual
    const urlInfo = {
      fullUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      currentPage: window.location.pathname,
    };

    // Obter referência inicial persistente
    const initialRef = getOrSetInitialRef();

    return {
      ...locationData,
      ...urlInfo,
      device: deviceInfo.device,
      deviceType: deviceInfo.isMobile
        ? "Mobile"
        : deviceInfo.isTablet
        ? "Tablet"
        : "Desktop",
      browser: browserInfo,
      isMobile: deviceInfo.isMobile,
      isTablet: deviceInfo.isTablet,
      isDesktop: deviceInfo.isDesktop,
      userAgent: navigator.userAgent,
      referrer: document.referrer || "Direct",
      ref: initialRef,
      timestamp: Date.now(),
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`,
      timezoneLocal: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch (error) {
    console.error("❌ Erro ao obter dados de visita:", error);

    // Retornar dados mínimos em caso de erro
    return {
      ip: "Unknown",
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      countryCode: "Unknown",
      location: "Unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      postal: "Unknown",
      org: "Unknown",
      fullUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      currentPage: window.location.pathname,
      device: "Unknown",
      deviceType: "Unknown",
      browser: { browser: "Unknown", version: "Unknown", os: "Unknown" },
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      userAgent: navigator.userAgent,
      referrer: document.referrer || "Direct",
      ref: getOrSetInitialRef(),
      timestamp: Date.now(),
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`,
      timezoneLocal: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
};
