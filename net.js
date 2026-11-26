/* ===== net.js — login akun Al-Hafizh, progres di server, duel bayangan ===== */
const NET={sb:null,me:null,P:null,demo:false,timer:null,saving:false,pending:false,lastOk:0,closed:false};
function netInit(){if(!window.supabase||!window.GAME_CFG||/[#&]demo\b/.test(location.hash)){NET.demo=true;return}
  NET.sb=window.supabase.createClient(GAME_CFG.url,GAME_CFG.key,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'bh-auth'}})}
const netErr=e=>(e&&(e.message||e.error_description))||String(e||'Gagal terhubung');
async function netRpc(fn,args){const {data,error}=await NET.sb.rpc(fn,args||{});if(error)throw error;return data}
async function netSesi(){if(NET.demo)return null;const {data}=await NET.sb.auth.getSession();return data&&data.session}
async function netLogin(u,p){const {error}=await NET.sb.auth.signInWithPassword({email:u.trim().toLowerCase()+GAME_CFG.emailDomain,password:p});if(error)throw error}
async function netKeluar(){try{await netSimpanSekarang()}catch(e){}if(NET.sb)await NET.sb.auth.signOut({scope:'local'});try{localStorage.removeItem('bh-pemain')}catch(e){}location.reload()}
const netSaya=async()=>(NET.me=await netRpc('game_saya'));
const netMuat=(t,i)=>netRpc('game_muat',{p_tipe:t,p_id:i});
function skorGame(){let own=0,lv=0;for(const j of ORDER){if(owned(j))own++;for(let q=0;q<4;q++){const b=bget(j,q);if(b&&b.lv)lv+=b.lv}}return S.tier*500+own*100+lv*20+(S.hero?S.hero.lv*10:0)}
function netSimpanNanti(){if(NET.demo||!NET.P)return;NET.pending=true;clearTimeout(NET.timer);NET.timer=setTimeout(netSimpanSekarang,4000)}
async function netSimpanSekarang(){if(NET.demo||!NET.P||!NET.pending||NET.closed)return;if(NET.saving){clearTimeout(NET.timer);NET.timer=setTimeout(netSimpanSekarang,2000);return}
  NET.saving=true;NET.pending=false;const own=ORDER.filter(owned).length,bld=ORDER.reduce((n,j)=>n+[0,1,2,3].filter(q=>bget(j,q)&&bget(j,q).lv).length,0);
  try{await netRpc('game_simpan',{p_tipe:NET.P.tipe,p_id:NET.P.id,p_state:S,p_skor:skorGame(),p_tingkat:S.tier,p_wilayah:own,p_bangunan:bld});NET.lastOk=Date.now()}
  catch(e){NET.pending=true;const m=netErr(e);if(/TUTUP/.test(m)){NET.closed=true;gateClosedMidway()}else{clearTimeout(NET.timer);NET.timer=setTimeout(netSimpanSekarang,15000)}}
  finally{NET.saving=false}}
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')netSimpanSekarang()});
addEventListener('pagehide',()=>{netSimpanSekarang()});
async function netLawan(j){if(NET.demo||!NET.P)return null;try{return await netRpc('game_lawan',{p_tipe:NET.P.tipe,p_id:NET.P.id,p_juz:j})}catch(e){return null}}
async function netRekam(j,jejak,skor){if(NET.demo||!NET.P)return false;try{return await netRpc('game_rekam',{p_tipe:NET.P.tipe,p_id:NET.P.id,p_juz:j,p_jejak:jejak,p_skor:skor})}catch(e){return false}}
async function netPeringkat(k){if(NET.demo)return[];try{return await netRpc('game_peringkat',{p_kelompok:k})||[]}catch(e){return[]}}

