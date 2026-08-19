/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ZCORNER × Apps Script — FULL API Handler                       ║
 * ║  Database Z-Corner BAZNAS Banyumas                               ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  CARA SETUP:                                                     ║
 * ║  1. Buka script.google.com → project terhubung ke spreadsheet   ║
 * ║  2. Hapus semua file .gs yang ada                               ║
 * ║  3. Buat file baru: zcorner_api.gs                              ║
 * ║  4. Copy-paste SELURUH kode ini                                 ║
 * ║  5. Deploy → New deployment → Web App                           ║
 * ║     - Execute as: Me                                             ║
 * ║     - Who has access: Anyone                                     ║
 * ║  6. Copy URL → paste ke .env APPSCRIPT_URL                      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * SHEET STRUCTURE:
 * ┌─────────────────┬───────────────────────────────────────────────┐
 * │ Users           │ Username, Password, NamaTenant                │
 * │ Transaksi       │ ID, Tanggal, Waktu, Tenant, Nama Item,       │
 * │                 │ Qty, Total, Order Grup, Bulan                 │
 * │ Produk          │ ID, Tenant, Nama Produk, Harga, Foto URL      │
 * │ RekapHarian     │ Tenant, Tanggal, Modal, Infak, Zakat          │
 * │ Setoran         │ Tanggal, Tenant, Omset Harian, Modal Harian,  │
 * │                 │ Infak Harian, Setoran Bersih, Bulan, Kode Bulan│
 * │ Rekap Bulanan   │ No, Bulan, Omset, Modal, Infak, Perolehan     │
 * └─────────────────┴───────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// 1. CORE HANDLERS
