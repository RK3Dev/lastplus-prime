(() => {
  document.querySelectorAll(".pl2").forEach((box) => {
    const seg = box.querySelector(".pl2-seg"), opts = [...seg.querySelectorAll("button")], ones = [...box.querySelectorAll(".pl2-one")];
    const go = box.querySelector(".pr-btn");
    const pick = (k, focus) => {
      opts.forEach((b, i) => { b.setAttribute("aria-checked", String(i === k)); b.tabIndex = i === k ? 0 : -1; });
      ones.forEach((o, i) => (o.hidden = i !== k));
      seg.style.setProperty("--k", k);
      if (go && ones[k].dataset.href) go.href = ones[k].dataset.href;
      if (focus) opts[k].focus();
    };
    opts.forEach((b, i) => b.addEventListener("click", () => pick(i)));
    seg.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const k = opts.findIndex((b) => b.getAttribute("aria-checked") === "true");
      pick((k + 1) % opts.length, true);
    });
    pick(0);
  });
})();
