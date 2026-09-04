/* A properly rigged, skinned humanoid: a real THREE.Skeleton (16 bones,
   T-pose bind), a single SkinnedMesh with linear-blend skin weights at the
   knees/elbows (so those joints deform smoothly instead of showing a
   "candy-wrapper" gap), and baked idle/walk THREE.AnimationClips played
   through an AnimationMixer. This is deliberately built the way a real
   rigged character (e.g. one exported from Mixamo/Blender) would be
   consumed by the game, so swapping in a real modeled character later is
   a drop-in replacement for this file rather than a rework of world3d.js
   or preview.js. No external model assets exist in this project, so the
   mesh itself is still procedural geometry (tube-lofted limb segments).

   Human proportions target ~7.5 heads tall, matching the previous rig. */
const CHAR = {
  headR: 0.115,
  neckH: 0.05,
  torsoH: 0.52,
  torsoW: 0.34,
  torsoD: 0.19,
  hipW: 0.3,
  shoulderW: 0.4,
  upperArmL: 0.27,
  lowerArmL: 0.24,
  upperLegL: 0.44,
  lowerLegL: 0.42,
  limbR: 0.055,
  footL: 0.22,
};
CHAR.legLength = CHAR.upperLegL + CHAR.lowerLegL;
CHAR.hipY = CHAR.legLength;
CHAR.shoulderY = CHAR.hipY + CHAR.torsoH;
CHAR.headY = CHAR.shoulderY + CHAR.neckH + CHAR.headR;
CHAR.height = CHAR.headY + CHAR.headR;

/* ---------- Skeleton (T-pose bind) ---------- */
function buildSkeleton() {
  const bones = {};
  function bone(name, x, y, z, parent) {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    bones[name] = b;
    return b;
  }

  bone('hips', 0, CHAR.hipY, 0, null);
  bone('spine', 0, CHAR.torsoH, 0, bones.hips);
  bone('neck', 0, CHAR.neckH, 0, bones.spine);
  bone('head', 0, CHAR.headR, 0, bones.neck);

  bone('lShoulder', -CHAR.shoulderW / 2, 0, 0, bones.spine);
  bone('lElbow', -CHAR.upperArmL, 0, 0, bones.lShoulder);
  bone('lHand', -CHAR.lowerArmL, 0, 0, bones.lElbow);
  bone('rShoulder', CHAR.shoulderW / 2, 0, 0, bones.spine);
  bone('rElbow', CHAR.upperArmL, 0, 0, bones.rShoulder);
  bone('rHand', CHAR.lowerArmL, 0, 0, bones.rElbow);

  bone('lHip', -CHAR.hipW / 2, 0, 0, bones.hips);
  bone('lKnee', 0, -CHAR.upperLegL, 0, bones.lHip);
  bone('lFoot', 0, -CHAR.lowerLegL, 0, bones.lKnee);
  bone('rHip', CHAR.hipW / 2, 0, 0, bones.hips);
  bone('rKnee', 0, -CHAR.upperLegL, 0, bones.rHip);
  bone('rFoot', 0, -CHAR.lowerLegL, 0, bones.rKnee);

  const order = ['hips', 'spine', 'neck', 'head', 'lShoulder', 'lElbow', 'lHand',
    'rShoulder', 'rElbow', 'rHand', 'lHip', 'lKnee', 'lFoot', 'rHip', 'rKnee', 'rFoot'];
  const list = order.map((n) => bones[n]);
  bones.hips.updateWorldMatrix(true, true);
  const indexOf = {};
  order.forEach((n, i) => { indexOf[n] = i; });
  return { bones, list, indexOf };
}

