'use strict';

const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d'),stage=$('stage');
const startBtn=$('startBtn'),modeSelect=$('modeSelect'),roleSelect=$('roleSelect'),lineSelect=$('lineSelect'),accSelect=$('accSelect');
const lineWrap=$('lineWrap'),accWrap=$('accWrap'),hintBtn=$('hintBtn'),sprintBtn=$('sprintBtn');
const joy=$('joy'),camJoy=$('camJoy'),banner=$('banner'),msg=$('msg');
const youHud=$('youHud'),debuffHud=$('debuffHud'),mechHud=$('mechHud'),waveHud=$('waveHud'),mistakeHud=$('mistakeHud'),timeHud=$('timeHud');
const debuffReveal=$('debuffReveal'),debuffIcons=$('debuffIcons'),debuffText=$('debuffText'),debuffTimer=$('debuffTimer');

const W=1280,H=720,ARENA_R=100,PLAYER_SPEED=66,SPRINT_SPEED=94;
const SCALE=1.65;
const ROLES=['t1','t2','h1','h2','m1','m2','r1','r2'];
const DISPLAY={t1:'MT',t2:'ST',h1:'H1',h2:'H2',m1:'M1',m2:'M2',r1:'R1',r2:'R2'};
const UI_TO_ROLE={MT:'t1',ST:'t2',H1:'h1',H2:'h2',M1:'m1',M2:'m2',R1:'r1',R2:'r2'};
const DPS=['m1','m2','r1','r2'],SUP=['t1','t2','h1','h2'],HEALERS=['h1','h2'];
const CENTER_POS={t1:{x:0,z:-4},t2:{x:0,z:4},h1:{x:-4,z:0},h2:{x:4,z:0},m1:{x:-4,z:4},m2:{x:4,z:4},r1:{x:-4,z:-4},r2:{x:4,z:-4}};

const TARGETS={
  1:{1:['fil_dps'],2:['fil_dps','fil_sup']},
  2:{1:['fil_dps','fil_sup','fil_acr'],2:['sil_dps','fil_sup','fil_acr'],3:['sil_dps','sil_sup','fil_acr']},
  3:{1:['sil_dps','sil_sup','sil_acr'],2:['til_dps','sil_sup','sil_acr'],3:['til_dps','til_sup','sil_acr']},
  4:{1:['til_dps','til_sup'],2:['til_sup']}
};
const TETHER_PRIO=[{f:[0,1,2,3],o:[0,1,2]},{f:[4,5],o:[2,0,1]},{f:[6,7],o:[1,2,0]}];
const INITIAL_ORDER=[2,1,0];

const state={
  phase:'idle',startedAt:0,elapsed:0,last:performance.now(),cam:0,joyX:0,joyY:0,camX:0,keys:new Set(),movePid:null,camPid:null,sprintUntil:0,
  player:{x:0,z:18},bots:{},party:null,assignment:null,playerRole:'h1',playerKey:null,hints:false,mistakes:0,
  eventIndex:0,events:[],activeBH:null,activeTethers:[],laserFx:[],aoes:[],casts:[],slap:null,chaos:{x:0,z:0,facing:0,visible:true},
  kefka:{facingFactor:0,visible:true,leaping:false,leapAngle:0},exdeath:{x:18,z:-32,visible:true},debuffHideAt:0,
  currentMechanic:'—',currentWave:'—',lastCheckKey:'',runEnded:false
};

const norm=a=>((a%360)+360)%360;
const rad=d=>d*Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const rotate=(p,d)=>{const a=rad(d),c=Math.cos(a),s=Math.sin(a);return{x:p.x*c-p.z*s,z:p.x*s+p.z*c}};

function lineNameFromKey(k){return k.startsWith('fil')?'First':k.startsWith('sil')?'Second':'Third'}
function lineCodeFromKey(k){return k.startsWith('fil')?'fil':k.startsWith('sil')?'sil':'til'}
function isAccKey(k){return k.includes('acr')}
function roleGroup(r){return DPS.includes(r)?'DPS':HEALERS.includes(r)?'HEALER':'TANK'}

