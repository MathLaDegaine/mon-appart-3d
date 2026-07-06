import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 1. CONFIGURATION DE LA SCÈNE ---
const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181818);

const camera = new THREE.PerspectiveCamera(60, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(6, 7, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.shadowMap.enabled = true;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Empêche de passer sous le sol

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 2. GESTION DE LA PIÈCE (Murs & Sol) ---
let roomWidth = 5;
let roomLength = 4;
const wallHeight = 2.5;

const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Plancher invisible pour capturer les clics de souris (Raycasting)
const floorPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshBasicMaterial({ visible: false })
);
floorPlane.rotation.x = -Math.PI / 2;
scene.add(floorPlane);

function buildRoom() {
    // Nettoyer l'ancienne pièce
    while (roomGroup.children.length > 0) {
        roomGroup.remove(roomGroup.children[0]);
    }

    // Grille au sol (1 carreau = 0.5m)
    const grid = new THREE.GridHelper(Math.max(roomWidth, roomLength) * 1.5, Math.max(roomWidth, roomLength) * 3, 0x4CAF50, 0x444444);
    grid.position.y = 0.01;
    roomGroup.add(grid);

    // Sol visuel
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Matériau des murs (semi-transparent pour bien voir à l'intérieur)
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x636e72, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide 
    });

    // Mur Nord (Fond)
    const wallNorth = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, wallHeight), wallMat);
    wallNorth.position.set(0, wallHeight / 2, -roomLength / 2);
    roomGroup.add(wallNorth);

    // Mur Ouest (Gauche)
    const wallWest = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, wallHeight), wallMat);
    wallWest.rotation.y = Math.PI / 2;
    wallWest.position.set(-roomWidth / 2, wallHeight / 2, 0);
    roomGroup.add(wallWest);
}

buildRoom();

// --- 3. CATALOGUE ET GESTION DES OBJETS ---
const placedObjects = [];
const catalog = {
    bed:   { name: "Lit Double", w: 1.4, h: 0.5, d: 1.9, color: 0x0984e3 },
    desk:  { name: "Bureau", w: 1.2, h: 0.75, d: 0.6, color: 0xe17055 },
    sofa:  { name: "Canapé", w: 2.0, h: 0.8, d: 0.9, color: 0x6c5ce7 },
    table: { name: "Table", w: 1.2, h: 0.75, d: 0.8, color: 0x00b894 },
    plug:  { name: "Prise élec.", w: 0.15, h: 0.15, d: 0.05, color: 0xf1c40f, isTech: true },
    water: { name: "Arrivée eau", w: 0.2, h: 0.2, d: 0.1, color: 0x00cec9, isTech: true },
    window:{ name: "Fenêtre", w: 1.2, h: 1.2, d: 0.1, color: 0x74b9ff, isTech: true },
    door:  { name: "Porte", w: 0.9, h: 2.0, d: 0.1, color: 0xd63031, isTech: true }
};

function addItem(type) {
    const spec = catalog[type];
    if (!spec) return;

    const geo = new THREE.BoxGeometry(spec.w, spec.h, spec.d);
    const mat = new THREE.MeshStandardMaterial({ color: spec.color });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Position initiale au centre de la pièce au niveau du sol
    mesh.position.set(0, spec.h / 2, 0);
    mesh.userData = { type, name: spec.name, dimensions: spec };

    scene.add(mesh);
    placedObjects.push(mesh);
}

// --- 4. INTERACTION SOURIS (Raycasting & Glisser-Déposer) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return; // Uniquement clic gauche

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(placedObjects);

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        controls.enabled = false; // Désactiver l'orbite de caméra pendant le drag
    }
});

viewport.addEventListener('pointermove', (event) => {
    if (!selectedObject) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(floorPlane);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        // Maintien de la hauteur de l'objet, déplacement sur X et Z
        selectedObject.position.x = point.x;
        selectedObject.position.z = point.z;
    }
});

window.addEventListener('pointerup', () => {
    selectedObject = null;
    controls.enabled = true; // Réactiver la caméra
});

// Rotation de l'objet sélectionné avec la touche 'R'
window.addEventListener('keydown', (event) => {
    if (event.key === 'r' || event.key === 'R') {
        if (placedObjects.length > 0) {
            // Tourne le dernier objet ajouté ou manipulé de 45°
            const target = selectedObject || placedObjects[placedObjects.length - 1];
            target.rotation.y += Math.PI / 4;
        }
    }
});

// --- 5. ÉVÉNEMENTS DU PANNEAU DE CONTRÔLE ---
document.getElementById('room-width').addEventListener('input', (e) => {
    roomWidth = parseFloat(e.target.value);
    document.getElementById('val-width').textContent = roomWidth;
    buildRoom();
});

document.getElementById('room-length').addEventListener('input', (e) => {
    roomLength = parseFloat(e.target.value);
    document.getElementById('val-length').textContent = roomLength;
    buildRoom();
});

document.querySelectorAll('.btn-item').forEach(btn => {
    btn.addEventListener('click', () => addItem(btn.dataset.type));
});

document.getElementById('btn-clear').addEventListener('click', () => {
    placedObjects.forEach(obj => scene.remove(obj));
    placedObjects.length = 0;
});

// Exportation en JSON
document.getElementById('btn-export').addEventListener('click', () => {
    const layoutData = {
        room: { width: roomWidth, length: roomLength, height: wallHeight },
        items: placedObjects.map(obj => ({
            type: obj.userData.type,
            name: obj.userData.name,
            position: {
                x: parseFloat(obj.position.x.toFixed(2)),
                y: parseFloat(obj.position.y.toFixed(2)),
                z: parseFloat(obj.position.z.toFixed(2))
            },
            rotationYDeg: Math.round(THREE.MathUtils.radToDeg(obj.rotation.y))
        }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layoutData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "mon_plan_appart.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// --- 6. BOUCLE D'ANIMATION & RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
