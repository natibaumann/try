/* Global game state + persistence.
   Everything the game needs to remember lives here and is
   flushed to localStorage on every change so a reload resumes the save. */
const SAVE_KEY = 'bratzGameSave_v1';

function defaultState() {
  return {
    createdCharacter: false,
    appearance: {
      skinTone: '#f2c9a1',
      eyeColor: '#5b3a29',
      hairStyle: 'long',
      hairColor: '#3b2314',
      lipstick: '#d1477a',
      eyeshadow: '#b98ad1',
      blush: '#f28fb0',
      makeupIntensity: 0.6,
      outfitId: 'starter_casual',
      shoesId: null,
      jewelryId: null,
    },
    inventory: {
      outfits: ['starter_casual'],
      shoes: [],
      jewelry: [],
      pets: [],
      furniture: [],
    },
    cash: 500,
    location: 'plaza',
    home: {
      apartment: {}, // tileIndex -> furnitureId
      office: {},
    },
    missions: {
      spy_assignment: { status: 'available', cluesFound: [] },
      poster_perfect: { status: 'available', poster: null },
      runway_ready: { status: 'available' },
    },
  };
}

const GameState = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.data = raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch (e) {
      this.data = defaultState();
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      /* storage unavailable (private mode, quota) - fail silently, gameplay continues */
    }
  },

  reset() {
    this.data = defaultState();
    this.save();
  },

  addCash(amount) {
    this.data.cash = Math.max(0, this.data.cash + amount);
    this.save();
  },

  ownsItem(category, id) {
    return this.data.inventory[category] && this.data.inventory[category].includes(id);
  },

  buyItem(category, id, price) {
    if (this.data.cash < price) return false;
    if (this.ownsItem(category, id)) return true;
    this.data.cash -= price;
    this.data.inventory[category].push(id);
    this.save();
    return true;
  },
};
