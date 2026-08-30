"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Transactions" },
];

const groups = [
  {
    label: "Money",
    links: [
      { href: "/cards", label: "Cards" },
      { href: "/loans", label: "Loans" },
      { href: "/other-accounts", label: "Accounts" },
      { href: "/holdings", label: "Holdings" },
      { href: "/market", label: "Market" },
    ],
  },
  {
    label: "Planning",
    links: [
      { href: "/forecast", label: "Forecast" },
      { href: "/whatif", label: "What If" },
      { href: "/budgets", label: "Budgets" },
      { href: "/goals", label: "Goals" },
      { href: "/recurring", label: "Recurring" },
      { href: "/charity", label: "Charity" },
    ],
  },
  {
    label: "Tools",
    links: [
      { href: "/vendors", label: "Vendors" },
      { href: "/shopping", label: "Shopping" },
      { href: "/reports", label: "Reports" },
      { href: "/calculator", label: "Calculator" },
      { href: "/search", label: "Search" },
    ],
  },
];

const tailLinks = [
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => { setOpenGroup(null); }, [pathname]);

  if (pathname === "/login" || pathname === "/signup" || pathname === "/summary") return null;

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || (href === "/holdings" && pathname?.startsWith("/holdings"));

  const groupIsActive = (g: typeof groups[number]) => g.links.some((l) => isActive(l.href));

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
        <nav className="app-nav" ref={navRef}>
          {primaryLinks.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
              {l.label}
            </Link>
          ))}

          {groups.map((g) => (
            <div key={g.label} className="app-nav-group">
              <button
                type="button"
                className={"app-nav-group-btn" + (groupIsActive(g) ? " active" : "")}
                onClick={(e) => { e.stopPropagation(); setOpenGroup(openGroup === g.label ? null : g.label); }}
              >
                {g.label}
                <span className="app-nav-caret">{openGroup === g.label ? "▴" : "▾"}</span>
              </button>
              {openGroup === g.label && (
                <div className="app-nav-dropdown">
                  {g.links.map((l) => (
                    <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <span className="app-nav-spacer" />

          {tailLinks.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
