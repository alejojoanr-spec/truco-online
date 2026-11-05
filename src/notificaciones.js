import { supabase } from "./supabase";

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function soportaPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function estadoNotificaciones() {
  try {
    if (!soportaPush() || Notification.permission !== "granted") return false;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    return !!sub;
  } catch (e) {
    return false;
  }
}

export async function activarNotificaciones(usuarioId) {
  try {
    if (!soportaPush()) {
      return { ok: false, error: "Este navegador no soporta notificaciones push." };
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      return { ok: false, error: "Permiso de notificaciones denegado." };
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY),
    });
    const { endpoint, keys } = subscription.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert({
      usuario_id: usuarioId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }, { onConflict: "usuario_id,endpoint" });
    if (error) return { ok: false, error: "No se pudo guardar la suscripción." };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "No se pudieron activar las notificaciones." };
  }
}

export async function desactivarNotificaciones(usuarioId) {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return { ok: true };
    const endpoint = sub.endpoint;
    try { await sub.unsubscribe(); } catch (e) { /* se borra la fila igual */ }
    const { error } = await supabase.from("push_subscriptions").delete().eq("usuario_id", usuarioId).eq("endpoint", endpoint);
    if (error) return { ok: false, error: "No se pudieron desactivar las notificaciones." };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "No se pudieron desactivar las notificaciones." };
  }
}

export function esAppInstalada() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function esCelular() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
}
