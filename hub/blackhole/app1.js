'use strict';
const $=id=>document.getElementById(id);
const cv=$('game'),ctx=cv.getContext('2d'),stage=$('stage');
const startBtn=$('startBtn'),hintBtn=$('hintBtn'),sprintBtn=$('sprintBtn');
const modeSelect=$('modeSelect'),roleSelect=$('roleSelect'),lineSelect=$('lineSelect'),accSelect=$('accSelect');
const lineWrap=$('lineWrap'),accWrap=$('accWrap'),banner=$('banner'),msg=$('msg'),bhBadge=$('bhBadge');
const joy=$('joy'),camJoy=$('camJoy'),debuffReveal=$('debuffReveal'),toast=$('toast');
const youHud=$('youHud'),lineHud=$('lineHud'),crustHud=$('crustHud'),mechHud=$('mechHud'),errorsHud=$('errorsHud'),timeHud=$('timeHud');

const W=1280,H=720,ARENA=100,SCALE=2,PLAYER_SPEED=67,SPRINT_SPEED=96;
const SLOT_KEYS=['MT','ST','H1','H2','M1','M2','R1','R2'];
const DPS=['M1','M2','R1','R2'],HEALERS=['H1','H2'],TANKS=['MT','ST'];
const WAY=[['A',0],['2',45],['B',90],['3',135],['C',180],['4',225],['D',270],['1',315]];
const BH13=[[1.5206,-42.4767],[-10.7782,-32.3757],[-12.9318,-18.0891]];
const BH24=[[-2.9252,-42.4767],[9.1904,-32.3757],[-2.9396,-18.0891]];
const PRE={0:[0,-16],1:[16,0],2:[0,16]};
const BAIT={0:[14,-10],1:[10,14],2:[-14,10]};
const DSA_WAVES=[
 ['fil_dps'],['fil_dps','fil_sup'],
 ['fil_dps','fil_sup','fil_acr'],['sil_dps','fil_sup','fil_acr'],['sil_dps','sil_sup','fil_acr'],
 ['sil_dps','sil_sup','sil_acr'],['til_dps','sil_sup','sil_acr'],['til_dps','til_sup','sil_acr'],
 ['til_dps','til_sup'],['til_sup']
];
const WAVES=[
 {id:1,set:1,sub:1,start:17.1,attach:19.6,bait:21.8,hit:24.1},
 {id:2,set:1,sub:2,start:23.7,attach:25.2,bait:28.2,hit:32.1},
 {id:3,set:2,sub:1,start:47.7,attach:49.4,bait:52.0,hit:54.7},
 {id:4,set:2,sub:2,start:54.9,attach:56.2,bait:58.0,hit:59.7},
 {id:5,set:2,sub:3,start:59.9,attach:63.55,bait:64.0,hit:64.7},
 {id:6,set:3,sub:1,start:81.8,attach:83.5,bait:86.0,hit:88.8},
 {id:7,set:3,sub:2,start:89.0,attach:90.3,bait:92.2,hit:93.8},
 {id:8,set:3,sub:3,start:94.0,attach:95.2,bait:97.2,hit:98.8},
 {id:9,set:4,sub:1,start:115.3,attach:117.0,bait:120.0,hit:122.3},
 {id:10,set:4,sub:2,start:122.4,attach:124.0,bait:126.5,hit:129.3},
];
const SLAPS=[
 {id:1,start:8.5,hits:[13.5,14.3,15.1],center:16.1,k:0},
 {id:2,start:38.5,hits:[43.5,44.3,45.1],center:46.1,k:1},
 {id:3,start:106.5,hits:[111.5,112.3,113.1],center:114.1,k:2},
];
const DAMN=[{id:1,start:37.3,hit:42.5},{id:2,start:64.7,hit:69.8}];
const BODY=[{id:1,tele:70.1,hit:70.6},{id:2,tele:128.1,hit:128.6}];
const LAT={start:105.3,hit1:110.7,hit2:111.4};
const BH_WINDOWS={1:[17.1,32.5],2:[47.7,64.9],3:[81.8,99.1],4:[115.3,129.55]};

const state={
 phase:'idle',running:false,last:performance.now(),runStart:0,lastT:0,t:0,
 player:{x:0,z:23},cam:0,joyX:0,joyY:0,camX:0,keys:new Set(),movePid:null,camPid:null,sprintUntil:0,
 hints:false,party:null,self:null,bots:{},kAngles:[0,0,0],arenaRot:{1:0,2:0,3:0,4:0},slapLeft:[true,true,true],damnFacing:[0,0],latSidesFirst:true,
 waveState:{},hits:0,errors:0,errorKeys:new Set(),lasers:[],bhTouchCooldown:-10,revealHidden:false,result:false,
};

