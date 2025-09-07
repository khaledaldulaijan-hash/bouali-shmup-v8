
(()=>{const C=document.getElementById('game'),X=C.getContext('2d');const W=C.width,H=C.height;
const scoreEl=document.getElementById('score'),livesEl=document.getElementById('lives'),waveEl=document.getElementById('wave');
const intro=document.getElementById('intro'); const startBtn=document.getElementById('startBtn');
const rotateHint=document.getElementById('rotateHint'); const playPortrait=document.getElementById('playPortrait');
const muteBtn=document.getElementById('muteBtn'); const ettifaqBtn=document.getElementById('ettifaqBtn');

// Audio (WebAudio beeps + meow + bgm)
const AC=(window.AudioContext||window.webkitAudioContext)?new (window.AudioContext||window.webkitAudioContext)():null;
let MUTE=false, VOL_SFX=1.0, VOL_BGM=0.35;
// YouTube BGM config (from user): https://youtu.be/0O3olZEo0HU
const BGM_YT_ID='0O3olZEo0HU';
function beep(f=440,d=0.08,t='square',v=0.05){if(!AC)return;const o=AC.createOscillator();const g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.value=(MUTE?0:(v*VOL_SFX));o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}
function meow(){ if(!AC) return; beep(440,0.06,'triangle',0.04); setTimeout(()=>beep(510,0.08,'triangle',0.05),70); setTimeout(()=>beep(430,0.05,'triangle',0.04),160); }
const SFX={
  shoot:()=>beep(880,0.05,'square',0.04),
  hit:()=>beep(250,0.08,'sawtooth',0.06),
  power:()=>beep(1200,0.10,'triangle',0.05),
  boss:()=>beep(320,0.20,'sawtooth',0.07),
  refuel:()=>{beep(520,0.1,'triangle',0.05);setTimeout(()=>beep(640,0.12,'triangle',0.05),100);},
  win:()=>{beep(660,0.12);setTimeout(()=>beep(880,0.12),120);setTimeout(()=>beep(990,0.2,'triangle',0.06),260);},
  lose:()=>{beep(220,0.2,'sawtooth',0.06);setTimeout(()=>beep(160,0.25,'square',0.06),200);},
  meow:meow,
  chant:()=>{ if(!AC) return; beep(392,0.12,'square',0.05); setTimeout(()=>beep(392,0.12,'square',0.05),220); setTimeout(()=>beep(330,0.22,'square',0.06),470); },
  spit:()=>{ if(!AC) return; beep(200,0.08,'sawtooth',0.06); setTimeout(()=>beep(150,0.06,'square',0.05),80); },
  phone:()=>{ if(!AC) return; beep(900,0.06,'square',0.05); setTimeout(()=>beep(900,0.06,'square',0.05),220); }
};

// Background music: try assets/bgm.mp3, otherwise synth loop
let bgmEl=null, synthTimer=null, synthStep=0, triedBgm=false;
let ytPlayer=null, ytApiReady=false, ytRequested=false, triedYT=false;
function startSynthLoop(){ if(!AC||synthTimer) return; const seq=[
  {f:392,d:0.18},{f:440,d:0.18},{f:494,d:0.22},{f:392,d:0.18},
  {f:349,d:0.18},{f:392,d:0.24},{f:330,d:0.26},{f:262,d:0.3}
];
  synthTimer=setInterval(()=>{ if(MUTE) return; const n=seq[synthStep%seq.length]; beep(n.f,n.d,'triangle',0.02); synthStep++; },260);
}
function stopSynthLoop(){ if(synthTimer){ clearInterval(synthTimer); synthTimer=null; } }
function ensureYTApi(cb){
  if(ytApiReady){ cb(); return; }
  if(!ytRequested){
    ytRequested=true;
    const s=document.createElement('script'); s.src='https://www.youtube.com/iframe_api'; s.async=true; document.head.appendChild(s);
    window.onYouTubeIframeAPIReady=()=>{ ytApiReady=true; cb(); };
  }
}
function playBGMYouTube(){
  if(MUTE || !BGM_YT_ID) return false;
  try{
    ensureYTApi(()=>{
      if(!ytPlayer){
        ytPlayer=new YT.Player('ytBgm',{
          width:200,height:113,videoId:BGM_YT_ID,
          playerVars:{autoplay:1,controls:0,loop:1,playlist:BGM_YT_ID,modestbranding:1,rel:0,playsinline:1,origin:location.origin},
          events:{
            onReady:(e)=>{ try{ e.target.setVolume(Math.round(VOL_BGM*100)); if(!MUTE) e.target.playVideo(); }catch{} },
            onError:()=>{ /* fallback if YT fails */ startSynthLoop(); }
          }
        });
      } else {
        try{ ytPlayer.setVolume(Math.round(VOL_BGM*100)); ytPlayer.playVideo(); }catch{}
      }
    });
    triedYT=true;
    return true;
  }catch{ return false; }
}
function playBGM(){
  if(MUTE) return;
  // Prefer YouTube if configured
  if(BGM_YT_ID && !triedYT){ if(playBGMYouTube()) return; }
  if(bgmEl){ bgmEl.volume=VOL_BGM; const p=bgmEl.play(); if(p&&p.catch) p.catch(()=>{}); return; }
  if(!triedBgm){
    triedBgm=true;
    try{ const a=new Audio('assets/bgm.mp3'); a.loop=true; a.volume=VOL_BGM; a.preload='auto';
      a.addEventListener('error',()=>{ startSynthLoop(); });
      a.play().then(()=>{ bgmEl=a; }).catch(()=>{ startSynthLoop(); });
    }catch{ startSynthLoop(); }
  } else { startSynthLoop(); }
}
function pauseBGM(){ if(bgmEl){ try{bgmEl.pause();}catch{}}; if(ytPlayer){ try{ytPlayer.pauseVideo();}catch{} } stopSynthLoop(); }

// Assets
const AS={player:'assets/player.png',ram:'assets/ram.png',cavo:'assets/cavo.png',cat1:'assets/cat1.png',cat2:'assets/cat2.png',cat3:'assets/cat3.png',tent:'assets/tent.png'},IM={};
function load(){return Promise.all(Object.entries(AS).map(([k,src])=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>{IM[k]=i;res();};i.onerror=rej;i.src=src;})));}
function loadOptional(k,src){ try{ const i=new Image(); i.onload=()=>{ IM[k]=i; }; i.src=src; }catch{} }

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>Math.random()*(b-a)+a,now=()=>performance.now();

