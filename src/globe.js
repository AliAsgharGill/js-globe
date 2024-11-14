import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import countries from "./countries.geo.json";
import TWEEN from "@tweenjs/tween.js";

function createGlobe(options = {}) {
  const {
    earthTexturePath = "/earth.png",
    moonTexturePath = "/moon1.png",
    cloudTexturePath = "/clouds4.jpg",
    markerIconPath = "/location.png",
    cosmosTexturePath = "/milkyway.jpg",
    locations = [
      { name: "New York City", lat: 40.7128, lon: -74.006 },
      { name: "Paris", lat: 48.8566, lon: 2.3522 },
    ],
  } = options;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const textureLoader = new THREE.TextureLoader();
  const loadTextures = Promise.all([
    textureLoader.loadAsync(earthTexturePath),
    textureLoader.loadAsync(moonTexturePath),
    textureLoader.loadAsync(cloudTexturePath),
    textureLoader.loadAsync(markerIconPath),
    textureLoader.loadAsync(cosmosTexturePath),
  ]);

  loadTextures.then(
    ([earthTexture, moonTexture, cloudTexture, markerIcon, cosmosTexture]) => {
      const background = new THREE.Mesh(
        new THREE.SphereGeometry(500, 64, 64),
        new THREE.MeshBasicMaterial({
          map: cosmosTexture,
          side: THREE.BackSide,
        })
      );
      scene.add(background);

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshBasicMaterial({ map: earthTexture })
      );
      scene.add(earth);

      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.01, 64, 64),
        new THREE.MeshBasicMaterial({
          map: cloudTexture,
          transparent: true,
          opacity: 0.3,
        })
      );
      scene.add(clouds);

      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 32, 32),
        new THREE.MeshBasicMaterial({ map: moonTexture })
      );
      moon.position.set(-2, 0, 0);
      scene.add(moon);

      const markers = [];
      const names = [];

      locations.forEach(({ lat, lon, name }) => {
        const markerPosition = latLonToXYZ(lat, lon, 1.03);
        const marker = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: markerIcon })
        );
        marker.position.copy(markerPosition);
        marker.scale.set(0.04, 0.04, 0.04);
        scene.add(marker);
        markers.push(marker);

        const nameSprite = createLabelSprite(name);
        nameSprite.position
          .copy(markerPosition)
          .add(new THREE.Vector3(0, 0.05, 0));
        nameSprite.scale.set(0.3, 0.3, 1);
        scene.add(nameSprite);
        names.push(nameSprite);
      });

      function zoomToLocation(targetPosition) {
        const from = { zoom: camera.position.z };
        const to = { zoom: targetPosition.length() };

        new TWEEN.Tween(from)
          .to(to, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(() => {
            camera.position.set(
              targetPosition.x * from.zoom,
              targetPosition.y * from.zoom,
              targetPosition.z * from.zoom
            );
            camera.lookAt(0, 0, 0);
          })
          .start();
      }

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let selectedLocation = null;

      function onMouseClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = [...markers, ...names].flatMap((object) =>
          raycaster.intersectObject(object)
        );
        if (intersects.length > 0) {
          selectedLocation = intersects[0].object;
          zoomToLocation(selectedLocation.position);
        }
      }

      window.addEventListener("click", onMouseClick);
    }
  );

  function latLonToXYZ(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = lon * (Math.PI / -180);
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function createLabelSprite(text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = "28px Arial";
    context.fillStyle = "yellow";
    context.shadowColor = "black";
    context.shadowBlur = 3;
    context.fillText(text, 10, 50);
    return new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) })
    );
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onWindowResize);

  function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

export default createGlobe;
