(() => {
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const LINK = "https://example.com/app.ipa", TO_LINK = 1600, TYPE_AT = TO_LINK + 1000, PER_CHAR = 42;
  const typed = TYPE_AT + LINK.length * PER_CHAR;

  const AT = { focus: TO_LINK + 650, card: typed + 350, sign: typed + 1450, done: typed + 3850 };
  const ALL = ["s-file", "s-focus", "typed", "s-card", "s-on", "s-sign", "s-done", "s-check"];
  const C = 2 * Math.PI * 16, QUARTER = 0.25, CLOSING = 350, PER_TURN = 1000;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  document.querySelectorAll(".sx").forEach((scene) => {
    const url = scene.querySelector(".sx-url");
    const arc = scene.querySelector(".sx-ring .arc");
    let timers = [], played = false, raf = 0;

    const setArc = (tail, length) => {
      arc.setAttribute("transform", `rotate(${tail - 90} 16 16)`);
      arc.style.strokeDasharray = `${(length * C).toFixed(3)} ${C.toFixed(3)}`;
    };

    const turn = () => {
      const start = performance.now();
      let closeAt = 0, closeTail = 0;
      const frame = (now) => {
        if (scene.classList.contains("s-done") && !closeAt) {
          closeAt = now;
          closeTail = (((now - start) / PER_TURN) * 360) % 360;
        }
        if (closeAt) {
          const t = Math.min((now - closeAt) / CLOSING, 1);
          setArc(closeTail, QUARTER + (1 - QUARTER) * easeInOut(t));
          if (t >= 1) { scene.classList.add("s-check"); raf = 0; return; }
        } else {
          setArc((((now - start) / PER_TURN) * 360) % 360, QUARTER);
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    const settle = (end) => {
      timers.forEach(clearTimeout);
      timers = [];
      cancelAnimationFrame(raf);
      raf = 0;
      scene.classList.add("still");
      scene.classList.remove(...ALL);
      url.textContent = end ? LINK : "";
      if (end) { scene.classList.add("typed", "s-card", "s-sign", "s-done", "s-check"); setArc(0, 1); }
      else { scene.classList.add("s-file"); setArc(0, QUARTER); }
      void scene.offsetWidth;
      scene.classList.remove("still");
    };
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const play = () => {
      settle(false);
      at(TO_LINK, () => scene.classList.remove("s-file"));
      at(AT.focus, () => scene.classList.add("s-focus"));
      for (let i = 1; i <= LINK.length; i++) at(TYPE_AT + i * PER_CHAR, () => { url.textContent = LINK.slice(0, i); scene.classList.add("typed"); });
      at(AT.card, () => { scene.classList.remove("s-focus"); scene.classList.add("s-card", "s-on"); });
      at(AT.sign, () => { scene.classList.remove("s-on"); scene.classList.add("s-sign"); turn(); });
      at(AT.done, () => scene.classList.add("s-done"));
    };
    if (calm) { settle(true); return; }
    new IntersectionObserver((list) => {
      const e = list[list.length - 1];
      if (e.intersectionRatio >= 0.5 && !played) { played = true; play(); }
      else if (!e.isIntersecting && played) { played = false; settle(false); }
    }, { threshold: [0, 0.5] }).observe(scene);
    scene.addEventListener("click", play);
  });
})();