/* ---------- layar gerbang ---------- */
function gate(view,msg){$('gate').hidden=false;['gLogin','gPick','gClosed','gNo','gWait'].forEach(id=>$(id).hidden=id!==view);if(msg!=null&&$(view+'Msg'))$(view+'Msg').textContent=msg;$('load').hidden=true}
const fmtTgl=d=>{try{return new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}catch(e){return d}};
function routeMe(me){
  if(me.peran==='wali'){if(!me.boleh){const j=me.jadwal||{};$('gClosedMsg').textContent=j.aktif&&j.mulai?`Game dibuka mulai ${fmtTgl(j.mulai)}${j.selesai?` sampai ${fmtTgl(j.selesai)}`:''}. Sampai jumpa saat libur nanti!`:'Game dibuka oleh admin saat libur pondok. Sampai jumpa nanti!';return gate('gClosed')}
    if(!me.anak.length)return gate('gNo','Akun wali ini belum terhubung ke data santri. Hubungi admin pondok.');
    if(me.anak.length===1)return pilihPemain({tipe:'santri',id:me.anak[0].id,nama:me.anak[0].nama});
    $('gPickList').innerHTML=me.anak.map((a,i)=>`<button class="li pickb" data-i="${i}"><div><b>${esc(a.nama)}</b><small>${a.juz} juz sudah disetorkan</small></div><span class="tag ok">Main</span></button>`).join('');
    $('gPickList').onclick=e=>{const b=e.target.closest('.pickb');if(!b)return;const a=me.anak[+b.dataset.i];pilihPemain({tipe:'santri',id:a.id,nama:a.nama})};return gate('gPick')}
  if(me.peran==='asatidz'||me.peran==='admin')return pilihPemain({tipe:'asatidz',id:me.id,nama:me.nama});
  gate('gNo','Game ini untuk Wali Santri (dimainkan ananda) serta Ustadz dan Ustadzah.')}
async function pilihPemain(p){gate('gWait','Menyiapkan wilayah '+p.nama+'…');
  try{const r=NET.demo?{juz:30,state:null}:await netMuat(p.tipe,p.id);NET.P=Object.assign({},p,{juz:r.juz});MAXJ=p.tipe==='santri'?Math.max(1,r.juz|0):30;
    try{localStorage.setItem('bh-pemain',JSON.stringify({tipe:p.tipe,id:p.id}))}catch(e){}
    KEYP=`bh3-${p.tipe}-${p.id}`;const lokal=store.get(KEYP,null),server=r.state&&r.state.t?r.state:null;
    let st=null;if(lokal&&server)st=(lokal._ts||0)>=(server._ts||0)?lokal:server;else st=lokal||server;
    if(!st||!st.t){st=DEF();st.v=2}S=st;S.v=2;S.view=Math.min(S.view||0,maxTier());S.tier=Math.min(S.tier||0,maxTier());if(!S.t[30])S.t[30]={open:1,own:1};
    store.set(KEYP,S);if(lokal&&server&&lokal!==server&&(lokal._ts||0)>(server._ts||0)){NET.pending=true;netSimpanNanti()}
    await startGame()}
  catch(e){const m=netErr(e);if(/TUTUP/.test(m))return gate('gClosed','Game sedang ditutup oleh admin.');gate('gLogin',m)}}
function gateClosedMidway(){go('hub');$('gClosedMsg').textContent='Waktu bermain sudah ditutup oleh admin. Progres yang sudah tersimpan tetap aman. Sampai jumpa di libur berikutnya!';gate('gClosed')}
$('gLogin').addEventListener('submit',async e=>{e.preventDefault();const b=$('gBtn');b.disabled=true;b.textContent='Memeriksa…';$('gLoginMsg').textContent='';
  try{await netLogin($('gUser').value,$('gPass').value);const me=await netSaya();routeMe(me)}
  catch(err){const m=netErr(err);$('gLoginMsg').textContent=/invalid/i.test(m)?'Username atau kata sandi salah.':m}
  finally{b.disabled=false;b.textContent='Masuk'}});
document.querySelectorAll('[data-keluar]').forEach(b=>b.onclick=netKeluar);
