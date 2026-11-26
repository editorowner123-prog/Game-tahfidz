/* ===== core.js — data, tingkat, state, mesin soal, UI bersama ===== */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd0=()=>Math.random(),pick=a=>a[Math.floor(rnd0()*a.length)],rnd=(a,b)=>a+rnd0()*(b-a);
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd0()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const AD=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const NUM=n=>`<span class="num">﴿${AD(n)}﴾</span>`;
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function mulb(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- struktur materi ---------- */
const ORDER=[30,29,28,27,26,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
const TIERS=[
  {nm:'Desa',roof:'#d06a5c',flag:'#c0505a',g:['#b6dd7e','#aed676']},
  {nm:'Kecamatan',roof:'#44a39c',flag:'#2f8a84',g:['#acda84','#a4d27c']},
  {nm:'Kabupaten',roof:'#5d8bd0',flag:'#4a74b8',g:['#a8d68c','#9fce84']},
  {nm:'Provinsi',roof:'#9a62b0',flag:'#84509a',g:['#b2da84','#a9d27c']},
  {nm:'Negara',roof:'#3f9d6c',flag:'#2f8458',g:['#b9dc86','#b0d47e']},
  {nm:'Benua',roof:'#d8922f',flag:'#c07a1e',g:['#bfdd88','#b5d580']}];
const tierJuz=t=>ORDER.slice(t*5,t*5+5);
const tierOf=j=>Math.floor(ORDER.indexOf(j)/5);
const tierRange=t=>{const a=tierJuz(t);return `Juz ${a[0]}–${a[4]}`};
const SUR=[];const JZ={};
const loadJuz=j=>JZ[j]?Promise.resolve(JZ[j]):fetch(`data/juz${j}.json`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>(JZ[j]=d));
const loadTier=t=>Promise.all(tierJuz(t).map(loadJuz));
const segPool=(j,k)=>{const d=JZ[j],[a,b]=d.segs[k];return d.v.slice(a,b+1)};
const juzPool=j=>JZ[j].v;
const ref=it=>`${SUR[it[0]].name}: ${it[1]}`;
function segLabel(j,k){const p=segPool(j,k),f=p[0],l=p[p.length-1];return f[0]===l[0]?`${SUR[f[0]].name} ${f[1]}–${l[1]}`:`${SUR[f[0]].name} ${f[1]} – ${SUR[l[0]].name} ${l[1]}`}
function juzLabel(j){const v=JZ[j].v,f=v[0],l=v[v.length-1];return `${SUR[f[0]].name} ${f[1]} – ${SUR[l[0]].name} ${l[1]}`}

/* ---------- state ---------- */
const KEY='benteng-huffazh-v2';
const DEF=()=>({tier:0,view:0,gold:0,pas:0,skip:0,tut:0,hero:{lv:1,xp:0,hp:100},t:{30:{open:1,own:1}},b:{},r:{}});
let S=DEF();S.v=2;let KEYP=KEY,MAXJ=30;
const save=()=>{S._ts=Date.now();store.set(KEYP,S);if(window.netSimpanNanti)netSimpanNanti()};
const juzOk=j=>ORDER.indexOf(j)<MAXJ;
const maxTier=()=>Math.min(5,Math.floor((MAXJ-1)/5));
const now=()=>Date.now()+S.skip*864e5;
const RATE=[0,25,15,8];
const bkey=(j,q)=>j+'-'+q;
const bget=(j,q)=>S.b[bkey(j,q)];
const str=(j,q)=>{const b=bget(j,q);if(!b||!b.lv)return 0;return clamp(b.s-RATE[b.lv]*(now()-b.t)/864e5,0,100)};
const setStr=(j,q,v)=>{const b=bget(j,q);if(!b)return;b.s=clamp(v,0,100);b.t=now()};
const tst=j=>S.t[j]||{};
const owned=j=>!!tst(j).own,isOpen=j=>!!tst(j).open;
const builtIn=t=>tierJuz(t).reduce((n,j)=>n+[0,1,2,3].filter(q=>bget(j,q)&&bget(j,q).lv>0).length,0);
const tierDone=t=>tierJuz(t).every(owned)&&builtIn(t)===20;
const nextLocked=t=>{const js=tierJuz(t);const i=js.findIndex(j=>!isOpen(j));return i<0?null:js[i]};
const nextRival=t=>tierJuz(t).find(j=>isOpen(j)&&!owned(j))||null;
const heroMax=()=>100+(S.hero.lv-1)*12,heroAtk=()=>20+(S.hero.lv-1)*4,heroNeed=()=>S.hero.lv*60;

/* ---------- mesin soal (berbasis potongan ayat) ---------- */
const STRIP=/[ۖ-ۜ۞۩]/g,DIAC=/[ؐ-ًؚ-ٰٟۖ-ۭـ\u08D3-\u08FF]/g;
const words=t=>t.replace(STRIP,'').split(/\s+/).filter(Boolean);
const sk=w=>w.replace(DIAC,'').replace(/[ٱأإآ]/g,'ا').replace(/ى/g,'ي');
function trunc(texts){for(let n=5;n<80;n++){const o=texts.map(t=>{const w=t.split(' ');return w.length>n?w.slice(0,n).join(' ')+' …':t});if(new Set(o).size===o.length)return o}return texts}
const tail=(t,n=16)=>{const w=t.split(' ');return w.length>n+3?'… '+w.slice(-n).join(' '):t};
const GEN={
  sambung(P,X,j,ii){const C=[];for(let i=0;i<P.length-1;i++)if(P[i+1][0]===P[i][0])C.push(i);if(!C.length)return null;const i=ii!=null?ii:pick(C);if(!P[i+1]||P[i+1][0]!==P[i][0])return null;
    const cur=P[i],nxt=P[i+1],acc=new Set([nxt[2]]);X.forEach((x,k)=>{if(x[2]===cur[2]&&X[k+1]&&X[k+1][0]===x[0])acc.add(X[k+1][2])});
    const bad=t=>acc.has(t)||t===cur[2];let ds=shuf([...new Set(P.map(x=>x[2]).filter(t=>!bad(t)))]).slice(0,2);
    if(ds.length<2)for(const x of shuf(X)){if(ds.length>=2)break;if(!bad(x[2])&&!ds.includes(x[2]))ds.push(x[2])}if(ds.length<2)return null;
    const opts=shuf([{t:nxt[2],ok:1},...ds.map(t=>({t,ok:0}))]);const sh=trunc(opts.map(o=>o.t));opts.forEach((o,k)=>o.h=sh[k]);
    return{type:'sambung',label:'Sambung ayat',cap:'Ayat apa yang datang setelah ini?',ar:tail(cur[2]),num:cur[1],opts,rev:nxt}},
  lengkapi(P,X){const C=P.filter(x=>words(x[2]).length>=3);if(!C.length)return null;const it=pick(C),ws=words(it[2]);let ix=ws.map((w,i)=>i).filter(i=>sk(ws[i]).length>=3);if(!ix.length)ix=ws.map((w,i)=>i);
    const bi=pick(ix),ans=ws[bi],as=sk(ans),skA=new Set(X.map(x=>words(x[2]).map(sk).join(' '))),seen=new Set([as]),pool=[];
    const add=L=>{for(const x of L)for(const w of words(x[2])){const s=sk(w);if(seen.has(s)||s.length<2)continue;const alt=ws.map((y,i)=>i===bi?s:sk(y)).join(' ');if(skA.has(alt))continue;seen.add(s);pool.push(w)}};
    add(P);if(pool.length<4)add(shuf(X).slice(0,30));
    const near=shuf(pool).sort((a,b)=>Math.abs(sk(a).length-as.length)-Math.abs(sk(b).length-as.length));const ds=shuf(near.slice(0,6)).slice(0,2);if(ds.length<2)return null;
    const lo=Math.max(0,bi-7),hi=Math.min(ws.length,bi+8);
    const html=(lo>0?'… ':'')+ws.slice(lo,hi).map((w,i)=>i+lo===bi?'<span class="blank">؟</span>':esc(w)).join(' ')+(hi<ws.length?' …':'');
    return{type:'lengkapi',label:'Lengkapi kata',cap:'Kata apa yang hilang?',html,num:it[1],opts:shuf([{h:ans,ok:1},...ds.map(t=>({h:t,ok:0}))]),rev:it}},
  susun(P){let C=P.filter(x=>{const l=words(x[2]).length;return l>=3&&l<=7}),part=false,it,ws;
    if(C.length){it=pick(C);ws=words(it[2])}else{C=P.filter(x=>words(x[2]).length>=8);if(!C.length)return null;it=pick(C);ws=words(it[2]).slice(0,6);part=true}
    let ch,g=0;do{ch=shuf(ws)}while(g++<20&&ch.every((w,i)=>w===ws[i]));
    return{type:'susun',label:part?'Susun awal ayat':'Susun ayat',cap:`Ketuk kata sesuai urutan ${part?'awal ':''}QS ${ref(it)}`,words:ws,chips:ch,rev:it}},
  tebak(P,X,j){const it=pick(P),ss=[...new Set(X.map(x=>x[0]))];let opts;
    if(ss.length>=3){opts=shuf([it[0],...shuf(ss.filter(s=>s!==it[0])).slice(0,2)]).map(s=>({h:SUR[s].name,ar:SUR[s].ar,ok:s===it[0]?1:0}));return{type:'tebak',label:'Tebak surah',cap:'Ayat ini dari surah apa?',ar:tail(it[2],24),opts,lat:1,rev:it}}
    const d=JZ[j];if(!d)return null;const xi=d.v.indexOf(it);const si=d.segs.findIndex(([a,b])=>xi>=a&&xi<=b);if(si<0)return null;
    opts=shuf([si,...shuf([0,1,2,3].filter(k=>k!==si)).slice(0,2)]).map(k=>({h:`Bagian ${k+1}`,sub:segLabel(j,k),ok:k===si?1:0}));
    return{type:'tebak',label:'Tebak letak',cap:`Ayat ini ada di bagian mana dari Juz ${j}?`,ar:tail(it[2],24),opts,lat:1,rev:it}}
};
function ask(type,P,X,j){for(const k of [type,'sambung','lengkapi','susun']){const q=GEN[k](P,X,j);if(q)return q}return null}

/* ---------- UI bersama ---------- */
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),3200)}
function modal(html,btns){$('mc').innerHTML=html+`<div class="mrow">${btns.map((b,i)=>`<button class="btn ${b.c||'b-green'}" data-i="${i}">${esc(b.t)}</button>`).join('')}</div>`;$('modal').classList.add('on');
  $('mc').querySelectorAll('.mrow .btn').forEach(el=>el.onclick=()=>{$('modal').classList.remove('on');const f=btns[+el.dataset.i].f;f&&f()})}
