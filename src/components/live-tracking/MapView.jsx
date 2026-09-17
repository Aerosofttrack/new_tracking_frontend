// components/live-tracking/MapView.jsx
import { useEffect, useRef, useState } from 'react';
import { TbAlertTriangle, TbLoader2 } from 'react-icons/tb';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader.js';
import './MapView.css';

const STATUS_COLOR = {
  MOVING: '#34d399',
  IDLE: '#fbbf24',
  PARKED: '#38bdf8',
  OFFLINE: '#6b7280',
  UNKNOWN: '#5b6478',
};

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India
const MAX_POLYLINE_POINTS = 300;

function markerIcon(status, heading = 0) {
  const color = STATUS_COLOR[status] || STATUS_COLOR.UNKNOWN;
  return {
    path: 'M 0,-8 L 5,6 L 0,3 L -5,6 Z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#0a0d14',
    strokeWeight: 1.5,
    scale: 1.6,
    rotation: heading,
  };
}

export default function MapView({ locations, selectedImei, onSelectMarker }) {

  console.log(locations , "locations")
  // IMPORTANT: Replace this with YOUR OWN Google Maps API Key
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyDePU_2mSuK8zNJcwM73e5Gemk5NFW-AcI";
  const { loaded, error } = useGoogleMapsLoader(apiKey);

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const polylinesRef = useRef(new Map());
  const infoWindowRef = useRef(null);
  const hasCenteredRef = useRef(false);

  // Initialize the map once the script is loaded
  useEffect(() => {
    if (!loaded || mapRef.current || !mapDivRef.current) return;

    try {
      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center: DEFAULT_CENTER,
        zoom: 5,
        disableDefaultUI: false,
        styles: DARK_MAP_STYLE,
        mapId: process.env.REACT_APP_GOOGLE_MAP_ID || undefined,
      });
      infoWindowRef.current = new window.google.maps.InfoWindow();
      console.log('Map initialized successfully');
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }, [loaded]);

  // Sync markers + polylines whenever live location data changes
  useEffect(() => {
    if (!loaded || !mapRef.current || !window.google) {
      console.log('Map not ready for markers');
      return;
    }

    const google = window.google;
    const locationKeys = Object.keys(locations);
    console.log('Updating markers for', locationKeys.length, 'locations');

    // Clear markers that no longer exist
    const currentImeis = new Set(locationKeys);
    for (const [imei, marker] of markersRef.current) {
      if (!currentImeis.has(imei)) {
        marker.setMap(null);
        markersRef.current.delete(imei);
        // Also cleanup polyline
        const entry = polylinesRef.current.get(imei);
        if (entry) {
          entry.polyline.setMap(null);
          polylinesRef.current.delete(imei);
        }
      }
    }

    // Add/update markers
    locationKeys.forEach((imei) => {
      const device = locations[imei];
      const loc = device.location;
      
      if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
        return;
      }

      const position = { lat: loc.latitude, lng: loc.longitude };
      let marker = markersRef.current.get(imei);

      const icon = markerIcon(device.status, loc.heading || 0);
      if (google.maps.Point) {
        icon.anchor = new google.maps.Point(0, 0);
      }

      if (!marker) {
        marker = new google.maps.Marker({
          position,
          map: mapRef.current,
          icon,
          title: device.deviceName || imei,
        });
        
        marker.addListener('click', () => {
          onSelectMarker(imei);
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(buildInfoWindowHtml(imei, device));
            infoWindowRef.current.open(mapRef.current, marker);
          }
        });
        
        markersRef.current.set(imei, marker);
      } else {
        marker.setPosition(position);
        marker.setIcon(icon);
      }

      // Travel path polyline
      let entry = polylinesRef.current.get(imei);
      if (!entry && google.maps.Polyline) {
        const polyline = new google.maps.Polyline({
          map: mapRef.current,
          path: [],
          strokeColor: STATUS_COLOR[device.status] || STATUS_COLOR.UNKNOWN,
          strokeOpacity: 0.7,
          strokeWeight: 3,
        });
        entry = { polyline, path: [] };
        polylinesRef.current.set(imei, entry);
      }
      
      if (entry) {
        const lastPoint = entry.path[entry.path.length - 1];
        if (!lastPoint || lastPoint.lat !== position.lat || lastPoint.lng !== position.lng) {
          entry.path.push(position);
          if (entry.path.length > MAX_POLYLINE_POINTS) entry.path.shift();
          entry.polyline.setPath(entry.path);
        }
      }
    });
  }, [locations, loaded, onSelectMarker]);

  // Center + open info window on the selected vehicle
  useEffect(() => {
    if (!loaded || !mapRef.current || !selectedImei) return;
    
    const device = locations[selectedImei];
    const marker = markersRef.current.get(selectedImei);
    
    if (!device?.location || !marker) {
      console.log('Selected device not found or has no location');
      return;
    }

    const position = { lat: device.location.latitude, lng: device.location.longitude };
    mapRef.current.panTo(position);
    
    if (!hasCenteredRef.current) {
      mapRef.current.setZoom(14);
      hasCenteredRef.current = true;
    }
    
    if (infoWindowRef.current) {
      infoWindowRef.current.setContent(buildInfoWindowHtml(selectedImei, device));
      infoWindowRef.current.open(mapRef.current, marker);
    }
  }, [selectedImei, locations, loaded]);

  if (error) {
    return (
      <div className="map-viewmp map-view--error">
        <TbAlertTriangle className="map-view__state-icon" aria-hidden="true" />
        <span>{error}</span>
        <span style={{ fontSize: '11px', color: '#8ea0c0' }}>Check your API key</span>
      </div>
    );
  }

  return (
    <div className="map-viewmp">
      {!loaded && (
        <div className="map-view__loadingmp">
          <TbLoader2 className="map-view__loading-iconmp" aria-hidden="true" />
          <span>Loading map…</span>
        </div>
      )}
      <div ref={mapDivRef} className="map-view__canvasmp" />
    </div>
  );
}

function buildInfoWindowHtml(imei, device) {
  const loc = device.location || {};
  const time = loc.gpsTimestamp ? new Date(loc.gpsTimestamp).toLocaleString() : '—';
  return `
    <div class="map-view__infowindowmp">
      <div class="map-view__infowindow-titlemp">${device.deviceName || imei}</div>
      <div class="map-view__infowindow-rowmp"><span>Status</span><strong>${device.status || 'UNKNOWN'}</strong></div>
      <div class="map-view__infowindow-rowmp"><span>Speed</span><strong>${Math.round(loc.speedKmh ?? 0)} km/h</strong></div>
      <div class="map-view__infowindow-rowmp"><span>Lat</span><strong>${loc.latitude?.toFixed(6) ?? '—'}</strong></div>
      <div class="map-view__infowindow-rowmp"><span>Lon</span><strong>${loc.longitude?.toFixed(6) ?? '—'}</strong></div>
      <div class="map-view__infowindow-rowmp"><span>Updated</span><strong>${time}</strong></div>
    </div>
  `;
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2330' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2330' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ea0c0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3346' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d2330' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#131722' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#232a3b' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a4459' }] },
];