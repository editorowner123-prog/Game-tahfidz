/* ===== misi.js — misi harian =====
   1. Tilawah 1 juz (wajib, +150): mushaf Madinah 15 baris, dibaca dengan suara; kata yang terdengar menebal.
      Urut juz 1 → 30 lalu khatam dan mulai lagi dari juz 1. Boleh berhenti dan dilanjutkan.
      +150 untuk SETIAP juz yang selesai (boleh lebih dari 1 juz sehari); hari berikutnya lanjut dari juz terakhir.
   2. Swafoto kebaikan (+20 per kegiatan, maks. 3 sehari): membantu orang tua atau membantu ustadz.
   3. Catatan kajian (+50, sekali sehari): minimal 3 faidah dan 1 dalil; syarat tidak ditampilkan di awal,
      hanya diberi tahu bila kurang. */
const MISI_POIN = { tilawah: 150, swafoto: 20, kajian: 50 }, MISI_BATAS = { tilawah: 99, swafoto: 3, kajian: 1 };
const ANGKA_AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function tglHariIni() { const tz = typeof zonaJam === 'function' ? zonaJam() : 7; return new Date((typeof kini === 'function' ? kini() : Date.now()) + tz * 3600e3).toISOString().slice(0, 10) }
function misiHari() { const t = tglHariIni(); if (!S.misi || S.misi.tgl !== t) S.misi = { tgl: t, tilawah: 0, swafoto: 0, kajian: 0 }; return S.misi }
function tilawahState() { if (!S.tilawah) S.tilawah = { j: 1, w: 0, kh: 0 }; return S.tilawah }
const misiOnline = () => typeof NET !== 'undefined' && !NET.demo && NET.P && NET.sb;

async function klaimMisi(jenis, data, foto) {
  const m = misiHari(); let poin;
  if (misiOnline()) { const r = await netRpc('game_misi_kirim', { p_tipe: NET.P.tipe, p_id: NET.P.id, p_jenis: jenis, p_data: data, p_foto: foto || null }); poin = (r && r.poin) || 0 }
  else poin = m[jenis] < MISI_BATAS[jenis] ? MISI_POIN[jenis] : 0;
  if (poin > 0) { m[jenis]++; S.poin = (S.poin || 0) + poin } else if (jenis !== 'tilawah') m[jenis] = Math.max(m[jenis], MISI_BATAS[jenis]);
  save(); if (typeof hud === 'function') hud(); misiBadge();
  return poin;
}
async function misiSinkron() {
  if (!misiOnline()) return;
  try { const r = await netRpc('game_misi_saya', { p_tipe: NET.P.tipe, p_id: NET.P.id }); const m = misiHari(); if (r && r.tanggal === m.tgl) for (const k in MISI_BATAS) m[k] = Math.max(m[k], (r.hari_ini && r.hari_ini[k]) || 0); misiBadge() } catch (e) {}
}
function misiBadge() { const d = $('misiDot'); if (d) d.hidden = misiHari().tilawah >= 1; if ($('poin')) $('poin').textContent = (S.poin || 0).toLocaleString('id-ID') }

