/* Mission board: lists the 3 mission types (spy / poster / fashion) and
   hosts the poster mini-editor + fashion runway check UIs. */
function completeMission(id) {
  const mission = GameState.data.missions[id];
  const def = MISSIONS[id];
  if (mission.status === 'complete') return;
  mission.status = 'complete';
  GameState.addCash(def.reward.cash);
  if (def.reward.unlock) {
    GameState.buyItem(def.reward.unlock.category, def.reward.unlock.id, 0);
  }
  GameState.save();
}

const MissionsScreen = {
  mount(root, params) {
    this.back = params.back;
    root.innerHTML = `
      <div class="screen missions-screen">
        <div class="panel-header">
          <h1>Mission Board</h1>
          <button class="secondary-btn" id="close-missions">← Back</button>
        </div>
        <div class="mission-list" id="mission-list"></div>
      </div>`;
    root.querySelector('#close-missions').addEventListener('click', () => {
      if (this.back) Router.show(this.back); else Router.show(PlazaScreen);
    });
    this.list = root.querySelector('#mission-list');
    this.renderList();
  },

  renderList() {
    this.list.innerHTML = Object.values(MISSIONS)
      .map((def) => {
        const state = GameState.data.missions[def.id];
        const badge = { available: 'Not Started', active: 'In Progress', complete: '✅ Complete' }[state.status];
        return `
        <div class="mission-card">
          <div class="mission-card-head">
            <h3>${def.title}</h3>
            <span class="mission-badge mission-${state.status}">${badge}</span>
          </div>
          <p>${def.briefing}</p>
          ${this.renderAction(def, state)}
        </div>`;
      })
      .join('');

    this.list.querySelectorAll('[data-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        GameState.data.missions[btn.dataset.start].status = 'active';
        GameState.save();
        this.renderList();
      });
    });
    this.list.querySelectorAll('[data-open-poster]').forEach((btn) => {
      btn.addEventListener('click', () => this.openPosterEditor());
    });
    this.list.querySelectorAll('[data-check-fashion]').forEach((btn) => {
      btn.addEventListener('click', () => this.checkFashion());
    });
  },

  renderAction(def, state) {
    if (state.status === 'complete') return `<p class="hint">Reward claimed: +$${def.reward.cash}</p>`;
    if (state.status === 'available') return `<button class="primary-btn" data-start="${def.id}">Start Mission</button>`;
    if (def.type === 'spy') {
      const found = state.cluesFound.length;
      return `<p class="hint">Clues found: ${found}/${def.clueIds.length}. Walk around the Plaza and Mall to spot them!</p>`;
    }
    if (def.type === 'poster') return `<button class="primary-btn" data-open-poster>Open Poster Editor</button>`;
    if (def.type === 'fashion') return `<button class="primary-btn" data-check-fashion>Check My Outfit</button>`;
    return '';
  },

  checkFashion() {
    const def = MISSIONS.runway_ready;
    const outfit = findItem('outfits', GameState.data.appearance.outfitId);
    const passed = outfit && outfit.tags.some((t) => def.themeTags.includes(t));
    if (passed) {
      completeMission('runway_ready');
      alert(`You nailed the "Beach Party" theme! +$${def.reward.cash}`);
    } else {
      alert('That outfit doesn\'t match "Beach Party". Try equipping a summer/beach outfit (shop Plaza Threads) then check again.');
    }
    this.renderList();
  },

  openPosterEditor() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const bgColors = ['#f2d24b', '#f28fb0', '#7ac1d9', '#b98ad1', '#4fd9a0'];
    const stickers = ['⭐', '💖', '✨', '🎀', '👑', '🛍️'];
    overlay.innerHTML = `
      <div class="modal poster-editor">
        <h2>Poster Editor</h2>
        <canvas id="poster-canvas" width="360" height="240"></canvas>
        <div class="poster-controls">
          <div>
            <strong>Background</strong>
            <div class="swatch-row">${bgColors.map((c) => `<button class="swatch" data-bg="${c}" style="background:${c}"></button>`).join('')}</div>
          </div>
          <div>
            <strong>Sticker</strong>
            <div class="sticker-row">${stickers.map((s) => `<button class="sticker-btn" data-sticker="${s}">${s}</button>`).join('')}</div>
          </div>
          <div>
            <strong>Headline</strong>
            <input type="text" id="poster-text" maxlength="24" placeholder="Big Plaza Sale!">
          </div>
        </div>
        <div class="modal-actions">
          <button class="secondary-btn" id="poster-cancel">Cancel</button>
          <button class="primary-btn" id="poster-save">Save Poster</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const canvas = overlay.querySelector('#poster-canvas');
    const ctx = canvas.getContext('2d');
    const poster = { bg: bgColors[0], sticker: stickers[0], text: '' };
    const draw = () => {
      ctx.fillStyle = poster.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '48px sans-serif';
      ctx.fillText(poster.sticker, 150, 100);
      ctx.fillStyle = '#2a2a2a';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(poster.text || 'Your Headline Here', canvas.width / 2, 200);
      ctx.textAlign = 'left';
    };
    draw();

    overlay.querySelectorAll('[data-bg]').forEach((b) => b.addEventListener('click', () => { poster.bg = b.dataset.bg; draw(); }));
    overlay.querySelectorAll('[data-sticker]').forEach((b) => b.addEventListener('click', () => { poster.sticker = b.dataset.sticker; draw(); }));
    overlay.querySelector('#poster-text').addEventListener('input', (e) => { poster.text = e.target.value; draw(); });
    overlay.querySelector('#poster-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#poster-save').addEventListener('click', () => {
      GameState.data.missions.poster_perfect.poster = canvas.toDataURL();
      completeMission('poster_perfect');
      overlay.remove();
      alert(`Poster saved! "Poster Perfect" complete! +$${MISSIONS.poster_perfect.reward.cash}`);
      this.renderList();
    });
  },

  destroy() {},
};
