/* ===== pasukan.js — warga dan pasukan yang hidup di desa, lapangan latihan, barak, kekuatan pasukan ===== */
const LATIH_MAX = 10;
const WARGA = { jl: new Set(), jalan: [], pos: [], panah: [], tanda: '', t: 0 };

/* ---------- kekuatan pasukan ---------- */
function jenisPlot(j, q) { const t = tierOf(j), k = tierJuz(t).indexOf(j); return KINDS[(q + k) % 4] }
function runtuhSisa(j, q) { const b = bget(j, q); return b && b.rt ? Math.max(0, b.rt - Date.now()) : 0 }
function bonusBangunan() {
  let lv = 0;
  for (const key in S.b) {
    const b = S.b[key]; if (!b || !b.lv) continue;
    const [j, q] = key.split('-').map(Number), kd = jenisPlot(j, q);
    if ((kd === 'benteng' || kd === 'asrama') && str(j, q) > 0 && !runtuhSisa(j, q)) lv += b.lv;
  }
  return Math.min(1, lv * .02);
}
function kuatPer() { return 10 * (1 + .1 * (S.latih || 0)) * (1 + bonusBangunan()) }
function kuatTotal() { return Math.round((S.pas || 0) * kuatPer()) }
const angkaPendek = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'jt' : n >= 1e4 ? Math.round(n / 1e3) + 'rb' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'rb' : String(Math.round(n));
const biayaLatih = () => 100 * ((S.latih || 0) + 1);
function hudPasukan() { const k = $('kuatS'); if (k) k.textContent = '⚔ ' + angkaPendek(kuatTotal()) }

/* ---------- barak ---------- */
function bukaBarak() {
  sel = null; const L = S.latih || 0, c = biayaLatih(), bisa = L < LATIH_MAX && S.gold >= c && S.pas >= 10, SR_ = window.SERANG || {};
  const ml = mLv(), jaga = Math.min(8, Math.floor((S.pas || 0) / 8)), bb = Math.round(bonusBangunan() * 100);
  const alasan = L >= LATIH_MAX ? 'Latihan sudah di tingkat tertinggi.' : S.pas < 10 ? 'Butuh minimal 10 pasukan untuk berlatih.' : S.gold < c ? `Butuh ${c} emas. Kumpulkan dari murajaah.` : `Kekuatan tiap prajurit naik 10%.`;
  sheet(head('Barak pasukan', `${window.judulDesa ? judulDesa(S.view) : 'Desa'} · latihan Lv ${L}/${LATIH_MAX}`) + `<div class="sb">
    <div class="grid2"><div class="stat"><b>${S.pas || 0}</b>jumlah pasukan</div><div class="stat"><b>${angkaPendek(kuatTotal())}</b>kekuatan total</div>
    <div class="stat"><b>${kuatPer().toFixed(1).replace('.0', '')}</b>kekuatan per prajurit</div><div class="stat"><b>${SR_.sisa == null ? 2 : SR_.sisa}/2</b>serangan hari ini</div></div>
    <p class="p">Pasukan bertambah lewat <b>Garda Hafizh</b>: tiap Ghaflah yang dikalahkan menjadi 1 pasukan. Kekuatan naik dengan latihan dan dengan Asrama serta Benteng yang berdiri (+2% per level, sekarang +${bb}%).</p>
    <div class="row"><button class="btn b-gold" id="bLatih" ${bisa ? '' : 'disabled'}>${COIN}Latih ke Lv ${Math.min(LATIH_MAX, L + 1)} · ${c}</button><button class="btn b-maroon" id="bSerang">Serang desa lain</button></div>
    <p class="note">${alasan}</p>
    <div class="list" style="margin-top:12px"><div class="li"><div><b>Pertahanan desa</b><small>Saat diserang: Menara Jaga memanah, Benteng melontar batu, ${jaga ? `${jaga} penjaga keluar dari masjid` : 'penjaga keluar dari masjid (1 per 8 pasukan)'}. ${ml >= 3 ? `Masjid Lv ${ml} ikut menyerang dengan cahaya.` : `Masjid ikut menyerang mulai Lv 3 (sekarang Lv ${ml}).`}${SR_.lindung ? ' Desamu sedang dilindungi 24 jam setelah diserang.' : ''}</small></div></div></div>
    <p class="note">Kalah dalam serangan atau saat diserang mengurangi 25 pasukan.</p></div>`);
  const [x, y] = WARGA.lap ? P(...WARGA.lap.c, 20) : P(MM / 2, MM / 2); focusAt(x, y, .3);
  $('bLatih').onclick = () => { const c = biayaLatih(); if (S.gold < c || (S.latih || 0) >= LATIH_MAX) return; S.gold -= c; S.latih = (S.latih || 0) + 1; save(); hud('pasP'); if (window.sfx) sfx('naik'); toast(`Pasukan berlatih. Kekuatan per prajurit kini ${kuatPer().toFixed(1).replace('.0', '')}.`); WARGA.tanda = ''; bukaBarak() };
  $('bSerang').onclick = () => { if (window.bukaDaftarSerang) bukaDaftarSerang() };
}

