"use client";
import { useEffect, useState } from "react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [name, setName] = useState("");

  const load = () => fetch("/api/vendors").then((r) => r.json()).then(setVendors);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Vendors</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Trader Joe's" style={{ flex: 1 }} />
        <button className="btn" onClick={add}>Add vendor</button>
      </div>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {vendors.map((v) => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FBF9F2", border: "1px solid #D8D0BC", borderRadius: 16, padding: "6px 10px 6px 14px", fontSize: 13 }}>
            {v.name}
            <button onClick={() => remove(v.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
          </div>
        ))}
        {vendors.length === 0 && <div style={{ color: "#8A8370" }}>No vendors yet.</div>}
      </div>
    </main>
  );
}
