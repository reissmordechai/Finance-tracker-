"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button onClick={toggle} style={{
      border: "1px solid rgba(242,238,227,0.3)", background: "transparent", color: "#F2EEE3",
      borderRadius: 20, padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0,
    }}>
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