function generateParty(){
  const dps=shuffle(DPS),assign={};
  assign.fil_dps=dps.pop();assign.sil_dps=dps.pop();assign.til_dps=dps.pop();const dpsAcc=dps.pop();
  const healerAcc=HEALERS[Math.floor(Math.random()*2)];
  const sup=shuffle(SUP.filter(r=>r!==healerAcc));
  assign.fil_sup=sup.pop();assign.sil_sup=sup.pop();assign.til_sup=sup.pop();
  if(Math.random()<.5){assign.fil_acr=dpsAcc;assign.sil_acr=healerAcc}else{assign.sil_acr=dpsAcc;assign.fil_acr=healerAcc}
  const roleToKey={};Object.entries(assign).forEach(([k,r])=>roleToKey[r]=k);
  return{assign,roleToKey};
}
function validManual(role,line,acc){if(acc&&(role==='t1'||role==='t2'||line==='til'))return false;return true}
function generateForSelection(){
  const role=UI_TO_ROLE[roleSelect.value],random=modeSelect.value==='random';
  if(random)return{...generateParty(),role};
  const line=lineSelect.value,acc=accSelect.value==='yes';
  if(!validManual(role,line,acc))return null;
  for(let i=0;i<25000;i++){const g=generateParty(),k=g.roleToKey[role];if(lineCodeFromKey(k)===line&&isAccKey(k)===acc)return{...g,role}}
  return null;
}

function syncControls(){
  const random=modeSelect.value==='random';lineSelect.disabled=random;accSelect.disabled=random;lineWrap.classList.toggle('disabled',random);accWrap.classList.toggle('disabled',random);
  if(state.phase==='idle'){debuffHud.textContent=random?'RANDOM':`${lineSelect.options[lineSelect.selectedIndex].text}${accSelect.value==='yes'?' + ACC':''}`;msg.textContent=random?'Escolha só o slot; linha e Accretion serão sorteados como no Waju.':'Escolha uma combinação específica para treinar.'}
}
modeSelect.addEventListener('change',syncControls);roleSelect.addEventListener('change',()=>{youHud.textContent=roleSelect.value;syncControls()});lineSelect.addEventListener('change',syncControls);accSelect.addEventListener('change',syncControls);

function initBots(){state.bots={};for(const r of ROLES){if(r===state.playerRole)continue;const p=CENTER_POS[r];state.bots[r]={x:p.x,z:p.z,tx:p.x,tz:p.z,speed:46}}}
function moveBot(r,p,speed=46){const b=state.bots[r];if(!b)return;b.tx=p.x;b.tz=p.z;b.speed=speed}
function moveAllCenter(){for(const r of ROLES){if(r===state.playerRole)continue;moveBot(r,CENTER_POS[r],50)}}
function updateBots(dt){for(const b of Object.values(state.bots)){const dx=b.tx-b.x,dz=b.tz-b.z,m=Math.hypot(dx,dz);if(m<.1){b.x=b.tx;b.z=b.tz;continue}const step=Math.min(m,b.speed*dt);b.x+=dx/m*step;b.z+=dz/m*step}}

