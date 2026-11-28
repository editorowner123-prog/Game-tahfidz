/* ===== serang.js — menyerang desa lain ala COC, serangan masuk, bangunan runtuh ===== */
const SERANG = window.SERANG = { sisa: 2, lindung: false, ts: 0 };
const SG_WAKTU = 90, SG_MAKS = 40, SG_MIN = 10, RUNTUH_MENIT = 30, KALAH_PAS = 25;
const SG = { on: false };
const scv = $('scv'), sctx = scv ? scv.getContext('2d') : null;
const sgOnline = () => typeof NET !== 'undefined' && !NET.demo && NET.P && NET.sb;
const HP_DASAR = { rumah: 240, menara: 300, asrama: 280, benteng: 420, masjid: 700 };
// keseimbangan: nyawa & serangan prajurit, lalu [kerusakan per level, jeda, jangkauan, percikan] pertahanan
const SGK = { hp: 80, hpK: 3, dpsK: 1, menara: [6, 1, 4.5], benteng: [10, 2.2, 3.6, .7], masjid: [9, 1.2, 5.5], jagaPer: 8 };

/* ---------- jatah & mode coba ---------- */
function demoJatah() { const t = typeof tglHariIni === 'function' ? tglHariIni() : new Date().toISOString().slice(0, 10), d = store.get('bh-serang-demo', {}); return d.tgl === t ? d : { tgl: t, n: 0 } }
function demoPakai() { const d = demoJatah(); d.n++; store.set('bh-serang-demo', d); SERANG.sisa = Math.max(0, 2 - d.n) }
function lawanDemo(n) {
  const r = mulb(97 + n.k * 13 + n.tingkat), t = Math.max(0, Math.min(5, n.tingkat | 0)), js = tierJuz(t), nOwn = Math.max(1, Math.min(5, 1 + Math.floor(n.lv / 3)));
  const st = { tier: t, t: {}, b: {}, pas: Math.min(80, Math.round(n.skor / 25)), latih: Math.min(10, Math.floor(n.lv / 3)) };
  js.slice(0, nOwn).forEach(j => { st.t[j] = { open: 1, own: 1 }; for (let q = 0; q < 4; q++) if (r() < .85) st.b[j + '-' + q] = { lv: 1 + (r() < .45) + (r() < .2), s: 55 + r() * 45, t: Date.now() } });
  return { ...st, gid: 'demo' + n.k, nama: n.nama, desa: n.desa, lindung: !!n.lindung };
}

/* ---------- daftar desa yang bisa diserang ---------- */
function bukaDaftarSerang() {
  sel = null; const L = (window.TET && TET.list) || [];
  const rows = L.map((n, k) => `<div class="li"><div><b>${esc(TIERS[n.tingkat].nm + ' ' + (n.desa || 'tanpa nama'))}</b><small>${esc(n.nama)} · Lv ${n.lv} · ${n.bangunan} bangunan</small></div>${n.lindung ? '<span class="tag">Dilindungi</span>' : `<button class="btn b-maroon" data-sk="${k}">Serang</button>`}</div>`).join('');
  sheet(head('Serang desa lain', `Jatah hari ini ${SERANG.sisa}/2 · ${S.pas || 0} pasukan · ⚔ ${angkaPendek(kuatTotal())}`) + `<div class="sb">
    <p class="p">Hancurkan minimal <b>50%</b> bangunan atau <b>masjid</b> desa lawan untuk menang. Menang: <b>+30 emas per bintang</b>, dan bangunan yang kamu hancurkan runtuh sementara di desa lawan. Kalah: pasukanmu berkurang <b>${KALAH_PAS}</b>.</p>
    <div class="list">${rows || '<p class="note">Belum ada desa lain di sekitarmu.</p>'}</div>
    <p class="note">Desa yang baru kalah diserang dilindungi 24 jam. Santri melawan santri, ustadz melawan ustadz.</p></div>`);
  $('sheet').querySelectorAll('[data-sk]').forEach(b => b.onclick = () => mulaiIntai(L[+b.dataset.sk]));
}
async function mulaiIntai(n) {
  if (!n) return;
  if (SERANG.sisa <= 0) { toast('Jatah serangan hari ini sudah habis (2 kali). Besok lagi, ya.'); return }
  if (n.lindung) { toast('Desa ini sedang dilindungi setelah diserang. Pilih desa lain.'); return }
  if ((S.pas || 0) < SG_MIN) { toast(`Butuh minimal ${SG_MIN} pasukan untuk menyerang. Tambah pasukan lewat Garda.`); return }
  if (window.statusSholat) { const st = statusSholat(); if (st.mode === 'kunci' || (st.mode === 'ingat' && st.t - kini() < 3 * 60e3)) { toast('Sebentar lagi waktu sholat. Serang setelah sholat, ya.'); return } }
  if (sgOnline() && !n.gid) { toast('Fitur serangan belum aktif di server. Minta admin menjalankan SQL tahap 4.'); return }
  closeSheet(); $('loadS').textContent = 'Mengintai desa lawan…'; $('load').hidden = false;
  try {
    const d = sgOnline() ? await netRpc('game_desa_lawan', { p_tipe: NET.P.tipe, p_id: NET.P.id, p_gid: n.gid }) : lawanDemo(n);
    if (d.sisa != null) SERANG.sisa = d.sisa;
    if (d.lindung) { n.lindung = true; throw new Error('LINDUNG: Desa ini sedang dilindungi.') }
    if (SERANG.sisa <= 0) throw new Error('BATAS: Jatah serangan hari ini sudah habis.');
    siapkanMedan({ ...d, nama: d.nama || n.nama, desa: d.desa || n.desa, n });
  } catch (e) { $('load').hidden = true; toast(netErr(e).replace(/^(BATAS|LINDUNG): ?/, '')) }
}

