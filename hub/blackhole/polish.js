(() => {
  'use strict';

  state.goOutUntil = 0;
  state.goOutLabel = '';
  const originalClearBH = clearBH;
  clearBH = function(){
    const block = state.activeBH?.block || '';
    originalClearBH();
    state.goOutUntil = state.elapsed + 2.1;
    state.goOutLabel = block ? `BLACK HOLE ${block} — GO OUT` : 'BLACK HOLE — GO OUT';
    state.currentMechanic = 'Black Hole — Go Out';
    mechHud.textContent = 'BH OUT';
    waveHud.textContent = 'NEXT';
  };

  drawCharacter = function(role,p,isPlayer=false){
    const q=project(p.x,p.z), s=q.s;
    ellipse(q.x,q.y+9*s,13*s,4*s,'rgba(0,0,0,.45)');
    ctx.save();
    ctx.translate(q.x,q.y-11*s);
    ctx.scale(s,s);
    ctx.fillStyle=isPlayer?'#eee9df':'#8196dc';
    ctx.strokeStyle=isPlayer?'#bfa8ff':'#d3dcff';
    ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(0,-20);
    ctx.quadraticCurveTo(-11,-8,-10,16);
    ctx.lineTo(-5,24); ctx.lineTo(0,18); ctx.lineTo(5,24); ctx.lineTo(10,16);
    ctx.quadraticCurveTo(11,-8,0,-20);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    circle(0,-26,5,isPlayer?'#ddb89c':'#c8b5a8');
    ctx.restore();
    text(DISPLAY[role],q.x,q.y-46*s,10*s,isPlayer?'#a9ffc9':'#cbd7ff');
    if(isPlayer){
      ctx.save();
      ctx.fillStyle='#8fffc1';
      ctx.beginPath();
      ctx.moveTo(q.x,q.y-58*s);
      ctx.lineTo(q.x-5*s,q.y-67*s);
      ctx.lineTo(q.x+5*s,q.y-67*s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  drawKefka = function(){
    const angle=state.kefka.facingFactor*45;
    const outer=rotate({x:0,z:-112},angle);
    let p=outer;
    if(state.kefka.leaping){
      const pulse=(Math.sin(state.elapsed*12)+1)/2;
      p={x:outer.x*(.25+.75*pulse),z:outer.z*(.25+.75*pulse)};
    }

    const q=project(p.x,p.z), sc=q.s*1.42;
    ellipse(q.x,q.y+13*sc,39*sc,10*sc,'rgba(0,0,0,.46)');

    const handState = state.slap ? state.slap.safe : null;
    const raisedLeft = handState==='LEFT';
    const raisedRight = handState==='RIGHT';

    ctx.save();
    ctx.translate(q.x,q.y-15*sc);
    ctx.scale(sc,sc);

    ctx.fillStyle='#713c90';
    ctx.strokeStyle='#f1c9ff';
    ctx.lineWidth=1.6;
    ctx.beginPath();
    ctx.moveTo(0,-58);
    ctx.quadraticCurveTo(-33,-38,-36,17);
    ctx.lineTo(-27,56); ctx.lineTo(-9,64); ctx.lineTo(0,44);
    ctx.lineTo(9,64); ctx.lineTo(27,56); ctx.lineTo(36,17);
    ctx.quadraticCurveTo(33,-38,0,-58);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    circle(0,-70,10,'#efc2ae','#fff',1);
    ctx.fillStyle='#f3d7b2';
    ctx.beginPath();
    ctx.moveTo(-8,-78);ctx.lineTo(-25,-94);ctx.lineTo(-14,-73);
    ctx.lineTo(0,-91);ctx.lineTo(14,-73);ctx.lineTo(25,-94);ctx.lineTo(8,-78);
    ctx.closePath();ctx.fill();

    function arm(side,raised){
      const dir=side==='LEFT'?-1:1;
      const sx=dir*25, sy=-35;
      const elbowX=raised?dir*48:dir*44;
      const elbowY=raised?-64:-17;
      const handX=raised?dir*58:dir*52;
      const handY=raised?-91:8;

      ctx.save();
      if(raised){
        ctx.shadowColor='#fff06a';ctx.shadowBlur=13;
        ctx.strokeStyle='#fff06a';ctx.lineWidth=10;
      }else{
        ctx.strokeStyle='#7d698c';ctx.lineWidth=7;
      }
      ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(elbowX,elbowY);ctx.lineTo(handX,handY);ctx.stroke();
      ctx.restore();

      circle(handX,handY,raised?8:6,raised?'#fff7a6':'#806d8c',raised?'#ffffff':'#a594b2',raised?2.5:1.2,1);

      if(raised){
        ctx.save();
        ctx.strokeStyle='#fff06a';ctx.lineWidth=4;ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(handX-9,handY-10);ctx.lineTo(handX,handY-23);ctx.lineTo(handX+9,handY-10);ctx.stroke();
        ctx.restore();
      } else if(handState){
        ctx.save();ctx.strokeStyle='rgba(210,190,220,.72)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(handX-6,handY+8);ctx.lineTo(handX,handY+17);ctx.lineTo(handX+6,handY+8);ctx.stroke();ctx.restore();
      }
    }

    arm('LEFT',raisedLeft);
    arm('RIGHT',raisedRight);
    ctx.restore();

    text('GIANT KEFKA',q.x,q.y-148*sc,14*sc,'#f4dcff');

    if(handState){
      const raisedLabel = `${handState} HAND UP`;
      const action = handState==='RIGHT'?'PARTY STACK':'ROLE STACKS';
      text(`↑ ${raisedLabel} ↑`,q.x,q.y-122*sc,15*sc,'#fff18a','900');
      text(action,q.x,q.y-105*sc,12*sc,handState==='RIGHT'?'#a8f5ff':'#d9b8ff','900');

      const ly=112;
      text(raisedLeft?'↑ LEFT UP':'↓ LEFT DOWN',170,ly,17,raisedLeft?'#fff18a':'#91879b','900');
      text(raisedRight?'RIGHT UP ↑':'RIGHT DOWN ↓',W-170,ly,17,raisedRight?'#fff18a':'#91879b','900');
    }

    if(state.hints){const h=project(outer.x*.74,outer.z*.74);text('REL N',h.x,h.y-20,12,'#8fe9ff')}
  };

  const originalDrawHUDOverlay = drawHUDOverlay;
  drawHUDOverlay = function(){
    originalDrawHUDOverlay();
    if(state.goOutUntil && state.elapsed < state.goOutUntil){
      const pulse=.78+.22*Math.sin(performance.now()/95);
      ctx.save();
      ctx.globalAlpha=.92;
      ctx.fillStyle='rgba(8,12,20,.86)';
      ctx.strokeStyle=`rgba(155,232,255,${pulse})`;
      ctx.lineWidth=3;
      const bw=430,bh=86,bx=W/2-bw/2,by=H*.25;
      ctx.beginPath();ctx.roundRect(bx,by,bw,bh,18);ctx.fill();ctx.stroke();
      ctx.restore();
      text(state.goOutLabel||'BLACK HOLE — GO OUT',W/2,by+31,25,'#dffcff','900');
      text('NEXT SET INCOMING',W/2,by+60,13,'#ffe59d','900');
      text('⇦',bx+35,by+43,30,'#9be8ff','900');
      text('⇨',bx+bw-35,by+43,30,'#9be8ff','900');
    }
  };
})();