// Input
const keys={}; addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space')e.preventDefault(); if(AC&&AC.state==='suspended')AC.resume();});
addEventListener('keyup',e=>keys[e.code]=false);
let pointer={active:false,x:W/2,y:H-120,fingers:0};
function mapToCanvas(clientX,clientY){const r=C.getBoundingClientRect();const sx=W/r.width, sy=H/r.height;return {x:(clientX-r.left)*sx,y:(clientY-r.top)*sy};}
C.addEventListener('pointerdown',e=>{pointer.active=true;pointer.fingers++;const p=mapToCanvas(e.clientX,e.clientY);pointer.x=p.x;pointer.y=p.y; if(AC&&AC.state==='suspended')AC.resume();});
addEventListener('pointerup',e=>{pointer.fingers=Math.max(0,pointer.fingers-1);if(pointer.fingers===0)pointer.active=false;});
addEventListener('pointercancel',()=>{pointer.fingers=0;pointer.active=false;});
addEventListener('pointermove',e=>{if(pointer.active){const p=mapToCanvas(e.clientX,e.clientY);pointer.x=p.x;pointer.y=p.y;}});

// Responsive fit
function fit(){
  const hud=document.querySelector('.hud');
  const hudH=hud?hud.getBoundingClientRect().height:0;
  const availW=window.innerWidth;
  const availH=Math.max(200,window.innerHeight - hudH - 12);
  const s=Math.min(availW/W, availH/H);
  C.style.width=(W*s)+'px';
  C.style.height=(H*s)+'px';
  C.style.marginTop=(hudH+12)+'px';
  const portrait=window.innerHeight>window.innerWidth && window.innerWidth<700;
  if(rotateHint){ rotateHint.style.display = portrait ? 'flex':'none'; }
}
addEventListener('resize',fit); addEventListener('orientationchange',fit);

// Speech bubbles
const bubbles=[];
function say(x,y,text,ttl=1400){bubbles.push({x,y,text,ttl});}
function drawBubbles(dt){for(const b of bubbles){b.ttl-=dt*1000;}
  while(bubbles.length && bubbles[0].ttl<=0) bubbles.shift();
  X.font='14px sans-serif'; X.textBaseline='top';
  for(const b of bubbles){const pad=6; const w = Math.min(260, X.measureText(b.text).width+pad*2); const h=28;
    X.fillStyle='rgba(15,22,36,0.9)'; X.fillRect(b.x-w/2, b.y- h - 14, w, h);
    X.strokeStyle='rgba(47,74,120,0.9)'; X.strokeRect(b.x-w/2, b.y- h -14, w, h);
    X.fillStyle='#e9eef7'; X.fillText(b.text, b.x-w/2+pad, b.y-h-10);
  }}

// State
const S={running:true,score:0,lives:3,wave:1,phase:'intro',time:0,
  player:{x:W/2,y:H-80,w:75,h:96,speed:440,fireCd:0,fireRate:150,superReady:0,iFrames:0,hitFlash:0,shieldT:0},
  bullets:[],enemies:[],enemyBullets:[],boss:null,station:null,tent:null,toTentTimer:0,intermissionTimer:0,bossRage:false,
  bossTaunt75:false,bossTaunt25:false,
  streak:{count:0,t:0},
  ettifaq:false,
  battlePause:false,
  fahad:{active:false,mode:'idle',t:0,callAt:1600,nextAt:9000,shipX:-120,shipY:80,shipV:140,shot:false,spitCd:0,wave3Triggered:false}
};