/* ---------- lembar misi ---------- */
const IK_MISI = {
  tilawah: '<svg viewBox="0 0 24 24"><path d="M12 6.5C10 5 6.5 4.6 3.5 5.2v13c3-.6 6.5-.2 8.5 1.3 2-1.5 5.5-1.9 8.5-1.3v-13c-3-.6-6.5-.2-8.5 1.3z" fill="#fff4dc" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 6.5v13" stroke="#c98a5a" stroke-width="1.4"/></svg>',
  swafoto: '<svg viewBox="0 0 24 24"><rect x="3" y="6.5" width="18" height="13" rx="3.5" fill="#fff4dc"/><path d="M8.5 6.5l1.3-2.2h4.4l1.3 2.2" fill="#fff4dc"/><circle cx="12" cy="13" r="3.6" fill="none" stroke="#c96a5a" stroke-width="1.8"/></svg>',
  kajian: '<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="3" fill="#fff4dc"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" stroke="#6a8ac4" stroke-width="1.7" stroke-linecap="round"/></svg>'
};
function bukaMisi() {
  const m = misiHari(), T = tilawahState(), pct = MQ.n && MQ.j === T.j ? Math.floor(T.w / MQ.n * 100) : (T.w ? Math.min(99, Math.floor(T.w / 2580 * 100)) : 0);
  const tgl = new Date(m.tgl + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const kartu = (k, judul, ket, tombol, selesai, wajib) => `<div class="mkartu${selesai ? ' done' : ''}"><span class="mic ${k}">${IK_MISI[k]}</span><div class="mtx"><b>${judul}${wajib ? ' <span class="tag wajib">Wajib</span>' : ''}</b><small>${ket}</small></div><span class="mpt">${selesai ? '✓' : '+' + MISI_POIN[k]}</span></div>${tombol}`;
  sheet(head('Misi harian', tgl) + `<div class="sb misi">
    ${kartu('tilawah', 'Tilawah 1 juz', `Juz ${T.j} · ${pct}% dibaca${T.kh ? ` · khatam ${T.kh}×` : ''}${m.tilawah ? ` · hari ini ${m.tilawah} juz (+${m.tilawah * MISI_POIN.tilawah})` : ''}. Tiap juz yang selesai +${MISI_POIN.tilawah}.`, `<button class="btn ${m.tilawah ? 'b-soft' : 'b-maroon'} wide" id="msTil">${T.w ? 'Lanjutkan tilawah' : 'Mulai tilawah'} Juz ${T.j}</button>`, m.tilawah >= 1, true)}
    ${kartu('swafoto', 'Swafoto kebaikan', `Membantu orang tua atau ustadz · ${m.swafoto}/${MISI_BATAS.swafoto} hari ini`, m.swafoto < MISI_BATAS.swafoto ? '<button class="btn b-soft wide" id="msFoto">Ambil swafoto</button>' : '', m.swafoto >= MISI_BATAS.swafoto)}
    ${kartu('kajian', 'Catatan kajian', m.kajian ? 'Sudah tercatat hari ini' : 'Dengarkan kajian, lalu catat faidah dan dalilnya', m.kajian ? '' : '<button class="btn b-soft wide" id="msKaj">Tulis catatan kajian</button>', m.kajian >= 1)}
    <p class="note" style="margin-top:12px">Total poin <b>${(S.poin || 0).toLocaleString('id-ID')}</b>. Poin menambah level dan peringkat.</p></div>`);
  if ($('msTil')) $('msTil').onclick = () => { closeSheet(); bukaTilawah() };
  if ($('msFoto')) $('msFoto').onclick = ambilSwafoto;
  if ($('msKaj')) $('msKaj').onclick = tulisKajian;
}

/* ---------- 1. tilawah ---------- */
const MQ = { j: 0, n: 0, d: null, sur: null, el: [], key: [], pos: 0, aktif: false, mode: 'sr', rec: null, base: {}, simpanT: 0, majuT: 0, dengarT: 0, vad: null };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const normAr = s => (s || '').replace(/[ً-ٰٟۖ-ۭ࣓-ࣿـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '').replace(/[^ء-ي]/g, '');
function jarak(a, b) { const m = a.length, n = b.length; if (!m || !n) return m || n; let p = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c } return p[n] }
function mirip(a, b) { if (!a || !b) return false; if (a === b) return true; const L = Math.max(a.length, b.length); if (Math.min(a.length, b.length) <= 2) return false; if (L <= 3) return jarak(a, b) <= 1 && a[0] === b[0]; return 1 - jarak(a, b) / L >= .66 }
// Cocokkan ucapan dengan teks mulai dari posisi base; kembalikan posisi kata berikutnya yang belum terbaca.
function cocokkan(teks, base) {
  const t = teks.split(/\s+/).map(normAr).filter(Boolean), K = MQ.key; let q = base;
  for (let i = 0; i < t.length && q < MQ.n; i++) {
    let hit = -1;
    for (let k = q; k < Math.min(MQ.n, q + 7); k++) { if (mirip(K[k], t[i]) || (i + 1 < t.length && mirip(K[k], t[i] + t[i + 1])) || (k + 1 < MQ.n && mirip(K[k] + K[k + 1], t[i]))) { hit = k; break } }
    if (hit >= 0) { q = hit + 1; if (i + 1 < t.length && mirip(K[hit], t[i] + t[i + 1])) i++ }
  }
  return q;
}

async function ambilJSON(u) { const r = await fetch(u); if (!r.ok) throw new Error(u); return r.json() }
async function bukaTilawah() {
  const T = tilawahState();
  $('mushaf').hidden = false; document.body.classList.add('mq-on'); MQ.prevCUR = CUR; CUR = 'misi';
  $('mqPages').innerHTML = '<p class="mqload">Membuka mushaf…</p>'; $('mqT').textContent = `Tilawah Juz ${T.j}`;
  try {
    if (!MQ.sur) MQ.sur = await ambilJSON('data/mushaf-surah.json');
    if (MQ.j !== T.j || !MQ.d) { MQ.d = await ambilJSON(`data/mushaf${T.j}.json`); MQ.j = T.j }
    await document.fonts.load("30px 'KFGQPC Hafs'").catch(() => {});
    renderMushaf(); MQ.pos = Math.min(T.w, MQ.n); tandai(0, MQ.pos); perbaruiBar(); setTimeout(() => gulirKe(MQ.pos, false), 60);
    stMq(MQ.pos ? 'Lanjutkan dari kata yang ditandai. Ketuk mikrofon, lalu baca dengan suara.' : 'Ketuk mikrofon, lalu baca dengan suara. Kata yang terbaca akan menebal.');
  } catch (e) { $('mqPages').innerHTML = '<p class="mqload">Mushaf gagal dimuat. Periksa internet, lalu coba lagi.</p>' }
}
function renderMushaf() {
  const d = MQ.d, sur = MQ.sur; let i = 0; const key = [];
  const html = d.p.map(pg => {
    const nm = sur.s[pg.s[0] - 1][0];
    const lines = pg.l.map((l, li) => {
      if (l.h) return `<div class="mq-sh"><span>سُورَةُ ${sur.s[l.h - 1][0]}</span></div>`;
      if (l.b) return `<div class="mq-bas">${sur.basmalah}</div>`;
      const pendek = pg.n <= 2 || l.w.length <= 5;
      return `<div class="mq-ln${pendek ? ' c' : ''}">${l.w.map(w => {
        const am = w[2] ? `<span class="mq-am">۝${ANGKA_AR(w[2])}</span>` : '';
        if (w[3]) return `<span class="mq-w o">${w[0]}</span>${am}`;
        key.push(w[1]); return `<span class="mq-w" data-i="${i++}">${w[0]}</span>${am}`;
      }).join('')}</div>`;
    }).join('');
    return `<article class="mq-pg${pg.n <= 2 ? ' awal' : ''}"><div class="mq-pgh"><span>${nm}</span><span>الجزء ${ANGKA_AR(d.j)}</span></div><div class="mq-tx">${lines}</div><div class="mq-pgn">${ANGKA_AR(pg.n)}</div></article>`;
  }).join('');
  $('mqPages').innerHTML = html + '<p class="mqcredit">Mushaf Madinah 15 baris · teks dan tata letak: quran-text (quran.ws, CC BY 4.0) · huruf: KFGQPC Uthmanic Hafs</p>';
  MQ.key = key; MQ.n = key.length; MQ.el = [...$('mqPages').querySelectorAll('.mq-w[data-i]')];
  ukurHuruf();
}
// Samakan ukuran huruf supaya baris terpanjang pas selebar halaman.
function ukurHuruf() {
  const box = $('mqPages'), tx = box.querySelector('.mq-tx'); if (!tx) return;
  box.style.setProperty('--mqf', '20px'); box.classList.add('ukur');
  let max = 0; box.querySelectorAll('.mq-ln:not(.c)').forEach(l => { max = Math.max(max, l.scrollWidth) });
  box.classList.remove('ukur');
  const lebar = tx.clientWidth || (box.clientWidth - 40);
  box.style.setProperty('--mqf', Math.max(14, Math.min(34, 20 * lebar / (max || lebar) * .97)).toFixed(2) + 'px');
}
function tandai(a, b) { for (let k = a; k < b && k < MQ.n; k++) MQ.el[k].classList.add('r'); MQ.el.forEach(e => e.classList.remove('c')); if (MQ.pos < MQ.n) MQ.el[MQ.pos].classList.add('c') }
function perbaruiBar() { const p = MQ.n ? MQ.pos / MQ.n : 0; $('mqBar').style.width = (p * 100).toFixed(1) + '%'; $('mqS').textContent = `${Math.floor(p * 100)}% · ${MQ.pos}/${MQ.n} kata` }
function gulirKe(k, halus = true) { const e = MQ.el[Math.min(k, MQ.n - 1)]; if (!e) return; const box = $('mqPages'), r = e.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.top < b.top + 60 || r.bottom > b.bottom - 120) box.scrollTo({ top: box.scrollTop + r.top - b.top - b.height * .35, behavior: halus ? 'smooth' : 'auto' }) }
function maju(ke) {
  ke = Math.min(MQ.n, ke); if (ke <= MQ.pos) return;
  const dari = MQ.pos; MQ.pos = ke; MQ.majuT = Date.now(); tandai(dari, ke); perbaruiBar(); gulirKe(ke);
  const T = tilawahState(); T.w = ke; if (Date.now() - MQ.simpanT > 3000) { MQ.simpanT = Date.now(); save() }
  if (MQ.pos >= MQ.n) selesaiJuz();
}
function stMq(t, err) { const s = $('mqSt'); s.textContent = t; s.classList.toggle('err', !!err) }