/* ---------- Tube-lofted limb mesh with linear-blend skin weights ---------- */
function buildTube(startBone, endBone, indexOf, radiusTop, radiusBottom, blendToChild) {
  const start = startBone.getWorldPosition(new THREE.Vector3());
  const end = endBone.getWorldPosition(new THREE.Vector3());
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  dir.normalize();
  const ref = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const perp1 = new THREE.Vector3().crossVectors(ref, dir).normalize();
  const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize();

  const radialSegments = 8;
  const rings = 5;
  const ownIdx = indexOf[startBone.name];
  const childIdx = indexOf[endBone.name];

  const positions = [], normals = [], skinIndices = [], skinWeights = [];
  for (let r = 0; r < rings; r++) {
    const t = r / (rings - 1);
    const radius = THREE.MathUtils.lerp(radiusTop, radiusBottom, t);
    const center = new THREE.Vector3().copy(start).addScaledVector(dir, length * t);
    const childWeight = blendToChild ? t * blendToChild : 0;
    for (let s = 0; s < radialSegments; s++) {
      const angle = (s / radialSegments) * Math.PI * 2;
      const radial = new THREE.Vector3()
        .addScaledVector(perp1, Math.cos(angle))
        .addScaledVector(perp2, Math.sin(angle));
      const pos = new THREE.Vector3().copy(center).addScaledVector(radial, radius);
      positions.push(pos.x, pos.y, pos.z);
      normals.push(radial.x, radial.y, radial.z);
      skinIndices.push(ownIdx, childIdx, 0, 0);
      skinWeights.push(1 - childWeight, childWeight, 0, 0);
    }
  }

  const indices = [];
  for (let r = 0; r < rings - 1; r++) {
    for (let s = 0; s < radialSegments; s++) {
      const a = r * radialSegments + s;
      const b = r * radialSegments + ((s + 1) % radialSegments);
      const c = (r + 1) * radialSegments + s;
      const d = (r + 1) * radialSegments + ((s + 1) % radialSegments);
      indices.push(a, c, b, b, c, d);
    }
  }

  return { positions, normals, skinIndices, skinWeights, indices, vertexCount: rings * radialSegments };
}

function buildSkinnedBody(skeleton) {
  const b = skeleton.bones;
  const segments = [
    { start: b.hips, end: b.spine, rTop: CHAR.torsoW * 0.42, rBot: CHAR.torsoW * 0.48, mat: 'outfit', blend: 0 },
    { start: b.spine, end: b.neck, rTop: CHAR.headR * 0.4, rBot: CHAR.headR * 0.45, mat: 'skin', blend: 0 },
    { start: b.lShoulder, end: b.lElbow, rTop: CHAR.limbR * 0.8, rBot: CHAR.limbR * 0.72, mat: 'skin', blend: 0.4 },
    { start: b.lElbow, end: b.lHand, rTop: CHAR.limbR * 0.68, rBot: CHAR.limbR * 0.55, mat: 'skin', blend: 0 },
    { start: b.rShoulder, end: b.rElbow, rTop: CHAR.limbR * 0.8, rBot: CHAR.limbR * 0.72, mat: 'skin', blend: 0.4 },
    { start: b.rElbow, end: b.rHand, rTop: CHAR.limbR * 0.68, rBot: CHAR.limbR * 0.55, mat: 'skin', blend: 0 },
    { start: b.lHip, end: b.lKnee, rTop: CHAR.limbR * 1.15, rBot: CHAR.limbR, mat: 'outfit', blend: 0.4 },
    { start: b.lKnee, end: b.lFoot, rTop: CHAR.limbR * 0.9, rBot: CHAR.limbR * 0.7, mat: 'skin', blend: 0 },
    { start: b.rHip, end: b.rKnee, rTop: CHAR.limbR * 1.15, rBot: CHAR.limbR, mat: 'outfit', blend: 0.4 },
    { start: b.rKnee, end: b.rFoot, rTop: CHAR.limbR * 0.9, rBot: CHAR.limbR * 0.7, mat: 'skin', blend: 0 },
  ];

  const positions = [], normals = [], skinIndices = [], skinWeights = [], indices = [];
  const groups = [];
  let vertOffset = 0, indexOffset = 0;
  segments.forEach((seg) => {
    const tube = buildTube(seg.start, seg.end, skeleton.indexOf, seg.rTop, seg.rBot, seg.blend);
    positions.push(...tube.positions);
    normals.push(...tube.normals);
    skinIndices.push(...tube.skinIndices);
    skinWeights.push(...tube.skinWeights);
    tube.indices.forEach((i) => indices.push(i + vertOffset));
    groups.push({ start: indexOffset, count: tube.indices.length, materialIndex: seg.mat === 'outfit' ? 0 : 1 });
    vertOffset += tube.vertexCount;
    indexOffset += tube.indices.length;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  groups.forEach((g) => geo.addGroup(g.start, g.count, g.materialIndex));

  const outfitMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.02 });
  const skinMat = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.02 });
  const mesh = new THREE.SkinnedMesh(geo, [outfitMat, skinMat]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const threeSkeleton = new THREE.Skeleton(skeleton.list);
  mesh.add(skeleton.bones.hips);
  mesh.bind(threeSkeleton);
  return { mesh, outfitMat, skinMat };
}

