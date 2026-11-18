(() => {
  const root = document.getElementById("s4");
  if (!root) return;
  const stage = root.querySelector(".s3-stage"), sol = root.closest(".pf-sol");
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const STAY = 6000, FILL = 1000, AFTER_PICK = 9000;
  root.style.setProperty("--stay", `${STAY}ms`);
  stage.style.setProperty("--fill", `${FILL}ms`);
  const nodes = [...stage.querySelectorAll(".s3-node")], items = [...root.querySelectorAll(".s4-item")];

  items.forEach((it, k) => it.style.setProperty("--i", k));
  const coreEl = stage.querySelector(".s3-core");
  const wrap = document.createElement("div");
  wrap.className = "s5-dashes";
  stage.insertBefore(wrap, coreEl);

  const solid = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  solid.setAttribute("class", "s5-solid");
  solid.setAttribute("aria-hidden", "true");
  stage.insertBefore(solid, coreEl);
  const R = 236, C = 300;
  const ang = (i) => ((-90 + i * 60) * Math.PI) / 180;
  nodes.forEach((n, i) => {
    n.style.setProperty("--x", `${((C + R * Math.cos(ang(i))) / 6).toFixed(3)}%`);
    n.style.setProperty("--y", `${((C + R * Math.sin(ang(i))) / 6).toFixed(3)}%`);
    n.classList.toggle("up", Math.sin(ang(i)) < -0.1);
  });

  const reach = (f) => {
    let lo = 0, hi = 1;
    for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (3 * m * m - 2 * m * m * m < f) lo = m; else hi = m; }
    const u = (lo + hi) / 2, v = 1 - u;
    return 3 * v * v * u * 0.4 + 3 * v * u * u * 0.2 + u * u * u;
  };

  let cur = -1, timer = 0, arrive = 0, live = false, waitUntil = 0, laidW = 0;

  function draw() {
    const W = stage.clientWidth;
    if (!W || W === laidW) return;
    laidW = W;
    const s = W / 600, perPx = 600 / W, gap = W < 420 ? 9 : 10;
    const tile = nodes[0].querySelector("b").offsetWidth, core = coreEl.offsetWidth;
    const r0 = R - (tile / 2 + 10) * perPx, r1 = (core / 2 + 12) * perPx, rc = (r0 + r1) / 2;
    const pt = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    let curves = "", dashes = "";
    nodes.forEach((_, i) => {
      const a = ang(i), on = i === cur;
      const P = [[r0, a], [rc, a + 0.42], [r1, a]].map(([r, q]) => [(C + r * Math.cos(q)) * s, (C + r * Math.sin(q)) * s]);
      curves += `<path${on ? ' class="on"' : ""} pathLength="1" d="M ${pt(P[0])} Q ${pt(P[1])} ${pt(P[2])}"/>`;
      const at = (u) => [0, 1].map((c) => (1 - u) * (1 - u) * P[0][c] + 2 * (1 - u) * u * P[1][c] + u * u * P[2][c]);
      const slope = (u) => [0, 1].map((c) => 2 * (1 - u) * (P[1][c] - P[0][c]) + 2 * u * (P[2][c] - P[1][c]));
      const M = 160, table = [{ u: 0, len: 0 }];
      let len = 0, prev = at(0);
      for (let j = 1; j <= M; j++) { const u = j / M, p = at(u); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); table.push({ u, len }); prev = p; }
      const n = Math.max(3, Math.floor(len / gap));
      let html = "";
      for (let d = 0; d < n; d++) {
        const want = ((d + 0.5) * len) / n;
        let j = 1;
        while (j < M && table[j].len < want) j++;
        const A = table[j - 1], B = table[j], u = A.u + ((B.u - A.u) * (want - A.len)) / Math.max(1e-6, B.len - A.len);
        const [x, y] = at(u), [dx, dy] = slope(u), f = want / len;
        const rgb = [255 + (127 - 255) * f, 255 + (176 - 255) * f, 255].map(Math.round).join(",");
        html += `<i class="s5-d" style="--x:${x.toFixed(2)}px;--y:${y.toFixed(2)}px;--a:${((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1)}deg;--c:rgba(${rgb},${(0.16 + 0.22 * f).toFixed(3)});--dl:${Math.round(reach(f) * FILL)}ms"></i>`;
      }
      dashes += `<div class="s5-line${on ? " on" : ""}" data-k="${i}">${html}</div>`;
    });
    solid.innerHTML = curves;
    wrap.innerHTML = dashes;
  }
  draw();
  new ResizeObserver(draw).observe(stage);

  function light(i) {
    const lines = [...wrap.children], curves = [...solid.children], line = lines[i], curve = curves[i];
    lines.forEach((l) => l.classList.remove("on"));
    curves.forEach((c) => c.classList.remove("on"));
    if (!line || !curve) return;
    line.classList.add("reset");
    curve.classList.add("reset");

    void getComputedStyle(curve).opacity;
    line.classList.remove("reset");
    curve.classList.remove("reset");
    line.classList.add("on");
    curve.classList.add("on");
  }
  function go(i) {
    clearTimeout(timer);
    clearTimeout(arrive);
    const again = i === cur;
    cur = i;
    nodes.forEach((n, j) => n.classList.toggle("on", j === i));

    items.forEach((it, j) => { it.classList.toggle("on", j === i); it.classList.toggle("after", j > i); it.querySelector(".s4-row").setAttribute("aria-expanded", String(j === i)); });
    if (again) items[i].querySelector(".s4-bar").getAnimations().forEach((a) => { a.currentTime = 0; });
    light(i);
    sol.classList.remove("ready");
    if (calm) { sol.classList.add("ready"); return; }
    arrive = setTimeout(() => sol.classList.add("ready"), FILL - 50);
    plan();
  }
  function plan() {
    clearTimeout(timer);
    root.classList.toggle("run", live && !calm);
    if (calm || !live) return;
    timer = setTimeout(() => go((cur + 1) % items.length), Math.max(STAY, waitUntil - performance.now()));
  }
  const pick = (i) => { waitUntil = performance.now() + AFTER_PICK; go(i); };
  items.forEach((it, i) => it.querySelector(".s4-row").addEventListener("click", () => pick(i)));
  nodes.forEach((n, i) => n.addEventListener("click", () => pick(i)));

  go(0);
  new IntersectionObserver((list) => {
    const on = list[list.length - 1].isIntersecting;
    if (on === live) return;
    live = on;
    if (on) go(Math.max(0, cur));
    else { clearTimeout(timer); clearTimeout(arrive); root.classList.remove("run"); }
  }, { rootMargin: "-15% 0px" }).observe(root);
})();
