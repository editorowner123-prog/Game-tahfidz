/* ===== desa.js — nama desa, level pemain, dan desa pemain lain di peta ===== */
const SARAN_DESA = ['Darussalam', 'Al-Falah', 'Nurul Huda', 'Baitul Hikmah', 'Al-Hidayah', 'Ar-Rahmah', 'An-Nur', 'Al-Furqan', 'Baiturrahman', 'Al-Ikhlas', 'Darul Quran', 'Al-Amin', 'Al-Barakah', 'Raudhatul Jannah', 'Al-Muttaqin', 'Daarul Huffazh', 'Nurul Iman', 'Al-Kautsar', 'As-Salam', 'Miftahul Jannah', 'Al-Mubarak', 'Babussalam', 'Al-Hikmah', 'Ar-Raudhah'];
const KATA_KASAR = /\b(anjing|anjg|anj|babi|bangsat|bajingan|kontol|memek|ngentot|entot|ngewe|goblok|goblog|tolol|bego|idiot|asu|jancok|jancuk|jancik|cuk|taik|tai|kampret|bangke|setan|iblis|fuck|shit|bitch|porn|porno|sex|seks|bokep)\b/i;
const rapikanNama = n => String(n || '').replace(/[^A-Za-z0-9 '\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20).trim().replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
function cekNamaDesa(n) {
  const x = rapikanNama(n);
  if (x.length < 3) return { ok: 0, x, p: 'Nama desa minimal 3 huruf.' };
  if (KATA_KASAR.test(x)) return { ok: 0, x, p: 'Pilih nama yang baik, ya.' };
  return { ok: 1, x };
}
function judulDesa(v = S.view, nama = S.namaDesa) { return `${TIERS[Math.min(5, v)].nm}${nama ? ' ' + nama : ''}` }
function lvDari(sk) { return Math.floor(Math.sqrt(Math.max(0, sk || 0) / 40)) + 1 }
function levelSaya() { return lvDari(typeof skorGame === 'function' ? skorGame() : 0) }
const saranAcak = (n = 4) => shuf([...SARAN_DESA]).slice(0, n);

function bukaNamaDesa(lanjut, awal) {
  const sar = saranAcak(4), isi = S.namaDesa || sar[0];
  modal(`<header>${awal ? 'Beri nama desamu' : 'Ganti nama desa'}<small>Nama ini terlihat oleh pemain lain di peta</small></header>
    <div class="nd"><label class="ndl"><span>${TIERS[S.tier].nm}</span><input id="ndIn" maxlength="20" value="${esc(isi)}" autocomplete="off" autocapitalize="words" enterkeyhint="done"></label>
    <p class="nderr" id="ndErr" role="alert"></p>
    <div class="ndchips">${sar.map(x => `<button type="button" class="chip" data-nd="${esc(x)}">${esc(x)}</button>`).join('')}<button type="button" class="chip acak" id="ndAcak">Acak lagi</button></div>
    <p class="ndnote">3–20 huruf. Bisa diganti kapan saja lewat masjid desamu.</p></div>`,
    awal ? [{ t: 'Simpan nama' }] : [{ t: 'Simpan nama' }, { t: 'Batal', c: 'b-soft' }]);
  const inp = $('ndIn'), simpan = $('mc').querySelector('.btn');
  const pasangChip = () => $('mc').querySelectorAll('[data-nd]').forEach(b => b.onclick = () => { inp.value = b.dataset.nd; $('ndErr').textContent = '' });
  pasangChip();
  $('ndAcak').onclick = () => { const s = saranAcak(4); $('mc').querySelectorAll('[data-nd]').forEach((b, k) => { b.dataset.nd = s[k]; b.textContent = s[k] }); inp.value = s[0] };
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); simpan.click() } };
  simpan.onclick = () => {
    const r = cekNamaDesa(inp.value);
    if (!r.ok) { $('ndErr').textContent = r.p; inp.focus(); return }
    $('modal').classList.remove('on');
    const lama = S.namaDesa; S.namaDesa = r.x; save(); if (typeof hud === 'function') hud();
    toast(lama ? `Nama desa diganti jadi ${r.x}.` : `Selamat datang di ${judulDesa(S.tier)}!`);
    if (lanjut) lanjut();
  };
  if (!awal) setTimeout(() => { try { inp.focus(); inp.select() } catch (e) {} }, 250);
}

/* ---------- tetangga: desa pemain lain di pinggir peta ---------- */
const TET = window.TET = { list: [], ts: 0, demo: null };
let treesAll = null;
const SPOT_TET = () => [[4, -6], [13, -6], [22, -6], [-6, 4], [-6, 13], [-6, 22], [MM + 2, 9], [9, MM + 2]];