// ═══════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    var params = {};
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    }

    var action = params.action || "";
    var result = {};

    switch (action) {
      // ── Auth ──────────────────────────────────────────
      case "checkLogin":
        result = checkLogin(params.username, params.password);
        break;

      // ── Tenant / Home ──────────────────────────────────
      case "getTenants":
        result = handleGetTenants();
        break;

      case "getTenantDetail":
        result = handleGetTenantDetail(params.tenant);
        break;

      // ── Products / Menu ───────────────────────────────
      case "getProduk":
        result = { success: true, data: getProduk(params.tenant) };
        break;

      case "saveProduk":
        result = saveProduk(params);
        break;

      case "deleteProduk":
        result = deleteProduk(params.id, params.tenant);
        break;

      // ── Orders / Transactions ─────────────────────────
      case "processTransaction":
        result = processTransaction(params);
        break;

      case "getHistoryTransaksi":
        result = { success: true, data: getHistoryTransaksi(params.tenant) };
        break;

      case "getOrderById":
        result = handleGetOrderById(params.orderId, params.tenant);
        break;

      // ── Dashboard ─────────────────────────────────────
      case "getDashboardData":
        result = { success: true, data: getDashboardChartData(params.tenant) };
        break;

      // ── Rekap & Setoran ───────────────────────────────
      case "getRekapHarian":
        result = { success: true, data: getRekapHarian(params.tenant, params.bulan) };
        break;

      case "saveRekapHarian":
        result = saveRekapHarian(params);
        break;

      case "getSetoran":
        result = { success: true, data: getSetoran(params.tenant, params.bulan) };
        break;

      case "saveSetoran":
        result = saveSetoran(params);
        break;

      case "getRekapBulanan":
        result = { success: true, data: getRekapBulanan() };
        break;

      case "getNotifications":
        result = { success: true, data: getNotifications(params.tenant) };
        break;

      // ── New Order Flow ────────────────────────────────
      case "createOrder":
        result = handleCreateOrder(params);
        break;
      case "getPendingOrders":
        result = handleGetPendingOrders(params.tenant);
        break;
      case "confirmOrder":
        result = handleConfirmOrder(params.rowIdx, params.statusAction, params.tenantName);
        break;

      default:
        result = { success: false, error: "Action tidak dikenal: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action === "ping") {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "ZCORNER Apps Script API ready",
        timestamp: new Date().toISOString(),
        sheets: getSheetNames_()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: "ZCORNER API — gunakan POST untuk akses data"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ═══════════════════════════════════════════════════════════════════
// 2. UTILITY FUNCTIONS (PRIVATE)
// ═══════════════════════════════════════════════════════════════════

/** Ambil spreadsheet aktif */
function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Ambil sheet by name, return null jika tidak ada */
function getSheet_(name) {
  return ss_().getSheetByName(name);
}

/** Ambil sheet, throw error jika tidak ada */
function requireSheet_(name) {
  var sheet = getSheet_(name);
  if (!sheet) throw new Error("Sheet '" + name + "' tidak ditemukan");
  return sheet;
}

/** Daftar semua sheet name */
function getSheetNames_() {
  return ss_().getSheets().map(function(s) { return s.getName(); });
}

/** Baca semua data sheet sebagai array of objects (header = row 1) */
function readSheet_(sheetName) {
  var sheet = getSheet_(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(h) {
    return String(h).trim();
  });

  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    // Skip empty rows
    var hasData = row.some(function(cell) { return cell !== "" && cell !== null; });
    if (!hasData) continue;

    var obj = { _rowIndex: i + 1 }; // 1-based row number in sheet
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

/** Format tanggal ke YYYY-MM-DD */
function formatDate_(date) {
  if (!date) date = new Date();
  if (typeof date === "string") date = new Date(date);
  var y = date.getFullYear();
  var m = ("0" + (date.getMonth() + 1)).slice(-2);
  var d = ("0" + date.getDate()).slice(-2);
  return y + "-" + m + "-" + d;
}

/** Format tanggal ke HH:mm */
function formatTime_(date) {
  if (!date) date = new Date();
  if (typeof date === "string") date = new Date(date);
  var h = ("0" + date.getHours()).slice(-2);
  var m = ("0" + date.getMinutes()).slice(-2);
  return h + ":" + m;
}

/** Ambil kode bulan (YYYY-MM) */
function getKodeBulan_(date) {
  if (!date) date = new Date();
  if (typeof date === "string") date = new Date(date);
  var y = date.getFullYear();
  var m = ("0" + (date.getMonth() + 1)).slice(-2);
  return y + "-" + m;
}

/** Ambil nama bulan Indonesia */
function getNamaBulan_(date) {
  if (!date) date = new Date();
  if (typeof date === "string") date = new Date(date);
  var bulanNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return bulanNames[date.getMonth()] + " " + date.getFullYear();
}

/** Generate ID unik */
function generateId_(prefix) {
  return (prefix || "ID") + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

/** Cari next ID numerik di kolom pertama sheet */
function getNextId_(sheetName) {
  var sheet = getSheet_(sheetName);
  if (!sheet) return 1;
  var values = sheet.getDataRange().getValues();
  var maxId = 0;
  for (var i = 1; i < values.length; i++) {
    var id = parseInt(values[i][0]);
    if (!isNaN(id) && id > maxId) maxId = id;
  }
  return maxId + 1;
}


// ═══════════════════════════════════════════════════════════════════
// 3. AUTH — Sheet: Users
//    Kolom: Username | Password | NamaTenant
// ═══════════════════════════════════════════════════════════════════

function checkLogin(username, password) {
  try {
    if (!username || !password) {
      return { success: false, error: "Username dan password wajib diisi" };
    }

    var users = readSheet_("Users");
    if (users.length === 0) {
      return { success: false, error: "Sheet Users kosong atau tidak ditemukan" };
    }

    var user = null;
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      var uName = String(u["Username"] || "").trim().toLowerCase();
      var uPass = String(u["Password"] || "").trim();
      if (uName === String(username).trim().toLowerCase() && uPass === String(password).trim()) {
        user = u;
        break;
      }
    }

    if (!user) {
      return { success: false, error: "Username atau password salah" };
    }

    var tenant = String(user["NamaTenant"] || user["Username"] || username).trim();
    var role = "admin_tenant";

    // Super admin: username "super" atau "admin" atau field khusus
    if (String(username).toLowerCase() === "super" || String(username).toLowerCase() === "superadmin") {
      role = "super_admin";
    }

    return {
      success: true,
      tenant: tenant,
      nama: tenant,
      role: role
    };

  } catch (err) {
    return { success: false, error: "Error login: " + err.toString() };
  }
}


// ═══════════════════════════════════════════════════════════════════
// 4. TENANTS — Derived from Sheet: Users (kolom NamaTenant)
// ═══════════════════════════════════════════════════════════════════

function handleGetTenants() {
  try {
    var users = readSheet_("Users");
    if (users.length === 0) {
      return { success: true, data: [] };
    }

    // Kumpulkan tenant unik dari kolom NamaTenant
    var tenantMap = {};
    for (var i = 0; i < users.length; i++) {
      var tenantName = String(users[i]["NamaTenant"] || "").trim();
      if (tenantName && !tenantMap[tenantName]) {
        tenantMap[tenantName] = true;
      }
    }

    // Hitung jumlah produk per tenant
    var produkData = readSheet_("Produk");
    var produkCount = {};
    for (var p = 0; p < produkData.length; p++) {
      var pt = String(produkData[p]["Tenant"] || "").trim();
      if (pt) produkCount[pt] = (produkCount[pt] || 0) + 1;
    }

    var tenantNames = Object.keys(tenantMap);
    var tenants = [];
    for (var t = 0; t < tenantNames.length; t++) {
      var name = tenantNames[t];
      tenants.push({
        id: t + 1,
        nama_tenant: name,
        deskripsi: name + " — Tenant Z-Corner BAZNAS Banyumas",
        foto_banner: "",
        jam_buka: "08.00 - 21.00",
        status: "buka",
        rating: 4.8,
        kategori: guessKategori_(name),
        _count: { menu_items: produkCount[name] || 0 }
      });
    }

    return { success: true, data: tenants };

  } catch (err) {
    return { success: false, error: "Error getTenants: " + err.toString() };
  }
}

/** Tebak kategori tenant berdasarkan nama */
function guessKategori_(name) {
  var n = String(name).toLowerCase();
  if (n.indexOf("kopi") >= 0 || n.indexOf("coffee") >= 0 || n.indexOf("cafe") >= 0) return "Minuman";
  if (n.indexOf("ayam") >= 0 || n.indexOf("geprek") >= 0 || n.indexOf("goreng") >= 0) return "Makanan";
  if (n.indexOf("sate") >= 0 || n.indexOf("taichan") >= 0) return "Makanan";
  if (n.indexOf("susu") >= 0 || n.indexOf("mantap") >= 0 || n.indexOf("jiwa") >= 0) return "Minuman";
  if (n.indexOf("bakso") >= 0 || n.indexOf("mie") >= 0 || n.indexOf("nasi") >= 0) return "Makanan";
  if (n.indexOf("snack") >= 0 || n.indexOf("roti") >= 0) return "Snack";
  return "Kuliner";
}

function handleGetTenantDetail(tenantName) {
  var produkResult = getProduk(tenantName);
  return {
    success: true,
    data: {
      nama_tenant: tenantName,
      menu_items: produkResult || []
    }
  };
}


// ═══════════════════════════════════════════════════════════════════
// 5. PRODUK — Sheet: Produk
//    Kolom: ID | Tenant | Nama Produk | Harga | Foto URL
// ═══════════════════════════════════════════════════════════════════

function getProduk(tenant) {
  try {
    var data = readSheet_("Produk");
    if (!tenant) return data;

    var filtered = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowTenant = String(row["Tenant"] || "").trim();
      if (rowTenant.toLowerCase() === String(tenant).trim().toLowerCase()) {
        filtered.push({
          id: row["ID"] || row._rowIndex,
          nama_menu: String(row["Nama Produk"] || ""),
          nama: String(row["Nama Produk"] || ""),
          kategori: guessMenuKategori_(String(row["Nama Produk"] || "")),
          harga: Number(row["Harga"]) || 0,
          foto_menu: String(row["Foto URL"] || ""),
          stok: 99,
          status_aktif: true,
          _rowIndex: row._rowIndex
        });
      }
    }
    return filtered;

  } catch (err) {
    Logger.log("Error getProduk: " + err.toString());
    return [];
  }
}

/** Tebak kategori menu berdasarkan nama produk */
function guessMenuKategori_(nama) {
  var n = String(nama).toLowerCase();
  if (n.indexOf("minum") >= 0 || n.indexOf("es ") >= 0 || n.indexOf("jus") >= 0 ||
      n.indexOf("kopi") >= 0 || n.indexOf("teh") >= 0 || n.indexOf("susu") >= 0 ||
      n.indexOf("coffee") >= 0 || n.indexOf("latte") >= 0) return "Minuman";
  if (n.indexOf("snack") >= 0 || n.indexOf("keripik") >= 0 || n.indexOf("gorengan") >= 0) return "Snack";
  return "Makanan";
}

function saveProduk(params) {
  try {
    var sheet = requireSheet_("Produk");
    var tenant = String(params.tenant || "").trim();
    var namaProduk = String(params.nama_menu || params.nama || params.prodNama || params["Nama Produk"] || "").trim();
    var harga = Number(params.harga || params.prodHarga || 0);
    var fotoUrl = String(params.foto_menu || params.foto || params["Foto URL"] || "").trim();

    if (!tenant) return { success: false, error: "Tenant wajib diisi" };
    if (!namaProduk) return { success: false, error: "Nama produk wajib diisi" };

    var id = params.id;

    if (id) {
      // UPDATE — cari row dengan ID yang cocok
      var data = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          // Update row: ID | Tenant | Nama Produk | Harga | Foto URL
          sheet.getRange(i + 1, 2).setValue(tenant);
          sheet.getRange(i + 1, 3).setValue(namaProduk);
          sheet.getRange(i + 1, 4).setValue(harga);
          sheet.getRange(i + 1, 5).setValue(fotoUrl);
          found = true;
          break;
        }
      }
      if (!found) return { success: false, error: "Produk dengan ID " + id + " tidak ditemukan" };

      return {
        success: true,
        data: { id: id, tenant: tenant, nama_produk: namaProduk, harga: harga, foto_url: fotoUrl }
      };

    } else {
      // INSERT — tambah row baru
      var newId = getNextId_("Produk");
      sheet.appendRow([newId, tenant, namaProduk, harga, fotoUrl]);

      return {
        success: true,
        data: { id: newId, tenant: tenant, nama_produk: namaProduk, harga: harga, foto_url: fotoUrl }
      };
    }

  } catch (err) {
    return { success: false, error: "Error saveProduk: " + err.toString() };
  }
}

