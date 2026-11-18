(() => {
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const NUMBERS = [2, 3, 4], FIRST = 750, EVERY = 1000, WAVE = 18;
  const place = (el, slot) => {

    el.style.setProperty("--x", `${(3 - (slot % 4)) * 64}px`);
    el.style.setProperty("--y", `${Math.floor(slot / 4) * 79}px`);
  };

  document.querySelectorAll(".dup").forEach((scene) => {
    const grid = scene.querySelector(".dup-grid"), app = scene.querySelector(".dup-app");
    const tiles = [...scene.querySelectorAll(".dup-ph")];
    const name = app.dataset.name, src = app.querySelector("img").getAttribute("src");
    let timers = [], made = 0, played = false;

    const settle = (copies) => {

      timers.forEach(clearTimeout);
      timers = [];
      scene.classList.add("still");
      scene.querySelectorAll(".dup-copy").forEach((c) => c.remove());
      place(app, 0);
      tiles.forEach((t, i) => { t.style.transitionDelay = "0s"; place(t, i + 1 + copies); });
      for (let k = 0; k < copies; k++) grid.insertBefore(copy(k, true), app);
      made = copies;
      void scene.offsetWidth;
      scene.classList.remove("still");
    };
    const copy = (k, still) => {
      const el = document.createElement("figure");
      el.className = "dup-i dup-copy" + (still ? " out" : "");
      el.innerHTML = `<img src="${src}" alt="" width="48" height="48"><figcaption><i></i><span>${name} ${NUMBERS[k]}</span></figcaption>`;
      place(el, still ? k + 1 : 0);
      return el;
    };
    const step = () => {
      const k = made++;
      const el = copy(k, false);
      grid.insertBefore(el, app);
      void el.offsetWidth;
      el.classList.add("out");
      place(el, k + 1);
      tiles.forEach((t, i) => { t.style.transitionDelay = `${i * WAVE}ms`; place(t, i + 1 + made); });
    };
    const play = () => {
      settle(0);
      void scene.offsetWidth;
      NUMBERS.forEach((_, k) => timers.push(setTimeout(step, FIRST + k * EVERY)));
    };

    if (calm) { settle(NUMBERS.length); return; }
    settle(0);
    new IntersectionObserver((list) => {
      const e = list[list.length - 1];
      if (e.intersectionRatio >= 0.5 && !played) { played = true; play(); }

      else if (!e.isIntersecting && played) { played = false; settle(0); }
    }, { threshold: [0, 0.5] }).observe(scene);
    scene.addEventListener("click", play);
  });
})();
