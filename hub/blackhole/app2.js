function mechanicAt(t){
  if(t<7)return'DEBUFF CHECK';if(t<17.1)return'SLAP HAPPY';if(t<32.6)return'BLACK HOLE 1';if(t<37.3)return'THUNDER III';if(t<47.7)return'EDICT + SLAP';if(t<64.8)return'BLACK HOLE 2';if(t<71.1)return'EDICT + BODY SLAM';if(t<81.8)return'THUNDER III';if(t<99.1)return'BLACK HOLE 3';if(t<105.3)return'TRANSITION';if(t<115.3)return'LAT/LONG + SLAP';if(t<129.55)return'BLACK HOLE 4';return'CRUST CHECK';
}
function instructionAt(t){
  const w=mainWave(t);if(w){const a=assignmentForSlot(w,roleSelect.value);if(state.hints&&a){const ws=state.waveState[w.id];return ws.grabbed?`Tether ${w.id}: puxe CW e segure o bait.`:`Tether ${w.id}: vá pegar o seu tether.`}if(state.hints&&!a)return`Tether ${w.id}: não é seu — stack.`;return`Tether round ${w.id}. Leia sua prioridade e o norte do Kefka.`}
  if(t<7)return'Memorize sua linha e se apareceu Accretion.';
  if(t>=37.3&&t<42.5)return'Chaos está castando Damning Edict — vá para trás dele.';
  if(t>=64.7&&t<69.8)return'Damning Edict 2 — encontre o lado seguro antes do Body Slam.';
  if(t>=105.3&&t<111.4)return'Leia Latitudinal/Longitudinal e o hand tell do Kefka.';
  if(t>=123.9&&t<129.3)return'Final: Body Slam + último tether ao mesmo tempo.';
  return mechanicAt(t);
}
function updateHud(t){mechHud.textContent=mechanicAt(t);const min=Math.floor(t/60),sec=Math.floor(t%60).toString().padStart(2,'0');timeHud.textContent=`${min}:${sec}`;lineHud.textContent=lineLabel(state.self.line)+(state.hints&&state.self.acc?' · ACC':'');crustHud.textContent=state.hits>=3?'CLEARED':`${state.hits} / 3`;banner.textContent=mechanicAt(t);msg.textContent=instructionAt(t)}

function processWaveGrab(w,t){const a=assignmentForSlot(w,roleSelect.value);if(!a)return;const ws=state.waveState[w.id];if(ws.grabbed)return;const pre=prePos(w.set,a.source);if(t>=w.start&&t<w.hit&&dist(state.player,pre)<13){ws.grabbed=true;showToast(`Tether ${w.id} grabbed.`)}}
function resolveWave(w){const ws=state.waveState[w.id];if(ws.resolved)return;ws.resolved=true;const maps=waveAssignments(w);for(const a of maps){const src=sourcePos(w.set,a.source);let tar;if(a.slot===roleSelect.value){if(ws.grabbed)tar={...state.player};else{const h=state.bots[ws.holder];tar=h?{x:h.x,z:h.z}:{x:0,z:0}}}else{const b=state.bots[a.slot];tar=b?{x:b.x,z:b.z}:{x:0,z:0}};state.lasers.push({source:src,target:tar,start:state.t,end:state.t+.65,slot:a.slot});if(a.slot!==roleSelect.value&&pointToBeam(state.player,src,tar)<6.5)addError(`beam-${w.id}-${a.slot}`,'Você foi cleavado por um laser de outro jogador.');}
  const mine=maps.find(a=>a.slot===roleSelect.value);if(mine){const bait=baitPos(w.set,mine.source);if(ws.grabbed&&dist(state.player,bait)<18){state.hits++;crustHud.textContent=state.hits>=3?'CLEARED':`${state.hits} / 3`;showToast(`Nothingness ${state.hits}/3`);if(state.hits===3)showToast('Primordial Crust cleansed!',2100)}else addError(`miss-${w.id}`,ws.grabbed?'Tether pego, mas bait/aim estava errado.':'Você não pegou seu tether.');}
}
function pointToBeam(p,s,t){let dx=t.x-s.x,dz=t.z-s.z,L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;const ex=s.x+dx*190,ez=s.z+dz*190;return pointSegDist(p,{x:s.x,z:s.z},{x:ex,z:ez})}
function pointSegDist(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;if(!l2)return dist(p,a);let u=((p.x-a.x)*dx+(p.z-a.z)*dz)/l2;u=clamp(u,0,1);return Math.hypot(p.x-(a.x+u*dx),p.z-(a.z+u*dz))}

