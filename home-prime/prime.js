(() => {
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;

  root.dataset.theme = "dark";

  const seen = new IntersectionObserver((list) => list.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    seen.unobserve(e.target);
    $$("[data-count]", e.target).forEach(count);
  }), { rootMargin: "0px 0px -6% 0px" });
  $$(".rv").forEach((el) => {
    const group = el.parentElement ? $$(":scope > .rv", el.parentElement) : [el];
    el.style.setProperty("--d", `${Math.min(group.indexOf(el), 6) * 0.07}s`);
    seen.observe(el);
  });

  function count(el) {
    const to = +el.dataset.count, pre = el.dataset.pre || "";
    if (calm) { el.textContent = pre + to; return; }
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(to * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const FRAGMENT = `#version 300 es
    precision highp float;
    uniform vec2 uSize, uLean;
    uniform float uClock, uSalt, uTilt;
    uniform vec3 uInk[5];
    out vec4 frag;
    float speck(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    float lump(vec2 p){ vec2 c = floor(p), f = p - c; f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      return mix(mix(speck(c), speck(c + vec2(1, 0)), f.x), mix(speck(c + vec2(0, 1)), speck(c + vec2(1, 1)), f.x), f.y); }
    float drift(vec2 p){ float sum = 0.0, amp = 0.5; const mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 4; i++) { sum += amp * lump(p); p = turn * p * 2.03 + 11.0; amp *= 0.5; } return sum / 0.9375; }
    float haze(vec2 p){ const mat2 turn = mat2(0.8, 0.6, -0.6, 0.8); float a = lump(p); p = turn * p * 2.03 + 11.0; return a * 0.6 + lump(p) * 0.4; }
    vec3 ramp(float f){ vec3 c = mix(uInk[4], uInk[2], smoothstep(0.02, 0.44, f)); c = mix(c, uInk[1], smoothstep(0.4, 0.74, f)); return mix(c, uInk[0], smoothstep(0.72, 1.02, f)); }
    void main(){
      vec2 uv = gl_FragCoord.xy / uSize;
      vec2 p = (gl_FragCoord.xy - 0.5 * uSize) / uSize.y;
      float ca = cos(uTilt), sa = sin(uTilt);
      p = mat2(ca, -sa, sa, ca) * p;
      float t = uClock * 0.045;
      vec2 s = p * vec2(0.42, 1.5);
      vec2 bend = vec2(haze(s + uSalt + t), haze(s - uSalt * 1.3 + vec2(5.2, 1.3) - t)) - 0.5;
      vec2 w = p + bend * vec2(1.15, 0.24) + uLean * vec2(0.05, 0.03) + vec2(uClock * 0.022, 0.0);
      float big = haze(w * vec2(0.3, 1.5) + uSalt * 0.6);
      float mid = haze(w * vec2(0.45, 3.4) + uSalt * 1.4);
      float f = 0.46 + w.y * 0.7 + (big - 0.5) * 1.2 + (mid - 0.5) * 0.28;
      float sway = 2.6 * (haze(w * vec2(0.2, 0.7) + 7.0) - 0.5);
      float rib = 0.62 * sin(f * 11.0 + uSalt + sway) + 0.38 * sin(f * 6.7 + uSalt * 1.7 - sway);
      f += rib * 0.042;
      vec3 col = ramp(clamp(f, 0.0, 1.0));
      float hot = smoothstep(0.32, 0.82, haze(w * vec2(0.42, 0.42) + uSalt * 2.0));
      col += uInk[3] * pow(0.5 + 0.5 * rib, 3.5) * hot * 0.62;
      col *= 1.0 - 0.42 * pow(0.5 - 0.5 * rib, 2.5) * (1.0 - hot * 0.5);
      col *= 0.88 + 0.24 * drift(vec2(w.x * 0.2, w.y * 9.0) + uSalt * 3.0);
      vec2 g = vec2(0.45 * fract(uSalt * 0.37) - 0.22, 0.05) + uLean * 0.06;
      col += uInk[3] * 0.3 * exp(-5.0 * dot(p - g, p - g));
      col *= mix(0.6, 1.0, smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.25, 1.0))));
      col = clamp(col / (1.0 + 0.15 * col), 0.0, 1.0);
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.45);
      col += (speck(gl_FragCoord.xy + fract(uClock * 7.0) * 91.0) - 0.5) * 0.04;
      frag = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`;

  const OURS = ["#EEEBF9", "#ABA0E6", "#4A37B5", "#F5F3FC", "#07060E"].flatMap((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255));

  function heroLight(canvas) {
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!gl) return null;
    const part = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, part(gl.VERTEX_SHADER, `#version 300 es
      void main(){ gl_Position = vec4(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0, 0.0, 1.0); }`));
    gl.attachShader(prog, part(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.bindVertexArray(gl.createVertexArray());
    const at = {};
    ["uSize", "uLean", "uClock", "uSalt", "uTilt", "uInk"].forEach((n) => { at[n] = gl.getUniformLocation(prog, n); });
    let clock = 4.2, lean = [0, 0], goal = [0, 0], live = false, raf = 0, stamp = 0;

    function draw() {
      const r = canvas.getBoundingClientRect(), k = Math.min(devicePixelRatio || 1, 2) * 0.55;
      const w = Math.max(1, Math.round(r.width * k)), h = Math.max(1, Math.round(r.height * k));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(at.uSize, w, h);
      gl.uniform2f(at.uLean, lean[0], lean[1]);
      gl.uniform1f(at.uClock, clock);
      gl.uniform1f(at.uSalt, 3.7);
      gl.uniform1f(at.uTilt, 0.08);
      gl.uniform3fv(at.uInk, OURS);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function tick(t) {
      raf = 0;
      const dt = Math.min(0.05, (t - stamp) / 1000 || 0.016);
      stamp = t;
      if (live && !calm) clock += dt;
      const k = Math.min(1, dt * 3.5), dx = goal[0] - lean[0], dy = goal[1] - lean[1];
      const leaning = Math.abs(dx) + Math.abs(dy) > 0.002;
      if (leaning) lean = [lean[0] + dx * k, lean[1] + dy * k];
      draw();
      if ((live && !calm) || leaning) wake();
    }
    function wake() { if (!raf) { stamp = stamp || performance.now(); raf = requestAnimationFrame(tick); } }
    new ResizeObserver(() => { draw(); }).observe(canvas);
    return {
      draw,
      set live(v) { live = v; if (v) wake(); },
      point(x, y) { goal = [x, y]; wake(); },
    };
  }

  const hero = $("#hero"), horizon = $("#horizon"), arc = $(".pr-arc"), canvas = $(".pr-light");

  if (hero) new IntersectionObserver((seen) => hero.classList.toggle("off", !seen[seen.length - 1].isIntersecting)).observe(hero);

  if (horizon) {

  function placeArc() {
    const n = innerWidth < 640 ? 5 : innerWidth < 1000 ? 6 : 8;
    const icons = $$("img", arc);
    icons.forEach((im) => { im.hidden = +im.dataset.rank >= n; });
    icons.filter((im) => !im.hidden).forEach((im, k) => {
      const x = 90 - (80 * k) / (n - 1), u = Math.abs(x - 50) / 40;
      im.style.setProperty("--x", `${x.toFixed(2)}%`);
      im.style.setProperty("--y", `${(30 + u * u * 26).toFixed(2)}%`);
      im.style.setProperty("--z", (1.6 - u).toFixed(2));
      im.style.setProperty("--i", k);
    });
  }
  placeArc();
  addEventListener("resize", placeArc, { passive: true });
  let light = null;
  const firstLight = () => {
    light = heroLight(canvas);
    if (!light) return;
    light.draw();
    canvas.classList.add("ready");
  };
  ("requestIdleCallback" in window ? requestIdleCallback : (f) => setTimeout(f, 60))(firstLight, { timeout: 600 });

  if (!calm) {
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = horizon.getBoundingClientRect();
      const x = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1), y = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      arc.style.setProperty("--px", x.toFixed(3));
      arc.style.setProperty("--py", y.toFixed(3));
      if (light) { light.live = true; light.point(x, -y); }
    });
    hero.addEventListener("pointerleave", () => {
      arc.style.setProperty("--px", 0);
      arc.style.setProperty("--py", 0);
      if (light) { light.live = false; light.point(0, 0); }
    });
  }
  }

  $("#qs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const open = b.parentElement.classList.toggle("open");
    b.setAttribute("aria-expanded", String(open));
  });

  const load = (src) => new Promise((done, fail) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = done;
    s.onerror = fail;
    document.body.appendChild(s);
  });

  let lastHeavy = -1e9;
  const quiet = (f) => {
    let t = 0;
    const done = () => {
      if (performance.now() - lastHeavy < 500) return arm();
      lastHeavy = performance.now();
      removeEventListener("scroll", arm); removeEventListener("touchmove", arm); f();
    };
    function arm() { clearTimeout(t); t = setTimeout(done, 500); }
    addEventListener("scroll", arm, { passive: true });
    addEventListener("touchmove", arm, { passive: true });
    arm();
  };
  const idle = (f, after) => setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(f, { timeout: 1500 }) : quiet(f)), after);

  const JOBS = [
    [$("#deck"), 900, () => load("home-lux-deck/deck.js")],
    [$("#end"), 2400, () => load("home-lux-end/glass.js").then(() => load("home-lux-end/end.js"))],
    [$("#foot"), 3600, () => load("home-lux/word.js")],
  ].filter(([el]) => el).map(([el, after, run]) => {
    let done = false;
    const go = () => { if (done) return; done = true; run().catch((err) => console.error(err)); };
    if (document.readyState === "complete") idle(go, after);
    else addEventListener("load", () => idle(go, after), { once: true });
    return [el, go];
  });
  const near = new IntersectionObserver((list) => list.forEach((e) => {
    if (!e.isIntersecting) return;
    near.unobserve(e.target);

    const go = JOBS.find(([el]) => el === e.target)[1];
    if ("requestIdleCallback" in window) go(); else quiet(go);
  }), { rootMargin: "500px 0px" });
  JOBS.forEach(([el]) => near.observe(el));

  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
