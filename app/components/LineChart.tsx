"use client";

export default function LineChart({ points }: { points: { date: string; value: number }[] }) {
  if (points.length < 2) {
    return <div style={{ fontSize: 12, color: "#8A8370" }}>Not enough history yet — check back after a few days of automatic updates.</div>;
  }

  const width = 640;
  const height = 160;
  const padding = 20;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const up = points[points.length - 1].value >= points[0].value;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      <polyline points={coords.join(" ")} fill="none" stroke={up ? "#2F6B4F" : "#9C4221"} strokeWidth={2.5} />
      {coords.map((c, i) => {
        const [x, y] = c.split(",");
        return <circle key={i} cx={x} cy={y} r={2} fill={up ? "#2F6B4F" : "#9C4221"} />;
      })}
    </svg>
  );
}