/* ---------- Hair (rigid attachment on the head bone) ---------- */
function buildHair(style, color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(CHAR.headR * 1.08, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), mat);
  cap.castShadow = true;
  group.add(cap);

  if (style === 'long') {
    const back = new THREE.Mesh(new THREE.SphereGeometry(CHAR.headR * 1.05, 12, 10), mat);
    back.scale.set(0.85, 1.9, 0.6);
    back.position.set(0, -CHAR.headR * 1.1, -CHAR.headR * 0.35);
    back.castShadow = true;
    group.add(back);
  } else if (style === 'ponytail') {
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(CHAR.headR * 0.35, CHAR.headR * 0.15, CHAR.headR * 2.4, 8), mat);
    tail.position.set(0, -CHAR.headR * 0.6, -CHAR.headR * 1.15);
    tail.rotation.x = 0.45;
    tail.castShadow = true;
    group.add(tail);
  } else if (style === 'bob') {
    cap.scale.set(1.12, 1.05, 1.12);
    const skirt = new THREE.Mesh(new THREE.SphereGeometry(CHAR.headR * 1.1, 14, 10), mat);
    skirt.scale.set(1, 0.55, 1);
    skirt.position.y = -CHAR.headR * 0.35;
    skirt.castShadow = true;
    group.add(skirt);
  } else if (style === 'curly') {
    const offsets = [
      [0.55, 0.35, 0.4], [-0.55, 0.35, 0.4], [0.75, 0, 0], [-0.75, 0, 0],
      [0.4, -0.15, -0.6], [-0.4, -0.15, -0.6], [0, 0.55, -0.3],
    ];
    offsets.forEach(([x, y, z]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(CHAR.headR * 0.55, 10, 8), mat);
      puff.position.set(x * CHAR.headR, y * CHAR.headR, z * CHAR.headR);
      puff.castShadow = true;
      group.add(puff);
    });
  } else if (style === 'bun') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(CHAR.headR * 0.5, 12, 10), mat);
    bun.position.set(0, CHAR.headR * 0.7, -CHAR.headR * 0.6);
    bun.castShadow = true;
    group.add(bun);
  } else if (style === 'pigtails') {
    [-1, 1].forEach((side) => {
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(CHAR.headR * 0.28, CHAR.headR * 0.12, CHAR.headR * 1.8, 8), mat);
      tail.position.set(side * CHAR.headR * 1.05, CHAR.headR * 0.1, 0);
      tail.rotation.z = side * 0.5;
      tail.castShadow = true;
      group.add(tail);
    });
  }
  group.userData.material = mat;
  return group;
}

/* ---------- Baked animation clips ---------- */
function quatX(angle) {
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle);
}
function quatZ(angle) {
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
}

/* The skeleton binds in a T-pose (arms out along local +/-X), which is the
   standard rig convention, but every actual pose needs the arms lowered to
   the sides first. Composing swing*rest (swing applied on the outside)
   keeps the forward/back swing measured around the true parent X axis
   regardless of that rest rotation - see the walk-cycle debugging notes in
   the project history for why the naive rest*swing order doesn't work. */
const L_SHOULDER_REST = quatZ(Math.PI / 2);
const R_SHOULDER_REST = quatZ(-Math.PI / 2);
function armQuat(swingAngle, restQuat) {
  return new THREE.Quaternion().multiplyQuaternions(quatX(swingAngle), restQuat);
}

function sampleWalkPose(phase) {
  const swing = Math.sin(phase) * 0.55;
  const swingOpp = Math.sin(phase + Math.PI) * 0.55;
  const lKnee = Math.max(0, -Math.sin(phase + Math.PI * 0.5)) * 0.9;
  const rKnee = Math.max(0, -Math.sin(phase + Math.PI * 1.5)) * 0.9;
  const bob = Math.abs(Math.sin(phase)) * 0.035;
  const lean = 0.06 * Math.sin(phase * 2);
  return { lHip: swing, rHip: swingOpp, lKnee, rKnee, lShoulder: swingOpp * 0.7, rShoulder: swing * 0.7, bob, lean };
}

