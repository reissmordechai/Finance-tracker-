"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async () => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Wrong password");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F2EEE3", fontFamily: "sans-serif" }}>
      <div style={{ background: "#fff", padding: 32, borderRadius: 10, width: 320, border: "1px solid #E4DEC9" }}>
        <h1 style={{ fontSize: 20, marginBottom: 16, color: "#0F3D2E" }}>Finance Tracker</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #D8D0BC", marginBottom: 10 }}
        />
        {error && <div style={{ color: "#9C4221", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button onClick={submit} style={{ width: "100%", padding: 10, borderRadius: 6, border: "none", background: "#0F3D2E", color: "#fff", fontWeight: 600 }}>
          Enter
        </button>
      </div>
    </div>
  );
}
