(() => {
  'use strict';

  // Black Hole bait geometry:
  // tether sources are snapped to cardinals; once grabbed, the resolver rotates
  // clockwise past the next intercard marker instead of pointing the laser inward.
  const SOURCE_CARDINAL = {0:0, 1:90, 2:180};
  const BAIT_TURN_DEG = 54.5;   // ~9.5° past the next intercardinal (45°)
  const PRE_GRAB_RADIUS = 46;
  const BAIT_RADIUS = 80;

  const previousMakeLayout7 = makeLayout;
  makeLayout = function(setNum, rotation){
    const holes = previousMakeLayout7(setNum, rotation);
    for(const h of holes){
      if(!h.source || h.sourceIdx == null) continue;
      const radius = Math.hypot(h.x,h.z);
      const angle = norm(SOURCE_CARDINAL[h.sourceIdx] + rotation);
      const snapped = rotate({x:0,z:-radius}, angle);
      h.x = snapped.x;
      h.z = snapped.z;
      h.cardinalAngle = angle;
    }
    return holes;
  };

  prePos = function(srcIdx, rotation){
    const angle = norm(SOURCE_CARDINAL[srcIdx] + rotation);
    return rotate({x:0,z:-PRE_GRAB_RADIUS}, angle);
  };

  baitPos = function(srcIdx, rotation){
    const cardinal = norm(SOURCE_CARDINAL[srcIdx] + rotation);
    const baitAngle = norm(cardinal + BAIT_TURN_DEG);
    return rotate({x:0,z:-BAIT_RADIUS}, baitAngle);
  };

  // Optional visual confirmation with Hints ON: show the intended CW pull arc.
  function drawCWBaitGuides7(){
    if(!state.hints || !state.activeBH) return;
    for(const t of state.activeTethers){
      if(t.hit) continue;
      const bait = baitPos(t.srcIdx, state.activeBH.rotation);
      const s = project(t.src.x,t.src.z,1.5);
      const b = project(bait.x,bait.z,1.5);
      line([s,b],'rgba(255,224,132,.30)',1.7,.65);
      circle(b.x,b.y,5.5*b.s,'rgba(255,224,132,.12)','#ffe084',1.5,.85);
      text('CW BAIT',b.x,b.y-14*b.s,8.5*b.s,'#ffe084','900');
    }
  }

  const previousDraw7 = draw;
  draw = function(){
    previousDraw7();
    drawCWBaitGuides7();
  };
})();
