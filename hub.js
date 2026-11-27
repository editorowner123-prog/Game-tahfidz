/* ===== hub.js — peta wilayah Benteng Huffazh ===== */
const cv=$('cv'),ctx=cv.getContext('2d');
let W=0,H=0,dpr=1,SS=2,T=0;
const cam={x:0,y:0,z:.72};let camT=null;
function resizeHub(){dpr=Math.min(2,devicePixelRatio||1);const ss=dpr>=2?2:1.5;if(ss!==SS){SS=ss;SPR.clear()}W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr}
const P=(i,j,z=0)=>[(i-j)*32,(i+j)*16-z];
const BB=3,BS=7,MM=BB*2+BS*3-1;
const TBLK=[[2,2],[2,1],[2,0],[1,0],[0,0]],DBLK=[[0,1,'kolam'],[0,2,'hutan'],[1,2,'kebun']];
const PLOT=[[0,0],[1,0],[0,1],[1,1]],KINDS=['rumah','menara','asrama','benteng'];
const KNM={rumah:'Rumah Santri',menara:'Menara Jaga',asrama:'Asrama',benteng:'Benteng'};
const COST={rumah:[0,40,100],menara:[0,60,150],asrama:[0,50,120],benteng:[0,90,220]};
let terr=[],plots=[],trees=[],lamps=[],GC=null,gox=0,goy=0,GS=1,masjid={gi:0,gj:0},sel=null,reveal={},parts=[],HZ=null;
const SPR=new Map();

/* ---------- warna & primitif lembut ---------- */
let DK=0;
function C(h,l=0){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;if(l>0){r+=(255-r)*l;g+=(255-g)*l;b+=(255-b)*l}else if(l<0){r*=1+l;g*=1+l;b*=1+l}if(DK>0){const m=DK*.72;r+=(158-r)*m;g+=(150-g)*m;b+=(138-b)*m}return`rgb(${r|0},${g|0},${b|0})`}
function poly(g,pts,f){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let k=1;k<pts.length;k++)g.lineTo(pts[k][0],pts[k][1]);g.closePath();g.fillStyle=f;g.fill()}
function vgr(g,y0,y1,c0,c1){const r=g.createLinearGradient(0,y0,0,y1);r.addColorStop(0,c0);r.addColorStop(1,c1);return r}
function line(g,pts,s,w){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let k=1;k<pts.length;k++)g.lineTo(pts[k][0],pts[k][1]);g.strokeStyle=s;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke()}
function shadowE(g,x,y,rx,ry,a=.26){g.save();g.translate(x,y);g.scale(1,ry/rx);const r=g.createRadialGradient(0,0,rx*.15,0,0,rx);r.addColorStop(0,`rgba(50,70,30,${a})`);r.addColorStop(1,'rgba(50,70,30,0)');g.fillStyle=r;g.beginPath();g.arc(0,0,rx,0,7);g.fill();g.restore()}
function box(g,i,j,w,d,z,h,col,noTop){const a=P(i,j,z+h),b=P(i+w,j,z+h),c=P(i+w,j+d,z+h),e=P(i,j+d,z+h),b0=P(i+w,j,z),c0=P(i+w,j+d,z),e0=P(i,j+d,z);
  poly(g,[e,c,c0,e0],vgr(g,e[1],e0[1],C(col,.14),C(col,-.03)));poly(g,[c,b,b0,c0],vgr(g,b[1],c0[1],C(col,-.1),C(col,-.22)));if(!noTop)poly(g,[a,b,c,e],C(col,.3));line(g,[e,c,b],'rgba(255,255,255,.5)',1)}
function roof(g,i,j,w,d,z,rh,col){const a=P(i,j,z),b=P(i+w,j,z),c=P(i+w,j+d,z),e=P(i,j+d,z);let r1,r2;
  const L=C(col,.1),Rr=C(col,-.2),Bk=C(col,-.08);
  if(Math.abs(w-d)<.01){r1=r2=P(i+w/2,j+d/2,z+rh);poly(g,[a,b,r1],Bk);poly(g,[a,e,r1],Bk);poly(g,[e,c,r1],vgr(g,r1[1],e[1],C(col,.22),L));poly(g,[c,b,r1],vgr(g,r1[1],c[1],C(col,-.05),Rr))}
  else if(w>d){r1=P(i+d/2,j+d/2,z+rh);r2=P(i+w-d/2,j+d/2,z+rh);poly(g,[a,b,r2,r1],Bk);poly(g,[a,e,r1],Bk);poly(g,[e,c,r2,r1],vgr(g,r1[1],e[1],C(col,.22),L));poly(g,[c,b,r2],vgr(g,r2[1],c[1],C(col,-.05),Rr))}
  else{r1=P(i+w/2,j+w/2,z+rh);r2=P(i+w/2,j+d-w/2,z+rh);poly(g,[a,b,r1],Bk);poly(g,[a,e,r2,r1],Bk);poly(g,[e,c,r2],vgr(g,r2[1],e[1],C(col,.22),L));poly(g,[c,b,r1,r2],vgr(g,r1[1],c[1],C(col,-.05),Rr))}
  line(g,[e,c,b],C(col,-.35),1.6);line(g,[c,r2],'rgba(255,255,255,.35)',1.2);return r1[1]<r2[1]?r1:r2}
function cyl(g,cx,cy,r,h,col){const top=cy-h,gr=g.createLinearGradient(cx-r,0,cx+r,0);gr.addColorStop(0,C(col,.1));gr.addColorStop(.38,C(col,.2));gr.addColorStop(1,C(col,-.24));
  g.fillStyle=gr;g.beginPath();g.moveTo(cx-r,top);g.lineTo(cx-r,cy);g.ellipse(cx,cy,r,r*.5,0,Math.PI,0,true);g.lineTo(cx+r,top);g.closePath();g.fill();
  g.fillStyle=C(col,.3);g.beginPath();g.ellipse(cx,top,r,r*.5,0,0,7);g.fill()}
function cone(g,cx,cy,r,h,col){const gr=g.createLinearGradient(cx-r,0,cx+r,0);gr.addColorStop(0,C(col,.12));gr.addColorStop(.35,C(col,.24));gr.addColorStop(1,C(col,-.25));
  g.fillStyle=gr;g.beginPath();g.moveTo(cx-r,cy);g.ellipse(cx,cy,r,r*.5,0,Math.PI,0,true);g.lineTo(cx,cy-h);g.closePath();g.fill();
  g.strokeStyle=C(col,-.35);g.lineWidth=1.4;g.beginPath();g.ellipse(cx,cy,r,r*.5,0,0,Math.PI);g.stroke()}
function crescent(g,x,y,r){g.beginPath();g.arc(x,y,r,Math.PI*.25,Math.PI*1.75);g.arc(x+r*.45,y,r*.8,Math.PI*1.7,Math.PI*.3,true);g.closePath();g.fillStyle='#e8b844';g.fill()}
function dome(g,x,y,r){g.fillStyle=C('#e0a83a');g.beginPath();g.ellipse(x,y,r*1.04,r*.5,0,0,7);g.fill();
  const gr=g.createRadialGradient(x-r*.4,y-r*1.1,r*.08,x,y-r*.5,r*1.5);gr.addColorStop(0,'#fffbe0');gr.addColorStop(.3,C('#f8d468'));gr.addColorStop(1,C('#c88a28'));
  g.fillStyle=gr;g.beginPath();g.moveTo(x-r,y);g.bezierCurveTo(x-r,y-r*1.2,x-r*.3,y-r*1.45,x,y-r*1.7);g.bezierCurveTo(x+r*.3,y-r*1.45,x+r,y-r*1.2,x+r,y);g.ellipse(x,y,r,r*.5,0,0,Math.PI);g.fill();
  line(g,[[x,y-r*1.7],[x,y-r*2.05]],'#d6a032',Math.max(1,r*.09));crescent(g,x,y-r*2.25,Math.max(2,r*.2))}
const fp=(s,i,j,w,d,u,z)=>s==='L'?P(i+u*w,j+d,z):P(i+w,j+d-u*d,z);
function arch(g,s,i,j,w,d,u1,u2,z1,z2,col){poly(g,[fp(s,i,j,w,d,u1,z1),fp(s,i,j,w,d,u2,z1),fp(s,i,j,w,d,u2,z2),fp(s,i,j,w,d,(u1+u2)/2,z2+(z2-z1)*.4),fp(s,i,j,w,d,u1,z2)],C(col))}
function rarch(g,x,yb,w,h,col){g.fillStyle=C(col);g.beginPath();g.moveTo(x,yb);g.lineTo(x,yb-h+w/2);g.arc(x+w/2,yb-h+w/2,w/2,Math.PI,0);g.lineTo(x+w,yb);g.closePath();g.fill()}
function pennant(g,x,y,col){line(g,[[x,y],[x,y-18]],'#8a6a4a',1.6);poly(g,[[x,y-18],[x+13,y-14],[x,y-10]],C(col))}
function courses(g,i,j,w,d,z,h,step){for(let zz=z+step;zz<z+h-2;zz+=step)line(g,[fp('L',i,j,w,d,0,zz),fp('L',i,j,w,d,1,zz),fp('R',i,j,w,d,1,zz)],'rgba(140,100,60,.13)',1)}