function deleteProduk(id, tenant) {
  try {
    var sheet = requireSheet_("Produk");
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        // Verifikasi tenant jika disediakan
        if (tenant && String(data[i][1]).trim().toLowerCase() !== String(tenant).trim().toLowerCase()) {
          return { success: false, error: "Produk bukan milik tenant ini" };
        }
        sheet.deleteRow(i + 1);
        return { success: true, data: { deleted: id } };
      }
    }

    return { success: false, error: "Produk dengan ID " + id + " tidak ditemukan" };

  } catch (err) {
    return { success: false, error: "Error deleteProduk: " + err.toString() };
  }
}


// ═══════════════════════════════════════════════════════════════════
// 6. TRANSAKSI — Sheet: Transaksi
//    Kolom: ID | Tanggal | Waktu | Tenant | Nama Item | Qty | Total | Order Grup | Bulan
// ═══════════════════════════════════════════════════════════════════

function processTransaction(params) {
  try {
    var sheet = requireSheet_("Transaksi");
    var notifSheet = ensureNotificationSheet_();
    var tenant = String(params.tenant || "").trim();
    var nomorMeja = String(params.nomor_meja || params.meja || "").trim();
    var items = params.items || [];
    var now = new Date();
    var tanggal = formatDate_(now);
    var waktu = formatTime_(now);
    var bulan = getNamaBulan_(now);
    var kodeBulan = getKodeBulan_(now);

    if (!tenant) return { success: false, error: "Tenant wajib diisi" };
    if (!items.length) return { success: false, error: "Items kosong" };

    // Generate Order Grup ID (unik per order)
    var orderGrup = "ORD-" + Date.now().toString(36).toUpperCase();

    // Hitung total order
    var totalOrder = 0;

    // Tulis 1 baris per item
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var namaItem = String(item.nama_menu || item.nama || "").trim();
      var qty = Number(item.qty || 1);
      var harga = Number(item.harga || 0);
      var subtotal = Number(item.subtotal || item.total || (harga * qty));
      totalOrder += subtotal;

      var newId = getNextId_("Transaksi");
      sheet.appendRow([
        newId,          // ID
        tanggal,        // Tanggal
        waktu,          // Waktu
        tenant,         // Tenant
        namaItem,       // Nama Item
        qty,            // Qty
        subtotal,       // Total (per item)
        orderGrup,      // Order Grup
        bulan           // Bulan
      ]);
    }

    // Simpan order untuk halaman Notifikasi / WebOrders
    var webOrdersSheet = ensureWebOrdersSheet_();
    webOrdersSheet.appendRow([
      orderGrup,
      now,
      String(params.customer_name || params.customer || ""),
      tenant + " / Meja " + nomorMeja,
      JSON.stringify(items),
      "pending"
    ]);

    // Simpan notifikasi order baru
    notifSheet.appendRow([
      now,
      tenant,
      nomorMeja,
      orderGrup,
      totalOrder,
      "baru"
    ]);

    // Auto-update setoran harian setelah transaksi
    try {
      autoUpdateSetoran_(tenant, tanggal, kodeBulan, bulan);
    } catch (autoErr) {
      Logger.log("Warning: autoUpdateSetoran gagal: " + autoErr.toString());
    }

    return {
      success: true,
      orderId: orderGrup,
      status: "diterima",
      total: totalOrder,
      nomor_meja: nomorMeja
    };

  } catch (err) {
    return { success: false, error: "Error processTransaction: " + err.toString() };
  }
}

function ensureNotificationSheet_() {
  var ss = getSS();
  var sheet = ss.getSheetByName("Notifikasi");
  if (!sheet) {
    sheet = ss.insertSheet("Notifikasi");
    sheet.appendRow(["Waktu", "Tenant", "Nomor Meja", "Order Grup", "Total", "Status"]);
  }
  return sheet;
}

