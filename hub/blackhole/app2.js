  function startRun(){
    const setup=getSetupForRun();
    if(!setup) return;
    state.setup=setup; state.rounds=buildRounds(setup); state.score=0; state.totalNeeded=setup.totalNeeded;
    state.history=[]; state.currentSet=0; state.phase='prep'; state.prepEnd=performance.now()+PREP_MS;
    state.player={x:0,z:26}; state.cam=0; state.lastStatus=''; state.currentBlock=0;
    state.sprintUntil=0; sprintBtn.classList.remove('on');
    refreshHud();
    setHud.textContent = '0 / 10'; timeHud.textContent='READY';
    bhBadge.textContent = lineName(setup.line); banner.textContent='GET READY';
    msg.textContent = `${modeSelect.value==='random'?'SORTEIO: ':''}Você é ${setup.label}. Sua prioridade é ${priName(setup.pri)}. Seus sets: ${setup.targetSets.map(x=>x.set).join(', ')}.`;
    startBtn.textContent='Retry'; stage.focus({preventScroll:true});
  }

  function beginSet(now){
    const round = state.rounds[state.currentSet];
    state.phase='set'; state.setStart=now; state.snapshot=now+SET_MS; state.active=round.active;
    state.targetIndex = round.myIndex; state.correctIndex = round.myIndex; state.touchedWrong=false; state.touchedRight=false;
    setHud.textContent = `${round.index} / 10`;
    banner.textContent = `SET ${round.index} / 10`;
    if(round.active){
      const hole=round.holes[round.myIndex];
      msg.textContent = state.hints
        ? `Seu set. Pegue o ${HOLE_NAMES[round.myIndex]} do novo norte do Giant Kefka.`
        : `Seu set. Resolva qual tether é seu e pegue o blackhole correto.`;
    } else {
      msg.textContent = state.hints
        ? `Não é seu set. Fique no stack e não pegue tether.`
        : `Não é seu set. Stack no meio e não interfira.`;
    }
  }

  function beginIntermission(now){
    state.phase='intermission';
    state.intermissionEnd = now + INTERMISSION_MS;
    const lastSet = state.rounds[state.currentSet-1]?.index || 0;
    banner.textContent = INTERMISSION_LABEL[lastSet] || 'New North';
    const nextRound = state.rounds[state.currentSet];
    msg.textContent = `Novo norte em ${degToWaymark(nextRound.kefkaAngle)}. Reoriente a câmera e prepare-se para os próximos sets.`;
  }

  function finishRun(){
    state.phase='result';
    banner.textContent = state.score===state.totalNeeded ? '✓ CLEAR' : '△ FINISHED';
    msg.textContent = `Fim da sequência. Você acertou ${state.score} dos seus ${state.totalNeeded} sets. ${state.score===state.totalNeeded?'Execução limpa!':'Dá para lapidar a leitura dos sets.'}`;
    timeHud.textContent='DONE';
    setHud.textContent='10 / 10';
  }

  function degToWaymark(d){
    const labels=[['A',0],['2',45],['B',90],['3',135],['C',180],['4',225],['D',270],['1',315]];
    let best=labels[0];
    for(const l of labels){ if(Math.abs(norm(d-l[1]))<Math.abs(norm(d-best[1]))) best=l; }
    return best[0];
  }

  function resolveSet(){
    const round=state.rounds[state.currentSet];
    let ok=true;
    const inside = round.holes.map(h=>dist(state.player,h)<=HOLE_R+2);
    if(round.active){
      ok = inside[round.myIndex]===true;
      if(inside.some((v,idx)=>v && idx!==round.myIndex)) state.touchedWrong=true;
      if(ok) state.score++;
      state.history.push({set:round.index, ok, active:true});
      state.lastStatus = ok ? `✓ Set ${round.index} ok` : `✕ Set ${round.index} missed`;
      msg.textContent = ok ? `Boa. Você resolveu o set ${round.index}.` : `Missou o set ${round.index}. O spot certo era o ${HOLE_NAMES[round.myIndex]}.`;
    } else {
      ok = !inside.some(Boolean);
      state.history.push({set:round.index, ok, active:false});
      state.lastStatus = ok ? `✓ Set ${round.index} safe` : `✕ Pegou tether sem ser seu`;
      if(!ok) msg.textContent = `Você entrou em tether num set que não era seu.`;
      else msg.textContent = `Set ${round.index} safe. Continue no meio até o seu.`;
    }
    refreshHud();
    timeHud.textContent='SNAP';
    state.phase='after';
    state.intermissionEnd = performance.now() + BREAK_MS;
    state.currentSet++;
  }

  function currentRound(){ return state.rounds ? state.rounds[Math.min(state.currentSet, state.rounds.length-1)] : null; }

  function updateMovement(dt, now){
    let x=state.joyX,y=state.joyY;
    if(state.keys.has('a')||state.keys.has('arrowleft')) x-=1;
    if(state.keys.has('d')||state.keys.has('arrowright')) x+=1;
    if(state.keys.has('w')||state.keys.has('arrowup')) y-=1;
    if(state.keys.has('s')||state.keys.has('arrowdown')) y+=1;
    const m=Math.hypot(x,y); if(m>1){ x/=m; y/=m; }
    if(Math.abs(state.camX)>.12) rotateCamera(state.camX*dt*2.6);
    const ca=Math.cos(state.cam), sa=Math.sin(state.cam), speed=now<state.sprintUntil?95:68;
    if(state.phase!=='result'){
      state.player.x += (ca*x+sa*y)*speed*dt;
      state.player.z += (-sa*x+ca*y)*speed*dt;
      const r=Math.hypot(state.player.x,state.player.z), max=ARENA_R-4;
      if(r>max){ state.player.x*=max/r; state.player.z*=max/r; }
    }
  }

  function update(dt, now){
    updateMovement(dt, now);
    if(state.phase==='prep' && now>=state.prepEnd) beginSet(now);
    if(state.phase==='set'){
      const remain=Math.max(0, state.snapshot-now);
      timeHud.textContent = (remain/1000).toFixed(1)+'s';
      if(remain<=0) resolveSet();
      else if(remain<=1400) banner.textContent = state.active ? `SNAP ${Math.ceil(remain/1000)}…` : `SAFE ${Math.ceil(remain/1000)}…`;
    } else if(state.phase==='after'){
      if(now>=state.intermissionEnd){
        const prevSet = state.rounds[state.currentSet-1]?.index;
        if(state.currentSet>=state.rounds.length) finishRun();
        else if(INTERMISSION_AFTER.has(prevSet)) beginIntermission(now);
        else beginSet(now);
      }
    } else if(state.phase==='intermission'){
      const remain=Math.max(0,state.intermissionEnd-now);
      timeHud.textContent=(remain/1000).toFixed(1)+'s';
      if(remain<=0) beginSet(now);
    }
  }