/* ---------- jaringan jalan untuk pejalan kaki ---------- */
const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const kunciT = (i, j) => i + ',' + j;
function lanjutJalan(c, prev) {
  const [i, j] = c, opt = DIR4.map(([a, b]) => [i + a, j + b]).filter(n => WARGA.jl.has(kunciT(...n)));
  if (!opt.length) return prev;
  const d = [i - prev[0], j - prev[1]], lurus = opt.find(n => n[0] - i === d[0] && n[1] - j === d[1]), lain = opt.filter(n => n[0] !== prev[0] || n[1] !== prev[1]);
  if (lurus && rnd0() < .62) return lurus;
  return lain.length ? pick(lain) : prev;
}
function petakAcak() { const a = [...WARGA.jl]; return a.length ? a[Math.floor(rnd0() * a.length)].split(',').map(Number) : null }
function pejalan(tp, v) {
  const a = petakAcak(); if (!a) return null; const b = lanjutJalan(a, a);
  return { tp, v, a, b, u: rnd0(), x: a[0] + .5, y: a[1] + .5, ph: rnd0() * 6, arah: 1, bk: 0, tunggu: 0, jalur: (rnd0() - .5) * .34, s: 0, hist: [] };
}
function gerakPejalan(o, dt) {
  if (o.tunggu > 0) { o.tunggu -= dt; o.pose = 'diri'; return }
  o.u += o.v * dt;
  while (o.u >= 1) { o.u -= 1; const prev = o.a; o.a = o.b; o.b = lanjutJalan(o.a, prev); if (o.tp === 'warga' && rnd0() < .07) { o.tunggu = 1 + rnd0() * 2.5; o.u = 0; break } }
  const di = o.b[0] - o.a[0], dj = o.b[1] - o.a[1], nx = o.a[0] + .5 + di * o.u - dj * o.jalur, ny = o.a[1] + .5 + dj * o.u + di * o.jalur;
  const sx = ((nx - o.x) - (ny - o.y)) * 32, sy = ((nx - o.x) + (ny - o.y)) * 16, d = Math.hypot(nx - o.x, ny - o.y);
  if (Math.abs(sx) > .02) o.arah = sx > 0 ? 1 : -1; if (Math.abs(sy) > .02) o.bk = sy < 0 ? 1 : 0;
  o.s += d; o.x = nx; o.y = ny; o.ph += dt * o.v * 10; o.pose = 'jalan';
  if (o.hist) { o.hist.push([o.x, o.y, o.s]); while (o.hist.length > 2 && o.hist[0][2] < o.s - 4) o.hist.shift() }
}
function ikutPemimpin(f, dt) {
  const L = f.pem, h = L.hist, tgt = L.s - f.jarak; if (!h.length) return;
  let p = h[0]; for (let k = h.length - 1; k > 0; k--) if (h[k - 1][2] <= tgt) { const a = h[k - 1], b = h[k], u = (tgt - a[2]) / Math.max(1e-6, b[2] - a[2]); p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; break }
  const sx = ((p[0] - f.x) - (p[1] - f.y)) * 32, sy = ((p[0] - f.x) + (p[1] - f.y)) * 16, d = Math.hypot(p[0] - f.x, p[1] - f.y);
  if (Math.abs(sx) > .02) f.arah = sx > 0 ? 1 : -1; if (Math.abs(sy) > .02) f.bk = sy < 0 ? 1 : 0;
  f.x = p[0]; f.y = p[1]; f.ph += d * 10; f.pose = d > .0005 ? 'jalan' : 'diri';
}

