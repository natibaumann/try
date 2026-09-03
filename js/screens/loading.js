/* Reusable transition screen shown between areas (plaza<->mall, store/salon/home doors). */
const LoadingScreen = {
  timer: null,

  mount(root, params) {
    const tips = [
      'Tip: Match your outfit tags to a mission theme for an easy pass.',
      'Tip: The Mall has different brands than the Plaza stores!',
      'Tip: Furniture you buy can be placed in your Apartment or Office.',
      'Tip: Check the Mission Board for spy, poster, and fashion challenges.',
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    root.innerHTML = `
      <div class="screen loading-screen">
        <div class="loading-spinner"></div>
        <div class="loading-bar-track"><div class="loading-bar-fill"></div></div>
        <div class="loading-tip">${tip}</div>
      </div>`;
    this.timer = setTimeout(() => params.onDone && params.onDone(), params.duration || 900);
  },

  destroy() {
    if (this.timer) clearTimeout(this.timer);
  },
};