function buildWalkClip() {
  const steps = 16;
  const duration = 1.0;
  const times = [];
  const tracks = { lHip: [], rHip: [], lKnee: [], rKnee: [], lShoulder: [], rShoulder: [], spine: [], hipsY: [] };
  /* steps+1 samples so the last keyframe (phase 2*PI) exactly repeats the
     first (phase 0) - otherwise LoopRepeat pops at the wrap point since it
     doesn't interpolate past the final defined keyframe. */
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * duration;
    const phase = (i / steps) * Math.PI * 2;
    times.push(t);
    const p = sampleWalkPose(phase);
    tracks.lHip.push(...quatX(p.lHip).toArray());
    tracks.rHip.push(...quatX(p.rHip).toArray());
    tracks.lKnee.push(...quatX(-p.lKnee).toArray());
    tracks.rKnee.push(...quatX(-p.rKnee).toArray());
    tracks.lShoulder.push(...armQuat(p.lShoulder, L_SHOULDER_REST).toArray());
    tracks.rShoulder.push(...armQuat(p.rShoulder, R_SHOULDER_REST).toArray());
    tracks.spine.push(...quatX(p.lean).toArray());
    tracks.hipsY.push(CHAR.hipY - p.bob);
  }
  const clipTracks = [
    new THREE.QuaternionKeyframeTrack('lHip.quaternion', times, tracks.lHip),
    new THREE.QuaternionKeyframeTrack('rHip.quaternion', times, tracks.rHip),
    new THREE.QuaternionKeyframeTrack('lKnee.quaternion', times, tracks.lKnee),
    new THREE.QuaternionKeyframeTrack('rKnee.quaternion', times, tracks.rKnee),
    new THREE.QuaternionKeyframeTrack('lShoulder.quaternion', times, tracks.lShoulder),
    new THREE.QuaternionKeyframeTrack('rShoulder.quaternion', times, tracks.rShoulder),
    new THREE.QuaternionKeyframeTrack('spine.quaternion', times, tracks.spine),
    new THREE.NumberKeyframeTrack('hips.position[y]', times, tracks.hipsY),
  ];
  return new THREE.AnimationClip('walk', duration, clipTracks);
}

function buildIdleClip() {
  const duration = 2.4;
  const times = [0, duration / 2, duration];
  const lRest = armQuat(0, L_SHOULDER_REST).toArray();
  const rRest = armQuat(0, R_SHOULDER_REST).toArray();
  return new THREE.AnimationClip('idle', duration, [
    new THREE.VectorKeyframeTrack('spine.scale', times, [1, 1, 1, 1, 1.018, 1, 1, 1, 1]),
    new THREE.NumberKeyframeTrack('hips.position[y]', times, [CHAR.hipY, CHAR.hipY - 0.006, CHAR.hipY]),
    new THREE.QuaternionKeyframeTrack('lShoulder.quaternion', times, [...lRest, ...lRest, ...lRest]),
    new THREE.QuaternionKeyframeTrack('rShoulder.quaternion', times, [...rRest, ...rRest, ...rRest]),
  ]);
}

