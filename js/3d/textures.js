/* Canvas-generated textures - signage, pavement, walls - so buildings feel
   dressed without needing any external image assets. */
function cssColor(c) {
  /* Canvas 2D silently ignores an invalid fillStyle (falling back to
     black) rather than throwing, so a raw numeric THREE color (0xa04fd9)
     must be converted to a CSS hex string before it reaches a canvas. */
  return typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c;
}

function makeCanvasTexture(draw, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeSignTexture(label, icon, bg, fg) {
  bg = cssColor(bg); fg = cssColor(fg);
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, 0, w, 6);
    ctx.font = `${h * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, w * 0.22, h * 0.52);
    ctx.fillStyle = fg;
    ctx.font = `bold ${h * 0.24}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(label, w * 0.36, h * 0.52);
  }, 512, 128);
}

function makePavementTexture() {
  const tex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#e4d6b8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,120,80,0.35)';
    ctx.lineWidth = 3;
    const step = 64;
    for (let x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }, 512, 512);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

function makeMallFloorTexture() {
  const tex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#ece3f0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d9c9e6';
    for (let y = 0; y < h; y += 64) {
      for (let x = 0; x < w; x += 64) {
        if (((x / 64) + (y / 64)) % 2 === 0) ctx.fillRect(x, y, 64, 64);
      }
    }
  }, 512, 512);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 5);
  return tex;
}

function makeBrickTexture(color) {
  color = cssColor(color);
  const tex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    const rowH = 24;
    for (let y = 0; y < h; y += rowH) {
      const offset = (y / rowH) % 2 === 0 ? 0 : 32;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      for (let x = -32; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x + offset, y); ctx.lineTo(x + offset, y + rowH); ctx.stroke(); }
    }
  }, 256, 256);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}
