/* Store metadata: brand, category, and which 3D scene to return to when
   the player leaves. The store buildings themselves live in js/3d/scenes.js. */
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
