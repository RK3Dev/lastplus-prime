(() => {
  const card = document.querySelector(".lw");
  if (!card) return;
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const ua = navigator.userAgent;
  const real = /iPhone|iPod/.test(ua) ? "iphone" : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ipad" : "computer";
  const q = new URLSearchParams(location.search);
  const tabs = [...card.querySelectorAll(".lw-tab")];
  const tabsBox = card.querySelector(".lw-tabs");
  const go = card.querySelector(".lw-go");
  const canvas = card.querySelector(".lw-light");
  const sky = card.querySelector(".lw-sky");
  const forEl = card.querySelector(".lw-for");
  const priceEl = card.querySelector(".lw-price");
  const offEl = card.querySelector(".lw-off");
  const yearEl = card.querySelector(".lw-year");

  const bez = (x1, y1, x2, y2) => {
    const at = (t, a, b) => (((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t + 3 * a) * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (at(t, x1, x2) < x) lo = t; else hi = t; }
      return at(t, y1, y2);
    };
  };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const RING = bez(.3, .05, .3, 1);
  const ROLL_IN = "cubic-bezier(.16,1,.3,1)", ROLL = "cubic-bezier(.2,.9,.25,1)", OUT = "cubic-bezier(.25,.8,.3,1)";

  const DIGITS = "0123456789".repeat(3).split("").map((c) => `<i>${c}</i>`).join("");
  const odo = (host, tail) => {
    host.classList.add("od");
    const sr = document.createElement("span");
    sr.className = "od-sr";
    const row = document.createElement("span");
    row.setAttribute("aria-hidden", "true");
    host.replaceChildren(sr, row);
    const tailEl = tail ? Object.assign(document.createElement("span"), { className: "od-t", textContent: tail }) : null;
    let cols = [], cur = NaN, h = 0, w = 0;
    const lineH = () => h || (cols[0] ? cols[0].el.offsetHeight : 0);
    const rest = (c) => { c.s.style.transform = `translateY(${-(10 + c.d) * lineH()}px)`; };
    const make = () => {
      const el = document.createElement("span");
      el.className = "od-d";
      el.innerHTML = `<span class="od-g">0</span><span class="od-s">${DIGITS}</span>`;
      return { el, s: el.lastElementChild, d: 0, fresh: true };
    };
    return {
      measure() { if (cols[0]) { h = cols[0].el.offsetHeight; w = cols[0].el.offsetWidth; } cols.forEach(rest); },

      set(value, how) {
        const str = String(value), want = [...str].map(Number);
        sr.textContent = str + (tail || "");
        const old = cur;
        cur = +value;
        const add = Math.max(0, want.length - cols.length), drop = Math.max(0, cols.length - want.length);
        const fresh = Array.from({ length: add }, make);
        const leaving = cols.slice(0, drop);
        cols = [...fresh, ...cols.slice(drop)];
        row.prepend(...fresh.map((c) => c.el));
        if (tailEl && row.lastElementChild !== tailEl) row.append(tailEl);
        cols.forEach((c, i) => { c.next = want[i]; });
        if (!how || old !== old && !how.from0) {
          leaving.forEach((c) => c.el.remove());
          cols.forEach((c) => { c.d = c.next; c.fresh = false; rest(c); });
          return { anims: [], end: 0, settle() {} };
        }
        const { delay = 0, dur = 700, easing = ROLL, from0 = false } = how;
        const anims = [];
        cols.forEach((c, i) => {
          const k = cols.length - 1 - i;
          const hh = lineH();
          let a, b;
          if (from0) { a = 10; b = 10 + c.next + (k === 0 ? 10 : 0); }
          else if (c.fresh) { a = 10; b = 10 + c.next; }
          else if (c.d !== c.next) { a = 10 + c.d; b = 10 + c.next; }
          else return;
          anims.push(c.s.animate([{ transform: `translateY(${-a * hh}px)` }, { transform: `translateY(${-b * hh}px)` }], { duration: dur, delay, easing, fill: "both" }));
          const mb = from0 ? (k === 0 ? 1.8 : 1.2) : .9;
          anims.push(c.s.animate([{ filter: "blur(0px)" }, { filter: `blur(${mb}px)`, offset: .14 }, { filter: "blur(0px)", offset: .6 }], { duration: dur, delay, fill: "both" }));
        });
        const ww = w || (cols[0] ? cols[0].el.offsetWidth : 0);
        fresh.forEach((c) => { if (old === old) anims.push(c.el.animate([{ width: "0px", opacity: 0 }, { width: `${ww}px`, opacity: 1 }], { duration: dur * .8, delay, easing, fill: "both" })); });
        leaving.forEach((c) => { anims.push(c.el.animate([{ width: `${ww}px`, opacity: 1 }, { width: "0px", opacity: 0 }], { duration: dur * .8, delay, easing, fill: "both" })); });
        return {
          anims,
          end: delay + dur,
          settle() {
            leaving.forEach((c) => c.el.remove());
            cols.forEach((c) => { c.d = c.next; c.fresh = false; rest(c); });
            anims.forEach((x) => x.cancel());
          },
        };
      },
    };
  };
  const odPrice = odo(card.querySelector(".lw-num"));
  const odWas = odo(card.querySelector(".lw-was-n"));
  const odPct = odo(card.querySelector(".lw-pct-n"), "%");

  const putStill = (t) => {
    forEl.textContent = t.dataset.for;
    odPrice.set(t.dataset.price);
    odWas.set(t.dataset.was);
    odPct.set(t.dataset.off);
  };

  const geo = { ok: false };
  const offIn = (el) => { let x = 0, y = 0, e = el; while (e && e !== card) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
  const mid = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const measure = () => {
    geo.W = card.offsetWidth; geo.H = card.offsetHeight;
    geo.corner = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 32;
    geo.box = new Map([tabsBox, forEl, priceEl, offEl, yearEl, go].map((el) => [el, offIn(el)]));
    geo.tab = new Map(tabs.map((t) => [t, offIn(t)]));
    [odPrice, odWas, odPct].forEach((o) => o.measure());
    geo.ok = true;
  };

  let wave;
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const light = () => {
    if (wave === undefined) {
      wave = !calm && window.LightWave && canvas ? window.LightWave.create(canvas) : null;
      if (wave) {
        wave.size(geo.W || 1, geo.H || 1, dpr());
        wave.draw({ ox: 0, oy: 0, r: 0, w: 1, ring: 0, veil: 0, rim: 0, t: 0, corner: 32, light: false, seed: 0 });
        wave.clear();
      }
    }
    return wave && !wave.lost ? wave : null;
  };

  const LOOK = {
    enter: { lead: 80, ring: 1800, fade: 1300 },
    switch: { lead: 0, ring: 1600, fade: 1200 },
  };
  let run = null, raf = 0, seen = false;

  const settleRun = (R) => {
    R.anims.forEach((a) => { try { a.finish(); } catch (e) {   } });
    R.swaps.forEach((s) => { if (!s.done) { s.fn(); s.done = true; } });
    R.settles.forEach((f) => f());
    R.anims.forEach((a) => a.cancel());
    card.classList.remove("lit");
    if (R.w) R.w.clear();
  };
  const finish = () => {
    cancelAnimationFrame(raf);
    const R = run;
    run = null;
    if (R) settleRun(R);
  };

  const start = (kind, from, target) => {
    finish();
    const L = LOOK[kind];
    if (!geo.ok) measure();
    const W = geo.W, H = geo.H;
    const far = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - from.x, y - from.y)));
    const bw = (r) => 0.10 * H + 0.06 * r;
    const r0 = 0.12 * H, r1 = far + 3.2 * bw(far);
    const radius = (tr) => r0 + (r1 - r0) * RING(clamp01(tr / L.ring));
    const reach = (d) => {
      if (d <= r0) return 0;
      let lo = 0, hi = L.ring;
      for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (radius(m) < d) lo = m; else hi = m; }
      return hi;
    };
    const crest = (el) => { const m = mid(geo.box.get(el)); return L.lead + reach(Math.hypot(m.x - from.x, m.y - from.y)); };
    const w = light();
    if (w) { w.size(W, H, dpr()); card.classList.add("lit"); }
    const R = {
      kind, L, from, H, radius, bw, r0, w, anims: [], swaps: [], settles: [],
      corner: geo.corner,
      lightTheme: (document.getElementById("hp") || document.documentElement).dataset.theme === "light",
      seed: Math.random(),
      end: L.lead + L.ring * 0.6 + L.fade,
    };
    const add = (a, end) => { R.anims.push(a); R.end = Math.max(R.end, end); };
    const roll = (o) => { o.anims.forEach((a) => R.anims.push(a)); R.end = Math.max(R.end, o.end); R.settles.push(o.settle); };

    if (kind === "enter") {
      add(card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out", fill: "both" }), 320);
      add(card.animate([{ transform: "translateY(16px) scale(.985)" }, { transform: "none" }], { duration: 820, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" }), 820);
      if (sky) add(sky.animate([{ opacity: 0 }, { opacity: 1 }], { duration: L.ring, delay: L.lead + L.ring * .3, easing: "ease-out", fill: "both" }), L.lead + L.ring * 1.3);
      [tabsBox, forEl, priceEl, offEl, yearEl, go].forEach((el) => {
        const tc = crest(el), pre = 0, post = 900, soft = el === priceEl ? 3 : 6;
        add(el.animate([
          { opacity: 0, filter: `blur(${soft}px)`, transform: "translateY(8px)" },
          { opacity: .6, filter: `blur(${(soft * .6).toFixed(1)}px)`, transform: "translateY(4px)", offset: 220 / post, easing: OUT },
          { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" },
        ], { duration: pre + post, delay: Math.max(0, tc - pre), fill: "both" }), tc + post);
        if (el === priceEl) roll(odPrice.set(odPriceValue(), { from0: true, delay: tc + 80, dur: 1500, easing: ROLL_IN }));
        if (el === offEl) roll(odPct.set(odPctValue(), { from0: true, delay: tc + 120, dur: 1300, easing: ROLL_IN }));
      });
    } else {
      const t = target;
      [forEl, priceEl, offEl, yearEl, go].forEach((el) => {
        const tc = crest(el), pre = 220, post = 820;
        const soft = el === priceEl ? 2 : 4.5, dim = el === priceEl ? .72 : .5;
        add(el.animate([
          { opacity: 1, filter: "blur(0px)" },
          { opacity: (1 + dim) / 2, filter: `blur(${soft / 2}px)`, offset: pre / (pre + post) },
          { opacity: dim, filter: `blur(${soft}px)`, offset: (pre + 180) / (pre + post), easing: OUT },
          { opacity: 1, filter: "blur(0px)" },
        ], { duration: pre + post, delay: Math.max(0, tc - pre), fill: "both" }), tc + post);
        if (el === forEl) R.swaps.push({ at: tc + 140, fn: () => { forEl.textContent = t.dataset.for; }, done: false });
        if (el === priceEl) roll(odPrice.set(t.dataset.price, { delay: tc + 100, dur: 1000, easing: ROLL_IN }));
        if (el === offEl) {
          roll(odWas.set(t.dataset.was, { delay: tc + 130, dur: 950, easing: ROLL_IN }));
          roll(odPct.set(t.dataset.off, { delay: tc + 160, dur: 950, easing: ROLL_IN }));
        }
      });
    }
    run = R;
    return R;
  };
  const chosen = () => tabs.find((x) => x.dataset.k === card.dataset.pick) || tabs[0];
  const odPriceValue = () => chosen().dataset.price;
  const odPctValue = () => chosen().dataset.off;

  const draw = (R, t) => {
    R.swaps.forEach((s) => { if (!s.done && t >= s.at) { s.fn(); s.done = true; } });
    if (!R.w) return;
    const tr = t - R.L.lead;
    if (tr < 0) { R.w.clear(); return; }
    const p = clamp01(tr / R.L.ring);
    const r = R.radius(tr);
    const ring = smooth(0, .06, p) * (1 - smooth(.78, 1, p)) * smooth(R.r0, R.r0 + .12 * R.H, r);
    const veil = (1 - smooth(.6, 1.05, p)) * .7;
    const rim = smooth(.35, .8, p) * (1 - smooth(R.L.ring * .65, R.L.ring * .65 + R.L.fade, tr)) * (R.lightTheme ? .6 : .72);
    R.w.draw({ ox: R.from.x, oy: R.from.y, r, w: R.bw(r), ring, veil, rim, t: tr / 1000, corner: R.corner, light: R.lightTheme, seed: R.seed });
  };

  const play = (kind, from, target) => {
    const R = start(kind, from, target);
    const t0 = document.timeline.currentTime;
    R.anims.forEach((a) => { a.startTime = t0; });
    draw(R, 0);
    const tick = (now) => {
      if (run !== R) return;
      const t = now - t0;
      draw(R, t);
      if (t < R.end) raf = requestAnimationFrame(tick);
      else { run = null; settleRun(R); }
    };
    raf = requestAnimationFrame(tick);
  };

  const fromBelow = () => { if (!geo.ok) measure(); return { x: geo.W / 2, y: geo.H * 1.15 }; };

  const mark = (t) => {
    card.dataset.pick = t.dataset.k;
    tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-checked", String(on)); x.tabIndex = on ? 0 : -1; });
    go.href = t.dataset.href || "#";
  };
  const pick = (k, still, focus) => {
    const t = tabs.find((x) => x.dataset.k === k);
    if (!t) return;
    const was = card.dataset.pick;
    mark(t);
    if (focus) t.focus();
    if (still || calm || !seen) { finish(); putStill(t); return; }
    if (was === k) return;
    play("switch", fromBelow(), t);
  };
  tabs.forEach((t) => t.addEventListener("click", () => pick(t.dataset.k)));
  tabsBox.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    pick(card.dataset.pick === "iphone" ? "ipad" : "iphone", false, true);
  });
  const as = ["iphone", "ipad", "computer"].includes(q.get("as")) ? q.get("as") : real;
  card.dataset.mine = as;
  pick(as === "ipad" ? "ipad" : "iphone", true);

  new ResizeObserver(() => { if (geo.ok) measure(); }).observe(card);

  let ready = false;
  const prepare = () => { if (ready) return; ready = true; measure(); light(); };
  const whenCalm = (fn) => {
    let t = 0;
    const done = () => { removeEventListener("scroll", arm); if ("requestIdleCallback" in window) requestIdleCallback(fn, { timeout: 1500 }); else fn(); };
    const arm = () => { clearTimeout(t); t = setTimeout(done, 280); };
    addEventListener("scroll", arm, { passive: true });
    arm();
  };
  if (document.readyState === "complete") whenCalm(prepare); else addEventListener("load", () => whenCalm(prepare), { once: true });

  const enter = () => {
    seen = true;
    prepare();
    requestAnimationFrame(() => { card.classList.remove("pre"); play("enter", fromBelow(), null); });
  };
  if (!calm) {
    card.classList.add("pre");
    new IntersectionObserver((l, o) => { if (l[l.length - 1].isIntersecting) { o.disconnect(); enter(); } }, { threshold: 0.35 }).observe(card);
  } else seen = true;

  document.getElementById("lwAgain")?.addEventListener("click", () => { if (!calm) enter(); });
  window.__lw = {
    hold(kind) {
      cancelAnimationFrame(raf);
      prepare();
      seen = true;
      card.classList.remove("pre");
      let R;
      if (kind === "switch") {
        const t = tabs.find((x) => x.dataset.k !== card.dataset.pick);
        mark(t);
        R = start("switch", fromBelow(), t);
      } else R = start("enter", fromBelow(), null);
      R.anims.forEach((a) => a.pause());
      this.at(0);
      return R.end;
    },
    at(ms) {
      const R = run;
      if (!R) return;
      R.anims.forEach((a) => { a.currentTime = ms; });
      draw(R, ms);
    },
    done() { finish(); },
  };
})();