const norm=a=>((a%360)+360)%360;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rad=d=>d*Math.PI/180;
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pt=(deg,r)=>({x:r*Math.sin(rad(deg)),z:-r*Math.cos(rad(deg))});
const rot=(p,deg)=>{const a=rad(deg),c=Math.cos(a),s=Math.sin(a);return{x:p.x*c-p.z*s,z:p.x*s+p.z*c}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const angleOf=(from,to)=>norm(Math.atan2(to.x-from.x,-(to.z-from.z))*180/Math.PI);
const angleDiff=(a,b)=>Math.abs(((a-b+540)%360)-180);
const roleGroup=s=>TANKS.includes(s)?'tank':HEALERS.includes(s)?'healer':'dps';
const isDps=s=>DPS.includes(s);
const keyLine=k=>k.startsWith('fil')?1:k.startsWith('sil')?2:3;
const lineLabel=n=>n===1?'1st':n===2?'2nd':'3rd';
const keyAcc=k=>k.includes('_acr');
const slotJitter=s=>{const i=SLOT_KEYS.indexOf(s);return{x:((i%4)-1.5)*1.6,z:(Math.floor(i/4)-.5)*1.6}};

function generateWajuParty(){
  const assign={};
  const d=shuffle(DPS);assign.fil_dps=d.pop();assign.sil_dps=d.pop();assign.til_dps=d.pop();const dpsAcc=d.pop();
  let sup=['MT','ST','H1','H2'];const healerAcc=HEALERS[Math.floor(Math.random()*2)];sup=sup.filter(x=>x!==healerAcc);sup=shuffle(sup);
  assign.fil_sup=sup.pop();assign.sil_sup=sup.pop();assign.til_sup=sup.pop();
  if(Math.random()<.5){assign.fil_acr=dpsAcc;assign.sil_acr=healerAcc}else{assign.sil_acr=dpsAcc;assign.fil_acr=healerAcc}
  const bySlot={};Object.entries(assign).forEach(([k,s])=>bySlot[s]={key:k,line:keyLine(k),acc:keyAcc(k),group:isDps(s)?'dps':'support'});
  return {assign,bySlot};
}
function partyForSelection(){
  const slot=roleSelect.value;
  if(modeSelect.value==='random')return generateWajuParty();
  const line=+lineSelect.value,acc=accSelect.value==='yes';
  if(acc&&(TANKS.includes(slot)||line===3)){showToast('Essa combinação não existe na distribuição real.');return null}
  for(let i=0;i<3000;i++){
    const p=generateWajuParty(),a=p.bySlot[slot];
    if(a.line===line&&a.acc===acc)return p;
  }
  return null;
}
function syncMode(){const r=modeSelect.value==='random';lineSelect.disabled=r;accSelect.disabled=r;lineWrap.classList.toggle('disabledControl',r);accWrap.classList.toggle('disabledControl',r);if(!state.running){lineHud.textContent=r?'RANDOM':lineLabel(+lineSelect.value);msg.textContent=r?'Random: escolha só o slot; a party inteira será distribuída como no Waju.':'Manual: escolha a combinação específica que quer treinar.'}}

function setupRun(){
  const party=partyForSelection();if(!party)return;
  state.party=party;state.self=party.bySlot[roleSelect.value];state.running=true;state.result=false;state.phase='run';state.runStart=performance.now();state.lastT=0;state.t=0;
  state.player={x:0,z:23};state.cam=0;state.hits=0;state.errors=0;state.errorKeys.clear();state.lasers=[];state.bhTouchCooldown=-10;state.revealHidden=false;
  state.kAngles=[0,1,2].map(()=>45*Math.floor(Math.random()*8));state.arenaRot={1:90*Math.floor(Math.random()*4),2:90*Math.floor(Math.random()*4),3:90*Math.floor(Math.random()*4),4:90*Math.floor(Math.random()*4)};
  state.slapLeft=[0,1,2].map(()=>Math.random()<.5);state.damnFacing=[45*Math.floor(Math.random()*8),45*Math.floor(Math.random()*8)];state.latSidesFirst=Math.random()<.5;
  state.waveState={};WAVES.forEach(w=>state.waveState[w.id]={grabbed:false,resolved:false,holder:pickHolder(roleSelect.value,w.id)});
  state.bots={};SLOT_KEYS.filter(s=>s!==roleSelect.value).forEach(s=>{const j=slotJitter(s);state.bots[s]={slot:s,x:j.x,z:j.z,tx:j.x,tz:j.z}});
  youHud.textContent=roleSelect.value;lineHud.textContent=lineLabel(state.self.line);crustHud.textContent='0 / 3';errorsHud.textContent='0';mechHud.textContent='DEBUFF CHECK';timeHud.textContent='0:00';bhBadge.textContent=lineLabel(state.self.line);
  startBtn.textContent='Retry';showDebuffs();banner.textContent='EARTHQUAKE — READ YOUR DEBUFFS';msg.textContent='Memorize se você recebeu Accretion. O card vai sumir.';stage.focus({preventScroll:true});
}
function pickHolder(playerSlot,id){const opts=SLOT_KEYS.filter(s=>s!==playerSlot);return opts[id%opts.length]}
function showDebuffs(){
  const s=state.self;let html=`<div class="debuffChip"><span class="ico line">${s.line}</span><span class="dbTitle">${lineLabel(s.line)} In Line</span><div class="dbSub">Sua ordem de Crust</div></div>`;
  html+=`<div class="debuffChip"><span class="ico crust">◆</span><span class="dbTitle">Primordial Crust</span><div class="dbSub">Precisa de 3 lasers</div></div>`;
  if(s.acc)html+=`<div class="debuffChip"><span class="ico acc">A</span><span class="dbTitle">Accretion</span><div class="dbSub">Memorize antes de sumir</div></div>`;
  debuffReveal.innerHTML=html;debuffReveal.classList.add('show');
}
function hideDebuffs(){if(state.revealHidden)return;state.revealHidden=true;debuffReveal.classList.remove('show');if(state.self?.acc)showToast('Accretion cleansed — agora é memória.');}
function showToast(t,ms=1600){toast.textContent=t;toast.classList.add('show');clearTimeout(showToast._tm);showToast._tm=setTimeout(()=>toast.classList.remove('show'),ms)}
function addError(code,text){if(state.errorKeys.has(code))return;state.errorKeys.add(code);state.errors++;errorsHud.textContent=state.errors;showToast(text,1800)}

function kAngleAt(t){if(t<36.5)return state.kAngles[0];if(t<63.5)return state.kAngles[1];return state.kAngles[2]}
function factorAt(t){return Math.round(kAngleAt(t)/45)%8}
function currentBHSet(t){for(const [k,v] of Object.entries(BH_WINDOWS)){if(t>=v[0]&&t<=v[1])return +k}return 0}
function waveKFactor(w){return factorAt(w.hit-.01)}
function activeSources(w){if(w.set===1)return w.sub===1?[2]:[1,0];if(w.set===4)return w.sub===1?[0,1]:[2];return[2,1,0]}
function orderedSources(w){const act=activeSources(w),rf=(waveKFactor(w)+state.arenaRot[w.set]/45)%8;const order=rf<=3?[0,1,2]:rf<=5?[2,0,1]:[1,2,0];return [...act].sort((a,b)=>order.indexOf(a)-order.indexOf(b))}
function waveAssignments(w){const src=orderedSources(w),keys=DSA_WAVES[w.id-1];return src.map((s,i)=>({source:s,key:keys[i],slot:state.party.assign[keys[i]]}))}
function assignmentForSlot(w,slot){return waveAssignments(w).find(a=>a.slot===slot)||null}
function setPattern(setNo){return(setNo===1||setNo===3)?BH13:BH24}
function bhPositions(setNo){
  const base=setPattern(setNo),out=[];for(let dir=0;dir<4;dir++){for(let i=0;i<base.length;i++){if(dir===3&&i===0)continue;let p={x:base[i][0]*SCALE,z:base[i][1]*SCALE};p=rot(p,dir*90+state.arenaRot[setNo]);out.push({x:p.x,z:p.z,dir,index:i,source:i===0&&dir<3})}}
  return out;
}
function sourcePos(setNo,src){const base=setPattern(setNo)[0];let p={x:base[0]*SCALE,z:base[1]*SCALE};return rot(p,src*90+state.arenaRot[setNo])}
function prePos(setNo,src){const a=PRE[src];return rot({x:a[0]*SCALE,z:a[1]*SCALE},state.arenaRot[setNo])}
function baitPos(setNo,src){const a=BAIT[src];return rot({x:a[0]*SCALE,z:a[1]*SCALE},state.arenaRot[setNo])}

function getActiveWaves(t){return WAVES.filter(w=>t>=w.start&&t<=w.hit+.35)}
function mainWave(t){const a=getActiveWaves(t);return a.sort((x,y)=>x.hit-y.hit)[0]||null}
function waveForBot(t,slot){const a=getActiveWaves(t).filter(w=>assignmentForSlot(w,slot));return a.sort((x,y)=>x.hit-y.hit)[0]||null}

function behindChaos(facing,far=24){const d=pt(norm(facing+180),far);return{x:CHAOS_POS.x+d.x,z:CHAOS_POS.z+d.z}}
const CHAOS_POS={x:-13,z:-9},EXDEATH_POS={x:15,z:-13};
function slapTarget(slot,slap){const k=state.kAngles[slap.k],left=state.slapLeft[slap.id-1];let p;if(left){const rg=roleGroup(slot);p=rg==='tank'?{x:-13*SCALE,z:-13*SCALE}:rg==='healer'?{x:-19*SCALE,z:0}:{x:-13*SCALE,z:13*SCALE}}else p={x:19*SCALE,z:0};return rot(p,-k)}
function edictSlamSafe(facing,k){const r=norm(facing-k);let p;if(r<=45)p={x:22*SCALE,z:22*SCALE};else if(r<=135)p={x:22*SCALE,z:0};else if(r<=180)p={x:22*SCALE,z:-22*SCALE};else if(r<=225)p={x:-22*SCALE,z:-22*SCALE};else if(r<=315)p={x:-22*SCALE,z:0};else p={x:-22*SCALE,z:22*SCALE};return rot(p,-k)}
function bodySafe(slot,k){const side=SLOT_KEYS.indexOf(slot)%2===0?-1:1;const local={x:side*58,z:8*((SLOT_KEYS.indexOf(slot)%4)-1.5)};return rot(local,-k)}
function latSafe(slot,first=true){const k=state.kAngles[2],f=norm(k+45);const choose=(SLOT_KEYS.indexOf(slot)%2===0?-1:1);let a;if(state.latSidesFirst===first)a=norm(f+choose*18);else a=norm(f+90+choose*18);return pt(a,45)}
function desiredBot(slot,t){
  const w=waveForBot(t,slot);if(w){const a=assignmentForSlot(w,slot);if(a){if(t<w.attach)return prePos(w.set,a.source);return baitPos(w.set,a.source)}}
  if(t>=37.3&&t<42.55)return behindChaos(state.damnFacing[0],23);
  if(t>=42.55&&t<47.6)return slapTarget(slot,SLAPS[1]);
  if(t>=64.7&&t<71.1)return edictSlamSafe(state.damnFacing[1],state.kAngles[2]);
  if(t>=105.3&&t<110.72)return latSafe(slot,true);
  if(t>=110.72&&t<111.45)return latSafe(slot,false);
  if(t>=111.45&&t<115.3)return slapTarget(slot,SLAPS[2]);
  if(t>=123.9&&t<129.5)return bodySafe(slot,state.kAngles[2]);
  if(t>=8.5&&t<17.0)return slapTarget(slot,SLAPS[0]);
  const j=slotJitter(slot);return{x:j.x,z:j.z};
}
function updateBots(dt,t){for(const [s,b] of Object.entries(state.bots)){const p=desiredBot(s,t);b.tx=p.x;b.tz=p.z;const speed=40*dt;b.x+=(b.tx-b.x)*clamp(speed,0,1);b.z+=(b.tz-b.z)*clamp(speed,0,1)}}

function updatePlayer(dt,now){let x=state.joyX,y=state.joyY;if(state.keys.has('a')||state.keys.has('arrowleft'))x--;if(state.keys.has('d')||state.keys.has('arrowright'))x++;if(state.keys.has('w')||state.keys.has('arrowup'))y--;if(state.keys.has('s')||state.keys.has('arrowdown'))y++;let m=Math.hypot(x,y);if(m>1){x/=m;y/=m}if(Math.abs(state.camX)>.12)rotateCamera(state.camX*dt*2.6);const ca=Math.cos(state.cam),sa=Math.sin(state.cam),spd=now<state.sprintUntil?SPRINT_SPEED:PLAYER_SPEED;state.player.x+=(ca*x+sa*y)*spd*dt;state.player.z+=(-sa*x+ca*y)*spd*dt;const r=Math.hypot(state.player.x,state.player.z);if(r>ARENA-3){state.player.x*=97/r;state.player.z*=97/r}}
function rotateCamera(d){state.cam+=d;if(Math.abs(state.cam)>Math.PI*4)state.cam=Math.atan2(Math.sin(state.cam),Math.cos(state.cam))}