function mulaiDengar() {
  if (MQ.pos >= MQ.n) return;
  MQ.aktif = true; $('mqMic').classList.add('on'); $('mqMic').setAttribute('aria-label', 'Jeda'); MQ.majuT = Date.now();
  if (SR && MQ.mode === 'sr') mulaiSR(); else mulaiVAD();
}
function jedaDengar(pesan) {
  MQ.aktif = false; $('mqMic').classList.remove('on'); $('mqMic').setAttribute('aria-label', 'Mulai membaca'); $('mqMic').style.setProperty('--lv', 0);
  if (MQ.rec) { try { MQ.rec.onend = null; MQ.rec.abort() } catch (e) {} MQ.rec = null }
  if (MQ.vad) { try { MQ.vad.stream.getTracks().forEach(t => t.stop()); MQ.vad.ac.close() } catch (e) {} MQ.vad = null }
  const T = tilawahState(); T.w = MQ.pos; save();
  if (pesan !== false) stMq(pesan || 'Dijeda. Ketuk mikrofon untuk melanjutkan.');
}
function mulaiSR() {
  const r = new SR(); r.lang = 'ar-SA'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 3; MQ.rec = r; MQ.base = {};
  r.onresult = e => {
    MQ.dengarT = Date.now();
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]; if (MQ.base[i] == null) MQ.base[i] = MQ.pos;
      let best = MQ.pos; for (let a = 0; a < res.length; a++) best = Math.max(best, cocokkan(res[a].transcript, MQ.base[i]));
      maju(best);
    }
  };
  r.onspeechstart = () => { MQ.dengarT = Date.now() };
  r.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { jedaDengar(false); stMq('Mikrofon belum diizinkan. Izinkan mikrofon untuk game ini di pengaturan browser, lalu coba lagi.', 1) }
    else if (e.error === 'network' || e.error === 'language-not-supported') { MQ.mode = 'vad'; try { r.onend = null; r.abort() } catch (x) {} MQ.rec = null; stMq(e.error === 'network' ? 'Pengenal bacaan butuh internet. Beralih ke mode ikuti suara.' : 'HP ini belum bisa mengenali bacaan Arab. Beralih ke mode ikuti suara.'); mulaiVAD() }
    else if (e.error === 'audio-capture') { jedaDengar(false); stMq('Mikrofon tidak terbaca. Pastikan tidak dipakai aplikasi lain.', 1) }
  };
  r.onend = () => { if (MQ.aktif && MQ.rec === r) { MQ.base = {}; setTimeout(() => { if (MQ.aktif && MQ.rec === r) try { r.start() } catch (e) {} }, 150) } };
  try { r.start(); stMq('Mendengarkan… baca dengan suara yang jelas.') } catch (e) { MQ.mode = 'vad'; mulaiVAD() }
}
async function mulaiVAD() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(stream).connect(an);
    MQ.vad = { stream, ac, an, buf: new Float32Array(an.fftSize), dasar: .01, suara: 0, t: performance.now() };
    stMq('Mode ikuti suara: kata menebal selama kamu membaca dengan suara.');
    const loop = () => {
      const v = MQ.vad; if (!v || !MQ.aktif) return;
      v.an.getFloatTimeDomainData(v.buf); let s = 0; for (const x of v.buf) s += x * x; const rms = Math.sqrt(s / v.buf.length), now = performance.now(), dt = Math.min(.1, (now - v.t) / 1000); v.t = now;
      v.dasar = rms < v.dasar ? v.dasar * .9 + rms * .1 : v.dasar * .999 + rms * .001;
      const bersuara = rms > Math.max(.015, v.dasar * 2.6); $('mqMic').style.setProperty('--lv', Math.min(1, rms * 12).toFixed(2));
      if (bersuara) { MQ.dengarT = Date.now(); v.suara += dt; const butuh = .28 + .07 * (MQ.key[MQ.pos] || '').length; if (v.suara >= butuh) { v.suara = 0; maju(MQ.pos + 1) } }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } catch (e) { jedaDengar(false); stMq('Mikrofon belum diizinkan. Izinkan mikrofon untuk game ini, lalu coba lagi.', 1) }
}
// Petunjuk bila suara terdengar tapi bacaan belum cocok.
setInterval(() => {
  if (!MQ.aktif || MQ.mode !== 'sr') return; const now = Date.now();
  if (now - MQ.majuT > 12000 && now - MQ.dengarT < 4000) stMq('Bacaan belum cocok. Baca lebih pelan dan jelas, atau pakai "Ikuti suara".', 1);
}, 2000);

