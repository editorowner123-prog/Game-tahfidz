/* ===== sholat.js — jadwal sholat, pengingat 10 menit sebelum, game istirahat 20 menit saat waktu sholat =====
   Jadwal dihitung di HP dengan kriteria Kemenag (Subuh 20°, Isya 18°, Ashar bayangan 1x, ihtiyat 2–3 menit),
   selisih paling banyak 1 menit dari jadwal Kemenag. Lokasi: lokasi HP bila diizinkan, selain itu Gunungpati, Semarang.
   Jam HP dikoreksi dengan jam server, jadi mengubah jam HP tidak membuka kunci. */
const SHOLAT_INGAT = 10, SHOLAT_KUNCI = 20;
const LOK_BAWAAN = { lat: -7.088, lng: 110.37, nama: 'Gunungpati, Semarang', asal: 'bawaan' };
const URUT_SHOLAT = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
let LOK = (() => { try { const l = JSON.parse(localStorage.getItem('bh-lokasi')); if (l && isFinite(l.lat) && isFinite(l.lng)) return l } catch (e) {} return { ...LOK_BAWAAN } })();
let JAM_OFF = 0;
const kini = () => Date.now() + JAM_OFF;
const SH = { st: null, ingatKey: '', kunciKey: '', cache: {} };

function namaSholat(k, J) { return k === 'dzuhur' && J && J.jumat ? 'Jumat' : { subuh: 'Subuh', dzuhur: 'Dzuhur', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya', terbit: 'Terbit' }[k] }
function zonaJam() { const o = -new Date().getTimezoneOffset() / 60; if (o >= 7 && o <= 9) return o; return LOK.lng < 114.5 ? 7 : LOK.lng < 127 ? 8 : 9 }
const zonaNama = tz => ({ 7: 'WIB', 8: 'WITA', 9: 'WIT' })[tz] || '';

function hitungSholat(y, m, d, lat, lng) {
  const rad = Math.PI / 180, sin = x => Math.sin(x * rad), cos = x => Math.cos(x * rad), tan = x => Math.tan(x * rad),
    asin = x => Math.asin(x) / rad, acos = x => Math.acos(Math.max(-1, Math.min(1, x))) / rad, atan2 = (a, b) => Math.atan2(a, b) / rad,
    fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a };
  let Y = y, M = m; if (M <= 2) { Y--; M += 12 } const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5 - lng / (15 * 24);
  const sun = jd => { const D = jd - 2451545, g = fix(357.529 + .98560028 * D, 360), q = fix(280.459 + .98564736 * D, 360), L = fix(q + 1.915 * sin(g) + .02 * sin(2 * g), 360), e = 23.439 - .00000036 * D, RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24); return { dec: asin(sin(e) * sin(L)), eq: q / 15 - RA } };
  const noon = t => fix(12 - sun(JD + t).eq, 24);
  const sudut = (a, t, pagi) => { const dec = sun(JD + t).dec, n = noon(t), T = acos((-sin(a) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat))) / 15; return n + (pagi ? -T : T) };
  const ashar = t => { const dec = sun(JD + t).dec, a = -Math.atan(1 / (1 + tan(Math.abs(lat - dec)))) / rad; return sudut(a, t) };
  let t = { subuh: 5, terbit: 6, dzuhur: 12, ashar: 13, maghrib: 18, isya: 18 };
  for (let k = 0; k < 2; k++) {
    const f = {}; for (const a in t) f[a] = t[a] / 24;
    t = { subuh: sudut(20, f.subuh, 1), terbit: sudut(.833, f.terbit, 1), dzuhur: noon(f.dzuhur), ashar: ashar(f.ashar), maghrib: sudut(.97, f.maghrib), isya: sudut(18, f.isya) };
  }
  for (const a in t) t[a] -= lng / 15; // jam UTC
  return t;
}

