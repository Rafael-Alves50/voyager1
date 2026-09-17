(() => {
  'use strict';

  // Slap Happy rule is fixed:
  // RIGHT SAFE => LEFT ARM UP => PARTY STACK
  // LEFT SAFE  => RIGHT ARM UP => ROLE STACKS
  const previousSetSlap = setSlap;
  setSlap = function(safeSide, phase='cast'){
    previousSetSlap(safeSide, phase);
    if(state.slap){
      state.slap.action = safeSide === 'RIGHT' ? 'STACK' : 'ROLES';
      state.slap.raisedArm = safeSide === 'RIGHT' ? 'LEFT' : 'RIGHT';
    }
    if(phase === 'cast'){
      msg.textContent = safeSide === 'RIGHT'
        ? 'RIGHT SAFE · LEFT ARM UP · PARTY STACK (relative north = Kefka).'
        : 'LEFT SAFE · RIGHT ARM UP · ROLE STACKS (relative north = Kefka).';
    }
  };

  // Re-draw Giant Kefka with the arm/safe-side relationship made explicit.
  drawKefka = function(){
    const angle = state.kefka.facingFactor * 45;
    const outer = rotate({x:0,z:-112}, angle);
    let p = outer;
    if(state.kefka.leaping){
      const pulse=(Math.sin(state.elapsed*12)+1)/2;
      p={x:outer.x*(.25+.75*pulse),z:outer.z*(.25+.75*pulse)};
    }

    const q=project(p.x,p.z), sc=q.s*1.42;
    ellipse(q.x,q.y+13*sc,39*sc,10*sc,'rgba(0,0,0,.46)');

    const safe = state.slap?.safe || null;
    const raisedLeft = safe === 'RIGHT';
    const raisedRight = safe === 'LEFT';

    ctx.save();
    ctx.translate(q.x,q.y-15*sc);
    ctx.scale(sc,sc);

    ctx.fillStyle='#713c90';
    ctx.strokeStyle='#f1c9ff';
    ctx.lineWidth=1.6;
    ctx.beginPath();
    ctx.moveTo(0,-58);
    ctx.quadraticCurveTo(-33,-38,-36,17);
    ctx.lineTo(-27,56);ctx.lineTo(-9,64);ctx.lineTo(0,44);
    ctx.lineTo(9,64);ctx.lineTo(27,56);ctx.lineTo(36,17);
    ctx.quadraticCurveTo(33,-38,0,-58);
    ctx.closePath();ctx.fill();ctx.stroke();

    circle(0,-70,10,'#efc2ae','#fff',1);
    ctx.fillStyle='#f3d7b2';
    ctx.beginPath();
    ctx.moveTo(-8,-78);ctx.lineTo(-25,-94);ctx.lineTo(-14,-73);
    ctx.lineTo(0,-91);ctx.lineTo(14,-73);ctx.lineTo(25,-94);ctx.lineTo(8,-78);
    ctx.closePath();ctx.fill();

    function arm(side, raised){
      const dir=side==='LEFT'?-1:1;
      const sx=dir*25, sy=-35;
      const elbowX=raised?dir*48:dir*43;
      const elbowY=raised?-67:-15;
      const handX=raised?dir*59:dir*50;
      const handY=raised?-96:12;
      ctx.save();
      ctx.lineCap='round';ctx.lineJoin='round';
      if(raised){
        ctx.shadowColor='#fff36f';ctx.shadowBlur=16;
        ctx.strokeStyle='#fff36f';ctx.lineWidth=11;
      }else{
        ctx.strokeStyle='#725f81';ctx.lineWidth=7;
      }
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(elbowX,elbowY);ctx.lineTo(handX,handY);ctx.stroke();
      ctx.restore();
      circle(handX,handY,raised?8.5:6,raised?'#fff9ad':'#7c6988',raised?'#fff':'#9e8ba9',raised?2.5:1,1);
      if(raised){
        text('↑',handX,handY-23,24,'#fff36f','950');
      } else if(safe){
        text('↓',handX,handY+19,17,'#94859f','900');
      }
    }

    arm('LEFT',raisedLeft);
    arm('RIGHT',raisedRight);
    ctx.restore();

    text('GIANT KEFKA',q.x,q.y-151*sc,14*sc,'#f4dcff');
    if(safe){
      const armName = safe==='RIGHT'?'LEFT ARM UP':'RIGHT ARM UP';
      const action = safe==='RIGHT'?'RIGHT SAFE · PARTY STACK':'LEFT SAFE · ROLE STACKS';
      text(armName,q.x,q.y-126*sc,15*sc,'#fff36f','950');
      text(action,q.x,q.y-108*sc,13*sc,safe==='RIGHT'?'#a9f4ff':'#ddbaff','950');
    }
    if(state.hints){
      const h=project(outer.x*.74,outer.z*.74);
      text('REL N',h.x,h.y-20,12,'#8fe9ff','900');
    }
  };

  // Lat/Long: Waju randomly chooses which implosion resolves first.
  // LATITUDINAL = sides first. LONGITUDINAL = front/back first.
  state.latLongFirst = 'LAT';
  state.latLongImpactUntil = 0;

  startLatLong = function(){
    state.latLongFirst = Math.random() < .5 ? 'LAT' : 'LONG';
    state.currentMechanic = state.latLongFirst === 'LAT' ? 'Latitudinal Implosion' : 'Longitudinal Implosion';
    mechHud.textContent = state.latLongFirst === 'LAT' ? 'LATITUDINAL' : 'LONGITUDINAL';
    state.chaos.facing = norm(state.kefka.facingFactor*45 + 45);
    const label = state.latLongFirst === 'LAT' ? 'Latitudinal Implosion' : 'Longitudinal Implosion';
    state.casts.push({type:'latlong',label,start:state.elapsed,end:state.elapsed+5.4});
    msg.textContent = state.latLongFirst === 'LAT'
      ? 'CHAOS: LATITUDINAL IMPLOSION — sides explode first.'
      : 'CHAOS: LONGITUDINAL IMPLOSION — front/back explode first.';
    banner.textContent = state.latLongFirst === 'LAT'
      ? 'CHAOS · LATITUDINAL IMPLOSION'
      : 'CHAOS · LONGITUDINAL IMPLOSION';
  };

  latLongHit = function(){
    state.latLongImpactUntil = state.elapsed + .85;
  };

  function lastLatLongCast(){
    for(let i=state.casts.length-1;i>=0;i--){
      if(state.casts[i].type==='latlong') return state.casts[i];
    }
    return null;
  }

  function drawArrowHead4(a,b,color){
    const dx=b.x-a.x,dy=b.y-a.y,m=Math.hypot(dx,dy)||1,ux=dx/m,uy=dy/m,px=-uy,py=ux;
    poly([b,{x:b.x-ux*16+px*8,y:b.y-uy*16+py*8},{x:b.x-ux*16-px*8,y:b.y-uy*16-py*8}],color,null,0,.98);
  }

  function drawChaosLatLong(){
    const c=lastLatLongCast();
    if(!c) return;
    const active = state.elapsed <= c.end + 1.1 || state.elapsed < state.latLongImpactUntil;
    if(!active) return;

    const cx=state.chaos.x||0, cz=state.chaos.z||0;
    const impact = state.elapsed < state.latLongImpactUntil;
    const fill = impact ? 'rgba(187,104,255,.58)' : 'rgba(177,105,244,.23)';
    const alpha = impact ? .92 : .58;
    const half=63.75, radius=118;
    const f=state.chaos.facing||0;

    if(state.latLongFirst==='LAT'){
      wedge(cx,cz,f+90,half,radius,fill,alpha);
      wedge(cx,cz,f-90,half,radius,fill,alpha);
    }else{
      wedge(cx,cz,f,half,radius,fill,alpha);
      wedge(cx,cz,f+180,half,radius,fill,alpha);
    }

    // Strong Chaos hitbox / facing reference.
    groundCircle(cx,cz,14,'rgba(255,255,255,.055)',impact?'#fff1ff':'#d5b5ff',impact?4:3,.98);
    groundCircle(cx,cz,5,'rgba(223,190,255,.22)','#ffffff',2,.95);
    const frontVec=rotate({x:0,z:-25},f);
    const a=project(cx,cz,7), b=project(cx+frontVec.x,cz+frontVec.z,7);
    line([a,b],'#f4c7ff',4,.95);drawArrowHead4(a,b,'#f4c7ff');
    text('CHAOS HITBOX',a.x,a.y-28,11,'#f5ddff','950');
    text('FRONT',b.x,b.y-14,11,'#ffd6ff','900');

    const title=state.latLongFirst==='LAT'?'LATITUDINAL · SIDES FIRST':'LONGITUDINAL · FRONT/BACK FIRST';
    text(title,W/2,H*.225,20,'#f0c7ff','950');
  }

  const previousDraw = draw;
  draw = function(){
    previousDraw();
    drawChaosLatLong();
  };
})();
