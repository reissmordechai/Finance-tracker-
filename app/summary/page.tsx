import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const holdings = await prisma.holding.findMany({ where: { userId } });
  const totalHoldings = holdings.reduce((s, h) => s + h.currentValue, 0);

  const bankAccounts = await prisma.bankAccount.findMany({ where: { userId } });
  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0);

  const cards = await prisma.card.findMany({ where: { userId }, include: { payments: true } });
  const transactions = await prisma.transaction.findMany({ where: { userId } });
  const cardDebt = cards.reduce((sum, c) => {
    const charged = transactions.filter((t) => t.type === "expense" && t.cardId === c.id).reduce((s, t) => s + t.amount, 0);
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    return sum + (charged - paid);
  }, 0);
  const loans = await prisma.loan.findMany({ where: { userId } });
  const loanDebt = loans.reduce((s, l) => s + l.balance, 0);

  const netWorth = totalBank + totalHoldings - cardDebt - loanDebt;

  const charityEntries = await prisma.charityEntry.findMany({ where: { userId } });
  const charityOwed = charityEntries.filter((e) => e.type === "owed").reduce((s, e) => s + e.amount, 0);
  const charityGiven = charityEntries.filter((e) => e.type === "given").reduce((s, e) => s + e.amount, 0);
  const charityBalance = charityOwed - charityGiven;

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #0F3D2E 0%, #16553F 100%)", padding: 24, textAlign: "center",
    }}>
      <div style={{ fontSize: 13, color: "rgba(242,238,227,0.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Net Worth</div>
      <div className="num" style={{ fontSize: 48, fontWeight: 700, color: netWorth >= 0 ? "#F2EEE3" : "#E8A488" }}>${netWorth.toFixed(2)}</div>

      {charityBalance > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12, color: "rgba(242,238,227,0.6)", textTransform: "uppercase", letterSpacing: 1 }}>Charity owed</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#D9B876" }}>${charityBalance.toFixed(2)}</div>
        </div>
      )}

      <a href="/" style={{ marginTop: 40, color: "#D9B876", fontSize: 13, textDecoration: "none", border: "1px solid rgba(217,184,118,0.4)", borderRadius: 20, padding: "8px 18px" }}>
        Open full app →
      </a>
    </main>
  );
}
