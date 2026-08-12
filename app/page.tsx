import Link from "next/link";
import { prisma } from "@/lib/db";

// Force this page to render per-request instead of being pre-built at deploy
// time — without this, Vercel tries to query the database *during the build
// itself*, which is unreliable and was causing our earlier failures.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const holdings = await prisma.holding.findMany();
  const totalHoldings = holdings.reduce((s, h) => s + h.currentValue, 0);
  const recentTxns = await prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 5 });

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ color: "#0F3D2E" }}>Finance Tracker</h1>
      <nav style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Link className="btn-outline" href="/transactions">Transactions</Link>
        <Link className="btn-outline" href="/holdings">Holdings</Link>
      </nav>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#8A8370", textTransform: "uppercase" }}>Holdings value</div>
        <div className="num" style={{ fontSize: 28, fontWeight: 700, color: "#0F3D2E" }}>${totalHoldings.toFixed(2)}</div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Recent transactions</div>
        {recentTxns.length === 0 ? (
          <div style={{ color: "#8A8370", fontSize: 13 }}>Nothing logged yet — head to Transactions to add one.</div>
        ) : (
          recentTxns.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
              <span>{t.category}</span>
              <span className="num">{t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
