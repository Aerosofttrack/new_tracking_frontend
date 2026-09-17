import { useMemo, useState } from 'react';
import {
  TbTruck, TbNavigation, TbPlayerPause, TbParkingCircle,
  TbTool, TbDatabaseOff, TbBan, TbChartBar, TbListDetails,
} from 'react-icons/tb';
import DonutChart from '../charts/DonutChart.jsx';
import './OperationalOverview.css';

// Single source of truth for "which bucket does this vehicle fall into" —
// used by both the stat cards and the list filter pills so they never drift.
export function classifyVehicleStatus(device) {
  if (device?._raw?.isActive === false) return 'DISABLED';
  // TODO: wire to a real maintenance/service flag once the backend exposes one.
  if (device?._raw?.underService) return 'SERVICE';
  if (!device?.location) return 'NO_DATA';
  if (device.status === 'MOVING') return 'MOVING';
  if (device.status === 'IDLE') return 'IDLE';
  if (device.status === 'PARKED') return 'PARKED';
  return 'NO_DATA';
}

const CARD_CONFIG = [
  { key: 'ALL', label: 'Total Vehicles', sublabel: 'active', icon: <TbTruck />, color: 'blue' },
  { key: 'MOVING', label: 'Moving', sublabel: 'currently active', icon: <TbNavigation />, color: 'green' },
  { key: 'IDLE', label: 'Idle', sublabel: 'engine on, stopped', icon: <TbPlayerPause />, color: 'orange' },
  { key: 'PARKED', label: 'Parked', sublabel: 'engine off', icon: <TbParkingCircle />, color: 'cyan' },
  { key: 'SERVICE', label: 'Service', sublabel: 'under maintenance', icon: <TbTool />, color: 'purple' },
  { key: 'NO_DATA', label: 'No Data', sublabel: 'no tracking data', icon: <TbDatabaseOff />, color: 'red' },
  { key: 'DISABLED', label: 'Disabled', sublabel: 'manually disabled', icon: <TbBan />, color: 'gray' },
];

const COLOR_HEX = {
  blue: '#3457d5', green: '#1f9d55', orange: '#f2b84b',
  cyan: '#38bdf8', purple: '#8b5cf6', red: '#dc2626', gray: '#6b7280',
};

export default function OperationalOverview({ devices, activeFilter, onFilterChange }) {
  const [view, setView] = useState('stats'); // 'stats' | 'charts'

  const stats = useMemo(() => {
    const counts = { ALL: 0, MOVING: 0, IDLE: 0, PARKED: 0, SERVICE: 0, NO_DATA: 0, DISABLED: 0 };
    Object.values(devices).forEach((device) => {
      counts.ALL += 1;
      counts[classifyVehicleStatus(device)] += 1;
    });
    return counts;
  }, [devices]);

  const total = stats.ALL || 0;

  return (
    <section className="op-overviewop panel">
      <div className="op-overview__headerop">
        <h2>Operational Overview</h2>
        <div className="op-overview__toggleop">
          <button
            type="button"
            className={`op-overview__toggle-btnop ${view === 'stats' ? 'is-active' : ''}`}
            onClick={() => setView('stats')}
          >
            <TbListDetails /> Stats
          </button>
          <button
            type="button"
            className={`op-overview__toggle-btnop ${view === 'charts' ? 'is-active' : ''}`}
            onClick={() => setView('charts')}
          >
            <TbChartBar /> Charts
          </button>
        </div>
      </div>

      {view === 'stats' ? (
        <div className="op-overview__cardsop">
          {CARD_CONFIG.map((card) => {
            const value = stats[card.key];
            const pct = card.key === 'ALL' ? 100 : total ? (value / total) * 100 : 0;
            const isActive = activeFilter === card.key;
            return (
              <button
                type="button"
                key={card.key}
                className={`op-cardop op-card--${card.color} ${isActive ? 'op-card--active' : ''}`}
                onClick={() => onFilterChange?.(card.key)}
              >
                <div className="op-card__topop">
                  <div className={`op-card__iconop op-card__icon--${card.color}`}>{card.icon}</div>
                  <div
                    className="op-card__ringop"
                    style={{ '--pct': pct, '--ring-clr': COLOR_HEX[card.color] }}
                  >
                    <span>{pct % 1 === 0 ? pct : pct.toFixed(1)}%</span>
                  </div>
                </div>
                <span className="op-card__labelop">{card.label.toUpperCase()}</span>
                <div className="op-card__value-rowop">
                  <strong className="op-card__valueop">{value}</strong>
                  <small className="op-card__sublabelop">{card.sublabel}</small>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="op-overview__chartop">
          <DonutChart
            data={CARD_CONFIG.filter((c) => c.key !== 'ALL').map((c) => ({
              label: c.label,
              value: stats[c.key],
              color: COLOR_HEX[c.color],
            }))}
            centerValue={total.toLocaleString()}
            centerLabel="Total Vehiclesop"
          />
        </div>
      )}
    </section>
  );
}