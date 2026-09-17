(() => {
  'use strict';

  // Keep the initial debuff reveal useful but non-blocking.
  const style = document.createElement('style');
  style.textContent = `
    .debuffReveal{
      left:14px !important;
      top:14px !important;
      transform:none !important;
      min-width:0 !important;
      width:196px !important;
      max-width:calc(100% - 28px) !important;
      text-align:left !important;
      padding:8px 10px !important;
      border-radius:12px !important;
      background:rgba(8,11,18,.88) !important;
      box-shadow:0 8px 28px rgba(0,0,0,.38) !important;
      pointer-events:none !important;
    }
    .debuffTitle{
      font-size:8px !important;
      letter-spacing:.12em !important;
    }
    .debuffIcons{
      justify-content:flex-start !important;
      gap:6px !important;
      margin:5px 0 !important;
    }
    .debuffIcon{
      width:34px !important;
      height:34px !important;
      border-radius:8px !important;
      font-size:17px !important;
      border-width:1.5px !important;
    }
    .debuffText{
      font-size:13px !important;
      line-height:1.15 !important;
    }
    .debuffTimer{
      font-size:9px !important;
      margin-top:3px !important;
    }
    @media(max-width:700px){
      .debuffReveal{
        left:8px !important;
        top:8px !important;
        width:170px !important;
        padding:6px 8px !important;
      }
      .debuffIcon{width:30px !important;height:30px !important;font-size:15px !important}
      .debuffText{font-size:11px !important}
      .debuffTimer{font-size:8px !important}
    }
  `;
  document.head.appendChild(style);

  // rebuild3 registers its Start handler first. This one runs immediately after it
  // and shortens the reveal without changing the mechanic timeline.
  startBtn.addEventListener('click', () => {
    if (state.phase !== 'running') return;
    state.debuffHideAt = 4.5;
    debuffTimer.textContent = 'Memorize — some em 4.5s';
  });
})();