/* ---------- medan ---------- */
function strDari(b) { return b && b.lv ? clamp(b.s - RATE[b.lv] * (Date.now() - b.t) / 864e5, 0, 100) : 0 }
function kuatLawan(d) {
  let lv = 0;
  for (const key in d.b || {}) { const b = d.b[key]; if (!b || !b.lv || (b.rt && b.rt > Date.now())) continue; const [j, q] = key.split('-').map(Number), kd = jenisPlot(j, q); if ((kd === 'benteng' || kd === 'asrama') && strDari(b) > 0) lv += b.lv }
  return 10 * (1 + .1 * Math.min(LATIH_MAX, d.latih || 0)) * (1 + Math.min(1, lv * .02));
}
function siapkanMedan(d) {
  const t = Math.max(0, Math.min(5, d.tier | 0)), js = tierJuz(t), B = [];
  let berdiri = 0;
  js.forEach((j, k) => {
    if (!(d.t && d.t[j] && d.t[j].own)) return;
    const [bx, by] = TBLK[k], i0 = BB + bx * BS, j0 = BB + by * BS;
    PLOT.forEach(([px, py], q) => {
      const key = j + '-' + q, b = d.b && d.b[key]; if (!b || !b.lv) return; berdiri++;
      if (b.rt && b.rt > Date.now()) return; const s = strDari(b); if (s <= 0) return;
      const kind = KINDS[(q + k) % 4], hp = HP_DASAR[kind] * (1 + .45 * (b.lv - 1)) * (.55 + .45 * s / 100);
      B.push({ key, kind, lv: b.lv, s, db: s >= 70 ? 0 : s >= 50 ? 1 : s >= 30 ? 2 : 3, gi: i0 + px * 3, gj: j0 + py * 3, n: 2, hp, max: hp, cd: rnd0(), hidup: true });
    });
  });
  const ml = 1 + (berdiri >= 6) + (berdiri >= 14) + (berdiri >= 20), mhp = HP_DASAR.masjid * (1 + .3 * (ml - 1));
  B.push({ key: 'masjid', kind: 'masjid', lv: ml, gi: BB + BS + 1, gj: BB + BS + 1, n: 4, hp: mhp, max: mhp, cd: 0, hidup: true });
  const kp = kuatPer(), kd = kuatLawan(d);
  Object.assign(SG, {
    on: true, d, t, B, U: [], Y: [], fx: [], tx: [], mulai: false, selesai: false, sid: null, waktu: SG_WAKTU,
    sisaTurun: Math.min(S.pas || 0, SG_MAKS), turun: 0, kp, kd, penjaga: Math.min(8, Math.floor((d.pas || 0) / SGK.jagaPer)), jagaKeluar: false,
    zona: B.map(b => [b.gi - 1, b.gj - 1, b.n + 2]), merah: 0, cam: { x: 0, y: 0, z: .8 }, tanah: null, pohon: [], hancur: 0, total: B.length, akhirT: 0,
  });
  const r = mulb(7 + t); for (let i = -5; i < MM + 5; i++) for (let j = -5; j < MM + 5; j++) if (tileKind(i, j) === 'out' && r() < .45) SG.pohon.push({ i: i + .2 + r() * .6, j: j + .2 + r() * .6, v: Math.floor(r() * 4) });
  SG.pohon = SG.pohon.filter(p => !(p.i > -1 && p.i < MM + 1 && p.j > -1 && p.j < MM + 1));
  SG.tanah = tanahSerang(t);
  // kamera: muat semua bangunan
  let x1 = 1e9, x2 = -1e9, y1 = 1e9, y2 = -1e9;
  for (const b of B) { const pts = [P(b.gi, b.gj), P(b.gi + b.n, b.gj), P(b.gi, b.gj + b.n), P(b.gi + b.n, b.gj + b.n)]; for (const [x, y] of pts) { x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y - 140); y2 = Math.max(y2, y) } }
  resizeSerang(); SG.cam.x = (x1 + x2) / 2; SG.cam.y = (y1 + y2) / 2 + 20; SG.cam.z = clamp(Math.min(SG.W / (x2 - x1 + 160), (SG.H - 190) / (y2 - y1 + 160)), .56, 1.05);
  $('sgNama').textContent = `${TIERS[t].nm} ${d.desa || 'tanpa nama'}`; $('sgSub').textContent = `milik ${d.nama} · ${SG.penjaga} penjaga · masjid Lv ${ml}`;
  $('sgAkhir').textContent = 'Batal'; $('sgTip').hidden = false; perbaruiSG();
  $('load').hidden = true; go('serang'); dock(false); if (window.sfx) sfx('ketuk');
  if (!SG.loop) { SG.loop = 1; requestAnimationFrame(frameSerang) }
}
function resizeSerang() { if (!scv) return; const d = Math.min(2, devicePixelRatio || 1); SG.dpr = d; SG.W = innerWidth; SG.H = innerHeight; scv.width = SG.W * d; scv.height = SG.H * d; scv.style.width = SG.W + 'px'; scv.style.height = SG.H + 'px' }
addEventListener('resize', () => { if (CUR === 'serang') resizeSerang() });

