"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError("");
    if (!email) { setError("Enter your email."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong — try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #0F3D2E 0%, #16553F 100%)", padding: 20,
    }}>
      <div className="card" style={{ width: 340, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: "#F0EAD8", color: "#0F3D2E",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            fontSize: 22, fontWeight: 700, fontFamily: "'Spectral', serif",
          }}>$</div>
          <h1 style={{ fontSize: 21 }}>Reset your password</h1>
          <div style={{ fontSize: 12.5, color: "#8A8370" }}>We'll email you a link to set a new one</div>
        </div>

        {sent ? (
          <div style={{ fontSize: 13.5, color: "#2F6B4F", textAlign: "center", padding: "8px 0" }}>
            If that email has an account, a reset link is on its way. Check your inbox (and spam folder) — it's valid for 1 hour.
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Email"
              autoFocus
              style={{ width: "100%", marginBottom: 10 }}
            />
            {error && <div style={{ color: "#9C4221", fontSize: 13, marginBottom: 10, fontWeight: 500 }}>{error}</div>}
            <button className="btn" onClick={submit} disabled={loading} style={{ width: "100%" }}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          <Link href="/login" style={{ color: "#B8863E", fontWeight: 600 }}>Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