/* ---------- Public character assembly ---------- */
function createCharacter(appearance) {
  const root = new THREE.Group();
  const skeleton = buildSkeleton();
  const b = skeleton.bones;
  const { mesh: bodyMesh, outfitMat, skinMat } = buildSkinnedBody(skeleton);
  root.add(bodyMesh);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 });
  const lipMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
  const blushMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 });
  const R = CHAR.headR;

  const head = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 16), skinMat);
  head.castShadow = true;
  b.head.add(head);

  const eyeGeo = new THREE.SphereGeometry(R * 0.09, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-R * 0.38, R * 0.05, R * 0.88);
  const rightEye = leftEye.clone();
  rightEye.position.x *= -1;
  b.head.add(leftEye, rightEye);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(R * 0.5, R * 0.1, R * 0.08), lipMat);
  mouth.position.set(0, -R * 0.38, R * 0.96);
  b.head.add(mouth);

  const blushGeo = new THREE.CircleGeometry(R * 0.22, 12);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(-R * 0.62, -R * 0.22, R * 0.78);
  leftBlush.rotation.y = 0.5;
  const rightBlush = leftBlush.clone();
  rightBlush.position.x *= -1;
  rightBlush.rotation.y = -0.5;
  b.head.add(leftBlush, rightBlush);

  const shadowGeo = new THREE.PlaneGeometry(R * 0.55, R * 0.22);
  const leftShadow = new THREE.Mesh(shadowGeo, new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5, roughness: 0.8 }));
  leftShadow.position.set(-R * 0.38, R * 0.22, R * 0.85);
  const rightShadow = leftShadow.clone();
  rightShadow.position.x *= -1;
  b.head.add(leftShadow, rightShadow);

  let hair = buildHair(appearance.hairStyle, appearance.hairColor);
  hair.userData.style = appearance.hairStyle;
  b.head.add(hair);

  const handGeo = new THREE.SphereGeometry(CHAR.limbR * 0.55, 8, 8);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.castShadow = rightHand.castShadow = true;
  b.lHand.add(leftHand);
  b.rHand.add(rightHand);

  const footGeo = new THREE.BoxGeometry(CHAR.limbR * 1.8, CHAR.limbR * 1.1, CHAR.footL);
  const leftFoot = new THREE.Mesh(footGeo, shoeMat);
  const rightFoot = new THREE.Mesh(footGeo, shoeMat);
  leftFoot.position.z = rightFoot.position.z = CHAR.footL * 0.28;
  leftFoot.castShadow = rightFoot.castShadow = true;
  b.lFoot.add(leftFoot);
  b.rFoot.add(rightFoot);

  const necklace = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, R * 0.06, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.25 }));
  necklace.position.set(0, CHAR.neckH * 0.4, CHAR.torsoD * 0.5);
  necklace.rotation.x = Math.PI * 0.55;
  necklace.visible = false;
  b.spine.add(necklace);

  const mixer = new THREE.AnimationMixer(bodyMesh);
  const idleAction = mixer.clipAction(buildIdleClip());
  const walkAction = mixer.clipAction(buildWalkClip());
  idleAction.play();

  const character = {
    root, bones: b, mixer, idleAction, walkAction,
    _wasMoving: false,

    applyAppearance(a) {
      skinMat.color.set(a.skinTone);
      shoeMat.color.set(a.shoesId ? findItem('shoes', a.shoesId).color : a.skinTone);
      const outfit = findItem('outfits', a.outfitId) || ITEMS.outfits[0];
      outfitMat.color.set(outfit.color);
      lipMat.color.set(a.lipstick || '#a65a5a');
      blushMat.color.set(a.blush || '#f28fb0');
      blushMat.visible = !!a.blush;
      const eyeshadowVisible = !!a.eyeshadow;
      leftShadow.visible = rightShadow.visible = eyeshadowVisible;
      if (eyeshadowVisible) { leftShadow.material.color.set(a.eyeshadow); rightShadow.material.color.set(a.eyeshadow); }
      if (a.jewelryId) {
        necklace.visible = true;
        necklace.material.color.set(findItem('jewelry', a.jewelryId).color);
      } else {
        necklace.visible = false;
      }
      if (hair.userData.style !== a.hairStyle) {
        b.head.remove(hair);
        hair = buildHair(a.hairStyle, a.hairColor);
        hair.userData.style = a.hairStyle;
        b.head.add(hair);
      } else {
        hair.userData.material.color.set(a.hairColor);
      }
    },

    animate(dt, distanceMoved, moving) {
      if (moving !== this._wasMoving) {
        (moving ? this.walkAction : this.idleAction).reset().play();
        (moving ? this.idleAction : this.walkAction).stop();
        this._wasMoving = moving;
      }
      if (moving) {
        const strideRate = 5.5;
        const speed = dt > 0 ? distanceMoved / dt : 0;
        this.walkAction.timeScale = Math.max(0.4, (speed * strideRate) / (Math.PI * 2));
      }
      this.mixer.update(dt);
    },
  };

  character.applyAppearance(appearance);
  return character;
}