function tanahSerang(t) {
  const pad = 300, w = MM * 64 + pad * 2, h = MM * 32 + pad * 2, gs = Math.min(1.5, Math.sqrt(8e6 / (w * h))), c = document.createElement('canvas');
  c.width = Math.ceil(w * gs); c.height = Math.ceil(h * gs); const g = c.getContext('2d'), ox = MM * 32 + pad, oy = pad, [g1, g2] = TIERS[t].g, r = mulb(11);
  g.fillStyle = C(g2, -.1); g.fillRect(0, 0, c.width, c.height); g.setTransform(gs, 0, 0, gs, ox * gs, oy * gs);
  const dia = (i, j, w, d) => { const a = P(i, j), b = P(i + w, j), e = P(i + w, j + d), f = P(i, j + d); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...e); g.lineTo(...f); g.closePath() };
  const COL = { out: [C(g2, -.08), C(g2, -.11)], grass: [g1, g2], deco: [g1, g2], road: ['#f2e0b8', '#eedaae'], path: ['#f5e7c8', '#f1e1bf'], plaza: ['#f7efe0', '#f2e8d6'] };
  for (let i = -9; i < MM + 9; i++) for (let j = -9; j < MM + 9; j++) { const col = COL[tileKind(i, j)][(i + j) & 1]; dia(i, j, 1, 1); g.fillStyle = col; g.fill(); g.strokeStyle = col; g.lineWidth = .8; g.stroke() }
  for (const [bx, by, ty] of DBLK) {
    const i0 = BB + bx * BS, j0 = BB + by * BS;
    if (ty === 'kolam') { const [cx, cy] = P(i0 + 2.5, j0 + 2.5); g.fillStyle = '#f3e4c0'; g.beginPath(); g.ellipse(cx, cy, 2.35 * 45, 2.35 * 22.6, 0, 0, 7); g.fill(); g.fillStyle = '#86c8e2'; g.beginPath(); g.ellipse(cx, cy, 2.05 * 45, 2.05 * 22.6, 0, 0, 7); g.fill() }
    if (ty === 'kebun') for (let a = 0; a < 4; a++) { dia(i0 + .4 + a * 1.2, j0 + .5, .85, 4.3); g.fillStyle = '#c9a072'; g.fill(); for (let b = 0; b < 6; b++) { const [x, y] = P(i0 + .82 + a * 1.2, j0 + .85 + b * .7); g.fillStyle = '#6ab84a'; g.beginPath(); g.arc(x, y - 3, 5, 0, 7); g.fill() } }
    if (ty === 'lapangan') { dia(i0 + .22, j0 + .22, 4.56, 4.56); g.fillStyle = '#e2cb98'; g.fill() }
  }
  for (let q = 0; q < 90; q++) { const [x, y] = P(r() * MM, r() * MM); g.fillStyle = 'rgba(160,120,70,.12)'; g.beginPath(); g.ellipse(x, y, 2, 1, 0, 0, 7); g.fill() }
  return { c, ox, oy, gs };
}

