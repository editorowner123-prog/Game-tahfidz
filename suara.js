/* ===== suara.js — efek suara dan suasana alam desa (WebAudio, tanpa musik) ===== */
const SU = { ac: null, nyala: store.get('bh-suara', 1) !== 0, lapis: {}, burung: 0, jangkrik: 0, kodok: 0, ayam: 0, last: {} };

function suaraSiap() {
  if (SU.ac) { if (SU.ac.state === 'suspended' && !document.hidden && SU.nyala) SU.ac.resume().catch(() => {}); return true }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  try { SU.ac = new AC() } catch (e) { return false }
  const ac = SU.ac;
  SU.master = ac.createGain(); SU.master.gain.value = SU.nyala ? 1 : 0; SU.master.connect(ac.destination);
  SU.amb = ac.createGain(); SU.amb.gain.value = 0; SU.amb.connect(SU.master);
  SU.fx = ac.createGain(); SU.fx.gain.value = .75; SU.fx.connect(SU.master);
  SU.putih = bufBising('putih'); SU.pink = bufBising('pink'); SU.coklat = bufBising('coklat');
  SU.lapis.angin = lapisBising(SU.coklat, 'lowpass', 380, .7);
  SU.lapis.daun = lapisBising(SU.pink, 'bandpass', 2600, .6);
  SU.lapis.hujan = lapisBising(SU.pink, 'highpass', 900, .3);
  SU.lapis.deras = lapisBising(SU.coklat, 'lowpass', 900, .5);
  SU.lapis.air = lapisBising(SU.pink, 'bandpass', 1700, 2.2);
  return true;
}
function bufBising(jenis) {
  const ac = SU.ac, n = ac.sampleRate * 3, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (jenis === 'putih') d[i] = w;
    else if (jenis === 'pink') { b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926 }
    else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5 }
  }
  return b;
}
function lapisBising(buf, tipe, f, q) {
  const ac = SU.ac, src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = buf; src.loop = true; src.loopStart = Math.random(); fl.type = tipe; fl.frequency.value = f; fl.Q.value = q || .7; g.gain.value = 0;
  src.connect(fl); fl.connect(g); g.connect(SU.amb); src.start(0, Math.random() * 2); return { src, fl, g };
}
const keT = (p, v, t, k = .6) => { try { p.setTargetAtTime(v, t, k) } catch (e) {} };

/* ---------- bahan suara ---------- */
function nada(t, f0, f1, dur, vol, tipe = 'sine', tujuan = SU.fx, serang = .005, pan = 0) {
  const ac = SU.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = tipe;
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + serang); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let ujung = g; if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); ujung = p }
  o.connect(g); ujung.connect(tujuan); o.start(t); o.stop(t + dur + .05);
}
function desis(t, buf, tipe, f0, f1, dur, vol, q = 1, tujuan = SU.fx, serang = .004, pan = 0) {
  const ac = SU.ac, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = buf; fl.type = tipe; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + serang); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let ujung = g; if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); ujung = p }
  s.connect(fl); fl.connect(g); ujung.connect(tujuan); s.start(t, Math.random() * 2); s.stop(t + dur + .05);
}
const dentum = (t, f = 120, v = .45, d = .3) => { nada(t, f, f * .45, d, v, 'sine'); desis(t, SU.coklat, 'lowpass', 500, 120, d * .7, v * .5) };

