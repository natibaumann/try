/* The player's hub: an apartment and an office, both real 3D rooms
   decorated with furniture bought from the furniture stores. Click a piece
   in the side list, then click a floor tile to place its 3D model; drag to
   orbit the room, scroll to zoom, click a placed piece to remove it. */
const HOME_GRID_COLS = 5;
const HOME_GRID_ROWS = 4;
const HOME_TILE = 1.3;

const HomeScreen = {
  mount(root) {
    this.room = 'apartment';
    this.selectedFurniture = null;
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
            <h3>Your Furniture</h3>
            <p class="hint">Select a piece, then click an empty tile to place it. Click a placed piece to remove it. Drag to look around.</p>
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
        this.rebuildFurniture();
        this.renderInventory();
      });
    });

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

    const roomW = HOME_GRID_COLS * HOME_TILE, roomD = HOME_GRID_ROWS * HOME_TILE, wallH = 2.7;

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
    floorTex.repeat.set(HOME_GRID_COLS, HOME_GRID_ROWS);
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

    this.roomW = roomW; this.roomD = roomD;

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

    this.tileMeshes = [];
    const tileGeo = new THREE.PlaneGeometry(HOME_TILE * 0.94, HOME_TILE * 0.94);
    for (let i = 0; i < HOME_GRID_COLS * HOME_GRID_ROWS; i++) {
      const col = i % HOME_GRID_COLS, row = Math.floor(i / HOME_GRID_COLS);
      const tile = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ visible: false }));
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(-roomW / 2 + HOME_TILE * (col + 0.5), 0.01, -roomD / 2 + HOME_TILE * (row + 0.5));
      tile.userData.index = i;
      scene.add(tile);
      this.tileMeshes.push(tile);
    }

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

  tilePosition(index) {
    const col = index % HOME_GRID_COLS, row = Math.floor(index / HOME_GRID_COLS);
    return { x: -this.roomW / 2 + HOME_TILE * (col + 0.5), z: -this.roomD / 2 + HOME_TILE * (row + 0.5) };
  },

  rebuildFurniture() {
    Object.values(this.furnitureMeshes).forEach((mesh) => { this.scene.remove(mesh); disposeObject(mesh); });
    this.furnitureMeshes = {};
    const layout = GameState.data.home[this.room];
    Object.keys(layout).forEach((idxStr) => {
      this.placeMesh(parseInt(idxStr, 10), layout[idxStr]);
    });
  },

  placeMesh(index, furnitureId) {
    const item = findItem('furniture', furnitureId);
    if (!item) return;
    const mesh = createFurnitureMesh(item);
    const pos = this.tilePosition(index);
    mesh.position.set(pos.x, 0, pos.z);
    mesh.rotation.y = Math.PI * 0.15;
    this.scene.add(mesh);
    this.furnitureMeshes[index] = mesh;
  },

  handleClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.tileMeshes);
    if (!hits.length) return;
    const index = hits[0].object.userData.index;
    const layout = GameState.data.home[this.room];
    if (layout[index]) {
      this.scene.remove(this.furnitureMeshes[index]);
      disposeObject(this.furnitureMeshes[index]);
      delete this.furnitureMeshes[index];
      delete layout[index];
      GameState.save();
    } else if (this.selectedFurniture) {
      layout[index] = this.selectedFurniture;
      GameState.save();
      this.placeMesh(index, this.selectedFurniture);
    }
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
