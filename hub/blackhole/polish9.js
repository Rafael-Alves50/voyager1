(() => {
  'use strict';

  // Persistent Black Hole tethers.
  // A tether belongs to the Black Hole (source), not to an individual wave.
  // If that same BH survives into the next resolve, the tether stays on its
  // current holder. Only the intended resolver changes; if needed, the new
  // resolver must steal/pass the already-existing tether.

  const BOT_GRAB_DELAY9 = 0.62;
  const BOT_RECOVER_DELAY9 = 0.42;

  function entityPos9(role){
    if(role===state.playerRole) return state.player;
    return state.bots[role] || CENTER_POS[role] || {x:0,z:0};
  }

  function chooseDecoy9(intended, used){
    const candidates=ROLES.filter(r=>r!==state.playerRole && r!==intended && !used.has(r));
    const fallback=ROLES.filter(r=>r!==state.playerRole && r!==intended);
    const pool=candidates.length?candidates:fallback;
    const chosen=pool[Math.floor(Math.random()*pool.length)];
    if(chosen) used.add(chosen);
    return chosen;
  }

  function sourceSurvives9(block,wave,srcIdx){
    if(!TARGETS[block] || !TARGETS[block][wave+1]) return false;
    return activeSources(block,wave+1).includes(srcIdx);
  }

  prepareWave = function(block,wave,append=false){
    if(!state.activeBH || state.activeBH.block!==block) return;

    state.activeBH.wave=wave;
    state.currentWave=`${block}.${wave}`;
    waveHud.textContent=`${block}.${wave}`;

    const sources=activeSources(block,wave);
    const keys=TARGETS[block][wave];

    // Normal wave transitions only retire BH tethers whose source is no longer
    // present. append=true is used when the next BHs appear before the prior one fires.
    if(!append){
      state.activeTethers=state.activeTethers.filter(t=>sources.includes(t.srcIdx));
    }

    const usedDecoys=new Set(state.activeTethers.map(t=>t.holderRole).filter(Boolean));

    sources.forEach((srcIdx,i)=>{
      const key=keys[i];
      const intendedRole=keyToRole(key);
      let t=state.activeTethers.find(x=>x.srcIdx===srcIdx);

      if(t){
        // IMPORTANT: preserve holderRole. The line never disappears just because
        // the BH fired. If the next resolver is different, they inherit a live
        // tether that must be passed/robbed from the previous holder.
        const previousIntended=t.intendedRole;
        t.key=key;
        t.role=intendedRole;
        t.intendedRole=intendedRole;
        t.wave=wave;
        t.hit=false;
        t.passable=true;
        t.grabbed=t.holderRole===intendedRole;
        t._botTimingInit=true;
        t.autoGrabAt=state.elapsed+BOT_GRAB_DELAY9;
        t.recoverAt=state.elapsed+BOT_RECOVER_DELAY9;
        t.persistedFromPreviousWave=true;

        if(intendedRole!==state.playerRole){
          if(t.holderRole===intendedRole){
            // Same resolver keeps the tether: stay at / return to the CW bait.
            moveBot(intendedRole,baitPos(srcIdx,state.activeBH.rotation),72);
          }else{
            // Resolver changed: approach the live tether and take it from the
            // previous holder. polish8 then carries the bot to the CW bait.
            moveBot(intendedRole,prePos(srcIdx,state.activeBH.rotation),70);
          }
        }

        if(previousIntended===intendedRole && t.holderRole===intendedRole){
          t.keptSameHolder=true;
        }else{
          t.keptSameHolder=false;
        }
      }else{
        // Brand-new BH/source: only here do we spawn a tether on a wrong bot.
        const src=sourcePoint(state.activeBH,srcIdx);
        const holderRole=chooseDecoy9(intendedRole,usedDecoys);
        t={
          srcIdx,src,key,role:intendedRole,intendedRole,holderRole,wave,
          grabbed:false,hit:false,passable:true,lastTransfer:-999,
          _botTimingInit:true,
          autoGrabAt:state.elapsed+BOT_GRAB_DELAY9,
          recoverAt:state.elapsed+BOT_RECOVER_DELAY9,
          persistedFromPreviousWave:false,
          keptSameHolder:false
        };
        state.activeTethers.push(t);
        if(intendedRole!==state.playerRole){
          moveBot(intendedRole,prePos(srcIdx,state.activeBH.rotation),70);
        }
      }
    });

    // Bots that are neither current resolvers nor current holders can return center.
    for(const r of ROLES){
      if(r===state.playerRole) continue;
      const involved=state.activeTethers.some(t=>t.intendedRole===r || t.holderRole===r);
      if(!involved) moveBot(r,CENTER_POS[r],46);
    }

    const mine=state.activeTethers.find(t=>t.intendedRole===state.playerRole && t.wave===wave);
    if(state.hints){
      if(mine){
        if(mine.holderRole===state.playerRole){
          msg.textContent='Seu Black Hole continua ativo: o tether permanece em você. Só mantenha o bait CW.';
        }else{
          msg.textContent='Sua vez: o tether já existe. Roube-o do holder atual e leve para o bait CW.';
        }
      }else{
        msg.textContent='Não é sua vez: deixe os tethers existentes com seus holders/resolvers.';
      }
    }else{
      msg.textContent='Tethers persistem enquanto o mesmo Black Hole permanecer ativo.';
    }
  };

  grabWave = function(){
    if(!state.activeBH) return;
    for(const t of state.activeTethers){
      if(t.wave!==state.activeBH.wave) continue;
      t.passable=true;
      if(t.intendedRole===state.playerRole) continue;

      if(t.holderRole===t.intendedRole){
        // Same bot still owns the same BH tether; no re-grab animation.
        moveBot(t.intendedRole,baitPos(t.srcIdx,state.activeBH.rotation),72);
      }else{
        // Different resolver this wave: move in to steal/pass the persistent tether.
        t.autoGrabAt=Math.min(t.autoGrabAt ?? Infinity,state.elapsed+BOT_GRAB_DELAY9);
        moveBot(t.intendedRole,prePos(t.srcIdx,state.activeBH.rotation),70);
      }
    }
  };

  hitWave = function(block,wave){
    if(!state.activeBH || state.activeBH.block!==block) return;
    const resolving=state.activeTethers.filter(t=>t.wave===wave);

    for(const t of resolving){
      const holder=t.holderRole || t.intendedRole;
      const target=entityPos9(holder);
      state.laserFx.push({src:{...t.src},target:{x:target.x,z:target.z},until:state.elapsed+.58});

      if(holder!==t.intendedRole){
        mistake(`Tether ${block}.${wave}: ${DISPLAY[holder]||holder} terminou segurando o tether de ${DISPLAY[t.intendedRole]||t.intendedRole}.`);
      }else if(t.intendedRole===state.playerRole){
        const expected=baitPos(t.srcIdx,state.activeBH.rotation);
        if(dist(state.player,expected)>18){
          mistake(`Tether ${block}.${wave}: tether correto, mas bait CW ficou fora da posição.`);
        }
      }

      t.lastFiredWave=wave;
      t.lastFiredAt=state.elapsed;
      t.hit=false; // keep drawing the live tether if its BH survives
    }

    // Despawn only tethers whose actual Black Hole/source does not continue
    // into the next resolve. Persistent sources retain holderRole exactly.
    state.activeTethers=state.activeTethers.filter(t=>{
      if(t.wave!==wave) return true; // e.g. set 1 spawns later tethers before #1 fires
      return sourceSurvives9(block,wave,t.srcIdx);
    });
  };

  // Tiny feedback with Hints ON so persistence is easy to verify while testing.
  const priorDraw9=draw;
  draw=function(){
    priorDraw9();
    if(!state.hints || !state.activeBH) return;
    for(const t of state.activeTethers){
      if(!t.persistedFromPreviousWave || !t.holderRole) continue;
      const hp=entityPos9(t.holderRole),q=project(hp.x,hp.z,10);
      text('TETHER KEPT',q.x,q.y-31*q.s,8.5*q.s,'#9dffc8','900');
    }
  };
})();