const SFX = {
  ketuk(t) { nada(t, 760, 420, .05, .12, 'triangle') },
  turun(t) { desis(t, SU.pink, 'bandpass', 700, 260, .16, .22, 1.4) },
  bangun(t) { for (let k = 0; k < 3; k++) { dentum(t + k * .15, 150, .3, .16); desis(t + k * .15, SU.putih, 'bandpass', 1200, 800, .05, .12, 2) } },
  naik(t) { desis(t, SU.pink, 'bandpass', 380, 3200, .55, .26, 1.6, SU.fx, .2); nada(t + .45, 1760, 1900, .5, .07) },
  koin(t) { nada(t, 2350, 2350, .28, .1); nada(t + .015, 3570, 3570, .22, .06); desis(t, SU.putih, 'highpass', 6000, 6000, .03, .08) },
  benar(t) { nada(t, 1480, 1560, .4, .1); desis(t, SU.putih, 'highpass', 7000, 7000, .18, .03, .7, SU.fx, .02) },
  salah(t) { nada(t, 190, 110, .2, .2, 'triangle') },
  serang(t) { for (let k = 0; k < 3; k++) dentum(t + k * .24, 92, .55, .42) },
  pukul(t) { desis(t, SU.putih, 'bandpass', 900, 600, .08, .2, 1.5); nada(t, 210, 120, .09, .15) },
  tebas(t) { desis(t, SU.putih, 'highpass', 3200, 3200, .06, .15); nada(t, 2810, 2700, .13, .04); nada(t, 4130, 4000, .1, .025) },
  panah(t) { desis(t, SU.putih, 'bandpass', 2600, 800, .2, .12, 2.2, SU.fx, .03) },
  batu(t) { dentum(t, 74, .3, .28) },
  nur(t) { desis(t, SU.putih, 'highpass', 5200, 5200, .35, .07, .7, SU.fx, .08); nada(t, 2400, 3100, .35, .025) },
  runtuh(t) { desis(t, SU.coklat, 'lowpass', 900, 160, 1.1, .6, .8, SU.fx, .02); dentum(t, 70, .5, .5); for (let k = 0; k < 7; k++) desis(t + .05 + Math.random() * .7, SU.putih, 'bandpass', 600 + Math.random() * 1500, 400, .06, .12, 2) },
  menang(t) { for (let k = 0; k < 8; k++) dentum(t + k * .07, 130, .18, .1); dentum(t + .62, 90, .55, .5); desis(t + .62, SU.putih, 'highpass', 5000, 5000, .9, .06, .7, SU.fx, .05) },
  kalah(t) { dentum(t, 150, .35, .4); dentum(t + .35, 110, .32, .6) },
  palu(t) { nada(t, 620, 330, .04, .05, 'triangle') },
};
function sfx(n) {
  if (!SU.nyala || !SFX[n] || !$('mushaf').hidden) return;
  if (!suaraSiap() || SU.ac.state !== 'running') return;
  const t = SU.ac.currentTime, lim = { pukul: .07, tebas: .07, panah: .07, turun: .05, ketuk: .05, batu: .12, nur: .1, palu: .2, koin: .05 }[n] || 0;
  if (lim && t - (SU.last[n] || 0) < lim) return; SU.last[n] = t;
  try { SFX[n](t + .01) } catch (e) {}
}
function sfxDesa(n, o) {
  if (CUR !== 'hub' || !SU.ac || SU.ac.state !== 'running') return;
  const [x, y] = w2s(...P(o.x, o.y)); if (x < -40 || x > W + 40 || y < -40 || y > H + 40) return;
  sfx(n);
}

