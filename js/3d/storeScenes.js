/* Walkable 3D store interiors: each item for sale gets a real display
   (mannequin, shoe rack, jewelry stand, pet basket, or the furniture piece
   itself) that the player walks up to; world3d.js turns that proximity
   into a "Press E" prompt wired to a buy/equip popup instead of a scene
   change. Rebuilt fresh every time a store is entered (visits are brief,
   so there's no need to remember a layout between visits). */
const CATEGORY_ICON = { outfits: '👗', shoes: '👠', jewelry: '💎', pets: '🐾', furniture: '🛋️' };

function buildStoreScene(storeId) {
  const info = STORE_CATALOG[storeId];
  const items = ITEMS[info.category].filter((i) => i.store === storeId);
  const icon = CATEGORY_ICON[info.category] || '🛍️';

  const roomW = Math.max(7, items.length * 3.2 + 2.5);
  const roomD = 7.5;
  const roomH = 3.4;
  const accentColor = items[0] ? items[0].color : 0xd9a5c9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf3f7);
  scene.fog = new THREE.Fog(0xfaf3f7, 12, 26);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe0c9d9, 0.55));
  const key = new THREE.DirectionalLight(0xfff2e0, 0.7);
  key.position.set(3, roomH + 2, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  scene.add(key);
  [[-roomW / 3, -1], [roomW / 3, -1], [0, roomD / 3]].forEach(([x, z]) => {
    const pl = new THREE.PointLight(0xfff0dd, 0.5, 8);
    pl.position.set(x, roomH - 0.4, z);
    scene.add(pl);
    const panel = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe9c9, emissiveIntensity: 0.7 }));
    panel.rotation.x = Math.PI / 2;
    panel.position.set(x, roomH - 0.05, z);
    scene.add(panel);
  });

  const floorTex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#f3e6ee';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(160,110,140,0.18)';
    for (let y = 0; y < h; y += 48) for (let x = 0; x < w; x += 48) if (((x / 48) + (y / 48)) % 2 === 0) ctx.fillRect(x, y, 48, 48);
  }, 384, 384);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(roomW / 2.2, roomD / 2.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf6ecf2, roughness: 0.9 });
  const accentWallMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.8 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH, 0.3), accentWallMat);
  backWall.position.set(0, roomH / 2, -roomD / 2);
  backWall.receiveShadow = true;
  scene.add(backWall);
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, roomH, roomD), wallMat);
    wall.position.set(side * roomW / 2, roomH / 2, 0);
    wall.receiveShadow = true;
    scene.add(wall);
  });
  const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(roomW / 2 - 1.6, roomH, 0.3), wallMat);
  frontWallL.position.set(-(roomW / 4 + 0.8), roomH / 2, roomD / 2);
  scene.add(frontWallL);
  const frontWallR = frontWallL.clone();
  frontWallR.position.x = roomW / 4 + 0.8;
  scene.add(frontWallR);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomH;
  scene.add(ceiling);

  const brandSign = new THREE.Mesh(new THREE.PlaneGeometry(roomW * 0.5, 0.6), new THREE.MeshStandardMaterial({ map: makeSignTexture(info.name, icon, accentColor, '#ffffff') }));
  brandSign.position.set(0, roomH - 0.5, -roomD / 2 + 0.16);
  scene.add(brandSign);

  const hotspots = [];
  const colliders = [];
  const spacing = roomW / (items.length + 1);
  items.forEach((item, i) => {
    const x = -roomW / 2 + spacing * (i + 1);
    const z = -roomD / 2 + 1.9;
    const display = createItemDisplay(info.category, item);
    display.position.set(x, 0, z);
    display.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(display);

    const anchor = display.userData.signAnchor || { x: 0, y: 1.2, z: 0 };
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.32), new THREE.MeshStandardMaterial({ map: makeSignTexture(`${item.name}  $${item.price}`, '', '#2a2a3a', '#ffffff') }));
    sign.position.set(x + anchor.x, anchor.y, z + anchor.z + 0.02);
    scene.add(sign);

    hotspots.push({ id: `item_${item.id}`, label: item.name, position: { x, z: z + 1.1 }, action: { type: 'item', item, category: info.category } });
    colliders.push({ x, z, w: 0.7, d: 0.7 });
  });

  const exitDoor = new THREE.Group();
  const exitGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), new THREE.MeshStandardMaterial({ color: 0xfff0d6, transparent: true, opacity: 0.5, emissive: 0xffd699, emissiveIntensity: 0.5 }));
  exitGlow.position.set(0, 1.5, roomD / 2 - 0.05);
  exitDoor.add(exitGlow);
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.45), new THREE.MeshStandardMaterial({ map: makeSignTexture(`Exit to ${info.back === 'mall' ? 'Mall' : 'Plaza'}`, '🚪', '#2a2a3a', '#ffffff') }));
  exitSign.position.set(0, 2.9, roomD / 2 - 0.05);
  exitDoor.add(exitSign);
  exitDoor.userData.doorFront = { x: 0, z: -1.8 };
  exitDoor.position.set(0, 0, roomD / 2);
  scene.add(exitDoor);
  addHotspot(hotspots, colliders, exitDoor, 'exit', `Exit to ${info.back === 'mall' ? 'Mall' : 'Plaza'}`, { type: 'goto', target: info.back });

  return {
    scene, hotspots, colliders, clueProps: [],
    spawn: { x: 0, z: roomD / 2 - 1.6, yaw: 0 },
    bounds: { minX: -roomW / 2 + 0.6, maxX: roomW / 2 - 0.6, minZ: -roomD / 2 + 0.6, maxZ: roomD / 2 - 0.6 },
    name: info.name,
  };
}
