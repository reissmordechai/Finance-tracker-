"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("");

  const load = () => fetch("/api/settings/taxprofiles").then((r) => r.json()).then(setProfiles);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!label.trim() || !rate) return;
    await fetch("/api/settings/taxprofiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, rate: parseFloat(rate) }),
    });
    setLabel(""); setRate("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/settings/taxprofiles/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Nav />
      <h1 style={{ color: "#0F3D2E" }}>Settings</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Sales tax profiles</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. NY" style={{ flex: 1, minWidth: 140 }} />
          <input type="number" step="0.001" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate %" style={{ width: 110 }} />
          <button className="btn" onClick={add}>Add</button>
        </div>
        {profiles.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
            <span>{p.label}</span>
            <span>
              <span className="num">{p.rate}%</span>
              <button onClick={() => remove(p.id)} style={{ border: "none", background: "none", color: "#B0A88E", marginLeft: 10 }}>✕</button>
            </span>
          </div>
        ))}
        {profiles.length === 0 && <div style={{ color: "#8A8370" }}>No tax profiles yet.</div>}
      </div>
    </main>
  );
}