async function selesaiJuz() {
  const T = tilawahState(), j = T.j; jedaDengar(false);
  T.j = j === 30 ? 1 : j + 1; T.w = 0; if (j === 30) T.kh = (T.kh || 0) + 1; save();
  let poin = 0, gagal = false; try { poin = await klaimMisi('tilawah', { juz: j, khatam: T.kh }) } catch (e) { gagal = true }
  stMq('Alhamdulillah, juz ini selesai.');
  modal(`<header>${j === 30 ? 'Khatam!' : `Juz ${j} selesai`}<small>${j === 30 ? `Khatam ke-${T.kh}. Masya Allah, tabarakallah.` : 'Alhamdulillah'}</small></header>
    <p>${poin ? `<b>+${poin} poin</b>. Hari ini sudah ${misiHari().tilawah} juz.` : gagal ? 'Bacaan tersimpan, tapi poin belum terkirim karena koneksi.' : 'Juz ini sudah pernah dapat poin di putaran khatam ini. Bacaanmu tetap tercatat.'}</p>
    <p style="font-size:14px;color:var(--muted)">Berikutnya: Juz ${T.j}.</p>`, [{ t: 'Kembali ke desa', f: tutupTilawah }, { t: `Lanjut Juz ${T.j}`, c: 'b-soft', f: () => { MQ.d = null; bukaTilawah() } }]);
}
function tutupTilawah() {
  if (MQ.aktif) jedaDengar(false); const T = tilawahState(); if (MQ.j === T.j) T.w = Math.max(T.w, MQ.pos); save();
  $('mushaf').hidden = true; document.body.classList.remove('mq-on'); if (CUR === 'misi') CUR = 'hub'; misiBadge();
}
function misiTutupSemua() { if (!$('mushaf').hidden) tutupTilawah() }

