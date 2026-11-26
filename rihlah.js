/* ===== rihlah.js — perjalanan pembuka wilayah (RPG) ===== */
const MON={kasal:{nm:'Si Malas',d:'Kasal, yang membuat murajaah terus ditunda.',hp:70,atk:9,xp:25,sky:['#bfe6f6','#fdf0d0'],sym:'m-kasal'},
  waswas:{nm:'Si Pembisik',d:'Was-was, yang membuatmu ragu di tengah ayat.',hp:100,atk:12,xp:40,sky:['#f8c0a8','#fde6c8'],sym:'m-waswas'},
  ghaflah:{nm:'Bayang Kelalaian',d:'Ghaflah, yang membuat hafalan memudar diam-diam.',hp:130,atk:14,xp:55,sky:['#9aa4dc','#e6d6f0'],sym:'m-ghaflah'},
  takabbur:{nm:'Penjaga Juz',d:'Raja Takabbur, yang merasa sudah hafal lalu berhenti mengulang. Soalnya dari seluruh juz.',hp:200,atk:17,xp:120,sky:['#8a5a8a','#f6b8a0'],sym:'m-takabbur'}};
const MORD=['kasal','waswas','ghaflah','waswas'];
let RJ=null,RN=[],B=null,rbusy=false;
const rprog=j=>S.r[j]||(S.r[j]={d:0,st:[]});
function rbar(){const h=S.hero;$('rLv').textContent=`Lv ${h.lv} · ${Math.max(0,Math.round(h.hp))}/${heroMax()}`;$('rHp').style.width=clamp(h.hp/heroMax()*100,0,100)+'%';$('rXp').style.width=(h.xp/heroNeed()*100)+'%'}
function startRihlah(j){RJ=j;rprog(j);RN=[{t:'s',k:0},{t:'s',k:1},{t:'p'},{t:'s',k:2},{t:'s',k:3},{t:'b'}];if(S.hero.hp<=0)S.hero.hp=heroMax();go('rihlah');showRMap()}
function showRMap(){$('rMapV').hidden=false;$('rBatV').hidden=true;$('rT').innerHTML=`Rihlah ke Juz ${RJ}<small>${esc(juzLabel(RJ))}</small>`;rbar();drawRMap()}
function drawRMap(){const gap=118,H2=RN.length*gap+200,W2=360,r=mulb(RJ*3),pos=RN.map((_,i)=>[180+Math.sin(i*1.3+.4)*88,H2-100-i*gap]),d0=rprog(RJ).d,st=rprog(RJ).st,tc=TIERS[tierOf(RJ)];
  let s=`<defs><linearGradient id="rmg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fbe8c4"/><stop offset=".6" stop-color="#f4d2a6"/><stop offset="1" stop-color="#d8c0e0"/></linearGradient></defs><rect width="${W2}" height="${H2}" fill="url(#rmg)"/>`;
  s+=`<path d="M0 130Q60 50 130 110Q190 30 250 100Q300 50 360 110V0H0Z" fill="#c4a8d8" opacity=".55"/><path d="M0 170Q90 100 170 150Q250 90 360 160V0H0Z" fill="#d6b8d8" opacity=".4"/>`;
  for(let k=0;k<H2/70;k++){const y=k*70+r()*40;s+=`<ellipse cx="${(r()*W2)|0}" cy="${y|0}" rx="${(60+r()*80)|0}" ry="${(10+r()*8)|0}" fill="rgba(255,255,255,.3)"/>`}
  for(let k=0;k<14;k++){const y=(140+r()*(H2-180))|0,x=r()<.5?(16+r()*56)|0:(W2-16-r()*56)|0,t=r();
    s+=t<.5?`<g transform="translate(${x} ${y})"><path d="M0 0Q4 -16 2 -32" stroke="#b08a5a" stroke-width="3" fill="none"/>${[0,1,2,3,4].map(i=>`<path d="M2 -32q${(i-2)*7} -6 ${(i-2)*13} 4" stroke="#7cc45a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`).join('')}</g>`:t<.8?`<ellipse cx="${x}" cy="${y}" rx="16" ry="6" fill="#ecc896"/>`:`<g transform="translate(${x} ${y})"><path d="M-14 0L0 -18L14 0Z" fill="#fff6e4"/><path d="M-4 0L0 -8L4 0Z" fill="#c08a52"/></g>`}
  let d=`M${pos[0][0]} ${H2-20}L${pos[0][0]} ${pos[0][1]}`;for(let i=1;i<pos.length;i++){const [x0,y0]=pos[i-1],[x1,y1]=pos[i];d+=`C${x0} ${y0-gap*.5} ${x1} ${y1+gap*.5} ${x1} ${y1}`}
  s+=`<path d="${d}" stroke="#e0b880" stroke-width="16" fill="none" stroke-linecap="round" opacity=".7"/><path d="${d}" stroke="#fff6e0" stroke-width="5" fill="none" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  RN.forEach((nd,i)=>{const [x,y]=pos[i],done=i<d0,cur=i===d0,lock=i>d0;const fill=lock?'#e3d6c4':cur?tc.roof:nd.t==='p'?'#6fd2c2':'#fffaf2',stroke=lock?'#cfc0aa':'#f0c85a';
    const lab=nd.t==='s'?`Bagian ${nd.k+1}`:nd.t==='p'?'Pondok':'Penjaga Juz',sub=nd.t==='s'?segLabel(RJ,nd.k):'';const ic=lock?'#bfae96':cur?'#fff':'#a03c4c';
    const icon=nd.t==='p'?`<path d="M-11 7L0 -9L11 7Z" fill="${ic}"/>`:nd.t==='b'?`<path d="M-12 8V-4h4v-4h4v4h8v-4h4v4h4V8Z" fill="${ic}"/>`:`<path d="M3-11h8v8L-1 9l-3-3z" fill="${ic}"/><path d="M-9 4l5 5M-10 10l3-3" stroke="${ic}" stroke-width="2.6" stroke-linecap="round"/>`;
    const stars=done&&nd.t!=='p'?[0,1,2].map(k=>`<path transform="translate(${-16+k*16} 44) scale(.5)" d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" fill="${k<(st[i]||0)?'#f6cf55':'#e3d8c4'}"/>`).join(''):'';
    s+=`<g class="node" data-i="${i}" transform="translate(${x.toFixed(1)} ${y})" role="button" tabindex="0" aria-label="${esc(lab)}">${cur?`<circle class="ring" r="31" fill="none" stroke="#ffe08a" stroke-width="5"/>`:''}<circle r="26" fill="${fill}" stroke="${stroke}" stroke-width="4"/>${icon}
      <text y="${done&&nd.t!=='p'?38:42}" text-anchor="middle" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="13" fill="#4a2a2a" stroke="#fffaf2" stroke-width="3.5" paint-order="stroke">${esc(lab)}</text>${sub&&!done?`<text y="56" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="700" font-size="10" fill="#8a6a62" stroke="#fffaf2" stroke-width="3" paint-order="stroke">${esc(sub)}</text>`:''}${stars}</g>`});
  if(d0<RN.length){const [x,y]=pos[d0];s+=`<g transform="translate(${x+(x>180?-74:34)} ${y-50})"><g class="bob"><use href="#hero" width="40" height="54"/></g></g>`}
  const svg=$('rSvg');svg.setAttribute('viewBox',`0 0 ${W2} ${H2}`);svg.innerHTML=s;
  requestAnimationFrame(()=>{const w=$('rMapW'),yy=pos[Math.min(d0,RN.length-1)][1]/H2*svg.getBoundingClientRect().height;w.scrollTop=yy-w.clientHeight*.55})}
