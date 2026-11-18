(() => {
  const SPEEDS = [25, 20];
  document.querySelectorAll(".wall").forEach((wall) => {
    const icons = (wall.dataset.icons || "").split(",").filter(Boolean);
    const rows = [...wall.querySelectorAll(".wall-row")];
    if (!icons.length || !rows.length) return;

    const sets = rows.map((_, r) => icons.filter((_, i) => i % rows.length === r));
    const build = () => {
      const width = wall.clientWidth;
      const step = parseFloat(getComputedStyle(wall).getPropertyValue("--icon")) + parseFloat(getComputedStyle(wall).getPropertyValue("--gap"));
      rows.forEach((row) => {
        const r = +row.dataset.set, set = sets[r % sets.length], setWidth = set.length * step;
        const copies = Math.ceil(width / setWidth) + 1;
        const html = Array.from({ length: copies }, () => set.map((e) => { const [src, t, c] = e.split("|"); return `<span class="wi"><img src="${src}" alt="" width="76" height="76" decoding="async" loading="lazy">${t ? `<i class="stk ${c}">${t}</i>` : ""}</span>`; }).join("")).join("");
        row.querySelectorAll(".wall-track").forEach((track) => {
          if (track.dataset.width === String(width)) return;
          track.dataset.width = width;
          track.innerHTML = html;
          track.style.setProperty("--shift", `${-setWidth}px`);
          track.style.setProperty("--dur", `${(setWidth / SPEEDS[r % SPEEDS.length]).toFixed(2)}s`);
        });
      });
    };
    build();
    new ResizeObserver(build).observe(wall);
    new IntersectionObserver((list) => {
      wall.classList.toggle("idle", !list[list.length - 1].isIntersecting);
    }).observe(wall);
  });
})();