function makeLayout(setNum,rotation){
  const a=setNum===1||setNum===3?[[1.5206,-42.4767],[-10.7782,-32.3757],[-12.9318,-18.0891]]:[[-2.9252,-42.4767],[9.1904,-32.3757],[-2.9396,-18.0891]];
  const holes=[],dirs=[['N',0,3],['E',90,3],['S',180,3],['W',270,2]];
  dirs.forEach(([name,d,count])=>{for(let i=0;i<count;i++){const idx=name==='W'?i+1:i;let p={x:a[idx][0]*SCALE,z:a[idx][1]*SCALE};p=rotate(p,d+rotation);holes.push({x:p.x,z:p.z,card:name,source:i===0&&name!=='W',sourceIdx:name==='N'?0:name==='E'?1:name==='S'?2:null})}});return holes;
}
function sourcePoint(set,idx){const h=set.holes.find(h=>h.source&&h.sourceIdx===idx);return h?{x:h.x,z:h.z}:{x:0,z:0}}
function sourceOrder(kefkaFactor,rotation,active){const rf=(kefkaFactor+Math.round(rotation/45))%8,pr=TETHER_PRIO.find(x=>x.f.includes(rf)).o;return[...active].sort((a,b)=>pr.indexOf(a)-pr.indexOf(b))}
function activeSources(block,wave){let a=(block===4?[0,1,2]:INITIAL_ORDER).slice();if(block===1)a=wave===1?a.slice(0,1):a.slice(1,3);if(block===4)a=wave===1?a.slice(0,2):a.slice(2,3);return sourceOrder(state.kefka.facingFactor,state.activeBH.rotation,a)}
function keyToRole(key){return state.assignment[key]}
function prePos(srcIdx,rotation){return rotate({0:{x:0,z:-32},1:{x:32,z:0},2:{x:0,z:32}}[srcIdx],rotation)}
function baitPos(srcIdx,rotation){return rotate({0:{x:28,z:-20},1:{x:20,z:28},2:{x:-28,z:20}}[srcIdx],rotation)}

function startBHBlock(block){
  const rotation=[0,90,180,270][Math.floor(Math.random()*4)];
  state.activeBH={block,rotation,holes:makeLayout(block,rotation),wave:1};state.activeTethers=[];state.currentMechanic=`Black Hole ${block}`;mechHud.textContent=`BH ${block}`;prepareWave(block,1);
}
function prepareWave(block,wave,append=false){
  if(!state.activeBH||state.activeBH.block!==block)return;state.activeBH.wave=wave;state.currentWave=`${block}.${wave}`;waveHud.textContent=`${block}.${wave}`;
  const sources=activeSources(block,wave),keys=TARGETS[block][wave];if(!append)state.activeTethers=[];
  sources.forEach((srcIdx,i)=>{const key=keys[i],role=keyToRole(key),src=sourcePoint(state.activeBH,srcIdx);state.activeTethers.push({srcIdx,src,key,role,wave,grabbed:false,hit:false});if(role!==state.playerRole)moveBot(role,prePos(srcIdx,state.activeBH.rotation),64)});
  for(const r of ROLES){if(r===state.playerRole)continue;if(!state.activeTethers.some(t=>t.role===r))moveBot(r,CENTER_POS[r],46)}
  const mine=state.activeTethers.find(t=>t.role===state.playerRole);msg.textContent=mine?(state.hints?`Sua wave: vá ao tether ${mine.srcIdx===0?'N':mine.srcIdx===1?'E':'S'} e puxe CW.`:'Sua wave — identifique qual blackhole é seu e pegue o tether.'):'Não é sua wave. Deixe os bots pegarem e mantenha-se fora dos lasers.';
}
function grabWave(){for(const t of state.activeTethers){t.grabbed=true;if(t.role!==state.playerRole)moveBot(t.role,baitPos(t.srcIdx,state.activeBH.rotation),58)}}
function hitWave(block,wave){
  if(!state.activeBH||state.activeBH.block!==block)return;
  for(const t of state.activeTethers.filter(t=>t.wave===wave)){const target=t.role===state.playerRole?state.player:state.bots[t.role];state.laserFx.push({src:{...t.src},target:{x:target.x,z:target.z},until:state.elapsed+.58});if(t.role===state.playerRole){const expected=baitPos(t.srcIdx,state.activeBH.rotation);if(dist(state.player,expected)>18)mistake(`Tether ${block}.${wave}: posição de bait incorreta`)}t.hit=true}
  state.activeTethers=state.activeTethers.filter(t=>t.wave!==wave);
}
function clearBH(){state.activeBH=null;state.activeTethers=[];moveAllCenter()}
function mistake(reason){state.mistakes++;mistakeHud.textContent=state.mistakes;banner.textContent='✕ HIT';msg.textContent=reason;stage.classList.remove('flash');void stage.offsetWidth;stage.classList.add('flash')}

