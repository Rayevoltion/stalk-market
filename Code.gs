// ============================================
// STALK MARKET — Google Apps Script Backend
// ============================================
// Deploy as Web App: Execute as Me, Anyone can access
// Set Script Properties (File > Project properties):
//   - SHEET_ID
//   - SITE_URL
//   - MERCURY_API_KEY (for invoice integration)
//   - ADMIN_HASH (bcrypt hash of admin password)

// ============================================
// CONFIG
// ============================================
function getSheet(name) {
  var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  return SpreadsheetApp.openById(id).getSheetByName(name);
}

// ============================================
// WEB APP ENDPOINTS
// ============================================
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action || "ping";

  switch (action) {
    // Auth
    case "login":         return jsonResponse(handleLogin(data));
    case "logout":        return jsonResponse(handleLogout(data));

    // Dashboard
    case "getStats":      return jsonResponse(handleGetStats(data));

    // Stewards
    case "getStewards":   return jsonResponse(handleGetStewards(data));
    case "updateSteward": return jsonResponse(handleUpdateSteward(data));

    // Hubs
    case "getHubs":       return jsonResponse(handleGetHubs(data));
    case "updateHub":     return jsonResponse(handleUpdateHub(data));

    // Couriers
    case "getCouriers":   return jsonResponse(handleGetCouriers(data));

    // Orders
    case "getOrders":     return jsonResponse(handleGetOrders(data));

    // Payments
    case "getPayments":   return jsonResponse(handleGetPayments(data));
    case "sendInvoice":   return jsonResponse(handleSendInvoice(data));
    case "markPaid":      return jsonResponse(handleMarkPaid(data));
    case "releaseGate":   return jsonResponse(handleReleaseGate(data));

    // Credits
    case "getCredits":    return jsonResponse(handleGetCredits(data));

    // EC Transfers
    case "getECTransfers":    return jsonResponse(handleGetECTransfers(data));
    case "recordECTransfer":  return jsonResponse(handleRecordECTransfer(data));

    default:
      return jsonResponse({ ok: false, error: "Unknown action: " + action });
  }
}

function doGet(e) {
  return jsonResponse({ ok: true, status: "Stalk Market API is running" });
}

// ============================================
// HELPERS
// ============================================
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function cors(response) {
  // CORS headers set automatically by Apps Script Web App
  return response;
}

function generateToken() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var token = "";
  for (var i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function verifySession(token) {
  if (!token) return null;
  var sheet = getSheet("SESSIONS");
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      var created = new Date(data[i][2]);
      // 8-hour expiry
      if (Date.now() - created.getTime() < 8 * 60 * 60 * 1000) {
        return { email: data[i][1], token: token };
      }
    }
  }
  return null;
}

// ============================================
// AUTH HANDLERS
// ============================================
function handleLogin(data) {
  // TODO: Implement proper password verification
  // For now, check against SETTINGS sheet admin list
  var email = (data.email || "").trim().toLowerCase();
  var pass = data.password || "";

  if (!email || !pass) {
    return { ok: false, error: "Email and password required" };
  }

  // TODO: Replace with real auth
  // Placeholder: accept any credentials for development
  var token = generateToken();
  var sheet = getSheet("SESSIONS");
  if (sheet) {
    sheet.appendRow([token, email, new Date().toISOString()]);
  }

  return { ok: true, token: token, email: email };
}

function handleLogout(data) {
  var sheet = getSheet("SESSIONS");
  if (sheet && data.token) {
    var rows = sheet.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] === data.token) {
        sheet.deleteRow(i + 1);
      }
    }
  }
  return { ok: true };
}

// ============================================
// DATA HANDLERS (Stubs — wire to sheet reads)
// ============================================
function handleGetStats(data) {
  // TODO: Count from actual sheets
  return {
    ok: true,
    stewards: 7,
    hubs: 1,
    couriers: 1,
    members: 44,
    season: "Spring '26"
  };
}

function handleGetStewards(data) {
  // TODO: Read from STEWARDS sheet
  return { ok: true, stewards: [] };
}

function handleUpdateSteward(data) {
  // TODO: Write to STEWARDS sheet
  return { ok: true };
}

function handleGetHubs(data) {
  // TODO: Read from HUBS sheet
  return { ok: true, hubs: [] };
}

function handleUpdateHub(data) {
  // TODO: Write to HUBS sheet
  return { ok: true };
}

function handleGetCouriers(data) {
  // TODO: Read from COURIERS sheet
  return { ok: true, couriers: [] };
}

function handleGetOrders(data) {
  // TODO: Read from ORDERS sheet
  return { ok: true, orders: [] };
}