$('rSvg').addEventListener('click',e=>{const g=e.target.closest('.node');if(g)openRNode(+g.dataset.i)});
$('rSvg').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const g=e.target.closest('.node');if(g)openRNode(+g.dataset.i)});
function openRNode(i){const nd=RN[i],d0=rprog(RJ).d,sh=$('sheet');let h;
  if(i>d0)h=`<div class="shead"><div class="t">Belum terbuka<small>Selesaikan pos sebelumnya</small></div><button class="x" data-x>×</button></div><div class="sb"><p class="p">Jalan ke sini masih tertutup pasir. Kalahkan musuh di pos sekarang dulu.</p></div>`;
  else if(nd.t==='p')h=`<div class="shead"><div class="t">Pondok persinggahan<small>Tempat istirahat para penuntut ilmu</small></div><button class="x" data-x>×</button></div><div class="sb"><p class="p">Nyawamu pulih penuh di sini. Kesempatan baik untuk mengulang hafalan sebelum melanjutkan.</p><button class="btn b-teal wide" id="nGo">Istirahat (${Math.round(S.hero.hp)} → ${heroMax()})</button></div>`;
  else{const m=MON[nd.t==='b'?'takabbur':MORD[nd.k]],sc=1+tierOf(RJ)*.15;
    h=`<div class="shead"><div class="t">${nd.t==='b'?`Penjaga Juz ${RJ}`:`Bagian ${nd.k+1} · Juz ${RJ}`}<small>${esc(nd.t==='b'?juzLabel(RJ):segLabel(RJ,nd.k))}</small></div><button class="x" data-x>×</button></div>
    <div class="sb"><div class="li" style="margin-bottom:12px"><svg viewBox="0 0 160 160" width="84" height="84" style="flex:none;background:#fbf1dc;border-radius:16px"><use href="#${m.sym}"/></svg><div><b>${esc(m.nm)}</b><small>${esc(m.d)}<br>Nyawa ${Math.round(m.hp*sc)} · Serangan ${Math.round(m.atk*sc)} · +${m.xp} XP</small></div></div>
    <button class="btn b-maroon wide" id="nGo">${i<d0?'Bertarung lagi':'Bertarung'}</button></div>`}
  sh.innerHTML=h;sh.classList.add('on');sh.querySelector('[data-x]').onclick=()=>sh.classList.remove('on');
  const go2=$('nGo');if(go2)go2.onclick=()=>{sh.classList.remove('on');if(nd.t==='p'){S.hero.hp=heroMax();const pr=rprog(RJ);pr.d=Math.max(pr.d,i+1);save();rbar();drawRMap();toast('Nyawa pulih penuh.')}else battle(i)}}
