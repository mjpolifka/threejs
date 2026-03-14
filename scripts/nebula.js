import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050d);
scene.fog = new THREE.FogExp2(0x070915, 0.018);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 8, 28);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 10;
controls.maxDistance = 70;

const ambient = new THREE.AmbientLight(0x6e87ff, 0.65);
scene.add(ambient);

const keyLight = new THREE.PointLight(0x80f0ff, 38, 200, 2);
keyLight.position.set(12, 16, 8);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0xd382ff, 32, 180, 2);
rimLight.position.set(-15, -8, -10);
scene.add(rimLight);

const particleCount = 12000;
const positions = new Float32Array(particleCount * 3);
const scales = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i += 1) {
  const radius = 2 + Math.random() * 24;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi) * 0.45;
  const z = radius * Math.sin(phi) * Math.sin(theta);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  scales[i] = Math.random();
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    attribute float aScale;
    uniform float uTime;
    varying float vPulse;
    varying float vDepth;

    void main() {
      vec3 transformed = position;
      float t = uTime * 0.18 + aScale * 8.0;

      transformed.x += sin(t + position.y * 0.5) * 1.2;
      transformed.y += cos(t * 1.3 + position.z * 0.45) * 0.8;
      transformed.z += sin(t * 0.8 + position.x * 0.3) * 1.0;

      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = (6.5 + 12.0 * aScale) * (1.0 / -mvPosition.z);

      vPulse = sin(uTime * 2.0 + aScale * 19.0) * 0.5 + 0.5;
      vDepth = smoothstep(40.0, 0.0, -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying float vPulse;
    varying float vDepth;

    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      float core = smoothstep(0.28, 0.0, dist);
      float halo = smoothstep(0.52, 0.15, dist);
      vec3 colorA = vec3(0.42, 0.87, 1.0);
      vec3 colorB = vec3(0.89, 0.46, 1.0);
      vec3 color = mix(colorA, colorB, vPulse);
      float alpha = (core * 0.75 + halo * 0.35) * vDepth;
      gl_FragColor = vec4(color, alpha);
    }
  `
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

const coreGeometry = new THREE.IcosahedronGeometry(3.2, 4);
const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x76d2ff,
  emissive: 0x2548aa,
  emissiveIntensity: 1.4,
  roughness: 0.18,
  metalness: 0.35,
  clearcoat: 1,
  clearcoatRoughness: 0.2
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
scene.add(core);

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  material.uniforms.uTime.value = elapsed;

  core.rotation.x = elapsed * 0.25;
  core.rotation.y = elapsed * 0.35;
  core.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.04);

  particles.rotation.y = elapsed * 0.04;
  particles.rotation.x = Math.sin(elapsed * 0.2) * 0.12;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