/* ---------- pasukan & penjaga ---------- */
function unitBaru(sisi, x, y) {
  const k = sisi ? SG.kd : SG.kp, hp = SGK.hp + k * SGK.hpK;
  return { sisi, x, y, hp, max: hp, dps: k * SGK.dpsK, v: sisi ? 1.35 : 1.5, cd: .3 + rnd0() * .5, tgt: null, ph: rnd0() * 6, arah: 1, bk: 0, pose: 'jalan', cari: 0, hidup: true, kena: 0 };
}
function dalamZona(i, j) { return SG.zona.some(([a, b, n]) => i > a && i < a + n && j > b && j < b + n) }
function turunkan(sx, sy) {
  if (SG.selesai || SG.sisaTurun <= 0) return false;
  const [wx, wy] = [(sx - SG.W / 2) / SG.cam.z + SG.cam.x, (sy - SG.H / 2) / SG.cam.z + SG.cam.y], i = (wx / 32 + wy / 16) / 2, j = (wy / 16 - wx / 32) / 2;
  if (i < -4 || j < -4 || i > MM + 4 || j > MM + 4) return false;
  if (dalamZona(i, j)) { SG.merah = 1.2; if (window.sfx) sfx('salah'); return false }
  const u = unitBaru(0, i + (rnd0() - .5) * .3, j + (rnd0() - .5) * .3); SG.U.push(u); SG.sisaTurun--; SG.turun++;
  sgBurst(...P(u.x, u.y, 4), 8, ['#ffffff', '#cfe6ff'], 50, 30, .5, 2.5); if (window.sfx) sfx('turun');
  if (!SG.mulai) mulaiSerang();
  perbaruiSG(); return true;
}
async function mulaiSerang() {
  SG.mulai = true; $('sgAkhir').textContent = 'Akhiri'; $('sgTip').hidden = true; if (window.sfx) sfx('serang');
  const d = SG.d;
  try {
    if (sgOnline()) { const r = await netRpc('game_serang_mulai', { p_tipe: NET.P.tipe, p_id: NET.P.id, p_gid: d.gid }); SG.sid = r.id; SERANG.sisa = r.sisa }
    else { demoPakai(); SG.sid = 'demo' }
    S.serangJalan = { sid: SG.sid, nama: d.nama, desa: d.desa, t: Date.now() }; save();
  } catch (e) {
    const m = netErr(e).replace(/^(BATAS|LINDUNG): ?/, ''); SG.selesai = true; SG.batal = true;
    modal(`<header>Serangan tidak bisa dimulai</header><p>${esc(/fetch|network|Failed/i.test(m) ? 'Tidak tersambung ke server. Periksa internet, lalu coba lagi.' : m)}</p>`, [{ t: 'Kembali ke desa', f: keluarSerang }]);
  }
}
function jarakKotak(u, b) { const dx = Math.max(b.gi - u.x, 0, u.x - (b.gi + b.n)), dy = Math.max(b.gj - u.y, 0, u.y - (b.gj + b.n)); return Math.hypot(dx, dy) }
function titikKotak(u, b) { return [clamp(u.x, b.gi + .15, b.gi + b.n - .15), clamp(u.y, b.gj + .15, b.gj + b.n - .15)] }
function hadap(u, tx, ty) { const sx = ((tx - u.x) - (ty - u.y)) * 32, sy = ((tx - u.x) + (ty - u.y)) * 16; if (Math.abs(sx) > .01) u.arah = sx > 0 ? 1 : -1; u.bk = sy < -.01 ? 1 : 0 }
function langkah(u, tx, ty, dt) { const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy); if (d < 1e-4) return; const s = Math.min(d, u.v * dt); u.x += dx / d * s; u.y += dy / d * s; hadap(u, tx, ty); u.pose = 'jalan'; u.ph += dt * 10 }
function updateUnit(u, dt) {
  const lawan = SG.U.filter(o => o.hidup && o.sisi !== u.sisi);
  u.cari -= dt;
  if (u.sisi === 0) {
    if (u.cari <= 0 || !u.tgt || !u.tgt.hidup) {
      u.cari = .3; let best = null, bd = 1e9;
      for (const o of lawan) { const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < 1.7 && d < bd) { bd = d; best = o } }
      if (!best && (!u.tgt || !u.tgt.hidup || u.tgt.sisi === 1)) { for (const b of SG.B) if (b.hidup) { const d = jarakKotak(u, b); if (d < bd) { bd = d; best = b } } }
      if (best) u.tgt = best;
    }
  } else if (u.cari <= 0 || !u.tgt || !u.tgt.hidup) { u.cari = .3; let best = null, bd = 1e9; for (const o of lawan) { const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < bd) { bd = d; best = o } } u.tgt = best }
  const t = u.tgt; if (!t) { u.pose = 'diri'; return }
  const bang = t.kind != null, d = bang ? jarakKotak(u, t) : Math.hypot(t.x - u.x, t.y - u.y), jangkau = bang ? .38 : .55;
  if (d > jangkau) { const [tx, ty] = bang ? titikKotak(u, t) : [t.x, t.y]; langkah(u, tx, ty, dt); return }
  if (bang) { const [tx, ty] = titikKotak(u, t); hadap(u, tx, ty) } else hadap(u, t.x, t.y);
  u.pose = 'tanding'; u.ph += dt * 7; u.cd -= dt;
  if (u.cd <= 0) {
    u.cd = 1; t.hp -= u.dps; t.kena = .15;
    const [x, y] = bang ? P(...titikKotak(u, t), 14) : P(t.x, t.y, 12); sgBurst(x, y, 3, ['#fff4c4', '#ffffff'], 40, 30, .3, 1.6); if (window.sfx) sfx(bang ? 'pukul' : 'tebas');
    if (t.hp <= 0) bang ? hancurkan(t) : gugur(t);
  }
}
function gugur(u) { u.hidup = false; const [x, y] = P(u.x, u.y, 8); sgBurst(x, y, 10, u.sisi ? ['#e7a0a8', '#fff'] : ['#cfe6ff', '#fff'], 60, 50, .7, 2.6); SG.fx.push({ x: u.x, y: u.y, t: 0, jenis: 'roh' }) }
function hancurkan(b) {
  if (!b.hidup) return; b.hidup = false; b.hp = 0; SG.hancur++;
  const [x, y] = P(b.gi + b.n / 2, b.gj + b.n / 2, 10); sgBurst(x, y, 30, ['#efe3c8', '#d9c4a0', '#9a948c'], 130, 70, 1.1, 4.5);
  for (let k = 0; k < 6; k++) SG.Y.push({ asap: 1, x: x + (rnd0() - .5) * 50, y: y - rnd0() * 30, l: 1.6 + rnd0(), m: 2.4 });
  SG.tx.push({ x, y: y - 50, t: b.kind === 'masjid' ? 'Masjid runtuh!' : `${Math.floor(SG.hancur / SG.total * 100)}%`, l: 1.4 });
  if (window.sfx) sfx('runtuh'); perbaruiSG();
}

/* ---------- pertahanan ---------- */
function pertahanan(dt) {
  const att = SG.U.filter(u => u.hidup && u.sisi === 0); if (!att.length) return;
  for (const b of SG.B) {
    if (!b.hidup) continue; let jng, dmg, cd, jenis, z;
    if (b.kind === 'menara') { [dmg, cd, jng] = SGK.menara; dmg *= b.lv; jenis = 'panah'; z = [0, 56, 74, 92][b.lv] + 22 }
    else if (b.kind === 'benteng') { [dmg, cd, jng] = SGK.benteng; dmg *= b.lv; jenis = 'batu'; z = 44 }
    else if (b.kind === 'masjid' && b.lv >= 3) { [dmg, cd, jng] = SGK.masjid; dmg *= b.lv - 1; jenis = 'nur'; z = 118 }
    else continue;
    b.cd -= dt; if (b.cd > 0) continue;
    const cx = b.gi + b.n / 2, cy = b.gj + b.n / 2; let best = null, bd = jng;
    for (const u of att) { const d = Math.hypot(u.x - cx, u.y - cy); if (d < bd) { bd = d; best = u } }
    if (!best) continue; b.cd = cd;
    SG.Y.push({ jenis, x0: cx, y0: cy, z0: z, tgt: best, lx: best.x, ly: best.y, u: 0, dur: jenis === 'batu' ? .85 : jenis === 'nur' ? .6 : .38, dmg });
    if (window.sfx) sfx(jenis);
  }
  if (!SG.jagaKeluar && SG.penjaga > 0) {
    const m = SG.B.find(b => b.kind === 'masjid'), cx = m.gi + 2, cy = m.gj + 2;
    if (att.some(u => Math.hypot(u.x - cx, u.y - cy) < 6.5)) {
      SG.jagaKeluar = true; const [x, y] = P(cx, cy, 160); SG.tx.push({ x, y, t: 'Penjaga keluar!', l: 1.6 });
      for (let k = 0; k < SG.penjaga; k++) setTimeout(() => { if (!SG.on || SG.selesai) return; const a = k / SG.penjaga * Math.PI * 2, u = unitBaru(1, cx + Math.cos(a) * 2.4, cy + Math.sin(a) * 2.4); SG.U.push(u); const [px, py] = P(u.x, u.y, 4); sgBurst(px, py, 8, ['#f4c6cc', '#fff'], 50, 30, .5, 2.5) }, k * 180);
    }
  }
}
function updateProyektil(dt) {
  for (const p of SG.Y) {
    if (p.asap) { p.l -= dt; continue }
    if (p.tgt && p.tgt.hidup && p.jenis !== 'batu') { p.lx = p.tgt.x; p.ly = p.tgt.y }
    p.u += dt / p.dur;
    if (p.u >= 1) {
      p.l = 0;
      if (p.jenis === 'batu') { for (const u of SG.U) if (u.hidup && u.sisi === 0 && Math.hypot(u.x - p.lx, u.y - p.ly) < SGK.benteng[3]) { u.hp -= p.dmg; u.kena = .15; if (u.hp <= 0) gugur(u) } const [x, y] = P(p.lx, p.ly, 2); sgBurst(x, y, 12, ['#b8a88a', '#8a7a64', '#e8dcc4'], 80, 40, .6, 3) }
      else if (p.tgt && p.tgt.hidup) { p.tgt.hp -= p.dmg; p.tgt.kena = .15; if (p.tgt.hp <= 0) gugur(p.tgt); const [x, y] = P(p.lx, p.ly, 10); sgBurst(x, y, p.jenis === 'nur' ? 10 : 4, p.jenis === 'nur' ? ['#fff4b0', '#ffe07a', '#ffffff'] : ['#e8d39a'], 50, 30, .4, 2.2) }
    } else p.l = 1;
  }
  SG.Y = SG.Y.filter(p => p.l > 0);
}
function sgBurst(x, y, n, cols, sp = 70, up = 60, life = .9, size = 3) { for (let k = 0; k < n; k++) SG.fx.push({ x, y, vx: (rnd0() - .5) * sp * 2, vy: -rnd0() * up - 10, l: life, m: life, c: pick(cols), s: size * (.6 + rnd0() * .6), p: 1 }) }

