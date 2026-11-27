/* ===== sw.js — supaya Benteng Huffazh bisa dipasang di HP dan cepat dibuka =====
   Kode game (html/js/css) selalu diambil dari internet dulu, jadi file yang diganti di GitHub
   langsung terpakai tanpa perlu mengubah file ini. Salinan di HP hanya dipakai saat sinyal hilang.
   Data juz disimpan permanen di HP (isinya tidak pernah berubah) supaya hemat kuota.
   Panggilan ke Supabase (login, simpan progres) tidak pernah disimpan.
   Naikkan VERSI hanya kalau file ini sendiri atau daftar INTI berubah. */
const VERSI = 'bh-inti-4';
const DATA = 'bh-data-1';
const LUAR = 'bh-luar-1';
const INTI = [
  './', 'index.html', 'style.css', 'config.js', 'core.js', 'hub.js', 'rihlah.js', 'duel.js', 'garda.js',
  'net.js', 'pwa.js', 'sholat.js', 'cuaca.js', 'desa.js', 'manifest.json', 'data/surah.json',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png'
];
const LUAR_OK = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(INTI.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('bh-') && ![VERSI, DATA, LUAR].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const simpanKe = (nama, req, res) => {
  if (res && (res.ok || res.type === 'opaque')) { const salin = res.clone(); caches.open(nama).then(c => c.put(req, salin)); }
  return res;
};

// Ambil dari cache dulu; kalau belum ada, ambil dari internet lalu simpan.
async function cacheDulu(nama, req) {
  const ada = await caches.match(req);
  if (ada) return ada;
  return simpanKe(nama, req, await fetch(req));
}

// Ambil dari internet dulu (cek versi terbaru); kalau gagal atau lebih dari 4 detik, pakai salinan di HP.
async function internetDulu(req, cadangan) {
  const salinan = () => caches.match(req, { ignoreSearch: true }).then(r => r || (cadangan ? caches.match(cadangan) : undefined));
  try {
    const ambil = fetch(req, { cache: 'no-cache' }).then(r => simpanKe(VERSI, req, r));
    ambil.catch(() => {});
    const r = await Promise.race([ambil, new Promise(res => setTimeout(() => res(null), 4000))]);
    if (r) return r;
    return (await salinan()) || await ambil;
  } catch (err) {
    const r = await salinan();
    if (r) return r;
    throw err;
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (req.mode === 'navigate') return e.respondWith(internetDulu(req, 'index.html'));
    if (/\/data\/juz\d+\.json$/.test(url.pathname)) return e.respondWith(cacheDulu(DATA, req));
    return e.respondWith(internetDulu(req));
  }
  // Pustaka dan font dari CDN memakai alamat bernomor versi, jadi aman disimpan permanen.
  if (LUAR_OK.includes(url.hostname)) return e.respondWith(cacheDulu(LUAR, req));
  // Selain itu (termasuk Supabase) dibiarkan langsung ke internet.
});

// Ketuk notifikasi pengingat sholat: buka/fokuskan game.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