function setSlap(safeSide,phase='cast'){
  state.slap={safe:safeSide,phase,until:state.elapsed+(phase==='cast'?4.2:.9)};state.currentMechanic='Slap Happy';mechHud.textContent='Slap Happy';
  if(phase==='cast'){
    if(safeSide==='RIGHT'){const p={x:35,z:0};for(const r of ROLES){if(r!==state.playerRole)moveBot(r,{x:p.x+(Math.random()-.5)*4,z:p.z+(Math.random()-.5)*4},48)}msg.textContent='RIGHT SAFE · party stack'}
    else{const gp={TANK:{x:-34,z:-20},HEALER:{x:-39,z:0},DPS:{x:-34,z:20}};for(const r of ROLES){if(r!==state.playerRole){const p=gp[roleGroup(r)];moveBot(r,{x:p.x+(Math.random()-.5)*4,z:p.z+(Math.random()-.5)*5},48)}}msg.textContent='LEFT SAFE · role stacks'}
  }
}
function slapHit(n){if(!state.slap)return;state.slap.phase='hit'+n;state.slap.until=state.elapsed+.55;state.slap.hit=n}
function centerSlapHit(){
  if(!state.slap)return;state.slap.phase='center';state.slap.until=state.elapsed+.65;const safe=state.slap.safe;
  if(safe==='RIGHT'){if(state.player.x<18||Math.abs(state.player.z)>25)mistake('Slap Happy: faltou stackar no lado direito safe.')}
  else{const gp={TANK:{x:-34,z:-20},HEALER:{x:-39,z:0},DPS:{x:-34,z:20}}[roleGroup(state.playerRole)];if(dist(state.player,gp)>19)mistake(`Slap Happy: faltou o role stack de ${roleGroup(state.playerRole)} no lado esquerdo.`)}
}
function clearSlap(){state.slap=null;moveAllCenter()}

function castEdict(label='Damning Edict'){
  state.chaos.facing=[0,45,90,135,180,225,270,315][Math.floor(Math.random()*8)];state.currentMechanic=label;mechHud.textContent='Edict';state.casts.push({type:'edict',label,start:state.elapsed,end:state.elapsed+4.6,hitAt:state.elapsed+5.2});
  const behind=rotate({x:0,z:30},state.chaos.facing);for(const r of ROLES){if(r!==state.playerRole)moveBot(r,{x:behind.x+(Math.random()-.5)*7,z:behind.z+(Math.random()-.5)*7},50)}msg.textContent='Chaos está castando Damning Edict — vá para trás dele.';
}
function edictHit(){state.aoes.push({type:'edict',facing:state.chaos.facing,until:state.elapsed+.65});const f=rotate({x:0,z:-1},state.chaos.facing),dot=state.player.x*f.x+state.player.z*f.z;if(dot>0)mistake('Damning Edict: você ficou na frente do Chaos.')}
function startLatLong(){state.currentMechanic='Lat/Long + White Hole';mechHud.textContent='Lat/Long';state.chaos.facing=norm(state.kefka.facingFactor*45+45);state.casts.push({type:'latlong',label:'Lat/Long + White Hole',start:state.elapsed,end:state.elapsed+5.4});msg.textContent='Chaos prepara Lat/Long. Leia a orientação e fique no safe.'}
function latLongHit(mode){state.aoes.push({type:'latlong',mode,facing:state.chaos.facing,until:state.elapsed+.7})}
function bodySlamTele(){const angle=norm(state.kefka.facingFactor*45);state.kefka.leaping=true;state.kefka.leapAngle=angle;state.aoes.push({type:'bodyslamTele',angle,until:state.elapsed+.55});state.currentMechanic='Body Slam';mechHud.textContent='Body Slam';msg.textContent='Kefka vai pular atravessando o meio — saia da linha.'}
function bodySlamHit(){const angle=state.kefka.leapAngle;state.aoes.push({type:'bodyslam',angle,until:state.elapsed+.8});state.kefka.leaping=false;const a=rad(angle),nx=Math.cos(a),nz=Math.sin(a),d=Math.abs(state.player.x*nx+state.player.z*nz);if(d<18)mistake('Body Slam: você ficou na linha do pulo do Kefka.')}