/* ---------- desain bangunan (koordinat lokal tapak 2x2) ---------- */
/* hiasan: makin tinggi level, makin indah (alas batu, beranda, kubah, emas, taman, lentera) */
const BATU=['','#dfcda8','#dfcda8','#e6d3ae'],EMAS='#e2b84a';
function semak(g,x,y,r,c='#62b24a'){shadowE(g,x+2,y+1,r*1.3,r*.55,.22);const gr=g.createRadialGradient(x-r*.35,y-r*1.25,r*.15,x,y-r*.8,r*1.15);gr.addColorStop(0,C(c,.35));gr.addColorStop(1,C(c,-.18));g.fillStyle=gr;g.beginPath();g.arc(x,y-r*.8,r,0,7);g.fill()}
function bunga(g,x,y){const cs=['#ff9ab0','#ffe07a','#ffffff','#c9a8ff','#ff9ab0'];semak(g,x,y,5,'#5aa83e');for(let k=0;k<5;k++){g.fillStyle=C(cs[k]);g.beginPath();g.arc(x+(k-2)*2.6,y-5-(k%2)*2.6,1.7,0,7);g.fill()}}
function lentera(g,x,y){line(g,[[x,y],[x,y-22]],C('#6e5444'),2);g.fillStyle=C('#6e5444');g.fillRect(x-3.5,y-29,7,7);g.fillStyle=C('#ffe59a');g.fillRect(x-2.2,y-28,4.4,4.6);if(!DK){const gl=g.createRadialGradient(x,y-25.5,1,x,y-25.5,11);gl.addColorStop(0,'rgba(255,220,120,.5)');gl.addColorStop(1,'rgba(255,220,120,0)');g.fillStyle=gl;g.beginPath();g.arc(x,y-25.5,11,0,7);g.fill()}}
function umbul(g,x,y,c){line(g,[[x,y],[x,y-30]],C('#8a6a4a'),1.6);poly(g,[[x,y-29],[x+9,y-29],[x+9,y-13],[x+4.5,y-16.5],[x,y-13]],C(c));line(g,[[x,y-29],[x+9,y-29]],C(EMAS),1.6)}
function emas(g,x,y,r=3.2){const gr=g.createRadialGradient(x-1,y-1,.4,x,y,r);gr.addColorStop(0,C('#fff3b0'));gr.addColorStop(1,C('#d89a28'));g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill()}
function sabit(g,x,y,r){g.fillStyle=C('#f2c24e');crescent(g,x,y,r)}
function cincin(g,cx,cy,r,w=2.6){g.strokeStyle=C('#e2b84a');g.lineWidth=w;g.beginPath();g.ellipse(cx,cy,r,r*.5,0,.08,Math.PI-.08);g.stroke()}
function bBase(g,lv=1){const [sx,sy]=P(1.15,1.25);shadowE(g,sx+8,sy+4,74+(lv>2?8:0),36+(lv>2?4:0),.3);
  if(lv>2){box(g,.02,.02,1.96,1.96,0,2,'#d8c6a0');box(g,.1,.1,1.8,1.8,2,3,'#f8f1e3');line(g,[P(.1,1.9,5),P(1.9,1.9,5),P(1.9,.1,5)],C(EMAS),1.8);return 5}
  if(lv>1){box(g,.06,.06,1.88,1.88,0,4,'#e9dcc0');line(g,[P(.06,1.94,4),P(1.94,1.94,4),P(1.94,.06,4)],C('#c9ab7c'),1.3);return 4}
  box(g,.08,.08,1.84,1.84,0,3,'#ece2ca');return 3}
function hiasDepan(g,lv,z){
  if(lv>1){const a=P(.28,1.78,z),b=P(1.78,.28,z);semak(g,a[0],a[1],lv>2?7.5:6.5);semak(g,b[0],b[1],lv>2?7.5:6.5)}
  if(lv>2){const l1=P(.62,1.86,z),l2=P(1.86,.62,z),d=P(1.8,1.8,z);lentera(g,l1[0],l1[1]);lentera(g,l2[0],l2[1]);bunga(g,d[0],d[1]+1)}
  const e=lv>2?1.98:lv>1?1.94:1.92;for(let k=0;k<lv;k++){const [x,y]=P(1.62-k*.2,e,z*.45);poly(g,[[x,y-3.2],[x+3.2,y],[x,y+3.2],[x-3.2,y]],C(EMAS))}}
function bRumah(g,lv,t,z){const R=TIERS[t].roof,x=.4,y=.4,w=1.2,h=[0,26,40,46][lv];
  box(g,x,y,w,w,z,h,lv>2?'#fff7e8':'#faeed6');if(lv>1)box(g,x-.02,y-.02,w+.04,w+.04,z,5,BATU[lv]);
  if(lv>1)line(g,[fp('L',x,y,w,w,0,z+21),fp('L',x,y,w,w,1,z+21),fp('R',x,y,w,w,1,z+21)],C(lv>2?EMAS:'#d9b48a'),lv>2?2.6:2.2);
  arch(g,'R',x,y,w,w,.36,.64,z,z+15,'#b07a52');arch(g,'L',x,y,w,w,.16,.4,z+7,z+15,'#8fb4d4');arch(g,'L',x,y,w,w,.6,.84,z+7,z+15,'#8fb4d4');
  if(lv>1){arch(g,'L',x,y,w,w,.3,.7,z+26,z+34,'#8fb4d4');arch(g,'R',x,y,w,w,.3,.7,z+26,z+34,'#8fb4d4')}
  if(lv>2){for(const [u1,u2] of [[.14,.42],[.58,.86]])line(g,[fp('L',x,y,w,w,u1,z+6),fp('L',x,y,w,w,u2,z+6)],C('#c98a5a'),3);for(let k=0;k<6;k++){const [fx,fy]=fp('L',x,y,w,w,.16+k*.13,z+7.5);g.fillStyle=C(k%2?'#f6a8b8':'#fff4c4');g.beginPath();g.arc(fx,fy,2.2,0,7);g.fill()}}
  const ap=roof(g,x-.13,y-.13,w+.26,w+.26,z+h,24,R);if(lv>2){dome(g,ap[0],ap[1]+2,6);sabit(g,ap[0]+1,ap[1]-13,3.4)}
  if(lv>1){const px=x+w,py=y+.18,pd=w-.36,ph=lv>2?20:17;box(g,px,py,.32,pd,z,1.5,'#ead9b8');
    for(const jj of [py+.03,py+pd-.09])box(g,px+.23,jj,.06,.06,z+1.5,ph,lv>2?'#fff8ea':'#f3e6cc');
    box(g,px-.02,py-.05,.38,pd+.1,z+ph+1.5,3,lv>2?'#f0d58a':'#e8d6b4')}
  return{x,y,w,z,h}}
function bMenara(g,lv,t,z){const R=TIERS[t].roof,[cx,cy]=P(1,1,z),r=21,h=[0,56,74,92][lv];
  if(lv>1)cyl(g,cx,cy,r+5,6,BATU[lv]);
  cyl(g,cx,cy,r,h,lv>2?'#fbf2e2':'#f3e8d2');g.strokeStyle='rgba(150,110,70,.14)';g.lineWidth=1.2;for(let zz=12;zz<h-4;zz+=12){g.beginPath();g.ellipse(cx,cy-zz,r,r*.5,0,.15,Math.PI-.15);g.stroke()}
  if(lv>2){cincin(g,cx,cy-h*.3,r+.4,3);cincin(g,cx,cy-h*.86,r+.4,2.4)}
  rarch(g,cx-6,cy+r*.5-1,12,18,'#b07a52');rarch(g,cx-4,cy-h*.48,8,12,'#7fa6c8');if(lv>1)rarch(g,cx-4,cy-h*.76,8,12,'#7fa6c8');
  if(lv>1){const by=cy-h*.62;cyl(g,cx,by,r+5,4,lv>2?'#f0d58a':'#e9dabc');g.strokeStyle=C('#b89a72');g.lineWidth=1.3;for(let a=.12;a<=.88;a+=.095){const px=cx+Math.cos(a*Math.PI)*(r+4.5),py=by+Math.sin(a*Math.PI)*(r+4.5)*.5;g.beginPath();g.moveTo(px,py);g.lineTo(px,py-6);g.stroke()}
    g.beginPath();g.ellipse(cx,by-6,r+4.5,(r+4.5)*.5,0,.05,Math.PI-.05);g.stroke()}
  cyl(g,cx,cy-h,r+5,7,lv>2?'#f0d58a':'#e9dabc');const ch=lv>2?44:36;cone(g,cx,cy-h-7,r+8,ch,R);const ty=cy-h-7-ch;
  if(lv>2){dome(g,cx,ty+3,4.5);sabit(g,cx+1,ty-9,3.4)}else pennant(g,cx,ty,TIERS[t].flag);
  if(lv>2){const [lx,ly]=P(1.05,1.86,z);umbul(g,lx-26,ly-4,TIERS[t].flag)}return{cylr:r,cx,cy,h}}
function bAsrama(g,lv,t,z){const R=TIERS[t].roof,x=.22,y=.62,w=1.56,d=.76,h=[0,22,32,42][lv];
  box(g,x,y,w,d,z,h,lv>2?'#fff6e6':'#f8ead2');if(lv>1)box(g,x-.02,y-.02,w+.04,d+.04,z,5,BATU[lv]);
  for(let f=0;f<lv;f++){for(let k=0;k<4;k++)arch(g,'L',x,y,w,d,.08+k*.23,.2+k*.23,z+5+f*10,z+11+f*10,'#8fb4d4');if(lv>2&&f>0)line(g,[fp('L',x,y,w,d,0,z+3+f*10),fp('L',x,y,w,d,1,z+3+f*10),fp('R',x,y,w,d,1,z+3+f*10)],C(EMAS),1.8)}
  arch(g,'R',x,y,w,d,.3,.7,z,z+13,'#b07a52');const ap=roof(g,x-.1,y-.1,w+.2,d+.2,z+h,18,R);
  if(lv>1){const pj=y+d,pc=lv>2?'#fff8ea':'#f3e6cc';box(g,x+.04,pj,w-.08,.26,z,1.5,'#ead9b8');for(const u of [.06,.36,.64,.94])box(g,x+u*(w-.1),pj+.18,.06,.06,z+1.5,13,pc);box(g,x+.02,pj-.02,w-.04,.3,z+14.5,3,lv>2?'#f0d58a':'#e8d6b4')}
  if(lv>2){const [mx,my]=P(x+w/2,y+d/2,z+h+14);cyl(g,mx,my,7,9,'#fffaf0');dome(g,mx,my-9,7);sabit(g,mx+1,my-23,3.2);
    const a=P(x+.04,y+d+.3,z),b=P(x+w-.04,y+d+.3,z);umbul(g,a[0]-4,a[1],TIERS[t].flag);umbul(g,b[0]-4,b[1],TIERS[t].flag)}
  return{x,y,w:w,z,h,d}}
