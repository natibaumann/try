/* Renders the player's paper-doll avatar as an SVG string from appearance state.
   Pure function of (appearance) -> markup, so it can be reused for the big
   customization preview and the small in-world sprite. */

function hairPath(style) {
  const paths = {
    long: 'M 50 15 C 20 15 12 45 16 90 L 30 90 C 26 55 30 30 50 30 C 70 30 74 55 70 90 L 84 90 C 88 45 80 15 50 15 Z',
    ponytail: 'M 50 15 C 25 15 18 40 22 60 L 34 60 C 30 40 36 28 50 28 C 64 28 70 40 66 60 L 78 60 C 82 40 75 15 50 15 Z M 78 55 C 90 60 96 78 90 95 L 80 92 C 84 78 80 65 72 58 Z',
    bob: 'M 50 15 C 24 15 16 40 20 62 C 22 70 30 72 32 65 C 28 45 34 30 50 30 C 66 30 72 45 68 65 C 70 72 78 70 80 62 C 84 40 76 15 50 15 Z',
    curly: 'M 50 12 C 20 8 8 35 14 55 C 6 58 6 72 16 74 C 14 84 26 90 34 82 C 30 60 32 30 50 28 C 68 30 70 60 66 82 C 74 90 86 84 84 74 C 94 72 94 58 86 55 C 92 35 80 8 50 12 Z',
    bun: 'M 50 20 C 27 20 20 42 24 62 L 34 62 C 30 44 36 32 50 32 C 64 32 70 44 66 62 L 76 62 C 80 42 73 20 50 20 Z M 50 6 C 40 6 34 14 34 20 C 34 26 40 30 50 30 C 60 30 66 26 66 20 C 66 14 60 6 50 6 Z',
    pigtails: 'M 50 16 C 26 16 18 38 22 58 L 32 58 C 28 40 34 30 50 30 C 66 30 72 40 68 58 L 78 58 C 82 38 74 16 50 16 Z M 18 55 C 8 58 4 74 10 88 L 20 84 C 16 74 18 64 24 58 Z M 82 55 C 92 58 96 74 90 88 L 80 84 C 84 74 82 64 76 58 Z',
  };
  return paths[style] || paths.long;
}

function outfitShape(outfit) {
  return `<path d="M 32 95 C 30 78 34 68 50 66 C 66 68 70 78 68 95 Z" fill="${outfit.color}" stroke="#00000022" stroke-width="1"/>`;
}

function renderAvatarSVG(appearance, opts) {
  opts = opts || {};
  const outfit = findItem('outfits', appearance.outfitId) || ITEMS.outfits[0];
  const shoes = appearance.shoesId ? findItem('shoes', appearance.shoesId) : null;
  const jewelry = appearance.jewelryId ? findItem('jewelry', appearance.jewelryId) : null;
  const showLower = opts.fullBody !== false;

  const eyeshadow = appearance.eyeshadow
    ? `<ellipse cx="42" cy="46" rx="6" ry="3.2" fill="${appearance.eyeshadow}" opacity="${appearance.makeupIntensity}"/>
       <ellipse cx="58" cy="46" rx="6" ry="3.2" fill="${appearance.eyeshadow}" opacity="${appearance.makeupIntensity}"/>`
    : '';
  const blush = appearance.blush
    ? `<ellipse cx="36" cy="58" rx="5" ry="3" fill="${appearance.blush}" opacity="${appearance.makeupIntensity}"/>
       <ellipse cx="64" cy="58" rx="5" ry="3" fill="${appearance.blush}" opacity="${appearance.makeupIntensity}"/>`
    : '';
  const lipstick = appearance.lipstick || '#a65a5a';

  return `
  <svg viewBox="0 0 100 ${showLower ? 140 : 100}" xmlns="http://www.w3.org/2000/svg" class="avatar-svg">
    ${showLower ? `<ellipse cx="41" cy="130" rx="7" ry="4" fill="${shoes ? shoes.color : '#e0b0c0'}"/>
    <ellipse cx="59" cy="130" rx="7" ry="4" fill="${shoes ? shoes.color : '#e0b0c0'}"/>
    <rect x="36" y="95" width="10" height="36" rx="4" fill="${appearance.skinTone}"/>
    <rect x="54" y="95" width="10" height="36" rx="4" fill="${appearance.skinTone}"/>` : ''}
    <path d="M 20 95 C 18 80 22 62 30 55 L 70 55 C 78 62 82 80 80 95 Z" fill="${showLower ? appearance.skinTone : outfit.color}"/>
    ${showLower ? outfitShape(outfit) : ''}
    <circle cx="50" cy="42" r="26" fill="${appearance.skinTone}"/>
    ${eyeshadow}
    <ellipse cx="42" cy="46" rx="4" ry="5" fill="${appearance.eyeColor}"/>
    <ellipse cx="58" cy="46" rx="4" ry="5" fill="${appearance.eyeColor}"/>
    <circle cx="43" cy="45" r="1.2" fill="#fff"/>
    <circle cx="59" cy="45" r="1.2" fill="#fff"/>
    <path d="M 36 38 Q 42 34 48 38" stroke="#3a2213" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M 52 38 Q 58 34 64 38" stroke="#3a2213" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    ${blush}
    <path d="M 44 58 Q 50 62 56 58" stroke="${lipstick}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${jewelry ? `<circle cx="50" cy="66" r="3" fill="${jewelry.color}"/>` : ''}
    <path d="${hairPath(appearance.hairStyle)}" fill="${appearance.hairColor}"/>
  </svg>`;
}
