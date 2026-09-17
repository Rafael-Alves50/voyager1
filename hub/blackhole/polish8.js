(() => {
  'use strict';

  // Bots should visibly do the same sequence every time:
  // 1) approach the cardinal tether source,
  // 2) grab/pass the tether,
  // 3) rotate clockwise to the bait just past the next intercardinal.
  // The human player still has to steal their own tether manually.
  const BOT_GRAB_DELAY = 0.62;
  const BOT_RECOVER_DELAY = 0.42;

  const priorPrepare8 = prepareWave;
  prepareWave = function(block, wave, append=false){
    priorPrepare8(block, wave, append);
    for (const t of state.activeTethers) {
      if (t.wave !== wave) continue;
      if (t._botTimingInit) continue;
      t._botTimingInit = true;
      t.autoGrabAt = state.elapsed + BOT_GRAB_DELAY;
      t.recoverAt = state.elapsed + BOT_RECOVER_DELAY;
    }
  };

  function forceBotGrabAndBait(){
    if (!state.activeBH || !state.activeTethers?.length) return;

    for (const t of state.activeTethers) {
      if (t.hit || !t.intendedRole || t.intendedRole === state.playerRole) continue;

      const intendedBot = state.bots[t.intendedRole];
      if (!intendedBot) continue;

      // Before the grab, keep the resolver moving onto the radial line from the
      // cardinal black hole. This makes the handoff readable instead of instant.
      if (t.holderRole !== t.intendedRole) {
        moveBot(t.intendedRole, prePos(t.srcIdx, state.activeBH.rotation), 70);

        const canTake = state.elapsed >= (t.autoGrabAt ?? -Infinity);
        const recoveringFromPlayer = t.holderRole === state.playerRole && state.elapsed >= (t.recoverAt ?? -Infinity);
        if (canTake || recoveringFromPlayer) {
          t.holderRole = t.intendedRole;
          t.grabbed = true;
          t.lastTransfer = state.elapsed;
          if (recoveringFromPlayer) banner.textContent = 'BOT RECOVERED TETHER';
        }
      }

      // Once the correct bot owns it, continuously enforce the CW bait target so
      // no later movement command drags that bot back toward the center.
      if (t.holderRole === t.intendedRole) {
        const bait = baitPos(t.srcIdx, state.activeBH.rotation);
        moveBot(t.intendedRole, bait, 72);
      }
    }
  }

  const priorUpdate8 = update;
  update = function(dt, now){
    priorUpdate8(dt, now);
    if (state.phase === 'running') forceBotGrabAndBait();
  };

  // With hints on, make the bot path explicit: cardinal grab -> CW intercard bait.
  const priorDraw8 = draw;
  draw = function(){
    priorDraw8();
    if (!state.hints || !state.activeBH) return;
    for (const t of state.activeTethers) {
      if (t.hit || !t.intendedRole || t.intendedRole === state.playerRole) continue;
      const pre = prePos(t.srcIdx, state.activeBH.rotation);
      const bait = baitPos(t.srcIdx, state.activeBH.rotation);
      const a = project(pre.x, pre.z, 2);
      const b = project(bait.x, bait.z, 2);
      line([a,b], 'rgba(102,217,166,.42)', 2, .72);
      text('GRAB → CW', b.x, b.y-16*b.s, 8.5*b.s, '#9dffc8', '900');
    }
  };
})();