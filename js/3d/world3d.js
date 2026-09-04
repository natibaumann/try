/* The 3D engine shared by the Plaza and the Mall interior: renderer/camera
   setup, physical movement (acceleration/friction, not teleport-per-frame),
   axis-separated collision against building footprints, a smoothed
   third-person chase camera, and proximity-based "walk up, press E"
   interaction - mirroring the same mount()/destroy() contract the rest of
   the router already expects from a screen. */
const SCENE_BUILDERS = { plaza: buildPlazaScene, mall: buildMallScene };

function shortestAngleLerp(current, target, t) {
  const twoPi = Math.PI * 2;
  let diff = (target - current + Math.PI) % twoPi;
  if (diff < 0) diff += twoPi;
  diff -= Math.PI;
  return current + diff * t;
}

function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    }
  });
}

function createWorld3DScreen(sceneKey) {
  return {
    sceneKey,

    mount(root, params) {
      const built = this.sceneKey === 'store' ? buildStoreScene(params.storeId) : SCENE_BUILDERS[this.sceneKey]();
      this.built = built;
      this.scene = built.scene;

      root.innerHTML = `
        <div class="screen world-screen">
          <div class="hud">
            <div class="hud-left"><span class="hud-location">${built.name}</span></div>
            <div class="hud-right">
              <span class="hud-cash">💰 $${GameState.data.cash}</span>
              <button class="hud-btn" id="hud-missions">📋 Missions</button>
            </div>
          </div>
          <div class="world3d-viewport" id="world3d-viewport"></div>
          <div class="interact-prompt" id="interact-prompt" hidden></div>
        </div>`;

      this.viewport = root.querySelector('#world3d-viewport');
      root.querySelector('#hud-missions').addEventListener('click', () => MissionsScreen.open());
      this.prompt = root.querySelector('#interact-prompt');
      this.prompt.addEventListener('click', () => { if (this.activeHotspot) this.trigger(this.activeHotspot); });

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.viewport.appendChild(this.renderer.domElement);

      this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

      const start = (this.sceneKey !== 'store' && this.lastPosition) || built.spawn;
      this.character = createCharacter(GameState.data.appearance);
      this.character.root.position.set(start.x, 0, start.z);
      this.character.root.rotation.y = start.yaw;
      this.yaw = start.yaw;
      this.scene.add(this.character.root);

      this.camPos = new THREE.Vector3(start.x, 3, start.z + 6);
      this.camLook = new THREE.Vector3(start.x, 1.4, start.z);
      this.camera.position.copy(this.camPos);

      this.velocity = new THREE.Vector3();
      this.keys = {};
      this.activeHotspot = null;

      this.onKeyDown = (e) => {
        if (document.querySelector('.modal-overlay')) return;
        const k = e.key.toLowerCase();
        this.keys[k] = true;
        if ((k === 'e' || k === 'enter') && this.activeHotspot) this.trigger(this.activeHotspot);
      };
      this.onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);

      this.onResize = () => this.resize();
      window.addEventListener('resize', this.onResize);
      this.resize();

      this.clock = new THREE.Clock();
      this.running = true;
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    },

    resize() {
      const w = this.viewport.clientWidth, h = this.viewport.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    },

    resolveCollision(pos, radius) {
      this.built.colliders.forEach((c) => {
        const halfW = c.w / 2 + radius, halfD = c.d / 2 + radius;
        const dx = pos.x - c.x, dz = pos.z - c.z;
        if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
          const overlapX = halfW - Math.abs(dx);
          const overlapZ = halfD - Math.abs(dz);
          if (overlapX < overlapZ) pos.x += overlapX * Math.sign(dx || 1);
          else pos.z += overlapZ * Math.sign(dz || 1);
        }
      });
      const b = this.built.bounds;
      pos.x = Math.max(b.minX, Math.min(b.maxX, pos.x));
      pos.z = Math.max(b.minZ, Math.min(b.maxZ, pos.z));
    },

    loop() {
      if (!this.running) return;
      const dt = Math.min(this.clock.getDelta(), 0.1);

      if (document.querySelector('.modal-overlay')) {
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.loop);
        return;
      }

      const dir = new THREE.Vector3();
      if (this.keys['arrowup'] || this.keys['w']) dir.z -= 1;
      if (this.keys['arrowdown'] || this.keys['s']) dir.z += 1;
      if (this.keys['arrowleft'] || this.keys['a']) dir.x -= 1;
      if (this.keys['arrowright'] || this.keys['d']) dir.x += 1;
      const hasInput = dir.lengthSq() > 0;
      if (hasInput) dir.normalize();

      /* Tuned for snappy, arcade-style response rather than realistic
         inertia: input reaches top speed almost immediately, stops
         crisply, and the character/camera turn to match quickly instead
         of feeling like they're sliding on ice. */
      const maxSpeed = 4.4, accel = 40, friction = 24;
      if (hasInput) {
        this.velocity.x += dir.x * accel * dt;
        this.velocity.z += dir.z * accel * dt;
        const speed = this.velocity.length();
        if (speed > maxSpeed) this.velocity.multiplyScalar(maxSpeed / speed);
      } else {
        const decay = Math.max(0, 1 - friction * dt);
        this.velocity.multiplyScalar(decay);
        if (this.velocity.length() < 0.02) this.velocity.set(0, 0, 0);
      }

      const pos = this.character.root.position;
      const distanceMoved = this.velocity.length() * dt;
      pos.x += this.velocity.x * dt;
      pos.z += this.velocity.z * dt;
      this.resolveCollision(pos, 0.4);

      const moving = this.velocity.length() > 0.1;
      if (moving) {
        const targetYaw = Math.atan2(-this.velocity.x, -this.velocity.z);
        this.yaw = shortestAngleLerp(this.yaw, targetYaw, Math.min(1, dt * 18));
        this.character.root.rotation.y = this.yaw;
      }
      this.character.animate(dt, distanceMoved, moving);

      const back = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const desiredCamPos = new THREE.Vector3(pos.x, 0, pos.z).addScaledVector(back, 5.2).add(new THREE.Vector3(0, 2.6, 0));
      const desiredLook = new THREE.Vector3(pos.x, 1.4, pos.z);
      this.camPos.lerp(desiredCamPos, Math.min(1, dt * 8));
      this.camLook.lerp(desiredLook, Math.min(1, dt * 12));
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);

      this.updateInteraction(pos);

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.loop);
    },

    updateInteraction(pos) {
      let found = null;
      for (const h of this.built.hotspots) {
        const dx = pos.x - h.position.x, dz = pos.z - h.position.z;
        if (dx * dx + dz * dz < 2.6 * 2.6) { found = h; break; }
      }
      if (!found) {
        for (const c of this.built.clueProps) {
          const mission = GameState.data.missions.spy_assignment;
          if (mission.status !== 'active' || mission.cluesFound.includes(c.id)) continue;
          const dx = pos.x - c.position.x, dz = pos.z - c.position.z;
          if (dx * dx + dz * dz < c.radius * c.radius) { found = { id: c.id, label: c.label, action: { type: 'clue' } }; break; }
        }
      }
      if (found !== this.activeHotspot) {
        this.activeHotspot = found;
        if (found) {
          this.prompt.hidden = false;
          this.prompt.textContent = found.action.type === 'clue' ? `Press E to investigate the ${found.label}` : `Press E to enter ${found.label}`;
        } else {
          this.prompt.hidden = true;
        }
      }
    },

    trigger(hotspot) {
      const action = hotspot.action;
      if (action.type === 'clue') {
        this.foundClue(hotspot.id);
        return;
      }
      if (action.type === 'missions') {
        MissionsScreen.open();
        return;
      }
      if (action.type === 'item') {
        ItemPopup.open(action.item, action.category, () => this.refreshHUDCash());
        return;
      }
      const pos = this.character.root.position;
      this.lastPosition = { x: pos.x, z: pos.z, yaw: this.yaw };
      if (action.type === 'goto') {
        Router.goto(action.target === 'mall' ? MallScreen : PlazaScreen, {}, 1100);
      } else if (action.type === 'store') {
        Router.goto(StoreScreen3D, { storeId: action.target }, 900);
      } else if (action.type === 'salon') {
        Router.goto(SalonScreen, {}, 900);
      } else if (action.type === 'home') {
        Router.goto(HomeScreen, {}, 900);
      }
    },

    foundClue(id) {
      const mission = GameState.data.missions.spy_assignment;
      if (mission.status !== 'active' || mission.cluesFound.includes(id)) return;
      mission.cluesFound.push(id);
      GameState.save();
      const def = MISSIONS.spy_assignment;
      if (mission.cluesFound.length >= def.clueIds.length) {
        completeMission('spy_assignment');
        alert(`Clue found! All clues collected - "${def.title}" complete! +$${def.reward.cash}`);
      } else {
        alert(`Clue found! (${mission.cluesFound.length}/${def.clueIds.length})`);
      }
      this.refreshHUDCash();
    },

    refreshHUDCash() {
      const cashEl = document.querySelector('.world-screen .hud-cash');
      if (cashEl) cashEl.textContent = `💰 $${GameState.data.cash}`;
    },

    destroy() {
      this.running = false;
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('resize', this.onResize);
      disposeObject(this.scene);
      this.renderer.dispose();
    },
  };
}

const PlazaScreen = createWorld3DScreen('plaza');
const MallScreen = createWorld3DScreen('mall');
const StoreScreen3D = createWorld3DScreen('store');