function bBenteng(g,lv,t,z){const R=TIERS[t].roof,x=.26,y=.26,w=1.48,h=[0,22,28,34][lv],th=h+18,dw=lv>2?'#f4e8d0':'#ecdfc4';
  const tower=(i,j,f)=>{const [tx,ty]=P(i,j,z);cyl(g,tx,ty,10,th,dw);if(lv>2)cincin(g,tx,ty-th*.55,10.3,2.2);cone(g,tx,ty-th,12.5,18,R);const tip=ty-th-18;if(lv>2)emas(g,tx,tip,3);if(f)pennant(g,tx,tip-(lv>2?3:0),TIERS[t].flag)};
  box(g,x,y,w,w,z,h,dw);courses(g,x,y,w,w,z,h,8);if(lv>2)arch(g,'R',x,y,w,w,.33,.67,z,z+h*.8,EMAS);arch(g,'R',x,y,w,w,.36,.64,z,z+h*.72,'#a8744a');
  tower(x,y,lv>2);box(g,x+.48,y+.48,.52,.52,z+h,14+lv*5,lv>2?'#fbf2e0':'#f8ecd4');if(lv>2)line(g,[P(x+.48,y+1,z+h+10+lv*5),P(x+1,y+1,z+h+10+lv*5),P(x+1,y+.48,z+h+10+lv*5)],C(EMAS),2);
  const ap=roof(g,x+.43,y+.43,.62,.62,z+h+14+lv*5,20,R);if(lv>1)pennant(g,ap[0],ap[1],TIERS[t].flag);
  tower(x,y+w,lv>2);tower(x+w,y,lv>2);for(let u=.3;u<.75;u+=.2){box(g,x+u*w,y+w-.1,.1,.1,z+h,6,dw);box(g,x+w-.1,y+u*w,.1,.1,z+h,6,dw)}tower(x+w,y+w,lv>1);
  if(lv>1){const a=P(x+w+.1,y+w*.26,z),b=P(x+w+.1,y+w*.74,z);lentera(g,a[0],a[1]);lentera(g,b[0],b[1])}return{x,y,w,z,h}}
function cracks(g,bb,seed){const r=mulb(seed);for(let k=0;k<3;k++){let pts;if(bb.cylr){const x0=bb.cx+(r()-.5)*bb.cylr,y0=bb.cy-bb.h*(.3+r()*.5);pts=[[x0,y0]];for(let q=1;q<4;q++)pts.push([x0+(r()-.5)*6,y0+q*5])}
  else{const s=k%2?'R':'L',u=.2+r()*.6,z0=bb.z+bb.h*(.4+r()*.5);pts=[fp(s,bb.x,bb.y,bb.w,bb.d||bb.w,u,z0)];for(let q=1;q<4;q++)pts.push(fp(s,bb.x,bb.y,bb.w,bb.d||bb.w,u+(r()-.5)*.1,z0-q*4))}line(g,pts,'rgba(90,70,60,.55)',1.3)}}
function bFondasi(g){const [sx,sy]=P(1.1,1.2);shadowE(g,sx,sy,60,28,.18);poly(g,[P(.18,.18),P(1.82,.18),P(1.82,1.82),P(.18,1.82)],'#d8b47e');poly(g,[P(.32,.32),P(1.68,.32),P(1.68,1.68),P(.32,1.68)],'#e6c896');
  const st=[[.2,.2],[1.74,.2],[1.74,1.74],[.2,1.74]],tops=st.map(([a,b])=>P(a+.03,b+.03,15));st.slice(0,2).forEach(([a,b])=>box(g,a,b,.07,.07,0,15,'#c08a52'));
  line(g,[tops[0],tops[1],tops[2],tops[3],tops[0]],'#fff3d6',1.4);box(g,.7,.8,.62,.3,0,6,'#e0b77e');box(g,.78,.86,.44,.2,6,5,'#ecc896');box(g,1.12,.48,.22,.22,0,9,'#ddd4c2');st.slice(2).forEach(([a,b])=>box(g,a,b,.07,.07,0,15,'#c08a52'))}
function bRuin(g){bBase(g);DK=.6;box(g,.4,1.25,1.1,.2,3,12,'#e6d6b8');box(g,1.3,.4,.2,.8,3,8,'#e6d6b8');const r=mulb(9);for(let k=0;k<8;k++){const s=.1+r()*.12;box(g,.4+r()*1.1,.4+r()*1.1,s,s,3,4+r()*5,'#d8ccb6')}DK=0}
function bCamp(g){const [sx,sy]=P(1.1,1.2);shadowE(g,sx,sy,66,30,.2);
  const tent=(i,j,r,h,col)=>{const [cx,cy]=P(i,j,0);cone(g,cx,cy,r,h,col);g.fillStyle=C('#4a5a7a');g.beginPath();g.moveTo(cx-6,cy+r*.5-1);g.quadraticCurveTo(cx,cy+r*.5-20,cx+6,cy+r*.5-1);g.closePath();g.fill()};
  tent(.7,.65,24,34,'#8ab0e6');box(g,1.35,.45,.3,.3,0,10,'#d8ae78');box(g,1.42,.52,.18,.18,10,7,'#e6c28a');tent(1.2,1.25,18,26,'#a6c2ee');
  const [fx,fy]=P(.45,1.45,0);line(g,[[fx,fy],[fx,fy-46]],'#8a6a4a',2.2);g.fillStyle='#6a98e0';g.beginPath();g.moveTo(fx,fy-46);g.quadraticCurveTo(fx+12,fy-46,fx+20,fy-41);g.quadraticCurveTo(fx+12,fy-37,fx,fy-35);g.closePath();g.fill()}
function bMasjid(g,lv){const [sx,sy]=P(2.2,2.4);shadowE(g,sx+10,sy,150,70,.3);box(g,.06,.06,3.88,3.88,0,5,'#f4ecdc');
  const H2=lv>2?112:96,mn=(i,j)=>{const [mx,my]=P(i,j,5);cyl(g,mx,my,8,H2,'#fffaf2');cyl(g,mx,my-H2*.7,11,4,'#f6d06a');cyl(g,mx,my-H2,6.5,12,'#fffaf2');dome(g,mx,my-H2-12,7.5)};
  mn(.45,.45);box(g,.75,.75,2.5,2.5,5,40,'#fffbf4');
  for(let k=0;k<4;k++)arch(g,'L',.75,.75,2.5,2.5,.06+k*.24,.2+k*.24,13,32,'#c06070');
  arch(g,'R',.75,.75,2.5,2.5,.06,.2,13,32,'#c06070');arch(g,'R',.75,.75,2.5,2.5,.38,.62,5,36,'#9a3a4c');arch(g,'R',.75,.75,2.5,2.5,.8,.94,13,32,'#c06070');
  box(g,.71,.71,2.58,2.58,45,4,'#f6d06a');const [dx,dy]=P(2,2,49);cyl(g,dx,dy,30,10,'#fffaf2');dome(g,dx,dy-10,lv>2?44:38);
  if(lv>1){mn(3.55,.45);mn(.45,3.55)}if(lv>2)mn(3.55,3.55)}
function bTree(g,v){shadowE(g,8,4,26,11,.24);if(v===3){g.strokeStyle='#a8784a';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(7,-26,3,-52);g.stroke();
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2,ex=3+Math.cos(a)*26,ey=-52+Math.sin(a)*10+9;g.fillStyle=k%2?'#5aa84a':'#7cc45a';g.beginPath();g.moveTo(3,-52);g.quadraticCurveTo((3+ex)/2,-64,ex,ey);g.quadraticCurveTo((3+ex)/2,-54,3,-52);g.fill()}return}
  const sc=v===2?.62:v===1?1.12:1;g.fillStyle='#a07048';g.beginPath();g.roundRect?g.roundRect(-3.5,-16*sc,7,16*sc,3):g.rect(-3.5,-16*sc,7,16*sc);g.fill();
  const blobs=[[0,-30,19],[-11,-36,14],[10,-38,13],[-2,-46,13]],base=v===1?'#5ea84a':v===2?'#7cc65a':'#6ab852';
  for(const [x,y,r] of blobs){const gr=g.createRadialGradient((x-r*.35)*sc,(y-r*.4)*sc,r*.1*sc,x*sc,y*sc,r*sc);gr.addColorStop(0,C(base,.35));gr.addColorStop(1,C(base,-.18));g.fillStyle=gr;g.beginPath();g.arc(x*sc,y*sc,r*sc,0,7);g.fill()}}
