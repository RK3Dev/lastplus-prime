(() => {
  const root = document.getElementById("hp") || document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const q = new URLSearchParams(location.search);

  const LOOKS = [
    { keepPlate: true, plateColor: "#F3F1FC", logoColor: "#0D0C12", finalScale: 1 },
    { keepPlate: true, plateColor: "#654FE6", logoColor: "#FFFFFF", finalScale: 1, logo: "home-lux/logo/mark-wink.svg", logoScale: 1.05 },
    { keepPlate: false, plateColor: "#08070D", logoColor: "#F3F1FC", finalScale: 1.25 },
  ];
  const end = $("#end"), glass = $("#glass"), icon = $("#icon");

  let v = clamp(Math.round(+q.get("v") || +end.dataset.v) || 1, 1, 3);
  const reveal = window.GlassReveal && GlassReveal.mount(glass, {
    logo: "home-lux/logo/mark.svg", look: "dark", background: "#09080E", tileSize: 204, logoScale: 0.725, iconPlate: true, glide: 1.8, present: 0.7, ...LOOKS[v - 1],

    icon: "home-lux-end/lastplus-icon.webp", corner: 4.3, landOn: 1, land: { ground: [1.35, 2], mark: [1.85, 2.5] },
    ...(q.get("land") === "0" ? { land: null } : {}),
  });
  if (!reveal) {
    glass.hidden = true;
    const real = new Image();
    real.className = "en-real"; real.alt = ""; real.src = "home-lux-end/lastplus-icon.webp";
    glass.after(real);
  }
  const leaner = reveal ? glass : $(".en-real");

  let goal = [0, 0], now = [0, 0], raf = 0, stamp = 0;
  function tick(t) {
    raf = 0;
    const dt = Math.min(0.05, (t - stamp) / 1000 || 0.016), k = Math.min(1, dt * 6);
    stamp = t;
    now = [now[0] + (goal[0] - now[0]) * k, now[1] + (goal[1] - now[1]) * k];
    leaner.style.setProperty("--ry", `${(now[0] * 9).toFixed(2)}deg`);
    leaner.style.setProperty("--rx", `${(-now[1] * 9).toFixed(2)}deg`);
    leaner.style.setProperty("--gx", `${(-now[0] * 14).toFixed(1)}px`);
    leaner.style.setProperty("--gy", `${(-now[1] * 10).toFixed(1)}px`);
    if (Math.abs(goal[0] - now[0]) + Math.abs(goal[1] - now[1]) > 0.002) wake();
  }
  function wake() { if (!raf) { stamp = stamp || performance.now(); raf = requestAnimationFrame(tick); } }

  if (!calm) {
    end.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = leaner.getBoundingClientRect(), reach = Math.max(320, r.width * 1.3);
      goal = [clamp((e.clientX - (r.left + r.width / 2)) / reach, -1, 1), clamp((e.clientY - (r.top + r.height / 2)) / reach, -1, 1)];
      wake();
    });
    end.addEventListener("pointerleave", () => { goal = [0, 0]; wake(); });
  }
  if (reveal) glass.addEventListener("click", () => reveal.replay());

  const frame = end.closest(".framed");
  if (frame) {
    const size = () => frame.style.setProperty("--en-h", `${end.offsetHeight}px`);
    size();
    new ResizeObserver(size).observe(end);
  }

  if (reveal && q.has("t")) reveal.seek(+q.get("t"));

  if (!$("#labV")) return;

  const seen = new IntersectionObserver((list) => list.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  $$(".rv").forEach((el) => seen.observe(el));

  const NAMES = ["الأيقونة كما في الجوال", "الأيقونة الداكنة", "الشعار وحده"];
  function setVariant(n, again) {
    v = clamp(Math.round(n) || 1, 1, 3);
    end.dataset.v = v;
    $("#labName").textContent = NAMES[v - 1];
    $$("#labV button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === v)));
    if (reveal && again) { reveal.set(LOOKS[v - 1]); reveal.replay(); }
    try { const u = new URL(location); u.searchParams.set("v", v); history.replaceState(null, "", u); } catch (e) {   }
  }
  $("#labV").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setVariant(+b.dataset.v, true); });

  function setFoot(n) {
    const f = clamp(Math.round(n) || 4, 1, 4);
    $("#foot").dataset.k = f === 4 ? "o" : "z";
    if (f < 4) $("#fz").dataset.f = f;
    $$("#labF button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.f === f)));
    try { const u = new URL(location); u.searchParams.set("f", f); history.replaceState(null, "", u); } catch (e) {   }
  }
  $("#labF").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setFoot(+b.dataset.f); });
  setFoot(+q.get("f") || 4);
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const n = +e.key;
    if (n >= 1 && n <= 3) setVariant(n, true);
  });
  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
  root.dataset.theme = "dark";
  setVariant(v, false);
})();
