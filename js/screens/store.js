/* Generic, config-driven shop used for every store in both the Plaza and
   the Mall - which items it carries is filtered by store id + category. */
const StoreScreen = {
  mount(root, params) {
    const info = STORE_CATALOG[params.storeId];
    this.info = info;
    this.backTarget = info.back === 'mall' ? MallScreen : PlazaScreen;
    const items = ITEMS[info.category].filter((i) => i.store === params.storeId);

    root.innerHTML = `
      <div class="screen store-screen">
        <div class="panel-header">
          <div>
            <h1>${info.name}</h1>
            <span class="hint">${info.brand} · ${info.category}</span>
          </div>
          <div class="panel-header-right">
            <span class="hud-cash">💰 $${GameState.data.cash}</span>
            <button class="secondary-btn" id="store-back">← Leave Store</button>
          </div>
        </div>
        <div class="item-grid" id="store-items"></div>
      </div>`;

    root.querySelector('#store-back').addEventListener('click', () => Router.goto(this.backTarget, {}, 700));
    this.grid = root.querySelector('#store-items');
    this.category = info.category;
    this.items = items;
    this.renderGrid();
  },

  renderGrid() {
    const owned = GameState.data.inventory[this.category] || [];
    const equippedKey = { outfits: 'outfitId', shoes: 'shoesId', jewelry: 'jewelryId' }[this.category];
    this.grid.innerHTML = this.items
      .map((item) => {
        const isOwned = owned.includes(item.id);
        const isEquipped = equippedKey && GameState.data.appearance[equippedKey] === item.id;
        let actionLabel = 'Buy';
        if (isOwned) actionLabel = equippedKey ? (isEquipped ? 'Equipped' : 'Equip') : 'Owned';
        return `
        <div class="item-card">
          <div class="item-swatch" style="background:${item.color}"></div>
          <h4>${item.name}</h4>
          <span class="hint">${item.brand}</span>
          <span class="item-price">${item.price > 0 ? '$' + item.price : 'Free'}</span>
          <button class="${isEquipped ? 'secondary-btn' : 'primary-btn'}" data-item="${item.id}" ${isEquipped ? 'disabled' : ''}>${actionLabel}</button>
        </div>`;
      })
      .join('');

    this.grid.querySelectorAll('[data-item]').forEach((btn) => {
      btn.addEventListener('click', () => this.handleAction(btn.dataset.item));
    });
  },

  handleAction(itemId) {
    const item = this.items.find((i) => i.id === itemId);
    const owned = GameState.data.inventory[this.category] || [];
    const equippedKey = { outfits: 'outfitId', shoes: 'shoesId', jewelry: 'jewelryId' }[this.category];

    if (!owned.includes(itemId)) {
      const bought = GameState.buyItem(this.category, itemId, item.price);
      if (!bought) {
        alert("You don't have enough cash for that!");
        return;
      }
    } else if (equippedKey) {
      GameState.data.appearance[equippedKey] = itemId;
      GameState.save();
    }
    this.renderHeaderCash();
    this.renderGrid();
  },

  renderHeaderCash() {
    const el = document.querySelector('.store-screen .hud-cash');
    if (el) el.textContent = `💰 $${GameState.data.cash}`;
  },

  destroy() {},
};
