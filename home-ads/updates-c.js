(() => {

  const NOTICES = [
    ["لعبة ألغاز", "تحديث جديد", "royal-match", "منذ 6 ساعات"],
    ["لعبة قتال", "تحديث جديد", "brawl-stars", "منذ 5 ساعات"],
    ["لعبة جري", "تحديث جديد", "subway-surfers", "منذ 4 ساعات"],
    ["لعبة لودو", "تحديث جديد", "ludo-star", "منذ 3 ساعات"],
    ["تطبيق مجتمعات", "تحديث جديد", "discord", "منذ ساعتين"],
    ["تطبيق رسم", "تطبيق جديد", "procreate", "منذ ساعة"],
    ["لعبة استراتيجية", "تحديث جديد", "clash-royale", "منذ 30 دقيقة"],
    ["لعبة البلوت", "نسخة جديدة", "kammelna", "منذ دقيقة"],
  ];

  const AT = [0, 700, 1150, 1600, 2050, 2600, 3050, 3700];
  const START = 400, LEAD = 80, SHINE = 600, DEPTH = 4;

  const PLACES = [[0, 1, 1], [18, 0.85, 0.85], [35.5, 0.71, 0.6], [50, 0.58, 0.32], [60, 0.5, 0]];
  const FIRST = [40, 0.9, 0], ENTRY = [28, 0.88, 0];

  const spring = (response, damping) => ({ k: (2 * Math.PI / response) ** 2, c: 4 * Math.PI * damping / response });
  const MOVE = spring(0.5, 0.88), FADE = spring(0.26, 1);
  const ICONS = new URL("bl/168/u-", document.currentScript.src).href;
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;

  document.querySelectorAll(".ux").forEach((scene) => {
    const stack = document.createElement("div");
    stack.className = "nx";
    scene.append(stack);
    let notes = [], leaving = [], timers = [], frame = 0, last = 0, played = false;
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    const make = ([name, what, icon, when], from) => {
      const el = document.createElement("div");
      el.className = "nx-note";
      el.innerHTML = `<img class="nx-ico" src="${ICONS}${icon}.webp" alt="" width="168" height="168" decoding="async">` + (icon === "kammelna" ? `<i class="stk stk-s">صكه</i>` : "")
        + `<div class="nx-t"><b><bdi></bdi></b><span></span></div><i class="nx-when"></i>`;
      el.querySelector("bdi").textContent = name;
      el.querySelector(".nx-t span").textContent = what;
      el.querySelector(".nx-when").textContent = when;
      const [y, k, o] = from;
      const n = { el, y, k, o, vy: 0, vk: 0, vo: 0, ty: y, tk: k, to: o };
      draw(n);
      return n;
    };
    const place = (n, lv) => {
      [n.ty, n.tk, n.to] = PLACES[Math.min(lv, DEPTH)];
      n.el.style.zIndex = String(10 - lv);
    };
    const draw = (n) => {
      n.el.style.translate = `0 ${n.y.toFixed(2)}px`;
      n.el.style.scale = n.k.toFixed(4);
      n.el.style.opacity = Math.min(1, Math.max(0, n.o)).toFixed(3);
    };

    const pull = (x, v, target, s, dt) => { v += (-s.k * (x - target) - s.c * v) * dt; return [x + v * dt, v]; };
    const still = (n) => Math.abs(n.y - n.ty) < 0.02 && Math.abs(n.vy) < 0.05 && Math.abs(n.k - n.tk) < 0.0005
      && Math.abs(n.vk) < 0.002 && Math.abs(n.o - n.to) < 0.003 && Math.abs(n.vo) < 0.01;
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const all = notes.concat(leaving);
      for (const n of all) {
        for (let s = 0, h = dt / 4; s < 4; s++) {
          [n.y, n.vy] = pull(n.y, n.vy, n.ty, MOVE, h);
          [n.k, n.vk] = pull(n.k, n.vk, n.tk, MOVE, h);
          [n.o, n.vo] = pull(n.o, n.vo, n.to, FADE, h);
        }
        draw(n);
      }

      leaving = leaving.filter((n) => (n.o > 0.01 || !still(n)) || (n.el.remove(), false));
      if (all.some((n) => !still(n))) frame = requestAnimationFrame(tick);
      else { frame = 0; all.forEach((n) => { n.y = n.ty; n.k = n.tk; n.o = n.to; draw(n); }); }
    };
    const run = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); } };

    const push = () => {
      notes.forEach((n, i) => place(n, i + 1));
      leaving.push(...notes.slice(DEPTH - 1));
      notes = notes.slice(0, DEPTH - 1);
      run();
    };
    const arrive = (notice, first) => {
      const n = make(notice, first ? FIRST : ENTRY);
      place(n, 0);
      stack.append(n.el);
      notes.unshift(n);
      run();
    };
    const play = () => {
      timers.forEach(clearTimeout);
      timers = [];
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      notes.concat(leaving).forEach((n) => n.el.remove());
      notes = []; leaving = [];
      NOTICES.forEach((notice, k) => {
        if (k) at(START + AT[k] - LEAD, push);
        at(START + AT[k], () => arrive(notice, k === 0));
      });
      at(START + AT[AT.length - 1] + SHINE, () => notes[0] && notes[0].el.classList.add("shine"));
    };

    if (calm) {
      NOTICES.slice(-DEPTH).forEach((notice) => { const n = make(notice, PLACES[0]); stack.append(n.el); notes.unshift(n); });
      notes.forEach((n, i) => { place(n, i); n.y = n.ty; n.k = n.tk; n.o = n.to; draw(n); });
      return;
    }
    new IntersectionObserver((seen) => {
      if (!played && seen[seen.length - 1].intersectionRatio >= 0.5) { played = true; play(); }
    }, { threshold: [0, 0.5] }).observe(scene);
    scene.addEventListener("click", play);
  });
})();
