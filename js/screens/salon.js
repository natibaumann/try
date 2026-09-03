/* Hair salon: change hairstyle & color any time, no need to redo the whole look. */
const SalonScreen = {
  mount(root) {
    this.appearance = GameState.data.appearance;
    root.innerHTML = `
      <div class="screen customization-screen salon-screen">
        <div class="panel-header">
          <h1>Plaza Salon</h1>
          <button class="secondary-btn" id="salon-back">← Leave Salon</button>
        </div>
        <div class="customization-layout">
          <div class="avatar-preview" id="salon-preview"></div>
          <div class="customization-panel">
            <h3>Hairstyle</h3>
            <div class="style-grid" id="salon-styles"></div>
            <h3>Hair Color</h3>
            <div class="swatch-row" id="salon-colors"></div>
          </div>
        </div>
      </div>`;

    root.querySelector('#salon-back').addEventListener('click', () => Router.goto(PlazaScreen, {}, 700));
    this.preview = root.querySelector('#salon-preview');
    this.styles = root.querySelector('#salon-styles');
    this.colors = root.querySelector('#salon-colors');

    this.styles.innerHTML = ITEMS.hairStyles
      .map((h) => `<button class="style-card ${h.id === this.appearance.hairStyle ? 'selected' : ''}" data-style="${h.id}">${h.name}</button>`)
      .join('');
    this.colors.innerHTML = ITEMS.hairColors
      .map((c) => `<button class="swatch ${c === this.appearance.hairColor ? 'selected' : ''}" data-color="${c}" style="background:${c}"></button>`)
      .join('');

    this.styles.querySelectorAll('[data-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.appearance.hairStyle = btn.dataset.style;
        this.refresh();
      });
    });
    this.colors.querySelectorAll('[data-color]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.appearance.hairColor = btn.dataset.color;
        this.refresh();
      });
    });

    this.previewWidget = createTurntablePreview(this.preview, this.appearance);
  },

  renderPreview() {
    if (this.previewWidget) this.previewWidget.updateAppearance(this.appearance);
  },

  refresh() {
    GameState.save();
    this.renderPreview();
    this.styles.querySelectorAll('.style-card').forEach((b) => b.classList.toggle('selected', b.dataset.style === this.appearance.hairStyle));
    this.colors.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('selected', b.dataset.color === this.appearance.hairColor));
  },

  destroy() {
    if (this.previewWidget) this.previewWidget.destroy();
  },
};
