"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!password) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Wrong password");
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
          <div style={{ fontSize: 12.5, color: "#8A8370" }}>Enter your password to continue</div>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          autoFocus
          style={{ width: "100%", marginBottom: 10 }}
        />
        {error && <div style={{ color: "#9C4221", fontSize: 13, marginBottom: 10, fontWeight: 500 }}>{error}</div>}
        <button className="btn" onClick={submit} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}
