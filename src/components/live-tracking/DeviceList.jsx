import { useState, useRef } from 'react';
import {
  TbSearch, TbX, TbMapPin, TbClock, TbUser, TbPhone,
  TbBattery, TbBatteryCharging, TbDotsVertical, TbChevronDown,
} from 'react-icons/tb';
import { classifyVehicleStatus } from './OperationalOverview.jsx';
import {
  TbListDetails,
  TbCar,
  TbEngine,
  TbParking,
  TbWifiOff,
  TbBan,
  TbTools,
} from 'react-icons/tb';
import './DeviceList.css';

const FILTER_TABS = [
  { key: 'ALL', label: 'All', icon: TbListDetails },
  { key: 'MOVING', label: 'Moving', icon: TbCar },
  { key: 'IDLE', label: 'Idle', icon: TbEngine },
  { key: 'PARKED', label: 'Parked', icon: TbParking },
  { key: 'NO_DATA', label: 'No data', icon: TbWifiOff },
  { key: 'DISABLED', label: 'Disabled', icon: TbBan },
  { key: 'SERVICE', label: 'Service', icon: TbTools },
];

function formatAgo(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return '—';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatClock(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function DeviceList({ devices, selectedImei, onSelect, onOpenMenu }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const searchInputRef = useRef(null);

  const entries = Object.values(devices || {}).sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    const rank = { MOVING: 0, IDLE: 1, PARKED: 2, OFFLINE: 3, UNKNOWN: 4 };
    return (rank[a.status] ?? 4) - (rank[b.status] ?? 4);
  });

  const filteredEntries = entries.filter((d) => {
    const bucket = classifyVehicleStatus(d);
    const matchesStatus = statusFilter === 'ALL' || bucket === statusFilter;

    const matchesSearch =
      searchTerm === '' ||
      d.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.imei?.includes(searchTerm) ||
      d._raw?.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationTerm === '' ||
      d._raw?.address?.toLowerCase().includes(locationTerm.toLowerCase()) ||
      d._raw?.depot?.toLowerCase().includes(locationTerm.toLowerCase()) ||
      d.model?.toLowerCase().includes(locationTerm.toLowerCase());

    return matchesStatus && matchesSearch && matchesLocation;
  });

  const counts = entries.reduce(
    (acc, d) => {
      acc.ALL += 1;
      acc[classifyVehicleStatus(d)] += 1;
      return acc;
    },
    { ALL: 0, MOVING: 0, IDLE: 0, PARKED: 0, NO_DATA: 0, DISABLED: 0, SERVICE: 0 }
  );

  return (
    <div className="device-listdl">
      {/* Header */}
      <div className="device-list__headerdl">
        <div className="device-list__header-leftdl">
          <h2>Vehicles</h2>
          <span className="device-list__countdl">{filteredEntries.length}</span>
        </div>
      </div>

      {/* Group Selector Dropdown Button */}
      <div className="device-list__group-selectdl">
        <button type="button" className="device-list__group-btndl" disabled>
          All Vehicles <TbChevronDown />
        </button>
      </div>

      {/* Filter Inputs */}
      <div className="device-list__filtersdl">
        <div className="device-list__search-wrapperdl">
          <TbSearch className="device-list__search-icondl" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            className="device-list__searchdl"
            placeholder="Search by vehicle number, category etc"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="device-list__search-cleardl" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <TbX />
            </button>
          )}
        </div>
        <div className="device-list__search-wrapperdl">
          <TbMapPin className="device-list__search-icondl" aria-hidden="true" />
          <input
            type="text"
            className="device-list__searchdl"
            placeholder="Search by Area, depot, model"
            value={locationTerm}
            onChange={(e) => setLocationTerm(e.target.value)}
          />
          {locationTerm && (
            <button className="device-list__search-cleardl" onClick={() => setLocationTerm('')} aria-label="Clear search">
              <TbX />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="device-list__tabsdl">
  {FILTER_TABS.map((tab) => {
    const isActive = statusFilter === tab.key;
    const statusClass = `device-list__tab--${tab.key.toLowerCase()}`;
    const IconComponent = tab.icon;

    return (
      <button
        key={tab.key}
        type="button"
        className={`device-list__tabdl ${statusClass} ${isActive ? 'device-list__tab--active' : ''}`}
        onClick={() => setStatusFilter(tab.key)}
      >
        <IconComponent className="device-list__tab-icondl" aria-hidden="true" />
        <span className="device-list__tab-labeldl">{tab.label}</span>
        <span className="device-list__tab-countdl">{counts[tab.key]}</span>
      </button>
    );
  })}
</div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="device-list__emptydl">
          {entries.length === 0 ? (
            <>
              <TbCar className="device-list__empty-icondl" aria-hidden="true" />
              <span>Waiting for devices…</span>
            </>
          ) : (
            <>
              <TbSearch className="device-list__empty-icondl" aria-hidden="true" />
              <span>No devices match your filters</span>
            </>
          )}
        </div>
      )}

      {/* Vehicle List Items */}
      <ul className="device-list__itemsdl">
        {filteredEntries.map((d) => {
          const bucket = classifyVehicleStatus(d);
          const isOnline = d.isOnline !== undefined ? d.isOnline : d.status !== 'OFFLINE';
          const driverName = d._raw?.driverName || 'N/A';
          const driverPhone = d._raw?.driverPhone || 'N/A';
          const address = d._raw?.address || (d.location ? `${d.location.latitude?.toFixed(5)}, ${d.location.longitude?.toFixed(5)}` : 'No location data');
          const ignitionOn = d._raw?.ignition === true;
          const battery = d._raw?.batteryPercent;
          const isCharging = d._raw?.isCharging === true;

          return (
            <li
              key={d.imei}
              className={`device-list__itemdl ${d.imei === selectedImei ? 'device-list__item--active' : ''} ${!isOnline ? 'device-list__item--offline' : ''}`}
              onClick={() => onSelect(d.imei)}
            >
              <div className="device-list__row-topdl">
                <div className="device-list__icon-coldl">
                  <TbCar className="device-list__type-icondl" />
                  <span className="device-list__type-labeldl">{d._raw?.vehicleType || 'Vehicle'}</span>
                </div>

                <div className="device-list__main-coldl">
                  <div className="device-list__title-rowdl">
                    <span className="device-list__namedl">{d.deviceName || d.imei}</span>
                    <button
                      type="button"
                      className="device-list__menu-btndl"
                      onClick={(e) => { e.stopPropagation(); onOpenMenu?.(d.imei); }}
                      aria-label="Vehicle actions"
                    >
                      <TbDotsVertical />
                    </button>
                  </div>
                  <span className="device-list__categorydl">{d._raw?.category || d.protocol || 'Unassigned'}</span>

                  <div className="device-list__meta-rowdl">
                    <span><TbUser aria-hidden="true" /> {driverName}</span>
                    <span><TbPhone aria-hidden="true" /> {driverPhone}</span>
                  </div>

                  <div className="device-list__locationdl">
                    <TbMapPin aria-hidden="true" />
                    <span>{address}</span>
                  </div>

                  <div className="device-list__status-rowdl">
                    <span className={`device-list__status-tagdl device-list__status-tag--${bucket.toLowerCase()}`}>
                      {bucket.replace('_', ' ')}: {formatClock(d.location?.gpsTimestamp || d.lastSeenAt)}
                    </span>
                    <span className="device-list__agodl"><TbClock aria-hidden="true" /> {formatAgo(d.lastSeenAt)}</span>
                  </div>

                  <div className="device-list__badges-rowdl">
                    <span className={`device-list__badgedl ${ignitionOn ? 'device-list__badge--on' : 'device-list__badge--off'}`}>
                      IGN {ignitionOn ? 'ON' : 'OFF'}
                    </span>
                    {battery != null && (
                      <span className="device-list__badgedl device-list__badge--neutraldl">
                        {isCharging ? <TbBatteryCharging /> : <TbBattery />} {battery}%
                      </span>
                    )}
                    {!isCharging && battery != null && (
                      <span className="device-list__badgedl device-list__badge--muteddl">Not Charging</span>
                    )}
                  </div>

                  {d.model && <div className="device-list__modeldl">Model: {d.model.toUpperCase()}</div>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}