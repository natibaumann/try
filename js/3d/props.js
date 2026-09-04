/* Prop factories: personalized store buildings, plaza dressing, mall
   storefronts, and the furniture meshes placed in the home/office rooms. */

/* A capped triangular-prism gable roof: the flat triangular end faces the
   street with no open back geometry to peek through at low angles (the
   failure mode the old wide/shallow cone roof had). */
function makeGableRoof(width, ridgeHeight, depth, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(0, ridgeHeight);
  shape.lineTo(width / 2, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* Two-story mixed-use storefront (shop below, a residential-feeling upper
   floor above) with a cornice trim line, an awning over the door, and a
   street-facing gable roof - aiming for the layered, multi-story rowhouse
   look of a real shopping street rather than a single flat box. */
function createBuilding({ width, height, depth, color, roofColor, label, icon }) {
  const group = new THREE.Group();
  const groundH = height * 0.62;
  const upperH = height - groundH;

  const wallMat = new THREE.MeshStandardMaterial({ map: makeBrickTexture(color), roughness: 0.85 });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(width, groundH, depth), wallMat);
  ground.position.y = groundH / 2;
  ground.castShadow = true;
  ground.receiveShadow = true;
  group.add(ground);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, height * 0.05, depth * 1.04), new THREE.MeshStandardMaterial({ color: 0xf6ece0, roughness: 0.7 }));
  trim.position.y = groundH + height * 0.025;
  trim.castShadow = true;
  group.add(trim);

  const upperMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.25), roughness: 0.85 });
  const upperW = width * 0.9, upperD = depth * 0.9;
  const upper = new THREE.Mesh(new THREE.BoxGeometry(upperW, upperH, upperD), upperMat);
  upper.position.y = groundH + height * 0.05 + upperH / 2;
  upper.castShadow = true;
  upper.receiveShadow = true;
  group.add(upper);

  const upperWinCount = width > 8 ? 4 : 2;
  for (let i = 0; i < upperWinCount; i++) {
    const wx = (i + 0.5) / upperWinCount * upperW - upperW / 2;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(upperW * 0.14, upperH * 0.4), new THREE.MeshStandardMaterial({ color: 0xdff3ff, emissive: 0xaad9ff, emissiveIntensity: 0.35 }));
    win.position.set(wx, groundH + height * 0.05 + upperH * 0.52, upperD / 2 + 0.02);
    group.add(win);
  }

  const roofH = upperH * 1.15;
  const roof = makeGableRoof(upperW * 1.06, roofH, upperD * 1.06, roofColor);
  roof.position.y = groundH + height * 0.05 + upperH;
  group.add(roof);

  const doorW = width * 0.32;
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, groundH * 0.85, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.4 }));
  door.position.set(0, groundH * 0.425, depth / 2 + 0.02);
  group.add(door);

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(doorW * 0.85, groundH * 0.7), new THREE.MeshStandardMaterial({ color: 0xfff2c9, emissive: 0xffdd88, emissiveIntensity: 0.6 }));
  glow.position.set(0, groundH * 0.44, depth / 2 + 0.06);
  group.add(glow);

  [-1, 1].forEach((side) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.16, groundH * 0.42), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x88ccff, emissiveIntensity: 0.4 }));
    win.position.set(side * width * 0.32, groundH * 0.5, depth / 2 + 0.02);
    group.add(win);
  });

  const awningMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6, side: THREE.DoubleSide });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(doorW * 1.7, 0.06, 0.6), awningMat);
  awning.position.set(0, groundH * 0.82, depth / 2 + 0.32);
  awning.rotation.x = -0.28;
  awning.castShadow = true;
  group.add(awning);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.95, groundH * 0.3), new THREE.MeshStandardMaterial({ map: makeSignTexture(label, icon, '#ffffff', '#2a2a3a') }));
  sign.position.set(0, groundH * 0.95, depth / 2 + 0.03);
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

  const roofH = height * 0.7;
  const roof = makeGableRoof(width * 1.08, roofH, depth * 1.08, 0xc9536b);
  roof.position.y = height;
  group.add(roof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), new THREE.MeshStandardMaterial({ color: 0x8a6a55 }));
  chimney.position.set(width * 0.25, height + roofH * 0.6, 0);
  chimney.castShadow = true;
  group.add(chimney);

  const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(width * 0.4, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: 0xf6ece0 }));
  balconyFloor.position.set(0, height * 0.62, depth / 2 + 0.25);
  balconyFloor.castShadow = true;
  group.add(balconyFloor);
  for (let i = -3; i <= 3; i++) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    rail.position.set(i * (width * 0.4) / 7, height * 0.62 + 0.15, depth / 2 + 0.47);
    group.add(rail);
  }
  const balconyWindow = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.32, height * 0.28), new THREE.MeshStandardMaterial({ color: 0xdff3ff, emissive: 0xaad9ff, emissiveIntensity: 0.35 }));
  balconyWindow.position.set(0, height * 0.78, depth / 2 + 0.02);
  group.add(balconyWindow);

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
  const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, 0.05, 0.5), new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide }));
  awning.position.set(0, 2.5, depth + 0.3);
  awning.rotation.x = -0.3;
  awning.castShadow = true;
  group.add(awning);
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

