'use strict';
  const $ = id => document.getElementById(id);
  const canvas=$('game'), ctx=canvas.getContext('2d'), stage=$('stage');
  const startBtn=$('startBtn'), difficulty=$('difficulty'), hintBtn=$('hintBtn'), sprintBtn=$('sprintBtn');
  const joy=$('joy'), camJoy=$('camJoy'), banner=$('banner'), msg=$('msg'), lcBadge=$('lcBadge');
  const numHud=$('numHud'), spinHud=$('spinHud'), scoreHud=$('scoreHud'), timeHud=$('timeHud');

  const W=1280,H=720,R=100,DODGE_R=81,SAFE_R=16,PREP=1600,DASH_MS=760,DASHES=8;
  const WAYMARKS=[['A',0],['2',45],['B',90],['3',135],['C',180],['4',225],['D',270],['1',315]];
  const MARK_COL={A:'#ef5350',B:'#ef5350',C:'#ef5350',D:'#ef5350','1':'#4b8cff','2':'#4b8cff','3':'#4b8cff','4':'#4b8cff'};
  const state={phase:'idle',scenario:null,player:{x:0,z:0},cam:0,joyX:0,joyY:0,camX:0,keys:new Set(),
    movePid:null,camPid:null,sprintUntil:0,prepEnd:0,dashStart:0,dashEnd:0,snapshot:0,moveMs:5000,
    dash:0,hints:false,score:0,attempts:0,enteredAt:null,onSpot:false,last:performance.now()};

  const norm=a=>((a%360)+360)%360;
  const pt=(deg,r)=>{const a=deg*Math.PI/180;return{x:r*Math.sin(a),z:-r*Math.cos(a)}};
  const relNorth=a=>norm(a+180);
  function solve(origin,rotation,n){
    const dir=rotation==='CCW'?1:-1;
    return norm(relNorth(origin)+dir*(45*n-22.5));
  }
  function deal(){
    const origin=WAYMARKS[Math.floor(Math.random()*8)][1];
    const rotation=Math.random()<.5?'CW':'CCW', number=1+Math.floor(Math.random()*8);
    return {origin,rotation,number,target:solve(origin,rotation,number)};
  }
  function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

  function newRound(){
    const now=performance.now(); state.scenario=deal(); state.phase='prep'; state.player={x:0,z:0}; state.cam=0;
    state.moveMs=Math.max(3000,+difficulty.value||5000); state.prepEnd=now+PREP; state.dash=0; state.enteredAt=null; state.onSpot=false;
    state.sprintUntil=0; sprintBtn.classList.remove('on');
    lcBadge.textContent='?'; lcBadge.classList.remove('even'); numHud.textContent='—'; spinHud.textContent='—'; timeHud.textContent='READY';
    banner.textContent='GET READY'; msg.textContent='Use MOVE para andar e CAM para girar a câmera.'; startBtn.textContent='Retry'; stage.focus({preventScroll:true});
  }
  function beginRead(now){
    state.phase='read'; state.dashStart=now; state.dashEnd=now+DASHES*DASH_MS; state.dash=1;
    banner.textContent='WATCH THE DASHES'; spinHud.textContent=state.hints?state.scenario.rotation:'WATCH'; timeHud.textContent='READ';
    msg.textContent='Leia o primeiro dash e descubra sozinho se o padrão gira para a direita ou esquerda.';
  }
  function beginMove(now){
    state.phase='move'; state.snapshot=now+state.moveMs; state.enteredAt=null;
    const n=state.scenario.number; lcBadge.textContent=n; lcBadge.classList.toggle('even',n%2===0); numHud.textContent='#'+n;
    spinHud.textContent=state.hints?state.scenario.rotation:'DECIDE'; banner.textContent=`#${n} — MOVE`; timeHud.textContent=(state.moveMs/1000).toFixed(1)+'s';
    msg.textContent='Resolva o número e corra até seu spot antes do snapshot.';
  }
  function finish(now){
    const t=pt(state.scenario.target,DODGE_R), d=dist(state.player,t), ok=d<=SAFE_R;
    state.phase='result'; state.attempts++; if(ok)state.score++;
    scoreHud.textContent=`${state.score} / ${state.attempts}`; banner.textContent=ok?'✓ SAFE':'✕ WIPE'; spinHud.textContent=state.scenario.rotation;
    const reaction=state.enteredAt?(state.enteredAt-(state.snapshot-state.moveMs))/1000:null;
    timeHud.textContent=reaction!=null?reaction.toFixed(2)+'s':'—';
    msg.textContent=ok?`Acertou #${state.scenario.number}${reaction!=null?` · ${reaction.toFixed(2)}s`:''}.`:`Wipe — o spot correto foi revelado.`;
  }

  function rotateCamera(d){state.cam+=d;if(Math.abs(state.cam)>Math.PI*4)state.cam=Math.atan2(Math.sin(state.cam),Math.cos(state.cam))}
  function update(dt,now){
    let x=state.joyX,y=state.joyY;
    if(state.keys.has('a')||state.keys.has('arrowleft'))x-=1;if(state.keys.has('d')||state.keys.has('arrowright'))x+=1;
    if(state.keys.has('w')||state.keys.has('arrowup'))y-=1;if(state.keys.has('s')||state.keys.has('arrowdown'))y+=1;
    const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}
    if(Math.abs(state.camX)>.12)rotateCamera(state.camX*dt*2.6);
    const ca=Math.cos(state.cam),sa=Math.sin(state.cam), speed=now<state.sprintUntil?95:68;
    if(state.phase!=='result'){
      state.player.x+=(ca*x+sa*y)*speed*dt;
      state.player.z+=(-sa*x+ca*y)*speed*dt;
      const r=Math.hypot(state.player.x,state.player.z),max=R-4;if(r>max){state.player.x*=max/r;state.player.z*=max/r}
    }
    if(state.phase==='prep'&&now>=state.prepEnd)beginRead(now);
    if(state.phase==='read'){
      const elapsed=Math.max(0,now-state.dashStart);state.dash=Math.min(DASHES,Math.floor(elapsed/DASH_MS)+1);
      banner.textContent=`DASH ${state.dash} / 8`;timeHud.textContent='D'+state.dash;spinHud.textContent=state.hints?state.scenario.rotation:'WATCH';
      if(now>=state.dashEnd)beginMove(now);
    }else if(state.phase==='move'){
      const target=pt(state.scenario.target,DODGE_R), d=dist(state.player,target);state.onSpot=d<=SAFE_R;
      if(state.onSpot&&state.enteredAt==null)state.enteredAt=now;
      const remain=Math.max(0,state.snapshot-now);timeHud.textContent=(remain/1000).toFixed(1)+'s';
      if(remain<=3000&&remain>0)banner.textContent=`${Math.ceil(remain/1000)}… ${state.onSpot?'SPOT OK':'MOVE'}`;
      else banner.textContent=state.onSpot?'✓ SPOT OK — HOLD':`#${state.scenario.number} — MOVE`;
      if(now>=state.snapshot)finish(now);
    }
  }