function ensureWebOrdersSheet_() {
  var ss = getSS();
  var sheet = ss.getSheetByName("WebOrders");
  if (!sheet) {
    sheet = ss.insertSheet("WebOrders");
    sheet.appendRow(["Order ID", "Created At", "Customer Name", "Tenant / Table", "Items (JSON String)", "Status"]);
  }
  return sheet;
}

function getNotifications(tenant) {
  try {
    var sheet = getSheet_("Notifikasi");
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var rowTenant = String(data[i][1] || "").trim();
      if (tenant && rowTenant.toLowerCase() !== String(tenant).trim().toLowerCase()) continue;
      rows.push({
        waktu: data[i][0] ? new Date(data[i][0]).toISOString() : "",
        tenant: rowTenant,
        nomor_meja: String(data[i][2] || ""),
        order_grup: String(data[i][3] || ""),
        total: Number(data[i][4] || 0),
        status: String(data[i][5] || "baru"),
      });
    }
    return rows.reverse();
  } catch (err) {
    Logger.log("Error getNotifications: " + err.toString());
    return [];
  }
}

function getHistoryTransaksi(tenant) {
  try {
    var data = readSheet_("Transaksi");

    // Filter by tenant jika ada
    if (tenant) {
      data = data.filter(function(row) {
        return String(row["Tenant"] || "").trim().toLowerCase() === String(tenant).trim().toLowerCase();
      });
    }

    // Kelompokkan by Order Grup
    var groups = {};
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var grup = String(row["Order Grup"] || row["ID"] || i);

      if (!groups[grup]) {
        groups[grup] = {
          id: grup,
          orderId: grup,
          tenant: String(row["Tenant"] || ""),
          tanggal: String(row["Tanggal"] || ""),
          waktu: String(row["Waktu"] || ""),
          created_at: buildISODate_(row["Tanggal"], row["Waktu"]),
          nomor_meja: "",
          total_harga: 0,
          items: []
        };
      }

      var qty = Number(row["Qty"] || 1);
      var total = Number(row["Total"] || 0);
      var harga = qty > 0 ? Math.round(total / qty) : total;

      groups[grup].items.push({
        nama_menu: String(row["Nama Item"] || ""),
        nama: String(row["Nama Item"] || ""),
        qty: qty,
        harga: harga,
        subtotal: total
      });
      groups[grup].total_harga += total;
    }

    // Convert ke array dan sort terbaru dulu
    var orders = Object.keys(groups).map(function(key) { return groups[key]; });
    orders.sort(function(a, b) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return orders;

  } catch (err) {
    Logger.log("Error getHistoryTransaksi: " + err.toString());
    return [];
  }
}

/** Bangun ISO date string dari tanggal + waktu */
function buildISODate_(tanggal, waktu) {
  try {
    if (tanggal instanceof Date) tanggal = formatDate_(tanggal);
    if (waktu instanceof Date) waktu = formatTime_(waktu);
    var dateStr = String(tanggal || "").trim();
    var timeStr = String(waktu || "00:00").trim();

    // Handle format DD/MM/YYYY atau YYYY-MM-DD
    if (dateStr.indexOf("/") >= 0) {
      var parts = dateStr.split("/");
      if (parts.length === 3) {
        dateStr = parts[2] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[0]).slice(-2);
      }
    }

    return dateStr + "T" + timeStr + ":00";
  } catch (e) {
    return new Date().toISOString();
  }
}

function handleGetOrderById(orderId, tenant) {
  try {
    var allOrders = getHistoryTransaksi(tenant);
    var order = null;
    for (var i = 0; i < allOrders.length; i++) {
      if (String(allOrders[i].id) === String(orderId) ||
          String(allOrders[i].orderId) === String(orderId)) {
        order = allOrders[i];
        break;
      }
    }
    if (!order) return { success: false, error: "Order tidak ditemukan" };
    return { success: true, data: order };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}


// ═══════════════════════════════════════════════════════════════════
// 7. DASHBOARD — Aggregasi dari Transaksi
// ═══════════════════════════════════════════════════════════════════

function handleCreateOrder(params) {
  try {
    var webOrdersSheet = ensureWebOrdersSheet_();
    var now = new Date();
    var orderGrup = "ORD-" + now.getTime(); // Generate simple order ID
    var customerName = String(params.customer_name || "Anonim").trim();
    var tenant = String(params.tenant || "").trim();
    var nomorMeja = String(params.nomor_meja || "").trim();
    var items = params.items || [];
    var totalOrder = 0;

    if (!tenant) return { success: false, error: "Tenant wajib diisi" };
    if (!items.length) return { success: false, error: "Keranjang kosong" };

    // Calculate total
    for (var i = 0; i < items.length; i++) {
      totalOrder += Number(items[i].total || 0);
    }

    // Append to WebOrders
    webOrdersSheet.appendRow([
      orderGrup,
      now,
      customerName,
      tenant + " / Meja " + nomorMeja,
      JSON.stringify(items), // Store items as JSON string
      "pending",
      orderGrup // Store orderGrup in a hidden column for easier lookup
    ]);

    // Send notification
    var notifSheet = ensureNotificationSheet_();
    notifSheet.appendRow([
      now,
      tenant,
      nomorMeja,
      orderGrup,
      totalOrder,
      "baru"
    ]);

    return {
      success: true,
      orderId: orderGrup,
      status: "pending",
      total: totalOrder,
      nomor_meja: nomorMeja
    };
  } catch (err) {
    return { success: false, error: "Error createOrder: " + err.toString() };
  }
}

function handleGetPendingOrders(tenant) {
  try {
    var webOrdersSheet = ensureWebOrdersSheet_();
    var data = webOrdersSheet.getDataRange().getValues();
    var pendingOrders = [];

    var headers = data[0];
    var orderIdCol = headers.indexOf("Order ID");
    var createdAtCol = headers.indexOf("Created At");
    var customerNameCol = headers.indexOf("Customer Name");
    var tenantTableCol = headers.indexOf("Tenant / Table");
    var itemsCol = headers.indexOf("Items (JSON String)");
    var statusCol = headers.indexOf("Status");
    var orderGrupCol = headers.indexOf("Order Grup"); // Using Order Grup for internal use

    if (orderIdCol === -1 || createdAtCol === -1 || customerNameCol === -1 || tenantTableCol === -1 || itemsCol === -1 || statusCol === -1) {
      Logger.log("WebOrders sheet headers missing!");
      return { success: false, error: "WebOrders sheet headers missing!" };
    }

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var orderStatus = String(row[statusCol] || "").trim().toLowerCase();
      var rowTenant = String(row[tenantTableCol] || "").split("/")[0].trim().toLowerCase(); // Extract tenant from "Tenant / Table"

      if (orderStatus === "pending" && (tenant === undefined || rowTenant === String(tenant).toLowerCase())) {
        var orderItems = [];
        try {
          orderItems = JSON.parse(row[itemsCol]);
        } catch (e) {
          Logger.log("Failed to parse items for order " + row[orderIdCol] + ": " + e.toString());
        }

        pendingOrders.push({
          rowIdx: i + 1, // Store 1-based row index for updating
          orderId: row[orderIdCol],
          created_at: row[createdAtCol] ? new Date(row[createdAtCol]).toISOString() : "",
          customer_name: row[customerNameCol],
          tenant: rowTenant,
          nomor_meja: String(row[tenantTableCol]).split("/")[1].trim(),
          items: orderItems,
          total: orderItems.reduce(function(sum, item) { return sum + Number(item.total || 0); }, 0)
        });
      }
    }
    return { success: true, data: pendingOrders.reverse() }; // Newest first
  } catch (err) {
    return { success: false, error: "Error getPendingOrders: " + err.toString() };
  }
}

