"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/forecast", label: "Forecast" },
  { href: "/whatif", label: "What If" },
  { href: "/transactions", label: "Transactions" },
  { href: "/cards", label: "Cards" },
  { href: "/loans", label: "Loans" },
  { href: "/other-accounts", label: "Other" },
  { href: "/holdings", label: "Holdings" },
  { href: "/market", label: "Market" },
  { href: "/charity", label: "Charity" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
  { href: "/recurring", label: "Recurring" },
  { href: "/vendors", label: "Vendors" },
  { href: "/shopping", label: "Shopping" },
  { href: "/reports", label: "Reports" },
  { href: "/calculator", label: "Calculator" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/login" || pathname === "/signup" || pathname === "/summary") return null;

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="app-title">Finance Tracker</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ThemeToggle />
            <button onClick={logout} style={{
              border: "1px solid rgba(242,238,227,0.3)", background: "transparent", color: "#F2EEE3",
              borderRadius: 20, padding: "5px 10px", fontSize: 12, cursor: "pointer",
            }}>Log out</button>
          </div>
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
