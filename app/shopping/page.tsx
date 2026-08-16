"use client";
import { useEffect, useState } from "react";

export default function ShoppingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const load = () => fetch("/api/shopping").then((r) => r.json()).then(setItems);
  useEffect(() => {
    load();
    fetch("/api/categories?type=expense").then((r) => r.json()).then(setCategories);
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note: note || null, category: category || null }),
    });
    setName(""); setNote(""); setCategory("");
    load();
  };

  const toggle = async (item: any) => {
    await fetch(`/api/shopping/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/shopping/${id}`, { method: "DELETE" });
    load();
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Shopping List</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        A running "need to buy" list — separate from Transactions, shared with anyone else logged into this app.
      </p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item, e.g. Milk" style={{ flex: 1, minWidth: 140 }} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" style={{ width: 160 }} />
        {categories.length > 0 && (
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 150 }}>
            <option value="">Account (optional)</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        )}
        <button className="btn" onClick={add}>Add</button>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: unchecked.length === 0 ? 0 : 16 }}>
        {unchecked.length === 0 ? (
          <div style={{ padding: 14, color: "#8A8370" }}>Nothing on the list.</div>
        ) : (
          unchecked.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid #EFEADC" }}>
              <input type="checkbox" checked={false} onChange={() => toggle(item)} style={{ width: "auto" }} />
              <div style={{ flex: 1 }}>
                <div>{item.name}{item.category && <span className="pill" style={{ marginLeft: 6 }}>{item.category}</span>}</div>
                {item.note && <div style={{ fontSize: 11, color: "#8A8370" }}>{item.note}</div>}
              </div>
              <button onClick={() => remove(item.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
            </div>
          ))
        )}
      </div>

      {checked.length > 0 && (
        <div className="card" style={{ padding: 0, opacity: 0.6 }}>
          <div style={{ fontSize: 12, color: "#8A8370", padding: "10px 14px 0" }}>Picked up</div>
          {checked.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderTop: "1px solid #EFEADC" }}>
              <input type="checkbox" checked={true} onChange={() => toggle(item)} style={{ width: "auto" }} />
              <div style={{ flex: 1, textDecoration: "line-through" }}>{item.name}</div>
              <button onClick={() => remove(item.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
