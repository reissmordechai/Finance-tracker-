"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.register("/sw.js").then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    ).catch(() => {});
  }, []);

  const enable = async () => {
    setError(""); setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setError("Notifications were blocked — check your browser's site settings to allow them."); setBusy(false); return; }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { setError("Push notifications aren't configured yet."); setBusy(false); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
    } catch {
      setError("Couldn't turn on notifications — try again.");
    }
    setBusy(false);
  };

  const disable = async () => {
    setError(""); setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError("Couldn't turn off notifications — try again.");
    }
    setBusy(false);
  };

  if (!supported) {
    return <div style={{ fontSize: 12, color: "#8A8370" }}>Push notifications aren't supported on this browser.</div>;
  }

  return (
    <div>
      <button className={subscribed ? "btn" : "btn-outline"} onClick={subscribed ? disable : enable} disabled={busy}>
        {busy ? "…" : subscribed ? "Reminders on ✓" : "Enable payment reminders"}
      </button>
      <div style={{ fontSize: 11.5, color: "#8A8370", marginTop: 6 }}>
        Get a notification the evening before a recurring bill, card payment, or loan payment is due.
      </div>
      {error && <div style={{ fontSize: 11.5, color: "#9C4221", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