const CAVO_LINES=['فل بنزين + دبل إسبرسو ☕🚀','خصم خاص للأبطال اليوم!','خذ آيس شيكن على الحساب 😂','قهوة لاتيه… وطلقات أسرع!','تمور طاقة مضافة 🍯'];
const CAT_LINES=['مياو!','وين القهوة؟','مياااو','لاتيه؟','كابتشينو!'];
const POWER_LINES=['هذا شاهي جمر؟','تمر طاقة… أحلى Boost!','قهوة على السريع!','يا سلام زادت النيران!'];
const TAUNT_START=['أدوسك وأطلعك من المجرة!','القهوة عليّ لو فزت!','جاهز للدعس يا بوعلي؟'];
const TAUNT_RAGE=['الحين الدعس!','خلك قدها!'];
const TAUNT_LOSE=['خلاص يا رجال… خلنا نروح كافو ☕','بلاش الدعس… نتصالح؟'];
const STREAK_LINES=['دحدرناهم!','فصفصناهم!','ثلاثية نظيفة!','ما يلحقون 😎','عين ما تصيب!'];
// Ettifaq content
const ETTIFAQ_CHANTS=['هيّا اتفاق!','فارس الدهناء!','كلنا اتفاق!','هاتها يا فارس!','الاتفاق فوووق!'];
const STREAK_FOOTBALL=['هاتريك!','مراوغة وهدف!','باص على الطاير!','ضغط عالي!','ثبتها في المقص!'];
// BouAli, Latif, Fahad lines
const BOUALI_ROASTS=['القهوة مو هدف! ⚽️','وينك يا فارس الدهناء؟','ركّز يا بوعلي!','مو كل شي ستوري 😂','لا تعطي فهد الجوال!'];
const LATIF_LINES=['لطيف: يا جماعة ركّزوا','لطيف: طقطقة خفيفة بس','لطيف: بوعلي مزح لا تزعل','لطيف: هدّ اللعب شوي','لطيف: بلا خرابيط… ركّزوا'];
const FAHAD_LINES=['فهد: خلّني أشوف…','فهد: دقيقة بس…','فهد: أوووب! رجّعتها'];
const FAHAD_CALLS=['فهد: ألو؟ جايك','فهد: لحظة اتصال','فهد: ثواني بس'];

function hearts(){livesEl.textContent='';for(let i=0;i<3;i++)livesEl.textContent+=i<S.lives?'❤️':'🤍';}
function reset(){
  S.score=0;S.lives=3;S.wave=1;S.phase='wave';
  S.bullets=[];S.enemies=[];S.enemyBullets=[];S.boss=null;S.station=null;S.intermissionTimer=0;S.bossRage=false;S.player.shieldT=0;
  S.tent=null; S.toTentTimer=0;
  S.fahad.active=false; S.fahad.shot=false; S.fahad.wave3Triggered=false; S.fahad.nextAt=S.time+9000;
  hearts(); spawnWave(8); S.waveStartT=S.time; waveEl.textContent='Wave: 1';
}

// Spawns
function spawnWave(n){
  S.waveStartT = S.time || 0;
  const patterns=['straight','zigzag','sine','dive'];
  for(let i=0;i<n;i++){
    const x=80+i*((W-160)/Math.max(1,n-1));
    const k=['cat1','cat2','cat3'][Math.floor(Math.random()*3)];
    const pat = S.wave<=1? 'straight' : patterns[Math.floor(Math.random()*Math.min(patterns.length, 2+Math.floor(S.wave/2)))];
    const baseVy = 60+Math.random()*40 + S.wave*6;
    const e={x,y:-rand(40,120),w:48,h:36,hp:1,vy:baseVy,fireCd:900+Math.random()*700,kind:k,pattern:pat,vx:0,phase:Math.random()*Math.PI*2,amp:30+Math.random()*40};
    if(pat==='zigzag'){ e.vx = (Math.random()<0.5?-1:1) * (40+S.wave*8); }
    if(pat==='dive'){ e.vy = baseVy*1.4; }
    S.enemies.push(e);
  }
  // Guarantee Fahad entrance early in wave 3
  if(S.wave===3 && !S.fahad.active){
    setTimeout(()=>{ if(!S.fahad.active && S.phase==='wave' && S.wave===3){ startFahad(); } }, 400);
  }
}
function ensureBoss(){S.phase='boss';S.boss={x:W/2,y:120,w:180,h:184,hp:340,vx:100,fireCd:1000}; SFX.boss(); waveEl.textContent='Boss: Lateef (RAM)'; say(W/2, 80, TAUNT_START[Math.floor(Math.random()*TAUNT_START.length)]);} 