/* ---------- menyusun warga sesuai keadaan desa ---------- */
const rp = (i, j) => rotTitik(i, j);
const arahKe = (o, tx, ty) => { const sx = ((tx - o.x) - (ty - o.y)) * 32, sy = ((tx - o.x) + (ty - o.y)) * 16; o.arah = sx >= 0 ? 1 : -1; o.bk = sy < 0 ? 1 : 0 };
function blokDeko(ty) { const d = DBLK.find(x => x[2] === ty); if (!d) return null; const i0 = BB + d[0] * BS, j0 = BB + d[1] * BS; return { i0, j0, c: rp(i0 + 2.5, j0 + 2.5) } }
function wargaAtur() { WARGA.tanda = ''; WARGA.jalan = []; WARGA.panah = []; wargaSusun(true) }
function wargaSusun(jalanBaru) {
  if (!terr.length) return;
  const a = window.alamKeadaan ? alamKeadaan() : { gelap: 0, hujan: 0 }, malam = a.gelap > .6, hujan = a.hujan > .25, pas = S.pas || 0;
  const runtuh = plots.filter(p => owned(p.j) && runtuhSisa(p.j, p.q)), menara = plots.filter(p => owned(p.j) && p.kind === 'menara' && bget(p.j, p.q) && bget(p.j, p.q).lv && str(p.j, p.q) > 0 && !runtuhSisa(p.j, p.q));
  const tanda = [ROT, S.view, Math.min(60, pas), malam, hujan, runtuh.map(p => p.j + '-' + p.q).join(), menara.length, terr.map(tstate).join()].join('|');
  if (tanda === WARGA.tanda && !jalanBaru) return; WARGA.tanda = tanda;
  // jalan yang boleh dilewati (bukan wilayah berawan)
  const blok = terr.filter(t => tstate(t) === 'lock'); WARGA.jl = new Set();
  for (let i = 0; i < MM; i++) for (let j = 0; j < MM; j++) { const k = tileAt(i, j); if ((k === 'road' || k === 'path') && !blok.some(t => i >= t.i0 && i < t.i0 + 5 && j >= t.j0 && j < t.j0 + 5)) WARGA.jl.add(kunciT(i, j)) }
  // pejalan kaki: warga dan regu patroli
  const berdiri = plots.filter(p => owned(p.j) && bget(p.j, p.q) && bget(p.j, p.q).lv).length;
  const nW = malam ? 2 : Math.min(8, 3 + Math.floor(berdiri / 4)), nRegu = pas <= 0 ? 0 : pas >= 60 ? 2 : 1, ikut = Math.min(3, Math.floor(pas / 12));
  const lama = WARGA.jalan.filter(o => o.tp === 'warga').slice(0, nW);
  while (lama.length < nW) { const o = pejalan('warga', .55 + rnd0() * .3); if (!o) break; o.pr = rnd0() < .5; o.warna = o.pr ? pick(['#c45a68', '#44a39c', '#9a62b0', '#5d8bd0', '#d98a3a']) : pick(['#fdf8ec', '#eef2f8', '#e2efdc', '#f3e3c8']); o.peci = pick(['#2b2b33', '#2b2b33', '#f7f3ea']); lama.push(o) }
  const reguLama = WARGA.jalan.filter(o => o.tp !== 'warga');
  let regu = reguLama;
  if (jalanBaru || reguLama.filter(o => o.tp === 'pemimpin').length !== nRegu || reguLama.filter(o => o.tp === 'pengikut').length !== nRegu * ikut) {
    regu = [];
    for (let r = 0; r < nRegu; r++) { const L = pejalan('pemimpin', .95); if (!L) break; regu.push(L); for (let k = 1; k <= ikut; k++) regu.push({ tp: 'pengikut', pem: L, jarak: k * .62, x: L.x, y: L.y, ph: k, arah: 1, bk: 0 }) }
  }
  WARGA.jalan = lama.concat(regu);
  // yang menetap di satu tempat
  const pos = [];
  const lap = blokDeko('lapangan'); WARGA.lap = lap;
  if (lap) {
    const L = (u, v) => rp(lap.i0 + u, lap.j0 + v);
    const [ti, tj] = rotKotak(lap.i0 + .3, lap.j0 + .3, 1.6); pos.push({ tp: 'tenda', x: ti, y: tj });
    if (malam) {
      const [ax, ay] = L(2.9, 2.9); pos.push({ tp: 'api', x: ax, y: ay });
      const n = pas ? Math.min(4, 1 + Math.floor(pas / 10)) : 1;
      for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2 + .6, o = { tp: 'prajurit', pose: 'duduk', x: ax + Math.cos(t) * .85, y: ay + Math.sin(t) * .85, ph: k }; arahKe(o, ax, ay); pos.push(o) }
    } else {
      pos.push({ tp: 'pelatih', ...xy(L(2.05, 1.35)), pose: 'diri', ph: 0 });
      const sas = [[4.35, 2.55], [4.35, 3.75]], pem = [[.7, 2.55], [.7, 3.75]];
      for (let k = 0; k < 2; k++) pos.push({ tp: 'sasaran', ...xy(L(...sas[k])) });
      const nP = hujan ? 0 : pas >= 20 ? 2 : pas >= 1 ? 1 : 0;
      for (let k = 0; k < nP; k++) { const o = { tp: 'pemanah', ...xy(L(...pem[k])), pose: 'tarik', ph: k * 1.3, t: k * 1.1 }; const [tx, ty] = L(...sas[k]); o.tx = tx; o.ty = ty; arahKe(o, tx, ty); pos.push(o) }
      const pasang = pas >= 30 ? 2 : pas >= 8 ? 1 : 0, tb = [[[2.25, 4.3], [3.05, 4.3]], [[2.6, 2.1], [3.4, 2.1]]];
      for (let k = 0; k < pasang; k++) { const [p1, p2] = tb[k], a1 = { tp: 'prajurit', ...xy(L(...p1)), pose: 'tanding', ph: k * 2 }, a2 = { tp: 'prajurit', ...xy(L(...p2)), pose: 'tanding', ph: k * 2 + Math.PI }; arahKe(a1, a2.x, a2.y); arahKe(a2, a1.x, a1.y); pos.push(a1, a2) }
    }
  }
  // penjaga menara
  if (pas > 0) menara.slice(0, Math.ceil(pas / 10)).forEach((p, k) => { const o = { tp: 'penjaga', x: p.gi + 2.32, y: p.gj + 1.05, pose: 'diri', ph: k, obor: malam }; o.arah = 1; o.bk = 0; pos.push(o) });
  // tukang memperbaiki bangunan runtuh
  runtuh.forEach((p, k) => { const t1 = { tp: 'tukang', x: p.gi + 2.28, y: p.gj + .85, pose: 'ayun', ph: k }, t2 = { tp: 'tukang', x: p.gi + 1.15, y: p.gj + 2.28, pose: 'ayun', ph: k + 1.7 }; arahKe(t1, p.gi + 1, p.gj + 1); arahKe(t2, p.gi + 1, p.gj + 1); pos.push(t1, t2) });
  // petani di kebun dan warga di kolam (siang, tidak hujan)
  if (!malam && !hujan) {
    const kb = blokDeko('kebun');
    if (kb) [[1.27, 1.2, 0], [3.67, 3.4, 2]].forEach(([u, v, f]) => { const [x, y] = rp(kb.i0 + u, kb.j0 + v); pos.push({ tp: 'petani', x, y, u, v, v0: v, kb, pose: 'ayun', ph: f, arahJ: 1 }) });
    const kl = blokDeko('kolam');
    if (kl) {
      const [ci, cj] = [kl.i0 + 2.5, kl.j0 + 2.5];
      [[.32, 'cuci'], [-.42, 'pancing']].forEach(([t, ak], k) => { const [x, y] = rp(ci + Math.cos(t * Math.PI) * 2.55, cj + Math.sin(t * Math.PI) * 2.55), o = { tp: ak, x, y, pose: ak === 'cuci' ? 'jongkok' : 'duduk', ph: k }; arahKe(o, ...kl.c); o.air = kl.c; o.pr = ak === 'cuci'; o.warna = o.pr ? '#44a39c' : '#eef2f8'; o.peci = '#2b2b33'; pos.push(o) });
    }
  }
  WARGA.pos = pos;
}
const xy = ([x, y]) => ({ x, y });

