/* Buy/equip popup shown when the player walks up to a mannequin, shoe
   rack, jewelry stand, pet basket, or furniture piece inside a store and
   presses E - the "try on" interaction from the design brief. */
const ItemPopup = {
  open(item, category, onChange) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal item-popup">
        <div class="item-swatch-lg" style="background:${item.color}"></div>
        <h2>${item.name}</h2>
        <p class="hint">${item.brand}</p>
        <p class="item-price">${item.price > 0 ? '$' + item.price : 'Free'}</p>
        <div class="modal-actions">
          <button class="secondary-btn" id="item-close">Close</button>
          <button class="primary-btn" id="item-action"></button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const actionBtn = overlay.querySelector('#item-action');
    const equippedKey = { outfits: 'outfitId', shoes: 'shoesId', jewelry: 'jewelryId' }[category];

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
    overlay.querySelector('#item-close').addEventListener('click', () => overlay.remove());
  },
};
