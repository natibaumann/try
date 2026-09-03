/* Small auto-rotating 3D preview used by the Customization and Salon
   screens in place of the old flat SVG avatar. */
function createTurntablePreview(container, appearance) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(0, 0.9, 3.6);
  camera.lookAt(0, 0.85, 0);

  scene.add(new THREE.HemisphereLight(0xffe9f5, 0xd9b98a, 0.7));
  const key = new THREE.DirectionalLight(0xfff2e0, 1.1);
  key.position.set(2.5, 3.5, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.PointLight(0xffb3d9, 0.6, 8);
  rim.position.set(-2, 1.8, -2);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshStandardMaterial({ color: 0xffe6f2, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const character = createCharacter(appearance);
  scene.add(character.root);

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let running = true;
  function loop() {
    if (!running) return;
    character.root.rotation.y += 0.008;
    character.animate(0.016, 0, false);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();

  return {
    updateAppearance(a) { character.applyAppearance(a); },
    destroy() {
      running = false;
      ro.disconnect();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
