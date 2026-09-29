import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { 
  Maximize2, Minimize2, Layers, Eye, EyeOff, Navigation, 
  MapPin, Radio, Shield, AlertTriangle, RefreshCw, ZoomIn, ZoomOut, Compass,
  Mountain, Satellite, Map as MapIcon, Crosshair, Activity, Cpu
} from 'lucide-react';
import { 
  MINE_CENTER, MINE_BOUNDARIES,
  INFRASTRUCTURE_GEO 
} from '../../services/mockData';
import { useMineData } from '../../context/MineDataContext';

// Real Mining GIS Spatial Datasets (Jharia Coalfield Strata & Pit Geometry)
const MINE_PIT_BENCHES = [
  {
    name: 'Pit Bench 1 (RL +180m MSL)',
    elevation: '+180m',
    color: '#0284c7',
    dashArray: '5, 5',
    coords: [
      [23.7810, 86.4040],
      [23.7835, 86.4170],
      [23.7770, 86.4230],
      [23.7680, 86.4190],
      [23.7660, 86.4070],
      [23.7720, 86.4030],
      [23.7810, 86.4040]
    ]
  },
  {
    name: 'Pit Bench 2 (RL +140m MSL - Overburden Cut)',
    elevation: '+140m',
    color: '#d97706',
    dashArray: '4, 4',
    coords: [
      [23.7790, 86.4070],
      [23.7810, 86.4160],
      [23.7755, 86.4200],
      [23.7700, 86.4165],
      [23.7685, 86.4090],
      [23.7735, 86.4060],
      [23.7790, 86.4070]
    ]
  },
  {
    name: 'Pit Floor / Seam Cut (RL +90m MSL - Active Seam 14)',
    elevation: '+90m',
    color: '#dc2626',
    dashArray: '3, 3',
    coords: [
      [23.7770, 86.4100],
      [23.7790, 86.4150],
      [23.7740, 86.4180],
      [23.7710, 86.4140],
      [23.7730, 86.4090],
      [23.7770, 86.4100]
    ]
  }
];

const GEOLOGICAL_FAULTS = [
  {
    id: 'fault-f1',
    name: 'Damodar Main Boundary Fault F-1',
    type: 'Normal Fault (Dip 62° NE)',
    color: '#dc2626',
    weight: 3.5,
    coords: [
      [23.7860, 86.4000],
      [23.7820, 86.4100],
      [23.7760, 86.4200],
      [23.7700, 86.4280]
    ]
  },
  {
    id: 'fault-f3',
    name: 'Jharia South Shear Zone F-3',
    type: 'Strike-Slip Shear Plane',
    color: '#ea580c',
    weight: 3,
    coords: [
      [23.7650, 86.4020],
      [23.7710, 86.4120],
      [23.7760, 86.4220],
      [23.7810, 86.4290]
    ]
  }
];

const UNDERGROUND_DRIFTS = [
  {
    name: 'Incline Drift 01 (Main Haulage Ramp)',
    color: '#0284c7',
    coords: [
      [23.7690, 86.4070],
      [23.7730, 86.4120],
      [23.7770, 86.4160]
    ]
  },
  {
    name: 'Intake Gallery & Man-Riding Drift 02',
    color: '#16a34a',
    coords: [
      [23.7670, 86.4120],
      [23.7720, 86.4150],
      [23.7750, 86.4180]
    ]
  },
  {
    name: 'Return Airway Gallery (Ventilation Exhaust)',
    color: '#d97706',
    coords: [
      [23.7780, 86.4080],
      [23.7750, 86.4140],
      [23.7710, 86.4190]
    ]
  }
];