function handleConfirmOrder(rowIdx, statusAction, tenantName) {
  try {
    var webOrdersSheet = ensureWebOrdersSheet_();
    var transaksiSheet = requireSheet_("Transaksi");
    var notifSheet = ensureNotificationSheet_();

    var row = webOrdersSheet.getRange(rowIdx, 1, 1, webOrdersSheet.getLastColumn()).getValues()[0];
    var headers = webOrdersSheet.getDataRange().getValues()[0];
    var statusCol = headers.indexOf("Status") + 1; // 1-based index

    if (statusAction === "APPROVE") {
      webOrdersSheet.getRange(rowIdx, statusCol).setValue("approved"); // Update status in WebOrders

      var orderId = row[headers.indexOf("Order ID")];
      var createdAt = new Date(row[headers.indexOf("Created At")]);
      var customerName = row[headers.indexOf("Customer Name")];
      var tenantTable = row[headers.indexOf("Tenant / Table")];
      var itemsJson = row[headers.indexOf("Items (JSON String)")];
      var orderItems = JSON.parse(itemsJson);

      var tenant = String(tenantTable).split("/")[0].trim();
      var nomorMeja = String(tenantTable).split("/")[1].trim();

      var tanggal = formatDate_(createdAt);
      var waktu = formatTime_(createdAt);
      var bulan = getNamaBulan_(createdAt);
      var kodeBulan = getKodeBulan_(createdAt);
      var totalOrder = 0;

      // Move items to Transaksi sheet
      for (var i = 0; i < orderItems.length; i++) {
        var item = orderItems[i];
        var namaItem = String(item.nama || "").trim();
        var qty = Number(item.qty || 1);
        var subtotal = Number(item.total || 0);
        totalOrder += subtotal;

        var newId = getNextId_("Transaksi");
        transaksiSheet.appendRow([
          newId,          // ID
          tanggal,        // Tanggal
          waktu,          // Waktu
          tenant,         // Tenant
          namaItem,       // Nama Item
          qty,            // Qty
          subtotal,       // Total (per item)
          orderId,        // Order Grup (use original WebOrders Order ID)
          bulan           // Bulan
        ]);
      }

      // Update notification status (if exists) or create a new one
      var notifData = notifSheet.getDataRange().getValues();
      var notifFound = false;
      for (var j = 1; j < notifData.length; j++) {
        if (String(notifData[j][3]) === String(orderId)) { // Match by Order Grup
          notifSheet.getRange(j + 1, 6).setValue("disetujui"); // Update status
          notifFound = true;
          break;
        }
      }
      if (!notifFound) { // If no existing notification, add one
         notifSheet.appendRow([
          createdAt,
          tenant,
          nomorMeja,
          orderId,
          totalOrder,
          "disetujui"
        ]);
      }

      // Auto-update setoran harian setelah transaksi
      try {
        autoUpdateSetoran_(tenant, tanggal, kodeBulan, bulan);
      } catch (autoErr) {
        Logger.log("Warning: autoUpdateSetoran gagal: " + autoErr.toString());
      }

      return { success: true, orderId: orderId, status: "approved" };

    } else {
      return { success: false, error: "Status action tidak dikenal: " + statusAction };
    }
  } catch (err) {
    return { success: false, error: "Error confirmOrder: " + err.toString() };
  }
}

  try {
    var transaksi = readSheet_("Transaksi");
    var now = new Date();
    var today = formatDate_(now);
    var kodeBulanIni = getKodeBulan_(now);

    // Filter by tenant jika ada
    if (tenant) {
      transaksi = transaksi.filter(function(row) {
        return String(row["Tenant"] || "").trim().toLowerCase() === String(tenant).trim().toLowerCase();
      });
    }

    // === Hitung data harian (hari ini) ===
    var todayTransaksi = transaksi.filter(function(row) {
      var rowDate = row["Tanggal"];
      if (rowDate instanceof Date) rowDate = formatDate_(rowDate);
      return String(rowDate).trim() === today;
    });

    // Hitung per Order Grup unik hari ini
    var todayOrderGrups = {};
    var todayOmset = 0;
    for (var t = 0; t < todayTransaksi.length; t++) {
      var grup = String(todayTransaksi[t]["Order Grup"] || todayTransaksi[t]["ID"]);
      todayOrderGrups[grup] = true;
      todayOmset += Number(todayTransaksi[t]["Total"] || 0);
    }
    var todayOrderCount = Object.keys(todayOrderGrups).length;

    // === Hitung data bulanan (bulan ini) ===
    var bulanIniTransaksi = transaksi.filter(function(row) {
      var rowDate = row["Tanggal"];
      if (rowDate instanceof Date) rowDate = formatDate_(rowDate);
      return String(rowDate).substring(0, 7) === kodeBulanIni;
    });

    var bulanOrderGrups = {};
    var bulanOmset = 0;
    for (var b = 0; b < bulanIniTransaksi.length; b++) {
      var bGrup = String(bulanIniTransaksi[b]["Order Grup"] || bulanIniTransaksi[b]["ID"]);
      bulanOrderGrups[bGrup] = true;
      bulanOmset += Number(bulanIniTransaksi[b]["Total"] || 0);
    }

    // === Chart: omset per hari (30 hari terakhir) ===
    var chart = [];
    for (var d = 29; d >= 0; d--) {
      var date = new Date(now.getTime() - d * 86400000);
      var dateStr = formatDate_(date);
      var dayTotal = 0;

      for (var c = 0; c < transaksi.length; c++) {
        var cDate = transaksi[c]["Tanggal"];
        if (cDate instanceof Date) cDate = formatDate_(cDate);
        if (String(cDate).trim() === dateStr) {
          dayTotal += Number(transaksi[c]["Total"] || 0);
        }
      }

      chart.push({ date: dateStr, total: dayTotal });
    }

    // === Top menu (menu terlaris) ===
    var menuCount = {};
    for (var m = 0; m < transaksi.length; m++) {
      var menuName = String(transaksi[m]["Nama Item"] || "").trim();
      if (menuName) {
        var qty = Number(transaksi[m]["Qty"] || 1);
        menuCount[menuName] = (menuCount[menuName] || 0) + qty;
      }
    }

    var topMenu = Object.keys(menuCount).map(function(nama) {
      return { nama: nama, qty: menuCount[nama] };
    }).sort(function(a, b) {
      return b.qty - a.qty;
    }).slice(0, 5);

    return {
      harian: { total: todayOrderCount, omset: todayOmset },
      bulanan: { total: Object.keys(bulanOrderGrups).length, omset: bulanOmset },
      chart: chart,
      top_menu: topMenu
    };

  } catch (err) {
    Logger.log("Error getDashboardChartData: " + err.toString());
    return {
      harian: { total: 0, omset: 0 },
      bulanan: { total: 0, omset: 0 },
      chart: [],
      top_menu: []
    };
  }
}


