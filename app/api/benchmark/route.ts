import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/stockPrice";

// A simple reference point — today's SPY price — shown next to your own
// portfolio return. This is NOT a precise time-weighted comparison (that
// would need historical daily prices for every contribution date), just a
// quick "here's roughly where the market is" reference.
export async function GET() {
  const price = await getCurrentPrice("SPY");
  return NextResponse.json({ symbol: "SPY", price });
}
