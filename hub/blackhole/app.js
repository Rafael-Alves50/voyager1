(() => {
'use strict';
const $=id=>document.getElementById(id);
const cv=$('game'),ctx=cv.getContext('2d'),stage=$('stage');
const startBtn=$('startBtn'),hintBtn=$('hintBtn'),sprintBtn=$('sprintBtn');
const modeSelect=$('modeSelect'),roleSelect=$('roleSelect'),lineSelect=$('lineSelect'),accSelect=$('accSelect');
const lineWrap=$('lineWrap'),accWrap=$('accWrap'),joy=$('joy'),camJoy=$('camJoy'),banner=$('banner'),msg=$('msg'),bhBadge=$('bhBadge');
const youHud=$('youHud'),debuffHud=$('debuffHud'),orderHud=$('orderHud'),setHud=$('setHud'),scoreHud=$('scoreHud'),timeHud=$('timeHud');

const W=1280,H=720,R=100,SCALE=1.72,REVEAL_MS=8000;
const ROLES=['MT','ST','H1','H2','M1','M2','R1','R2'];
const SUP=['MT','ST','H1','H2'], DPS=['M1','M2','R1','R2'];
const WAY=[['A',0],['2',45],['B',90],['3',135],['C',180],['4',225],['D',270],['1',315]];
const PRI_KEYS=[
 ['fil_dps'],
 ['fil_dps','fil_sup'],
 ['fil_dps','fil_sup','fil_acr'],
 ['sil_dps','fil_sup','fil_acr'],
 ['sil_dps','sil_sup','fil_acr'],
 ['sil_dps','sil_sup','sil_acr'],
 ['til_dps','sil_sup','sil_acr'],
 ['til_dps','til_sup','sil_acr'],
 ['til_dps','til_sup'],
 ['til_sup']
];
const WAVE_TIMES=[
 {start:17.6,fire:24.6,block:1}, {start:24.6,fire:32.0,block:1},
 {start:48.2,fire:55.2,block:2}, {start:55.2,fire:60.2,block:2}, {start:60.2,fire:65.2,block:2},
 {start:82.3,fire:89.3,block:3}, {start:89.3,fire:94.3,block:3}, {start:94.3,fire:99.3,block:3},
 {start:115.8,fire:122.8,block:4}, {start:122.8,fire:129.8,block:4}
];
const BLOCKS={
 1:{from:17.6,to:33.2,layout:13},
 2:{from:48.2,to:66.0,layout:24},
 3:{from:82.3,to:100.2,layout:13},
 4:{from:115.8,to:130.4,layout:24}
};
const BASE13={N:[[1.5206,-42.4767],[-10.7782,-32.3757],[-12.9318,-18.0891]],E:[[1.5206,-42.4767],[-10.7782,-32.3757],[-12.9318,-18.0891]],S:[[1.5206,-42.4767],[-10.7782,-32.3757],[-12.9318,-18.0891]],W:[[-10.7782,-32.3757],[-12.9318,-18.0891]]};
const BASE24={N:[[-2.9252,-42.4767],[9.1904,-32.3757],[-2.9396,-18.0891]],E:[[-2.9252,-42.4767],[9.1904,-32.3757],[-2.9396,-18.0891]],S:[[-2.9252,-42.4767],[9.1904,-32.3757],[-2.9396,-18.0891]],W:[[9.1904,-32.3757],[-2.9396,-18.0891]]};
const SOURCE_BASE={N:[0,-42.4767],E:[42.4767,0],S:[0,42.4767]};
const BOT_COL={MT:'#74b8ff',ST:'#74b8ff',H1:'#78e6a7',H2:'#78e6a7',M1:'#ff7c87',M2:'#ff7c87',R1:'#ff9a7a',R2:'#ff9a7a'};

const s={running:false,start:0,phase:'idle',setup:null,player:{x:0,z:22},cam:0,jx:0,jy:0,cx:0,keys:new Set(),mp:null,cp:null,sprint:0,last:performance.now(),hints:false,
 blockRots:{1:0,2:0,3:0,4:0},kefkaRots:{a:0,b:0,c:0},hands:{a:'L',b:'R',c:'L'},chaosFace:0,latlong:true,
 waveIndex:-1,waveGrabbed:false,waveFailed:false,tetherScore:0,tetherNeed:3,mechanicErrors:0,history:[],debuffRevealUntil:0,earthPulseUntil:0,lastEvalWave:-1};

const norm=a=>((a%360)+360)%360, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pt=(deg,r)=>{const a=deg*Math.PI/180;return{x:r*Math.sin(a),z:-r*Math.cos(a)}};
const rotPt=(x,z,deg)=>{const a=deg*Math.PI/180,c=Math.cos(a),q=Math.sin(a);return{x:x*c-z*q,z:x*q+z*c}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const lineName=n=>n===1?'1st':n===2?'2nd':'3rd';

function generateParty(){
 const d=shuffle(DPS), sups=[...SUP];
 const healerAcc=shuffle(['H1','H2'])[0]; sups.splice(sups.indexOf(healerAcc),1);
 const ss=shuffle(sups);
 const map={fil_dps:d[0],sil_dps:d[1],til_dps:d[2],fil_sup:ss[0],sil_sup:ss[1],til_sup:ss[2]};
 if(Math.random()<.5){map.fil_acr=d[3];map.sil_acr=healerAcc}else{map.sil_acr=d[3];map.fil_acr=healerAcc}
 const info={};
 for(const [k,r] of Object.entries(map)){
   const line=k.startsWith('fil')?1:k.startsWith('sil')?2:3;
   const acc=k.endsWith('acr');
   const pri=acc?3:(k.endsWith('dps')?1:2);
   info[r]={line,acc,pri,key:k};
 }
 return {map,info};
}
function setupMatches(pack,slot,line,acc){const x=pack.info[slot];return x&&x.line===line&&x.acc===acc}
function chooseSetup(){
 const slot=roleSelect.value, random=modeSelect.value==='random';
 if(!random){
   const line=+lineSelect.value,acc=accSelect.value==='yes';
   if(acc&&(slot==='MT'||slot==='ST'||line===3)){banner.textContent='Combinação inválida';msg.textContent='Tank não recebe Accretion e Accretion nunca vem com 3rd In Line.';return null}
   for(let i=0;i<1000;i++){const p=generateParty();if(setupMatches(p,slot,line,acc))return {...p,slot}}
   return null;
 }
 const p=generateParty();return {...p,slot};
}
function userInfo(){return s.setup?.info[s.setup.slot]}
function syncControls(){const r=modeSelect.value==='random';lineSelect.disabled=r;accSelect.disabled=r;lineWrap.classList.toggle('disabledControl',r);accWrap.classList.toggle('disabledControl',r);if(!s.running){debuffHud.textContent=r?'RANDOM':`${lineName(+lineSelect.value)}${accSelect.value==='yes'?' + ACC':''}`;orderHud.textContent=r?'?':'—';msg.textContent=r?'Escolha só seu slot. Os debuffs serão sorteados quando começar.':'Escolha a combinação que quer praticar.'}}
function newRun(){
 const pack=chooseSetup();if(!pack)return;s.setup=pack;s.running=true;s.start=performance.now();s.phase='earthquake';s.player={x:0,z:18};s.cam=0;s.waveIndex=-1;s.waveGrabbed=false;s.waveFailed=false;s.tetherScore=0;s.mechanicErrors=0;s.history=[];s.lastEvalWave=-1;s.earthPulseUntil=0;s.debuffRevealUntil=s.start+REVEAL_MS;
 s.blockRots={1:[0,90,180,270][Math.floor(Math.random()*4)],2:[0,90,180,270][Math.floor(Math.random()*4)],3:[0,90,180,270][Math.floor(Math.random()*4)],4:[0,90,180,270][Math.floor(Math.random()*4)]};
 s.kefkaRots={a:Math.floor(Math.random()*8)*45,b:Math.floor(Math.random()*8)*45,c:Math.floor(Math.random()*8)*45};s.hands={a:Math.random()<.5?'L':'R',b:Math.random()<.5?'L':'R',c:Math.random()<.5?'L':'R'};s.chaosFace=Math.floor(Math.random()*8)*45;s.latlong=Math.random()<.5;
 const ui=userInfo();s.tetherNeed=3;youHud.textContent=s.setup.slot;debuffHud.textContent='MEMORIZE';orderHud.textContent='MEMORIZE';setHud.textContent='—';scoreHud.textContent='0 / 3';timeHud.textContent='0.0s';bhBadge.textContent='?';banner.textContent='EARTHQUAKE — READ YOUR DEBUFFS';msg.textContent='Memorize sua linha e se você tem Accretion. Esses cards vão sumir.';startBtn.textContent='Retry';stage.focus({preventScroll:true});
}
function elapsed(now){return s.running?(now-s.start)/1000:0}
function currentBlock(t){for(const [k,b] of Object.entries(BLOCKS))if(t>=b.from&&t<=b.to)return +k;return 0}
function currentWave(t){for(let i=0;i<WAVE_TIMES.length;i++)if(t>=WAVE_TIMES[i].start&&t<WAVE_TIMES[i].fire)return i;return -1}
function waveOwners(i){return PRI_KEYS[i].map(k=>s.setup.map[k])}
function myWaveSource(i){const owners=waveOwners(i);return owners.indexOf(s.setup.slot)}
function sourceOrder(block){return block===4?['N','E','S']:['S','E','N']}
function sourcePoint(block,sourceIdx){const dir=sourceOrder(block)[sourceIdx],base=SOURCE_BASE[dir];return rotPt(base[0]*SCALE,base[1]*SCALE,s.blockRots[block])}
function allBlackholes(block){const layout=BLOCKS[block].layout===13?BASE13:BASE24,arr=[],rots={N:0,E:90,S:180,W:270};for(const dir of ['N','E','S','W'])for(const [x,z] of layout[dir]){let q=rotPt(x*SCALE,z*SCALE,rots[dir]);q=rotPt(q.x,q.z,s.blockRots[block]);arr.push(q)}return arr}
function baitPoint(block,sourceIdx){const dir=sourceOrder(block)[sourceIdx],raw=dir==='N'?[14,-10]:dir==='E'?[10,14]:[-14,10];return rotPt(raw[0]*2.35,raw[1]*2.35,s.blockRots[block])}
function stackPos(role){const idx=ROLES.indexOf(role),a=idx/8*Math.PI*2;return{x:Math.cos(a)*4,z:Math.sin(a)*4}}

function markError(txt){s.mechanicErrors++;s.history.push(txt);s.earthPulseUntil=performance.now()+550}
function evaluateWave(i){if(s.lastEvalWave===i)return;s.lastEvalWave=i;const mySrc=myWaveSource(i);if(mySrc<0)return;const b=WAVE_TIMES[i].block,target=baitPoint(b,mySrc),ok=s.waveGrabbed&&dist(s.player,target)<24;if(ok)s.tetherScore++;else markError(`Missed tether wave ${i+1}`);scoreHud.textContent=`${s.tetherScore} / 3`;s.waveGrabbed=false;s.waveFailed=!ok}
function dangerCheck(t){
 const b=currentBlock(t);if(b){for(const h of allBlackholes(b)){if(dist(s.player,h)<7){if(!s._bhTouch){markError('Touched black hole');s._bhTouch=true}return}}}s._bhTouch=false;
 if((t>37.8&&t<42.4)||(t>67.5&&t<72.0)){
  const chaos={x:-25,z:-20},v={x:s.player.x-chaos.x,z:s.player.z-chaos.z},face=pt(s.chaosFace,1),dot=v.x*face.x+v.z*face.z;if(dot>0&&Math.hypot(v.x,v.z)<90){if(!s._edictHit){markError('Hit by Damning Edict');s._edictHit=true}}
 }else s._edictHit=false;
 if(t>106.0&&t<107.0){let q=rotPt(s.player.x+25,s.player.z+20,-45);const sideUnsafe=s.latlong?Math.abs(q.x)>Math.abs(q.z):Math.abs(q.z)>Math.abs(q.x);if(sideUnsafe&&!s._latHit){markError('Hit by Chaos Implosion');s._latHit=true}}else s._latHit=false;
 if(t>128.2&&t<130.0){const kr=s.kefkaRots.c,q=rotPt(s.player.x,s.player.z,-kr);if(Math.abs(q.x)<20&&!s._slamHit){markError('Hit by Kefka body slam');s._slamHit=true}}else s._slamHit=false;
}
function updatePhase(t,now){
 const wi=currentWave(t);if(wi!==s.waveIndex){if(s.waveIndex>=0&&t>=WAVE_TIMES[s.waveIndex].fire)evaluateWave(s.waveIndex);s.waveIndex=wi;s.waveGrabbed=false;s.waveFailed=false}
 if(wi>=0){const w=WAVE_TIMES[wi],my=myWaveSource(wi);s.phase='tether';setHud.textContent=`${wi+1} / 10`;timeHud.textContent=Math.max(0,w.fire-t).toFixed(1)+'s';if(my>=0){banner.textContent=`WAVE ${wi+1} — YOUR TETHER`;msg.textContent=s.hints?`Pegue o ${my+1}º tether (${sourceOrder(w.block)[my]}) e puxe CW.`:'É sua wave. Identifique seu tether, pegue e puxe para fora da party.'}else{banner.textContent=`WAVE ${wi+1} — HOLD CENTER`;msg.textContent='Não é sua wave. Deixe os bots resolverem e fique fora dos blackholes.'}if(my>=0&&!s.waveGrabbed&&dist(s.player,sourcePoint(w.block,my))<22)s.waveGrabbed=true}
 else {
   for(let i=0;i<WAVE_TIMES.length;i++)if(t>=WAVE_TIMES[i].fire&&s.lastEvalWave<i)evaluateWave(i);
   const reveal=now<s.debuffRevealUntil;
   if(t<13.5){s.phase='earthquake';banner.textContent=reveal?'EARTHQUAKE — MEMORIZE':'ACCRETION RESOLUTION';msg.textContent=reveal?'Memorize os debuffs antes que sumam.':'Os ícones sumiram. Lembre se você tinha Accretion.'}
   else if(t<17.6){s.phase='slaps';banner.textContent=`GIANT KEFKA — ${s.hands.a==='L'?'LEFT':'RIGHT'} HAND`;msg.textContent=s.hands.a==='L'?'Role cones depois do center slap. Posicione-se pela sua role.':'Party stack depois do center slap.'}
   else if(t>=33.2&&t<48.2){s.phase='edict';banner.textContent=t<42.4?'DAMNING EDICT — GET BEHIND CHAOS':'KEFKA SLAPS';msg.textContent=t<42.4?'Vá para trás do Chaos e leia o novo norte do Giant Kefka.':'Resolva a mão do Kefka enquanto o grupo se reposiciona.'}
   else if(t>=66&&t<82.3){s.phase='edict2';banner.textContent=t<72?'DAMNING EDICT 2 — BEHIND CHAOS':'KEFKA BODY CLEAVE';msg.textContent='Atrás do Chaos primeiro, depois saia da faixa central do Kefka.'}
   else if(t>=100.2&&t<115.8){s.phase='whitehole';banner.textContent=s.latlong?'LAT/LONG + WHITE HOLE':'LONG/LAT + WHITE HOLE';msg.textContent='Leia o cleave do Chaos, fique cheio para White Hole e resolva a mão do Kefka.'}
   else if(t>=130.4){s.phase='result';s.running=false;banner.textContent=s.tetherScore===3&&s.mechanicErrors===0?'✓ CLEAN CLEAR':'SEQUENCE COMPLETE';msg.textContent=`Tethers ${s.tetherScore}/3 · Erros adicionais ${s.mechanicErrors}.`;timeHud.textContent='DONE';setHud.textContent='10 / 10'}
 }
 dangerCheck(t);
}
function updateMovement(dt,now){let x=s.jx,y=s.jy;if(s.keys.has('a')||s.keys.has('arrowleft'))x--;if(s.keys.has('d')||s.keys.has('arrowright'))x++;if(s.keys.has('w')||s.keys.has('arrowup'))y--;if(s.keys.has('s')||s.keys.has('arrowdown'))y++;let m=Math.hypot(x,y);if(m>1){x/=m;y/=m}if(Math.abs(s.cx)>.12)s.cam+=s.cx*dt*2.6;const ca=Math.cos(s.cam),sa=Math.sin(s.cam),spd=now<s.sprint?95:68;s.player.x+=(ca*x+sa*y)*spd*dt;s.player.z+=(-sa*x+ca*y)*spd*dt;const r=Math.hypot(s.player.x,s.player.z);if(r>R-3){s.player.x*=97/r;s.player.z*=97/r}}
function update(dt,now){if(!s.running)return;updateMovement(dt,now);const t=elapsed(now);timeHud.textContent=t.toFixed(1)+'s';updatePhase(t,now);const ui=userInfo();if(now>s.debuffRevealUntil&&!s.hints){debuffHud.textContent='???';orderHud.textContent='???';bhBadge.textContent='?'}else{debuffHud.textContent=`${lineName(ui.line)}${ui.acc?' + ACC':''}`;orderHud.textContent=`P${ui.pri}`;bhBadge.textContent=lineName(ui.line)}}

function camC(x,z){const dx=x-s.player.x,dz=z-s.player.z,ca=Math.cos(s.cam),sa=Math.sin(s.cam);return{r:ca*dx-sa*dz,f:-sa*dx-ca*dz}}
function proj(x,z,h=0){const q=camC(x,z),sc=clamp(1/(1+q.f/210),.48,2.05);return{x:W/2+q.r*5.55*sc,y:H*.79-q.f*3.8*sc-h*1.42*sc,s:sc,d:q.f}}
function line(ps,col,w=1,a=1){if(ps.length<2)return;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(ps[0].x,ps[0].y);for(let i=1;i<ps.length;i++)ctx.lineTo(ps[i].x,ps[i].y);ctx.stroke();ctx.restore()}
function poly(ps,fill,stroke=null,w=1,a=1){ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(ps[0].x,ps[0].y);for(let i=1;i<ps.length;i++)ctx.lineTo(ps[i].x,ps[i].y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke()}ctx.restore()}
function circle(x,y,r,fill,stroke=null,w=1,a=1){ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke()}ctx.restore()}
function ellipse(x,y,rx,ry,fill,a=1){ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.restore()}
function text(t,x,y,size,col='#fff',weight='800'){ctx.save();ctx.fillStyle=col;ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=4;ctx.fillText(t,x,y);ctx.restore()}
function groundCircle(x,z,r,fill,stroke,w=1,a=1){const ps=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2;ps.push(proj(x+Math.cos(a)*r,z+Math.sin(a)*r))}poly(ps,fill,stroke,w,a)}
function drawFloor(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#777d95');g.addColorStop(.28,'#4b526a');g.addColorStop(.5,'#242a3e');g.addColorStop(.72,'#131827');g.addColorStop(1,'#070910');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(let i=0;i<48;i++){const a0=i/48*Math.PI*2,a1=(i+1)/48*Math.PI*2,p=[proj(0,0)];for(let j=0;j<=4;j++){const a=a0+(a1-a0)*j/4;p.push(proj(Math.cos(a)*R,Math.sin(a)*R))}poly(p,i%2?'#151c30':'#202941')}for(const rr of [18,34,50,66,82,98]){const p=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;p.push(proj(Math.cos(a)*rr,Math.sin(a)*rr))}line(p,rr===98?'#7aaac4':'#33435e',rr===98?4:1.2,rr===98?.95:.7)}for(let i=0;i<24;i++){const a=i/24*Math.PI*2;line([proj(Math.cos(a)*10,Math.sin(a)*10),proj(Math.cos(a)*98,Math.sin(a)*98)],i%3?'#26344e':'#4d627d',i%3?.8:1.5,.48)}}
function drawWay(label,deg){const p=pt(deg,86),g=proj(p.x,p.z),sc=g.s;ctx.save();ctx.translate(g.x,g.y);ctx.scale(sc,sc);ctx.fillStyle=/[ABCD]/.test(label)?'rgba(190,66,84,.92)':'rgba(68,116,201,.92)';ctx.strokeStyle='#e8f0ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(14,-8);ctx.lineTo(14,20);ctx.lineTo(-14,20);ctx.lineTo(-14,-8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();text(label,g.x,g.y,16*sc)}
function drawBoss(name,x,z,col,scale=1){const g=proj(x,z),sc=g.s*scale;ellipse(g.x,g.y+10*sc,30*sc,8*sc,'rgba(0,0,0,.42)');ctx.save();ctx.translate(g.x,g.y-10*sc);ctx.scale(sc,sc);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-48);ctx.quadraticCurveTo(-28,-28,-30,22);ctx.lineTo(-18,48);ctx.lineTo(0,38);ctx.lineTo(18,48);ctx.lineTo(30,22);ctx.quadraticCurveTo(28,-28,0,-48);ctx.closePath();ctx.fill();circle(0,-56,10,'#e9c4aa','#fff',1);ctx.restore();text(name,g.x,g.y-88*sc,14*sc,'#f6edff')}
function giantPos(rot){return pt(rot,112)}
function drawGiant(rot,hand){const p=giantPos(rot),g=proj(p.x,p.z),sc=g.s*1.12;ellipse(g.x,g.y+12*sc,42*sc,10*sc,'rgba(0,0,0,.45)');ctx.save();ctx.translate(g.x,g.y-14*sc);ctx.scale(sc,sc);ctx.fillStyle='#6b3479';ctx.beginPath();ctx.moveTo(0,-75);ctx.quadraticCurveTo(-50,-42,-58,18);ctx.lineTo(-42,70);ctx.lineTo(-8,82);ctx.lineTo(0,57);ctx.lineTo(8,82);ctx.lineTo(42,70);ctx.lineTo(58,18);ctx.quadraticCurveTo(50,-42,0,-75);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffd2fa';ctx.lineWidth=4;ctx.beginPath();if(hand==='L'){ctx.moveTo(-18,-26);ctx.lineTo(-65,-72);ctx.moveTo(18,-26);ctx.lineTo(56,4)}else{ctx.moveTo(18,-26);ctx.lineTo(65,-72);ctx.moveTo(-18,-26);ctx.lineTo(-56,4)}ctx.stroke();circle(0,-88,14,'#efc2ae','#fff',1);ctx.restore();text(`KEFKA · ${hand==='L'?'LEFT':'RIGHT'}`,g.x,g.y-165*sc,14*sc,'#f4dcff')}
function drawBlackholes(block){for(const h of allBlackholes(block)){const g=proj(h.x,h.z),r=17*g.s,gr=ctx.createRadialGradient(g.x,g.y,1,g.x,g.y,r);gr.addColorStop(0,'#000');gr.addColorStop(.52,'#03040a');gr.addColorStop(.68,'#8d79cc');gr.addColorStop(.76,'#9feaff');gr.addColorStop(1,'rgba(40,20,80,0)');circle(g.x,g.y,r,gr,null,0,.98);circle(g.x,g.y,r*.56,'#010207','#111',1,.98)}}
function botTarget(role,t,wi){if(wi>=0){const owners=waveOwners(wi),idx=owners.indexOf(role);if(idx>=0&&role!==s.setup.slot)return baitPoint(WAVE_TIMES[wi].block,idx)}if((t>37.8&&t<42.4)||(t>67.5&&t<72))return{x:-45,z:-20};return stackPos(role)}
function drawBots(t,wi){for(const role of ROLES){if(role===s.setup?.slot)continue;const q=botTarget(role,t,wi),g=proj(q.x,q.z),sc=g.s;ellipse(g.x,g.y+4*sc,7*sc,3*sc,'rgba(0,0,0,.45)');circle(g.x,g.y-8*sc,7*sc,BOT_COL[role],'#fff',1.2,.95);ctx.fillStyle=BOT_COL[role];ctx.fillRect(g.x-5*sc,g.y-2*sc,10*sc,15*sc);text(role,g.x,g.y-22*sc,9*sc,'#fff','900')}}
function drawTethers(t,wi){if(wi<0)return;const w=WAVE_TIMES[wi],owners=waveOwners(wi),ord=sourceOrder(w.block);for(let i=0;i<owners.length;i++){const src=sourcePoint(w.block,i),sg=proj(src.x,src.z,1);let target;if(owners[i]===s.setup.slot){if(!s.waveGrabbed)continue;target=s.player}else target=botTarget(owners[i],t,wi);const tg=proj(target.x,target.z,4);line([sg,tg],owners[i]===s.setup.slot?'#ffe084':'#b8fbff',owners[i]===s.setup.slot?4:2.5,.92);const h=proj(src.x,src.z);circle(h.x,h.y,7*h.s,'#9be8ff','#fff',1.5,.9);if(s.hints)text(ord[i],h.x,h.y-16*h.s,9*h.s,'#dffcff')}}
function drawAOEs(t){
 const specs=[{a:13.5,b:17.5,rot:s.kefkaRots.a,hand:s.hands.a},{a:42.5,b:47.8,rot:s.kefkaRots.b,hand:s.hands.b},{a:110.5,b:115.5,rot:s.kefkaRots.c,hand:s.hands.c}];
 for(const sp of specs)if(t>=sp.a&&t<=sp.b){for(const z of [-25,0,25]){let p={x:sp.hand==='L'?25:-25,z};p=rotPt(p.x*1.35,p.z*1.35,sp.rot);groundCircle(p.x,p.z,25*1.25,'rgba(238,104,54,.13)','#f2a06b',2,.72)}groundCircle(0,0,16,'rgba(166,118,235,.13)','#ba9bff',2,.72)}
 if((t>37.8&&t<42.4)||(t>67.5&&t<72)){const chaos={x:-25,z:-20},dir=pt(s.chaosFace,100),perp={x:-dir.z,z:dir.x},q1={x:chaos.x+perp.x*1.2,z:chaos.z+perp.z*1.2},q2={x:chaos.x-perp.x*1.2,z:chaos.z-perp.z*1.2},far1={x:q1.x+dir.x,z:q1.z+dir.z},far2={x:q2.x+dir.x,z:q2.z+dir.z};poly([proj(q1.x,q1.z),proj(far1.x,far1.z),proj(far2.x,far2.z),proj(q2.x,q2.z)],'rgba(235,72,38,.18)','#ff845e',2,.85)}
 if(t>103.0&&t<108.2){const center={x:-25,z:-20},rot=45,unsafe=s.latlong?[[[-90,-28],[90,-28],[90,28],[-90,28]]]:[[[-28,-90],[28,-90],[28,90],[-28,90]]];for(const box of unsafe){const ps=box.map(([x,z])=>{let q=rotPt(x,z,rot);q={x:q.x+center.x,z:q.z+center.z};return proj(q.x,q.z)});poly(ps,'rgba(163,96,224,.18)','#c69cff',2,.82)}}
 if(t>108.2&&t<109.5){ctx.save();ctx.fillStyle='rgba(245,250,255,.16)';ctx.fillRect(0,0,W,H);ctx.restore();text('WHITE HOLE · FULL HP',W/2,115,24,'#ffffff','900')}
 if(t>128&&t<130.2){const rot=s.kefkaRots.c,ps=[[-20,-100],[20,-100],[20,100],[-20,100]].map(([x,z])=>{const q=rotPt(x,z,rot);return proj(q.x,q.z)});poly(ps,'rgba(240,76,40,.18)','#ff845e',2,.88)}
}
function drawPlayer(){const x=W/2,y=H*.79,now=performance.now(),moving=Math.hypot(s.jx,s.jy)>.12||s.keys.size>0,stride=moving?Math.sin(now/95)*7:0,bob=moving?Math.abs(Math.sin(now/95))*3:0;ellipse(x,y+18,45,13,'rgba(0,0,0,.52)');ctx.save();ctx.translate(x,y-20+bob);ctx.scale(1.58,1.58);ctx.strokeStyle='#d5d2db';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(10,18);ctx.quadraticCurveTo(42,25,36,49);ctx.stroke();ctx.strokeStyle='#2b2940';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-7,28);ctx.lineTo(-10-stride*.45,48);ctx.moveTo(7,28);ctx.lineTo(10+stride*.45,48);ctx.stroke();ctx.fillStyle='#eee9df';ctx.beginPath();ctx.moveTo(0,-34);ctx.quadraticCurveTo(-23,-18,-27,34);ctx.lineTo(-17,49);ctx.lineTo(0,53);ctx.lineTo(18,49);ctx.lineTo(27,34);ctx.quadraticCurveTo(23,-18,0,-34);ctx.fill();ctx.fillStyle='#574d7c';ctx.fillRect(-18,-8,12,48);ctx.fillRect(6,-8,12,48);circle(0,-46,11,'#ddb89c','#222',1.2);ctx.fillStyle='#d8d5df';ctx.beginPath();ctx.moveTo(-9,-54);ctx.lineTo(-15,-70);ctx.lineTo(-2,-58);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(9,-54);ctx.lineTo(15,-70);ctx.lineTo(2,-58);ctx.closePath();ctx.fill();ctx.restore();text(s.setup?.slot||roleSelect.value,x,y-142,15,'#baffcf')}
function drawDebuffReveal(now){if(!s.setup)return;const ui=userInfo();if(now>=s.debuffRevealUntil&&!s.hints)return;const x=28,y=72,w=250,h=82;ctx.save();ctx.fillStyle='rgba(12,15,24,.9)';ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();ctx.stroke();ctx.restore();text('YOUR DEBUFFS',x+w/2,y+14,11,'#aeb6ca','800');const col=ui.line===1?'#ffb15c':ui.line===2?'#7eb7ff':'#c78cff';circle(x+45,y+49,21,col,'#fff',2);text(ui.line,x+45,y+49,20,'#fff','900');text(`${lineName(ui.line)} In Line`,x+142,y+42,15,'#fff','900');text(ui.acc?'ACCRETION':'NO ACCRETION',x+142,y+62,13,ui.acc?'#d39aff':'#86d7aa','900')}
function draw(now){ctx.clearRect(0,0,W,H);drawFloor();for(const w of WAY)drawWay(w[0],w[1]);const t=s.running?elapsed(now):0,wi=s.running?currentWave(t):-1,b=s.running?currentBlock(t):0;drawBoss('CHAOS',-25,-20,'#8f63c7',.92);drawBoss('EXDEATH',25,-20,'#3d63a8',.95);let kr=s.kefkaRots.a,hand=s.hands.a;if(t>37)kr=s.kefkaRots.b,hand=s.hands.b;if(t>100)kr=s.kefkaRots.c,hand=s.hands.c;drawGiant(kr,hand);if(b)drawBlackholes(b);drawAOEs(t);if(s.setup)drawBots(t,wi);if(b)drawTethers(t,wi);drawPlayer();drawDebuffReveal(now);if(now<s.earthPulseUntil){ctx.fillStyle='rgba(160,120,55,.15)';ctx.fillRect(0,0,W,H)}const v=ctx.createRadialGradient(W/2,H*.5,H*.2,W/2,H*.5,W*.7);v.addColorStop(.5,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.32)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H)}
function frame(now){const dt=Math.min(.04,(now-s.last)/1000);s.last=now;update(dt,now);draw(now);requestAnimationFrame(frame)}
function stick(el,e){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width*.36),y=(e.clientY-cy)/(r.height*.36),m=Math.hypot(x,y);if(m>1){x/=m;y/=m}return{x,y,r}}
function bind(el,type){el.addEventListener('pointerdown',e=>{const q=stick(el,e);if(type==='m'){s.mp=e.pointerId;s.jx=q.x;s.jy=q.y}else{s.cp=e.pointerId;s.cx=q.x}el.setPointerCapture(e.pointerId);el.style.setProperty('--jx',q.x*q.r.width*.24+'px');el.style.setProperty('--jy',q.y*q.r.height*.24+'px');e.preventDefault()});el.addEventListener('pointermove',e=>{if((type==='m'?s.mp:s.cp)!==e.pointerId)return;const q=stick(el,e);if(type==='m'){s.jx=q.x;s.jy=q.y}else s.cx=q.x;el.style.setProperty('--jx',q.x*q.r.width*.24+'px');el.style.setProperty('--jy',q.y*q.r.height*.24+'px');e.preventDefault()});const up=e=>{if(type==='m'&&e.pointerId===s.mp){s.mp=null;s.jx=s.jy=0}else if(type==='c'&&e.pointerId===s.cp){s.cp=null;s.cx=0}else return;el.style.setProperty('--jx','0px');el.style.setProperty('--jy','0px')};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)}
bind(joy,'m');bind(camJoy,'c');
sprintBtn.addEventListener('pointerdown',e=>{s.sprint=performance.now()+2600;sprintBtn.classList.add('on');setTimeout(()=>sprintBtn.classList.remove('on'),2650);e.preventDefault()});startBtn.addEventListener('click',newRun);modeSelect.addEventListener('change',syncControls);roleSelect.addEventListener('change',syncControls);lineSelect.addEventListener('change',syncControls);accSelect.addEventListener('change',syncControls);hintBtn.addEventListener('click',()=>{s.hints=!s.hints;hintBtn.textContent=s.hints?'Hints ON':'Hints OFF';hintBtn.setAttribute('aria-pressed',s.hints)});window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k)){s.keys.add(k);e.preventDefault()}if(k==='q')s.cam-=.18;if(k==='e')s.cam+=.18;if((k==='r'||k==='enter'||k===' ')&&!e.repeat){newRun();e.preventDefault()}},{passive:false});window.addEventListener('keyup',e=>s.keys.delete(e.key.toLowerCase()));syncControls();draw(performance.now());requestAnimationFrame(frame);
})();