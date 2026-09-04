/* Builds the actual 3D content (ground, buildings, dressing, lighting) for
   the Plaza and the Mall interior. Each hotspot/building records a
   footprint (for collision) and a doorFront point (for the "walk up and
   press E" interaction), consumed generically by world3d.js. */
function addHotspot(list, colliders, mesh, id, label, action) {
  const doorFront = mesh.userData.doorFront || { x: 0, z: 0 };
  const rot = mesh.rotation.y;
  const world = {
    x: mesh.position.x + doorFront.z * Math.sin(rot),
    z: mesh.position.z + doorFront.z * Math.cos(rot),
  };
  list.push({ id, label, action, position: world });
  if (mesh.userData.footprint) {
    const swapped = Math.abs(Math.sin(rot)) > 0.5;
    const w = swapped ? mesh.userData.footprint.d : mesh.userData.footprint.w;
    const d = swapped ? mesh.userData.footprint.w : mesh.userData.footprint.d;
    colliders.push({ x: mesh.position.x, z: mesh.position.z, w, d });
  }
}

/* A vertex-colored (not custom-shader) sky dome: plain MeshBasicMaterial +
   per-vertex colors is a much better-trodden rendering path than a
   hand-written ShaderMaterial, which turned out to rasterize a stray dark
   patch near the horizon on at least one WebGL backend. */
function addSky(scene, topColor, bottomColor) {
  const radius = 200;
  const geo = new THREE.SphereGeometry(radius, 32, 32);
  const top = new THREE.Color(topColor), bottom = new THREE.Color(bottomColor);
  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < posAttr.count; i++) {
    const h = THREE.MathUtils.clamp(posAttr.getY(i) / radius * 0.5 + 0.5, 0, 1);
    c.copy(bottom).lerp(top, h);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });
  scene.add(new THREE.Mesh(geo, mat));
}

function buildPlazaScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbfe0f0, 25, 70);
  addSky(scene, '#7ec8f2', '#dff3ff');

  const hemi = new THREE.HemisphereLight(0xbfe0ff, 0xe8d8b8, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.3);
  sun.position.set(18, 28, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0015;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), new THREE.MeshStandardMaterial({ map: makePavementTexture(), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grassRing = new THREE.Mesh(new THREE.RingGeometry(24, 45, 32), new THREE.MeshStandardMaterial({ color: 0x8fbf6a, roughness: 1 }));
  grassRing.rotation.x = -Math.PI / 2;
  grassRing.position.y = -0.01;
  grassRing.receiveShadow = true;
  scene.add(grassRing);

  const hotspots = [];
  const colliders = [];
  const clueProps = [];

  /* Alternating z-depth (not one flat row) plus a slight inward angle on
     the two outermost buildings gives the street a layered, surrounding-
     courtyard feel instead of a single flat wall of shops. */
  const storeSpecs = [
    { id: 'plaza_pets', x: -25, z: -10.5, rot: 0.26, color: 0x6fae5c, roof: 0x3f7a34, label: 'Plaza Pets', icon: '🐾', target: 'plaza_pets' },
    { id: 'plaza_shoes', x: -16.5, z: -12.5, rot: 0, color: 0xd9556b, roof: 0x8a2f3f, label: 'Plaza Shoes', icon: '👠', target: 'plaza_shoes' },
    { id: 'plaza_clothes', x: -9.5, z: -11, rot: 0, color: 0x4a72b0, roof: 0x2a4a7a, label: 'Plaza Threads', icon: '👗', target: 'plaza_clothes' },
    { id: 'plaza_salon', x: 9.5, z: -11, rot: 0, color: 0xe0a04f, roof: 0xa06a2a, label: 'Plaza Salon', icon: '💇', target: null },
    { id: 'plaza_jewelry', x: 16.5, z: -12.5, rot: 0, color: 0x6fc2c9, roof: 0x2f7a80, label: 'Plaza Gems', icon: '💎', target: 'plaza_jewelry' },
    { id: 'plaza_furniture', x: 25, z: -10.5, rot: -0.26, color: 0xb98a5a, roof: 0x7a5530, label: 'Plaza Home Goods', icon: '🛋️', target: 'plaza_furniture' },
  ];

  storeSpecs.forEach((s) => {
    const b = createBuilding({ width: 6.4, height: 4.4, depth: 5.5, color: s.color, roofColor: s.roof, label: s.label, icon: s.icon });
    b.position.set(s.x, 0, s.z);
    b.rotation.y = s.rot;
    scene.add(b);
    const plant = createFurnitureMesh({ icon: 'plant', color: 0x4fae5c });
    plant.position.set(s.x - 2.6, 0, s.z + 3.4);
    scene.add(plant);
    const action = s.id === 'plaza_salon' ? { type: 'salon' } : { type: 'store', target: s.target };
    addHotspot(hotspots, colliders, b, s.id, s.label, action);
  });

  const mall = createBuilding({ width: 12, height: 7, depth: 7.5, color: 0xa04fd9, roofColor: 0x6a2f8a, label: 'Grand Mall', icon: '🏬' });
  mall.position.set(0, 0, -13);
  scene.add(mall);
  addHotspot(hotspots, colliders, mall, 'mall_entrance', 'Mall Entrance', { type: 'goto', target: 'mall' });

  const house = createHouse({ label: 'Your Place' });
  house.position.set(-15, 0, 3);
  house.rotation.y = 0.18;
  scene.add(house);
  addHotspot(hotspots, colliders, house, 'home', 'Your Place', { type: 'home' });

  const board = createBulletinBoard();
  board.position.set(15, 0, 3);
  board.rotation.y = -0.18;
  scene.add(board);
  addHotspot(hotspots, colliders, board, 'missions', 'Mission Board', { type: 'missions' });

  const fountain = createFountain();
  fountain.position.set(0, 0, 2);
  scene.add(fountain);
  colliders.push({ x: 0, z: 2, w: 4.8, d: 4.8 });
  clueProps.push({ id: 'clue_fountain', label: 'Fountain', position: { x: 0, z: 2 }, radius: 3.2 });

  const plazaInlay = new THREE.Mesh(new THREE.CircleGeometry(8, 32), new THREE.MeshStandardMaterial({ color: 0xead9c2, roughness: 0.9 }));
  plazaInlay.rotation.x = -Math.PI / 2;
  plazaInlay.position.set(0, 0.005, 2);
  plazaInlay.receiveShadow = true;
  scene.add(plazaInlay);

  [-21, -12.5, -4, 4, 12.5, 21].forEach((x) => {
    const lamp = createLamp();
    lamp.position.set(x, 0, -4);
    scene.add(lamp);
  });
  [[-6, 6], [6, 6], [-9, -2], [9, -2]].forEach(([x, z]) => {
    const bench = createBench();
    bench.position.set(x, 0, z);
    bench.rotation.y = z < 2 ? Math.PI : 0;
    scene.add(bench);
  });
  [[-4, 8.5], [4, 8.5], [-18, 6], [18, 6]].forEach(([x, z]) => {
    const plant = createFurnitureMesh({ icon: 'plant', color: 0x4fae5c });
    plant.position.set(x, 0, z);
    scene.add(plant);
  });

  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    if (Math.random() > 0.4) continue;
    const r = 30 + Math.random() * 12;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 6), new THREE.MeshStandardMaterial({ color: 0x7a5535 }));
    trunk.position.y = 0.7;
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshStandardMaterial({ color: 0x5a9a4a }));
    leaves.position.y = 1.7;
    tree.add(trunk, leaves);
    tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    tree.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    scene.add(tree);
  }

  return {
    scene, hotspots, colliders, clueProps,
    spawn: { x: 0, z: 16, yaw: 0 },
    bounds: { minX: -34, maxX: 34, minZ: -18, maxZ: 22 },
    name: 'Downtown Plaza',
  };
}

function buildMallScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcbb8d9, 22, 50);
  scene.background = new THREE.Color(0xcbb8d9);

  const hallW = 38, hallD = 22, hallH = 6.5;

  const ambient = new THREE.AmbientLight(0xffffff, 0.32);
  scene.add(ambient);
  const skylight = new THREE.DirectionalLight(0xfff2e0, 0.45);
  skylight.position.set(6, hallH + 4, -4);
  skylight.castShadow = true;
  skylight.shadow.mapSize.set(1536, 1536);
  skylight.shadow.camera.left = -20; skylight.shadow.camera.right = 20;
  skylight.shadow.camera.top = 12; skylight.shadow.camera.bottom = -12;
  scene.add(skylight);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallD), new THREE.MeshStandardMaterial({ map: makeMallFloorTexture(), roughness: 0.45, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xddc9e8, roughness: 0.88 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(hallW, hallH, 0.4), wallMat);
  backWall.position.set(0, hallH / 2, -hallD / 2);
  backWall.receiveShadow = true;
  scene.add(backWall);
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, hallH, hallD), wallMat);
    wall.position.set(side * hallW / 2, hallH / 2, 0);
    wall.receiveShadow = true;
    scene.add(wall);
  });
  const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(hallW / 2 - 3, hallH, 0.4), wallMat);
  frontWallL.position.set(-(hallW / 4 + 1.5), hallH / 2, hallD / 2);
  scene.add(frontWallL);
  const frontWallR = frontWallL.clone();
  frontWallR.position.x = hallW / 4 + 1.5;
  scene.add(frontWallR);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallD), new THREE.MeshStandardMaterial({ color: 0xf2eaf5, roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = hallH;
  scene.add(ceiling);

  /* A decorative (non-walkable) upper mezzanine along the back wall - a
     second visible level so the hall reads as more than one flat box. */
  const mezzMat = new THREE.MeshStandardMaterial({ color: 0xf3ecf7, roughness: 0.85 });
  const mezzFloor = new THREE.Mesh(new THREE.BoxGeometry(hallW * 0.7, 0.25, 2.2), mezzMat);
  mezzFloor.position.set(0, hallH * 0.62, -hallD / 2 + 1.3);
  mezzFloor.castShadow = true; mezzFloor.receiveShadow = true;
  scene.add(mezzFloor);
  for (let x = -hallW * 0.34; x <= hallW * 0.34; x += 1.6) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
    post.position.set(x, hallH * 0.62 + 0.52, -hallD / 2 + 2.35);
    scene.add(post);
  }
  const mezzRail = new THREE.Mesh(new THREE.BoxGeometry(hallW * 0.7, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
  mezzRail.position.set(0, hallH * 0.62 + 0.9, -hallD / 2 + 2.35);
  scene.add(mezzRail);
  [-hallW * 0.22, hallW * 0.22].forEach((x) => {
    const mezzWindow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, hallH * 0.3), new THREE.MeshStandardMaterial({ color: 0xdff3ff, emissive: 0xaad9ff, emissiveIntensity: 0.3 }));
    mezzWindow.position.set(x, hallH * 0.8, -hallD / 2 + 0.22);
    scene.add(mezzWindow);
  });

  const hotspots = [];
  const colliders = [];
  const clueProps = [];

  const lightPositions = [[-10, -6], [10, -6], [-10, 4], [10, 4]];
  lightPositions.forEach(([x, z]) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.2), new THREE.MeshStandardMaterial({ color: 0xfff2d9, emissive: 0xffdd99, emissiveIntensity: 0.5 }));
    panel.rotation.x = Math.PI / 2;
    panel.position.set(x, hallH - 0.05, z);
    scene.add(panel);
    const pl = new THREE.PointLight(0xffe6c2, 0.5, 13, 2);
    pl.position.set(x, hallH - 0.8, z);
    scene.add(pl);
  });

  const storeSpecs = [
    { id: 'mall_glossy', x: -hallW / 2 + 0.15, z: -7, side: 'west', color: 0xe04fa0, label: 'Glossy', icon: '✨' },
    { id: 'mall_pets', x: -hallW / 2 + 0.15, z: 3, side: 'west', color: 0x6fae5c, label: 'Trendy Tails', icon: '🐶' },
    { id: 'mall_urban', x: hallW / 2 - 0.15, z: -7, side: 'east', color: 0x555555, label: 'Urban Edge', icon: '🧢' },
    { id: 'mall_furniture', x: hallW / 2 - 0.15, z: 3, side: 'east', color: 0xb98a5a, label: 'Chic Interiors', icon: '🪑' },
    { id: 'mall_shoes', x: -6, z: -hallD / 2 + 0.15, side: 'north', color: 0xc92f3f, label: 'Sole Mates', icon: '👟' },
    { id: 'mall_jewelry', x: 6, z: -hallD / 2 + 0.15, side: 'north', color: 0x9a7ad9, label: 'Sparkle & Co', icon: '👑' },
  ];

  storeSpecs.forEach((s) => {
    const store = createStorefront({ width: 5.5, depth: 1, label: s.label, icon: s.icon, color: s.color });
    store.position.set(s.x, 0, s.z);
    if (s.side === 'west') store.rotation.y = Math.PI / 2;
    else if (s.side === 'east') store.rotation.y = -Math.PI / 2;
    scene.add(store);
    addHotspot(hotspots, colliders, store, s.id, s.label, { type: 'store', target: s.id });
  });

  [[-hallW / 4, -hallD / 2 + 1], [hallW / 4, -hallD / 2 + 1], [-hallW / 4, hallD / 2 - 1], [hallW / 4, hallD / 2 - 1]].forEach(([x, z]) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, hallH, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
    pillar.position.set(x, hallH / 2, z);
    pillar.castShadow = true;
    scene.add(pillar);
    colliders.push({ x, z, w: 0.7, d: 0.7 });
  });

  const kiosk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0xf2d24b, roughness: 0.6 }));
  kiosk.position.set(6, 0.55, 6);
  kiosk.castShadow = true;
  scene.add(kiosk);
  colliders.push({ x: 6, z: 6, w: 2, d: 2 });
  clueProps.push({ id: 'clue_kiosk', label: 'Info Kiosk', position: { x: 6, z: 6 }, radius: 2.6 });

  const foodTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  foodTable.position.set(-6, 0.35, 6);
  foodTable.castShadow = true;
  scene.add(foodTable);
  colliders.push({ x: -6, z: 6, w: 2, d: 1.6 });
  clueProps.push({ id: 'clue_foodcourt', label: 'Food Court', position: { x: -6, z: 6 }, radius: 2.6 });

  const exitDoor = new THREE.Group();
  const exitGlow = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.5), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.5, emissive: 0x88ccff, emissiveIntensity: 0.5 }));
  exitGlow.position.set(0, 1.75, hallD / 2 - 0.05);
  exitDoor.add(exitGlow);
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: makeSignTexture('Exit to Plaza', '🚪', '#2a2a3a', '#ffffff') }));
  exitSign.position.set(0, 3.6, hallD / 2 - 0.05);
  exitDoor.add(exitSign);
  exitDoor.userData.doorFront = { x: 0, z: -2 };
  exitDoor.position.set(0, 0, hallD / 2);
  scene.add(exitDoor);
  addHotspot(hotspots, colliders, exitDoor, 'exit', 'Exit to Plaza', { type: 'goto', target: 'plaza' });

  return {
    scene, hotspots, colliders, clueProps,
    spawn: { x: 0, z: hallD / 2 - 2.5, yaw: 0 },
    bounds: { minX: -hallW / 2 + 1, maxX: hallW / 2 - 1, minZ: -hallD / 2 + 1, maxZ: hallD / 2 - 1 },
    name: 'Grand Mall Interior',
  };
}
