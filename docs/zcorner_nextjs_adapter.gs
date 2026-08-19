/**
 * ZCORNER Next.js Adapter
 * TAMBAHKAN sebagai file BARU: zcorner_nextjs_adapter.gs
 * Jangan mengubah file Apps Script utama Anda.
 *
 * Adapter ini memanggil fungsi existing:
 * checkLogin, getProduk, saveProduk, deleteProduk, processTransaction,
 * saveRekapHarian, getDashboardChartData, getHistoryTransaksi.
 */

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var result = routeNextJs_(payload);
    return jsonNextJs_(result);
  } catch (err) {
    return jsonNextJs_({ success: false, error: String(err.message || err) });
  }
}

function routeNextJs_(p) {
  var action = String(p.action || '');

  if (action === 'checkLogin') {
    var login = checkLogin(p.username, p.password);
    if (!login || !login.success) return { success: false, error: (login && (login.error || login.message)) || 'Username atau password salah' };
    return {
      success: true,
      tenant: login.tenant || login.tenantName || p.username,
      nama: login.nama || login.tenantName || p.username,
      role: String(p.username).toLowerCase() === 'super' ? 'super_admin' : 'admin_tenant'
    };
  }

  if (action === 'getTenants') return { success: true, data: getTenantsNextJs_() };

  if (action === 'getProduk') {
    return { success: true, data: normalizeProductsNextJs_(getProduk(p.tenant)) };
  }

  if (action === 'saveProduk') {
    var saved = saveProduk(p.id, p.tenant, p.nama_menu || p.nama || p.prodNama, Number(p.harga || p.prodHarga || 0), p.foto_menu || p.foto_url || '');
    return saved ? { success: true, data: { id: p.id || null } } : { success: false, error: 'Gagal menyimpan produk' };
  }

  if (action === 'deleteProduk') {
    return deleteProduk(p.id, p.tenant)
      ? { success: true, data: { deleted: p.id } }
      : { success: false, error: 'Produk tidak ditemukan' };
  }

  if (action === 'processTransaction') {
    var items = (p.items || []).map(function(item) {
      return {
        nama: item.nama_menu || item.nama || '',
        qty: Number(item.qty || 1),
        total: Number(item.subtotal || item.total || (Number(item.harga || 0) * Number(item.qty || 1)))
      };
    });
    var tx = processTransaction(p.tenant, items);
    return tx && tx.success
      ? { success: true, orderId: tx.orderId, status: 'diterima' }
      : { success: false, error: (tx && (tx.error || tx.message)) || 'Gagal menyimpan transaksi' };
  }

  if (action === 'getHistoryTransaksi') {
    return { success: true, data: normalizeOrdersNextJs_(getHistoryTransaksi(p.tenant)) };
  }

  if (action === 'getOrderById') {
    var orders = normalizeOrdersNextJs_(getHistoryTransaksi(p.tenant));
    for (var i = 0; i < orders.length; i++) {
      if (String(orders[i].orderId) === String(p.orderId)) return { success: true, data: orders[i] };
    }
    return { success: false, error: 'Order tidak ditemukan' };
  }

  if (action === 'getDashboardData') {
    return { success: true, data: dashboardNextJs_(p.tenant) };
  }

  if (action === 'getRekapHarian') {
    return { success: true, data: getRekapHarianNextJs_(p.tenant, p.bulan) };
  }

  if (action === 'saveRekapHarian') {
    var rekap = saveRekapHarian(p.tenant, p.tanggal, p.modal, p.infak, p.zakat);
    return rekap && rekap.success ? { success: true, data: rekap } : { success: false, error: (rekap && rekap.message) || 'Gagal menyimpan rekap' };
  }

  return { success: false, error: 'Action tidak dikenal: ' + action };
}