/* ---------- 2. swafoto ---------- */
async function kecilkanFoto(f) {
  let img; try { img = await createImageBitmap(f, { imageOrientation: 'from-image' }) } catch (e) { img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(f) }) }
  const k = Math.min(1, 720 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(ok => c.toBlob(ok, 'image/jpeg', .72));
}
function ambilSwafoto() {
  if (misiHari().swafoto >= MISI_BATAS.swafoto) { toast('Swafoto hari ini sudah 3 kali. Besok lagi, ya!'); return }
  const inp = $('fotoIn'); inp.value = '';
  inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f) return; try { const b = await kecilkanFoto(f); formSwafoto(b) } catch (e) { toast('Foto tidak bisa dibaca. Coba ambil lagi.') } };
  inp.click();
}
function formSwafoto(blob) {
  const url = URL.createObjectURL(blob); let untuk = 'orang tua';
  modal(`<header>Swafoto kebaikan<small>+${MISI_POIN.swafoto} poin</small></header><div class="sf"><img src="${url}" alt="Pratinjau swafoto">
    <div class="ndchips sfseg"><button type="button" class="chip on" data-u="orang tua">Membantu orang tua</button><button type="button" class="chip" data-u="ustadz">Membantu ustadz</button></div>
    <input id="sfKet" maxlength="80" placeholder="Apa yang kamu kerjakan? Mis. menyapu halaman"><p class="nderr" id="sfErr" role="alert"></p></div>`, [{ t: 'Kirim' }, { t: 'Batal', c: 'b-soft' }]);
  $('mc').querySelectorAll('[data-u]').forEach(b => b.onclick = () => { untuk = b.dataset.u; $('mc').querySelectorAll('[data-u]').forEach(x => x.classList.toggle('on', x === b)) });
  const kirim = $('mc').querySelector('.btn');
  kirim.onclick = async () => {
    const ket = $('sfKet').value.trim().replace(/\s+/g, ' ');
    if (ket.length < 4) { $('sfErr').textContent = 'Tulis singkat kegiatanmu, ya.'; $('sfKet').focus(); return }
    kirim.disabled = true; kirim.textContent = 'Mengirim…';
    try {
      let path = null;
      if (misiOnline()) {
        const { data } = await NET.sb.auth.getSession(); const uid = data && data.session && data.session.user.id; if (!uid) throw new Error('Sesi habis, masuk lagi.');
        path = `${uid}/${NET.P.tipe}-${NET.P.id}/${tglHariIni()}-${Date.now()}.jpg`;
        const { error } = await NET.sb.storage.from('game-misi').upload(path, blob, { contentType: 'image/jpeg', upsert: false }); if (error) throw error;
      }
      const poin = await klaimMisi('swafoto', { ket, untuk }, path);
      $('modal').classList.remove('on'); URL.revokeObjectURL(url);
      toast(poin ? `Jazakallahu khairan! +${poin} poin` : 'Swafoto tersimpan. Batas poin hari ini sudah tercapai.');
      if ($('sheet').classList.contains('on')) bukaMisi();
    } catch (e) { kirim.disabled = false; kirim.textContent = 'Kirim'; $('sfErr').textContent = 'Gagal mengirim: ' + netErr(e) }
  };
}

