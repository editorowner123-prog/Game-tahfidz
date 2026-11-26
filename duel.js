/* ===== duel.js — Duel Ayat: perang merebut wilayah ===== */
const dcv=$('dcv'),dctx=dcv.getContext('2d');const AW=360,AH=440,LANE=180,EF=70,MF=370,RIV=220;
let dsc=1,dox=0,doy=0,DT=0,drun=false,dJ=null,dtime=180,pz=null,bot=null,dst=null,DPOOL=[],units=[],dparts=[],shE=0,shM=0,reinf=0,reinfT=0,dlast=0,dloop=false;
const MF_={hp:1000},EF_={hp:1000};let GHO=null,REC=[];
const rec=(ty,n)=>{if(!drun)return;const t=Math.round((180-dtime)*1000);REC.push(n!=null?[t,ty,n]:[t,ty])};
function updGhost(){const el=(180-dtime)*1000,ev=GHO.ev;while(GHO.i<ev.length&&ev[GHO.i][0]<=el){const e=ev[GHO.i++],ty=e[1];if(ty===4){GHO.len=e[2]||1;GHO.pos=0}else if(ty===1){GHO.pos++;spawnU(-1,1)}else if(ty===2||ty===3)spawnU(-1,ty===2?4:3)}$('oProg').style.width=(GHO.len?Math.min(100,GHO.pos/GHO.len*100):0)+'%'}
const DIFF={mudah:{nm:'mudah',iv:[2.5,3.5],err:.22},sedang:{nm:'sedang',iv:[1.7,2.5],err:.12},sulit:{nm:'sulit',iv:[1.1,1.7],err:.07}};
const TDIFF=['mudah','sedang','sedang','sulit','sulit','sulit'];
function dresize(){const r=$('arena').getBoundingClientRect();if(!r.width)return;const d=Math.min(2,devicePixelRatio||1);dcv.width=r.width*d;dcv.height=r.height*d;dsc=Math.min(r.width/AW,r.height/AH);dox=(r.width-AW*dsc)/2;doy=(r.height-AH*dsc)/2}
new ResizeObserver(()=>dresize()).observe($('arena'));
const DDEC=(()=>{let s=3;const rr=()=>{s=(s*9301+49297)%233280;return s/233280};const a=[];for(let i=0;i<26;i++){const side=rr()<.5;a.push({x:side?rr()*120+6:AW-6-rr()*120,y:rr()*AH,s:.7+rr()*.6})}return a.filter(d=>Math.abs(d.y-RIV)>26&&d.y>110&&d.y<AH-110)})();
function fortD(cx,cy,me,shake,roofC){const g=dctx;g.save();g.translate(cx+(shake>0?Math.sin(DT*70)*3:0),cy);const roof=me?roofC:'#7aa8e8',roofD=me?C(roofC,-.2):'#5a88cc',wall=me?'#fbf1dc':'#eef4fb',wallD=me?'#e6d2ac':'#cfdcec';
  const sh=g.createRadialGradient(0,28,4,0,28,80);sh.addColorStop(0,'rgba(60,80,40,.28)');sh.addColorStop(1,'rgba(60,80,40,0)');g.fillStyle=sh;g.beginPath();g.ellipse(0,28,80,18,0,0,7);g.fill();
  g.fillStyle=wallD;g.beginPath();g.roundRect(-58,-8,116,38,6);g.fill();g.fillStyle=wall;g.beginPath();g.roundRect(-58,-12,116,32,6);g.fill();for(let x=-56;x<56;x+=14){g.fillStyle=wall;g.beginPath();g.roundRect(x,-19,9,10,2);g.fill()}
  g.fillStyle='#b07a52';g.beginPath();g.moveTo(-12,30);g.lineTo(-12,8);g.quadraticCurveTo(0,-6,12,8);g.lineTo(12,30);g.fill();
  for(const tx of[-62,62]){const gr=g.createLinearGradient(tx-15,0,tx+15,0);gr.addColorStop(0,wall);gr.addColorStop(1,wallD);g.fillStyle=gr;g.beginPath();g.roundRect(tx-15,-32,30,62,8);g.fill();g.fillStyle=roof;g.beginPath();g.moveTo(tx-19,-30);g.quadraticCurveTo(tx,-36,tx,-62);g.quadraticCurveTo(tx,-36,tx+19,-30);g.closePath();g.fill();g.fillStyle=roofD;g.beginPath();g.moveTo(tx,-62);g.quadraticCurveTo(tx,-36,tx+19,-30);g.lineTo(tx+4,-30);g.fill();g.fillStyle='#8fb4d4';g.beginPath();g.roundRect(tx-3.5,-18,7,11,3.5);g.fill()}
  g.fillStyle=wall;g.beginPath();g.roundRect(-21,-40,42,32,6);g.fill();g.fillStyle=roof;g.beginPath();g.moveTo(-27,-38);g.quadraticCurveTo(0,-44,0,-66);g.quadraticCurveTo(0,-44,27,-38);g.closePath();g.fill();
  g.strokeStyle='#8a6a4a';g.lineWidth=2;g.beginPath();g.moveTo(0,-66);g.lineTo(0,-88);g.stroke();g.fillStyle=me?'#f0c85a':'#cfe0f6';g.beginPath();g.moveTo(0,-88);for(let k=1;k<=5;k++)g.lineTo(k*4,-88+Math.sin(DT*6-k)*1.6);for(let k=5;k>=0;k--)g.lineTo(k*4,-78+Math.sin(DT*6-k)*1.6);g.fill();g.restore()}
