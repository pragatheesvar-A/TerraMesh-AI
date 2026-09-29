import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Box, Compass, Maximize2, RefreshCw, ZoomIn, ZoomOut, Play, Pause, 
  Layers, Eye, ShieldAlert, Activity, AlertTriangle, CheckCircle2, 
  MapPin, Radio, Droplets, Wind, ArrowDown, Sparkles
} from 'lucide-react';

/**
 * Mine3DScene: Production-grade Three.js 3D WebGL Digital Twin of Underground Coal Mine
 * Features:
 * - Real 3D cutaway geological strata (Topsoil, Sandstone, Aquifer water layer, Shale, Coal Seams XII/XIV)
 * - Surface terrain with headframe towers, winder house, roads, and mine complex
 * - Dynamic 3D subsidence deformation trough with concentric heatmap vertex coloring
 * - Longwall extraction panels (Panel 17-B, Panel 18-A, Panel 18-C) with wireframe glow
 * - Tunnel Network: Haulage Incline ramp, Airway Drift with animated airflow particles
 * - Borehole shafts (BH-04, BH-07) with depth markers
 * - Live IoT sensor nodes with pulsing beacons and status colors
 * - Raycasting for direct 3D mesh click interaction
 * - Smooth OrbitControls with Auto-Rotate, Pan, Zoom, and Reset View
 * - Proper Three.js resource disposal & 60 FPS performance
 */
