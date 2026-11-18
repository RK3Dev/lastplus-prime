(() => {
  const vis = document.querySelector("#apps .ap-vis");
  if (!vis) return;
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const CODE = '<span class="pf-cap dim">يحتاج كود إضافي</span>';
  const APPS = [
    { name: "تطبيق القصص", icon: "snap", code: true, feats: ["بدون إعلانات", "رفع الصور من الألبوم", "تخصيص الألوان والخطوط"] },
    { name: "تطبيق الصور", icon: "insta", feats: ["تحميل الصور والمقاطع", "بدون إعلانات", "قفل التطبيق برمز"] },
    { name: "تطبيق المحادثات", icon: "whatsapp", feats: ["قفل المحادثات برمز", "ثيمات وألوان", "حسابين في نفس الجهاز"] },
    { name: "تطبيق المقاطع القصيرة", icon: "tiktok", feats: ["تحميل بدون علامة مائية", "تغيير بلد المحتوى", "بدون إعلانات"] },
    { name: "تطبيق الفيديو", icon: "youtube", feats: ["بدون إعلانات", "تشغيل في الخلفية", "تحميل الفيديو"] },
    { name: "تطبيق التغريدات", icon: "x", feats: ["تحميل الفيديو والصور", "بدون إعلانات", "قفل المحادثات"] },
    { name: "لعبة البلوت", icon: "kammelna", feats: ["VIP كامل على حسابك", "بدون إعلانات", "فتح التعابير والدوريات"] },
  ];
  const N = APPS.length;
  const img = (a) => `<img src="home-ads/px/web/${a.icon}.webp" alt="" width="360" height="360" decoding="async" draggable="false">`;
  const half = (d) => { d = ((d % N) + N) % N; return d >= N / 2 ? d - N : d; };
  const wrap = (x) => ((Math.round(x) % N) + N) % N;
  const E = "cubic-bezier(.2,.8,.2,1)";
  const html = (a) => `<div class="rg-name"><b>${a.name}</b>${a.code ? CODE : ""}</div><ul class="rg-chips">${a.feats.map((f) => `<li><i></i>${f}</li>`).join("")}</ul>`;

  const s = {
    x: 0, v: 0, t: 0, k: 0, c: 0,
    set(r, z) { s.k = ((2 * Math.PI) / r) ** 2; s.c = (4 * Math.PI * z) / r; },
    step(dt) {
      const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
      for (let i = 0; i < n; i++) { s.v += (-s.k * (s.x - s.t) - s.c * s.v) * h; s.x += s.v * h; }
      if (Math.abs(s.x - s.t) < 2e-4 && Math.abs(s.v) < 2e-3) { s.x = s.t; s.v = 0; return true; }
      return false;
    },
  };
  s.set(1.3, 0.88);

  vis.innerHTML = `<div class="rg"><div class="rg-ring" role="group" aria-label="اختر تطبيقاً"><span class="rg-pool" aria-hidden="true"></span><span class="rg-orbit" aria-hidden="true"></span>`
    + APPS.map((a, i) => `<button type="button" class="rg-ico" data-i="${i}" aria-label="${a.name}" aria-pressed="false" tabindex="${i ? -1 : 0}"><span class="rg-face">${img(a)}<span class="rg-dim"></span><span class="rg-sheen"></span></span></button>`).join("")
    + `</div><div class="rg-info"><div class="rg-now" aria-live="off"></div><div class="rg-probe" aria-hidden="true"></div></div></div>`;
  const root = vis.firstElementChild, ring = root.firstElementChild, info = root.querySelector(".rg-info");
  const box = info.querySelector(".rg-now"), probe = info.querySelector(".rg-probe");
  const btns = [...ring.querySelectorAll("button")], dims = btns.map((b) => b.querySelector(".rg-dim"));
  const SMIN = 0.36;
  let B = 92, Rx = 200, Ry = 85, few = false;
  const away = btns.map(() => false);

  const draw = () => btns.forEach((b, i) => {
    const p = (half(i - s.x) * 2 * Math.PI) / N, c = Math.cos(p), t = (1 + c) / 2;
    b.style.transform = `translate(${(-Rx * Math.sin(p)).toFixed(2)}px,${((-Ry * (1 - c)) / 2).toFixed(2)}px) scale(${(SMIN + (1 - SMIN) * t ** 1.3).toFixed(4)})`;
    b.style.zIndex = String(Math.round(t * 100));
    dims[i].style.opacity = (0.62 * (1 - t) ** 1.1).toFixed(3);
    const o = few ? Math.min(1, Math.max(0, (t - 0.16) / 0.2)) : 1;
    b.style.opacity = o.toFixed(3);
    if (away[i] !== o < 0.4) { away[i] = o < 0.4; b.style.pointerEvents = away[i] ? "none" : ""; }
  });

  const reserve = () => {
    let h = 0;
    APPS.forEach((a) => { probe.innerHTML = html(a); h = Math.max(h, probe.offsetHeight); });
    probe.innerHTML = "";
    box.style.minHeight = `${h}px`;
  };
  const measure = () => {
    const w = ring.clientWidth;
    few = w < 440;
    B = few ? 80 : 92;
    Rx = Math.min(206, w / 2 - B * 0.34 - 6);
    Ry = B * (few ? 0.7 : 0.92);

    const y0 = few ? Ry * 0.5 + B * 0.31 + 12 : Ry + (B * SMIN) / 2 + 10;
    ring.style.setProperty("--B", `${B}px`);
    ring.style.setProperty("--y0", `${y0.toFixed(1)}px`);
    ring.style.setProperty("--rx", `${Rx.toFixed(1)}px`);
    ring.style.setProperty("--ry", `${Ry.toFixed(1)}px`);
    ring.style.height = `${(y0 + B / 2 + B * 0.44).toFixed(1)}px`;
    reserve();
    draw();
  };
  let raf = 0, last = 0;
  const tick = (now) => {
    const rest = s.step(Math.min(0.034, Math.max(0, (now - last) / 1000)));
    last = now;
    draw();
    raf = rest ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  s.x = s.t = calm ? 0 : -3;
  measure();
  new ResizeObserver(measure).observe(ring);
  if (document.fonts) document.fonts.ready.then(reserve);

  let cur = -1, out = null, swap = 0;
  const fill = (i) => {
    if (out) { out.cancel(); out = null; }
    box.innerHTML = html(APPS[i]);
    if (calm) return;
    box.firstElementChild.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: E, fill: "backwards" });

    box.querySelectorAll("li").forEach((li, n) => li.animate(
      [{ opacity: 0, transform: "translateY(-22px) scale(.86)" }, { opacity: 1, offset: 0.45 }, { opacity: 1, transform: "none" }],
      { duration: 680, delay: 110 + n * 75, easing: "cubic-bezier(.2,.9,.25,1.1)", fill: "backwards" }));
  };
  const say = (i) => {
    cur = i;
    clearTimeout(swap);
    if (calm || !box.firstElementChild) { fill(i); return; }
    if (!out) out = box.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(4px)" }], { duration: 140, easing: "ease-in", fill: "forwards" });
    swap = setTimeout(() => fill(cur), 150);
  };

  let sel = -1, picked = false, seen = false, inView = false, timer = 0, firstWait = calm ? 0 : 650, wait = 0, first = true;
  const choose = (target) => {
    s.t = target;
    kick();
    const i = wrap(target);
    if (i === sel) return;
    sel = i;
    btns.forEach((b, j) => { b.setAttribute("aria-pressed", String(j === i)); b.tabIndex = j === i ? 0 : -1; });

    clearTimeout(wait);
    if (firstWait) { wait = setTimeout(() => say(sel), firstWait); firstWait = 0; } else say(i);
    if (first) first = false; else s.set(0.66, 0.8);
    if (!calm) btns[i].querySelector(".rg-sheen").animate([{ opacity: 0, transform: "translateX(-110%)" }, { opacity: 1, offset: 0.3 }, { opacity: 0, transform: "translateX(110%)" }], { duration: 1100, delay: 280, easing: "cubic-bezier(.45,0,.25,1)" });
  };
  const auto = () => { clearTimeout(timer); if (!picked && inView && !calm) timer = setTimeout(() => { choose(Math.round(s.t) + 1); auto(); }, 5000); };

  const pick = () => { picked = true; clearTimeout(timer); box.setAttribute("aria-live", "polite"); };

  let id = null, x0 = 0, p0 = 0, moved = false, hist = [], dragAt = -1e9;
  const perItem = () => (Rx * 2 * Math.PI) / N;
  ring.addEventListener("pointerdown", (e) => {
    if (id !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    id = e.pointerId; x0 = e.clientX; moved = false; hist = [[e.timeStamp, e.clientX]];
  });
  ring.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    if (!moved) {
      if (Math.abs(e.clientX - x0) < 8) return;
      moved = true; x0 = e.clientX; p0 = s.x;
      try { ring.setPointerCapture(id); } catch (err) {   }
    }
    hist.push([e.timeStamp, e.clientX]);
    if (hist.length > 5) hist.shift();
    s.x = s.t = p0 + (e.clientX - x0) / perItem();
    s.v = 0;
    kick();
  });
  const end = (e, cancel) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!moved) return;
    dragAt = performance.now();
    const a = hist[0], b = hist[hist.length - 1], dt = (b[0] - a[0]) / 1000;
    const v = !cancel && dt > 0.008 && e.timeStamp - b[0] < 90 ? (b[1] - a[1]) / perItem() / dt : 0;
    s.v = v;
    pick();
    choose(Math.round(s.x + Math.max(-2.5, Math.min(2.5, v * 0.2))));
  };
  ring.addEventListener("pointerup", (e) => end(e, false));
  ring.addEventListener("pointercancel", (e) => end(e, true));
  ring.addEventListener("click", (e) => {
    if (performance.now() - dragAt < 300) return;
    const b = e.target.closest("button");
    if (!b) return;
    pick();
    choose(Math.round(s.t) + half(+b.dataset.i - Math.round(s.t)));
  });
  ring.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    pick();
    choose(Math.round(s.t) + (e.key === "ArrowLeft" ? 1 : -1));
    btns[sel].focus();
  });
  new IntersectionObserver((l) => {
    inView = l[l.length - 1].isIntersecting;
    if (inView && !seen) { seen = true; choose(0); }
    auto();
  }, { threshold: 0.5 }).observe(root);
})();
