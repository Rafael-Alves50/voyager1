(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  for (const el of [root, body]) {
    if (!el) continue;
    el.style.setProperty('user-select', 'none', 'important');
    el.style.setProperty('-webkit-user-select', 'none', 'important');
    el.style.setProperty('-webkit-touch-callout', 'none', 'important');
  }

  const block = e => e.preventDefault();
  document.addEventListener('selectstart', block, {capture:true, passive:false});
  document.addEventListener('contextmenu', block, {capture:true, passive:false});
  document.addEventListener('dragstart', block, {capture:true, passive:false});

  // iOS Safari can still expose selection handles after long-presses unless the
  // interactive game surface is explicitly marked non-selectable.
  document.querySelectorAll('body *').forEach(el => {
    el.style.setProperty('user-select', 'none', 'important');
    el.style.setProperty('-webkit-user-select', 'none', 'important');
    el.style.setProperty('-webkit-touch-callout', 'none', 'important');
  });

  document.querySelectorAll('.stage, canvas, .joy, .camJoy, .sprint').forEach(el => {
    el.style.setProperty('touch-action', 'none', 'important');
    el.style.setProperty('-webkit-tap-highlight-color', 'transparent', 'important');
  });
})();