/* ---------- pertempuran ---------- */
function stageSvg(m){const [a,b]=m.sky,night=m===MON.ghaflah||m===MON.takabbur;
  let s=`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="240" fill="url(#sky)"/>`;
  if(night){for(let i=0;i<26;i++)s+=`<circle cx="${(i*53)%400}" cy="${(i*37)%110}" r="${i%3?1:1.6}" fill="#fff" opacity=".8"/>`;s+=`<circle cx="318" cy="46" r="17" fill="#fff8e6"/><circle cx="326" cy="42" r="15" fill="${a}"/>`}
  else s+=`<circle cx="318" cy="52" r="24" fill="#fffbe8" opacity=".95"/>`;
  [[60,40,1],[250,28,.8]].forEach(([x,y,k])=>{s+=`<g opacity=".8" transform="translate(${x} ${y}) scale(${k})"><circle r="16" fill="#fff"/><circle cx="18" cy="4" r="13" fill="#fff"/><circle cx="-16" cy="5" r="11" fill="#fff"/></g>`});
  s+=m===MON.takabbur?`<path d="M250 150V100h12v-10h10v10h16V84l12-14 12 14v16h16v-10h10v10h12v50Z" fill="#6a3a5a" opacity=".55"/>`:`<g opacity=".55"><path d="M286 150V122h44v28Z" fill="#fff6e4"/><path d="M292 122Q308 96 324 122Z" fill="#f0c85a"/><rect x="334" y="94" width="7" height="56" rx="3" fill="#fff6e4"/></g>`;
  s+=`<path d="M0 160Q100 122 200 150T400 140V240H0Z" fill="${night?'#b8a8d0':'#f0cf98'}"/><path d="M0 186Q140 160 260 180T400 176V240H0Z" fill="${night?'#a090c0':'#e6b880'}"/><rect y="204" width="400" height="36" fill="${night?'#8a7ab0':'#dca870'}"/>`;
  s+=`<g id="shieldFx" opacity="0"><ellipse cx="104" cy="160" rx="48" ry="58" fill="rgba(255,226,120,.2)" stroke="#ffe08a" stroke-width="3"/></g><g id="heroG" class="spr idle"><use href="#hero" x="64" y="104" width="80" height="106"/></g>`;
  const big=m===MON.takabbur;s+=`<g id="monG" class="spr ${m===MON.waswas||m===MON.ghaflah?'float':'idle'}"><use href="#${m.sym}" x="${big?198:226}" y="${big?70:96}" width="${big?142:112}" height="${big?142:116}"/></g><path id="slash" d="M240 112Q285 150 330 198" stroke="#fff6c0" stroke-width="7" fill="none" stroke-linecap="round" opacity="0"/>`;
  $('bsvg').innerHTML=s}