/* ---------- 3. catatan kajian ---------- */
const KJ_DRAFT = 'bh-kajian-draft';
function tulisKajian() {
  if (misiHari().kajian >= 1) { toast('Catatan kajian hari ini sudah tercatat.'); return }
  let dr = {}; try { dr = JSON.parse(localStorage.getItem(KJ_DRAFT)) || {} } catch (e) {}
  sheet(head('Catatan kajian', `+${MISI_POIN.kajian} poin`) + `<div class="sb kj">
    <label class="kjl">Tema kajian<input id="kjTema" maxlength="120" placeholder="Mis. Adab menuntut ilmu"></label>
    <label class="kjl">Pemateri<input id="kjUst" maxlength="80" placeholder="Mis. Ustadz Fulan"></label>
    <div class="kjsec"><b>Faidah</b><small>Pelajaran yang kamu dapat dari kajian</small><div id="kjF"></div><button type="button" class="btn b-soft" id="kjFAdd">+ Tambah faidah</button></div>
    <div class="kjsec"><b>Dalil</b><small>Ayat atau hadits yang disampaikan</small><div id="kjD"></div><button type="button" class="btn b-soft" id="kjDAdd">+ Tambah dalil</button></div>
    <p class="nderr" id="kjErr" role="alert"></p>
    <button class="btn b-green wide" id="kjKirim">Kirim catatan</button></div>`);
  const isian = (box, ph, v = '') => { const t = document.createElement('textarea'); t.rows = 2; t.maxLength = 600; t.placeholder = ph; t.value = v; t.oninput = simpanDraft; $(box).appendChild(t); return t };
  const ambil = box => [...$(box).querySelectorAll('textarea')].map(t => t.value.trim().replace(/\s+/g, ' '));
  function simpanDraft() { try { localStorage.setItem(KJ_DRAFT, JSON.stringify({ tema: $('kjTema').value, ust: $('kjUst').value, f: ambil('kjF'), d: ambil('kjD') })) } catch (e) {} }
  $('kjTema').value = dr.tema || ''; $('kjUst').value = dr.ust || ''; $('kjTema').oninput = $('kjUst').oninput = simpanDraft;
  (dr.f && dr.f.length ? dr.f : ['']).forEach((v, k) => isian('kjF', `Faidah ${k + 1}`, v));
  (dr.d && dr.d.length ? dr.d : ['']).forEach(v => isian('kjD', 'Mis. QS. Al-Mujadilah: 11, atau hadits tentang …', v));
  $('kjFAdd').onclick = () => isian('kjF', `Faidah ${$('kjF').children.length + 1}`).focus();
  $('kjDAdd').onclick = () => isian('kjD', 'Dalil lainnya').focus();
  $('kjKirim').onclick = async () => {
    const seen = new Set(), faidah = ambil('kjF').filter(x => { const k = x.toLowerCase(); if (x.length < 12 || x.split(' ').length < 3 || seen.has(k)) return false; seen.add(k); return true }), dalil = ambil('kjD').filter(x => x.length >= 6);
    const kurang = [];
    if (faidah.length < 3) kurang.push(faidah.length ? `Faidahnya baru ${faidah.length}. Tambah ${3 - faidah.length} faidah lagi dari kajian ini.` : 'Faidahnya belum ada. Tulis pelajaran yang kamu dapat dari kajian ini.');
    if (!dalil.length) kurang.push('Dalilnya belum ada. Tulis ayat atau hadits yang disebut dalam kajian.');
    if (kurang.length) {
      $('kjErr').textContent = kurang.join(' '); $('kjErr').scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (faidah.length < 3) { const kosong = [...$('kjF').querySelectorAll('textarea')].filter(t => t.value.trim().length < 12).length; for (let k = kosong; k < 3 - faidah.length; k++) isian('kjF', `Faidah ${$('kjF').children.length + 1}`) }
      return;
    }
    const b = $('kjKirim'); b.disabled = true; b.textContent = 'Mengirim…';
    try {
      const poin = await klaimMisi('kajian', { tema: $('kjTema').value.trim(), pemateri: $('kjUst').value.trim(), faidah, dalil });
      try { localStorage.removeItem(KJ_DRAFT) } catch (e) {}
      closeSheet(); toast(poin ? `Barakallahu fiik! +${poin} poin` : 'Catatan tersimpan. Poin kajian hari ini sudah didapat.');
    } catch (e) { b.disabled = false; b.textContent = 'Kirim catatan'; $('kjErr').textContent = /KURANG/.test(netErr(e)) ? 'Catatan belum lengkap. Periksa faidah dan dalilnya.' : 'Gagal mengirim: ' + netErr(e) }
  };
}

