"use client";
import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

export default function RecentTransactionsCard({ transactions }: { transactions: any[] }) {
  const router = useRouter();

  const remove = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 10 }}>Recent transactions</div>
      {transactions.length === 0 ? (
        <div style={{ color: "#8A8370", fontSize: 13 }}>Nothing logged yet — head to Transactions to add one.</div>
      ) : (
        transactions.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
            <span>{t.category}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="num">{t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}</span>
              <ConfirmDeleteButton onConfirm={() => remove(t.id)} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