// ═══════════════════════════════════════════════════════════════════
// 8. REKAP HARIAN — Sheet: RekapHarian
//    Kolom: Tenant | Tanggal | Modal | Infak | Zakat
// ═══════════════════════════════════════════════════════════════════

function getRekapHarian(tenant, bulan) {
  try {
    var data = readSheet_("RekapHarian");

    if (tenant) {
      data = data.filter(function(row) {
        return String(row["Tenant"] || "").trim().toLowerCase() === String(tenant).trim().toLowerCase();
      });
    }

    if (bulan) {
      data = data.filter(function(row) {
        var rowDate = row["Tanggal"];
        if (rowDate instanceof Date) rowDate = formatDate_(rowDate);
        return String(rowDate).substring(0, 7) === String(bulan);
      });
    }

    return data.map(function(row) {
      var tanggal = row["Tanggal"];
      if (tanggal instanceof Date) tanggal = formatDate_(tanggal);
      return {
        tenant: String(row["Tenant"] || ""),
        tanggal: String(tanggal || ""),
        modal: Number(row["Modal"] || 0),
        infak: Number(row["Infak"] || 0),
        zakat: Number(row["Zakat"] || 0),
        _rowIndex: row._rowIndex
      };
    });

  } catch (err) {
    Logger.log("Error getRekapHarian: " + err.toString());
    return [];
  }
}

function saveRekapHarian(params) {
  try {
    var sheet = requireSheet_("RekapHarian");
    var tenant = String(params.tenant || "").trim();
    var tanggal = String(params.tanggal || formatDate_()).trim();
    var modal = Number(params.modal || 0);
    var infak = Number(params.infak || 0);
    var zakat = Number(params.zakat || 0);

    if (!tenant) return { success: false, error: "Tenant wajib diisi" };

    // Cek apakah sudah ada data untuk tenant + tanggal ini
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var found = false;

    for (var i = 1; i < data.length; i++) {
      var rowTenant = String(data[i][0] || "").trim();
      var rowTanggal = data[i][1];
      if (rowTanggal instanceof Date) rowTanggal = formatDate_(rowTanggal);
      rowTanggal = String(rowTanggal || "").trim();

      if (rowTenant.toLowerCase() === tenant.toLowerCase() && rowTanggal === tanggal) {
        // Update existing
        sheet.getRange(i + 1, 3).setValue(modal);   // Modal
        sheet.getRange(i + 1, 4).setValue(infak);   // Infak
        sheet.getRange(i + 1, 5).setValue(zakat);   // Zakat
        found = true;
        break;
      }
    }

    if (!found) {
      // Insert new
      sheet.appendRow([tenant, tanggal, modal, infak, zakat]);
    }

    return {
      success: true,
      data: { tenant: tenant, tanggal: tanggal, modal: modal, infak: infak, zakat: zakat }
    };

  } catch (err) {
    return { success: false, error: "Error saveRekapHarian: " + err.toString() };
  }
}


// ═══════════════════════════════════════════════════════════════════
// 9. SETORAN — Sheet: Setoran
//    Kolom: Tanggal | Tenant | Omset Harian | Modal Harian |
//           Infak Harian | Setoran Bersih | Bulan | Kode Bulan
// ═══════════════════════════════════════════════════════════════════

function getSetoran(tenant, bulan) {
  try {
    var data = readSheet_("Setoran");

    if (tenant) {
      data = data.filter(function(row) {
        return String(row["Tenant"] || "").trim().toLowerCase() === String(tenant).trim().toLowerCase();
      });
    }

    if (bulan) {
      data = data.filter(function(row) {
        return String(row["Kode Bulan"] || "").trim() === String(bulan).trim();
      });
    }

    return data.map(function(row) {
      var tanggal = row["Tanggal"];
      if (tanggal instanceof Date) tanggal = formatDate_(tanggal);
      return {
        tanggal: String(tanggal || ""),
        tenant: String(row["Tenant"] || ""),
        omset_harian: Number(row["Omset Harian"] || 0),
        modal_harian: Number(row["Modal Harian"] || 0),
        infak_harian: Number(row["Infak Harian"] || 0),
        setoran_bersih: Number(row["Setoran Bersih"] || 0),
        bulan: String(row["Bulan"] || ""),
        kode_bulan: String(row["Kode Bulan"] || ""),
        _rowIndex: row._rowIndex
      };
    });

  } catch (err) {
    Logger.log("Error getSetoran: " + err.toString());
    return [];
  }
}

