/* ===== cuaca.js — keadaan alam di game mengikuti kenyataan =====
   Cuaca diambil dari Open-Meteo (gratis untuk penggunaan non-komersial, wajib mencantumkan sumber),
   diperbarui tiap 20 menit. Terang, senja, dan malam dihitung dari waktu terbit dan Maghrib di lokasi pemain. */
const ALAM = (() => { try { const c = JSON.parse(localStorage.getItem('bh-cuaca')); if (c && c.kondisi) return { ...c, uji: null } } catch (e) {} return { kondisi: 'cerah', suhu: null, ts: 0, uji: null } })();
const LABEL_CUACA = { cerah: 'Cerah', berawan: 'Cerah berawan', mendung: 'Mendung', kabut: 'Berkabut', gerimis: 'Gerimis', hujan: 'Hujan', lebat: 'Hujan lebat', petir: 'Hujan petir' };

function kondisiDariKode(c, awan) {
  if ([95, 96, 99].includes(c)) return 'petir';
  if ([65, 67, 82].includes(c)) return 'lebat';
  if ([61, 63, 66, 80, 81, 71, 73, 75, 77, 85, 86].includes(c)) return 'hujan';
  if ([51, 53, 55, 56, 57].includes(c)) return 'gerimis';
  if ([45, 48].includes(c)) return 'kabut';
  if (c === 3) return 'mendung';
  if (c === 2) return 'berawan';
  return awan > 75 ? 'berawan' : 'cerah';
}

