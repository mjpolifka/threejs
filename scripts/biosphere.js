const scene = new THREE.Scene();
scene.background = new THREE.Color(0x90c8ff);
scene.fog = new THREE.Fog(0xa8d8ff, 45, 200);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(30, 24, 34);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const pointer = { x: 0, y: 0 };
window.addEventListener('mousemove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
});

scene.add(new THREE.HemisphereLight(0xd8eeff, 0x335640, 0.75));
const sun = new THREE.DirectionalLight(0xfff2cf, 1.2);
sun.position.set(35, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const terrainGeo = new THREE.PlaneGeometry(150, 150, 180, 180);
terrainGeo.rotateX(-Math.PI / 2);
const pos = terrainGeo.attributes.position;
const colorArray = new Float32Array(pos.count * 3);

function sampleTerrainHeight(x, z) {
  return Math.sin(x * 0.08) * Math.cos(z * 0.07) * 2.7 + Math.sin((x + z) * 0.05) * 1.4 + Math.cos((x - z) * 0.06) * 1.2;
}

for (let i = 0; i < pos.count; i += 1) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  pos.setY(i, sampleTerrainHeight(x, z));
  const moisture = 0.45 + Math.sin(x * 0.04 + z * 0.05) * 0.2;
  colorArray[i * 3] = 0.15 + moisture * 0.2;
  colorArray[i * 3 + 1] = 0.4 + moisture * 0.4;
  colorArray[i * 3 + 2] = 0.18 + moisture * 0.14;
}
terrainGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0.02 }));
terrain.receiveShadow = true;
scene.add(terrain);

const water = new THREE.Mesh(
  new THREE.CircleGeometry(22, 128),
  new THREE.MeshPhysicalMaterial({
    color: 0x4ca8d2,
    roughness: 0.08,
    transmission: 0.85,
    transparent: true,
    opacity: 0.72,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.2
  })
);
water.rotation.x = -Math.PI / 2;
water.position.set(-8, 1.2, -10);
scene.add(water);

const treeGroup = new THREE.Group();
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x593d2a, roughness: 0.9 });
const leavesMat = new THREE.MeshStandardMaterial({ color: 0x4f9243, roughness: 0.8 });

for (let i = 0; i < 140; i += 1) {
  const x = (Math.random() - 0.5) * 120;
  const z = (Math.random() - 0.5) * 120;
  if ((x + 8) ** 2 + (z + 10) ** 2 < 28 ** 2) continue;
  const scale = 0.7 + Math.random() * 0.75;
  const baseY = sampleTerrainHeight(x, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.26 * scale, 2.2 * scale, 8), trunkMat);
  trunk.position.set(x, baseY + 1.1 * scale, z);
  trunk.castShadow = true;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15 * scale, 14, 10), leavesMat);
  crown.position.set(x, baseY + 2.65 * scale, z);
  crown.castShadow = true;
  treeGroup.add(trunk, crown);
}
scene.add(treeGroup);

const firefliesCount = 420;
const firefliesGeo = new THREE.BufferGeometry();
const fireflyPos = new Float32Array(firefliesCount * 3);
const fireflySeeds = new Float32Array(firefliesCount);
for (let i = 0; i < firefliesCount; i += 1) {
  fireflyPos[i * 3] = (Math.random() - 0.5) * 85;
  fireflyPos[i * 3 + 1] = 4 + Math.random() * 12;
  fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 85;
  fireflySeeds[i] = Math.random() * Math.PI * 2;
}
firefliesGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
firefliesGeo.setAttribute('seed', new THREE.BufferAttribute(fireflySeeds, 1));

const firefliesMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 } },
  vertexShader: `
    attribute float seed;
    uniform float uTime;
    varying float vGlow;
    void main() {
      vec3 transformed = position;
      transformed.y += sin(uTime * 1.6 + seed * 3.0) * 1.1;
      transformed.x += cos(uTime * 0.8 + seed) * 0.5;
      transformed.z += sin(uTime * 0.9 + seed * 2.2) * 0.5;
      vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = 10.0 * (1.0 / -mv.z);
      vGlow = sin(uTime * 5.0 + seed * 12.0) * 0.5 + 0.5;
    }
  `,
  fragmentShader: `
    varying float vGlow;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      float alpha = smoothstep(0.45, 0.0, dist) * (0.2 + vGlow * 0.8);
      gl_FragColor = vec4(1.0, 0.95, 0.55, alpha);
    }
  `
});
scene.add(new THREE.Points(firefliesGeo, firefliesMat));

const clock = new THREE.Clock();
function animate() {
  const elapsed = clock.getElapsedTime();
  const dayPhase = (Math.sin(elapsed * 0.08) + 1) / 2;
  const sky = new THREE.Color().setHSL(0.57 - dayPhase * 0.09, 0.62, 0.72 - dayPhase * 0.24);
  scene.background = sky;
  scene.fog.color.copy(sky);

  sun.position.set(Math.sin(elapsed * 0.08) * 45, 18 + dayPhase * 52, Math.cos(elapsed * 0.08) * 28);
  sun.intensity = 0.5 + dayPhase * 1.3;

  water.material.color.setHSL(0.56, 0.48, 0.44 + Math.sin(elapsed * 1.4) * 0.03);
  water.position.y = 1.2 + Math.sin(elapsed * 1.1) * 0.12;
  treeGroup.rotation.y = Math.sin(elapsed * 0.09) * 0.05;
  firefliesMat.uniforms.uTime.value = elapsed;

  camera.position.x += ((30 + pointer.x * 16) - camera.position.x) * 0.015;
  camera.position.y += ((24 + pointer.y * 8) - camera.position.y) * 0.015;
  camera.lookAt(0, 7, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
