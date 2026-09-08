"use client";
import { useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(""); setSuccess(false);
    if (!currentPassword) { setError("Enter your current password."); return; }
    if (newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("New passwords don't match."); return; }
    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't change your password — try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 280 }}>
      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Confirm new password" />
      <button className="btn-outline" onClick={submit} disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Saving…" : "Change password"}
      </button>
      {error && <div style={{ fontSize: 12, color: "#9C4221" }}>{error}</div>}
      {success && <div style={{ fontSize: 12, color: "#2F6B4F" }}>Password updated.</div>}
    </div>
  );
}