async function cuacaMuat(paksa) {
  if (!paksa && Date.now() - ALAM.ts < 20 * 60e3 && ALAM.lat === LOK.lat && ALAM.lng === LOK.lng) return;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LOK.lat}&longitude=${LOK.lng}&current=temperature_2m,weather_code,cloud_cover,precipitation&timezone=auto`, { cache: 'no-store' });
    if (!r.ok) throw 0;
    const c = (await r.json()).current;
    Object.assign(ALAM, { kondisi: kondisiDariKode(c.weather_code, c.cloud_cover), kode: c.weather_code, suhu: Math.round(c.temperature_2m), ts: Date.now(), lat: LOK.lat, lng: LOK.lng });
    try { localStorage.setItem('bh-cuaca', JSON.stringify({ ...ALAM, uji: null })) } catch (e) {}
  } catch (e) { if (Date.now() - ALAM.ts > 3 * 3600e3) ALAM.kondisi = 'cerah' }
  ALAM._ik = ''; alamPillSegarkan();
}

// Angka 0..1 untuk menggambar: gelap (malam), senja, mendung, hujan, kabut, petir.
function alamKeadaan(ms = kini()) {
  const J = jadwalHari(ms), w = J.w, terbit = w.terbit + 2 * 60e3, benam = w.maghrib - 2 * 60e3;
  let gelap = 0, senja = 0;
  if (ms < w.subuh || ms >= w.isya) gelap = 1;
  else if (ms < terbit) { const f = (ms - w.subuh) / (terbit - w.subuh); gelap = 1 - f; senja = Math.sin(f * Math.PI) * .9 }
  else if (ms < terbit + 45 * 60e3) senja = (1 - (ms - terbit) / (45 * 60e3)) * .45;
  else if (ms >= benam - 50 * 60e3 && ms < benam) { const f = (ms - (benam - 50 * 60e3)) / (50 * 60e3); gelap = f * .15; senja = f * .9 }
  else if (ms >= benam) { const f = (ms - benam) / (w.isya - benam); gelap = .15 + .85 * f; senja = .9 * (1 - f) }
  const u = ALAM.uji || {};
  if (u.malam === 1) { gelap = 1; senja = 0 } else if (u.malam === 0) { gelap = 0; senja = 0 }
  const k = u.k || ALAM.kondisi;
  const [mendung, hujan, petir, kabut] = ({ cerah: [0, 0, 0, 0], berawan: [.22, 0, 0, 0], mendung: [.7, 0, 0, 0], kabut: [.5, 0, 0, 1], gerimis: [.72, .3, 0, 0], hujan: [.85, .65, 0, 0], lebat: [.95, 1, 0, 0], petir: [1, .9, 1, 0] })[k] || [0, 0, 0, 0];
  return { gelap, senja, mendung, hujan, petir: !!petir, kabut, kondisi: k };
}

// Satu warna "multiply" gabungan dari mendung, senja, dan malam.
function alamWarna(a) {
  let c = [1, 1, 1];
  const kali = (t, k) => { c = c.map((v, i) => v * (1 + (t[i] - 1) * k)) };
  kali([.74, .78, .86], a.mendung * .75);
  kali([1, .8, .64], a.senja * .55 * (1 - a.mendung * .6));
  kali([.2, .25, .46], a.gelap * .86);
  return c;
}

/* ---- ikon cuaca ---- */
const IK_AWAN = (f, x = 0, y = 0, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M6.5 19h11a4 4 0 0 0 .6-7.95A5.6 5.6 0 0 0 7.3 9.6 4.75 4.75 0 0 0 6.5 19z" fill="${f}"/>`;
function ikonCuaca(k, malam) {
  const langit = malam ? '<path d="M15.5 3.5a6 6 0 1 0 5 8.6 4.8 4.8 0 1 1-5-8.6z" fill="#ffe7a6"/>' : '<circle cx="15" cy="8" r="4" fill="#ffd24a"/><g stroke="#ffd24a" stroke-width="1.6" stroke-linecap="round"><path d="M15 1.5v1.6M21.5 8h-1.6M19.6 3.4l-1.1 1.1M10.4 3.4l1.1 1.1"/></g>';
  const tetes = n => Array.from({ length: n }, (_, i) => `<path d="M${8 + i * 4} 20.5l-1 2.5" stroke="#bfe0ff" stroke-width="1.7" stroke-linecap="round"/>`).join('');
  const isi = {
    cerah: malam ? '<path d="M14 3a8 8 0 1 0 7 11.2A6.4 6.4 0 1 1 14 3z" fill="#ffe7a6"/>' : '<circle cx="12" cy="12" r="5" fill="#ffd24a"/><g stroke="#ffd24a" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g>',
    berawan: langit + IK_AWAN('#fff', -1, 1),
    mendung: IK_AWAN('#dfe4ec', 3, -4, .8) + IK_AWAN('#fff', -1, 1),
    kabut: IK_AWAN('#fff', 0, -3) + '<g stroke="#fff" stroke-width="1.7" stroke-linecap="round" opacity=".9"><path d="M4 19.5h16M7 22.5h11"/></g>',
    gerimis: IK_AWAN('#f2f5fa', 0, -3) + tetes(2),
    hujan: IK_AWAN('#e8edf5', 0, -3) + tetes(3),
    lebat: IK_AWAN('#dfe5ee', 0, -3) + tetes(3) + '<path d="M10 22l-.8 2" stroke="#bfe0ff" stroke-width="1.7" stroke-linecap="round"/>',
    petir: IK_AWAN('#d9dfe9', 0, -3) + '<path d="M12.5 15.5l-3 4.5h2.6l-1.6 4 4.5-5.6h-2.7l1.6-2.9z" fill="#ffd84d"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${isi[k] || isi.cerah}</svg>`;
}
function latarIkon(a) {
  if (a.gelap > .6) return 'linear-gradient(#3e4a86,#1f2650)';
  if (a.petir) return 'linear-gradient(#5d637e,#373b54)';
  if (a.hujan > 0) return 'linear-gradient(#7f8ca3,#56617a)';
  if (a.mendung > .45) return 'linear-gradient(#a9b2c0,#7c8697)';
  if (a.senja > .3) return 'linear-gradient(#f4a46c,#cf6079)';
  return 'linear-gradient(#7ec8f2,#4a98d8)';
}

/* ---- pil di peta utama ---- */
function alamPillSegarkan() {
  const p = $('alamP'); if (!p || !SH.st) return;
  const a = alamKeadaan(), st = SH.st, ik = a.kondisi + (a.gelap > .5 ? 'm' : '') + latarIkon(a);
  if (ALAM._ik !== ik) { ALAM._ik = ik; $('alamIc').innerHTML = ikonCuaca(a.kondisi, a.gelap > .5); $('alamIc').style.background = latarIkon(a) }
  const nm = namaSholat(st.k, st.J);
  if (st.mode === 'ingat') { $('alamT').textContent = mmss(st.t - kini()); $('alamS').textContent = `${nm} sebentar lagi` }
  else { $('alamT').textContent = jamLokal(st.t); $('alamS').textContent = `${nm}${ALAM.suhu != null ? ` · ${ALAM.suhu}°` : ''}` }
  p.classList.toggle('hot', st.mode === 'ingat');
}

function alamBuka() {
  const a = alamKeadaan(), now = kini(), J = jadwalHari(now), st = SH.st || statusSholat(now);
  const admin = typeof NET !== 'undefined' && (NET.demo || (NET.me && NET.me.peran === 'admin'));
  const lalu = ALAM.ts ? Math.max(0, Math.round((Date.now() - ALAM.ts) / 60e3)) : null;
  const rows = URUT_SHOLAT.map(k => {
    const t = J.w[k], skr = st.mode === 'kunci' && st.k === k && st.J === J, brk = st.mode !== 'kunci' && st.k === k && st.J === J, lewat = now >= t + SHOLAT_KUNCI * 60e3;
    return `<div class="li${lewat ? ' lewat' : ''}"><div><b>${namaSholat(k, J)}</b><small>${k === 'subuh' ? `Terbit ${jamLokal(J.w.terbit)}` : ''}</small></div><span class="jam">${jamLokal(t)}</span>${skr ? '<span class="tag ok">Sekarang</span>' : brk ? '<span class="tag gold">Berikutnya</span>' : ''}</div>`;
  }).join('');
  const notifPerlu = sholatNotifBisa() && Notification.permission !== 'granted';
  sheet(head('Cuaca & waktu sholat', LOK.nama) + `<div class="sb">
    <div class="li cuaca"><span class="aic big" style="background:${latarIkon(a)}">${ikonCuaca(a.kondisi, a.gelap > .5)}</span><div><b>${LABEL_CUACA[a.kondisi]}${a.gelap > .6 ? ' · malam' : a.senja > .3 ? ' · senja' : ''}${ALAM.suhu != null && !ALAM.uji ? ` · ${ALAM.suhu}°C` : ''}</b><small>${ALAM.uji ? 'Tampilan uji coba' : lalu == null ? 'Belum ada data cuaca' : `Diperbarui ${lalu < 2 ? 'baru saja' : lalu + ' menit lalu'}`} · <a href="https://open-meteo.com/" target="_blank" rel="noopener">Data cuaca: Open-Meteo.com</a></small></div></div>
    <p class="note" style="margin:10px 0">Pengingat muncul ${SHOLAT_INGAT} menit sebelum waktu sholat. Saat waktu sholat tiba, game istirahat ${SHOLAT_KUNCI} menit.</p>
    <div class="list jadwal">${rows}</div>
    <div class="row" style="margin-top:12px">${LOK.asal !== 'perangkat' ? '<button class="btn b-soft" id="aLok">Pakai lokasi HP</button>' : ''}${notifPerlu ? '<button class="btn b-soft" id="aNotif">Nyalakan notifikasi</button>' : ''}</div>
    <p class="note">Jadwal: kriteria Kemenag, ${LOK.asal === 'perangkat' ? 'dihitung untuk lokasi HP-mu' : 'lokasi bawaan Gunungpati, Semarang'} (${zonaNama(J.tz)}).</p>
    ${admin ? `<div class="list" style="margin-top:10px"><div class="li"><div><b>Coba tampilan alam (khusus admin)</b><small>Hanya di HP ini, kembali normal saat dimuat ulang</small></div></div></div>
    <div class="row">${['cerah', 'berawan', 'mendung', 'kabut', 'hujan', 'petir'].map(k => `<button class="btn b-soft" data-uk="${k}">${LABEL_CUACA[k]}</button>`).join('')}<button class="btn b-soft" data-um="1">Malam</button><button class="btn b-soft" data-um="0">Siang</button><button class="btn b-soft" data-un>Ikuti kenyataan</button></div>` : ''}
  </div>`);
  if ($('aLok')) $('aLok').onclick = async () => { if (await sholatLokasiHP()) alamBuka() };
  if ($('aNotif')) $('aNotif').onclick = async () => { await sholatMintaNotif(); alamBuka() };
  const s = $('sheet');
  s.querySelectorAll('[data-uk]').forEach(b => b.onclick = () => { ALAM.uji = { ...(ALAM.uji || {}), k: b.dataset.uk }; ALAM._ik = ''; alamPillSegarkan(); alamBuka() });
  s.querySelectorAll('[data-um]').forEach(b => b.onclick = () => { ALAM.uji = { ...(ALAM.uji || {}), malam: +b.dataset.um }; ALAM._ik = ''; alamPillSegarkan(); alamBuka() });
  s.querySelectorAll('[data-un]').forEach(b => b.onclick = () => { ALAM.uji = null; ALAM._ik = ''; alamPillSegarkan(); alamBuka() });
}

/* ---- gambar: partikel hujan, kabut, kilat (dipakai peta utama dan lapisan mode lain) ---- */
const acak = Math.random;
function buatKanvas(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c }
const SPR_CAHAYA = buatKanvas(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,214,140,1)'); r.addColorStop(.35, 'rgba(255,186,100,.45)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128) });
const SPR_AWAN = buatKanvas(256, 160, (g) => { const r = g.createRadialGradient(128, 80, 10, 128, 80, 120); r.addColorStop(0, 'rgba(20,28,48,1)'); r.addColorStop(1, 'rgba(20,28,48,0)'); g.setTransform(1, 0, 0, .62, 0, 30); g.fillStyle = r; g.fillRect(0, 0, 256, 256) });
const SPR_KABUT = buatKanvas(256, 160, (g) => { const r = g.createRadialGradient(128, 80, 10, 128, 80, 120); r.addColorStop(0, 'rgba(240,243,247,1)'); r.addColorStop(1, 'rgba(240,243,247,0)'); g.setTransform(1, 0, 0, .55, 0, 36); g.fillStyle = r; g.fillRect(0, 0, 256, 256) });
const efekBaru = () => ({ t: 0, drops: [], spl: [], flash: 0, dua: 0, bolt: null, boltT: 0, next: 3 + acak() * 4 });

