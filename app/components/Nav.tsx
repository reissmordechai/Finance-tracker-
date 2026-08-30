"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideNav = navRef.current && navRef.current.contains(target);
      const insideDropdown = (target as HTMLElement).closest?.(".app-nav-dropdown");
      if (!insideNav && !insideDropdown) setOpenGroup(null);
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

  const toggleGroup = (label: string) => {
    if (openGroup === label) { setOpenGroup(null); return; }
    const btn = btnRefs.current[label];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpenGroup(label);
  };

  const activeGroup = groups.find((g) => g.label === openGroup);

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
                ref={(el) => { btnRefs.current[g.label] = el; }}
                type="button"
                className={"app-nav-group-btn" + (groupIsActive(g) ? " active" : "")}
                onClick={(e) => { e.stopPropagation(); toggleGroup(g.label); }}
              >
                {g.label}
                <span className="app-nav-caret">{openGroup === g.label ? "▴" : "▾"}</span>
              </button>
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

      {mounted && activeGroup && dropdownPos && createPortal(
        <div
          className="app-nav-dropdown app-nav-dropdown-portal"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeGroup.links.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""} onClick={() => setOpenGroup(null)}>
              {l.label}
            </Link>
          ))}
        </div>,
        document.body
      )}
    </header>
  );
}
