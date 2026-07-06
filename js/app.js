import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d10);

const camera = new THREE.PerspectiveCamera(55, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(7, 8, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;

scene.add(new THREE.AmbientLight(0xffffff, 0.65));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(12, 18, 12);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const catalog = {
    bed:    { name: "Lit Double", w: 1.4, h: 0.5, d: 1.9, color: 0x3b82f6 },
    desk:   { name: "Bureau", w: 1.2, h: 0.75, d: 0.6, color: 0xf97316 },
    sofa:   { name: "Canapé", w: 2.0, h: 0.8, d: 0.9, color: 0x8b5cf6 },
    table:  { name: "Table", w: 1.2, h: 0.75, d: 0.8, color: 0x10b981 },
    plug:   { name: "Prise élec.", w: 0.15, h: 0.15, d: 0.05, color: 0xeab308 },
    water:  { name: "Arrivée eau", w: 0.2, h: 0.2, d: 0.1, color: 0x06b6d4 },
    window: { name: "Fenêtre", w: 1.2, h: 1.2, d: 0.1, color: 0x38bdf8 },
    door:   { name: "Porte", w: 0.9, h: 2.0, d: 0.1, color: 0xef4444 }
};

let roomDimensions = { width: 5.0, length: 4.0, height: 2.5 };
const sceneObjects = [];
const roomGroup = new THREE.Group();
scene.add(roomGroup);

const floorHitPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ visible: false })
);
floorHitPlane.rotation.x = -Math.PI / 2;
scene.add(floorHitPlane);

function generateEnvironment() {
    roomGroup.clear();

    const gridSize = Math.max(roomDimensions.width, roomDimensions.length) * 1.8;
    const grid = new THREE.GridHelper(gridSize, Math.round(gridSize * 2), 0x10b981, 0x1e242e);
    grid.position.y = 0.005;
    roomGroup.add(grid);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomDimensions.width, roomDimensions.length),
        new THREE.MeshStandardMaterial({ color: 0x1b1f27, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });

    const wallNorth = new THREE.Mesh(new THREE.PlaneGeometry(roomDimensions.width, roomDimensions.height), wallMat);
    wallNorth.position.set(0, roomDimensions.height / 2, -roomDimensions.length / 2);
    roomGroup.add(wallNorth);

    const wallWest = new THREE.Mesh(new THREE.PlaneGeometry(roomDimensions.length, roomDimensions.height), wallMat);
    wallWest.rotation.y = Math.PI / 2;
    wallWest.position.set(-roomDimensions.width / 2, roomDimensions.height / 2, 0);
    roomGroup.add(wallWest);
}

function spawnEntity(typeKey) {
    const spec = catalog[typeKey];
    if (!spec) return;

    const geometry = new THREE.BoxGeometry(spec.w, spec.h, spec.d);
    const material = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.4 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(0, spec.h / 2, 0);
    mesh.userData = { id: crypto.randomUUID(), type: typeKey, spec };

    scene.add(mesh);
    sceneObjects.push(mesh);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let activeEntity = null;

viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;

    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(sceneObjects);

    if (hits.length > 0) {
        activeEntity = hits[0].object;
        controls.enabled = false;
    }
});

viewport.addEventListener('pointermove', (e) => {
    if (!activeEntity) return;

    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const floorHits = raycaster.intersectObject(floorHitPlane);

    if (floorHits.length > 0) {
        activeEntity.position.x = floorHits[0].point.x;
        activeEntity.position.z = floorHits[0].point.z;
    }
});

window.addEventListener('pointerup', () => {
    activeEntity = null;
    controls.enabled = true;
});

window.addEventListener('keydown', (e) => {
    if ((e.key === 'r' || e.key === 'R') && sceneObjects.length > 0) {
        const target = activeEntity || sceneObjects[sceneObjects.length - 1];
        target.rotation.y += Math.PI / 4;
    }
});

document.getElementById('input-width').addEventListener('input', (e) => {
    roomDimensions.width = parseFloat(e.target.value);
    document.getElementById('label-width').textContent = `${roomDimensions.width.toFixed(1)} m`;
    generateEnvironment();
});

document.getElementById('input-length').addEventListener('input', (e) => {
    roomDimensions.length = parseFloat(e.target.value);
    document.getElementById('label-length').textContent = `${roomDimensions.length.toFixed(1)} m`;
    generateEnvironment();
});

document.querySelectorAll('.btn-catalog').forEach(btn => {
    btn.addEventListener('click', () => spawnEntity(btn.dataset.item));
});

document.getElementById('btn-clear').addEventListener('click', () => {
    sceneObjects.forEach(obj => scene.remove(obj));
    sceneObjects.length = 0;
});

document.getElementById('btn-export').addEventListener('click', () => {
    const payload = {
        meta: { generator: "OpenAppart 3D", timestamp: new Date().toISOString() },
        room: roomDimensions,
        layout: sceneObjects.map(obj => ({
            id: obj.userData.id,
            type: obj.userData.type,
            name: obj.userData.spec.name,
            coordinates: {
                x: Number(obj.position.x.toFixed(3)),
                y: Number(obj.position.y.toFixed(3)),
                z: Number(obj.position.z.toFixed(3))
            },
            rotationDeg: Math.round(THREE.MathUtils.radToDeg(obj.rotation.y))
        }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_appartement_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
});

window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

generateEnvironment();

function renderLoop() {
    requestAnimationFrame(renderLoop);
    controls.update();
    renderer.render(scene, camera);
}
renderLoop();
