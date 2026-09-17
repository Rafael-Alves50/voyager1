  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d'), stage = $('stage');
  const startBtn = $('startBtn'), hintBtn = $('hintBtn'), sprintBtn = $('sprintBtn');
  const modeSelect = $('modeSelect'), roleSelect = $('roleSelect'), lineSelect = $('lineSelect'), accSelect = $('accSelect');
  const lineWrap=$('lineWrap'), accWrap=$('accWrap');
  const joy = $('joy'), camJoy = $('camJoy'), banner = $('banner'), msg = $('msg'), bhBadge = $('bhBadge');
  const youHud = $('youHud'), debuffHud = $('debuffHud'), orderHud = $('orderHud'), setHud = $('setHud'), scoreHud = $('scoreHud'), timeHud = $('timeHud');

  const W=1280, H=720, ARENA_R=100, STACK_R=18, HOLE_R=12, TETHER_R=91;
  const PREP_MS=1500, SET_MS=3400, BREAK_MS=1100, INTERMISSION_MS=1800;
  const SET_COUNTS=[1,2,3,3,3,3,3,3,2,1];
  const SET_ASSIGNMENTS=[
    [{line:1,pri:1}],
    [{line:1,pri:1},{line:1,pri:2}],
    [{line:1,pri:1},{line:1,pri:2},{line:1,pri:3}],
    [{line:2,pri:1},{line:1,pri:2},{line:1,pri:3}],
    [{line:2,pri:1},{line:2,pri:2},{line:1,pri:3}],
    [{line:2,pri:1},{line:2,pri:2},{line:2,pri:3}],
    [{line:3,pri:1},{line:2,pri:2},{line:2,pri:3}],
    [{line:3,pri:1},{line:3,pri:2},{line:2,pri:3}],
    [{line:3,pri:1},{line:3,pri:2}],
    [{line:3,pri:2}],
  ];
  const REL_OFFSETS=[30,80,130];
  const HOLE_NAMES=['1st CW','2nd CW','3rd CW'];
  const INTERMISSION_AFTER = new Set([2,5,8]);
  const INTERMISSION_LABEL = {2:'Damning Edict',5:'Damning Edict 2',8:'White Hole → final sets'};

  const state={
    phase:'idle',
    player:{x:0,z:18},
    cam:0, joyX:0, joyY:0, camX:0, keys:new Set(), movePid:null, camPid:null,
    sprintUntil:0, hints:false, last:performance.now(),
    setup:null, rounds:null, score:0, totalNeeded:3, currentSet:0, setStart:0, snapshot:0,
    active:false, targetIndex:-1, correctIndex:-1, history:[], currentBlock:0, blockAngles:[],
    intermissionEnd:0, prepEnd:0, touchedWrong:false, touchedRight:false, lastStatus:'',
  };

  const norm = a => ((a%360)+360)%360;
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const dist = (a,b) => Math.hypot(a.x-b.x, a.z-b.z);
  const pt = (deg, r) => { const t = deg*Math.PI/180; return {x:r*Math.sin(t), z:-r*Math.cos(t)}; };
  const isDPS = slot => ['M1','M2','R1','R2'].includes(slot);
  const isHealer = slot => slot==='H1' || slot==='H2';
  const lineName = n => n===1?'1st':n===2?'2nd':'3rd';
  const priName = n => n===1?'P1':n===2?'P2':'P3';

  function projectRelative(x,z){
    const dx=x-state.player.x, dz=z-state.player.z, ca=Math.cos(state.cam), sa=Math.sin(state.cam);
    return { right: ca*dx-sa*dz, forward: -sa*dx-ca*dz };
  }
  function project(x,z,h=0){
    const c = projectRelative(x,z);
    const pers = clamp(1/(1+c.forward/210), .48, 2.05);
    return { x: W/2+c.right*5.55*pers, y:H*.79-c.forward*3.8*pers-h*1.42*pers, s:pers, d:c.forward };
  }
  function ellipse(x,y,rx,ry,fill,a=1){ ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); ctx.restore(); }
  function circle(x,y,r,fill,stroke=null,w=1,a=1){ ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();} ctx.restore(); }
  function text(t,x,y,size,color='#fff',weight='800',align='center'){ ctx.save(); ctx.fillStyle=color; ctx.font=`${weight} ${size}px system-ui`; ctx.textAlign=align; ctx.textBaseline='middle'; ctx.shadowColor='rgba(0,0,0,.75)'; ctx.shadowBlur=4; ctx.fillText(t,x,y); ctx.restore(); }
  function line(points,color,w=1,a=1){ if(points.length<2) return; ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=color; ctx.lineWidth=w; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y); for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y); ctx.stroke(); ctx.restore(); }
  function poly(points,fill,stroke=null,w=1,a=1){ if(points.length<3) return; ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y); for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y); ctx.closePath(); if(fill){ ctx.fillStyle=fill; ctx.fill(); } if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=w; ctx.stroke(); } ctx.restore(); }
  function groundCircle(x,z,r,fill,stroke,w=1,a=1){ const pts=[]; for(let i=0;i<36;i++){ const q=i/36*Math.PI*2; pts.push(project(x+Math.cos(q)*r,z+Math.sin(q)*r)); } poly(pts,fill,stroke,w,a); }

  function rotateCamera(d){
    state.cam += d;
    if(Math.abs(state.cam)>Math.PI*4) state.cam=Math.atan2(Math.sin(state.cam),Math.cos(state.cam));
  }

  function decorateSetup(slot,line,acc){
    const pri = acc ? 3 : (isDPS(slot) ? 1 : 2);
    const setup = { slot, line, acc, pri };
    setup.targetSets = [];
    SET_ASSIGNMENTS.forEach((arr, idx) => {
      const foundIndex = arr.findIndex(entry => entry.line===line && entry.pri===pri);
      if(foundIndex>=0) setup.targetSets.push({set: idx+1, tetherOrdinal: foundIndex+1});
    });
    setup.totalNeeded = setup.targetSets.length;
    setup.label = `${slot} · ${lineName(line)}${acc?' + ACC':''}`;
    return setup;
  }

  function validateManualSelection(){
    const slot=roleSelect.value, line=+lineSelect.value, acc=accSelect.value==='yes';
    if(acc && !isHealer(slot) && !isDPS(slot)){
      banner.textContent='Tank não pode receber Accretion';
      msg.textContent='Escolha H1/H2/M1/M2/R1/R2 se quiser treinar com Accretion.';
      return null;
    }
    if(acc && line===3){
      banner.textContent='Accretion não combina com 3rd In Line';
      msg.textContent='Accretion só aparece em First ou Second.';
      return null;
    }
    return decorateSetup(slot,line,acc);
  }

  function randomSetup(){
    const slot=roleSelect.value;
    let options;
    if(slot==='MT'||slot==='ST'){
      options=[{line:1,acc:false},{line:2,acc:false},{line:3,acc:false}];
    } else if(isHealer(slot)){
      options=[
        {line:1,acc:false},{line:1,acc:false},
        {line:2,acc:false},{line:2,acc:false},
        {line:3,acc:false},{line:3,acc:false},
        {line:1,acc:true},{line:1,acc:true},{line:1,acc:true},
        {line:2,acc:true},{line:2,acc:true},{line:2,acc:true}
      ];
    } else {
      options=[
        {line:1,acc:false},{line:1,acc:false},
        {line:2,acc:false},{line:2,acc:false},
        {line:3,acc:false},{line:3,acc:false},
        {line:1,acc:true},{line:2,acc:true}
      ];
    }
    const pick=options[Math.floor(Math.random()*options.length)];
    return decorateSetup(slot,pick.line,pick.acc);
  }

  function getSetupForRun(){
    return modeSelect.value==='random' ? randomSetup() : validateManualSelection();
  }

  function syncModeUI(){
    const random=modeSelect.value==='random';
    lineWrap.classList.toggle('disabledControl',random);
    accWrap.classList.toggle('disabledControl',random);
    lineSelect.disabled=random; accSelect.disabled=random;
    if(!state.setup){
      debuffHud.textContent=random?'RANDOM':`${lineName(+lineSelect.value)}${accSelect.value==='yes'?' + ACC':''}`;
      orderHud.textContent=random?'?':'—';
      msg.textContent=random
        ? 'Random: escolha só seu slot. A linha e Accretion serão sorteadas quando o pull começar.'
        : 'Manual: escolha slot, linha e Accretion para treinar um caso específico.';
    }
  }

  function makeBlockAngles(){
    const picks=[0,45,90,135,180,225,270,315];
    const arr=[];
    while(arr.length<4){
      const v = picks[Math.floor(Math.random()*picks.length)];
      if(arr.length && Math.abs(norm(v-arr[arr.length-1]))<70) continue;
      arr.push(v);
    }
    return arr;
  }

  function setWorld(round){
    round.kefkaAngle = state.blockAngles[round.block];
    round.holes = [];
    for(let i=0;i<round.count;i++){
      const angle = norm(round.kefkaAngle + REL_OFFSETS[i]);
      const p = pt(angle, TETHER_R);
      round.holes.push({ x:p.x, z:p.z, angle, ord:i+1 });
    }
    const giant = pt(round.kefkaAngle, 112);
    round.kefkaPos = giant;
  }

  function buildRounds(setup){
    state.blockAngles = makeBlockAngles();
    const rounds=[];
    for(let i=0;i<10;i++){
      const arr=SET_ASSIGNMENTS[i], count=SET_COUNTS[i];
      const myIndex = arr.findIndex(entry => entry.line===setup.line && entry.pri===setup.pri);
      const round={ index:i+1, block: i<=1?0 : i<=4?1 : i<=7?2 : 3, count, myIndex, active:myIndex>=0 };
      setWorld(round);
      rounds.push(round);
    }
    return rounds;
  }

  function refreshHud(){
    if(!state.setup){
      youHud.textContent = roleSelect.value;
      const random=modeSelect.value==='random';
      debuffHud.textContent = random ? 'RANDOM' : `${lineName(+lineSelect.value)}${accSelect.value==='yes'?' + ACC':''}`;
      orderHud.textContent = random ? '?' : priName(validateManualSelection()?.pri || 2);
      scoreHud.textContent = '0 / 3';
      return;
    }
    youHud.textContent = state.setup.slot;
    debuffHud.textContent = `${lineName(state.setup.line)}${state.setup.acc?' + ACC':''}`;
    orderHud.textContent = `${priName(state.setup.pri)} · S${state.setup.targetSets.map(x=>x.set).join('/')}`;
    scoreHud.textContent = `${state.score} / ${state.totalNeeded}`;
  }