function saveSetoran(params) {
  try {
    var sheet = requireSheet_("Setoran");
    var tanggal = String(params.tanggal || formatDate_()).trim();
    var tenant = String(params.tenant || "").trim();
    var omsetHarian = Number(params.omset_harian || 0);
    var modalHarian = Number(params.modal_harian || 0);
    var infakHarian = Number(params.infak_harian || 0);
    var setoranBersih = Number(params.setoran_bersih || (omsetHarian - modalHarian - infakHarian));
    var bulan = String(params.bulan || getNamaBulan_(new Date(tanggal)));
    var kodeBulan = String(params.kode_bulan || getKodeBulan_(new Date(tanggal)));

    if (!tenant) return { success: false, error: "Tenant wajib diisi" };

    // Cek apakah sudah ada data untuk tenant + tanggal ini
    var data = sheet.getDataRange().getValues();
    var found = false;

    for (var i = 1; i < data.length; i++) {
      var rowTanggal = data[i][0];
      if (rowTanggal instanceof Date) rowTanggal = formatDate_(rowTanggal);
      var rowTenant = String(data[i][1] || "").trim();

      if (String(rowTanggal).trim() === tanggal && rowTenant.toLowerCase() === tenant.toLowerCase()) {
        // Update existing
        sheet.getRange(i + 1, 3).setValue(omsetHarian);
        sheet.getRange(i + 1, 4).setValue(modalHarian);
        sheet.getRange(i + 1, 5).setValue(infakHarian);
        sheet.getRange(i + 1, 6).setValue(setoranBersih);
        sheet.getRange(i + 1, 7).setValue(bulan);
        sheet.getRange(i + 1, 8).setValue(kodeBulan);
        found = true;
        break;
      }
    }

    if (!found) {
      sheet.appendRow([tanggal, tenant, omsetHarian, modalHarian, infakHarian, setoranBersih, bulan, kodeBulan]);
    }

    // Auto-update Rekap Bulanan
    try {
      autoUpdateRekapBulanan_(kodeBulan, bulan);
    } catch (autoErr) {
      Logger.log("Warning: autoUpdateRekapBulanan gagal: " + autoErr.toString());
    }

    return {
      success: true,
      data: {
        tanggal: tanggal, tenant: tenant,
        omset_harian: omsetHarian, modal_harian: modalHarian,
        infak_harian: infakHarian, setoran_bersih: setoranBersih
      }
    };

  } catch (err) {
    return { success: false, error: "Error saveSetoran: " + err.toString() };
  }
}

/**
 * Auto-update setoran harian setelah transaksi baru
 * Dihitung dari total transaksi hari itu untuk tenant tersebut
 */
function autoUpdateSetoran_(tenant, tanggal, kodeBulan, bulan) {
  // Hitung total omset hari ini dari sheet Transaksi
  var transaksi = readSheet_("Transaksi");
  var dayTotal = 0;
  for (var i = 0; i < transaksi.length; i++) {
    var row = transaksi[i];
    var rowTenant = String(row["Tenant"] || "").trim();
    var rowTanggal = row["Tanggal"];
    if (rowTanggal instanceof Date) rowTanggal = formatDate_(rowTanggal);

    if (rowTenant.toLowerCase() === tenant.toLowerCase() &&
        String(rowTanggal).trim() === tanggal) {
      dayTotal += Number(row["Total"] || 0);
    }
  }

  // Ambil modal & infak dari RekapHarian (jika sudah diisi)
  var rekap = readSheet_("RekapHarian");
  var modal = 0;
  var infak = 0;
  for (var r = 0; r < rekap.length; r++) {
    var rekapTenant = String(rekap[r]["Tenant"] || "").trim();
    var rekapTanggal = rekap[r]["Tanggal"];
    if (rekapTanggal instanceof Date) rekapTanggal = formatDate_(rekapTanggal);

    if (rekapTenant.toLowerCase() === tenant.toLowerCase() &&
        String(rekapTanggal).trim() === tanggal) {
      modal = Number(rekap[r]["Modal"] || 0);
      infak = Number(rekap[r]["Infak"] || 0);
      break;
    }
  }

  // Simpan/update setoran
  saveSetoran({
    tanggal: tanggal,
    tenant: tenant,
    omset_harian: dayTotal,
    modal_harian: modal,
    infak_harian: infak,
    setoran_bersih: dayTotal - modal - infak,
    bulan: bulan,
    kode_bulan: kodeBulan
  });
}


// ═══════════════════════════════════════════════════════════════════
// 10. REKAP BULANAN — Sheet: Rekap Bulanan
//     Kolom: No | Bulan | Omset | Modal | Infak | Perolehan
// ═══════════════════════════════════════════════════════════════════

function getRekapBulanan() {
  try {
    var data = readSheet_("Rekap Bulanan");
    return data.map(function(row) {
      return {
        no: Number(row["No"] || 0),
        bulan: String(row["Bulan"] || ""),
        omset: Number(row["Omset"] || 0),
        modal: Number(row["Modal"] || 0),
        infak: Number(row["Infak"] || 0),
        perolehan: Number(row["Perolehan"] || 0),
        _rowIndex: row._rowIndex
      };
    });
  } catch (err) {
    Logger.log("Error getRekapBulanan: " + err.toString());
    return [];
  }
}

/**
 * Auto-update Rekap Bulanan dari data Setoran
 * Dipanggil setiap kali setoran disimpan
 */
