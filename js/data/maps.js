/* Layout data for the walkable outdoor/indoor scenes.
   Each hotspot is a percentage-based box (so it scales with the viewport)
   plus what happens when the player interacts with it. */
const MAPS = {
  plaza: {
    name: 'Downtown Plaza',
    background: 'plaza',
    hotspots: [
      { id: 'mall_entrance', label: 'Mall Entrance', icon: '🏬', x: 44, y: 8, w: 12, h: 14, action: { type: 'goto', target: 'mall' } },
      { id: 'plaza_shoes', label: 'Plaza Shoes', icon: '👠', x: 6, y: 30, w: 14, h: 16, action: { type: 'store', target: 'plaza_shoes' } },
      { id: 'plaza_clothes', label: 'Plaza Threads', icon: '👗', x: 24, y: 30, w: 14, h: 16, action: { type: 'store', target: 'plaza_clothes' } },
      { id: 'plaza_salon', label: 'Plaza Salon', icon: '💇', x: 62, y: 30, w: 14, h: 16, action: { type: 'salon' } },
      { id: 'plaza_jewelry', label: 'Plaza Gems', icon: '💎', x: 80, y: 30, w: 14, h: 16, action: { type: 'store', target: 'plaza_jewelry' } },
      { id: 'plaza_pets', label: 'Plaza Pets', icon: '🐾', x: 6, y: 62, w: 14, h: 16, action: { type: 'store', target: 'plaza_pets' } },
      { id: 'plaza_furniture', label: 'Plaza Home Goods', icon: '🛋️', x: 24, y: 62, w: 14, h: 16, action: { type: 'store', target: 'plaza_furniture' } },
      { id: 'home', label: 'Your Place', icon: '🏠', x: 62, y: 62, w: 14, h: 16, action: { type: 'home' } },
      { id: 'missions', label: 'Mission Board', icon: '📋', x: 80, y: 62, w: 14, h: 16, action: { type: 'missions' } },
    ],
    clues: [
      { id: 'clue_fountain', label: 'Fountain', icon: '⛲', x: 44, y: 62, w: 10, h: 10 },
    ],
  },

  mall: {
    name: 'Grand Mall Interior',
    background: 'mall',
    hotspots: [
      { id: 'exit', label: 'Exit to Plaza', icon: '🚪', x: 44, y: 84, w: 12, h: 14, action: { type: 'goto', target: 'plaza' } },
      { id: 'mall_glossy', label: 'Glossy', icon: '✨', x: 6, y: 12, w: 14, h: 16, action: { type: 'store', target: 'mall_glossy' } },
      { id: 'mall_urban', label: 'Urban Edge', icon: '🧢', x: 24, y: 12, w: 14, h: 16, action: { type: 'store', target: 'mall_urban' } },
      { id: 'mall_shoes', label: 'Sole Mates', icon: '👟', x: 62, y: 12, w: 14, h: 16, action: { type: 'store', target: 'mall_shoes' } },
      { id: 'mall_jewelry', label: 'Sparkle & Co', icon: '👑', x: 80, y: 12, w: 14, h: 16, action: { type: 'store', target: 'mall_jewelry' } },
      { id: 'mall_pets', label: 'Trendy Tails', icon: '🐶', x: 6, y: 46, w: 14, h: 16, action: { type: 'store', target: 'mall_pets' } },
      { id: 'mall_furniture', label: 'Chic Interiors', icon: '🪑', x: 24, y: 46, w: 14, h: 16, action: { type: 'store', target: 'mall_furniture' } },
    ],
    clues: [
      { id: 'clue_kiosk', label: 'Info Kiosk', icon: '🗺️', x: 80, y: 46, w: 10, h: 10 },
      { id: 'clue_foodcourt', label: 'Food Court', icon: '🍟', x: 44, y: 46, w: 10, h: 10 },
    ],
  },
};

const STORE_CATALOG = {
  plaza_shoes: { name: 'Plaza Shoes', brand: 'Plaza Shoes', category: 'shoes', back: 'plaza' },
  plaza_clothes: { name: 'Plaza Threads', brand: 'Plaza Threads', category: 'outfits', back: 'plaza' },
  plaza_jewelry: { name: 'Plaza Gems', brand: 'Plaza Gems', category: 'jewelry', back: 'plaza' },
  plaza_pets: { name: 'Plaza Pets', brand: 'Plaza Pets', category: 'pets', back: 'plaza' },
  plaza_furniture: { name: 'Plaza Home Goods', brand: 'Plaza Home Goods', category: 'furniture', back: 'plaza' },
  mall_glossy: { name: 'Glossy', brand: 'Glossy', category: 'outfits', back: 'mall' },
  mall_urban: { name: 'Urban Edge', brand: 'Urban Edge', category: 'outfits', back: 'mall' },
  mall_shoes: { name: 'Sole Mates', brand: 'Sole Mates', category: 'shoes', back: 'mall' },
  mall_jewelry: { name: 'Sparkle & Co', brand: 'Sparkle & Co', category: 'jewelry', back: 'mall' },
  mall_pets: { name: 'Trendy Tails', brand: 'Trendy Tails', category: 'pets', back: 'mall' },
  mall_furniture: { name: 'Chic Interiors', brand: 'Chic Interiors', category: 'furniture', back: 'mall' },
};