function buildEvents(){
  const E=[];const add=(t,fn,label)=>E.push({t,fn,label});let slap1=Math.random()<.5?'LEFT':'RIGHT';
  add(0,()=>setSlap(slap1,'cast'),'Slap Happy cast');add(5.0,()=>slapHit(1));add(5.8,()=>slapHit(2));add(6.6,()=>slapHit(3));add(7.6,()=>centerSlapHit());add(8.2,()=>clearSlap());
  add(8.6,()=>startBHBlock(1));add(12.0,()=>grabWave());add(15.2,()=>prepareWave(1,2,true));add(15.35,()=>grabWave());add(15.6,()=>hitWave(1,1));add(23.6,()=>{hitWave(1,2);clearBH()});
  add(28.8,()=>castEdict('Damning Edict'));add(34.0,()=>edictHit());let slap2=Math.random()<.5?'LEFT':'RIGHT';add(34.2,()=>setSlap(slap2,'cast'));add(35.0,()=>slapHit(1));add(35.8,()=>slapHit(2));add(36.6,()=>slapHit(3));add(37.6,()=>centerSlapHit());add(38.1,()=>clearSlap());
  add(39.2,()=>startBHBlock(2));add(42.0,()=>grabWave());add(46.2,()=>{hitWave(2,1);prepareWave(2,2);grabWave()});add(51.2,()=>{hitWave(2,2);prepareWave(2,3);grabWave()});add(56.2,()=>{hitWave(2,3);clearBH();castEdict('Damning Edict II')});add(61.0,()=>edictHit());add(61.6,()=>bodySlamTele());add(62.1,()=>bodySlamHit());
  add(68.0,()=>{state.kefka.facingFactor=Math.floor(Math.random()*8);msg.textContent='Giant Kefka mudou de orientação — reoriente o norte relativo.'});
  add(73.3,()=>startBHBlock(3));add(76.5,()=>grabWave());add(80.3,()=>{hitWave(3,1);prepareWave(3,2);grabWave()});add(85.3,()=>{hitWave(3,2);prepareWave(3,3);grabWave()});add(90.3,()=>{hitWave(3,3);clearBH()});
  add(96.8,()=>startLatLong());add(98.0,()=>setSlap(Math.random()<.5?'LEFT':'RIGHT','cast'));add(102.2,()=>latLongHit('first'));add(103.0,()=>slapHit(1));add(103.8,()=>slapHit(2));add(104.6,()=>slapHit(3));add(105.6,()=>centerSlapHit());add(106.1,()=>clearSlap());
  add(106.8,()=>startBHBlock(4));add(109.6,()=>grabWave());add(113.8,()=>{hitWave(4,1);prepareWave(4,2);grabWave()});add(119.6,()=>bodySlamTele());add(120.1,()=>bodySlamHit());add(120.8,()=>{hitWave(4,2);clearBH();finishRun()});return E.sort((a,b)=>a.t-b.t);
}