// ============================================
// PAYMENT HANDLERS
// ============================================
// PAYMENTS sheet columns:
// A: id | B: season | C: payee | D: share | E: type | F: tranche
// G: amount | H: due_date | I: status | J: mercury_invoice_id
// K: invoice_sent_at | L: paid_at | M: paid_by | N: notes

function findPaymentRow(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) return i + 1; // 1-indexed sheet row
  }
  return null;
}

function handleGetPayments(data) {
  var sheet = getSheet("PAYMENTS");
  if (!sheet) return { ok: true, payments: [] };

  var rows = sheet.getDataRange().getValues();
  var payments = [];
  for (var i = 1; i < rows.length; i++) {
    payments.push({
      id: rows[i][0],
      status: rows[i][8] || "pending",
      mercury_invoice_id: rows[i][9] || null,
      invoice_sent_at: rows[i][10] || null,
      paid_at: rows[i][11] || null
    });
  }
  return { ok: true, payments: payments };
}

function handleSendInvoice(data) {
  if (!data.id) return { ok: false, error: "Missing payment id" };

  var sheet = getSheet("PAYMENTS");
  if (!sheet) return { ok: false, error: "PAYMENTS sheet not found" };

  var row = findPaymentRow(sheet, data.id);
  if (!row) return { ok: false, error: "Payment not found: " + data.id };

  var invoiceId = null;
  var props = PropertiesService.getScriptProperties();
  var mercuryKey = props.getProperty("MERCURY_API_KEY");

  // Call Mercury API if key is configured
  if (mercuryKey) {
    var memo = "Stalk Market " + (data.season || "Spring '26") +
      " — " + (data.tranche || "") +
      " — " + (data.share || "");

    try {
      var resp = UrlFetchApp.fetch("https://api.mercury.com/api/v1/invoices", {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + mercuryKey },
        payload: JSON.stringify({
          recipientId: data.recipientId || null,
          amount: data.amount,
          dueDate: data.dueDate,
          memo: memo
        }),
        muteHttpExceptions: true
      });

      var result = JSON.parse(resp.getContentText());
      if (resp.getResponseCode() >= 200 && resp.getResponseCode() < 300) {
        invoiceId = result.id || result.invoiceId || null;
      } else {
        return { ok: false, error: "Mercury API error: " + (result.message || resp.getResponseCode()) };
      }
    } catch (err) {
      return { ok: false, error: "Mercury API call failed: " + err.message };
    }
  }

  // Update sheet: status=invoiced, mercury_invoice_id, invoice_sent_at
  var now = new Date().toISOString();
  sheet.getRange(row, 9).setValue("invoiced");          // I: status
  sheet.getRange(row, 10).setValue(invoiceId || "");     // J: mercury_invoice_id
  sheet.getRange(row, 11).setValue(now);                 // K: invoice_sent_at

  return { ok: true, invoiceId: invoiceId, invoice_sent_at: now };
}

function handleMarkPaid(data) {
  if (!data.id) return { ok: false, error: "Missing payment id" };

  var sheet = getSheet("PAYMENTS");
  if (!sheet) return { ok: false, error: "PAYMENTS sheet not found" };

  var row = findPaymentRow(sheet, data.id);
  if (!row) return { ok: false, error: "Payment not found: " + data.id };

  var now = new Date().toISOString();
  sheet.getRange(row, 9).setValue("paid");              // I: status
  sheet.getRange(row, 12).setValue(now);                 // L: paid_at
  sheet.getRange(row, 13).setValue(data.paid_by || "");  // M: paid_by

  return { ok: true, paid_at: now };
}

function handleReleaseGate(data) {
  if (!data.id) return { ok: false, error: "Missing payment id" };

  var sheet = getSheet("PAYMENTS");
  if (!sheet) return { ok: false, error: "PAYMENTS sheet not found" };

  var row = findPaymentRow(sheet, data.id);
  if (!row) return { ok: false, error: "Payment not found: " + data.id };

  var currentStatus = sheet.getRange(row, 9).getValue();
  if (currentStatus !== "gate") {
    return { ok: false, error: "Payment is not in gate status" };
  }

  sheet.getRange(row, 9).setValue("pending");           // I: status
  return { ok: true };
}

function handleGetCredits(data) {
  // TODO: Read from CREDITS sheet
  return { ok: true, credits: [] };
}

function handleGetECTransfers(data) {
  // TODO: Read from EC_TRANSFERS sheet
  return { ok: true, transfers: [] };
}

function handleRecordECTransfer(data) {
  // TODO: Write to EC_TRANSFERS sheet
  // Memo lines:
  //   "Spring '26 credit redemptions $11,311.92"
  //   "Spring '26 Sunburn rate guarantee $4,435.00"
  return { ok: true };
}
