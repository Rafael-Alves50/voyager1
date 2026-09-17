  function draw(now){
    ctx.clearRect(0,0,W,H); drawFloor();
    const round=currentRound();
    const waymarks=[['A',0],['2',45],['B',90],['3',135],['C',180],['4',225],['D',270],['1',315]];
    const sorted=[...waymarks].sort((a,b)=>project(pt(b[1],80).x,pt(b[1],80).z).d-project(pt(a[1],80).x,pt(a[1],80).z).d);
    for(const w of sorted) drawWaymark(w[0], w[1]);
    drawStack(round); drawTetherPreview(round); drawHoles(round); drawNorthHint(round); drawGiantKefka(round); drawPlayer(); drawCastBar(); drawGameUI(round);
    const v=ctx.createRadialGradient(W/2,H*.5,H*.2,W/2,H*.5,W*.7); v.addColorStop(.5,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.30)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  }

  function frame(now){ const dt=Math.min(.04,(now-state.last)/1000); state.last=now; update(dt, now); draw(now); requestAnimationFrame(frame); }

  function stick(el,e){ const r=el.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2; let x=(e.clientX-cx)/(r.width*.36), y=(e.clientY-cy)/(r.height*.36), m=Math.hypot(x,y); if(m>1){x/=m;y/=m} return {x,y,r}; }
  function bindStick(el,type){
    el.addEventListener('pointerdown',e=>{ e.stopPropagation(); const s=stick(el,e); if(type==='move'){state.movePid=e.pointerId; state.joyX=s.x; state.joyY=s.y;} else { state.camPid=e.pointerId; state.camX=s.x; } el.setPointerCapture(e.pointerId); el.style.setProperty('--jx', s.x*s.r.width*.24+'px'); el.style.setProperty('--jy', s.y*s.r.height*.24+'px'); e.preventDefault(); });
    el.addEventListener('pointermove',e=>{ const id=type==='move'?state.movePid:state.camPid; if(e.pointerId!==id) return; const s=stick(el,e); if(type==='move'){state.joyX=s.x; state.joyY=s.y;} else state.camX=s.x; el.style.setProperty('--jx', s.x*s.r.width*.24+'px'); el.style.setProperty('--jy', s.y*s.r.height*.24+'px'); e.preventDefault(); });
    const up=e=>{ if(type==='move'&&e.pointerId===state.movePid){state.movePid=null; state.joyX=state.joyY=0;} else if(type==='cam'&&e.pointerId===state.camPid){state.camPid=null; state.camX=0;} else return; el.style.setProperty('--jx','0px'); el.style.setProperty('--jy','0px'); }; el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
  }
  bindStick(joy,'move'); bindStick(camJoy,'cam');
  sprintBtn.addEventListener('pointerdown',e=>{ e.stopPropagation(); const now=performance.now(); if(now>=state.sprintUntil){ state.sprintUntil=now+2600; sprintBtn.classList.add('on'); setTimeout(()=>sprintBtn.classList.remove('on'),2650);} e.preventDefault(); });
  startBtn.addEventListener('click', startRun);
  modeSelect.addEventListener('change',()=>{state.setup=null; syncModeUI(); refreshHud();});
  roleSelect.addEventListener('change',()=>{state.setup=null; if((roleSelect.value==='MT' || roleSelect.value==='ST') && accSelect.value==='yes') accSelect.value='no'; refreshHud(); });
  lineSelect.addEventListener('change',()=>{state.setup=null; if(+lineSelect.value===3 && accSelect.value==='yes') accSelect.value='no'; refreshHud(); });
  accSelect.addEventListener('change',()=>{state.setup=null; if(accSelect.value==='yes' && (roleSelect.value==='MT' || roleSelect.value==='ST' || +lineSelect.value===3)) accSelect.value='no'; refreshHud(); });
  hintBtn.addEventListener('click',()=>{ state.hints=!state.hints; hintBtn.textContent=state.hints?'Hints ON':'Hints OFF'; hintBtn.setAttribute('aria-pressed',state.hints); });
  window.addEventListener('keydown',e=>{ const k=e.key.toLowerCase(); if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k)){ state.keys.add(k); e.preventDefault(); } if(k==='q') rotateCamera(-.18); if(k==='e') rotateCamera(.18); if((k==='r'||k==='enter'||k===' ')&&!e.repeat){ startRun(); e.preventDefault(); } },{passive:false});
  window.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));
  syncModeUI(); refreshHud(); draw(performance.now()); requestAnimationFrame(frame);