function bCloud(g){shadowE(g,0,40,200,90,.22);const bl=[[-150,10,58],[-90,-20,74],[-10,-38,86],[80,-22,74],[148,8,58],[-60,22,64],[40,24,66],[110,30,46],[-120,34,44]];
  for(const [x,y,r] of bl){const gr=g.createRadialGradient(x-r*.3,y-r*.45,r*.1,x,y,r);gr.addColorStop(0,'#ffffff');gr.addColorStop(.7,'#f2f6fa');gr.addColorStop(1,'#d8e2ee');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill()}}
function blit(s,x,y,k=1){ctx.drawImage(s.c,x-s.ax*k,y-s.ay*k,s.w*k,s.h*k)}
function spr(key,w,h,ax,ay,fn){let s=SPR.get(key);if(s)return s;const c=document.createElement('canvas');c.width=Math.ceil(w*SS);c.height=Math.ceil(h*SS);const g=c.getContext('2d');g.setTransform(SS,0,0,SS,ax*SS,ay*SS);DK=0;fn(g);DK=0;s={c,w,h,ax,ay};SPR.set(key,s);return s}
const FN={rumah:bRumah,menara:bMenara,asrama:bAsrama,benteng:bBenteng};
function plotSprite(p,state){if(state==='rival')return spr('camp',180,290,90,200,g=>bCamp(g));
  const b=bget(p.j,p.q);if(!b||!b.lv)return spr('fon',180,290,90,200,bFondasi);const s=str(p.j,p.q);if(s<=0)return spr('ruin',180,290,90,200,bRuin);
  const db=s>=70?0:s>=50?1:s>=30?2:3,t=S.view;return spr(`${p.kind}|${b.lv}|${t}|${db}`,180,290,90,200,g=>{DK=[0,.3,.55,.8][db];const zb=bBase(g,b.lv);const bb=FN[p.kind](g,b.lv,t,zb);hiasDepan(g,b.lv,zb);if(db>=2)cracks(g,bb,p.q*7+b.lv+p.j)})}
const mLv=()=>{const b=builtIn(S.view);return 1+(b>=6)+(b>=14)};

/* ---------- tata letak & tanah ---------- */
function tileKind(i,j){if(i<BB-1||j<BB-1||i>MM-BB-1||j>MM-BB-1)return'out';if(i===BB-1||j===BB-1)return'road';const li=(i-BB)%7,lj=(j-BB)%7;if(li>=5||lj>=5)return'road';
  const bx=Math.floor((i-BB)/7),by=Math.floor((j-BB)/7);if(bx===1&&by===1)return'plaza';if(DBLK.some(([x,y])=>x===bx&&y===by))return'deco';if(li===2||lj===2)return'path';return'grass'}
function layoutHub(){const t=S.view,js=tierJuz(t);
  terr=js.map((j,k)=>{const [bx,by]=TBLK[k],i0=BB+bx*BS,j0=BB+by*BS;return{j,k,i0,j0,plots:PLOT.map(([px,py],q)=>({j,q,gi:i0+px*3,gj:j0+py*3,kind:KINDS[(q+k)%4]}))}});
  plots=terr.flatMap(x=>x.plots);masjid={gi:BB+BS+1,gj:BB+BS+1};const r=mulb(7+t);trees=[];
  for(let i=-5;i<MM+5;i++)for(let j=-5;j<MM+5;j++){if(tileKind(i,j)==='out'&&r()<.5)trees.push({i:i+.2+r()*.6,j:j+.2+r()*.6,v:Math.floor(r()*4)})}
  for(const [bx,by,ty] of DBLK){const i0=BB+bx*BS,j0=BB+by*BS;if(ty==='hutan')for(let k=0;k<13;k++)trees.push({i:i0+.5+r()*4.2,j:j0+.5+r()*4.2,v:Math.floor(r()*3)});if(ty==='kolam'){[[.3,.3],[4.6,.5],[.4,4.5],[4.5,4.4]].forEach(([a,b])=>trees.push({i:i0+a,j:j0+b,v:3}))}}
  [[BB+BS+.4,BB+BS+.4],[BB+BS+5.2,BB+BS+.4],[BB+BS+.4,BB+BS+5.2]].forEach(([a,b])=>trees.push({i:a,j:b,v:2}));
  lamps=[];for(let a=0;a<3;a++)for(let b=0;b<3;b++)lamps.push({i:BB+a*BS+5.5,j:BB+b*BS+5.5});
  if(window.aturTetangga){treesAll=trees.slice();aturTetangga()}
  buildGround()}
function buildGround(){const pad=280,w=MM*64+pad*2,h=MM*32+pad*2;GS=Math.min(2,Math.max(1,dpr),Math.sqrt(10e6/(w*h)));
  GC=document.createElement('canvas');GC.width=Math.ceil(w*GS);GC.height=Math.ceil(h*GS);const g=GC.getContext('2d');gox=MM*32+pad;goy=pad;
  const [g1,g2]=TIERS[S.view].g;g.fillStyle=C(g2,-.1);g.fillRect(0,0,GC.width,GC.height);g.setTransform(GS,0,0,GS,gox*GS,goy*GS);const r=mulb(11);
  const dia=(i,j,w,d)=>{const a=P(i,j),b=P(i+w,j),c=P(i+w,j+d),e=P(i,j+d);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.lineTo(e[0],e[1]);g.closePath()};
  const COL={out:[C(g2,-.08),C(g2,-.11)],grass:[g1,g2],deco:[g1,g2],road:['#f2e0b8','#eedaae'],path:['#f5e7c8','#f1e1bf'],plaza:['#f7efe0','#f2e8d6']};
  for(let i=-8;i<MM+8;i++)for(let j=-8;j<MM+8;j++){const k=tileKind(i,j),ck=(i+j)&1,col=COL[k][ck];dia(i,j,1,1);g.fillStyle=col;g.fill();g.strokeStyle=col;g.lineWidth=.8;g.stroke()}
  for(let i=-8;i<MM+8;i++)for(let j=-8;j<MM+8;j++){const k=tileKind(i,j),[x,y]=P(i+.5,j+.5);
    if(k==='road'||k==='path'){if(r()<.5){g.fillStyle='rgba(180,140,90,.16)';g.beginPath();g.ellipse(x+(r()-.5)*30,y+(r()-.5)*10,2,1.2,0,0,7);g.fill()}}
    else if(k!=='plaza'){g.strokeStyle=k==='out'?'rgba(70,120,40,.25)':'rgba(90,150,60,.28)';g.lineWidth=1.3;g.lineCap='round';for(let q=0;q<2;q++){const tx=x+(r()-.5)*40,ty=y+(r()-.5)*16;g.beginPath();g.moveTo(tx-3,ty-4);g.lineTo(tx,ty);g.lineTo(tx+3,ty-5);g.stroke()}
      if(k!=='out'&&r()<.07)for(let q=0;q<3;q++){g.fillStyle=pick(['#fff','#ffe89a','#ffc4d6','#d8c8ff']);g.beginPath();g.arc(x+(r()-.5)*30,y+(r()-.5)*10,2.2,0,7);g.fill()}}}
  for(const [bx,by,ty] of DBLK){const i0=BB+bx*BS,j0=BB+by*BS;
    if(ty==='kolam'){const ring=(rad)=>{g.beginPath();for(let a=0;a<=64;a++){const t=a/64*Math.PI*2,[x,y]=P(i0+2.5+Math.cos(t)*rad*(1+.08*Math.sin(t*3)),j0+2.5+Math.sin(t)*rad*(1+.08*Math.cos(t*2)));a?g.lineTo(x,y):g.moveTo(x,y)}g.closePath()};
      ring(2.35);g.fillStyle='#f3e4c0';g.fill();ring(2.05);const [cx,cy]=P(i0+2.5,j0+2.5);const wg=g.createRadialGradient(cx-30,cy-14,8,cx,cy,90);wg.addColorStop(0,'#bfe9f6');wg.addColorStop(1,'#78c2e0');g.fillStyle=wg;g.fill();
      for(let q=0;q<5;q++){g.fillStyle='#7cc45a';g.beginPath();g.ellipse(cx+(r()-.5)*90,cy+(r()-.5)*36,7,3.5,0,.3,Math.PI*2-.3);g.fill()}}
    if(ty==='kebun'){for(let a=0;a<4;a++){dia(i0+.4+a*1.2,j0+.5,.85,4.3);g.fillStyle='#c9a072';g.fill();for(let b=0;b<6;b++){const [x,y]=P(i0+.82+a*1.2,j0+.85+b*.7);const gr=g.createRadialGradient(x-1.5,y-5,1,x,y-3,6);gr.addColorStop(0,'#a8e07a');gr.addColorStop(1,'#5aa83e');g.fillStyle=gr;g.beginPath();g.arc(x,y-3,5.5,0,7);g.fill()}}}}
  for(let q=0;q<6;q++){const [x,y]=P(r()*MM,r()*MM);const lg=g.createRadialGradient(x,y,10,x,y,220);lg.addColorStop(0,'rgba(255,255,230,.12)');lg.addColorStop(1,'rgba(255,255,230,0)');g.fillStyle=lg;g.fillRect(x-220,y-220,440,440)}}

/* ---------- partikel ---------- */
const SPARK=['#fff7d0','#ffe07a','#b8f08a','#ffffff'];
function burst(x,y,n,cols,sp=70,up=60,life=.9,size=3){for(let k=0;k<n;k++)parts.push({x,y,vx:(rnd0()-.5)*sp*2,vy:-rnd0()*up-10,l:life,m:life,c:pick(cols),s:size*(.6+rnd0()*.8),g:130})}
function floatText(x,y,t,c){parts.push({x,y,vx:0,vy:-34,l:1.3,m:1.3,t,c,g:0})}
const tstate=tr=>owned(tr.j)?'own':isOpen(tr.j)?'rival':'lock';
const topZ=p=>{const b=bget(p.j,p.q);if(!b||!b.lv)return 18;if(str(p.j,p.q)<=0)return 16;return p.kind==='menara'?[0,56,74,92][b.lv]+60:p.kind==='rumah'?(b.lv>1?40:26)+34:p.kind==='asrama'?[0,22,32,42][b.lv]+30:[0,22,28,34][b.lv]+50};

