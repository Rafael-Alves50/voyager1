(()=>{
'use strict';
const PASS=5.2, COOLDOWN=.28, BOT_TAKE=.24, BOT_RECLAIM=.52;
const epos=r=>r===state.playerRole?state.player:(state.bots[r]||CENTER_POS[r]||{x:0,z:0});
function segd(p,a,b){const x=b.x-a.x,z=b.z-a.z,px=p.x-a.x,pz=p.z-a.z,d=x*x+z*z||1,t=clamp((px*x+pz*z)/d,0,1);return Math.hypot(p.x-(a.x+x*t),p.z-(a.z+z*t))}
function moving(){if(Math.hypot(state.joyX||0,state.joyY||0)>.12)return true;const k=state.keys;if(!k)return false;return['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(x=>k.has(x))}
function rank(src){if(!state.activeBH)return src+1;const n=norm(state.kefka.facingFactor*45);return [0,1,2].map(i=>{const p=sourcePoint(state.activeBH,i);return{i,d:norm(norm(Math.atan2(p.x,-p.z)*180/Math.PI)-n)}}).sort((a,b)=>a.d-b.d).findIndex(x=>x.i===src)+1}
function decoy(intendedSet,intended,used){let p=ROLES.filter(r=>r!==state.playerRole&&r!==intended&&!intendedSet.has(r)&&!used.has(r));if(!p.length)p=ROLES.filter(r=>r!==state.playerRole&&r!==intended&&!used.has(r));if(!p.length)p=ROLES.filter(r=>r!==state.playerRole&&r!==intended);const r=p[Math.floor(Math.random()*p.length)]||intended;if(r)used.add(r);return r}
function current(){return state.activeBH?state.activeTethers.filter(t=>t.wave===state.activeBH.wave):[]}
function uninvolvedCenter(r){if(!r||r===state.playerRole)return;if(!state.activeTethers.some(t=>t.holderRole===r||t.intendedRole===r))moveBot(r,CENTER_POS[r],48)}

prepareWave=function(block,wave,append=false){
 if(!state.activeBH||state.activeBH.block!==block)return;
 state.activeBH.wave=wave;state.currentWave=`${block}.${wave}`;waveHud.textContent=`${block}.${wave}`;
 const sources=activeSources(block,wave),keys=TARGETS[block][wave],wanted=new Set(keys.map(keyToRole));
 if(!append)state.activeTethers=state.activeTethers.filter(t=>sources.includes(t.srcIdx));
 const used=new Set(state.activeTethers.map(t=>t.holderRole).filter(Boolean));
 sources.forEach((srcIdx,i)=>{
  const key=keys[i], intendedRole=keyToRole(key);let t=state.activeTethers.find(x=>x.srcIdx===srcIdx);
  if(!t){t={srcIdx,src:sourcePoint(state.activeBH,srcIdx),key,role:intendedRole,intendedRole,holderRole:decoy(wanted,intendedRole,used),wave,passable:true,established:false,armed:false,botAt:Infinity,last:-999,pcool:0,fired:0};state.activeTethers.push(t)}
  else{t.src=sourcePoint(state.activeBH,srcIdx);t.key=key;t.role=intendedRole;t.intendedRole=intendedRole;t.wave=wave;t.passable=true;t.armed=false;t.botAt=Infinity}
  if(intendedRole!==state.playerRole&&t.holderRole!==intendedRole)moveBot(intendedRole,prePos(srcIdx,state.activeBH.rotation),72);
  else if(intendedRole!==state.playerRole&&t.holderRole===intendedRole&&t.established)moveBot(intendedRole,baitPos(srcIdx,state.activeBH.rotation),76);
 });
 for(const r of ROLES){if(r!==state.playerRole&&!state.activeTethers.some(t=>t.holderRole===r||t.intendedRole===r))moveBot(r,CENTER_POS[r],48)}
 const mine=state.activeTethers.find(t=>t.wave===wave&&t.intendedRole===state.playerRole);
 if(mine)msg.textContent=mine.holderRole===state.playerRole?'Seu Black Hole continua ativo: o tether permanece em você. Mantenha o bait CW.':(state.hints?`Sua vez: pegue o tether CW #${rank(mine.srcIdx)} relativo ao Kefka.`:'Sua vez: reconheça o Black Hole correto e roube o tether do holder atual.');
 else msg.textContent=state.hints?'Não é sua vez. Tethers persistentes ficam com seus holders até uma troca ser necessária.':'Tethers ativos — use o Kefka como norte e não roube um tether que não é seu.';
};

grabWave=function(){
 if(!state.activeBH)return;
 for(const t of current()){
  t.passable=true;
  if(t.holderRole===t.intendedRole){t.armed=false;t.botAt=Infinity;if(t.established&&t.intendedRole!==state.playerRole)moveBot(t.intendedRole,baitPos(t.srcIdx,state.activeBH.rotation),76);continue}
  t.armed=true;
  if(t.intendedRole!==state.playerRole){moveBot(t.intendedRole,prePos(t.srcIdx,state.activeBH.rotation),74);t.botAt=state.elapsed+(t.holderRole===state.playerRole?BOT_RECLAIM:BOT_TAKE)}
 }
};

function pass(t,to){
 if(!to||to===t.holderRole)return;const old=t.holderRole;t.holderRole=to;t.last=state.elapsed;
 if(to===t.intendedRole){t.established=true;if(to!==state.playerRole)moveBot(to,baitPos(t.srcIdx,state.activeBH.rotation),78)}
 if(to===state.playerRole){banner.textContent=to===t.intendedRole?'✓ TETHER GRABBED':'⚠ WRONG TETHER';msg.textContent=to===t.intendedRole?'Tether correto. Gire clockwise e mantenha o bait.':'Você roubou um tether que não é seu. O resolver correto vai recuperar.'}
 else if(old===state.playerRole){banner.textContent='TETHER PASSED';t.pcool=state.elapsed+.45}
 uninvolvedCenter(old);
}
function tickTethers(){
 if(!state.activeBH||!state.activeTethers.length)return;
 if(moving())for(const t of state.activeTethers){if(!t.passable||!t.holderRole||t.holderRole===state.playerRole||state.elapsed<t.pcool||state.elapsed-t.last<COOLDOWN)continue;if(segd(state.player,t.src,epos(t.holderRole))<=PASS)pass(t,state.playerRole)}
 for(const t of state.activeTethers){if(!t.armed||!t.intendedRole||t.intendedRole===state.playerRole||t.holderRole===t.intendedRole||state.elapsed<(t.botAt??Infinity))continue;pass(t,t.intendedRole);t.armed=false;t.botAt=Infinity}
 for(const t of state.activeTethers){if(t.established&&t.holderRole&&t.holderRole!==state.playerRole)moveBot(t.holderRole,baitPos(t.srcIdx,state.activeBH.rotation),78)}
}

hitWave=function(block,wave){
 if(!state.activeBH||state.activeBH.block!==block)return;
 for(const t of state.activeTethers.filter(t=>t.wave===wave)){
  const holder=t.holderRole,target=epos(holder);state.laserFx.push({src:{...t.src},target:{x:target.x,z:target.z},until:state.elapsed+.58});
  if(holder!==t.intendedRole)mistake(`Tether ${block}.${wave}: ${DISPLAY[holder]||holder} terminou com o tether de ${DISPLAY[t.intendedRole]||t.intendedRole}.`);
  else if(t.intendedRole===state.playerRole&&dist(state.player,baitPos(t.srcIdx,state.activeBH.rotation))>18)mistake(`Tether ${block}.${wave}: tether correto, mas bait CW ficou fora da posição.`);
  t.fired=(t.fired||0)+1;t.lastFiredAt=state.elapsed;
 }
 const next=TARGETS[block]?.[wave+1]?new Set(activeSources(block,wave+1)):new Set();
 state.activeTethers=state.activeTethers.filter(t=>t.wave!==wave||next.has(t.srcIdx));
};

drawTethers=function(){if(!state.activeBH)return;for(const t of state.activeTethers){if(!t.holderRole)continue;const hp=epos(t.holderRole),s=project(t.src.x,t.src.z,2),p=project(hp.x,hp.z,8),me=t.holderRole===state.playerRole,good=me&&t.intendedRole===state.playerRole,bad=me&&t.intendedRole!==state.playerRole,c=bad?'#ff6f83':good?'#ffe084':t.established?'#dce8ff':'#b8bfd5';line([s,p],c,me?4.3:2.5,.96);circle(s.x,s.y,4.8*s.s,'#07080c',c,1.6,.98);if(state.hints){const r=rank(t.srcIdx);text(r===1?'CW 1 · DPS':r===2?'CW 2 · SUP':'CW 3 · ACC',s.x,s.y-18*s.s,9*s.s,'#e7f7ff','900');if(t.fired>0)text(`KEPT ×${t.fired}`,p.x,p.y-25*p.s,8.5*p.s,'#9dffc8','900')}}};

update=function(dt,now){
 updateMovement(dt,now);updateBots(dt);if(state.phase!=='running')return;
 state.elapsed=(now-state.startedAt)/1000;timeHud.textContent=`${Math.floor(state.elapsed/60)}:${String(Math.floor(state.elapsed%60)).padStart(2,'0')}`;
 if(state.debuffHideAt&&state.elapsed>=state.debuffHideAt){hideDebuffs();state.debuffHideAt=0}
 while(state.eventIndex<state.events.length&&state.elapsed>=state.events[state.eventIndex].t){state.events[state.eventIndex++].fn()}
 tickTethers();state.laserFx=state.laserFx.filter(x=>x.until>state.elapsed);state.aoes=state.aoes.filter(x=>x.until>state.elapsed);state.casts=state.casts.filter(x=>x.end+1.2>state.elapsed);
};
})();