function autoUpdateRekapBulanan_(kodeBulan, namaBulan) {
  try {
    var sheet = requireSheet_("Rekap Bulanan");
    var setoranData = readSheet_("Setoran");

    // Filter setoran untuk bulan ini
    var bulanSetoran = setoranData.filter(function(row) {
      return String(row["Kode Bulan"] || "").trim() === kodeBulan;
    });

    // Aggregate
    var totalOmset = 0, totalModal = 0, totalInfak = 0;
    for (var i = 0; i < bulanSetoran.length; i++) {
      totalOmset += Number(bulanSetoran[i]["Omset Harian"] || 0);
      totalModal += Number(bulanSetoran[i]["Modal Harian"] || 0);
      totalInfak += Number(bulanSetoran[i]["Infak Harian"] || 0);
    }
    var perolehan = totalOmset - totalModal - totalInfak;

    // Cek apakah bulan ini sudah ada di Rekap Bulanan
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][1] || "").trim() === namaBulan) {
        sheet.getRange(r + 1, 3).setValue(totalOmset);
        sheet.getRange(r + 1, 4).setValue(totalModal);
        sheet.getRange(r + 1, 5).setValue(totalInfak);
        sheet.getRange(r + 1, 6).setValue(perolehan);
        found = true;
        break;
      }
    }

    if (!found) {
      var newNo = data.length; // row count = next No
      sheet.appendRow([newNo, namaBulan, totalOmset, totalModal, totalInfak, perolehan]);
    }

  } catch (err) {
    Logger.log("Error autoUpdateRekapBulanan_: " + err.toString());
  }
}


// ═══════════════════════════════════════════════════════════════════
// 11. AUTO-SYNC TRIGGERS
//     Setup: Run setupTriggers() sekali dari Apps Script editor
// ═══════════════════════════════════════════════════════════════════

/**
 * Jalankan fungsi ini SEKALI dari Apps Script editor untuk setup trigger
 * Menu: Run → setupTriggers
 */
function setupTriggers() {
  // Hapus trigger lama
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // onEdit trigger — auto-recalculate saat edit manual
  ScriptApp.newTrigger("onSheetEdit")
    .forSpreadsheet(ss_())
    .onEdit()
    .create();

  // Time-driven: auto rekap harian setiap jam 23:00
  ScriptApp.newTrigger("autoRekapHarian")
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();

  Logger.log("✅ Triggers berhasil di-setup!");
}

/**
 * Trigger saat sheet diedit manual
 * Auto-recalculate setoran jika edit di RekapHarian
 */
function onSheetEdit(e) {
  try {
    var sheetName = e.source.getActiveSheet().getName();

    if (sheetName === "RekapHarian") {
      // Jika edit di RekapHarian, update Setoran terkait
      var row = e.range.getRow();
      if (row <= 1) return; // Header row

      var sheet = e.source.getActiveSheet();
      var tenant = String(sheet.getRange(row, 1).getValue() || "").trim();
      var tanggal = sheet.getRange(row, 2).getValue();
      if (tanggal instanceof Date) tanggal = formatDate_(tanggal);
      tanggal = String(tanggal || "").trim();

      if (tenant && tanggal) {
        var kodeBulan = tanggal.substring(0, 7);
        var bulan = getNamaBulan_(new Date(tanggal));
        autoUpdateSetoran_(tenant, tanggal, kodeBulan, bulan);
      }
    }

    if (sheetName === "Setoran") {
      // Jika edit di Setoran, update Rekap Bulanan
      var sRow = e.range.getRow();
      if (sRow <= 1) return;

      var sSheet = e.source.getActiveSheet();
      var kodeBulan2 = String(sSheet.getRange(sRow, 8).getValue() || "").trim();
      var namaBulan2 = String(sSheet.getRange(sRow, 7).getValue() || "").trim();

      if (kodeBulan2 && namaBulan2) {
        autoUpdateRekapBulanan_(kodeBulan2, namaBulan2);
      }
    }

  } catch (err) {
    Logger.log("onSheetEdit error: " + err.toString());
  }
}

/**
 * Auto generate rekap harian untuk semua tenant
 * Dijalankan oleh time-trigger setiap malam
 */
function autoRekapHarian() {
  try {
    var today = formatDate_();
    var kodeBulan = getKodeBulan_();
    var bulan = getNamaBulan_();

    // Ambil semua tenant
    var users = readSheet_("Users");
    var tenantSet = {};
    for (var i = 0; i < users.length; i++) {
      var t = String(users[i]["NamaTenant"] || "").trim();
      if (t) tenantSet[t] = true;
    }

    var tenants = Object.keys(tenantSet);
    for (var j = 0; j < tenants.length; j++) {
      autoUpdateSetoran_(tenants[j], today, kodeBulan, bulan);
    }

    Logger.log("✅ Auto rekap harian selesai untuk " + tenants.length + " tenant");

  } catch (err) {
    Logger.log("Error autoRekapHarian: " + err.toString());
  }
}


// ═══════════════════════════════════════════════════════════════════
// 12. TEST FUNCTION — Jalankan dari Apps Script editor untuk test
// ═══════════════════════════════════════════════════════════════════

function testAPI() {
  // Test checkLogin
  var loginResult = checkLogin("raju", "edi");
  Logger.log("Login: " + JSON.stringify(loginResult));

  // Test getTenants
  var tenantsResult = handleGetTenants();
  Logger.log("Tenants: " + JSON.stringify(tenantsResult));

  // Test getProduk
  if (tenantsResult.data && tenantsResult.data.length > 0) {
    var firstTenant = tenantsResult.data[0].nama_tenant;
    var produkResult = getProduk(firstTenant);
    Logger.log("Produk " + firstTenant + ": " + JSON.stringify(produkResult));

    // Test dashboard
    var dashResult = getDashboardChartData(firstTenant);
    Logger.log("Dashboard " + firstTenant + ": " + JSON.stringify(dashResult));
  }

  // Test getHistoryTransaksi
  var historyResult = getHistoryTransaksi("");
  Logger.log("History (semua): " + JSON.stringify(historyResult.length) + " orders");

  // Test getRekapBulanan
  var rekapResult = getRekapBulanan();
  Logger.log("Rekap Bulanan: " + JSON.stringify(rekapResult));

  Logger.log("✅ Semua test selesai!");
}