/* ---------- render ---------- */
function w2s(x,y){return[(x-cam.x)*cam.z+W/2,(y-cam.y)*cam.z+H/2]}
function pill(x,y,txt,sub,bg,fg,dot){ctx.font="800 13px 'Baloo 2',sans-serif";const tw=Math.max(ctx.measureText(txt).width,sub?(ctx.font="700 10.5px Nunito,sans-serif",ctx.measureText(sub).width):0)+(dot?28:20);const hh=sub?34:24;
  ctx.fillStyle='rgba(60,30,30,.12)';ctx.beginPath();ctx.roundRect(x-tw/2,y-hh/2+3,tw,hh,12);ctx.fill();ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x-tw/2,y-hh/2,tw,hh,12);ctx.fill();
  const lx=x-tw/2+(dot?20:10);if(dot){ctx.fillStyle=dot;ctx.beginPath();ctx.arc(x-tw/2+11,y,5,0,7);ctx.fill()}
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=fg;ctx.font="800 13px 'Baloo 2',sans-serif";ctx.fillText(txt,lx,sub?y-6:y+1);if(sub){ctx.font="700 10.5px Nunito,sans-serif";ctx.globalAlpha=.85;ctx.fillText(sub,lx,y+8);ctx.globalAlpha=1}ctx.textAlign='center'}
function update(dt){if(camT){const k=Math.min(1,dt*5);cam.x+=(camT.x-cam.x)*k;cam.y+=(camT.y-cam.y)*k;cam.z+=(camT.z-cam.z)*k}
  cam.x=clamp(cam.x,-MM*34,MM*34);cam.y=clamp(cam.y,-90,MM*34);
  for(const q of parts){q.l-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.g*dt}parts=parts.filter(q=>q.l>0);
  for(const p of plots){if(!owned(p.j))continue;const b=bget(p.j,p.q);if(b&&b.lv===3&&str(p.j,p.q)>=70&&rnd0()<dt*.7){const [x,y]=P(p.gi+.4+rnd0()*1.2,p.gj+.4+rnd0()*1.2,20+rnd0()*(topZ(p)-30));parts.push({x,y,vx:0,vy:-10,l:1.2,m:1.2,c:pick(['#ffe07a','#fff4c4']),s:2,g:0})}if(b&&b.lv&&str(p.j,p.q)<30&&rnd0()<dt*1.3){const [x,y]=P(p.gi+1,p.gj+1,topZ(p)-6);parts.push({x:x+(rnd0()-.5)*16,y,vx:(rnd0()-.5)*6,vy:-16,l:2.2,m:2.2,c:'#9a948c',s:5,g:-2,sm:1})}}}
function frameHub(ms){const t=ms/1000,dt=Math.min(.05,t-(frameHub.t||t));frameHub.t=t;T=t;
  if(CUR==='hub'&&GC){update(dt);
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C(TIERS[S.view].g[1],-.1);ctx.fillRect(0,0,cv.width,cv.height);
  const z=cam.z*dpr;ctx.setTransform(z,0,0,z,cv.width/2-cam.x*z,cv.height/2-cam.y*z);ctx.drawImage(GC,-gox,-goy,GC.width/GS,GC.height/GS);
  for(const [bx,by,ty] of DBLK)if(ty==='kolam'){const [x,y]=P(BB+bx*BS+2.5,BB+by*BS+2.5);for(let k=0;k<3;k++){const a=.3+.25*Math.sin(T*2+k*2);line(ctx,[[x-26+k*16,y-8+k*7],[x-12+k*16,y-8+k*7]],`rgba(255,255,255,${a})`,1.6)}}
  const L=[];
  for(const tr of terr){const st=tstate(tr);if(st==='lock'){L.push([tr.i0+tr.j0+11,0,tr]);continue}for(const p of tr.plots)L.push([p.gi+p.gj+2,1,p,st])}
  if(reveal.j){const tr=terr.find(x=>x.j===reveal.j);if(tr&&T-reveal.t<1.6)L.push([tr.i0+tr.j0+11,0,tr,'fade'])}
  L.push([masjid.gi+masjid.gj+4,2]);if(window.tetanggaKeDaftar)tetanggaKeDaftar(L);for(const tr of trees)L.push([tr.i+tr.j,3,tr]);for(const l of lamps)L.push([l.i+l.j,4,l]);
  L.sort((a,b)=>a[0]-b[0]);
  for(const [,k,o,st] of L){
    if(k===1){const p=o,[x,y]=P(p.gi,p.gj);const s=plotSprite(p,st);ctx.save();const th=T-(p.hit||-9),tp=T-(p.pop||-9);if(th<.5)ctx.translate(Math.sin(th*55)*3*(1-th/.5),0);
      if(tp<.7){const [bx,by]=P(p.gi+1,p.gj+1),e=tp/.7,sy=p.grow?.25+.75*(1+2.7*Math.pow(e-1,3)+1.7*Math.pow(e-1,2)):1+Math.sin(e*Math.PI)*.12*(1-e);ctx.translate(bx,by);ctx.scale(1,sy);ctx.translate(-bx,-by)}else p.grow=0;
      if(sel===p){const a=.35+.3*Math.sin(T*6);poly(ctx,[P(p.gi-.1,p.gj-.1),P(p.gi+2.1,p.gj-.1),P(p.gi+2.1,p.gj+2.1),P(p.gi-.1,p.gj+2.1)],`rgba(255,226,120,${a})`)}
      blit(s,x,y);ctx.restore()}
    else if(k===0){const tr=o,[x,y]=P(tr.i0+2.75,tr.j0+2.75);const cs=spr('cloud',480,340,240,200,bCloud);let a=1;if(st==='fade')a=Math.max(0,1-(T-reveal.t)/1.4);else if(reveal.j===tr.j)continue;
      ctx.globalAlpha=a*.97;blit(cs,x,y-20+Math.sin(T*.8+tr.k)*4,.8);ctx.globalAlpha=1}
    else if(k===2){const s=spr('masjid'+mLv(),300,320,150,176,g=>bMasjid(g,mLv()));const [x,y]=P(masjid.gi,masjid.gj);if(sel==='masjid'){const a=.3+.3*Math.sin(T*6);poly(ctx,[P(masjid.gi-.1,masjid.gj-.1),P(masjid.gi+4.1,masjid.gj-.1),P(masjid.gi+4.1,masjid.gj+4.1),P(masjid.gi-.1,masjid.gj+4.1)],`rgba(255,226,120,${a})`)}blit(s,x,y)}
    else if(k===3){const [x,y]=P(o.i,o.j);blit(spr('tree'+o.v,110,130,55,104,g=>bTree(g,o.v)),x,y)}
    else if(k===5){gambarTetangga(o)}
    else{const [x,y]=P(o.i,o.j);line(ctx,[[x,y],[x,y-24]],'#7a5a48',2.4);ctx.fillStyle='#7a5a48';ctx.fillRect(x-4,y-30,8,7);const a=.45+.2*Math.sin(T*3+o.i);const gl=ctx.createRadialGradient(x,y-27,1,x,y-27,13);gl.addColorStop(0,`rgba(255,226,130,${a+.3})`);gl.addColorStop(1,'rgba(255,226,130,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,y-27,13,0,7);ctx.fill();ctx.fillStyle='#fff0b0';ctx.fillRect(x-2.5,y-29,5,4.5)}}
  for(const q of parts){const a=q.l/q.m;if(q.t){ctx.font=`800 ${18/cam.z}px 'Baloo 2',sans-serif`;ctx.textAlign='center';ctx.lineWidth=4/cam.z;ctx.strokeStyle=`rgba(255,255,255,${a})`;ctx.globalAlpha=a;ctx.strokeText(q.t,q.x,q.y);ctx.fillStyle=q.c;ctx.fillText(q.t,q.x,q.y);ctx.globalAlpha=1}
    else{ctx.globalAlpha=q.sm?a*.4:a;ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(q.x,q.y,q.sm?q.s*(2-a):q.s,0,7);ctx.fill();ctx.globalAlpha=1}}
  if(window.alamHub){const lampu=[];for(const l of lamps){const [x,y]=P(l.i,l.j);lampu.push([x,y-27,48,1])}{const [x,y]=P(masjid.gi+2,masjid.gj+2);lampu.push([x,y-46,118,.75])}if(window.TET)for(const n of TET.list){const [x,y]=P(n.i+2,n.j+2);lampu.push([x,y-36,120,.55])}
    for(const tr of terr){if(tstate(tr)!=='own')continue;for(const p of tr.plots){const b=bget(p.j,p.q);if(b&&b.lv){const [x,y]=P(p.gi+1,p.gj+1);lampu.push([x,y-20,40+b.lv*6,.5])}}}
    alamHub(ctx,cv.width,cv.height,dpr,dt,()=>ctx.setTransform(z,0,0,z,cv.width/2-cam.x*z,cv.height/2-cam.y*z),lampu)}
  ctx.setTransform(dpr,0,0,dpr,0,0);if(window.pilTetangga)pilTetangga();
  const nl=nextLocked(S.view);
  for(const tr of terr){const st=tstate(tr),[wx,wy]=P(tr.i0+5.4,tr.j0+5.4),[sx,sy]=w2s(wx,wy);if(sx<-120||sx>W+120||sy<-60||sy>H+60)continue;
    if(st==='own'){const b=tr.plots.filter(p=>bget(p.j,p.q)&&bget(p.j,p.q).lv).length;pill(sx,sy,`Juz ${tr.j}`,b<4?`${b}/4 berdiri`:'Milikmu','rgba(255,250,242,.96)','#3a1f24',TIERS[S.view].flag)}
    else if(st==='rival')pill(sx,sy,`Juz ${tr.j}`,'Rebut lewat Duel','#e2eefc','#2f5a9a','#5a8ad0');
    else if(tr.j===nl&&juzOk(tr.j)){const [cx,cy]=w2s(...P(tr.i0+2.75,tr.j0+2.75,90));pill(cx,cy+Math.sin(T*3)*3,`Juz ${tr.j}`,'Buka lewat Rihlah','#ffe9c8','#a0482a','#f08a5a')}
    else{const [cx,cy]=w2s(...P(tr.i0+2.75,tr.j0+2.75,90));pill(cx,cy,`Juz ${tr.j}`,juzOk(tr.j)?'Belum terjangkau':'Belum disetorkan','rgba(255,255,255,.85)','#8a8090')}}
  const showN=cam.z>=.8;
  for(const p of plots){if(!owned(p.j))continue;const b=bget(p.j,p.q),built=b&&b.lv>0;
    if(!built){const [wx,wy]=P(p.gi+1,p.gj+1,30),[sx,sy]=w2s(wx,wy+Math.sin(T*4+p.q)*3/cam.z);ctx.fillStyle='rgba(60,30,30,.15)';ctx.beginPath();ctx.arc(sx,sy+3,13,0,7);ctx.fill();ctx.fillStyle='#ffe48a';ctx.beginPath();ctx.arc(sx,sy,13,0,7);ctx.fill();ctx.fillStyle='#a0482a';ctx.fillRect(sx-6,sy-1.6,12,3.2);ctx.fillRect(sx-1.6,sy-6,3.2,12);continue}
    const s=str(p.j,p.q);if(!(showN||sel===p||s<70))continue;const [wx,wy]=P(p.gi+1,p.gj+1,topZ(p)+8),[bx,by]=w2s(wx,wy);
    ctx.fillStyle='rgba(255,250,242,.95)';ctx.beginPath();ctx.roundRect(bx-30,by-7,60,14,7);ctx.fill();ctx.fillStyle=s>=70?'#7cd05a':s>=40?'#f5c542':'#ff7a65';if(s>0){ctx.beginPath();ctx.roundRect(bx-27,by-4,Math.max(6,54*s/100),8,4);ctx.fill()}
    ctx.font="800 11px 'Baloo 2',sans-serif";ctx.textBaseline='middle';ctx.fillStyle='#a03c4c';ctx.fillText('Lv'+b.lv,bx-40,by+1)}}
  requestAnimationFrame(frameHub)}

/* ---------- input ---------- */
const ptr=new Map();let drag=null,pinch=null,moved=false;
const s2w=(sx,sy)=>[(sx-W/2)/cam.z+cam.x,(sy-H/2)/cam.z+cam.y];
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,[e.clientX,e.clientY]);if(ptr.size===1){drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};moved=false}else if(ptr.size===2){const [a,b]=[...ptr.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),z:cam.z};moved=true;drag=null}});
cv.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,[e.clientX,e.clientY]);if(pinch&&ptr.size===2){const [a,b]=[...ptr.values()];cam.z=clamp(pinch.z*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d,.4,1.6);camT=null}
  else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>7){moved=true;camT=null}if(moved){cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z}}});