function hpBarD(cx,y,hp,me){const g=dctx,w=124;g.fillStyle='rgba(255,250,242,.95)';g.beginPath();g.roundRect(cx-w/2-3,y-3,w+6,16,8);g.fill();g.fillStyle=me?'#ffb870':'#8ac0f6';g.beginPath();g.roundRect(cx-w/2,y,Math.max(6,w*clamp(hp,0,1500)/1000*(1000/Math.max(1000,hp>1000?hp:1000))),10,5);g.fill();
  g.font="800 11px 'Baloo 2',sans-serif";g.textAlign='center';g.textBaseline='middle';g.fillStyle=me?'#8a3a2a':'#2f5a9a';g.fillText(Math.max(0,Math.ceil(hp)),cx,y+5.5)}
function unitD(u){const g=dctx,me=u.side>0,big=u.p>1,r=big?11:7,b=Math.sin(DT*10+u.ph)*1.5;g.save();g.translate(u.x,u.y);g.fillStyle='rgba(60,80,40,.2)';g.beginPath();g.ellipse(0,r*.9,r,r*.4,0,0,7);g.fill();
  if(big){g.strokeStyle='#8a6a4a';g.lineWidth=1.6;g.beginPath();g.moveTo(r*.7,-r*.2+b);g.lineTo(r*.7,-r*2.4+b);g.stroke();g.fillStyle=me?'#f0c85a':'#cfe0f6';g.fillRect(r*.7,-r*2.4+b,9,6)}
  const gr=g.createRadialGradient(-r*.3,-r*.4+b,1,0,b,r*1.3);gr.addColorStop(0,me?'#fffbec':'#f4faff');gr.addColorStop(1,me?'#f6cf6a':'#8cc4f4');g.fillStyle=gr;g.beginPath();g.arc(0,b,r,0,7);g.fill();
  g.fillStyle=me?C(TIERS[tierOf(dJ)].roof):'#5a88cc';g.beginPath();g.arc(0,b-r*.2,r*.95,Math.PI*1.05,Math.PI*1.95);g.fill();
  g.fillStyle='#4a3028';g.beginPath();g.arc(-r*.3,b+(me?-r*.05:r*.1),1.3,0,7);g.arc(r*.3,b+(me?-r*.05:r*.1),1.3,0,7);g.fill();
  g.globalAlpha=.3+.2*Math.sin(DT*8+u.ph);g.fillStyle=me?'#fff0b0':'#d8ecff';g.beginPath();g.arc(0,b,r+4,0,7);g.fill();g.globalAlpha=1;
  if(big){g.font="800 10px 'Baloo 2',sans-serif";g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.strokeStyle=me?'#a03c4c':'#2f5a9a';g.lineWidth=3;g.strokeText(u.p,0,b+r+8);g.fillText(u.p,0,b+r+8)}g.restore()}
