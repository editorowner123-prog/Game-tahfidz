/* ===== pwa.js — memasang Benteng Huffazh sebagai aplikasi di HP ===== */
const PWA = { ev: null };
const pwaTerpasang = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const pwaIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const pwaDalamApp = () => /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)/i.test(navigator.userAgent);
const pwaBingkai = () => { try { return window.top !== window } catch (e) { return true } };

// Tombol "Pasang" tampil kalau game belum terpasang dan tidak sedang dibuka di dalam bingkai (mis. pratinjau).
function bisaPasang() { return !pwaTerpasang() && !pwaBingkai() }
function pwaSegarkan() { const b = $('gPasang'); if (b) b.hidden = !bisaPasang() }

function pwaPetunjuk(judul, isi) {
  const m = $('modal');
  if (!$('gate').hidden) {
    m.style.zIndex = '57';
    const pantau = new MutationObserver(() => { if (!m.classList.contains('on')) { m.style.zIndex = ''; pantau.disconnect() } });
    pantau.observe(m, { attributes: true, attributeFilter: ['class'] });
  }
  modal(`<header>${judul}<small>Benteng Huffazh</small></header><div class="pwa-step">${isi}</div>`, [{ t: 'Mengerti' }]);
}

async function pasangApp() {
  if (PWA.ev) {
    PWA.ev.prompt();
    const r = await PWA.ev.userChoice.catch(() => null);
    PWA.ev = null; pwaSegarkan();
    if (r && r.outcome === 'accepted') toast('Benteng Huffazh sedang dipasang di HP…');
    return;
  }
  if (pwaIOS()) return pwaPetunjuk('Pasang di iPhone', `<ol>
    <li>Buka halaman ini di <b>Safari</b>.</li>
    <li>Ketuk tombol <b>Bagikan</b> <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="vertical-align:-3px"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 11v8.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> di bawah layar.</li>
    <li>Pilih <b>Tambah ke Layar Utama</b>, lalu ketuk <b>Tambah</b>.</li></ol>`);
  if (pwaDalamApp()) return pwaPetunjuk('Buka lewat Chrome dulu', `<p>Halaman ini sedang dibuka di dalam aplikasi lain (mis. WhatsApp), jadi belum bisa dipasang.</p>
    <ol><li>Ketuk menu <b>⋮</b> di pojok kanan atas.</li><li>Pilih <b>Buka di Chrome</b>.</li><li>Di Chrome, ketuk lagi tombol <b>Pasang di HP</b>.</li></ol>`);
  pwaPetunjuk('Pasang di HP', `<ol>
    <li>Ketuk menu <b>⋮</b> di pojok kanan atas Chrome.</li>
    <li>Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</li>
    <li>Ikon Benteng Huffazh akan muncul di layar HP.</li></ol>`);
}

addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.ev = e; pwaSegarkan() });
addEventListener('appinstalled', () => { PWA.ev = null; pwaSegarkan(); toast('Terpasang! Buka Benteng Huffazh dari layar utama HP.') });
if ($('gPasang')) $('gPasang').onclick = pasangApp;
pwaSegarkan();

if ('serviceWorker' in navigator && !pwaBingkai() && (location.protocol === 'https:' || location.hostname === 'localhost'))
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