function tetanggaDemo() {
  if (TET.demo) return TET.demo;
  const nm = ['Umar F.', 'Aisyah R.', 'Bilal H.', 'Fatimah Z.', 'Hasan A.', 'Khadijah N.', 'Salman K.', 'Maryam S.'], ds = saranAcak(8), sk = [2600, 1900, 900, 640, 420, 300, 180, 90];
  return TET.demo = nm.map((n, k) => ({ nama: n, desa: ds[k], skor: sk[k], tingkat: Math.min(5, Math.floor(sk[k] / 450)), wilayah: Math.min(30, 2 + Math.floor(sk[k] / 90)), bangunan: Math.min(120, Math.floor(sk[k] / 30)), atas: k < 2 }));
}
async function muatTetangga(paksa) {
  if (!paksa && Date.now() - TET.ts < 5 * 60e3) return;
  TET.ts = Date.now();
  let L;
  if (typeof NET === 'undefined' || NET.demo) L = tetanggaDemo();
  else if (NET.P) { try { L = await netRpc('game_tetangga', { p_tipe: NET.P.tipe, p_id: NET.P.id }) || [] } catch (e) { TET.ts = 0; return } }
  else return;
  const sp = SPOT_TET();
  TET.list = L.slice(0, 8).sort((a, b) => b.skor - a.skor).map((x, k) => ({ ...x, tingkat: Math.max(0, Math.min(5, x.tingkat | 0)), lv: lvDari(x.skor), desa: x.desa || '', i: sp[k][0], j: sp[k][1], k }));
  aturTetangga();
}
function aturTetangga() {
  if (!treesAll) return;
  trees = treesAll.filter(t => !TET.list.some(n => t.i > n.i - 1.2 && t.i < n.i + 5.2 && t.j > n.j - 1.2 && t.j < n.j + 5.2));
}
function tetanggaKeDaftar(L) { for (const n of TET.list) L.push([n.i + n.j + 4.5, 5, n]) }
function gambarTetangga(n) { const s = spr(`tet|${n.tingkat}|${n.k % 3}`, 320, 400, 160, 250, g => bTetangga(g, n.tingkat, n.k % 3)); const [x, y] = P(n.i, n.j); blit(s, x, y) }
function pilTetangga() {
  for (const n of TET.list) {
    const [cx, cy] = w2s(...P(n.i + 2, n.j + 2, 150 + n.tingkat * 14));
    if (cx < -120 || cx > W + 120 || cy < -60 || cy > H + 60) continue;
    pill(cx, cy, `${TIERS[n.tingkat].nm} ${n.desa || n.nama}`, `${n.nama} · Lv ${n.lv}`, n.atas ? '#fff1c4' : 'rgba(255,255,255,.92)', n.atas ? '#8a5a10' : '#5a3a2a', TIERS[n.tingkat].flag);
  }
}
function ujiTetangga(test) { for (const n of TET.list) test(n.i, n.j, 4, 170 + n.tingkat * 14, { tet: n }) }

function bukaTetangga(n) {
  const t = n.tingkat, saya = levelSaya();
  sheet(head(`${TIERS[t].nm} ${n.desa || 'tanpa nama'}`, `milik ${n.nama}`) + `<div class="sb">
    <div class="grid2"><div class="stat"><b>Lv ${n.lv}</b>level pemain</div><div class="stat"><b>${TIERS[t].nm}</b>tingkat</div><div class="stat"><b>${n.wilayah}</b>wilayah dikuasai</div><div class="stat"><b>${n.bangunan}</b>bangunan berdiri</div></div>
    <p class="p">${n.atas ? 'Salah satu desa terkuat saat ini. ' : ''}${n.lv > saya ? 'Desa ini lebih maju darimu. Rajin murajaah untuk menyusul!' : n.lv < saya ? 'Desamu lebih maju. Pertahankan dengan murajaah setiap hari.' : 'Kalian setara. Siapa yang lebih rajin murajaah?'}</p>
    <div class="row"><button class="btn b-maroon" id="tSerang" ${n.lindung ? 'disabled' : ''}>Serang desa ini</button><button class="btn b-gold" id="tRank">Papan peringkat</button></div>
    <p class="note">${n.lindung ? 'Desa ini sedang dilindungi 24 jam setelah kalah diserang.' : `Jatah serangan hari ini ${window.SERANG ? SERANG.sisa : 2}/2 · pasukanmu ${S.pas || 0}${window.kuatTotal ? ' · ⚔ ' + angkaPendek(kuatTotal()) : ''}`}</p></div>`);
  focusAt(...P(n.i + 2, n.j + 2, 40), .32);
  $('tRank').onclick = openPeringkat; if ($('tSerang')) $('tSerang').onclick = () => { if (window.mulaiIntai) mulaiIntai(n) };
}

