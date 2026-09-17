(() => {
  'use strict';

  const SLAP_SCALE = 1.75;
  const RS1={x:.3,z:.2}, RS2={x:.15,z:-.28}, RS3={x:-.2,z:.1};
  const add=(a,b)=>({x:a.x+b.x,z:a.z+b.z});
  const sub=(a,b)=>({x:a.x-b.x,z:a.z-b.z});
  const mul=p=>({x:p.x*SLAP_SCALE,z:p.z*SLAP_SCALE});
  const LEFT_POS={
    t1:add({x:-13,z:-13},RS1),t2:add({x:-13,z:-13},RS2),h1:add({x:-19,z:0},RS3),h2:{x:-19,z:0},
    m1:add({x:-13,z:13},RS1),m2:add({x:-13,z:13},RS2),r1:add({x:-13,z:13},RS3),r2:{x:-13,z:13}
  };
  const RIGHT_POS={
    t1:add({x:19,z:0},RS1),t2:add({x:19,z:0},RS2),h1:add({x:19,z:0},RS3),h2:{x:19,z:0},
    m1:sub({x:19,z:0},RS1),m2:sub({x:19,z:0},RS2),r1:sub({x:19,z:0},RS3),r2:{x:19,z:0}
  };
  const ROLE_CENTERS={TANK:{x:-13,z:-13},HEALER:{x:-19,z:0},DPS:{x:-13,z:13}};

  function relRot(p){return rotate(mul(p), state.kefka.facingFactor * -45)}
  function angleOf(p){return norm(Math.atan2(p.x,-p.z)*180/Math.PI)}

  setSlap = function(safeSide,phase='cast'){
    state.slap={safe:safeSide,phase,until:state.elapsed+(phase==='cast'?4.2:.9)};
    state.currentMechanic='Slap Happy';
    mechHud.textContent='Slap Happy';
    if(phase!=='cast') return;
    const table=safeSide==='RIGHT'?RIGHT_POS:LEFT_POS;
    for(const r of ROLES){
      if(r===state.playerRole) continue;
      moveBot(r,relRot(table[r]),50);
    }
    if(safeSide==='RIGHT') msg.textContent='RIGHT SAFE · party stack, relativo ao norte do Kefka.';
    else msg.textContent='LEFT SAFE · role stacks, relativo ao norte do Kefka.';
  };

  centerSlapHit = function(){
    if(!state.slap)return;
    state.slap.phase='center';
    state.slap.until=state.elapsed+.65;
    const table=state.slap.safe==='RIGHT'?RIGHT_POS:LEFT_POS;
    const target=relRot(table[state.playerRole]);
    const tolerance=state.slap.safe==='RIGHT'?17:15;
    if(dist(state.player,target)>tolerance){
      mistake(state.slap.safe==='RIGHT'?'Slap Happy: faltou o party stack no RIGHT SAFE relativo ao Kefka.':`Slap Happy: faltou o ${roleGroup(state.playerRole)} role stack no LEFT SAFE relativo ao Kefka.`);
    }
  };

  drawSlap=function(){
    if(!state.slap)return;
    const safe=state.slap.safe;
    const dangerSide=safe==='RIGHT'?'LEFT':'RIGHT';
    const baseXs=dangerSide==='RIGHT'?25:-25;
    const sideAoEs=[{x:baseXs,z:-25},{x:baseXs,z:0},{x:baseXs,z:25}].map(relRot);
    if(state.slap.phase.startsWith('hit')){
      const n=Math.max(0,Math.min(2,(+state.slap.phase.slice(3)||1)-1));
      groundCircle(sideAoEs[n].x,sideAoEs[n].z,33,'rgba(200,215,255,.38)','#dce6ff',2,.85);
    }
    if(state.slap.phase==='center'){
      groundCircle(0,0,23,'rgba(209,188,255,.55)','#efe7ff',2,.9);
      if(safe==='RIGHT'){
        const p=relRot({x:19,z:0});
        wedge(0,0,angleOf(p),40,105,'rgba(119,83,201,.58)',.72);
      }else{
        for(const c of Object.values(ROLE_CENTERS)){
          const p=relRot(c);
          wedge(0,0,angleOf(p),40,105,'rgba(119,83,201,.55)',.68);
        }
      }
    }
    text(safe==='RIGHT'?'RIGHT SAFE · PARTY STACK':'LEFT SAFE · ROLE STACKS',W/2,H*.17,18,'#ffe6a0');
  };

  function drawWaymark(label,deg){
    const p=rotate({x:0,z:-86},deg),q=project(p.x,p.z),s=q.s;
    ctx.save();ctx.translate(q.x,q.y);ctx.scale(s,s);
    const letter=/[ABCD]/.test(label);
    ctx.fillStyle=letter?'rgba(193,64,82,.92)':'rgba(65,111,205,.94)';
    ctx.strokeStyle='rgba(242,247,255,.95)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(13,-6);ctx.lineTo(13,16);ctx.lineTo(0,22);ctx.lineTo(-13,16);ctx.lineTo(-13,-6);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
    text(label,q.x,q.y+1*s,15*s,'#fff','900');
  }
  function drawWaymarks(){
    const wm=[['A',0],['2',45],['B',90],['3',135],['C',180],['4',225],['D',270],['1',315]];
    for(const [l,d] of wm)drawWaymark(l,d);
  }
  function drawRelativeNorth(){
    const angle=state.kefka.facingFactor*45;
    const end=rotate({x:0,z:-72},angle),mid=rotate({x:0,z:-58},angle),q0=project(0,0,2),q1=project(end.x,end.z,2),qm=project(mid.x,mid.z,3);
    line([q0,q1],'rgba(120,233,255,.45)',2,.7);
    text('REL N',qm.x,qm.y-12,11,'#8fe9ff','900');
  }
  const oldFloor=drawFloor;
  drawFloor=function(){oldFloor();drawWaymarks();drawRelativeNorth()};

  function drawArrowHead(a,b,color){
    const dx=b.x-a.x,dy=b.y-a.y,m=Math.hypot(dx,dy)||1,ux=dx/m,uy=dy/m,px=-uy,py=ux;
    const p1={x:b.x-ux*18+px*9,y:b.y-uy*18+py*9},p2={x:b.x-ux*18-px*9,y:b.y-uy*18-py*9};
    poly([b,p1,p2],color,null,0,.95);
  }
  function edictActive(){
    if(/Damning|Edict/i.test(state.currentMechanic||''))return true;
    const c=state.casts?.[state.casts.length-1];
    return !!(c&&c.type==='edict'&&state.elapsed<c.hitAt+1.1);
  }
  function drawChaosFacing(){
    if(!edictActive())return;
    const c={x:state.chaos.x||0,z:state.chaos.z||0};
    const f=rotate({x:0,z:-34},state.chaos.facing||0),b=rotate({x:0,z:28},state.chaos.facing||0);
    const start=project(c.x,c.z,10),front=project(c.x+f.x,c.z+f.z,10),back=project(c.x+b.x,c.z+b.z,5);
    line([start,front],'#ff765e',6,.95);drawArrowHead(start,front,'#ff765e');
    text('FRONT',front.x,front.y-17,13,'#ffb09f','900');
    groundCircle(c.x+b.x,c.z+b.z,10,'rgba(102,217,159,.12)','#62d99f',2,.8);
    text('BEHIND',back.x,back.y-16,12,'#9dffc8','900');
  }
  const oldDraw=draw;
  draw=function(){oldDraw();drawChaosFacing()};
})();
