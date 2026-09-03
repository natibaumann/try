/* Entry point: boots game state and shows the first screen. */
window.addEventListener('DOMContentLoaded', () => {
  GameState.load();
  Router.init(document.getElementById('app'));

  if (GameState.data.createdCharacter) {
    Router.show(PlazaScreen);
  } else {
    Router.show(CustomizationScreen);
  }
});
