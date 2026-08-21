"use client";
import { useEffect, useRef, useState } from "react";

export interface AutocompleteOption {
  value: string;
  label: string;
  group?: string;
}

export default function Autocomplete({
  value,
  onChange,
  options,
  placeholder,
  onCreateNew,
  createLabel,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  onCreateNew?: (name: string) => void;
  createLabel?: string;
  style?: React.CSSProperties;
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the visible text in sync if the selected value changes from outside
  // (e.g. resetting the form after adding a transaction).
  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const exactMatch = options.some((o) => o.label.toLowerCase() === q);

  const groups = Array.from(new Set(filtered.map((o) => o.group || "")));

  const select = (opt: AutocompleteOption) => {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  const createNew = () => {
    if (!query.trim() || !onCreateNew) return;
    onCreateNew(query.trim());
    setOpen(false);
  };

  return (
    <div ref={boxRef} style={{ position: "relative", ...style }}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ width: "100%" }}
      />
      {open && (filtered.length > 0 || (onCreateNew && query.trim() && !exactMatch)) && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, marginTop: 2,
          background: "#fff", border: "1px solid #D8D0BC", borderRadius: 8, maxHeight: 220, overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
          {groups.map((g) => (
            <div key={g || "_"}>
              {g && <div style={{ fontSize: 10.5, color: "#B0A88E", padding: "6px 10px 2px", textTransform: "uppercase" }}>{g}</div>}
              {filtered.filter((o) => (o.group || "") === g).map((o) => (
                <div
                  key={o.value + o.label}
                  onMouseDown={() => select(o)}
                  style={{ padding: "8px 12px", fontSize: 13.5, cursor: "pointer" }}
                  onTouchStart={() => select(o)}
                >
                  {o.label}
                </div>
              ))}
            </div>
          ))}
          {onCreateNew && query.trim() && !exactMatch && (
            <div
              onMouseDown={createNew}
              onTouchStart={createNew}
              style={{ padding: "8px 12px", fontSize: 13.5, cursor: "pointer", color: "#B8863E", borderTop: filtered.length > 0 ? "1px solid #EFEADC" : undefined }}
            >
              {createLabel || `+ Add "${query.trim()}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