function slapCircle(slap,index){const left=state.slapLeft[slap.id-1],x=(left?25:-25)*SCALE,z=[-25,0,25][index]*SCALE;return rot({x,z},-state.kAngles[slap.k])}
function evalSlapSide(slap,i){const c=slapCircle(slap,i);if(dist(state.player,c)<50)addError(`slap-${slap.id}-${i}`,'Slap Happy: você ficou no lado das batidas.')}
function evalSlapCenter(slap){if(Math.hypot(state.player.x,state.player.z)<26)addError(`slap-center-${slap.id}`,'Slap Happy: centro explodiu.');const target=slapTarget(roleSelect.value,slap);if(dist(state.player,target)>27)addError(`slap-pos-${slap.id}`,state.slapLeft[slap.id-1]?'Role cones: posição do seu role group estava errada.':'Party stack: você não estava no stack.')}
function inDamning(facing){const a=angleOf(CHAOS_POS,state.player);return angleDiff(a,facing)<=90}
function evalDamning(d){if(inDamning(state.damnFacing[d.id-1]))addError(`edict-${d.id}`,'Damning Edict: precisava estar atrás do Chaos.')}
function inBody(k){const axis=pt(k,1);return Math.abs(state.player.x*axis.z-state.player.z*axis.x)<34}
function evalBody(b){if(inBody(state.kAngles[2]))addError(`body-${b.id}`,'Look Upon Me And Despair: você ficou no Body Slam.')}
function sectorHit(center,facingCenters,half=63.75){const a=angleOf(center,state.player);return facingCenters.some(f=>angleDiff(a,f)<=half)}
function evalLat(which){const f=norm(state.kAngles[2]+45);let centers;if((which===1&&state.latSidesFirst)||(which===2&&!state.latSidesFirst))centers=[norm(f+90),norm(f-90)];else centers=[f,norm(f+180)];if(sectorHit(CHAOS_POS,centers))addError(`lat-${which}`,which===1?'Primeiro Implosion hit.':'Segundo Implosion hit.')}

function processTimed(last,t){
  if(last<7&&t>=7)hideDebuffs();
  for(const s of SLAPS){s.hits.forEach((h,i)=>{if(last<h&&t>=h)evalSlapSide(s,i)});if(last<s.center&&t>=s.center)evalSlapCenter(s)}
  for(const d of DAMN)if(last<d.hit&&t>=d.hit)evalDamning(d);
  for(const b of BODY)if(last<b.hit&&t>=b.hit)evalBody(b);
  if(last<LAT.hit1&&t>=LAT.hit1)evalLat(1);if(last<LAT.hit2&&t>=LAT.hit2)evalLat(2);
  for(const w of WAVES){processWaveGrab(w,t);if(last<w.hit&&t>=w.hit)resolveWave(w)}
}
function checkBlackHoleTouch(t){const set=currentBHSet(t);if(!set)return;if(t-state.bhTouchCooldown<1.2)return;for(const h of bhPositions(set)){if(dist(state.player,h)<7.2){state.bhTouchCooldown=t;addError(`bh-touch-${Math.floor(t)}`,'Você encostou num blackhole — Damage Down.');break}}}
function finishRun(){if(state.result)return;state.result=true;state.running=false;debuffReveal.classList.remove('show');if(state.hits===3&&state.errors===0){banner.textContent='✓ CLEAN CLEAR';msg.textContent='3/3 tethers, Crust cleansed e nenhuma mecânica tomada.'}else{banner.textContent='PULL FINISHED';msg.textContent=`Tethers ${state.hits}/3 · Erros ${state.errors}. Retry para treinar outra distribuição.`}mechHud.textContent='DONE';timeHud.textContent='2:10'}

function update(dt,now){if(!state.running)return;updatePlayer(dt,now);const t=(now-state.runStart)/1000;state.t=t;updateBots(dt,t);processTimed(state.lastT,t);checkBlackHoleTouch(t);updateHud(t);state.lastT=t;if(t>=130)finishRun()}

