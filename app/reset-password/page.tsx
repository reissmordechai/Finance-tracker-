"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError("");
    if (!token) { setError("This reset link is missing its token."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
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
          <h1 style={{ fontSize: 21 }}>Set a new password</h1>
        </div>

        {done ? (
          <div style={{ fontSize: 13.5, color: "#2F6B4F", textAlign: "center", padding: "8px 0" }}>
            Password updated — taking you to the login page…
          </div>
        ) : (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoFocus
              style={{ width: "100%", marginBottom: 10 }}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Confirm new password"
              style={{ width: "100%", marginBottom: 10 }}
            />
            {error && <div style={{ color: "#9C4221", fontSize: 13, marginBottom: 10, fontWeight: 500 }}>{error}</div>}
            <button className="btn" onClick={submit} disabled={loading} style={{ width: "100%" }}>
              {loading ? "Saving…" : "Set new password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
