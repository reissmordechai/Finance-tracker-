"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
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
          <h1 style={{ fontSize: 21 }}>Create your account</h1>
          <div style={{ fontSize: 12.5, color: "#8A8370" }}>Your own private data — nobody else sees it</div>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus style={{ width: "100%", marginBottom: 10 }} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", marginBottom: 10 }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Password (6+ characters)" style={{ width: "100%", marginBottom: 10 }} />
        {error && <div style={{ color: "#9C4221", fontSize: 13, marginBottom: 10, fontWeight: 500 }}>{error}</div>}
        <button className="btn" onClick={submit} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Creating…" : "Create account"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          <span style={{ color: "#8A8370" }}>Already have an account? </span>
          <Link href="/login" style={{ color: "#B8863E", fontWeight: 600 }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
