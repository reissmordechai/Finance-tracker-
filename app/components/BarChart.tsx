"use client";

export default function BarChart({ bars }: { bars: { label: string; value: number }[] }) {
  if (bars.length === 0) return null;
  const width = 640;
  const height = 160;
  const padding = 24;
  const max = Math.max(...bars.map((b) => b.value), 1);
  const barWidth = (width - padding * 2) / bars.length - 8;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      {bars.map((b, i) => {
        const barHeight = (b.value / max) * (height - padding * 2);
        const x = padding + i * ((width - padding * 2) / bars.length) + 4;
        const y = height - padding - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill="#B8863E" rx={3} />
            <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="#8A8370">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
