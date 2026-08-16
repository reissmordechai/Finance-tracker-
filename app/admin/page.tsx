"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [users, setUsers] = useState<any[] | null>(null);
  const [notAllowed, setNotAllowed] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/users");
    if (res.status === 403) { setNotAllowed(true); return; }
    setUsers(await res.json());
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    load();
  };

  if (notAllowed) {
    return (
      <main className="page">
        <h1 style={{ color: "#0F3D2E" }}>Admin</h1>
        <div className="card" style={{ color: "#8A8370" }}>This page is only available to the admin account.</div>
      </main>
    );
  }

  if (!users) return <main className="page"><h1 style={{ color: "#0F3D2E" }}>Admin</h1><div className="card">Loading…</div></main>;

  const pending = users.filter((u) => !u.approved && !u.blocked);
  const active = users.filter((u) => u.approved && !u.blocked);
  const blocked = users.filter((u) => u.blocked);

  const renderUser = (u: any) => (
    <div key={u.id} className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{u.name} {u.role === "admin" && <span className="pill" style={{ marginLeft: 6 }}>admin</span>}</div>
          <div style={{ fontSize: 12, color: "#8A8370" }}>{u.email} · joined {u.createdAt.slice(0, 10)}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {!u.approved && !u.blocked && (
            <button className="btn" onClick={() => update(u.id, { approved: true })}>Approve</button>
          )}
          {u.approved && !u.blocked && u.role !== "admin" && (
            <button className="btn-outline" onClick={() => update(u.id, { blocked: true })}>Block</button>
          )}
          {u.blocked && (
            <button className="btn-outline" onClick={() => update(u.id, { blocked: false, approved: true })}>Unblock</button>
          )}
          {u.role !== "admin" && (
            confirmDeleteId === u.id ? (
              <>
                <span style={{ fontSize: 12, color: "#9C4221", alignSelf: "center" }}>Delete permanently?</span>
                <button className="btn" style={{ background: "#9C4221" }} onClick={() => remove(u.id)}>Yes, delete</button>
                <button className="btn-outline" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setConfirmDeleteId(u.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
            )
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Admin</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>Approve new signups, block accounts, or remove someone entirely.</p>

      {pending.length > 0 && (
        <>
          <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>Waiting for approval ({pending.length})</div>
          {pending.map(renderUser)}
        </>
      )}

      <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>Active accounts ({active.length})</div>
      {active.length === 0 ? <div className="card" style={{ color: "#8A8370" }}>None yet.</div> : active.map(renderUser)}

      {blocked.length > 0 && (
        <>
          <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>Blocked ({blocked.length})</div>
          {blocked.map(renderUser)}
        </>
      )}
    </main>
  );
}
