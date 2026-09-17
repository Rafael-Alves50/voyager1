  function drawFloor(){
    const sky=ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#777d95'); sky.addColorStop(.26,'#505770'); sky.addColorStop(.48,'#272d43'); sky.addColorStop(.70,'#141928'); sky.addColorStop(1,'#070910'); ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
    const horizon=H*.29;
    const mist=ctx.createLinearGradient(0,horizon-85,0,horizon+180); mist.addColorStop(0,'rgba(210,214,235,.03)'); mist.addColorStop(.45,'rgba(137,145,180,.16)'); mist.addColorStop(1,'rgba(15,18,31,0)'); ctx.fillStyle=mist; ctx.fillRect(0,horizon-85,W,265);
    for(let i=0;i<24;i++){ const xx=(i*217%W), yy=horizon-60+(i*53%160); circle(xx,yy,1+(i%3)*.7,'#d7d9ff',null,0,.1+(i%4)*.03); }
    for(let i=0;i<48;i++){
      const a0=i/48*Math.PI*2,a1=(i+1)/48*Math.PI*2,p=[project(0,0)];
      for(let j=0;j<=5;j++){ const a=a0+(a1-a0)*j/5; p.push(project(Math.cos(a)*ARENA_R,Math.sin(a)*ARENA_R)); }
      poly(p, i%2?'#151c30':'#202941');
    }
    for(const rr of [16,30,44,58,72,86,98]){ const pts=[]; for(let i=0;i<=120;i++){ const a=i/120*Math.PI*2; pts.push(project(Math.cos(a)*rr,Math.sin(a)*rr)); } line(pts, rr===98?'#79a8c1':rr===72?'#435a78':'#303e59', rr===98?4.3:rr===72?1.8:1.05, rr===98?.98:.75); }
    for(let i=0;i<32;i++){ const a=i*Math.PI/16; line([project(Math.cos(a)*8,Math.sin(a)*8),project(Math.cos(a)*98,Math.sin(a)*98)], i%4===0?'#526985':'#26344e', i%4===0?1.8:.8, i%4===0?.72:.48); }
  }

  function drawWaymark(label,deg){
    const b=pt(deg,86), g=project(b.x,b.z); const s=g.s;
    ctx.save(); ctx.translate(g.x,g.y); ctx.scale(s,s);
    ctx.fillStyle = ['A','B','C','D'].includes(label) ? 'rgba(191,70,86,.92)' : 'rgba(72,118,201,.92)';
    ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2.1;
    ctx.beginPath(); ctx.moveTo(0,-22); ctx.lineTo(16,-9); ctx.lineTo(16,18); ctx.quadraticCurveTo(16,26,8,26); ctx.lineTo(-8,26); ctx.quadraticCurveTo(-16,26,-16,18); ctx.lineTo(-16,-9); ctx.closePath(); ctx.fill(); ctx.stroke();
    text(label,0,2,18,'#f6fbff','900'); ctx.restore();
  }

  function drawGiantKefka(round){
    if(!round) return;
    const g=project(round.kefkaPos.x, round.kefkaPos.z, 0), s=g.s*1.1;
    ellipse(g.x,g.y+18*s,40*s,12*s,'rgba(0,0,0,.42)');
    ctx.save(); ctx.translate(g.x,g.y-8*s); ctx.scale(s,s);
    ctx.fillStyle='#6b3479'; ctx.strokeStyle='#f9b4ff'; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(0,-70); ctx.quadraticCurveTo(-48,-46,-56,12); ctx.lineTo(-42,68); ctx.lineTo(-18,60); ctx.lineTo(-6,84); ctx.lineTo(6,84); ctx.lineTo(18,60); ctx.lineTo(42,68); ctx.lineTo(56,12); ctx.quadraticCurveTo(48,-46,0,-70); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#d14c86'; ctx.beginPath(); ctx.moveTo(-18,-10); ctx.lineTo(-24,58); ctx.lineTo(-6,76); ctx.lineTo(0,2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(18,-10); ctx.lineTo(24,58); ctx.lineTo(6,76); ctx.lineTo(0,2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ffd2fa'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-18,-22); ctx.quadraticCurveTo(-55,-43,-67,-2); ctx.moveTo(18,-22); ctx.quadraticCurveTo(55,-43,67,-2); ctx.stroke();
    circle(0,-82,13,'#efc2ae','#fff',1.3);
    ctx.fillStyle='#f3d7b2'; ctx.strokeStyle='#fff0d4'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-10,-93); ctx.quadraticCurveTo(-44,-115,-56,-91); ctx.quadraticCurveTo(-29,-102,-21,-80); ctx.quadraticCurveTo(-8,-112,0,-103); ctx.quadraticCurveTo(11,-118,20,-80); ctx.quadraticCurveTo(33,-103,55,-91); ctx.quadraticCurveTo(29,-103,18,-77); ctx.closePath(); ctx.fill(); ctx.stroke();
    circle(-12,-58,4,'#ffcf66','#fff',1); circle(12,-58,4,'#6ee7ff','#fff',1); circle(0,-52,4,'#ff6b9c','#fff',1);
    ctx.restore();
    text('GIANT KEFKA', g.x, g.y-155*s, 15*s, '#f4dcff');
  }

  function drawPlayer(){
    const x=W/2, y=H*.79, now=performance.now();
    const moving=Math.hypot(state.joyX,state.joyY)>.12||[...state.keys].some(k=>['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k));
    const stride=moving?Math.sin(now/95)*7:0, bob=moving?Math.abs(Math.sin(now/95))*3:Math.sin(now/420)*1.1, lean=moving?clamp(state.joyX,-1,1)*.05:0;
    ellipse(x,y+18,45,13,'rgba(0,0,0,.52)');
    ctx.save(); ctx.translate(x,y-20+bob); ctx.rotate(lean); ctx.scale(1.58,1.58);
    ctx.strokeStyle='#d5d2db'; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(10,18); ctx.quadraticCurveTo(42,25+stride*.2,36,49); ctx.quadraticCurveTo(29,61,47,64); ctx.stroke();
    ctx.strokeStyle='#2b2940'; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(-7,28); ctx.lineTo(-10-stride*.45,48); ctx.moveTo(7,28); ctx.lineTo(10+stride*.45,48); ctx.stroke();
    ctx.fillStyle='#eee9df'; ctx.strokeStyle='#aaa4b0'; ctx.lineWidth=1.7; ctx.beginPath(); ctx.moveTo(0,-34); ctx.quadraticCurveTo(-23,-18,-27,34); ctx.lineTo(-17,49); ctx.lineTo(-4,39); ctx.lineTo(0,53); ctx.lineTo(6,39); ctx.lineTo(18,49); ctx.lineTo(28,34); ctx.quadraticCurveTo(23,-18,0,-34); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#574d7c'; ctx.beginPath(); ctx.moveTo(-18,-8); ctx.lineTo(-22,35); ctx.lineTo(-8,44); ctx.lineTo(-4,2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(18,-8); ctx.lineTo(22,35); ctx.lineTo(8,44); ctx.lineTo(4,2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#9a80ff'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-13,-10); ctx.lineTo(-17,36); ctx.moveTo(13,-10); ctx.lineTo(17,36); ctx.stroke();
    ctx.strokeStyle='#ede8df'; ctx.lineWidth=9; ctx.beginPath(); ctx.moveTo(-15,-18); ctx.lineTo(-24-stride*.35,2); ctx.moveTo(15,-18); ctx.lineTo(24+stride*.35,2); ctx.stroke();
    circle(0,-46,11,'#ddb89c','#2a2932',1.5);
    ctx.fillStyle='#d8d5df'; ctx.strokeStyle='#363441'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(-9,-54); ctx.lineTo(-15,-70); ctx.lineTo(-2,-58); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(9,-54); ctx.lineTo(15,-70); ctx.lineTo(2,-58); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#d9d7df'; ctx.beginPath(); ctx.arc(0,-51,11,Math.PI,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#c7aa5d'; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(27,-18); ctx.lineTo(34,52); ctx.stroke(); circle(25,-25,8,'#7667e8','#ece9ff',1.6); circle(25,-25,3,'#f7f1ff');
    ctx.restore();
    text(state.setup?.slot || roleSelect.value,x,y-142,15,'#baffcf');
    line([{x:x-11,y:y-121},{x,y:y-128},{x:x+11,y:y-121}],'#8fffbf',2.2,.85);
  }

  function drawStack(round){
    if(!round) return;
    groundCircle(0,0,STACK_R,'rgba(100,180,255,.06)','rgba(170,210,255,.42)',2,.75);
    const g=project(0,0); text('STACK', g.x, g.y-10, 13, '#d7ebff');
  }

  function drawHoles(round){
    if(!round) return;
    round.holes.forEach((h,idx)=>{
      const p=project(h.x,h.z); const s=p.s;
      const isTarget = state.phase==='set' && round.active && idx===round.myIndex;
      const showTarget = state.hints || state.phase==='result' || state.phase==='after';
      const glow = isTarget && showTarget;
      ellipse(p.x,p.y+3*s,12*s,4.4*s,'rgba(0,0,0,.46)');
      const grad=ctx.createRadialGradient(p.x,p.y,2*s,p.x,p.y,17*s); grad.addColorStop(0,'rgba(0,0,0,.92)'); grad.addColorStop(.55,'rgba(4,6,10,.98)'); grad.addColorStop(.7, glow?'rgba(255,224,132,.9)':'rgba(122,166,255,.72)'); grad.addColorStop(1,'rgba(0,0,0,.1)');
      circle(p.x,p.y,13*s,grad,null,0,1); circle(p.x,p.y,12.5*s,'rgba(0,0,0,.55)', glow?'#ffe084':'#9be8ff', 2.3*s, .95);
      const pulse=1+Math.sin(performance.now()/220 + idx)*.06;
      circle(p.x,p.y,4.5*s*pulse, glow?'rgba(255,232,168,.75)':'rgba(155,232,255,.42)');
      if(state.hints || (state.phase!=='set' && state.phase!=='idle')) text(`${idx+1}`,p.x,p.y-18*s,12*s, glow?'#ffe084':'#dffaff');
      if(state.phase==='set' && round.active && idx===round.myIndex){
        const d = dist(state.player,h); if(d<=HOLE_R+2) state.touchedRight=true;
      }
    });
  }

  function drawTetherPreview(round){
    if(!round || state.phase!=='set') return;
    round.holes.forEach((h,idx)=>{
      const p1 = project(h.x,h.z,1), p2 = project(0,0,1);
      const alpha = round.active && idx===round.myIndex ? .7 : .25;
      line([p1,p2], round.active && idx===round.myIndex ? '#ffe084' : '#9be8ff', round.active && idx===round.myIndex ? 3.2 : 1.5, alpha);
    });
  }

  function drawCastBar(){
    if(!['set','intermission','after'].includes(state.phase)) return;
    let p=0,label='';
    if(state.phase==='set'){ p = clamp((performance.now()-state.setStart)/SET_MS,0,1); label = state.active?'Black Hole — resolve your tether':'Black Hole — hold middle'; }
    else if(state.phase==='intermission'){ p = 1-clamp((state.intermissionEnd-performance.now())/INTERMISSION_MS,0,1); label='Reorient to the new north'; }
    else { p=1-clamp((state.intermissionEnd-performance.now())/BREAK_MS,0,1); label=state.lastStatus; }
    const w=460,x=W/2-w/2,y=H-28; ctx.fillStyle='rgba(8,10,16,.82)'; ctx.fillRect(x-6,y-18,w+12,31); ctx.fillStyle='#252b40'; ctx.fillRect(x,y,w,9); ctx.fillStyle= state.phase==='set' ? '#56d7c0' : '#d0a74c'; ctx.fillRect(x,y,w*p,9); text(label,W/2,y-9,11);
  }

  function drawGameUI(round){
    const bw=360,bx=W/2-bw/2,by=18; ctx.fillStyle='rgba(12,15,24,.72)'; ctx.fillRect(bx-8,by-7,bw+16,31); ctx.fillStyle='#37243e'; ctx.fillRect(bx,by+11,bw,7); const fill= round ? (round.index/10) : 0; ctx.fillStyle='#42c8b0'; ctx.fillRect(bx,by+11,bw*fill,7); text(`Black Hole · set ${round?round.index:0} / 10`,W/2,by+2,12,'#f0e5ff','800');
    const px=22,py=H-72; ctx.fillStyle='rgba(10,13,21,.72)'; ctx.fillRect(px,py,260,49); const preLabel=modeSelect.value==='random'&&!state.setup?'RANDOM':`${lineName(+lineSelect.value)}${accSelect.value==='yes'?' + ACC':''}`; text(`${state.setup?.slot || roleSelect.value}  ·  ${state.setup?lineName(state.setup.line)+(state.setup.acc?' + ACC':''):preLabel}`,px+105,py+13,11,'#f3f7ff','700'); ctx.fillStyle='#202c2a'; ctx.fillRect(px+18,py+28,210,8); ctx.fillStyle='#58d7a0'; ctx.fillRect(px+18,py+28,210,8); text('100%',px+238,py+32,10,'#dfffee','700');
    const cell=27,total=8*cell+7*4,hx=W/2-total/2,hy=H-58; for(let i=0;i<8;i++){ const x=hx+i*(cell+4); ctx.fillStyle='rgba(19,23,35,.82)'; ctx.fillRect(x,hy,cell,cell); ctx.strokeStyle='rgba(184,192,221,.35)'; ctx.strokeRect(x+.5,hy+.5,cell-1,cell-1); circle(x+cell/2,hy+cell/2,5+(i%3), i<4 ? '#8d7fe8' : '#59cdb2', null, 0, .42+(i%2)*.14); }
  }

  function drawNorthHint(round){
    if(!round || !state.hints) return;
    const p=pt(round.kefkaAngle, 70), g=project(p.x,p.z); text('REL N', g.x, g.y-18, 11, '#78ecff');
  }

