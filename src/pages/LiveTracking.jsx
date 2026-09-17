// // pages/LiveTracking.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from '../components/live-tracking/MapView.jsx';
import DeviceList from '../components/live-tracking/DeviceList.jsx';
import { api } from '../api/liveTrackingApi.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import './LiveTracking.css';
import OperationalOverview, { classifyVehicleStatus } from '../components/live-tracking/OperationalOverview.jsx';

function mergeLocation(prev, imei, patch) {
  const existing = prev[imei] || {
    imei, deviceName: null, status: 'UNKNOWN', location: null,
    protocol: null, isOnline: false, model: null, lastSeenAt: null,
  };
  return { ...prev, [imei]: { ...existing, ...patch } };
}

export default function LiveTracking() {
  const { user } = useAuth();
  const [devices, setDevices] = useState({});
  const [selectedImei, setSelectedImei] = useState(null);
  const [connected, setConnected] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Resolve which IMEIs this logged-in user is allowed to see.
  const allowedImeis = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return null;
    return null; // TODO: replace with real scoping once the live-tracking backend accepts the JWT
  }, [user]);

  const handleSelect = useCallback((imei) => setSelectedImei(imei), []);

  useEffect(() => {
    async function load() {
      try {
        const { devices } = await api.listDevices();
        const next = {};
        devices.forEach((device) => {
          next[device.imei] = {
            imei: device.imei,
            deviceName: device.name || device.driverName || device.imei,
            status: device.lastStatus || device.status || 'UNKNOWN',
            location: device.lastLocation || null,
            protocol: device.protocol || 'Unknown',
            isOnline: device.isOnline || false,
            model: device.model || null,
            lastSeenAt: device.lastSeenAt || null,
            isActive: device.isActive || false,
            _raw: device,
          };
        });

        try {
          const { locations } = await api.getLiveLocations();
          locations.forEach((loc) => {
            if (next[loc.imei]) {
              next[loc.imei] = {
                ...next[loc.imei],
                location: loc,
                status: loc.vehicleStatus || next[loc.imei]?.status,
                protocol: loc.protocol || next[loc.imei]?.protocol,
              };
            }
          });
        } catch {
          console.debug('Live locations API not available, using device data');
        }

        setDevices(next);
        console.log('Devices loaded:', Object.keys(next).length);
      } catch (err) {
        console.error('Failed to load devices:', err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onSnapshot = ({ locations }) => {
      setDevices((prev) => {
        let next = prev;
        for (const loc of locations) {
          next = mergeLocation(next, loc.imei, {
            location: loc, status: loc.vehicleStatus || 'UNKNOWN', protocol: loc.protocol || null,
          });
        }
        return next;
      });
    };
    const onLocationUpdate = ({ imei, location, status, deviceName, protocol }) => {
      setDevices((prev) => mergeLocation(prev, imei, { location, status, deviceName, protocol: protocol || null }));
    };
    const onStatusChange = ({ imei, status }) => {
      setDevices((prev) => mergeLocation(prev, imei, { status }));
    };
    const onDeviceOffline = ({ imei }) => {
      setDevices((prev) => mergeLocation(prev, imei, { status: 'OFFLINE', isOnline: false }));
    };
    const onDeviceOnline = ({ imei }) => {
      setDevices((prev) => mergeLocation(prev, imei, { isOnline: true }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('snapshot', onSnapshot);
    socket.on('location:update', onLocationUpdate);
    socket.on('device:statusChange', onStatusChange);
    socket.on('device:offline', onDeviceOffline);
    socket.on('device:online', onDeviceOnline);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('snapshot', onSnapshot);
      socket.off('location:update', onLocationUpdate);
      socket.off('device:statusChange', onStatusChange);
      socket.off('device:offline', onDeviceOffline);
      socket.off('device:online', onDeviceOnline);
    };
  }, []);

  const visibleDevices = useMemo(() => {
    if (allowedImeis === null) return devices;
    const allowedSet = new Set(allowedImeis);
    return Object.fromEntries(Object.entries(devices).filter(([imei]) => allowedSet.has(imei)));
  }, [devices, allowedImeis]);

  const filteredDevices = useMemo(() => {
    if (statusFilter === 'ALL') return visibleDevices;
    return Object.fromEntries(
      Object.entries(visibleDevices).filter(([_, device]) => {
        return classifyVehicleStatus(device) === statusFilter;
      })
    );
  }, [visibleDevices, statusFilter]);

  useEffect(() => {
    if (selectedImei && !filteredDevices[selectedImei]) setSelectedImei(null);
  }, [filteredDevices, selectedImei]);

  return (
    <div className="live-tracking-pagelt">
      <div className="live-tracking-page__headerlt">
        <h1>Live Tracking</h1>
        <div className={`live-tracking-page__connlt ${connected ? 'is-live' : 'is-down'}`}>
          <span className="live-tracking-page__conn-dotlt" />
          {connected ? 'Live' : 'Reconnecting…'}
        </div>
      </div>

      <div className="live-tracking-page__body-wraplt">
        <OperationalOverview
          devices={visibleDevices}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
        <div className="live-tracking-page__bodylt">
          <DeviceList devices={filteredDevices} selectedImei={selectedImei} onSelect={handleSelect} />
          <MapView locations={filteredDevices} selectedImei={selectedImei} onSelectMarker={handleSelect} />
        </div>
      </div>
    </div>
  );
}



// // pages/LiveTracking.jsx
// import { useCallback, useEffect, useMemo, useState } from 'react';
// import MapView from '../components/live-tracking/MapView.jsx';
// import DeviceList from '../components/live-tracking/DeviceList.jsx';
// import { api } from '../api/liveTrackingApi.js';
// import { getSocket } from '../services/socket.js';
// import { useAuth } from '../context/AuthContext.jsx';
// import './LiveTracking.css';
// import OperationalOverview, { classifyVehicleStatus } from '../components/live-tracking/OperationalOverview.jsx';

// const ADMIN_API_URL = 'https://gps-backend-3hl6.onrender.com/api';

// function mergeLocation(prev, imei, patch) {
//   const existing = prev[imei] || {
//     imei, deviceName: null, status: 'UNKNOWN', location: null,
//     protocol: null, isOnline: false, model: null, lastSeenAt: null,
//   };
//   return { ...prev, [imei]: { ...existing, ...patch } };
// }

// export default function LiveTracking() {
//   const { user } = useAuth();
//   const [devices, setDevices] = useState({});
//   const [selectedImei, setSelectedImei] = useState(null);
//   const [connected, setConnected] = useState(false);
//   const [statusFilter, setStatusFilter] = useState('ALL');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const handleSelect = useCallback((imei) => setSelectedImei(imei), []);

//   useEffect(() => {
// async function loadDevices() {
//   setLoading(true);
//   setError(null);
  
//   try {
//     let devicesData;
    
//     if (user?.role === 'ADMIN') {
//       // Admin sees all devices from live tracking
//       const response = await api.listDevices();
//       console.log(response)
//       devicesData = response.devices || [];
//     } else {
//       // For regular users, use the standard device list with filter
//       // This uses the existing GET /api/devices endpoint with query params
//       try {
//         // Try to get devices filtered by owner
//         const response = await fetch(
//           `${ADMIN_API_URL}/devices?ownerUserId=${user?._id}`,
//           {
//             headers: {
//               'Authorization': `Bearer ${localStorage.getItem('token')}`,
//               'Content-Type': 'application/json'
//             }
//           }
//         );
        
//         if (response.ok) {
//           const json = await response.json();
//           devicesData = json.data?.data || json.data || [];
//         } else {
//           // Fallback: get all devices and filter client-side
//           const allDevices = await api.listDevices();
//           devicesData = allDevices.devices?.filter(d => 
//             d.ownerUserId === user?._id || 
//             d.dealerId === user?._id
//           ) || [];
//         }
//       } catch (err) {
//         console.error('Error fetching filtered devices:', err);
//         // Final fallback: empty array
//         devicesData = [];
//       }
//     }

//     // Process devices...
//     const next = {};
//     devicesData.forEach((device) => {
//       if (!device.imei) return;
      
//       next[device.imei] = {
//         imei: device.imei,
//         deviceName: device.name || device.deviceName || device.imei,
//         status: device.status || 'UNKNOWN',
//         location: device.lastLocation || null,
//         protocol: device.protocol || 'Unknown',
//         isOnline: device.isOnline || device.status === 'ACTIVE',
//         model: device.deviceModel || device.model || null,
//         lastSeenAt: device.lastHeartbeatAt || device.updatedAt || null,
//         isActive: device.status === 'ACTIVE',
//         _raw: device,
//       };
//     });

//     setDevices(next);
//   } catch (err) {
//     console.error('Failed to load devices:', err);
//     setError(err.message || 'Failed to load devices. Please try again.');
//   } finally {
//     setLoading(false);
//   }
// }


//     if (user) {
//       loadDevices();
//     } else {
//       setLoading(false);
//       setError('Please login to view devices');
//     }
//   }, [user]);

//   // Socket connection for real-time updates
//   useEffect(() => {
//     if (!user || Object.keys(devices).length === 0) return;
    
//     const socket = getSocket();
//     const onConnect = () => setConnected(true);
//     const onDisconnect = () => setConnected(false);
    
//     const onSnapshot = ({ locations }) => {
//       setDevices((prev) => {
//         let next = { ...prev };
//         for (const loc of locations) {
//           if (prev[loc.imei]) {
//             next = mergeLocation(next, loc.imei, {
//               location: loc, 
//               status: loc.vehicleStatus || 'UNKNOWN', 
//               protocol: loc.protocol || null,
//               isOnline: true,
//             });
//           }
//         }
//         return next;
//       });
//     };
    
//     const onLocationUpdate = ({ imei, location, status, deviceName, protocol }) => {
//       setDevices((prev) => {
//         if (!prev[imei]) return prev;
//         return mergeLocation(prev, imei, { 
//           location, 
//           status, 
//           deviceName, 
//           protocol: protocol || null,
//           isOnline: true,
//         });
//       });
//     };
    
//     const onStatusChange = ({ imei, status }) => {
//       setDevices((prev) => {
//         if (!prev[imei]) return prev;
//         return mergeLocation(prev, imei, { status });
//       });
//     };
    
//     const onDeviceOffline = ({ imei }) => {
//       setDevices((prev) => {
//         if (!prev[imei]) return prev;
//         return mergeLocation(prev, imei, { status: 'OFFLINE', isOnline: false });
//       });
//     };
    
//     const onDeviceOnline = ({ imei }) => {
//       setDevices((prev) => {
//         if (!prev[imei]) return prev;
//         return mergeLocation(prev, imei, { isOnline: true });
//       });
//     };

//     socket.on('connect', onConnect);
//     socket.on('disconnect', onDisconnect);
//     socket.on('snapshot', onSnapshot);
//     socket.on('location:update', onLocationUpdate);
//     socket.on('device:statusChange', onStatusChange);
//     socket.on('device:offline', onDeviceOffline);
//     socket.on('device:online', onDeviceOnline);

//     return () => {
//       socket.off('connect', onConnect);
//       socket.off('disconnect', onDisconnect);
//       socket.off('snapshot', onSnapshot);
//       socket.off('location:update', onLocationUpdate);
//       socket.off('device:statusChange', onStatusChange);
//       socket.off('device:offline', onDeviceOffline);
//       socket.off('device:online', onDeviceOnline);
//     };
//   }, [user, devices]);

//   const filteredDevices = useMemo(() => {
//     if (statusFilter === 'ALL') return devices;
//     return Object.fromEntries(
//       Object.entries(devices).filter(([_, device]) => {
//         return classifyVehicleStatus(device) === statusFilter;
//       })
//     );
//   }, [devices, statusFilter]);

//   useEffect(() => {
//     if (selectedImei && !filteredDevices[selectedImei]) setSelectedImei(null);
//   }, [filteredDevices, selectedImei]);

//   // Show loading state
//   if (loading) {
//     return (
//       <div className="live-tracking-pagelt">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>Loading vehicles...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <div className="live-tracking-pagelt">
//         <div className="error-container">
//           <h3>Error Loading Devices</h3>
//           <p>{error}</p>
//           <button onClick={() => window.location.reload()}>Retry</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="live-tracking-pagelt">
//       <div className="live-tracking-page__headerlt">
//         <h1>Live Tracking</h1>
//         <div className="live-tracking-page__conn-info">
//           <span className="device-count">
//             {Object.keys(devices).length} vehicles
//           </span>
//           <div className={`live-tracking-page__connlt ${connected ? 'is-live' : 'is-down'}`}>
//             <span className="live-tracking-page__conn-dotlt" />
//             {connected ? 'Live' : 'Reconnecting…'}
//           </div>
//         </div>
//       </div>

//       <div className="live-tracking-page__body-wraplt">
//         <OperationalOverview
//           devices={devices}
//           activeFilter={statusFilter}
//           onFilterChange={setStatusFilter}
//         />
//         <div className="live-tracking-page__bodylt">
//           <DeviceList 
//             devices={filteredDevices} 
//             selectedImei={selectedImei} 
//             onSelect={handleSelect} 
//           />
//           <MapView 
//             locations={filteredDevices} 
//             selectedImei={selectedImei} 
//             onSelectMarker={handleSelect} 
//           />
//         </div>
//       </div>
//     </div>
//   );
// }