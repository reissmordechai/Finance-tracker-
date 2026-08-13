"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Transactions" },
  { href: "/cards", label: "Cards" },
  { href: "/holdings", label: "Holdings" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
  { href: "/recurring", label: "Recurring" },
  { href: "/vendors", label: "Vendors" },
  { href: "/reports", label: "Reports" },
  { href: "/calculator", label: "Calculator" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="app-title">Finance Tracker</div>
          <ThemeToggle />
        </div>
        <nav className="app-nav">
          {links.map((l) => {
            const active = pathname === l.href || (l.href === "/holdings" && pathname?.startsWith("/holdings"));
            return (
              <Link key={l.href} href={l.href} className={active ? "active" : ""}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