function bhud(){const h=S.hero;$('hName').textContent='Santri Lv '+h.lv;$('hHpT').textContent=`${Math.max(0,Math.round(h.hp))}/${heroMax()}`;$('hHp').style.width=clamp(h.hp/heroMax()*100,0,100)+'%';
  $('eName').textContent=B.m.nm;$('eHpT').textContent=`${Math.max(0,Math.round(B.hp))}/${B.max}`;$('eHp').style.width=Math.max(0,B.hp/B.max*100)+'%';
  const can=!B.pam&&B.hp<=B.max*.5;$('cPam').disabled=rbusy||!can;$('pamS').textContent=B.pam?'Sudah dipakai':can?'Siap! Rantai 3 ayat':'Saat musuh ≤ 50%';document.querySelectorAll('.cmd:not(#cPam)').forEach(b=>b.disabled=rbusy)}
const rlog=t=>{$('log').textContent=t};
function anim(id,cls){const e=$(id);if(!e)return;const base=id==='monG'?(B&&(B.m===MON.waswas||B.m===MON.ghaflah)?'float':'idle'):'idle';e.setAttribute('class','spr');void e.getBoundingClientRect();e.setAttribute('class','spr '+cls);setTimeout(()=>{if(e.isConnected&&!e.classList.contains('die'))e.setAttribute('class','spr '+base)},cls==='die'?2000:520)}
function num(x,y,t,c){const s=document.createElement('div');s.className='dmg';s.textContent=t;s.style.left=x+'%';s.style.top=y+'%';s.style.color=c;$('stage').append(s);setTimeout(()=>s.remove(),1200)}
function battle(i){const nd=RN[i],m=MON[nd.t==='b'?'takabbur':MORD[nd.k]],sc=1+tierOf(RJ)*.15;const X=juzPool(RJ),Pl=nd.t==='b'?X:segPool(RJ,nd.k);
  B={i,nd,m,P:Pl,X,hp:Math.round(m.hp*sc),max:Math.round(m.hp*sc),atk:Math.round(m.atk*sc),shield:0,pam:0,wrong:0,turns:0};rbusy=false;
  $('rMapV').hidden=true;$('rBatV').hidden=false;stageSvg(m);bhud();rlog(`${m.nm} menghadang! Soal dari ${nd.t==='b'?'seluruh Juz '+RJ:segLabel(RJ,nd.k)}. Pilih jurus.`)}
document.querySelector('.cmds').addEventListener('click',e=>{const b=e.target.closest('.cmd');if(!b||b.disabled||rbusy||!B)return;act(b.dataset.c)});
function act(c){rbusy=true;bhud();B.turns++;if(c==='pam')return chain();
  const q=ask({serang:'sambung',lindung:'lengkapi',pulih:'susun'}[c],B.P,B.X,RJ);if(!q){rbusy=false;bhud();return}
  openQ(q,{title:{serang:'Serang',lindung:'Lindung',pulih:'Pulih'}[c],sub:q.label,onAnswer(ok){if(!ok){B.wrong++;rlog(c==='serang'?'Seranganmu meleset.':c==='lindung'?'Perisaimu gagal terbentuk.':'Doamu belum sempurna, nyawa tidak pulih.');return 'Jurus gagal'}
      if(c==='serang'){const d=Math.round(heroAtk()*(.9+rnd0()*.25));hitMon(d);rlog(`Tebasan Nur! ${B.m.nm} kehilangan ${d} nyawa.`);return `-${d} nyawa musuh`}
      if(c==='lindung'){B.shield=1;$('shieldFx').setAttribute('opacity','1');const d=8+S.hero.lv*2;hitMon(d,true);rlog(`Perisai hafalan terbentuk. Serangan berikutnya tertahan, balasan ${d}.`);return 'Perisai aktif'}
      const h=Math.round(heroMax()*.4);S.hero.hp=Math.min(heroMax(),S.hero.hp+h);num(25,45,'+'+h,'#5ab44a');bhud();rlog(`Nyawamu pulih ${h}.`);return `+${h} nyawa`},
    onNext(){closeQ();after()}})}
