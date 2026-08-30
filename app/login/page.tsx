"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setError("");
    if (!email) { setError("Enter your email."); return; }
    if (!password) { setError("Enter your password."); return; }
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Wrong email or password");
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
          <h1 style={{ fontSize: 21 }}>Finance Tracker</h1>
          <div style={{ fontSize: 12.5, color: "#8A8370" }}>Log in to your account</div>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Email"
          autoFocus
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          style={{ width: "100%", marginBottom: 10 }}
        />
        {error && <div style={{ color: "#9C4221", fontSize: 13, marginBottom: 10, fontWeight: 500 }}>{error}</div>}
        <button className="btn" onClick={submit} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Checking…" : "Log in"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          <span style={{ color: "#8A8370" }}>New here? </span>
          <Link href="/signup" style={{ color: "#B8863E", fontWeight: 600 }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}