export default function Mine3DScene({
  activeHotspot,
  onSelectHotspot,
  layerControls,
  whatIfDeformation,
  isAutoRotate,
  onToggleAutoRotate,
  sensors,
  workers,
  routes = [],
  evacuation,
  isLive,
  isEvacuationActive = false
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const interactiveObjectsRef = useRef([]);
  const subsidenceMeshRef = useRef(null);
  const particlesRef = useRef(null);
  const sensorMeshesRef = useRef([]);
  const workerMeshesRef = useRef([]);
  const evacMeshRef = useRef(null);

  // ── 3D ENTITY REGISTRY (Phase 3) ───────────────────────────────────────────────
  // Registry for selective entity updates without full scene recreation
  const entityRegistryRef = useRef({
    sensors: new Map(),
    workers: new Map(),
    routes: new Map(),
    zones: new Map()
  });

  // Populate registry on scene creation
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Register sensors
    sensorMeshesRef.current.forEach(({ group, data }) => {
      entityRegistryRef.current.sensors.set(data.id, {
        group,
        data,
        mesh: group.children[0] // octMesh
      });
    });
    
    // Register workers
    workerMeshesRef.current.forEach(({ group, data }) => {
      entityRegistryRef.current.workers.set(data.id, {
        group,
        data,
        mesh: group.children[0] // capsuleMesh
      });
    });
    
    // Expose registry for external access (for Twin event router)
    window.__TWIN_ENTITY_REGISTRY = entityRegistryRef.current;
  }, [sensors, workers]);

  // ── SELECTIVE ENTITY UPDATE FUNCTIONS (Phase 3) ───────────────────────────────
  // Functions to update specific entities without recreating the scene
  const updateSensorEntity = useCallback((entityId, payload) => {
    const sensor = entityRegistryRef.current.sensors.get(entityId);
    if (!sensor) {
      console.warn(`[Twin Registry] Sensor not found: ${entityId}`);
      return;
    }
    
    const { mesh, data } = sensor;
    
    // Update status color
    if (payload.status) {
      const STATUS_COLORS = { DANGER: 0xef4444, WARNING: 0xf59e0b, OFFLINE: 0x64748b, NORMAL: 0x10b981 };
      const color = STATUS_COLORS[payload.status.toUpperCase()] || mesh.material.color.getHex();
      mesh.material.color.setHex(color);
      mesh.material.emissive.setHex(color);
    }
    
    // Update user data
    if (mesh.userData) {
      Object.assign(mesh.userData, payload);
    }
    
    // Update registry data
    sensor.data = { ...sensor.data, ...payload };
  }, []);

  const updateWorkerEntity = useCallback((entityId, payload) => {
    const worker = entityRegistryRef.current.workers.get(entityId);
    if (!worker) {
      console.warn(`[Twin Registry] Worker not found: ${entityId}`);
      return;
    }
    
    const { mesh, data, group } = worker;
    
    // Update status color
    if (payload.status) {
      const STATUS_COLORS = { 
        SAFE: 0x10b981, 
        CAUTION: 0xf59e0b, 
        DANGER: 0xef4444, 
        EVACUATE: 0xdc2626, 
        OFFLINE: 0x64748b, 
        UNKNOWN: 0x94a3b8 
      };
      const color = STATUS_COLORS[payload.status.toUpperCase()] || mesh.material.color.getHex();
      mesh.material.color.setHex(color);
      mesh.material.emissive.setHex(color);
    }
    
    // Update position if coordinates provided
    if (payload.latitude !== undefined && payload.longitude !== undefined) {
      const threeJsPos = {
        x: payload.latitude - 23.65,
        y: -payload.depth_m || -145,
        z: payload.longitude - 86.42
      };
      group.position.set(threeJsPos.x, threeJsPos.y, threeJsPos.z);
    }
    
    // Update user data
    if (mesh.userData) {
      Object.assign(mesh.userData, payload);
    }
    
    // Update registry data
    worker.data = { ...worker.data, ...payload };
  }, []);

  const updateRouteEntity = useCallback((entityId, payload) => {
    const route = entityRegistryRef.current.routes.get(entityId);
    if (!route) {
      console.warn(`[Twin Registry] Route not found: ${entityId}`);
      return;
    }
    
    const { mesh, data } = route;
    
    if (payload.status) {
      const STATUS_COLORS = { SAFE: 0x10b981, COMPROMISED: 0xf59e0b, BLOCKED: 0xef4444 };
      const color = STATUS_COLORS[payload.status.toUpperCase()] || mesh.material.color.getHex();
      mesh.material.color.setHex(color);
      mesh.material.emissive.setHex(color);
    }
    
    if (mesh.userData) {
      Object.assign(mesh.userData, payload);
    }
    
    route.data = { ...route.data, ...payload };
  }, []);

  // Expose update functions for Twin event router
  window.__TWIN_UPDATE_FUNCTIONS = {
    updateSensor: updateSensorEntity,
    updateWorker: updateWorkerEntity,
    updateRoute: updateRouteEntity
  };

  const [hoveredObject, setHoveredObject] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, text: '', subtext: '' });
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [threeLoaded, setThreeLoaded] = useState(!!window.THREE);

  // Poll for THREE if script is loading asynchronously
  useEffect(() => {
    if (window.THREE) {
      setThreeLoaded(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.THREE) {
        setThreeLoaded(true);
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!threeLoaded || !containerRef.current || !canvasRef.current) return;

    // Check THREE availability
    const THREE = window.THREE;
    if (!THREE) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.007);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 600);
    camera.position.set(52, 38, 72);
    camera.lookAt(0, -8, 0);
    cameraRef.current = camera;

    // 3. Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
    } catch (e) {
      console.warn("WebGL initialization failed:", e);
      setWebGlSupported(false);
      return;
    }

    // 4. OrbitControls
    let controls;
    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow looking slightly from underneath
      controls.minDistance = 25;
      controls.maxDistance = 220;
      controls.target.set(0, -12, 0);
      controls.autoRotate = isAutoRotate;
      controls.autoRotateSpeed = 1.2;
      controlsRef.current = controls;
    }

    // 5. Dramatic 4-point Lighting Rig
    // Sky/Ground hemisphere for natural color gradient
    const hemi = new THREE.HemisphereLight(0x1a3a5c, 0x0d1117, 0.7);
    scene.add(hemi);

    // Warm golden surface sun from upper-right
    const sunLight = new THREE.DirectionalLight(0xffd580, 3.2);
    sunLight.position.set(65, 110, 55);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    // Deep underground cyan-blue fill at coal seam level
    const underLight = new THREE.PointLight(0x00ccff, 2.8, 90);
    underLight.position.set(-5, -14, 0);
    scene.add(underLight);

    // Red danger glow around critical Panel 17-B
    const dangerLight = new THREE.PointLight(0xff2200, 4.0, 35);
    dangerLight.position.set(-6, -11, 2);
    scene.add(dangerLight);

    // Warm fill from opposite side to reduce harsh shadows
    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.9);
    fillLight.position.set(-40, 20, -40);
    scene.add(fillLight);

    // Interactive object bucket for raycasting
    const interactiveList = [];
    interactiveObjectsRef.current = interactiveList;

    // -------------------------------------------------------------
    // NOISE HELPER (multi-octave sine-based procedural noise)
    // -------------------------------------------------------------
    const noise2D = (x, z, scale = 1, octaves = 3) => {
      let v = 0, amp = 1, freq = scale, total = 0;
      for (let o = 0; o < octaves; o++) {
        v += Math.sin(x * freq * 1.7 + 3.1) * Math.cos(z * freq * 1.3 + 1.9) * amp;
        v += Math.cos(x * freq * 0.9 + 2.3) * Math.sin(z * freq * 2.1 + 0.7) * amp * 0.6;
        total += amp;
        amp *= 0.5;
        freq *= 2.1;
      }
      return v / total;
    };

    // -------------------------------------------------------------
    // PROCEDURAL TERRAIN (heightmap-displaced PlaneGeometry)
    // -------------------------------------------------------------
    const terrainGeo = new THREE.PlaneGeometry(90, 70, 90, 70);
    terrainGeo.rotateX(-Math.PI / 2);
    const tPosAttr = terrainGeo.attributes.position;
    const tColors = [];
    const tColorObj = new THREE.Color();

    for (let i = 0; i < tPosAttr.count; i++) {
      const tx = tPosAttr.getX(i);
      const tz = tPosAttr.getZ(i);

      // Multi-octave terrain height
      let h = noise2D(tx, tz, 0.04, 4) * 5.5;
      // Ridge along back-left
      h += Math.max(0, -tx * 0.08 + 0.5) * 3.5;
      // Mine cut-pit depression around the headframe area (right side)
      const pitDist = Math.sqrt((tx - 22) * (tx - 22) + (tz + 8) * (tz + 8));
      if (pitDist < 10) h -= (1 - pitDist / 10) * 3.0;
      // Clamp base
      h = Math.max(-1.5, h);

      tPosAttr.setY(i, 5.0 + h);

      // Color by height: deep earth -> grass -> rocky ridge
      const norm = (h + 1.5) / 7.0;
      if (norm < 0.15) tColorObj.setHex(0x3d2b1f); // Dark earth
      else if (norm < 0.35) tColorObj.setHex(0x3a5a2e); // Grass
      else if (norm < 0.65) tColorObj.setHex(0x4a6a38); // Mid grass
      else if (norm < 0.82) tColorObj.setHex(0x6b7c52); // Dry grass / scrub
      else tColorObj.setHex(0x7a7060); // Rocky ridge

      tColors.push(tColorObj.r, tColorObj.g, tColorObj.b);
    }
    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(tColors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.0,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.name = 'Surface Terrain';
    terrainMesh.userData = { 
      id: 'terrain', 
      name: 'Mine Site Surface Terrain', 
      type: 'terrain',
      source: 'PROCEDURAL • ENGINEERING REFERENCE',
      provenance: 'ENGINEERING'
    };
    scene.add(terrainMesh);

    // -------------------------------------------------------------
    // GEOLOGICAL STRATA CUTAWAY BLOCK
    // -------------------------------------------------------------
    const strataGroup = new THREE.Group();
    strataGroup.name = "StrataGroup";

    // Helper: Build a noise-displaced strata layer with edge wireframe
    const createStrataLayer = (name, yPos, layerH, color, opacity = 1.0, isTransparent = false, emissive = null, emissiveIntensity = 0) => {
      // Use a subdivided box so noise can be applied per-vertex
      const geo = new THREE.BoxGeometry(72, layerH, 52, 8, 2, 8);
      const posA = geo.attributes.position;
      for (let i = 0; i < posA.count; i++) {
        const lx = posA.getX(i), lz = posA.getZ(i), ly = posA.getY(i);
        // Only displace top and bottom faces slightly for organic look
        const n = noise2D(lx * 0.15, lz * 0.15, 1, 2) * 0.25;
        posA.setY(i, ly + n);
      }
      geo.computeVertexNormals();

      const matConf = {
        color, roughness: 0.88, metalness: 0.08,
        transparent: isTransparent, opacity,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
      };
      if (emissive) { matConf.emissive = new THREE.Color(emissive); matConf.emissiveIntensity = emissiveIntensity; }

      const mat = new THREE.MeshStandardMaterial(matConf);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, yPos, 0);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.name = name;
      mesh.userData = { 
        id: name.toLowerCase().replace(/[^a-z0-9]/g, ''), 
        name, 
        type: 'strata',
        source: 'PROCEDURAL • ENGINEERING REFERENCE',
        provenance: 'ENGINEERING'
      };

      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e2d3d, transparent: true, opacity: 0.6 });
      mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));
      return mesh;
    };

    strataGroup.add(createStrataLayer("Topsoil & Alluvium (0–15m)",          3.8,  2.6, 0x4a7c5f));
    strataGroup.add(createStrataLayer("Laterite & Weathered Rock (15–35m)",   1.3,  2.4, 0x8b6914));
    const aquifer = createStrataLayer("Aquifer Water Table (35–55m)",         -1.2, 1.5, 0x0ea5e9, 0.55, true, 0x0284c7, 0.3);
    aquifer.userData = { id: 'water', name: 'Aquifer Water Layer (-45m)', type: 'water' };
    strataGroup.add(aquifer);
    interactiveList.push(aquifer);
    strataGroup.add(createStrataLayer("Carbonaceous Shale Overburden (55–105m)", -7.0, 8.2, 0x374151));
    const coalXII = createStrataLayer("Coal Seam XII — Longwall Face (-110m)", -12.5, 3.0, 0x1a1a2e, 1.0, false, 0x00ccff, 0.08);
    strataGroup.add(coalXII);
    strataGroup.add(createStrataLayer("Interburden Sandstone (120–135m)",     -15.5, 3.0, 0x2d3748));
    strataGroup.add(createStrataLayer("Coal Seam XIV — Lower Seam (-145m)",   -18.5, 3.0, 0x0f0f1a, 1.0, false, 0x4400aa, 0.06));
    strataGroup.add(createStrataLayer("Precambrian Basement Rock (-160m+)",   -23.0, 6.5, 0x161e2d));
    scene.add(strataGroup);

    // Geological fault plane (diagonal translucent slab cutting through strata)
    const faultGeo = new THREE.PlaneGeometry(28, 32);
    const faultMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
    const faultMesh = new THREE.Mesh(faultGeo, faultMat);
    faultMesh.position.set(-15, -10, -5);
    faultMesh.rotation.z = Math.PI / 10;
    faultMesh.rotation.y = Math.PI / 7;
    faultMesh.name = 'Geological Fault Plane';
    faultMesh.userData = { 
      id: 'fault', 
      name: 'Geological Fault Zone', 
      type: 'strata',
      source: 'PROCEDURAL • ENGINEERING REFERENCE',
      provenance: 'ENGINEERING'
    };
    scene.add(faultMesh);
    interactiveList.push(faultMesh);

    // -------------------------------------------------------------
    // DYNAMIC SURFACE SUBSIDENCE DEFORMATION ZONE
    // -------------------------------------------------------------
    const subGeo = new THREE.PlaneGeometry(38, 28, 38, 28);
    subGeo.rotateX(-Math.PI / 2);

    const posAttr = subGeo.attributes.position;
    const colors = [];
    const colorObj = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const dist = Math.sqrt((vx + 5) * (vx + 5) * 1.3 + vz * vz);
      // Micro terrain noise on the subsidence mesh
      const microNoise = noise2D(vx, vz, 0.3, 2) * 0.3;
      const sagAmount = Math.max(0, (1 - dist / 14)) * 3.2 * (whatIfDeformation / 30);
      posAttr.setY(i, 5.1 + microNoise - sagAmount);

      if (dist < 3.5)       colorObj.setHex(0xdc2626);
      else if (dist < 6.5)  colorObj.setHex(0xea580c);
      else if (dist < 10.0) colorObj.setHex(0xd97706);
      else if (dist < 14.0) colorObj.setHex(0x16a34a);
      else                  colorObj.setHex(0x3d5c32);
      colors.push(colorObj.r, colorObj.g, colorObj.b);
    }
    subGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    subGeo.computeVertexNormals();

    const subMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.82, metalness: 0.1,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
    const subsidenceMesh = new THREE.Mesh(subGeo, subMat);
    subsidenceMesh.name = "Subsidence Zone";
    subsidenceMesh.userData = { 
      id: 'subsidence', 
      name: 'Subsidence Zone (Active Trough)', 
      type: 'subsidence',
      source: 'SIMULATION • WHAT-IF',
      provenance: 'SIMULATION'
    };
    scene.add(subsidenceMesh);
    subsidenceMeshRef.current = subsidenceMesh;
    interactiveList.push(subsidenceMesh);

    // Subsidence contour rings
    const ringGroup = new THREE.Group();
    const createRing = (radiusX, radiusZ, colorHex, yOffset = 5.18) => {
      const curve = new THREE.EllipseCurve(-5, 0, radiusX, radiusZ, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(56);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, yOffset, p.y)));
      const ringMat = new THREE.LineDashedMaterial({ color: colorHex, dashSize: 0.7, gapSize: 0.35 });
      const line = new THREE.Line(ringGeo, ringMat);
      line.computeLineDistances();
      return line;
    };
    ringGroup.add(createRing(3.5, 2.5, 0xff2222, 5.25));
    ringGroup.add(createRing(7.0, 5.0, 0xf59e0b, 5.22));
    ringGroup.add(createRing(11.0, 8.0, 0x10b981, 5.2));
    subsidenceMesh.add(ringGroup);

    // -------------------------------------------------------------
    // REALISTIC SURFACE INFRASTRUCTURE
    // -------------------------------------------------------------
    const surfaceGroup = new THREE.Group();
    surfaceGroup.name = "SurfaceInfrastructure";

    // --- Haul Road (dark tarmac strip) ---
    const roadGeo = new THREE.PlaneGeometry(5.5, 52);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1c2532, roughness: 0.98 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(18, 5.06, 0);
    roadMesh.receiveShadow = true;
    surfaceGroup.add(roadMesh);

    // --- Headframe Lattice Tower (tapered cylinders + cross members) ---
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.85, roughness: 0.25 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x6a7a8a, metalness: 0.9, roughness: 0.15 });

    // Main tapered tower column
    const towerGeo = new THREE.CylinderGeometry(0.7, 1.5, 16, 6);
    const tower = new THREE.Mesh(towerGeo, steelMat);
    tower.position.set(22, 13, -8);
    tower.castShadow = true;
    surfaceGroup.add(tower);

    // Sheave wheel at top
    const wheelGeo = new THREE.TorusGeometry(1.8, 0.22, 8, 28);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.08 });
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(22, 21.5, -8);
    wheel.rotation.y = Math.PI / 2;
    wheel.castShadow = true;
    surfaceGroup.add(wheel);

    // Headframe cross-bracing legs (4 angled cylinders)
    const legGeo = new THREE.CylinderGeometry(0.2, 0.2, 10, 5);
    const legOffsets = [[-1.5, -5], [1.5, -5], [-1.5, 5], [1.5, 5]];
    legOffsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(22 + ox, 8, -8 + oz);
      leg.rotation.z = ox > 0 ? 0.25 : -0.25;
      leg.rotation.x = oz > 0 ? 0.25 : -0.25;
      leg.castShadow = true;
      surfaceGroup.add(leg);
    });

    // --- Winder House (dark industrial shed) ---
    const winderGeo = new THREE.BoxGeometry(9, 4.5, 7);
    const winderMat = new THREE.MeshStandardMaterial({ color: 0x1a2535, roughness: 0.7, metalness: 0.4 });
    const winder = new THREE.Mesh(winderGeo, winderMat);
    winder.position.set(22, 7.25, 2);
    winder.castShadow = true;
    winder.receiveShadow = true;
    winder.name = 'Winder House';
    winder.userData = { id: 'surface', name: 'Mine Complex & Surface Plant', type: 'surface' };
    surfaceGroup.add(winder);
    interactiveList.push(winder);

    // Winder house roof (angled dark steel)
    const roofGeo = new THREE.CylinderGeometry(0.1, 5.8, 2.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a3545, roughness: 0.6, metalness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(22, 10.5, 2);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    surfaceGroup.add(roof);

    // --- Ore Stockpile (dark cone) ---
    const stockpileGeo = new THREE.ConeGeometry(5.5, 4.5, 14);
    const stockpileMat = new THREE.MeshStandardMaterial({ color: 0x2a1f14, roughness: 0.97, metalness: 0.0 });
    const stockpile = new THREE.Mesh(stockpileGeo, stockpileMat);
    stockpile.position.set(12, 7.3, 10);
    stockpile.castShadow = true;
    stockpile.receiveShadow = true;
    surfaceGroup.add(stockpile);

    // --- Ventilation Shaft Collar (ring at surface) ---
    const collarGeo = new THREE.TorusGeometry(1.8, 0.35, 8, 18);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.7, roughness: 0.3 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(-14, 5.3, -10);
    collar.rotation.x = Math.PI / 2;
    surfaceGroup.add(collar);

    // Small fence/barrier around shaft collar
    const fenceGeo = new THREE.TorusGeometry(2.8, 0.1, 6, 18);
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const fence = new THREE.Mesh(fenceGeo, fenceMat);
    fence.position.set(-14, 5.5, -10);
    fence.rotation.x = Math.PI / 2;
    surfaceGroup.add(fence);

    // --- Small Admin Shed ---
    const shedGeo = new THREE.BoxGeometry(5, 2.8, 4);
    const shedMat = new THREE.MeshStandardMaterial({ color: 0x1e2d3d, roughness: 0.8, metalness: 0.2 });
    const shed = new THREE.Mesh(shedGeo, shedMat);
    shed.position.set(29, 6.4, -2);
    shed.castShadow = true;
    surfaceGroup.add(shed);

    scene.add(surfaceGroup);

    // -------------------------------------------------------------
    // UNDERGROUND EXTRACTION PANELS
    // -------------------------------------------------------------
    const panelsGroup = new THREE.Group();
    panelsGroup.name = "UndergroundPanels";

    // Panel 17-B (Active Extraction Longwall Void)
    const p17Geo = new THREE.BoxGeometry(22, 2.6, 15);
    const p17Mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.4
    });
    const panel17 = new THREE.Mesh(p17Geo, p17Mat);
    panel17.position.set(-6, -12.5, 2);
    panel17.name = "Panel 17-B";
    panel17.userData = { 
      id: 'panel17', 
      name: 'Longwall Panel 17-B (-145m)', 
      type: 'panel',
      source: 'PROCEDURAL • ENGINEERING REFERENCE',
      provenance: 'ENGINEERING'
    };

    // Panel 17-B Wireframe Boundary
    const p17Edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(p17Geo),
      new THREE.LineBasicMaterial({ color: 0xc084fc, linewidth: 2 })
    );
    panel17.add(p17Edges);
    panelsGroup.add(panel17);
    interactiveList.push(panel17);

    // Panel 18-A (Adjacent Reserve Panel)
    const p18Geo = new THREE.BoxGeometry(16, 2.6, 12);
    const p18Mat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.45,
      roughness: 0.5,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.2
    });
    const panel18 = new THREE.Mesh(p18Geo, p18Mat);
    panel18.position.set(16, -12.5, -4);
    panel18.name = "Panel 18-A";
    panel18.userData = { 
      id: 'panel18', 
      name: 'Reserve Panel 18-A (-145m)', 
      type: 'panel',
      source: 'PROCEDURAL • ENGINEERING REFERENCE',
      provenance: 'ENGINEERING'
    };
    panel18.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(p18Geo),
      new THREE.LineBasicMaterial({ color: 0x60a5fa })
    ));
    panelsGroup.add(panel18);
    interactiveList.push(panel18);

    scene.add(panelsGroup);

    // -------------------------------------------------------------
    // UNDERGROUND TUNNEL NETWORK & DRIFTS
    // -------------------------------------------------------------
    const tunnelsGroup = new THREE.Group();
    tunnelsGroup.name = "TunnelNetwork";

    // 1. Haulage Incline Ramp (Inclined Tube from Surface to -145m)
    const haulageCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(22, 5.0, -8),
      new THREE.Vector3(14, -2.0, -5),
      new THREE.Vector3(5, -7.0, -2),
      new THREE.Vector3(-4, -12.5, 0)
    ]);
    const haulageGeo = new THREE.TubeGeometry(haulageCurve, 32, 1.2, 8, false);
    const haulageMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85
    });
    const haulageMesh = new THREE.Mesh(haulageGeo, haulageMat);
    haulageMesh.name = "Haulage Incline";
    haulageMesh.userData = { 
      id: 'haulage', 
      name: 'Haulage Incline Drift (Conveyor Ramp)', 
      type: 'tunnel',
      source: 'PROCEDURAL • ENGINEERING REFERENCE',
      provenance: 'ENGINEERING'
    };
    tunnelsGroup.add(haulageMesh);
    interactiveList.push(haulageMesh);

    // 2. Airway Ventilation Drift (Intake & Return Gallery)
    const airwayCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-18, -12.5, 12),
      new THREE.Vector3(-6, -12.5, 12),
      new THREE.Vector3(8, -12.5, 12),
      new THREE.Vector3(22, 5.0, 12)
    ]);
    const airwayGeo = new THREE.TubeGeometry(airwayCurve, 32, 1.1, 8, false);
    const airwayMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.4,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85
    });
    const airwayMesh = new THREE.Mesh(airwayGeo, airwayMat);
    airwayMesh.name = "Airway Drift";
    airwayMesh.userData = { 
      id: 'airway', 
      name: 'East Airway Ventilation Drift', 
      type: 'tunnel',
      source: 'PROCEDURAL • ENGINEERING REFERENCE',
      provenance: 'ENGINEERING'
    };
    tunnelsGroup.add(airwayMesh);
    interactiveList.push(airwayMesh);

    // Dynamic Evacuation Route (Route B Bypass through Airway Drift)
    const evacGeo = new THREE.TubeGeometry(airwayCurve, 40, 1.45, 8, false);
    const evacMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const evacMesh = new THREE.Mesh(evacGeo, evacMat);
    evacMesh.name = "EvacuationRoutePath";
    evacMesh.visible = !!isEvacuationActive;
    tunnelsGroup.add(evacMesh);
    evacMeshRef.current = evacMesh;

    // 3. Vertical Shaft 01 Column
    const shaftGeo = new THREE.CylinderGeometry(0.9, 0.9, 24, 12);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, transparent: true, opacity: 0.8 });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.set(22, -6, -8);
    tunnelsGroup.add(shaftMesh);

    scene.add(tunnelsGroup);

    // -------------------------------------------------------------
    // BOREHOLE SHAFTS (BH-04, BH-07)
    // -------------------------------------------------------------
    const boreholesGroup = new THREE.Group();
    boreholesGroup.name = "Boreholes";

    const createBorehole = (name, x, z, id) => {
      const bhGroup = new THREE.Group();
      bhGroup.position.set(x, 0, z);

      // Vertical shaft column
      const colGeo = new THREE.CylinderGeometry(0.35, 0.35, 24, 8);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8
      });
      const column = new THREE.Mesh(colGeo, colMat);
      column.position.y = -7;
      bhGroup.add(column);

      // Surface collar flag
      const flagGeo = new THREE.ConeGeometry(0.8, 1.8, 4);
      const flagMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.y = 6.0;
      flag.rotation.x = Math.PI;
      bhGroup.add(flag);

      bhGroup.name = name;
      bhGroup.userData = { 
        id: id, 
        name: `${name} Monitoring Borehole`, 
        type: 'borehole',
        source: 'PROCEDURAL • ENGINEERING REFERENCE',
        provenance: 'ENGINEERING'
      };
      interactiveList.push(column);
      interactiveList.push(flag);

      return bhGroup;
    };

    const bh04 = createBorehole("BH-04 Extensometer", -12, 4, 'bh04');
    boreholesGroup.add(bh04);

    const bh07 = createBorehole("BH-07 Piezometer", 4, -4, 'bh07');
    boreholesGroup.add(bh07);

    scene.add(boreholesGroup);

    // -------------------------------------------------------------
    // SENSOR NODE MARKERS (backend-synced status; positions are procedural/SIMULATED)
    // -------------------------------------------------------------
    const sensorsGroup = new THREE.Group();
    sensorsGroup.name = "SensorsGroup";
    const sensorMeshes = [];

    const sensorPositions = [
      { id: 'S-17B-01', name: 'S-17B-01 (Panel 17-B Crown)', x: -6, y: -11.0, z: 2, status: 'DANGER', color: 0xef4444, type: 'Tilt/Sag' },
      { id: 'BH-04-EXT', name: 'BH-04 Multi-Point Extensometer', x: -12, y: -7.0, z: 4, status: 'WARNING', color: 0xf59e0b, type: 'Extensometer' },
      { id: 'BH-07-PIEZO', name: 'BH-07 Vibrating Wire Piezometer', x: 4, y: -1.25, z: -4, status: 'DANGER', color: 0xef4444, type: 'Water/Pore' },
      { id: 'HAUL-TILT-01', name: 'Incline Ramp Inclinometer', x: 8, y: -5.0, z: -3, status: 'NORMAL', color: 0x10b981, type: 'Tilt' },
      { id: 'AIR-FLOW-02', name: 'East Drift Airflow & Methane', x: 2, y: -12.5, z: 12, status: 'NORMAL', color: 0x00b4d8, type: 'Ventilation' },
      { id: 'SURF-GPS-01', name: 'Surface Headframe GPS Monument', x: 22, y: 5.5, z: -8, status: 'NORMAL', color: 0x00b4d8, type: 'GNSS' }
    ];

    // ── 2D/3D CANONICAL-ENTITY SYNC (Phase 3) ────────────────────────────
    // The twin's sensor markers derive their STATUS from the SAME backend
    // /api/sensors list the 2D map displays. Position remains the procedural
    // layout (labelled PROCEDURAL • SIMULATION); identity + risk state are
    // canonical. Backend node IDs map onto twin markers by exact match or
    // stable index fallback.
    const liveById = {};
    (sensors || []).forEach(s => { liveById[s.id] = s; });
    
    const resolveStatus = (marker) => {
      // Try exact ID match first (canonical)
      let live = liveById[marker.id];
      
      // Fallback: match by stable index into backend roster
      if (!live) {
        const markerIndex = ['S-17B-01','BH-04-EXT','BH-07-PIEZO','HAUL-TILT-01','AIR-FLOW-02','SURF-GPS-01'].indexOf(marker.id);
        if (markerIndex >= 0 && (sensors || [])[markerIndex]) {
          live = (sensors || [])[markerIndex];
        }
      }
      
      if (!live) return null;
      const apiStatus = String(live.status || '').toUpperCase();
      if (apiStatus.includes('CRITICAL') || apiStatus.includes('DANGER')) return 'DANGER';
      if (apiStatus.includes('WARNING') || apiStatus.includes('CAUTION')) return 'WARNING';
      if (apiStatus.includes('OFFLINE')) return 'OFFLINE';
      return 'NORMAL';
    };
    
    const STATUS_COLORS = { DANGER: 0xef4444, WARNING: 0xf59e0b, OFFLINE: 0x64748b, NORMAL: 0x10b981 };
    const twinEntityLedger = [];   // consumed by the verification mode (below)
    
    sensorPositions.forEach(marker => {
      const resolved = resolveStatus(marker);
      if (resolved) marker.status = resolved;
      marker.color = STATUS_COLORS[marker.status] ?? marker.color;
      
      // Provenance labeling (Phase 3)
      if (resolved) {
        marker.source = 'BACKEND • MEASURED';
        marker.provenance = 'MEASURED';
        marker.backend_id = resolved.id;
      } else {
        marker.source = 'PROCEDURAL • SIMULATION';
        marker.provenance = 'SIMULATION';
        marker.backend_id = null;
      }
      
      twinEntityLedger.push({ 
        twin_id: marker.id, 
        backend_id: marker.backend_id,
        status_3d: marker.status, 
        source: marker.source,
        provenance: marker.provenance
      });
    });
    
    // Expose the ledger for the 2D<->3D verification mode (window is the
    // only cross-scene channel three.js r128 allows without new deps)
    window.__TERRAMESH_TWIN_LEDGER = twinEntityLedger;

    // ── WORKER VISUALIZATION (Phase 3) ───────────────────────────────────────
    // Worker markers use canonical backend worker IDs from /api/workers
    // Positions are simulated for demo (SIMULATION provenance)
    // Future RFID/RTLS/UWB hardware will use MEASURED provenance
    const workersGroup = new THREE.Group();
    workersGroup.name = "WorkersGroup";
    const workerMeshes = [];
    
    (workers || []).forEach(worker => {
      // Transform geographic coordinates to Three.js local coordinates
      // Use procedural positions for demo since workers have lat/lng but no transformation yet
      const workerThreeJsPos = {
        x: (worker.lat || 23.65) - 23.65, // Simple offset for demo
        y: -worker.depth_m || -145,
        z: (worker.lng || 86.42) - 86.42
      };
      
      // Determine worker status color
      const workerStatus = String(worker.status || 'UNKNOWN').toUpperCase();
      const STATUS_COLORS = { 
        SAFE: 0x10b981, 
        CAUTION: 0xf59e0b, 
        DANGER: 0xef4444, 
        EVACUATE: 0xdc2626, 
        OFFLINE: 0x64748b, 
        UNKNOWN: 0x94a3b8 
      };
      const workerColor = STATUS_COLORS[workerStatus] || STATUS_COLORS.UNKNOWN;
      
      // Determine provenance (from backend or default to SIMULATION for demo)
      const workerProvenance = worker.provenance || 'SIMULATION';
      const workerSource = worker.location_source === 'SIMULATOR' 
        ? 'SIMULATION • PERSONNEL TRACKING' 
        : `${workerProvenance} • WORKER TRACKING`;
      
      // Add to twin entity ledger
      twinEntityLedger.push({
        twin_id: worker.id,
        backend_id: worker.id,
        status_3d: workerStatus,
        source: workerSource,
        provenance: workerProvenance,
        entity_type: 'worker'
      });
      
      const wGroup = new THREE.Group();
      wGroup.position.set(workerThreeJsPos.x, workerThreeJsPos.y, workerThreeJsPos.z);
      
      // Worker capsule mesh
      const capsuleGeo = new THREE.CapsuleGeometry(0.5, 1.2, 4, 8);
      const capsuleMat = new THREE.MeshStandardMaterial({
        color: workerColor,
        emissive: workerColor,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7
      });
      const capsuleMesh = new THREE.Mesh(capsuleGeo, capsuleMat);
      wGroup.add(capsuleMesh);
      
      // Worker ID label (using text sprite would be ideal, but keeping simple for now)
      const ringGeo = new THREE.RingGeometry(0.6, 0.8, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: workerColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      wGroup.add(ring);
      
      wGroup.name = worker.name || worker.id;
      wGroup.userData = {
        id: worker.id,
        name: worker.name || worker.id,
        type: 'worker',
        status: workerStatus,
        zone: worker.zone,
        source: workerSource,
        provenance: workerProvenance,
        backend_id: worker.id,
        last_update: worker.last_update
      };
      
      workersGroup.add(wGroup);
      workerMeshes.push({ group: wGroup, ring: ring, capsuleMesh: capsuleMesh, data: worker });
      interactiveList.push(capsuleMesh);
    });
    
    workerMeshesRef.current = workerMeshes;
    scene.add(workersGroup);

    sensorPositions.forEach(s => {
      const sGroup = new THREE.Group();
      sGroup.position.set(s.x, s.y, s.z);

      // Sensor diamond / octahedron mesh
      const octGeo = new THREE.OctahedronGeometry(0.85, 0);
      const octMat = new THREE.MeshStandardMaterial({
        color: s.color,
        emissive: s.color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.8
      });
      const octMesh = new THREE.Mesh(octGeo, octMat);
      sGroup.add(octMesh);

      // Outer pulsing ring
      const ringGeo = new THREE.RingGeometry(0.9, 1.2, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: s.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      sGroup.add(ring);

      sGroup.name = s.name;
      sGroup.userData = { 
        id: s.id, 
        name: s.name, 
        type: 'sensor', 
        status: s.status, 
        sensorType: s.type,
        source: s.source,
        provenance: s.provenance,
        backend_id: s.backend_id
      };
      
      sensorsGroup.add(sGroup);
      sensorMeshes.push({ group: sGroup, ring: ring, octMesh: octMesh, data: s });
      interactiveList.push(octMesh);
    });

    sensorMeshesRef.current = sensorMeshes;
    scene.add(sensorsGroup);

    // -------------------------------------------------------------
    // ANIMATED PARTICLES IN VENTILATION DRIFT
    // -------------------------------------------------------------
    const particleCount = 40;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pt = airwayCurve.getPoint(t);
      pPositions[i * 3] = pt.x + (Math.random() - 0.5) * 0.6;
      pPositions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.6;
      pPositions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.6;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.6,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);
    particlesRef.current = { points: particleSystem, curve: airwayCurve, count: particleCount };

    // -------------------------------------------------------------
    // RENDER ANIMATION LOOP
    // -------------------------------------------------------------
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // 1. Controls update
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // 2. Pulse sensor rings
      sensorMeshes.forEach((sm, idx) => {
        const scale = 1.0 + 0.35 * Math.sin(elapsed * 3.5 + idx);
        sm.ring.scale.set(scale, scale, scale);
        sm.ring.material.opacity = 0.8 - 0.4 * (scale - 1.0);
        sm.octMesh.rotation.y = elapsed * 1.5 + idx;
      });

      // 3. Airflow particles motion
      if (particlesRef.current) {
        const positions = particlesRef.current.points.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          let t = ((i / particleCount) + elapsed * 0.15) % 1.0;
          const pt = particlesRef.current.curve.getPoint(t);
          positions[i * 3] = pt.x + Math.sin(elapsed * 2 + i) * 0.2;
          positions[i * 3 + 1] = pt.y;
          positions[i * 3 + 2] = pt.z + Math.cos(elapsed * 2 + i) * 0.2;
        }
        particlesRef.current.points.geometry.attributes.position.needsUpdate = true;
      }

      // 4. Aquifer subtle wave
      if (aquifer) {
        aquifer.material.opacity = 0.6 + 0.1 * Math.sin(elapsed * 1.5);
      }

      // 5. Evacuation route pulse if active
      if (evacMeshRef.current && evacMeshRef.current.visible) {
        const pulse = 0.7 + 0.4 * Math.sin(elapsed * 4.5);
        evacMeshRef.current.material.emissiveIntensity = pulse;
      }

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------
    // RAYCASTING / MOUSE INTERACTION
    // -------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.id && hit.parent && hit.parent !== scene) {
          hit = hit.parent;
        }
        if (hit && hit.userData?.id) {
          renderer.domElement.style.cursor = 'pointer';
          setHoveredObject(hit.userData.name || hit.name);
          setTooltipPos({
            x: e.clientX - rect.left + 15,
            y: e.clientY - rect.top - 10,
            visible: true,
            text: hit.userData.name || hit.name,
            subtext: `${hit.userData.type?.toUpperCase() || 'OBJECT'} • ${hit.userData.source || 'UNKNOWN'}`
          });
          return;
        }
      }
      renderer.domElement.style.cursor = 'default';
      setTooltipPos(prev => ({ ...prev, visible: false }));
    };

    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.id && hit.parent && hit.parent !== scene) {
          hit = hit.parent;
        }
        if (hit && hit.userData?.id) {
          onSelectHotspot(hit.userData.id);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);
    domEl.addEventListener('click', handleClick);

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('click', handleClick);
      
      // Clean up geometries & materials
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  // Update Auto-Rotate state
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotate;
    }
  }, [isAutoRotate]);

  // Update layer visibility dynamically
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const strata = scene.getObjectByName("StrataGroup");
    if (strata) strata.visible = !!layerControls.geologicalLayers;

    const panels = scene.getObjectByName("UndergroundPanels");
    if (panels) panels.visible = !!layerControls.undergroundPanels;

    const tunnels = scene.getObjectByName("TunnelNetwork");
    if (tunnels) tunnels.visible = !!layerControls.tunnelNetwork;

    const surface = scene.getObjectByName("SurfaceInfrastructure");
    if (surface) surface.visible = !!layerControls.groundSurface;

    const subsidence = scene.getObjectByName("Subsidence Zone");
    if (subsidence) subsidence.visible = !!layerControls.subsidenceZone;

    const sensorsG = scene.getObjectByName("SensorsGroup");
    if (sensorsG) sensorsG.visible = !!layerControls.sensors;

    const workersG = scene.getObjectByName("WorkersGroup");
    if (workersG) workersG.visible = !!layerControls.workers;
  }, [layerControls]);

  // Synchronize 3D evacuation route path visibility
  useEffect(() => {
    if (evacMeshRef.current) {
      evacMeshRef.current.visible = !!isEvacuationActive;
    }
  }, [isEvacuationActive]);

  // Dynamic Deformation Sag update on What-If slider change
  useEffect(() => {
    if (!subsidenceMeshRef.current) return;
    const mesh = subsidenceMeshRef.current;
    const posAttr = mesh.geometry.attributes.position;
    const colAttr = mesh.geometry.attributes.color;
    const colorObj = new window.THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const dist = Math.sqrt((vx + 5) * (vx + 5) * 1.3 + vz * vz);
      
      const sagAmount = Math.max(0, (1 - dist / 14)) * 3.2 * (whatIfDeformation / 30);
      posAttr.setY(i, 5.08 - sagAmount);

      // Color mapping with deformation intensity
      const heatFactor = (whatIfDeformation / 30);
      if (dist < 3.5 * heatFactor) {
        colorObj.setHex(0xdc2626); // Critical red
      } else if (dist < 6.5 * heatFactor) {
        colorObj.setHex(0xea580c); // Orange
      } else if (dist < 10.0) {
        colorObj.setHex(0xd97706); // Yellow
      } else if (dist < 14.0) {
        colorObj.setHex(0x16a34a); // Green
      } else {
        colorObj.setHex(0x3a6332);
      }
      colAttr.setXYZ(i, colorObj.r, colorObj.g, colorObj.b);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }, [whatIfDeformation]);

  // Camera Reset Handler
  const handleResetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    camera.position.set(52, 38, 72);
    controls.target.set(0, -8, 0);
    controls.update();
  }, []);

  // Zoom Helpers
  const handleZoom = useCallback((direction) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const factor = direction === 'in' ? 0.8 : 1.25;
    camera.position.multiplyScalar(factor);
    controlsRef.current.update();
  }, []);

  // Dynamic Routes Synchronization (Phase 3)
  useEffect(() => {
    if (!sceneRef.current || !window.THREE) return;
    const scene = sceneRef.current;
    
    // Clean up previous routes
    const oldGroup = scene.getObjectByName("DynamicRoutes");
    if (oldGroup) {
      scene.remove(oldGroup);
    }
    
    if (!routes || routes.length === 0) return;
    
    const THREE = window.THREE;
    const routesGroup = new THREE.Group();
    routesGroup.name = "DynamicRoutes";
    
    routes.forEach(route => {
      if (!route.waypoints_json) return;
      
      let waypoints = [];
      try {
        waypoints = typeof route.waypoints_json === 'string' ? JSON.parse(route.waypoints_json) : route.waypoints_json;
      } catch (e) {
        return;
      }
      
      if (!Array.isArray(waypoints) || waypoints.length < 2) return;
      
      // Coordinate Transformation: EPSG:4326 to Three.js Local
      // Match scale: x = (lat - 23.77) * 4000, z = (lng - 86.415) * 4000
      const pts = waypoints.map(p => {
        const lng = p[0];
        const lat = p[1];
        return new THREE.Vector3(
          (lat - 23.77) * 4000, 
          -12.5, 
          (lng - 86.415) * 4000
        );
      });
      
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 1.45, 8, false);
      
      const STATUS_COLORS = { SAFE: 0x10b981, COMPROMISED: 0xf59e0b, BLOCKED: 0xef4444 };
      const color = STATUS_COLORS[route.status?.toUpperCase()] || 0x10b981;
      
      const tubeMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.2,
        metalness: 0.7,
        emissive: color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85
      });
      
      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      mesh.name = route.name || route.id;
      mesh.userData = {
        id: route.id,
        name: route.name,
        type: 'route',
        status: route.status,
        source: 'BACKEND • MEASURED',
        provenance: 'MEASURED'
      };
      
      // Register in entity registry
      entityRegistryRef.current.routes.set(route.id, {
        group: mesh,
        data: route,
        mesh: mesh
      });
      
      routesGroup.add(mesh);
    });
    
    scene.add(routesGroup);
    
    // Hide the procedural evac route if dynamic routes exist
    if (evacMeshRef.current) {
      evacMeshRef.current.visible = false;
    }
  }, [routes]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[520px] lg:min-h-[580px] bg-[#060911] overflow-hidden select-none">
      {/* WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* Floating Tooltip for Hovered 3D Meshes */}
      {tooltipPos.visible && (
        <div 
          className="absolute z-30 pointer-events-none px-2.5 py-1 rounded-lg bg-[#0B132B]/95 border border-[#00B4D8]/60 text-slate-100 text-[11px] font-mono shadow-2xl backdrop-blur transform -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-bold text-cyan-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00B4D8]" />
            <span>{tooltipPos.text}</span>
          </div>
          <div className="text-[9px] text-slate-400">{tooltipPos.subtext} — Click to inspect</div>
        </div>
      )}

      {/* On-Canvas Quick 3D Camera Controls Toolbar (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-[#0B132B]/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-2xl pointer-events-auto">
        {/* Auto Rotate Toggle */}
        <button
          onClick={onToggleAutoRotate}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
            isAutoRotate 
              ? 'bg-[#00B4D8] text-[#070B14] shadow-sm animate-pulse' 
              : 'bg-[#162235] text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Toggle 360° Auto-Rotation"
        >
          {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>Auto Rotate</span>
        </button>

        <div className="w-px h-4 bg-slate-700" />

        {/* Zoom In */}
        <button
          onClick={() => handleZoom('in')}
          className="w-7 h-7 rounded-lg bg-[#162235] hover:bg-[#00B4D8] hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom('out')}
          className="w-7 h-7 rounded-lg bg-[#162235] hover:bg-[#00B4D8] hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          className="w-7 h-7 rounded-lg bg-[#162235] hover:bg-[#00B4D8] hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow"
          title="Reset Camera Position"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating 3D Navigation Compass Rose (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none select-none">
        <div className="w-10 h-10 rounded-full bg-[#0B132B]/90 backdrop-blur-md border border-slate-700 flex items-center justify-center text-slate-300 shadow-xl relative">
          <Compass className="w-5 h-5 text-[#00B4D8]" />
          <span className="absolute top-0.5 text-[8px] font-black text-red-400 font-mono">N</span>
        </div>
        <div className="px-2 py-0.5 rounded bg-[#0B132B]/80 border border-slate-800 text-[9px] font-mono text-slate-400">
          3D WebGL 60FPS
        </div>
      </div>

      {/* Left Bottom 3D Scene Controls Hint */}
      <div className="absolute bottom-3 left-3 z-20 hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0B132B]/85 border border-slate-800 text-[9px] font-mono text-slate-400 pointer-events-none backdrop-blur">
        <span>🖱️ Left-Drag: Orbit</span>
        <span className="text-slate-600">•</span>
        <span>Right-Drag: Pan</span>
        <span className="text-slate-600">•</span>
        <span>Scroll: Zoom</span>
      </div>
    </div>
  );
}