function hitMon(d,soft){B.hp-=d;anim('heroG','lungeR');setTimeout(()=>{const sl=$('slash');sl.setAttribute('class','');void sl.getBoundingClientRect();sl.setAttribute('class','slash');sl.setAttribute('opacity','1');anim('monG','hit');num(75,40,'-'+d,soft?'#3fb0a0':'#e0902a');bhud()},200)}
function chain(){const P_=B.P,runs=[];for(let i=0;i<P_.length-1;i++){let L=0;while(i+L+1<P_.length&&P_[i+L+1][0]===P_[i][0]&&L<3)L++;if(L>=1)runs.push([i,L])}
  const best=runs.filter(r=>r[1]===3);const [k0,L]=pick(best.length?best:runs)||[0,1];B.pam=1;let i=0,all=true;
  const step=()=>{const q=GEN.sambung(P_,B.X,RJ,k0+i);if(!q){closeQ();after();return}openQ(q,{title:`Pamungkas ${i+1}/${L}`,sub:'Rantai ayat beruntun',onAnswer(ok){if(!ok){all=false;B.wrong++;rlog('Rantai terputus.');return 'Rantai putus'}const d=Math.round(heroAtk()*.9);hitMon(d);return `-${d} · rantai ${i+1}/${L}`},
    onNext(ok){if(ok&&i<L-1){i++;step();return}closeQ();if(ok&&all){const d=Math.round(heroAtk()*1.3);setTimeout(()=>{hitMon(d);num(75,25,'Sempurna!','#a03c4c');rlog(`Rantai sempurna! Pukulan pamungkas ${d}.`);setTimeout(after,700)},300)}else after()}})};step()}
function after(){if(B.hp<=0)return rwin();setTimeout(enemyTurn,500)}
function enemyTurn(){if(!B)return;anim('monG','lungeL');setTimeout(()=>{if(B.shield){B.shield=0;$('shieldFx').setAttribute('opacity','0');num(25,40,'Tertahan','#d09a2a');rlog(`${B.m.nm} menyerang, tapi perisaimu menahannya.`)}
  else{const d=Math.round(B.atk*(.85+rnd0()*.35));S.hero.hp-=d;anim('heroG','hit');num(25,40,'-'+d,'#e05a5a');rlog(`${B.m.nm} menyerang! Kamu kehilangan ${d} nyawa.`)}
  bhud();if(S.hero.hp<=0)return rlose();rbusy=false;bhud();save()},260)}
function rwin(){anim('monG','die');rbusy=true;bhud();const stars=B.wrong===0?3:B.wrong<=2?2:1,pr=rprog(RJ),boss=B.nd.t==='b';pr.st[B.i]=Math.max(pr.st[B.i]||0,stars);pr.d=Math.max(pr.d,B.i+1);
  S.hero.xp+=B.m.xp;let up=0;while(S.hero.xp>=heroNeed()){S.hero.xp-=heroNeed();S.hero.lv++;up++;S.hero.hp=heroMax()}const gold=boss?40:10;S.gold+=gold;if(boss)S.t[RJ]=Object.assign(S.t[RJ]||{},{open:1});save();
  const msg=`<p>${esc(B.m.nm)} dikalahkan dalam ${B.turns} giliran${B.wrong?`, dengan ${B.wrong} jawaban keliru`:' tanpa satu pun jawaban keliru'}.</p><p><b>+${B.m.xp} XP · +${gold} emas</b>${up?`<br>Naik ke Lv ${S.hero.lv}! Nyawa maks ${heroMax()}, serangan ${heroAtk()}.`:''}</p>`;
  setTimeout(()=>{if(boss)modal(`<header>Juz ${RJ} terbuka!<small>Awan di atas wilayahnya menghilang</small></header><div class="stars">${[0,1,2].map(i=>STAR(i<stars)).join('')}</div>${msg}<p>Sekarang rebut wilayahnya lewat Duel Ayat.</p>`,[{t:'Kembali ke peta',f:()=>{const j=RJ;B=null;hubReturn({type:'open',j})}}]);
    else modal(`<header>Menang!</header><div class="stars">${[0,1,2].map(i=>STAR(i<stars)).join('')}</div>${msg}`,[{t:'Lanjut perjalanan',f:()=>{B=null;showRMap()}}])},900)}
function rlose(){rbusy=true;S.hero.hp=Math.round(heroMax()*.6);save();modal(`<header class="grey">Kamu terjatuh</header><p>${esc(B.m.nm)} masih terlalu kuat. Ulangi dulu hafalan ${esc(B.nd.t==='b'?'Juz '+RJ:segLabel(RJ,B.nd.k))}, lalu kembali bertarung.</p><p>Nyawamu dipulihkan ke 60%.</p>`,[{t:'Kembali ke peta perjalanan',f:()=>{B=null;showRMap()}}])}
$('bFlee').onclick=()=>{if(rbusy)return;B=null;showRMap()};
$('rBack').onclick=()=>{if(B&&rbusy)return;B=null;closeQ();hubReturn(null)};