/* ---------- daftar gambar (dipanggil dari frameHub) ---------- */
function wargaKeDaftar(L, dt) {
  WARGA.t += dt; if (WARGA.t > 2) { WARGA.t = 0; wargaSusun(false) }
  for (const o of WARGA.jalan) { if (o.tp === 'pengikut') continue; gerakPejalan(o, dt) }
  for (const o of WARGA.jalan) if (o.tp === 'pengikut') ikutPemimpin(o, dt);
  for (const o of WARGA.pos) {
    o.ph = (o.ph || 0) + dt * (o.pose === 'ayun' ? 5.5 : o.pose === 'tanding' ? 6 : 2);
    if (o.tp === 'petani') { o.v += dt * .12 * o.arahJ; if (o.v > 4.3 || o.v < 1) o.arahJ *= -1; const [x, y] = rp(o.kb.i0 + o.u, o.kb.j0 + o.v), [x2, y2] = rp(o.kb.i0 + o.u, o.kb.j0 + o.v + o.arahJ * .2); o.x = x; o.y = y; arahKe(o, x2, y2) }
    if (o.tp === 'pemanah') { o.t += dt; if (o.t > 2.4) { o.t = 0; const [hx, hy] = P(o.x, o.y, 15), [tx, ty] = P(o.tx, o.ty, 14); WARGA.panah.push({ x0: hx + o.arah * 6, y0: hy, x1: tx, y1: ty, u: 0 }) } }
    if (o.tp === 'prajurit' && o.pose === 'tanding' && Math.sin(o.ph) > .985 && rnd0() < .5) { const [x, y] = P(o.x, o.y, 15); parts.push({ x: x + o.arah * 9, y, vx: (rnd0() - .5) * 40, vy: -20 - rnd0() * 20, l: .3, m: .3, c: '#fff4c4', s: 1.6, g: 60 }) }
    if (o.tp === 'tukang' && Math.sin(o.ph) > .97 && rnd0() < .35) { const [x, y] = P(o.x, o.y, 4); parts.push({ x: x + o.arah * 8, y, vx: (rnd0() - .5) * 20, vy: -12, l: .7, m: .7, c: '#d8c8a8', s: 3, g: -4, sm: 1 }); if (window.sfxDesa) sfxDesa('palu', o) }
    if (o.tp === 'cuci' && rnd0() < dt * 1.4) { const [x, y] = P(o.x, o.y, 2); parts.push({ x: x + o.arah * 9, y, vx: (rnd0() - .5) * 18, vy: -18, l: .45, m: .45, c: '#d8f2fb', s: 1.6, g: 60 }) }
  }
  for (const a of WARGA.panah) a.u += dt / .38; WARGA.panah = WARGA.panah.filter(a => { if (a.u >= 1) { parts.push({ x: a.x1, y: a.y1, vx: 0, vy: -8, l: .5, m: .5, c: '#e8d39a', s: 2.4, g: 0 }); return false } return true });
  for (const o of WARGA.jalan) L.push([o.x + o.y, 6, o]);
  for (const o of WARGA.pos) L.push([o.tp === 'tenda' ? o.x + o.y + 1.6 : o.x + o.y, 6, o]);
}
function wargaDiAtas() {
  for (const a of WARGA.panah) {
    const u = a.u, x = a.x0 + (a.x1 - a.x0) * u, y = a.y0 + (a.y1 - a.y0) * u - Math.sin(u * Math.PI) * 10, ang = Math.atan2(a.y1 - a.y0 - Math.cos(u * Math.PI) * 10 * Math.PI, a.x1 - a.x0);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); line(ctx, [[-7, 0], [5, 0]], '#7a5a3a', 1.3); poly(ctx, [[5, -1.6], [8.5, 0], [5, 1.6]], '#9aa4b4'); poly(ctx, [[-7, 0], [-9.5, -2], [-8, 0], [-9.5, 2]], '#f4f0e6'); ctx.restore();
  }
}
function wargaLampu(lampu) {
  for (const o of WARGA.pos) { if (o.tp === 'api') { const [x, y] = P(o.x, o.y, 8); lampu.push([x, y, 70 + Math.sin(T * 9) * 4, .9]) } if (o.obor) { const [x, y] = P(o.x, o.y, 30); lampu.push([x + 5, y, 34, .7]) } }
  for (const o of WARGA.jalan) if (o.tp === 'pemimpin' && window.alamKeadaan && alamKeadaan().gelap > .6) { const [x, y] = P(o.x, o.y, 16); lampu.push([x, y, 34, .7]) }
}
function gambarWarga(o) {
  const [x, y] = P(o.x, o.y), a = window.alamKeadaan ? alamKeadaan() : { hujan: 0, gelap: 0 }, hujan = a.hujan > .25, malam = a.gelap > .6;
  switch (o.tp) {
    case 'tenda': blit(spr('tenda' + TIERS[S.view].flag, 132, 100, 66, 34, g => bTenda(g, TIERS[S.view].flag)), x, y); return;
    case 'sasaran': blit(spr('sasaran', 40, 50, 20, 44, bSasaran), x, y); return;
    case 'api': apiUnggun(ctx, x, y); return;
    case 'warga': return orang(ctx, x, y, { ...o, jenis: o.pr ? 'pr' : 'lk', payung: hujan });
    case 'pemimpin': return orang(ctx, x, y, { ...o, jenis: 'prajurit', alat: 'tombak', panji: 1, lentera: malam });
    case 'pengikut': return orang(ctx, x, y, { ...o, jenis: 'prajurit', alat: 'tombak' });
    case 'penjaga': return orang(ctx, x, y, { ...o, jenis: 'prajurit', alat: 'tombak', arah: Math.sin(T * .23 + o.ph * 2) > 0 ? 1 : -1 });
    case 'pelatih': return orang(ctx, x, y, { ...o, jenis: 'prajurit', alat: 'pedang', arah: Math.sin(T * .5) > 0 ? 1 : -1, pose: 'diri' });
    case 'pemanah': return orang(ctx, x, y, { ...o, jenis: 'pemanah', alat: 'busur', tarik: Math.min(1, o.t / 1.8) });
    case 'prajurit': return orang(ctx, x, y, { ...o, jenis: 'prajurit', alat: o.pose === 'duduk' ? null : 'pedang', perisai: o.pose === 'tanding' });
    case 'tukang': return orang(ctx, x, y, { ...o, jenis: 'tukang', alat: 'palu' });
    case 'petani': return orang(ctx, x, y, { ...o, jenis: 'petani', alat: 'cangkul' });
    case 'cuci': return orang(ctx, x, y, { ...o, jenis: 'pr' });
    case 'pancing': return orang(ctx, x, y, { ...o, jenis: 'lk', alat: 'pancing' });
  }
}

