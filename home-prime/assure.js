(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const paths = $$(".as-path").map((p) => ({
    p, steps: $$(".as-step", p), nodes: $$(".as-node", p), track: p.querySelector(".as-track"), fill: p.querySelector(".as-fill"),

    blocks: $$("[data-light]", p).map((b) => ({ b, w: $$(".w", b), k: -1 })),
    t0: 0, h: 0, at: [], u: null, near: false,
  }));
  if (!paths.length) return;

  const measure = () => paths.forEach((q) => {
    const top = q.p.getBoundingClientRect().top;
    const mid = q.nodes.map((n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2 - top; });
    q.t0 = mid[0];
    q.h = mid[mid.length - 1] - mid[0];
    q.at = mid.map((y) => y - mid[0]);
    for (const el of [q.track, q.fill]) { el.style.top = `${q.t0}px`; el.style.height = `${q.h}px`; }
    q.u = null;
  });

  let again = measure;
  addEventListener("resize", () => again());
  const ro = new ResizeObserver(() => again());
  paths.forEach((q) => ro.observe(q.p));
  if (document.fonts) document.fonts.ready.then(() => again());

  if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
    measure();
    paths.forEach((q) => { q.fill.style.transform = "scaleY(1)"; q.steps.forEach((st) => st.classList.add("reached")); });
    return;
  }

  paths.forEach((q) => q.p.classList.add("as-live"));

  let queued = false;
  const frame = () => {
    queued = false;
    const vh = innerHeight;
    const live = paths.filter((q) => q.near);
    const reads = live.map((q) => ({
      u: Math.round(0.6 * vh - q.p.getBoundingClientRect().top - q.t0),
      ks: q.blocks.map((s) => {
        const p = (0.85 * vh - s.b.getBoundingClientRect().top) / (0.4 * vh);
        return Math.round(Math.min(1, Math.max(0, p)) * s.w.length);
      }),
    }));
    live.forEach((q, i) => {
      const { ks } = reads[i];
      q.blocks.forEach((s, j) => {
        if (ks[j] === s.k) return;
        s.w.forEach((w, n) => w.classList.toggle("on", n < ks[j]));
        s.b.classList.toggle("done", ks[j] === s.w.length);
        s.k = ks[j];
      });
      const u = Math.min(Math.max(reads[i].u, -1), q.h + 1);
      if (u === q.u) return;
      q.fill.style.transform = `scaleY(${(q.h ? Math.min(1, Math.max(0, u / q.h)) : 0).toFixed(4)})`;
      q.steps.forEach((st, j) => st.classList.toggle("reached", u >= q.at[j]));
      q.u = u;
    });
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  again = () => { measure(); ask(); };

  const io = new IntersectionObserver((seen) => seen.forEach((e) => {
    const q = paths.find((x) => x.p === e.target);
    q.near = e.isIntersecting;
    if (!q.near) { q.near = true; frame(); q.near = false; } else ask();
  }), { rootMargin: "100% 0px" });
  paths.forEach((q) => io.observe(q.p));
  addEventListener("scroll", () => { if (paths.some((q) => q.near)) ask(); }, { passive: true });
  measure();
})();
