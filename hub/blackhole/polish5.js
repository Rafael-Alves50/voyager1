(() => {
  'use strict';

  // Fixed Slap Happy mapping, stated in boss-arm terms:
  // Kefka RIGHT arm up  => LEFT safe  => ROLE STACKS
  // Kefka LEFT arm up   => RIGHT safe => FULL PARTY STACK
  const priorSetSlap5 = setSlap;
  setSlap = function(safeSide, phase='cast'){
    priorSetSlap5(safeSide, phase);
    if (!state.slap) return;
    state.slap.safe = safeSide;
    state.slap.raisedArm = safeSide === 'LEFT' ? 'RIGHT' : 'LEFT';
    state.slap.action = safeSide === 'LEFT' ? 'ROLES' : 'STACK';
    if (phase === 'cast') {
      msg.textContent = safeSide === 'LEFT'
        ? "KEFKA RIGHT ARM UP → LEFT SAFE → ROLE STACKS"
        : "KEFKA LEFT ARM UP → RIGHT SAFE → FULL PARTY STACK";
      banner.textContent = safeSide === 'LEFT'
        ? 'RIGHT ARM ↑ · LEFT SAFE · ROLE STACKS'
        : 'LEFT ARM ↑ · RIGHT SAFE · FULL PARTY STACK';
    }
  };

  // --- Black Hole relative-north ordering ---------------------------------
  // Kefka is always the relative north. Going clockwise from Kefka:
  // #1 DPS, #2 non-Accretion support, #3 Accretion.
  function worldAngle(p){ return norm(Math.atan2(p.x, -p.z) * 180 / Math.PI); }
  function clockwiseSourceOrder(active=[0,1,2]){
    if (!state.activeBH) return [...active];
    const relNorth = norm(state.kefka.facingFactor * 45);
    return [...active].sort((a,b) => {
      const pa = sourcePoint(state.activeBH, a), pb = sourcePoint(state.activeBH, b);
      const da = norm(worldAngle(pa) - relNorth), db = norm(worldAngle(pb) - relNorth);
      return da - db;
    });
  }

  sourceOrder = function(_kefkaFactor, _rotation, active){
    return clockwiseSourceOrder(active);
  };

  activeSources = function(block, wave){
    const cw = clockwiseSourceOrder([0,1,2]);
    if (block === 1) return wave === 1 ? [cw[0]] : [cw[1], cw[2]];
    if (block === 4) return wave === 1 ? [cw[0], cw[1]] : [cw[2]];
    return cw;
  };

  // --- Passable / stealable tether model ----------------------------------
  // Waju spawns BH tethers on a random party member and marks them passable.
  // Here we mimic that behavior with a wrong bot as the initial holder.
  const PASS_RADIUS = 5.2;
  const TRANSFER_COOLDOWN = 0.22;

  function entityPos(role){
    if (role === state.playerRole) return state.player;
    return state.bots[role] || CENTER_POS[role] || {x:0,z:0};
  }

  function pointSegDistance(p,a,b){
    const abx=b.x-a.x, abz=b.z-a.z, apx=p.x-a.x, apz=p.z-a.z;
    const den=abx*abx+abz*abz || 1;
    const t=clamp((apx*abx+apz*abz)/den,0,1);
    const q={x:a.x+abx*t,z:a.z+abz*t};
    return Math.hypot(p.x-q.x,p.z-q.z);
  }

  function pickWrongBot(intended, used){
    const candidates=ROLES.filter(r=>r!==state.playerRole && r!==intended && !used.has(r));
    const fallback=ROLES.filter(r=>r!==state.playerRole && r!==intended);
    const pool=candidates.length?candidates:fallback;
    const chosen=pool[Math.floor(Math.random()*pool.length)];
    if(chosen)used.add(chosen);
    return chosen;
  }

  prepareWave = function(block,wave,append=false){
    if(!state.activeBH || state.activeBH.block!==block) return;
    state.activeBH.wave=wave;
    state.currentWave=`${block}.${wave}`;
    waveHud.textContent=`${block}.${wave}`;

    const sources=activeSources(block,wave);
    const keys=TARGETS[block][wave];
    if(!append) state.activeTethers=[];
    const usedDecoys=new Set(state.activeTethers.map(t=>t.holderRole).filter(Boolean));

    sources.forEach((srcIdx,i)=>{
      const key=keys[i];
      const intendedRole=keyToRole(key);
      const src=sourcePoint(state.activeBH,srcIdx);
      const holderRole=pickWrongBot(intendedRole,usedDecoys);
      const tether={
        srcIdx,src,key,role:intendedRole,intendedRole,holderRole,wave,
        grabbed:false,hit:false,passable:true,lastTransfer:-999
      };
      state.activeTethers.push(tether);

      if(intendedRole!==state.playerRole){
        moveBot(intendedRole,prePos(srcIdx,state.activeBH.rotation),62);
      }
    });

    // Non-participating bots stay around center. Initial tether holders stay there
    // so the tether visibly starts on the wrong person and must be intercepted.
    for(const r of ROLES){
      if(r===state.playerRole) continue;
      const intended=state.activeTethers.some(t=>t.intendedRole===r);
      if(!intended) moveBot(r,CENTER_POS[r],46);
    }

    const mine=state.activeTethers.find(t=>t.intendedRole===state.playerRole && t.wave===wave);
    if(state.hints){
      if(mine){
        const rank=clockwiseSourceOrder([0,1,2]).indexOf(mine.srcIdx)+1;
        msg.textContent=`Sua vez: roube o tether CW #${rank} relativo ao Kefka e leve para o bait.`;
      }else{
        msg.textContent='Não é sua vez: não roube nenhum tether desta wave.';
      }
    }else{
      msg.textContent='Tethers ativos — use o Kefka como norte, reconheça se esta wave é sua e roube o tether correto.';
    }
  };

  grabWave = function(){
    // The tether is already passable; this event mainly pushes the intended bots
    // through their tether lines. The player must do the same manually.
    for(const t of state.activeTethers){
      t.passable=true;
      if(t.intendedRole!==state.playerRole && t.intendedRole){
        moveBot(t.intendedRole,prePos(t.srcIdx,state.activeBH.rotation),68);
      }
    }
  };

  function transferTethers(){
    if(!state.activeBH || !state.activeTethers.length) return;

    for(const t of state.activeTethers){
      if(t.hit || !t.passable || !t.holderRole) continue;
      const holderPos=entityPos(t.holderRole);
      const candidates=[];

      // Only the intended resolver and the human player can actively intercept.
      // This lets the user steal a wrong tether too, without random bot chaos.
      if(t.intendedRole && t.intendedRole!==t.holderRole) candidates.push(t.intendedRole);
      if(state.playerRole!==t.holderRole && !candidates.includes(state.playerRole)) candidates.push(state.playerRole);

      let best=null;
      for(const role of candidates){
        const p=entityPos(role);
        const d=pointSegDistance(p,t.src,holderPos);
        if(d<=PASS_RADIUS && (!best || d<best.d)) best={role,d};
      }

      if(best && state.elapsed-t.lastTransfer>=TRANSFER_COOLDOWN){
        const previous=t.holderRole;
        t.holderRole=best.role;
        t.grabbed=t.holderRole===t.intendedRole;
        t.lastTransfer=state.elapsed;

        if(t.holderRole===state.playerRole){
          const correct=t.intendedRole===state.playerRole;
          banner.textContent=correct?'✓ TETHER GRABBED':'⚠ WRONG TETHER STOLEN';
          msg.textContent=correct
            ? 'Você roubou o seu tether. Agora puxe para o bait CW.'
            : 'Esse tether não era seu. Saia da linha para o bot correto conseguir roubar de volta.';
        }

        if(t.holderRole===t.intendedRole && t.intendedRole!==state.playerRole){
          moveBot(t.intendedRole,baitPos(t.srcIdx,state.activeBH.rotation),62);
        }

        // If a bot recovered a tether from the player, give immediate visual feedback.
        if(previous===state.playerRole && t.holderRole!==state.playerRole){
          banner.textContent='TETHER PASSED';
        }
      }
    }
  }

  hitWave = function(block,wave){
    if(!state.activeBH || state.activeBH.block!==block) return;
    const resolving=state.activeTethers.filter(t=>t.wave===wave);

    for(const t of resolving){
      const holder=t.holderRole || t.intendedRole;
      const target=entityPos(holder);
      state.laserFx.push({src:{...t.src},target:{x:target.x,z:target.z},until:state.elapsed+.58});

      if(holder!==t.intendedRole){
        mistake(`Tether ${block}.${wave}: ${DISPLAY[holder]||holder} terminou segurando o tether de ${DISPLAY[t.intendedRole]||t.intendedRole}.`);
      }else if(t.intendedRole===state.playerRole){
        const expected=baitPos(t.srcIdx,state.activeBH.rotation);
        if(dist(state.player,expected)>18){
          mistake(`Tether ${block}.${wave}: tether correto, mas bait CW ficou fora da posição.`);
        }
      }
      t.hit=true;
    }

    state.activeTethers=state.activeTethers.filter(t=>t.wave!==wave);
  };

  drawTethers = function(){
    if(!state.activeBH) return;
    const cw=clockwiseSourceOrder([0,1,2]);

    for(const t of state.activeTethers){
      if(t.hit || !t.holderRole) continue;
      const hp=entityPos(t.holderRole);
      const src=project(t.src.x,t.src.z,2);
      const tar=project(hp.x,hp.z,8);
      const playerHolding=t.holderRole===state.playerRole;
      const correctPlayer=playerHolding && t.intendedRole===state.playerRole;
      const wrongPlayer=playerHolding && t.intendedRole!==state.playerRole;
      const color=wrongPlayer?'#ff6f83':correctPlayer?'#ffe084':'#d9ddff';
      line([src,tar],color,playerHolding?4.2:2.4,.94);
      circle(src.x,src.y,4.5*src.s,'#08090d',color,1.5,.98);

      if(state.hints){
        const rank=cw.indexOf(t.srcIdx)+1;
        const label=rank===1?'1 · DPS':rank===2?'2 · SUP':'3 · ACC';
        text(label,src.x,src.y-17*src.s,9*src.s,rank===1?'#ffb3b9':rank===2?'#a9d2ff':'#e6b7ff','900');
      }
    }
  };

  // Make the boss-arm rule impossible to misread, regardless of sprite orientation.
  const priorDrawHUD5=drawHUDOverlay;
  drawHUDOverlay=function(){
    priorDrawHUD5();
    if(state.slap){
      const rightArmUp=state.slap.safe==='LEFT';
      const top=86;
      text(
        rightArmUp
          ? "KEFKA'S RIGHT ARM ↑  →  LEFT SAFE  →  ROLE STACKS"
          : "KEFKA'S LEFT ARM ↑  →  RIGHT SAFE  →  FULL PARTY STACK",
        W/2,top,16,'#fff3a0','950'
      );
    }
    if(state.activeBH){
      const north=state.kefka.facingFactor*45;
      const p=rotate({x:0,z:-78},north),q=project(p.x,p.z,3);
      text('KEFKA = RELATIVE NORTH',q.x,q.y-22,11,'#8fe9ff','950');
      if(state.hints){
        text('CW #1 DPS   ·   CW #2 SUP   ·   CW #3 ACC',W/2,70,12,'#dffaff','900');
      }
    }
  };

  const priorUpdate5=update;
  update=function(dt,now){
    priorUpdate5(dt,now);
    if(state.phase==='running') transferTethers();
  };
})();
