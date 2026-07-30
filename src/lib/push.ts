// Registro do service worker + inscrição de push (VAPID).
// Chamado no ResumoConsumo após login confirmado.

import { supabase } from "@/integrations/supabase/client";
import { savePushSubscription } from "@/lib/api/lines.functions";

// VAPID_PUBLIC_KEY vem do .env (gerado uma vez — ver README).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export async function registerServiceWorkerAndPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    if (!("PushManager" in window) || !VAPID_PUBLIC_KEY) return;

    // permissão
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // grava no Supabase (idempotente via upsert)
    const keys = sub.toJSON().keys;
    if (!keys?.p256dh || !keys.auth) return;
    await savePushSubscription({
      data: {
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        authKey: keys.auth,
        userAgent: navigator.userAgent,
      },
    });
  } catch (err) {
    // push é opcional — não bloqueia o app
    console.warn("[push] inscrição falhou:", err);
  }
}