function startRun(){
  const g=generateForSelection();if(!g){banner.textContent='Combinação inválida';msg.textContent='Accretion só pode ser healer/DPS e apenas First ou Second.';return}
  state.party=g;state.assignment=g.assign;state.playerRole=g.role;state.playerKey=g.roleToKey[g.role];state.phase='running';state.startedAt=performance.now();state.elapsed=0;state.eventIndex=0;state.mistakes=0;state.runEnded=false;state.player={x:0,z:18};state.cam=0;state.kefka.facingFactor=Math.floor(Math.random()*8);state.activeBH=null;state.activeTethers=[];state.laserFx=[];state.aoes=[];state.casts=[];state.slap=null;state.debuffHideAt=8;initBots();state.events=buildEvents();
  youHud.textContent=DISPLAY[state.playerRole];mistakeHud.textContent='0';mechHud.textContent='Debuffs';waveHud.textContent='—';timeHud.textContent='0:00';startBtn.textContent='Retry';showDebuffs();banner.textContent='MEMORIZE';stage.focus({preventScroll:true});
}
function showDebuffs(){const k=state.playerKey,line=lineNameFromKey(k),acc=isAccKey(k);debuffReveal.hidden=false;debuffIcons.innerHTML=`<div class="debuffIcon">${line[0]}</div>${acc?'<div class="debuffIcon acc">✦</div>':''}`;debuffText.textContent=`${line} In Line${acc?' · Accretion':''}`;debuffHud.textContent=`${line}${acc?' + ACC':''}`;debuffTimer.textContent='Memorize — some em 8s'}
function hideDebuffs(){debuffReveal.hidden=true;debuffHud.textContent='???'}
function finishRun(){state.runEnded=true;state.phase='result';state.currentMechanic='Complete';mechHud.textContent='CLEAR';waveHud.textContent='—';banner.textContent=state.mistakes===0?'✓ CLEAN RUN':`Fim · ${state.mistakes} erro(s)`;msg.textContent=state.mistakes===0?'Sequência completa sem erro.':'Sequência completa. Retry para treinar novamente.'}

function update(dt,now){
  updateMovement(dt,now);updateBots(dt);if(state.phase!=='running')return;state.elapsed=(now-state.startedAt)/1000;timeHud.textContent=`${Math.floor(state.elapsed/60)}:${String(Math.floor(state.elapsed%60)).padStart(2,'0')}`;
  if(state.debuffHideAt&&state.elapsed>=state.debuffHideAt){hideDebuffs();state.debuffHideAt=0}
  while(state.eventIndex<state.events.length&&state.elapsed>=state.events[state.eventIndex].t){const e=state.events[state.eventIndex++];e.fn()}
  state.laserFx=state.laserFx.filter(x=>x.until>state.elapsed);state.aoes=state.aoes.filter(x=>x.until>state.elapsed);state.casts=state.casts.filter(x=>x.end+1>state.elapsed);
}
function updateMovement(dt,now){
  let x=state.joyX,y=state.joyY;if(state.keys.has('a')||state.keys.has('arrowleft'))x-=1;if(state.keys.has('d')||state.keys.has('arrowright'))x+=1;if(state.keys.has('w')||state.keys.has('arrowup'))y-=1;if(state.keys.has('s')||state.keys.has('arrowdown'))y+=1;let m=Math.hypot(x,y);if(m>1){x/=m;y/=m}
  if(Math.abs(state.camX)>.1)rotateCamera(-state.camX*dt*2.6);
  const ca=Math.cos(state.cam),sa=Math.sin(state.cam),sp=now<state.sprintUntil?SPRINT_SPEED:PLAYER_SPEED;if(state.phase!=='result'){state.player.x+=(ca*x+sa*y)*sp*dt;state.player.z+=(-sa*x+ca*y)*sp*dt;const r=Math.hypot(state.player.x,state.player.z);if(r>ARENA_R-4){state.player.x*=96/r;state.player.z*=96/r}}
}
function rotateCamera(d){state.cam+=d;if(Math.abs(state.cam)>Math.PI*4)state.cam=Math.atan2(Math.sin(state.cam),Math.cos(state.cam))}
