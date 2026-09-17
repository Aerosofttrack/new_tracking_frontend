import React from 'react';
import './TrendLineChart.css';

/**
 * Lightweight SVG multi-line trend chart — no chart library dependency.
 *
 * props:
 *  - labels: ['Dec \'25', 'Jan \'26', ...]  (x-axis)
 *  - series: [{ name, color, data: [number, ...] }]  (one array per line, same length as labels)
 *  - height: chart height in px (default 220)
 *  - yTicks: number of horizontal gridlines (default 4)
 */
export default function TrendLineChart({ labels = [], series = [], height = 220, yTicks = 4 }) {
  const width = 720;
  const paddingLeft = 44;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const allValues = series.flatMap((s) => s.data);
  const maxValue = Math.max(1, ...allValues);
  const niceMax = Math.ceil(maxValue / 500) * 500 || maxValue;

  const xStep = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;

  const yFor = (value) => paddingTop + plotHeight - (value / niceMax) * plotHeight;
  const xFor = (index) => paddingLeft + index * xStep;

  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = (niceMax / yTicks) * i;
    return { value, y: yFor(value) };
  });

  return (
    <div className="trend-chart">
      <svg
        className="trend-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Trend chart"
      >
        {/* gridlines + y labels */}
        {gridLines.map((line) => (
          <g key={line.value}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={line.y}
              y2={line.y}
              className="trend-chart__gridline"
            />
            <text x={paddingLeft - 10} y={line.y} textAnchor="end" dominantBaseline="middle" className="trend-chart__y-label">
              {line.value >= 1000 ? `${line.value / 1000}K` : line.value}
            </text>
          </g>
        ))}

        {/* x labels */}
        {labels.map((label, i) => (
          <text
            key={label}
            x={xFor(i)}
            y={height - 8}
            textAnchor="middle"
            className="trend-chart__x-label"
          >
            {label}
          </text>
        ))}

        {/* lines */}
        {series.map((s) => {
          const points = s.data.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
          return (
            <g key={s.name}>
              <polyline points={points} fill="none" stroke={s.color} strokeWidth="2.5" className="trend-chart__line" />
              {s.data.map((v, i) => (
                <circle key={i} cx={xFor(i)} cy={yFor(v)} r="4" fill={s.color} className="trend-chart__dot" />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="trend-chart__legend">
        {series.map((s) => (
          <span key={s.name} className="trend-chart__legend-item">
            <span className="trend-chart__legend-dot" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}