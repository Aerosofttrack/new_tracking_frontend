import React from 'react';
import './DonutChart.css';

/**
 * Lightweight SVG donut/ring chart — no chart library dependency.
 *
 * props:
 *  - data: [{ label, value, color }]
 *  - centerValue: big number shown in the middle (e.g. total)
 *  - centerLabel: small label under the center value (e.g. "Total")
 *  - size: outer diameter in px (default 220)
 *  - thickness: ring stroke width in px (default 28)
 */
export default function DonutChart({ data = [], centerValue, centerLabel, size = 220, thickness = 28 }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetSoFar = 0;

  return (
    <svg
      className="donut-chart"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={centerLabel ? `${centerLabel}: ${centerValue}` : 'Donut chart'}
    >
      {/* Track (in case values don't sum to total, e.g. rounding) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--app-surface-muted, #eef1f6)"
        strokeWidth={thickness}
      />

      {data.map((segment, index) => {
        const fraction = (segment.value || 0) / total;
        const segmentLength = fraction * circumference;
        const dashArray = `${segmentLength} ${circumference - segmentLength}`;
        const dashOffset = -offsetSoFar;
        offsetSoFar += segmentLength;

        return (
          <circle
            key={segment.label || index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={thickness}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap={data.length > 1 ? 'butt' : 'round'}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="donut-chart__segment"
          />
        );
      })}

      {(centerValue !== undefined || centerLabel) && (
        <g>
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="donut-chart__center-value"
          >
            {centerValue}
          </text>
          {centerLabel && (
            <text
              x="50%"
              y="62%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="donut-chart__center-label"
            >
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}