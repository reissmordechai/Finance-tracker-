import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import LineChart from "./components/LineChart";
import BankAccountsCard from "./components/BankAccountsCard";
import RecentTransactionsCard from "./components/RecentTransactionsCard";
import BreakdownBar from "./components/BreakdownBar";

// Force this page to render per-request instead of being pre-built at deploy
// time — without this, Vercel tries to query the database *during the build
// itself*, which is unreliable and was causing our earlier failures.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { blocked: true } });
  if (!me || me.blocked) redirect("/login");

  const holdings = await prisma.holding.findMany({ where: { userId } });
  const totalHoldings = holdings.reduce((s, h) => s + h.currentValue, 0);

  const bankAccounts = await prisma.bankAccount.findMany({ where: { userId } });
  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0);

  const cards = await prisma.card.findMany({ where: { userId }, include: { payments: true } });
  const loans = await prisma.loan.findMany({ where: { userId } });
  const loanDebt = loans.reduce((s, l) => s + l.balance, 0);
  const transactions = await prisma.transaction.findMany({ where: { userId, deletedAt: null } });
  const cardDebt = cards.reduce((sum, c) => {
    const charged = transactions.filter((t) => t.type === "expense" && t.cardId === c.id).reduce((s, t) => s + t.amount, 0);
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    return sum + (charged - paid);
  }, 0);
  const totalDebt = cardDebt + loanDebt;

  const netWorth = totalBank + totalHoldings - totalDebt;

  const netWorthHistory = await prisma.netWorthSnapshot.findMany({ where: { userId }, orderBy: { date: "asc" } });
  const chartPoints = netWorthHistory.map((s) => ({ date: s.date.toISOString(), value: s.value }));

  const recentTxns = await prisma.transaction.findMany({ where: { userId, deletedAt: null }, orderBy: { date: "desc" }, take: 5 });
  const cardsDue = cards.filter((c) => c.amountDue > 0);

  // Budget alerts — this month's spending vs each budget's limit
  const budgets = await prisma.budget.findMany({ where: { userId } });
  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  const monthExpenses = transactions.filter((t) => t.type === "expense" && t.date.toISOString().slice(0, 7) === ym);
  const budgetAlerts = budgets.map((b) => {
    const spent = monthExpenses.filter((t) => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    const pct = (spent / b.limit) * 100;
    return { category: b.category, spent, limit: b.limit, pct };
  }).filter((b) => b.pct >= 80);

  const charityEntries = await prisma.charityEntry.findMany({ where: { userId } });
  const charityOwed = charityEntries.filter((e) => e.type === "owed").reduce((s, e) => s + e.amount, 0);
  const charityGiven = charityEntries.filter((e) => e.type === "given").reduce((s, e) => s + e.amount, 0);
  const charityBalance = charityOwed - charityGiven;

  // Spending anomalies — this month vs the trailing 6-month average per account
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const trailingExpenses = transactions.filter((t) => t.type === "expense" && t.date >= sixMonthsAgo && t.date.toISOString().slice(0, 7) !== ym);
  const trailingByCat: Record<string, number> = {};
  trailingExpenses.forEach((t) => { trailingByCat[t.category] = (trailingByCat[t.category] || 0) + t.amount; });
  const monthByCat: Record<string, number> = {};
  monthExpenses.forEach((t) => { monthByCat[t.category] = (monthByCat[t.category] || 0) + t.amount; });
  const anomalies = Object.entries(monthByCat).map(([cat, spent]) => {
    const avg = (trailingByCat[cat] || 0) / 6;
    const pctChange = avg > 0 ? ((spent - avg) / avg) * 100 : 0;
    return { category: cat, spent, avg, pctChange };
  }).filter((a) => a.avg >= 20 && a.pctChange >= 30);

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

      {anomalies.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "#F7E9E4", borderColor: "#E2B3A3" }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Spending is up</div>
          {anomalies.map((a) => (
            <div key={a.category} style={{ fontSize: 13 }}>
              <strong>{a.category}</strong>: ${a.spent.toFixed(2)} this month vs. your ${a.avg.toFixed(2)} average — up {a.pctChange.toFixed(0)}%
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
          {loanDebt > 0 && <div><div style={{ fontSize: 11, color: "#8A8370" }}>Loans</div><div className="num" style={{ color: "#9C4221" }}>${loanDebt.toFixed(2)}</div></div>}
        </div>
        <BreakdownBar bank={totalBank} holdings={totalHoldings} debt={totalDebt} />
        <div style={{ marginTop: 14 }}>
          <LineChart points={chartPoints} />
        </div>
      </div>

      {charityBalance > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#8A8370", textTransform: "uppercase" }}>Charity still owed</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#9C4221" }}>${charityBalance.toFixed(2)}</div>
        </div>
      )}

      <BankAccountsCard />

      <RecentTransactionsCard transactions={recentTxns} />
    </main>
  );
}