function buatKilat(w, h, s) {
  const pts = [[w * (.15 + acak() * .7), -10]], ujung = h * (.3 + acak() * .3);
  while (pts[pts.length - 1][1] < ujung) { const [x, y] = pts[pts.length - 1]; pts.push([x + (acak() - .5) * 46 * s, y + (14 + acak() * 26) * s]) }
  const cab = pts.slice(2 + (acak() * 3 | 0)), c0 = cab[0], b = [c0]; if (c0) for (let k = 0; k < 4; k++) { const [x, y] = b[b.length - 1]; b.push([x + (18 + acak() * 20) * s * (pts[0][0] > w / 2 ? -1 : 1), y + (10 + acak() * 18) * s]) }
  return [pts, b];
}

function alamPartikel(ctx, w, h, s, dt, a, F, opsi = {}) {
  F.t += dt;
  if (a.mendung > .1 && a.gelap < .75 && opsi.awan) {
    ctx.globalAlpha = a.mendung * .2 * (1 - a.gelap);
    for (let i = 0; i < 4; i++) { const x = ((i * .37 + F.t * .008) % 1.5 - .25) * w, y = ((i * .61) % 1) * h * .9; ctx.drawImage(SPR_AWAN, x - w * .35, y - w * .22, w * .7, w * .44) }
    ctx.globalAlpha = 1;
  }
  if (a.kabut > 0) {
    ctx.fillStyle = `rgba(232,236,242,${a.kabut * .32})`; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = a.kabut * .5 * (1 - a.gelap * .6);
    for (let i = 0; i < 5; i++) { const x = ((i * .29 + F.t * .006) % 1.4 - .2) * w, y = (.2 + (i * .47) % .8) * h; ctx.drawImage(SPR_KABUT, x - w * .4, y - w * .2, w * .8, w * .4) }
    ctx.globalAlpha = 1;
  }
  const N = Math.round(a.hujan * 240 * Math.min(2, (w * h) / (390 * 844 * s * s)));
  while (F.drops.length < N) F.drops.push({ x: acak() * w * 1.2, y: acak() * h, v: (620 + acak() * 320) * s, l: (12 + acak() * 10) * s });
  if (F.drops.length > N) F.drops.length = N;
  if (N) {
    ctx.beginPath();
    for (const d of F.drops) {
      d.y += d.v * dt; d.x -= d.v * dt * .2;
      if (d.y > h || d.x < -20) { if (acak() < .5 && F.spl.length < 60) F.spl.push({ x: acak() * w, y: h * (.15 + acak() * .85), t: 0 }); d.y = -d.l - acak() * 40 * s; d.x = acak() * w * 1.2 }
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * .2, d.y - d.l);
    }
    ctx.strokeStyle = a.gelap > .5 ? 'rgba(180,200,240,.6)' : 'rgba(232,240,255,.68)'; ctx.lineWidth = 1.3 * s; ctx.stroke();
  }
  if (F.spl.length) {
    ctx.lineWidth = 1 * s;
    for (const p of F.spl) { p.t += dt; const k = p.t / .4; ctx.strokeStyle = `rgba(230,240,255,${(1 - k) * .55})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, (2 + k * 7) * s, (1 + k * 2.6) * s, 0, 0, 7); ctx.stroke() }
    F.spl = F.spl.filter(p => p.t < .4);
  }
  if (a.petir) {
    F.next -= dt;
    if (F.next <= 0) { F.flash = 1; F.dua = .14; F.bolt = buatKilat(w, h, s); F.boltT = .28; F.next = 5 + acak() * 10; if (window.suaraPetir) suaraPetir() }
  }
  if (F.dua > 0) { F.dua -= dt; if (F.dua <= 0) F.flash = Math.max(F.flash, .75) }
  if (F.bolt && F.boltT > 0) {
    F.boltT -= dt; ctx.save(); ctx.globalAlpha = Math.max(0, F.boltT / .28); ctx.strokeStyle = '#f4f8ff'; ctx.shadowColor = '#a9c6ff'; ctx.shadowBlur = 18 * s; ctx.lineJoin = 'round';
    F.bolt.forEach((pts, i) => { if (pts.length < 2) return; ctx.lineWidth = (i ? 1.4 : 2.8) * s; ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke() });
    ctx.restore();
  }
  if (F.flash > 0) { ctx.fillStyle = `rgba(236,242,255,${F.flash * .5})`; ctx.fillRect(0, 0, w, h); F.flash = Math.max(0, F.flash - dt * 3.2) }
}

/* ---- peta utama: digambar langsung di kanvas (dipanggil dari hub.js) ---- */
const AF_HUB = efekBaru();
function alamHub(ctx, w, h, s, dt, keDunia, lampu) {
  const a = alamKeadaan();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (a.mendung > .05) { ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = Math.min(1, a.mendung * .55); ctx.fillStyle = '#888'; ctx.fillRect(0, 0, w, h) }
  const [r, g, b] = alamWarna(a);
  if (r < .995 || g < .995 || b < .995) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1; ctx.fillStyle = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`; ctx.fillRect(0, 0, w, h) }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const nyala = Math.max(a.gelap, a.petir ? .35 : 0, (a.mendung - .7) * 1.2);
  if (nyala > .1 && lampu.length) {
    keDunia(); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, rr, k] of lampu) { ctx.globalAlpha = Math.min(1, nyala * (k || 1)); ctx.drawImage(SPR_CAHAYA, x - rr, y - rr, rr * 2, rr * 2) }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  alamPartikel(ctx, w, h, s, dt, a, AF_HUB, { awan: 1 });
  ctx.restore();
}

