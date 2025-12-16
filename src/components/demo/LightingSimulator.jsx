import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- 1. Pro Icon System ---
const Icon = ({ path, size = 18, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block' }}><path d={path} /></svg>
);

const Icons = {
    Sun: (p) => <Icon {...p} path="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />,
    Moon: (p) => <Icon {...p} path="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
    Cube: (p) => <Icon {...p} path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
    Box: (p) => <Icon {...p} path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
    Eye: (p) => <Icon {...p} path="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 5c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />,
    Grid: (p) => <Icon {...p} path="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
    Layers: (p) => <Icon {...p} path="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    Sliders: (p) => <Icon {...p} path="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
    Armchair: (p) => <Icon {...p} path="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0ZM5 18v2M19 18v2" />,
    Monitor: (p) => <Icon {...p} path="M2 3h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3zm6 18h8m-4-4v4" />,
    Home: (p) => <Icon {...p} path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    Tag: (p) => <Icon {...p} path="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" />,
    Power: (p) => <Icon {...p} path="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
};

// --- 2. Styles ---
const styles = `
  :root { --bg: #050505; --panel: rgba(18,18,18,0.95); --accent: #2563eb; --text: #e5e5e5; --border: rgba(255,255,255,0.1); }
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

  input[type=range] { -webkit-appearance: none; background: transparent; width: 100%; cursor: pointer; }
  input[type=range]:focus { outline: none; }
  input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: #333; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #fff; margin-top: -5px; transition: transform 0.1s; }
  input[type=range]:active::-webkit-slider-thumb { transform: scale(1.3); }
  .kelvin-track::-webkit-slider-runnable-track { background: linear-gradient(to right, #ff8a12 0%, #ffe3cd 50%, #cceeff 100%); height: 4px; border-radius: 2px; }

  .app-container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); height: 100vh; display: flex; overflow: hidden; }
  .viewport { flex: 1; position: relative; background: #000; }
  
  .sidebar { width: 300px; background: #0f0f0f; border-left: 1px solid var(--border); display: flex; flex-direction: column; z-index: 10; }
  .sidebar-content { padding: 24px; overflow-y: auto; flex: 1; }
  
  .glass-panel { background: var(--panel); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .control-group { margin-bottom: 24px; }
  .group-header { font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .stat-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #999; margin-bottom: 6px; }
  .val-text { color: #fff; font-family: 'SF Mono', monospace; font-size: 11px; }

  .nav-dock { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(30,30,30,0.8); backdrop-filter: blur(10px); border: 1px solid var(--border); border-radius: 100px; padding: 4px; display: flex; gap: 4px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
  .nav-btn { padding: 10px 20px; border-radius: 100px; color: #888; transition: all 0.3s; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: transparent; }
  .nav-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav-btn.active { background: #fff; color: #000; }
  
  .channel-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 8px; transition: border-color 0.2s; }
  .channel-card:hover { border-color: #555; }
  .channel-card.off { opacity: 0.5; }
  .channel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .channel-title { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #eee; }
  .power-btn { background: none; border: none; color: #444; cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; }
  .power-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
  .power-btn.active { color: #10b981; text-shadow: 0 0 10px rgba(16,185,129,0.5); }
`;

// --- 3. FIXTURE DEFINITIONS ---
const FIXTURES = {
    TRACK: { name: "Magnetic 48V", category: "Track", layer: "structure", lumen: 1200, beam: 34, color: 0x1a1a1a, emissive: 0xffffff, size: [0.04, 0.02] },
    DOWN: { name: "Deep Recessed", category: "Downlight", layer: "general", lumen: 900, beam: 55, color: 0xffffff, emissive: 0xffffff, size: [0.08, 0.01] },
    PEND: { name: "Designer Pendant", category: "Pendant", layer: "accent", lumen: 1500, beam: 120, color: 0x222222, emissive: 0xffccaa, size: [0.6, 0.3] },
    STRIP: { name: "COB Strip 3000K", category: "Strip", layer: "ambient", lumen: 1000, beam: 180, color: 0xffffff, emissive: 0xffffff, size: [0.015, 0.005] }
};

const SCENES = {
    daily: { label: "Daily", icon: Icons.Sun, cct: 4000, layers: { ambient: 0.6, general: 0.8, task: 0.5, accent: 0.5, structure: 0.7 } },
    relax: { label: "Relax", icon: Icons.Armchair, cct: 2700, layers: { ambient: 0.9, general: 0.0, task: 0.2, accent: 0.4, structure: 0.0 } },
    work: { label: "Focus", icon: Icons.Monitor, cct: 5500, layers: { ambient: 0.3, general: 1.0, task: 1.0, accent: 0.0, structure: 1.0 } },
    night: { label: "Night", icon: Icons.Moon, cct: 2200, layers: { ambient: 0.2, general: 0.0, task: 0.0, accent: 0.0, structure: 0.0 } }
};

// --- 4. PRECISION LAYOUT (CAD 1:1) ---
const LAYOUT = {
    unitId: "SOUTH_UNIT_CAD_FINAL",
    floorHeight: 2.7,
    // Structural Columns (50x50cm)
    columns: [
        { pos: [-2.05, 2.7], size: [0.5, 0.5] },  // Top Left Living
        { pos: [2.05, 2.7], size: [0.5, 0.5] },   // Top Right Living
        { pos: [-2.05, -2.7], size: [0.5, 0.5] }, // Bottom Left Living
        { pos: [2.05, -2.7], size: [0.5, 0.5] },  // Bottom Right Living
    ],
    rooms: [
        {
            id: "K", name: "KITCHEN (207cm)", type: "kitchen",
            // Width 2.07. Depth 4.05.
            origin: [-3.13, 0], size: { w: 2.07, d: 4.05 },
            doors: [{ pos: [1.035, -1.0], width: 0.9, rot: 90, type: "open" }],
            furniture: [
                { id: "fk1", type: "kitchen_L", pos: [-0.05, 0, 0], size: [1.95, 0.9, 3.8], rot: 0 },
                { id: "fk2", type: "fridge", pos: [0.6, 0, -1.5], size: [0.7, 1.9, 0.7], rot: 0 },
            ],
            lights: [
                { code: "DOWN", type: "down", pos: [0, 2.5, -1.0] },
                { code: "DOWN", type: "down", pos: [0, 2.5, 1.0] },
                // Cabinet task light
                { code: "STRIP", type: "linear", pos: [-0.6, 1.4, 0], len: 3.5, axis: "z" }
            ]
        },
        {
            id: "L1", name: "LIVING (410cm)", type: "living",
            // Width 4.10. Depth 5.40.
            origin: [0, 0], size: { w: 4.10, d: 5.40 },
            doors: [
                { pos: [-2.05, 1.5], width: 1.0, rot: 0, type: "open" },
            ],
            furniture: [
                { id: "f1", type: "sofa_L", pos: [1.3, 0, 1.0], size: [2.1, 0.8, 1.6], rot: -90 },
                { id: "f3", type: "tv_wall", pos: [-1.9, 0, 1.0], size: [0.3, 2.4, 2.0], rot: 0 },
                { id: "f2", type: "coffee", pos: [0.0, 0, 1.0], size: [1.0, 0.35, 0.6], rot: 0 },
                { id: "rug1", type: "rug", pos: [0.0, 0, 1.0], size: [2.4, 0.02, 2.0], rot: 0 },
                { id: "f4", type: "dining", pos: [-0.5, 0, -1.5], size: [1.4, 0.75, 0.8], rot: 90 },
                { id: "f5", type: "cabinet_side", pos: [-1.4, 0, 2.4], size: [1.2, 1.0, 0.4], rot: 0 },
            ],
            lights: [
                { code: "TRACK", type: "track_rail", pos: [0.5, 2.7, 0.5], len: 3.0, axis: "z" },
                { code: "TRACK", type: "spot", pos: [0.5, 2.7, 1.5], target: [1.4, 0.8, 1.5] },
                { code: "TRACK", type: "spot", pos: [0.5, 2.7, 0.5], target: [0, 0.35, 0.5] },
                { code: "TRACK", type: "spot", pos: [0.5, 2.7, -1.5], target: [-0.8, 0.75, -1.5] },
                { code: "PEND", type: "pendant", pos: [-0.5, 2.0, -1.5] },
                { code: "STRIP", type: "linear", pos: [0, 2.65, 2.6], len: 4.0, axis: "x", dir: "down" },
                { code: "DOWN", type: "down", pos: [-1.0, 2.7, -0.5] },
            ]
        },
        {
            id: "G1", name: "GUEST (255cm)", type: "bedroom",
            // Width 2.55. Depth 4.74.
            origin: [3.375, -0.33], size: { w: 2.55, d: 4.74 },
            doors: [{ pos: [-1.275, 0.8], width: 0.9, rot: 0, type: "door" }],
            furniture: [
                { id: "fb3", type: "bed_single", pos: [0.6, 0, 1.0], size: [1.9, 0.5, 1.05], rot: -90 },
                { id: "fd1", type: "desk", pos: [-0.6, 0, -1.5], size: [1.2, 0.75, 0.6], rot: 0 },
                { id: "fb4", type: "wardrobe", pos: [-0.8, 0, 1.8], size: [0.6, 2.6, 1.2], rot: 0 },
            ],
            lights: [
                { code: "DOWN", type: "down", pos: [0, 2.7, 0] },
                { code: "DOWN", type: "down", pos: [0, 2.7, 1.5] },
                { code: "STRIP", type: "linear", pos: [-0.6, 1.4, -2.3], len: 1.2, axis: "x" } // Desk Task
            ]
        },
        {
            id: "M1", name: "MASTER", type: "bedroom",
            // Far Right. Width 3.02. Depth 4.74.
            origin: [6.16, -0.33], size: { w: 3.02, d: 4.74 },
            doors: [{ pos: [-1.51, 1.0], width: 0.9, rot: 0, type: "door" }],
            furniture: [
                { id: "fb1", type: "bed_queen", pos: [0.6, 0, 0.5], size: [1.9, 0.5, 1.6], rot: -90 },
                { id: "ns1", type: "nightstand", pos: [0.6, 0, -0.5], size: [0.4, 0.5, 0.4], rot: 0 },
                { id: "ns2", type: "nightstand", pos: [0.6, 0, 1.5], size: [0.4, 0.5, 0.4], rot: 0 },
                { id: "fb2", type: "wardrobe", pos: [-1.2, 0, 0], size: [0.6, 2.6, 2.4], rot: 0 },
                { id: "rug2", type: "rug", pos: [-0.2, 0, 0.5], size: [2.0, 0.02, 2.4], rot: 0 },
            ],
            lights: [
                { code: "DOWN", type: "down", pos: [-0.5, 2.7, 0] },
                { code: "STRIP", type: "linear", pos: [1.4, 2.65, 0], len: 4.5, axis: "z" }, // Curtain
                { code: "TRACK", type: "track_rail", pos: [0.5, 2.7, 0.5], len: 1.6, axis: "z" }, // Reading
                { code: "TRACK", type: "spot", pos: [0.5, 2.7, -0.3], target: [0.5, 0.8, -0.5] },
                { code: "TRACK", type: "spot", pos: [0.5, 2.7, 1.3], target: [0.5, 0.8, 1.5] },
            ]
        },
        {
            id: "BA", name: "BATH", type: "bath",
            // Top Right. Width 1.85. Depth 1.55. (Approx)
            origin: [3.375, 4.0], size: { w: 1.85, d: 1.55 },
            furniture: [
                { id: "fa1", type: "vanity", pos: [-0.4, 0, 0], size: [0.5, 0.85, 0.8], rot: 0 },
                { id: "fa2", type: "shower", pos: [0.5, 0, 0], size: [0.8, 0.1, 1.5], rot: 0 }
            ],
            lights: [
                { code: "DOWN", type: "down", pos: [0, 2.4, 0] },
                { code: "STRIP", type: "linear", pos: [-0.4, 1.8, 0.75], len: 0.8, axis: "x" } // Mirror
            ]
        }
    ]
};

// --- 5. Texture Generation ---
const generatePBRTextures = (type) => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const noise = (x, y) => Math.sin(x * 0.05 + y * 0.05) * 0.5 + Math.sin(x * 0.1 + y * 0.1) * 0.25;

    if (type === 'wood') {
        ctx.fillStyle = '#C8A47E'; ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 150; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 70, 40, ${Math.random() * 0.15})`;
            ctx.lineWidth = 1 + Math.random() * 3;
            const x = Math.random() * size;
            ctx.moveTo(x, 0);
            ctx.bezierCurveTo(x + noise(i, 0) * 50, size / 3, x - noise(i, 50) * 50, size * 2 / 3, x, size);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(60, 40, 20, 0.4)'; ctx.lineWidth = 3;
        for (let i = 0; i <= size; i += 128) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
        }
    } else {
        ctx.fillStyle = '#e0e0e5'; ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 10000; i++) {
            const v = Math.random();
            ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
            ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
        }
        ctx.strokeStyle = '#bbbbbb'; ctx.lineWidth = 6;
        for (let i = 0; i <= size; i += 256) {
            ctx.strokeRect(i, 0, 256, 256);
            ctx.strokeRect(i, 256, 256, 256);
        }
    }
    const colorTex = new window.THREE.CanvasTexture(canvas);
    colorTex.wrapS = window.THREE.RepeatWrapping; colorTex.wrapT = window.THREE.RepeatWrapping;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size; bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d');
    bCtx.drawImage(canvas, 0, 0);
    bCtx.fillStyle = 'rgba(0,0,0,0.2)'; bCtx.fillRect(0, 0, size, size);
    const bumpTex = new window.THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = window.THREE.RepeatWrapping; bumpTex.wrapT = window.THREE.RepeatWrapping;

    return { color: colorTex, bump: bumpTex };
};

// --- 6. Volumetric Beam Shader ---
const VolumetricMaterial = (THREE, color) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(color) },
            opacity: { value: 0.0 }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            varying vec2 vUv;
            void main() {
                float strength = pow(1.0 - vUv.y, 2.0);
                float alpha = opacity * strength * 0.8;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
};

// --- 7. 3D Engine ---
const ThreeScene = ({ layers, cct, brightness, fixtureControls }) => {
    const divRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const sceneRef = useRef(null);
    const lightsRef = useRef([]);
    const [status, setStatus] = useState("loading");

    const getHex = (k) => {
        const temp = k / 100;
        let r, g, b;
        if (temp <= 66) { r = 255; g = 99.47 * Math.log(temp) - 161.12; if (temp <= 19) b = 0; else b = 138.51 * Math.log(temp - 10) - 305.04; }
        else { r = 329.69 * Math.pow(temp - 60, -0.133); g = 288.12 * Math.pow(temp - 60, -0.0755); b = 255; }
        const c = (v) => Math.max(0, Math.min(255, Math.floor(v)));
        return (c(r) << 16) + (c(g) << 8) + c(b);
    };

    const createLabel = (THREE, text, subtext, x, y, z) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512; canvas.height = 256;

        ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 15;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 70px -apple-system, system-ui, sans-serif";
        ctx.fillText(text, 256, 100);
        ctx.fillStyle = "#3b82f6";
        ctx.font = "600 45px monospace";
        ctx.fillText(subtext, 256, 180);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(x, y, z);
        sprite.scale.set(3, 1.5, 1);
        sprite.renderOrder = 999;
        return sprite;
    };

    const createRoomMesh = (THREE, room, textures) => {
        const grp = new THREE.Group();
        grp.position.set(room.origin[0], 0, room.origin[1]);

        const texKey = (room.type === 'bath' || room.type === 'kitchen') ? 'tile' : 'wood';
        const pbr = textures[texKey];
        pbr.color.repeat.set(room.size.w / 2, room.size.d / 2);
        pbr.bump.repeat.set(room.size.w / 2, room.size.d / 2);

        const fMat = new THREE.MeshPhysicalMaterial({
            map: pbr.color, bumpMap: pbr.bump, bumpScale: 0.02,
            roughness: texKey === 'tile' ? 0.2 : 0.6, metalness: 0.1, clearcoat: texKey === 'tile' ? 0.2 : 0.0
        });

        const floor = new THREE.Mesh(new THREE.BoxGeometry(room.size.w, 0.15, room.size.d), fMat);
        floor.position.y = -0.075;
        floor.receiveShadow = true;
        grp.add(floor);

        const wMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9, bumpMap: pbr.bump, bumpScale: 0.005 });
        const thick = 0.15;

        // Simple Walls (Box)
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(room.size.w + thick * 2, LAYOUT.floorHeight, thick), wMat);
        w1.position.set(0, LAYOUT.floorHeight / 2, -room.size.d / 2 - thick / 2);
        w1.castShadow = true; w1.receiveShadow = true;
        grp.add(w1);

        const w2 = new THREE.Mesh(new THREE.BoxGeometry(thick, LAYOUT.floorHeight, room.size.d), wMat);
        w2.position.set(-room.size.w / 2 - thick / 2, LAYOUT.floorHeight / 2, 0);
        w2.castShadow = true; w2.receiveShadow = true;
        grp.add(w2);

        // Visual Door Marker (Simple Frame)
        if (room.doors) {
            room.doors.forEach(d => {
                const doorGrp = new THREE.Group();
                const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
                const frame = new THREE.Mesh(new THREE.BoxGeometry(d.width, 2.1, 0.1), frameMat);
                frame.position.y = 1.05;
                doorGrp.add(frame);

                // Door Leaf
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(d.width, 2.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
                leaf.position.set(d.width / 2, 1.025, 0);
                // Rotate to show open
                const pivot = new THREE.Group();
                pivot.position.set(-d.width / 2, 0, 0);
                pivot.add(leaf);
                if (d.type === 'open') pivot.rotation.y = Math.PI / 4;
                else pivot.rotation.y = Math.PI / 8; // Slightly open to hint door

                frame.add(pivot);
                doorGrp.position.set(d.pos[0], 0, d.pos[1]);
                if (d.rot) doorGrp.rotation.y = d.rot * Math.PI / 180;
                grp.add(doorGrp);
            });
        }

        return grp;
    };

    const createFurniture = (THREE, f) => {
        const grp = new THREE.Group();
        grp.position.set(f.pos[0], 0, f.pos[2]);
        if (f.rot) grp.rotation.y = f.rot * Math.PI / 180;

        let mesh;
        if (f.type.includes('sofa')) {
            const mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });
            const seat = new THREE.Mesh(new THREE.BoxGeometry(f.size[0], 0.4, f.size[2]), mat);
            seat.position.y = 0.2;
            seat.castShadow = true; seat.receiveShadow = true;
            grp.add(seat);
        } else if (f.type.includes('bed')) {
            const mat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
            const bed = new THREE.Mesh(new THREE.BoxGeometry(f.size[0], 0.5, f.size[2]), mat);
            bed.position.y = 0.25;
            bed.castShadow = true; bed.receiveShadow = true;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, f.size[2]), new THREE.MeshStandardMaterial({ color: 0x5C4033 }));
            head.position.set(-f.size[0] / 2, 0.55, 0);
            head.castShadow = true;
            grp.add(bed, head);
        } else if (f.type === 'rug') {
            const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1.0 });
            const rug = new THREE.Mesh(new THREE.BoxGeometry(f.size[0], 0.02, f.size[2]), mat);
            rug.position.y = 0.01;
            rug.receiveShadow = true;
            grp.add(rug);
        } else if (f.type === 'nightstand') {
            const mat = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(f.size[0], f.size[1], f.size[2]), mat);
            mesh.position.y = f.size[1] / 2;
            mesh.castShadow = true;
            grp.add(mesh);
        } else {
            const mat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.2, metalness: 0.3 });
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(f.size[0], f.size[1], f.size[2]), mat);
            mesh.position.y = f.size[1] / 2;
            mesh.castShadow = true; mesh.receiveShadow = true;
            grp.add(mesh);
        }
        return grp;
    };

    const createColumns = (THREE) => {
        const grp = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }); // Dark columns for contrast
        LAYOUT.columns.forEach(c => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(c.size[0], LAYOUT.floorHeight, c.size[1]), mat);
            mesh.position.set(c.pos[0], LAYOUT.floorHeight / 2, c.pos[1]);
            mesh.castShadow = true; mesh.receiveShadow = true;
            grp.add(mesh);
        });
        return grp;
    };

    useEffect(() => {
        if (!divRef.current) return;
        const width = divRef.current.clientWidth;
        const height = divRef.current.clientHeight;

        let frameId;

        const initEngine = async () => {
            const loadScript = (src) => new Promise(resolve => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    // Check if window.THREE is available, if so resolve immediately
                    if (src.includes('three.min.js') && window.THREE) return resolve();
                    if (src.includes('OrbitControls.js') && window.THREE && window.THREE.OrbitControls) return resolve();
                    return resolve();
                }
                const s = document.createElement('script');
                s.src = src;
                s.onload = resolve;
                document.head.appendChild(s);
            });

            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
            await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');

            const THREE = window.THREE;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);
            scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
            sceneRef.current = scene;

            const cam = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
            cam.position.set(0, 20, 15);
            cam.lookAt(0, 0, 0);
            cameraRef.current = cam;

            const ren = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
            ren.setSize(width, height);
            ren.shadowMap.enabled = true;
            ren.shadowMap.type = THREE.PCFSoftShadowMap;
            ren.physicallyCorrectLights = true;
            ren.outputEncoding = THREE.sRGBEncoding;
            ren.toneMapping = THREE.ACESFilmicToneMapping;
            ren.toneMappingExposure = 1.0;
            divRef.current.innerHTML = '';
            divRef.current.appendChild(ren.domElement);
            rendererRef.current = ren;

            if (THREE.OrbitControls) {
                const controls = new THREE.OrbitControls(cam, ren.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
                controls.maxPolarAngle = Math.PI / 2 - 0.1;

                const animate = () => {
                    frameId = requestAnimationFrame(animate);
                    controls.update();

                    lightsRef.current.forEach(l => {
                        l.currInt += (l.targetInt - l.currInt) * 0.1; // Smooth transition
                        l.currCol.lerp(l.targetCol, 0.1);

                        // FIX: Safety check for l.obj to prevent crash
                        if (l.obj) {
                            l.obj.intensity = l.currInt;
                            l.obj.color.copy(l.currCol);
                        }
                        // FIX: Safety check for l.mat (Emissive)
                        if (l.mat && l.mat.emissive) {
                            l.mat.emissive.copy(l.currCol).multiplyScalar(l.currInt > 0 ? 1 : 0);
                        }
                    });

                    ren.render(scene, cam);
                };
                animate();
            }

            const textures = {
                wood: generatePBRTextures('wood'),
                tile: generatePBRTextures('tile')
            };

            const apartment = new THREE.Group();

            // Add Rooms
            LAYOUT.rooms.forEach(r => {
                const rMesh = createRoomMesh(THREE, r, textures);
                if (r.furniture) r.furniture.forEach(f => rMesh.add(createFurniture(THREE, f)));
                const label = createLabel(THREE, r.name, `${r.size.w}x${r.size.d}m`, r.origin[0] + r.size.w / 2, 3.5, r.origin[1] + r.size.d / 2);
                scene.add(label);
                apartment.add(rMesh);
            });

            // Add Structure (Columns)
            if (LAYOUT.columns) {
                const cols = createColumns(THREE);
                apartment.add(cols);
            }

            scene.add(apartment);

            const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }));
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -0.2;
            scene.add(ground);

            scene.add(new THREE.HemisphereLight(0x222222, 0x000000, 0.2));

            setStatus("ready");
        };
        initEngine();

        const handleResize = () => {
            if (cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = divRef.current.clientWidth / divRef.current.clientHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(divRef.current.clientWidth, divRef.current.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, []);

    // Light Management Loop - Reacts to fixtureControls changes
    useEffect(() => {
        if (status !== "ready") return;
        const THREE = window.THREE;
        const scene = sceneRef.current;

        // One-time build of lights if needed (or if layout changed, but layout is static here)
        if (lightsRef.current.length === 0) {
            const lightGrp = new THREE.Group();

            LAYOUT.rooms.forEach(r => {
                if (r.lights) {
                    const rx = r.origin[0]; const rz = r.origin[1];
                    r.lights.forEach(l => {
                        const spec = FIXTURES[l.code]; // e.g. TRACK, DOWN, PEND, STRIP
                        if (!spec) return;

                        // Fixture Body Material
                        const matBody = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.4 });
                        const matEmit = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });

                        // Create Geometry
                        if (l.type === 'track_rail') {
                            const len = l.len || 2;
                            const rail = new THREE.Mesh(new THREE.BoxGeometry(l.axis === 'x' ? len : spec.size[0], 0.04, l.axis === 'z' ? len : spec.size[0]), matBody);
                            rail.position.set(rx + l.pos[0], l.pos[1], rz + l.pos[2]);
                            lightGrp.add(rail);
                        } else if (l.type === 'linear') {
                            const len = l.len || 1;
                            const strip = new THREE.Mesh(new THREE.BoxGeometry(l.axis === 'x' ? len : 0.02, 0.02, l.axis === 'z' ? len : 0.02), matEmit);
                            strip.position.set(rx + l.pos[0], l.pos[1], rz + l.pos[2]);
                            lightGrp.add(strip);
                            // Push ref for strip emitter glow
                            lightsRef.current.push({
                                obj: null, mat: matEmit,
                                code: l.code, // Identify as STRIP
                                currInt: 0, targetInt: 0,
                                currCol: new THREE.Color(0), targetCol: new THREE.Color(0)
                            });
                        } else {
                            // Spot/Pendant Body
                            const h = l.type === 'pendant' ? 0.3 : 0.05;
                            const body = new THREE.Mesh(new THREE.CylinderGeometry(spec.size[0], spec.size[0] * 0.8, h, 16), matBody);
                            body.position.set(rx + l.pos[0], l.pos[1], rz + l.pos[2]);
                            lightGrp.add(body);
                            if (l.type === 'pendant') {
                                const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, l.pos[1]), matBody);
                                cord.position.set(rx + l.pos[0], l.pos[1] / 2 + h / 2, rz + l.pos[2]);
                                cord.name = "CORD";
                                lightGrp.add(cord);
                            }
                        }

                        // Create Lights
                        if (l.type === 'linear') {
                            const count = Math.ceil(l.len) + 1;
                            for (let i = 0; i < count; i++) {
                                const p = new THREE.PointLight(0xffffff, 0, 4);
                                p.decay = 2;
                                const t = i / (count - 1);
                                const off = (t - 0.5) * l.len;
                                p.position.set(rx + l.pos[0] + (l.axis === 'x' ? off : 0), l.pos[1] - 0.1, rz + l.pos[2] + (l.axis === 'z' ? off : 0));
                                lightGrp.add(p);
                                lightsRef.current.push({ obj: p, code: l.code, currInt: 0, targetInt: 0, currCol: new THREE.Color(0), targetCol: new THREE.Color(0) });
                            }
                        } else if (l.type !== 'track_rail') {
                            // Spot / Down / Pend
                            const isSpot = l.code === 'TRACK' || l.code === 'PEND'; // Pendants behave like spots here
                            const source = isSpot ? new THREE.SpotLight(0xffffff, 0) : new THREE.PointLight(0xffffff, 0, 7);
                            source.position.set(rx + l.pos[0], l.pos[1] - 0.05, rz + l.pos[2]);
                            source.decay = 2;
                            source.castShadow = true;

                            if (isSpot) {
                                source.angle = (spec.beam * Math.PI / 180) / 2;
                                source.penumbra = 0.3;
                                source.distance = 10;
                                const target = new THREE.Object3D();
                                if (l.target) target.position.set(rx + l.target[0], l.target[1], rz + l.target[2]);
                                else target.position.set(rx + l.pos[0], 0, rz + l.pos[2]);
                                lightGrp.add(target);
                                source.target = target;

                                const beamMat = VolumetricMaterial(THREE, 0xffffff);
                                const beamGeo = new THREE.ConeGeometry(Math.tan(source.angle) * 5, 5, 32, 1, true);
                                beamGeo.translate(0, -2.5, 0);
                                const beam = new THREE.Mesh(beamGeo, beamMat);
                                beam.position.copy(source.position);
                                beam.lookAt(target.position);
                                beam.rotateX(-Math.PI / 2);
                                lightGrp.add(beam);

                                lightsRef.current.push({ obj: source, mat: beamMat, code: l.code, currInt: 0, targetInt: 0, currCol: new THREE.Color(0), targetCol: new THREE.Color(0) });
                            } else {
                                lightsRef.current.push({ obj: source, code: l.code, currInt: 0, targetInt: 0, currCol: new THREE.Color(0), targetCol: new THREE.Color(0) });
                            }
                            lightGrp.add(source);
                        }
                    });
                }
            });
            scene.add(lightGrp);
        }

        // Calculation Loop: Determine Target Intensity based on Controls
        const colorHex = getHex(cct);
        const targetColor = new THREE.Color(colorHex);

        lightsRef.current.forEach(item => {
            const spec = FIXTURES[item.code]; // item.code is TRACK, DOWN, etc.
            const ctrl = fixtureControls[item.code]; // { on: bool, dim: 0-1 }

            // Logic: Master Dim * Scene Layer * Channel Dimmer * Channel Switch
            const masterInt = brightness / 100;
            const layerInt = layers[spec.layer] || 1;
            const channelDim = ctrl.dim;
            const channelOn = ctrl.on ? 1 : 0;

            const finalIntensity = (spec.lumen * 0.015) * masterInt * layerInt * channelDim * channelOn;

            item.targetInt = finalIntensity;
            item.targetCol.copy(targetColor);
        });

    }, [layers, cct, brightness, fixtureControls, status]);

    return <div ref={divRef} className="viewport" style={{ width: '100%', height: '100%' }} />;
};

// --- Main App ---
const LightingSimulator = () => {
    const [activeSceneId, setActiveSceneId] = useState("daily");
    const [cct, setCct] = useState(4000);
    const [bri, setBri] = useState(100);
    const [layers, setLayers] = useState(SCENES.daily.layers);

    // New State: Individual Fixture Controls
    const [fixtureControls, setFixtureControls] = useState({
        TRACK: { on: true, dim: 1.0 },
        DOWN: { on: true, dim: 1.0 },
        PEND: { on: true, dim: 1.0 },
        STRIP: { on: true, dim: 1.0 }
    });

    const applyScene = (key) => {
        const s = SCENES[key];
        setActiveSceneId(key);
        setLayers({ ...s.layers });
        setCct(s.cct);
        // We generally keep fixture overrides as is, or reset them? 
        // Let's reset them to full on for the new scene to take full effect
        setFixtureControls({
            TRACK: { on: true, dim: 1.0 },
            DOWN: { on: true, dim: 1.0 },
            PEND: { on: true, dim: 1.0 },
            STRIP: { on: true, dim: 1.0 }
        });
    };

    const toggleFixture = (code) => {
        setFixtureControls(prev => ({
            ...prev,
            [code]: { ...prev[code], on: !prev[code].on }
        }));
    };

    const dimFixture = (code, val) => {
        setFixtureControls(prev => ({
            ...prev,
            [code]: { ...prev[code], dim: val }
        }));
    };

    return (
        <div className="app-container">
            <style>{styles}</style>
            <div className="viewport">
                <ThreeScene layers={layers} cct={cct} brightness={bri} fixtureControls={fixtureControls} />
                <div className="hud">
                    <div className="hud-panel">
                        <div className="hud-title">
                            <h1>GEMINI TWIN</h1>
                            <p>V24.1 • PRO LIGHTING CONSOLE</p>
                        </div>
                    </div>
                </div>
                <div className="nav-dock">
                    {Object.entries(SCENES).map(([k, s]) => (
                        <button key={k} onClick={() => applyScene(k)} className={`nav-btn ${activeSceneId === k ? 'active' : ''}`}>
                            <s.icon size={16} /> {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar">
                <div className="sidebar-content">
                    {/* 1. Global */}
                    <div className="control-group">
                        <div className="group-header"><Icons.Sliders /> GLOBAL SETTINGS</div>
                        <div className="slider-row">
                            <div className="slider-label"><span>CCT</span><span className="val-text">{cct}K</span></div>
                            <input className="kelvin-track" type="range" min="2700" max="6500" value={cct} onChange={e => setCct(Number(e.target.value))} />
                        </div>
                        <div className="slider-row">
                            <div className="slider-label"><span>MASTER DIM</span><span className="val-text">{bri}%</span></div>
                            <input type="range" min="0" max="100" value={bri} onChange={e => setBri(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* 2. Fixture Channels (The new request) */}
                    <div className="control-group">
                        <div className="group-header"><Icons.Grid /> FIXTURE CHANNELS</div>
                        {Object.entries(fixtureControls).map(([code, ctrl]) => {
                            const spec = FIXTURES[code];
                            return (
                                <div key={code} className={`channel-card ${!ctrl.on ? 'off' : ''}`}>
                                    <div className="channel-header">
                                        <div className="channel-title">
                                            {/* Simple visual indicator of type */}
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ctrl.on ? '#10b981' : '#444' }}></div>
                                            {spec.name}
                                        </div>
                                        <button className={`power-btn ${ctrl.on ? 'active' : ''}`} onClick={() => toggleFixture(code)}>
                                            <Icons.Power size={16} />
                                        </button>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.01"
                                        value={ctrl.dim}
                                        onChange={(e) => dimFixture(code, parseFloat(e.target.value))}
                                        disabled={!ctrl.on}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* 3. Layers (Secondary) */}
                    <div className="control-group" style={{ opacity: 0.5 }}>
                        <div className="group-header"><Icons.Layers /> SCENE LAYERS (AUTO)</div>
                        {Object.entries(layers).map(([k, v]) => (
                            <div className="slider-row" key={k} style={{ marginBottom: 4 }}>
                                <div className="slider-label"><span style={{ textTransform: 'capitalize' }}>{k}</span><span className="slider-val">{Math.round(v * 100)}%</span></div>
                                <input type="range" min="0" max="1" step="0.1" value={v} disabled />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LightingSimulator;
