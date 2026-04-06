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
    case "getSBTransfers":    return jsonResponse(handleGetSBTransfers(data));
    case "recordSBTransfer":  return jsonResponse(handleRecordSBTransfer(data));

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
function sha256(input) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  return raw.map(function(b) {
    var hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function handleLogin(data) {
  var email = (data.email || "").trim().toLowerCase();
  var pass = data.password || "";

  if (!email || !pass) {
    return { ok: false, error: "Email and password required" };
  }

  // Check against SETTINGS sheet for admin credentials
  var settings = getSheet("SETTINGS");
  if (!settings) return { ok: false, error: "System error" };

  var rows = settings.getDataRange().getValues();
  var adminEmail = null;
  var adminHash = null;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === "admin_email") adminEmail = rows[i][1];
    if (rows[i][0] === "admin_hash") adminHash = rows[i][1];
  }

  if (!adminEmail || !adminHash) {
    return { ok: false, error: "Admin not configured" };
  }

  if (email !== adminEmail.toLowerCase()) {
    return { ok: false, error: "Invalid credentials" };
  }

  if (sha256(pass) !== adminHash) {
    return { ok: false, error: "Invalid credentials" };
  }

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
  var stewards = getSheet("STEWARDS");
  var hubs = getSheet("HUBS");
  var couriers = getSheet("COURIERS");
  var orders = getSheet("ORDERS");

  var stewardCount = stewards ? Math.max(0, stewards.getLastRow() - 1) : 0;
  var hubCount = hubs ? Math.max(0, hubs.getLastRow() - 1) : 0;
  var courierCount = couriers ? Math.max(0, couriers.getLastRow() - 1) : 0;
  var memberCount = orders ? countUniqueMembers(orders) : 0;

  return {
    ok: true,
    stewards: stewardCount,
    hubs: hubCount,
    couriers: courierCount,
    members: memberCount,
    season: "Spring '26"
  };
}

function countUniqueMembers(sheet) {
  if (sheet.getLastRow() < 2) return 0;
  var data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  var unique = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i][0]) unique[data[i][0]] = true;
  }
  return Object.keys(unique).length;
}

function sheetToObjects(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function handleGetStewards(data) {
  var sheet = getSheet("STEWARDS");
  return { ok: true, stewards: sheetToObjects(sheet) };
}

function handleUpdateSteward(data) {
  if (!data.name) return { ok: false, error: "Missing steward name" };
  var sheet = getSheet("STEWARDS");
  if (!sheet) return { ok: false, error: "STEWARDS sheet not found" };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.name && rows[i][1] === data.share) {
      if (data.status) sheet.getRange(i + 1, 4).setValue(data.status);
      return { ok: true };
    }
  }
  return { ok: false, error: "Steward not found" };
}

function handleGetHubs(data) {
  var sheet = getSheet("HUBS");
  return { ok: true, hubs: sheetToObjects(sheet) };
}

function handleUpdateHub(data) {
  if (!data.name) return { ok: false, error: "Missing hub name" };
  var sheet = getSheet("HUBS");
  if (!sheet) return { ok: false, error: "HUBS sheet not found" };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.name) {
      if (data.status) sheet.getRange(i + 1, 4).setValue(data.status);
      return { ok: true };
    }
  }
  return { ok: false, error: "Hub not found" };
}

function handleGetCouriers(data) {
  var sheet = getSheet("COURIERS");
  return { ok: true, couriers: sheetToObjects(sheet) };
}

