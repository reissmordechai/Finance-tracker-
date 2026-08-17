"use client";
import { useState } from "react";

export default function ConfirmDeleteButton({ onConfirm, label = "✕" }: { onConfirm: () => void; label?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 11.5, color: "#9C4221" }}>Delete?</span>
        <button
          onClick={() => { onConfirm(); setConfirming(false); }}
          style={{ border: "none", background: "#9C4221", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ border: "1px solid #D8D0BC", background: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} style={{ border: "none", background: "none", color: "#B0A88E", cursor: "pointer" }}>
      {label}
    </button>
  );
}
