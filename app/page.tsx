import { prisma } from "@/lib/db";
import LineChart from "./components/LineChart";

// Force this page to render per-request instead of being pre-built at deploy
// time — without this, Vercel tries to query the database *during the build
// itself*, which is unreliable and was causing our earlier failures.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const holdings = await prisma.holding.findMany();
  const totalHoldings = holdings.reduce((s, h) => s + h.currentValue, 0);

  const bankAccounts = await prisma.bankAccount.findMany();
  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0);

  const cards = await prisma.card.findMany({ include: { payments: true } });
  const transactions = await prisma.transaction.findMany();
  const cardDebt = cards.reduce((sum, c) => {
    const charged = transactions.filter((t) => t.type === "expense" && t.cardId === c.id).reduce((s, t) => s + t.amount, 0);
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    return sum + (charged - paid);
  }, 0);

  const netWorth = totalBank + totalHoldings - cardDebt;

  const netWorthHistory = await prisma.netWorthSnapshot.findMany({ orderBy: { date: "asc" } });
  const chartPoints = netWorthHistory.map((s) => ({ date: s.date.toISOString(), value: s.value }));

  const recentTxns = await prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 5 });
  const cardsDue = cards.filter((c) => c.amountDue > 0);

  // Budget alerts — this month's spending vs each budget's limit
  const budgets = await prisma.budget.findMany();
  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  const monthExpenses = transactions.filter((t) => t.type === "expense" && t.date.toISOString().slice(0, 7) === ym);
  const budgetAlerts = budgets.map((b) => {
    const spent = monthExpenses.filter((t) => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    const pct = (spent / b.limit) * 100;
    return { category: b.category, spent, limit: b.limit, pct };
  }).filter((b) => b.pct >= 80);

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Finance Tracker</h1>

      {cardsDue.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "#FBF3E1", borderColor: "#E8D2A0" }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Cards with a balance due</div>
          {cardsDue.map((c) => (
            <div key={c.id} style={{ fontSize: 13 }}>{c.name}: <strong className="num">${c.amountDue.toFixed(2)}</strong>{c.dueDay ? ` (due day ${c.dueDay})` : ""}</div>
          ))}
        </div>
      )}

      {budgetAlerts.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "#F7E9E4", borderColor: "#E2B3A3" }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Budget alerts</div>
          {budgetAlerts.map((b) => (
            <div key={b.category} style={{ fontSize: 13 }}>
              <strong>{b.category}</strong>: ${b.spent.toFixed(2)} of ${b.limit.toFixed(2)} ({b.pct.toFixed(0)}%){b.pct >= 100 ? " — over budget!" : " — almost there"}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#8A8370", textTransform: "uppercase" }}>Net worth</div>
        <div className="num" style={{ fontSize: 30, fontWeight: 700, color: netWorth >= 0 ? "#0F3D2E" : "#9C4221" }}>${netWorth.toFixed(2)}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11, color: "#8A8370" }}>Bank</div><div className="num" style={{ color: "#2F6B4F" }}>${totalBank.toFixed(2)}</div></div>
          <div><div style={{ fontSize: 11, color: "#8A8370" }}>Holdings</div><div className="num" style={{ color: "#2F6B4F" }}>${totalHoldings.toFixed(2)}</div></div>
          <div><div style={{ fontSize: 11, color: "#8A8370" }}>Card debt</div><div className="num" style={{ color: "#9C4221" }}>${cardDebt.toFixed(2)}</div></div>
        </div>
        <LineChart points={chartPoints} />
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
