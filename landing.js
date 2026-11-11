/* ScoutLink OC — landing page: interactive troop map + pilot decisions */
(function () {
  "use strict";
  const D = window.SL_DATA;
  const NS = "http://www.w3.org/2000/svg";

  const levelById = Object.fromEntries(D.LEVELS.map((l) => [l.id, l]));
  const suById = Object.fromEntries(D.SERVICE_UNITS.map((s) => [s.id, s]));
  const troopById = Object.fromEntries(D.TROOPS.map((t) => [t.id, t]));

  function el(name, attrs = {}, parent) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Closed Catmull-Rom spline through points -> cubic Bézier path
  function smoothClosed(pts) {
    const n = pts.length;
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d + "Z";
  }

  function curve(a, b, bend = 0.18) {
    const [x1, y1] = a, [x2, y2] = b;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const cx = mx - dy * bend, cy = my + dx * bend;
    return `M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`;
  }

  /* ---------- Map ---------- */
  const svg = document.getElementById("oc-map");
  const card = document.getElementById("map-card");

  if (svg && card) {
    // Stylized county outline: inland border along the top/right, coastline running NW→SE
    const outline = [
      [34, 150], [58, 72], [190, 50], [332, 38], [420, 118], [488, 190], [522, 282],
      [506, 404], [474, 492], [430, 474], [372, 436], [320, 404], [290, 376],
      [246, 322], [176, 272], [96, 212]
    ];

    const defs = el("defs", {}, svg);
    const mask = el("mask", { id: "trail-mask", maskUnits: "userSpaceOnUse", x: -40, y: 0, width: 600, height: 620 }, defs);
    el("rect", { x: -40, y: 0, width: 600, height: 620, fill: "#000" }, mask);

    // Sea waves
    const waves = [[40, 318], [150, 330], [-10, 250], [300, 470], [380, 520], [470, 560], [250, 560], [520, 600]];
    waves.forEach(([x, y]) => el("path", { class: "wave", d: `M${x},${y} q6,-5 12,0 t12,0 t12,0` }, svg));

    el("path", { class: "land", d: smoothClosed(outline) }, svg);

    // Hills in the northeast, drawn as two soft contour lines
    el("path", { class: "contour", d: "M408,170 C440,190 470,230 478,290 C484,330 476,360 468,380" }, svg);
    el("path", { class: "contour", d: "M392,196 C420,214 444,250 450,296 C454,326 448,350 440,366" }, svg);

    // Region labels
    [["North OC", 372, 78], ["Central OC", 352, 184], ["South OC", 470, 462]].forEach(([t, x, y]) => {
      const label = el("text", { class: "region", x, y, "text-anchor": "middle" }, svg);
      label.textContent = t;
    });
    const sea = el("text", { class: "region region-sea", x: 92, y: 286, "text-anchor": "middle" }, svg);
    sea.textContent = "Coastal OC";

    // Trails (dashed), revealed by a mask that draws in once
    const trails = el("g", { mask: "url(#trail-mask)", "aria-hidden": "true" }, svg);
    D.TRAILS.forEach(([a, b], i) => {
      const d = curve(troopById[a].map, troopById[b].map, i % 2 ? 0.16 : -0.16);
      el("path", { class: "trail", d }, trails);
      const draw = el("path", { class: "trail-draw", d, pathLength: 1 }, mask);
      draw.style.animationDelay = `${520 + i * 90}ms`;
    });

    // Troop patches
    const pins = el("g", {}, svg);
    const pinNodes = {};
    D.TROOPS.forEach((t, i) => {
      const lv = levelById[t.levels[0]];
      const su = suById[t.su];
      const g = el("g", {
        class: "pin",
        transform: `translate(${t.map[0]} ${t.map[1]})`,
        tabindex: 0,
        role: "button",
        "aria-label": `Troop ${t.id}, ${su.name}, ${t.levels.map((l) => levelById[l].name).join(" and ")}`
      }, pins);
      const body = el("g", { class: "pin-body" }, g);
      body.style.animationDelay = `${i * 35}ms`;
      el("circle", { class: "halo", r: 24.5 }, body);
      el("circle", { class: "disc", r: 19, fill: lv.hex }, body);
      el("circle", { class: "stitch", r: 15.5 }, body);
      const label = el("text", {
        "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": t.id.length > 3 ? 10.5 : 12.5, y: 0.5
      }, body);
      label.textContent = t.id;

      g.addEventListener("click", () => select(t.id));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(t.id); }
      });
      pinNodes[t.id] = g;
    });

    function select(id) {
      Object.entries(pinNodes).forEach(([k, node]) => {
        node.classList.toggle("is-active", k === id);
        node.setAttribute("aria-pressed", k === id ? "true" : "false");
      });
      renderCard(troopById[id]);
    }

    function renderCard(t) {
      const lv = levelById[t.levels[0]];
      card.innerHTML = `
        <div class="map-card-head">
          <span class="patch patch-sm" style="--patch-color:${lv.hex}" aria-hidden="true">${esc(t.id)}</span>
          <div>
            <h3>Troop ${esc(t.id)}</h3>
            <p class="su">${esc(suById[t.su].name)}</p>
          </div>
        </div>
        <div class="levels">${t.levels.map((l) => `<span class="lvl" style="--lv:${levelById[l].hex}">${levelById[l].name}</span>`).join("")}</div>
        <p class="facts"><span><strong>${t.girls}</strong> girls</span><span><strong>${t.years}</strong> ${t.years === 1 ? "year" : "years"} active</span><span>${esc(t.interests.join(", "))}</span></p>
        <p class="blurb">${esc(t.blurb)}</p>
        <a href="app.html#/explore/troop/${encodeURIComponent(t.id)}">Open troop profile</a>`;
    }

    select("101");
  }

  /* ---------- Pilot decisions ---------- */
  const form = document.getElementById("decisions");
  if (form) {
    const KEY = "scoutlink-pilot-decisions";
    const status = document.getElementById("decisions-status");
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }

    Object.entries(saved).forEach(([name, value]) => {
      const input = form.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`);
      if (input) input.checked = true;
    });

    form.addEventListener("change", () => {
      const data = {};
      new FormData(form).forEach((v, k) => { data[k] = v; });
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
      status.textContent = "";
    });

    form.addEventListener("reset", () => {
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      status.textContent = "Answers cleared.";
    });

    document.getElementById("copy-decisions").addEventListener("click", async () => {
      const lines = [];
      form.querySelectorAll("fieldset").forEach((fs, i) => {
        const q = fs.querySelector("legend").textContent.trim();
        const picked = fs.querySelector("input:checked");
        lines.push(`${i + 1}. ${q}\n   ${picked ? picked.value : "Not decided yet"}`);
      });
      if (!form.querySelector("input:checked")) {
        status.textContent = "Pick at least one answer to copy.";
        return;
      }
      const text = `ScoutLink OC pilot decisions\n\n${lines.join("\n\n")}`;
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Answers copied to your clipboard.";
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); status.textContent = "Answers copied to your clipboard."; }
        catch (err) { status.textContent = "Copy isn't available in this browser. Select the answers manually."; }
        ta.remove();
      }
    });
  }
})();