cv.addEventListener('pointerup',e=>{if(!ptr.has(e.pointerId))return;if(!moved&&ptr.size===1)tap(e.clientX,e.clientY);ptr.delete(e.pointerId);if(ptr.size<2)pinch=null;if(!ptr.size)drag=null});
cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);pinch=null;drag=null});
cv.addEventListener('wheel',e=>{e.preventDefault();cam.z=clamp(cam.z*(e.deltaY<0?1.1:.9),.4,1.6);camT=null},{passive:false});
function hitTest(sx,sy){const [wx,wy]=s2w(sx,sy);let best=null,bd=-1;
  const test=(gi,gj,n,h,o)=>{const x1=P(gi,gj+n)[0],x2=P(gi+n,gj)[0],y1=P(gi,gj)[1]-h,y2=P(gi+n,gj+n)[1];if(wx>=x1&&wx<=x2&&wy>=y1&&wy<=y2){const [cx,cy]=P(gi+n/2,gj+n/2);if(Math.abs(wx-cx)/(32*n)+Math.abs(wy-cy)/(16*n)<=1||wy<cy){if(gi+gj>bd){bd=gi+gj;best=o}}}};
  for(const p of plots)if(owned(p.j))test(p.gi,p.gj,2,topZ(p)+10,p);test(masjid.gi,masjid.gj,4,150,'masjid');if(window.ujiTetangga)ujiTetangga(test);if(best)return best;
  const ti=(wx/32+wy/16)/2,tj=(wy/16-wx/32)/2;for(const tr of terr){if(ti>=tr.i0-.5&&ti<=tr.i0+5.5&&tj>=tr.j0-.5&&tj<=tr.j0+5.5)return{terr:tr}}
  for(const tr of terr){if(tstate(tr)!=='lock')continue;const [cx,cy]=P(tr.i0+2.75,tr.j0+2.75,60);if(Math.abs(wx-cx)<190&&Math.abs(wy-cy)<110)return{terr:tr}}return null}
function tap(x,y){if(qOpenFlag)return;const h=hitTest(x,y);if(h==='masjid')openMasjid();else if(h&&h.terr)openTerr(h.terr);else if(h&&h.tet)bukaTetangga(h.tet);else if(h)openPlot(h);else closeSheet()}

/* ---------- HUD & lembar ---------- */
function hud(pop){$('gold').textContent=S.gold;$('pas').textContent=S.pas;if(window.misiBadge)misiBadge();const v=S.view,own=tierJuz(v).filter(owned).length;$('tierT').textContent=window.judulDesa?judulDesa(v):TIERS[v].nm;if($('lvB'))$('lvB').textContent=window.levelSaya?levelSaya():1;$('tierS').textContent=`${tierRange(v)} · ${own}/5 wilayah`;
  if(pop){const g=$(pop);g.classList.remove('pop');void g.offsetWidth;g.classList.add('pop')}
  const up=v===S.tier&&S.tier<maxTier()&&tierDone(v);$('lvUp').hidden=!up;if(up)$('lvUp').textContent=`Naik ke ${TIERS[v+1].nm}`;
  const nl=nextLocked(v),rok=!!nl&&juzOk(nl);$('dR').classList.toggle('hot',rok);$('dR').classList.toggle('dim',!rok);$('dD').classList.toggle('hot',!!nextRival(v));$('dD').classList.toggle('dim',!nextRival(v))}
const dock=on=>$('dock').classList.toggle('off',!on);
function focusAt(x,y,frac,z){const zz=z||Math.max(cam.z,.85);camT={x,y:y+(.5-frac)*H/zz,z:zz}}
const focusPlot=(p,frac,z)=>{const [x,y]=P(p.gi+1,p.gj+1,30);focusAt(x,y,frac,z)};
const focusTerr=(tr,frac,z)=>{const [x,y]=P(tr.i0+2.75,tr.j0+2.75,20);focusAt(x,y,frac,z||.7)};
function sheet(html){const s=$('sheet');s.innerHTML=html;s.classList.add('on');s.scrollTop=0;dock(false);const x=s.querySelector('[data-x]');if(x)x.onclick=closeSheet}
function closeSheet(){sel=null;$('sheet').classList.remove('on');if(!qOpenFlag)dock(true)}
const head=(t,s,ar)=>`<div class="shead"><div class="t">${esc(t)}<small>${esc(s)}</small></div>${ar?`<span class="ar2">${esc(ar)}</span>`:''}<button class="x" data-x aria-label="Tutup">×</button></div>`;
const COIN='<svg><use href="#i-coin"/></svg>';
const status=s=>s>=70?'Terawat':s>=40?'Mulai berdebu':s>0?'Retak, segera murajaah':'Runtuh, murajaah untuk membangun ulang';
function openPlot(p){sel=p;const b=bget(p.j,p.q),lv=b?b.lv:0,lbl=segLabel(p.j,p.q);let body;
  if(!lv)body=`<p class="p">Fondasi ${KNM[p.kind].toLowerCase()} untuk <b>${esc(lbl)}</b>. Jawab minimal 3 dari 5 soal dengan benar untuk mendirikannya.</p><button class="btn b-green wide" id="goB">Bangun lewat murajaah</button>`;
  else{const s=str(p.j,p.q),col=s>=70?'#7cd05a':s>=40?'#f0b83a':'#ff7a65',cost=COST[p.kind][lv]||0,canU=lv<3&&S.gold>=cost&&s>=80;
    const why=lv>=3?'Sudah level tertinggi.':s<80?'Butuh kekuatan minimal 80% untuk meningkatkan.':S.gold<cost?`Butuh ${cost} emas. Kumpulkan dari murajaah.`:`Level ${lv+1} memudar lebih lambat (${RATE[lv+1]}% per hari).`;
    body=`<div class="meter"><i style="width:${s}%;background:${col}"></i><span>${Math.round(s)}%</span></div><p class="p"><b>${status(s)}</b>. Memudar ${RATE[lv]}% per hari bila tidak diulang.</p>
    <div class="row"><button class="btn b-green" id="goM">Murajaah · 5 soal</button>${lv<3?`<button class="btn b-gold" id="goU" ${canU?'':'disabled'}>${COIN}Tingkatkan · ${cost}</button>`:''}</div><p class="note">${why}</p>`}
  sheet(head(`Bagian ${p.q+1} · Juz ${p.j}`,`${lv?KNM[p.kind]+' Lv'+lv:'Fondasi'} · ${lbl}`)+`<div class="sb">${body}</div>`);focusPlot(p,.3);
  if($('goB'))$('goB').onclick=()=>hubQuiz('build',p);if($('goM'))$('goM').onclick=()=>hubQuiz('mur',p);
  if($('goU'))$('goU').onclick=()=>{const c=COST[p.kind][lv];if(S.gold<c)return;S.gold-=c;b.lv++;setStr(p.j,p.q,str(p.j,p.q));p.pop=T;const [x,y]=P(p.gi+1,p.gj+1,topZ(p));burst(x,y,30,['#ffe07a','#fff7d0','#f8b4c4'],110,90,1.1,3.5);save();hud('goldP');toast(`Bagian ${p.q+1} naik ke Lv ${b.lv}. Sekarang memudar ${RATE[b.lv]}% per hari.`);openPlot(p)}}