/* ---------- hasil ---------- */
const persenSG = () => SG.total ? Math.floor(SG.hancur / SG.total * 100) : 0;
function bintangSG() { const p = persenSG(), m = SG.B.find(b => b.kind === 'masjid'); return (p >= 50 ? 1 : 0) + (m && !m.hidup ? 1 : 0) + (p >= 100 ? 1 : 0) }
function perbaruiSG() {
  const b = bintangSG(); $('sgBin').innerHTML = [0, 1, 2].map(i => STAR(i < b)).join(''); $('sgPct').textContent = persenSG() + '%';
  $('sgSisa').textContent = SG.sisaTurun; const w = Math.max(0, Math.ceil(SG.waktu)); $('sgWaktu').textContent = `${Math.floor(w / 60)}:${String(w % 60).padStart(2, '0')}`;
  $('sgWaktu').classList.toggle('mepet', SG.mulai && w <= 15);
}
async function akhiriSerang(alasan) {
  if (!SG.on || SG.selesai) return; SG.selesai = true; SG.akhirT = 0;
  const bin = bintangSG(), pct = persenSG(), menang = bin >= 1, d = SG.d;
  const runtuh = SG.B.filter(b => !b.hidup && b.kind !== 'masjid').sort((a, b) => b.lv - a.lv).slice(0, 3).map(b => b.key);
  let emas = 0;
  if (menang) { emas = 30 * bin; S.gold += emas } else S.pas = Math.max(0, (S.pas || 0) - KALAH_PAS);
  delete S.serangJalan; save(); hud(); if (window.sfx) sfx(menang ? 'menang' : 'kalah');
  if (menang && d.n) d.n.lindung = true;
  const kirim = async () => {
    if (!SG.sid || SG.sid === 'demo') return;
    try { const r = await netRpc('game_serang_kirim', { p_tipe: NET.P.tipe, p_id: NET.P.id, p_sid: SG.sid, p_bintang: bin, p_persen: pct, p_runtuh: runtuh, p_data: { pasukan: SG.turun, alasan } }); if (r && r.sisa != null) SERANG.sisa = r.sisa }
    catch (e) { toast('Hasil serangan belum terkirim: ' + netErr(e)) }
  };
  kirim();
  const gugurA = SG.U.filter(u => u.sisi === 0 && !u.hidup).length, gugurB = SG.U.filter(u => u.sisi === 1 && !u.hidup).length;
  setTimeout(() => modal(`<header>${menang ? 'Kemenangan!' : 'Serangan gagal'}<small>${esc(TIERS[SG.t].nm + ' ' + (d.desa || ''))} · ${esc(d.nama || '')}</small></header>
    <div class="stars">${[0, 1, 2].map(i => STAR(i < bin)).join('')}</div><div class="big">${pct}%</div>
    <p>${SG.hancur} dari ${SG.total} bangunan hancur. ${SG.turun} pasukan diturunkan${gugurB ? `, ${gugurB} penjaga dikalahkan` : ''}.</p>
    <p>${menang ? `<b>+${emas} emas</b>${runtuh.length ? `. ${runtuh.length} bangunan lawan runtuh sementara.` : ''}` : `<b>Pasukan berkurang ${KALAH_PAS}</b> (sekarang ${S.pas}). Perkuat pasukan di barak lalu coba lagi.`}</p>
    <p class="note">Sisa jatah serangan hari ini: ${SERANG.sisa}/2</p>`, [{ t: 'Kembali ke desa', f: keluarSerang }]), 900);
}
function keluarSerang() { SG.on = false; SG.selesai = true; hubReturn(null); if (window.WARGA) WARGA.tanda = ''; if (window.muatTetangga) setTimeout(() => muatTetangga(true), 1500) }
function serangKeluar() { if (CUR !== 'serang') return; if (SG.mulai && !SG.selesai) akhiriSerang('sholat'); else if (!SG.mulai) keluarSerang() }

