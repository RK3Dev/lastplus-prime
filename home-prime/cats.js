(() => {

  const CATS = [
    ["التواصل الاجتماعي", "message.fill", "#007AFF", 23, 19],
    ["رسم وتصاميم", "paintbrush.fill", "#A2845E", 22, 24],
    ["صور وفيديو", "camera.fill", "#FF3B30", 25, 19],
    ["ترفيه", "play.rectangle.fill", "#AF52DE", 24, 19],
    ["أفلام ومسلسلات", "film.fill", "#AF52DE", 24, 19],
    ["أدوات", "wrench.fill", "#8E8E93", 23, 24],
    ["إنتاجية", "briefcase.fill", "#FF9500", 24, 20],
    ["تعليم", "graduationcap.fill", "#5856D6", 27, 24],
    ["تطبيقات إسلامية", "moon.stars.fill", "#00C7BE", 19, 21],
    ["سفر", "airplane", "#00C7BE", 21, 20],
    ["موسيقى", "music.note", "#FF2D55", 15, 20],
    ["صحة ولياقة", "heart.fill", "#FF3B30", 21, 19],
    ["ألعاب", "gamecontroller.fill", "#FF2D55", 28, 19],
    ["رياضة", "sportscourt.fill", "#FF9500", 27, 19],
    ["نمط حياة", "leaf.fill", "#34C759", 21, 19],
    ["أعمال", "building.2.fill", "#5856D6", 21, 25],
    ["مَراجع", "text.book.closed.fill", "#6D6D70", 18, 21],
    ["خدمات مالية", "dollarsign.circle.fill", "#34C759", 20, 20],
    ["أدوات التطوير", "hammer.fill", "#007AFF", 24, 23],
    ["طقس", "cloud.sun.fill", "#00C7BE", 26, 21],
    ["تنقّل ومواصلات", "map.fill", "#007AFF", 22, 20],
    ["كتب", "books.vertical.fill", "#AF52DE", 24, 22],
    ["طب", "cross.fill", "#FF3B30", 22, 21],
    ["أخبار", "newspaper.fill", "#FF9500", 23, 21],
    ["أخرى", "square.grid.2x2.fill", "#8E8E93", 20, 19],
  ];
  const SF = new URL("cats/sf/", document.currentScript.src).href;
  const SPEED = 20;
  const HEAD = 0.2;

  const WIDE = 380;

  const threesAndTwos = (w, room, gap, desc, size, first, inRow) => {
    const n = w.length;
    if (n % 5) return null;
    const a = n / 5, long = w[desc[Math.max(0, Math.floor(n / 4) - 1)]];
    const total = w.reduce((s, v) => s + v, 0) + gap * 3 * a, avg = total / (2 * a), D = Math.round(avg * 0.15);
    const T3 = avg + D / 2, T2 = avg - D / 2, max = room * 0.94;
    const twos = desc.slice(0, a).map((i) => [i]), rest = desc.slice(a).reverse();
    for (const r of twos) r.push(rest.shift());
    const threes = Array.from({ length: a }, () => []);
    for (const i of rest.reverse()) threes.filter((r) => r.length < 3).sort((x, y) => size(x) - size(y))[0].push(i);
    const rows = [...twos, ...threes];
    const cost = () => {
      let c = 0;
      for (const r of rows) {
        const s = size(r);
        c += (s - (r.length === 3 ? T3 : T2)) ** 2;
        if (s > max) c += 1e9;
        if (r.filter((i) => w[i] >= long).length > 1) c += 1e9;
      }
      return c;
    };
    let best = cost(), better = true, guard = 0;
    while (better && guard++ < 300) {
      better = false;
      for (let x = 0; x < rows.length; x++) for (let y = x + 1; y < rows.length; y++) for (let i = 0; i < rows[x].length; i++) for (let k = 0; k < rows[y].length; k++) {
        [rows[x][i], rows[y][k]] = [rows[y][k], rows[x][i]];
        const c = cost();
        if (c < best - 1e-6) { best = c; better = true; } else [rows[x][i], rows[y][k]] = [rows[y][k], rows[x][i]];
      }
    }
    if (rows.some((r) => size(r) > max || r.filter((i) => w[i] >= long).length > 1)) return null;

    const t2 = rows.slice(0, a).sort(first), t3 = rows.slice(a).sort(first);
    const [lead, other] = Math.min(...t2.flat()) < Math.min(...t3.flat()) ? [t2, t3] : [t3, t2], out = [];
    for (let i = 0; i < a; i++) out.push(lead[i], other[i]);
    let twosSoFar = 0;
    return out.map((r) => { const row = inRow(r); return row.length === 2 && twosSoFar++ % 2 ? row.reverse() : row; });
  };
  const compose = (w, room, gap) => {
    const n = w.length, desc = [...w.keys()].sort((a, b) => w[b] - w[a] || a - b);
    const size = (row) => row.reduce((s, i) => s + w[i], 0) + gap * (row.length - 1);
    const first = (a, b) => Math.min(...a) - Math.min(...b);
    const inRow = (r) => { const s = [...r].sort((a, b) => w[b] - w[a]); return s.length === 3 ? [s[1], s[0], s[2]] : s; };
    const kw = 3, kn = 2, P = Math.floor(n / (kw + kn));
    if (P >= 1 && room >= WIDE) {
      const wide = desc.slice(0, P).map((a) => [a]), narrow = desc.slice(P, 2 * P).map((a) => [a]);
      const fillers = desc.slice(2 * P).reverse();
      let f = 0;
      const give = (rows, cap) => { const r = rows.filter((x) => x.length < cap).sort((a, b) => size(a) - size(b))[0]; r.push(fillers[f++]); };
      for (let k = 0; k < P * (kw - 1); k++) give(wide, kw);
      for (let k = 0; k < P * (kn - 1); k++) give(narrow, kn);
      while (f < fillers.length) {
        const r = wide.filter((x) => size(x) + gap + w[fillers[f]] <= room).sort((a, b) => size(a) - size(b))[0];
        if (r) r.push(fillers[f++]); else give(narrow, Infinity);
      }
      if (!wide.some((r) => size(r) > room) && !narrow.some((r) => size(r) > room)) {
        return wide.map((r, i) => [r, narrow[i]]).sort((a, b) => first(a.flat(), b.flat())).flat().map(inRow);
      }
    }

    const tt = threesAndTwos(w, room, gap, desc, size, first, inRow);
    if (tt) return tt;

    const up = [...w.keys()].sort((a, b) => w[a] - w[b] || a - b);
    const trio = n % 2 ? up.slice(0, 3) : null, rest = trio ? up.slice(3) : up, m = rest.length / 2;
    const rows = m + (trio ? 1 : 0), aCount = Math.ceil(rows / 2) - (trio ? 1 : 0);
    const total = rest.reduce((s, i) => s + w[i], 0) + gap * m, D = Math.round((total / m) * 0.18);
    const b = (total - aCount * D) / m, a = b + D;
    const long = w[desc[Math.max(0, Math.floor(n / 4) - 1)]];
    const pairs = [];
    for (let i = 0; i < m; i++) pairs.push([rest[rest.length - 1 - i], rest[i]]);
    const cost = () => {
      let c = 0;
      pairs.map(size).sort((x, y) => y - x).forEach((v, k) => { c += (v - (k < aCount ? a : b)) ** 2; if (v > room) c += 1e9; });
      pairs.forEach((q) => { if (w[q[0]] >= long && w[q[1]] >= long) c += 1e7; });
      return c;
    };
    let best = cost(), better = true, guard = 0;
    while (better && guard++ < 300) {
      better = false;
      for (let x = 0; x < m; x++) for (let y = x + 1; y < m; y++) for (const i of [0, 1]) for (const k of [0, 1]) {
        [pairs[x][i], pairs[y][k]] = [pairs[y][k], pairs[x][i]];
        const c = cost();
        if (c < best - 1e-6) { best = c; better = true; } else [pairs[x][i], pairs[y][k]] = [pairs[y][k], pairs[x][i]];
      }
    }
    if (pairs.some((q) => size(q) > room) || (trio && size(trio) > room)) return null;
    const bySize = [...pairs].sort((p, q) => size(q) - size(p));
    const longer = bySize.slice(0, aCount).concat(trio ? [trio] : []).sort(first), shorter = bySize.slice(aCount).sort(first), out = [];
    for (let i = 0; i < Math.max(longer.length, shorter.length); i++) { if (longer[i]) out.push(longer[i]); if (shorter[i]) out.push(shorter[i]); }
    return out.map((r, k) => { const row = inRow(r); return row.length === 2 && k % 2 ? row.reverse() : row; });
  };

  document.querySelectorAll(".cx").forEach((view) => {
    const balanced = view.dataset.arrange === "balanced";
    const chip = ([name, sym, colour, w, h], k) => {
      const c = document.createElement("span");
      c.className = "cx-chip";
      c.dataset.k = k;
      const i = document.createElement("i");
      i.style.cssText = `--w:${w}px;--h:${h}px;--c:${colour}`;
      i.style.webkitMaskImage = i.style.maskImage = `url("${SF}${sym}.png")`;
      const b = document.createElement("b");
      b.textContent = name;
      c.append(i, b);
      return c;
    };
    const track = document.createElement("div");
    track.className = "cx-track";
    const list = document.createElement("div");
    list.className = "cx-set";
    CATS.forEach((cat, k) => list.append(chip(cat, k)));

    const arrange = () => {
      const chips = [...list.querySelectorAll(".cx-chip")].sort((a, b) => a.dataset.k - b.dataset.k);
      list.replaceChildren(...chips);
      const cs = getComputedStyle(list), room = list.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const rows = compose(chips.map((c) => c.offsetWidth), room, parseFloat(cs.columnGap) || 10);

      list.classList.toggle("cx-flow", !rows);
      if (!rows) return;
      list.replaceChildren(...rows.map((r) => {
        const row = document.createElement("div");
        row.className = "cx-row";
        r.forEach((i) => row.append(chips[i]));
        return row;
      }));
    };
    track.append(list);
    view.append(track);
    let built = "";
    const build = () => {
      const key = `${view.clientWidth}x${view.clientHeight}`;
      if (key === built) return;
      built = key;
      track.querySelectorAll(".cx-set + .cx-set").forEach((copy) => copy.remove());
      if (balanced) arrange();
      const h = list.getBoundingClientRect().height;
      for (let n = Math.ceil(view.clientHeight / h); n > 0; n--) track.append(list.cloneNode(true));
      const dur = h / SPEED, lead = view.clientHeight * HEAD;

      const into = Math.max(0, 1 - lead / h);
      track.style.setProperty("--shift", `${-h}px`);
      track.style.setProperty("--dur", `${dur.toFixed(3)}s`);
      track.style.setProperty("--delay", `${(-into * dur).toFixed(3)}s`);
    };

    document.fonts.ready.then(() => { build(); new ResizeObserver(build).observe(view); });
    new IntersectionObserver((seen) => {
      view.classList.toggle("idle", !seen[seen.length - 1].isIntersecting);
    }).observe(view);
  });
})();
