import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function escapeCsv(val: any): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const txns = await prisma.transaction.findMany({ orderBy: { date: "desc" } });

  const header = ["Date", "Type", "Account", "Amount", "Vendor", "Note", "Payment Method"];
  const rows = txns.map((t) => [
    t.date.toISOString().slice(0, 10),
    t.type,
    t.category,
    t.amount.toFixed(2),
    t.vendor || "",
    t.note || "",
    t.paymentMethod,
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions.csv"`,
    },
  });
}
