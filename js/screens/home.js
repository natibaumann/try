/* The player's hub: an apartment and an office, both decoratable with
   furniture bought from the furniture stores. */
const HOME_GRID_COLS = 5;
const HOME_GRID_ROWS = 4;

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
          <div class="home-grid" id="home-grid"></div>
          <div class="home-inventory">
            <h3>Your Furniture</h3>
            <p class="hint">Select a piece, then click an empty tile to place it. Click a placed piece to remove it.</p>
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
        this.render();
      });
    });

    this.grid = root.querySelector('#home-grid');
    this.list = root.querySelector('#furniture-list');
    this.render();
  },

  render() {
    const layout = GameState.data.home[this.room];
    const cells = [];
    for (let i = 0; i < HOME_GRID_COLS * HOME_GRID_ROWS; i++) {
      const furnitureId = layout[i];
      const item = furnitureId ? findItem('furniture', furnitureId) : null;
      cells.push(`<div class="home-tile ${item ? 'occupied' : ''}" data-tile="${i}">${item ? `<span class="tile-icon" style="color:${item.color}">▣</span><span class="tile-label">${item.name}</span>` : ''}</div>`);
    }
    this.grid.innerHTML = cells.join('');
    this.grid.querySelectorAll('[data-tile]').forEach((tile) => {
      tile.addEventListener('click', () => this.handleTileClick(parseInt(tile.dataset.tile, 10)));
    });

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
        this.render();
      });
    });
  },

  handleTileClick(index) {
    const layout = GameState.data.home[this.room];
    if (layout[index]) {
      delete layout[index];
      GameState.save();
      this.render();
    } else if (this.selectedFurniture) {
      layout[index] = this.selectedFurniture;
      GameState.save();
      this.render();
    }
  },

  destroy() {},
};
