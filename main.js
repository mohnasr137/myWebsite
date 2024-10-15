import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import spline from "./imports/spline.js";

// function isMobile() {
//   return /Mobi/i.test(navigator.userAgent);
// }

if (WebGL.isWebGL2Available()) {
  // Setup scene, camera, and renderer
  const width = window.innerWidth;
  let height = window.innerHeight;
  // if (isMobile()) {
  //   console.log(height);
  //   height = document.body.scrollHeight;
  //   console.log(height);
  // } else {
  //   height = window.innerHeight;
  // }
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.6);

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  camera.position.z = 3;

  // Append renderer to DOM
  document.getElementById("backgroundCanvas").appendChild(renderer.domElement);
  renderer.setSize(width, height);
  renderer.setAnimationLoop(animate);

  // Orbit controls with damping
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.2;
  controls.minDistance = 2.3;
  controls.maxDistance = 8;

  // Post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    1.5,
    0.4,
    100
  );
  bloomPass.threshold = 0.002;
  bloomPass.strength = 3.5;
  bloomPass.radius = 0;
  composer.addPass(bloomPass);

  // Create spline and tube geometry
  const points = spline.getPoints(100);
  const tubeGeometry = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);
  const tubeMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: true,
  });
  const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
  scene.add(tube);

  // Add tube edges
  const tubeEdges = new THREE.EdgesGeometry(tubeGeometry, 0.2);
  const tubeLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const tubeLines = new THREE.LineSegments(tubeEdges, tubeLineMaterial);
  scene.add(tubeLines);

  // Create random boxes along the spline
  const numBoxes = 100;
  const boxSize = 0.075;
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

  for (let i = 0; i < numBoxes; i++) {
    const p = (i / numBoxes + Math.random() * 0.1) % 1;
    const position = tubeGeometry.parameters.path.getPointAt(p);
    position.x += Math.random() - 0.4;
    position.z += Math.random() - 0.4;

    const rotation = new THREE.Vector3(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    // Add box wireframe lines
    const boxEdges = new THREE.EdgesGeometry(boxGeometry, 0.2);
    const boxLineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const boxLines = new THREE.LineSegments(boxEdges, boxLineMaterial);

    boxLines.position.copy(position);
    boxLines.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(boxLines);
  }

  // Window resize event listener
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("scroll", () => {
    camera.position.z = 3;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  // Camera update function
  const updateCamera = (t) => {
    const time = t * 0.1;
    const looptime = 15 * 1000;
    const p = (time % looptime) / looptime;
    const position = tubeGeometry.parameters.path.getPointAt(p);
    const lookAt = tubeGeometry.parameters.path.getPointAt((p + 0.03) % 1);
    camera.position.copy(position);
    camera.lookAt(lookAt);
  };

  // Animation loop
  function animate(t = 0) {
    updateCamera(t);
    composer.render(scene, camera);
    controls.update();
  }
} else {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.getElementById("container").appendChild(warning);
}
