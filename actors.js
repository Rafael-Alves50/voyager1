function drawBoss(x,z){
    const g=project(x,z),s=clamp(g.s,.62,1.92)*1.65;drawTargetRing(x,z,1.1);
    ellipse(g.x,g.y+8,42*s,12*s,'rgba(0,0,0,.52)');
    for(let i=0;i<5;i++){const t=performance.now()/520+i*1.7,wx=g.x+Math.sin(t)*38*s,wy=g.y-40*s-Math.cos(t*.8)*26*s;circle(wx,wy,5*s,'#d468ff',null,0,.16)}
    ctx.save();ctx.translate(g.x,g.y-39*s);ctx.scale(s,s);ctx.shadowColor='rgba(199,91,255,.7)';ctx.shadowBlur=15;
    ctx.fillStyle='#6f36a9';ctx.strokeStyle='#e8b8ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-15,-3);ctx.quadraticCurveTo(-40,27,-46,58);ctx.lineTo(-13,41);ctx.lineTo(0,66);ctx.lineTo(14,41);ctx.lineTo(48,58);ctx.quadraticCurveTo(39,26,15,-3);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#8b4ed0';ctx.beginPath();ctx.moveTo(-21,-31);ctx.quadraticCurveTo(0,-45,21,-31);ctx.lineTo(17,16);ctx.quadraticCurveTo(0,29,-17,16);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#d07dff';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-15,-24);ctx.quadraticCurveTo(-55,-45,-68,-4);ctx.moveTo(15,-24);ctx.quadraticCurveTo(55,-45,68,-4);ctx.stroke();
    ctx.strokeStyle='#7d3db3';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-17,-21);ctx.quadraticCurveTo(-50,-7,-55,22);ctx.moveTo(17,-21);ctx.quadraticCurveTo(50,-7,55,22);ctx.stroke();
    circle(0,-48,13,'#efc2ae','#fff',1.3);ctx.fillStyle='#f3d7b2';ctx.strokeStyle='#fff0d4';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-10,-59);ctx.quadraticCurveTo(-42,-83,-52,-60);ctx.quadraticCurveTo(-30,-69,-20,-48);ctx.quadraticCurveTo(-7,-81,0,-70);ctx.quadraticCurveTo(10,-87,18,-51);ctx.quadraticCurveTo(34,-78,54,-60);ctx.quadraticCurveTo(29,-68,18,-45);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#b71d62';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-49);ctx.lineTo(-2,-46);ctx.moveTo(8,-49);ctx.lineTo(2,-46);ctx.stroke();
    circle(-11,-29,4,'#ffcf66','#fff',1);circle(11,-29,4,'#6ee7ff','#fff',1);circle(0,-23,4,'#ff6b9c','#fff',1);
    ctx.restore();
    text('Kefka',g.x,g.y-126*s,17*s,'#f4dcff');
  }
  function drawPlayer(){
    const x=W/2,y=H*.79,now=performance.now(),moving=Math.hypot(state.joyX,state.joyY)>.12||[...state.keys].some(k=>['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k));
    const stride=moving?Math.sin(now/95)*7:0,bob=moving?Math.abs(Math.sin(now/95))*3:Math.sin(now/420)*1.1, lean=moving?clamp(state.joyX,-1,1)*.05:0;
    ellipse(x,y+18,45,13,'rgba(0,0,0,.52)');
    ctx.save();ctx.translate(x,y-20+bob);ctx.rotate(lean);ctx.scale(1.58,1.58);
    ctx.strokeStyle='#d5d2db';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(10,18);ctx.quadraticCurveTo(42,25+stride*.2,36,49);ctx.quadraticCurveTo(29,61,47,64);ctx.stroke();
    ctx.strokeStyle='#2b2940';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-7,28);ctx.lineTo(-10-stride*.45,48);ctx.moveTo(7,28);ctx.lineTo(10+stride*.45,48);ctx.stroke();
    ctx.fillStyle='#eee9df';ctx.strokeStyle='#aaa4b0';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(0,-34);ctx.quadraticCurveTo(-23,-18,-27,34);ctx.lineTo(-17,49);ctx.lineTo(-4,39);ctx.lineTo(0,53);ctx.lineTo(6,39);ctx.lineTo(18,49);ctx.lineTo(28,34);ctx.quadraticCurveTo(23,-18,0,-34);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#574d7c';ctx.beginPath();ctx.moveTo(-18,-8);ctx.lineTo(-22,35);ctx.lineTo(-8,44);ctx.lineTo(-4,2);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(18,-8);ctx.lineTo(22,35);ctx.lineTo(8,44);ctx.lineTo(4,2);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#9a80ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-13,-10);ctx.lineTo(-17,36);ctx.moveTo(13,-10);ctx.lineTo(17,36);ctx.stroke();
    ctx.strokeStyle='#ede8df';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-15,-18);ctx.lineTo(-24-stride*.35,2);ctx.moveTo(15,-18);ctx.lineTo(24+stride*.35,2);ctx.stroke();
    circle(0,-46,11,'#ddb89c','#2a2932',1.5);ctx.fillStyle='#d8d5df';ctx.strokeStyle='#363441';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-9,-54);ctx.lineTo(-15,-70);ctx.lineTo(-2,-58);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(9,-54);ctx.lineTo(15,-70);ctx.lineTo(2,-58);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#d9d7df';ctx.beginPath();ctx.arc(0,-51,11,Math.PI,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c7aa5d';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(27,-18);ctx.lineTo(34,52);ctx.stroke();circle(25,-25,8,'#7667e8','#ece9ff',1.6);circle(25,-25,3,'#f7f1ff');
    ctx.restore();
    text('H1',x,y-142,15,'#baffcf');
    line([{x:x-11,y:y-121},{x,y:y-128},{x:x+11,y:y-121}],'#8fffbf',2.2,.85);
  }
  function drawLC(){
    if(state.phase!=='move'&&state.phase!=='result')return;const n=state.scenario.number,x=W/2,y=H*.79-205;
    ctx.save();ctx.shadowColor=n%2?'#5ea3ff':'#ff6577';ctx.shadowBlur=18;circle(x,y,27,n%2?'#2e66c2':'#b92f48','#fff',2.5);ctx.restore();text(n,x,y,23);
  }
  function drawGameUI(now){
    const bw=330,bx=W/2-bw/2,by=18;ctx.fillStyle='rgba(12,15,24,.72)';ctx.fillRect(bx-8,by-7,bw+16,31);ctx.fillStyle='#37243e';ctx.fillRect(bx,by+11,bw,7);ctx.fillStyle='#9c3d7a';ctx.fillRect(bx,by+11,bw*.92,7);text('Kefka',W/2,by+2,12,'#f0e5ff','800');
    const px=22,py=H-72;ctx.fillStyle='rgba(10,13,21,.72)';ctx.fillRect(px,py,230,49);text('H1  ·  Lv100',px+70,py+13,11,'#f3f7ff','700');ctx.fillStyle='#202c2a';ctx.fillRect(px+18,py+28,190,8);ctx.fillStyle='#58d7a0';ctx.fillRect(px+18,py+28,186,8);text('100%',px+215,py+32,10,'#dfffee','700');
    const cell=27,total=8*cell+7*4,hx=W/2-total/2,hy=H-58;for(let i=0;i<8;i++){const x=hx+i*(cell+4);ctx.fillStyle='rgba(19,23,35,.82)';ctx.fillRect(x,hy,cell,cell);ctx.strokeStyle='rgba(184,192,221,.35)';ctx.strokeRect(x+.5,hy+.5,cell-1,cell-1);circle(x+cell/2,hy+cell/2,5+(i%3),'#8d7fe8',null,0,.42+(i%2)*.14)}
  }
  function drawCast(now){if(!['read','move'].includes(state.phase))return;let p,label;if(state.phase==='read'){p=clamp((now-state.dashStart)/(state.dashEnd-state.dashStart),0,1);label='Limit Cut — reading dashes'}else{p=1-clamp((state.snapshot-now)/state.moveMs,0,1);label='Limit Cut — resolve'}const w=420,x=W/2-w/2,y=H-28;ctx.fillStyle='rgba(8,10,16,.82)';ctx.fillRect(x-6,y-18,w+12,31);ctx.fillStyle='#252b40';ctx.fillRect(x,y,w,9);ctx.fillStyle=state.phase==='read'?'#7f61dc':'#d0a74c';ctx.fillRect(x,y,w*p,9);text(label,W/2,y-9,11)}

  function draw(now){
    ctx.clearRect(0,0,W,H);drawFloor();
    if(state.scenario&&state.phase!=='prep'&&state.phase!=='idle'){
      const s=state.scenario,step=s.rotation==='CW'?45:-45,active=state.phase==='result'?8:Math.max(1,state.dash);
      const elapsed=state.phase==='read'?Math.max(0,now-state.dashStart):8*DASH_MS,local=state.phase==='read'?Math.min(1,(elapsed%DASH_MS)/DASH_MS):1;
      for(let i=0;i<active;i++){const oa=norm(s.origin+step*i),a=pt(oa,70),b=pt(norm(oa+180),70);lane(a,b,i===active-1&&state.phase==='read'?7:4.3,i===active-1&&state.phase==='read')}
      if(state.hints&&state.phase!=='result')for(let i=0;i<8;i++){const q=pt(22.5+i*45,DODGE_R);groundCircle(q.x,q.z,SAFE_R,'rgba(255,255,255,.012)','#79829a',1,.55)}
      const sorted=[...WAYMARKS].sort((a,b)=>project(pt(b[1],80).x,pt(b[1],80).z).d-project(pt(a[1],80).x,pt(a[1],80).z).d);for(const w of sorted)drawWaymark(w[0],w[1]);
      if(state.phase==='read'){const i=active-1,oa=norm(s.origin+step*i),a=pt(oa,70),b=pt(norm(oa+180),70);drawBoss(a.x+(b.x-a.x)*local,a.z+(b.z-a.z)*local)}else{const oa=norm(s.origin+step*7),b=pt(norm(oa+180),70);drawBoss(b.x,b.z)}
      if(state.hints){const q=pt(relNorth(s.origin),DODGE_R),g=project(q.x,q.z);text('REL N',g.x,g.y-18,11,'#78ecff')}
      if(state.phase==='result'){const q=pt(s.target,DODGE_R);groundCircle(q.x,q.z,SAFE_R,'rgba(255,224,132,.17)','#ffe084',3,.95);const g=project(q.x,q.z);text('#'+s.number,g.x,g.y-14,15,'#ffe084')}
    } else for(const w of WAYMARKS)drawWaymark(w[0],w[1]);
    drawPlayer();drawLC();drawCast(now);drawGameUI(now);
    const v=ctx.createRadialGradient(W/2,H*.5,H*.2,W/2,H*.5,W*.7);v.addColorStop(.5,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.30)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  }
  function frame(now){const dt=Math.min(.04,(now-state.last)/1000);state.last=now;update(dt,now);draw(now);requestAnimationFrame(frame)}