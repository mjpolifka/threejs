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
for (let x = -17; x <= 17; x += 1) {
  for (let z = -17; z <= 17; z += 1) {
    if ((Math.abs(x) < 2 && Math.abs(z) < 2) || Math.random() < 0.12) continue;
    const h = 2 + Math.random() * 18 + (Math.random() ** 3) * 42;
    blocks.push({
      position: new THREE.Vector3(x * 5.2, h / 2, z * 5.2),
      scale: new THREE.Vector3(0.8 + Math.random() * 1.4, h, 0.8 + Math.random() * 1.4)
    });
  }
}

const buildingMat = new THREE.MeshStandardMaterial({
  color: 0x10182b,
  emissive: 0x1b4a84,
  emissiveIntensity: 0.65,
  roughness: 0.62,
  metalness: 0.45
});
const instanced = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), buildingMat, blocks.length);
const matrix = new THREE.Matrix4();
for (let i = 0; i < blocks.length; i += 1) {
  matrix.compose(blocks[i].position, new THREE.Quaternion(), blocks[i].scale);
  instanced.setMatrixAt(i, matrix);
}
instanced.instanceMatrix.needsUpdate = true;
scene.add(instanced);

const lanes = new THREE.Group();
for (let i = -9; i <= 9; i += 3) {
  const points = [];
  for (let x = -90; x <= 90; x += 4) {
    points.push(new THREE.Vector3(x, 0.2, i * 5 + Math.sin(x * 0.08) * 1.6));
  }
  lanes.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x38a7ff, transparent: true, opacity: 0.65 })
  ));
}
scene.add(lanes);

const cars = [];
for (let i = 0; i < 180; i += 1) {
  const car = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshBasicMaterial({ color: i % 2 ? 0x84c8ff : 0xff4fd8 })
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
  buildingMat.emissiveIntensity = 0.55 + Math.sin(elapsed * 0.7) * 0.18;

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
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