function dspark(x,y,cols,n=10,sp=60){for(let i=0;i<n;i++)dparts.push({x,y,vx:rnd(-sp,sp),vy:rnd(-sp,sp*.3),l:.6,m:.6,c:pick(cols),s:rnd(1.5,3.2)})}
function spawnU(side,p){units.push({side,p,x:LANE+rnd(-16,16),y:side>0?MF-34:EF+34,ph:rnd0()*6})}
function drawD(){const g=dctx;g.setTransform(1,0,0,1,0,0);g.fillStyle='#b4dc84';g.fillRect(0,0,dcv.width,dcv.height);const k=dcv.width/($('arena').getBoundingClientRect().width||1);g.setTransform(dsc*k,0,0,dsc*k,dox*k,doy*k);
  const gg=g.createLinearGradient(0,0,0,AH);gg.addColorStop(0,'#c2e494');gg.addColorStop(1,'#b0da84');g.fillStyle=gg;g.fillRect(-600,-600,AW+1200,AH+1200);
  for(let y=0;y<AH;y+=22)for(let x=(y/22%2)*22;x<AW;x+=44){g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x,y,22,22)}
  g.fillStyle='#f2dfb4';g.beginPath();g.roundRect(LANE-31,EF,62,MF-EF,20);g.fill();
  const rv=g.createLinearGradient(0,RIV-16,0,RIV+16);rv.addColorStop(0,'#bce8f8');rv.addColorStop(1,'#86ccec');g.fillStyle=rv;g.fillRect(-600,RIV-16,AW+1200,32);
  g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1.6;for(let x=-20;x<AW+20;x+=34){const xx=x+(DT*14)%34;g.beginPath();g.moveTo(xx,RIV+3);g.quadraticCurveTo(xx+6,RIV,xx+12,RIV+3);g.stroke()}
  g.fillStyle='#e0b47e';g.beginPath();g.roundRect(LANE-37,RIV-21,74,42,6);g.fill();g.fillStyle='#cc9a62';for(let y=RIV-18;y<RIV+20;y+=8)g.fillRect(LANE-37,y,74,2);
  for(const d of DDEC){g.fillStyle='rgba(60,80,40,.16)';g.beginPath();g.ellipse(d.x+3,d.y+10*d.s,12*d.s,5*d.s,0,0,7);g.fill();const tg=g.createRadialGradient(d.x-4*d.s,d.y-5*d.s,1,d.x,d.y,13*d.s);tg.addColorStop(0,'#9ad874');tg.addColorStop(1,'#5aa84a');g.fillStyle=tg;g.beginPath();g.arc(d.x,d.y,12*d.s,0,7);g.fill()}
  const roofC=TIERS[tierOf(dJ||30)].roof;fortD(LANE,EF-10,false,shE,roofC);fortD(LANE,MF+10,true,shM,roofC);
  units.sort((a,b)=>a.y-b.y).forEach(unitD);for(const q of dparts){g.globalAlpha=Math.max(0,q.l/q.m);g.fillStyle=q.c;g.beginPath();g.arc(q.x,q.y,q.s,0,7);g.fill()}g.globalAlpha=1;
  hpBarD(LANE,EF+30,EF_.hp,false);hpBarD(LANE,MF+46,MF_.hp,true)}
function duelPool(j){const out=[];for(const it of JZ[j].v){const w=words(it[2]);if(w.length>=3&&w.length<=9)out.push({it,w,part:false});else if(w.length>=10)out.push({it,w:w.slice(0,6),part:true})}return out}
function newTarget(){const t=pick(DPOOL);const sks=new Set(t.w.map(sk)),dec=[];for(let g=0;g<40&&dec.length<2;g++){const w=pick(pick(DPOOL).w);if(!sks.has(sk(w))&&!dec.includes(w))dec.push(w)}
  pz={...t,pos:0,perfect:true,stun:0,hand:shuf([...t.w.map(w=>({w})),...dec.map(w=>({w}))])};rec(4,pz.w.length);renderBoard()}
function renderBoard(){$('tgT').textContent=`${pz.part?'Awal ':''}QS ${ref(pz.it)}`;$('tgS').textContent=`${pz.pos}/${pz.w.length} kata`;
  $('slots').innerHTML=pz.w.map((w,i)=>i<pz.pos?`<span class="${i===pz.pos-1?'n':''}">${esc(w)}</span>`:'<span class="e"></span>').join('');
  $('hand').innerHTML=pz.hand.map((c,j)=>`<button class="card${c.used?' used':''}" data-j="${j}">${esc(c.w)}</button>`).join('')+(pz.stun>0?'<div class="stun">Tertahan<i><b></b></i></div>':'')}