/* ---------- suasana alam ---------- */
function kicau(t, pan) {
  const jenis = Math.random(), f0 = 2600 + Math.random() * 2200, v = .035 + Math.random() * .035;
  if (jenis < .4) { const n = 2 + Math.floor(Math.random() * 3); for (let k = 0; k < n; k++) nada(t + k * .13, f0, f0 * 1.35, .08, v, 'sine', SU.amb, .006, pan) }
  else if (jenis < .75) { const n = 5 + Math.floor(Math.random() * 5); for (let k = 0; k < n; k++) nada(t + k * .045, f0 * (1.15 - k * .03), f0 * (1 - k * .03), .035, v * .8, 'sine', SU.amb, .003, pan) }
  else { nada(t, f0 * .8, f0 * 1.3, .14, v, 'sine', SU.amb, .01, pan); nada(t + .2, f0 * 1.25, f0 * .85, .18, v, 'sine', SU.amb, .01, pan) }
}
function jangkrik(t, pan) { const f = 4200 + Math.random() * 700, n = 3 + Math.floor(Math.random() * 2); for (let k = 0; k < n; k++) nada(t + k * .034, f, f, .018, .02, 'sine', SU.amb, .002, pan) }
function kodok(t, pan) { const n = 3 + Math.floor(Math.random() * 4), f = 120 + Math.random() * 60; for (let k = 0; k < n; k++) { nada(t + k * .1, f * 1.2, f, .06, .045, 'square', SU.amb, .006, pan) } }
function suaraPetir() {
  if (!SU.nyala || !SU.ac || SU.ac.state !== 'running' || !$('mushaf').hidden) return;
  const t = SU.ac.currentTime + .35 + Math.random() * 1.3, dekat = Math.random();
  desis(t, SU.coklat, 'lowpass', 1400 * (.5 + dekat), 90, 3.2, .5 + dekat * .3, .6, SU.master, .03 + (1 - dekat) * .25);
  desis(t + .05, SU.putih, 'lowpass', 600, 80, 2.4, .25, .5, SU.master, .1);
  if (dekat > .6) desis(t, SU.putih, 'highpass', 2500, 900, .25, .25, .7, SU.master, .005);
}
function suaraTick() {
  if (!SU.ac || SU.ac.state !== 'running' || !window.alamKeadaan) return;
  const ac = SU.ac, t = ac.currentTime, a = alamKeadaan(), s = performance.now() / 1000;
  const mushaf = !$('mushaf').hidden, kunci = !$('kunci').hidden, desa = CUR === 'hub' || CUR === 'serang';
  keT(SU.amb.gain, mushaf ? 0 : kunci ? .3 : desa ? 1 : .35, t, .8);
  const L = SU.lapis, gl = a.gelap, hj = a.hujan, md = a.mendung;
  keT(L.angin.g.gain, (.06 + md * .09 + (a.petir ? .08 : 0) + hj * .05) * (.7 + .3 * Math.sin(s * .31) * Math.sin(s * .13)), t, 1.2);
  keT(L.angin.fl.frequency, 260 + 160 * Math.sin(s * .17) + md * 260, t, 1.5);
  keT(L.daun.g.gain, (.006 + md * .012) * Math.max(0, Math.sin(s * .23 + 1)), t, 1.5);
  keT(L.hujan.g.gain, hj * .16, t, 1.5); keT(L.deras.g.gain, Math.max(0, hj - .5) * .22, t, 1.5);
  keT(L.air.g.gain, CUR === 'hub' ? .01 + .006 * Math.sin(s * .7) : 0, t, 1);
  const pan = () => (Math.random() - .5) * 1.4;
  if (gl < .45 && hj < .5 && s > SU.burung) { kicau(t + .05, pan()); SU.burung = s + (1.2 + Math.random() * 5) * (1 + md * 2 + gl * 3) }
  if (gl > .55 && hj < .6 && s > SU.jangkrik) { jangkrik(t + .05, pan()); if (Math.random() < .4) jangkrik(t + .3, pan()); SU.jangkrik = s + .5 + Math.random() * 1.1 }
  if ((gl > .6 || hj > .3) && s > SU.kodok) { if (Math.random() < .6) kodok(t + .05, pan()); SU.kodok = s + 5 + Math.random() * 9 }
}
setInterval(suaraTick, 250);

/* ---------- tombol & izin putar ---------- */
function suaraTombol() { const b = $('suaraB'); if (!b) return; b.classList.toggle('mati', !SU.nyala); b.setAttribute('aria-label', SU.nyala ? 'Matikan suara' : 'Nyalakan suara'); b.setAttribute('aria-pressed', SU.nyala ? 'false' : 'true') }
function suaraAlih() {
  SU.nyala = !SU.nyala; store.set('bh-suara', SU.nyala ? 1 : 0); suaraTombol();
  if (SU.nyala) { suaraSiap(); if (SU.master && SU.ac) keT(SU.master.gain, 1, SU.ac.currentTime, .05); sfx('ketuk') } else if (SU.master && SU.ac) keT(SU.master.gain, 0, SU.ac.currentTime, .05);
  toast(SU.nyala ? 'Suara dinyalakan.' : 'Suara dimatikan.');
}
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { if (SU.nyala) suaraSiap() }, { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => { if (!SU.ac) return; if (document.hidden) SU.ac.suspend().catch(() => {}); else if (SU.nyala) SU.ac.resume().catch(() => {}) });
if ($('suaraB')) $('suaraB').onclick = suaraAlih;
suaraTombol();
