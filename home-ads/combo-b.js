(() => {
  const ICON = "home-ads/px/web/insta.webp";
  const OPTS = [
    ["النسخة الأولى", "الأخف على جهازك", ["حجم أصغر", "أداء أسرع", "بدون إعلانات"]],
    ["النسخة الثانية", "تخصيص كامل", ["ألوان وخطوط", "أيقونات مختلفة", "وضع داكن"]],
    ["النسخة الثالثة", "تحكم أكثر", ["قفل التطبيق برمز", "ترتيب القوائم", "إخفاء الأقسام اللي ما تبيها"]],
    ["النسخة الرابعة", "لأكثر من حساب", ["حسابين في نفس الجهاز", "تبديل سريع", "إشعارات منفصلة"]],
  ];

  const FAN = [[-66, 6, -9, 0.88, 0.62], [66, 6, 9, 0.88, 0.62], [-124, 20, -17, 0.74, 0.3], [124, 20, 17, 0.74, 0.3]];
  const FLIP_AT = 2800, FLIP = 950, EACH = 3600, PER = 3;
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const vis = document.querySelector(".vr-card .pf-vis");
  if (!vis) return;
  const img = () => `<img src="${ICON}" alt="" width="360" height="360" decoding="async">`;
  vis.innerHTML = `<div class="cb"><div class="cb-pills"></div><div class="cb-stage">`
    + FAN.map((_, i) => `<div class="cb-copy c${i + 1}">${img()}</div>`).join("")
    + `<div class="cb-breath"><div class="cb-scene"><div class="cb-sway"><div class="cb-flip">`
    + `<div class="cb-face front">${img()}<span class="cb-sheen"></span></div><div class="cb-face back">${img()}<span class="cb-sheen"></span></div>`
    + `</div></div></div></div></div><div class="cb-cap"><b><bdi></bdi></b><span></span></div></div>`;
  const cb = vis.querySelector(".cb"), copies = [...cb.querySelectorAll(".cb-copy")], breath = cb.querySelector(".cb-breath");
  const flip = cb.querySelector(".cb-flip"), sheens = [...cb.querySelectorAll(".cb-sheen")], cap = cb.querySelector(".cb-cap");
  const pills = cb.querySelector(".cb-pills"), stage = cb.querySelector(".cb-stage");
  const say = (o) => { cap.querySelector("bdi").textContent = o[0]; cap.querySelector("span").textContent = o[1]; };

  let W = 0, H = 0;
  const measure = () => {
    const a = pills.getBoundingClientRect(), s = stage.getBoundingClientRect();
    W = a.width; H = a.height;
    pills.style.setProperty("--cy", `${(s.top + s.height / 2 - a.top).toFixed(1)}px`);
  };

  const WIDTH = new Map();
  const widths = () => {
    const probe = document.createElement("span");
    probe.className = "cb-pill";
    probe.style.visibility = "hidden";
    pills.append(probe);
    OPTS.forEach((o) => o[2].forEach((f) => { probe.innerHTML = `<i></i>${f}`; WIDTH.set(f, probe.offsetWidth); }));
    probe.remove();
  };
  measure(); widths();
  new ResizeObserver(() => { measure(); widths(); }).observe(cb);
  const reach = () => (matchMedia("(max-width:639px)").matches ? 0.7 : 1);

  if (calm) {
    const r = reach();
    copies.forEach((c, i) => { const [x, y, a, s, o] = FAN[i]; Object.assign(c.style, { translate: `${x * r}px ${y}px`, rotate: `${a}deg`, scale: String(s), opacity: String(o) }); });
    say(OPTS[0]); cb.classList.add("calm");
    return;
  }

  let timers = [], k = 0, n = 0, running = false;
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  const fan = () => {
    const r = reach();
    copies.forEach((c, i) => {
      const [x, y, a, s, o] = FAN[i], inner = i < 2;
      const shut = { translate: "0px 0px", rotate: "0deg", scale: inner ? 0.9 : 0.84, opacity: 0 };
      const open = { translate: `${(x * r).toFixed(1)}px ${y}px`, rotate: `${a}deg`, scale: s, opacity: o };
      c.animate([
        { ...shut, offset: 0, easing: "cubic-bezier(.18,.9,.22,1.06)" },
        { ...shut, offset: inner ? 0.02 : 0.06, easing: "cubic-bezier(.18,.9,.22,1.06)" },
        { ...open, offset: inner ? 0.36 : 0.4 },
        { ...open, offset: 0.72, easing: "cubic-bezier(.55,0,.4,1)" },
        { ...shut, offset: 1 },
      ], { duration: 2650 });
    });
    breath.animate([{ scale: 1 }, { scale: 1.05, translate: "0 -4px", offset: 0.3 }, { scale: 1.05, translate: "0 -4px", offset: 0.72 }, { scale: 1 }],
      { duration: 2650, easing: "ease-in-out" });
    const face = sheens[k % 2];
    face.animate([{ opacity: 0, translate: "-110% 0" }, { opacity: 1, offset: 0.2 }, { opacity: 0, translate: "110% 0" }], { duration: 1400, delay: 650, easing: "cubic-bezier(.45,0,.25,1)" });
  };

  const turn = (o) => {
    k += 1;
    cap.classList.remove("on");
    flip.style.transform = `rotateY(${k * 180}deg)`;
    sheens[k % 2].animate([{ opacity: 0, translate: "-110% 0" }, { opacity: 1, offset: 0.35 }, { opacity: 0, translate: "110% 0" }], { duration: FLIP, easing: "cubic-bezier(.65,0,.25,1)" });
    at(FLIP / 2, () => { say(o); cap.classList.add("on"); });
  };

  const EMERGE = 760, RETRACT = 420;
  let shown = [];
  const tf = (x, y, s) => `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) scale(${s})`;
  const emerge = (feats) => {
    const [wa, wb] = feats.map((f) => WIDTH.get(f) || 160);
    const need = (wa + wb) / 4 + 6, room = W / 2 - Math.max(wa, wb) / 2 - 6;
    const rx = Math.min(Math.max(need, 92), room), apart = rx >= need;
    feats.forEach((text, j) => {

      const y = apart ? -84 : (j === 0 ? -76 : -112);
      const p = document.createElement("span");
      p.className = "cb-pill";
      p.innerHTML = `<i></i>${text}`;
      pills.append(p);
      const x = (j === 0 ? -1 : 1) * rx;

      p.animate([
        { transform: tf(x * 0.2, -34, 0.82), opacity: 0 },
        { transform: tf(x * 0.7, y * 0.8, 0.95), opacity: 1, offset: 0.35 },
        { transform: tf(x, y, 1), opacity: 1 },
      ], { duration: EMERGE, delay: j * 90, easing: "cubic-bezier(.2,.85,.25,1.04)", fill: "both" });
      shown.push(p);
    });
  };
  const retract = () => {
    const gone = shown;
    shown = [];
    gone.forEach((p, j) => {

      p.animate([{ transform: tf(0, -34, 0.82), opacity: 0 }], { duration: RETRACT, delay: j * 40, easing: "cubic-bezier(.55,0,.75,.2)", fill: "forwards" })
        .onfinish = () => p.remove();
    });
  };

  const round = () => {
    fan();
    for (let j = 0; j < PER; j++) {
      const o = OPTS[(n + j) % OPTS.length], t = FLIP_AT + j * EACH;
      at(t, () => { retract(); turn(o); });
      at(t + FLIP / 2 + 60, () => emerge(o[2].slice(0, 2)));
    }
    const end = FLIP_AT + PER * EACH;
    at(end - 300, () => { retract(); cap.classList.remove("on"); });
    at(end + 200, () => { n += PER; round(); });
  };
  const start = () => { if (running) return; running = true; cb.classList.add("run"); round(); };
  const stopAll = () => {
    running = false; cb.classList.remove("run");
    timers.forEach(clearTimeout); timers = [];
    cb.getAnimations({ subtree: true }).forEach((an) => an.cancel());
    pills.textContent = "";
    shown = [];
    cap.classList.remove("on");
  };
  new IntersectionObserver((seen) => (seen[seen.length - 1].intersectionRatio >= 0.5 ? start() : stopAll()), { threshold: [0, 0.5] }).observe(cb);
})();
