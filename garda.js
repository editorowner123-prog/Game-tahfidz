/* ===== garda.js — Garda Hafizh: memperkuat pasukan & wilayah (FPS 3D) ===== */
{
let gJ=null,G3=null,grun=false,gq=false;
const loadThree=()=>window.THREE?Promise.resolve():new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=res;s.onerror=rej;document.head.append(s)});
const WAVES=[{n:4},{n:5,r:2},{n:4,r:2,boss:1}];
const PL={x:0,z:9,yaw:0,pitch:0,hp:100,ammo:0,streak:0,spec:0};
let wave=0,queue=[],spawnT=0,between=0,kills=0,shots=0,hits=0,ans=0,cor=0,ts=1,TT=0,hurtT=0,firing=false,fireCd=0,walkT=0,kick=0,earned=0,boosted=0,last=performance.now();
let enemies=[],bullets=[],gparts=[];
function initGarda(){const SKYU={uT:{value:new THREE.Vector3(1,1,1)},uG:{value:0}},SUNS=[],AWANS=[];const R=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));R.outputEncoding=THREE.sRGBEncoding;
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xf0c8c0,34,140);const cam=new THREE.PerspectiveCamera(72,1,.1,320);cam.rotation.order='YXZ';scene.add(cam);
  const gm=new THREE.DataTexture(new Uint8Array([70,140,205]),3,1,THREE.LuminanceFormat);gm.minFilter=gm.magFilter=THREE.NearestFilter;gm.needsUpdate=true;
  const toon=(c,o)=>new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:gm},o||{}));
  const ctex=(w,h,draw,rep)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}t.anisotropy=4;return t};
  const glow=ctex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.7)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
  const star8=(g,x,y,r)=>{for(const a of[0,Math.PI/4]){g.save();g.translate(x,y);g.rotate(a);g.fillRect(-r,-r,r*2,r*2);g.restore()}};
  const floorT=ctex(512,512,g=>{g.fillStyle='#d8c0a0';g.fillRect(0,0,512,512);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const l=210+Math.random()*16|0;g.fillStyle=`rgb(${l},${l-14},${l-38})`;g.fillRect(x*128+3,y*128+3,122,122);g.fillStyle='rgba(200,150,140,.22)';star8(g,x*128+64,y*128+64,26);g.fillStyle='rgba(255,250,240,.5)';star8(g,x*128+64,y*128+64,12)}},[16,16]);
  const wallT=ctex(256,256,g=>{g.fillStyle='#e8d2b0';g.fillRect(0,0,256,256);for(let y=0;y<8;y++)for(let x=0;x<5;x++){const o=(y%2)*26,l=238+Math.random()*14|0;g.fillStyle=`rgb(${l},${l-16},${l-44})`;g.beginPath();g.roundRect?g.roundRect(x*52+o-24,y*32+2,48,28,5):g.rect(x*52+o-24,y*32+2,48,28);g.fill()}},[3,1]);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300,32,16),new THREE.ShaderMaterial({uniforms:SKYU,side:THREE.BackSide,depthWrite:false,fog:false,vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 uT;uniform float uG;varying vec3 vP;void main(){float h=vP.y;vec3 top=vec3(.55,.62,.92),mid=vec3(.96,.72,.78),hor=vec3(1.,.86,.68);vec3 c=h>0.?mix(mix(hor,mid,smoothstep(0.,.18,h)),top,smoothstep(.18,.65,h)):mix(hor,vec3(.94,.78,.74),smoothstep(0.,-.15,h));c=mix(c,vec3(dot(c,vec3(.3,.59,.11))),uG)*uT;gl_FragColor=vec4(c,1.);}'})));
  const sd=new THREE.Vector3(-.55,.14,-1).normalize();[[130,0xffe0b0],[40,0xfff8e8]].forEach(([s,c])=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:c,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));sp.position.copy(sd).multiplyScalar(280);sp.scale.set(s,s,1);SUNS.push(sp);scene.add(sp)});
  for(let k=0;k<7;k++){const cl=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xffffff,transparent:true,opacity:.55,fog:false,depthWrite:false}));const a=k/7*Math.PI*2;cl.position.set(Math.sin(a)*240,60+Math.random()*50,Math.cos(a)*240);cl.scale.set(110,40,1);AWANS.push(cl);scene.add(cl)}
  const hemi=new THREE.HemisphereLight(0xfff0e6,0xb898b0,.72);scene.add(hemi);const dl=new THREE.DirectionalLight(0xffe6cc,.55);const stG=new THREE.BufferGeometry(),stP=[];for(let k=0;k<260;k++){const a=Math.random()*6.283,e=.1+Math.random()*1.35;stP.push(Math.cos(e)*Math.sin(a)*285,Math.sin(e)*285,Math.cos(e)*Math.cos(a)*285)}stG.setAttribute('position',new THREE.Float32BufferAttribute(stP,3));const stars=new THREE.Points(stG,new THREE.PointsMaterial({color:0xfff6dd,size:1.8,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(stars);const moon=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xe8eeff,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));moon.position.set(.5,.42,.75).normalize().multiplyScalar(270);moon.scale.set(34,34,1);moon.visible=false;scene.add(moon);dl.position.set(-30,40,-30);scene.add(dl);
  const flr=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshLambertMaterial({map:floorT}));flr.rotation.x=-Math.PI/2;scene.add(flr);
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshLambertMaterial({color:0xe8c8a0}));sand.rotation.x=-Math.PI/2;sand.position.y=-.03;scene.add(sand);
  const RAD=27,NW=28,GATES=[0,7,14,21],portals=[],OBS=[{x:0,z:0,r:2.7}];
  const wallM=new THREE.MeshLambertMaterial({map:wallT});const capM=toon(0xd06a5c),stoneM=toon(0xe2c8a6);
  const segW=2*Math.PI*RAD/NW+.35,cren=new THREE.InstancedMesh(new THREE.BoxGeometry(.7,.7,1.7),wallM,NW*3);let ci=0;const mtx=new THREE.Matrix4(),q4=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1),Y=new THREE.Vector3(0,1,0);
  for(let k=0;k<NW;k++){const a=k/NW*Math.PI*2,x=Math.sin(a)*RAD,z=Math.cos(a)*RAD;
    if(GATES.includes(k)){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=a;[-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.85,.95,7.5,14),stoneM);p.position.set(s*2.6,3.75,0);g.add(p);const c=new THREE.Mesh(new THREE.ConeGeometry(1.1,2,14),capM);c.position.set(s*2.6,8.5,0);g.add(c)});
      const lt=new THREE.Mesh(new THREE.BoxGeometry(6.6,1.3,1.8),wallM);lt.position.y=6.2;g.add(lt);const pm=new THREE.MeshBasicMaterial({color:0xb090f0,transparent:true,opacity:.7,side:THREE.DoubleSide,fog:false});const pt=new THREE.Mesh(new THREE.PlaneGeometry(3.8,5.4),pm);pt.position.set(0,2.7,.3);g.add(pt);
      const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xc0a0ff,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));gl.position.set(0,2.8,-.6);gl.scale.set(8,8,1);g.add(gl);portals.push({pm,gl,a});scene.add(g);continue}
    const w=new THREE.Mesh(new THREE.BoxGeometry(segW,5.2,1.6),wallM);w.position.set(x,2.6,z);w.rotation.y=a;scene.add(w);
    for(let c=-1;c<=1;c++){q4.setFromAxisAngle(Y,a);mtx.compose(new THREE.Vector3(x+Math.cos(a)*c*segW/3,5.55,z-Math.sin(a)*c*segW/3),q4,one);cren.setMatrixAt(ci++,mtx)}}
  cren.count=ci;scene.add(cren);
  const lampM=new THREE.MeshBasicMaterial({color:0xffd27a});
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2+Math.PI/8,x=Math.sin(a)*21.5,z=Math.cos(a)*21.5;const p=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,4.2,12),stoneM);p.position.set(x,2.1,z);scene.add(p);const l=new THREE.Mesh(new THREE.SphereGeometry(.34,12,10),lampM);l.position.set(x,4.6,z);scene.add(l);
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xffd08a,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending}));gl.position.set(x,4.6,z);gl.scale.set(2.6,2.6,1);scene.add(gl);OBS.push({x,z,r:.75})}
  const bush=[toon(0x7cc45a),toon(0x9ad874)];
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4,x=Math.sin(a)*11,z=Math.cos(a)*11,g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=a;const b=new THREE.Mesh(new THREE.BoxGeometry(3.6,1.1,1.4),stoneM);b.position.y=.55;g.add(b);
    for(let i=-1;i<=1;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.64,14,10),bush[i&1]);s.position.set(i*1.1,1.35,0);s.scale.y=.85;g.add(s)}scene.add(g);
    [-1,0,1].forEach(o=>OBS.push({x:x+Math.cos(a)*o*1.1,z:z-Math.sin(a)*o*1.1,r:1.05}))}
  const fb=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.7,.75,32),stoneM);fb.position.y=.37;scene.add(fb);const wa=new THREE.Mesh(new THREE.CylinderGeometry(2.15,2.15,.1,32),toon(0x7cc8e8,{emissive:0x10304a}));wa.position.y=.72;scene.add(wa);
  const fc=new THREE.Mesh(new THREE.CylinderGeometry(.3,.4,1.7,14),stoneM);fc.position.y=1.2;scene.add(fc);const fw=new THREE.Mesh(new THREE.CylinderGeometry(.9,.4,.35,18),stoneM);fw.position.y=2.1;scene.add(fw);
  const goldM=toon(0xeeb848,{emissive:0x2a1800}),whiteM=toon(0xf0e2d0);
  {const g=new THREE.Group();g.position.set(0,0,-72);const base=new THREE.Mesh(new THREE.BoxGeometry(34,12,18),whiteM);base.position.y=6;g.add(base);const dr=new THREE.Mesh(new THREE.CylinderGeometry(8,8,4,28),whiteM);dr.position.y=14;g.add(dr);
    const dm=new THREE.Mesh(new THREE.SphereGeometry(8.6,32,18,0,Math.PI*2,0,Math.PI/2),goldM);dm.position.y=16;dm.scale.y=1.25;g.add(dm);const fn=new THREE.Mesh(new THREE.ConeGeometry(.5,3,8),goldM);fn.position.y=28;g.add(fn);
    [-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.6,34,14),whiteM);m.position.set(s*21,17,2);g.add(m);const b=new THREE.Mesh(new THREE.CylinderGeometry(2,2,.8,14),goldM);b.position.set(s*21,27,2);g.add(b);const d=new THREE.Mesh(new THREE.SphereGeometry(1.6,16,10,0,Math.PI*2,0,Math.PI/2),goldM);d.position.set(s*21,34,2);d.scale.y=1.4;g.add(d)});scene.add(g)}
  const trunk=toon(0xb08a5a),leaf=toon(0x6ab84a,{side:THREE.DoubleSide}),lg=new THREE.PlaneGeometry(3.6,.8);lg.translate(1.8,0,0);
  for(let k=0;k<22;k++){const a=Math.random()*Math.PI*2,r=31+Math.random()*16;if(Math.abs(Math.sin(a))<.2&&Math.cos(a)<0)continue;const h=7+Math.random()*5,g=new THREE.Group();g.position.set(Math.sin(a)*r,0,Math.cos(a)*r);const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,h,8),trunk);t.position.y=h/2;g.add(t);
    for(let i=0;i<7;i++){const l=new THREE.Mesh(lg,leaf);l.position.y=h;l.rotation.y=i/7*Math.PI*2;l.rotation.z=-.45-Math.random()*.2;l.rotation.x=Math.PI/2;g.add(l)}scene.add(g)}
  const brass=toon(0xe6b84a),lan=new THREE.Group();
  {const b=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,.05,16),brass);b.position.y=-.13;lan.add(b);const t=new THREE.Mesh(new THREE.ConeGeometry(.14,.11,16),brass);t.position.y=.15;lan.add(t);lan.add(new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.22,16),new THREE.MeshBasicMaterial({color:0xfff6d8,transparent:true,opacity:.35})));
    for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.BoxGeometry(.014,.24,.014),brass);r.position.set(Math.cos(i*Math.PI/2)*.095,0,Math.sin(i*Math.PI/2)*.095);lan.add(r)}const h=new THREE.Mesh(new THREE.TorusGeometry(.07,.012,6,16,Math.PI),brass);h.position.y=.2;lan.add(h)}
  const coreM=new THREE.MeshBasicMaterial({color:0xffd86a}),core=new THREE.Mesh(new THREE.SphereGeometry(.06,12,10),coreM);lan.add(core);
  const lglow=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xffd080,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));lglow.scale.set(.6,.6,1);lan.add(lglow);
  lan.scale.setScalar(.5);cam.add(lan);const pl=new THREE.PointLight(0xffd8a0,.5,10);pl.position.set(.3,-.2,-.6);cam.add(pl);
  const EG={body:new THREE.SphereGeometry(.7,22,16),tail:new THREE.ConeGeometry(.55,1.3,16),horn:new THREE.ConeGeometry(.12,.45,10),eye:new THREE.SphereGeometry(.17,14,10),pup:new THREE.SphereGeometry(.08,10,8),shield:new THREE.SphereGeometry(1.25,26,18),crown:new THREE.CylinderGeometry(.42,.36,.3,8,1,true)};
  const eyeW=new THREE.MeshBasicMaterial({color:0xffffff}),pupD=new THREE.MeshBasicMaterial({color:0x2a2040}),pupR=new THREE.MeshBasicMaterial({color:0xd0304a});
  G3={R,scene,cam,glow,hemi,dl,SKYU,SUNS,AWANS,stars,moon,toon,portals,OBS,RAD,lan,core,coreM,lglow,pl,EG,eyeW,pupD,pupR,goldM,capM,shotM:new THREE.SpriteMaterial({map:glow,color:0xffe08a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),pm:{}};
  const rs=()=>{const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.fov=w<h?80:68;cam.updateProjectionMatrix();lan.position.set(w<h?.15:.28,-.27,-.75)};addEventListener('resize',rs);rs();requestAnimationFrame(loop)}