function openTerr(tr){sel=null;const st=tstate(tr),j=tr.j,nl=nextLocked(S.view);let body='';
  const rows=tr.plots.map(p=>{const b=bget(p.j,p.q),lv=b&&b.lv,s=lv?str(p.j,p.q):0;return`<div class="li"><div><b>Bagian ${p.q+1}</b><small>${esc(segLabel(j,p.q))}</small></div>${st!=='own'?'':lv?`<span class="tag ${s>=70?'ok':s>0?'':'red'}">Lv${lv} · ${Math.round(s)}%</span>`:`<span class="tag">Fondasi</span>`}</div>`}).join('');
  if(st==='lock')body=!juzOk(j)?`<p class="p">Juz ${j} <b>belum disetorkan</b>. Wilayah ini bisa dijelajahi setelah hafalanmu sampai di sini. Semangat menambah hafalan!</p>`:j===nl?`<p class="p">Wilayah ini masih tertutup awan. Tempuh <b>Rihlah</b> melewati 4 bagian juz ini dan kalahkan penjaganya untuk membukanya.</p><button class="btn b-maroon wide" id="tR">Mulai Rihlah ke Juz ${j}</button>`:`<p class="p">Buka dulu wilayah sebelumnya. Urutan wilayah mengikuti urutan juz hafalan.</p>`;
  else if(st==='rival')body=`<p class="p">Wilayah sudah terbuka, tapi masih dikuasai <b>Penguasa Juz ${j}</b>. Menangkan <b>Duel Ayat</b> untuk merebutnya.${S.pas?` Kamu membawa ${Math.min(S.pas,20)} pasukan sebagai bala bantuan.`:' Tambah pasukan lewat Garda supaya lebih mudah.'}</p><button class="btn b-blue wide" id="tD">Duel merebut Juz ${j}</button>`;
  else body=`<p class="p">Wilayahmu. Jaga keempat bangunan dengan murajaah, dan perkuat pasukan lewat <b>Garda</b>: tiap jawaban benar di sana ikut memperkuat bangunan wilayah ini.</p><button class="btn b-plum wide" id="tG">Garda di Juz ${j}</button>`;
  sheet(head(`Juz ${j}`,`Wilayah ${tr.k+1} dari 5 · ${st==='own'?'milikmu':st==='rival'?'dikuasai lawan':'tertutup awan'}`)+`<div class="sb"><div class="list">${rows}</div>${body}</div>`);focusTerr(tr,.3);
  if($('tR'))$('tR').onclick=()=>startRihlah(j);if($('tD'))$('tD').onclick=()=>startDuel(j);if($('tG'))$('tG').onclick=()=>startGarda(j)}
function openMasjid(){sel='masjid';const v=S.view,own=tierJuz(v).filter(owned).length,b=builtIn(v),done=tierDone(v);
  sheet(head(`Masjid ${window.judulDesa?judulDesa(v):TIERS[v].nm}`,`${tierRange(v)} · Masjid Lv ${mLv()}`)+`<div class="sb"><div class="li namad"><div><b>${esc(window.judulDesa?judulDesa(S.tier):TIERS[S.tier].nm)}</b><small>Level pemain ${window.levelSaya?levelSaya():1} · nama terlihat oleh pemain lain</small></div><button class="btn b-soft" id="mNama">Ganti nama</button></div><div class="grid2"><div class="stat"><b>${own}/5</b>wilayah dikuasai</div><div class="stat"><b>${b}/20</b>bangunan berdiri</div></div>
  <p class="p">${done?(v<5?(v<maxTier()?`Seluruh ${TIERS[v].nm.toLowerCase()} sudah kamu kuasai. Saatnya naik ke <b>${TIERS[v+1].nm}</b> (${tierRange(v+1)}).`:`Seluruh ${TIERS[v].nm.toLowerCase()} sudah kamu kuasai. ${TIERS[v+1].nm} terbuka setelah hafalanmu sampai Juz ${tierJuz(v+1)[0]}.`):'Seluruh 30 juz sudah kamu kuasai. Masya Allah!'):`Kuasai kelima wilayah dan dirikan 20 bangunan untuk naik ke ${v<5?TIERS[v+1].nm:'puncak'}. Masjid tumbuh tiap 6 dan 14 bangunan berdiri.`}</p>
  ${done&&v===S.tier&&v<maxTier()?`<button class="btn b-gold wide" id="mUp">Naik ke ${TIERS[v+1].nm}</button>`:''}</div>`);
  focusAt(...P(masjid.gi+2,masjid.gj+2,50),.32);if($('mUp'))$('mUp').onclick=tierUp;if($('mNama'))$('mNama').onclick=()=>{closeSheet();bukaNamaDesa(()=>openMasjid())}}
function openPeta(){const mt=maxTier(),admin=NET.demo||(NET.me&&NET.me.peran==='admin');
  const rows=TIERS.map((t,i)=>{const un=i<=S.tier,own=tierJuz(i).filter(owned).length;return`<div class="li"><div><b>${t.nm}</b><small>${tierRange(i)}${un?` · ${own}/5 wilayah · ${builtIn(i)}/20 bangunan`:i>mt?' · butuh hafalan sampai Juz '+tierJuz(i)[0]:''}</small></div>${un?(i===S.view?'<span class="tag ok">Sedang dilihat</span>':`<button class="btn b-soft" data-v="${i}">Lihat</button>`):'<span class="tag">Terkunci</span>'}</div>`}).join('');
  const P_=NET.P||{nama:'Mode coba',tipe:'demo'},banyakAnak=NET.me&&NET.me.peran==='wali'&&NET.me.anak.length>1;
  sheet(head('Peta kekuasaan','6 tingkat · 5 juz per tingkat')+`<div class="sb">
  <div class="li" style="margin-bottom:10px"><div><b>${esc(P_.nama)}</b><small>${esc(window.judulDesa?judulDesa(S.tier):'')} · Lv ${window.levelSaya?levelSaya():1} · ${P_.tipe==='santri'?`${MAXJ} juz sudah disetorkan`:P_.tipe==='asatidz'?'Ustadz/Ustadzah · 30 juz':'Mode coba tanpa akun'}</small></div></div>
  <div class="row" style="margin-bottom:12px"><button class="btn b-gold" id="pRank">Papan peringkat</button>${banyakAnak?'<button class="btn b-soft" id="pGanti">Ganti ananda</button>':''}${typeof bisaPasang==='function'&&bisaPasang()?'<button class="btn b-soft" id="pPasang">Pasang di HP</button>':''}${NET.demo?'':'<button class="btn b-soft" id="pOut">Keluar</button>'}</div>
  <div class="list">${rows}</div>
  <p class="note" style="margin-bottom:8px">Bangunan di tingkat lama tetap memudar, jadi kunjungi lagi untuk murajaah.</p>
  ${admin?`<div class="list"><div class="li"><div><b>Uji coba (khusus admin)</b><small>Untuk mencoba alur tanpa menunggu</small></div></div></div>
  <div class="row"><button class="btn b-soft" id="uDay">Lewati 1 hari</button><button class="btn b-soft" id="uAll">Kuasai semua wilayah tingkat ini</button><button class="btn b-soft" id="uNext">Buka tingkat berikutnya</button><button class="btn b-soft" id="uReset">Mulai dari awal</button></div>`:''}</div>`);
  $('sheet').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>viewTier(+b.dataset.v));
  $('pRank').onclick=openPeringkat;if($('pPasang'))$('pPasang').onclick=()=>{closeSheet();pasangApp()};if($('pOut'))$('pOut').onclick=netKeluar;if($('pGanti'))$('pGanti').onclick=()=>{netSimpanSekarang();closeSheet();routeMe(NET.me)};
  if(!admin)return;
  $('uDay').onclick=()=>{S.skip++;save();toast('Satu hari berlalu tanpa murajaah. Bangunan mulai memudar.');closeSheet()};
  $('uAll').onclick=()=>{tierJuz(S.view).forEach(j=>S.t[j]={open:1,own:1});save();hud();closeSheet();toast('Semua wilayah tingkat ini dikuasai (uji coba).')};
  $('uNext').onclick=()=>{if(S.tier<maxTier()){S.tier++;save();viewTier(S.tier)}};
  $('uReset').onclick=e=>{const b=e.currentTarget;if(!b.dataset.arm){b.dataset.arm=1;b.textContent='Ketuk lagi untuk menghapus';return}S=DEF();S.v=2;save();viewTier(0)}}
