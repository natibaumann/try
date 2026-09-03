/* Mission definitions - the spying / poster-design / fashion-design mini-games. */
const MISSIONS = {
  spy_assignment: {
    id: 'spy_assignment',
    title: 'Undercover Assignment',
    type: 'spy',
    briefing: 'A rival brand is stealing designs! Sneak around the Plaza and Mall and find all 3 hidden clues.',
    clueIds: ['clue_fountain', 'clue_kiosk', 'clue_foodcourt'],
    reward: { cash: 120, unlock: { category: 'jewelry', id: 'choker_black' } },
  },
  poster_perfect: {
    id: 'poster_perfect',
    title: 'Poster Perfect',
    type: 'poster',
    briefing: 'Design a promo poster for the Plaza using the mini poster editor.',
    reward: { cash: 90, unlock: { category: 'furniture', id: 'plant_green' } },
  },
  runway_ready: {
    id: 'runway_ready',
    title: 'Runway Ready',
    type: 'fashion',
    briefing: 'Dress for the theme "Beach Party" - equip an outfit tagged summer or beach to pass the runway check.',
    themeTags: ['summer', 'beach'],
    reward: { cash: 100, unlock: { category: 'shoes', id: 'sandals_tan' } },
  },
};