/* ---- Rihlah, Duel, Garda: lapisan di atas layar permainan ---- */
const LAPIS = [];
function alamPasangLapis() {
  [['rMapV', 'rihlah', null], ['stage', 'rihlah', 'bsvg'], ['arena', 'duel', 'dcv'], ['garda', 'garda', 'gl'], ['serang', 'serang', 'scv']].forEach(([id, mode, setelah]) => {
    const host = $(id); if (!host) return;
    const el = document.createElement('div'); el.className = 'alamfx'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = (mode === 'garda' ? '' : '<i></i>') + '<canvas></canvas>';
    host.insertBefore(el, setelah ? $(setelah).nextSibling : null);
    LAPIS.push({ el, mode, cv: el.querySelector('canvas'), tint: el.querySelector('i'), F: efekBaru(), w: '', kosong: true });
  });
}
let lapisT = 0;
function lapisLoop(ms) {
  const dt = Math.min(.05, (ms - (lapisT || ms)) / 1000); lapisT = ms;
  if (CUR !== 'hub') {
    const a = alamKeadaan();
    for (const L of LAPIS) {
      if (L.mode !== CUR || !L.el.getClientRects().length) continue;
      if (L.tint) { const [r, g, b] = alamWarna(a), c = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`; if (L.w !== c) { L.w = c; L.tint.style.background = c } }
      const ada = a.hujan > 0 || a.kabut > 0 || a.petir || L.F.flash > 0 || L.F.boltT > 0;
      if (!ada && L.kosong) continue;
      const s = Math.min(devicePixelRatio || 1, 1.5), W = Math.round(L.el.clientWidth * s), H = Math.round(L.el.clientHeight * s);
      if (L.cv.width !== W || L.cv.height !== H) { L.cv.width = W; L.cv.height = H }
      const c = L.cv.getContext('2d'); c.clearRect(0, 0, W, H);
      if (ada) alamPartikel(c, W, H, s, dt, a, L.F);
      L.kosong = !ada;
    }
  }
  requestAnimationFrame(lapisLoop);
}

alamPasangLapis(); requestAnimationFrame(lapisLoop);
cuacaMuat(); setInterval(() => cuacaMuat(), 5 * 60e3);
