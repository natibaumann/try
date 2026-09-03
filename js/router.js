/* Screen manager: swaps full-screen "Screen" modules in and out of #app,
   optionally showing the loading screen in between (used for area changes:
   plaza<->mall, entering a store/salon/home). */
const Router = {
  root: null,
  current: null,

  init(rootEl) {
    this.root = rootEl;
  },

  show(screen, params) {
    if (this.current && this.current.destroy) this.current.destroy();
    this.root.innerHTML = '';
    this.current = screen;
    screen.mount(this.root, params || {});
  },

  /* Shows the loading screen for `ms`, then swaps to `screen`. Used for any
     transition the design calls out as needing a loading screen: mall
     entrance/exit and every store/salon/home door. */
  goto(screen, params, ms) {
    const loadingParams = Object.assign({}, params, {
      onDone: () => this.show(screen, params),
    });
    this.show(LoadingScreen, Object.assign(loadingParams, { duration: ms || 900 }));
  },
};
