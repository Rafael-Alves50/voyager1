(() => {
  'use strict';

  // Single authoritative controller for Black Hole tethers.
  // Older polish layers define visuals / relative north / bait geometry, but this
  // file owns tether creation, passing, persistence, bot movement and resolution.

  const PLAYER_PASS_RADIUS = 5.2;
  const PLAYER_TRANSFER_COOLDOWN = 0.28;
  const BOT_TAKE_DELAY = 0.24;
  const BOT_RECLAIM_DELAY = 0.52;

  function entityPosBH(role){
    if(role === state.playerRole) return state.player;
    return state.bots[role] || CENTER_POS[role] || {x:0,z:0};
  }

  function pointSegDistanceBH(p,a,b){
    const abx=b.x-a.x, abz=b.z-a.z;
    const apx=p.x-a.x, apz=p.z-a.z;
    const den=abx*abx+abz*abz || 1;
    const t=clamp((apx*abx+apz*abz)/den,0,1);
    const q={x:a.x+abx*t,z:a.z+abz*t};
    return Math.hypot(p.x-q.x,p.z-q.z);
  }

  function clockwiseRankBH(srcIdx){
    if(!state.activeBH) return srcIdx+1;
    const north=norm(state.kefka.facingFactor*45);
    const all=[0,1,2].map(idx=>{
      const p=sourcePoint(state.activeBH,idx);
      const angle=norm(Math.atan2(p.x,-p.z)*180/Math.PI);
      return {idx,delta:norm(angle-north)};
    }).sort((a,b)=>a.delta-b.delta);
    return all.findIndex(x=>x.idx===srcIdx)+1;
  }

  function chooseInitialHolderBH(intendedRoles, intendedRole, used){
    const preferred=ROLES.filter(r=>
      r!==state.playerRole &&
      r!==intendedRole &&
      !intendedRoles.has(r) &&
      !used.has(r)
    );
    const fallback=ROLES.filter(r=>
      r!==state.playerRole &&
      r!==intendedRole &&
      !used.has(r)
    );
    const last=ROLES.filter(r=>r!==state.playerRole && r!==intendedRole);
    const pool=preferred.length?preferred:(fallback.length?fallback:last);
    const chosen=pool[Math.floor(Math.random()*pool.length)];
    if(chosen) used.add(chosen);
    return chosen || intendedRole;
  }

  function currentWaveTethersBH(){
    if(!state.activeBH) return [];
    return state.activeTethers.filter(t=>t.wave===state.activeBH.wave);
  }

  prepareWave = function(block,wave,append=false){
    if(!state.activeBH || state.activeBH.block!==block) return;

    state.activeBH.wave=wave;
    state.currentWave=`${block}.${wave}`;
    waveHud.textContent=`${block}.${wave}`;

    const sources=activeSources(block,wave);
    const keys=TARGETS[block][wave];
    const intendedRoles=new Set(keys.map(keyToRole));

    if(!append){
      state.activeTethers=state.activeTethers.filter(t=>sources.includes(t.srcIdx));
    }

    const used=new Set(state.activeTethers.map(t=>t.holderRole).filter(Boolean));

    sources.forEach((srcIdx,i)=>{
      const key=keys[i];
      const intendedRole=keyToRole(key);
      let t=state.activeTethers.find(x=>x.srcIdx===srcIdx);

      if(!t){
        const holderRole=chooseInitialHolderBH(intendedRoles,intendedRole,used);
        t={
          srcIdx,
          src:sourcePoint(state.activeBH,srcIdx),
          key,
          role:intendedRole,
          intendedRole,
          holderRole,
          wave,
          passable:true,
          established:false,
          transferArmed:false,
          botTakeAt:Infinity,
          lastTransferAt:-999,
          playerCooldownUntil:0,
          firedCount:0
        };
        state.activeTethers.push(t);
      }else{
        // SAME BLACK HOLE: preserve holderRole exactly.
        t.src=sourcePoint(state.activeBH,srcIdx);
        t.key=key;
        t.role=intendedRole;
        t.intendedRole=intendedRole;
        t.wave=wave;
        t.passable=true;
        t.transferArmed=false;
        t.botTakeAt=Infinity;
      }

      if(intendedRole!==state.playerRole && t.holderRole!==intendedRole){
        moveBot(intendedRole,prePos(srcIdx,state.activeBH.rotation),70);
      }else if(intendedRole!==state.playerRole && t.holderRole===intendedRole && t.established){
        moveBot(intendedRole,baitPos(srcIdx,state.activeBH.rotation),74);
      }
    });

    for(const r of ROLES){
      if(r===state.playerRole) continue;
      const involved=state.activeTethers.some(t=>t.holderRole===r || t.intendedRole===r);
      if(!involved) moveBot(r,CENTER_POS[r],46);
    }

    const mine=state.activeTethers.find(t=>t.wave===wave && t.intendedRole===state.playerRole);
    if(mine){
      if(mine.holderRole===state.playerRole){
        msg.textContent='Seu Black Hole continua ativo: o tether permanece em você. Mantenha o bait CW.';
      }else{
        msg.textContent=state.hints
          ? `Sua vez: pegue o tether CW #${clockwiseRankBH(mine.srcIdx)} relativo ao Kefka.`
          : 'Sua vez: reconheça o Black Hole correto e roube o tether do holder atual.';
      }
    }else{
      msg.textContent=state.hints
        ? 'Não é sua vez. Os tethers existentes permanecem com seus holders até precisarem ser passados.'
        : 'Tethers ativos — use o Kefka como norte e não roube um tether que não é seu.';
    }
  };

  grabWave = function(){
    if(!state.activeBH) return;
    for(const t of currentWaveTethersBH()){
      t.passable=true;
      t.transferArmed=true;
      if(t.holderRole===t.intendedRole){
        // Persistent tether already on the right person: do NOT re-grab.
        if(t.intendedRole!==state.playerRole && t.established){
          moveBot(t.intendedRole,baitPos(t.srcIdx,state.activeBH.rotation),74);
        }
        continue;
      }

      if(t.intendedRole!==state.playerRole){
        moveBot(t.intendedRole,prePos(t.srcIdx,state.activeBH.rotation),72);
        const delay=t.holderRole===state.playerRole?BOT_RECLAIM_DELAY:BOT_TAKE_DELAY;
        t.botTakeAt=state.elapsed+delay;
      }
    }
  };

  function transferToBH(t,newHolder){
    if(!newHolder || t.holderRole===newHolder) return;
    const old=t.holderRole;
    t.holderRole=newHolder;
    t.lastTransferAt=state.elapsed;

    if(newHolder===t.intendedRole){
      t.established=true;
      if(newHolder!==state.playerRole){
        moveBot(newHolder,baitPos(t.srcIdx,state.activeBH.rotation),76);
      }
    }

    if(newHolder===state.playerRole){
      if(newHolder===t.intendedRole){
        banner.textContent='✓ TETHER GRABBED';
        msg.textContent='Tether correto. Gire clockwise e mantenha o bait.';
      }else{
        banner.textContent='⚠ WRONG TETHER';
        msg.textContent='Você roubou um tether que não é seu. O resolver correto vai tentar recuperar.';
      }
    }else if(old===state.playerRole){
      banner.textContent='TETHER PASSED';
      t.playerCooldownUntil=state.elapsed+0.45;
    }
  }

  function updatePersistentTethersBH(){
    if(!state.activeBH || !state.activeTethers.length) return;

    // Human interception: player must physically cross the live tether line.
    for(const t of state.activeTethers){
      if(!t.passable || !t.holderRole || t.holderRole===state.playerRole) continue;
      if(state.elapsed<t.playerCooldownUntil) continue;
      if(state.elapsed-t.lastTransferAt<PLAYER_TRANSFER_COOLDOWN) continue;

      const holderPos=entityPosBH(t.holderRole);
      const d=pointSegDistanceBH(state.player,t.src,holderPos);
      if(d<=PLAYER_PASS_RADIUS){
        transferToBH(t,state.playerRole);
      }
    }

    // Bot handoffs only happen when the wave's grab event arms them.
    for(const t of state.activeTethers){
      if(!t.transferArmed || !t.intendedRole || t.intendedRole===state.playerRole) continue;
      if(t.holderRole===t.intendedRole) continue;
      if(state.elapsed<(t.botTakeAt ?? Infinity)) continue;
      transferToBH(t,t.intendedRole);
      t.transferArmed=false;
      t.botTakeAt=Infinity;
    }

    // Movement authority: established bot-held tethers always stay at CW bait.
    for(const t of state.activeTethers){
      if(!t.established || !t.holderRole || t.holderRole===state.playerRole) continue;
      moveBot(t.holderRole,baitPos(t.srcIdx,state.activeBH.rotation),76);
    }
  }

  hitWave = function(block,wave){
    if(!state.activeBH || state.activeBH.block!==block) return;
    const resolving=state.activeTethers.filter(t=>t.wave===wave);

    for(const t of resolving){
      const holder=t.holderRole;
      const target=entityPosBH(holder);
      state.laserFx.push({src:{...t.src},target:{x:target.x,z:target.z},until:state.elapsed+.58});

      if(holder!==t.intendedRole){
        mistake(`Tether ${block}.${wave}: ${DISPLAY[holder]||holder} terminou com o tether de ${DISPLAY[t.intendedRole]||t.intendedRole}.`);
      }else if(t.intendedRole===state.playerRole){
        const expected=baitPos(t.srcIdx,state.activeBH.rotation);
        if(dist(state.player,expected)>18){
          mistake(`Tether ${block}.${wave}: tether correto, mas bait CW ficou fora da posição.`);
        }
      }

      t.firedCount=(t.firedCount||0)+1;
      t.lastFiredAt=state.elapsed;
      // No detach here: holder remains attached if this Black Hole continues.
    }

    const nextSources=TARGETS[block]?.[wave+1]
      ? new Set(activeSources(block,wave+1))
      : new Set();

    state.activeTethers=state.activeTethers.filter(t=>{
      if(t.wave!==wave) return true; // Set 1 overlap.
      return nextSources.has(t.srcIdx);
    });
  };

  drawTethers = function(){
    if(!state.activeBH) return;
    for(const t of state.activeTethers){
      if(!t.holderRole) continue;
      const hp=entityPosBH(t.holderRole);
      const src=project(t.src.x,t.src.z,2);
      const tar=project(hp.x,hp.z,8);
      const playerHolding=t.holderRole===state.playerRole;
      const correct=playerHolding && t.intendedRole===state.playerRole;
      const wrong=playerHolding && t.intendedRole!==state.playerRole;
      const color=wrong?'#ff6f83':correct?'#ffe084':t.established?'#dce8ff':'#b8bfd5';
      line([src,tar],color,playerHolding?4.3:2.5,.96);
      circle(src.x,src.y,4.8*src.s,'#07080c',color,1.6,.98);

      if(state.hints){
        const rank=clockwiseRankBH(t.srcIdx);
        const label=rank===1?'CW 1 · DPS':rank===2?'CW 2 · SUP':'CW 3 · ACC';
        text(label,src.x,src.y-18*src.s,9*src.s,'#e7f7ff','900');
        if(t.firedCount>0){
          text(`KEPT ×${t.firedCount}`,tar.x,tar.y-25*tar.s,8.5*tar.s,'#9dffc8','900');
        }
      }
    }
  };

  // Replace stacked update wrappers with one clean loop so old tether layers
  // cannot fight over holders or bot targets on the next frame.
  update = function(dt,now){
    updateMovement(dt,now);
    updateBots(dt);
    if(state.phase!=='running') return;

    state.elapsed=(now-state.startedAt)/1000;
    timeHud.textContent=`${Math.floor(state.elapsed/60)}:${String(Math.floor(state.elapsed%60)).padStart(2,'0')}`;

    if(state.debuffHideAt && state.elapsed>=state.debuffHideAt){
      hideDebuffs();
      state.debuffHideAt=0;
    }

    while(state.eventIndex<state.events.length && state.elapsed>=state.events[state.eventIndex].t){
      const e=state.events[state.eventIndex++];
      e.fn();
    }

    updatePersistentTethersBH();

    state.laserFx=state.laserFx.filter(x=>x.until>state.elapsed);
    state.aoes=state.aoes.filter(x=>x.until>state.elapsed);
    state.casts=state.casts.filter(x=>x.end+1.2>state.elapsed);
  };
})();
