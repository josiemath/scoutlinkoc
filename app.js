/* ScoutLink OC — interactive demo
   Plain JavaScript, no build step. State lives in localStorage so the demo
   remembers changes in one browser; nothing is sent anywhere. */
(function () {
  "use strict";
  const D = window.SL_DATA;

  /* =====================================================================
     Helpers
     ===================================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const levelById = Object.fromEntries(D.LEVELS.map((l) => [l.id, l]));
  const suById = Object.fromEntries(D.SERVICE_UNITS.map((s) => [s.id, s]));
  const troopById = Object.fromEntries(D.TROOPS.map((t) => [t.id, t]));
  const roleById = Object.fromEntries(D.ROLES.map((r) => [r.id, r]));

  const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const DAY = 86400000;
  const dateOf = (off) => { const d = new Date(TODAY); d.setDate(d.getDate() + off); return d; };
  const offsetOf = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Math.round((new Date(y, m - 1, d) - TODAY) / DAY); };
  const isoOf = (off) => { const d = dateOf(off); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const fmtDate = (off, opts = { weekday: "short", month: "short", day: "numeric" }) => dateOf(off).toLocaleDateString("en-US", opts);
  function rel(off) {
    if (off === 0) return "today";
    if (off === 1) return "tomorrow";
    if (off === -1) return "yesterday";
    if (off > 1 && off < 14) return `in ${off} days`;
    if (off < -1 && off > -14) return `${-off} days ago`;
    return fmtDate(off, { month: "short", day: "numeric" });
  }
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const dueText = (d) => (d < 0 ? `Overdue by ${-d} ${d === -1 ? "day" : "days"}` : `Due ${rel(d)}`);
  const money = (n) => "$" + Number(n || 0).toLocaleString("en-US");
  const initials = (name) => name.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  function fmtTime(hhmm) {
    if (!hhmm) return "";
    let [h, m] = hhmm.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ap}`;
  }

  const ICONS = {
    home: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    tent: '<path d="M3 20 12 5l9 15zM9 20l3-5 3 5"/>',
    megaphone: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;

  function download(filename, text, type = "text/plain") {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  /* =====================================================================
     State
     ===================================================================== */
  const KEY = "scoutlink-demo-v1";

  function seed() {
    const threads = clone(D.THREADS).map((t) => (t.kind === "leader" ? Object.assign(t, { owner: "leader" }) : t));
    threads.push(
      {
        id: "th4", kind: "leader", owner: "coordinator", with: "Dana R.", troop: "101", subject: "Wellness Day in the newsletter",
        messages: [
          { from: "Jen L.", offset: -2, text: "Could I feature Wellness Day in the North OC newsletter? A short blurb written by Maya would be perfect." },
          { from: "Dana R.", offset: -1, text: "Yes! I'll ask her to write three sentences this week." }
        ]
      },
      {
        id: "th5", kind: "leader", owner: "coordinator", with: "Tamara J.", troop: "959", subject: "Kindness rock garden photos",
        messages: [{ from: "Tamara J.", offset: -3, text: "Our Brownies finished the first 40 rocks. Caregivers signed photo releases if you'd like pictures for the service unit page." }]
      },
      {
        id: "th6", kind: "leader", owner: "admin", with: "Teresa V.", troop: "su:coastal", subject: "Leader training dates",
        messages: [
          { from: "Teresa V.", offset: -4, text: "I posted the leader training dates on the opportunity board. Can the council include them in the next volunteer email?" },
          { from: "Renee P.", offset: -4, text: "Yes, they'll go out Thursday." }
        ]
      }
    );
    return {
      v: 1,
      role: "leader",
      events: clone(D.EVENTS),
      regs: {
        e1: { "troop:101": { status: "confirmed", girls: 8, adults: 2 } },
        e6: { "girl:maya": { status: "confirmed", girls: 1 } },
        e5: { "girl:lily": { status: "awaiting", girls: 1 } }
      },
      permissionRequests: [{ id: "pr1", eventId: "e5", status: "pending", offset: -1 }],
      proposals: [{
        id: "p1", by: "Maya K.", troop: "101", status: "pending", sent: -1,
        title: "Volunteer training for Wellness Day", type: "Workshop", offset: 30, time: "6:00 PM",
        capacity: 20, visibility: "Service unit", levels: ["senior", "ambassador"], area: "Fullerton area",
        caregiver: false, desc: "A one-hour training for everyone staffing a Wellness Day station: what each station does, safety basics and how check-in works."
      }],
      collab: [{ id: "c1", from: "202", to: "101", by: "Marisol G.", status: "pending", offset: -2, text: "Would a few of your Seniors mentor our Cadettes as they plan a trail restoration day? We'd love to have them join one of our hikes." }],
      projects: clone(D.PROJECTS),
      threads,
      opps: clone(D.OPPORTUNITIES),
      oppInterest: {},
      oppPending: [],
      verification: clone(D.VERIFICATION_QUEUE),
      flags: clone(D.FLAGS),
      privacy: { listed: true, collab: true, calendar: true }
    };
  }

  let S;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      S = raw ? JSON.parse(raw) : seed();
      if (!S || S.v !== 1 || !roleById[S.role]) S = seed();
    } catch (e) { S = seed(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable: demo still works for this visit */ } }

  // UI-only state (not saved)
  const ui = {
    q: "", level: "", su: "", interest: "", sort: "number", exploreView: "su",
    evView: "list", evType: "", evLevel: "", evMine: false, calMonth: 0,
    projTab: "board", oppCat: "All"
  };

  /* =====================================================================
     Roles & permissions
     ===================================================================== */
  const R = () => roleById[S.role];
  const can = (cap) => R().caps.includes(cap);
  const isLeaderish = () => ["leader", "coordinator", "admin"].includes(S.role);
  const isAdult = () => isLeaderish() || S.role === "parent";
  function mySU() {
    const r = R();
    if (r.su) return r.su;
    if (r.troop) return troopById[r.troop].su;
    return null;
  }
  function regKey() {
    return { leader: "troop:101", girl13: "girl:maya", parent: "girl:lily", girl12: "girl:lily" }[S.role] || null;
  }
  function myLevels() {
    const r = R();
    if (S.role === "leader") return troopById[r.troop].levels;
    if (r.level) return [r.level];
    if (r.childLevel) return [r.childLevel];
    return D.LEVELS.map((l) => l.id);
  }
  function hostKeyForRole() {
    if (S.role === "coordinator") return "su:" + R().su;
    if (S.role === "admin") return "council";
    return R().troop;
  }

  /* =====================================================================
     Domain helpers
     ===================================================================== */
  const ev = (id) => S.events.find((e) => e.id === id);
  const proj = (id) => S.projects.find((p) => p.id === id);
  const spotsLeft = (e) => Math.max(0, e.capacity - e.registered);
  const myReg = (e) => { const k = regKey(); return k && S.regs[e.id] ? S.regs[e.id][k] : null; };

  function hostName(h) {
    if (!h) return "";
    if (h.startsWith("su:")) return suById[h.slice(3)].name;
    if (h === "council") return "GSOC council (sample)";
    return "Troop " + h;
  }
  function hostLink(h) {
    if (troopById[h]) return `<a href="#/explore/troop/${esc(h)}">Troop ${esc(h)}</a>`;
    return esc(hostName(h));
  }
  function hostSU(h) {
    if (!h) return null;
    if (h.startsWith("su:")) return h.slice(3);
    return troopById[h] ? troopById[h].su : null;
  }

  function eventVisible(e) {
    if (S.role === "admin") return true;
    if (e.adultsOnly && !isLeaderish()) return false;
    if (e.visibility === "Troop only") return e.host === R().troop;
    if (e.visibility === "Service unit") return hostSU(e.host) === mySU() || (e.adultsOnly && isLeaderish());
    return true;
  }
  function eligible(e) {
    if (e.adultsOnly) return isLeaderish();
    const mine = myLevels();
    return e.levels.some((l) => mine.includes(l));
  }
  function levelChips(levels) {
    return levels.map((l) => `<span class="lvl" style="--lv:${levelById[l].hex}">${levelById[l].name}</span>`).join("");
  }
  function troopPatch(id, size = "") {
    const t = troopById[id];
    const color = t ? levelById[t.levels[0]].hex : "var(--pine)";
    const label = t ? id : "SU";
    return `<span class="patch ${size}" style="--patch-color:${color}" aria-hidden="true">${esc(label)}</span>`;
  }
  function avatar(name, adult, lg) {
    return `<span class="avatar${adult ? " is-adult" : ""}${lg ? " is-lg" : ""}" aria-hidden="true">${esc(initials(name))}</span>`;
  }
  function dateBlock(off, priv) {
    const d = dateOf(off);
    return `<span class="date-block${priv ? " is-private" : ""}" aria-hidden="true"><span class="m">${d.toLocaleDateString("en-US", { month: "short" })}</span><span class="d">${d.getDate()}</span></span>`;
  }
  const visibleTroops = () => D.TROOPS.filter((t) => S.privacy.listed || t.id !== "101" || R().troop === "101");

  // Upcoming items for a troop / person
  function agenda(troopId, key, limit = 6) {
    const items = [];
    (D.PRIVATE_MEETINGS[troopId] || []).forEach((m) => items.push({ kind: "meeting", offset: m.offset, title: m.title, time: m.time, note: m.note }));
    S.events.forEach((e) => {
      if (e.offset < 0) return;
      const reg = key && S.regs[e.id] ? S.regs[e.id][key] : null;
      if (e.host === troopId) items.push({ kind: "host", e, offset: e.offset, reg });
      else if (reg) items.push({ kind: "reg", e, offset: e.offset, reg });
    });
    return items.filter((i) => i.offset >= 0).sort((a, b) => a.offset - b.offset).slice(0, limit);
  }
  function regStatusTag(reg) {
    if (!reg) return "";
    return {
      confirmed: '<span class="tag">Registered</span>',
      waitlist: '<span class="tag tag-citrus">On the waitlist</span>',
      awaiting: '<span class="tag tag-citrus">Waiting for caregiver</span>'
    }[reg.status] || "";
  }
  function agendaRows(items, emptyHtml) {
    if (!items.length) return `<div class="empty">${emptyHtml}</div>`;
    return `<ul class="rows" role="list">${items.map((i) => {
      if (i.kind === "meeting") {
        return `<li>${dateBlock(i.offset, true)}<div class="row-main"><p class="row-title">${esc(i.title)}</p>
          <p class="row-meta"><span>${esc(i.time)}</span><span>${esc(i.note)}</span></p></div><span class="tag tag-outline">${icon("lock")}Troop only</span></li>`;
      }
      const e = i.e;
      const tag = i.kind === "host" ? '<span class="tag tag-sky">Hosting</span>' : regStatusTag(i.reg);
      return `<li>${dateBlock(e.offset)}<div class="row-main"><p class="row-title"><a href="#/events/${e.id}">${esc(e.title)}</a></p>
        <p class="row-meta"><span>${esc(e.time)}</span><span>${esc(e.area)}</span></p></div>${tag}</li>`;
    }).join("")}</ul>`;
  }

  function projectsFor() {
    const r = R();
    switch (S.role) {
      case "leader": return S.projects.filter((p) => p.troop === r.troop);
      case "girl13": return S.projects.filter((p) => p.people.some((x) => x.name === r.name));
      case "parent":
      case "girl12": return S.projects.filter((p) => p.troop === r.troop);
      case "coordinator": return S.projects.filter((p) => troopById[p.troop] && troopById[p.troop].su === r.su);
      default: return S.projects;
    }
  }
  function canEditProject(p) {
    if (S.role === "leader") return p.troop === R().troop;
    if (S.role === "girl13") return p.people.some((x) => x.name === R().name);
    return false;
  }
  const doneCount = (p) => p.tasks.filter((t) => t.status === "done").length;

  function threadsFor() {
    const me = R().name;
    switch (S.role) {
      case "leader": return S.threads.filter((t) => (t.kind === "leader" && t.owner === "leader") || (t.kind === "space" && t.moderators.includes(me)));
      case "coordinator": return S.threads.filter((t) => (t.kind === "leader" && t.owner === "coordinator") || (t.kind === "space" && t.project === "wellness-day"));
      case "admin": return S.threads.filter((t) => (t.kind === "leader" && t.owner === "admin") || t.kind === "space");
      case "girl13": return S.threads.filter((t) => t.kind === "space" && proj(t.project) && proj(t.project).people.some((x) => x.name === me));
      default: return [];
    }
  }

  function attentionCount() {
    switch (S.role) {
      case "leader": return S.proposals.filter((p) => p.status === "pending").length + S.collab.filter((c) => c.status === "pending").length + S.oppPending.filter((o) => o.status === "pending").length;
      case "parent": return S.permissionRequests.filter((p) => p.status === "pending").length;
      case "admin": return S.verification.length + S.flags.length;
      case "girl13": {
        const p = proj("wellness-day");
        return p ? p.tasks.filter((t) => t.who === R().name && t.status !== "done" && t.due <= 7).length : 0;
      }
      default: return 0;
    }
  }

  /* =====================================================================
     Modal & toast
     ===================================================================== */
  const modal = $("#modal");
  function modalHead(title, sub) {
    return `<div class="modal-head"><div><h2 id="modal-title">${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div>
      <button class="modal-close" type="button" data-action="close-modal" aria-label="Close">${icon("x")}</button></div>`;
  }
  function openModal(html) {
    modal.innerHTML = `<div class="modal-inner">${html}</div>`;
    if (!modal.open) modal.showModal();
    const first = modal.querySelector("[autofocus]") || modal.querySelector("input:not([type=hidden]), select, textarea");
    if (first) first.focus();
  }
  function closeModal() { if (modal.open) modal.close(); }
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), 3400);
  }

  function setError(form, name, msg) {
    const input = form.elements[name];
    const holder = (input && (input.closest ? input.closest(".field") : null)) || form.querySelector(`[data-err="${name}"]`);
    if (input && input.setAttribute) input.setAttribute("aria-invalid", "true");
    if (holder) {
      let p = holder.querySelector(".error");
      if (!p) { p = document.createElement("p"); p.className = "error"; holder.appendChild(p); }
      p.textContent = msg;
    }
  }
  function clearErrors(form) {
    $$(".error", form).forEach((p) => p.remove());
    $$("[aria-invalid]", form).forEach((i) => i.removeAttribute("aria-invalid"));
  }

  /* =====================================================================
     Shell: nav, role switcher, sidebar
     ===================================================================== */
  const NAV = [
    { id: "dashboard", label: "Dashboard", hint: "Your activity overview", icon: "home" },
    { id: "explore", label: "Explore", hint: "Troops and service units", icon: "compass" },
    { id: "events", label: "Events", hint: "Discover and register", icon: "calendar" },
    { id: "messages", label: "Messages", hint: () => (can("messages") ? "Leader collaboration" : "Moderated project spaces"), icon: "chat", show: () => can("messages") || can("space") },
    { id: "projects", label: () => (["admin", "coordinator"].includes(S.role) ? "Projects" : "My Projects"), hint: "Tasks and milestones", icon: "flag" },
    { id: "troop", label: "My Troop", hint: "Members and resources", icon: "tent", show: () => can("troop") },
    { id: "opportunities", label: "Opportunities", hint: "Community announcements", icon: "megaphone" },
    { id: "admin", label: "Council admin", hint: "Verification and moderation", icon: "shield", show: () => can("admin") },
    { id: "settings", label: "Settings", hint: "Account and permissions", icon: "gear" }
  ];
  const val = (v) => (typeof v === "function" ? v() : v);

  function renderNav(page) {
    const count = attentionCount();
    $("#app-nav").innerHTML = NAV.filter((n) => !n.show || n.show()).map((n) => `
      <a class="nav-item" href="#/${n.id}" ${n.id === page ? 'aria-current="page"' : ""}>
        ${icon(n.icon)}<span class="nav-label">${esc(val(n.label))}</span><span class="nav-hint">${esc(val(n.hint))}</span>
        ${n.id === "dashboard" && count ? `<span class="nav-badge"><span aria-hidden="true">${count}</span><span class="visually-hidden">, ${count} ${count === 1 ? "item needs" : "items need"} attention</span></span>` : ""}
      </a>`).join("");
  }
  function renderWho() {
    const r = R();
    $("#role-select").value = S.role;
    $("#role-who").textContent = `${r.name}, ${r.detail}`;
    $("#who-chip").innerHTML = `${avatar(r.name, isAdult())}<span>${esc(r.name)}</span><span class="who-role muted">${esc(r.label)}</span>`;
  }
  $("#role-select").innerHTML = D.ROLES.map((r) => `<option value="${r.id}">${esc(r.label)}</option>`).join("");
  $("#role-select").addEventListener("change", (e) => switchRole(e.target.value));

  function switchRole(id) {
    if (!roleById[id]) return;
    S.role = id;
    save();
    const page = route()[0] || "dashboard";
    const item = NAV.find((n) => n.id === page);
    const allowed = !item || !item.show || item.show();
    if (!allowed) location.hash = "#/dashboard";
    else render();
    toast(`Now viewing as ${R().name}, ${R().detail}`);
  }

  const sidebar = $("#sidebar"), scrim = $("#scrim"), menuBtn = $("#menu-btn");
  function openSidebar() { sidebar.classList.add("is-open"); scrim.hidden = false; menuBtn.setAttribute("aria-expanded", "true"); const a = $(".nav-item", sidebar); if (a) a.focus(); }
  function closeSidebar() { sidebar.classList.remove("is-open"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", openSidebar);
  scrim.addEventListener("click", closeSidebar);
  $("#sidebar-close").addEventListener("click", () => { closeSidebar(); menuBtn.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sidebar.classList.contains("is-open")) { closeSidebar(); menuBtn.focus(); } });

  /* =====================================================================
     Views
     ===================================================================== */
  function denied(title, message) {
    return {
      title, crumb: esc(title),
      html: `<div class="page-head"><div><h1>${esc(title)}</h1></div></div>
        <div class="panel"><div class="notice notice-lock">${icon("lock")}<p>${message}</p></div>
        <p class="small muted" style="margin:1rem 0 0">In the demo, you can <a href="#/settings">switch to another role</a> to see this page.</p></div>`
    };
  }

  /* ---------- Dashboard ---------- */
  function viewDashboard() {
    const r = R();
    const h = new Date().getHours();
    const greet = S.role === "girl12" ? "Hi" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const sub = {
      leader: "Here's what needs you this week.",
      girl13: "Your deadlines, events and ways to get involved.",
      parent: "Permission requests and what's coming up for Lily.",
      girl12: "Here's what your troop is up to!",
      coordinator: "Troops, volunteers and events in your service unit.",
      admin: "Verification, moderation and council activity."
    }[S.role];
    const html = `<div class="greeting"><h1>${greet}, ${esc(r.first)}${S.role === "girl12" ? "!" : ""}</h1><p>${esc(r.detail)}. ${sub}</p></div>${DASH[S.role]()}`;
    return { title: "Dashboard", crumb: "Dashboard", html };
  }

  const DASH = {
    leader() {
      const r = R();
      const props = S.proposals.filter((p) => p.status === "pending" && p.troop === r.troop);
      const collabs = S.collab.filter((c) => c.status === "pending" && c.to === r.troop);
      const posts = S.oppPending.filter((o) => o.status === "pending");
      const items = [
        ...props.map((p) => `<li class="attention-item"><span class="dot"></span><div class="row-main">
          <p class="row-title">${esc(p.by)} proposed an event: ${esc(p.title)}</p>
          <p class="row-meta"><span>Sent ${rel(p.sent)}</span><span>${esc(p.type)}, ${fmtDate(p.offset)}</span></p></div>
          <div class="row-actions"><button class="btn btn-primary btn-sm" data-action="review-proposal" data-id="${p.id}">Review</button></div></li>`),
        ...collabs.map((c) => `<li class="attention-item"><span class="dot"></span><div class="row-main">
          <p class="row-title">Troop ${esc(c.from)} asked to collaborate</p>
          <p class="row-meta"><span>${esc(c.by)}, ${rel(c.offset)}</span></p><p class="small" style="margin:0.35rem 0 0">“${esc(c.text)}”</p></div>
          <div class="row-actions"><button class="btn btn-primary btn-sm" data-action="collab-accept" data-id="${c.id}">Accept</button><button class="btn btn-sm" data-action="collab-decline" data-id="${c.id}">Decline</button></div></li>`),
        ...posts.map((o) => `<li class="attention-item"><span class="dot"></span><div class="row-main">
          <p class="row-title">${esc(o.by)} wants to post an opportunity: ${esc(o.title)}</p>
          <p class="row-meta"><span>${esc(o.cat)}</span></p></div>
          <div class="row-actions"><button class="btn btn-primary btn-sm" data-action="post-approve" data-id="${o.id}">Approve and post</button><button class="btn btn-sm" data-action="post-decline" data-id="${o.id}">Decline</button></div></li>`)
      ];
      const projs = projectsFor();
      return `<div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Needs your attention</h2></div>
          ${items.length ? `<ul class="rows" role="list">${items.join("")}</ul>` : `<div class="empty"><p>You're all caught up. New proposals and collaboration requests will show up here.</p></div>`}
        </section>
        <section class="panel"><div class="panel-head"><h2>Coming up for Troop ${esc(r.troop)}</h2><a href="#/troop">Troop calendar</a></div>
          ${agendaRows(agenda(r.troop, regKey()), "<p>Nothing scheduled yet.</p><p><a href=\"#/events\">Find an event</a> for your troop.</p>")}
        </section></div>
        <div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Girl-led projects</h2><a href="#/projects">All projects</a></div>
          ${projs.length ? `<ul class="rows" role="list">${projs.map(projectRow).join("")}</ul>` : `<div class="empty"><p>No projects yet.</p></div>`}
        </section>
        <section class="panel"><div class="panel-head"><h2>Quick actions</h2></div>
          <div class="page-actions"><a class="btn btn-primary" href="#/events/new">${icon("plus")}Create an event</a><a class="btn" href="#/explore">Find a partner troop</a><button class="btn" data-action="opp-post">Post an opportunity</button></div>
        </section></div></div>`;
    },

    girl13() {
      const r = R();
      const myTasks = [];
      projectsFor().forEach((p) => p.tasks.filter((t) => t.who === r.name && t.status !== "done").forEach((t) => myTasks.push({ p, t })));
      myTasks.sort((a, b) => a.t.due - b.t.due);
      const props = S.proposals.filter((p) => p.by === r.name);
      const posts = S.oppPending.filter((o) => o.by === r.name);
      const opps = S.opps.filter((o) => ["Mentorship", "Joint project", "Event participants"].includes(o.cat)).slice(0, 3);
      const statusTag = (s) => ({ pending: '<span class="tag tag-citrus">With your leader</span>', approved: '<span class="tag">Approved</span>', changes: '<span class="tag tag-berry">Changes requested</span>', declined: '<span class="tag tag-outline">Not posted</span>' }[s] || "");
      return `<div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Your deadlines</h2><a href="#/projects">My projects</a></div>
          ${myTasks.length ? `<ul class="rows" role="list">${myTasks.map(({ p, t }) => `<li><div class="row-main"><p class="row-title">${esc(t.title)}</p>
            <p class="row-meta"><span><a href="#/projects/${p.id}">${esc(p.title)}</a></span><span class="due ${t.due < 0 ? "is-late" : ""}">${dueText(t.due)}</span></p></div>
            <span class="tag ${t.status === "doing" ? "tag-sky" : "tag-outline"}">${t.status === "doing" ? "In progress" : "To do"}</span></li>`).join("")}</ul>`
            : `<div class="empty"><p>No open tasks assigned to you.</p></div>`}
        </section>
        <section class="panel"><div class="panel-head"><h2>Your proposals and posts</h2><a href="#/events/new">Propose an event</a></div>
          ${props.length + posts.length ? `<ul class="rows" role="list">
            ${props.map((p) => `<li><div class="row-main"><p class="row-title">${p.eventId ? `<a href="#/events/${p.eventId}">${esc(p.title)}</a>` : esc(p.title)}</p>
              <p class="row-meta"><span>Event proposal</span><span>Sent ${rel(p.sent)}</span>${p.note ? `<span>Note from your leader: “${esc(p.note)}”</span>` : ""}</p></div>${statusTag(p.status)}</li>`).join("")}
            ${posts.map((o) => `<li><div class="row-main"><p class="row-title">${esc(o.title)}</p><p class="row-meta"><span>Opportunity post</span></p></div>${statusTag(o.status)}</li>`).join("")}
          </ul>` : `<div class="empty"><p>Have an idea for an event? Propose it and your troop leader will review it before registration opens.</p></div>`}
        </section></div>
        <div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Your calendar</h2><a href="#/events">All events</a></div>
          ${agendaRows(agenda(r.troop, regKey(), 5), "<p>Nothing on your calendar.</p>")}
        </section>
        <section class="panel"><div class="panel-head"><h2>Ways to get involved</h2><a href="#/opportunities">Opportunity board</a></div>
          <ul class="rows" role="list">${opps.map((o) => `<li><div class="row-main"><p class="row-title">${esc(o.title)}</p><p class="row-meta"><span>${esc(o.cat)}</span><span>${esc(hostName(o.troop))}</span></p></div></li>`).join("")}</ul>
        </section></div></div>`;
    },

    parent() {
      const r = R();
      const reqs = S.permissionRequests.filter((p) => p.status === "pending");
      const open = S.events.filter((e) => e.offset >= 0 && eventVisible(e) && eligible(e) && !myReg(e)).sort((a, b) => a.offset - b.offset).slice(0, 4);
      return `<div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Permission requests</h2></div>
          ${reqs.length ? `<ul class="rows" role="list">${reqs.map((q) => {
            const e = ev(q.eventId);
            return `<li class="attention-item"><span class="dot"></span><div class="row-main"><p class="row-title">${esc(r.childName)} wants to go to ${esc(e.title)}</p>
              <p class="row-meta"><span>${fmtDate(e.offset)}, ${esc(e.time)}</span><span>${esc(e.area)}</span><span>Hosted by ${hostLink(e.host)}</span></p></div>
              <div class="row-actions"><button class="btn btn-primary btn-sm" data-action="perm-approve" data-id="${q.id}">Give permission</button><button class="btn btn-sm" data-action="perm-decline" data-id="${q.id}">Not this time</button></div></li>`;
          }).join("")}</ul>` : `<div class="empty"><p>No requests right now. When ${esc(r.childName)} asks to join an activity, it shows up here.</p></div>`}
        </section>
        <section class="panel"><div class="panel-head"><h2>Coming up for ${esc(r.childName)}</h2><a href="#/troop">Troop calendar</a></div>
          ${agendaRows(agenda(r.troop, regKey()), "<p>Nothing scheduled yet.</p>")}
        </section></div>
        <div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Events ${esc(r.childName)} can join</h2><a href="#/events">All events</a></div>
          ${open.length ? `<ul class="rows" role="list">${open.map((e) => `<li>${dateBlock(e.offset)}<div class="row-main"><p class="row-title"><a href="#/events/${e.id}">${esc(e.title)}</a></p>
            <p class="row-meta"><span>${esc(e.area)}</span></p></div></li>`).join("")}</ul>` : `<div class="empty"><p>No open events for Brownies right now.</p></div>`}
        </section>
        <section class="panel"><div class="panel-head"><h2>Troop ${esc(r.troop)} projects</h2></div>
          <ul class="rows" role="list">${projectsFor().map(projectRow).join("")}</ul>
        </section></div></div>`;
    },

    girl12() {
      const r = R();
      const open = S.events.filter((e) => e.offset >= 0 && eventVisible(e) && eligible(e)).sort((a, b) => a.offset - b.offset);
      const p = projectsFor()[0];
      return `<div class="notice" style="margin-bottom:1.25rem">${icon("heart")}<p>Your grown-up helps you sign up for things. When you ask to go to an event, they get a message.</p></div>
      <div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Fun things for Brownies</h2></div>
          <ul class="rows" role="list">${open.map((e) => {
            const reg = myReg(e);
            const action = !reg ? `<button class="btn btn-citrus btn-sm" data-action="ask-caregiver" data-id="${e.id}">Ask my grown-up</button>`
              : reg.status === "confirmed" ? `<span class="tag">${icon("check")}You're going!</span>` : `<span class="tag tag-citrus">Waiting for your grown-up</span>`;
            return `<li>${dateBlock(e.offset)}<div class="row-main"><p class="row-title"><a href="#/events/${e.id}">${esc(e.title)}</a></p><p class="row-meta"><span>${esc(e.time)}</span><span>${esc(e.area)}</span></p></div><div class="row-actions">${action}</div></li>`;
          }).join("")}</ul>
        </section></div>
        <div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Coming up with your troop</h2></div>
          ${agendaRows(agenda(r.troop, regKey(), 4), "<p>Nothing yet!</p>")}
        </section>
        ${p ? `<section class="panel"><div class="panel-head"><h2>Our troop project</h2></div>${`<ul class="rows" role="list">${projectRow(p)}</ul>`}</section>` : ""}
        </div></div>`;
    },

    coordinator() {
      const r = R();
      const troops = D.TROOPS.filter((t) => t.su === r.su);
      const vol = S.opps.filter((o) => o.cat === "Volunteers needed");
      const events = S.events.filter((e) => e.offset >= 0 && hostSU(e.host) === r.su).sort((a, b) => a.offset - b.offset);
      return `<div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Troops in ${esc(suById[r.su].short)}</h2><a href="#/explore">Directory</a></div>
          <ul class="rows" role="list">${troops.map((t) => `<li>${troopPatch(t.id, "patch-sm")}<div class="row-main"><p class="row-title"><a href="#/explore/troop/${t.id}">Troop ${t.id}</a></p>
            <p class="row-meta"><span>${t.levels.map((l) => levelById[l].name).join(" and ")}</span><span>${t.girls} girls</span><span>Leader: ${esc(t.leader)}</span></p></div></li>`).join("")}</ul>
        </section>
        <section class="panel"><div class="panel-head"><h2>Volunteer requests</h2><a href="#/opportunities">Opportunity board</a></div>
          <ul class="rows" role="list">${vol.map((o) => `<li><div class="row-main"><p class="row-title">${esc(o.title)}</p><p class="row-meta"><span>${esc(hostName(o.troop))}</span><span>${o.interested} interested</span></p></div></li>`).join("")}</ul>
        </section></div>
        <div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Service unit events</h2><a href="#/events">All events</a></div>
          ${events.length ? `<ul class="rows" role="list">${events.map((e) => `<li>${dateBlock(e.offset)}<div class="row-main"><p class="row-title"><a href="#/events/${e.id}">${esc(e.title)}</a></p>
            <p class="row-meta"><span>${hostName(e.host)}</span><span>${e.registered} of ${e.capacity} spots</span></p></div></li>`).join("")}</ul>` : `<div class="empty"><p>No upcoming events in your service unit.</p></div>`}
        </section>
        <section class="panel"><div class="panel-head"><h2>Quick actions</h2></div>
          <div class="page-actions"><a class="btn btn-primary" href="#/events/new">${icon("plus")}Publish a service unit event</a><button class="btn" data-action="opp-post">Post an opportunity</button></div>
        </section></div></div>`;
    },

    admin() {
      const upcoming = S.events.filter((e) => e.offset >= 0);
      const regs = upcoming.reduce((n, e) => n + e.registered, 0);
      return `<div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Volunteer verification</h2><a href="#/admin">Council admin</a></div>${verificationRows()}</section>
        <section class="panel"><div class="panel-head"><h2>Flagged content</h2></div>${flagRows()}</section></div>
        <div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Council at a glance</h2></div>
          <dl class="kv"><dt>Service units</dt><dd>${D.SERVICE_UNITS.length}</dd><dt>Troops listed</dt><dd>${D.TROOPS.length}</dd>
          <dt>Girls in listed troops</dt><dd>${D.TROOPS.reduce((n, t) => n + t.girls, 0)}</dd><dt>Upcoming events</dt><dd>${upcoming.length}</dd>
          <dt>Spots registered</dt><dd>${regs}</dd><dt>Girl-led projects</dt><dd>${S.projects.length}</dd></dl>
        </section></div></div>`;
    }
  };

  function projectRow(p) {
    const done = doneCount(p), total = p.tasks.length;
    return `<li><div class="row-main"><p class="row-title"><a href="#/projects/${p.id}">${esc(p.title)}</a></p>
      <div class="progress-line"><div class="progress"><span style="width:${total ? Math.round((done / total) * 100) : 0}%"></span></div><span>${done} of ${total} tasks</span></div></div>
      <span class="tag tag-outline">${esc(p.track)}</span></li>`;
  }
  function verificationRows() {
    if (!S.verification.length) return `<div class="empty"><p>No volunteers waiting for verification.</p></div>`;
    return `<ul class="rows" role="list">${S.verification.map((v) => `<li>${avatar(v.name, true)}<div class="row-main"><p class="row-title">${esc(v.name)}</p>
      <p class="row-meta"><span>${esc(v.role)}</span><span>${troopById[v.troop] ? "Troop " + esc(v.troop) : esc(v.troop)}</span><span>Background check: ${esc(v.check)}</span><span>Submitted ${rel(v.submitted)}</span></p></div>
      <div class="row-actions">${v.check === "Cleared"
        ? `<button class="btn btn-primary btn-sm" data-action="verify-approve" data-id="${v.id}">Verify</button>`
        : `<button class="btn btn-sm" disabled title="Waiting for the background check">Waiting on check</button>`}
        <button class="btn btn-sm" data-action="verify-decline" data-id="${v.id}">Decline</button></div></li>`).join("")}</ul>`;
  }
  function flagRows() {
    if (!S.flags.length) return `<div class="empty"><p>Nothing flagged. Posts that include personal details get flagged here automatically.</p></div>`;
    return `<ul class="rows" role="list">${S.flags.map((f) => `<li><div class="row-main"><p class="row-title">${esc(f.where)}</p><p class="row-meta"><span>${esc(f.text)}</span><span>${rel(f.offset)}</span></p></div>
      <div class="row-actions"><button class="btn btn-danger btn-sm" data-action="flag-remove" data-id="${f.id}">Remove details</button><button class="btn btn-sm" data-action="flag-dismiss" data-id="${f.id}">Dismiss</button></div></li>`).join("")}</ul>`;
  }

  /* ---------- Explore ---------- */
  function viewExplore(parts) {
    if (parts[0] === "troop" && parts[1]) return viewTroop(parts[1]);
    const interests = Array.from(new Set(D.TROOPS.flatMap((t) => t.interests))).sort();
    const html = `
      <div class="page-head"><div><h1>Explore troops</h1>
        <p>Participating troops across Orange County, grouped by service unit. Filters apply to troops, so each service unit shows only its matching troops.</p></div></div>
      <div class="toolbar" role="search">
        <div class="field"><label for="f-q">Search</label><input id="f-q" type="search" placeholder="Troop number, interest or city" value="${esc(ui.q)}"></div>
        <div class="field"><label for="f-level">Girl Scout level</label><select id="f-level"><option value="">All levels</option>${D.LEVELS.map((l) => `<option value="${l.id}" ${ui.level === l.id ? "selected" : ""}>${l.name} (grades ${l.grades})</option>`).join("")}</select></div>
        <div class="field"><label for="f-su">Service unit</label><select id="f-su"><option value="">All service units</option>${D.SERVICE_UNITS.map((s) => `<option value="${s.id}" ${ui.su === s.id ? "selected" : ""}>${esc(s.short)}</option>`).join("")}</select></div>
        <div class="field"><label for="f-interest">Interest</label><select id="f-interest"><option value="">Any interest</option>${interests.map((i) => `<option ${ui.interest === i ? "selected" : ""}>${esc(i)}</option>`).join("")}</select></div>
        <div class="field"><label for="f-sort">Sort by</label><select id="f-sort">
          ${[["number", "Troop number"], ["girls", "Most girls"], ["years", "Most years active"], ["newest", "Newest troops"]].map(([v, l]) => `<option value="${v}" ${ui.sort === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      </div>
      <div class="results-bar"><span id="result-count" aria-live="polite"></span>
        <div class="view-toggle" role="group" aria-label="Group results">
          <button type="button" data-action="explore-view" data-view="su" aria-pressed="${ui.exploreView === "su"}">By service unit</button>
          <button type="button" data-action="explore-view" data-view="all" aria-pressed="${ui.exploreView === "all"}">All troops</button>
        </div></div>
      ${!can("directory") ? `<div class="notice" style="margin-bottom:1.25rem">${icon("info")}<p>You can look at other troops here. Ask your troop leader if you'd like to do something together.</p></div>` : ""}
      <div id="explore-results"></div>`;
    return {
      title: "Explore troops", crumb: "Explore", html,
      mount(root) {
        const bind = (id, key, evt = "change") => $(id, root).addEventListener(evt, (e) => { ui[key] = e.target.value; renderExploreResults(); });
        bind("#f-q", "q", "input"); bind("#f-level", "level"); bind("#f-su", "su"); bind("#f-interest", "interest"); bind("#f-sort", "sort");
        renderExploreResults();
      }
    };
  }

  function renderExploreResults() {
    const box = $("#explore-results");
    if (!box) return;
    const q = ui.q.trim().toLowerCase();
    let list = visibleTroops().filter((t) => {
      if (ui.level && !t.levels.includes(ui.level)) return false;
      if (ui.su && t.su !== ui.su) return false;
      if (ui.interest && !t.interests.includes(ui.interest)) return false;
      if (q) {
        const su = suById[t.su];
        const hay = [t.id, "troop " + t.id, su.name, su.area, t.blurb, ...t.interests, ...t.levels.map((l) => levelById[l].name)].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorters = { number: (a, b) => Number(a.id) - Number(b.id), girls: (a, b) => b.girls - a.girls, years: (a, b) => b.years - a.years, newest: (a, b) => a.years - b.years };
    list.sort(sorters[ui.sort]);

    const sus = new Set(list.map((t) => t.su));
    $("#result-count").textContent = list.length ? `Showing ${list.length} ${list.length === 1 ? "troop" : "troops"} in ${sus.size} ${sus.size === 1 ? "service unit" : "service units"}` : "No troops match these filters";
    $$('[data-action="explore-view"]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === ui.exploreView)));

    if (!list.length) {
      box.innerHTML = `<div class="empty"><p>No troops match. Try a different level or interest, or <button class="link-btn" data-action="clear-filters">clear all filters</button>.</p></div>`;
      return;
    }
    if (ui.exploreView === "all") { box.innerHTML = `<div class="troop-grid">${list.map(troopCard).join("")}</div>`; return; }
    box.innerHTML = D.SERVICE_UNITS.filter((s) => sus.has(s.id)).map((s) => {
      const troops = list.filter((t) => t.su === s.id);
      return `<section class="su-block" aria-labelledby="su-${s.id}"><div class="su-head"><h2 id="su-${s.id}">${esc(s.name)}</h2>
        <p>${esc(s.area)}</p><p>Coordinator: ${esc(s.coordinator)}</p><p>${troops.length} of ${D.TROOPS.filter((t) => t.su === s.id).length} troops shown</p></div>
        <div class="troop-grid">${troops.map(troopCard).join("")}</div></section>`;
    }).join("");
  }

  function troopCard(t) {
    const hidden = !S.privacy.listed && t.id === "101";
    return `<article class="troop-card">${troopPatch(t.id)}<div>
      <h3><a href="#/explore/troop/${t.id}">Troop ${t.id}</a></h3>
      <p class="su">${esc(suById[t.su].name)}</p>
      <div class="levels">${levelChips(t.levels)}</div>
      <p class="facts"><span><strong>${t.girls}</strong> girls</span><span><strong>${t.years}</strong> ${t.years === 1 ? "year" : "years"} active</span></p>
      <p class="interests">${esc(t.interests.join(", "))}</p>
      ${hidden ? '<p class="xsmall muted" style="margin:0.4rem 0 0">Hidden from other users’ directory</p>' : ""}
    </div></article>`;
  }

  function viewTroop(id) {
    const t = troopById[id];
    if (!t || (!S.privacy.listed && id === "101" && R().troop !== "101")) {
      return { title: "Troop not found", crumb: `<a href="#/explore">Explore</a> / Troop`, html: `<a class="back-link" href="#/explore">${icon("back")}All troops</a><div class="empty"><p>This troop isn't in the directory. It may have hidden its profile.</p></div>` };
    }
    const own = R().troop === id;
    const su = suById[t.su];
    const shareable = (S.privacy.calendar || id !== "101") ? S.events.filter((e) => e.host === id && e.offset >= 0 && e.visibility !== "Troop only").sort((a, b) => a.offset - b.offset) : [];
    const collabOff = id === "101" && !S.privacy.collab && !own;
    let action = "";
    if (own) action = `<span class="tag">This is your troop</span>`;
    else if (can("contact")) action = collabOff
      ? `<button class="btn" disabled>Not accepting requests</button>`
      : `<button class="btn btn-primary" data-action="contact-leader" data-troop="${t.id}">Request a collaboration</button>`;

    const html = `
      <a class="back-link" href="#/explore">${icon("back")}All troops</a>
      <div class="profile-head">${troopPatch(t.id, "patch-lg")}<div>
        <h1>Troop ${esc(t.id)}</h1><p class="su">${esc(su.name)}, ${esc(su.area)}</p>
        <div class="levels">${levelChips(t.levels)}</div></div>
        <div class="page-actions">${action}</div></div>
      <div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>About</h2></div><p>${esc(t.blurb)}</p>
          <dl class="facts-grid"><div class="fact"><dt>Girls</dt><dd>${t.girls}</dd></div><div class="fact"><dt>Years active</dt><dd>${t.years}</dd></div>
          <div class="fact"><dt>Interests</dt><dd class="text">${esc(t.interests.join(", "))}</dd></div></dl></section>
        <section class="panel"><div class="panel-head"><h2>Shareable events</h2></div>
          ${shareable.length ? `<ul class="rows" role="list">${shareable.map((e) => `<li>${dateBlock(e.offset)}<div class="row-main"><p class="row-title"><a href="#/events/${e.id}">${esc(e.title)}</a></p>
            <p class="row-meta"><span>${esc(e.time)}</span><span>${esc(e.area)}</span><span>${esc(e.visibility)}</span></p></div></li>`).join("")}</ul>`
            : `<div class="empty"><p>No shareable events right now.</p></div>`}
        </section></div>
        <div class="stack-gap">
        ${can("directoryLite") ? "" : `<section class="panel"><div class="panel-head"><h2>Verified adult contact</h2></div>
          ${isLeaderish() ? `<div style="display:flex;gap:0.8rem;align-items:center">${avatar(t.leader, true, true)}<div><p class="row-title">${esc(t.leader)}</p><p class="row-meta"><span>Troop leader</span><span class="tag">${icon("check")}Verified</span></p></div></div>
            ${own ? "" : `<p class="small muted" style="margin:0.9rem 0 0">Messages go to verified adults only. Contact details aren't shared until both leaders agree to work together.</p>`}`
            : `<div class="notice">${icon("info")}<p>${S.role === "girl13" ? "Want to work with this troop? Ask your troop leader to send a collaboration request." : "Leader contact is available to verified troop leaders and volunteers."}</p></div>`}
        </section>`}
        <section class="panel"><div class="panel-head"><h2>Kept private</h2></div>
          <div class="notice notice-lock">${icon("lock")}<p>Only this troop's verified adults and members can see these.</p></div>
          <ul class="restricted-list" role="list"><li>${icon("lock")}Member list</li><li>${icon("lock")}Private meetings and meeting places</li><li>${icon("lock")}Travel plans and itineraries</li></ul>
        </section></div></div>`;
    return { title: `Troop ${t.id}`, crumb: `<a href="#/explore">Explore</a> / Troop ${esc(t.id)}`, html };
  }

  /* ---------- Events ---------- */
  function capacityHtml(e) {
    const full = spotsLeft(e) === 0;
    const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
    const text = full ? `Full${e.waitlist ? `, ${e.waitlist} on the waitlist` : ", waitlist open"}` : `${e.registered} of ${e.capacity} spots filled`;
    return `<div class="capacity"><div class="progress ${full ? "is-full" : pct > 75 ? "is-citrus" : ""}"><span style="width:${pct}%"></span></div><span>${text}</span></div>`;
  }

  function eventActions(e) {
    if (e.offset < 0) return { status: "", buttons: "" };
    const reg = myReg(e);
    const full = spotsLeft(e) === 0;
    const statusText = reg ? { confirmed: "Registered", waitlist: "On the waitlist", awaiting: "Waiting for caregiver permission" }[reg.status] : "";
    const statusCls = reg && reg.status === "confirmed" ? "status-ok" : "status-wait";
    const status = statusText ? `<span class="status ${statusCls}">${statusText}</span>` : "";
    const levelNames = myLevels().map((l) => levelById[l].name).join(" or ");

    if (S.role === "coordinator" || S.role === "admin") return { status, buttons: `<button class="btn btn-sm" data-action="attendees" data-id="${e.id}">View attendees</button>` };
    if (S.role === "leader" && e.host === R().troop) return { status: `<span class="status status-ok">Your troop is hosting</span>`, buttons: `<button class="btn btn-sm" data-action="attendees" data-id="${e.id}">View attendees</button>` };

    if (S.role === "girl12") {
      if (!eligible(e)) return { status: `<span class="status muted">For older Girl Scouts</span>`, buttons: "" };
      if (!reg) return { status: "", buttons: `<button class="btn btn-citrus btn-sm" data-action="ask-caregiver" data-id="${e.id}">Ask my grown-up</button>` };
      return { status: reg.status === "confirmed" ? `<span class="status status-ok">You're going!</span>` : `<span class="status status-wait">Waiting for your grown-up</span>`, buttons: "" };
    }
    if (reg) {
      if (S.role === "parent" && reg.status === "awaiting") {
        const req = S.permissionRequests.find((p) => p.eventId === e.id && p.status === "pending");
        return { status, buttons: req ? `<button class="btn btn-primary btn-sm" data-action="perm-approve" data-id="${req.id}">Give permission</button>` : "" };
      }
      return { status, buttons: `<button class="btn btn-ghost btn-sm" data-action="cancel-reg" data-id="${e.id}">Cancel</button>` };
    }
    if (!eligible(e)) return { status: `<span class="status muted">${e.adultsOnly ? "Adults only" : `Not open to ${esc(levelNames)}`}</span>`, buttons: "" };
    const label = e.adultsOnly ? "RSVP" : { leader: "Register troop", girl13: "Sign up", parent: `Register ${esc(R().childName)}` }[S.role];
    return { status, buttons: `<button class="btn ${full ? "" : "btn-primary"} btn-sm" data-action="register" data-id="${e.id}">${full ? "Join waitlist" : label}</button>` };
  }

  function eventTags(e) {
    return `${e.adultsOnly ? '<span class="tag tag-outline">Adults only</span>' : levelChips(e.levels.length === 6 ? [] : e.levels) + (e.levels.length === 6 ? '<span class="tag tag-outline">All levels</span>' : "")}
      ${e.caregiver ? '<span class="tag tag-citrus">Caregiver permission</span>' : ""}
      ${e.girlLed ? '<span class="tag tag-sky">Girl-led</span>' : ""}
      ${e.visibility !== "Council-wide" ? `<span class="tag tag-outline">${esc(e.visibility)}</span>` : ""}`;
  }

  function eventRow(e) {
    const a = eventActions(e);
    return `<article class="event-row">${dateBlock(e.offset)}<div class="event-body">
      <h3><a href="#/events/${e.id}">${esc(e.title)}</a></h3>
      <p class="event-meta"><span>${fmtDate(e.offset, { weekday: "long" })}, ${esc(e.time)}</span><span>${esc(e.type)}</span><span>Hosted by ${hostLink(e.host)}</span><span>${esc(e.area)}</span></p>
      <div class="event-tags">${eventTags(e)}</div>${capacityHtml(e)}</div>
      <div class="event-side">${a.status}${a.buttons}</div></article>`;
  }

  function filteredEvents() {
    return S.events.filter((e) => e.offset >= 0 && eventVisible(e))
      .filter((e) => !ui.evType || e.type === ui.evType)
      .filter((e) => !ui.evLevel || e.levels.includes(ui.evLevel))
      .filter((e) => !ui.evMine || (eligible(e) && !(S.role === "leader" && e.host === R().troop)))
      .sort((a, b) => a.offset - b.offset);
  }

  function viewEvents(parts) {
    if (parts[0] === "new") return viewCreateEvent();
    if (parts[0]) return viewEvent(parts[0]);
    const createBtn = can("createEvent") ? `<a class="btn btn-primary" href="#/events/new">${icon("plus")}Create an event</a>`
      : can("proposeEvent") ? `<a class="btn btn-primary" href="#/events/new">${icon("plus")}Propose an event</a>` : "";
    const html = `
      <div class="page-head"><div><h1>Events</h1><p>Approved activities from troops and service units across the council. Exact meeting points are shared with registered troops.</p></div>
        <div class="page-actions">${createBtn}</div></div>
      <div class="filters">
        <div class="field"><label for="ev-type">Type</label><select id="ev-type"><option value="">All types</option>${D.EVENT_TYPES.map((t) => `<option ${ui.evType === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div class="field"><label for="ev-level">Open to</label><select id="ev-level"><option value="">Any level</option>${D.LEVELS.map((l) => `<option value="${l.id}" ${ui.evLevel === l.id ? "selected" : ""}>${l.name}</option>`).join("")}</select></div>
        <label class="check filters-check"><input type="checkbox" id="ev-mine" ${ui.evMine ? "checked" : ""}>Only events I can join</label>
        <div class="filters-push"><div class="view-toggle" role="group" aria-label="Event view">
          <button type="button" data-action="events-view" data-view="list" aria-pressed="${ui.evView === "list"}">List</button>
          <button type="button" data-action="events-view" data-view="calendar" aria-pressed="${ui.evView === "calendar"}">Calendar</button></div></div>
      </div>
      <div id="event-results"></div>`;
    return {
      title: "Events", crumb: "Events", html,
      mount(root) {
        $("#ev-type", root).addEventListener("change", (e) => { ui.evType = e.target.value; renderEventResults(); });
        $("#ev-level", root).addEventListener("change", (e) => { ui.evLevel = e.target.value; renderEventResults(); });
        $("#ev-mine", root).addEventListener("change", (e) => { ui.evMine = e.target.checked; renderEventResults(); });
        renderEventResults();
      }
    };
  }

  function renderEventResults() {
    const box = $("#event-results");
    if (!box) return;
    const list = filteredEvents();
    if (ui.evView === "calendar") { box.innerHTML = calendarHtml(list); return; }
    box.innerHTML = list.length ? `<div class="panel">${list.map(eventRow).join("")}</div>`
      : `<div class="empty"><p>No events match these filters.</p><p><button class="link-btn" data-action="clear-event-filters">Show all events</button></p></div>`;
  }

  function calendarHtml(list) {
    const base = new Date(TODAY.getFullYear(), TODAY.getMonth() + ui.calMonth, 1);
    const title = base.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const start = new Date(base); start.setDate(1 - base.getDay());
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil((base.getDay() + daysInMonth) / 7);
    const meetings = R().troop ? (D.PRIVATE_MEETINGS[R().troop] || []) : [];
    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const off = Math.round((d - TODAY) / DAY);
      const other = d.getMonth() !== base.getMonth();
      const evs = list.filter((e) => e.offset === off);
      const mts = meetings.filter((m) => m.offset === off);
      cells.push(`<div class="cal-day${other ? " is-other" : ""}${off === 0 ? " is-today" : ""}"><span class="cal-num">${d.getDate()}</span>
        ${mts.map((m) => `<span class="cal-ev is-private" title="${esc(m.title)}: ${esc(m.note)}">${esc(m.time)} ${esc(m.title)}</span>`).join("")}
        ${evs.map((e) => `<a class="cal-ev${myReg(e) || e.host === R().troop ? " is-mine" : ""}" href="#/events/${e.id}" title="${esc(e.title)}">${esc(e.time)} ${esc(e.title)}</a>`).join("")}</div>`);
    }
    return `<div class="cal-nav"><button class="btn btn-sm" data-action="cal-move" data-dir="-1" aria-label="Previous month">${icon("back")}</button>
      <h2 aria-live="polite">${title}</h2><button class="btn btn-sm" data-action="cal-move" data-dir="1" aria-label="Next month"><span style="transform:scaleX(-1);display:inline-flex">${icon("back")}</span></button>
      ${ui.calMonth !== 0 ? `<button class="btn btn-ghost btn-sm" data-action="cal-move" data-dir="0">This month</button>` : ""}</div>
      <div class="cal">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="cal-dow" aria-hidden="true">${d}</div>`).join("")}${cells.join("")}</div>
      <p class="row-meta" style="margin-top:0.8rem"><span class="tag tag-citrus">Yours: registered or hosting</span><span class="tag">Open events</span>${meetings.length ? '<span class="tag tag-outline">Troop meetings, private</span>' : ""}</p>`;
  }

  function viewEvent(id) {
    const e = ev(id);
    if (!e || !eventVisible(e)) return { title: "Event not found", crumb: `<a href="#/events">Events</a>`, html: `<a class="back-link" href="#/events">${icon("back")}All events</a><div class="empty"><p>This event isn't available. It may be private to another troop.</p></div>` };
    const a = eventActions(e);
    const host = troopById[e.host];
    const reg = myReg(e);
    const insider = reg && reg.status === "confirmed" || e.host === R().troop || S.role === "admin";
    const project = e.girlLed ? S.projects.find((p) => p.eventId === e.id) : null;
    const html = `
      <a class="back-link" href="#/events">${icon("back")}All events</a>
      <div class="page-head"><div><div class="event-tags">${eventTags(e)}</div><h1>${esc(e.title)}</h1>
        <p>${fmtDate(e.offset, { weekday: "long", month: "long", day: "numeric" })}, ${esc(e.time)}. ${esc(e.type)} hosted by ${hostLink(e.host)}.</p></div></div>
      <div class="detail-grid"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>About this event</h2></div><p>${esc(e.desc)}</p>
          ${project ? `<div class="notice">${icon("flag")}<p>Planned by Girl Scouts in Troop ${esc(project.troop)}. <a href="#/projects/${project.id}">See the project</a>.</p></div>` : ""}</section>
        <section class="panel"><div class="panel-head"><h2>Details</h2></div>
          <dl class="kv"><dt>When</dt><dd>${fmtDate(e.offset, { weekday: "long", month: "long", day: "numeric" })}, ${esc(e.time)}</dd>
          <dt>Where</dt><dd>${esc(e.area)}${insider ? "" : `<br><span class="muted small" style="font-weight:400">The exact meeting point is shared with registered troops.</span>`}</dd>
          <dt>Open to</dt><dd>${e.adultsOnly ? "Troop leaders and volunteers" : e.levels.map((l) => levelById[l].name).join(", ")}</dd>
          <dt>Permission</dt><dd>${e.caregiver ? "Caregiver permission required for every girl" : "No separate permission needed"}</dd>
          <dt>Visibility</dt><dd>${esc(e.visibility)}</dd>
          ${host ? `<dt>Host contact</dt><dd>${esc(host.leader)}, verified troop leader</dd>` : ""}</dl>
        </section></div>
        <aside class="panel"><div class="panel-head"><h2>Registration</h2></div>${capacityHtml(e)}
          <div style="display:grid;gap:0.6rem;margin-top:1.1rem;justify-items:start">${a.status}${reg && S.role === "leader" && reg.status === "confirmed" ? `<p class="small muted" style="margin:0">${e.adultsOnly ? `${reg.adults} ${reg.adults === 1 ? "adult" : "adults"}` : `${reg.girls} girls and ${reg.adults} adults`} from Troop ${esc(R().troop)}</p>` : ""}${a.buttons || (e.offset < 0 ? '<span class="muted small">This event has ended.</span>' : "")}</div>
          ${e.caregiver && !e.adultsOnly ? `<p class="xsmall muted" style="margin:1rem 0 0">Spots for girls are confirmed once a caregiver gives permission.</p>` : ""}
        </aside></div>`;
    return { title: e.title, crumb: `<a href="#/events">Events</a> / ${esc(e.title)}`, html };
  }

  function viewCreateEvent() {
    if (!can("createEvent") && !can("proposeEvent")) return denied("Create an event", "Events are created by troop leaders and service unit coordinators. Girl Scouts 13 and older can propose events for their leader to review.");
    const propose = !can("createEvent");
    const leader = propose ? troopById[R().troop].leader : "";
    const defaultLevels = S.role === "leader" ? troopById[R().troop].levels : S.role === "girl13" ? ["senior"] : [];
    const html = `
      <a class="back-link" href="#/events">${icon("back")}All events</a>
      <div class="page-head"><div><h1>${propose ? "Propose an event" : "Create an event"}</h1>
        <p>${propose ? `Fill in the plan and send it to ${esc(leader)}. Registration opens once your leader approves it.` : `Publish an event for ${esc(hostName(hostKeyForRole()))}. You can choose who can see it.`}</p></div></div>
      <form class="panel" data-form="create-event" novalidate>
        ${propose ? `<div class="notice" style="margin-bottom:1.25rem">${icon("info")}<p>Your troop leader reviews every proposal and may suggest changes before it's published.</p></div>` : ""}
        <div class="form-grid">
          <div class="field span-2"><label for="ce-title">Event title</label><input id="ce-title" name="title" type="text" maxlength="80" placeholder="For example: Park cleanup and picnic" required></div>
          <div class="field"><label for="ce-type">Event type</label><select id="ce-type" name="type">${D.EVENT_TYPES.map((t) => `<option ${t === "Service project" ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div class="field"><label for="ce-vis">Who can see it</label><select id="ce-vis" name="visibility">
            ${S.role === "admin" ? "" : `<option value="Troop only">${S.role === "coordinator" ? "Service unit leaders only" : "My troop only"}</option>`}
            <option value="Service unit">My service unit</option><option value="Council-wide" selected>Council-wide</option></select></div>
          <div class="field"><label for="ce-date">Date</label><input id="ce-date" name="date" type="date" min="${isoOf(1)}" value="${isoOf(21)}" required></div>
          <div class="field"><label for="ce-time">Start time</label><input id="ce-time" name="time" type="time" value="10:00" required></div>
          <div class="field"><label for="ce-cap">Capacity</label><input id="ce-cap" name="capacity" type="number" min="1" max="500" value="30" required><p class="hint">Registration switches to a waitlist when this fills.</p></div>
          <div class="field"><label for="ce-area">General area</label><input id="ce-area" name="area" type="text" placeholder="For example: Irvine area" required><p class="hint">Registered troops get the exact meeting point. Don't put an address here.</p></div>
          <fieldset class="field span-2" style="border:0;padding:0;margin:0 0 1rem" data-err="levels"><legend class="label" style="font-weight:600;font-size:var(--fs-sm);color:var(--pine-deep);margin-bottom:0.35rem">Open to</legend>
            <div class="level-checks">${D.LEVELS.map((l) => `<label class="choice"><input type="checkbox" name="levels" value="${l.id}" ${defaultLevels.includes(l.id) ? "checked" : ""}><span><span class="lvl" style="--lv:${l.hex};border:0;padding:0;background:none;color:inherit">${l.name}</span></span></label>`).join("")}</div>
            ${isLeaderish() ? `<label class="check" style="margin-top:0.75rem"><input type="checkbox" name="adultsOnly">Adults only (leaders and volunteers)</label>` : ""}
          </fieldset>
          <div class="field span-2"><label class="check"><input type="checkbox" name="caregiver" checked>Require caregiver permission for every girl</label></div>
          <div class="field span-2"><label for="ce-desc">Description</label><textarea id="ce-desc" name="desc" maxlength="600" placeholder="What will girls do? What should they bring?"></textarea></div>
        </div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">${propose ? "Send for leader review" : "Publish event"}</button><a class="btn btn-ghost" href="#/events">Cancel</a></div>
      </form>`;
    return { title: propose ? "Propose an event" : "Create an event", crumb: `<a href="#/events">Events</a> / ${propose ? "Propose" : "Create"}`, html };
  }

  /* ---------- Projects ---------- */
  function viewProjects(parts) {
    if (parts[0]) return viewProject(parts[0]);
    const list = projectsFor();
    const canStart = S.role === "leader" || S.role === "girl13";
    const html = `
      <div class="page-head"><div><h1>${["admin", "coordinator"].includes(S.role) ? "Projects" : "My Projects"}</h1>
        <p>${{ leader: "Girl-led projects in your troop. You're the adult adviser on each one.", girl13: "Projects you lead or help with, including Bronze, Silver and Gold Award work.", parent: "What Lily's troop is working on. Troop leaders keep these up to date.", girl12: "What your troop is working on together.", coordinator: "Girl-led projects in your service unit.", admin: "Every girl-led project across the council." }[S.role]}</p></div>
        ${canStart ? `<div class="page-actions"><button class="btn btn-primary" data-action="new-project">${icon("plus")}Start a project</button></div>` : ""}</div>
      ${list.length ? `<div class="project-cards">${list.map((p) => {
        const done = doneCount(p), total = p.tasks.length;
        const next = p.milestones.find((m) => !m.done);
        return `<article class="panel project-card"><div class="event-tags"><span class="tag tag-outline">${esc(p.track)}</span><span class="tag">Troop ${esc(p.troop)}</span></div>
          <h2><a href="#/projects/${p.id}">${esc(p.title)}</a></h2><p>${esc(p.summary)}</p>
          <div class="progress-line"><div class="progress"><span style="width:${total ? Math.round((done / total) * 100) : 0}%"></span></div><span>${done} of ${total} tasks</span></div>
          <p class="row-meta"><span>Lead: ${esc(p.lead)}</span>${next ? `<span>Next: ${esc(next.title)}, ${rel(next.offset)}</span>` : ""}</p></article>`;
      }).join("")}</div>` : `<div class="empty"><p>No projects yet.</p></div>`}`;
    return { title: "Projects", crumb: "Projects", html };
  }

  function viewProject(id) {
    const p = proj(id);
    if (!p) return { title: "Project not found", crumb: `<a href="#/projects">Projects</a>`, html: `<a class="back-link" href="#/projects">${icon("back")}All projects</a><div class="empty"><p>This project doesn't exist.</p></div>` };
    const edit = canEditProject(p);
    const done = doneCount(p), total = p.tasks.length;
    const tabs = [["board", "Task board"], ["budget", "Budget"], ["milestones", "Milestones"], ["files", "Files"], ["people", "People"]];
    if (!tabs.some(([k]) => k === ui.projTab)) ui.projTab = "board";
    const readNote = edit ? "" : `<div class="notice" style="margin-bottom:1.25rem">${icon("info")}<p>${S.role === "girl12" ? "Your troop leader keeps this board up to date." : "You can view this project. Only its members and adult adviser can make changes."}</p></div>`;
    const html = `
      <a class="back-link" href="#/projects">${icon("back")}All projects</a>
      <div class="page-head"><div><div class="event-tags"><span class="tag tag-outline">${esc(p.track)}</span><span class="tag">Troop ${esc(p.troop)}</span></div>
        <h1>${esc(p.title)}</h1><p>${esc(p.summary)}</p>
        <div class="progress-line" style="max-width:420px;margin-top:0.75rem"><div class="progress"><span style="width:${total ? Math.round((done / total) * 100) : 0}%"></span></div><span>${done} of ${total} tasks done</span></div></div>
        <div class="page-actions"><button class="btn" data-action="export-summary" data-id="${p.id}">${icon("download")}Export progress summary</button></div></div>
      ${/award/i.test(p.track) ? `<p class="xsmall muted" style="margin:-0.75rem 0 1.25rem">Progress summaries help with award paperwork. Official award approval still goes through GSOC.</p>` : ""}
      ${readNote}
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" type="button" aria-selected="${ui.projTab === k}" data-action="proj-tab" data-tab="${k}">${l}</button>`).join("")}</div>
      <div role="tabpanel">${PROJECT_TABS[ui.projTab](p, edit)}</div>`;
    return { title: p.title, crumb: `<a href="#/projects">Projects</a> / ${esc(p.title)}`, html, mount: (root) => mountBoard(root, p, edit) };
  }

  const PROJECT_TABS = {
    board(p, edit) {
      const cols = [["todo", "To do"], ["doing", "In progress"], ["done", "Done"]];
      const moves = { todo: [["doing", "Start"]], doing: [["todo", "Back"], ["done", "Done"]], done: [["doing", "Reopen"]] };
      return `<div class="board">${cols.map(([k, label]) => {
        const tasks = p.tasks.filter((t) => t.status === k).sort((a, b) => a.due - b.due);
        return `<section class="col col-${k}" data-col="${k}" aria-label="${label}"><h3>${label}<span>${tasks.length}</span></h3>
          ${tasks.map((t) => `<div class="task" ${edit ? 'draggable="true"' : ""} data-task="${t.id}"><p class="task-title">${esc(t.title)}</p>
            <div class="task-meta">${avatar(t.who, p.people.some((x) => x.name === t.who && x.adult))}<span>${esc(t.who)}</span>
            <span class="due ${t.due < 0 && k !== "done" ? "is-late" : ""}">${k === "done" ? "" : dueText(t.due)}</span></div>
            ${edit ? `<div class="task-moves">${moves[k].map(([to, l]) => `<button class="btn btn-sm" data-action="task-move" data-pid="${p.id}" data-tid="${t.id}" data-to="${to}">${l}</button>`).join("")}
              <button class="btn btn-ghost btn-sm" data-action="task-remove" data-pid="${p.id}" data-tid="${t.id}" aria-label="Remove task: ${esc(t.title)}" style="margin-left:auto">${icon("x")}</button></div>` : ""}
          </div>`).join("") || `<p class="xsmall muted" style="margin:0.2rem">Nothing here.</p>`}</section>`;
      }).join("")}</div>
      ${edit ? `<form class="add-task" data-form="add-task" data-pid="${p.id}" novalidate>
        <div class="field"><label for="nt-title">New task</label><input id="nt-title" name="title" type="text" maxlength="80" placeholder="What needs doing?"></div>
        <div class="field"><label for="nt-who">Assigned to</label><select id="nt-who" name="who">${p.people.map((x) => `<option>${esc(x.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="nt-due">Due</label><input id="nt-due" name="due" type="date" value="${isoOf(7)}"></div>
        <button class="btn btn-primary" type="submit">${icon("plus")}Add task</button></form>
        <p class="xsmall muted" style="margin-top:0.6rem">Tip: drag tasks between columns, or use the buttons on each task.</p>` : ""}`;
    },
    budget(p, edit) {
      const b = p.budget;
      const planned = b.lines.reduce((n, l) => n + Number(l.planned || 0), 0);
      const actual = b.lines.reduce((n, l) => n + Number(l.actual || 0), 0);
      const pct = b.goal ? Math.min(100, Math.round((b.raised / b.goal) * 100)) : 0;
      return `<dl class="budget-summary"><div class="fact"><dt>Planned budget</dt><dd>${money(planned)}</dd></div><div class="fact"><dt>Spent so far</dt><dd>${money(actual)}</dd></div>
        <div class="fact"><dt>Raised toward ${money(b.goal)} goal</dt><dd>${money(b.raised)}</dd></div></dl>
        <div class="progress-line" style="margin-bottom:1.25rem"><div class="progress is-citrus"><span style="width:${pct}%"></span></div><span>${pct}% of the approved fundraising goal</span></div>
        <div class="table-wrap"><table><caption class="visually-hidden">Budget lines</caption>
          <thead><tr><th scope="col">Item</th><th scope="col" class="num">Planned</th><th scope="col" class="num">Spent</th></tr></thead>
          <tbody>${b.lines.map((l) => `<tr><th scope="row">${esc(l.item)}</th><td class="num">${money(l.planned)}</td>
            <td class="num">${edit ? `<label class="visually-hidden" for="act-${l.id}">Spent on ${esc(l.item)}</label><input class="money-input" id="act-${l.id}" type="number" min="0" step="1" value="${Number(l.actual || 0)}" data-change="budget-actual" data-pid="${p.id}" data-lid="${l.id}" style="margin-left:auto">` : money(l.actual)}</td></tr>`).join("")}</tbody>
          <tfoot><tr><th scope="row">Total</th><td class="num">${money(planned)}</td><td class="num">${money(actual)}</td></tr></tfoot></table></div>
        ${edit ? `<div class="grid-2" style="margin-top:1.25rem">
          <form class="panel" data-form="add-line" data-pid="${p.id}" novalidate><h3 style="font-size:var(--fs-lg)">Add a budget line</h3>
            <div class="field"><label for="bl-item">Item</label><input id="bl-item" name="lineItem" type="text" maxlength="60" placeholder="For example: Table rental"></div>
            <div class="field"><label for="bl-planned">Planned amount</label><input id="bl-planned" name="planned" type="number" min="0" step="1" value="0"></div>
            <button class="btn btn-primary" type="submit">Add line</button></form>
          <form class="panel" data-form="record-funds" data-pid="${p.id}" novalidate><h3 style="font-size:var(--fs-lg)">Record money raised</h3>
            <div class="field"><label for="rf-amt">Amount</label><input id="rf-amt" name="amount" type="number" min="1" step="1" placeholder="0"></div>
            <button class="btn btn-primary" type="submit">Record amount</button></form></div>` : ""}
        <div class="notice notice-citrus" style="margin-top:1.25rem">${icon("info")}<p>Money-earning activities follow Girl Scout fundraising policies, and the troop leader approves every expense.</p></div>`;
    },
    milestones(p, edit) {
      return `<ol class="timeline" role="list">${p.milestones.map((m) => {
        const approval = /approv/i.test(m.title);
        const canToggle = edit && (!approval || S.role === "leader");
        return `<li class="${m.done ? "is-done" : ""}"><span class="mark">${m.done ? icon("check") : ""}</span><h3>${esc(m.title)}</h3>
          <p>${fmtDate(m.offset, { month: "long", day: "numeric" })}, ${m.done ? "done" : rel(m.offset)}${approval ? ". Marked by the adult adviser" : ""}</p>
          ${canToggle ? `<button class="btn btn-sm" data-action="milestone-toggle" data-pid="${p.id}" data-mid="${m.id}">${m.done ? "Mark not done" : "Mark done"}</button>` : ""}</li>`;
      }).join("")}</ol>`;
    },
    files(p, edit) {
      return `<div class="panel"><ul class="rows" role="list">${p.files.map((f) => `<li><span class="tag tag-outline">${esc(f.kind)}</span><div class="row-main"><p class="row-title">${esc(f.title)}</p>
        <p class="row-meta"><span>Added by ${esc(f.by)}</span><span>${rel(f.offset)}</span></p></div></li>`).join("")}</ul>
        ${edit ? `<div class="form-actions" style="margin-top:1rem"><button class="btn" disabled>${icon("plus")}Upload a file</button><span class="xsmall muted">Uploads are turned off in this demo.</span></div>` : ""}</div>`;
    },
    people(p, edit) {
      const others = D.TROOPS.filter((t) => t.id !== p.troop);
      return `<div class="grid-main"><div class="panel"><ul class="rows" role="list">${p.people.map((x) => `<li>${avatar(x.name, x.adult, true)}<div class="row-main"><p class="row-title">${esc(x.name)}</p>
        <p class="row-meta"><span>${esc(x.role)}</span><span>${hostLink(x.troop)}</span>${x.pending ? `<span class="tag tag-citrus">${esc(x.pending)}</span>` : ""}</p></div>${x.adult ? '<span class="tag">Adult adviser</span>' : ""}</li>`).join("")}</ul></div>
        ${edit ? `<form class="panel" data-form="invite" data-pid="${p.id}" novalidate><h3 style="font-size:var(--fs-lg)">Invite a Girl Scout from another troop</h3>
          <p class="small muted">Only verified Girl Scouts can be invited. ${S.role === "girl13" ? "Your leader approves each invite." : "Their troop leader is told when they join."}</p>
          <div class="field"><label for="iv-name">Her first name and last initial</label><input id="iv-name" name="name" type="text" maxlength="40" placeholder="For example: Riley S."></div>
          <div class="field"><label for="iv-troop">Her troop</label><select id="iv-troop" name="troop">${others.map((t) => `<option value="${t.id}">Troop ${t.id}</option>`).join("")}</select></div>
          <button class="btn btn-primary" type="submit">Send invite</button></form>` : ""}</div>`;
    }
  };

  function mountBoard(root, p, edit) {
    if (!edit || ui.projTab !== "board") return;
    let dragId = null;
    $$(".task[draggable]", root).forEach((t) => {
      t.addEventListener("dragstart", (e) => { dragId = t.dataset.task; t.classList.add("is-dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId); });
      t.addEventListener("dragend", () => t.classList.remove("is-dragging"));
    });
    $$(".col", root).forEach((c) => {
      c.addEventListener("dragover", (e) => { e.preventDefault(); c.classList.add("is-over"); });
      c.addEventListener("dragleave", () => c.classList.remove("is-over"));
      c.addEventListener("drop", (e) => {
        e.preventDefault(); c.classList.remove("is-over");
        const id = e.dataTransfer.getData("text/plain") || dragId;
        const task = p.tasks.find((t) => t.id === id);
        if (task && task.status !== c.dataset.col) { task.status = c.dataset.col; commit(); toast(`Moved “${task.title}”`); }
      });
    });
  }

  /* ---------- Messages ---------- */
  function viewMessages(parts) {
    if (!can("messages") && !can("space")) {
      return denied("Messages", S.role === "girl12"
        ? "Messages are for adults and Girl Scouts 13 and older. Your troop leader shares news with your grown-up."
        : "Parents and guardians get updates by email from their troop leader. Messaging is for verified troop leaders, volunteers and Girl Scouts in moderated project spaces.");
    }
    const threads = threadsFor();
    const current = threads.find((t) => t.id === parts[0]) || threads[0];
    const me = R().name;
    const leaders = threads.filter((t) => t.kind === "leader");
    const spaces = threads.filter((t) => t.kind === "space");
    const link = (t) => {
      const last = t.messages[t.messages.length - 1];
      const title = t.kind === "leader" ? `${t.with}` : t.subject;
      const sub = t.kind === "leader" ? `${t.subject}: ${last ? last.text : ""}` : (last ? `${last.from}: ${last.text}` : "");
      return `<a class="thread-link" href="#/messages/${t.id}" ${current && t.id === current.id ? 'aria-current="true"' : ""}>${t.kind === "leader" ? avatar(t.with, true) : `<span class="avatar">${icon("users").replace("<svg", '<svg style="width:1rem;height:1rem"')}</span>`}
        <span style="min-width:0"><span class="t-title">${esc(title)}</span><span class="t-snip">${esc(sub)}</span></span></a>`;
    };
    let convo = `<div class="convo"><div class="empty" style="margin:1.25rem">No conversations yet.</div></div>`;
    if (current) {
      const isSpace = current.kind === "space";
      const head = isSpace
        ? `<h2>${esc(current.subject)}</h2><p>Project space for <a href="#/projects/${current.project}">${esc(proj(current.project) ? proj(current.project).title : "")}</a>. Moderated by ${esc(current.moderators.join(" and "))}.</p>`
        : `<h2>${esc(current.with)}</h2><p>${esc(current.subject)}. ${esc(hostName(current.troop))}, verified adult.</p>`;
      const note = isSpace
        ? `<div class="notice">${icon("shield")}<p>Adult advisers can read every message here. There are no private messages between adults and girls.</p></div>`
        : "";
      const canPost = !(isSpace && S.role === "admin");
      convo = `<div class="convo"><div class="convo-head">${head}</div>${note}
        <div class="convo-body" id="convo-body">${current.messages.map((m) => `<div class="bubble-row${m.from === me ? " is-me" : ""}">${avatar(m.from, isAdultName(m.from))}
          <div class="bubble"><span class="b-meta">${esc(m.from)}, ${rel(m.offset)}</span>${esc(m.text)}</div></div>`).join("")}</div>
        ${canPost ? `<form class="composer" data-form="send-message" data-thread="${current.id}"><label class="visually-hidden" for="msg-text">Message</label>
          <textarea id="msg-text" name="text" maxlength="800" placeholder="${isSpace ? "Message the project space" : `Message ${esc(current.with)}`}" rows="1"></textarea>
          <button class="btn btn-primary" type="submit">Send</button></form>` : `<p class="xsmall muted" style="padding:0.9rem 1.25rem;margin:0;border-top:1px solid var(--mist)">Council moderation view. Read only.</p>`}</div>`;
    }
    const html = `
      <div class="page-head"><div><h1>${can("messages") ? "Messages" : "Project spaces"}</h1>
        <p>${can("messages") ? "Conversations with other verified leaders and volunteers, plus project spaces you moderate." : "Group chats for your projects. Troop adults moderate every space."}</p></div>
        ${can("messages") ? `<div class="page-actions"><button class="btn btn-primary" data-action="new-message">${icon("plus")}New message</button></div>` : ""}</div>
      <div class="messages"><nav class="thread-list" aria-label="Conversations">
        ${leaders.length ? `<p class="thread-group">Leaders and volunteers</p>${leaders.map(link).join("")}` : ""}
        ${spaces.length ? `<p class="thread-group">Project spaces</p>${spaces.map(link).join("")}` : ""}
      </nav>${convo}</div>`;
    return {
      title: "Messages", crumb: current ? `<a href="#/messages">Messages</a> / ${esc(current.kind === "leader" ? current.with : current.subject)}` : "Messages", html,
      mount(root) { const b = $("#convo-body", root); if (b) b.scrollTop = b.scrollHeight; }
    };
  }
  const ADULT_NAMES = new Set([...D.TROOPS.map((t) => t.leader), ...D.SERVICE_UNITS.map((s) => s.coordinator), ...D.ROLES.filter((r) => !["girl13", "girl12"].includes(r.id)).map((r) => r.name)]);
  const isAdultName = (n) => ADULT_NAMES.has(n);

  /* ---------- Opportunities ---------- */
  function viewOpportunities() {
    const cats = ["All", ...Array.from(new Set(S.opps.map((o) => o.cat)))];
    if (!cats.includes(ui.oppCat)) ui.oppCat = "All";
    const list = S.opps.filter((o) => ui.oppCat === "All" || o.cat === ui.oppCat);
    const canPost = can("post") || can("proposePost");
    const html = `
      <div class="page-head"><div><h1>Opportunities</h1><p>Requests and offers from troops and service units across the council: volunteers needed, joint projects, mentorship and gear to lend.</p></div>
        ${canPost ? `<div class="page-actions"><button class="btn btn-primary" data-action="opp-post">${icon("plus")}Post an opportunity</button></div>` : ""}</div>
      <div class="chip-filter" role="group" aria-label="Filter by category">${cats.map((c) => `<button type="button" data-action="opp-cat" data-cat="${esc(c)}" aria-pressed="${ui.oppCat === c}">${esc(c)}</button>`).join("")}</div>
      <div class="panel">${list.map(oppRow).join("") || `<div class="empty"><p>Nothing in this category yet.</p></div>`}</div>`;
    return { title: "Opportunities", crumb: "Opportunities", html };
  }
  function oppRow(o) {
    const mine = !!S.oppInterest[o.id];
    const adultOnly = o.cat === "Volunteers needed";
    let btn;
    if (S.role === "girl12") btn = `<button class="btn btn-sm" data-action="tell-grownup" data-id="${o.id}">Tell my grown-up</button>`;
    else if (adultOnly && !isAdult()) btn = `<span class="xsmall muted">For adult volunteers</span>`;
    else if (o.cat === "Announcement") btn = "";
    else btn = `<button class="btn btn-sm ${mine ? "btn-primary" : ""}" data-action="opp-interest" data-id="${o.id}" aria-pressed="${mine}">${mine ? `${icon("check")}Interested` : "I'm interested"}</button>`;
    return `<article class="opp">${troopById[o.troop] ? troopPatch(o.troop, "patch-sm") : `<span class="patch patch-sm" style="--patch-color:var(--pine-2)" aria-hidden="true">SU</span>`}
      <div><span class="tag ${{ "Volunteers needed": "tag-citrus", Mentorship: "tag-sky", Announcement: "tag-outline" }[o.cat] || ""}">${esc(o.cat)}</span>
      <h3>${esc(o.title)}</h3><p>${esc(o.body)}</p>
      <p class="row-meta"><span>Posted by ${hostLink(o.troop)}</span><span>${cap1(rel(o.offset))}</span><span>${o.interested + (mine ? 1 : 0)} interested</span></p></div>
      <div>${btn}</div></article>`;
  }

  /* ---------- My troop ---------- */
  function viewTroopHome() {
    if (!can("troop")) return denied("My Troop", "Service unit coordinators and council administrators aren't attached to one troop. Use Explore to see any troop's public profile.");
    const r = R();
    const t = troopById[r.troop];
    const members = D.TROOP_MEMBERS[t.id];
    const showMembers = (S.role === "leader" || S.role === "girl13") && members;
    const html = `
      <div class="profile-head">${troopPatch(t.id, "patch-lg")}<div><h1>Troop ${esc(t.id)}</h1><p class="su">${esc(suById[t.su].name)}. Leader: ${esc(t.leader)}</p><div class="levels">${levelChips(t.levels)}</div></div>
        <div class="page-actions"><a class="btn" href="#/explore/troop/${t.id}">View public profile</a></div></div>
      <div class="grid-main"><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Troop calendar</h2><span class="tag tag-outline">${icon("lock")}Private to the troop</span></div>
          ${agendaRows(agenda(t.id, regKey(), 8), "<p>Nothing scheduled.</p>")}</section>
        <section class="panel"><div class="panel-head"><h2>Resources</h2></div>
          <ul class="rows" role="list">${(D.TROOP_RESOURCES[t.id] || []).map((x) => `<li><span class="tag tag-outline">${esc(x.kind)}</span><div class="row-main"><p class="row-title">${esc(x.title)}</p><p class="row-meta"><span>Shared by ${esc(x.by)}</span></p></div></li>`).join("")}</ul></section>
      </div><div class="stack-gap">
        <section class="panel"><div class="panel-head"><h2>Members</h2><span class="muted small">${t.girls} girls</span></div>
          ${showMembers ? `<ul class="rows" role="list">${members.map(([n, l]) => `<li>${avatar(n)}<div class="row-main"><p class="row-title" style="font-weight:600">${esc(n)}</p></div><span class="lvl" style="--lv:${levelById[l].hex}">${levelById[l].name}</span></li>`).join("")}</ul>
            <p class="xsmall muted" style="margin:0.9rem 0 0">Only Troop ${esc(t.id)}'s girls and verified adults can see this list.</p>`
            : `<div class="notice">${icon("lock")}<p>The member list is visible to the troop leader${S.role === "parent" ? ". You'll see Lily's activities on your dashboard." : "."}</p></div>`}
        </section>
        ${S.role === "leader" ? `<section class="panel"><div class="panel-head"><h2>Profile visibility</h2><a href="#/settings">Change</a></div>
          <dl class="kv"><dt>Listed in directory</dt><dd>${S.privacy.listed ? "Yes" : "No"}</dd><dt>Collaboration requests</dt><dd>${S.privacy.collab ? "Accepted" : "Turned off"}</dd><dt>Shareable events on profile</dt><dd>${S.privacy.calendar ? "Shown" : "Hidden"}</dd></dl></section>` : ""}
      </div></div>`;
    return { title: "My Troop", crumb: "My Troop", html };
  }

  /* ---------- Admin ---------- */
  function viewAdmin() {
    if (!can("admin")) return denied("Council admin", "This area is for GSOC administrators who verify volunteers and moderate content.");
    const html = `
      <div class="page-head"><div><h1>Council admin</h1><p>Verify volunteers, moderate content and keep service unit data current. Sample data only.</p></div></div>
      <div class="grid-2"><section class="panel"><div class="panel-head"><h2>Volunteer verification</h2></div>${verificationRows()}</section>
        <section class="panel"><div class="panel-head"><h2>Flagged content</h2></div>${flagRows()}</section></div>
      <section class="panel" style="margin-top:1.25rem"><div class="panel-head"><h2>Service units</h2></div>
        <div class="table-wrap"><table><caption class="visually-hidden">Service unit summary</caption>
          <thead><tr><th scope="col">Service unit</th><th scope="col">Coordinator</th><th scope="col">Area</th><th scope="col" class="num">Troops</th><th scope="col" class="num">Girls</th></tr></thead>
          <tbody>${D.SERVICE_UNITS.map((s) => { const ts = D.TROOPS.filter((t) => t.su === s.id); return `<tr><th scope="row">${esc(s.name)}</th><td>${esc(s.coordinator)}</td><td>${esc(s.area)}</td><td class="num">${ts.length}</td><td class="num">${ts.reduce((n, t) => n + t.girls, 0)}</td></tr>`; }).join("")}</tbody>
        </table></div></section>`;
    return { title: "Council admin", crumb: "Council admin", html };
  }

  /* ---------- Settings ---------- */
  const PERMS = [
    ["Browse the troop directory", { admin: 1, coordinator: 1, leader: 1, girl13: 1, parent: 1, girl12: "Simplified" }],
    ["Contact other troop leaders", { admin: 1, coordinator: 1, leader: 1 }],
    ["Create and publish events", { admin: 1, coordinator: 1, leader: 1 }],
    ["Propose events for review", { girl13: 1 }],
    ["Register for events", { leader: "For the troop", girl13: "With caregiver OK", parent: "For their child", girl12: "Through caregiver" }],
    ["Leader-to-leader messages", { admin: 1, coordinator: 1, leader: 1 }],
    ["Moderated project spaces", { admin: "Moderate", coordinator: "Moderate", leader: "Moderate", girl13: "Take part" }],
    ["Manage project boards", { leader: 1, girl13: 1 }],
    ["Approve girl-led proposals", { leader: 1 }],
    ["See own troop's member list", { leader: 1, girl13: 1 }],
    ["Verify volunteers and moderate content", { admin: 1 }]
  ];
  const ROLE_ORDER = ["admin", "coordinator", "leader", "girl13", "parent", "girl12"];

  function viewSettings() {
    const html = `
      <div class="page-head"><div><h1>Settings</h1><p>In the real platform this is where you'd manage your account. In the demo, switch roles to see how the platform changes for each person.</p></div></div>
      <section class="panel"><div class="panel-head"><h2>View the demo as</h2></div>
        <div class="role-options" role="radiogroup" aria-label="Demo role">${D.ROLES.map((r) => `<label class="role-option"><input type="radio" name="role" value="${r.id}" ${S.role === r.id ? "checked" : ""} data-change="role">
          <span><strong>${esc(r.label)}</strong><small>${esc(r.name)}, ${esc(r.detail)}</small></span></label>`).join("")}</div></section>
      <section class="panel"><div class="panel-head"><h2>What each role can do</h2></div>
        <div class="table-wrap"><table class="perm-table"><caption class="visually-hidden">Permissions by role</caption>
          <thead><tr><th scope="col">Permission</th>${ROLE_ORDER.map((id) => `<th scope="col" class="${id === S.role ? "is-current" : ""}">${esc(roleById[id].label)}</th>`).join("")}</tr></thead>
          <tbody>${PERMS.map(([label, m]) => `<tr><th scope="row">${esc(label)}</th>${ROLE_ORDER.map((id) => {
            const v = m[id];
            const cell = v === 1 ? `<span class="perm-yes">Yes</span>` : v ? `<span class="perm-yes">${esc(v)}</span>` : `<span class="perm-no"><span aria-hidden="true">—</span><span class="visually-hidden">No</span></span>`;
            return `<td class="${id === S.role ? "is-current" : ""}">${cell}</td>`;
          }).join("")}</tr>`).join("")}</tbody></table></div></section>
      ${S.role === "leader" ? `<section class="panel"><div class="panel-head"><h2>Troop 101 profile privacy</h2></div>
        ${[["listed", "List Troop 101 in the directory", "Other verified users can find your troop."], ["collab", "Accept collaboration requests", "Other leaders can send requests to work together."], ["calendar", "Show shareable events on the profile", "Only events you mark as service unit or council-wide appear."]].map(([k, l, d]) => `
          <div class="toggle-row"><div><label for="pv-${k}" class="row-title">${l}</label><p>${d}</p></div><span class="switch"><input type="checkbox" role="switch" id="pv-${k}" ${S.privacy[k] ? "checked" : ""} data-change="privacy" data-key="${k}"><span></span></span></div>`).join("")}
        <p class="xsmall muted" style="margin:0.6rem 0 0">Member lists, private meetings and travel plans are always private.</p></section>` : ""}
      <section class="panel"><div class="panel-head"><h2>Reset the demo</h2></div>
        <p class="small muted">Puts every event, project, message and setting back the way it started. Only affects this browser.</p>
        <button class="btn btn-danger" data-action="reset-demo">Reset demo data</button></section>`;
    return { title: "Settings", crumb: "Settings", html };
  }

  function viewNotFound() {
    return { title: "Page not found", crumb: "", html: `<div class="empty"><p>That page doesn't exist in the demo.</p><p><a href="#/dashboard">Go to your dashboard</a></p></div>` };
  }

  const VIEWS = { dashboard: viewDashboard, explore: viewExplore, events: viewEvents, projects: viewProjects, messages: viewMessages, troop: viewTroopHome, opportunities: viewOpportunities, admin: viewAdmin, settings: viewSettings };

  /* =====================================================================
     Render
     ===================================================================== */
  function route() { return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent); }

  function render(opts = {}) {
    const parts = route();
    const page = parts[0] || "dashboard";
    const view = VIEWS[page] || viewNotFound;
    const out = view(parts.slice(1));
    const main = $("#main");
    main.innerHTML = out.html;
    document.title = `${out.title} | ScoutLink OC demo`;
    $("#crumb").innerHTML = out.crumb || "";
    renderNav(page);
    renderWho();
    if (out.mount) out.mount(main);
    if (opts.routeChanged) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
  function commit() { save(); render(); }

  window.addEventListener("hashchange", () => { closeModal(); closeSidebar(); render({ routeChanged: true }); });

  /* =====================================================================
     Actions (clicks)
     ===================================================================== */
  const ACTIONS = {
    "close-modal": closeModal,

    "explore-view"(d) { ui.exploreView = d.view; renderExploreResults(); },
    "clear-filters"() { Object.assign(ui, { q: "", level: "", su: "", interest: "" }); render(); },
    "events-view"(d) { ui.evView = d.view; $$('[data-action="events-view"]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === ui.evView))); renderEventResults(); },
    "clear-event-filters"() { Object.assign(ui, { evType: "", evLevel: "", evMine: false }); render(); },
    "cal-move"(d) { const n = Number(d.dir); ui.calMonth = n === 0 ? 0 : ui.calMonth + n; renderEventResults(); },
    "proj-tab"(d) { ui.projTab = d.tab; render(); const tab = $(`[data-action="proj-tab"][data-tab="${d.tab}"]`); if (tab) tab.focus(); },
    "opp-cat"(d) { ui.oppCat = d.cat; render(); },

    register(d) {
      const e = ev(d.id);
      if (!e) return;
      const full = spotsLeft(e) === 0;
      const left = spotsLeft(e);
      let body = "";
      if (S.role === "leader" && e.adultsOnly) {
        body = full ? `<div class="notice notice-citrus">${icon("info")}<p>This meeting is full. Join the waitlist and you'll be told if spots open up.</p></div>` : `
          <div class="field"><label for="rg-adults">Adults from Troop ${esc(R().troop)} attending</label><input id="rg-adults" name="adults" type="number" min="1" max="${Math.min(left, 6)}" value="1"><p class="hint">${left} spots left</p></div>`;
      } else if (S.role === "leader") {
        body = full ? `<div class="notice notice-citrus">${icon("info")}<p>This event is full. Join the waitlist and you'll be told if spots open up.</p></div>` : `
          <div class="form-grid"><div class="field"><label for="rg-girls">Girls attending</label><input id="rg-girls" name="girls" type="number" min="1" max="${left}" value="${Math.min(6, left)}"><p class="hint">${left} spots left</p></div>
          <div class="field"><label for="rg-adults">Adults attending</label><input id="rg-adults" name="adults" type="number" min="1" max="20" value="2"><p class="hint">Follow Safety Activity Checkpoints ratios.</p></div></div>`;
        if (e.caregiver) body += `<div class="field" data-err="perm"><label class="check"><input type="checkbox" name="perm">I've collected caregiver permission for every girl attending</label></div>`;
      } else if (S.role === "girl13") {
        body = `<p>${full ? "This event is full, so you'll join the waitlist." : `You're signing up as ${esc(R().name)}, Troop ${esc(R().troop)}.`}</p>
          ${e.caregiver ? `<div class="notice">${icon("info")}<p>Your caregiver will be asked for permission. Your spot is confirmed once they say yes.</p></div>` : ""}`;
      } else if (S.role === "parent") {
        body = `${full ? `<div class="notice notice-citrus" style="margin-bottom:1rem">${icon("info")}<p>This event is full. ${esc(R().childName)} will join the waitlist.</p></div>` : ""}
          <div class="field" data-err="perm"><label class="check"><input type="checkbox" name="perm">I give permission for ${esc(R().childName)} to attend</label></div>
          <div class="field"><label for="rg-note">Anything the organizers should know? (optional)</label><textarea id="rg-note" name="note" maxlength="300" placeholder="Allergies, accessibility needs, pickup notes"></textarea><p class="hint">Shared with the host troop's verified leader only.</p></div>`;
      }
      openModal(`${modalHead(full ? "Join the waitlist" : e.adultsOnly ? "RSVP" : "Register", `${esc(e.title)}, ${fmtDate(e.offset)}`)}
        <form data-form="register" data-id="${e.id}" novalidate>${body}
        <div class="modal-foot"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${full ? "Join waitlist" : e.adultsOnly ? "RSVP" : S.role === "girl13" ? "Sign up" : "Register"}</button></div></form>`);
    },

    "cancel-reg"(d) {
      const e = ev(d.id), k = regKey();
      const reg = e && S.regs[e.id] && S.regs[e.id][k];
      if (!reg) return;
      if (reg.status === "waitlist") e.waitlist = Math.max(0, e.waitlist - 1);
      else if (reg.status === "confirmed") e.registered = Math.max(0, e.registered - (reg.girls || 1));
      delete S.regs[e.id][k];
      S.permissionRequests = S.permissionRequests.filter((p) => !(p.eventId === e.id && p.status === "pending"));
      commit();
      toast("Registration canceled");
    },

    "ask-caregiver"(d) {
      const e = ev(d.id);
      S.regs[e.id] = S.regs[e.id] || {};
      S.regs[e.id]["girl:lily"] = { status: "awaiting", girls: 1 };
      S.permissionRequests.push({ id: uid("pr"), eventId: e.id, status: "pending", offset: 0 });
      commit();
      toast("Sent! Your grown-up will see your request.");
    },

    "perm-approve"(d) {
      const q = S.permissionRequests.find((p) => p.id === d.id);
      if (!q) return;
      const e = ev(q.eventId);
      q.status = "approved";
      const full = spotsLeft(e) === 0;
      S.regs[e.id] = S.regs[e.id] || {};
      S.regs[e.id]["girl:lily"] = { status: full ? "waitlist" : "confirmed", girls: 1 };
      if (full) e.waitlist += 1; else e.registered += 1;
      commit();
      toast(full ? `Lily is on the waitlist for ${e.title}` : `Permission given. Lily is registered for ${e.title}.`);
    },
    "perm-decline"(d) {
      const q = S.permissionRequests.find((p) => p.id === d.id);
      if (!q) return;
      q.status = "declined";
      if (S.regs[q.eventId]) delete S.regs[q.eventId]["girl:lily"];
      commit();
      toast("Request declined");
    },

    attendees(d) {
      const e = ev(d.id);
      const rows = attendeeRows(e);
      openModal(`${modalHead("Attendees", `${esc(e.title)}, ${fmtDate(e.offset)}`)}
        <p class="small muted">Lists show troops and head counts only. Girls' names stay with their own troop leaders.</p>
        <div class="table-wrap"><table><thead><tr><th scope="col">Troop</th><th scope="col" class="num">Girls</th><th scope="col" class="num">Adults</th>${e.caregiver ? '<th scope="col">Permission</th>' : ""}</tr></thead>
          <tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.troop)}</th><td class="num">${r.girls}</td><td class="num">${r.adults}</td>${e.caregiver ? `<td>${esc(r.perm)}</td>` : ""}</tr>`).join("")}</tbody>
          <tfoot><tr><th scope="row">Total</th><td class="num">${rows.reduce((n, r) => n + r.girls, 0)}</td><td class="num">${rows.reduce((n, r) => n + r.adults, 0)}</td>${e.caregiver ? "<td></td>" : ""}</tr></tfoot></table></div>
        <div class="modal-foot"><button class="btn" type="button" data-action="close-modal">Close</button><button class="btn btn-primary" type="button" data-action="attendees-csv" data-id="${e.id}">${icon("download")}Download list (CSV)</button></div>`);
    },
    "attendees-csv"(d) {
      const e = ev(d.id);
      const rows = attendeeRows(e);
      const csv = ["Troop,Girls,Adults,Caregiver permission", ...rows.map((r) => `"${r.troop}",${r.girls},${r.adults},"${r.perm}"`)].join("\n");
      download(`${e.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendees.csv`, csv, "text/csv");
      toast("Attendee list downloaded");
    },

    "review-proposal"(d) {
      const p = S.proposals.find((x) => x.id === d.id);
      if (!p) return;
      openModal(`${modalHead("Review proposal", `From ${esc(p.by)}, sent ${rel(p.sent)}`)}
        <h3 style="font-size:var(--fs-lg)">${esc(p.title)}</h3><p class="small">${esc(p.desc)}</p>
        <dl class="kv" style="margin-bottom:1rem"><dt>When</dt><dd>${fmtDate(p.offset, { weekday: "long", month: "long", day: "numeric" })}, ${esc(p.time)}</dd><dt>Type</dt><dd>${esc(p.type)}</dd>
          <dt>Where</dt><dd>${esc(p.area)}</dd><dt>Capacity</dt><dd>${p.capacity}</dd><dt>Open to</dt><dd>${p.adultsOnly ? "Adults only" : p.levels.map((l) => levelById[l].name).join(", ")}</dd><dt>Visibility</dt><dd>${esc(p.visibility)}</dd>
          <dt>Caregiver permission</dt><dd>${p.caregiver ? "Required" : "Not required"}</dd></dl>
        <form data-form="review" data-id="${p.id}" novalidate><div class="field"><label for="rv-note">Note to ${esc(p.by.split(" ")[0])} (needed if you request changes)</label><textarea id="rv-note" name="note" maxlength="300" placeholder="What should she change?"></textarea></div>
        <div class="modal-foot"><button class="btn" type="submit" name="decision" value="changes">Request changes</button><button class="btn btn-primary" type="submit" name="decision" value="approve" autofocus>Approve and publish</button></div></form>`);
    },

    "collab-accept"(d) {
      const c = S.collab.find((x) => x.id === d.id);
      c.status = "accepted";
      const from = troopById[c.from];
      const id = uid("th");
      S.threads.push({ id, kind: "leader", owner: "leader", with: from.leader, troop: c.from, subject: "Collaboration request", messages: [{ from: from.leader, offset: c.offset, text: c.text }, { from: R().name, offset: 0, text: "We'd love to! I'll ask our Seniors who wants to mentor. What dates work for your next hike?" }] });
      commit();
      toast(`Accepted. Your conversation with ${from.leader} is in Messages.`);
    },
    "collab-decline"(d) { const c = S.collab.find((x) => x.id === d.id); c.status = "declined"; commit(); toast("Request declined"); },

    "post-approve"(d) {
      const o = S.oppPending.find((x) => x.id === d.id);
      o.status = "approved";
      S.opps.unshift({ id: uid("o"), cat: o.cat, troop: o.troop, title: o.title, body: o.body, offset: 0, interested: 0 });
      commit(); toast("Posted to the opportunity board");
    },
    "post-decline"(d) { const o = S.oppPending.find((x) => x.id === d.id); o.status = "declined"; commit(); toast("Post declined"); },

    "verify-approve"(d) { const v = S.verification.find((x) => x.id === d.id); S.verification = S.verification.filter((x) => x.id !== d.id); commit(); toast(`${v.name} is now verified`); },
    "verify-decline"(d) { const v = S.verification.find((x) => x.id === d.id); S.verification = S.verification.filter((x) => x.id !== d.id); commit(); toast(`${v.name} was not verified`); },
    "flag-remove"(d) { S.flags = S.flags.filter((x) => x.id !== d.id); commit(); toast("Personal details removed from the post"); },
    "flag-dismiss"(d) { S.flags = S.flags.filter((x) => x.id !== d.id); commit(); toast("Flag dismissed"); },

    "contact-leader"(d) { messageModal(troopById[d.troop].leader, d.troop, `Collaboration with Troop ${d.troop}`); },
    "new-message"() { messageModal("", "", ""); },

    "opp-interest"(d) {
      S.oppInterest[d.id] = !S.oppInterest[d.id];
      if (!S.oppInterest[d.id]) delete S.oppInterest[d.id];
      commit();
      toast(S.oppInterest[d.id] ? "The poster will see you're interested" : "Removed your interest");
    },
    "tell-grownup"() { toast("We'll show this to your grown-up next time they sign in."); },
    "opp-post"() {
      const propose = !can("post");
      openModal(`${modalHead(propose ? "Suggest an opportunity" : "Post an opportunity", propose ? "Your troop leader reviews posts before they go up." : `Posting as ${esc(hostName(hostKeyForRole()))}`)}
        <form data-form="opp-post" novalidate>
          <div class="field"><label for="op-cat">Category</label><select id="op-cat" name="cat">${["Volunteers needed", "Joint project", "Event participants", "Mentorship", "Resource share", ...(isLeaderish() ? ["Announcement"] : [])].filter((c) => !(propose && c === "Volunteers needed")).map((c) => `<option>${c}</option>`).join("")}</select></div>
          <div class="field"><label for="op-title">Title</label><input id="op-title" name="title" type="text" maxlength="80" placeholder="What are you looking for or offering?"></div>
          <div class="field"><label for="op-body">Details</label><textarea id="op-body" name="body" maxlength="400"></textarea>
            <p class="hint">Leave out phone numbers, addresses and last names. People respond through ScoutLink.</p></div>
          <div class="modal-foot"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${propose ? "Send for review" : "Post"}</button></div></form>`);
    },

    "task-move"(d) {
      const p = proj(d.pid), t = p && p.tasks.find((x) => x.id === d.tid);
      if (!t) return;
      t.status = d.to;
      commit();
      toast(`“${t.title}” moved to ${{ todo: "To do", doing: "In progress", done: "Done" }[d.to]}`);
    },
    "task-remove"(d) {
      const p = proj(d.pid);
      const t = p.tasks.find((x) => x.id === d.tid);
      p.tasks = p.tasks.filter((x) => x.id !== d.tid);
      commit();
      toast(`Removed “${t.title}”`);
    },
    "milestone-toggle"(d) {
      const p = proj(d.pid), m = p.milestones.find((x) => x.id === d.mid);
      m.done = !m.done;
      commit();
      toast(m.done ? `Marked “${m.title}” done` : `Marked “${m.title}” not done`);
    },
    "export-summary"(d) { exportSummary(proj(d.id)); },
    "new-project"() {
      openModal(`${modalHead("Start a project", S.role === "girl13" ? "Dana R. will be your adult adviser." : "You'll be the adult adviser.")}
        <form data-form="new-project" novalidate>
          <div class="field"><label for="np-title">Project name</label><input id="np-title" name="title" type="text" maxlength="60" placeholder="For example: Little free library"></div>
          <div class="field"><label for="np-track">Type</label><select id="np-track" name="track"><option>Troop initiative</option><option>Bronze Award</option><option>Silver Award</option><option>Gold Award</option></select></div>
          <div class="field"><label for="np-sum">What's it about?</label><textarea id="np-sum" name="summary" maxlength="240"></textarea></div>
          <div class="modal-foot"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Create project</button></div></form>`);
    },

    "reset-demo"() {
      openModal(`${modalHead("Reset the demo?", "Every change you've made in this browser will be undone.")}
        <div class="modal-foot"><button class="btn btn-ghost" type="button" data-action="close-modal">Keep my changes</button><button class="btn btn-danger" type="button" data-action="reset-confirm">Reset demo data</button></div>`);
    },
    "reset-confirm"() {
      const role = S.role;
      S = seed(); S.role = role;
      Object.assign(ui, { q: "", level: "", su: "", interest: "", sort: "number", evType: "", evLevel: "", evMine: false, calMonth: 0, projTab: "board", oppCat: "All" });
      closeModal(); commit(); toast("Demo data reset");
    }
  };

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b || b.disabled) return;
    const fn = ACTIONS[b.dataset.action];
    if (fn) { e.preventDefault(); fn(b.dataset, b, e); }
  });

  function attendeeRows(e) {
    const rows = [];
    // Real registrations made in the demo
    Object.entries(S.regs[e.id] || {}).forEach(([k, r]) => {
      if (r.status === "waitlist") return;
      if (k.startsWith("troop:")) rows.push({ troop: "Troop " + k.slice(6), girls: r.girls || 0, adults: r.adults || 0, perm: "All received" });
      else if (k === "girl:maya") rows.push({ troop: "Troop 101 (individual)", girls: 1, adults: 0, perm: r.status === "confirmed" ? "Received" : "Pending" });
      else if (k === "girl:lily") rows.push({ troop: "Troop 959 (individual)", girls: 1, adults: 0, perm: r.status === "confirmed" ? "Received" : "Pending" });
    });
    // Fill the rest of the registered count with sample troops so totals match
    let remaining = e.registered - rows.reduce((n, r) => n + r.girls, 0);
    const pool = D.TROOPS.filter((t) => t.id !== e.host && (e.adultsOnly || t.levels.some((l) => e.levels.includes(l))) && !rows.some((r) => r.troop.startsWith("Troop " + t.id)));
    let i = 0;
    while (remaining > 0 && pool.length) {
      const t = pool[i % pool.length];
      const n = Math.min(remaining, e.adultsOnly ? 1 + (i % 2) : 3 + ((Number(t.id) + i) % 6));
      const existing = rows.find((r) => r.troop === "Troop " + t.id);
      if (existing) existing.girls += n;
      else rows.push({ troop: "Troop " + t.id, girls: n, adults: e.adultsOnly ? 0 : Math.max(2, Math.ceil(n / 6)), perm: (i % 4 === 3) ? "1 pending" : "All received" });
      remaining -= n; i++;
    }
    if (e.adultsOnly) rows.forEach((r) => { r.adults = r.girls; r.girls = 0; r.perm = "n/a"; });
    return rows;
  }

  function messageModal(toName, troop, subject) {
    const r = R();
    const people = [
      ...D.TROOPS.filter((t) => t.leader !== r.name).map((t) => ({ name: t.leader, troop: t.id, label: `${t.leader}, Troop ${t.id} leader` })),
      ...D.SERVICE_UNITS.filter((s) => s.coordinator !== r.name).map((s) => ({ name: s.coordinator, troop: "su:" + s.id, label: `${s.coordinator}, ${s.short} coordinator` }))
    ];
    openModal(`${modalHead(toName ? `Message ${toName}` : "New message", "Messages go to verified adults only.")}
      <form data-form="new-message" novalidate>
        <div class="field"><label for="nm-to">To</label><select id="nm-to" name="to">${people.map((p) => `<option value="${esc(p.name)}|${esc(p.troop)}" ${p.name === toName ? "selected" : ""}>${esc(p.label)}</option>`).join("")}</select></div>
        <div class="field"><label for="nm-subject">Subject</label><input id="nm-subject" name="subject" type="text" maxlength="80" value="${esc(subject)}"></div>
        <div class="field"><label for="nm-text">Message</label><textarea id="nm-text" name="text" maxlength="800" placeholder="Introduce your troop and what you'd like to do together" ${toName ? "autofocus" : ""}></textarea></div>
        <div class="modal-foot"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Send message</button></div></form>`);
  }

  function exportSummary(p) {
    const b = p.budget;
    const planned = b.lines.reduce((n, l) => n + Number(l.planned || 0), 0);
    const spent = b.lines.reduce((n, l) => n + Number(l.actual || 0), 0);
    const byStatus = (s) => p.tasks.filter((t) => t.status === s).map((t) => `  - ${t.title} (${t.who}${s === "done" ? "" : ", due " + fmtDate(t.due, { month: "short", day: "numeric" })})`).join("\n") || "  - none";
    const text = `${p.title}
Progress summary exported ${fmtDate(0, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}

Troop: ${p.troop}
Type: ${p.track}
Project lead: ${p.lead}
Adult adviser: ${p.adviser}

${p.summary}

TASKS (${doneCount(p)} of ${p.tasks.length} done)
Done:
${byStatus("done")}
In progress:
${byStatus("doing")}
To do:
${byStatus("todo")}

MILESTONES
${p.milestones.map((m) => `  [${m.done ? "x" : " "}] ${m.title}, ${fmtDate(m.offset, { month: "short", day: "numeric" })}`).join("\n")}

BUDGET
  Planned: ${money(planned)}
  Spent: ${money(spent)}
  Raised: ${money(b.raised)} of ${money(b.goal)} goal

TEAM
${p.people.map((x) => `  - ${x.name}, ${x.role}`).join("\n")}

This summary is a planning record from ScoutLink OC (demo). It does not grant official award approval; awards are approved by the council.
`;
    download(`${p.id}-progress-summary.txt`, text);
    toast("Progress summary downloaded");
  }

  /* =====================================================================
     Forms (submit)
     ===================================================================== */
  const FORMS = {
    "create-event"(f) {
      clearErrors(f);
      const v = Object.fromEntries(new FormData(f).entries());
      const levels = new FormData(f).getAll("levels");
      const adultsOnly = !!f.elements.adultsOnly && f.elements.adultsOnly.checked;
      let ok = true;
      if (!v.title.trim()) { setError(f, "title", "Add a title so people know what the event is."); ok = false; }
      if (!v.date) { setError(f, "date", "Pick a date."); ok = false; }
      else if (offsetOf(v.date) < 1) { setError(f, "date", "Pick a date after today."); ok = false; }
      if (!v.time) { setError(f, "time", "Pick a start time."); ok = false; }
      const capNum = Number(v.capacity);
      if (!Number.isInteger(capNum) || capNum < 1 || capNum > 500) { setError(f, "capacity", "Enter a capacity between 1 and 500."); ok = false; }
      if (!v.area.trim()) { setError(f, "area", "Add a general area, like a city."); ok = false; }
      if (!adultsOnly && !levels.length) { setError(f, "levels", "Choose at least one Girl Scout level, or mark the event adults only."); ok = false; }
      if (!ok) { const first = f.querySelector("[aria-invalid]"); if (first) first.focus(); return; }

      const base = {
        title: v.title.trim(), type: v.type, offset: offsetOf(v.date), time: fmtTime(v.time), capacity: capNum,
        visibility: v.visibility, area: v.area.trim(), levels: adultsOnly ? [] : levels, adultsOnly,
        caregiver: !!f.elements.caregiver.checked && !adultsOnly, desc: v.desc.trim() || "Details coming soon."
      };
      if (can("createEvent")) {
        const id = uid("e");
        S.events.push(Object.assign(base, { id, host: hostKeyForRole(), registered: 0, waitlist: 0 }));
        save();
        toast("Event published");
        location.hash = "#/events/" + id;
      } else {
        S.proposals.push(Object.assign(base, { id: uid("p"), by: R().name, troop: R().troop, status: "pending", sent: 0 }));
        save();
        toast(`Sent to ${troopById[R().troop].leader} for review`);
        location.hash = "#/dashboard";
      }
    },

    register(f) {
      clearErrors(f);
      const e = ev(f.dataset.id);
      const full = spotsLeft(e) === 0;
      S.regs[e.id] = S.regs[e.id] || {};
      const k = regKey();
      if (S.role === "leader" && e.adultsOnly) {
        if (full) { S.regs[e.id][k] = { status: "waitlist", girls: 0 }; e.waitlist += 1; }
        else {
          const adults = Number(f.elements.adults.value);
          if (!Number.isInteger(adults) || adults < 1 || adults > spotsLeft(e)) { setError(f, "adults", `Enter between 1 and ${Math.min(spotsLeft(e), 6)} adults.`); return; }
          S.regs[e.id][k] = { status: "confirmed", girls: adults, adults };
          e.registered += adults;
        }
      } else if (S.role === "leader") {
        if (full) { S.regs[e.id][k] = { status: "waitlist", girls: 0 }; e.waitlist += 1; }
        else {
          const girls = Number(f.elements.girls.value), adults = Number(f.elements.adults.value);
          let ok = true;
          if (!Number.isInteger(girls) || girls < 1 || girls > spotsLeft(e)) { setError(f, "girls", `Enter between 1 and ${spotsLeft(e)} girls.`); ok = false; }
          if (!Number.isInteger(adults) || adults < 1) { setError(f, "adults", "At least one adult needs to attend."); ok = false; }
          if (e.caregiver && !f.elements.perm.checked) { setError(f, "perm", "Confirm you have caregiver permission before registering."); ok = false; }
          if (!ok) return;
          S.regs[e.id][k] = { status: "confirmed", girls, adults };
          e.registered += girls;
        }
      } else if (S.role === "girl13") {
        if (full) { S.regs[e.id][k] = { status: "waitlist", girls: 1 }; e.waitlist += 1; }
        else { S.regs[e.id][k] = { status: e.caregiver ? "awaiting" : "confirmed", girls: 1 }; if (!e.caregiver) e.registered += 1; }
      } else if (S.role === "parent") {
        if (!f.elements.perm.checked) { setError(f, "perm", `Give permission to register ${R().childName}.`); return; }
        if (full) { S.regs[e.id][k] = { status: "waitlist", girls: 1 }; e.waitlist += 1; }
        else { S.regs[e.id][k] = { status: "confirmed", girls: 1 }; e.registered += 1; }
        S.permissionRequests.forEach((p) => { if (p.eventId === e.id && p.status === "pending") p.status = "approved"; });
      }
      const st = S.regs[e.id][k].status;
      closeModal(); commit();
      toast(st === "waitlist" ? "You're on the waitlist" : st === "awaiting" ? "Signed up. Waiting for caregiver permission." : e.adultsOnly ? "RSVP sent" : "Registered");
    },

    review(f, e) {
      clearErrors(f);
      const p = S.proposals.find((x) => x.id === f.dataset.id);
      const decision = e.submitter ? e.submitter.value : "approve";
      const note = f.elements.note.value.trim();
      if (decision === "changes") {
        if (!note) { setError(f, "note", "Add a note so she knows what to change."); f.elements.note.focus(); return; }
        p.status = "changes"; p.note = note;
        closeModal(); commit(); toast(`Sent your notes to ${p.by}`);
        return;
      }
      const id = uid("e");
      S.events.push({ id, title: p.title, type: p.type, host: p.troop, offset: p.offset, time: p.time, capacity: p.capacity, registered: 0, waitlist: 0, levels: p.levels, adultsOnly: !!p.adultsOnly, visibility: p.visibility, area: p.area, caregiver: p.caregiver, desc: p.desc, girlLed: true });
      p.status = "approved"; p.eventId = id;
      closeModal(); commit(); toast(`Published. ${p.by.split(" ")[0]} will see it's approved.`);
    },

    "new-message"(f) {
      clearErrors(f);
      const [name, troop] = f.elements.to.value.split("|");
      const subject = f.elements.subject.value.trim() || "Hello";
      const text = f.elements.text.value.trim();
      if (!text) { setError(f, "text", "Write a message before sending."); f.elements.text.focus(); return; }
      const id = uid("th");
      S.threads.push({ id, kind: "leader", owner: S.role, with: name, troop, subject, messages: [{ from: R().name, offset: 0, text }] });
      closeModal(); save();
      toast(`Message sent to ${name}`);
      location.hash = "#/messages/" + id;
    },

    "send-message"(f) {
      const text = f.elements.text.value.trim();
      if (!text) { f.elements.text.focus(); return; }
      const t = S.threads.find((x) => x.id === f.dataset.thread);
      t.messages.push({ from: R().name, offset: 0, text });
      commit();
      const ta = $("#msg-text"); if (ta) ta.focus();
    },

    "add-task"(f) {
      clearErrors(f);
      const p = proj(f.dataset.pid);
      const title = f.elements.title.value.trim();
      if (!title) { setError(f, "title", "Name the task."); f.elements.title.focus(); return; }
      const due = f.elements.due.value ? offsetOf(f.elements.due.value) : 7;
      p.tasks.push({ id: uid("t"), title, status: "todo", who: f.elements.who.value, due });
      commit(); toast(`Added “${title}”`);
      const input = $("#nt-title"); if (input) input.focus();
    },

    "add-line"(f) {
      clearErrors(f);
      const p = proj(f.dataset.pid);
      const item = f.elements.lineItem.value.trim();
      const planned = Number(f.elements.planned.value);
      if (!item) { setError(f, "lineItem", "Name the item."); return; }
      if (!(planned >= 0)) { setError(f, "planned", "Enter an amount of 0 or more."); return; }
      p.budget.lines.push({ id: uid("b"), item, planned, actual: 0 });
      commit(); toast(`Added ${item} to the budget`);
    },

    "record-funds"(f) {
      clearErrors(f);
      const p = proj(f.dataset.pid);
      const amt = Number(f.elements.amount.value);
      if (!(amt > 0)) { setError(f, "amount", "Enter an amount greater than 0."); return; }
      p.budget.raised += amt;
      commit(); toast(`Recorded ${money(amt)} raised`);
    },

    invite(f) {
      clearErrors(f);
      const p = proj(f.dataset.pid);
      const name = f.elements.name.value.trim();
      if (!name) { setError(f, "name", "Enter her first name and last initial."); return; }
      p.people.push({ name, troop: f.elements.troop.value, role: "Invited collaborator", pending: S.role === "girl13" ? "Waiting for leader approval" : "Invite sent" });
      commit(); toast(S.role === "girl13" ? "Invite sent to your leader for approval" : `Invited ${name}`);
    },

    "opp-post"(f) {
      clearErrors(f);
      const title = f.elements.title.value.trim(), body = f.elements.body.value.trim();
      let ok = true;
      if (!title) { setError(f, "title", "Add a title."); ok = false; }
      if (!body) { setError(f, "body", "Add a few details."); ok = false; }
      if (/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(body)) { setError(f, "body", "Remove the phone number. People respond through ScoutLink."); ok = false; }
      if (!ok) return;
      if (can("post")) {
        S.opps.unshift({ id: uid("o"), cat: f.elements.cat.value, troop: hostKeyForRole(), title, body, offset: 0, interested: 0 });
        closeModal(); ui.oppCat = "All"; save();
        toast("Posted to the opportunity board");
        if (location.hash !== "#/opportunities") location.hash = "#/opportunities"; else render();
      } else {
        S.oppPending.push({ id: uid("op"), cat: f.elements.cat.value, troop: R().troop, by: R().name, title, body, status: "pending" });
        closeModal(); commit(); toast(`Sent to ${troopById[R().troop].leader} for review`);
      }
    },

    "new-project"(f) {
      clearErrors(f);
      const title = f.elements.title.value.trim();
      if (!title) { setError(f, "title", "Give your project a name."); return; }
      const r = R();
      const leaderName = troopById[r.troop].leader;
      const id = uid("p");
      const people = S.role === "girl13"
        ? [{ name: r.name, troop: r.troop, role: "Project lead" }, { name: leaderName, troop: r.troop, role: "Adult adviser", adult: true }]
        : [{ name: r.name, troop: r.troop, role: "Adult adviser", adult: true }, ...D.TROOP_MEMBERS[r.troop].slice(0, 2).map(([n]) => ({ name: n, troop: r.troop, role: "Team member" }))];
      S.projects.push({
        id, title, troop: r.troop, track: f.elements.track.value, lead: S.role === "girl13" ? r.name : people[1].name, adviser: leaderName,
        summary: f.elements.summary.value.trim() || "Just getting started.", people,
        tasks: [{ id: uid("t"), title: "Write the project proposal", status: "todo", who: S.role === "girl13" ? r.name : people[1].name, due: 7 }],
        budget: { goal: 0, raised: 0, lines: [] },
        milestones: [{ id: uid("m"), title: "Proposal approved by troop leader", offset: 10, done: false }],
        files: []
      });
      closeModal(); save(); ui.projTab = "board";
      toast("Project created");
      location.hash = "#/projects/" + id;
    }
  };

  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-form]");
    if (!f) return;
    e.preventDefault();
    const fn = FORMS[f.dataset.form];
    if (fn) fn(f, e);
  });

  // Send on Enter in the message composer (Shift+Enter for a new line)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && e.target.id === "msg-text") {
      e.preventDefault();
      e.target.form.requestSubmit();
    }
  });

  /* =====================================================================
     Changes (inputs that save immediately)
     ===================================================================== */
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!t.dataset || !t.dataset.change) return;
    if (t.dataset.change === "role") switchRole(t.value);
    if (t.dataset.change === "privacy") {
      S.privacy[t.dataset.key] = t.checked; save();
      toast("Privacy setting saved");
    }
    if (t.dataset.change === "budget-actual") {
      const p = proj(t.dataset.pid), line = p.budget.lines.find((l) => l.id === t.dataset.lid);
      line.actual = Math.max(0, Number(t.value) || 0);
      commit(); toast("Budget updated");
    }
  });

  /* =====================================================================
     Start
     ===================================================================== */
  load();
  if (!location.hash) history.replaceState(null, "", "#/dashboard");
  render();
})();