// Jadwal satu hari (tanggal lokal dari waktu ms) dalam milidetik epoch.
function jadwalHari(ms) {
  const tz = zonaJam(), lk = new Date(ms + tz * 3600e3), y = lk.getUTCFullYear(), m = lk.getUTCMonth() + 1, d = lk.getUTCDate();
  const key = `${y}-${m}-${d}|${LOK.lat.toFixed(3)},${LOK.lng.toFixed(3)}|${tz}`;
  if (SH.cache[key]) return SH.cache[key];
  const h = hitungSholat(y, m, d, LOK.lat, LOK.lng), base = Date.UTC(y, m - 1, d), ih = { subuh: 2, terbit: -2, dzuhur: 3, ashar: 2, maghrib: 2, isya: 2 }, w = {};
  for (const k in ih) w[k] = base + Math.ceil((h[k] + tz) * 60 + ih[k] - 1e-9) * 60e3 - tz * 3600e3;
  const J = { y, m, d, tz, jumat: new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 5, w };
  if (Object.keys(SH.cache).length > 6) SH.cache = {};
  SH.cache[key] = J;
  return J;
}
const jamLokal = (ms, tz = zonaJam()) => { const d = new Date(ms + tz * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + '.' + String(d.getUTCMinutes()).padStart(2, '0') };
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` };

function statusSholat(ms = kini()) {
  const J = jadwalHari(ms);
  for (const k of URUT_SHOLAT) {
    const t = J.w[k];
    if (ms >= t && ms < t + SHOLAT_KUNCI * 60e3) return { mode: 'kunci', k, t, sampai: t + SHOLAT_KUNCI * 60e3, J };
    if (ms >= t - SHOLAT_INGAT * 60e3 && ms < t) return { mode: 'ingat', k, t, J };
  }
  let k = URUT_SHOLAT.find(a => J.w[a] > ms), Jn = J;
  if (!k) { Jn = jadwalHari(J.w.isya + 12 * 3600e3); k = 'subuh' }
  return { mode: 'biasa', k, t: Jn.w[k], J: Jn };
}

/* ---- jam server ---- */
async function sholatSinkronJam() {
  try {
    const t0 = Date.now(), r = await fetch(location.pathname, { method: 'HEAD', cache: 'no-store' }), t1 = Date.now(), d = Date.parse(r.headers.get('Date'));
    if (isFinite(d)) { const off = d + 500 - (t0 + t1) / 2; JAM_OFF = Math.abs(off) > 30e3 ? off : 0 }
  } catch (e) {}
}

/* ---- lokasi ---- */
function sholatLokasiHP(diam) {
  return new Promise(res => {
    if (!navigator.geolocation) { if (!diam) toast('HP ini tidak mendukung lokasi. Jadwal memakai Gunungpati, Semarang.'); return res(false) }
    navigator.geolocation.getCurrentPosition(p => {
      LOK = { lat: +p.coords.latitude.toFixed(3), lng: +p.coords.longitude.toFixed(3), nama: 'Lokasi HP-mu', asal: 'perangkat' };
      try { localStorage.setItem('bh-lokasi', JSON.stringify(LOK)) } catch (e) {}
      SH.cache = {}; if (window.cuacaMuat) cuacaMuat(true); sholatTick(); res(true);
    }, () => { if (!diam) toast('Lokasi tidak diizinkan. Jadwal memakai Gunungpati, Semarang.'); res(false) }, { enableHighAccuracy: false, maximumAge: 6 * 3600e3, timeout: 15000 });
  });
}

/* ---- notifikasi ---- */
const sholatNotifBisa = () => 'Notification' in window && 'serviceWorker' in navigator;
async function sholatMintaNotif() {
  if (!sholatNotifBisa()) { toast('Notifikasi tidak didukung di browser ini. Pengingat tetap muncul di layar game.'); return false }
  const p = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (p !== 'granted') toast('Notifikasi belum diizinkan. Pengingat tetap muncul di layar game.');
  return p === 'granted';
}
function sholatNotif(judul, isi) {
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]) } catch (e) {}
  if (!sholatNotifBisa() || Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then(r => r.showNotification(judul, { body: isi, icon: 'icon-192.png', badge: 'favicon-32.png', tag: 'bh-sholat', renotify: true })).catch(() => {});
}

/* ---- kunci & pengingat ---- */
function sholatKeluarMode() {
  if (window.misiTutupSemua) misiTutupSemua();
  $('modal').classList.remove('on');
  if (typeof closeQ === 'function') closeQ();
  document.querySelectorAll('.sheet').forEach(s => s.classList.remove('on'));
  if (CUR === 'duel') $('dBack').onclick();
  else if (CUR === 'garda') $('gBack').onclick();
  else if (CUR === 'rihlah') { try { B = null } catch (e) {} hubReturn(null) }
  if (typeof NET !== 'undefined' && NET.P && !NET.demo) netSimpanSekarang();
}
function sholatTick() {
  const st = statusSholat(), J = st.J, nm = namaSholat(st.k, J), sisa = st.t - kini(), tgl = `${J.y}-${J.m}-${J.d}-${st.k}`;
  SH.st = st;
  const kc = $('kunci'), bar = $('sIngat');
  if (st.mode === 'kunci') {
    if (SH.kunciKey !== tgl) {
      SH.kunciKey = tgl; sholatKeluarMode();
      sholatNotif(`Waktunya sholat ${nm}`, `Sudah masuk waktu ${nm} (${jamLokal(st.t)}). Game istirahat ${SHOLAT_KUNCI} menit. Ayo sholat dulu.`);
    }
    $('kT').textContent = nm;
    $('kJ').textContent = `Masuk pukul ${jamLokal(st.t)} ${zonaNama(J.tz)} · ${LOK.nama}`;
    $('kCd').textContent = mmss(st.sampai - kini());
    $('kB').textContent = `Game dibuka lagi pukul ${jamLokal(st.sampai)}`;
    if (kc.hidden) { kc.hidden = false; document.body.classList.add('dikunci') }
  } else if (!kc.hidden) {
    kc.hidden = true; document.body.classList.remove('dikunci'); toast('Selamat bermain lagi. Semoga sholatnya diterima.');
  }
  if (st.mode === 'ingat') {
    if (SH.ingatKey !== tgl) {
      SH.ingatKey = tgl;
      sholatNotif(`${nm} ${SHOLAT_INGAT} menit lagi`, `Masuk waktu ${nm} pukul ${jamLokal(st.t)}. Selesaikan permainanmu dan bersiap sholat.`);
    }
    $('sIngatT').textContent = `${nm} ${mmss(sisa)} lagi`;
    $('sIngatS').textContent = `Masuk ${jamLokal(st.t)} · game istirahat ${SHOLAT_KUNCI} menit`;
    if (bar.hidden) bar.hidden = false;
  } else if (!bar.hidden) bar.hidden = true;
  document.body.classList.toggle('ada-ingat', st.mode === 'ingat');
  if (window.alamPillSegarkan) alamPillSegarkan();
}

/* ---- tawaran izin (sekali) ---- */
function sholatTawarIzin() {
  try { if (localStorage.getItem('bh-izin-alam')) return } catch (e) { return }
  const perluLok = LOK.asal !== 'perangkat' && !!navigator.geolocation, perluNotif = sholatNotifBisa() && Notification.permission === 'default';
  try { localStorage.setItem('bh-izin-alam', '1') } catch (e) {}
  if (!perluLok && !perluNotif) return;
  modal(`<header>Waktu sholat &amp; cuaca<small>Benteng Huffazh</small></header>
    <p style="text-align:left">Saat masuk waktu sholat, game <b>istirahat ${SHOLAT_KUNCI} menit</b>, dan ada pengingat <b>${SHOLAT_INGAT} menit sebelumnya</b>. Cuaca di dalam game juga mengikuti cuaca di daerahmu: cerah, mendung, hujan, petir, sampai malam.</p>
    <p style="text-align:left">Izinkan <b>lokasi</b> supaya jadwal sholat dan cuaca sesuai daerahmu, dan <b>notifikasi</b> supaya pengingat tetap muncul di HP.</p>`,
    [{ t: 'Izinkan', f: async () => { if (perluLok) await sholatLokasiHP(); if (perluNotif) await sholatMintaNotif() } }, { t: 'Nanti saja', c: 'b-soft' }]);
}

/* ---- mulai ---- */
(async function sholatMulai() {
  sholatTick(); setInterval(sholatTick, 1000);
  await sholatSinkronJam(); sholatTick(); setInterval(sholatSinkronJam, 30 * 60e3);
  try { if (navigator.permissions && LOK.asal === 'perangkat') { const p = await navigator.permissions.query({ name: 'geolocation' }); if (p.state === 'granted') sholatLokasiHP(true) } } catch (e) {}
})();