// Fahad boss after wave 3
// removed Fahad boss: Fahad is now a timed cameo only

// CAVO station intermission
function spawnStation(){S.phase='intermission';S.station={x:W/2,y:H/2,w:160,h:100,vx:40}; S.intermissionTimer=0;
  SFX.refuel(); if(S.ettifaq) SFX.chant();
  const line = S.ettifaq ? ETTIFAQ_CHANTS[Math.floor(Math.random()*ETTIFAQ_CHANTS.length)]
                         : CAVO_LINES[Math.floor(Math.random()*CAVO_LINES.length)];
  say(W/2, S.station.y-10, line);
}

// Pre-boss announcement
let hideAnnounce=null;
function showAnnounce(text){
  const overlay=document.createElement('div'); overlay.style.position='fixed'; overlay.style.inset='0';
  overlay.style.background='rgba(0,0,0,.75)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.zIndex='90';
  const card=document.createElement('div'); card.style.background='#0f1624'; card.style.border='1px solid #1f2b46'; card.style.borderRadius='16px'; card.style.padding='18px 22px'; card.style.color='#e9eef7'; card.style.textAlign='center'; card.style.maxWidth='680px';
  card.className='bubble'; card.textContent=text; overlay.appendChild(card); document.body.appendChild(overlay);
  return ()=>{ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); };
}
function startPreBoss(){
  S.phase='preboss';
  if(hideAnnounce) { hideAnnounce(); hideAnnounce=null; }
  const base='والان وقت وحش فيغا ليمنع بوعلي من الذهاب لخيمة بوعجب الفضايية';
  const et=S.ettifaq? ' — فارس الدهناء داخل! هيّا اتفاق!':'';
  hideAnnounce=showAnnounce(base+et);
  if(S.ettifaq && SFX && SFX.chant) SFX.chant();
  S.preBossT=0;
}

// Fahad cameo: reverses controls briefly with a small UFO overlay
function startFahad(){
  if(S.fahad.active) return;
  S.fahad.active=true; S.fahad.mode='prank'; S.fahad.t=0; S.fahad.modeT=0; S.fahad.shot=false; S.fahad.spitCd=0; S.fahad.callAt=10000; // 10 seconds
  S.fahad.shipX=-120; S.fahad.shipY=60+Math.random()*80; S.fahad.shipV=140+Math.random()*80;
  say(W*0.5, 64, FAHAD_LINES[0]); // خلّني أشوف…
  SFX.hit();
  // Always wipe cats on entry and taunt
  S.enemies=[]; say(W*0.5, 84, 'الهر القذر الوصخ!');
}
function endFahad(){
  if(!S.fahad.active) return;
  S.fahad.active=false; S.fahad.mode='idle'; S.battlePause=false; say(W*0.5, 64, FAHAD_LINES[2]); // رجّعتها
  S.fahad.nextAt = S.time + (20000 + Math.random()*12000); // 20–32s
}

// Utils
function spawnBullet(x,y,vx,vy,dmg=10){S.bullets.push({x,y,vx,vy,w:4,h:12,dmg});}
function spawnEnemyBullet(x,y,vx,vy){S.enemyBullets.push({x,y,vx,vy,w:6,h:12});}
function spawnTafla(x,y,tx,ty){
  // spit aimed at player
  const dx=tx-x, dy=ty-y; const len=Math.max(0.001, Math.hypot(dx,dy));
  const spd=260; const vx=dx/len*spd, vy=dy/len*spd;
  S.enemyBullets.push({x,y,vx,vy,w:10,h:10,kind:'tafla'});
}
const aabb=(a,b)=>Math.abs(a.x-b.x)<(a.w/2+b.w/2)&&Math.abs(a.y-b.y)<(a.h/2+b.h/2);

// Loop
let lt=now(); function loop(){const t=now();const dt=(t-lt)/1000;lt=t;S.time+=dt*1000;update(dt);render(dt);requestAnimationFrame(loop);}