function handleGetOrders(data) {
  var sheet = getSheet("ORDERS");
  return { ok: true, orders: sheetToObjects(sheet) };
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

  // Call Mercury API if key is configured (non-blocking — failures logged, not fatal)
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
        Logger.log("Mercury API error (non-fatal): " + resp.getResponseCode());
      }
    } catch (err) {
      Logger.log("Mercury API call failed (non-fatal): " + err.message);
    }
  }

  // Email invoice to Mercury AP inbox (table-based, inline styles for email compatibility)
  var apEmail = props.getProperty("MERCURY_AP_EMAIL");
  if (apEmail) {
    var subject = "Stalk Market Invoice — " + (data.payee || "") +
      " — " + (data.tranche || "") + " — " + fmt$(data.amount);

    var invoiceNum = "SM-" + (data.id || "").toUpperCase().replace(/_/g, "-");
    var issued = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    function emailRow(label, value, valStyle) {
      return '<tr>' +
        '<td style="padding:6px 0;font-size:13px;color:#7aaa7a">' + label + '</td>' +
        '<td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;color:' + (valStyle || '#e8f0e0') + '">' + value + '</td>' +
      '</tr>';
    }

    var emailBody = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:24px;background:#0a1810;font-family:Arial,Helvetica,sans-serif;color:#e8f0e0">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;margin:0 auto;background:#0f2519;border:1px solid #1e3a28;border-radius:12px">' +
        '<tr><td style="padding:28px 24px 20px">' +

          // Header
          '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
            '<tr>' +
              '<td style="vertical-align:top">' +
                '<div style="font-size:14px;font-weight:700;color:#c8d85a;letter-spacing:0.5px">STALK MARKET</div>' +
                '<div style="font-size:10px;color:#4a6e4a;margin-top:2px">Yellow Barn Farm<br>9417 N Foothills Hwy<br>Longmont, CO 80503</div>' +
              '</td>' +
              '<td style="vertical-align:top;text-align:right">' +
                '<div style="font-size:22px;font-weight:700;color:#e8f0e0">INVOICE</div>' +
                '<div style="font-size:10px;color:#4a6e4a;margin-top:2px">' + invoiceNum + '</div>' +
              '</td>' +
            '</tr>' +
          '</table>' +

          // Divider
          '<hr style="border:none;border-top:1px solid #1e3a28;margin:20px 0">' +

          // Details
          '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
            emailRow("Bill To", data.payee || "") +
            emailRow("Share", data.share || "") +
            emailRow("Season", data.season || "") +
            emailRow("Tranche", data.tranche || "") +
          '</table>' +

          // Divider
          '<hr style="border:none;border-top:1px solid #1e3a28;margin:16px 0">' +

          // Dates
          '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
            emailRow("Issued", issued) +
            emailRow("Due Date", data.dueDate || "", "#e05555") +
          '</table>' +

          // Amount due
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;border-top:2px solid #c8d85a">' +
            '<tr>' +
              '<td style="padding:14px 0;font-size:18px;font-weight:700;color:#e8f0e0">Amount Due</td>' +
              '<td style="padding:14px 0;font-size:18px;font-weight:700;text-align:right;color:#c8d85a">' + fmt$(data.amount) + '</td>' +
            '</tr>' +
          '</table>' +

          // Footer
          '<div style="margin-top:20px;padding:12px 14px;background-color:#121f18;border:1px solid #1e3a28;border-radius:8px;font-size:11px;color:#7aaa7a;line-height:1.6">' +
            '<strong style="color:#e8f0e0">Payment via Mercury</strong><br>' +
            'This invoice will be sent to your Stalk Market Mercury account for review. Payment must be manually approved before funds are released.' +
          '</div>' +

        '</td></tr>' +
      '</table>' +
      '</body></html>';

    try {
      GmailApp.sendEmail(apEmail, subject, "Stalk Market Invoice — " + (data.payee || "") + " — " + fmt$(data.amount), {
        htmlBody: emailBody,
        name: "Stalk Market"
      });
    } catch (emailErr) {
      Logger.log("Email send failed: " + emailErr.message);
    }
  }

  // Update sheet: status=invoiced, mercury_invoice_id, invoice_sent_at
  var now = new Date().toISOString();
  sheet.getRange(row, 9).setValue("invoiced");          // I: status
  sheet.getRange(row, 10).setValue(invoiceId || "");     // J: mercury_invoice_id
  sheet.getRange(row, 11).setValue(now);                 // K: invoice_sent_at

  return { ok: true, invoiceId: invoiceId, invoice_sent_at: now };
}

function fmt$(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  var sheet = getSheet("CREDITS");
  return { ok: true, credits: sheetToObjects(sheet) };
}

function handleGetSBTransfers(data) {
  var sheet = getSheet("SB_TRANSFERS");
  return { ok: true, transfers: sheetToObjects(sheet) };
}

function handleRecordSBTransfer(data) {
  var sheet = getSheet("SB_TRANSFERS");
  if (!sheet) return { ok: false, error: "SB_TRANSFERS sheet not found" };

  sheet.appendRow([
    data.id || Utilities.getUuid(),
    data.season || "Spring '26",
    data.type || "",
    data.amount || 0,
    data.memo || "",
    new Date().toISOString()
  ]);

  return { ok: true };
}
