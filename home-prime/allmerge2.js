(() => {
  const go = document.querySelector(".ab-go");
  if (!go || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const POOL = (go.dataset.pool || "").split(",").filter(Boolean);
  const src = (k) => k;
  const icos = [...go.querySelectorAll(".ab-ico")];
  const ins = icos.map((s) => s.querySelector(".ab-in")), rings = icos.map((s) => s.querySelector(".ab-ring"));
  const faces = icos.map((s) => s.querySelector(".ab-face"));
  const words = go.querySelector(".ab-t"), arrow = go.querySelector(".ab-arw");
  const phone = matchMedia("(max-width:639px)");
  const keep = () => (phone.matches ? 3 : 4);
  const more = icos.length - 1;
  const rowItems = () => (phone.matches ? [0, 1, 2, 3, 4, more] : icos.map((_, i) => i));
  icos.forEach((s, i) => s.style.setProperty("--k", i));
  const plusK = () => icos[more].style.setProperty("--k", keep());
  plusK();
  phone.addEventListener("change", plusK);
  go.classList.add("pre");

  let plan = [];
  function measure() {
    if (!go.classList.contains("pre")) return;
    const b = go.getBoundingClientRect(), small = icos[0].getBoundingClientRect().width;
    const big = phone.matches ? 48 : 64, step = big - (phone.matches ? 12 : 14), S = big / small, stepS = small * 0.78;
    const items = rowItems(), mid = (items.length - 1) / 2;
    const cy = b.top + b.height / 2 - (phone.matches ? 8 : 12);
    const r0 = icos[0].getBoundingClientRect(), x0 = r0.left + r0.width / 2;
    plan = items.map((idx, j) => {
      const r = icos[idx].getBoundingClientRect(), cx = r.left + r.width / 2, ry = r.top + r.height / 2;
      const dx = b.left + b.width / 2 + (mid - j) * step - cx, dy = cy - ry;
      const mx = x0 - j * stepS - cx;
      const stays = idx < keep() || idx === more;
      return {
        idx, d: Math.abs(j - mid), stays,
        appear: `translate(${(dx + (mid - j) * 30).toFixed(1)}px,${dy.toFixed(1)}px) scale(${(S * 0.8).toFixed(3)})`,
        big: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${S.toFixed(3)})`,
        small: `translate(${mx.toFixed(1)}px,0px) scale(1)`,
        end: stays ? "none" : `translate(${mx.toFixed(1)}px,0px) scale(.6)`,
      };
    });
  }
  measure();
  new ResizeObserver(measure).observe(go);
  if (document.fonts) document.fonts.ready.then(measure);

  const E = "cubic-bezier(.2,.8,.2,1)", EVEN = "cubic-bezier(.65,0,.35,1)", SPRING = "cubic-bezier(.2,.9,.25,1.06)";
  const IN = 620, STAGGER = 55, HOLD_TO = 1300, LAND = 2050, T = 2550;
  const enter = () => {
    plan.forEach((p) => {
      const d = p.d * STAGGER;
      ins[p.idx].animate([
        { transform: p.appear, opacity: 0 },
        { transform: p.appear, opacity: 0, offset: d / T, easing: E },
        { transform: p.big, opacity: 1, offset: (d + IN) / T },
        { transform: p.big, opacity: 1, offset: HOLD_TO / T, easing: EVEN },
        { transform: p.small, opacity: 1, offset: LAND / T, easing: E },
        { transform: p.end, opacity: p.stays ? 1 : 0 },
      ], { duration: T, fill: "backwards" });
    });
    words.animate([{ opacity: 0, transform: "translateX(8px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: LAND + 120, easing: E, fill: "backwards" });
    arrow.animate([{ opacity: 0, transform: "translateX(8px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: LAND + 280, easing: SPRING, fill: "backwards" });
    go.classList.remove("pre");
    go.classList.add("frame-wait");
    setTimeout(() => go.classList.remove("frame-wait"), LAND - 280);
  };

  const showing = POOL.slice(0, more);
  let next = more, place = 0;
  const roll = async () => {
    const n = keep(), i = place % n;
    place += 1;
    let k = POOL[next % POOL.length], tries = 0;
    while (showing.slice(0, n).includes(k) && tries < POOL.length) { next += 1; k = POOL[next % POOL.length]; tries += 1; }
    next += 1;
    const img = new Image(240, 240);
    img.alt = ""; img.decoding = "async"; img.src = src(k);
    try { await img.decode(); } catch (e) { return; }
    const box = faces[i], old = box.querySelector("img:last-of-type");
    box.append(img);
    img.animate([{ opacity: 0, transform: "translateY(-60%) scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 560, easing: SPRING, fill: "backwards" });
    if (old) old.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(60%) scale(.9)" }], { duration: 420, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" }).onfinish = () => old.remove();
    showing[i] = k;
  };
  let timer = 0, seen = false, inView = false;
  const loop = () => { clearTimeout(timer); if (inView) timer = setTimeout(() => { roll(); loop(); }, 2800); };
  new IntersectionObserver((l) => {
    inView = l[l.length - 1].isIntersecting;
    go.classList.toggle("beam", inView);
    if (inView && !seen) { seen = true; enter(); clearTimeout(timer); timer = setTimeout(loop, T); return; }
    loop();
  }, { threshold: 0.5 }).observe(go);
})();
