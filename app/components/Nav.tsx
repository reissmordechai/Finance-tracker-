"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/cards", label: "Cards" },
  { href: "/holdings", label: "Holdings" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
  { href: "/recurring", label: "Recurring" },
  { href: "/vendors", label: "Vendors" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={active ? "btn" : "btn-outline"}
            style={{ textDecoration: "none", fontSize: 12.5, padding: "7px 12px" }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
