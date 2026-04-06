// ─── Stalk Market — Admin Portal Logic ────────────────────────────────────────
// TODO: Replace with real API calls to Code.gs backend

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxog1NtAaAnVSEFQ-5lkW3rO2nDdsFjzdsja5L1UZ62vPpq_zUphMnzFsJepn5USVq8/exec';

// ─── Steward data (Spring '26) ───────────────────────────────────────────────
var STEWARDS = [
  { name: "Drylands Agroecology Research", share: "Beef Herdshare", season: "Spring '26", status: "active" },
  { name: "Drylands Agroecology Research", share: "Pork Herdshare", season: "Spring '26", status: "active" },
  { name: "Ewe Betta Werk", share: "Lamb Flockshare", season: "Spring '26", status: "active" },
  { name: "Croft Family Farm", share: "Egg Shares", season: "Spring '26", status: "active" },
  { name: "Sunburn Farm", share: "Produce Shares", season: "Spring '26", status: "active" },
  { name: "WoodDash", share: "Wood Shares", season: "Spring '26", status: "active" },
  { name: "Grama Grass & Livestock", share: "Beef Shares", season: "Spring '26", status: "active" }
];

// ─── State ───────────────────────────────────────────────────────────────────
var currentTab = "dashboard";
var isLoggedIn = false;

// ─── Login ───────────────────────────────────────────────────────────────────
function handleLogin() {
  var email = document.getElementById("login-email").value.trim();
  var pass = document.getElementById("login-pass").value;
  var errorEl = document.getElementById("login-error");

  if (!email || !pass) {
    errorEl.textContent = "Enter email and password";
    errorEl.style.display = "block";
    return;
  }

  // TODO: Replace with real auth via Code.gs
  // For now, accept any non-empty credentials
  isLoggedIn = true;
  localStorage.setItem("sm_admin_session", JSON.stringify({ email: email, ts: Date.now() }));

  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("admin-app").classList.remove("hidden");
  renderAdmin();
}

function handleLogout() {
  isLoggedIn = false;
  localStorage.removeItem("sm_admin_session");
  document.getElementById("admin-app").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("login-email").value = "";
  document.getElementById("login-pass").value = "";
}

// ─── Check existing session ──────────────────────────────────────────────────
function checkSession() {
  var session = localStorage.getItem("sm_admin_session");
  if (session) {
    try {
      var data = JSON.parse(session);
      // 8-hour expiry
      if (Date.now() - data.ts < 8 * 60 * 60 * 1000) {
        isLoggedIn = true;
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("admin-app").classList.remove("hidden");
        renderAdmin();
        return;
      }
    } catch (e) { /* invalid session */ }
    localStorage.removeItem("sm_admin_session");
  }
}

// ─── Tab switching ───────────────────────────────────────────────────────────
function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(function(el) {
    el.classList.toggle("is-active", el.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll(".panel").forEach(function(el) {
    el.classList.toggle("is-active", el.id === "panel-" + tab);
  });

  // Update header title
  var titles = {
    dashboard: "Dashboard", stewards: "Stewards",
    hubs: "Hub Nodes", couriers: "Couriers", orders: "Order Flow"
  };
  document.getElementById("admin-title").textContent = titles[tab] || "Dashboard";
}

// ─── Render admin stats ──────────────────────────────────────────────────────
function renderStats() {
  var stats = [
    { label: "Stewards", value: "7", color: "text-amber", sub: "Spring '26" },
    { label: "Hub Nodes", value: "1", color: "text-blue", sub: "Yellow Barn Farm" },
    { label: "Couriers", value: "1", color: "text-lime", sub: "Picky Pig" },
    { label: "Members", value: "44", color: "text-primary", sub: "Spring '26 enrolled" }
  ];

  var html = stats.map(function(s) {
    return '<div class="stat-card">' +
      '<div class="stat-card__label">' + s.label + '</div>' +
      '<div class="stat-card__number ' + s.color + '">' + s.value + '</div>' +
      '<div class="stat-card__sub">' + s.sub + '</div>' +
    '</div>';
  }).join("");

  document.getElementById("admin-stats").innerHTML = html;
}

// ─── Render stewards table ───────────────────────────────────────────────────
function renderStewards() {
  var tbody = document.getElementById("stewards-tbody");
  if (!tbody) return;

  var html = STEWARDS.map(function(s) {
    return '<tr>' +
      '<td style="color:var(--text-primary);font-weight:600">' + s.name + '</td>' +
      '<td>' + s.share + '</td>' +
      '<td>' + s.season + '</td>' +
      '<td><span class="badge badge--paid">ACTIVE</span></td>' +
    '</tr>';
  }).join("");

  tbody.innerHTML = html;
}

// ─── Main render ─────────────────────────────────────────────────────────────
function renderAdmin() {
  renderStats();
  renderStewards();
}

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  // Tab click handlers
  document.querySelectorAll(".tab").forEach(function(el) {
    el.addEventListener("click", function() {
      setTab(this.getAttribute("data-tab"));
    });
  });

  // Enter key on login
  document.getElementById("login-pass").addEventListener("keydown", function(e) {
    if (e.key === "Enter") handleLogin();
  });

  // Check for existing session
  checkSession();
});