// Update
function update(dt){
  const p=S.player;
  if(S.phase==='intro'){return;}
  // movement (Fahad reverses controls)
  let dx=0,dy=0;if(keys.ArrowLeft)dx-=1;if(keys.ArrowRight)dx+=1;if(keys.ArrowUp)dy-=1;if(keys.ArrowDown)dy+=1;
  const inv = (S.fahad.active && S.fahad.mode==='prank')?-1:1;
  if(pointer.active){
    const tx = S.fahad.active ? (W - pointer.x) : pointer.x;
    const ty = S.fahad.active ? (H - pointer.y) : pointer.y;
    p.x+=(tx-p.x)*Math.min(1,dt*10); p.y+=(ty-p.y)*Math.min(1,dt*10);
  } else { p.x+=inv*dx*p.speed*dt; p.y+=inv*dy*p.speed*dt; }
  p.x=clamp(p.x,p.w/2,W-p.w/2);p.y=clamp(p.y,p.h/2,H-p.h/2);

  // fire & super (paused during Fahad call)
  p.fireCd-=dt*1000; if(!S.battlePause && (keys.Space||(pointer.active&&pointer.fingers===1))&&p.fireCd<=0){
    p.fireCd=p.fireRate;
    const vx = S.fahad.active ? (Math.random()-.5)*280 : 0;
    spawnBullet(p.x,p.y-p.h/2,vx,-620); SFX.shoot();
  }
  p.superReady=Math.min(1,p.superReady+dt*0.07);

  if(S.phase==='wave'){
    if(S.enemies.length===0 && S.enemyBullets.length===0){
      if(S.wave<=3){ spawnStation(); }
      else if(S.wave===4){ spawnWave(10+S.wave*2); S.phase='wave'; S.wave++; waveEl.textContent='Wave: '+S.wave; }
      else { startPreBoss(); }
    }
  }
  if(S.phase==='preboss'){
    S.preBossT += dt;
    if(S.preBossT>=1.8){ if(hideAnnounce){ hideAnnounce(); hideAnnounce=null; } ensureBoss(); }
  }

  // Fahad scheduling and timing
  if((S.phase==='wave' || S.phase==='boss') && !S.fahad.active && S.time > S.fahad.nextAt){ startFahad(); }
  // Special scripted entrance on wave 3: wipe cats then fight 5-7s
  if(S.phase==='wave' && S.wave===3 && !S.fahad.active && !S.fahad.wave3Triggered){
    if((S.time - (S.waveStartT||0)) > 600){ S.fahad.wave3Triggered=true; startFahad(); }
  }
  if(S.fahad.active){
    S.fahad.t += dt*1000; S.fahad.modeT = (S.fahad.modeT||0) + dt*1000;
    // idle bob
    S.fahad.shipY += Math.sin(S.time/250)*12*dt;
    if(S.fahad.mode==='prank'){
      // patrol left/right and bounce
      S.fahad.shipX += S.fahad.shipV*dt;
      if(S.fahad.shipX<40){ S.fahad.shipX=40; S.fahad.shipV=Math.abs(S.fahad.shipV); }
      if(S.fahad.shipX>W-40){ S.fahad.shipX=W-40; S.fahad.shipV=-Math.abs(S.fahad.shipV); }
      // continuous spits during fight window
      S.fahad.spitCd -= dt*1000; if(S.fahad.spitCd<=0){ S.fahad.spitCd=900+Math.random()*300; SFX.spit(); spawnTafla(S.fahad.shipX, S.fahad.shipY, S.player.x, S.player.y); }
      if(S.fahad.t>=S.fahad.callAt){ S.fahad.mode='toCenter'; S.fahad.modeT=0; }
    } else if(S.fahad.mode==='toCenter'){
      // glide to screen center X
      const target=W/2; const dir = Math.sign(target - S.fahad.shipX) || 1; S.fahad.shipV = 220*dir;
      S.fahad.shipX += S.fahad.shipV*dt;
      if(Math.abs(S.fahad.shipX - target) < 8){
        S.fahad.mode='call'; S.fahad.modeT=0; S.battlePause=true; SFX.phone(); say(W*0.5, 64, 'فهد: الووووو');
      }
    } else if(S.fahad.mode==='call'){
      // hold call briefly then withdraw slowly
      if(S.fahad.modeT>900){ S.fahad.mode='withdraw'; S.fahad.modeT=0; S.fahad.shipV = 70; }
    } else if(S.fahad.mode==='withdraw'){
      S.fahad.shipX += S.fahad.shipV*dt;
      if(S.fahad.shipX>W+140){ endFahad(); }
    }
  }

  if(S.phase==='intermission' && S.station){
    const st=S.station;
    st.x+=st.vx*dt; if(st.x<st.w/2 || st.x>W-st.w/2) st.vx*=-1;
    p.x += (st.x - p.x)*0.05; p.y += (st.y + st.h/2 + 40 - p.y)*0.05;
    S.intermissionTimer += dt;
    if(Math.abs(p.x-st.x)<40 && Math.abs(p.y-st.y)<40){
      if(S.lives<3){S.lives++; hearts();} else { p.fireRate = Math.max(100, p.fireRate-20); say(p.x, p.y-20, POWER_LINES[Math.floor(Math.random()*POWER_LINES.length)]); }
      if(S.intermissionTimer>1.1){ S.phase='wave'; S.station=null; S.wave++; waveEl.textContent='Wave: '+S.wave; spawnWave(8+S.wave*2); }
    }
    return;
  }

  // Move to tent after victory
  if(S.phase==='toTent'){
    if(!S.tent) S.tent={x:W/2,y:110,w:220,h:140};
    const targetX=S.tent.x, targetY=S.tent.y + (S.tent.h/2) + 40;
    p.x += (targetX - p.x)*Math.min(1, dt*1.8);
    p.y += (targetY - p.y)*Math.min(1, dt*1.8);
    S.toTentTimer += dt;
    const dx=p.x-targetX, dy=p.y-targetY;
    if(S.toTentTimer>2.2 && Math.hypot(dx,dy)<10){ S.phase='victory'; banner('وصلنا الخيمة ⛺️ — هيلكم!'); }
  }

  // no Fahad boss; cameo handled below

  // enemies (skip when paused for call)
  if(!S.battlePause) for(const e of S.enemies){
    // movement patterns
    if(e.pattern==='zigzag'){
      e.x += e.vx*dt; if(e.x<e.w/2||e.x>W-e.w/2) e.vx*=-1; e.y += e.vy*dt;
    } else if(e.pattern==='sine'){
      e.phase += dt*2.2; e.x += Math.cos(e.phase)*60*dt; e.y += e.vy*dt;
    } else if(e.pattern==='dive'){
      e.y += e.vy*dt; e.x += (Math.sin((e.y)/80)*e.amp)*dt;
    } else {
      e.y += e.vy*dt;
    }
    e.fireCd-=dt*1000;
    if(e.fireCd<=0){ e.fireCd=1000+Math.random()*600 - S.wave*10; spawnEnemyBullet(e.x,e.y,(Math.random()-.5)*(40+S.wave*6),200+Math.random()*60+S.wave*6); }
  }
  if(!S.battlePause) S.enemies=S.enemies.filter(e=>e.y<H+40 && e.hp>0);

  // boss
  if(!S.battlePause && S.boss){
    const b=S.boss; b.x+=b.vx*dt; if(b.x<b.w/2||b.x>W-b.w/2) b.vx*=-1; b.fireCd-=dt*1000;
    if(!S.bossTaunt75 && b.hp<=255){ S.bossTaunt75=true; say(b.x, b.y-20, TAUNT_START[Math.floor(Math.random()*TAUNT_START.length)]); }
    if(!S.bossRage && b.hp<=170){ S.bossRage=true; say(b.x, b.y-20, TAUNT_RAGE[Math.floor(Math.random()*TAUNT_RAGE.length)]); b.vx=140; }
    if(!S.bossTaunt25 && b.hp<=85){ S.bossTaunt25=true; say(b.x, b.y-20, TAUNT_LOSE[Math.floor(Math.random()*TAUNT_LOSE.length)]); }
    if(b.fireCd<=0){ b.fireCd=S.bossRage?800:950; for(let i=-2;i<=2;i++) spawnEnemyBullet(b.x+i*24,b.y+28,i*60,(S.bossRage?250:230)+Math.abs(i)*20); }
  }

  // bullets move
  if(!S.battlePause){
    for(const bb of S.bullets){bb.x+=bb.vx*dt; bb.y+=bb.vy*dt;}
    for(const eb of S.enemyBullets){eb.x+=eb.vx*dt; eb.y+=eb.vy*dt;}
    S.bullets=S.bullets.filter(b=>b.y>-50&&b.y<H+50&&b.x>-50&&b.x<W+50);
    S.enemyBullets=S.enemyBullets.filter(b=>b.y<H+60&&b.x>-60&&b.x<W+60);
  }

  // collisions
  if(!S.battlePause) for(const b of S.bullets){
    if(S.boss && aabb(b,S.boss)){ S.boss.hp-=b.dmg; b.dead=1; S.score+=20; SFX.hit(); if(S.boss.hp<=0){ victory(); } }
    for(const e of S.enemies){ if(aabb(b,e)){
      e.hp-=b.dmg; b.dead=1; S.score+=10; SFX.meow();
      if(e.hp<=0){
        S.streak.count = (S.streak.t>0 && S.streak.t<1.8)? S.streak.count+1 : 1;
        S.streak.t = 0.000001;
        if(S.streak.count>=3){ const arr=S.ettifaq?STREAK_FOOTBALL:STREAK_LINES; say(e.x,e.y-12, arr[Math.floor(Math.random()*arr.length)]);
          if(Math.random()<0.25){ say(p.x, p.y-48, BOUALI_ROASTS[Math.floor(Math.random()*BOUALI_ROASTS.length)]); }
        }
      }
      if(Math.random()<0.7) say(e.x,e.y-10, CAT_LINES[Math.floor(Math.random()*CAT_LINES.length)]);
    } }
  }
  S.bullets=S.bullets.filter(b=>!b.dead);

  const pbox={x:p.x,y:p.y,w:p.w,h:p.h};
  if(!S.battlePause) for(const eb of S.enemyBullets){
    if(aabb(eb,pbox) && p.iFrames<=0){
      if(p.shieldT>0){ eb.dead=1; SFX.power(); say(p.x,p.y-26,'درع الاتفاق!'); }
      else { S.lives--; p.iFrames=500; p.hitFlash=180; eb.dead=1; hearts(); SFX.hit(); say(p.x,p.y-20,'يا لطيف وش ذا الطقة!');
        if(Math.random()<0.5){ say(p.x, p.y-34, LATIF_LINES[Math.floor(Math.random()*LATIF_LINES.length)]); }
        else { say(p.x, p.y-34, BOUALI_ROASTS[Math.floor(Math.random()*BOUALI_ROASTS.length)]); }
        if(S.lives<=0){ gameOver(); }
      }
    }
  }
  S.enemyBullets=S.enemyBullets.filter(b=>!b.dead);

  if(p.iFrames>0) p.iFrames-=dt*1000;
  if(p.shieldT>0) p.shieldT-=dt*1000;
  if(S.streak.t>0){ S.streak.t+=dt; if(S.streak.t>2.0){ S.streak.t=0; S.streak.count=0; } }
  if(p.hitFlash>0) p.hitFlash-=dt*1000;

  scoreEl.textContent='Score: '+S.score;
}