/* desa kecil pemain lain: makin tinggi tingkatnya, makin besar dan megah */
function bTetangga(g, t, v) {
  const R = TIERS[t].roof, r = mulb(31 + v * 7 + t), batu = t >= 2, megah = t >= 4;
  const [sx, sy] = P(2, 2.2); shadowE(g, sx, sy, 150, 70, .25);
  box(g, .15, .15, 3.7, 3.7, 0, 3, batu ? '#efe3c6' : '#d9eaa8');
  const pagar = (i, j, w, d) => batu ? box(g, i, j, w, d, 3, megah ? 9 : 7, megah ? '#f6ecd6' : '#e9dcc0') : (() => { for (let u = 0; u <= 1.001; u += .125) { const [x, y] = P(i + w * u, j + d * u, 3); line(g, [[x, y], [x, y - 9]], C('#a07a52'), 2) } })();
  pagar(.2, .2, 3.6, 0); pagar(.2, .2, 0, 3.6);
  const rumah = (i, j, s) => { const h = 13 + t * 2 + r() * 4; box(g, i, j, s, s, 3, h, '#faeed6'); arch(g, 'R', i, j, s, s, .35, .65, 3, 3 + h * .55, '#b07a52'); roof(g, i - .07, j - .07, s + .14, s + .14, 3 + h, 11 + t, R) };
  const n = Math.min(4, 2 + t), pos = [[.55, .55], [2.7, .6], [.6, 2.7], [2.75, 2.75]];
  if (n > 0) rumah(...pos[0], .7);
  const mi = 1.35, ms = .9 + t * .1, mh = 22 + t * 5, [dx, dy] = P(mi + ms / 2, mi + ms / 2, 3 + mh);
  box(g, mi, mi, ms, ms, 3, mh, megah ? '#fffaf0' : '#f8f0e0');
  for (let k = 0; k < 2; k++) arch(g, 'L', mi, mi, ms, ms, .15 + k * .45, .4 + k * .45, 3 + mh * .3, 3 + mh * .75, '#c06070');
  arch(g, 'R', mi, mi, ms, ms, .35, .65, 3, 3 + mh * .7, '#9a3a4c');
  if (megah) box(g, mi - .02, mi - .02, ms + .04, ms + .04, 3 + mh, 2.5, '#f6d06a');
  cyl(g, dx, dy, 9 + t * 1.5, 5, '#fffaf2'); dome(g, dx, dy - 5, 11 + t * 2.5);
  sabit(g, dx + 1, dy - 5 - (11 + t * 2.5) * .9 - 10, 3 + t * .3);
  const menara = (i, j) => { const [mx, my] = P(i, j, 3), hh = 40 + t * 10; cyl(g, mx, my, 5.5, hh, '#fffaf2'); cyl(g, mx, my - hh * .7, 7, 3, '#f6d06a'); dome(g, mx, my - hh, 5.5) };
  if (t >= 1) menara(mi - .15, mi + ms + .1);
  if (t >= 3) menara(mi + ms + .1, mi - .15);
  if (n > 1) rumah(...pos[1], .65); if (n > 2) rumah(...pos[2], .65);
  pagar(3.8, .2, 0, 3.6); pagar(.2, 3.8, 3.6, 0);
  if (n > 3) rumah(...pos[3], .6);
  if (t >= 2) { const [gx, gy] = P(2.1, 3.8, 3); box(g, 1.8, 3.72, .6, .16, 3, megah ? 22 : 17, megah ? '#f6ecd6' : '#e9dcc0'); rarch(g, gx - 7, gy + 2, 14, 13, '#8a5a3a') }
  const [fx, fy] = P(3.6, 3.6, 3); pennant(g, fx, fy, TIERS[t].flag); if (megah) { const [ax, ay] = P(.4, .4, 3); pennant(g, ax, ay - 6, TIERS[t].flag) }
  for (let k = 0; k < 3; k++) { const [x, y] = P(.5 + r() * 3, 3.3 + r() * .4, 3); semak(g, x, y, 5 + r() * 2) }
}

/* ---------- mulai ---------- */
function desaMulai() {
  muatTetangga(true);
  if (!S.namaDesa) setTimeout(() => bukaNamaDesa(() => { if (window.lanjutIntro) lanjutIntro() }, true), 450);
  else if (window.lanjutIntro) lanjutIntro();
}
setInterval(() => { if (typeof CUR !== 'undefined' && CUR === 'hub' && !document.hidden) muatTetangga() }, 60e3);