export default function RiskMap({ onOpenEvacuationModal, onOpenDigitalTwin }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const basemapLayersRef = useRef({});
  const layerGroupsRef = useRef({
    boundary: null,
    benches: null,
    faults: null,
    drifts: null,
    zones: null,
    sensors: null,
    workers: null,
    routes: null,
    infrastructure: null,
    heatmap: null,
    grid: null
  });

  const { config, alerts, zones, sensors, workers, evacuation, selectedSensor, selectSensorNode, selectedWorker, selectWorkerNode, selectedZone, selectZoneNode } = useMineData();

  // Auto-Focus Map on Triggered Alerts
  useEffect(() => {
    if (!config?.general?.monitoring?.autoCenterOnAlert) return;
    if (!alerts || alerts.length === 0) return;
    
    const latestAlert = alerts[0]; // Assuming newest is at index 0 based on backend insert(0)
    if (latestAlert.severity === 'CRITICAL' || latestAlert.severity === 'WARNING') {
      let targetCoords = null;
      
      // Look for a node_id if this alert is tied to a specific sensor
      if (latestAlert.node_id) {
         const sensor = sensors.find(s => s.id === latestAlert.node_id);
         if (sensor && sensor.lat && sensor.lng) {
           targetCoords = [sensor.lat, sensor.lng];
         }
      }
      
      // Fallback: look for the zone and compute a rough center based on its sensors
      if (!targetCoords && latestAlert.zone) {
         const zoneSensors = sensors.filter(s => s.zone === latestAlert.zone);
         if (zoneSensors.length > 0) {
           const avgLat = zoneSensors.reduce((sum, s) => sum + s.lat, 0) / zoneSensors.length;
           const avgLng = zoneSensors.reduce((sum, s) => sum + s.lng, 0) / zoneSensors.length;
           targetCoords = [avgLat, avgLng];
         }
      }
      
      if (targetCoords && mapInstanceRef.current) {
         mapInstanceRef.current.flyTo(targetCoords, 18, {
           animate: true,
           duration: 1.5
         });
      }
    }
  }, [alerts, config?.general?.monitoring?.autoCenterOnAlert, sensors]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState('satellite'); // 'satellite' (default real mining view) | 'topo' | 'terrain' | 'osm'
  const [cursorGeo, setCursorGeo] = useState({
    lat: 23.7745,
    lng: 86.4120,
    utmE: '423,540m E',
    utmN: '2,628,420m N',
    elevation: '+178m MSL',
    seam: 'Seam 14 (Mahuda)'
  });

  const [layersVisible, setLayersVisible] = useState({
    sensors: true,
    workers: true,
    zones: true,
    routes: true,
    infrastructure: true,
    heatmap: true,
    benches: true,
    faults: true,
    drifts: true,
    grid: true
  });
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Base Leaflet instance
    const map = L.map(mapContainerRef.current, {
      center: MINE_CENTER,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add Metric Scale Bar for Mining Surveying
    L.control.scale({
      position: 'bottomright',
      metric: true,
      imperial: false,
      maxWidth: 150
    }).addTo(map);

    // Track Cursor Coordinates for GIS HUD
    map.on('mousemove', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      // Convert to simulated UTM 45N and elevation for Jharia
      const utmE = Math.round(400000 + (lng - 86.4) * 111000);
      const utmN = Math.round(2600000 + (lat - 23.7) * 111000);
      const elev = Math.round(185 - (lat - 23.77) * 450);
      
      setCursorGeo({
        lat: lat.toFixed(5),
        lng: lng.toFixed(5),
        utmE: `${utmE.toLocaleString()}m E`,
        utmN: `${utmN.toLocaleString()}m N`,
        elevation: `+${elev}m MSL`,
        seam: lat > 23.775 ? 'Seam 14 (Depillaring)' : 'Seam 12-A (Solid Coal)'
      });
    });

    // 1. REAL HIGH-RES SATELLITE TILE LAYER (Default Real Pit Imagery)
    const satTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      maxNativeZoom: 19,
      attribution: 'Esri World Imagery High-Res Satellite'
    });

    // 2. GEOLOGICAL TOPO TILE LAYER (Contour Strata Relief)
    const topoTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      maxNativeZoom: 18,
      attribution: 'Esri World Topographic Strata'
    });

    // 3. DARK TACTICAL GIS BASEMAP (Esri Dark Gray Canvas - 100% Free, No API Key, No Watermark)
    const darkBaseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      maxNativeZoom: 16,
      attribution: 'Esri Dark Gray Tactical Basemap'
    });
    const darkRefLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      maxNativeZoom: 16,
      attribution: 'Esri'
    });
    const terrainTiles = L.layerGroup([darkBaseLayer, darkRefLayer]);

    // 4. OPEN STREET BASE
    const osmTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap'
    });

    // Add default satellite tiles
    satTiles.addTo(map);
    basemapLayersRef.current = {
      satellite: satTiles,
      topo: topoTiles,
      terrain: terrainTiles,
      osm: osmTiles
    };

    // Initialize layer groups
    layerGroupsRef.current.grid = L.layerGroup().addTo(map);
    layerGroupsRef.current.boundary = L.layerGroup().addTo(map);
    layerGroupsRef.current.benches = L.layerGroup().addTo(map);
    layerGroupsRef.current.faults = L.layerGroup().addTo(map);
    layerGroupsRef.current.drifts = L.layerGroup().addTo(map);
    layerGroupsRef.current.zones = L.layerGroup().addTo(map);
    layerGroupsRef.current.heatmap = L.layerGroup().addTo(map);
    layerGroupsRef.current.infrastructure = L.layerGroup().addTo(map);
    layerGroupsRef.current.routes = L.layerGroup().addTo(map);
    
    // Initialize Marker Clusters for dense point data
    const createClusterCustomIcon = (cluster, colorClass, shadowClass) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xl ${colorClass} ring-4 ${shadowClass}">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: L.point(40, 40, true),
      });
    };

    layerGroupsRef.current.sensors = L.markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: (c) => createClusterCustomIcon(c, 'bg-[#38bdf8]', 'ring-[#38bdf8]/40')
    }).addTo(map);
    
    layerGroupsRef.current.workers = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (c) => createClusterCustomIcon(c, 'bg-[#22c55e]', 'ring-[#22c55e]/40')
    }).addTo(map);

    // Draw Mine Boundary
    L.polygon(MINE_BOUNDARIES, {
      color: '#0284c7',
      weight: 2.5,
      dashArray: '8, 4',
      fillColor: '#0284c7',
      fillOpacity: 0.08
    }).addTo(layerGroupsRef.current.boundary)
      .bindTooltip("<div class='font-mono font-bold text-xs text-cyan-300 bg-[#111827]/95 p-1.5 rounded shadow border border-cyan-500/40'>Engineering Safety Lease Boundary — Jharia Colliery (Area: 14.8 km²)</div>", { sticky: true });

    // Draw 100m Geological Mine Grid Lines
    const gridGroup = layerGroupsRef.current.grid;
    for (let lat = 23.7640; lat <= 23.7850; lat += 0.005) {
      L.polyline([[lat, 86.4000], [lat, 86.4260]], {
        color: 'rgba(255, 255, 255, 0.25)',
        weight: 1,
        dashArray: '2, 6'
      }).addTo(gridGroup);
    }
    for (let lng = 86.4020; lng <= 86.4250; lng += 0.005) {
      L.polyline([[23.7630, lng], [23.7860, lng]], {
        color: 'rgba(255, 255, 255, 0.25)',
        weight: 1,
        dashArray: '2, 6'
      }).addTo(gridGroup);
    }

    // Draw Pit Benches & Stripping Terraces
    const benchesGroup = layerGroupsRef.current.benches;
    MINE_PIT_BENCHES.forEach(bench => {
      L.polygon(bench.coords, {
        color: bench.color,
        weight: 2,
        dashArray: bench.dashArray,
        fillColor: bench.color,
        fillOpacity: 0.12
      }).addTo(benchesGroup)
        .bindTooltip(`<div class="font-mono text-xs bg-[#111827] text-slate-200 p-1.5 rounded shadow border border-slate-700"><strong style="color: ${bench.color}">${bench.name}</strong><div class="text-[10px] text-slate-400">Bench Elevation: ${bench.elevation}</div></div>`, { sticky: true });
    });

    // Draw Geological Fault Planes
    const faultsGroup = layerGroupsRef.current.faults;
    GEOLOGICAL_FAULTS.forEach(fault => {
      L.polyline(fault.coords, {
        color: fault.color,
        weight: fault.weight,
        dashArray: '8, 5'
      }).addTo(faultsGroup)
        .bindTooltip(`<div class="font-mono text-xs bg-[#111827] text-red-400 p-1.5 rounded shadow border border-red-500/40"><strong>⚡ ${fault.name}</strong><div class="text-[10px] text-slate-400">${fault.type}</div></div>`, { sticky: true });
    });

    // Draw Underground Haulage & Ventilation Tunnels
    const driftsGroup = layerGroupsRef.current.drifts;
    UNDERGROUND_DRIFTS.forEach(drift => {
      L.polyline(drift.coords, {
        color: drift.color,
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.95
      }).addTo(driftsGroup)
        .bindTooltip(`<div class="font-mono text-xs bg-[#111827] text-slate-200 p-1.5 rounded shadow border border-slate-700"><strong>🚇 ${drift.name}</strong><div class="text-[10px] text-slate-400">Sub-surface Extraction Drift (-180m)</div></div>`, { sticky: true });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch and draw engineering reference layers from the backend spatial API
  // (replaces hardcoded coordinate arrays below when available)
  const [engineeringLayers, setEngineeringLayers] = useState(null);
  useEffect(() => {
    if (engineeringLayers) return;
    (async () => {
      try {
        const apiKey = (localStorage.getItem('terramesh_api_key') || localStorage.getItem('mineguard_auth_token'));
        const res = await fetch('http://localhost:8000/api/spatial/engineering-layers', {
          headers: apiKey ? { 'X-API-Key': apiKey } : {}
        });
        if (res.ok) setEngineeringLayers(await res.json());
      } catch (e) {
        // Hardcoded geometry above remains as the offline fallback
      }
    })();
  }, [engineeringLayers]);

  // Redraw engineering layers from the backend when available
  useEffect(() => {
    if (!engineeringLayers || !mapInstanceRef.current) return;
    const lg = layerGroupsRef.current;
    if (!lg || !lg.boundary) return;

    // GeoJSON is [lng, lat]; Leaflet is [lat, lng]
    const toLp = (coords) => coords.map(([x, y]) => [y, x]);

    // Clear existing static engineering layer groups
    ['boundary', 'benches', 'faults', 'drifts', 'infrastructure'].forEach(name => {
      if (lg[name] && typeof lg[name].clearLayers === 'function') lg[name].clearLayers();
    });

    (engineeringLayers?.features || []).forEach(f => {
      const g = f?.geometry;
      const props = f?.properties || {};
      const layerName = props.layer;
      const prov = props.provenance || 'ENGINEERING CALCULATION';
      const name = props.name || props.id;
      const color = props.color || '#38bdf8';

      const tooltip = `<div class="font-mono text-xs bg-[#111827] text-slate-200 p-1.5 rounded shadow border border-slate-700"><strong style="color: ${color}">${name}</strong><div class="text-[10px] text-cyan-300">${prov}</div></div>`;

      if (g?.type === 'Polygon') {
        const ring = toLp(g.coordinates[0]);
        L.polygon(ring, {
          color, weight: 2.5, dashArray: '8, 4', fillColor: color, fillOpacity: 0.12
        }).addTo(lg[layerName === 'mine_boundary' ? 'boundary' : layerName] || lg.boundary).bindTooltip(tooltip, { sticky: true });
      } else if (g?.type === 'LineString') {
        L.polyline(toLp(g.coordinates), {
          color, weight: props.weight || 3, dashArray: props.dashArray || '6, 6', opacity: 0.9
        }).addTo(lg[layerName] || lg.boundary).bindTooltip(tooltip, { sticky: true });
      } else if (g?.type === 'Point') {
        const pt = toLp([g.coordinates]);
        L.circleMarker(pt[0], { radius: 6, color, fillColor: color, fillOpacity: 0.4, weight: 1.5 })
          .addTo(lg[layerName] || lg.infrastructure).bindTooltip(tooltip, { sticky: true });
      }
    });
  }, [engineeringLayers]);

  // Handle Basemap Switcher (Satellite vs Topo vs Terrain vs OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = basemapLayersRef.current;
    if (!map || !layers) return;

    Object.values(layers).forEach(layer => {
      if (layer) {
        map.removeLayer(layer);
      }
    });

    const activeLayer = layers[mapStyle];
    if (activeLayer) {
      activeLayer.addTo(map);
    }
  }, [mapStyle]);

  // Update Layers Visibility
  useEffect(() => {
    const lg = layerGroupsRef.current;
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.keys(layersVisible).forEach(key => {
      if (!lg[key]) return;
      if (layersVisible[key]) {
        if (!map.hasLayer(lg[key])) map.addLayer(lg[key]);
      } else {
        if (map.hasLayer(lg[key])) map.removeLayer(lg[key]);
      }
    });
  }, [layersVisible]);

  // Draw Dynamic Zones and InSAR Subsidence Heatmap
  useEffect(() => {
    const lg = layerGroupsRef.current.zones;
    const hm = layerGroupsRef.current.heatmap;
    if (!lg || !hm) return;

    lg.clearLayers();
    hm.clearLayers();

    // Zone polygons: LIVE BACKEND data (seeded PostGIS geometry via
    // /api/zones). Previously this iterated a frozen mockData constant, so
    // the map ignored zone changes and never showed API-driven state.
    // Provenance per zone is rendered explicitly — seeded geometry is never
    // presented as live survey data.
    (zones && zones.length ? zones : []).forEach(zone => {
      if (!zone.polygon || zone.polygon.length < 3) return;
      const zoneColor = zone.status === 'CRITICAL' ? '#ef4444'
        : zone.status === 'WARNING' ? '#f59e0b'
        : zone.status === 'CAUTION' ? '#eab308'
        : '#10b981';
      const prov = zone.provenance || { geometry: 'SEEDED DATABASE', status: 'SIMULATION' };
      const poly = L.polygon(zone.polygon.map(p => [p[1], p[0]]), {  // GeoJSON [lng,lat] -> Leaflet [lat,lng]
        color: zoneColor,
        weight: zone.status === 'CRITICAL' ? 3.5 : 2,
        fillColor: zoneColor,
        fillOpacity: zone.status === 'CRITICAL' ? 0.38 : 0.18,
        dashArray: zone.status === 'CRITICAL' ? '6, 4' : '4, 4'
      });

      poly.bindTooltip(`
        <div class="p-2.5 font-mono text-xs bg-[#111827] text-slate-200 rounded-lg shadow-xl border border-slate-700">
          <div class="font-bold uppercase mb-1 text-sm flex items-center gap-1.5" style="color: ${zoneColor}">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${zoneColor}"></span>
            ${zone.code}: ${zone.name}
          </div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1 border-t border-slate-700/60">
            <span class="text-slate-400">Risk Severity:</span>
            <strong class="text-right" style="color: ${zoneColor}">${zone.status} (${zone.risk_score}%)</strong>
            <span class="text-slate-400">Subsidence Rate:</span>
            <strong class="text-right text-slate-100">${zone.subsidence_rate} mm/day</strong>
            <span class="text-slate-400">Miners Deployed:</span>
            <strong class="text-right text-slate-100">${zone.active_workers} Miners</strong>
            <span class="text-slate-400">Borehole Sensors:</span>
            <strong class="text-right text-slate-100">${zone.active_sensors} Transducers</strong>
            <span class="text-slate-400">Geometry Source:</span>
            <strong class="text-right text-cyan-300">${prov.geometry}</strong>
            <span class="text-slate-400">Status Source:</span>
            <strong class="text-right text-cyan-300">${prov.status}</strong>
          </div>
        </div>
      `, { sticky: true });

      poly.addTo(lg);

      // InSAR Interferogram Deformation Fringes (SIMULATED — mock provider)
      if (zone.status === 'CRITICAL') {
        const center = [23.7758, 86.4155];
        [
          { r: 80, label: '-14.2 mm/day Peak Sag', color: '#dc2626', fill: 0.35 },
          { r: 160, label: '-9.8 mm/day Delamination', color: '#ea580c', fill: 0.22 },
          { r: 240, label: '-5.4 mm/day Tension Creep', color: '#d97706', fill: 0.15 },
          { r: 330, label: '-2.1 mm/day Elastic Boundary', color: '#ca8a04', fill: 0.08 }
        ].forEach((ring) => {
          L.circle(center, {
            radius: ring.r,
            color: ring.color,
            weight: 2,
            fillColor: ring.color,
            fillOpacity: ring.fill,
            dashArray: '3, 4'
          }).addTo(hm)
            .bindTooltip(`<div class="font-mono text-xs bg-[#111827] text-slate-200 p-1.5 rounded shadow border border-slate-700"><strong>🛰️ InSAR Fringe (SIMULATED - mock provider):</strong> <span style="color: ${ring.color}; font-weight: bold;">${ring.label}</span></div>`, { sticky: true });
        });
      }
    });
  }, [zones, evacuation]);

  // Draw Evacuation Routes & Blockades
  useEffect(() => {
    const lg = layerGroupsRef.current.routes;
    if (!lg) return;
    lg.clearLayers();

    if (!evacuation || !evacuation.routes) return;

    evacuation.routes.forEach(route => {
      const coords = route.coordinates || route.waypoints || [];
      const routeId = route.id || route.route_id;
      const isBlocked = route.status === 'BLOCKED';

      const poly = L.polyline(coords, {
        color: isBlocked ? '#dc2626' : '#16a34a',
        weight: isBlocked ? 4.5 : 5.5,
        opacity: 0.95,
        dashArray: isBlocked ? '8, 8' : '10, 8',
        className: isBlocked ? 'animated-dash-danger' : 'animated-dash-safe'
      });

      poly.bindTooltip(`
        <div class="p-2 font-mono text-xs bg-[#111827] text-slate-200 rounded-lg shadow-xl border border-slate-700">
          <div class="font-bold ${isBlocked ? 'text-red-400' : 'text-emerald-400'}">${route.name}</div>
          <div>Status: <strong class="text-slate-100">${route.status}</strong></div>
          ${route.block_reason ? `<div class="text-red-400">${route.block_reason}</div>` : (isBlocked ? '<div class="text-red-400">Route obstructed due to hazard</div>' : '<div class="text-emerald-400 font-bold">✓ Cleared Evacuation Corridor</div>')}
        </div>
      `, { sticky: true });

      poly.addTo(lg);

      // Blocked marker at route A midpoint
      if (isBlocked && coords.length > 1) {
        const blockIcon = L.divIcon({
          className: 'custom-block-icon',
          html: `
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-red-600 border-2 border-slate-900 shadow-xl animate-pulse">
              <span class="text-white font-extrabold text-xs">✕</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker(coords[1], { icon: blockIcon })
          .addTo(lg)
          .bindTooltip("<div class='font-mono font-bold text-xs text-red-400 bg-[#111827] p-2 rounded shadow-xl border border-red-500/40'>CRITICAL ROCKFALL: Roof Shear Delamination</div>", { sticky: true });
      }
    });
  }, [evacuation]);

  // Draw Infrastructure (Surface Substations, Refuge Chambers, Haul Roads)
  useEffect(() => {
    const lg = layerGroupsRef.current.infrastructure;
    if (!lg) return;
    lg.clearLayers();

    INFRASTRUCTURE_GEO.forEach(item => {
      if (item.type === 'Road' || item.type === 'Crack') {
        L.polyline(item.coords, {
          color: item.color,
          weight: item.type === 'Road' ? 3.5 : 2.5,
          dashArray: item.type === 'Crack' ? '4, 4' : null,
          opacity: 0.9
        }).addTo(lg).bindTooltip(`<div class="font-mono text-xs text-amber-300 bg-[#111827] p-1.5 rounded shadow border border-amber-500/40"><strong>${item.name}</strong> (${item.type})</div>`, { sticky: true });
      } else {
        const markerIcon = L.divIcon({
          className: 'infra-marker',
          html: `
            <div class="px-2 py-1 rounded bg-[#111827]/95 border-2 border-${item.type === 'Assembly' ? 'emerald-500' : 'amber-500'} text-[10px] font-mono font-extrabold text-slate-200 shadow-xl flex items-center gap-1.5 whitespace-nowrap">
              <span>${item.type === 'Assembly' ? '🚩' : '⚡'}</span>
              <span>${item.name}</span>
            </div>
          `,
          iconSize: [130, 26],
          iconAnchor: [65, 13]
        });
        L.marker(item.coords, { icon: markerIcon }).addTo(lg);
      }
    });
  }, []);

  // Draw Sensor Nodes (Borehole Rig Derricks & Extensometers)
  useEffect(() => {
    const lg = layerGroupsRef.current.sensors;
    if (!lg) return;
    lg.clearLayers();

    sensors.forEach(sensor => {
      const isCritical = sensor.status === 'CRITICAL';
      const isWarning = sensor.status === 'WARNING';
      const isCaution = sensor.status === 'CAUTION';
      const isOffline = sensor.status === 'OFFLINE';

      const color = isCritical ? '#dc2626' : (isWarning ? '#d97706' : (isCaution ? '#ca8a04' : (isOffline ? '#64748b' : '#16a34a')));
      const isSelected = selectedSensor?.id === sensor.id;

      const sensorHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isSelected ? `<div class="radar-beacon"></div>` : ''}
          ${isCritical ? `
            <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-red-500 opacity-75"></span>
            <span class="animate-pulse absolute inline-flex h-7 w-7 rounded-full bg-red-600/40"></span>
          ` : ''}
          <div class="relative flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-xl transition-transform hover:scale-125 bg-[#111827]"
               style="border-color: ${isSelected ? '#d97706' : color}; ${isSelected ? 'box-shadow: 0 0 16px #d97706;' : ''}">
            <span class="text-[10px] font-bold" style="color: ${color}">📡</span>
          </div>
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#111827] text-[9px] font-mono text-slate-200 border border-slate-700 shadow-md whitespace-nowrap pointer-events-none ${isSelected ? 'opacity-100 ring-2 ring-amber-500 font-extrabold text-amber-400' : 'opacity-0 group-hover:opacity-100'} transition-opacity">
            ${sensor.id}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-sensor-icon',
        html: sensorHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([sensor.lat, sensor.lng], { icon });

      marker.on('click', () => {
        selectSensorNode(sensor);
      });

      marker.bindTooltip(`
        <div class="p-2.5 font-mono text-xs bg-[#111827] text-slate-200 min-w-[220px] rounded-lg shadow-2xl border border-slate-700">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5">
            <span class="font-extrabold text-amber-400 flex items-center gap-1">
              <span>🏗️</span> ${sensor.id} (${sensor.name})
            </span>
            <span class="px-1.5 py-0.5 text-[10px] font-bold rounded" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40">
              ${sensor.status}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <span class="text-slate-400">Angular Tilt:</span>
            <span class="font-bold text-slate-100 text-right">${sensor.tilt}°</span>
            <span class="text-slate-400">Micro-Strain:</span>
            <span class="font-bold text-slate-100 text-right">${sensor.strain_ue} µε</span>
            <span class="text-slate-400">Displacement:</span>
            <span class="font-bold text-slate-100 text-right">${sensor.displacement_rate_mm_hr} mm/h</span>
            <span class="text-slate-400">Methane (CH4):</span>
            <span class="font-bold text-slate-100 text-right">${sensor.methane_pct}%</span>
            <span class="text-slate-400">Battery Level:</span>
            <span class="font-bold text-emerald-400 text-right">${sensor.battery}%</span>
          </div>
          <div class="mt-2 text-center text-[10px] text-cyan-400 font-bold bg-cyan-950/40 py-0.5 rounded border border-cyan-800/50">
            Click marker to inspect telemetry & AI diagnostics
          </div>
        </div>
      `, { sticky: true });

      marker.addTo(lg);
    });
  }, [sensors, selectedSensor, selectSensorNode]);

  // Fly to sensor on selection
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedSensor) return;
    if (selectedSensor.lat && selectedSensor.lng) {
      mapInstanceRef.current.flyTo([selectedSensor.lat, selectedSensor.lng], 16, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [selectedSensor]);

  // Fly to worker on selection / locate
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedWorker) return;
    if (selectedWorker.lat && selectedWorker.lng) {
      mapInstanceRef.current.flyTo([selectedWorker.lat, selectedWorker.lng], 17, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [selectedWorker]);

  // Draw Workers (Underground Personnel Tracking)
  useEffect(() => {
    const lg = layerGroupsRef.current.workers;
    if (!lg) return;
    lg.clearLayers();

    workers.forEach(w => {
      const isDanger = w.status === 'DANGER';
      const isCaution = w.status === 'CAUTION';
      const color = isDanger ? '#dc2626' : (isCaution ? '#d97706' : '#16a34a');
      const isSelected = selectedWorker && (selectedWorker.id === w.id || selectedWorker.code === w.code);

      const workerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isSelected ? `
            <div class="radar-beacon"></div>
            <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-cyan-400 opacity-90"></span>
            <span class="animate-pulse absolute inline-flex h-8 w-8 rounded-full bg-cyan-500/50"></span>
            <div class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#0B0F17] text-[10px] font-mono text-cyan-300 font-extrabold border border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.8)] whitespace-nowrap z-50 flex items-center gap-1 animate-bounce">
              <span>📍 ${w.name} (${w.code})</span>
            </div>
          ` : ''}
          ${isDanger && !isSelected ? `<span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-500 opacity-80"></span>` : ''}
          <div class="relative flex items-center justify-center rounded-full border-2 border-slate-900 shadow-xl transition-transform hover:scale-125 ${
            isSelected ? 'w-6 h-6 ring-4 ring-cyan-400/80' : 'w-4 h-4'
          }" style="background-color: ${isSelected ? '#06b6d4' : color}; ${isSelected ? 'box-shadow: 0 0 16px #06b6d4;' : ''}">
            <span class="${isSelected ? 'text-[10px]' : 'text-[8px]'} font-bold text-white">👷</span>
          </div>
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#111827] text-[9px] font-mono text-slate-200 border border-slate-700 shadow-md whitespace-nowrap pointer-events-none ${
            isSelected ? 'opacity-100 ring-2 ring-cyan-400 font-extrabold text-cyan-300' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity">
            ${w.code}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-worker-icon',
        html: workerHtml,
        iconSize: isSelected ? [28, 28] : [16, 16],
        iconAnchor: isSelected ? [14, 14] : [8, 8]
      });

      const marker = L.marker([w.lat, w.lng], { 
        icon,
        zIndexOffset: isSelected ? 1000 : 100
      });

      marker.on('click', () => {
        selectWorkerNode(w);
      });

      marker.bindTooltip(`
        <div class="p-2 font-mono text-xs bg-[#111827] text-slate-200 rounded-lg shadow-xl border border-slate-700">
          <div class="font-bold text-slate-100 flex items-center gap-1">
            <span>👷</span> ${w.code} &bull; ${w.name}
          </div>
          <div class="text-[11px] text-slate-400">Location: <strong class="text-slate-200">${w.zone}</strong></div>
          <div class="text-[11px] font-bold" style="color: ${color}">Biotelemetry Status: ${w.status}</div>
          <div class="text-[10px] text-slate-400">Pulse: ${w.heart_rate} bpm | SpO2: ${w.spo2}% | Strata Depth: ${w.depth_m}m</div>
          <div class="mt-1 text-center text-[10px] text-cyan-400 font-bold bg-cyan-950/40 py-0.5 rounded border border-cyan-800/50">
            Nearest Exit: ${w.zone === 'Zone B' ? 'Route B (East Drift)' : 'Route 1 (Main Incline)'}
          </div>
        </div>
      `, { sticky: true });

      marker.addTo(lg);

      if (isSelected) {
        setTimeout(() => {
          marker.openTooltip();
        }, 300);
      }
    });
  }, [workers, selectedWorker, selectWorkerNode]);

  // Handle map controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetCenter = () => mapInstanceRef.current?.setView(MINE_CENTER, 15);

  const toggleLayer = (key) => {
    setLayersVisible(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Zoom to selected zone if selectedZone changes
  useEffect(() => {
    if (selectedZone && mapInstanceRef.current && zones) {
      const zone = zones.find(z => z.code === selectedZone || z.name === selectedZone);
      if (zone && zone.polygon) {
        const poly = L.polygon(zone.polygon);
        
        // Wait for Leaflet container to fully render layout before calculating bounds
        setTimeout(() => {
          if (!mapInstanceRef.current) return;
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 17, animate: true, duration: 1 });
          
          // Drop a temporary ping to "mention the issue"
          const center = poly.getBounds().getCenter();
          const popup = L.popup({ closeOnClick: false, autoClose: false, className: 'bg-[#111827] text-white border-red-500' })
            .setLatLng(center)
            .setContent(`<div class="p-1 font-bold text-red-400 font-mono text-sm tracking-wider">🚨 ALERT FOCUS: ${zone.code}</div><div class="text-[10px] text-slate-300 font-mono">Review sensors in this zone.</div>`)
            .openOn(mapInstanceRef.current);
            
          // Auto-close after 8 seconds
          setTimeout(() => {
             if (mapInstanceRef.current) mapInstanceRef.current.closePopup(popup);
          }, 8000);
        }, 300);
      }
    }
  }, [selectedZone, zones]);

  return (
    <div className={`relative isolate z-0 rounded-xl border border-slate-700 bg-[#0B0F17] overflow-hidden transition-all duration-300 shadow-xl ${
      isFullscreen ? 'fixed inset-4 z-[990] shadow-2xl' : 'h-[560px] xl:h-[640px]'
    }`}>
      {/* Top Mining GIS Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-[50] flex flex-wrap items-center justify-between p-3 bg-gradient-to-b from-slate-950/95 via-slate-900/85 to-transparent pointer-events-none border-b border-slate-700/60 font-mono text-white">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
            <h2 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#F8FAFC] uppercase font-sans flex items-center gap-1.5">
              <span>GEOTECHNICAL GIS MINING COMMAND MAP</span>
            </h2>
            <span className="px-2 py-0.5 text-[9px] font-mono rounded-md bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40 font-bold">
              JHARIA OPEN-CAST & PANEL 17-B
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            High-Res Satellite Pit &bull; Geotechnical Faults F1/F3 &bull; InSAR Subsidence Contours &bull; Real-Time IoT Telemetry
          </p>
        </div>

        {/* Floating Controls Bar: Basemap Toggle, 3D TWIN VIEW, Zoom, Layers */}
        <div className="flex items-center gap-1.5 pointer-events-auto mt-2 sm:mt-0 font-mono text-xs">
          
          {/* Basemap Switcher */}
          <div className="flex items-center bg-slate-900/95 border border-slate-700 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => setMapStyle('satellite')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all font-bold cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-[#06B6D4] text-[#0B0F17] font-extrabold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Real Satellite Pit Imagery"
            >
              <Satellite className="w-3 h-3" />
              <span>Satellite</span>
            </button>
            <button
              onClick={() => setMapStyle('topo')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all font-bold cursor-pointer ${
                mapStyle === 'topo' ? 'bg-[#06B6D4] text-[#0B0F17] font-extrabold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Geological Strata Topographic"
            >
              <Mountain className="w-3 h-3" />
              <span>Topo</span>
            </button>
            <button
              onClick={() => setMapStyle('terrain')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all font-bold cursor-pointer ${
                mapStyle === 'terrain' ? 'bg-[#06B6D4] text-[#0B0F17] font-extrabold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Tactical Dark Basemap (Clean GIS, No API Key)"
            >
              <Activity className="w-3 h-3" />
              <span>Dark GIS</span>
            </button>
            <button
              onClick={() => setMapStyle('osm')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all font-bold cursor-pointer ${
                mapStyle === 'osm' ? 'bg-[#06B6D4] text-[#0B0F17] font-extrabold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Street Base"
            >
              <MapIcon className="w-3 h-3" />
              <span>Street</span>
            </button>
          </div>

          {/* 3D Twin View Button */}
          <button
            onClick={onOpenDigitalTwin}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F17] transition-all text-[10px] font-extrabold shadow-md cursor-pointer"
            title="Switch to 3D Digital Twin View"
          >
            <Navigation className="w-3 h-3" />
            <span>3D TWIN</span>
          </button>

          {/* Layer Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-[10px] shadow-sm cursor-pointer"
              title="Filter Map Layers"
            >
              <Layers className="w-3 h-3 text-[#F59E0B]" />
              <span>LAYERS</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs font-mono space-y-1.5 text-slate-200">
                <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between text-[10px]">
                  <span>MINING GIS LAYERS</span>
                  <span className="text-sky-400 font-bold">10 ACTIVE</span>
                </div>
                {[
                  { key: 'benches', label: 'Pit Benches & Terraces', color: '#0284c7' },
                  { key: 'faults', label: 'Geological Faults (F1/F3)', color: '#dc2626' },
                  { key: 'drifts', label: 'Haulage & Intake Tunnels', color: '#16a34a' },
                  { key: 'heatmap', label: 'InSAR Subsidence Fringes', color: '#ea580c' },
                  { key: 'zones', label: 'Panel Sectors (A, B, C, D)', color: '#d97706' },
                  { key: 'sensors', label: 'Borehole Nodes (MG-01..04)', color: '#38bdf8' },
                  { key: 'workers', label: 'Underground Miners (126)', color: '#22c55e' },
                  { key: 'routes', label: 'Evacuation Corridors', color: '#10b981' },
                  { key: 'infrastructure', label: 'Substations & Assembly', color: '#f59e0b' },
                  { key: 'grid', label: '100m Mine Survey Grid', color: '#94a3b8' }
                ].map(item => (
                  <div
                    key={item.key}
                    onClick={() => toggleLayer(item.key)}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px]">{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold ${layersVisible[item.key] ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {layersVisible[item.key] ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Right Side Top Corner Direction Symbol (N, S, W, E Compass Rosette) */}
      <div 
        onClick={handleResetCenter}
        className="absolute top-16 right-4 z-[25] cursor-pointer group select-none pointer-events-auto"
        title="True North Navigation Compass — Click to align to North"
      >
        <div className="relative w-14 h-14 rounded-full bg-[#111827]/90 backdrop-blur-md border border-slate-700/90 shadow-2xl flex items-center justify-center p-1 group-hover:border-[#06B6D4] transition-all">
          {/* Outer Compass Dial Ring */}
          <div className="absolute inset-1 rounded-full border border-dashed border-slate-600/70 pointer-events-none" />
          
          {/* N Indicator (Top) */}
          <span className="absolute top-1 text-[10px] font-black text-red-400 font-mono tracking-tighter">
            N
          </span>
          {/* S Indicator (Bottom) */}
          <span className="absolute bottom-1 text-[9px] font-bold text-slate-400 font-mono">
            S
          </span>
          {/* W Indicator (Left) */}
          <span className="absolute left-1.5 text-[9px] font-bold text-slate-400 font-mono">
            W
          </span>
          {/* E Indicator (Right) */}
          <span className="absolute right-1.5 text-[9px] font-bold text-slate-400 font-mono">
            E
          </span>

          {/* Central Compass Needle */}
          <svg className="w-6 h-6 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)] transform group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 15,12 12,10 9,12" fill="#EF4444" />
            <polygon points="12,22 15,12 12,14 9,12" fill="#64748B" />
            <circle cx="12" cy="12" r="2" fill="#F8FAFC" />
          </svg>
        </div>
      </div>

      {/* Right Side Center Zoom In & Zoom Out Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[25] flex flex-col gap-2 pointer-events-auto select-none">
        <div className="bg-[#111827]/90 backdrop-blur-md border border-slate-700/90 rounded-xl p-1 shadow-2xl flex flex-col gap-1">
          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-lg bg-[#162235] hover:bg-[#06B6D4] hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-[#06B6D4] transition-all flex items-center justify-center font-black text-lg cursor-pointer shadow-md active:scale-95"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-slate-800 my-0.5" />

          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-lg bg-[#162235] hover:bg-[#06B6D4] hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-[#06B6D4] transition-all flex items-center justify-center font-black text-lg cursor-pointer shadow-md active:scale-95"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-slate-800 my-0.5" />

          {/* Reset Center Button */}
          <button
            onClick={handleResetCenter}
            className="w-9 h-9 rounded-lg bg-[#162235] hover:bg-[#06B6D4] hover:text-slate-950 text-cyan-400 border border-slate-700 hover:border-[#06B6D4] transition-all flex items-center justify-center text-xs cursor-pointer shadow-md active:scale-95"
            title="Reset Colliery Center View"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaflet DOM Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full relative isolate z-0 bg-slate-900" />

      {/* Bottom Real-Time GIS Telemetry & Cursor Coordinates HUD */}
      <div className="absolute bottom-2 left-3 z-[10] hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300 shadow-xl pointer-events-none backdrop-blur">
        <div className="flex items-center gap-1.5 text-sky-300 font-bold">
          <Crosshair className="w-3 h-3 text-sky-400" />
          <span>WGS84: {cursorGeo.lat}°N, {cursorGeo.lng}°E</span>
        </div>
        <div className="border-l border-slate-700 pl-2 text-slate-300">
          <span>UTM: {cursorGeo.utmE}, {cursorGeo.utmN}</span>
        </div>
        <div className="border-l border-slate-700 pl-2 text-emerald-400 font-semibold">
          <span>Elev: {cursorGeo.elevation}</span>
        </div>
        <div className="border-l border-slate-700 pl-2 text-amber-300">
          <span>{cursorGeo.seam}</span>
        </div>
      </div>

      {/* Bottom Right GIS Legend Badges */}
      <div className="absolute bottom-2 right-16 z-[10] hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-[9px] font-mono text-slate-300 shadow-xl pointer-events-none backdrop-blur">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Pit Benches</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Fault F1</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>SIMULATED InSAR Fringes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Escape Route</span>
        </div>
      </div>
    </div>
  );
}