/* ---------- putaran ---------- */
function frameSerang(ms) {
  requestAnimationFrame(frameSerang);
  if (CUR !== 'serang' || !SG.on || !sctx) { frameSerang.t = null; return }
  const t = ms / 1000, dt = Math.min(.05, t - (frameSerang.t || t)); frameSerang.t = t;
  if (!SG.selesai) {
    if (SG.mulai) { SG.waktu -= dt; if (SG.waktu <= 0) { SG.waktu = 0; akhiriSerang('waktu') } }
    for (const u of SG.U) if (u.hidup) updateUnit(u, dt);
    pisahkan(); pertahanan(dt); updateProyektil(dt);
    const hidupA = SG.U.some(u => u.hidup && u.sisi === 0);
    if (SG.mulai && !SG.selesai && (persenSG() >= 100 || (SG.sisaTurun <= 0 && !hidupA))) { SG.akhirT += dt; if (SG.akhirT > .8) akhiriSerang(persenSG() >= 100 ? 'habis' : 'gugur') }
    if (tahan.on && !tahan.gerak && t - tahan.t0 > .28 && t - tahan.last > .11) { tahan.last = t; turunkan(tahan.x, tahan.y) }
    if (Math.floor(SG.waktu * 4) !== SG.wT) { SG.wT = Math.floor(SG.waktu * 4); perbaruiSG() }
  }
  for (const u of SG.U) { if (u.kena > 0) u.kena -= dt; if (!u.hidup) u.mati = (u.mati || 0) + dt }
  for (const b of SG.B) if (b.kena > 0) b.kena -= dt;
  SG.U = SG.U.filter(u => u.hidup || u.mati < .1);
  for (const q of SG.fx) { q.l = (q.l == null ? 1 : q.l) - dt; if (q.p) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 160 * dt } else q.t += dt }
  SG.fx = SG.fx.filter(q => q.p ? q.l > 0 : q.t < 1.2);
  for (const q of SG.tx) q.l -= dt; SG.tx = SG.tx.filter(q => q.l > 0);
  if (SG.merah > 0) SG.merah -= dt;
  gambarSerang(t);
}
function pisahkan() {
  const A = SG.U.filter(u => u.hidup);
  for (let a = 0; a < A.length; a++) for (let b = a + 1; b < A.length; b++) { const p = A[a], q = A[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d < .32 && d > 1e-4) { const m = (.32 - d) * .5; p.x -= dx / d * m; p.y -= dy / d * m; q.x += dx / d * m; q.y += dy / d * m } }
}
function gambarSerang(t) {
  const g = sctx, d = SG.dpr, z = SG.cam.z * d; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C(TIERS[SG.t].g[1], -.1); g.fillRect(0, 0, scv.width, scv.height);
  g.setTransform(z, 0, 0, z, scv.width / 2 - SG.cam.x * z, scv.height / 2 - SG.cam.y * z);
  const tn = SG.tanah; g.drawImage(tn.c, -tn.ox, -tn.oy, tn.c.width / tn.gs, tn.c.height / tn.gs);
  // zona merah
  const zm = SG.mulai ? Math.max(0, SG.merah) : .35 + .15 * Math.sin(t * 3) + Math.max(0, SG.merah);
  if (zm > 0) { g.globalAlpha = Math.min(.5, zm * .4); for (const [a, b, n] of SG.zona) poly(g, [P(a, b), P(a + n, b), P(a + n, b + n), P(a, b + n)], '#ff5a4a'); g.globalAlpha = 1 }
  const L = [];
  for (const b of SG.B) L.push([b.gi + b.gj + b.n, 0, b]);
  for (const u of SG.U) L.push([u.x + u.y, 1, u]);
  for (const p of SG.pohon) L.push([p.i + p.j, 2, p]);
  L.sort((a, b) => a[0] - b[0]);
  const ctxLama = window.ctx;
  for (const [, k, o] of L) {
    if (k === 0) {
      const [x, y] = P(o.gi, o.gj); let s;
      if (!o.hidup) s = spr('ruin', 180, 290, 90, 200, bRuin);
      else if (o.kind === 'masjid') { s = spr('masjid' + o.lv, 300, 320, 150, 176, gg => bMasjid(gg, o.lv)) }
      else s = spr(`${o.kind}|${o.lv}|${SG.t}|${o.db}`, 180, 290, 90, 200, gg => { DK = [0, .3, .55, .8][o.db]; const zb = bBase(gg, o.lv); FN[o.kind](gg, o.lv, SG.t, zb); hiasDepan(gg, o.lv, zb) });
      g.save(); if (o.kena > 0) g.translate(Math.sin(t * 80) * 2, 0);
      if (!o.hidup && o.kind === 'masjid') { const [cx, cy] = P(o.gi + 1, o.gj + 1); g.drawImage(s.c, cx - s.ax, cy - s.ay, s.w, s.h); const [ex, ey] = P(o.gi + 2, o.gj + 2); g.drawImage(s.c, ex - s.ax, ey - s.ay, s.w, s.h) }
      else g.drawImage(s.c, x - s.ax, y - s.ay, s.w, s.h);
      g.restore();
    } else if (k === 1) {
      const [x, y] = P(o.x, o.y); g.globalAlpha = o.hidup ? 1 : Math.max(0, 1 - o.mati * 10);
      orang(g, x, y, { ...o, sk: 1.55, jenis: 'prajurit', alat: 'pedang', perisai: true, baju: o.sisi ? '#b0505a' : '#4f78b4', bendera: o.sisi ? TIERS[SG.t].flag : TIERS[S.view].flag });
      if (o.kena > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.fillStyle = '#ff8070'; g.beginPath(); g.arc(x, y - 22, 13, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over' }
      g.globalAlpha = 1;
      if (o.hidup && o.hp < o.max) { g.fillStyle = 'rgba(40,20,20,.55)'; g.fillRect(x - 11, y - 52, 22, 4.4); g.fillStyle = o.sisi ? '#ff7a65' : '#7cd05a'; g.fillRect(x - 10.4, y - 51.4, 20.8 * Math.max(0, o.hp / o.max), 3.2) }
    } else { const [x, y] = P(o.i, o.j), s = spr('tree' + o.v, 110, 130, 55, 104, gg => bTree(gg, o.v)); g.drawImage(s.c, x - s.ax, y - s.ay, s.w, s.h) }
  }
  // proyektil
  for (const p of SG.Y) {
    if (p.asap) { const a = Math.max(0, p.l / p.m); g.globalAlpha = a * .45; g.fillStyle = '#9a948c'; g.beginPath(); g.arc(p.x, p.y - (1 - a) * 40, 10 + (1 - a) * 18, 0, 7); g.fill(); g.globalAlpha = 1; continue }
    const u = Math.min(1, p.u), tz = p.jenis === 'batu' ? 2 : 10, ix = p.x0 + (p.lx - p.x0) * u, iy = p.y0 + (p.ly - p.y0) * u, iz = p.z0 + (tz - p.z0) * u + (p.jenis === 'batu' ? Math.sin(u * Math.PI) * 60 : p.jenis === 'panah' ? Math.sin(u * Math.PI) * 14 : 0);
    const [x, y] = P(ix, iy, iz);
    if (p.jenis === 'panah') { const [x2, y2] = P(p.x0 + (p.lx - p.x0) * (u + .04), p.y0 + (p.ly - p.y0) * (u + .04), p.z0 + (tz - p.z0) * (u + .04) + Math.sin((u + .04) * Math.PI) * 14), a = Math.atan2(y2 - y, x2 - x); g.save(); g.translate(x, y); g.rotate(a); line(g, [[-7, 0], [5, 0]], '#6a4a2a', 1.4); poly(g, [[5, -1.7], [9, 0], [5, 1.7]], '#9aa4b4'); g.restore() }
    else if (p.jenis === 'batu') { g.fillStyle = 'rgba(40,40,30,.2)'; const [sx, sy] = P(ix, iy, 0); g.beginPath(); g.ellipse(sx, sy, 5, 2.2, 0, 0, 7); g.fill(); g.fillStyle = '#8a7a64'; g.beginPath(); g.arc(x, y, 4.6, 0, 7); g.fill(); g.fillStyle = '#b8a88a'; g.beginPath(); g.arc(x - 1.4, y - 1.4, 2, 0, 7); g.fill() }
    else { const gr = g.createRadialGradient(x, y, 1, x, y, 12); gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(.4, 'rgba(255,226,120,.8)'); gr.addColorStop(1, 'rgba(255,226,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill() }
  }
  for (const q of SG.fx) {
    if (q.p) { g.globalAlpha = Math.max(0, q.l / q.m); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.s, 0, 7); g.fill(); g.globalAlpha = 1 }
    else if (q.jenis === 'roh') { const [x, y] = P(q.x, q.y, 10 + q.t * 30); g.globalAlpha = Math.max(0, 1 - q.t / 1.2) * .6; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 3 + q.t * 3, 0, 7); g.fill(); g.globalAlpha = 1 }
  }
  // bar nyawa bangunan
  for (const b of SG.B) if (b.hidup && b.hp < b.max) { const [x, y] = P(b.gi + b.n / 2, b.gj + b.n / 2, b.kind === 'masjid' ? 175 : b.kind === 'menara' ? 130 : 90); g.fillStyle = 'rgba(255,250,242,.95)'; g.beginPath(); g.roundRect(x - 26, y - 6, 52, 12, 6); g.fill(); g.fillStyle = b.hp / b.max > .5 ? '#7cd05a' : b.hp / b.max > .25 ? '#f5c542' : '#ff7a65'; g.beginPath(); g.roundRect(x - 23.5, y - 3.5, Math.max(4, 47 * b.hp / b.max), 7, 3.5); g.fill() }
  for (const q of SG.tx) { const a = Math.min(1, q.l); g.font = `800 ${20 / SG.cam.z}px 'Baloo 2',sans-serif`; g.textAlign = 'center'; g.lineWidth = 4 / SG.cam.z; g.strokeStyle = `rgba(255,255,255,${a})`; g.globalAlpha = a; g.strokeText(q.t, q.x, q.y - (1.4 - q.l) * 30); g.fillStyle = '#a03c4c'; g.fillText(q.t, q.x, q.y - (1.4 - q.l) * 30); g.globalAlpha = 1 }
}

/* ---------- sentuhan: geser, cubit, ketuk/tahan untuk menurunkan ---------- */
const tahan = { on: false, gerak: false, x: 0, y: 0, t0: 0, last: 0 };
if (scv) {
  const pt = new Map(); let geser = null, cubit = null;
  scv.addEventListener('pointerdown', e => { scv.setPointerCapture(e.pointerId); pt.set(e.pointerId, [e.clientX, e.clientY]); if (pt.size === 1) { geser = { x: e.clientX, y: e.clientY, cx: SG.cam.x, cy: SG.cam.y }; Object.assign(tahan, { on: true, gerak: false, x: e.clientX, y: e.clientY, t0: performance.now() / 1000, last: performance.now() / 1000 }) } else if (pt.size === 2) { const [a, b] = [...pt.values()]; cubit = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: SG.cam.z }; tahan.gerak = true; geser = null } });
  scv.addEventListener('pointermove', e => { if (!pt.has(e.pointerId)) return; pt.set(e.pointerId, [e.clientX, e.clientY]); if (cubit && pt.size === 2) { const [a, b] = [...pt.values()]; SG.cam.z = clamp(cubit.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / cubit.d, .35, 1.5) } else if (geser) { const dx = e.clientX - geser.x, dy = e.clientY - geser.y; if (Math.abs(dx) + Math.abs(dy) > 9) tahan.gerak = true; if (tahan.gerak) { SG.cam.x = geser.cx - dx / SG.cam.z; SG.cam.y = geser.cy - dy / SG.cam.z } else { tahan.x = e.clientX; tahan.y = e.clientY } } });
  const lepas = e => { if (!pt.has(e.pointerId)) return; if (pt.size === 1 && !tahan.gerak && performance.now() / 1000 - tahan.t0 < .28) turunkan(e.clientX, e.clientY); pt.delete(e.pointerId); if (pt.size < 2) cubit = null; if (!pt.size) { geser = null; tahan.on = false } };
  scv.addEventListener('pointerup', lepas); scv.addEventListener('pointercancel', e => { pt.delete(e.pointerId); cubit = null; geser = null; tahan.on = false });
  scv.addEventListener('wheel', e => { e.preventDefault(); SG.cam.z = clamp(SG.cam.z * (e.deltaY < 0 ? 1.1 : .9), .35, 1.5) }, { passive: false });
}
if ($('sgBack')) $('sgBack').onclick = () => { if (!SG.mulai || SG.selesai) return keluarSerang(); modal('<header>Akhiri serangan?</header><p>Hasil dihitung dari bangunan yang sudah hancur.</p>', [{ t: 'Akhiri sekarang', c: 'b-maroon', f: () => akhiriSerang('mundur') }, { t: 'Lanjut menyerang', c: 'b-soft' }]) };
if ($('sgAkhir')) $('sgAkhir').onclick = () => $('sgBack').onclick();

/* ---------- serangan masuk ke desaku ---------- */
function terapkanMasuk(list) {
  if (!list || !list.length) return;
  let kalah = 0, bertahan = 0, runtuhN = 0;
  for (const a of list) {
    if (a.menang) {
      kalah++; S.pas = Math.max(0, (S.pas || 0) - KALAH_PAS);
      for (const key of (a.runtuh || []).slice(0, 3)) { const b = S.b[key]; if (b && b.lv) { b.rt = Date.now() + RUNTUH_MENIT * 60e3 * b.lv; b.oleh = a.nama || 'desa lain'; runtuhN++ } }
    } else { bertahan++; S.gold += 20 }
  }
  save(); if (typeof hud === 'function') hud(); if (window.WARGA) WARGA.tanda = '';
  const rows = list.map(a => `<div class="li"><div><b>${esc(a.nama || 'Desa lain')}${a.desa ? ' · ' + esc(a.desa) : ''}</b><small>${a.menang ? `Menang ${'★'.repeat(a.bintang)} · ${a.persen}% bangunan hancur` : `Gagal · ${a.persen}% bangunan hancur`}</small></div><span class="tag ${a.menang ? 'red' : 'ok'}">${a.menang ? `−${KALAH_PAS} pasukan` : '+20 emas'}</span></div>`).join('');
  if (window.sfx) sfx(kalah ? 'kalah' : 'menang');
  modal(`<header>${kalah ? 'Desamu diserang!' : 'Pertahanan berhasil!'}<small>${list.length} serangan sejak terakhir bermain</small></header><div class="list" style="text-align:left">${rows}</div>
    <p>${kalah ? `${runtuhN ? `${runtuhN} bangunan runtuh dan sedang dibangun ulang (30 menit per level). Percepat lewat murajaah di bangunannya. ` : ''}Desamu dilindungi 24 jam dari serangan berikutnya.` : 'Menara, benteng, dan penjagamu berhasil menahan serangan.'}</p>`, [{ t: 'Lihat desa' }]);
}
async function seranganMasuk() {
  if (S.serangJalan) { const j = S.serangJalan; delete S.serangJalan; S.pas = Math.max(0, (S.pas || 0) - KALAH_PAS); save(); if (typeof hud === 'function') hud(); setTimeout(() => toast(`Serangan ke ${j.desa || j.nama || 'desa lain'} terputus dan dihitung kalah. Pasukan berkurang ${KALAH_PAS}.`), 1500) }
  if (!sgOnline()) { SERANG.sisa = Math.max(0, 2 - demoJatah().n); return }
  try {
    const r = await netRpc('game_serangan_masuk', { p_tipe: NET.P.tipe, p_id: NET.P.id }); SERANG.ts = Date.now();
    if (!r) return; SERANG.sisa = r.sisa; SERANG.lindung = !!r.lindung;
    if (r.masuk && r.masuk.length) { const tunda = () => { if (CUR === 'hub' && !$('modal').classList.contains('on') && $('kunci').hidden) terapkanMasuk(r.masuk); else setTimeout(tunda, 1500) }; setTimeout(tunda, 2500) }
  } catch (e) { /* SQL tahap 4 belum dijalankan atau sedang luring */ }
}
function seranganUji() {
  const bs = Object.keys(S.b).filter(k => S.b[k] && S.b[k].lv && !S.b[k].rt), pilih = shuf(bs).slice(0, 2);
  terapkanMasuk([{ nama: 'Umar F.', desa: 'Al-Falah', menang: true, bintang: 2, persen: 62, runtuh: pilih }, { nama: 'Bilal H.', desa: 'Nurul Huda', menang: false, bintang: 0, persen: 18, runtuh: [] }]);
}
setInterval(() => { if (sgOnline() && CUR === 'hub' && !document.hidden && Date.now() - SERANG.ts > 5 * 60e3) seranganMasuk() }, 60e3);
