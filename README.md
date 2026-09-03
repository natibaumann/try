# Style Squad: Plaza Life

A browser-based, 2000s-Bratz-inspired girls' dress-up & life-sim game. No build
step, no external art assets — the avatar is a parametric SVG "paper doll" so
skin tone, hairstyle/color, makeup, and outfits all render live from code.

## Running it

Just serve the folder statically and open it (ES-module-free, so any static
server works):

```
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly via `file://` also works.

## Game flow

1. **Character Customization** (`js/screens/customization.js`) — skin tone,
   eye color, hairstyle, hair color, makeup (lipstick/eyeshadow/blush +
   intensity), starter outfit. "Enter the World" saves the character and
   drops the player into the Plaza.
2. **Plaza** (outside the mall) — a walkable top-down map
   (`js/worldScreen.js` + `js/data/maps.js`) with standalone stores: Plaza
   Shoes, Plaza Threads (clothes), Plaza Salon, Plaza Gems (jewelry), Plaza
   Pets, Plaza Home Goods (furniture), plus the Mall Entrance, the player's
   Home (apartment/office), and the Mission Board. Move with
   arrow keys/WASD, walk onto a hotspot, press **E** (or tap it) to enter.
3. **Mall interior** — a second walkable map with different-brand versions of
   the same store categories (Glossy & Urban Edge for clothes, Sole Mates for
   shoes, Sparkle & Co for jewelry, Trendy Tails for pets, Chic Interiors for
   furniture). Entering/exiting the Mall and every store/salon/home door shows
   a loading screen (`js/screens/loading.js`).
4. **Stores** (`js/screens/store.js`) — one config-driven screen reused by
   every shop; items are filtered by store id from the shared catalog
   (`js/data/items.js`) so each brand carries different stock. Buying spends
   cash; clothing/shoes/jewelry can also be equipped directly.
5. **Salon** (`js/screens/salon.js`) — change hairstyle/color any time.
6. **Home hub** (`js/screens/home.js`) — an Apartment and an Office, each a
   5×4 grid the player decorates with furniture bought from either Home
   Goods store; click a piece then a tile to place it, click a placed piece
   to remove it.
7. **Missions** (`js/screens/missions.js` + `js/data/missions.js`) — the
   mission board offers three mini-games in the spirit of the "spying,
   poster design, fashion design" brief:
   - **Undercover Assignment** (spy): find 3 hidden clue hotspots scattered
     across the Plaza and Mall.
   - **Poster Perfect**: a tiny canvas-based poster editor (background
     color, sticker, headline text).
   - **Runway Ready** (fashion): equip an outfit matching a themed tag
     ("Beach Party" → summer/beach) to pass.

   Completing a mission pays cash and unlocks a bonus item.

All state (appearance, inventory, cash, home layouts, mission progress)
persists to `localStorage` so a reload resumes the same save.

## Project layout

```
index.html
css/style.css
js/
  state.js         save/load, cash, inventory
  avatar.js         SVG paper-doll renderer
  router.js         screen manager + loading-screen transitions
  worldScreen.js    shared Plaza/Mall walkable-map logic
  data/
    items.js        outfits/shoes/jewelry/pets/furniture catalog + brands
    maps.js          Plaza/Mall hotspot layouts + store metadata
    missions.js      mission definitions
  screens/
    customization.js
    loading.js
    store.js
    salon.js
    home.js
    missions.js
main.js
```

## Extending it

- New stores: add an entry to `STORE_CATALOG` in `js/data/maps.js`, a
  hotspot in the relevant map, and matching items in `ITEMS` (tag each with
  the new `store` id).
- New furniture/rooms: extend `ITEMS.furniture` (`room: 'apartment' | 'office' | 'both'`)
  — the Home screen picks it up automatically.
- New missions: add a definition to `js/data/missions.js` and a `renderAction`
  case in `js/screens/missions.js` for its mini-game UI.
