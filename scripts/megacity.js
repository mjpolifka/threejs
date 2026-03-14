import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03040a);
scene.fog = new THREE.Fog(0x060912, 30, 220);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(22, 20, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.6, 0.65);
composer.addPass(bloom);

scene.add(new THREE.AmbientLight(0x5168c8, 0.4));

const moonLight = new THREE.DirectionalLight(0x8db8ff, 0.95);
moonLight.position.set(30, 44, -18);
scene.add(moonLight);

const streetGrid = new THREE.GridHelper(220, 48, 0x182a4f, 0x13203d);
streetGrid.position.y = 0.01;
scene.add(streetGrid);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(220, 220),
  new THREE.MeshStandardMaterial({ color: 0x040914, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const blocks = [];
const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
const buildingMat = new THREE.MeshStandardMaterial({
  color: 0x10182b,
  emissive: 0x11335a,
  emissiveIntensity: 0.55,
  roughness: 0.62,
  metalness: 0.45
});

const city = new THREE.Group();
for (let x = -17; x <= 17; x += 1) {
  for (let z = -17; z <= 17; z += 1) {
    if ((Math.abs(x) < 2 && Math.abs(z) < 2) || Math.random() < 0.12) {
      continue;
    }

    const h = 2 + Math.random() * 18 + (Math.random() ** 3) * 42;
    const w = 0.8 + Math.random() * 1.4;
    const d = 0.8 + Math.random() * 1.4;

    blocks.push({
      position: new THREE.Vector3(x * 5.2, h / 2, z * 5.2),
      scale: new THREE.Vector3(w, h, d),
      pulse: Math.random() * Math.PI * 2
    });
  }
}

const instanced = new THREE.InstancedMesh(buildingGeo, buildingMat, blocks.length);
const matrix = new THREE.Matrix4();
for (let i = 0; i < blocks.length; i += 1) {
  matrix.compose(blocks[i].position, new THREE.Quaternion(), blocks[i].scale);
  instanced.setMatrixAt(i, matrix);
}
instanced.instanceMatrix.needsUpdate = true;
city.add(instanced);
scene.add(city);

const laneMaterial = new THREE.LineBasicMaterial({ color: 0x38a7ff, transparent: true, opacity: 0.85 });
const lanes = new THREE.Group();
for (let i = -9; i <= 9; i += 3) {
  const points = [];
  for (let x = -90; x <= 90; x += 4) {
    points.push(new THREE.Vector3(x, 0.2, i * 5 + Math.sin(x * 0.08) * 1.6));
  }
  lanes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), laneMaterial));
}
scene.add(lanes);

const carGeometry = new THREE.SphereGeometry(0.22, 12, 12);
const cars = [];
const carCount = 180;
for (let i = 0; i < carCount; i += 1) {
  const color = i % 2 ? 0x84c8ff : 0xff4fd8;
  const car = new THREE.Mesh(
    carGeometry,
    new THREE.MeshBasicMaterial({ color })
  );
  scene.add(car);
  cars.push({
    mesh: car,
    speed: 10 + Math.random() * 16,
    lane: (-8 + (i % 16)) * 5,
    offset: Math.random() * 180,
    direction: i % 3 === 0 ? -1 : 1
  });
}

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  buildingMat.emissiveIntensity = 0.5 + Math.sin(elapsed * 0.7) * 0.15;

  for (let i = 0; i < cars.length; i += 1) {
    const car = cars[i];
    const movement = ((elapsed * car.speed + car.offset) % 180) - 90;
    car.mesh.position.set(movement * car.direction, 0.38, car.lane + Math.sin(elapsed * 2 + i) * 0.8);
  }

  const orbitRadius = 74;
  camera.position.x = Math.sin(elapsed * 0.14) * orbitRadius;
  camera.position.z = Math.cos(elapsed * 0.14) * orbitRadius;
  camera.position.y = 26 + Math.sin(elapsed * 0.33) * 7;
  camera.lookAt(0, 10, 0);

  lanes.rotation.y = elapsed * 0.02;

  composer.render();
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