function jsonNextJs_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getTenantsNextJs_() {
  var ss = getSS();
  var seen = {};
  var tenants = [];

  var prodSheet = ss.getSheetByName('Produk');
  if (prodSheet) {
    var prodRows = prodSheet.getDataRange().getValues();
    for (var i = 1; i < prodRows.length; i++) {
      var tenantName = String(prodRows[i][1] || '').trim();
      if (!tenantName || seen[tenantName.toLowerCase()]) continue;
      seen[tenantName.toLowerCase()] = true;
      tenants.push({ id: tenants.length + 1, nama_tenant: tenantName, deskripsi: tenantName + ' — Z-Corner BAZNAS Banyumas', foto_banner: '', jam_buka: '08.00 - 21.00', status: 'buka', rating: 4.8, kategori: 'Kuliner' });
    }
  }

  if (!tenants.length) {
    var rows = ss.getSheetByName('Users').getDataRange().getValues();
    for (var j = 1; j < rows.length; j++) {
      var nama = String(rows[j][2] || '').trim();
      if (!nama || seen[nama.toLowerCase()]) continue;
      seen[nama.toLowerCase()] = true;
      tenants.push({ id: tenants.length + 1, nama_tenant: nama, deskripsi: nama + ' — Z-Corner BAZNAS Banyumas', foto_banner: '', jam_buka: '08.00 - 21.00', status: 'buka', rating: 4.8, kategori: 'Kuliner' });
    }
  }

  return tenants;
}

function normalizeProductsNextJs_(products) {
  return (products || []).map(function(p) {
    return {
      id: p.id,
      nama_menu: p.nama || p.nama_menu || '',
      nama: p.nama || p.nama_menu || '',
      kategori: 'Makanan',
      harga: Number(p.harga || 0),
      foto_menu: p.foto_url || p.foto_menu || '',
      stok: 99,
      status_aktif: true
    };
  });
}

function normalizeOrdersNextJs_(orders) {
  return (orders || []).map(function(order) {
    var tanggal = getSafeDateString(order.tanggal);
    var waktu = String(order.waktu || '00:00:00');
    return {
      id: order.orderId,
      orderId: order.orderId,
      tenant: order.tenant || '',
      nomor_meja: '',
      status: 'diterima',
      total_harga: Number(order.totalOrder || 0),
      metode_bayar: 'COD',
      created_at: tanggal ? tanggal + 'T' + waktu : new Date().toISOString(),
      items: (order.items || []).map(function(item) {
        var qty = Number(item.qty || 1);
        var total = Number(item.total || 0);
        return { qty: qty, nama_menu: item.namaItem || '', harga: qty ? total / qty : total, subtotal: total };
      })
    };
  });
}

function dashboardNextJs_(tenant) {
  var now = new Date();
  var raw = getDashboardChartData(tenant, now.getFullYear(), now.getMonth(), getSafeDateString(now));
  var chart = [];
  for (var day = 0; day < raw.harianLabels.length; day++) {
    var date = new Date(now.getFullYear(), now.getMonth(), raw.harianLabels[day]);
    chart.push({ date: getSafeDateString(date), total: Number(raw.harianOmset[day] || 0) });
  }
  var itemCounts = {};
  normalizeOrdersNextJs_(getHistoryTransaksi(tenant)).forEach(function(order) {
    order.items.forEach(function(item) { itemCounts[item.nama_menu] = (itemCounts[item.nama_menu] || 0) + item.qty; });
  });
  var top_menu = Object.keys(itemCounts).map(function(nama) { return { nama: nama, qty: itemCounts[nama] }; }).sort(function(a, b) { return b.qty - a.qty; }).slice(0, 5);
  return { harian: { total: 0, omset: Number(raw.totalOmsetHariIni || 0) }, bulanan: { total: 0, omset: Number(raw.totalOmsetBulanIni || 0) }, chart: chart, top_menu: top_menu };
}

function getRekapHarianNextJs_(tenant, bulan) {
  var sheet = getSS().getSheetByName('RekapHarian');
  if (!sheet) return [];
  return sheet.getDataRange().getValues().slice(1).filter(function(row) {
    var date = getSafeDateString(row[1]);
    return (!tenant || String(row[0]).toLowerCase() === String(tenant).toLowerCase()) && (!bulan || date.indexOf(bulan) === 0);
  }).map(function(row) {
    return { tenant: String(row[0] || ''), tanggal: getSafeDateString(row[1]), modal: Number(row[2] || 0), infak: Number(row[3] || 0), zakat: Number(row[4] || 0) };
  });
}
