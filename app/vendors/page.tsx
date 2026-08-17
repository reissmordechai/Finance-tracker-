"use client";
import { useEffect, useState } from "react";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  const startEdit = (v: any) => { setEditingId(v.id); setEditName(v.name); };
  const saveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    await fetch(`/api/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setEditingId(null);
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Vendors</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Trader Joe's" style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add}>Add vendor</button>
      </div>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {vendors.map((v) => (
          editingId === v.id ? (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: 140 }} onKeyDown={(e) => e.key === "Enter" && saveEdit(v.id)} />
              <button className="btn" onClick={() => saveEdit(v.id)} style={{ padding: "6px 10px", fontSize: 12 }}>Save</button>
              <button className="btn-outline" onClick={() => setEditingId(null)} style={{ padding: "6px 10px", fontSize: 12 }}>Cancel</button>
            </div>
          ) : (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#FBF9F2", border: "1px solid #D8D0BC", borderRadius: 16, padding: "6px 10px 6px 14px", fontSize: 13 }}>
              <button onClick={() => startEdit(v)} style={{ border: "none", background: "none", padding: 0, fontSize: 13, cursor: "pointer" }}>{v.name}</button>
              <ConfirmDeleteButton onConfirm={() => remove(v.id)} />
            </div>
          )
        ))}
        {vendors.length === 0 && <div style={{ color: "#8A8370" }}>No vendors yet.</div>}
      </div>
    </main>
  );
}