// BG
const stars=Array.from({length:180},()=>({x:Math.random()*960,y:Math.random()*540,s:0.5+Math.random()*1.5}));
function drawBG(){X.fillStyle='#030611';X.fillRect(0,0,W,H);X.fillStyle='#9fb3d9';for(const st of stars){st.y+=st.s*0.8;if(st.y>H){st.y=0;st.x=Math.random()*W;}X.fillRect(st.x,st.y,2,2);}}

// Render
function render(dt){
  drawBG();
  // player (with hit flash)
  if(IM.player){
    if(S.player.hitFlash>0){X.save();X.globalAlpha=0.5;X.fillStyle='#ff4444';X.fillRect(S.player.x-S.player.w/2,S.player.y-S.player.h/2,S.player.w,S.player.h);X.restore();}
    X.drawImage(IM.player,S.player.x-S.player.w/2,S.player.y-S.player.h/2,S.player.w,S.player.h);
  }
  // bullets
  X.fillStyle='#8cf'; for(const b of S.bullets) X.fillRect(b.x-2,b.y-6,4,12);
  // enemy bullets: draw tafla differently
  for(const b of S.enemyBullets){
    if(b.kind==='tafla'){
      X.save(); X.fillStyle='#7fdc7f'; X.beginPath(); X.arc(b.x, b.y, 6, 0, Math.PI*2); X.fill(); X.restore();
    } else {
      X.fillStyle='#f88'; X.fillRect(b.x-2,b.y-6,4,12);
    }
  }
  // enemies
  for(const e of S.enemies){ const img = IM[e.kind]; if(img) X.drawImage(img, e.x-e.w/2, e.y-e.h/2, e.w, e.h); }
  // shield ring
  if(S.player.shieldT>0){
    X.save();
    const alpha = Math.max(0.25, Math.min(0.6, S.player.shieldT/2000));
    X.globalAlpha = alpha;
    X.strokeStyle = S.ettifaq? '#2ecc71' : '#66ccff';
    X.lineWidth = 4;
    X.beginPath(); X.arc(S.player.x, S.player.y, Math.max(S.player.w,S.player.h)*0.65, 0, Math.PI*2); X.stroke();
    X.restore();
  }
  // station
  if(S.station && IM.cavo){ X.drawImage(IM.cavo, S.station.x-S.station.w/2, S.station.y-S.station.h/2, S.station.w, S.station.h); }
  // tent
  if(S.tent && IM.tent){ X.drawImage(IM.tent, S.tent.x-S.tent.w/2, S.tent.y-S.tent.h/2, S.tent.w, S.tent.h); }
  // boss
  if(S.boss && IM.ram){ X.drawImage(IM.ram, S.boss.x-S.boss.w/2, S.boss.y-S.boss.h/2, S.boss.w, S.boss.h); }
  // no Fahad boss sprite; cameo handled below
  // bubbles
  drawBubbles(dt);
  // Fahad overlay + sprite/UFO
  if(S.fahad && S.fahad.active){
    X.save(); X.globalAlpha=0.20; X.fillStyle='#000'; X.fillRect(0,0,W,H); X.restore();
    const x=S.fahad.shipX, y=S.fahad.shipY;
    const phone = (S.fahad.mode==='call' || S.fahad.mode==='withdraw');
    if((phone && IM.fahadPhone) || (!phone && IM.fahad)){
      const img = phone? IM.fahadPhone: IM.fahad; const w=72, h=54; X.drawImage(img, x-w/2, y-h/2, w, h);
    } else {
      // fallback UFO + phone indicator
      X.save(); X.translate(x,y);
      X.fillStyle='#9fb3d9'; X.beginPath(); X.ellipse(0,0,36,14,0,0,Math.PI*2); X.fill();
      X.fillStyle='#e9eef7'; X.beginPath(); X.ellipse(0,-6,16,10,0,0,Math.PI*2); X.fill();
      X.fillStyle= phone? '#33dd55':'#ffcc66'; X.fillRect(-8,10,16,4);
      if(phone){ X.fillStyle='#e9eef7'; X.fillText('📱', 18, 0); }
      X.restore();
    }
    X.save(); X.font='16px sans-serif'; X.fillStyle='#e9eef7';
    const text = S.fahad.mode==='prank' ? '👀 فهد: خلّني أشوف…' : (S.fahad.mode==='call' ? '📱 فهد: الووووو' : '');
    if(text) X.fillText(text, W*0.5-92, 42);
    X.restore();
  }
}