const pmat=c=>G3.pm[c]||(G3.pm[c]=new THREE.SpriteMaterial({map:G3.glow,color:c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
function gburst(pos,color,n,sp=6,size=.5){for(let i=0;i<n;i++){const s=new THREE.Sprite(pmat(color));s.position.copy(pos);s.scale.set(size,size,1);G3.scene.add(s);gparts.push({s,v:new THREE.Vector3((rnd0()-.5)*sp,rnd0()*sp*.8,(rnd0()-.5)*sp),l:.7+rnd0()*.4,m:1.1,z:size})}}
function spawn(kind){const {EG,toon,scene}=G3,m=toon(kind==='r'?0xb85a80:0x8a6ac8,{emissive:kind==='r'?0x2a0818:0x1a0c30});const g=new THREE.Group(),b=new THREE.Mesh(EG.body,m);b.scale.set(1,1.08,1);g.add(b);const t=new THREE.Mesh(EG.tail,m);t.rotation.x=Math.PI;t.position.y=-.85;g.add(t);
  [-1,1].forEach(s=>{const h=new THREE.Mesh(EG.horn,m);h.position.set(s*.32,.64,0);h.rotation.z=-s*.35;g.add(h);const e=new THREE.Mesh(EG.eye,G3.eyeW);e.position.set(s*.24,.12,.56);g.add(e);const p=new THREE.Mesh(EG.pup,kind==='n'?G3.pupD:G3.pupR);p.position.set(s*.24,.1,.7);g.add(p)});
  if(kind==='boss'){const c=new THREE.Mesh(EG.crown,G3.goldM);c.position.y=.78;g.add(c)}
  const glw=new THREE.Sprite(new THREE.SpriteMaterial({map:G3.glow,color:kind==='r'?0xff7aa0:0xb08af0,transparent:true,opacity:.28,depthWrite:false}));glw.scale.set(2.2,2.2,1);glw.position.y=-.2;g.add(glw);
  const sc=kind==='boss'?2.6:kind==='r'?.9:1;g.scale.setScalar(sc);const pt=pick(G3.portals),d=G3.RAD-1.5;g.position.set(Math.sin(pt.a)*d,1.3*sc,Math.cos(pt.a)*d);
  const e={g,m,kind,hp:kind==='boss'?20:2,max:kind==='boss'?20:2,spd:kind==='boss'?1.7:kind==='r'?4:2.8,r:.8*sc,sc,ph:rnd0()*6,hit:0,cd:0,dmg:kind==='boss'?18:kind==='r'?11:8,sh:null,em:kind==='r'?0x2a0818:0x1a0c30};
  if(kind==='boss'){e.sh=new THREE.Mesh(EG.shield,new THREE.MeshBasicMaterial({color:0xff8ab0,transparent:true,opacity:.16,depthWrite:false}));g.add(e.sh);$('gBoss').hidden=false;updBoss(e)}
  scene.add(g);enemies.push(e);gburst(g.position,0xc0a0ff,10,4)}
function ban(b,s){$('gBanB').textContent=b;$('gBanS').textContent=s||'';const e=$('gBan');e.classList.add('on');clearTimeout(ban.h);ban.h=setTimeout(()=>e.classList.remove('on'),2200)}
function ghud(){$('gHpT').textContent=Math.max(0,Math.round(PL.hp));$('gHp').style.width=Math.max(0,PL.hp)+'%';$('gPas').textContent='+'+earned;$('gWv').textContent=`Gelombang ${wave+1}/${WAVES.length}`;$('gWs').textContent=`${enemies.length+queue.length} Ghaflah · Juz ${gJ}`;
  [...$('gStk').children].forEach((i,k)=>i.classList.toggle('on',k<PL.spec));$('gSpec').hidden=PL.spec<3}
function gammo(){$('gAmmo').innerHTML=Array.from({length:8},(_,k)=>`<i class="${k<PL.ammo?'on':''}"></i>`).join('');$('gFire').classList.toggle('empty',PL.ammo<=0);$('gLoad').classList.toggle('need',PL.ammo<=0);
  G3.coreM.color.setHex(PL.ammo>0?0xffd86a:0x7a6a50);G3.lglow.material.opacity=PL.ammo>0?.18+PL.ammo*.025:.05;G3.pl.intensity=PL.ammo>0?.5:.15}
function updBoss(e){$('gBossI').style.width=(e.hp/e.max*100)+'%';$('gBossS').textContent=e.sh?'Perisai aktif: gunakan Nur Agung untuk memecahnya':'Perisai pecah! Serang terus'}
function startWave(i){wave=i;const w=WAVES[i];queue=shuf([...Array(w.n).fill('n'),...Array(w.r||0).fill('r')]);if(w.boss)queue.unshift('boss');spawnT=1.2;ban(`Gelombang ${i+1}`,w.boss?'Ghaflah Agung datang bersama pasukannya':`${queue.length} Ghaflah mendekat`);ghud()}
function reset(){enemies.forEach(e=>G3.scene.remove(e.g));bullets.forEach(s=>G3.scene.remove(s.s));gparts.forEach(p=>G3.scene.remove(p.s));enemies=[];bullets=[];gparts=[];
  Object.assign(PL,{x:0,z:9,yaw:0,pitch:0,hp:100,ammo:0,streak:0,spec:0});kills=shots=hits=ans=cor=earned=boosted=0;between=0;$('gBoss').hidden=true;gammo();ghud()}
function begin(){reset();applyAlam();grun=true;$('gCtrl').classList.remove('off');startWave(0);setTimeout(()=>{if(grun&&PL.ammo<=0)openGQ()},1600)}
function weakest(){const own=[0,1,2,3].filter(q=>bget(gJ,q)&&bget(gJ,q).lv);if(!own.length)return null;return own.sort((a,b)=>str(gJ,a)-str(gJ,b))[0]}
function openGQ(){if(gq||!grun)return;const X=juzPool(gJ),q=ask(pick(['sambung','sambung','lengkapi','tebak','susun']),X,X,gJ);if(!q)return;gq=true;firing=false;$('gCtrl').classList.add('off');
  openQ(q,{title:q.label,sub:`Juz ${gJ} · waktu melambat`,nextLabel:'Kembali berjaga',onClose:()=>{gq=false;if(grun)$('gCtrl').classList.remove('off')},
    onAnswer(ok){ans++;let extra;if(ok){cor++;PL.ammo=8;PL.streak++;PL.spec=Math.min(3,PL.spec+1);const w=weakest();if(w!=null){setStr(gJ,w,str(gJ,w)+6);boosted++;save()}extra=`+8 Nur${w!=null?` · Bagian ${w+1} +6%`:''}${PL.spec>=3?' · Nur Agung siap':''}`}
      else{PL.ammo=Math.max(PL.ammo,2);PL.streak=0;PL.spec=0;extra='Lentera redup, hanya 2 Nur'}gammo();ghud();return extra},
    onNext(){closeQ();gq=false;if(grun)$('gCtrl').classList.remove('off')}})}
const v3=()=>new THREE.Vector3();
function fire(){if(!grun||gq)return;if(PL.ammo<=0){openGQ();return}PL.ammo--;shots++;gammo();kick=1;const {cam,scene}=G3;const dir=v3();cam.getWorldDirection(dir);let best=null,ba=.15;
  for(const e of enemies){const v=e.g.position.clone().sub(cam.position);if(v.length()>48)continue;v.normalize();const a=v.angleTo(dir);if(a<ba){ba=a;best=v}}if(best)dir.lerp(best,.8).normalize();
  const s=new THREE.Sprite(G3.shotM);s.scale.set(.9,.9,1);s.position.copy(cam.position).addScaledVector(dir,.9);s.position.y-=.18;scene.add(s);bullets.push({s,v:dir.multiplyScalar(40),l:1.5})}
function useSpec(){if(PL.spec<3||!grun||gq)return;PL.spec=0;ghud();const f=$('gFlash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');gburst(new THREE.Vector3(PL.x,1.2,PL.z),0xffe08a,40,18,.8);
  for(const e of enemies){if(Math.hypot(e.g.position.x-PL.x,e.g.position.z-PL.z)<17){if(e.sh){e.g.remove(e.sh);e.sh=null;gburst(e.g.position,0xff8ab0,30,10,.9);ban('Perisai pecah!','Ghaflah Agung bisa dilukai sekarang')}dmg(e,e.kind==='boss'?4:6)}}enemies=enemies.filter(e=>!e.dead);ghud()}
function dmg(e,n){e.hp-=n;e.hit=.15;if(e.kind==='boss')updBoss(e);if(e.hp<=0&&!e.dead){e.dead=true;kills++;earned+=e.kind==='boss'?5:1;gburst(e.g.position,0xc0a0ff,18,8,.6);gburst(e.g.position,0xffe08a,12,6,.45);G3.scene.remove(e.g);if(e.kind==='boss')$('gBoss').hidden=true;ghud()}}
function hurt(n){PL.hp-=n;hurtT=.35;const v=$('gVig');v.classList.add('on');setTimeout(()=>v.classList.remove('on'),180);ghud();if(PL.hp<=0)end(false)}
function end(win){if(!grun)return;grun=false;firing=false;if(gq){closeQ();gq=false}$('gCtrl').classList.add('off');if(win)earned+=3;S.pas+=earned;save();const acc=shots?Math.round(hits/shots*100):0,j=gJ;
  modal(`<header class="${win?'green':'grey'}">${win?'Wilayah aman!':'Lentera padam'}<small>${win?`Semua Ghaflah di Juz ${j} dihalau`:`Bertahan sampai gelombang ${wave+1}`}</small></header>
  <div class="grid2" style="padding:12px 16px 0"><div class="stat"><b>+${earned}</b>pasukan (total ${S.pas})</div><div class="stat"><b>${kills}</b>Ghaflah dikalahkan</div><div class="stat"><b>${cor}/${ans}</b>jawaban benar</div><div class="stat"><b>+${boosted*6}%</b>kekuatan bangunan</div></div>
  <p>Pasukan ikut sebagai bala bantuan di Duel berikutnya.${win?' Bonus 3 pasukan karena semua gelombang selesai.':''}</p>`,[{t:'Kembali ke wilayah',f:()=>hubReturn({type:'garda',j})},{t:'Jaga lagi',c:'b-plum',f:()=>begin()}])}
let stick=null,look=null;const keys={};const touch=$('gtouch'),STK=$('gStick'),KNOB=$('gKnob');
touch.addEventListener('pointerdown',e=>{if(!grun||gq)return;touch.setPointerCapture(e.pointerId);if(e.pointerType!=='mouse'&&e.clientX<innerWidth*.45&&!stick){stick={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0};STK.style.left=(e.clientX-60)+'px';STK.style.top=(e.clientY-60)+'px';STK.style.bottom='auto'}else if(!look)look={id:e.pointerId,x:e.clientX,y:e.clientY}});
touch.addEventListener('pointermove',e=>{if(stick&&e.pointerId===stick.id){let dx=e.clientX-stick.x,dy=e.clientY-stick.y;const d=Math.hypot(dx,dy);if(d>52){dx*=52/d;dy*=52/d}stick.dx=dx/52;stick.dy=dy/52;KNOB.style.transform=`translate(${dx}px,${dy}px)`}
  else if(look&&e.pointerId===look.id){const k=e.pointerType==='mouse'?.0045:.0062;PL.yaw-=(e.clientX-look.x)*k;PL.pitch=clamp(PL.pitch-(e.clientY-look.y)*k*.8,-1.05,1.05);look.x=e.clientX;look.y=e.clientY}});
const rel=e=>{if(stick&&e.pointerId===stick.id){stick=null;KNOB.style.transform='';STK.style.left='';STK.style.top='';STK.style.bottom=''}if(look&&e.pointerId===look.id)look=null};touch.addEventListener('pointerup',rel);touch.addEventListener('pointercancel',rel);
const bF=$('gFire');bF.addEventListener('pointerdown',e=>{e.preventDefault();firing=true;fireCd=0});['pointerup','pointercancel','pointerleave'].forEach(t=>bF.addEventListener(t,()=>firing=false));bF.addEventListener('keydown',e=>{if(e.key==='Enter')fire()});
$('gLoad').onclick=()=>{if(PL.ammo>=8){ban('Nur masih penuh','Tembak dulu Ghaflah-nya');return}openGQ()};$('gSpec').onclick=useSpec;
addEventListener('keydown',e=>{if(CUR!=='garda'||!grun||gq)return;keys[e.code]=1;if(e.code==='Space'){e.preventDefault();firing=true}if(e.code==='KeyR')$('gLoad').click();if(e.code==='KeyE')useSpec()});addEventListener('keyup',e=>{keys[e.code]=0;if(e.code==='Space')firing=false});
$('gBack').onclick=()=>{grun=false;firing=false;$('gCtrl').classList.add('off');if(earned){S.pas+=earned;save()}hubReturn(null)};
function collide(o){const R=G3.RAD-2.2,d=Math.hypot(o.x,o.z);if(d>R){o.x*=R/d;o.z*=R/d}for(const b of G3.OBS){const dx=o.x-b.x,dz=o.z-b.z,dd=Math.hypot(dx,dz),m=b.r+(o.r||.5);if(dd<m&&dd>0){o.x=b.x+dx/dd*m;o.z=b.z+dz/dd*m}}}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(CUR!=='garda'){requestAnimationFrame(loop);return}if((alamAcc-=dt)<=0){alamAcc=1.5;applyAlam()}ts+=((gq?.08:1)-ts)*Math.min(1,dt*8);const sdt=dt*ts;TT+=dt;const {cam,R,scene}=G3;
  if(grun){let mx=(stick?stick.dx:0)+((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0),my=(stick?stick.dy:0)+((keys.KeyS||keys.ArrowDown)?1:0)-((keys.KeyW||keys.ArrowUp)?1:0);
    if(!gq&&(mx||my)){const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}const sp=6.2*sdt,sy=Math.sin(PL.yaw),cy=Math.cos(PL.yaw);PL.x+=(cy*mx+sy*my)*sp;PL.z+=(-sy*mx+cy*my)*sp;walkT+=sdt*Math.hypot(mx,my);const o={x:PL.x,z:PL.z,r:.5};collide(o);PL.x=o.x;PL.z=o.z}
    fireCd-=dt;if(firing&&fireCd<=0&&!gq){fire();fireCd=.22}
    if(queue.length){spawnT-=sdt;if(spawnT<=0){spawn(queue.shift());spawnT=1.25;ghud()}}
    else if(!enemies.length&&!between){if(wave>=WAVES.length-1)end(true);else{between=3;ban(`Gelombang ${wave+1} selesai`,'Isi Nur selagi aman');ghud()}}
    if(between>0){between-=dt;if(between<=0){between=0;startWave(wave+1)}}
    for(const e of enemies){const p=e.g.position,dx=PL.x-p.x,dz=PL.z-p.z,d=Math.hypot(dx,dz);
      if(d>e.r+.8){let vx=dx/d,vz=dz/d;for(const o of enemies){if(o===e)continue;const ox=p.x-o.g.position.x,oz=p.z-o.g.position.z,od=Math.hypot(ox,oz);if(od<e.r+o.r&&od>0){vx+=ox/od*.8;vz+=oz/od*.8}}const vl=Math.hypot(vx,vz)||1;const o={x:p.x+vx/vl*e.spd*sdt,z:p.z+vz/vl*e.spd*sdt,r:e.r*.7};collide(o);p.x=o.x;p.z=o.z}
      else if(e.cd<=0){hurt(e.dmg);e.cd=1.1;p.x-=dx/d*1.2;p.z-=dz/d*1.2}
      e.cd-=sdt;p.y=1.3*e.sc+Math.sin(TT*3+e.ph)*.15*e.sc;e.g.rotation.y=Math.atan2(dx,dz);e.hit-=dt;e.m.emissive.setHex(e.hit>0?0xfff0b0:e.em);if(e.sh)e.sh.material.opacity=.13+.06*Math.sin(TT*5)}
    for(const s of bullets){s.s.position.addScaledVector(s.v,sdt);s.l-=sdt;const p=s.s.position;if(Math.hypot(p.x,p.z)>G3.RAD-.6||p.y<.05)s.l=0;for(const b of G3.OBS){if(p.y<2&&Math.hypot(p.x-b.x,p.z-b.z)<b.r){s.l=0;gburst(p,0xffe08a,4,3,.3)}}
      for(const e of enemies){if(s.l<=0||e.dead)continue;if(p.distanceTo(e.g.position)<e.r+.35){s.l=0;hits++;if(e.sh)gburst(p,0xff8ab0,6,5,.35);else{dmg(e,1);gburst(p,0xffe08a,6,4,.35)}}}if(s.l<=0)scene.remove(s.s)}
    const n0=enemies.length;bullets=bullets.filter(s=>s.l>0);enemies=enemies.filter(e=>!e.dead);if(enemies.length!==n0)ghud();hurtT-=dt}
  for(const p of gparts){p.l-=dt;p.s.position.addScaledVector(p.v,dt);p.v.y-=6*dt;const k=Math.max(0,p.l/p.m);p.s.scale.set(p.z*k+.05,p.z*k+.05,1);if(p.l<=0)scene.remove(p.s)}gparts=gparts.filter(p=>p.l>0);
  for(const pt of G3.portals){pt.pm.opacity=.6+.2*Math.sin(TT*3+pt.a);pt.gl.material.opacity=.45+.2*Math.sin(TT*2+pt.a)}
  kick=Math.max(0,kick-dt*6);const bob=Math.sin(walkT*9)*.015,lx=innerWidth<innerHeight?.15:.28;G3.lan.position.set(lx+Math.cos(walkT*4.5)*.008,-.27+bob+(gq?-.05:0),-.75+kick*.06);G3.core.scale.setScalar(1+kick*.8);
  const sh=hurtT>0?(rnd0()-.5)*.04:0;cam.position.set(PL.x,1.65+Math.abs(bob)*.6,PL.z);cam.rotation.set(PL.pitch+sh,PL.yaw+sh,0);R.render(scene,cam);requestAnimationFrame(loop)}
function applyTier(){if(G3)G3.capM.color.set(TIERS[tierOf(gJ)].roof)}
let alamAcc=0;
function applyAlam(){if(!G3||!window.alamKeadaan)return;const a=alamKeadaan(),[r,g,b]=alamWarna(a),m=a.mendung;
  G3.SKYU.uT.value.set(r,g,b);G3.SKYU.uG.value=m*.7;G3.scene.fog.color.setRGB(.94*r,.78*g,.75*b);G3.scene.fog.near=a.kabut?8:a.hujan>.5?18:34;G3.scene.fog.far=a.kabut?70:a.hujan>.5?95:140;
  G3.hemi.intensity=.72*(1-.6*a.gelap)*(1-.3*m);G3.dl.intensity=.55*(1-a.gelap)*(1-.7*m);const sv=a.gelap<.5&&m<.6;G3.SUNS.forEach(s=>s.visible=sv);
  G3.AWANS.forEach(c=>{c.material.opacity=.55+.35*m;c.material.color.setRGB(r*(1-.35*m),g*(1-.35*m),b*(1-.3*m))});G3.stars.material.opacity=a.gelap*(1-m)*.95;G3.moon.visible=a.gelap>.5&&m<.6;
  G3.pl.intensity=.5+1.3*a.gelap+.4*m;G3.pl.distance=10+8*a.gelap}
window.startGarda=function(j){gJ=j;go('garda');$('gCtrl').classList.add('off');$('loadS').textContent='Menyalakan lentera…';$('load').hidden=false;
  loadThree().then(()=>{if(!G3)initGarda();applyTier();$('load').hidden=true;begin()}).catch(()=>{$('load').hidden=true;toast('Mesin 3D gagal dimuat. Periksa koneksi lalu coba lagi.');hubReturn(null)})};
if(location.hash==='#uji')window.GH={PL,get enemies(){return enemies},spawn:k=>spawn(k),openGQ,useSpec,fire,end,gammo};
}
/* ===== boot ===== */
let INTRO_DONE=false;
async function startGame(){await loadTier(S.view);layoutHub();home();hud();$('gate').hidden=true;$('load').hidden=true;go('hub');if(!frameHub.on){frameHub.on=1;requestAnimationFrame(frameHub)}
  window.lanjutIntro=()=>{if(!(S.tut&1)){S.tut|=1;save();const santri=NET.P&&NET.P.tipe==='santri';setTimeout(()=>modal(`<header>${esc(window.judulDesa?judulDesa(S.tier):'Benteng Huffazh')}<small>${esc(NET.P?NET.P.nama:'')}</small></header><p style="text-align:left">Desamu berdiri di <b>Juz 30</b>. Ketuk tanda <b>+</b> untuk mendirikan bangunan lewat murajaah; tiap bangunan menjaga seperempat juz.</p><p style="text-align:left"><b>Rihlah</b> membuka wilayah juz berikutnya, <b>Duel</b> merebutnya, dan <b>Garda</b> menambah pasukan sekaligus memperkuat bangunan.${santri?` Wilayah yang bisa dibuka mengikuti hafalan yang sudah disetorkan (${MAXJ} juz).`:' Tiap 5 juz, wilayahmu naik tingkat.'}</p>`,[{t:'Bismillah, mulai',f:()=>setTimeout(()=>{if(window.sholatTawarIzin)sholatTawarIzin()},300)}]),350)}else setTimeout(()=>{if(window.sholatTawarIzin&&!$('modal').classList.contains('on'))sholatTawarIzin()},700)};
  if(window.desaMulai)desaMulai();else lanjutIntro()}
function boot(){resizeHub();addEventListener('resize',resizeHub);netInit();
  fetch('data/surah.json').then(r=>{if(!r.ok)throw 0;return r.json()}).then(async a=>{a.forEach(s=>SUR[s.n]=s);
    if(NET.demo)return pilihPemain({tipe:'demo',id:'demo',nama:'Mode coba'});
    const ses=await netSesi();if(!ses)return gate('gLogin');
    try{routeMe(await netSaya())}catch(e){gate('gLogin',netErr(e))}})
  .catch(()=>{$('loadS').textContent='Data gagal dimuat. Muat ulang halaman.'})}
if(location.hash.indexOf('uji')>=0)window.BHX={get S(){return S},set S(v){S=v},openPlot,openTerr,hubQuiz,startRihlah,startDuel,layoutHub,hud,get plots(){return plots},get terr(){return terr},viewTier,dfinish,get HZ(){return HZ},rwin,get B(){return B},MF_,EF_,cam,get NET(){return NET},get GHO(){return GHO},get REC(){return REC}};
