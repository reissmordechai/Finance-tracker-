"use client";
import { useState } from "react";

export default function ConfirmSaveButton({ onConfirm, label = "Save" }: { onConfirm: () => void; label?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 11.5, color: "#5B7B7A" }}>Save?</span>
        <button
          onClick={() => { onConfirm(); setConfirming(false); }}
          className="btn"
          style={{ padding: "5px 10px", fontSize: 12 }}
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="btn-outline"
          style={{ padding: "5px 10px", fontSize: 12 }}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn" style={{ padding: "5px 10px", fontSize: 12 }}>
      {label}
    </button>
  );
}