/* ---------- Store-interior product displays: walk up to one, a buy/try-on
   popup appears. Each returns a group plus userData.signAnchor (local
   offset for the floating name/price sign world3d.js hangs above it). */
function createPedestal(radius = 0.32, height = 0.45, color = 0xf2eee6) {
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.08, height, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
  pedestal.position.y = height / 2;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  return pedestal;
}

function createMannequinDisplay(item) {
  const group = new THREE.Group();
  const pedestal = createPedestal(0.34, 0.4);
  group.add(pedestal);
  const mat = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.6 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8cfa8, roughness: 0.4 });
  const torsoGeo = typeof THREE.CapsuleGeometry === 'function'
    ? new THREE.CapsuleGeometry(0.22, 0.5, 4, 12)
    : new THREE.CylinderGeometry(0.22, 0.2, 0.7, 12);
  const torso = new THREE.Mesh(torsoGeo, mat);
  torso.position.y = 0.4 + 0.5;
  torso.castShadow = true;
  group.add(torso);
  const neckKnob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bodyMat);
  neckKnob.position.y = 0.4 + 0.9;
  group.add(neckKnob);
  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.35, 8), bodyMat);
    leg.position.set(side * 0.11, 0.4 + 0.18, 0);
    leg.castShadow = true;
    group.add(leg);
  });
  group.userData.signAnchor = { x: 0, y: 1.55, z: 0 };
  return group;
}

function createShoeDisplay(item) {
  const group = new THREE.Group();
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.34), new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.5 }));
  shelf.position.y = 0.42;
  shelf.castShadow = true; shelf.receiveShadow = true;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.42, 10), new THREE.MeshStandardMaterial({ color: 0xf2eee6 }));
  pole.position.y = 0.21;
  group.add(shelf, pole);
  const mat = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.55 });
  [-0.1, 0.1].forEach((x) => {
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.12), mat);
    sole.position.set(x, 0.48, 0);
    const heel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.1), mat);
    heel.position.set(x - 0.05, 0.55, 0.01);
    sole.castShadow = heel.castShadow = true;
    group.add(sole, heel);
  });
  group.userData.signAnchor = { x: 0, y: 1.05, z: 0 };
  return group;
}

function createJewelryDisplay(item) {
  const group = new THREE.Group();
  group.add(createPedestal(0.26, 0.55));
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
  stand.position.y = 0.55 + 0.17;
  group.add(stand);
  const gemMat = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.15, metalness: 0.6 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 10, 20), gemMat);
  ring.position.y = 0.55 + 0.36;
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  group.add(ring);
  const sparkle = new THREE.PointLight(item.color, 0.5, 1.2);
  sparkle.position.copy(ring.position);
  group.add(sparkle);
  group.userData.signAnchor = { x: 0, y: 1.15, z: 0 };
  return group;
}

function createPetDisplay(item) {
  const group = new THREE.Group();
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0xd9b06b, roughness: 0.8 }));
  basket.position.y = 0.09;
  basket.castShadow = true; basket.receiveShadow = true;
  group.add(basket);
  const mat = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat);
  body.position.y = 0.35;
  body.scale.set(1, 0.85, 1.15);
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat);
  head.position.set(0, 0.42, 0.22);
  head.castShadow = true;
  group.add(body, head);
  [-0.08, 0.08].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 8), mat);
    ear.position.set(x, 0.52, 0.24);
    group.add(ear);
  });
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat);
  tail.position.set(0, 0.4, -0.22);
  group.add(tail);
  group.userData.signAnchor = { x: 0, y: 0.95, z: 0 };
  return group;
}

function createItemDisplay(category, item) {
  if (category === 'outfits') return createMannequinDisplay(item);
  if (category === 'shoes') return createShoeDisplay(item);
  if (category === 'jewelry') return createJewelryDisplay(item);
  if (category === 'pets') return createPetDisplay(item);
  const mesh = createFurnitureMesh(item);
  mesh.userData.signAnchor = { x: 0, y: 1.1, z: 0 };
  return mesh;
}