/* ---------- mulai ---------- */
function misiMulai() {
  misiHari(); misiBadge(); misiSinkron();
  setTimeout(() => { if (!misiHari().tilawah && !$('modal').classList.contains('on') && CUR === 'hub') toast('Misi wajib hari ini: tilawah 1 juz. Ketuk ★ untuk mulai.') }, 5000);
}
if ($('poinP')) $('poinP').onclick = bukaMisi;
if ($('mqX')) $('mqX').onclick = tutupTilawah;
if ($('mqMic')) $('mqMic').onclick = () => MQ.aktif ? jedaDengar() : mulaiDengar();
if ($('mqMode')) $('mqMode').onclick = () => { const on = MQ.aktif; if (on) jedaDengar(false); MQ.mode = MQ.mode === 'sr' ? 'vad' : 'sr'; $('mqMode').textContent = MQ.mode === 'sr' ? 'Ikuti suara' : 'Kenali bacaan'; if (!SR) MQ.mode = 'vad'; if (on) mulaiDengar(); else stMq(MQ.mode === 'sr' ? 'Mode kenali bacaan: kata menebal bila bacaan cocok.' : 'Mode ikuti suara: kata menebal selama kamu membaca dengan suara.') };
if (!SR) { MQ.mode = 'vad'; if ($('mqMode')) $('mqMode').hidden = true }
window.addEventListener('resize', () => { if (!$('mushaf').hidden && MQ.d) ukurHuruf() });