async function openPeringkat(){const show=async k=>{$('rkList').innerHTML='<p class="note">Memuat…</p>';const rows=await netPeringkat(k);$('rkList').innerHTML=rows.length?rows.map((r,i)=>`<div class="li"><b style="width:26px">${i+1}</b><div><b>${esc(r.nama)}</b><small>${TIERS[r.tingkat]?TIERS[r.tingkat].nm:''}${r.desa?' '+esc(r.desa):''} · Lv ${window.lvDari?lvDari(r.skor):1} · ${r.wilayah} wilayah</small></div><span class="tag ok">${r.skor}</span></div>`).join(''):`<p class="note">${NET.demo?'Papan peringkat tampil setelah masuk dengan akun Al-Hafizh.':'Belum ada pemain di kelompok ini.'}</p>`;
    $('sheet').querySelectorAll('[data-k]').forEach(b=>b.className='btn '+(b.dataset.k===k?'b-maroon':'b-soft'))};
  sheet(head('Papan peringkat','10 besar · santri dan asatidz terpisah')+`<div class="sb"><div class="row" style="margin-bottom:10px"><button class="btn" data-k="santri">Santri</button><button class="btn" data-k="asatidz">Ustadz/Ustadzah</button></div><div class="list" id="rkList"></div></div>`);
  $('sheet').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>show(b.dataset.k));show(NET.P&&NET.P.tipe==='asatidz'?'asatidz':'santri')}
function viewTier(v){$('loadS').textContent='Menyiapkan wilayah…';$('load').hidden=false;loadTier(v).then(()=>{S.view=v;save();layoutHub();home();hud();closeSheet();$('load').hidden=true})}
function tierUp(){if(S.tier>=maxTier())return;S.tier++;S.gold+=100;save();viewTier(S.tier);setTimeout(()=>modal(`<header>${TIERS[S.tier].nm}!<small>${tierRange(S.tier)}</small></header><p>Kekuasaanmu meluas. Wilayah pertama masih tertutup awan: tempuh Rihlah untuk membukanya. Jangan lupa tetap murajaah di ${TIERS[S.tier-1].nm.toLowerCase()}.</p><p><b>+100 emas</b></p>`,[{t:'Ayo mulai'}]),900)}
function home(){const tr=terr.find(t=>tstate(t)!=='own'&&t.j===(nextRival(S.view)||nextLocked(S.view)))||terr.find(t=>tstate(t)==='own')||terr[0];const [x,y]=P(tr.i0+2.75,tr.j0+2.75);cam.z=clamp(W/560,.55,1);cam.x=x*.6;cam.y=y*.6+P(masjid.gi+2,masjid.gj+2)[1]*.4-50;camT=null}

/* ---------- murajaah di desa ---------- */
function hubQuiz(mode,p){const P_=segPool(p.j,p.q),X=juzPool(p.j);const qs=shuf(['sambung','lengkapi','susun','sambung','lengkapi']).map(t=>ask(t,P_,X,p.j)).filter(Boolean);if(!qs.length){toast('Soal belum bisa dibuat untuk bagian ini.');return}
  HZ={mode,p,qs,i:0,ok:0,gold:0,s0:str(p.j,p.q)};$('sheet').classList.remove('on');dock(false);hzShow()}
function hzShow(){const q=HZ.qs[HZ.i],p=HZ.p,last=HZ.i===HZ.qs.length-1;sel=p;focusPlot(p,.2);
  openQ(q,{title:q.label,sub:`Juz ${p.j} · Bagian ${p.q+1}`,dots:dotsOf(HZ.qs,HZ.i),nextLabel:last?'Lihat hasil':'Lanjut',onClose:()=>{HZ=null;closeSheet()},
    onAnswer(ok){const [bx,by]=P(p.gi+1,p.gj+1,topZ(p));if(ok){HZ.ok++;HZ.gold+=5;S.gold+=5;floatText(bx,by-12,'+5','#e6a02a');if(HZ.mode==='mur'){setStr(p.j,p.q,str(p.j,p.q)+20);p.pop=T;burst(bx,by,18,SPARK)}else burst(bx,by+10,14,['#ecc896','#fff7d0','#ffe07a'])}
      save();hud(ok?'goldP':null);$('qD').innerHTML=dotsOf(HZ.qs,HZ.i);return ok?'+5 emas':''},
    onNext(){HZ.i++;if(HZ.i<HZ.qs.length)hzShow();else hzFinish()}})}
function hzFinish(){closeQ();const m=HZ.mode,p=HZ.p,ok=HZ.ok,N=HZ.qs.length;let title,msg;
  if(m==='build'){if(ok>=3){S.b[bkey(p.j,p.q)]={lv:1,s:Math.min(100,40+ok*12),t:now()};p.pop=T;p.grow=1;const [x,y]=P(p.gi+1,p.gj+1,10);burst(x,y,26,['#efe3c8','#d9c4a0','#fff7d0'],120,50,1,4);title='Bangunan berdiri!';msg=`${KNM[p.kind]} di bagian ${p.q+1} Juz ${p.j} berdiri dengan kekuatan ${Math.round(str(p.j,p.q))}%.`}
    else{title='Fondasi belum kokoh';msg=`Butuh minimal 3 jawaban benar, kamu benar ${ok} dari ${N}. Ulang dulu hafalan ${segLabel(p.j,p.q)}, lalu coba lagi.`}}
  else{if(ok===N){S.gold+=15;HZ.gold+=15}title=ok===N?'Murajaah sempurna!':'Murajaah selesai';msg=`Kekuatan bagian ${p.q+1}: ${Math.round(HZ.s0)}% → ${Math.round(str(p.j,p.q))}%.${ok===N?' Bonus 15 emas.':''}`}
  const stars=ok===N?3:ok>=Math.ceil(N*.6)?2:ok>0?1:0,first=m==='build'&&ok>=3&&!(S.tut&2),gold=HZ.gold;save();hud('goldP');HZ=null;
  modal(`<header>${esc(title)}</header><div class="stars">${[0,1,2].map(i=>STAR(i<stars)).join('')}</div><div class="big">${ok}/${N}</div><p>${esc(msg)}</p><p><b>+${gold} emas</b></p>`,[{t:'Kembali ke peta',f:()=>{openPlot(p);if(first){S.tut|=2;save();setTimeout(()=>toast('Bangunan memudar tiap hari seperti hafalan. Murajaah untuk menjaganya, naikkan level supaya lebih awet.'),400)}}}])}

/* ---------- kembali dari mode cabang ---------- */
function hubReturn(ev){go('hub');hud();dock(true);if(!ev)return;const tr=terr.find(t=>t.j===ev.j);if(!tr)return;focusTerr(tr,.45,.7);
  if(ev.type==='open'){reveal={j:ev.j,t:T};const [x,y]=P(tr.i0+2.75,tr.j0+2.75,60);setTimeout(()=>{burst(x,y,40,SPARK,160,100,1.4,4);reveal={}},1500);setTimeout(()=>toast(`Juz ${ev.j} terbuka! Rebut wilayahnya lewat Duel.`),900)}
  if(ev.type==='own'){tr.plots.forEach((p,i)=>{p.pop=T+i*.12;const [x,y]=P(p.gi+1,p.gj+1,20);setTimeout(()=>burst(x,y,20,['#ffe07a','#f8b4c4','#b8f08a','#fff'],120,90,1.2,3.5),i*150)});setTimeout(()=>toast(`Juz ${ev.j} kini milikmu. Dirikan bangunannya lewat murajaah.`),700)}
  if(ev.type==='garda'){tr.plots.forEach(p=>{if(bget(p.j,p.q)&&bget(p.j,p.q).lv){p.pop=T;const [x,y]=P(p.gi+1,p.gj+1,topZ(p));burst(x,y,10,SPARK)}})}}
$('dR').onclick=()=>{const j=nextLocked(S.view);if(j&&!juzOk(j)){toast(`Juz ${j} belum disetorkan. Wilayahnya terbuka setelah hafalanmu sampai di sana.`);return}if(!j){toast(S.view<S.tier?'Semua wilayah tingkat ini sudah terbuka.':'Semua wilayah sudah terbuka. Rebut dan bangun, lalu naik tingkat.');return}const tr=terr.find(t=>t.j===j);openTerr(tr)};
$('dD').onclick=()=>{const j=nextRival(S.view);if(!j){toast(nextLocked(S.view)?'Belum ada wilayah terbuka untuk direbut. Buka dulu lewat Rihlah.':'Semua wilayah terbuka sudah milikmu.');return}openTerr(terr.find(t=>t.j===j))};
$('dG').onclick=()=>{const own=terr.filter(t=>tstate(t)==='own');const rows=own.map(t=>{const bs=t.plots.filter(p=>bget(p.j,p.q)&&bget(p.j,p.q).lv),avg=bs.length?Math.round(bs.reduce((a,p)=>a+str(p.j,p.q),0)/bs.length):0;return`<div class="li"><div><b>Juz ${t.j}</b><small>${bs.length}/4 berdiri${bs.length?` · rata-rata ${avg}%`:''}</small></div><button class="btn b-plum" data-j="${t.j}">Garda</button></div>`}).join('');
  sheet(head('Garda Hafizh','Pilih wilayah yang dijaga')+`<div class="sb"><p class="p">Ghaflah menyerbu wilayah yang kamu pilih. Tiap Ghaflah yang dikalahkan menjadi <b>1 pasukan</b> untuk Duel, dan tiap jawaban benar memperkuat bangunan wilayah itu.</p><div class="list">${rows}</div></div>`);
  $('sheet').querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>startGarda(+b.dataset.j))};
$('dP').onclick=openPeta;$('tierP').onclick=openMasjid;$('alamP').onclick=()=>{if(window.alamBuka)alamBuka()};$('lvUp').onclick=tierUp;
