/* Buy/equip popup shown when the player walks up to a mannequin, shoe
   rack, jewelry stand, pet basket, or furniture piece inside a store and
   presses E. For wearable categories it shows a live 3D "try on" preview
   of the player's own character wearing the item, next to the buy/equip
   controls - the "try out model on the side of your character" ask. */
const ItemPopup = {
  open(item, category, onChange) {
    const equippedKey = { outfits: 'outfitId', shoes: 'shoesId', jewelry: 'jewelryId' }[category];
    const wearable = !!equippedKey;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal item-popup ${wearable ? 'item-popup-wearable' : ''}">
        ${wearable ? '<div class="item-preview-3d" id="item-preview-3d"></div>' : `<div class="item-swatch-lg" style="background:${item.color}"></div>`}
        <div class="item-popup-info">
          <h2>${item.name}</h2>
          <p class="hint">${item.brand}</p>
          <p class="item-price">${item.price > 0 ? '$' + item.price : 'Free'}</p>
          <div class="modal-actions">
            <button class="secondary-btn" id="item-close">Close</button>
            <button class="primary-btn" id="item-action"></button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    let previewWidget = null;
    if (wearable) {
      const tryOnAppearance = JSON.parse(JSON.stringify(GameState.data.appearance));
      tryOnAppearance[equippedKey] = item.id;
      previewWidget = createTurntablePreview(overlay.querySelector('#item-preview-3d'), tryOnAppearance);
    }

    const actionBtn = overlay.querySelector('#item-action');

    const render = () => {
      const owned = GameState.ownsItem(category, item.id);
      const isEquipped = equippedKey && GameState.data.appearance[equippedKey] === item.id;
      actionBtn.disabled = false;
      if (!owned) actionBtn.textContent = 'Buy';
      else if (!equippedKey) actionBtn.textContent = 'Owned';
      else if (isEquipped) { actionBtn.textContent = 'Equipped'; actionBtn.disabled = true; }
      else actionBtn.textContent = 'Try On';
    };
    render();

    actionBtn.addEventListener('click', () => {
      const owned = GameState.ownsItem(category, item.id);
      if (!owned) {
        if (!GameState.buyItem(category, item.id, item.price)) {
          alert("You don't have enough cash for that!");
          return;
        }
      } else if (equippedKey) {
        GameState.data.appearance[equippedKey] = item.id;
        GameState.save();
      }
      render();
      if (onChange) onChange();
    });
    overlay.querySelector('#item-close').addEventListener('click', () => {
      if (previewWidget) previewWidget.destroy();
      overlay.remove();
    });
  },
};