$('hand').addEventListener('pointerdown',e=>{const b=e.target.closest('.card');if(!b||!drun||!pz||pz.stun>0)return;e.preventDefault();const c=pz.hand[+b.dataset.j];if(c.used)return;
  if(c.w===pz.w[pz.pos]){c.used=1;pz.pos++;dst.ok++;rec(1);spawnU(1,1);if(pz.pos===pz.w.length){dst.ayat++;rec(pz.perfect?2:3);spawnU(1,pz.perfect?4:3);if(pz.perfect)dst.perfect++;showDone(pz);const t=pz;pz=null;$('hand').innerHTML='';$('slots').innerHTML=t.w.map(w=>`<span class="n">${esc(w)}</span>`).join('');$('tgS').textContent=`${t.w.length}/${t.w.length} kata`;setTimeout(()=>{if(drun)newTarget()},700)}else renderBoard()}
  else{dst.bad++;rec(0);pz.perfect=false;pz.stun=1.2;b.classList.add('bad');setTimeout(()=>{if(!pz)return;renderBoard();const j=pz.hand.findIndex(x=>!x.used&&x.w===pz.w[pz.pos]);const el=$('hand').querySelector(`.card[data-j="${j}"]`);if(el)el.classList.add('hint')},350)}});
function showDone(t){const el=$('done');el.innerHTML=`<p>${t.perfect?'Sempurna! Pasukan 4':'Ayat selesai! Pasukan 3'}</p><div class="ar">${esc(t.it[2].split(' ').length>18?t.w.join(' ')+' …':t.it[2])} ${NUM(t.it[1])}</div><p>${esc(t.it[3].length>140?t.it[3].slice(0,140)+'…':t.it[3])}</p>`;el.classList.add('on');clearTimeout(showDone.h);showDone.h=setTimeout(()=>el.classList.remove('on'),2200)}
function newBot(){const t=pick(DPOOL);bot={len:t.w.length,pos:0,t:rnd(...DIFF[bot&&bot.d||'sedang'].iv),stun:0,perfect:true,d:bot?bot.d:'sedang'}}
function updBot(dt){const D_=DIFF[bot.d];if(bot.stun>0){bot.stun-=dt;return}bot.t-=dt;if(bot.t>0)return;bot.t=rnd(...D_.iv);if(rnd0()<D_.err){bot.stun=1.2;bot.perfect=false;return}
  bot.pos++;spawnU(-1,1);if(bot.pos>=bot.len){spawnU(-1,bot.perfect?4:3);const d=bot.d;bot=null;newBot();bot.d=d}$('oProg').style.width=(bot.pos/bot.len*100)+'%'}
function dstep(dt){DT+=dt;if(drun){dtime-=dt;if(pz&&pz.stun>0){pz.stun-=dt;if(pz.stun<=0){pz.stun=0;const s=$('hand').querySelector('.stun');if(s)s.remove()}}if(GHO)updGhost();else updBot(dt);
    if(reinf>0){reinfT-=dt;if(reinfT<=0){reinfT=1;reinf--;spawnU(1,1)}}
    const tm=Math.max(0,Math.ceil(dtime));$('timer').textContent=`${Math.floor(tm/60)}:${String(tm%60).padStart(2,'0')}`;$('timer').classList.toggle('low',tm<=30);if(dtime<=0)dfinish()}
  for(const u of units){u.y-=u.side*46*dt;u.x+=(LANE-u.x)*dt*.3}
  for(const a of units){if(a.p<=0||a.side<0)continue;for(const b of units){if(b.p<=0||b.side>0)continue;if(Math.abs(a.y-b.y)<14&&Math.abs(a.x-b.x)<26){const m=Math.min(a.p,b.p);a.p-=m;b.p-=m;dspark((a.x+b.x)/2,(a.y+b.y)/2,['#fff','#fff0b0','#cfe6ff'],12,70);if(a.p<=0)break}}}
  for(const u of units){if(u.p<=0)continue;if(u.side>0&&u.y<=EF+22){EF_.hp-=u.p*55;u.p=0;shE=.3;dspark(u.x,u.y,['#ffe07a','#fff','#ffb870'],16,90);if(drun&&EF_.hp<=0)dfinish()}
    else if(u.side<0&&u.y>=MF-22){MF_.hp-=u.p*55;u.p=0;shM=.3;dspark(u.x,u.y,['#cfe6ff','#fff','#8ac0f6'],16,90);if(drun&&MF_.hp<=0)dfinish()}}
  units=units.filter(u=>u.p>0);shE-=dt;shM-=dt;for(const q of dparts){q.l-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=120*dt}dparts=dparts.filter(q=>q.l>0)}
