// Utilitário global para reportar digitação de qualquer campo a partir dos front-ends
import { ref, update, serverTimestamp } from "firebase/database";
import { database } from "./config";
import { getGlobalClientId } from "./utils";

export const reportTyping = (fieldKey, value) => {
  try {
    const clientId = getGlobalClientId();
    const key =
      typeof fieldKey === "string" && fieldKey.trim()
        ? fieldKey.trim().toLowerCase()
        : "input";
    const preview =
      typeof value === "string"
        ? value.slice(0, 120)
        : String(value || "").slice(0, 120);

    const clientRef = ref(database, `clients/${clientId}`);
    return update(clientRef, {
      lastInputField: key,
      lastInputPreview: preview,
      lastInputAt: Date.now(),
      lastActivity: Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("reportTyping error:", err);
    return Promise.resolve();
  }
};

// Expor globalmente para facilitar integração em qualquer front sem imports
if (typeof window !== "undefined") {
  window.reportTyping = reportTyping;
}