/* ---------- menggambar orang (dunia: kaki di 0,0) ---------- */
const KULIT = ['#f2cba4', '#e8b88e', '#d9a479'];
function orang(g, x, y, o) {
  const f = o.arah < 0 ? -1 : 1, ph = o.ph || 0, bk = !!o.bk, pose = o.pose || 'diri', jl = pose === 'jalan', jen = o.jenis;
  const pra = jen === 'prajurit' || jen === 'pemanah', kulit = KULIT[(Math.abs(Math.round((o.x || 0) * 7 + (o.y || 0) * 3))) % 3];
  const bend = o.bendera || TIERS[S.view].flag, baju = o.baju || (jen === 'prajurit' ? '#4f78b4' : jen === 'pemanah' ? '#4f8f52' : jen === 'tukang' ? '#c99a5e' : jen === 'petani' ? '#e9dcc0' : o.warna || '#fdf8ec');
  g.save(); g.translate(x, y);
  const sk = o.sk || 1; g.fillStyle = 'rgba(40,60,30,.24)'; g.beginPath(); g.ellipse(0, 0, 6.4 * sk, 2.6 * sk, 0, 0, 7); g.fill();
  g.scale(f * 1.05 * sk, 1.05 * sk);
  const turun = pose === 'duduk' ? 7 : pose === 'jongkok' ? 7.5 : 0, bob = jl ? -Math.abs(Math.sin(ph)) * 1.3 : 0;
  g.translate(0, turun + bob);
  const gelap = c => C(c, -.22), hem = pose === 'duduk' || pose === 'jongkok' ? -3 : pra || jen === 'tukang' || jen === 'petani' ? -6.5 : -3;
  // kaki
  const kaki = (dx, dy, x2, y2, c) => line(g, [[dx, dy], [x2, y2]], c, 2.6);
  if (pose === 'duduk') { kaki(0, -4, 6, -3.2, '#5a4a3e'); kaki(-1, -4, 5, -2.2, '#4a3e34') }
  else if (pose === 'jongkok') { kaki(-1, -5, 2.5, -1, '#4a3e34'); kaki(1, -5, 3.5, -.5, '#5a4a3e') }
  else { const s = jl ? Math.sin(ph) * 3.2 : pose === 'tanding' ? Math.sin(ph) * 1.2 : 0, kc = pra ? '#3e4658' : '#5a4a3e'; kaki(-1.3, -8, -1.3 - s, 0, C(kc, -.15)); kaki(1.3, -8, 1.3 + s, 0, kc); g.fillStyle = '#3a2e26'; g.beginPath(); g.ellipse(-1.3 - s + .8, -.2, 1.8, 1, 0, 0, 7); g.ellipse(1.3 + s + .8, -.2, 1.8, 1, 0, 0, 7); g.fill() }
  // tangan belakang
  const sw = jl ? Math.sin(ph) * 3 : 0;
  let hb = [-1.5 - sw, -9], hd = [1.8 + sw, -9];
  if (pose === 'tarik') { hd = [7, -15]; hb = [6.6 - 5.4 * (o.tarik || 0), -15] }
  else if (pose === 'tanding') { const k = Math.max(0, Math.sin(ph)); hd = [4 + k * 4.5, -13 + k * 1]; hb = [-3, -11] }
  else if (pose === 'ayun') { const k = (Math.sin(ph) + 1) / 2; hd = [4 + k * 1.5, -9 - k * 9]; hb = [3 + k, -9 - k * 7] }
  else if (o.tp === 'cuci') { hd = [5 + Math.sin(ph * 3) * 1.6, -7.5]; hb = [4 - Math.sin(ph * 3) * 1.6, -7] }
  else if (o.alat === 'pancing') { hd = [5, -11]; hb = [3.5, -10.5] }
  else if (o.alat === 'tombak') hd = [3.6, -11.5];
  else if (o.payung) hd = [3.2, -13];
  line(g, [[-.8, -15.5], hb], gelap(baju), 2.6);
  g.fillStyle = kulit; g.beginPath(); g.arc(hb[0], hb[1], 1.35, 0, 7); g.fill();
  if (o.alat === 'busur') { const bx = hd[0] + .6, by = hd[1]; g.strokeStyle = '#8a5a2a'; g.lineWidth = 1.6; g.beginPath(); g.arc(bx - 3, by, 8, -1.05, 1.05); g.stroke(); line(g, [[bx - 3 + 8 * Math.cos(-1.05), by + 8 * Math.sin(-1.05)], [hb[0], hb[1]], [bx - 3 + 8 * Math.cos(1.05), by + 8 * Math.sin(1.05)]], 'rgba(255,255,255,.85)', .7); if ((o.tarik || 0) > .2) line(g, [[hb[0], hb[1]], [bx + 2, by]], '#7a5a3a', 1.1) }
  // badan
  g.fillStyle = baju; g.beginPath(); g.moveTo(-4, -17); g.quadraticCurveTo(0, -18.4, 4, -17); g.lineTo(5.2, hem); g.quadraticCurveTo(0, hem + 1.6, -5.2, hem); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.09)'; g.beginPath(); g.moveTo(-4, -17); g.lineTo(-1, -17.6); g.lineTo(-1.5, hem + 1); g.lineTo(-5.2, hem); g.closePath(); g.fill();
  if (jen === 'prajurit') { g.fillStyle = '#d7dde8'; g.beginPath(); g.roundRect(-3.4, -16.4, 6.8, 7, 2); g.fill(); line(g, [[-4.6, -9], [4.6, -9]], C(bend), 1.8) }
  else if (jen === 'pemanah') { line(g, [[-3.5, -16.5], [3.8, -9.5]], '#8a5a2a', 1.4); line(g, [[-4.6, -9], [4.6, -9]], '#e2b84a', 1.4); if (bk) { g.fillStyle = '#8a5a2a'; g.fillRect(-4.5, -19, 3, 8) } }
  else if (jen === 'pr') { g.fillStyle = C(baju, .25); g.beginPath(); g.moveTo(-4.6, -17); g.quadraticCurveTo(0, -12, 4.6, -17); g.lineTo(4, -18.5); g.lineTo(-4, -18.5); g.closePath(); g.fill() }
  else if (jen === 'tukang') line(g, [[-4.8, -10], [4.8, -10]], '#7a4e2a', 1.6);
  // kepala
  const hy = -21.4;
  g.fillStyle = kulit; g.beginPath(); g.arc(0, hy, 4.5, 0, 7); g.fill();
  if (jen === 'pr') {
    g.fillStyle = C(baju, .1); g.beginPath(); g.arc(0, hy - .2, 5.4, Math.PI * .92, Math.PI * 2.08); g.lineTo(5.6, hy + 4.6); g.quadraticCurveTo(0, hy + 7.4, -5.6, hy + 4.6); g.closePath(); g.fill();
    if (!bk) { g.fillStyle = kulit; g.beginPath(); g.ellipse(1.3, hy + .6, 3.2, 3.5, 0, 0, 7); g.fill() }
  } else if (!bk) { g.fillStyle = '#3a2a22'; g.beginPath(); g.arc(-1.8, hy - 1.2, 3.4, Math.PI * .9, Math.PI * 1.6); g.fill() }
  if (!bk) { g.fillStyle = '#2a2026'; g.beginPath(); g.arc(1.1, hy + .2, .7, 0, 7); g.arc(3.1, hy + .2, .7, 0, 7); g.fill(); g.fillStyle = 'rgba(240,120,120,.3)'; g.beginPath(); g.arc(2.9, hy + 1.9, 1.1, 0, 7); g.fill() }
  else if (jen !== 'pr') { g.fillStyle = '#3a2a22'; g.beginPath(); g.arc(0, hy - .4, 4.3, Math.PI * .75, Math.PI * 2.25); g.fill() }
  // tutup kepala
  if (jen === 'prajurit') { const hg = g.createLinearGradient(-5, 0, 5, 0); hg.addColorStop(0, '#aeb8c8'); hg.addColorStop(.4, '#eef2f8'); hg.addColorStop(1, '#9aa6b8'); g.fillStyle = hg; g.beginPath(); g.arc(0, hy - .4, 5, Math.PI, 0); g.lineTo(5.2, hy + .4); g.lineTo(-5.2, hy + .4); g.closePath(); g.fill(); line(g, [[0, hy - 5.2], [0, hy - 8.2]], '#9aa6b8', 1.3); g.fillStyle = C(bend); g.beginPath(); g.ellipse(-.8, hy - 8.4, 2.4, 1.3, -.4, 0, 7); g.fill() }
  else if (jen === 'pemanah') { g.fillStyle = '#f4ead6'; g.beginPath(); g.ellipse(0, hy - 2.6, 5.3, 3.2, 0, Math.PI, 0); g.fill(); g.fillStyle = '#e6d8bc'; g.fillRect(-5.2, hy - 2.8, 10.4, 2) }
  else if (jen === 'petani' || jen === 'tukang') { g.fillStyle = jen === 'petani' ? '#e2c27a' : '#f0d9a0'; g.beginPath(); g.moveTo(-8, hy - 1.6); g.lineTo(0, hy - 7.6); g.lineTo(8, hy - 1.6); g.quadraticCurveTo(0, hy - .2, -8, hy - 1.6); g.fill(); line(g, [[-8, hy - 1.6], [8, hy - 1.6]], 'rgba(120,80,30,.35)', .8) }
  else if (jen === 'lk') { g.fillStyle = o.peci || '#2b2b33'; g.beginPath(); g.roundRect(-4.3, hy - 6.4, 8.6, 3.6, 1.2); g.fill() }
  // badan depan: lengan depan dan alat
  if (o.alat === 'tombak') { const [tx, ty] = hd; line(g, [[tx, ty + 9], [tx, ty - 21]], '#8a6a4a', 1.5); poly(g, [[tx - 1.8, ty - 21], [tx, ty - 26.5], [tx + 1.8, ty - 21]], '#c9d1dc'); if (o.panji) { poly(g, [[tx, ty - 20], [tx - 8.5, ty - 18], [tx, ty - 15]], C(bend)) } }
  if (o.alat === 'pedang') { const [tx, ty] = hd, a = pose === 'tanding' ? -.35 + Math.max(0, Math.sin(ph)) * .9 : -1.3; line(g, [[tx, ty], [tx + Math.cos(a) * 10, ty + Math.sin(a) * 10]], '#dfe5ee', 1.6); line(g, [[tx - Math.sin(a) * 2, ty + Math.cos(a) * 2], [tx + Math.sin(a) * 2, ty - Math.cos(a) * 2]], '#c9a040', 1.4) }
  if (o.alat === 'palu') { const k = (Math.sin(ph) + 1) / 2, a = -.6 - k * 1.5, [tx, ty] = hd, ex = tx + Math.cos(a) * 7, ey = ty + Math.sin(a) * 7; line(g, [[tx, ty], [ex, ey]], '#8a6a4a', 1.5); g.save(); g.translate(ex, ey); g.rotate(a); g.fillStyle = '#7a8090'; g.fillRect(-1.4, -2.6, 3, 5.2); g.restore() }
  if (o.alat === 'cangkul') { const k = (Math.sin(ph) + 1) / 2, a = .9 - k * 2.2, [tx, ty] = hd, ex = tx + Math.cos(a) * 10, ey = ty + Math.sin(a) * 10; line(g, [[tx - Math.cos(a) * 2, ty - Math.sin(a) * 2], [ex, ey]], '#8a6a4a', 1.5); g.save(); g.translate(ex, ey); g.rotate(a + Math.PI / 2); g.fillStyle = '#8c94a4'; g.fillRect(-3, -.5, 6, 3); g.restore() }
  if (o.alat === 'pancing') { const tx = 17, ty = -25, bob = Math.sin(ph * 1.7) * .8; line(g, [hd, [tx, ty]], '#8a6a4a', 1.2); line(g, [[tx, ty], [tx + 3, -3 + bob]], 'rgba(255,255,255,.75)', .6); g.fillStyle = '#ff6a5a'; g.beginPath(); g.arc(tx + 3, -3 + bob, 1.2, 0, 7); g.fill() }
  if (o.perisai) { g.fillStyle = '#b8863a'; g.beginPath(); g.arc(-4.6, -11.5, 4.2, 0, 7); g.fill(); g.strokeStyle = '#ecc860'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#ecc860'; g.beginPath(); g.arc(-4.6, -11.5, 1.1, 0, 7); g.fill() }
  line(g, [[1.4, -15.5], hd], baju === '#fdf8ec' ? '#efe6d2' : C(baju, -.08), 2.6);
  g.fillStyle = kulit; g.beginPath(); g.arc(hd[0], hd[1], 1.35, 0, 7); g.fill();
  if (o.lentera || o.obor) { const [tx, ty] = o.obor ? [hd[0] + 1.5, hd[1] - 2] : [hd[0] + 3, hd[1] + 3]; if (o.obor) { line(g, [[hd[0], hd[1] + 3], [tx, ty - 4]], '#7a5a3a', 1.6); g.fillStyle = '#ffb030'; g.beginPath(); g.ellipse(tx, ty - 6 - Math.sin(T * 14) * .6, 2, 3.2, 0, 0, 7); g.fill(); g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(tx, ty - 5.4, 1, 0, 7); g.fill() } else { g.fillStyle = '#6e5444'; g.fillRect(tx - 2, ty - 3, 4, 5); g.fillStyle = '#ffe59a'; g.fillRect(tx - 1.2, ty - 2, 2.4, 3) } }
  if (o.payung) { const px = hd[0], py = hd[1]; line(g, [[px, py + 2], [px, py - 18]], '#6e5444', 1.2); g.fillStyle = o.pr ? C(baju, .1) : pick2(o, ['#e2604a', '#4a86d0', '#f0b83a']); g.beginPath(); g.moveTo(px - 11, py - 15); g.quadraticCurveTo(px, py - 27, px + 11, py - 15); g.quadraticCurveTo(px + 5.5, py - 17.5, px, py - 15); g.quadraticCurveTo(px - 5.5, py - 17.5, px - 11, py - 15); g.fill() }
  g.restore();
}
const pick2 = (o, a) => a[Math.abs(Math.round((o.jalur || 0) * 100)) % a.length];

