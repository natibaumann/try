/* Catalog of everything the player can wear, place, or gift a pet. */
const ITEMS = {
  skinTones: ['#f7dfc4', '#f2c9a1', '#d9a066', '#a9673f', '#6b4226'],
  eyeColors: ['#5b3a29', '#2e6f6e', '#3a5ba0', '#4c9a4c', '#8a5ca8'],

  hairStyles: [
    { id: 'long', name: 'Long & Sleek' },
    { id: 'ponytail', name: 'High Ponytail' },
    { id: 'bob', name: 'Classic Bob' },
    { id: 'curly', name: 'Curly Volume' },
    { id: 'bun', name: 'Top Bun' },
    { id: 'pigtails', name: 'Pigtails' },
  ],
  hairColors: ['#0b0b0b', '#3b2314', '#7a4a21', '#c99a3a', '#d94f70', '#7a3ad9', '#3ad9c9'],

  lipstickColors: ['#d1477a', '#b3223f', '#e08a9c', '#7a2350', null],
  eyeshadowColors: ['#b98ad1', '#7ac1d9', '#e0a76b', '#7ad99a', null],
  blushColors: ['#f28fb0', '#f2b08f', null],

  outfits: [
    { id: 'starter_casual', name: 'Everyday Casual', color: '#7ac1d9', tags: ['casual'], price: 0, brand: 'Closet Basics', store: null },
    { id: 'plaza_sundress', name: 'Sunny Sundress', color: '#f2d24b', tags: ['summer', 'casual'], price: 45, brand: 'Plaza Threads', store: 'plaza_clothes' },
    { id: 'plaza_denim', name: 'Denim Jacket Set', color: '#4a72b0', tags: ['casual', 'street'], price: 60, brand: 'Plaza Threads', store: 'plaza_clothes' },
    { id: 'glossy_gown', name: 'Sequin Gown', color: '#c94fd9', tags: ['formal', 'party'], price: 120, brand: 'Glossy', store: 'mall_glossy' },
    { id: 'glossy_top', name: 'Glitter Crop Top', color: '#e04fa0', tags: ['party', 'street'], price: 55, brand: 'Glossy', store: 'mall_glossy' },
    { id: 'urban_hoodie', name: 'Oversized Hoodie', color: '#555555', tags: ['street', 'casual'], price: 50, brand: 'Urban Edge', store: 'mall_urban' },
    { id: 'urban_cargo', name: 'Cargo Set', color: '#6b7a4a', tags: ['street'], price: 65, brand: 'Urban Edge', store: 'mall_urban' },
    { id: 'beach_bikini', name: 'Beach Cover-Up', color: '#4bd9c9', tags: ['summer', 'beach'], price: 40, brand: 'Plaza Threads', store: 'plaza_clothes' },
  ],

  shoes: [
    { id: 'sneakers_pink', name: 'Pink Sneakers', color: '#f28fb0', tags: ['casual', 'street'], price: 30, brand: 'Plaza Shoes', store: 'plaza_shoes' },
    { id: 'sandals_tan', name: 'Strappy Sandals', color: '#d9b06b', tags: ['summer', 'beach'], price: 25, brand: 'Plaza Shoes', store: 'plaza_shoes' },
    { id: 'heels_red', name: 'Red Stiletto Heels', color: '#c92f3f', tags: ['formal', 'party'], price: 70, brand: 'Sole Mates', store: 'mall_shoes' },
    { id: 'boots_black', name: 'Platform Boots', color: '#222222', tags: ['street'], price: 65, brand: 'Sole Mates', store: 'mall_shoes' },
  ],

  jewelry: [
    { id: 'necklace_gold', name: 'Gold Heart Necklace', color: '#e0c34b', tags: ['casual', 'party'], price: 35, brand: 'Plaza Gems', store: 'plaza_jewelry' },
    { id: 'hoops_silver', name: 'Silver Hoops', color: '#c9c9d9', tags: ['casual', 'street'], price: 20, brand: 'Plaza Gems', store: 'plaza_jewelry' },
    { id: 'tiara_diamond', name: 'Diamond Tiara', color: '#dff0ff', tags: ['formal', 'party'], price: 150, brand: 'Sparkle & Co', store: 'mall_jewelry' },
    { id: 'choker_black', name: 'Velvet Choker', color: '#2a2a2a', tags: ['street', 'party'], price: 28, brand: 'Sparkle & Co', store: 'mall_jewelry' },
  ],

  pets: [
    { id: 'pet_pug', name: 'Pug Puppy', color: '#d9b06b', price: 90, brand: 'Plaza Pets', store: 'plaza_pets' },
    { id: 'pet_kitten', name: 'Grey Kitten', color: '#9a9aa0', price: 80, brand: 'Plaza Pets', store: 'plaza_pets' },
    { id: 'pet_bunny', name: 'Bow-Tie Bunny', color: '#f2eee6', price: 70, brand: 'Trendy Tails', store: 'mall_pets' },
    { id: 'pet_parrot', name: 'Rainbow Parrot', color: '#4fd9a0', price: 95, brand: 'Trendy Tails', store: 'mall_pets' },
  ],

  furniture: [
    { id: 'sofa_pink', name: 'Pink Sofa', icon: 'sofa', color: '#f28fb0', room: 'apartment', price: 80, brand: 'Plaza Home Goods', store: 'plaza_furniture' },
    { id: 'bed_purple', name: 'Canopy Bed', icon: 'bed', color: '#b98ad1', room: 'apartment', price: 140, brand: 'Plaza Home Goods', store: 'plaza_furniture' },
    { id: 'rug_yellow', name: 'Sunburst Rug', icon: 'rug', color: '#f2d24b', room: 'apartment', price: 35, brand: 'Plaza Home Goods', store: 'plaza_furniture' },
    { id: 'desk_white', name: 'Glam Desk', icon: 'desk', color: '#f2eee6', room: 'office', price: 100, brand: 'Chic Interiors', store: 'mall_furniture' },
    { id: 'chair_gold', name: 'Gold Office Chair', icon: 'chair', color: '#e0c34b', room: 'office', price: 90, brand: 'Chic Interiors', store: 'mall_furniture' },
    { id: 'bookshelf', name: 'Bookshelf', icon: 'shelf', color: '#7a4a21', room: 'office', price: 75, brand: 'Chic Interiors', store: 'mall_furniture' },
    { id: 'plant_green', name: 'Potted Palm', icon: 'plant', color: '#4fae5c', room: 'both', price: 20, brand: 'Chic Interiors', store: 'mall_furniture' },
  ],
};

function findItem(category, id) {
  return ITEMS[category] ? ITEMS[category].find((i) => i.id === id) : null;
}
