/* The player's hub: an apartment and an office, both real 3D rooms
   decorated with furniture bought from the furniture stores. Select a piece
   from the side list, then click anywhere on the floor to drop it right
   there - no grid snapping. Click a placed piece to select it and a small
   panel appears with Rotate/Remove controls. Drag to orbit the room, scroll
   to zoom. */
const HOME_ROOM_W = 6.5;
const HOME_ROOM_D = 5.2;
const HOME_PLACE_MARGIN = 0.45;

const HomeScreen = {
  mount(root) {
    this.room = 'apartment';
    this.selectedFurniture = null;
    this.selectedPlacementId = null;
    root.innerHTML = `
      <div class="screen home-screen">
        <div class="panel-header">
          <h1>Your Place</h1>
          <div class="panel-header-right">
            <div class="tabs">
              <button class="tab-btn active" data-room="apartment">🏠 Apartment</button>
              <button class="tab-btn" data-room="office">💼 Office</button>
            </div>
            <button class="secondary-btn" id="home-back">← Back to Plaza</button>
          </div>
        </div>
        <div class="home-layout">
          <div class="home-viewport" id="home-viewport"></div>
          <div class="home-inventory">
            <div class="placement-controls" id="placement-controls" hidden>
              <p>Selected: <strong id="placement-name"></strong></p>
              <div class="placement-actions">
                <button id="home-rotate-btn">⟳ Rotate</button>
                <button id="home-remove-btn">🗑 Remove</button>
                <button id="home-deselect-btn">Done</button>
              </div>
            </div>
            <h3>Your Furniture</h3>
            <p class="hint">Select a piece, then click anywhere on the floor to place it. Click a placed piece to select it, rotate, or remove it. Drag to look around.</p>
            <div class="furniture-list" id="furniture-list"></div>
          </div>
        </div>
      </div>`;

    root.querySelector('#home-back').addEventListener('click', () => Router.goto(PlazaScreen, {}, 700));
    root.querySelectorAll('[data-room]').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-room]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.room = btn.dataset.room;
        this.selectedFurniture = null;
        this.selectPlacement(null);
        this.rebuildFurniture();
        this.renderInventory();
      });
    });

    this.controls = root.querySelector('#placement-controls');
    this.controls.querySelector('#home-rotate-btn').addEventListener('click', () => this.rotateSelected());
    this.controls.querySelector('#home-remove-btn').addEventListener('click', () => this.removeSelected());
    this.controls.querySelector('#home-deselect-btn').addEventListener('click', () => this.selectPlacement(null));

    this.viewport = root.querySelector('#home-viewport');
    this.list = root.querySelector('#furniture-list');
    this.initScene();
    this.rebuildFurniture();
    this.renderInventory();
    this.running = true;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  },

  initScene() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.viewport.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbeef5);
    this.scene = scene;

    const roomW = HOME_ROOM_W, roomD = HOME_ROOM_D, wallH = 2.7;
    this.roomW = roomW; this.roomD = roomD;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe8d0c0, 0.6));
    const key = new THREE.DirectionalLight(0xfff2e0, 1);
    key.position.set(roomW * 0.6, wallH * 2.2, roomD * 0.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    scene.add(key);
    scene.add(new THREE.PointLight(0xffe0d0, 0.35, 12));

    const floorTex = makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#f2e2c9';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(150,120,80,0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    }, 128, 128);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(HOME_ROOM_W / 1.3, HOME_ROOM_D / 1.3);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    this.floor = floor;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf7e9ee, roughness: 0.95 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, wallH, 0.15), wallMat);
    backWall.position.set(0, wallH / 2, -roomD / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, roomD), wallMat);
    sideWall.position.set(-roomW / 2, wallH / 2, 0);
    sideWall.receiveShadow = true;
    scene.add(sideWall);

    const window1 = new THREE.Mesh(new THREE.PlaneGeometry(roomW * 0.28, wallH * 0.4), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x9fd6ff, emissiveIntensity: 0.5 }));
    window1.position.set(roomW * 0.2, wallH * 0.6, -roomD / 2 + 0.08);
    scene.add(window1);

    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.62, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.015;
    this.selectionRing.visible = false;
    scene.add(this.selectionRing);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    this.camera = camera;
    this.orbit = { azimuth: Math.PI * 0.28, polar: 0.95, radius: Math.max(roomW, roomD) * 1.25 };
    this.updateCamera();

    this.dragging = false;
    this.dragMoved = false;
    this.onPointerDown = (e) => {
      this.dragging = true;
      this.dragMoved = false;
      this.lastX = e.clientX; this.lastY = e.clientY;
    };
    this.onPointerMove = (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.dragMoved = true;
      this.orbit.azimuth -= dx * 0.006;
      this.orbit.polar = Math.max(0.5, Math.min(1.3, this.orbit.polar - dy * 0.004));
      this.lastX = e.clientX; this.lastY = e.clientY;
      this.updateCamera();
    };
    this.onPointerUp = (e) => {
      this.dragging = false;
      if (!this.dragMoved) this.handleClick(e);
    };
    this.onWheel = (e) => {
      e.preventDefault();
      this.orbit.radius = Math.max(5, Math.min(14, this.orbit.radius + e.deltaY * 0.01));
      this.updateCamera();
    };
    renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.resize();

    this.furnitureMeshes = {};
    this.raycaster = new THREE.Raycaster();
  },

  updateCamera() {
    const { azimuth, polar, radius } = this.orbit;
    const x = radius * Math.sin(polar) * Math.sin(azimuth);
    const z = radius * Math.sin(polar) * Math.cos(azimuth);
    const y = radius * Math.cos(polar);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0.6, 0);
  },

  resize() {
    const w = this.viewport.clientWidth, h = this.viewport.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },

  rebuildFurniture() {
    Object.values(this.furnitureMeshes).forEach((mesh) => { this.scene.remove(mesh); disposeObject(mesh); });
    this.furnitureMeshes = {};
    GameState.data.home[this.room].forEach((record) => this.placeMesh(record));
  },

  placeMesh(record) {
    const item = findItem('furniture', record.furnitureId);
    if (!item) return;
    const mesh = createFurnitureMesh(item);
    mesh.position.set(record.x, 0, record.z);
    mesh.rotation.y = record.rotation;
    mesh.userData.placementId = record.id;
    this.scene.add(mesh);
    this.furnitureMeshes[record.id] = mesh;
  },

  clampToFloor(x, z) {
    const hw = this.roomW / 2 - HOME_PLACE_MARGIN, hd = this.roomD / 2 - HOME_PLACE_MARGIN;
    return { x: Math.max(-hw, Math.min(hw, x)), z: Math.max(-hd, Math.min(hd, z)) };
  },

  placeNew(furnitureId, x, z) {
    const p = this.clampToFloor(x, z);
    const record = {
      id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      furnitureId, x: p.x, z: p.z, rotation: 0,
    };
    GameState.data.home[this.room].push(record);
    GameState.save();
    this.placeMesh(record);
    this.selectPlacement(record.id);
  },

  handleClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(mouse, this.camera);

    const furnitureHits = this.raycaster.intersectObjects(Object.values(this.furnitureMeshes), true);
    if (furnitureHits.length) {
      let obj = furnitureHits[0].object;
      while (obj && obj.userData.placementId === undefined) obj = obj.parent;
      if (obj) {
        this.selectPlacement(obj.userData.placementId);
        return;
      }
    }

    const floorHits = this.raycaster.intersectObject(this.floor);
    if (!floorHits.length) return;
    if (this.selectedFurniture) {
      this.placeNew(this.selectedFurniture, floorHits[0].point.x, floorHits[0].point.z);
    } else {
      this.selectPlacement(null);
    }
  },

  selectPlacement(id) {
    this.selectedPlacementId = id;
    const mesh = id ? this.furnitureMeshes[id] : null;
    if (mesh) {
      this.selectionRing.visible = true;
      this.selectionRing.position.set(mesh.position.x, 0.015, mesh.position.z);
    } else {
      this.selectionRing.visible = false;
    }
    this.renderPlacementControls();
  },

  renderPlacementControls() {
    const record = this.selectedPlacementId && GameState.data.home[this.room].find((r) => r.id === this.selectedPlacementId);
    if (!record) {
      this.controls.hidden = true;
      return;
    }
    const item = findItem('furniture', record.furnitureId);
    this.controls.hidden = false;
    this.controls.querySelector('#placement-name').textContent = item ? item.name : record.furnitureId;
  },

  rotateSelected() {
    const record = GameState.data.home[this.room].find((r) => r.id === this.selectedPlacementId);
    if (!record) return;
    record.rotation = (record.rotation + Math.PI / 4) % (Math.PI * 2);
    GameState.save();
    const mesh = this.furnitureMeshes[record.id];
    if (mesh) mesh.rotation.y = record.rotation;
  },

  removeSelected() {
    const layout = GameState.data.home[this.room];
    const idx = layout.findIndex((r) => r.id === this.selectedPlacementId);
    if (idx === -1) return;
    layout.splice(idx, 1);
    GameState.save();
    const mesh = this.furnitureMeshes[this.selectedPlacementId];
    if (mesh) {
      this.scene.remove(mesh);
      disposeObject(mesh);
      delete this.furnitureMeshes[this.selectedPlacementId];
    }
    this.selectPlacement(null);
  },

  renderInventory() {
    const owned = GameState.data.inventory.furniture
      .map((id) => findItem('furniture', id))
      .filter((item) => item && (item.room === this.room || item.room === 'both'));
    this.list.innerHTML = owned.length
      ? owned
          .map((item) => `<button class="style-card ${this.selectedFurniture === item.id ? 'selected' : ''}" data-furniture="${item.id}"><span class="swatch-dot" style="background:${item.color}"></span>${item.name}</button>`)
          .join('')
      : '<p class="hint">No furniture yet - visit a Home Goods store in the Plaza or Mall!</p>';
    this.list.querySelectorAll('[data-furniture]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedFurniture = this.selectedFurniture === btn.dataset.furniture ? null : btn.dataset.furniture;
        if (this.selectedFurniture) this.selectPlacement(null);
        this.renderInventory();
      });
    });
  },

  loop() {
    if (!this.running) return;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  },

  destroy() {
    this.running = false;
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);
    disposeObject(this.scene);
    this.renderer.dispose();
  },
};
