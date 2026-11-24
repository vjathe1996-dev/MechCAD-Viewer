import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const viewport = document.querySelector("#viewport");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x131b26);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(6, 5, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 0.5, 0);

scene.add(new THREE.HemisphereLight(0xdcecff, 0x293445, 2.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(5, 9, 6);
keyLight.castShadow = true;
scene.add(keyLight);

const grid = new THREE.GridHelper(20, 40, 0x49617a, 0x29394b);
scene.add(grid);
const axes = new THREE.AxesHelper(2.5);
scene.add(axes);

const objects = [];
let selected = null;
let nextId = 1;

const material = () => new THREE.MeshStandardMaterial({
  color: 0x2998e8, metalness: 0.28, roughness: 0.42
});

function addPrimitive(type) {
  let geometry;
  if (type === "Box") geometry = new THREE.BoxGeometry(2, 2, 2);
  if (type === "Cylinder") geometry = new THREE.CylinderGeometry(1, 1, 2, 48);
  if (type === "Sphere") geometry = new THREE.SphereGeometry(1.15, 40, 28);
  const mesh = new THREE.Mesh(geometry, material());
  mesh.position.set((objects.length % 3) * 2.5 - 1.25, 1, Math.floor(objects.length / 3) * 2.5);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { id: nextId++, type, name: `${type}_${nextId - 1}` };
  scene.add(mesh);
  objects.push(mesh);
  selectObject(mesh);
  updateTree();
  setStatus(`${mesh.userData.name} created`);
}

function selectObject(mesh) {
  if (selected) selected.material.emissive.setHex(0x000000);
  selected = mesh;
  if (selected) selected.material.emissive.setHex(0x123b59);
  updateTree();
  updateProperties();
}

function updateTree() {
  const tree = document.querySelector("#modelTree");
  tree.innerHTML = "";
  document.querySelector("#objectCount").textContent = objects.length;
  for (const obj of objects) {
    const button = document.createElement("button");
    button.className = `tree-item${obj === selected ? " selected" : ""}`;
    button.innerHTML = `<span class="tree-icon">◆</span><span></span>`;
    button.lastElementChild.textContent = obj.userData.name;
    button.addEventListener("click", () => selectObject(obj));
    tree.appendChild(button);
  }
}

function updateProperties() {
  const panel = document.querySelector("#propertiesContent");
  if (!selected) {
    panel.innerHTML = '<p class="muted">Select a solid in the viewport or model tree to inspect it.</p>';
    return;
  }
  const p = selected.position;
  const dims = new THREE.Box3().setFromObject(selected).getSize(new THREE.Vector3());
  panel.innerHTML = "";
  const rows = [
    ["Name", selected.userData.name],
    ["Type", selected.userData.type],
    ["Position X", p.x.toFixed(2)],
    ["Position Y", p.y.toFixed(2)],
    ["Position Z", p.z.toFixed(2)],
    ["Bounds X", dims.x.toFixed(2)],
    ["Bounds Y", dims.y.toFixed(2)],
    ["Bounds Z", dims.z.toFixed(2)]
  ];
  for (const [label, value] of rows) {
    const row = document.createElement("div");
    row.className = "property-row";
    const a = document.createElement("span");
    const b = document.createElement("strong");
    a.textContent = label;
    b.textContent = value;
    row.append(a, b);
    panel.appendChild(row);
  }
}

function setStatus(message) {
  document.querySelector("#statusText").textContent = message;
}

function deleteSelected() {
  if (!selected) return setStatus("Nothing selected");
  scene.remove(selected);
  selected.geometry.dispose();
  selected.material.dispose();
  const name = selected.userData.name;
  objects.splice(objects.indexOf(selected), 1);
  selected = null;
  updateTree();
  updateProperties();
  setStatus(`${name} deleted`);
}

function fitView() {
  if (!objects.length) return homeView();
  const bounds = new THREE.Box3();
  objects.forEach(o => bounds.expandByObject(o));
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3()).length();
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(size * 0.8, size * 0.65, size * 0.9));
  camera.near = Math.max(0.01, size / 1000);
  camera.far = Math.max(1000, size * 20);
  camera.updateProjectionMatrix();
  controls.update();
}

function homeView() {
  camera.position.set(6, 5, 7);
  controls.target.set(0, 0.5, 0);
  controls.update();
}

document.querySelector("#addBox").addEventListener("click", () => addPrimitive("Box"));
document.querySelector("#addCylinder").addEventListener("click", () => addPrimitive("Cylinder"));
document.querySelector("#addSphere").addEventListener("click", () => addPrimitive("Sphere"));
document.querySelector("#deleteSelected").addEventListener("click", deleteSelected);
document.querySelector("#resetScene").addEventListener("click", () => {
  for (const obj of [...objects]) {
    scene.remove(obj);
    obj.geometry.dispose();
    obj.material.dispose();
  }
  objects.length = 0;
  selected = null;
  addPrimitive("Box");
  setStatus("Scene reset");
});
document.querySelector("#fitView").addEventListener("click", fitView);
document.querySelector("#homeView").addEventListener("click", homeView);
document.querySelector("#toggleGrid").addEventListener("click", () => {
  grid.visible = !grid.visible;
  setStatus(`Grid ${grid.visible ? "shown" : "hidden"}`);
});
document.querySelector("#toggleAxes").addEventListener("click", () => {
  axes.visible = !axes.visible;
  setStatus(`Axes ${axes.visible ? "shown" : "hidden"}`);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
renderer.domElement.addEventListener("pointerdown", event => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(objects, false);
  if (hits.length) selectObject(hits[0].object);
});

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(viewport);
resize();
addPrimitive("Box");

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
