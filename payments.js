// ─── Stalk Market — Payment Tracker (Vanilla JS) ─────────────────────────────
// Converted from PaymentTracker.jsx — Spring '26 real data
// See SPEC_payment_tracker.md for full handoff notes
// All amounts verified against Spring '26 order CSV (Apr 5 2026)
// REPLACE hardcoded data with DB/API queries per spec

// ─── Config ──────────────────────────────────────────────────────────────────
// Set this after deploying Code.gs as a Web App.
// Leave empty to run in local-only mode (no persistence).
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxog1NtAaAnVSEFQ-5lkW3rO2nDdsFjzdsja5L1UZ62vPpq_zUphMnzFsJepn5USVq8/exec';

// ─── Real Spring '26 payment schedule ────────────────────────────────────────
// T1 = Apr 1 (13 biz days after Mar 15 close)
// T2 = Jun 1 (Summer enrollment opens)
// T3 = Sep 1 (Fall enrollment opens) — conditional on Performance Gate

var PAYMENTS = [
  // Drylands Agroecology Research — Beef Herdshare (revenue $19,120, steward 72% = $13,766.40)
  {id:"s26_dar_beef_t1",season:"Spring '26",payee:"Drylands Agroecology Research",share:"Beef Herdshare",type:"steward",emoji:"\u{1F404}",tranche:"T1 \u00b7 40% deposit",pctLabel:"72% \u00d7 40%",amount:5506.56,dueDate:"2026-04-01",style:"steward",gate:false},
  {id:"s26_dar_beef_t2",season:"Spring '26",payee:"Drylands Agroecology Research",share:"Beef Herdshare",type:"steward",emoji:"\u{1F404}",tranche:"T2 \u00b7 30% Summer",pctLabel:"72% \u00d7 30%",amount:4129.92,dueDate:"2026-06-01",style:"steward",gate:false},
  {id:"s26_dar_beef_t3",season:"Spring '26",payee:"Drylands Agroecology Research",share:"Beef Herdshare",type:"steward",emoji:"\u{1F404}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"72% \u00d7 30%",amount:4129.92,dueDate:"2026-09-01",style:"steward",gate:true},

  // Drylands Agroecology Research — Pork Herdshare (revenue $5,525, steward 72% = $3,978.00)
  {id:"s26_dar_pork_t1",season:"Spring '26",payee:"Drylands Agroecology Research",share:"Pork Herdshare",type:"steward",emoji:"\u{1F437}",tranche:"T1 \u00b7 40% deposit",pctLabel:"72% \u00d7 40%",amount:1591.20,dueDate:"2026-04-01",style:"steward",gate:false},
  {id:"s26_dar_pork_t2",season:"Spring '26",payee:"Drylands Agroecology Research",share:"Pork Herdshare",type:"steward",emoji:"\u{1F437}",tranche:"T2 \u00b7 30% Summer",pctLabel:"72% \u00d7 30%",amount:1193.40,dueDate:"2026-06-01",style:"steward",gate:false},
  {id:"s26_dar_pork_t3",season:"Spring '26",payee:"Drylands Agroecology Research",share:"Pork Herdshare",type:"steward",emoji:"\u{1F437}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"72% \u00d7 30%",amount:1193.40,dueDate:"2026-09-01",style:"steward",gate:true},

  // Ewe Betta Werk — Lamb Flockshare (revenue $4,214, steward 72% = $3,034.08)
  {id:"s26_ebw_t1",season:"Spring '26",payee:"Ewe Betta Werk",share:"Lamb Flockshare",type:"steward",emoji:"\u{1F411}",tranche:"T1 \u00b7 40% deposit",pctLabel:"72% \u00d7 40%",amount:1213.63,dueDate:"2026-04-01",style:"steward",gate:false},
  {id:"s26_ebw_t2",season:"Spring '26",payee:"Ewe Betta Werk",share:"Lamb Flockshare",type:"steward",emoji:"\u{1F411}",tranche:"T2 \u00b7 30% Summer",pctLabel:"72% \u00d7 30%",amount:910.22,dueDate:"2026-06-01",style:"steward",gate:false},
  {id:"s26_ebw_t3",season:"Spring '26",payee:"Ewe Betta Werk",share:"Lamb Flockshare",type:"steward",emoji:"\u{1F411}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"72% \u00d7 30%",amount:910.22,dueDate:"2026-09-01",style:"steward",gate:true},

  // Croft Family Farm — Egg Shares (revenue $936, steward 72% = $673.92)
  {id:"s26_croft_t1",season:"Spring '26",payee:"Croft Family Farm",share:"Egg Shares",type:"steward",emoji:"\u{1F95A}",tranche:"T1 \u00b7 40% deposit",pctLabel:"72% \u00d7 40%",amount:269.57,dueDate:"2026-04-01",style:"steward",gate:false},
  {id:"s26_croft_t2",season:"Spring '26",payee:"Croft Family Farm",share:"Egg Shares",type:"steward",emoji:"\u{1F95A}",tranche:"T2 \u00b7 30% Summer",pctLabel:"72% \u00d7 30%",amount:202.18,dueDate:"2026-06-01",style:"steward",gate:false},
  {id:"s26_croft_t3",season:"Spring '26",payee:"Croft Family Farm",share:"Egg Shares",type:"steward",emoji:"\u{1F95A}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"72% \u00d7 30%",amount:202.18,dueDate:"2026-09-01",style:"steward",gate:true},

  // Sunburn Farm — Produce Shares
  // Revenue $13,250; 72% = $9,540. Guaranteed $5/lb after cut = total $13,975.
  // $4,435 gap funded by Seed Bank. Each tranche includes SB portion.
  {id:"s26_sunburn_t1",season:"Spring '26",payee:"Sunburn Farm",share:"Produce Shares",type:"steward",emoji:"\u{1F96C}",tranche:"T1 \u00b7 40% deposit",pctLabel:"72%\u00d740% + SB",amount:5590.00,dueDate:"2026-04-01",style:"steward",gate:false,seedBankFunded:true,sbAmount:1774.00},
  {id:"s26_sunburn_t2",season:"Spring '26",payee:"Sunburn Farm",share:"Produce Shares",type:"steward",emoji:"\u{1F96C}",tranche:"T2 \u00b7 30% Summer",pctLabel:"72%\u00d730% + SB",amount:4192.50,dueDate:"2026-06-01",style:"steward",gate:false,seedBankFunded:true,sbAmount:1330.00},
  {id:"s26_sunburn_t3",season:"Spring '26",payee:"Sunburn Farm",share:"Produce Shares",type:"steward",emoji:"\u{1F96C}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"72%\u00d730% + SB",amount:4192.50,dueDate:"2026-09-01",style:"steward",gate:true,seedBankFunded:true,sbAmount:1330.00},

  // WoodDash — Wood Shares (revenue $201.60, steward 72% = $145.15)
  {id:"s26_wooddash_t1",season:"Spring '26",payee:"WoodDash",share:"Wood Shares",type:"steward",emoji:"\u{1FAB5}",tranche:"T1 \u00b7 40% deposit",pctLabel:"72% \u00d7 40%",amount:58.06,dueDate:"2026-04-01",style:"steward",gate:false},
  {id:"s26_wooddash_t2",season:"Spring '26",payee:"WoodDash",share:"Wood Shares",type:"steward",emoji:"\u{1FAB5}",tranche:"T2 \u00b7 30% Summer",pctLabel:"72% \u00d7 30%",amount:43.55,dueDate:"2026-06-01",style:"steward",gate:false},
  {id:"s26_wooddash_t3",season:"Spring '26",payee:"WoodDash",share:"Wood Shares",type:"steward",emoji:"\u{1FAB5}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"72% \u00d7 30%",amount:43.55,dueDate:"2026-09-01",style:"steward",gate:true},

  // Grama Grass & Livestock — Beef Shares (revenue $450, steward 72% = $324.00)
  {id:"s26_grama_t1",season:"Spring '26",payee:"Grama Grass & Livestock",share:"Beef Shares",type:"steward",emoji:"\u{1F33E}",tranche:"T1 \u00b7 40% deposit",pctLabel:"72% \u00d7 40%",amount:129.60,dueDate:"2026-04-01",style:"steward",gate:false},
  {id:"s26_grama_t2",season:"Spring '26",payee:"Grama Grass & Livestock",share:"Beef Shares",type:"steward",emoji:"\u{1F33E}",tranche:"T2 \u00b7 30% Summer",pctLabel:"72% \u00d7 30%",amount:97.20,dueDate:"2026-06-01",style:"steward",gate:false},
  {id:"s26_grama_t3",season:"Spring '26",payee:"Grama Grass & Livestock",share:"Beef Shares",type:"steward",emoji:"\u{1F33E}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"72% \u00d7 30%",amount:97.20,dueDate:"2026-09-01",style:"steward",gate:true},

  // Yellow Barn Farm — Node 14% (14% x $43,696.60 = $6,117.52)
  {id:"s26_ybf_t1",season:"Spring '26",payee:"Yellow Barn Farm",share:"Node 14%",type:"node",emoji:"\u{1F3EA}",tranche:"T1 \u00b7 40% deposit",pctLabel:"14% \u00d7 40%",amount:2447.01,dueDate:"2026-04-01",style:"node",gate:false},
  {id:"s26_ybf_t2",season:"Spring '26",payee:"Yellow Barn Farm",share:"Node 14%",type:"node",emoji:"\u{1F3EA}",tranche:"T2 \u00b7 30% Summer",pctLabel:"14% \u00d7 30%",amount:1835.26,dueDate:"2026-06-01",style:"node",gate:false},
  {id:"s26_ybf_t3",season:"Spring '26",payee:"Yellow Barn Farm",share:"Node 14%",type:"node",emoji:"\u{1F3EA}",tranche:"T3 \u00b7 30% Fall *gate",pctLabel:"14% \u00d7 30%",amount:1835.26,dueDate:"2026-09-01",style:"node",gate:true},

  // Stalk Market LLC — Platform 14% net of card fees
  // Gross 14% = $6,117.52. Card fees 3.5% = $1,529.38. Net = $4,588.14. Self-retained.
  {id:"s26_platform_t1",season:"Spring '26",payee:"Stalk Market LLC",share:"Platform 14% (net)",type:"platform",emoji:"\u2699\uFE0F",tranche:"Platform fee \u00b7 immediate",pctLabel:"14% \u2212 card fees",amount:4588.14,dueDate:"2026-04-01",style:"immediate",gate:false}
];

// ─── Funds & reconciliation data ─────────────────────────────────────────────
var FUNDS = {
  smBalance: 32444.00,
  sbBalance: 23676.28,
  sbOwes: 15746.92,
  sbCredits: 11311.92,
  sbSunburn: 4435.00,
  sbReserve: 2141.08,
  sbNet: 5788.28,
  faceRevenue: 43696.60,
  cashCollected: 32444.00,
  creditsRedeemed: 11311.92,
  cardFees: 1529.38
};

var CREDITS_PARTIAL = [
  {name:"Ali Katz",issued:300,used:133.92,remaining:166.08},
  {name:"Alicia Moreno",issued:350,used:257.50,remaining:92.50},
  {name:"Grace Yoon",issued:300,used:275,remaining:25},
  {name:"Jenn Rohl & Kevin Kowak",issued:300,used:222,remaining:78},
  {name:"John Reed",issued:350,used:257.50,remaining:92.50},
  {name:"Liz Kriso",issued:300,used:257.50,remaining:42.50},
  {name:"Michael Mathieu",issued:350,used:337.50,remaining:12.50},
  {name:"Natalie Levy",issued:175,used:111,remaining:64},
  {name:"Perekin Hubner",issued:350,used:341,remaining:9},
  {name:"Susannah Howard-Spink",issued:300,used:166,remaining:134}
];

var CREDITS_UNUSED = [
  {name:"Brittany Zimmerman",amount:300},
  {name:"Debbie Stewart",amount:300},
  {name:"Jennifer Posner",amount:175},
  {name:"Joseph Harrington",amount:350},
  {name:"Nick Vinison",amount:300}
];

// ─── State ───────────────────────────────────────────────────────────────────
var currentTab = "queue";
var currentFilter = "all";
// In production: fetch from DB. status: 'pending'|'invoiced'|'paid'
// Platform T1 pre-seeded as paid (self-retained at enrollment close)
var paymentRecords = { s26_platform_t1: { status: "paid" } };

// ─── Utilities ───────────────────────────────────────────────────────────────
function fmt(n) {
  return "$" + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtD(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getUrgency(dueDate, status) {
  if (status === "paid") return "paid";
  if (status === "invoiced") return "invoiced";
  if (status === "gate") return "gate";
  var diff = (new Date(dueDate) - new Date()) / 86400000;
  return diff < 0 ? "overdue" : diff <= 14 ? "due-soon" : "upcoming";
}

function getStyleColor(s) {
  var map = { immediate: "var(--lime)", steward: "var(--amber)", node: "var(--node-blue)" };
  return map[s] || "var(--paid)";
}

var URGENCY_LABELS = {
  overdue: "OVERDUE", "due-soon": "DUE SOON", upcoming: "UPCOMING",
  paid: "PAID", invoiced: "INVOICED", gate: "GATE REVIEW"
};

// ─── Build enriched payments list ────────────────────────────────────────────
function getPayments() {
  return PAYMENTS.map(function(p) {
    var st = (paymentRecords[p.id] && paymentRecords[p.id].status) || (p.gate ? "gate" : "pending");
    return Object.assign({}, p, { status: st, urg: getUrgency(p.dueDate, st) });
  }).sort(function(a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
}

// ─── API helper ──────────────────────────────────────────────────────────────
var loadingIds = {}; // track which payment IDs have in-flight requests

function apiCall(action, payload, onSuccess, onError) {
  if (!APPS_SCRIPT_URL) {
    // Local-only mode — apply change immediately
    onSuccess({});
    return;
  }

  payload.action = action;
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  })
  .then(function(res) { return res.json(); })
  .then(function(result) {
    if (result.ok) {
      onSuccess(result);
    } else {
      if (onError) onError(result.error || "Unknown error");
    }
  })
  .catch(function(err) {
    if (onError) onError(err.message || "Network error");
  });
}

// ─── Invoice Generator ──────────────────────────────────────────────────────
var pendingInvoiceId = null;

function generateInvoiceHTML(p) {
  var today = new Date();
  var invoiceNum = "SM-" + p.id.toUpperCase().replace(/_/g, "-");
  var issued = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return '<div class="invoice">' +
    '<div class="invoice__header">' +
      '<div>' +
        '<div class="invoice__brand">STALK MARKET</div>' +
        '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">Yellow Barn Farm<br>9417 N Foothills Hwy<br>Longmont, CO 80503</div>' +
      '</div>' +
      '<div>' +
        '<div class="invoice__title">INVOICE</div>' +
        '<div class="invoice__number">' + invoiceNum + '</div>' +
      '</div>' +
    '</div>' +

    '<hr class="invoice__divider">' +

    '<div class="invoice__row">' +
      '<span class="invoice__label">Bill To</span>' +
      '<span class="invoice__value">' + p.payee + '</span>' +
    '</div>' +
    '<div class="invoice__row">' +
      '<span class="invoice__label">Share</span>' +
      '<span class="invoice__value">' + p.share + '</span>' +
    '</div>' +
    '<div class="invoice__row">' +
      '<span class="invoice__label">Season</span>' +
      '<span class="invoice__value">' + p.season + '</span>' +
    '</div>' +
    '<div class="invoice__row">' +
      '<span class="invoice__label">Tranche</span>' +
      '<span class="invoice__value">' + p.tranche + '</span>' +
    '</div>' +
    '<div class="invoice__row">' +
      '<span class="invoice__label">Split</span>' +
      '<span class="invoice__value">' + p.pctLabel + '</span>' +
    '</div>' +

    '<hr class="invoice__divider">' +

    '<div class="invoice__row">' +
      '<span class="invoice__label">Issued</span>' +
      '<span class="invoice__value">' + issued + '</span>' +
    '</div>' +
    '<div class="invoice__row">' +
      '<span class="invoice__label">Due Date</span>' +
      '<span class="invoice__value" style="color:var(--overdue)">' + fmtD(p.dueDate) + '</span>' +
    '</div>' +

    (p.seedBankFunded ?
      '<div class="invoice__row">' +
        '<span class="invoice__label">Seed Bank portion</span>' +
        '<span class="invoice__value" style="color:var(--amber)">' + fmt(p.sbAmount) + '</span>' +
      '</div>' : '') +

    '<div class="invoice__total-row">' +
      '<span class="invoice__total-label">Amount Due</span>' +
      '<span class="invoice__total-value">' + fmt(p.amount) + '</span>' +
    '</div>' +

    '<div class="invoice__footer">' +
      '<strong>Payment via Mercury</strong><br>' +
      'This invoice will be sent to your Stalk Market Mercury account for review. ' +
      'Payment must be manually approved before funds are released.' +
    '</div>' +
  '</div>';
}

function openInvoiceModal(id) {
  var p = PAYMENTS.find(function(pay) { return pay.id === id; });
  if (!p) return;

  pendingInvoiceId = id;
  document.getElementById("invoice-preview").innerHTML = generateInvoiceHTML(p);
  document.getElementById("invoice-modal").classList.remove("hidden");
}

function closeInvoiceModal() {
  pendingInvoiceId = null;
  document.getElementById("invoice-modal").classList.add("hidden");
}

function confirmSendInvoice() {
  if (!pendingInvoiceId) return;
  var id = pendingInvoiceId;
  closeInvoiceModal();
  sendInvoice(id);
}

// ─── Actions ─────────────────────────────────────────────────────────────────
function sendInvoice(id) {
  if (loadingIds[id]) return;
  loadingIds[id] = true;
  render();

  var p = PAYMENTS.find(function(pay) { return pay.id === id; });
  var payload = {
    id: id,
    payee: p ? p.payee : "",
    amount: p ? p.amount : 0,
    dueDate: p ? p.dueDate : "",
    share: p ? p.share : "",
    tranche: p ? p.tranche : "",
    season: p ? p.season : "",
    invoiceHTML: generateInvoiceHTML(p)
  };

  apiCall("sendInvoice", payload, function(result) {
    paymentRecords[id] = paymentRecords[id] || {};
    paymentRecords[id].status = "invoiced";
    delete loadingIds[id];
    render();
  }, function(err) {
    delete loadingIds[id];
    showError("Invoice failed: " + err);
    render();
  });
}

function markPaid(id) {
  if (loadingIds[id]) return;
  loadingIds[id] = true;
  render();

  apiCall("markPaid", { id: id }, function(result) {
    paymentRecords[id] = paymentRecords[id] || {};
    paymentRecords[id].status = "paid";
    delete loadingIds[id];
    render();
  }, function(err) {
    delete loadingIds[id];
    showError("Mark paid failed: " + err);
    render();
  });
}

function releaseGate(id) {
  if (loadingIds[id]) return;
  loadingIds[id] = true;
  render();

  apiCall("releaseGate", { id: id }, function(result) {
    paymentRecords[id] = paymentRecords[id] || {};
    paymentRecords[id].status = "pending";
    delete loadingIds[id];
    render();
  }, function(err) {
    delete loadingIds[id];
    showError("Release gate failed: " + err);
    render();
  });
}

// ─── Load persisted statuses on page load ────────────────────────────────────
function loadPaymentStatuses() {
  if (!APPS_SCRIPT_URL) return;

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action: "getPayments" })
  })
  .then(function(res) { return res.json(); })
  .then(function(result) {
    if (result.ok && result.payments) {
      result.payments.forEach(function(p) {
        if (p.status && p.status !== "pending") {
          paymentRecords[p.id] = paymentRecords[p.id] || {};
          paymentRecords[p.id].status = p.status;
        }
      });
      render();
    }
  })
  .catch(function() { /* silent fail — use local state */ });
}

// ─── Error display ───────────────────────────────────────────────────────────
function showError(msg) {
  var el = document.getElementById("error-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "error-toast";
    el.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);" +
      "background:#e05555;color:#fff;padding:10px 20px;border-radius:8px;font-size:12px;" +
      "font-weight:700;z-index:999;opacity:0;transition:opacity 0.3s";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  setTimeout(function() { el.style.opacity = "0"; }, 4000);
}

// ─── Badge HTML ──────────────────────────────────────────────────────────────
function badgeHTML(urg) {
  return '<span class="badge badge--' + urg + '">' + URGENCY_LABELS[urg] + '</span>';
}

function sbBadgeHTML() {
  return '<span class="badge badge--sb">SB</span>';
}

// ─── Action buttons HTML ─────────────────────────────────────────────────────
function actionsHTML(p) {
  var loading = loadingIds[p.id];
  if (p.type === "platform") return '<div class="btn btn--paid">Self-retained</div>';
  if (p.status === "paid") return '<div class="btn btn--paid">Paid</div>';
  if (p.status === "gate") {
    return '<div class="btn btn--gate">Pending gate</div>' +
      '<button class="btn btn--invoice" onclick="releaseGate(\'' + p.id + '\')"' +
      (loading ? ' disabled style="opacity:0.5"' : '') + '>' +
      (loading ? 'Releasing...' : 'Release gate') + '</button>';
  }
  if (p.status === "invoiced") {
    return '<div class="btn btn--sent">Invoice sent</div>' +
      '<button class="btn btn--pay" onclick="markPaid(\'' + p.id + '\')"' +
      (loading ? ' disabled style="opacity:0.5"' : '') + '>' +
      (loading ? 'Saving...' : 'Mark paid') + '</button>';
  }
  return '<button class="btn btn--pay" onclick="markPaid(\'' + p.id + '\')"' +
    (loading ? ' disabled style="opacity:0.5"' : '') + '>' +
    (loading ? 'Saving...' : 'Mark paid') + '</button>' +
    '<button class="btn btn--invoice" onclick="openInvoiceModal(\'' + p.id + '\')"' +
    (loading ? ' disabled style="opacity:0.5"' : '') + '>' +
    'Invoice</button>';
}

// ─── Render: Stats Row ───────────────────────────────────────────────────────
function renderStats(payments) {
  var outstanding = payments.filter(function(p) { return p.status !== "paid"; });
  var overdue = payments.filter(function(p) { return p.urg === "overdue"; });
  var dueSoon = payments.filter(function(p) { return p.urg === "due-soon"; });
  var outTotal = outstanding.reduce(function(t, p) { return t + p.amount; }, 0);
  var overdueTotal = overdue.reduce(function(t, p) { return t + p.amount; }, 0);
  var dueSoonTotal = dueSoon.reduce(function(t, p) { return t + p.amount; }, 0);

  var stats = [
    { label: "Outstanding", value: fmt(outTotal), color: "text-lime", sub: outstanding.length + " pending" },
    { label: "Overdue", value: overdue.length, color: overdue.length ? "text-overdue" : "text-primary", sub: overdue.length ? fmt(overdueTotal) + " past due" : "All clear" },
    { label: "Due \u2264 14 days", value: dueSoon.length, color: dueSoon.length ? "text-amber" : "text-primary", sub: dueSoon.length ? fmt(dueSoonTotal) : "None" },
    { label: "SB transfer due", value: fmt(FUNDS.sbOwes), color: "text-lime", sub: "before T1 disbursement" }
  ];

  var html = stats.map(function(s) {
    return '<div class="stat-card">' +
      '<div class="stat-card__label">' + s.label + '</div>' +
      '<div class="stat-card__number ' + s.color + '">' + s.value + '</div>' +
      '<div class="stat-card__sub">' + s.sub + '</div>' +
    '</div>';
  }).join("");

  document.getElementById("stats-row").innerHTML = html;

  // Alert badge
  var badge = document.getElementById("alert-badge");
  if (overdue.length) {
    badge.textContent = "T1 Overdue \u00b7 " + overdue.length + " payments";
    badge.style.display = "";
  } else {
    badge.style.display = "none";
  }
}

// ─── Render: Queue Panel ─────────────────────────────────────────────────────
function renderQueue(payments) {
  var overdue = payments.filter(function(p) { return p.urg === "overdue"; });
  var dueSoon = payments.filter(function(p) { return p.urg === "due-soon"; });
  var upcoming = payments.filter(function(p) { return p.urg === "upcoming"; });
  var paid = payments.filter(function(p) { return p.urg === "paid"; });

  var filters = [
    { key: "all", label: "All", count: payments.length },
    { key: "overdue", label: "Overdue", count: overdue.length },
    { key: "due-soon", label: "Due soon", count: dueSoon.length },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "paid", label: "Paid", count: paid.length }
  ];

  var filtered = currentFilter === "all" ? payments : payments.filter(function(p) { return p.urg === currentFilter; });

  // Group by urgency
  var groups = {};
  filtered.forEach(function(p) {
    if (!groups[p.urg]) groups[p.urg] = [];
    groups[p.urg].push(p);
  });

  var groupOrder = ["overdue", "due-soon", "gate", "upcoming", "invoiced", "paid"];
  var groupLabels = {
    overdue: "Overdue \u2014 T1 due Apr 1",
    "due-soon": "Due in 14 days",
    gate: "Pending performance gate (T3)",
    upcoming: "Upcoming",
    invoiced: "Invoiced",
    paid: "Paid"
  };

  var html = "";

  // Filters
  html += '<div class="filters">';
  filters.forEach(function(f) {
    var active = currentFilter === f.key ? " is-active" : "";
    html += '<button class="filter-btn' + active + '" onclick="setFilter(\'' + f.key + '\')">' +
      f.label + ' <span class="filter-btn__count">' + f.count + '</span></button>';
  });
  html += '</div>';

  // Seed Bank transfer banner
  html += '<div class="info-banner">' +
    '<strong>Seed Bank transfer required first:</strong> Move ' + fmt(FUNDS.sbOwes) +
    ' from Seed Bank \u2192 SM LLC before T1. Credits: ' + fmt(FUNDS.sbCredits) +
    ' \u00b7 Sunburn: ' + fmt(FUNDS.sbSunburn) + '.' +
  '</div>';

  // Payment cards grouped
  groupOrder.forEach(function(key) {
    if (!groups[key] || !groups[key].length) return;
    html += '<div class="section-label">' + groupLabels[key] + '</div>';
    groups[key].forEach(function(p) {
      var cardClass = "pay-card";
      if (p.urg === "overdue") cardClass += " pay-card--overdue";
      if (p.urg === "due-soon") cardClass += " pay-card--due-soon";
      if (p.status === "paid") cardClass += " pay-card--paid";

      html += '<div class="' + cardClass + '">' +
        '<div class="pay-card__accent" style="background:' + getAccentColor(p) + '"></div>' +
        '<div class="pay-card__body">' +
          '<div class="pay-card__icon">' + p.emoji + '</div>' +
          '<div class="pay-card__info">' +
            '<div class="pay-card__payee">' + p.payee + '</div>' +
            '<div class="pay-card__detail">' + p.season + ' \u00b7 ' + p.share + '</div>' +
            '<div class="pay-card__tranche" style="color:' + getStyleColor(p.style) + '">' +
              p.tranche + ' \u00b7 ' + fmtD(p.dueDate) +
              (p.seedBankFunded ? ' ' + sbBadgeHTML() : '') +
            '</div>' +
          '</div>' +
          '<div class="pay-card__amounts">' +
            '<div class="pay-card__amount">' + fmt(p.amount) + '</div>' +
            '<div class="mt-sm">' + badgeHTML(p.urg) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pay-card__actions">' + actionsHTML(p) + '</div>' +
      '</div>';
    });
  });

  if (!filtered.length) {
    html += '<div style="text-align:center;padding:30px;color:var(--text-muted)">No payments in this filter</div>';
  }

  document.getElementById("panel-queue").innerHTML = html;
}

function getAccentColor(p) {
  if (p.status === "paid") return "var(--paid)";
  if (p.urg === "gate") return "var(--gate)";
  var urgColors = { overdue: "var(--overdue)", "due-soon": "var(--amber)", upcoming: "var(--node-blue)", invoiced: "var(--lime)" };
  return urgColors[p.urg] || getStyleColor(p.style);
}

// ─── Render: Season Panel ────────────────────────────────────────────────────
function renderSeason(payments) {
  var paidCount = payments.filter(function(p) { return p.status === "paid"; }).length;
  var outstandingTotal = payments.filter(function(p) { return p.status !== "paid"; }).reduce(function(t, p) { return t + p.amount; }, 0);

  var html = '';

  // Season card
  html += '<div class="panel-card" style="padding:0">' +
    '<div class="panel-card__header" onclick="toggleSeason()">' +
      '<div>' +
        '<div class="fs-15 fw-700 text-primary" style="margin-bottom:2px">Spring \'26</div>' +
        '<div class="fs-11 text-second">' + paidCount + '/' + payments.length + ' paid \u00b7 closed Mar 15</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div class="fs-15 fw-700 text-lime">' + fmt(FUNDS.faceRevenue) + '</div>' +
        '<div class="fs-10 text-amber" style="margin-top:1px">' + fmt(outstandingTotal) + ' outstanding</div>' +
      '</div>' +
      '<div style="margin-left:10px;color:var(--text-muted)" id="season-arrow">\u25BC</div>' +
    '</div>' +
    '<div id="season-detail" class="hidden" style="border-top:1px solid var(--border)">';

  payments.forEach(function(p, i) {
    var borderStyle = i < payments.length - 1 ? "border-bottom:0.5px solid #111d16" : "";
    html += '<div class="season-row" style="' + borderStyle + '">' +
      '<div class="season-row__dot" style="background:' + getStyleColor(p.style) + '"></div>' +
      '<div style="flex:1.3;font-size:11px;color:#b8d8b8;font-weight:600">' + p.payee.split(" ").slice(0, 3).join(" ") + '</div>' +
      '<div style="flex:0.7;font-size:10px;color:#5a8a5a">' + p.share.split(" ").slice(0, 2).join(" ") + '</div>' +
      '<div style="flex:1;font-size:10px;color:var(--text-muted)">' + p.tranche.split("\u00b7")[0].trim() + '</div>' +
      '<div style="font-size:10px;color:var(--text-second);min-width:48px;text-align:right">' + fmtD(p.dueDate) + '</div>' +
      '<div style="font-size:12px;font-weight:700;color:var(--text-primary);min-width:62px;text-align:right">' + fmt(p.amount) + '</div>' +
      '<div style="min-width:72px;text-align:right">' + seasonActionHTML(p) + '</div>' +
    '</div>';
  });

  html += '</div></div>';

  // Revenue breakdown
  html += '<div class="revenue-breakdown">' +
    '<div class="section-label" style="margin-top:0">Revenue breakdown</div>';

  var rows = [
    ["Face value (all orders)", fmt(FUNDS.faceRevenue), "var(--text-primary)"],
    ["Credits redeemed (84.1% of $13,453)", "\u2013" + fmt(FUNDS.creditsRedeemed), "var(--overdue)"],
    ["Cash collected (Square)", fmt(FUNDS.cashCollected), "var(--lime)"],
    ["Card fees (3.5%, borne by platform)", "\u2013" + fmt(FUNDS.cardFees), "var(--overdue)"],
    ["Sunburn SB top-up", "+" + fmt(FUNDS.sbSunburn), "#c8a040"]
  ];

  rows.forEach(function(r) {
    html += '<div style="display:flex;justify-content:space-between">' +
      '<span>' + r[0] + '</span>' +
      '<span style="color:' + r[2] + ';font-weight:700">' + r[1] + '</span>' +
    '</div>';
  });

  html += '</div>';

  document.getElementById("panel-season").innerHTML = html;
}

function seasonActionHTML(p) {
  var loading = loadingIds[p.id];
  if (p.status === "paid") return badgeHTML("paid");
  if (p.type === "platform") return '<span class="fs-10 text-muted">retained</span>';
  if (p.status === "gate") {
    return badgeHTML("gate") + ' <button class="btn btn--sm-pay" onclick="releaseGate(\'' + p.id + '\')"' +
      (loading ? ' disabled style="opacity:0.5"' : '') + '>Unlock</button>';
  }
  return '<button class="btn btn--sm-pay" onclick="markPaid(\'' + p.id + '\')"' +
    (loading ? ' disabled style="opacity:0.5"' : '') + '>' +
    (loading ? '...' : 'Pay') + '</button>';
}

var seasonOpen = false;
function toggleSeason() {
  seasonOpen = !seasonOpen;
  var detail = document.getElementById("season-detail");
  var arrow = document.getElementById("season-arrow");
  if (seasonOpen) {
    detail.classList.remove("hidden");
    arrow.textContent = "\u25B2";
  } else {
    detail.classList.add("hidden");
    arrow.textContent = "\u25BC";
  }
}

// ─── Render: Payees Panel ────────────────────────────────────────────────────
function renderPayees(payments) {
  var payeeMap = {};
  payments.forEach(function(p) {
    if (!payeeMap[p.payee]) payeeMap[p.payee] = { payee: p.payee, type: p.type, emoji: p.emoji, rows: [] };
    payeeMap[p.payee].rows.push(p);
  });

  var typeColors = { steward: "var(--amber)", node: "var(--node-blue)", platform: "var(--lime)" };
  var html = "";

  Object.keys(payeeMap).forEach(function(key) {
    var g = payeeMap[key];
    var total = g.rows.reduce(function(t, r) { return t + r.amount; }, 0);
    var outstanding = g.rows.filter(function(r) { return r.status !== "paid"; }).reduce(function(t, r) { return t + r.amount; }, 0);

    html += '<div class="payee-card">' +
      '<div class="payee-card__header">' +
        '<div class="payee-card__icon">' + g.emoji + '</div>' +
        '<div>' +
          '<div class="payee-card__name">' + g.payee + '</div>' +
          '<div class="payee-card__type" style="color:' + (typeColors[g.type] || "var(--text-second)") + '">' + g.type + '</div>' +
        '</div>' +
        '<div class="payee-card__totals">' +
          '<div class="payee-card__total">' + fmt(total) + '</div>' +
          '<div class="fs-10" style="color:' + (outstanding > 0 ? "var(--amber)" : "var(--paid)") + '">' +
            (outstanding > 0 ? fmt(outstanding) + " outstanding" : "Fully paid") +
          '</div>' +
        '</div>' +
      '</div>';

    g.rows.forEach(function(r) {
      html += '<div class="payee-card__row">' +
        '<div style="flex:1;font-size:11px;color:#9abfa0">' + r.tranche.split("\u00b7")[0].trim() + '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);min-width:48px">' + fmtD(r.dueDate) + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:var(--text-primary);min-width:65px;text-align:right">' + fmt(r.amount) + '</div>' +
        '<div style="min-width:72px;text-align:right">' +
          (r.seedBankFunded ? sbBadgeHTML() + ' ' : '') +
          badgeHTML(r.urg) +
        '</div>' +
      '</div>';
    });

    html += '</div>';
  });

  document.getElementById("panel-payees").innerHTML = html;
}

// ─── Render: Funds Panel ─────────────────────────────────────────────────────
function renderFunds() {
  var html = '';

  // Seed Bank Transfer section
  html += '<div class="section-label" style="margin-top:0">Seed Bank \u2192 SM transfer</div>';
  html += '<div class="panel-card">';

  // Two-column balances
  html += '<div class="mini-stats" style="margin-bottom:14px">' +
    '<div class="mini-stat">' +
      '<div class="mini-stat__label">SM operating</div>' +
      '<div class="mini-stat__value text-lime">' + fmt(FUNDS.smBalance) + '</div>' +
      '<div class="mini-stat__sub">cash collected</div>' +
    '</div>' +
    '<div class="mini-stat">' +
      '<div class="mini-stat__label">Seed Bank</div>' +
      '<div class="mini-stat__value text-amber">' + fmt(FUNDS.sbBalance) + '</div>' +
      '<div class="mini-stat__sub">community contributions</div>' +
    '</div>' +
  '</div>';

  // Transfer breakdown
  html += '<div class="data-row"><span class="data-row__label">Credits redeemed by members</span><span class="data-row__value text-second">' + fmt(FUNDS.sbCredits) + '</span></div>';
  html += '<div class="data-row"><span class="data-row__label">Sunburn rate guarantee</span><span class="data-row__value" style="color:#c8a040">' + fmt(FUNDS.sbSunburn) + '</span></div>';
  html += '<div class="data-row"><span class="data-row__label">Total SB \u2192 SM transfer</span><span class="data-row__value text-lime">' + fmt(FUNDS.sbOwes) + '</span></div>';

  // Post-transfer
  var afterTransfer = [
    ["SB after transfer", fmt(FUNDS.sbBalance - FUNDS.sbOwes), "var(--text-primary)"],
    ["Less: unused credit reserve", "\u2013" + fmt(FUNDS.sbReserve), "var(--amber)"],
    ["True Seed Bank", fmt(FUNDS.sbNet), "var(--lime)"]
  ];

  html += '<div style="margin-top:10px;font-size:11px;color:var(--text-second);line-height:1.8">';
  afterTransfer.forEach(function(r) {
    var extra = r[0] === "True Seed Bank" ? "border-top:0.5px solid var(--border);padding-top:6px;margin-top:4px;" : "";
    html += '<div style="display:flex;justify-content:space-between;' + extra + '">' +
      '<span>' + r[0] + '</span>' +
      '<span style="color:' + r[2] + ';font-weight:700">' + r[1] + '</span>' +
    '</div>';
  });
  html += '</div>';
  html += '</div>';

  // Credit program
  html += '<div class="section-label">Credit program \u2014 Spring \'26</div>';
  html += '<div class="panel-card">';

  // Credit stats
  html += '<div class="mini-stats mini-stats--3" style="margin-bottom:12px">';
  var creditStats = [
    ["Issued", "$13,453", "var(--text-primary)"],
    ["Used 84.1%", "$11,312", "var(--lime)"],
    ["Remaining", "$2,141", "var(--amber)"]
  ];
  creditStats.forEach(function(s) {
    html += '<div class="mini-stat mini-stat--center">' +
      '<div class="mini-stat__label">' + s[0] + '</div>' +
      '<div class="mini-stat__value" style="font-size:15px;color:' + s[2] + '">' + s[1] + '</div>' +
    '</div>';
  });
  html += '</div>';

  // Partial balances
  html += '<div class="section-label" style="margin:6px 0">Partial balances still on account</div>';
  CREDITS_PARTIAL.forEach(function(c) {
    var pct = Math.round(c.used / c.issued * 100);
    html += '<div class="credit-row">' +
      '<span class="credit-row__name">' + c.name + '</span>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<div class="credit-row__bar"><div class="credit-row__bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="credit-row__amount">' + fmt(c.remaining) + '</span>' +
      '</div>' +
    '</div>';
  });

  // Full unused
  html += '<div class="section-label" style="margin:12px 0 6px">Full credit unused</div>';
  CREDITS_UNUSED.forEach(function(c) {
    html += '<div class="credit-row">' +
      '<span class="credit-row__name">' + c.name + '</span>' +
      '<span class="credit-row__amount">' + fmt(c.amount) + '</span>' +
    '</div>';
  });

  html += '</div>';

  document.getElementById("panel-funds").innerHTML = html;
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
  render();
}

function setFilter(key) {
  currentFilter = key;
  render();
}

// ─── Main render ─────────────────────────────────────────────────────────────
function render() {
  var payments = getPayments();
  renderStats(payments);

  switch (currentTab) {
    case "queue":  renderQueue(payments); break;
    case "season": renderSeason(payments); break;
    case "payees": renderPayees(payments); break;
    case "funds":  renderFunds(); break;
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  // Tab click handlers
  document.querySelectorAll(".tab").forEach(function(el) {
    el.addEventListener("click", function() {
      setTab(this.getAttribute("data-tab"));
    });
  });

  render();
  loadPaymentStatuses();
});
