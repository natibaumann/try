/* Prop factories: personalized store buildings, plaza dressing, mall
   storefronts, and the furniture meshes placed in the home/office rooms. */
function createBuilding({ width, height, depth, color, roofColor, label, icon }) {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ map: makeBrickTexture(color), roughness: 0.85 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  walls.position.y = height / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.75, height * 0.4, 4), new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6 }));
  roof.position.y = height + (height * 0.4) / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const doorW = width * 0.32;
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, height * 0.55, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.4 }));
  door.position.set(0, height * 0.275, depth / 2 + 0.02);
  group.add(door);

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(doorW * 0.85, height * 0.45), new THREE.MeshStandardMaterial({ color: 0xfff2c9, emissive: 0xffdd88, emissiveIntensity: 0.6 }));
  glow.position.set(0, height * 0.28, depth / 2 + 0.06);
  group.add(glow);

  [-1, 1].forEach((side) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.18, height * 0.28), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x88ccff, emissiveIntensity: 0.4 }));
    win.position.set(side * width * 0.3, height * 0.62, depth / 2 + 0.02);
    group.add(win);
  });

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.95, height * 0.28), new THREE.MeshStandardMaterial({ map: makeSignTexture(label, icon, '#ffffff', '#2a2a3a') }));
  sign.position.set(0, height * 0.92, depth / 2 + 0.03);
  group.add(sign);

  group.userData.footprint = { w: width, d: depth };
  group.userData.doorFront = { x: 0, z: depth / 2 + 1.6 };
  group.userData.label = label;
  return group;
}

function createHouse({ label = 'Your Place' } = {}) {
  const group = new THREE.Group();
  const width = 7.5, height = 3.4, depth = 7;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf6e7d8, roughness: 0.8 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  walls.position.y = height / 2;
  walls.castShadow = true; walls.receiveShadow = true;
  group.add(walls);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.8, height * 0.6, 4), new THREE.MeshStandardMaterial({ color: 0xc9536b, roughness: 0.6 }));
  roof.position.y = height + (height * 0.6) / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), new THREE.MeshStandardMaterial({ color: 0x8a6a55 }));
  chimney.position.set(width * 0.25, height + 1.1, 0);
  chimney.castShadow = true;
  group.add(chimney);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 0.08), new THREE.MeshStandardMaterial({ color: 0x7a4a30 }));
  door.position.set(0, 1, depth / 2 + 0.02);
  group.add(door);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.9, height * 0.22), new THREE.MeshStandardMaterial({ map: makeSignTexture(label, '🏠', '#ffffff', '#2a2a3a') }));
  sign.position.set(0, height * 0.85, depth / 2 + 0.03);
  group.add(sign);

  group.userData.footprint = { w: width, d: depth };
  group.userData.doorFront = { x: 0, z: depth / 2 + 1.8 };
  group.userData.label = label;
  return group;
}

function createFountain() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0xd9cbb3, roughness: 0.7 }));
  base.position.y = 0.25;
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0x5bb3d9, roughness: 0.2, metalness: 0.3 }));
  water.position.y = 0.55;
  group.add(water);
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 12), base.material);
  mid.position.y = 1.05;
  mid.castShadow = true;
  group.add(mid);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), water.material);
  top.position.y = 1.75;
  group.add(top);
  return group;
}

function createBench() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.75 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), mat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.08), mat);
  back.position.set(0, 0.72, -0.21);
  back.castShadow = true;
  group.add(back);
  [-0.6, 0.6].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.45), mat);
    leg.position.set(x, 0.22, 0);
    leg.castShadow = true;
    group.add(leg);
  });
  return group;
}

function createLamp() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 }));
  pole.position.y = 1.3;
  pole.castShadow = true;
  group.add(pole);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff3c9, emissive: 0xffdd88, emissiveIntensity: 0.8 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), lampMat);
  bulb.position.y = 2.65;
  group.add(bulb);
  const light = new THREE.PointLight(0xffdd99, 0.6, 6, 2);
  light.position.y = 2.6;
  group.add(light);
  return group;
}

function createBulletinBoard() {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.8 });
  [-0.7, 0.7].forEach((x) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), postMat);
    post.position.set(x, 0.9, 0);
    post.castShadow = true;
    group.add(post);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.1), new THREE.MeshStandardMaterial({ map: makeSignTexture('Mission Board', '📋', '#fff7fb', '#e04fa0') }));
  board.position.y = 1.5;
  board.castShadow = true;
  group.add(board);
  group.userData.footprint = { w: 1.8, d: 0.4 };
  group.userData.doorFront = { x: 0, z: 1.4 };
  group.userData.label = 'Mission Board';
  return group;
}

function createStorefront({ width, depth, label, icon, color }) {
  /* The frame protrudes forward (+z, into the hall) from its wall-mount
     point rather than backward, so it never clips through the mall wall
     it's attached to. */
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width, 2.6, depth), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
  frame.position.set(0, 1.3, depth / 2);
  frame.castShadow = true; frame.receiveShadow = true;
  group.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.8, 1.6), new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.35, emissive: 0x99d6ff, emissiveIntensity: 0.2 }));
  glass.position.set(0, 1.1, depth + 0.02);
  group.add(glass);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.9, 0.55), new THREE.MeshStandardMaterial({ map: makeSignTexture(label, icon, color, '#ffffff') }));
  sign.position.set(0, 2.15, depth + 0.03);
  group.add(sign);
  group.userData.footprint = { w: width, d: depth + 1 };
  group.userData.doorFront = { x: 0, z: 2.2 };
  group.userData.label = label;
  return group;
}

/* Furniture used only in the Home/Office 3D room builder. */
function createFurnitureMesh(item) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.7 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });

  if (item.icon === 'sofa') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.7), mat);
    base.position.y = 0.25;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.18), mat);
    back.position.set(0, 0.55, -0.26);
    group.add(base, back);
    [-0.7, 0.7].forEach((x) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.7), mat);
      arm.position.set(x, 0.45, 0);
      group.add(arm);
    });
  } else if (item.icon === 'bed') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 2), accent);
    frame.position.y = 0.15;
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.9), mat);
    mattress.position.y = 0.4;
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.35), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    pillow.position.set(0, 0.58, -0.75);
    group.add(frame, mattress, pillow);
  } else if (item.icon === 'rug') {
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.03, 24), mat);
    rug.position.y = 0.02;
    group.add(rug);
  } else if (item.icon === 'desk') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.6), mat);
    top.position.y = 0.7;
    group.add(top);
    [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), accent);
      leg.position.set(x, 0.35, z);
      group.add(leg);
    });
  } else if (item.icon === 'chair') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), mat);
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.08), mat);
    back.position.set(0, 0.7, -0.21);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), accent);
    pole.position.y = 0.22;
    group.add(seat, back, pole);
  } else if (item.icon === 'shelf') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.3), mat);
    frame.position.y = 0.8;
    group.add(frame);
    for (let i = 1; i < 4; i++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.28), accent);
      shelf.position.y = i * 0.4;
      group.add(shelf);
    }
  } else if (item.icon === 'plant') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0xa5623a }));
    pot.position.y = 0.15;
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), mat);
    leaves.position.y = 0.55;
    leaves.scale.set(0.8, 1.3, 0.8);
    group.add(pot, leaves);
  } else {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat);
    box.position.y = 0.3;
    group.add(box);
  }

  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}
