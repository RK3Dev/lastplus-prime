(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const CHECK = '<svg viewBox="0 0 24 24" class="i" aria-hidden="true" style="stroke-width:2.4"><path d="M20 6 9 17l-5-5"/></svg>';
  const RING = '<svg class="spin" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="rgba(171,159,242,.22)" stroke-width="2.5"/><path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" stroke="#C4BBF7" stroke-width="2.5" stroke-linecap="round"/></svg>';

  const APPS = [
    { name: "سناب", icon: "snap", code: true, feats: ["حفظ السنابات والستوري", "مشاهدة الستوري بدون ما يبان اسمك", "إخفاء تنبيه لقطة الشاشة", "بدون إعلانات"] },
    { name: "انستقرام", icon: "insta", feats: ["حفظ الصور والريلز من أي حساب", "مشاهدة الستوري بدون ما يظهر اسمك", "إخفاء «جاري الكتابة»", "إبقاء الرسائل المحذوفة"] },
    { name: "واتساب", icon: "whatsapp", feats: ["إخفاء «متصل الآن» و«آخر ظهور»", "إخفاء علامة القراءة الزرقاء", "إبقاء الرسائل والحالات المحذوفة", "قفل التطبيق والمحادثات برمز"] },
    { name: "تيك توك", icon: "tiktok", feats: ["تحميل بدون العلامة المائية", "تغيير بلد المحتوى", "عدد المتابعين الدقيق", "بدون إعلانات"] },
    { name: "يوتيوب", icon: "youtube", feats: ["بدون إعلانات", "تشغيل في الخلفية والشاشة مقفلة", "تحميل الفيديو والشورتس"] },
    { name: "X", icon: "x", feats: ["تحميل الفيديو والصور بجودة عالية", "وقت التغريدة بالضبط", "قفل المحادثات", "بدون إعلانات"] },
    { name: "كملنا VIP", icon: "kammelna", feats: ["VIP كامل على حسابك", "لعب بلا حدود بدون انتظار", "فتح التعابير والدوريات", "بدون إعلانات"] },
    { name: "يودل", icon: "jodel", code: true, feats: ["رفع الصور من الألبوم وحفظها", "تغيير الموقع", "النسخ واللصق"] },
  ];
  const icon = (a) => `home-prime/icons/${a.icon}.jpg`;

  $$(".pf-card").forEach((c) => c.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  const countTo = (el) => {
    const to = +el.dataset.to, pre = el.dataset.pre || "";
    const fmt = (n) => pre + Math.round(n).toLocaleString("en-US");
    if (calm) { el.textContent = fmt(to); return; }
    const t0 = performance.now() + 200, dur = 1600;
    const step = (t) => { const k = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const scenes = new IntersectionObserver((list) => list.forEach((e) => {
    if (!e.isIntersecting) return;
    scenes.unobserve(e.target);
    e.target.classList.add("on");
    $$("[data-to]", e.target).forEach(countTo);
  }), { threshold: 0.5 });
  $$(".pf-scene").forEach((s) => scenes.observe(s));

  const dock = $("#pf-dock"), app = $("#pf-app");
  if (dock && app) {
    dock.innerHTML = APPS.map((a, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="${a.name}" data-i="${i}"><img src="${icon(a)}" alt="" width="144" height="144" loading="lazy" decoding="async"></button>`).join("");
    const show = (i) => {
      const a = APPS[i];
      $$("button", dock).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
      app.innerHTML = `<header><img class="pf-ico" src="${icon(a)}" alt="" width="144" height="144"><b>${a.name}</b>${a.code ? '<span class="pf-cap dim">يحتاج كود إضافي</span>' : ""}</header><ul>${a.feats.map((f, r) => `<li style="--r:${r}"><i>${CHECK}</i>${f}</li>`).join("")}</ul>`;
    };
    dock.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(+b.dataset.i); });
    show(0);
  }

  const KINDS = [
    { name: "السوشال", text: "نسخ من سناب وانستقرام وواتساب وتيك توك، فيها مزايا ما تلقاها في التطبيق الأصلي." },
    { name: "أفلام ومسلسلات", text: "تطبيقات تتابع فيها الأفلام والمسلسلات والأنمي." },
    { name: "ألعاب مفتوحة", text: "أكثر من 9 آلاف لعبة، منها براول ستارز وكلاش رويال، بمزايا مفتوحة." },
    { name: "تصميم وتصوير", text: "بيكس آرت ولايت روم وريميني، كل مزاياها مفتوحة بدون ما تدفع أو تشترك." },
    { name: "مدفوعة مجاناً", text: "أكثر من 1,100 تطبيق سعره مدفوع في الآب ستور، تنزّله مع اشتراكك." },
    { name: "محذوفة من الستور", text: "تطبيقات انحذفت من الآب ستور وما عاد تقدر تنزّلها منه، تلقاها عندنا." },
  ];

  const sol = $(".pf-sol"), say = $("#pf-say"), pulse = $(".pf-pulse");
  if (!sol || !say) return;
  const tiles = $$(".pf-kinds li", sol), wires = $$(".pf-wires .run g", sol);
  const mark = (k) => tiles[k].querySelector("svg").outerHTML;
  let turn = 0, phase = "", timer = 0, live = false;
  const restart = (el) => { el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; };
  const light = (k) => {
    tiles.forEach((t, i) => t.classList.toggle("on", i === k));
    wires.forEach((w, i) => w.classList.toggle("on", i === k));
  };
  function reading() {
    phase = "reading";
    const k = turn % KINDS.length;
    sol.classList.remove("ready");
    sol.classList.add("reading");
    light(k);
    $$("path", wires[k]).forEach(restart);
    say.innerHTML = `<div class="in">${RING}<p>من متجرنا إلى جوالك…</p></div>`;
  }
  function ready() {
    phase = "ready";
    const k = turn % KINDS.length;
    sol.classList.remove("reading");
    sol.classList.add("ready");
    if (pulse) restart(pulse);
    say.innerHTML = `<div class="in"><em>${mark(k)}</em><span><small>${KINDS[k].name}</small><p>${KINDS[k].text}</p></span></div>`;
  }
  function tick() {
    if (!live) return;
    if (phase === "reading") { ready(); timer = setTimeout(tick, 5000); }
    else { turn++; reading(); timer = setTimeout(tick, 2200); }
  }
  if (calm) { light(0); ready(); return; }
  new IntersectionObserver((list) => {
    const on = list[list.length - 1].isIntersecting;
    if (on === live) return;
    live = on;
    clearTimeout(timer);
    if (on) { reading(); timer = setTimeout(tick, 2200); }
    else { turn++; sol.classList.remove("reading", "ready"); light(-1); }
  }, { rootMargin: "-15% 0px" }).observe(sol);
})();