/* ---------- benda di lapangan latihan ---------- */
function bTenda(g, flag) {
  const w = 1.6, d = 1.6, h = 7, rz = 38, [sx, sy] = P(w / 2 + .1, d / 2 + .15); shadowE(g, sx, sy, 62, 28, .26);
  poly(g, [P(0, 0, h), P(w, 0, h), P(w, d / 2, rz), P(0, d / 2, rz)], C('#f0dfb2'));
  poly(g, [P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, d / 2, rz), P(w, 0, h)], C('#d9bd84'));
  poly(g, [P(w, d * .36, 0), P(w, d * .64, 0), P(w, d / 2, h + 14)], C('#7a5a3a'));
  poly(g, [P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], C('#ccb07a'));
  poly(g, [P(0, d, h), P(w, d, h), P(w, d / 2, rz), P(0, d / 2, rz)], C('#e6cf98'));
  for (let k = 1; k < 4; k++) line(g, [P(w * k / 4, d, h), P(w * k / 4, d / 2, rz)], 'rgba(150,110,50,.25)', 1);
  line(g, [P(0, d / 2, rz), P(w, d / 2, rz)], C('#b8955a'), 1.6);
  const [fx, fy] = P(w, d / 2, rz); line(g, [[fx, fy], [fx, fy - 20]], '#8a6a4a', 1.6); poly(g, [[fx, fy - 20], [fx + 13, fy - 16], [fx, fy - 12]], C(flag));
  for (const [i, j] of [[0, d], [w, d], [w, 0]]) { const [x, y] = P(i + (i ? .12 : -.12), j + (j ? .12 : -.12)); line(g, [P(i, j, h), [x, y]], 'rgba(120,90,50,.6)', .8) }
  const [rx, ry] = P(w + .35, d * .2); g.fillStyle = C('#a8784a'); g.fillRect(rx - 1, ry - 22, 2, 22); g.fillRect(rx - 7, ry - 18, 14, 1.6);
  for (let k = 0; k < 3; k++) { line(g, [[rx - 5 + k * 5, ry - 17], [rx - 5 + k * 5 + 1, ry - 2]], '#8a6a4a', 1.2); poly(g, [[rx - 6 + k * 5, ry - 17], [rx - 4 + k * 5, ry - 21], [rx - 2 + k * 5, ry - 17]], '#c9d1dc') }
}
function bSasaran(g) {
  shadowE(g, 0, 0, 8, 3, .22); line(g, [[0, 0], [0, -22]], '#8a6a4a', 2.2); line(g, [[-5, 0], [0, -8]], '#8a6a4a', 1.6);
  const r = [[9, '#f4ead6'], [7, '#d0505a'], [4.6, '#f4ead6'], [2.3, '#d0505a']];
  for (const [rr, c] of r) { g.fillStyle = c; g.beginPath(); g.ellipse(0, -28, rr * .8, rr, 0, 0, 7); g.fill() }
  g.strokeStyle = '#b8955a'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, -28, 7.2, 9, 0, 0, 7); g.stroke();
}
function apiUnggun(g, x, y) {
  g.save(); g.translate(x, y); g.fillStyle = 'rgba(40,30,20,.3)'; g.beginPath(); g.ellipse(0, 0, 13, 5.5, 0, 0, 7); g.fill();
  for (let k = 0; k < 7; k++) { const t = k / 7 * Math.PI * 2; g.fillStyle = '#8a8478'; g.beginPath(); g.ellipse(Math.cos(t) * 10, Math.sin(t) * 4, 3, 2, 0, 0, 7); g.fill() }
  line(g, [[-7, -1], [7, -4]], '#6e4a2a', 3); line(g, [[-6, -4], [7, 0]], '#7a5432', 3);
  const fl = (s, c, o) => { g.fillStyle = c; g.beginPath(); g.moveTo(-6 * s, -2); g.quadraticCurveTo(-7 * s, -10 * s, Math.sin(T * 7 + o) * 2, -20 * s - Math.sin(T * 11 + o) * 3); g.quadraticCurveTo(7 * s, -10 * s, 6 * s, -2); g.closePath(); g.fill() };
  fl(1, '#ff8a30', 0); fl(.7, '#ffc040', 1.3); fl(.4, '#fff2a0', 2.1);
  if (rnd0() < .25) parts.push({ x: x + (rnd0() - .5) * 8, y: y - 18, vx: (rnd0() - .5) * 10, vy: -30, l: .8, m: .8, c: '#ffc860', s: 1.3, g: 0 });
  g.restore();
}
/* perancah di atas puing bangunan yang runtuh */
function bPerancah(g) {
  bRuin(g); DK = 0;
  const kayu = '#b08350', pp = [[.25, .25], [1.75, .25], [.25, 1.75], [1.75, 1.75]];
  for (const [i, j] of pp) line(g, [P(i, j, 0), P(i, j, 46)], C(kayu), 2.2);
  for (const z of [16, 32, 46]) { line(g, [P(.25, 1.75, z), P(1.75, 1.75, z), P(1.75, .25, z)], C('#c89a62'), 2); }
  line(g, [P(.25, 1.75, 0), P(1.75, 1.75, 32)], C(kayu, -.1), 1.4); line(g, [P(1.75, 1.75, 0), P(1.75, .25, 32)], C(kayu, -.1), 1.4);
  poly(g, [P(.25, 1.45, 32), P(1.75, 1.45, 32), P(1.75, 1.75, 32), P(.25, 1.75, 32)], C('#d8b47e'));
  const [x, y] = P(1.1, 1.1, 50); line(g, [[x, y], [x, y - 14]], '#8a6a4a', 1.4); poly(g, [[x, y - 14], [x + 10, y - 11], [x, y - 8]], '#f0b83a');
}

