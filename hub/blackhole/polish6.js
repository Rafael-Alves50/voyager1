(() => {
  'use strict';

  // Slap geometry fix: all side hits and stack positions are rotated using
  // the SAME world angle used to draw Giant Kefka. This keeps every slap
  // strictly to Kefka-relative left/right instead of drifting north/south.
  const SLAP_SCALE6 = 1.75;
  const RS1_6={x:.3,z:.2}, RS2_6={x:.15,z:-.28}, RS3_6={x:-.2,z:.1};
  const add6=(a,b)=>({x:a.x+b.x,z:a.z+b.z});
  const sub6=(a,b)=>({x:a.x-b.x,z:a.z-b.z});
  const mul6=p=>({x:p.x*SLAP_SCALE6,z:p.z*SLAP_SCALE6});

  const LEFT_STACK6={
    t1:add6({x:-13,z:-13},RS1_6),t2:add6({x:-13,z:-13},RS2_6),h1:add6({x:-19,z:0},RS3_6),h2:{x:-19,z:0},
    m1:add6({x:-13,z:13},RS1_6),m2:add6({x:-13,z:13},RS2_6),r1:add6({x:-13,z:13},RS3_6),r2:{x:-13,z:13}
  };
  const RIGHT_STACK6={
    t1:add6({x:19,z:0},RS1_6),t2:add6({x:19,z:0},RS2_6),h1:add6({x:19,z:0},RS3_6),h2:{x:19,z:0},
    m1:sub6({x:19,z:0},RS1_6),m2:sub6({x:19,z:0},RS2_6),r1:sub6({x:19,z:0},RS3_6),r2:{x:19,z:0}
  };
  const ROLE_CENTERS6={TANK:{x:-13,z:-13},HEALER:{x:-19,z:0},DPS:{x:-13,z:13}};

  // IMPORTANT: Giant Kefka is drawn with +45° * facingFactor.
  // Therefore all local slap coordinates must use the same + rotation.
  function kefkaLocal6(p){
    return rotate(mul6(p), state.kefka.facingFactor * 45);
  }
  function worldAngle6(p){return norm(Math.atan2(p.x,-p.z)*180/Math.PI)}

  setSlap = function(safeSide,phase='cast'){
    state.slap={
      safe:safeSide,
      phase,
      until:state.elapsed+(phase==='cast'?4.2:.9),
      raisedArm:safeSide==='LEFT'?'RIGHT':'LEFT',
      action:safeSide==='LEFT'?'ROLES':'STACK'
    };
    state.currentMechanic='Slap Happy';
    mechHud.textContent='Slap Happy';
    if(phase!=='cast')return;

    const table=safeSide==='RIGHT'?RIGHT_STACK6:LEFT_STACK6;
    for(const r of ROLES){
      if(r===state.playerRole)continue;
      moveBot(r,kefkaLocal6(table[r]),50);
    }

    if(safeSide==='RIGHT'){
      msg.textContent='KEFKA LEFT ARM UP → RIGHT SAFE → FULL PARTY STACK';
      banner.textContent='LEFT ARM ↑ · RIGHT SAFE · FULL PARTY STACK';
    }else{
      msg.textContent='KEFKA RIGHT ARM UP → LEFT SAFE → ROLE STACKS';
      banner.textContent='RIGHT ARM ↑ · LEFT SAFE · ROLE STACKS';
    }
  };

  centerSlapHit = function(){
    if(!state.slap)return;
    state.slap.phase='center';
    state.slap.until=state.elapsed+.65;
    const table=state.slap.safe==='RIGHT'?RIGHT_STACK6:LEFT_STACK6;
    const target=kefkaLocal6(table[state.playerRole]);
    const tolerance=state.slap.safe==='RIGHT'?17:15;
    if(dist(state.player,target)>tolerance){
      mistake(state.slap.safe==='RIGHT'
        ? 'Slap Happy: faltou o FULL PARTY STACK no RIGHT SAFE relativo ao Kefka.'
        : `Slap Happy: faltou o ${roleGroup(state.playerRole)} ROLE STACK no LEFT SAFE relativo ao Kefka.`);
    }
  };

  drawSlap = function(){
    if(!state.slap)return;
    const safe=state.slap.safe;

    // User-facing rule:
    // LEFT arm raised  => RIGHT safe => danger/slaps on LEFT side.
    // RIGHT arm raised => LEFT safe  => danger/slaps on RIGHT side.
    const dangerSide = safe==='RIGHT'?'LEFT':'RIGHT';

    // Local frame is defined with Kefka as north:
    // x<0 = left of relative north, x>0 = right of relative north.
    const localX = dangerSide==='RIGHT'?25:-25;
    const localHits=[
      {x:localX,z:-25},
      {x:localX,z:0},
      {x:localX,z:25}
    ].map(kefkaLocal6);

    if(state.slap.phase.startsWith('hit')){
      const n=Math.max(0,Math.min(2,(+state.slap.phase.slice(3)||1)-1));
      const p=localHits[n];
      groundCircle(p.x,p.z,33,'rgba(200,215,255,.40)','#eef4ff',2.4,.9);
    }

    if(state.slap.phase==='center'){
      groundCircle(0,0,23,'rgba(209,188,255,.55)','#efe7ff',2,.9);
      if(safe==='RIGHT'){
        const p=kefkaLocal6({x:19,z:0});
        wedge(0,0,worldAngle6(p),40,105,'rgba(119,83,201,.58)',.72);
      }else{
        for(const c of Object.values(ROLE_CENTERS6)){
          const p=kefkaLocal6(c);
          wedge(0,0,worldAngle6(p),40,105,'rgba(119,83,201,.55)',.68);
        }
      }
    }

    const kefkaAngle=state.kefka.facingFactor*45;
    const leftLabel=kefkaLocal6({x:-47,z:0});
    const rightLabel=kefkaLocal6({x:47,z:0});
    const lq=project(leftLabel.x,leftLabel.z,2),rq=project(rightLabel.x,rightLabel.z,2);
    text('KEFKA LEFT',lq.x,lq.y-12,10,dangerSide==='LEFT'?'#ffb5b5':'#a9d8ff','900');
    text('KEFKA RIGHT',rq.x,rq.y-12,10,dangerSide==='RIGHT'?'#ffb5b5':'#a9d8ff','900');

    text(
      safe==='RIGHT'?'LEFT ARM ↑ · RIGHT SAFE · FULL PARTY STACK':'RIGHT ARM ↑ · LEFT SAFE · ROLE STACKS',
      W/2,H*.17,18,'#ffe6a0','950'
    );
  };
})();