function dframe(now){const dt=Math.min(.05,(now-(dlast||now))/1000);dlast=now;if(CUR==='duel'){dstep(dt);drawD()}requestAnimationFrame(dframe)}
async function startDuel(j){dJ=j;DPOOL=duelPool(j);$('loadS').textContent='Mencari lawan…';$('load').hidden=false;const L=await netLawan(j);$('load').hidden=true;
  GHO=L&&L.jejak&&Array.isArray(L.jejak.ev)&&L.jejak.ev.length?{nama:L.nama,kel:L.kelompok,ev:L.jejak.ev,i:0,len:0,pos:0}:null;REC=[];go('duel');requestAnimationFrame(dresize);if(!dloop){dloop=true;requestAnimationFrame(dframe)}
  const d=TDIFF[tierOf(j)];units=[];dparts=[];MF_.hp=1000;EF_.hp=1000;dtime=180;dst={ok:0,bad:0,ayat:0,perfect:0};reinf=Math.min(S.pas,20);S.pas-=reinf;reinfT=2;save();
  $('dT').firstChild.textContent=GHO?`Bayangan ${GHO.nama}`:`Penguasa Juz ${j}`;$('dS').textContent=`${GHO?`rekaman terbaik ${GHO.kel==='asatidz'?'ustadz':'santri'}`:`lawan ${DIFF[d].nm}`}${reinf?` · bala bantuan ${reinf} pasukan`:''}`;$('oProg').style.width='0%';$('timer').textContent='3:00';
  pz=null;$('hand').innerHTML='';$('slots').innerHTML='';$('tgT').textContent='Bersiap…';$('tgS').textContent='';bot={d};newBot();bot.d=d;drun=false;
  let c=3;const el=$('count');el.hidden=false;const tick=()=>{el.innerHTML=`<span>${c>0?c:'Mulai!'}</span>`;if(c<0){el.hidden=true;drun=true;newTarget();return}c--;setTimeout(tick,c<0?700:850)};tick()}
function dfinish(){if(!drun)return;drun=false;pz=null;$('hand').innerHTML='';const me=Math.max(0,MF_.hp),op=Math.max(0,EF_.hp),r=op<=0&&me>0?'win':me<=0&&op>0?'lose':me>op?'win':op>me?'lose':'draw';
  const acc=dst.ok+dst.bad?Math.round(dst.ok/(dst.ok+dst.bad)*100):0,j=dJ,skor=Math.max(0,dst.ok*10+dst.perfect*20+dst.ayat*10-dst.bad*5),lawan=GHO?`bayangan ${GHO.nama}`:`Penguasa Juz ${j}`;if(REC.length>3)netRekam(j,{v:1,ev:REC},skor);const catR=NET.demo?'':`<p style="font-size:13px;color:var(--muted)">Skor duel ${skor}. Rekaman terbaikmu jadi bayangan bagi pemain lain.</p>`;if(r==='win'){S.t[j]=Object.assign(S.t[j]||{},{open:1,own:1});S.gold+=50;save()}
  const st=`<div class="grid2" style="padding:12px 16px 0"><div class="stat"><b>${Math.ceil(me)}</b>benteng kita</div><div class="stat"><b>${Math.ceil(op)}</b>benteng lawan</div><div class="stat"><b>${dst.ayat}</b>ayat tersusun (${dst.perfect} sempurna)</div><div class="stat"><b>${acc}%</b>ketukan tepat</div></div>`;
  setTimeout(()=>{if(r==='win')modal(`<header class="green">Juz ${j} direbut!<small>Benteng ${esc(lawan)} ${op<=0?'runtuh':'lebih rusak'}</small></header>${st}<p><b>+50 emas</b>. Wilayahnya kini milikmu.</p>${catR}`,[{t:'Ke wilayah baru',f:()=>hubReturn({type:'own',j})}]);
    else modal(`<header class="${r==='lose'?'blue':'grey'}">${r==='lose'?'Belum berhasil':'Seri'}<small>${r==='lose'?'Benteng kita lebih rusak':'Kedua benteng sama kuat'}</small></header>${st}<p>Wilayah masih dikuasai lawan. Ulangi hafalan Juz ${j}, atau tambah pasukan lewat Garda, lalu coba lagi.</p>${catR}`,[{t:'Duel lagi',f:()=>startDuel(j)},{t:'Kembali',c:'b-soft',f:()=>hubReturn(null)}])},600)}
$('dBack').onclick=()=>{drun=false;$('count').hidden=true;hubReturn(null)};
