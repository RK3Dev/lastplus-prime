(() => {
  const foot = document.getElementById("foot");
  const canvas = document.getElementById("word");
  const ctx = canvas.getContext("2d");

  const WORD = "LAST";
  let WM = null;
  const FONT = '"Inter Word","Helvetica Neue",Arial,sans-serif';
  const CROP = 0.1;

  let INK = [233, 228, 218], HOT = [233, 118, 43];
  const rgb = (s, or) => { const m = /^#([0-9a-f]{6})$/i.exec(s.trim()); if (!m) return or; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  const reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  let w = 0, h = 0, dpr = 1, gap = 6, reach = 80;
  let px = -1e5, py = -1e5, moved = 0;
  let raf = 0, visible = true, awake = true;
  let ring = { x: 0, y: 0, t: -1 };
  let dots = new Float32Array(0), count = 0;
  let grain = null, ground = "#09080E";

  function layout() {
    const box = foot.getBoundingClientRect();
    w = Math.max(1, Math.round(box.width));
    h = Math.max(1, Math.round(box.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gap = clamp(w / 200, 3.4, 6);
    reach = clamp(w / 18, 30, 80);

    const mask = document.createElement("canvas");
    mask.width = w;
    mask.height = h;
    const m = mask.getContext("2d", { willReadFrequently: true });
    m.direction = "ltr";
    m.textAlign = "left";
    const side = Math.max(20, w * 0.016);
    const dw = w - side * 2, dh = dw * 277 / 1106;
    if (WM) m.drawImage(WM, side, h - dh * (1 - CROP), dw, dh);
    const img = m.getImageData(0, 0, w, h).data;

    const cols = Math.ceil(w / gap), rows = Math.ceil(h / gap);
    const list = [];
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        let sum = 0;
        for (let sy = 0; sy < 3; sy++) {
          for (let sx = 0; sx < 3; sx++) {
            const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3));
            const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
            sum += img[(y * w + x) * 4 + 3];
          }
        }
        const cover = sum / (9 * 255);
        if (cover < 0.06) continue;
        const hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
        list.push(hx, hy, 0, 0, hx, hy, Math.sqrt(cover) * gap * 0.56);
      }
    }

    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < list.length; i += 7) {
      lo = Math.min(lo, list[i] - list[i + 6]);
      hi = Math.max(hi, list[i] + list[i + 6]);
    }
    const stretch = (w - side * 2) / (hi - lo);
    for (let i = 0; i < list.length; i += 7) list[i] = list[i + 4] = side + (list[i] - lo) * stretch;

    dots = new Float32Array(list);
    count = list.length / 7;

    if (!grain) {
      const tile = document.createElement("canvas");
      tile.width = tile.height = 256;
      const g = tile.getContext("2d");
      const data = g.createImageData(256, 256);
      for (let i = 0; i < data.data.length; i += 4) {
        const v = Math.random() * 255;
        data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
        data.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
      }
      g.putImageData(data, 0, 0);
      grain = tile;
    }
    awake = true;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, w, h);

    const push = reduced ? 0 : reach, span = gap * 4.6;
    const age = ring.t < 0 ? 1e9 : now - ring.t;
    const front = age * 0.9;
    const hot = [];
    let moving = false;

    ctx.fillStyle = css(INK);
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const j = i * 7;
      let x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3];
      const hx = dots[j + 4], hy = dots[j + 5], r = dots[j + 6];
      if (!reduced) {
        if (age < 900) {
          const dx = hx - ring.x, dy = hy - ring.y;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const band = 1 - Math.min(1, Math.abs(d - front) / 26);
          if (band > 0) {
            const f = band * 3.2 * (1 - age / 900);
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
        }
        const ax = x - px, ay = y - py, d2 = ax * ax + ay * ay;
        if (push > 0 && d2 < push * push) {
          const d = Math.sqrt(d2) + 0.001;
          const f = (1 - d / push) * 2.6;
          vx += (ax / d) * f;
          vy += (ay / d) * f;
        }
        vx = (vx + (hx - x) * 0.05) * 0.84;
        vy = (vy + (hy - y) * 0.05) * 0.84;
        x += vx;
        y += vy;
        if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true;
        else { x = hx; y = hy; vx = 0; vy = 0; }
        dots[j] = x; dots[j + 1] = y; dots[j + 2] = vx; dots[j + 3] = vy;
      }
      const k = Math.min(1, Math.hypot(x - hx, y - hy) / span);
      if (k > 0.02) hot.push(x, y, r, k);
      else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); }
    }
    ctx.fill();

    for (let i = 0; i < hot.length; i += 4) {
      const k = hot[i + 3];
      ctx.fillStyle = css(INK.map((c, n) => Math.round(c + (HOT[n] - c) * k)));
      ctx.beginPath();
      ctx.arc(hot[i], hot[i + 1], hot[i + 2], 0, 6.2832);
      ctx.fill();
    }

    ctx.globalAlpha = 0.045;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = ctx.createPattern(grain, "repeat");
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const resting = px > -1e4 && now - moved > 1400;
    awake = (moving && !resting) || age < 900;
  }

  const loop = (now) => {
    raf = 0;

    if (!visible || !grain) return;
    draw(now);
    if (awake) raf = requestAnimationFrame(loop);
  };
  const wake = () => {
    awake = true;
    if (!raf && visible) raf = requestAnimationFrame(loop);
  };

  const local = (e) => {
    const b = canvas.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };

  foot.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    [px, py] = local(e);
    moved = performance.now();
    wake();
  });
  foot.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    px = py = -1e5;
    wake();
  });
  const runRing = (e) => {
    if (reduced || e.target.closest("a,button")) return;
    const [x, y] = local(e);
    ring = { x, y, t: performance.now() };
    wake();
  };
  let lastType = "";
  foot.addEventListener("pointerdown", (e) => { lastType = e.pointerType; if (e.pointerType === "mouse") runRing(e); });

  foot.addEventListener("click", (e) => { if (lastType !== "mouse") runRing(e); });

  new IntersectionObserver((seen) => {
    visible = seen[0] ? seen[0].isIntersecting : true;
    if (visible) wake();
  }).observe(foot);

  new IntersectionObserver((seen) => {
    document.querySelector(".proof")?.classList.toggle("lift", seen[0].isIntersecting);
  }, { threshold: 0.98 }).observe(foot.querySelector(".word-room"));

  const face = new Promise((res) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { WM = im; res(); }; im.onerror = () => res(); im.src = new URL("logo/wordmark.svg", document.currentScript ? document.currentScript.src : location.href).href; });
  face.then(() => {
    const tokens = getComputedStyle(foot);
    ground = tokens.getPropertyValue("--bg").trim();
    INK = rgb(tokens.getPropertyValue("--word-ink"), INK);
    HOT = rgb(tokens.getPropertyValue("--word-hot"), HOT);
    layout();
    new ResizeObserver(() => { layout(); wake(); }).observe(foot);
    wake();
  });
})();
