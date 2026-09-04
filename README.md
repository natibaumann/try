# Style Squad: Plaza Life

A browser-based, 2000's inspired girls' dress-up & life-sim game, rendered
in real 3D with [three.js](https://threejs.org/) (vendored locally at
`lib/three.min.js`, no CDN dependency). No external character/building
assets — every character, building, and piece of furniture is procedural
geometry generated in code, so there's nothing to download or author in a
3D tool to get it running.

The character (`js/3d/character.js`) is a genuinely rigged and skinned
humanoid, not a stack of rigid parts: a real `THREE.Skeleton` (16 bones,
T-pose bind, matching Mixamo/Blender export conventions) with linear-blend
skin weights at the knees and elbows so those joints deform smoothly, and
`idle`/`walk` `THREE.AnimationClip`s played through an `AnimationMixer` — the
same architecture a real modeled-and-rigged character (e.g. exported from
Blender or Mixamo) would need. Swapping in such a model later means
replacing this file's mesh/skeleton construction, not reworking `world3d.js`
or `preview.js`, which only ever touch `character.root`, `.applyAppearance()`,
and `.animate()`.

## Running it

Just serve the folder statically and open it (classic scripts, no bundler):

```
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly via `file://` also works.

**Controls:** arrow keys / WASD to walk, **E** (or tap the on-screen prompt)
to enter a store/salon/mall/home when it lights up. In the Home/Office room
builder: drag to orbit the camera, scroll to zoom, click a floor tile to
place/remove furniture.

## Game flow

1. **Character Customization** (`js/screens/customization.js`) — skin tone,
   eye color, hairstyle, hair color, makeup (lipstick/eyeshadow/blush +
   intensity), starter outfit, previewed live on a rotating 3D character
   (`js/3d/preview.js`). "Enter the World" saves the character and drops the
   player into the Plaza.
2. **Plaza** (outside the mall) — a real 3D, walkable space
   (`js/3d/world3d.js` + `js/3d/scenes.js`) with a personalized two-story
   building per store (Plaza Shoes, Plaza Threads, Plaza Salon, Plaza Gems,
   Plaza Pets, Plaza Home Goods) — ground-floor shopfront, cornice trim, a
   street-facing gable roof and upper-floor windows, laid out at alternating
   depths with the two outermost buildings angled inward so the street reads
   as a surrounding block rather than one flat row — a taller Grand Mall
   entrance, an angled house for the player's Home, a fountain, potted
   plants, benches, lamps, and trees, lit with a directional "sun" +
   hemisphere light, soft shadows, and distance fog. Movement is tuned for
   snappy, arcade-style response (fast accel/turn, quick camera catch-up)
   rather than realistic inertia, the character turns to face its direction
   of travel, and a smoothed third-person camera follows behind.
3. **Mall interior** — an enclosed 3D hall with a decorative upper mezzanine
   along the back wall (railing, support posts, lit windows) for a second
   visible level, ceiling lights, pillars, a kiosk and food court, and
   awninged storefront alcoves for different-brand versions of the same
   categories (Glossy & Urban Edge for clothes, Sole Mates for shoes,
   Sparkle & Co for jewelry, Trendy Tails for pets, Chic Interiors for
   furniture). Entering/exiting the Mall and every store/salon/home door
   shows a loading screen (`js/screens/loading.js`). Leaving a store/salon/
   home resumes the player at the same spot they entered from, rather than
   resetting to the map's spawn point.
4. **Stores** (`js/3d/storeScenes.js`) — real walkable 3D rooms, not a flat
   menu: each item for sale gets its own display (a headless mannequin for
   outfits, a shoe rack, a jewelry stand, a pet basket, or the furniture
   piece itself), built from the shared catalog (`js/data/items.js`) so each
   brand carries different stock. Walk up to a display and press **E** to
   open a buy/try-on popup (`js/screens/itemPopup.js`) — its button reads
   "Buy" if you don't own the item, "Try On" if you own it but it isn't
   equipped (clicking equips it and updates the 3D character immediately),
   or "Equipped".
5. **Salon** (`js/screens/salon.js`) — change hairstyle/color any time, with
   the same live 3D preview as customization.
6. **Home hub** (`js/screens/home.js`) — a real 3D Apartment and Office, each
   a 5×4 room the player decorates by placing 3D furniture models bought from
   either Home Goods store: select a piece, click a floor tile to place it
   (raycast-picked), click a placed piece to remove it.
7. **Missions** (`js/screens/missions.js` + `js/data/missions.js`) — a
   lightweight overlay (doesn't tear down the 3D world underneath) offering
   three mini-games in the spirit of the "spying, poster design, fashion
   design" brief:
   - **Undercover Assignment** (spy): find 3 hidden clue props scattered
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
lib/three.min.js     vendored three.js r148 (UMD build)
css/style.css
js/
  state.js            save/load, cash, inventory
  router.js           screen manager + loading-screen transitions
  data/
    items.js          outfits/shoes/jewelry/pets/furniture catalog + brands
    stores.js         store metadata (brand, category, which map to return to)
    missions.js       mission definitions
  3d/
    character.js      procedural human-proportioned rig + walk-cycle animation
    textures.js       canvas-generated signage/pavement/wall/floor textures
    props.js          building/fountain/bench/lamp/storefront/furniture/
                       product-display factories
    scenes.js         builds the actual Plaza and Mall interior 3D scenes
    storeScenes.js    builds a walkable 3D store interior for a given store id
    world3d.js         movement physics, collision, chase camera, hotspot logic
    preview.js        turntable 3D preview used by customization/salon
  screens/
    customization.js
    loading.js
    itemPopup.js       buy/try-on popup for store product displays
    salon.js
    home.js            3D room builder (raycast tile placement)
    missions.js
main.js
```

## Extending it

- New stores: add an entry to `STORE_CATALOG` in `js/data/stores.js`, a
  building/storefront in `js/3d/scenes.js`, and matching items in `ITEMS`
  (tag each with the new `store` id) — `buildStoreScene()` builds the
  walkable interior and its product displays automatically from those.
- New product-display shapes: add a case to `createItemDisplay` in
  `js/3d/props.js` for a new `ITEMS` category.
- New furniture/rooms: extend `ITEMS.furniture` (`room: 'apartment' | 'office' | 'both'`)
  and add a shape case in `createFurnitureMesh` (`js/3d/props.js`) — the Home
  screen picks it up automatically.
- New missions: add a definition to `js/data/missions.js` and a `renderAction`
  case in `js/screens/missions.js` for its mini-game UI.
- New hairstyles: add a case to `buildHair` in `js/3d/character.js` and a
  matching entry in `ITEMS.hairStyles`.