// Banners
function banner(text){
  const overlay=document.createElement('div'); overlay.style.position='fixed'; overlay.style.inset='0';
  overlay.style.background='rgba(5,8,13,.7)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.zIndex='100';
  const card=document.createElement('div'); card.style.background='#0f1624'; card.style.border='1px solid #1f2b46'; card.style.borderRadius='16px'; card.style.padding='24px 28px'; card.style.color='#e9eef7'; card.style.textAlign='center'; card.style.minWidth='320px';
  card.innerHTML='<h2 style="margin:0 0 12px 0">'+text+'</h2><button class="primary" id="restart">Restart</button>';
  overlay.appendChild(card); document.body.appendChild(overlay);
  document.getElementById('restart').onclick=()=>{ document.body.removeChild(overlay); reset(); };
}

function startTentSequence(){
  S.phase='toTent'; S.toTentTimer=0; S.tent={x:W/2,y:110,w:220,h:140}; waveEl.textContent='الوجهة: خيمة بوعجب';
}
function victory(){ SFX.win(); startTentSequence(); }
function gameOver(){ S.phase='gameover'; SFX.lose(); banner('Game Over ☠️'); }

// start button
function applyTheme(){
  document.body.dataset.theme = S.ettifaq?'ettifaq':'';
  const logo=document.querySelector('.logo'); if(logo) logo.textContent = S.ettifaq?'BouAli x Ettifaq — SHMUP':'BouAli x Grendizer — SHMUP';
  // Ettifaq boost: slight fire rate buff and short shield on toggle
  if(S.ettifaq){ S.player.fireRate = Math.max(110, 140); if(S.player.shieldT<1500) S.player.shieldT=4000; if(SFX && SFX.chant) SFX.chant(); }
  else { S.player.fireRate = 150; }
}