const STAR=on=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" fill="${on?'#f6cf55':'#e3d8c4'}" stroke="${on?'#d09a2a':'#cdbfa6'}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
let qOpenFlag=false;
function openQ(q,o){qOpenFlag=true;$('qT').innerHTML=`${esc(o.title||q.label)}<small>${esc(o.sub||q.label)}</small>`;$('qD').innerHTML=o.dots||'';$('qX').hidden=!o.onClose;
  $('qX').onclick=()=>{closeQ();o.onClose&&o.onClose()};renderQ(q,$('qb'),o);$('qs').classList.add('on');$('qs').scrollTop=0}
function closeQ(){qOpenFlag=false;$('qs').classList.remove('on')}
function renderQ(q,el,o){q.miss=0;q.pos=0;q.done=0;let h=`<p class="cap">${esc(q.cap)}</p>`;
  if(q.type==='susun')h+=`<div class="slot ar"></div><div class="chips">${q.chips.map(w=>`<button type="button" class="chip" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
  else h+=`<div class="qcard"><p class="ar">${q.html||esc(q.ar)}${q.type!=='tebak'?' '+NUM(q.num):''}</p></div>`+q.opts.map((x,k)=>q.lat?`<button type="button" class="opt lat" data-k="${k}"><b>${esc(x.h)}</b><span class="${x.ar?'ara':'sub'}">${esc(x.ar||x.sub||'')}</span></button>`:`<button type="button" class="opt" data-k="${k}">${esc(x.h)}</button>`).join('');
  el.innerHTML=h+'<div class="fbw"></div>';
  const fin=ok=>{q.done=1;q.res=ok?1:0;const r=q.rev;const extra=o.onAnswer?o.onAnswer(ok)||'':'';
    const msg=ok?'Benar!':(q.type==='tebak'?'Belum tepat.':'Belum tepat. Begini yang benar:');const w=el.querySelector('.fbw');
    w.innerHTML=`<div class="fb ${ok?'ok':'bad'}"><h4>${esc(msg)}${extra?` <small>${esc(extra)}</small>`:''}</h4><p class="ar">${esc(r[2])} ${NUM(r[1])}</p><p class="tr">${esc(r[3])} <i>(QS ${esc(ref(r))})</i></p></div><button type="button" class="btn b-green wide nx">${esc(o.nextLabel||'Lanjut')}</button>`;
    w.querySelector('.nx').onclick=()=>{if(o.onNext)o.onNext(ok)};w.scrollIntoView({behavior:'smooth',block:'nearest'})};
  el.onclick=e=>{if(q.done)return;const b=e.target.closest('.opt');
    if(b){const ok=!!q.opts[+b.dataset.k].ok;b.classList.add(ok?'ok':'bad');if(!ok)el.querySelector(`.opt[data-k="${q.opts.findIndex(x=>x.ok)}"]`).classList.add('ok');el.querySelectorAll('.opt').forEach(x=>x.disabled=true);fin(ok);return}
    const c=e.target.closest('.chip');if(!c||c.classList.contains('used'))return;const slot=el.querySelector('.slot');
    if(c.dataset.w===q.words[q.pos]){c.classList.add('used');slot.insertAdjacentText('beforeend',(q.pos?' ':'')+q.words[q.pos]);q.pos++;if(q.pos===q.words.length){el.querySelector('.chips').classList.add('done');fin(q.miss===0)}}
    else{q.miss++;c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');if(q.miss>=3){slot.textContent=q.words.join(' ');el.querySelector('.chips').classList.add('done');fin(false)}}}}
const dotsOf=(qs,i)=>qs.map((q,k)=>`<i class="${q.res===1?'ok':q.res===0?'bad':k===i?'now':''}"></i>`).join('');

/* ---------- layar ---------- */
const SCREENS=['hub','rihlah','duel','garda'];let CUR='hub';
function go(name){CUR=name;SCREENS.forEach(s=>$(s).hidden=s!==name);closeQ();document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('on'))}
