(() => {
  const d = document, w = window;
  const st = d.createElement("style");
  st.textContent = "html,body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}img,svg,canvas,video{-webkit-user-drag:none;user-drag:none}";
  d.head.appendChild(st);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
  ["contextmenu", "copy", "cut", "selectstart", "dragstart"].forEach((t) => d.addEventListener(t, stop, true));
  d.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase(), m = e.ctrlKey || e.metaKey;
    if (k === "f12" || (m && e.shiftKey && "ijc".includes(k)) || (e.metaKey && e.altKey && "ijcu".includes(k)) || (m && "usp".includes(k) && !e.shiftKey)) stop(e);
  }, true);
  let gone = false;
  const wipe = () => {
    if (gone) return; gone = true;
    try { d.documentElement.innerHTML = ""; } catch (e) {}
    try { (w.top || w).location.replace("https://last-plus.com/"); } catch (e) { w.location.replace("https://last-plus.com/"); }
  };
  const probe = new Function("debugger");
  setInterval(() => { const t = performance.now(); probe(); if (performance.now() - t > 120) wipe(); }, 1200);
})();