startBtn.onclick=()=>{ intro.style.display='none'; if(AC&&AC.state==='suspended') AC.resume(); reset(); fit(); applyTheme(); playBGM(); };
if(playPortrait){ playPortrait.onclick=()=>{ if(rotateHint) rotateHint.style.display='none'; if(AC&&AC.state==='suspended') AC.resume(); reset(); fit(); applyTheme(); playBGM(); }; }

// Boot
function toggleEttifaq(){ S.ettifaq=!S.ettifaq; applyTheme(); say(W/2, 120, S.ettifaq?'وضع الاتفاق: شغال ✅':'وضع الاتفاق: طافي ❌'); if(S.ettifaq) SFX.chant(); }
addEventListener('keydown',e=>{ 
  if(e.code==='KeyT'){ toggleEttifaq(); }
  if(e.code==='KeyM'){ MUTE=!MUTE; if(muteBtn) muteBtn.textContent = MUTE?'🔇':'🔊'; if(MUTE) pauseBGM(); else playBGM(); }
  if(e.code==='KeyF'){ startFahad(true); }
  if(e.code==='KeyG'){ startFahad(false); }
});

if(muteBtn){ muteBtn.onclick=()=>{ MUTE=!MUTE; muteBtn.textContent = MUTE?'🔇':'🔊'; if(MUTE) pauseBGM(); else playBGM(); }; }
if(ettifaqBtn){ ettifaqBtn.onclick=()=>{ toggleEttifaq(); }; }

load().then(()=>{
  // Try user-provided sprites first
  loadOptional('fahad','assets/FD1.png');
  loadOptional('fahad','assets/FD1.pnd'); // in case of filename typo
  loadOptional('fahadPhone','assets/FD2.png');
  // Fallbacks
  loadOptional('fahad','assets/fahad.png');
  loadOptional('fahadPhone','assets/fahad_phone.png');
  fit(); applyTheme(); let lt=performance.now(); (function anim(){ const t=performance.now(); const dt=(t-lt)/1000; lt=t; update(dt); render(dt); requestAnimationFrame(anim); })();
});
})();
