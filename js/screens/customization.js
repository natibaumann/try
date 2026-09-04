/* First screen the player sees: build the character before entering the world. */
const CustomizationScreen = {
  mount(root, params) {
    this.appearance = GameState.data.appearance;
    this.tab = 'face';
    root.innerHTML = `
      <div class="screen customization-screen">
        <h1 class="game-title">Style Squad Studio</h1>
        <div class="customization-layout">
          <div class="avatar-preview" id="cust-preview"></div>
          <div class="customization-panel">
            <div class="tabs" id="cust-tabs">
              <button data-tab="face" class="tab-btn active">Face</button>
              <button data-tab="hair" class="tab-btn">Hair</button>
              <button data-tab="makeup" class="tab-btn">Makeup</button>
              <button data-tab="outfit" class="tab-btn">Outfit</button>
            </div>
            <div id="cust-body" class="tab-body"></div>
            <button id="cust-enter" class="primary-btn">Enter the World →</button>
          </div>
        </div>
      </div>`;

    this.preview = root.querySelector('#cust-preview');
    this.body = root.querySelector('#cust-body');
    root.querySelector('#cust-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      root.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.tab = btn.dataset.tab;
      this.renderBody();
    });
    root.querySelector('#cust-enter').addEventListener('click', () => {
      GameState.data.createdCharacter = true;
      GameState.save();
      Router.goto(PlazaScreen, {}, 1100);
    });

    this.previewWidget = createTurntablePreview(this.preview, this.appearance);
    this.renderBody();
  },

  renderPreview() {
    if (this.previewWidget) this.previewWidget.updateAppearance(this.appearance);
  },

  swatchRow(colors, current, onPick) {
    return `<div class="swatch-row">${colors
      .map((c) => {
        const isNone = c === null;
        const style = isNone ? '' : `style="background:${c}"`;
        const sel = c === current ? 'selected' : '';
        return `<button class="swatch ${sel} ${isNone ? 'swatch-none' : ''}" data-color="${c || ''}" ${style} title="${isNone ? 'None' : c}"></button>`;
      })
      .join('')}</div>`;
  },

  renderBody() {
    const a = this.appearance;
    if (this.tab === 'face') {
      this.body.innerHTML = `
        <h3>Skin Tone</h3>
        ${this.swatchRow(ITEMS.skinTones, a.skinTone)}
        <h3>Eye Color</h3>
        ${this.swatchRow(ITEMS.eyeColors, a.eyeColor)}`;
      this.bindSwatches(this.body, (color, group) => {
        if (group === 0) a.skinTone = color; else a.eyeColor = color;
      });
    } else if (this.tab === 'hair') {
      this.body.innerHTML = `
        <h3>Hairstyle</h3>
        <div class="style-grid">
          ${ITEMS.hairStyles
            .map((h) => `<button class="style-card ${h.id === a.hairStyle ? 'selected' : ''}" data-style="${h.id}">${h.name}</button>`)
            .join('')}
        </div>
        <h3>Hair Color</h3>
        ${this.swatchRow(ITEMS.hairColors, a.hairColor)}`;
      this.body.querySelectorAll('.style-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          a.hairStyle = btn.dataset.style;
          this.refresh();
        });
      });
      this.bindSwatches(this.body, (color) => { a.hairColor = color; });
    } else if (this.tab === 'makeup') {
      this.body.innerHTML = `
        <h3>Lipstick</h3>
        ${this.swatchRow(ITEMS.lipstickColors, a.lipstick)}
        <h3>Eyeshadow</h3>
        ${this.swatchRow(ITEMS.eyeshadowColors, a.eyeshadow)}
        <h3>Blush</h3>
        ${this.swatchRow(ITEMS.blushColors, a.blush)}
        <h3>Intensity</h3>
        <input type="range" id="cust-intensity" min="0.2" max="1" step="0.1" value="${a.makeupIntensity}">`;
      this.bindSwatches(this.body, (color, group) => {
        if (group === 0) a.lipstick = color || null;
        else if (group === 1) a.eyeshadow = color || null;
        else a.blush = color || null;
      });
      this.body.querySelector('#cust-intensity').addEventListener('input', (e) => {
        a.makeupIntensity = parseFloat(e.target.value);
        this.renderPreview();
      });
    } else if (this.tab === 'outfit') {
      const owned = GameState.data.inventory.outfits;
      this.body.innerHTML = `
        <h3>Starter Outfits</h3>
        <div class="style-grid">
          ${ITEMS.outfits
            .filter((o) => owned.includes(o.id))
            .map((o) => `<button class="style-card ${o.id === a.outfitId ? 'selected' : ''}" data-outfit="${o.id}"><span class="swatch-dot" style="background:${o.color}"></span>${o.name}</button>`)
            .join('')}
        </div>
        <p class="hint">Shop the Plaza and Mall stores to unlock more outfits, shoes, and jewelry!</p>`;
      this.body.querySelectorAll('[data-outfit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          a.outfitId = btn.dataset.outfit;
          this.refresh();
        });
      });
    }
  },

  bindSwatches(container, cb) {
    const rows = container.querySelectorAll('.swatch-row');
    rows.forEach((row, groupIdx) => {
      row.querySelectorAll('.swatch').forEach((btn) => {
        btn.addEventListener('click', () => {
          cb(btn.dataset.color || null, groupIdx);
          this.refresh();
        });
      });
    });
  },

  refresh() {
    GameState.save();
    this.renderPreview();
    this.renderBody();
  },

  destroy() {
    if (this.previewWidget) this.previewWidget.destroy();
  },
};
