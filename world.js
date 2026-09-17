// Camera-follow projection: player stays near the lower center while the arena moves around them.
  function camCoords(x,z){const dx=x-state.player.x,dz=z-state.player.z,ca=Math.cos(state.cam),sa=Math.sin(state.cam);return{right:ca*dx-sa*dz,forward:-sa*dx-ca*dz}}
  function project(x,z,h=0){const c=camCoords(x,z);const pers=clamp(1/(1+c.forward/210),.48,2.05);return{x:W/2+c.right*5.55*pers,y:H*.79-c.forward*3.8*pers-h*1.42*pers,s:pers,d:c.forward}}
  function poly(points,fill,stroke=null,w=1,a=1){if(points.length<3)return;ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke()}ctx.restore()}
  function line(points,color,w=1,a=1){if(points.length<2)return;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();ctx.restore()}
  function circle(x,y,r,fill,stroke=null,w=1,a=1){ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke()}ctx.restore()}
  function ellipse(x,y,rx,ry,fill,a=1){ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.restore()}
  function text(t,x,y,size,color='#fff',weight='800'){ctx.save();ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=4;ctx.fillText(t,x,y);ctx.restore()}
  function groundCircle(x,z,r,fill,stroke,w=1,a=1){const pts=[];for(let i=0;i<32;i++){const q=i/32*Math.PI*2;pts.push(project(x+Math.cos(q)*r,z+Math.sin(q)*r))}poly(pts,fill,stroke,w,a)}
  function lane(a,b,half,active){
    const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1,nx=-dz/L*half,nz=dx/L*half;
    const q=[project(a.x+nx,a.z+nz),project(b.x+nx,b.z+nz),project(b.x-nx,b.z-nz),project(a.x-nx,a.z-nz)];
    if(active){poly(q,'rgba(196,82,242,.20)',null,0,1);poly(q,'rgba(180,64,230,.18)','#edb1ff',2.2,.95);const mid1={x:a.x+dx*.18,z:a.z+dz*.18},mid2={x:a.x+dx*.82,z:a.z+dz*.82};line([project(mid1.x,mid1.z,.1),project(mid2.x,mid2.z,.1)],'#ffd5ff',3,.8)}
    else poly(q,'rgba(140,70,175,.045)','#6c3d82',1,.30);
  }

  function drawFloor(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#777d95');sky.addColorStop(.26,'#505770');sky.addColorStop(.48,'#272d43');sky.addColorStop(.70,'#141928');sky.addColorStop(1,'#070910');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const horizon=H*.29;
    const mist=ctx.createLinearGradient(0,horizon-85,0,horizon+180);mist.addColorStop(0,'rgba(210,214,235,.03)');mist.addColorStop(.45,'rgba(137,145,180,.16)');mist.addColorStop(1,'rgba(15,18,31,0)');ctx.fillStyle=mist;ctx.fillRect(0,horizon-85,W,265);
    for(let i=0;i<26;i++){const xx=(i*197%W), yy=horizon-70+(i*61%150);circle(xx,yy,1+(i%3)*.6,'#d7d9ff',null,0,.10+(i%4)*.035)}
    for(let i=0;i<48;i++){const a0=i/48*Math.PI*2,a1=(i+1)/48*Math.PI*2,p=[project(0,0)];for(let j=0;j<=5;j++){const a=a0+(a1-a0)*j/5;p.push(project(Math.cos(a)*R,Math.sin(a)*R))}poly(p,i%2?'#151c30':'#202941')}
    for(const rr of [16,30,44,58,72,86,98]){const pts=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;pts.push(project(Math.cos(a)*rr,Math.sin(a)*rr))}line(pts,rr===98?'#79a8c1':rr===72?'#435a78':'#303e59',rr===98?4.3:rr===72?1.8:1.05,rr===98?.98:.75)}
    for(let i=0;i<32;i++){const a=i*Math.PI/16;line([project(Math.cos(a)*8,Math.sin(a)*8),project(Math.cos(a)*98,Math.sin(a)*98)],i%4===0?'#526985':'#26344e',i%4===0?1.8:.8,i%4===0?.72:.48)}
    for(let i=0;i<16;i++){const a=i*Math.PI/8+.035,p1=project(Math.cos(a)*88,Math.sin(a)*88,.05),p2=project(Math.cos(a)*95,Math.sin(a)*95,.05);line([p1,p2],i%2?'#476a8b':'#6a4b88',2.2,.55)}
    for(let r=18;r<92;r+=11){for(let i=0;i<32;i+=2){const a=i*Math.PI/16+0.02*(r%3),p1=project(Math.cos(a)*r,Math.sin(a)*r),p2=project(Math.cos(a+.045)*(r+6),Math.sin(a+.045)*(r+6));line([p1,p2],'#64718a',.65,.16)}}
    for(let i=0;i<40;i++){const a=i*Math.PI/20,p=pt(a*180/Math.PI,100),q=pt(a*180/Math.PI,105+(i%3));const p1=project(p.x,p.z),p2=project(q.x,q.z,1.5+(i%2));line([p1,p2],i%2?'#48718b':'#2c526c',2,.48)}
  }
  function drawWaymark(mark,ang){
    const p=pt(ang,80),g=project(p.x,p.z),s=clamp(g.s,.58,1.8),col=MARK_COL[mark];
    ctx.save();ctx.translate(g.x,g.y);ctx.scale(1,.42);ctx.rotate(Math.PI/4);ctx.globalAlpha=.22;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=18*s;ctx.fillRect(-27*s,-27*s,54*s,54*s);ctx.restore();
    const topY=g.y-83*s, midY=g.y-56*s;
    line([{x:g.x,y:g.y-4},{x:g.x,y:midY+10*s}],col,2.4,.55);
    ctx.save();ctx.translate(g.x,midY);ctx.scale(s,s);ctx.shadowColor=col;ctx.shadowBlur=18;ctx.fillStyle=col+'88';ctx.strokeStyle='#f6f5ff';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(22,0);ctx.lineTo(0,28);ctx.lineTo(-22,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=.55;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(8,-2);ctx.lineTo(0,5);ctx.lineTo(-8,-2);ctx.closePath();ctx.fill();ctx.restore();
    text(mark,g.x,topY,22*s,'#fff','900');
  }
  function drawTargetRing(x,z,scale=1){
    const g=project(x,z),s=clamp(g.s,.6,1.9)*scale;
    groundCircle(x,z,12,'rgba(255,88,104,.035)','#e75b71',1.6,.60);
    const a=performance.now()/900;
    for(let k=0;k<4;k++){const ang=a+k*Math.PI/2,p1=project(x+Math.cos(ang)*10,z+Math.sin(ang)*10,.1),p2=project(x+Math.cos(ang+.38)*10,z+Math.sin(ang+.38)*10,.1);line([p1,p2],'#ff9bac',2.4,.85)}
  }