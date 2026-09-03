/* Shared walkable-map renderer used by both the Plaza and the Mall interior.
   Arrow keys / WASD move the avatar; walking onto a hotspot's zone shows an
   "interact" prompt (Enter key or tap) that fires the hotspot's action. */
function createWorldScreen(mapKey) {
  return {
    mapKey,

    mount(root) {
      const map = MAPS[this.mapKey];
      this.pos = { x: 50, y: 80 };
      this.keys = {};
      this.activeHotspot = null;

      root.innerHTML = `
        <div class="screen world-screen world-${map.background}">
          ${this.renderHUD(map)}
          <div class="world-stage" id="world-stage">
            ${map.hotspots
              .map((h) => `<div class="hotspot" id="hs-${h.id}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%">
                <span class="hotspot-icon">${h.icon}</span><span class="hotspot-label">${h.label}</span>
              </div>`)
              .join('')}
            ${(map.clues || [])
              .map((c) => `<div class="clue-hotspot" id="clue-${c.id}" style="left:${c.x}%;top:${c.y}%;width:${c.w}%;height:${c.h}%">
                <span class="hotspot-icon">${c.icon}</span></div>`)
              .join('')}
            <div class="player-avatar" id="player-avatar">${renderAvatarSVG(GameState.data.appearance, { fullBody: false })}</div>
          </div>
          <div class="interact-prompt" id="interact-prompt" hidden></div>
        </div>`;

      this.stage = root.querySelector('#world-stage');
      this.player = root.querySelector('#player-avatar');
      this.prompt = root.querySelector('#interact-prompt');

      this.onKeyDown = (e) => {
        this.keys[e.key.toLowerCase()] = true;
        if ((e.key === 'e' || e.key === 'Enter') && this.activeHotspot) {
          this.trigger(this.activeHotspot);
        }
      };
      this.onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);

      map.hotspots.forEach((h) => {
        root.querySelector(`#hs-${h.id}`).addEventListener('click', () => this.trigger(h));
      });
      (map.clues || []).forEach((c) => {
        root.querySelector(`#clue-${c.id}`).addEventListener('click', () => this.foundClue(c.id));
      });

      this.running = true;
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
      this.refreshHUDCash();
      this.updateClueVisibility();
    },

    renderHUD(map) {
      return `
        <div class="hud">
          <div class="hud-left">
            <span class="hud-location">${map.name}</span>
          </div>
          <div class="hud-right">
            <span class="hud-cash">💰 $${GameState.data.cash}</span>
            <button class="hud-btn" id="hud-missions">📋 Missions</button>
          </div>
        </div>`;
    },

    refreshHUDCash() {
      const el = this.stage.parentElement.querySelector('.hud-cash');
      if (el) el.textContent = `💰 $${GameState.data.cash}`;
      const missionsBtn = this.stage.parentElement.querySelector('#hud-missions');
      if (missionsBtn && !missionsBtn._bound) {
        missionsBtn._bound = true;
        missionsBtn.addEventListener('click', () => Router.show(MissionsScreen, { back: this }));
      }
    },

    updateClueVisibility() {
      const map = MAPS[this.mapKey];
      (map.clues || []).forEach((c) => {
        const el = this.stage.querySelector(`#clue-${c.id}`);
        if (!el) return;
        const mission = GameState.data.missions.spy_assignment;
        const found = mission.cluesFound.includes(c.id);
        const active = mission.status === 'active';
        el.style.display = active && !found ? 'flex' : 'none';
      });
    },

    foundClue(id) {
      const mission = GameState.data.missions.spy_assignment;
      if (mission.status !== 'active' || mission.cluesFound.includes(id)) return;
      mission.cluesFound.push(id);
      GameState.save();
      this.updateClueVisibility();
      const def = MISSIONS.spy_assignment;
      if (mission.cluesFound.length >= def.clueIds.length) {
        completeMission('spy_assignment');
        alert(`Clue found! All clues collected — "${def.title}" complete! +$${def.reward.cash}`);
      } else {
        alert(`Clue found! (${mission.cluesFound.length}/${def.clueIds.length})`);
      }
      this.refreshHUDCash();
    },

    loop() {
      if (!this.running) return;
      const speed = 1.1;
      let { x, y } = this.pos;
      if (this.keys['arrowup'] || this.keys['w']) y -= speed;
      if (this.keys['arrowdown'] || this.keys['s']) y += speed;
      if (this.keys['arrowleft'] || this.keys['a']) x -= speed;
      if (this.keys['arrowright'] || this.keys['d']) x += speed;
      x = Math.max(2, Math.min(94, x));
      y = Math.max(15, Math.min(92, y));
      this.pos = { x, y };
      this.player.style.left = x + '%';
      this.player.style.top = y + '%';

      const map = MAPS[this.mapKey];
      let found = null;
      for (const h of map.hotspots) {
        if (x + 3 > h.x && x - 3 < h.x + h.w && y + 3 > h.y && y - 3 < h.y + h.h) {
          found = h;
          break;
        }
      }
      if (found !== this.activeHotspot) {
        this.activeHotspot = found;
        if (found) {
          this.prompt.hidden = false;
          this.prompt.textContent = `Press E to enter ${found.label}`;
        } else {
          this.prompt.hidden = true;
        }
      }
      requestAnimationFrame(this.loop);
    },

    trigger(hotspot) {
      const action = hotspot.action;
      if (action.type === 'goto') {
        const target = action.target === 'mall' ? MallScreen : PlazaScreen;
        Router.goto(target, {}, 1100);
      } else if (action.type === 'store') {
        Router.goto(StoreScreen, { storeId: action.target }, 900);
      } else if (action.type === 'salon') {
        Router.goto(SalonScreen, {}, 900);
      } else if (action.type === 'home') {
        Router.goto(HomeScreen, {}, 900);
      } else if (action.type === 'missions') {
        Router.show(MissionsScreen, { back: this });
      }
    },

    destroy() {
      this.running = false;
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    },
  };
}

const PlazaScreen = createWorldScreen('plaza');
const MallScreen = createWorldScreen('mall');