/* ---------- penanda misi & barak di peta ---------- */
function misiPenanda() {
  WARGA.pil = [];
  const tanda = (wx, wy, judul, sub, bg, fg, dot, o, goyang) => { const [cx, cy] = w2s(wx, wy), y = cy + (goyang ? Math.sin(T * 3 + goyang) * 3 : 0); if (cx < -100 || cx > W + 100 || cy < -40 || cy > H + 40) return; pill(cx, y, judul, sub, bg, fg, dot); ctx.font = "800 13px 'Baloo 2',sans-serif"; WARGA.pil.push({ x: cx, y, w: Math.max(110, ctx.measureText(judul).width + 34), o }) };
  if (typeof misiHari === 'function') {
    const m = misiHari();
    if (!m.tilawah) tanda(...P(masjid.gi + 2, masjid.gj + 2, 178), 'Tilawah harian', 'ketuk di sini', '#fff1c4', '#8a5a10', '#e2a93a', 'masjid', 1);
    const kl = blokDeko('kolam');
    if (kl && m.swafoto < MISI_BATAS.swafoto) tanda(...P(...kl.c, 64), 'Bantu & swafoto', `${m.swafoto}/${MISI_BATAS.swafoto} hari ini`, '#e2f4f8', '#2a6a7a', '#44a39c', 'kolam', 2);
  }
  const lp = WARGA.lap; if (lp) tanda(...P(...lp.c, 74), 'Barak', `${S.pas || 0} pasukan · ⚔ ${angkaPendek(kuatTotal())}`, 'rgba(255,250,242,.94)', '#3a1f24', '#4f78b4', 'barak', 0);
}
function fmtSisa(ms) { const d = Math.max(0, Math.ceil(ms / 1000)), j = Math.floor(d / 3600), m = Math.floor(d % 3600 / 60), s = d % 60; return j ? `${j}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}` }
function hitungMundur(id, sampai, selesai) {
  clearInterval(hitungMundur.h);
  hitungMundur.h = setInterval(() => { const e = $(id); if (!e) { clearInterval(hitungMundur.h); return } const ms = sampai - Date.now(); e.textContent = fmtSisa(ms); if (ms <= 0) { clearInterval(hitungMundur.h); if (selesai) selesai() } }, 1000);
}
