/* Procedural, jointed humanoid built from primitives (no external model
   assets exist in this project) using real human proportions (~7.5 heads
   tall) so it can actually walk with a physical gait instead of sliding. */
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

function limbMesh(length, radius, material) {
  const geo = typeof THREE.CapsuleGeometry === 'function'
    ? new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.01), 4, 8)
    : new THREE.CylinderGeometry(radius, radius, length, 8);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.y = -length / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

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

function createCharacter(appearance) {
  const root = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.02 });
  const outfitMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.02 });
  const shoeMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 });
  const lipMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
  const blushMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5, roughness: 0.8 });
  const shadowMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5, roughness: 0.8 });

  const pelvis = new THREE.Group();
  pelvis.position.y = CHAR.hipY;
  root.add(pelvis);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(CHAR.torsoW, CHAR.torsoH, CHAR.torsoD, 1, 2, 1), outfitMat);
  torso.position.y = CHAR.torsoH / 2;
  torso.castShadow = true;
  torso.receiveShadow = true;
  pelvis.add(torso);

  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * CHAR.hipW * 0.5, 0, 0);
    const upper = limbMesh(CHAR.upperLegL, CHAR.limbR, outfitMat);
    hip.add(upper);
    const knee = new THREE.Group();
    knee.position.y = -CHAR.upperLegL;
    hip.add(knee);
    const lower = limbMesh(CHAR.lowerLegL, CHAR.limbR * 0.85, skinMat);
    knee.add(lower);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(CHAR.limbR * 1.8, CHAR.limbR * 1.1, CHAR.footL), shoeMat);
    foot.position.set(0, -CHAR.lowerLegL, CHAR.footL * 0.28);
    foot.castShadow = true;
    knee.add(foot);
    pelvis.add(hip);
    return { hip, knee, upperMesh: upper, lowerMesh: lower, footMesh: foot };
  }

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * CHAR.shoulderW * 0.5, CHAR.torsoH, 0);
    const upper = limbMesh(CHAR.upperArmL, CHAR.limbR * 0.75, skinMat);
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -CHAR.upperArmL;
    shoulder.add(elbow);
    const lower = limbMesh(CHAR.lowerArmL, CHAR.limbR * 0.65, skinMat);
    elbow.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(CHAR.limbR * 0.7, 8, 8), skinMat);
    hand.position.y = -CHAR.lowerArmL;
    hand.castShadow = true;
    elbow.add(hand);
    pelvis.add(shoulder);
    return { shoulder, elbow, upperMesh: upper };
  }

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const headGroup = new THREE.Group();
  headGroup.position.y = CHAR.torsoH + CHAR.neckH;
  pelvis.add(headGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(CHAR.headR * 0.4, CHAR.headR * 0.45, CHAR.neckH * 2, 8), skinMat);
  neck.position.y = -CHAR.neckH * 0.3;
  headGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(CHAR.headR, 20, 16), skinMat);
  head.position.y = CHAR.headR;
  head.castShadow = true;
  headGroup.add(head);

  const eyeGeo = new THREE.SphereGeometry(CHAR.headR * 0.09, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-CHAR.headR * 0.38, CHAR.headR * 1.05, CHAR.headR * 0.88);
  const rightEye = leftEye.clone();
  rightEye.position.x *= -1;
  headGroup.add(leftEye, rightEye);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(CHAR.headR * 0.5, CHAR.headR * 0.1, CHAR.headR * 0.08), lipMat);
  mouth.position.set(0, CHAR.headR * 0.62, CHAR.headR * 0.96);
  headGroup.add(mouth);

  const blushGeo = new THREE.CircleGeometry(CHAR.headR * 0.22, 12);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(-CHAR.headR * 0.62, CHAR.headR * 0.78, CHAR.headR * 0.78);
  leftBlush.rotation.y = 0.5;
  const rightBlush = leftBlush.clone();
  rightBlush.position.x *= -1;
  rightBlush.rotation.y = -0.5;
  headGroup.add(leftBlush, rightBlush);

  const shadowGeo = new THREE.PlaneGeometry(CHAR.headR * 0.55, CHAR.headR * 0.22);
  const leftShadow = new THREE.Mesh(shadowGeo, shadowMat);
  leftShadow.position.set(-CHAR.headR * 0.38, CHAR.headR * 1.22, CHAR.headR * 0.85);
  const rightShadow = leftShadow.clone();
  rightShadow.position.x *= -1;
  headGroup.add(leftShadow, rightShadow);

  const hair = buildHair(appearance.hairStyle, appearance.hairColor);
  hair.position.copy(head.position);
  headGroup.add(hair);

  const necklace = new THREE.Mesh(new THREE.TorusGeometry(CHAR.headR * 0.55, CHAR.headR * 0.06, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.25 }));
  necklace.position.set(0, CHAR.torsoH + CHAR.neckH * 0.4, CHAR.torsoD * 0.5);
  necklace.rotation.x = Math.PI * 0.55;
  pelvis.add(necklace);
  necklace.visible = false;

  const character = {
    root, pelvis, torso, headGroup, hair, leftLeg, rightLeg, leftArm, rightArm, necklace,
    mats: { skinMat, outfitMat, shoeMat, lipMat, blushMat, eyeshadow: { leftShadow, rightShadow } },
    walkPhase: 0,
    facing: 0,

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
        headGroup.remove(hair);
        const newHair = buildHair(a.hairStyle, a.hairColor);
        newHair.userData.style = a.hairStyle;
        newHair.position.copy(head.position);
        headGroup.add(newHair);
        character.hair = newHair;
      } else {
        character.hair.userData.material.color.set(a.hairColor);
      }
      character.hair.userData.style = a.hairStyle;
    },

    /* distanceMoved drives the gait so animation speed always matches
       actual travel speed instead of drifting with frame rate. */
    animate(dt, distanceMoved, moving) {
      const strideRate = 5.5;
      if (moving) this.walkPhase += distanceMoved * strideRate;
      const target = moving ? 1 : 0;
      this._blend = THREE.MathUtils.lerp(this._blend || 0, target, Math.min(1, dt * 8));
      const blend = this._blend;
      const swing = Math.sin(this.walkPhase) * 0.55 * blend;
      const swingOpp = Math.sin(this.walkPhase + Math.PI) * 0.55 * blend;
      this.leftLeg.hip.rotation.x = swing;
      this.rightLeg.hip.rotation.x = swingOpp;
      this.leftLeg.knee.rotation.x = Math.max(0, -Math.sin(this.walkPhase + Math.PI * 0.5)) * 0.9 * blend;
      this.rightLeg.knee.rotation.x = Math.max(0, -Math.sin(this.walkPhase + Math.PI * 1.5)) * 0.9 * blend;
      this.leftArm.shoulder.rotation.x = swingOpp * 0.7;
      this.rightArm.shoulder.rotation.x = swing * 0.7;
      const bob = Math.abs(Math.sin(this.walkPhase)) * 0.035 * blend;
      this.pelvis.position.y = CHAR.hipY - bob;
      this.torso.rotation.x = 0.06 * blend * Math.sin(this.walkPhase * 2);
      if (!moving) {
        const idle = Math.sin(performance.now() * 0.0015) * 0.015;
        this.torso.scale.set(1, 1 + idle, 1);
      } else {
        this.torso.scale.set(1, 1, 1);
      }
    },
  };

  character.applyAppearance(appearance);
  return character;
}
