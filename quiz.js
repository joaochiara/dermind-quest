
  const TOTAL = 20;

  // Mede a largura da scrollbar nativa do browser (ex: ~15px Chrome, ~0px Safari macOS com trackpad)
  // e calcula o right/width correto do header na screen resultado.
  (function() {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden;';
    document.body.appendChild(d);
    const sbW = d.offsetWidth - d.clientWidth;
    document.body.removeChild(d);
    if (sbW > 0) {
      const right = 12 + sbW;
      document.documentElement.style.setProperty('--header-result-right', right + 'px');
      document.documentElement.style.setProperty('--header-result-width', 'calc(100% - ' + (right + 12) + 'px)');
    }
  })();
  let current = 0;
  const answers = {};

  // Retorna para a screen 24 se o usuário recarregou após câmera bloqueada
  (function checkCameraReturn() {
    const ret = sessionStorage.getItem('dermai_return');
    if (ret === '24') {
      sessionStorage.removeItem('dermai_return');
      // Aguarda DOM pronto para navegar
      document.addEventListener('DOMContentLoaded', function() {
        goTo(24);
      });
      // Fallback caso DOMContentLoaded já tenha disparado
      if (document.readyState !== 'loading') goTo(24);
    }
  })();

  const SCREEN_ORDER_FULL = [
    0,1,2,3,4,5,6,7,'inter1',
    8,9,10,11,12,13,14,15,16,'inter2',
    17,18,19,20,21,22,23,'inter3',24,'scanner',25,26,'aguardando','result'
  ];
  let mistPos = {};
  function rebuildMistPos(order) { mistPos={}; order.forEach((id,i)=>{mistPos[id]=i;}); }
  rebuildMistPos(SCREEN_ORDER_FULL);
  function buildActiveOrder() {
    const rv=answers['q_rotina'], mv=answers['q_maquiagem'],
          av=answers['q_alergia'], ev=answers['q_receita'];
    let rs=[9,10]; if(rv==='matinal')rs=[9]; else if(rv==='noturna')rs=[10]; else if(rv==='nenhuma')rs=[];
    let ms=(mv==='nunca')?[]:[12,13], as=(av==='nao')?[]:[18], es=(ev==='nao')?[]:[20];
    return [0,1,2,3,4,5,6,7,'inter1',8,...rs,11,...ms,14,15,16,'inter2',17,...as,19,...es,21,22,23,'inter3',24,'scanner',25,26,'aguardando','result'];
  }
  function updateMistPath(){rebuildMistPos(buildActiveOrder());}
  function screenIndex(n){return buildActiveOrder().indexOf(n);}
  function isScrollRange(n){const o=buildActiveOrder(),i=o.indexOf(n);return i>=0&&i<=o.indexOf(26);}

  // ── Utilitários de transição inter ─────────────────────────────────
  function _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function _headerExpand() {
    const hdr     = document.querySelector('header');
    const counter = document.getElementById('stepCounter');
    const ov      = document.getElementById('cc-overlay');
    const isMobile = window.innerWidth <= 580;

    // Esconde step counter
    if (counter) { counter.style.transition = 'opacity 0.15s'; counter.style.opacity = '0'; }

    // Posiciona overlay exatamente sobre o header (ponto de partida)
    const rect = hdr.getBoundingClientRect();
    ov.style.transition   = 'none';
    ov.style.top          = rect.top    + 'px';
    ov.style.left         = rect.left   + 'px';
    ov.style.width        = rect.width  + 'px';
    ov.style.height       = rect.height + 'px';
    ov.style.borderRadius = isMobile ? '17px' : '20px';
    ov.style.opacity      = '0';
    ov.classList.remove('cc-fullscreen');
    void ov.offsetHeight;

    // Anima expansão do header até fullscreen
    ov.style.transition =
      'top 0.58s cubic-bezier(0.4,0,0.2,1), ' +
      'left 0.58s cubic-bezier(0.4,0,0.2,1), ' +
      'width 0.58s cubic-bezier(0.4,0,0.2,1), ' +
      'height 0.58s cubic-bezier(0.4,0,0.2,1), ' +
      'border-radius 0.58s cubic-bezier(0.4,0,0.2,1), ' +
      'opacity 0.35s cubic-bezier(0.4,0,0.2,1)';
    ov.style.top          = '0px';
    ov.style.left         = '0px';
    ov.style.width        = window.innerWidth  + 'px';
    ov.style.height       = (window.innerWidth <= 580 ? window.innerHeight + 80 : window.innerHeight) + 'px';
    ov.style.borderRadius = '0px';
    ov.style.opacity      = '1';
    hdr.classList.add('cc-open');
    // Quando chega fullscreen, remove reflexo de bolha do topo
    setTimeout(() => ov.classList.add('cc-fullscreen'), 560);
    return _wait(620);
  }

  function _headerCollapse() {
    const hdr     = document.querySelector('header');
    const counter = document.getElementById('stepCounter');
    const ov      = document.getElementById('cc-overlay');
    const isMobile = window.innerWidth <= 580;
    const margin   = isMobile ? 1 : 12;
    const GEOM_DUR = 500;
    const FADE_DUR = 180;

    // Remove fullscreen, restaura reflexo de bolha antes de recolher
    ov.classList.remove('cc-fullscreen');
    void ov.offsetHeight;

    ov.style.transition =
      'top '           + GEOM_DUR + 'ms cubic-bezier(0.4,0,0.2,1), ' +
      'left '          + GEOM_DUR + 'ms cubic-bezier(0.4,0,0.2,1), ' +
      'width '         + GEOM_DUR + 'ms cubic-bezier(0.4,0,0.2,1), ' +
      'height '        + GEOM_DUR + 'ms cubic-bezier(0.4,0,0.2,1), ' +
      'border-radius ' + GEOM_DUR + 'ms cubic-bezier(0.4,0,0.2,1)';
    ov.style.opacity      = '1';
    ov.style.top          = margin + 'px';
    ov.style.left         = margin + 'px';
    ov.style.width        = (window.innerWidth - margin * 2) + 'px';
    ov.style.height       = hdr.getBoundingClientRect().height + 'px';
    ov.style.borderRadius = isMobile ? '17px' : '20px';
    hdr.classList.remove('cc-open');

    // Fade out após recolher
    setTimeout(() => {
      ov.style.transition = 'opacity ' + FADE_DUR + 'ms ease';
      ov.style.opacity    = '0';
      setTimeout(() => {
        ov.style.transition = 'none';
        ov.classList.remove('cc-fullscreen');
        if (counter) {
          counter.style.transition = 'opacity 0.25s';
          counter.style.opacity    = '1';
          setTimeout(() => { counter.style.transition = ''; }, 280);
        }
        const backBtn = document.getElementById('interblock-back-btn');
        if (backBtn) backBtn.style.display = 'none';
      }, FADE_DUR + 20);
    }, GEOM_DUR);

    return _wait(GEOM_DUR + FADE_DUR);
  }

  function _widgetBox(box, cls, dur) {
    return new Promise(resolve => {
      if (!box) { resolve(); return; }
      box.classList.remove('widget-in', 'widget-out');
      void box.offsetHeight;
      box.classList.add(cls);
      setTimeout(() => { box.classList.remove(cls); resolve(); }, dur);
    });
  }

  function goTo(n) {
    console.log('[GOTO] n='+n+' from='+current);
    // Bloqueia pointer-events em todo o quiz durante a transição
    const _qw = document.querySelector('.quiz-wrap');
    if (_qw) {
      _qw.style.pointerEvents = 'none';
      setTimeout(() => { _qw.style.pointerEvents = ''; }, 800);
    }
    // Cobre também inter-boxes e overlays fora do quiz-wrap
    ['inter1-box','inter2-box','inter3-box','aguardando-overlay','result-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.pointerEvents = 'none';
        setTimeout(() => { el.style.pointerEvents = ''; }, 800);
      }
    });
    // Para o scanner quando sai dele
    if (current === 'scanner' && n !== 'scanner') {
      if (typeof window._stopScanner === 'function') window._stopScanner();
      document.getElementById('scanner-overlay').style.display = 'none';
    }
    // Esconde overlay aguardando ao sair dele
    if (current === 'aguardando' && n !== 'aguardando') {
      const ov = document.getElementById('aguardando-overlay');
      // Se vai para result, o overlay aguardando só some DEPOIS do result aparecer
      // (tratado no bloco n==='result' abaixo). Para outros destinos, esconde já.
      if (ov && n !== 'result') { ov.style.display = 'none'; document.body.style.overflow = ''; }
      const sc = document.getElementById('screen-aguardando');
      if (sc && n !== 'result') sc.classList.remove('active');
    }
    // Esconde overlay resultado ao sair dele
    if (current === 'result' && n !== 'result') {
      const ov = document.getElementById('result-overlay');
      if (ov) { ov.style.display = 'none'; }
      const sc = document.getElementById('screen-result');
      if (sc) sc.classList.remove('active');
      // Oculta botão CTA do header
      const hCta = document.getElementById('headerCta');
      if (hCta) hCta.style.display = 'none';
      document.querySelector('header').classList.remove('result-active');
      // Devolve o footer ao body
      const ft = document.getElementById('site-footer');
      if (ft && ft.parentElement !== document.body) {
        ft.style.width = '';
        ft.style.maxWidth = '';
        document.body.appendChild(ft);
      }
    }
    // Inicia o scanner ao entrar
    if (n === 'scanner') {
      const cur = document.querySelector('.screen.active');
      if (cur) { cur.classList.remove('active'); }
      current = 'scanner';
      updateProgress();
      setTimeout(() => {
        if (typeof window._startScanner === 'function') window._startScanner();
      }, 80);
      return;
    }
    // Mostra overlay resultado (overlay fixo, independente de scroll)
    if (n === 'result') {
      const cur = document.querySelector('.screen.active');
      // Mostra botão CTA no header
      const hCta = document.getElementById('headerCta');
      if (hCta) hCta.style.display = 'inline-block';
      document.querySelector('header').classList.add('result-active');
      document.querySelector('header').classList.remove('aguardando-fadeout');

      // 1. Névoa vai direto para posição final (snap) — o brilho já cobre a tela,
      //    animar o scroll causaria glitch visual ao revelar o resultado
      if (typeof window.goMist === 'function') window.goMist('snap', n);

      // 2. Screen aguardando sai com exit-up
      if (cur) {
        cur.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');
        cur.classList.add('exit-up');
        setTimeout(() => cur.classList.remove('active','exit-up'), 370);
      }

      // 3. Footer desce
      const _ftEl = document.getElementById('site-footer');
      if (_ftEl) {
        _ftEl.classList.add('footer-ready');
        _ftEl.classList.remove('footer-hiding','footer-entering');
        _ftEl.classList.add('footer-hiding');
        setTimeout(() => {
          _ftEl.classList.remove('footer-hiding');
          _ftEl.classList.add('footer-entering');
          setTimeout(() => _ftEl.classList.remove('footer-entering'), 450);
        }, 320);
      }

      // Vindo de 'aguardando', o brilho já cobre tudo — sem delay
      const delay = (current === 'aguardando') ? 0 : (cur ? 300 : 0);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const ov = document.getElementById('result-overlay');
        const sc = document.getElementById('screen-result');
        // Move o footer para dentro do overlay antes de exibi-lo,
        // para que role junto com o conteúdo do resultado
        const ft = document.getElementById('site-footer');
        if (ft && ov && ft.parentElement !== ov) {
          ft.style.width = '100%';
          ft.style.maxWidth = 'none';
          ov.appendChild(ft);
        }
        // Mostra result-overlay e esconde aguardando-overlay no mesmo frame,
        // eliminando o flash de fundo entre os dois overlays
        if (ov) { ov.style.display = 'flex'; ov.scrollTop = 0; }
        const aguardOv = document.getElementById('aguardando-overlay');
        if (aguardOv) { aguardOv.style.display = 'none'; document.body.style.overflow = ''; }
        const aguardSc = document.getElementById('screen-aguardando');
        if (aguardSc) aguardSc.classList.remove('active');
        if (sc) {
          sc.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');
          sc.classList.add('active', 'enter-fade');
          setTimeout(() => {
            sc.classList.remove('enter-fade');
          }, 400);
        }
        current = 'result';
        updateProgress();
      }, delay);

      return;
    }
    // Mostra overlay aguardando (overlay fixo, independente de scroll)
    if (n === 'aguardando') {
      const cur = document.querySelector('.screen.active');

      // 1. Névoa
      if (typeof window.goMist === 'function') window.goMist('up', n);

      // 2. Screen 26 sai com exit-up (igual ao padrão do scroll range)
      if (cur) {
        cur.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');
        cur.classList.add('exit-up');
        setTimeout(() => cur.classList.remove('active','exit-up'), 370);
      }

      // 3. Footer desce
      const _ftEl = document.getElementById('site-footer');
      if (_ftEl) {
        _ftEl.classList.add('footer-ready');
        _ftEl.classList.remove('footer-hiding','footer-entering');
        _ftEl.classList.add('footer-hiding');
      }

      const delay = cur ? 300 : 0;
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const ov = document.getElementById('aguardando-overlay');
        const sc = document.getElementById('screen-aguardando');
        if (ov) { ov.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
        if (sc) {
          sc.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');
          sc.classList.add('active', 'enter-fade');
          setTimeout(() => {
            sc.classList.remove('enter-fade');
            if (typeof runScreenTypewriter === 'function') runScreenTypewriter(sc);
          }, 400);
        }
        current = 'aguardando';
        updateProgress();
        // Reset visual das pílulas antes de animar
        ['ls1','ls2','ls3','ls4','ls5'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove('filling','filled','active','done');
        });
        // Reset opacidade dos wrappers
        ['pfw1','pfw2','pfw3','pfw4','pfw5'].forEach(id => {
          const w = document.getElementById(id);
          if (w) { w.style.opacity = '0'; w.style.transition = ''; }
        });
        if (typeof window._startAguardandoAnim === 'function') window._startAguardandoAnim();
      }, delay);

      return;
    }
    const goingToInter    = (n === 'inter1' || n === 'inter2' || n === 'inter3');
    const comingFromInter = (current === 'inter1' || current === 'inter2' || current === 'inter3');
    if (goingToInter)    { _goToInterEnter(n); return; }
    if (comingFromInter) { _goToInterExit(n);  return; }
    _goToNormal(n);
  }

  // ── Entrada na inter: exit-up → header expande → widget in ──────────
  async function _goToInterEnter(n) {
    if (n === 7) loadLocationData();
    const cur     = document.querySelector('.screen.active');
    const forward = screenIndex(n) > screenIndex(current);

    // Determina o box pelo ID (fora do quiz-wrap)
    const boxId = (n === 'inter1') ? 'inter1-box' : (n === 'inter2') ? 'inter2-box' : 'inter3-box';
    const box   = document.getElementById(boxId);

    // 1. Screen atual sai (exit-up) + névoa + footer desce
    if (cur) {
      cur.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');
      cur.classList.add('exit-up');
    }
    const _ftEl = document.getElementById('site-footer');
    if (_ftEl) {
      _ftEl.classList.add('footer-ready');
      _ftEl.classList.remove('footer-hiding', 'footer-entering');
      _ftEl.classList.add('footer-hiding');
    }
    window.mistInterMode = true;
    if (typeof window.goMist === 'function') window.goMist('up', n);

    await _wait(250);
    if (cur) cur.classList.remove('active', 'exit-up', 'exit-down', 'exit-fade');

    // 2. Painel expande (Control Center)
    await _headerExpand();

    // 3. Ativa inter screen (marcador de estado); box oculto
    const next = document.getElementById('screen-' + n);
    if (!next) { _headerCollapse(); return; }
    if (box) {
      box.style.display    = 'block';
      box.style.opacity    = '0';
      box.style.transform  = 'translate(-50%,-50%) scale(0.78)';
      box.style.transition = 'none';
    }
    next.classList.add('active');
    current = n;
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.style.overflow = 'hidden';

    await _wait(60);

    // 4. Widget in
    if (box) {
      box.style.opacity    = '';
      box.style.transform  = '';
      box.style.transition = '';
    }
    await _widgetBox(box, 'widget-in', 540);

    // 5. Pós-entrada: float, steps, back button, badges
    if (typeof window._floatCollect === 'function') window._floatCollect(next, forward);
    if (typeof startInterblockBoxFloat === 'function') startInterblockBoxFloat(box);
    if (box) {
      box.querySelectorAll('video').forEach(function(v) {
        v.currentTime = 0;
        var p = v.play();
        if (p && typeof p.catch === 'function') p.catch(function(){});
      });
    }
    box && box.querySelectorAll('.interblock-step').forEach(el => {
      el.style.opacity = '1'; el.style.transition = ''; el.style.transform = '';
    });
    const backBtn  = document.getElementById('interblock-back-btn');
    if (backBtn) {
      const dest = n === 'inter1' ? 7 : n === 'inter2' ? 16 : 23;
      backBtn.onclick = () => goTo(dest);
      backBtn.style.display = 'flex';
    }
    const counter = document.getElementById('stepCounter');
    if (counter) counter.style.opacity = '0';
    box && box.querySelectorAll('.interblock-badge').forEach(b => {
      b.classList.add('badge-visible');
      b.classList.remove('sub-visible');
      void b.offsetHeight;
      setTimeout(() => b.classList.add('sub-visible'), 200);
    });
  }

  // ── Saída da inter: widget out → painel recolhe + screen entra simultaneamente ──
  async function _goToInterExit(n) {
    if (n === 7) loadLocationData();
    const cur     = document.querySelector('.screen.active');
    const forward = screenIndex(n) > screenIndex(current);

    const boxId = (current === 'inter1') ? 'inter1-box' : (current === 'inter2') ? 'inter2-box' : 'inter3-box';
    const box   = document.getElementById(boxId);

    // Esconde back button
    const bw = document.getElementById('interblock-back-btn');
    if (bw) { bw.style.display = 'none'; }

    // 1. Widget some
    await _widgetBox(box, 'widget-out', 400);
    if (box) box.style.display = 'none';
    document.body.style.overflow = '';
    if (cur) cur.classList.remove('active');

    // 2. Prepara próxima screen
    const next = document.getElementById('screen-' + n);
    if (!next) return;
    const selector = '.option, .input-wrap, #city-box, .interblock-step, .photo-slot';
    next.querySelectorAll(selector).forEach(el => { el.style.opacity = '0'; el.style.transition = ''; el.style.pointerEvents = 'none'; });
    const tipWrap = next.querySelector('#photo-tip-wrap, #scanner-tip-wrap');
    if (tipWrap) {
      if (n === 24) {
        tipWrap.classList.remove('genius-open');
      } else {
        tipWrap.style.transition = 'none'; tipWrap.style.height = '0';
      }
    }
    // updateScreen24State antes de ativar — evita reflow após entrada
    if (n === 24) updateScreen24State();
    next.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');

    // 3. Névoa salta para posição destino; próxima screen aparece enquanto overlay recolhe
    window.mistInterMode = false;
    if (typeof window.goMist === 'function') window.goMist('snap', n);

    // Footer entra de baixo para cima junto com a próxima screen
    const _ftEl2 = document.getElementById('site-footer');
    if (_ftEl2) {
      _ftEl2.classList.add('footer-ready');
      _ftEl2.classList.remove('footer-hiding', 'footer-entering');
      _ftEl2.classList.add('footer-entering');
      setTimeout(() => _ftEl2.classList.remove('footer-entering'), 450);
    }

    // Inicia o colapso e mostra a próxima screen simultaneamente
    _headerCollapse();
    next.classList.add('active', 'enter-fade');
    current = n;
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'instant' });
    await _wait(100);

    // Typewriter inicia imediatamente com a entrada da screen (igual screens 8 e 17)
    if (typeof runScreenTypewriter === 'function') runScreenTypewriter(next);

    // 4. Pós-entrada — espera a animação de entrada terminar
    await _wait(420);
    next.classList.remove('enter-fade');
    if (typeof window._floatCollect === 'function') window._floatCollect(next, forward);
    if (n === 0 && typeof window._floatResetScreen0 === 'function') window._floatResetScreen0(forward);

    // Reveal do hint — sempre direto, independente do floatCollect
    const hint = next.querySelector('.screen-hint');
    if (hint) { hint.classList.remove('sub-visible'); void hint.offsetHeight; setTimeout(() => hint.classList.add('sub-visible'), 200); }
    const mhint = next.querySelector('.multi-hint');
    if (mhint) { mhint.classList.remove('sub-visible'); void mhint.offsetHeight; setTimeout(() => mhint.classList.add('sub-visible'), 260); }

    // Reveal do tipWrap — screen 24 usa genius-open, outras usam height dinâmico
    const tipWrap2 = next.querySelector('#photo-tip-wrap, #scanner-tip-wrap');
    if (tipWrap2) {
      if (n === 24) {
        setTimeout(() => tipWrap2.classList.add('genius-open'), 300);
      } else {
        setTimeout(() => {
          tipWrap2.style.height = 'auto';
          const h = tipWrap2.scrollHeight;
          tipWrap2.style.height = '0';
          void tipWrap2.offsetHeight;
          tipWrap2.style.transition = 'height 0.45s cubic-bezier(0.4,0,0.2,1)';
          tipWrap2.style.height = h + 'px';
        }, 400);
      }
    }
  }

  // ── Transição normal (sem inter) ────────────────────────────────────
  function _goToNormal(n) {
    if (n === 7) loadLocationData();
    if (n === 0 && current !== 0) {
      [1,2,3].forEach(i => {
        const w = document.getElementById('intro-dot-'+i)?.closest('.interblock-dot-wrap');
        if (w) { w.style.opacity = '0'; w.style.transition = ''; }
      });
    }
    const cur       = document.querySelector('.screen.active');
    const forward   = screenIndex(n) > screenIndex(current);
    const useScroll = isScrollRange(current) && isScrollRange(n);
    const idxDiff   = Math.abs(screenIndex(n) - screenIndex(current));

    // ── Animação do footer: desce ao sair, sobe ao entrar ──
    const _ftEl = document.getElementById('site-footer');
    if (_ftEl) {
      _ftEl.classList.add('footer-ready');
      _ftEl.classList.remove('footer-hiding', 'footer-entering');
      _ftEl.classList.add('footer-hiding');
      setTimeout(() => {
        _ftEl.classList.remove('footer-hiding');
        _ftEl.classList.add('footer-entering');
        setTimeout(() => _ftEl.classList.remove('footer-entering'), 450);
      }, 320);
    }

    if (typeof window.goMist === 'function') {
      if (!useScroll) {
        window.goMist('fade', 0);
      } else if (idxDiff > 1) {
        window.goMist('snap', n);
      } else {
        window.goMist(forward ? 'up' : 'down', n);
      }
    }
    if (cur) {
      cur.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');
      cur.classList.add(useScroll ? (forward ? 'exit-up' : 'exit-down') : 'exit-fade');
      setTimeout(() => cur.classList.remove('active','exit-up','exit-down','exit-fade'), 370);
    }
    const delay = cur ? 300 : 0;
    setTimeout(() => {
      const next = document.getElementById('screen-' + n);
      if (!next) return;
      // Prepara estado ANTES de ativar — evita flash de posição
      if (n !== 0) {
        const sel = next.classList.contains('interblock')
          ? '.option, .input-wrap, #city-box, .photo-slot'
          : '.option, .input-wrap, #city-box, .interblock-step, .photo-slot';
        next.querySelectorAll(sel).forEach(el => { el.style.opacity = '0'; el.style.transition = ''; el.style.pointerEvents = 'none'; });
      }
      const tipWrap = next.querySelector('#photo-tip-wrap, #scanner-tip-wrap');
      if (tipWrap) {
        if (n === 24) {
          tipWrap.classList.remove('genius-open');
        } else {
          tipWrap.style.transition = 'none'; tipWrap.style.height = '0';
        }
      }
      // updateScreen24State antes de ativar — evita reflow após entrada
      if (n === 24) updateScreen24State();
      next.classList.remove('enter-up','enter-down','enter-fade','exit-up','exit-down','exit-fade');
      next.classList.add('active', useScroll ? (forward ? 'enter-up' : 'enter-down') : 'enter-fade');
      current = n;
      updateProgress();
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        next.classList.remove('enter-up','enter-down','enter-fade');
        if (typeof window._floatCollect === 'function') window._floatCollect(next, forward);
        if (typeof runScreenTypewriter === 'function' && !next.classList.contains('interblock')) runScreenTypewriter(next);
        if (next.classList.contains('interblock') && typeof startInterblockBoxFloat === 'function') startInterblockBoxFloat(next);
        if (next.classList.contains('interblock')) {
          next.querySelectorAll('video').forEach(function(v) {
            v.currentTime = 0;
            var p = v.play();
            if (p && typeof p.catch === 'function') p.catch(function(){});
          });
        }
        if (n === 0 && typeof window._floatResetScreen0 === 'function') window._floatResetScreen0(forward);
        const hint = next.querySelector('.screen-hint');
        if (hint) { hint.classList.remove('sub-visible'); void hint.offsetHeight; setTimeout(() => hint.classList.add('sub-visible'), 180); }
        const mhint = next.querySelector('.multi-hint');
        if (mhint) { mhint.classList.remove('sub-visible'); void mhint.offsetHeight; setTimeout(() => mhint.classList.add('sub-visible'), 240); }
        // Reveal do tipWrap — screen 24 usa genius-open, outras usam height dinâmico
        const tw = next.querySelector('#photo-tip-wrap, #scanner-tip-wrap');
        if (tw) {
          if (n === 24) {
            setTimeout(() => tw.classList.add('genius-open'), 200);
          } else {
            tw.style.height = 'auto';
            const h = tw.scrollHeight;
            tw.style.height = '0';
            void tw.offsetHeight;
            tw.style.transition = 'height 0.45s cubic-bezier(0.4,0,0.2,1)';
            tw.style.height = h + 'px';
          }
        }
      }, 500);
    }, delay);
  }

  function updateProgress() {
    const fill    = document.getElementById('progressFill');
    const counter = document.getElementById('stepCounter');
    // A partir da inter3, barra fica 100% e counter some
    const FULL_FROM_INTER3 = ['inter3', 24, 'scanner', 'aguardando', 'result'];
    if (current === 'inter1') {
      fill.style.width = ((7 / 23) * 100) + '%';
      counter.textContent = '';
    } else if (current === 'inter2') {
      fill.style.width = ((16 / 23) * 100) + '%';
      counter.textContent = '';
    } else if (FULL_FROM_INTER3.includes(current)) {
      fill.style.width = '100%';
      counter.textContent = '';
    } else if (current === 25) {
      fill.style.width = '100%';
      counter.textContent = 'Penúltimo passo';
    } else if (current === 26) {
      fill.style.width = '100%';
      counter.textContent = 'Último passo';
    } else if (typeof current === 'number' && current >= 1) {
      const LABELS = {
        1:'1', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7',
        8:'8', 9:'8.1', 10:'8.2', 11:'9', 12:'9.1', 13:'9.2',
        14:'10', 15:'11', 16:'12', 17:'13', 18:'13.1',
        19:'14', 20:'14.1', 21:'15', 22:'16', 23:'17',
      };
      fill.style.width = Math.min((current / 23) * 100, 100) + '%';
      counter.innerHTML = LABELS[current] ? (LABELS[current].includes(' ') ? LABELS[current] : 'Passo ' + LABELS[current]) : '';
    } else {
      fill.style.width = current === 0 ? '0%' : '100%';
      counter.textContent = '';
    }
  }

  function enableNext7() {
    const btn = document.getElementById('next-7');
    if (btn) btn.disabled = false;
    const cityBox = document.getElementById('city-box');
    if (cityBox) cityBox.classList.add('selected');
  }

  function checkAlergiaForm() {
    const val = document.getElementById('inputAlergia').value.trim();
    document.getElementById('next-18').disabled = val.length < 2;
  }

  function checkReceitaForm() {
    const val = document.getElementById('inputReceita').value.trim();
    document.getElementById('next-20').disabled = val.length < 2;
  }

  function selectRotinaOption(el, val) {
    document.getElementById('q_rotina').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    answers['q_rotina'] = val;

    // Define rotas condicionais
    // matinal_noturna: 8→9→10→11
    // matinal:         8→9→11  (pula 10)
    // noturna:         8→10→11 (pula 9)
    // nenhuma:         8→11    (pula 9 e 10)
    if (val === 'matinal_noturna') {
      window._rotinaNext   = 9;   // next-8 → 9
      window._rotina9Next  = 10;  // next-9 → 10
      window._rotina10Back = 9;   // back-10 → 9
      window._rotina11Back = 10;  // back-11 → 10
    } else if (val === 'matinal') {
      window._rotinaNext   = 9;   // next-8 → 9
      window._rotina9Next  = 11;  // next-9 → 11 (pula 10)
      window._rotina10Back = 9;   // (não usado)
      window._rotina11Back = 9;   // back-11 → 9
    } else if (val === 'noturna') {
      window._rotinaNext   = 10;  // next-8 → 10 (pula 9)
      window._rotina9Next  = 10;  // (não usado)
      window._rotina10Back = 8;   // back-10 → 8
      window._rotina11Back = 10;  // back-11 → 10
    } else { // nenhuma
      window._rotinaNext   = 11;  // next-8 → 11 (pula 9 e 10)
      window._rotina9Next  = 11;  // (não usado)
      window._rotina10Back = 8;   // (não usado)
      window._rotina11Back = 8;   // back-11 → 8
    }

    updateMistPath();
    document.getElementById('next-8').disabled = false;
    setTimeout(() => goTo(window._rotinaNext || 9), 220);
  }

  function selectMaquiagemOption(el, val) {
    document.getElementById('q_maquiagem').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    answers['q_maquiagem'] = val;
    // Nunca: pula 12 e 13, vai direto para 14
    window._maquiagemNext = (val === 'nunca') ? 14 : 12;
    updateMistPath();
    document.getElementById('next-11').disabled = false;
    setTimeout(() => goTo(window._maquiagemNext || 12), 220);
  }

  function selectAlergiaOption(el, val) {
    document.getElementById('q_alergia').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    answers['q_alergia'] = val;
    // Não: pula 18 (lista alergia), vai direto para 19
    window._alergiaNext = (val === 'nao') ? 19 : 18;
    updateMistPath();
    document.getElementById('next-17').disabled = false;
    setTimeout(() => goTo(window._alergiaNext || 18), 220);
  }

  function selectReceitaOption(el, val) {
    document.getElementById('q_receita').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    answers['q_receita'] = val;
    // Não: pula 20 (lista receita), vai direto para 21
    window._receitaNext = (val === 'nao') ? 21 : 20;
    updateMistPath();
    document.getElementById('next-19').disabled = false;
    setTimeout(() => goTo(window._receitaNext || 20), 220);
  }

  function selectOption(el, gid, val) {
    document.getElementById(gid).querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    answers[gid] = val || el.querySelector('.opt-label').textContent;
    const sn = el.closest('.screen').dataset.screen;
    const btn = document.getElementById('next-' + sn);
    if (btn) btn.disabled = false;

    // Screens de escolha única que avançam automaticamente
    const autoAdvanceScreens = {
      '1':  2,
      '5':  6,
      '6':  7,
      '12': 13,
      '14': 15,
      '15': 16,
      '16': 'inter2',
      '21': 22,
      '23': 'inter3',
      '25': 26,
    };
    if (autoAdvanceScreens[sn] !== undefined) {
      setTimeout(() => goTo(autoAdvanceScreens[sn]), 220);
    }
  }

  function updateScreen24State() {
    const approved = answers['scanner_captures'] && Object.keys(answers['scanner_captures']).length > 0;
    const slot     = document.getElementById('slot-scanner');
    const icon     = document.getElementById('slot-scanner-icon');
    const label    = document.getElementById('slot-scanner-label');
    const btn      = document.getElementById('next-24');
    if (!slot || !icon || !label || !btn) return;

    if (approved) {
      // Estado aprovado: visual diferente, não clicável
      icon.textContent       = '🤳';
      icon.style.background  = 'var(--wine-light)';
      label.innerHTML        = 'Escaneamento aprovado';
      slot.onclick           = null;
      slot.style.cursor      = 'default';
      slot.classList.add('has-photo');
      slot.classList.remove('scanner-approved');
      btn.style.display      = '';
    } else {
      // Estado inicial: clicável
      icon.textContent       = '📸';
      icon.style.background  = 'var(--ivory-dark)';
      label.innerHTML        = 'Clique aqui<br>para usar o scanner';
      slot.onclick           = () => goTo('scanner');
      slot.style.cursor      = 'pointer';
      slot.classList.remove('has-photo');
      slot.classList.remove('scanner-approved');
      btn.style.display      = 'none';
    }
  }

  function toggleMulti(el, gid, excl) {
    const parent = document.getElementById(gid);
    if (excl === 'none') {
      parent.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    } else {
      const none = parent.querySelector('[onclick*="none"]');
      if (none) none.classList.remove('selected');
      el.classList.toggle('selected');
    }
    const sel = parent.querySelectorAll('.option.selected');
    const sn  = el.closest('.screen').dataset.screen;
    const btn = document.getElementById('next-' + sn);
    if (btn) btn.disabled = sel.length === 0;
    answers[gid] = Array.from(sel).map(o => o.querySelector('.opt-label').textContent);
  }

  function checkFormNew() {
    const nome  = document.getElementById('inputNomeNew').value.trim();
    const idade = parseInt(document.getElementById('inputIdadeNew').value.trim());
    document.getElementById('next-4-new').disabled = !(nome.length > 2 && idade >= 11 && idade <= 99);
  }
  function formatPhone(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 2)        input.value = v.length ? '(' + v : '';
    else if (v.length <= 6)   input.value = '(' + v.slice(0,2) + ') ' + v.slice(2);
    else if (v.length <= 10)  input.value = '(' + v.slice(0,2) + ') ' + v.slice(2,6) + '-' + v.slice(6);
    else                      input.value = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
  }

  function checkForm() {
    const tel   = document.getElementById('inputTelefone').value.replace(/\D/g, '');
    const email = document.getElementById('inputEmail').value.trim();
    const DDDS_VALIDOS = new Set([
      11,12,13,14,15,16,17,18,19, // SP
      21,22,24,                   // RJ
      27,28,                      // ES
      31,32,33,34,35,37,38,       // MG
      41,42,43,44,45,46,          // PR
      47,48,49,                   // SC
      51,53,54,55,                // RS
      61,                         // DF
      62,64,                      // GO
      63,                         // TO
      65,66,                      // MT
      67,                         // MS
      68,                         // AC
      69,                         // RO
      71,73,74,75,77,             // BA
      79,                         // SE
      81,87,                      // PE
      82,                         // AL
      83,                         // PB
      84,                         // RN
      85,88,                      // CE
      86,89,                      // PI
      91,93,94,                   // PA
      92,97,                      // AM
      95,                         // RR
      96,                         // AP
      98,99                       // MA
    ]);
    const ddd = parseInt(tel.slice(0, 2), 10);
    const dddOk    = tel.length >= 2 && DDDS_VALIDOS.has(ddd);
    const telOk    = tel.length === 11 && dddOk;
    const emailOk  = email.includes('@') && email.includes('.');
    document.getElementById('next-26').disabled = !(telOk && emailOk);
  }

  function previewPhoto(input, slotId) {
    const slot = document.getElementById(slotId);
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      let img = slot.querySelector('img');
      if (!img) { img = document.createElement('img'); slot.appendChild(img); }
      img.src = e.target.result;
      slot.classList.add('has-photo');
      ['slot-icon','slot-label'].forEach(c => {
        const el = slot.querySelector('.' + c);
        if (el) el.style.display = 'none';
      });
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(e, slotId) {
    e.stopPropagation();
    const slot = document.getElementById(slotId);
    const img = slot.querySelector('img');
    if (img) img.remove();
    slot.classList.remove('has-photo');
    ['slot-icon','slot-label'].forEach(c => {
      const el = slot.querySelector('.' + c);
      if (el) el.style.display = '';
    });
    const inp = slot.querySelector('input');
    if (inp) inp.value = '';
  }

  // ── CATÁLOGO DE PRODUTOS ──────────────────────────────────────────────────
  const CATALOGO = [{"marca":"Adcos","produtos":[{"nome":"Protetor Solar Pó Compacto com Ácido Hialurônico","categoria":"protetor solar","ativos":["Ácido Hialurônico","Filtros UV FPS 50"],"preco":249.0,"disponivel":true,"urlProduto":"https://www.lojaadcos.com.br/protetor-solar-tonalizante-fps50-pocompacto-acido-hialuronico/p","urlImagem":"./imagens/produtos/001.jpg"},{"nome":"Collagen Filler Up - Creme Anti-idade","categoria":"hidratante","ativos":["Colágeno","Ácido Hialurônico","Peptídeos"],"preco":389.0,"disponivel":true,"urlProduto":"https://www.lojaadcos.com.br/collagen-filler-up/p","urlImagem":"./imagens/produtos/002.jpg"},{"nome":"Protetor Solar Stick Tonalizante","categoria":"protetor solar","ativos":["Filtros UV FPS 80"],"preco":149.0,"disponivel":true,"urlProduto":"https://www.lojaadcos.com.br/protetor-solar-stick-fps80/p","urlImagem":"./imagens/produtos/003.jpg"},{"nome":"Protetor Solar Aqua Fluid","categoria":"protetor solar","ativos":["Filtros UV FPS 50","Ácido Hialurônico"],"preco":149.0,"disponivel":true,"urlProduto":"https://www.lojaadcos.com.br/protetor-solar-aqua-fluid-fps50/p","urlImagem":"./imagens/produtos/004.jpg"},{"nome":"Protetor Solar Mousse Tonalizante - Mineral","categoria":"protetor solar","ativos":["Filtros Minerais FPS 50","Dióxido de Titânio","Óxido de Zinco"],"preco":179.0,"disponivel":true,"urlProduto":"https://www.lojaadcos.com.br/protetor-solar-mousse-tonalizante-fps50-mineral/p","urlImagem":"./imagens/produtos/005.jpg"},{"nome":"Acne Solution Fluido Ultra Secativo - Renovação Cutânea","categoria":"tratamento","ativos":["Ácido Salicílico","Niacinamida","Enxofre"],"preco":189.0,"disponivel":true,"urlProduto":"https://www.lojaadcos.com.br/acne-solution-fluido-ultra-secativo/p","urlImagem":"./imagens/produtos/006.jpg"},{"nome":"Hyalu 6 Aqua Face e Olhos","categoria":"sérum","ativos":["6 tipos de Ácido Hialurônico","Peptídeos"],"preco":269.0,"disponivel":true,"urlProduto":"https://www.lojaadcos.com.br/hyalu-6-aqua-face-e-olhos/p","urlImagem":"./imagens/produtos/007.jpg"}]},{"marca":"Bioderma","produtos":[{"nome":"Sensibio H2O - Água Micelar Calmante","categoria":"limpeza","ativos":["Solução Micelar","Cucumber Extract"],"preco":134.9,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/sensibio/agua-micelar-sensibio-h2o","urlImagem":"./imagens/produtos/008.jpg"},{"nome":"Sébium H2O Antioleosidade - Água Micelar","categoria":"limpeza","ativos":["Solução Micelar","Fluidactiv","Zinco"],"preco":134.9,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/sebium/agua-micelar-sebium-h2o","urlImagem":"./imagens/produtos/009.jpg"},{"nome":"Sébium Gel Moussant - Gel de Limpeza Antioleosidade","categoria":"limpeza","ativos":["Fluidactiv","Zinco"],"preco":44.9,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/sebium/gel-de-limpeza-sebium-gel-moussant","urlImagem":"./imagens/produtos/010.jpg"},{"nome":"Sensibio Gel Moussant - Gel de Limpeza Micelar Calmante","categoria":"limpeza","ativos":["Solução Micelar"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/sensibio/gel-de-limpeza-sensibio-gel-moussant","urlImagem":"./imagens/produtos/011.jpg"},{"nome":"Hydrabio - Sérum Facial Hidratante e Fortalecedor","categoria":"sérum","ativos":["Ácido Hialurônico","Mannitol"],"preco":169.9,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/hydrabio/serum-hydrabio","urlImagem":"./imagens/produtos/012.jpg"},{"nome":"Photoderm XDefense Invisible","categoria":"protetor solar","ativos":["Filtros UV FPS 50+","Mexoryl XL"],"preco":93.9,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/photoderm/protetor-solar-photoderm-xdefense-spf50plus","urlImagem":"./imagens/produtos/013.jpg"},{"nome":"Cicabio Crème - Creme Hidratante Reparador","categoria":"hidratante","ativos":["Mannitol","Zinco","Vitamina PP"],"preco":105.0,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/cicabio/creme-cicabio","urlImagem":"./imagens/produtos/014.jpg"},{"nome":"Atoderm Intensive Baume - Bálsamo Multirreparador","categoria":"hidratante","ativos":["Niacinamida","Glicerina"],"preco":178.51,"disponivel":true,"urlProduto":"https://www.biodermabrasil.com/skincare/atoderm/baume-atoderm-intensive","urlImagem":"./imagens/produtos/015.jpg"}]},{"marca":"CeraVe","produtos":[{"nome":"Espuma Cremosa de Limpeza Hidratante","categoria":"limpeza","ativos":["3 Ceramidas","Ácido Hialurônico","Niacinamida"],"preco":59.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/limpeza-facial/espuma-cremosa-de-limpeza-hidratante","urlImagem":"./imagens/produtos/016.jpg"},{"nome":"Gel de Limpeza Acne Control","categoria":"limpeza","ativos":["Ácido Salicílico 2%","3 Ceramidas","Niacinamida"],"preco":59.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/limpeza-facial/gel-de-limpeza-acne-control","urlImagem":"./imagens/produtos/017.jpg"},{"nome":"Espuma de Limpeza Air Foam Reequilibrante","categoria":"limpeza","ativos":["3 Ceramidas","Niacinamida","Ácido Hialurônico"],"preco":64.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/limpeza-facial/espuma-de-limpeza-air-foam-reequilibrante","urlImagem":"./imagens/produtos/018.jpg"},{"nome":"SA Gel de Limpeza Renovador","categoria":"limpeza","ativos":["Ácido Salicílico","3 Ceramidas","Niacinamida"],"preco":59.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/limpeza-facial/sa-gel-de-limpeza-renovador","urlImagem":"./imagens/produtos/019.jpg"},{"nome":"Loção Facial Hidratante","categoria":"hidratante","ativos":["3 Ceramidas","Ácido Hialurônico","Niacinamida"],"preco":79.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/hidratantes-faciais/locao-facial-hidratante","urlImagem":"./imagens/produtos/020.jpg"},{"nome":"Loção Facial Hidratante com Protetor Solar","categoria":"hidratante","ativos":["3 Ceramidas","Ácido Hialurônico","Niacinamida","FPS 50"],"preco":89.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/hidratantes-faciais/locao-facial-hidratante-fps50","urlImagem":"./imagens/produtos/021.jpg"},{"nome":"Loção Facial Oil Control","categoria":"hidratante","ativos":["3 Ceramidas","Niacinamida","Ácido Hialurônico"],"preco":79.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/hidratantes-faciais/locao-facial-oil-control","urlImagem":"./imagens/produtos/022.jpg"},{"nome":"Creme Reparador para Olhos","categoria":"contorno dos olhos","ativos":["3 Ceramidas","Ácido Hialurônico","Niacinamida","Cafeína"],"preco":109.9,"disponivel":true,"urlProduto":"https://www.cerave.com.br/todos-os-produtos/hidratantes-faciais/creme-reparador-para-olhos","urlImagem":"./imagens/produtos/023.jpg"}]},{"marca":"Creamy","produtos":[{"nome":"Gel-creme Hidratante Calmante - Calming Cream","categoria":"hidratante","ativos":["Ceramidas","Centella Asiática","Pantenol"],"preco":52.62,"disponivel":true,"urlProduto":"https://www.creamy.com.br/creamy-calming-cream-1/p","urlImagem":"./imagens/produtos/024.jpg"},{"nome":"Sérum Anti-idade - Retinal","categoria":"sérum","ativos":["Retinal 0.05%","Vitamina E","Esqualano"],"preco":115.71,"disponivel":true,"urlProduto":"https://www.creamy.com.br/serum-facial-anti-aging-retinal-30-g/p","urlImagem":"./imagens/produtos/025.jpg"},{"nome":"Sérum Antioxidante - Vitamina C","categoria":"sérum","ativos":["Vitamina C 15%","Ácido Ferúlico","Vitamina E"],"preco":105.25,"disponivel":true,"urlProduto":"https://www.creamy.com.br/vitamina-c/p","urlImagem":"./imagens/produtos/026.jpg"},{"nome":"Sérum Antioxidante Clareador - Vitamina C Gold","categoria":"sérum","ativos":["Vitamina C Gold","Ácido Kójico","Niacinamida"],"preco":115.71,"disponivel":true,"urlProduto":"https://www.creamy.com.br/vitamina-c-gold/p","urlImagem":"./imagens/produtos/027.jpg"},{"nome":"Protetor Solar Watery Lotion","categoria":"protetor solar","ativos":["Filtros UV FPS 60","Niacinamida","Vitamina E"],"preco":126.16,"disponivel":true,"urlProduto":"https://www.creamy.com.br/protetor-solar-fps60-watery-lotion/p","urlImagem":"./imagens/produtos/028.jpg"},{"nome":"Tônico Antioleosidade - Ácido Salicílico","categoria":"tônico","ativos":["Ácido Salicílico 2%","Niacinamida","Pantenol"],"preco":83.9,"disponivel":true,"urlProduto":"https://www.creamy.com.br/acido-salicilico-1/p","urlImagem":"./imagens/produtos/029.jpg"},{"nome":"Limpador Facial Antioleosidade","categoria":"limpeza","ativos":["Ácido Salicílico","Zinco","Glicerina"],"preco":94.28,"disponivel":true,"urlProduto":"https://www.creamy.com.br/limpador-facial-antioleosidade-1/p","urlImagem":"./imagens/produtos/030.jpg"},{"nome":"Pore Refiner - Suavizador de Poros","categoria":"sérum","ativos":["Niacinamida 10%","Ácido Hialurônico","Zinco"],"preco":94.28,"disponivel":true,"urlProduto":"https://www.creamy.com.br/pore-refiner/p","urlImagem":"./imagens/produtos/031.jpg"},{"nome":"Creme Clareador para Olhos","categoria":"contorno dos olhos","ativos":["Vitamina C","Retinol","Cafeína","Ácido Hialurônico"],"preco":136.83,"disponivel":true,"urlProduto":"https://www.creamy.com.br/eye-cream/p","urlImagem":"./imagens/produtos/032.jpg"},{"nome":"Retinol - Creme Corretivo Antissinais","categoria":"sérum","ativos":["Retinol 1%","Vitamina E","Esqualano"],"preco":105.25,"disponivel":true,"urlProduto":"https://www.creamy.com.br/retinol/p","urlImagem":"./imagens/produtos/033.jpg"},{"nome":"Creme Firmador Anti-idade - Peptide Cream","categoria":"hidratante","ativos":["Peptídeos","Ácido Hialurônico","Ceramidas"],"preco":199.99,"disponivel":true,"urlProduto":"https://www.creamy.com.br/peptide-cream/p","urlImagem":"./imagens/produtos/034.jpg"},{"nome":"Ceramide Skin Repair","categoria":"hidratante","ativos":["Ceramidas","Pantenol","Centella Asiática"],"preco":94.28,"disponivel":true,"urlProduto":"https://www.creamy.com.br/ceramide-skin-repair/p","urlImagem":"./imagens/produtos/035.jpg"}]},{"marca":"Eucerin","produtos":[{"nome":"Hyaluron-Filler 3x Effect Sérum","categoria":"sérum","ativos":["Ácido Hialurônico","Pro-Retinol"],"preco":219.9,"disponivel":true,"urlProduto":"https://www.eucerin.com.br/products/hyaluron-filler/hyaluron-filler-3x-effect-serum","urlImagem":"./imagens/produtos/036.jpg"},{"nome":"DermoPure Sérum Facial Efeito Triplo","categoria":"sérum","ativos":["Thiamidol","Ácido Salicílico","Licochalcona A"],"preco":139.9,"disponivel":true,"urlProduto":"https://www.eucerin.com.br/products/dermopure/dermopure-triple-effect-serum","urlImagem":"./imagens/produtos/037.jpg"},{"nome":"Hyaluron-Filler Vitamina C Booster","categoria":"sérum","ativos":["Vitamina C 10%","Ácido Hialurônico","Tiamidol"],"preco":199.9,"disponivel":true,"urlProduto":"https://www.eucerin.com.br/products/hyaluron-filler/hyaluron-filler-vitamin-c-booster","urlImagem":"./imagens/produtos/038.jpg"},{"nome":"DermoPure Gel de Limpeza","categoria":"limpeza","ativos":["Ácido Salicílico","Licochalcona A","Zinco"],"preco":79.9,"disponivel":true,"urlProduto":"https://www.eucerin.com.br/products/dermopure/dermopure-cleansing-gel","urlImagem":"./imagens/produtos/039.jpg"},{"nome":"Hyaluron-Filler Creme Dia","categoria":"hidratante","ativos":["Ácido Hialurônico","FPS 30"],"preco":189.9,"disponivel":true,"urlProduto":"https://www.eucerin.com.br/products/hyaluron-filler/hyaluron-filler-day-cream-normal-to-mixed-skin","urlImagem":"./imagens/produtos/040.jpg"},{"nome":"Even Pigment Perfector Creme Clareador Dia","categoria":"hidratante","ativos":["Tiamidol","FPS 30","Licochalcona A"],"preco":179.9,"disponivel":true,"urlProduto":"https://www.eucerin.com.br/products/even-pigment-perfector/even-pigment-perfector-day-cream","urlImagem":"./imagens/produtos/041.jpg"}]},{"marca":"La Roche-Posay","produtos":[{"nome":"Anthelios Airlicium Protetor Solar","categoria":"protetor solar","ativos":["Filtros UV FPS 80","Mexoryl XL"],"preco":134.9,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/anthelios/anthelios-airlicium-fps80/p","urlImagem":"./imagens/produtos/042.jpg"},{"nome":"Anthelios XL Protect Clara com Cor","categoria":"protetor solar","ativos":["Filtros UV FPS 60","Mexoryl XL"],"preco":119.9,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/anthelios/anthelios-xl-protect-clara-fps60/p","urlImagem":"./imagens/produtos/043.jpg"},{"nome":"Effaclar Alta Tolerância - Gel de Limpeza Facial","categoria":"limpeza","ativos":["Zinco","Ácido Salicílico LHA","Água Termal"],"preco":94.9,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/effaclar/effaclar-gel-limpeza-alta-tolerancia/p","urlImagem":"./imagens/produtos/044.jpg"},{"nome":"Hyalu B5 Repair Sérum Anti-idade","categoria":"sérum","ativos":["Ácido Hialurônico Puro","Vitamina B5","Madecassoside"],"preco":294.9,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/hyalu-b5/hyalu-b5-repair-serum-anti-idade/p","urlImagem":"./imagens/produtos/045.jpg"},{"nome":"Mela B3 Sérum Antimanchas","categoria":"sérum","ativos":["Melasyl","Niacinamida 10%","Água Termal"],"preco":259.9,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/mela-b3/mela-b3-serum/p","urlImagem":"./imagens/produtos/046.jpg"},{"nome":"Cicaplast Baume B5+ Multirreparador","categoria":"hidratante","ativos":["Vitamina B5","Manteiga de Karité","Madecassoside","Zinco"],"preco":94.9,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/cicaplast/cicaplast-baume-b5/p","urlImagem":"./imagens/produtos/047.jpg"},{"nome":"Toleriane Sensitive Cuidado Prebiótico","categoria":"hidratante","ativos":["Prebiótico","Niacinamida","Glicerina"],"preco":183.99,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/toleriane/toleriane-sensitive/p","urlImagem":"./imagens/produtos/048.jpg"},{"nome":"Effaclar Ultra Concentrado Sérum","categoria":"sérum","ativos":["LHA","Ácido Salicílico","Niacinamida"],"preco":239.9,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/effaclar/effaclar-ultra-concentrado/p","urlImagem":"./imagens/produtos/049.jpg"},{"nome":"Hyalu B5 Aquagel","categoria":"hidratante","ativos":["Ácido Hialurônico","Vitamina B5","FPS 30"],"preco":242.89,"disponivel":true,"urlProduto":"https://www.laroche-posay.com.br/hyalu-b5/hyalu-b5-aquagel-fps30/p","urlImagem":"./imagens/produtos/050.jpg"}]},{"marca":"L'Oréal Paris","produtos":[{"nome":"Revitalift Hialurônico Diurno - Creme Anti-idade","categoria":"hidratante","ativos":["Ácido Hialurônico","Pro-Retinol","FPS 20"],"preco":37.9,"disponivel":true,"urlProduto":"https://www.lorealparis.com.br/revitalift/revitalift-hialuronico-fps20","urlImagem":"./imagens/produtos/051.jpg"},{"nome":"Sérum Preenchedor Facial Anti-idade Revitalift Hialurônico","categoria":"sérum","ativos":["Ácido Hialurônico","Pro-Retinol"],"preco":59.9,"disponivel":true,"urlProduto":"https://www.lorealparis.com.br/revitalift/serum-hialuronico","urlImagem":"./imagens/produtos/052.jpg"},{"nome":"Revitalift Vitamina C Sérum Facial Concentrado","categoria":"sérum","ativos":["Vitamina C 12%","Ácido Hialurônico"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.lorealparis.com.br/revitalift/revitalift-vitamina-c-serum","urlImagem":"./imagens/produtos/053.jpg"},{"nome":"UV Defender Aqua Gel","categoria":"protetor solar","ativos":["FPS 60","Ácido Hialurônico","Mexoryl XL"],"preco":69.9,"disponivel":true,"urlProduto":"https://www.amazon.com.br/Protetor-LOr%C3%A9al-Paris-Defender-Hidrata%C3%A7%C3%A3o/dp/B08FTKWKBX/","urlImagem":"./imagens/produtos/054.jpg"},{"nome":"Hydra Total 5 Gel Creme Hidratante Facial","categoria":"hidratante","ativos":["Ceramidas","Glicerina","Ácido Hialurônico"],"preco":34.9,"disponivel":true,"urlProduto":"https://www.lorealparis.com.br/hydra-total-5/gel-creme","urlImagem":"./imagens/produtos/055.jpg"},{"nome":"Glow Mon Amour Sérum Iluminador","categoria":"sérum","ativos":["Vitamina C","Niacinamida","Ácido Hialurônico"],"preco":79.9,"disponivel":true,"urlProduto":"https://www.lorealparis.com.br/glow-mon-amour/serum","urlImagem":"./imagens/produtos/056.jpg"}]},{"marca":"Neutrogena","produtos":[{"nome":"Hydro Boost Water Gel Hidratante Facial","categoria":"hidratante","ativos":["Ácido Hialurônico","Glicerina","Esqualano"],"preco":79.9,"disponivel":true,"urlProduto":"https://www.neutrogena.com.br/hydro-boost/hydro-boost-water-gel","urlImagem":"./imagens/produtos/057.jpg"},{"nome":"Sun Fresh Derm Care","categoria":"protetor solar","ativos":["FPS 70","Niacinamida","Vitamina C"],"preco":69.9,"disponivel":true,"urlProduto":"https://www.neutrogena.com.br/sun-fresh/sun-fresh-derm-care-fps70","urlImagem":"./imagens/produtos/058.jpg"},{"nome":"Antissinais Reparador Creme Noturno","categoria":"hidratante","ativos":["Vitamina C","Colágeno","Niacinamida"],"preco":36.09,"disponivel":true,"urlProduto":"https://www.neutrogena.com.br/antissinais/antissinais-reparador-noturno","urlImagem":"./imagens/produtos/059.jpg"},{"nome":"Hydro Boost Sérum Ácido Hialurônico","categoria":"sérum","ativos":["Ácido Hialurônico","Glicerina"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.neutrogena.com.br/hydro-boost/hydro-boost-serum-acido-hialuronico","urlImagem":"./imagens/produtos/060.jpg"},{"nome":"Gel de Limpeza Facial Deep Clean Intensive","categoria":"limpeza","ativos":["Aloe Vera","Glicerina"],"preco":24.9,"disponivel":true,"urlProduto":"https://www.amazon.com.br/Deep-Clean-Sabonete-Facial-Neutrogena/dp/B079VWH9H1/","urlImagem":"./imagens/produtos/061.jpg"}]},{"marca":"Nivea","produtos":[{"nome":"Hidratante Facial em Gel com Ácido Hialurônico e Pepino","categoria":"hidratante","ativos":["Ácido Hialurônico","Extrato de Pepino"],"preco":36.9,"disponivel":true,"urlProduto":"https://www.nivea.com.br/produtos/rosto/hidratante/hidratante-facial-gel-acido-hialuronico","urlImagem":"./imagens/produtos/062.jpg"},{"nome":"Creme Facial Antissinais 7 em 1","categoria":"hidratante","ativos":["Vitamina E","Coenzima Q10","FPS 30"],"preco":34.9,"disponivel":true,"urlProduto":"https://www.nivea.com.br/produtos/rosto/antissinais/creme-antissinais-7em1","urlImagem":"./imagens/produtos/063.jpg"},{"nome":"Sérum Facial Luminoso com Vitamina C","categoria":"sérum","ativos":["Vitamina C","Niacinamida","Ácido Hialurônico"],"preco":59.9,"disponivel":true,"urlProduto":"https://www.nivea.com.br/produtos/rosto/serum/serum-vitamina-c","urlImagem":"./imagens/produtos/064.jpg"},{"nome":"Gel Creme Hidratante Acne Control","categoria":"hidratante","ativos":["Ácido Hialurônico","Niacinamida"],"preco":32.9,"disponivel":true,"urlProduto":"https://www.nivea.com.br/produtos/rosto/hidratante/gel-creme-acne-control","urlImagem":"./imagens/produtos/065.jpg"}]},{"marca":"Payot","produtos":[{"nome":"Techni Liss Sérum Anti-idade","categoria":"sérum","ativos":["Ácido Hialurônico","Peptídeos","Vitamina E"],"preco":129.9,"disponivel":true,"urlProduto":"https://www.payot.com.br/techni-liss-serum/p","urlImagem":"file:///Users/joaochiara/Desktop/novas%20imagens/66.jpg"},{"nome":"Sabonete Líquido Detox Vitamina C","categoria":"limpeza","ativos":["Aloe Vera","Ácido Salicílico","Glicerina"],"preco":59.9,"disponivel":true,"urlProduto":"https://www.amazon.com.br/PAYOT-Sabonete-Liquido-Detox-Vitamina/dp/B08CNBSPBD/","urlImagem":"./imagens/produtos/067.jpg"}]},{"marca":"Principia","produtos":[{"nome":"Protetor Solar PS-01","categoria":"protetor solar","ativos":["FPS 60","Niacinamida 5%"],"preco":79.9,"disponivel":true,"urlProduto":"https://www.principia.bio/protetor-solar-ps01-fps60/p","urlImagem":"./imagens/produtos/068.jpg"},{"nome":"Sérum Ácido Hialurônico + B5","categoria":"sérum","ativos":["Ácido Hialurônico 2%","Vitamina B5","Glicerina"],"preco":54.9,"disponivel":true,"urlProduto":"https://www.principia.bio/serum-acido-hialuronico-b5/p","urlImagem":"./imagens/produtos/069.jpg"},{"nome":"Sérum Niacinamida 10%","categoria":"sérum","ativos":["Niacinamida 10%","Zinco 1%"],"preco":49.9,"disponivel":true,"urlProduto":"https://www.principia.bio/serum-niacinamida/p","urlImagem":"./imagens/produtos/070.jpg"},{"nome":"Creme Calmante Multirreparador","categoria":"hidratante","ativos":["Ceramidas","Pantenol","Centella Asiática","Niacinamida"],"preco":69.9,"disponivel":true,"urlProduto":"https://www.principia.bio/creme-calmante-multirreparador/p","urlImagem":"./imagens/produtos/071.jpg"},{"nome":"Sérum Vitamina C 15%","categoria":"sérum","ativos":["Vitamina C 15%","Ácido Ferúlico","Vitamina E"],"preco":89.9,"disponivel":true,"urlProduto":"https://www.amazon.com.br/Principia-S%C3%A9rum-Vitamina-C-10/dp/B09WC8Q5H3/","urlImagem":"./imagens/produtos/072.jpg"},{"nome":"Sérum Retinol 0.5%","categoria":"sérum","ativos":["Retinol 0.5%","Esqualano","Vitamina E"],"preco":69.9,"disponivel":true,"urlProduto":"https://www.amazon.com.br/S%C3%A9rum-Principia-Retinol-3-Vitamina/dp/B09WB12BKW/","urlImagem":"./imagens/produtos/073.jpg"}]},{"marca":"Sallve","produtos":[{"nome":"Antioxidante Hidratante - Sérum Gel Facial","categoria":"sérum","ativos":["Vitamina C 10%","Niacinamida","Cafeína","Vitamina E"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/antioxidante-hidratante","urlImagem":"./imagens/produtos/074.jpg"},{"nome":"Protetor Solar Toque Seco","categoria":"protetor solar","ativos":["FPS 50","Niacinamida","Vitamina E"],"preco":89.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/protetor-solar-toque-seco-fps50","urlImagem":"./imagens/produtos/075.jpg"},{"nome":"Protetor Solar Toque Seco com Cor","categoria":"protetor solar","ativos":["FPS 60","Niacinamida","Pigmentos de Cor"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/protetor-solar-com-cor-fps-60","urlImagem":"./imagens/produtos/076.jpg"},{"nome":"Antioxidante Hidratante UVA/UVB","categoria":"protetor solar","ativos":["Vitamina C 10%","Niacinamida","FPS 30"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/antioxidante-hidratante-fps30","urlImagem":"./imagens/produtos/077.jpg"},{"nome":"Hidratante Facial","categoria":"hidratante","ativos":["Beta-Glucan","Niacinamida"],"preco":69.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/hidratante-facial","urlImagem":"./imagens/produtos/078.jpg"},{"nome":"Retinol Puro 0.3% - Sérum Antissinais","categoria":"sérum","ativos":["Retinol Puro 0.3%","Vitamina E","Esqualano"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/retinol","urlImagem":"./imagens/produtos/079.jpg"},{"nome":"Tônico Renovador - Tratamento Facial","categoria":"tônico","ativos":["Ácido Glicólico","Niacinamida","Ácido Salicílico"],"preco":74.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/tonico-renovador","urlImagem":"./imagens/produtos/080.jpg"},{"nome":"Esfoliante Enzimático Facial","categoria":"esfoliante","ativos":["Enzimas Proteolíticas","Ácido Glicólico","Ácido Salicílico"],"preco":74.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/esfoliante-enzimatico","urlImagem":"./imagens/produtos/081.jpg"},{"nome":"Limpador Facial Antioleosidade","categoria":"limpeza","ativos":["Ácido Salicílico","Melaleuca","Glicerina"],"preco":69.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/limpador-facial","urlImagem":"./imagens/produtos/082.jpg"},{"nome":"Bastão Antioleosidade - Protetor Solar","categoria":"protetor solar","ativos":["FPS 60","Niacinamida"],"preco":79.9,"disponivel":true,"urlProduto":"https://www.sallve.com.br/products/bastao-antioleosidade","urlImagem":"./imagens/produtos/083.jpg"}]},{"marca":"Simple Organic","produtos":[{"nome":"Solução Niacinamida 10%","categoria":"sérum","ativos":["Niacinamida 10%","Zinco"],"preco":129.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/solucao-niacinamida","urlImagem":"./imagens/produtos/084.jpg"},{"nome":"Sérum Vitamina C Iluminador","categoria":"sérum","ativos":["Vitamina C","Vitamina E","Rosa Mosqueta"],"preco":169.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/serum-vitamina-c","urlImagem":"./imagens/produtos/085.jpg"},{"nome":"Hidratante Facial Multiativos Revolution","categoria":"hidratante","ativos":["Colágeno Vegano","Ácido Hialurônico","Peptídeos"],"preco":189.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/hidratante-facial-multiativos","urlImagem":"./imagens/produtos/086.jpg"},{"nome":"Solução Ácido Mandélico 10%","categoria":"esfoliante","ativos":["Ácido Mandélico 10%","Aloe Vera","Pantenol"],"preco":119.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/solucao-acido-mandelico","urlImagem":"./imagens/produtos/087.jpg"},{"nome":"Espuma de Limpeza Facial","categoria":"limpeza","ativos":["Aloe Vera","Calêndula","Glicerina Vegetal"],"preco":99.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/espuma-de-limpeza-facial","urlImagem":"./imagens/produtos/088.jpg"},{"nome":"Óleo Facial Anti-idade Rosa Mosqueta","categoria":"óleo","ativos":["Óleo de Rosa Mosqueta","Vitamina C","Vitamina E"],"preco":149.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/oleo-rosa-mosqueta","urlImagem":"./imagens/produtos/089.jpg"},{"nome":"Eye Balm Antiolheiras","categoria":"contorno dos olhos","ativos":["Cafeína","Ácido Hialurônico","Manteiga de Karité"],"preco":159.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/balm-de-olhos","urlImagem":"./imagens/produtos/090.jpg"},{"nome":"Retinol Bakuchiol Sérum Antiacne","categoria":"sérum","ativos":["Bakuchiol","Retinol","Niacinamida"],"preco":159.9,"disponivel":true,"urlProduto":"https://simpleorganic.com.br/products/retinol-bakuchiol","urlImagem":"./imagens/produtos/091.jpg"}]},{"marca":"SkinCeuticals","produtos":[{"nome":"C E Ferulic Sérum Antioxidante Vitamina C Pura","categoria":"sérum","ativos":["Vitamina C 15%","Vitamina E 1%","Ácido Ferúlico 0.5%"],"preco":899.0,"disponivel":true,"urlProduto":"https://www.skinceuticals.com.br/c-e-ferulic-serum-vitamina-c-pura/SKBRS17.html","urlImagem":"./imagens/produtos/092.jpg"},{"nome":"Triple Lipid Restore 2:4:2","categoria":"hidratante","ativos":["Ceramidas 2%","Colesterol Natural 4%","Ácidos Graxos 2%"],"preco":769.0,"disponivel":true,"urlProduto":"https://www.skinceuticals.com.br/triple-lipid-restore-242/SKBRS06.html","urlImagem":"./imagens/produtos/093.jpg"},{"nome":"Silymarin CF Sérum Antioxidante Pele Oleosa","categoria":"sérum","ativos":["Vitamina C 15%","Silimarina","Ácido Ferúlico"],"preco":899.0,"disponivel":true,"urlProduto":"https://www.skinceuticals.com.br/silymarin-cf/SKBRS15.html","urlImagem":"./imagens/produtos/094.jpg"},{"nome":"Retinol 0.3%","categoria":"sérum","ativos":["Retinol Puro 0.3%","Vitamina E"],"preco":529.0,"disponivel":true,"urlProduto":"https://www.skinceuticals.com.br/retinol-0-3/SKBRS09.html","urlImagem":"./imagens/produtos/095.jpg"},{"nome":"Retinol 0.5%","categoria":"sérum","ativos":["Retinol Puro 0.5%","Vitamina E"],"preco":569.0,"disponivel":true,"urlProduto":"https://www.skinceuticals.com.br/retinol-0-5/SKBRS10.html","urlImagem":"./imagens/produtos/096.jpg"},{"nome":"Phyto Corrective Gel","categoria":"sérum","ativos":["Extrato de Pepino","Centella Asiática","Regaliz"],"preco":559.0,"disponivel":true,"urlProduto":"https://www.skinceuticals.com.br/phyto-corrective-gel/SKBRS11.html","urlImagem":"./imagens/produtos/097.jpg"}]},{"marca":"The Ordinary","produtos":[{"nome":"Niacinamide 10% + Zinc 1%","categoria":"sérum","ativos":["Niacinamida 10%","Zinco 1%"],"preco":59.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/niacinamide-10pct-zinc-1pct","urlImagem":"./imagens/produtos/098.jpg"},{"nome":"Hyaluronic Acid 2% + B5","categoria":"sérum","ativos":["Ácido Hialurônico 2%","Vitamina B5"],"preco":89.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/hyaluronic-acid-2pct-b5","urlImagem":"./imagens/produtos/099.jpg"},{"nome":"Squalane Cleanser","categoria":"limpeza","ativos":["Esqualano"],"preco":85.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/squalane-cleanser","urlImagem":"./imagens/produtos/100.jpg"},{"nome":"Glycolic Acid 7% Toning Solution","categoria":"tônico","ativos":["Ácido Glicólico 7%","Aminoácidos","Aloe Vera"],"preco":89.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/glycolic-acid-7pct-toning-solution","urlImagem":"./imagens/produtos/101.jpg"},{"nome":"AHA 30% + BHA 2% Peeling Solution","categoria":"esfoliante","ativos":["Ácido Glicólico 30%","Ácido Salicílico 2%","Ácido Lático"],"preco":109.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/aha-30pct-bha-2pct-peeling-solution","urlImagem":"./imagens/produtos/102.jpg"},{"nome":"Caffeine Solution 5% + EGCG","categoria":"contorno dos olhos","ativos":["Cafeína 5%","Extrato de Chá Verde"],"preco":75.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/caffeine-solution-5pct-egcg","urlImagem":"./imagens/produtos/103.jpg"},{"nome":"Salicylic Acid 2% Anhydrous Solution","categoria":"tratamento","ativos":["Ácido Salicílico 2%","Mentol"],"preco":69.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/salicylic-acid-2pct-anhydrous-solution","urlImagem":"./imagens/produtos/104.jpg"},{"nome":"Retinol 0.5% in Squalane","categoria":"sérum","ativos":["Retinol 0.5%","Esqualano"],"preco":99.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/retinol-0-5pct-in-squalane","urlImagem":"./imagens/produtos/105.jpg"},{"nome":"Natural Moisturizing Factors + HA","categoria":"hidratante","ativos":["Aminoácidos","Ácido Hialurônico","Glicerina"],"preco":79.0,"disponivel":true,"urlProduto":"https://theordinary.com/pt-br/products/natural-moisturizing-factors-ha","urlImagem":"./imagens/produtos/106.jpg"}]},{"marca":"Vichy","produtos":[{"nome":"Capital Soleil UV-Age Daily","categoria":"protetor solar","ativos":["FPS 50+","Vitamina C","Mexoryl 400"],"preco":139.9,"disponivel":true,"urlProduto":"https://www.vichy.com.br/capital-soleil/uv-age-daily/p","urlImagem":"./imagens/produtos/107.jpg"},{"nome":"Liftactiv B3 Sérum Antimanchas","categoria":"sérum","ativos":["Niacinamida 3.5%","Vitamina C","Bisabolol"],"preco":259.9,"disponivel":true,"urlProduto":"https://www.vichy.com.br/liftactiv/liftactiv-b3-serum/p","urlImagem":"./imagens/produtos/108.jpg"},{"nome":"Normaderm Phytosolution Sérum","categoria":"sérum","ativos":["Ácido Salicílico","Niacinamida","Probióticos","Vitamina C"],"preco":159.9,"disponivel":true,"urlProduto":"https://www.vichy.com.br/normaderm/normaderm-phytosolution-serum/p","urlImagem":"./imagens/produtos/109.jpg"},{"nome":"Minéral 89 Baume Reparador","categoria":"hidratante","ativos":["Água Mineral Vulcânica","Ácido Hialurônico 89%"],"preco":149.9,"disponivel":true,"urlProduto":"https://www.vichy.com.br/mineral-89/mineral-89-baume-reparador/p","urlImagem":"./imagens/produtos/110.jpg"},{"nome":"Slow Age Fluido Antienvelhecimento","categoria":"hidratante","ativos":["Antioxidantes","FPS 25","Água Mineral Vulcânica"],"preco":189.9,"disponivel":true,"urlProduto":"https://www.vichy.com.br/slow-age/slow-age-fluido/p","urlImagem":"./imagens/produtos/111.jpg"},{"nome":"Normaderm Bifase - Água Micelar Bifásica","categoria":"limpeza","ativos":["Água Micelar","Ácido Salicílico","Vitamina C"],"preco":99.9,"disponivel":true,"urlProduto":"https://www.vichy.com.br/normaderm/normaderm-bifase/p","urlImagem":"./imagens/produtos/112.jpg"},{"nome":"Liftactiv Peptide AHA Sérum Anti-idade","categoria":"sérum","ativos":["Peptídeos","AHA (Ácido Glicólico)","Vitamina C"],"preco":229.9,"disponivel":true,"urlProduto":"https://www.vichy.com.br/liftactiv/liftactiv-peptide-aha/p","urlImagem":"./imagens/produtos/113.jpg"}]}];

  // ── FILTRO DE ORÇAMENTO ───────────────────────────────────────────────────
  // Remove volume/quantidade do nome do produto (ex: "500ml", "40g", "30 ml", "100 mL")
  function removerVolume(nome) {
    return nome.replace(/\s+\d+(\.\d+)?\s*(ml|mL|ML|g|G|kg|KG|oz|OZ)\b/g, '').trim();
  }

  function filtrarPorOrcamento(orcamento) {
    const tetos = { basico: 100, medio: 200, premium: Infinity };
    const teto = tetos[orcamento] || 200;
    return CATALOGO
      .map(marca => ({
        ...marca,
        produtos: marca.produtos.filter(p => p.disponivel && p.preco !== null && p.preco <= teto)
      }))
      .filter(marca => marca.produtos.length > 0);
  }

  // ── CHAMADA À IA ─────────────────────────────────────────────────────────
  async function chamarIA(respostas, produtosFiltrados) {
    const prompt = `Você é a especialista em dermatologia clínica da dermind, uma plataforma de análise de pele por inteligência artificial. Sua função é analisar o perfil de uma paciente e gerar um protocolo de skincare personalizado com rigor técnico e linguagem clínica direta.

════════════════════════════════════
REGRAS DE SEGURANÇA — PRIORIDADE ABSOLUTA
Estas regras se sobrepõem a qualquer outra instrução.
════════════════════════════════════

1. ALERGIAS: Se a paciente informou alergia a algum ingrediente, esse ingrediente e qualquer ativo da mesma família química jamais podem aparecer nas recomendações. Sem exceções.

2. MEDICAMENTOS COM RECEITA: Se a paciente usa tretinoína, ácido azelaico, antibiótico tópico ou qualquer outro produto prescrito, não indique ativos que conflitem com eles. Adapte a rotina para coexistir com o tratamento em curso.

3. GESTANTES E LACTANTES: Se a paciente está grávida ou amamentando, remova obrigatoriamente da rotina: retinol e retinoides, ácido salicílico acima de 2%, hidroquinona, ácidos AHA em concentrações elevadas e qualquer ativo com contraindicação documentada nessa fase. Substitua por alternativas seguras.

4. PRODUTOS: Todos os produtos indicados — na rotina, no produto essencial e nos indicados para você — devem ser selecionados exclusivamente da lista de produtos disponíveis fornecida abaixo. Nunca invente ou sugira produtos fora dessa lista.

════════════════════════════════════
TOM E LINGUAGEM
════════════════════════════════════

- Use linguagem clínica e técnica, como uma dermatologista em consulta.
- Seja direta e objetiva. Evite frases vazias como "sua pele é única" ou "cada pele tem suas necessidades".
- Nomeie os ativos pelos seus termos técnicos (ex: ácido retinóico, niacinamida, ceramidas, ácido hialurônico de baixo peso molecular).
- Justifique cada indicação com base no perfil clínico da paciente — nunca recomende algo sem ancorar na queixa ou no dado coletado.
- Nunca prometa resultados absolutos. Use termos como "tende a", "em geral responde bem a", "pode contribuir para".
- Considere o nível de experiência da paciente com skincare ao montar a rotina. Pacientes sem rotina prévia devem receber protocolos mais simples e progressivos — priorize os ativos de maior impacto e deixe os complementares para uma segunda fase. Pacientes com rotina estabelecida podem receber protocolos mais completos.

════════════════════════════════════
PERFIS DISPONÍVEIS
════════════════════════════════════

Classifique a paciente em um dos perfis abaixo. Se dois perfis forem clinicamente relevantes ao mesmo tempo, você pode combiná-los no título usando "com" (ex: "Oleosa com tendência à acne e hiperpigmentação"). Nunca combine mais de dois perfis.

1. Oleosa com tendência à acne
2. Mista com zona T oleosa
3. Mista com tendência oleosa e acne
4. Seca com déficit de barreira
5. Seca e sensível
6. Normal com sinais de envelhecimento
7. Madura com ressecamento e flacidez
8. Sensível e reativa
9. Com hiperpigmentação e manchas
10. Desidratada com leve oleosidade

════════════════════════════════════
PERFIL DA PACIENTE
════════════════════════════════════

Nome: ${respostas.nome}
Idade: ${respostas.idade} anos
Cidade: ${respostas.cidade} | Índice UV: ${respostas.uv} | Umidade: ${respostas.umidade} | Poluição: ${respostas.poluicao}

Tipo de pele autorrelatado: ${respostas.tipoPele}
Principais queixas: ${respostas.queixas}
Áreas de foco: ${respostas.areas}
Pele hidratada naturalmente: ${respostas.hidratacao}
Pele sensível: ${respostas.sensibilidade}

Rotina atual: ${respostas.rotina}
Produtos matinais em uso: ${respostas.rotinaMatinal}
Produtos noturnos em uso: ${respostas.rotinaNoturna}

Uso de maquiagem: ${respostas.maquiagem}
Preparo antes de se maquiar: ${respostas.preparoPele}
Método de remoção de maquiagem: ${respostas.demaquilante}

Exposição ao sol diária: ${respostas.exposicaoSol}
Uso de protetor solar: ${respostas.protetor}
Tempo de tela por dia: ${respostas.tempoTela}

Alergia a ingredientes: ${respostas.alergia}
Ingredientes que causam reação: ${respostas.ingredientesAlergia}
Usa produto com receita médica: ${respostas.receita}
Produto com receita em uso: ${respostas.produtoReceita}

Ingestão de água por dia: ${respostas.agua}
Alimentação habitual: ${respostas.alimentacao}
Grávida ou amamentando: ${respostas.gravidez}

Orçamento mensal para skincare: ${respostas.orcamento}

════════════════════════════════════
PRODUTOS DISPONÍVEIS
════════════════════════════════════

O orçamento informado é o valor máximo por produto. Nunca indique produto com preço superior ao orçamento da paciente. Nunca indique produto com disponivel: false.

${JSON.stringify(produtosFiltrados)}

════════════════════════════════════
FORMATO DE SAÍDA
════════════════════════════════════

Retorne SOMENTE um JSON válido, sem texto antes ou depois, sem markdown, sem blocos de código. Siga exatamente esta estrutura:

{
  "tituloPerfil": "Seu perfil de pele é <em>oleosa com tendência à acne</em>.",
  "diagnostico": "Texto de 4 a 6 frases em linguagem clínica descrevendo o perfil da paciente, ancorando cada observação nos dados coletados. Mencione cidade e clima se forem relevantes para o caso. Seja específica — nunca genérica.",
  "scores": { "hidratacao": 0, "brilho": 0, "firmeza": 0, "textura": 0, "oleosidade": 0, "sensibilidade": 0, "rugas": 0, "manchas": 0 },
  "idadePele": 0,
  "produtoEssencial": {
    "nome": "Nome exato do produto conforme consta na lista",
    "marca": "Marca exata conforme consta na lista",
    "preco": 0.00,
    "urlProduto": "URL exata conforme consta na lista",
    "urlImagem": "URL exata conforme consta na lista",
    "pontoFraco": "Nome curto do ponto fraco identificado",
    "motivo": "2 a 3 frases clínicas explicando por que este é o maior ponto fraco da pele desta paciente e por que este produto age diretamente sobre ele."
  },
  "rotinaMatinal": [
    { "passo": 1, "nome": "Nome do passo clínico", "produto": "Nome exato do produto", "marca": "Marca exata", "preco": 0.00, "urlProduto": "URL exata", "descricao": "Instrução de uso objetiva e técnica.", "motivo": "Justificativa clínica ancorada no perfil da paciente." }
  ],
  "rotinaNoturna": [
    { "passo": 1, "nome": "Nome do passo clínico", "produto": "Nome exato do produto", "marca": "Marca exata", "preco": 0.00, "urlProduto": "URL exata", "descricao": "Instrução de uso objetiva e técnica.", "motivo": "Justificativa clínica ancorada no perfil da paciente." }
  ],
  "rotinaSemanal": [
    { "passo": 1, "nome": "Nome do passo clínico", "produto": "Nome exato do produto", "marca": "Marca exata", "preco": 0.00, "urlProduto": "URL exata", "descricao": "Instrução de uso objetiva e técnica.", "motivo": "Justificativa clínica ancorada no perfil da paciente." }
  ],
  "indicadosParaVoce": [
    { "nome": "Nome exato do produto", "marca": "Marca exata", "preco": 0.00, "urlProduto": "URL exata", "urlImagem": "URL exata", "fit": 0 }
  ],
  "dicasInteligentes": {
    "agua": {
      "titulo": "Título curto sobre hidratação (máximo 33 caracteres)",
      "subtitulo": "Frase personalizada sobre o hábito de hidratação da paciente (entre 55 e 75 caracteres)."
    },
    "protetor": {
      "titulo": "Título curto sobre proteção solar (máximo 33 caracteres)",
      "subtitulo": "Frase personalizada sobre o uso de protetor solar da paciente (entre 55 e 75 caracteres)."
    },
    "alimentacao": {
      "titulo": "Título curto sobre alimentação (máximo 33 caracteres)",
      "subtitulo": "Frase personalizada sobre os hábitos alimentares da paciente — pode abordar consumo de álcool, laticínios, embutidos, ultraprocessados, açúcar ou frutas/vegetais, conforme o perfil (entre 55 e 75 caracteres)."
    },
    "luzAzul": {
      "titulo": "Título curto sobre exposição a telas (máximo 33 caracteres)",
      "subtitulo": "Frase personalizada sobre o tempo de tela da paciente (entre 55 e 75 caracteres)."
    },
    "sono": {
      "titulo": "Título curto sobre sono (máximo 33 caracteres)",
      "subtitulo": "Frase sobre a importância do sono para a pele, personalizada ao perfil da paciente (entre 55 e 75 caracteres)."
    }
  }
}

Scores devem ser números inteiros de 0 a 100, refletindo o estado atual estimado da pele — não o estado ideal.
idadePele deve ser um número inteiro entre 10% e 20% acima da idade cronológica da paciente, variando aleatoriamente dentro desse intervalo.
O campo fit em indicadosParaVoce deve ser um número inteiro de 0 a 100.
indicadosParaVoce deve conter entre 4 e 6 produtos de categorias variadas e complementares.
Cada período da rotina (matinal e noturna) deve ter no máximo 5 passos. Priorize os ativos de maior impacto clínico — omita os complementares se necessário para respeitar o limite.
O campo descricao de cada passo deve ter OBRIGATORIAMENTE no máximo 40 caracteres. Conte os caracteres antes de enviar — se o texto tiver mais de 40 caracteres, reescreva até caber. Nunca corte com reticências. Nunca use ponto final nem ponto de exclamação.
rotinaSemanal deve ser incluída apenas se clinicamente indicado, com no máximo 2 passos. Se não houver indicação, retorne rotinaSemanal como array vazio [].
Todos os campos de nome, marca, preco, urlProduto e urlImagem devem ser copiados exatamente como estão na lista — sem alterações.
Nos nomes dos produtos, NUNCA use travessão (—). Se o nome original contiver travessão, substitua por hífen (-).
O conjunto de produtos indicados na rotinaMatinal, rotinaNoturna, rotinaSemanal e indicadosParaVoce deve obrigatoriamente incluir produtos de no mínimo 3 marcas diferentes. Se a seleção natural resultar em menos de 3 marcas, substitua um ou mais produtos por equivalentes de outras marcas disponíveis na lista, mantendo a adequação clínica.
dicasInteligentes deve conter exatamente os 5 campos: agua, protetor, alimentacao, luzAzul e sono. Cada campo tem um titulo OBRIGATORIAMENTE com no máximo 33 caracteres (nunca mais que 33, nunca use reticências ou corte de texto — use frases curtas e diretas como "Beba mais água" ou "Proteja do sol"). O subtitulo deve ter OBRIGATORIAMENTE entre 55 e 75 caracteres (nunca menos que 55 nem mais que 75), sem ponto final nem ponto de exclamação. Os textos devem ser personalizados com base nas respostas da paciente — tom positivo quando o hábito é bom, orientativo quando precisa melhorar. Nunca use textos genéricos.`;

const response = await fetch('/api/analisar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt })
});

    if (!response.ok) throw new Error('Erro na chamada à IA');
    const data = await response.json();
    console.log('[Dermia] Resposta bruta da Edge Function:', data);
    let raw = data.resultado;
    if (!raw) {
      console.error('[Dermia] Campo "resultado" ausente na resposta:', data);
      throw new Error('Campo resultado ausente na resposta da IA');
    }
    // Remove blocos de markdown residuais
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('[Dermia] Falha ao parsear JSON da IA. Raw recebido:', raw);
      throw e;
    }
    console.log('[Dermia] JSON parseado com sucesso:', parsed);
    return parsed;
  }

  // ── POPULA TELA DE RESULTADO COM DADOS DA IA ─────────────────────────────

  // Substitui travessões por hífens em qualquer string
  function semTravessao(s) {
    if (typeof s !== 'string') return s;
    return s.replace(/\u2014|\u2013|\u2015/g, '-'); // — – ―
  }
  // Remove ponto final e ponto de exclamação de strings curtas (instruções e subtítulos de dicas)
  function semPontoFinal(s) {
    if (typeof s !== 'string') return s;
    return s.replace(/[.!…]+\s*$/, '').replace(/\.\.\.\s*$/, '');
  }
  // Limpa subtítulo de dica: remove pontos finais, pontos de continuação,
  // e une duas frases separadas por ". " em uma única com " - " (letra minúscula após o hífen)
  function limparSubtituloDica(s) {
    if (typeof s !== 'string') return s;
    // Remove reticências ou ponto final no final
    s = s.replace(/[.!…]+\s*$/, '').replace(/\.\.\.\s*$/, '');
    // Se houver ". " no meio (duas frases), une com " - " e força minúscula na letra seguinte
    s = s.replace(/\.\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ])/g, function(_, letra) {
      return ' - ' + letra.toLowerCase();
    });
    // Remove qualquer ponto final remanescente no meio que não virou hífen
    s = s.replace(/\.\s+/g, ' - ');
    // Garante espaço entre numeral e "L" de litro (ex: "1L" → "1 L", "1,5L" → "1,5 L")
    s = s.replace(/(\d[,.]?\d*)L\b/g, '$1 L');
    return s;
  }
  // Sanitiza um objeto recursivamente — travessões em todo o JSON da IA
  function sanitizeIA(obj) {
    if (typeof obj === 'string') return semTravessao(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeIA);
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const k in obj) out[k] = sanitizeIA(obj[k]);
      return out;
    }
    return obj;
  }

  // ── RADAR CHART — função global chamada tanto pela IA quanto pelo fallback ──
  window._renderRadar = function(scores) {
    const labels = ['Hidratação','Brilho','Firmeza','Textura','Oleosidade','Sensibilidade','Rugas','Manchas'];
    const n = 8;
    const VB = 420;
    const cx = VB / 2, cy = VB / 2, maxR = 140;
    const PILL_DIST = maxR + 36;

    function polar(angle, rad) {
      return [cx + rad * Math.sin(angle), cy - rad * Math.cos(angle)];
    }

    // Cor dos dots
    const invertedLabels = ['Oleosidade','Sensibilidade','Rugas','Manchas'];
    const dotColors = scores.map((s, i) => {
      const isInverted = invertedLabels.includes(labels[i]);
      if (isInverted) return s < 50 ? '#4A7FA5' : '#A85568';
      else            return s < 50 ? '#A85568' : '#4A7FA5';
    });

    // Pré-calcula posições dos dots e pills
    const dotPts  = scores.map((s, i) => polar(2 * Math.PI * i / n, maxR * s / 100));
    const pillPts = scores.map((_, i) => polar(2 * Math.PI * i / n, PILL_DIST));

    let svgHtml = '';

    // Fundo octógono
    let bgPts = [];
    for (let i = 0; i < n; i++) bgPts.push(polar(2 * Math.PI * i / n, maxR));
    svgHtml += `<polygon points="${bgPts.map(p=>p.join(',')).join(' ')}" fill="#F7F2EA"/>`;

    // Anéis concêntricos
    for (let ri = 1; ri <= 5; ri++) {
      const rr = maxR * ri / 5;
      let pts = [];
      for (let i = 0; i < n; i++) pts.push(polar(2 * Math.PI * i / n, rr));
      svgHtml += `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="rgba(168,85,104,0.13)" stroke-width="1"/>`;
    }

    // Linhas de eixo
    for (let i = 0; i < n; i++) {
      const [x, y] = polar(2 * Math.PI * i / n, maxR);
      svgHtml += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(168,85,104,0.18)" stroke-width="1"/>`;
    }

    // Polígono de dados — fill sólido translúcido wine + stroke sólido wine
    const dataFull = scores.map((s, i) => polar(2 * Math.PI * i / n, maxR * s / 100));
    const dataZero = scores.map((_, i) => polar(2 * Math.PI * i / n, 0));
    svgHtml += `<polygon id="radar-data-poly"
      points="${dataZero.map(p=>p.join(',')).join(' ')}"
      fill="rgba(168,85,104,0.22)"
      stroke="rgba(168,85,104,0.75)"
      stroke-width="2"
      stroke-linejoin="round"/>`;

    // Pontos nos vértices — cor individual
    scores.forEach((s, i) => {
      svgHtml += `<circle class="radar-dot" cx="${cx}" cy="${cy}" r="4" fill="${dotColors[i]}" opacity="0"/>`;
    });

    // ── Injeta SVG e posiciona pílulas HTML ──
    function setupRadar(svgEl, overlayEl, canvasEl) {
      if (!svgEl) return;
      svgEl.setAttribute('viewBox', `0 0 ${VB} ${VB}`);
      svgEl.innerHTML = svgHtml;

      if (!overlayEl) return;
      overlayEl.innerHTML = '';

      const pillEls = [];
      labels.forEach((lbl, i) => {
        const angle = 2 * Math.PI * i / n;
        const sinA = Math.sin(angle);
        const [lx, ly] = polar(angle, PILL_DIST);

        const pctX = (lx / VB) * 100;
        const pctY = (ly / VB) * 100;

        let translateX;
        if (sinA > 0.3)       translateX = '0%';
        else if (sinA < -0.3) translateX = '-100%';
        else                  translateX = '-50%';

        const pill = document.createElement('div');
        pill.className = 'radar-label-pill';
        pill.textContent = lbl;
        pill.style.cssText = `
          position:absolute;
          left:${pctX.toFixed(2)}%;
          top:${pctY.toFixed(2)}%;
          transform: translate(${translateX}, -50%);
          white-space:nowrap;
        `;
        overlayEl.appendChild(pill);
        pillEls.push({ pill, idx: i, translateX });
      });

      // Desenha linhas canvas pílula → dot após o layout renderizar
      if (canvasEl) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          drawConnectors(canvasEl, svgEl, overlayEl, pillEls, 0);
        }));
      }
    }

    // Desenha linhas curvas orgânicas do centro de cada pílula até o dot no SVG
    function drawConnectors(canvasEl, svgEl, overlayEl, pillEls, progress) {
      const container = canvasEl.parentElement;
      const cRect = container.getBoundingClientRect();
      const W = cRect.width;
      const H = cRect.height;
      if (W === 0 || H === 0) return;

      // Dimensiona o canvas em pixels reais
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width  = W * dpr;
      canvasEl.height = H * dpr;
      const ctx = canvasEl.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Escala do SVG viewBox para pixels reais
      const svgRect = svgEl.getBoundingClientRect();
      const scaleX = svgRect.width  / VB;
      const scaleY = svgRect.height / VB;
      const svgOffX = svgRect.left - cRect.left;
      const svgOffY = svgRect.top  - cRect.top;

      pillEls.forEach(({ pill, idx, translateX }) => {
        const pillRect = pill.getBoundingClientRect();
        const pillW = pillRect.width;
        const pillH = pillRect.height;

        // Centro da pílula
        const pillCX = pillRect.left - cRect.left + pillW / 2;
        const pillCY = pillRect.top  - cRect.top  + pillH / 2;

        // Ponto do dot animado atual (usa dataFull * progress para animar junto)
        const [fx, fy] = dataFull[idx];
        const curDotSvgX = cx + (fx - cx) * progress;
        const curDotSvgY = cy + (fy - cy) * progress;
        const dotX = svgOffX + curDotSvgX * scaleX;
        const dotY = svgOffY + curDotSvgY * scaleY;

        // Ponto de borda da pílula mais próximo do dot
        const dx = dotX - pillCX;
        const dy = dotY - pillCY;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        // Ancoragem na borda da pílula (aprox metade da largura/altura)
        const edgeX = pillCX + (dx / dist) * (pillW / 2);
        const edgeY = pillCY + (dy / dist) * (pillH / 2);

        // Curva quadrática orgânica — controle perpendicular ao eixo
        const perpX = -dy * 0.25;
        const perpY =  dx * 0.25;
        const cpX = (edgeX + dotX) / 2 + perpX;
        const cpY = (edgeY + dotY) / 2 + perpY;

        ctx.beginPath();
        ctx.moveTo(edgeX, edgeY);
        ctx.quadraticCurveTo(cpX, cpY, dotX, dotY);
        ctx.strokeStyle = dotColors[idx];
        ctx.lineWidth   = 1.5;
        ctx.lineCap     = 'round';
        ctx.globalAlpha = 0.6 * progress;
        ctx.stroke();
      });
    }

    const svg       = document.getElementById('skin-radar');
    const overlay   = document.getElementById('radar-pills-overlay');
    const canvasEl  = document.getElementById('radar-connector-canvas');
    const svgMobile = document.getElementById('skin-radar-mobile');
    const overlayM  = document.getElementById('radar-pills-overlay-mobile');
    const canvasMob = document.getElementById('radar-connector-canvas-mobile');

    // pillEls são retornados de setupRadar — guardados por svgEl
    const pillElsMap = new Map();

    function setupAndCapture(svgEl, overlayEl, canvasEl2) {
      const captured = [];
      setupRadar(svgEl, overlayEl, canvasEl2, captured);
      if (svgEl) pillElsMap.set(svgEl, { canvasEl: canvasEl2, pillEls: captured });
    }

    // Redefine setupRadar para capturar pillEls
    const _origSetup = setupRadar;
    setupRadar = function(svgEl, overlayEl, canvasEl2, captureArr) {
      if (!svgEl) return;
      svgEl.setAttribute('viewBox', `0 0 ${VB} ${VB}`);
      svgEl.innerHTML = svgHtml;
      if (!overlayEl) return;
      overlayEl.innerHTML = '';
      const pillEls2 = [];
      labels.forEach((lbl, i) => {
        const angle = 2 * Math.PI * i / n;
        const sinA = Math.sin(angle);
        const [lx, ly] = polar(angle, PILL_DIST);
        const pctX = (lx / VB) * 100;
        const pctY = (ly / VB) * 100;
        let translateX;
        if (sinA > 0.3)       translateX = '0%';
        else if (sinA < -0.3) translateX = '-100%';
        else                  translateX = '-50%';
        const pill = document.createElement('div');
        pill.className = 'radar-label-pill';
        pill.textContent = lbl;
        pill.style.cssText = `position:absolute;left:${pctX.toFixed(2)}%;top:${pctY.toFixed(2)}%;transform:translate(${translateX},-50%);white-space:nowrap;`;
        overlayEl.appendChild(pill);
        pillEls2.push({ pill, idx: i, translateX });
      });
      if (captureArr) captureArr.push(...pillEls2);
    };

    const pillElsMobile = [], pillElsDesktop = [];
    setupRadar(svg, overlay, canvasEl, pillElsDesktop);
    setupRadar(svgMobile, overlayM, canvasMob, pillElsMobile);

    // Anima dots, polígono E redesenha canvas connectors a cada frame
    const startTime = performance.now();
    const duration = 900;

    function animSvg(svgEl, canvasEl2, pillEls2, now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      const poly = svgEl.querySelector('#radar-data-poly');
      if (poly) {
        const pts = dataFull.map((fp, i) => {
          const sp = dataZero[i];
          return [(sp[0] + (fp[0]-sp[0]) * ease).toFixed(2), (sp[1] + (fp[1]-sp[1]) * ease).toFixed(2)];
        });
        poly.setAttribute('points', pts.map(p=>p.join(',')).join(' '));
      }

      svgEl.querySelectorAll('.radar-dot').forEach((dot, i) => {
        if (!dataFull[i]) return;
        const [fx, fy] = dataFull[i];
        dot.setAttribute('cx', (cx + (fx-cx) * ease).toFixed(2));
        dot.setAttribute('cy', (cy + (fy-cy) * ease).toFixed(2));
        dot.setAttribute('opacity', ease.toFixed(2));
      });

      // Redesenha linhas canvas com progress atual
      if (canvasEl2 && pillEls2.length) {
        const overlayEl2 = canvasEl2.parentElement.querySelector('[id$="-overlay-mobile"], [id$="-overlay"]');
        drawConnectors(canvasEl2, svgEl, overlayEl2 || canvasEl2.previousElementSibling, pillEls2, ease);
      }

      if (t < 1) requestAnimationFrame(now2 => animSvg(svgEl, canvasEl2, pillEls2, now2));
    }

    if (svg)       requestAnimationFrame(now => animSvg(svg, canvasEl, pillElsDesktop, now));
    if (svgMobile) requestAnimationFrame(now => animSvg(svgMobile, canvasMob, pillElsMobile, now));
  };

  function preencherResultadoIA(r, nome) {
    r = sanitizeIA(r); // aplica travessão → hífen em todo o conteúdo da IA
    const titlePlaceholder = document.getElementById('result-title-placeholder');
    const titleTyped = document.getElementById('result-title-typed');
    if (titlePlaceholder) titlePlaceholder.innerHTML = r.tituloPerfil;
    if (titleTyped) titleTyped.innerHTML = '';

    const nomeEl = document.getElementById('resultNome');
    if (nomeEl) nomeEl.textContent = nome;

    const diagEl = document.querySelector('#box-avaliacao-ia .diagnosis-text');
    if (diagEl) {
      let diagHtml = '<span style="color:var(--wine);margin-right:6px;">✦</span>' + r.diagnostico;
      // Garante no mínimo 3 trechos em destaque (font-weight 500 via .diagnosis-text strong)
      const countStrong = () => (diagHtml.match(/<strong>/g) || []).length;
      if (countStrong() < 3) {
        // Divide o texto em segmentos por pontuação e envolve os primeiros que ainda não têm <strong>
        const needed = () => 3 - countStrong();
        // Tenta destacar segmentos entre vírgulas/pontos de 10-80 chars que não estejam já em <strong>
        diagHtml = diagHtml.replace(/(?<!<strong>[^<]{0,200})([,.\s]\s*)([a-záéíóúâêîôûãõàüçA-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÜÇ][^<>,.\-]{9,79}?)(?=[,.])/g, (m, pre, mid) => {
          if (needed() <= 0) return m;
          return pre + '<strong>' + mid + '</strong>';
        });
      }
      // Fallback: se ainda < 3, parte o texto puro em segmentos e força destaques
      if (countStrong() < 3) {
        const stripTags = s => s.replace(/<[^>]+>/g, '');
        const plain = stripTags(r.diagnostico);
        const sentences = plain.split(/(?<=[.!?])\s+/);
        let replaced = 0;
        const stillNeeded = 3 - countStrong();
        sentences.forEach(sent => {
          if (replaced >= stillNeeded) return;
          const clean = sent.trim();
          if (clean.length < 10) return;
          const phrase = clean.slice(0, Math.min(60, clean.length));
          if (diagHtml.includes('<strong>' + phrase)) return;
          // Substitui a primeira ocorrência da frase no diagHtml
          const idx = diagHtml.indexOf(phrase);
          if (idx !== -1) {
            diagHtml = diagHtml.slice(0, idx) + '<strong>' + phrase + '</strong>' + diagHtml.slice(idx + phrase.length);
            replaced++;
          }
        });
      }
      diagEl.innerHTML = diagHtml;
    }

    const scoreMap = {
      hidratacao: 'Hidratação', brilho: 'Brilho', firmeza: 'Firmeza',
      textura: 'Textura', oleosidade: 'Oleosidade', sensibilidade: 'Sensibilidade',
      rugas: 'Rugas', manchas: 'Manchas'
    };
    document.querySelectorAll('.score-pill').forEach(pill => {
      const lbl = pill.querySelector('.score-lbl');
      if (!lbl) return;
      const chave = Object.keys(scoreMap).find(k => scoreMap[k] === lbl.textContent.trim());
      if (!chave || r.scores[chave] === undefined) return;
      const val = pill.querySelector('.score-val');
      const fill = pill.querySelector('.score-bar-fill');
      if (val) val.textContent = r.scores[chave] + '%';
      if (fill) fill.dataset.width = r.scores[chave] + '%';
    });

    // ── RADAR CHART — via IA ──
    if (typeof window._renderRadar === 'function') {
      const keys = ['hidratacao','brilho','firmeza','textura','oleosidade','sensibilidade','rugas','manchas'];
      const scoresArr = keys.map(k => (r.scores && r.scores[k] !== undefined ? r.scores[k] : 50));
      window._radarScores = scoresArr; // salva para o fallback no result-boxes-ready
    }

    // Popula fotos do scanner na screen resultado
    (function() {
      const caps = answers && answers['scanner_captures'];
      // Sempre exibe o crachá (com foto real ou placeholder) — display controlado via CSS
      // const frontOnlyWrap = document.getElementById('result-photo-front-only-wrap');
      // if (frontOnlyWrap) frontOnlyWrap.style.display = 'flex';

      const wrap = document.getElementById('result-photos-wrap');
      if (!wrap) return;
      const map = { front: 'result-photo-front', left: 'result-photo-right', right: 'result-photo-left' };

      Object.entries(map).forEach(([key, id]) => {
        const box = document.getElementById(id);
        if (!box) return;
        const src = caps && caps[key];
        if (src) {
          box.innerHTML = '';
          const img = document.createElement('img');
          img.src = src;
          box.appendChild(img);

          // Sincroniza foto frente para o elemento desktop (col-left)
          if (key === 'front') {
            const desktopBox = document.getElementById('result-photo-front-desktop');
            if (desktopBox) {
              desktopBox.innerHTML = '';
              const imgD = document.createElement('img');
              imgD.src = src;
              desktopBox.appendChild(imgD);
            }
          }
        }
      });
      // Sempre exibe o box — com fotos reais ou com placeholders
      wrap.style.display = 'flex';
    })();

    // Popula dados do crachá
    (function() {
      const crachaName  = document.getElementById('crachaName');
      const crachaIdade = document.getElementById('crachaIdade');
      const craCidade   = document.getElementById('craCidade');
      const craTipo     = document.getElementById('craTipo');
      const craAlergia  = document.getElementById('craAlergia');
      const crachaAlergiaRow = document.getElementById('cracha-alergia-row');

      const _nome   = (document.getElementById('inputNomeNew') && document.getElementById('inputNomeNew').value.trim()) || '—';
      const _idade  = (document.getElementById('inputIdadeNew') && document.getElementById('inputIdadeNew').value.trim()) || '—';
      const _cidade = document.getElementById('city-label')?.textContent || '—';
      const _tipo   = answers['q1'] || '—';
      const _alergia = answers['q_alergia'] || '';

      const tipoMap = { oleosa: 'Oleosa', seca: 'Seca', mista: 'Mista', normal: 'Normal' };

      if (crachaName)  crachaName.textContent  = _nome;
      if (crachaIdade) crachaIdade.textContent  = _idade ? _idade + ' anos' : '—';
      if (craCidade)   craCidade.textContent    = _cidade;
      if (craTipo)     craTipo.textContent      = tipoMap[_tipo] || _tipo;
      if (craAlergia && crachaAlergiaRow) {
        const alergiaLower = (_alergia || '').toLowerCase().trim();
        if (_alergia && alergiaLower !== 'nenhuma' && alergiaLower !== 'nao' && alergiaLower !== 'não' && alergiaLower !== '') {
          craAlergia.textContent = _alergia.charAt(0).toUpperCase() + _alergia.slice(1);
        } else {
          craAlergia.textContent = 'Nenhuma';
        }
      }
      // ── Espelha dados para o clone mobile ──
      const mNome   = document.getElementById('crachaName-mobile');
      const mIdade  = document.getElementById('crachaIdade-mobile');
      const mCidade = document.getElementById('craCidade-mobile');
      const mTipo   = document.getElementById('craTipo-mobile');
      const mAler   = document.getElementById('craAlergia-mobile');
      if (mNome)   mNome.textContent   = _nome;
      if (mIdade)  mIdade.textContent  = _idade ? _idade + ' anos' : '—';
      if (mCidade) mCidade.textContent = _cidade;
      if (mTipo)   mTipo.textContent   = tipoMap[_tipo] || _tipo;
      if (mAler) {
        const alergiaLower = (_alergia || '').toLowerCase().trim();
        mAler.textContent = (_alergia && alergiaLower !== 'nenhuma' && alergiaLower !== 'nao' && alergiaLower !== 'não' && alergiaLower !== '') ? _alergia.charAt(0).toUpperCase() + _alergia.slice(1) : 'Nenhuma';
      }
      // Exibe o clone mobile
      const crachaMobileWrap = document.getElementById('cracha-mobile-wrap');
      if (crachaMobileWrap) crachaMobileWrap.style.display = 'block';
      // Sincroniza foto frente para o clone mobile
      const caps = answers && answers['scanner_captures'];
      if (caps && caps.front) {
        const mPhotoBox = document.getElementById('result-photo-front-mobile');
        if (mPhotoBox) {
          mPhotoBox.innerHTML = '';
          const imgM = document.createElement('img');
          imgM.src = caps.front;
          mPhotoBox.appendChild(imgM);
        }
      }
    })();

    // ── Carrossel automático das fotos do scanner ──────────────────────
    (function() {
      const wrap  = document.getElementById('result-photos-wrap');
      const track = document.getElementById('result-photos-track');
      if (!wrap || !track) return;

      // Observa quando wrap fica visível (após fade in) para iniciar
      const observer = new MutationObserver(function() {
        if (wrap.style.opacity === '1' && track.children.length >= 3) {
          observer.disconnect();
          startCarousel();
        }
      });
      observer.observe(wrap, { attributes: true, attributeFilter: ['style'] });

      function startCarousel() {
        const cols = Array.from(track.children);
        if (cols.length < 3) return;

        // Clona 2 sets extras para loop visualmente contínuo
        [1, 2].forEach(() => {
          cols.forEach(col => track.appendChild(col.cloneNode(true)));
        });

        const GAP  = 14;
        const SPEED = 28; // px/s

        let pos      = 0;
        let lastTime = null;

        function getItemW() {
          return (track.parentElement.offsetWidth - GAP * 2) / 3;
        }

        function tick(now) {
          if (!lastTime) { lastTime = now; requestAnimationFrame(tick); return; }
          const dt = (now - lastTime) / 1000;
          lastTime = now;
          pos += SPEED * dt;

          const itemW    = getItemW();
          const stepSize = itemW + GAP;

          // DOM rotation: move primeiro filho para o fim sem resetar pos
          // Isso elimina completamente o glitch de reset
          if (pos >= stepSize) {
            pos -= stepSize;
            track.style.transition = 'none';
            track.appendChild(track.children[0]);
          }

          track.style.transform = 'translateX(-' + pos.toFixed(2) + 'px)';
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    })();


    const idadeInput = document.getElementById('inputIdadeNew');
    const idadeReal = idadeInput ? parseInt(idadeInput.value.trim()) : null;
    if (idadeReal && r.idadePele) {
      const ageRealEl = document.getElementById('ageReal');
      const ageSkinEl = document.getElementById('ageSkin');
      const deltaEl   = document.getElementById('ageDelta');
      if (ageRealEl) ageRealEl.textContent = idadeReal;
      if (ageSkinEl) ageSkinEl.innerHTML = '<em style="color:var(--blush);">' + r.idadePele + '</em>';
      if (deltaEl) {
        const diff = r.idadePele - idadeReal;
        deltaEl.style.display = 'block';
        deltaEl.innerHTML = '* Sua pele aparenta <strong style="color:var(--blush);">' + diff + ' anos a mais</strong> que a sua idade cronológica. Fatores como exposição solar acumulada, estresse oxidativo, baixa hidratação e sono irregular tendem a acelerar o envelhecimento da barreira cutânea - e é exatamente aí que o seu protocolo vai atuar.';
      }
    }

    if (r.produtoEssencial) {
      const pe = r.produtoEssencial;
      const emojiMap = { 'Hiperpigmentação': '✨', 'Oleosidade': '🌿', 'Hidratação': '💧', 'Manchas': '🌟', 'Rugas': '🧬', 'Firmeza': '💎', 'Sensibilidade': '🌸', 'Acne': '🫧' };
      const emoji  = document.getElementById('essentialEmoji');
      const name   = document.getElementById('essentialName');
      const brand  = document.getElementById('essentialBrand');
      const price  = document.getElementById('essentialPrice');
      const reason = document.getElementById('essentialReason');
      const badge  = document.getElementById('essentialBadge');
      const emojiChar = emojiMap[pe.pontoFraco] || '⭐';
      if (emoji) {
        const imgUrlEss = (pe.urlImagem && pe.urlImagem.trim()) ? pe.urlImagem : buscarImagem(pe.nome, pe.marca);
        if (imgUrlEss) {
          emoji.innerHTML = '<img src="' + imgUrlEss + '" alt="' + (pe.nome || '').replace(/"/g, '') + '" style="width:56px;height:56px;object-fit:contain;background:#fff;border-radius:12px;" onerror="this.parentNode.innerHTML=\'' + emojiChar + '\'">';
        } else {
          emoji.textContent = emojiChar;
        }
      }
      if (name)   name.textContent  = removerVolume(pe.nome);
      if (brand)  brand.textContent = pe.marca;
      if (price)  price.textContent = 'R$ ' + pe.preco.toFixed(2).replace('.', ',');
      if (reason) reason.innerHTML  = pe.motivo;
      if (badge)  badge.textContent = '⭑ Prioridade';
      // ── Espelha dados para o clone mobile ──
      const emojiM  = document.getElementById('essentialEmoji-mobile');
      const nameM   = document.getElementById('essentialName-mobile');
      const brandM  = document.getElementById('essentialBrand-mobile');
      const priceM  = document.getElementById('essentialPrice-mobile');
      const reasonM = document.getElementById('essentialReason-mobile');
      const badgeM  = document.getElementById('essentialBadge-mobile');
      if (emojiM)  emojiM.innerHTML  = emoji  ? emoji.innerHTML  : emojiChar;
      if (nameM)   nameM.textContent  = removerVolume(pe.nome);
      if (brandM)  brandM.textContent = pe.marca;
      if (priceM)  priceM.textContent = 'R$ ' + pe.preco.toFixed(2).replace('.', ',');
      if (reasonM) reasonM.innerHTML  = pe.motivo;
      if (badgeM)  badgeM.textContent = '⭑ Prioridade';
    }

    if (r.dicasInteligentes) {
      const lista = document.getElementById('dicas-lista');
      if (lista) {
        // Emoji de alimentação varia conforme o conteúdo da dica
        const emojiAlimentacao = (texto) => {
          const t = (texto || '').toLowerCase();
          if (/álcool|vinho|cerveja|bebida alcoólica/.test(t)) return '🍷';
          if (/laticínio|leite|queijo|iogurte/.test(t))        return '🧀';
          if (/embutido|salsicha|mortadela|presunto|linguiça/.test(t)) return '🌭';
          if (/ultraprocessado|industrializado|fast.?food|pizza|salgadinho/.test(t)) return '🍕';
          if (/açúcar|doce|chocolate|sorvete|confeit/.test(t)) return '🍫';
          return '🍎';
        };
        const emojiDicas = { agua: '💧', protetor: '☀️', luzAzul: '📱', sono: '😴' };
        const ordem = ['agua', 'protetor', 'alimentacao', 'luzAzul', 'sono'];

        // ── Filtro: só exibe dica se o comportamento for problemático ──
        // Retorna true se o comportamento merece uma dica (i.e. é prejudicial)
        function _dicaMerece(chave) {
          const agua        = answers['q_agua']        || '';
          const fps         = answers['q_fps']         || '';
          const tela        = answers['q_tela']        || '';
          const alimentacao = answers['q_alimentacao'] || [];
          switch (chave) {
            case 'agua':
              // Só dá dica se bebe pouco (menos de 1L ou aproximadamente 1L)
              return agua === 'menos1' || agua === 'aprox1';
            case 'protetor':
              // Só dá dica se não usa sempre protetor solar
              return fps !== 'sempre';
            case 'alimentacao': {
              // Só dá dica se tiver itens problemáticos na dieta
              const ruins = ['Laticínios','Açúcar refinado','Ultraprocessados','Embutidos','Álcool'];
              const lista = Array.isArray(alimentacao) ? alimentacao : [];
              return lista.some(item => ruins.includes(item));
            }
            case 'luzAzul':
              // Só dá dica se tempo de tela for alto (4h+ por dia)
              return tela === '4a8' || tela === 'mais8';
            case 'sono':
              // Sono: sempre relevante para saúde da pele — exibe sempre
              return true;
            default:
              return true;
          }
        }

        lista.innerHTML = ordem.map(chave => {
          if (!_dicaMerece(chave)) return '';
          const d = r.dicasInteligentes[chave];
          if (!d) return '';
          const emoji = chave === 'alimentacao'
            ? emojiAlimentacao((d.subtitulo || '') + ' ' + (d.titulo || ''))
            : emojiDicas[chave];
          return '<div class="dica-step">' +
            '<div class="rs-emoji">' + emoji + '</div>' +
            '<div>' +
              '<div class="dica-title">' + (function(t) {
                return t;
              })(d.titulo) + '</div>' +
              '<div class="dica-sub">' + limparSubtituloDica(d.subtitulo) + '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        // Sincroniza dicas para o elemento mobile-only
        const listaMobile = document.getElementById('dicas-lista-mobile');
        if (listaMobile) listaMobile.innerHTML = lista.innerHTML;
        const boxDicasMobile = document.getElementById('box-dicas-inteligentes-mobile');
        if (boxDicasMobile && !lista.innerHTML.trim()) boxDicasMobile.style.display = 'none';

        // Se não sobrou nenhuma dica, oculta o box inteiro
        const boxDicas = document.getElementById('box-dicas-inteligentes');
        if (boxDicas && !lista.innerHTML.trim()) boxDicas.style.display = 'none';
      }
    }

    // ── Busca urlImagem no catálogo pelo nome e marca do produto ──
    // Normaliza string: remove volume/quantidade, converte para minúsculas, colapsa espaços
    function _normNome(s) {
      return (s || '')
        .replace(/\s+\d+(\.\d+)?\s*(ml|mL|ML|g|G|kg|KG|oz|OZ)\b/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    }
    function buscarImagem(nomeProduto, marcaProduto) {
      if (!nomeProduto) return '';
      // Passagem 1: match exato
      for (var i = 0; i < CATALOGO.length; i++) {
        var entry = CATALOGO[i];
        if (marcaProduto && entry.marca !== marcaProduto) continue;
        for (var j = 0; j < entry.produtos.length; j++) {
          if (entry.produtos[j].nome === nomeProduto) {
            return entry.produtos[j].urlImagem || '';
          }
        }
      }
      // Passagem 2: normaliza e compara (remove volume, lowercase)
      var nNome = _normNome(nomeProduto);
      // Remove prefixo da marca se a IA colou junto (ex: "Neutrogena Gel..." → "Gel...")
      if (marcaProduto) {
        var prefixo = _normNome(marcaProduto) + ' ';
        if (nNome.indexOf(prefixo) === 0) nNome = nNome.slice(prefixo.length);
      }
      for (var i2 = 0; i2 < CATALOGO.length; i2++) {
        for (var j2 = 0; j2 < CATALOGO[i2].produtos.length; j2++) {
          if (_normNome(CATALOGO[i2].produtos[j2].nome) === nNome) {
            return CATALOGO[i2].produtos[j2].urlImagem || '';
          }
        }
      }
      // Passagem 3: verifica se o nome normalizado do catálogo está contido no nome da IA ou vice-versa
      for (var i3 = 0; i3 < CATALOGO.length; i3++) {
        for (var j3 = 0; j3 < CATALOGO[i3].produtos.length; j3++) {
          var nCat = _normNome(CATALOGO[i3].produtos[j3].nome);
          if (nNome.indexOf(nCat) !== -1 || nCat.indexOf(nNome) !== -1) {
            return CATALOGO[i3].produtos[j3].urlImagem || '';
          }
        }
      }
      return '';
    }

    // ── Renderiza rotinas ──
    const emojiPassos = ['🧼','✨','💧','☀️','🌿','🧪','🌙','🧬','💎','🌸'];
    function renderPassos(passos, containerId) {
      const container = document.getElementById(containerId);
      if (!container || !passos || !passos.length) return;
      container.innerHTML = passos.map(function(p) {
        const prodNome = p.produto || p.nome || '';
        const inicial = prodNome.charAt(0).toUpperCase();
        // urlImagem pode vir direto da IA ou precisa ser buscada no catálogo
        const imgUrl = (p.urlImagem && p.urlImagem.trim()) ? p.urlImagem : buscarImagem(p.produto, p.marca);
        const imgHtml = imgUrl
          ? '<img src="' + imgUrl + '" alt="' + prodNome + '" style="width:56px;height:56px;object-fit:contain;background:#fff;border-radius:16px;flex-shrink:0;box-shadow:0 2px 8px rgba(168,85,104,0.15),inset 0 1px 0 rgba(255,255,255,0.6);position:relative;z-index:1;" onerror="this.outerHTML=\'<div style=&quot;width:44px;height:44px;border-radius:10px;background:var(--wine-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;font-weight:600;color:var(--wine);&quot;>' + inicial + '</div>\'">'
          : '<div style="width:56px;height:56px;border-radius:16px;background:var(--wine-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;font-weight:600;color:var(--wine);box-shadow:0 2px 8px rgba(168,85,104,0.15);position:relative;z-index:1;">' + inicial + '</div>';
        // Linha 1: nome da etapa — rs-step-name (12px, ink-soft)
        const nomeLine = (p.nome)
          ? '<div class="rs-prod-type">' + p.nome + '</div>'
          : '';
        // Linha 2: nome do produto — rs-prod-name (15px, ink, 500)
        // Remove prefixo da marca se a IA colou junto (ex: "Principia Creme..." → "Creme...")
        // Remove também sufixo " - Marca" ou " — Marca" que a IA às vezes inclui no nome
        const prodNomeLimpo = (function(nome, marca) {
          if (!nome || !marca) return removerVolume(nome || '');
          // Remove sufixo " - Marca" ou " — Marca" (após sanitizeIA converter — em -)
          const sufNorm = ' - ' + marca.trim().toLowerCase();
          const sufNorm2 = ' — ' + marca.trim().toLowerCase();
          let n = nome.trim();
          const nLow = n.toLowerCase();
          if (nLow.endsWith(sufNorm)) n = n.slice(0, n.length - sufNorm.length).trim();
          else if (nLow.endsWith(sufNorm2)) n = n.slice(0, n.length - sufNorm2.length).trim();
          // Remove prefixo da marca se colou junto no início
          const prefNorm = marca.trim().toLowerCase() + ' ';
          const nNorm = n.trim().toLowerCase();
          if (nNorm.indexOf(prefNorm) === 0) return removerVolume(n.trim().slice(marca.trim().length + 1));
          return removerVolume(n);
        })(p.produto, p.marca);
        const prodLine = p.produto
          ? '<div class="rs-prod-name">' + prodNomeLimpo + '</div>'
          : '';
        const brandLine = p.marca
          ? '<div class="rs-prod-brand">' + p.marca + '</div>'
          : '';
        // Linha 3: instrução — rs-prod-instr (12px, itálico, wine), sem ponto final
        const descLine = (p.descricao)
          ? '<div class="rs-prod-instr">' + (function(t) {
              t = semPontoFinal(t);
              return t;
            })(p.descricao) + '</div>'
          : '';
        const precoFormatado = (typeof p.preco === 'number')
          ? 'R$ ' + p.preco.toFixed(2).replace('.', ',')
          : (p.preco ? 'R$ ' + p.preco : '');
        const precoPilula = precoFormatado
          ? '<span class="prod-fit" style="position:relative;z-index:1;align-self:flex-start;text-transform:none;letter-spacing:0;font-weight:500;">' + precoFormatado + '</span>'
          : '';
        return '<div class="routine-step">' +
          imgHtml +
          precoPilula +
          '<div class="rs-part2" style="position:relative;z-index:1;width:100%;flex-basis:100%;">' + nomeLine + prodLine + brandLine + descLine + '</div>' +
        '</div>';
      }).join('');
    }

    if (r.rotinaMatinal && r.rotinaMatinal.length) {
      renderPassos(r.rotinaMatinal, 'rotina-matinal-cards');
    }
    if (r.rotinaNoturna && r.rotinaNoturna.length) {
      renderPassos(r.rotinaNoturna, 'rotina-noturna-cards');
    }
    if (r.rotinaSemanal && r.rotinaSemanal.length) {
      renderPassos(r.rotinaSemanal, 'rotina-semanal-cards');
    } else {
      const grupoSemanal = document.getElementById('rotina-semanal-group');
      if (grupoSemanal) grupoSemanal.style.display = 'none';
    }

    // ── Renderiza indicados para você ──
    if (r.indicadosParaVoce && r.indicadosParaVoce.length) {
      const prodRecs = document.getElementById('indicados-para-voce');
      if (prodRecs) {
        const emojisCat = { 'limpeza': '🧼', 'sérum': '✨', 'hidratante': '💧', 'protetor solar': '☀️', 'tônico': '🌿', 'esfoliante': '🧪', 'contorno dos olhos': '👁️', 'tratamento': '🧬' };
        prodRecs.innerHTML = r.indicadosParaVoce.map(function(p) {
          const nomeLimpo = removerVolume(p.nome);
          const inicial = nomeLimpo.charAt(0).toUpperCase();
          const imgUrlRec = (p.urlImagem && p.urlImagem.trim()) ? p.urlImagem : buscarImagem(p.nome, p.marca);
          const imgHtml = imgUrlRec
            ? '<img src="' + imgUrlRec + '" alt="' + nomeLimpo + '" style="width:56px;height:56px;object-fit:contain;background:#fff;border-radius:16px;flex-shrink:0;box-shadow:0 2px 8px rgba(168,85,104,0.15),inset 0 1px 0 rgba(255,255,255,0.6);position:relative;z-index:1;" onerror="this.outerHTML=\'<div style=&quot;width:44px;height:44px;border-radius:10px;background:var(--wine-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;font-weight:600;color:var(--wine);&quot;>' + inicial + '</div>\'">'
            : '<div style="width:56px;height:56px;border-radius:16px;background:var(--wine-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;font-weight:600;color:var(--wine);box-shadow:0 2px 8px rgba(168,85,104,0.15);position:relative;z-index:1;">' + inicial + '</div>';
          const preco = (typeof p.preco === 'number')
            ? 'R$ ' + p.preco.toFixed(2).replace('.', ',')
            : 'R$ ' + p.preco;
          return '<div class="prod-rec">' +
            imgHtml +
            '<div class="pr-part1" style="position:relative;z-index:1;flex:1;">' +
              '<div class="prod-name">' + nomeLimpo + '</div>' +
              '<div class="prod-brand">' + p.marca + '</div>' +
              '<div class="prod-price">' + preco + '</div>' +
            '</div>' +
            '<span class="prod-fit" style="position:relative;z-index:1;align-self:flex-start;">' + '❤︎ ' + p.fit + '%</span>' +
            '<div class="pr-part2" style="position:relative;z-index:1;width:100%;flex-basis:100%;">' +
              '<div class="prod-name">' + nomeLimpo + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
        // ── Espelha para o clone mobile ──
        const prodRecsMobile = document.getElementById('indicados-para-voce-mobile');
        if (prodRecsMobile) prodRecsMobile.innerHTML = prodRecs.innerHTML;
      }
    }
  }

  function startAguardando() {
    answers['telefone'] = document.getElementById('inputTelefone').value.trim();

    const nome  = (document.getElementById('inputNomeNew') && document.getElementById('inputNomeNew').value.trim()) || '';
    const idade = (document.getElementById('inputIdadeNew') && document.getElementById('inputIdadeNew').value.trim()) || '';
    const respostas = {
      nome,
      idade,
      cidade:              document.getElementById('city-label')?.textContent || '',
      uv:                  document.getElementById('uv-val')?.textContent || '',
      umidade:             document.getElementById('hum-val')?.textContent || '',
      poluicao:            document.getElementById('pol-val')?.textContent || '',
      tipoPele:            answers['q1'] || '',
      queixas:             (answers['q2'] || []).join(', '),
      areas:               (answers['q_area'] || []).join(', '),
      hidratacao:          answers['q_hidrat'] || '',
      sensibilidade:       answers['q_sensivel'] || '',
      rotina:              answers['q_rotina'] || '',
      rotinaMatinal:       (answers['q4'] || []).join(', '),
      rotinaNoturna:       (answers['q4b'] || []).join(', '),
      maquiagem:           answers['q_maquiagem'] || '',
      preparoPele:         answers['q_preparo_pele'] || '',
      demaquilante:        (answers['q_demaquila'] || []).join(', '),
      exposicaoSol:        answers['q_sol'] || '',
      protetor:            answers['q_fps'] || '',
      tempoTela:           answers['q_tela'] || '',
      alergia:             answers['q_alergia'] || '',
      ingredientesAlergia: document.getElementById('inputAlergia')?.value || 'nenhum',
      receita:             answers['q_receita'] || '',
      produtoReceita:      document.getElementById('inputReceita')?.value || 'nenhum',
      agua:                answers['q_agua'] || '',
      alimentacao:         (answers['q_alimentacao'] || []).join(', '),
      gravidez:            answers['q_grav'] || '',
      orcamento:           answers['q6'] || 'medio'
    };

    const produtosFiltrados = filtrarPorOrcamento(respostas.orcamento);

    window._iaPromise = chamarIA(respostas, produtosFiltrados)
      .then(resultado => { window._iaResultado = resultado; window._iaNome = nome; })
      .catch(err => { console.error('Erro IA:', err); window._iaResultado = null; });

    goTo('aguardando');


    // ── Pílulas: loop infinito até a IA responder ──
    const pillIds   = ['ls1','ls2','ls3','ls4','ls5'];
    const FILL_DUR  = 2520;   // ms por pílula
    const HOLD_GAP  = 220;    // ms entre pílulas
    let   pillIndex = 0;
    let   pillLoopActive = true; // controlado pela Promise da IA

    // Reset visual das pílulas ao entrar na screen
    pillIds.forEach(id => {
      const el = document.getElementById(id);
      el.classList.remove('filling','filled','active','done','pill-visible');
    });

    // Quando a IA terminar, sinaliza para o loop parar após a pílula atual
    const iaReady = new Promise(resolve => {
      if (window._iaResultado !== undefined && window._iaResultado !== null) {
        resolve(); // já resolveu (improvável mas seguro)
      } else {
        window._iaPromise
          .then(() => resolve())
          .catch(() => resolve()); // resolve mesmo em erro para não travar
      }
    });

    // Assim que a IA responder: para o loop de pílulas
    // O fadeout e a transição para resultado são disparados pelo canvas do brilho (após 2s de crescimento)
    iaReady.then(() => {
      pillLoopActive = false;
      window._glowGrowDone = false; // permite que o canvas dispare o fadeout uma única vez
      console.log('[Dermia] IA pronta. Encerrando loop de pílulas no próximo ciclo.');
    });

    function fillNextPill() {
      // Se o loop foi desativado e acabamos de completar um ciclo completo → para
      // (fadeout e resultado serão disparados pelo canvas do brilho após 2s de crescimento)
      if (!pillLoopActive && pillIndex >= pillIds.length) {
        console.log('[Dermia] Loop de pílulas encerrado. Aguardando brilho atingir máximo.');
        return;
      }

      // Ao completar as 5 pílulas, reinicia o índice (loop)
      if (pillIndex >= pillIds.length) {
        pillIndex = 0;
      }

      const el   = document.getElementById(pillIds[pillIndex]);
      const wrap = el.closest('.pill-float-wrap') || el;
      const pillParamIdx = pillIndex;
      pillIndex++;
      const SLIDE_DUR = 480;

      // ── 1. Slide up + fade in ──
      if (window._pillFloatParams && window._pillFloatParams[pillParamIdx]) {
        const fp = window._pillFloatParams[pillParamIdx];
        fp.exiting    = false;
        fp.entryStart = performance.now();
        fp.entryDur   = SLIDE_DUR;
        fp.entryFromY = 36;
      }
      wrap.style.opacity    = '0';
      wrap.style.transition = `opacity ${SLIDE_DUR}ms cubic-bezier(0.4,0,0.2,1)`;
      void wrap.offsetHeight;
      wrap.style.opacity = '1';
      el.classList.add('pill-visible');
      setTimeout(() => { wrap.style.transition = ''; }, SLIDE_DUR + 16);

      // ── 2. Após fade in, inicia preenchimento ──
      setTimeout(() => {
        el.classList.add('filling');

        // ── 3. Após preencher, slide down + fade out; então próxima pílula ──
        setTimeout(() => {
          el.classList.remove('filling');
          el.classList.add('filled');
          window._aguardandoPillsFilled = (window._aguardandoPillsFilled || 0) + 1;

          const EXIT_DUR = 360;
          if (window._pillFloatParams && window._pillFloatParams[pillParamIdx]) {
            const fp = window._pillFloatParams[pillParamIdx];
            fp.exiting    = true;
            fp.entryStart = performance.now();
            fp.entryDur   = EXIT_DUR;
            fp.entryFromY = 36;
          }
          wrap.style.transition = `opacity ${EXIT_DUR}ms cubic-bezier(0.4,0,0.2,1)`;
          wrap.style.opacity    = '0';
          setTimeout(() => {
            wrap.style.transition = '';
            wrap.style.opacity    = '0';
            el.classList.remove('pill-visible','filled');
            setTimeout(fillNextPill, HOLD_GAP);
          }, EXIT_DUR + 16);
        }, FILL_DUR);
      }, 460);
    }

    // Glow: progresso e timestamps expostos globalmente para o canvas
    window._glowProgress = 0;
    window._glowStartMs = performance.now();
    window._glowIaResolvedAt = null; // canvas usa este valor para fase 2
    window._glowGrowDone = true;     // true = bloqueado; false = permite disparar resultado
    let _glowDone = false;

    // Quando a IA responder: registra timestamp e libera o canvas para fase 2
    iaReady.then(() => {
      window._glowIaResolvedAt = performance.now();
      window._glowGrowDone = false; // libera o canvas para disparar fadeout após 2s
      _glowDone = true;
      window._glowProgress = 1.0;
      console.log('[Dermia] Glow fase 2 iniciada — IA respondeu em', ((window._glowIaResolvedAt - window._glowStartMs) / 1000).toFixed(1) + 's');
    });

    function _updateGlowProgress() {
      if (_glowDone) return;
      const elapsed = performance.now() - window._glowStartMs;
      // Linear de 0 → 0.92 (reserva os últimos 8% para o flash ao terminar)
      // Assume tempo máximo esperado de 45s; progresso é elapsed/45000 com teto em 0.92
      window._glowProgress = Math.min(elapsed / 45000, 0.92);
      requestAnimationFrame(_updateGlowProgress);
    }
    requestAnimationFrame(_updateGlowProgress);

    // Inicia após o typewriter de "Avaliando sua pele..." terminar.
    window._aguardandoPillsFilled = 0;
    const AGUARDANDO_TW_TEXT = 'Avaliando sua pele...';
    const AGUARDANDO_TW_DELAY = 160 + AGUARDANDO_TW_TEXT.length * 32 + 300; // ~1056ms
    setTimeout(fillNextPill, AGUARDANDO_TW_DELAY);
  }

  // ── Float nas pílulas da screen aguardando ──
  // Registrado via _startAguardandoAnim para só rodar quando o overlay
  // já está display:flex. Antes estava dentro de startAguardando() e
  // o loop parava imediatamente pois o overlay ainda era display:none
  // no momento do primeiro requestAnimationFrame.
  (function registerPillFloat() {
    const _prevAnim = window._startAguardandoAnim;
    window._startAguardandoAnim = function() {
      if (typeof _prevAnim === 'function') _prevAnim();

      const PERIODS   = [5200, 6100, 4800, 5700, 6400];
      const AMPS      = [6, 8, 7, 9, 6];
      const AMPS_X    = [4, 5, 3, 4, 5];
      const PERIODS_X = [7100, 5800, 6600, 7300, 5500];
      const ROTS      = [0.28, -0.22, 0.18, -0.30, 0.24];
      const BASE_Y    = 4;

      const t0 = performance.now();

      const wrapEls = ['pfw1','pfw2','pfw3','pfw4','pfw5']
        .map(id => document.getElementById(id))
        .filter(Boolean);

      const params = wrapEls.map((el, i) => ({
        el,
        period:   PERIODS[i],
        amp:      AMPS[i],
        phase:    -Math.PI / 2 + i * (Math.PI * 2 / 5),
        rotAmp:   ROTS[i],
        rotPhase: -Math.PI / 2 + i * (Math.PI * 2 / 5) + Math.PI / 4,
        ampX:     AMPS_X[i],
        periodX:  PERIODS_X[i],
        phaseX:   -Math.PI / 2 + i * (Math.PI * 2 / 5) + Math.PI / 3,
        entryStart: 0, entryDur: 0, entryFromY: 0,
      }));

      // Expõe params para o fillNextPill poder definir entryStart/entryDur/entryFromY
      window._pillFloatParams = params;

      // Easing exponencial — entrada (fromY → 0) e saída (0 → exitToY)
      function pillEntryOffset(p, now) {
        if (!p.entryDur) return 0;
        const elapsed = now - p.entryStart;
        if (elapsed >= p.entryDur) return 0;
        const progress = elapsed / p.entryDur;
        const eased = 1 - Math.exp(-5.5 * progress);
        if (p.exiting) {
          // Saída: parte de 0 e vai até entryFromY (negativo = para baixo)
          return p.entryFromY * eased;
        }
        // Entrada: parte de entryFromY e vai até 0
        return p.entryFromY * (1 - eased);
      }

      function floatTick(now) {
        // Para quando o overlay aguardando sair de cena
        const ov = document.getElementById('aguardando-overlay');
        if (!ov || ov.style.display === 'none') {
          params.forEach(p => { p.el.style.transform = ''; });
          return;
        }
        const t = now - t0;
        params.forEach(p => {
          const entryOff = pillEntryOffset(p, now);
          const oscY   = Math.sin(2 * Math.PI * t / p.period  + p.phase);
          const oscX   = Math.sin(2 * Math.PI * t / p.periodX + p.phaseX);
          const floatY = BASE_Y - p.amp  * (oscY * 0.5 + 0.5);
          const floatX = p.ampX * oscX;
          const rot    = p.rotAmp * Math.sin(2 * Math.PI * t / p.period + p.rotPhase);
          p.el.style.transform = `translateX(${floatX.toFixed(2)}px) translateY(${(floatY + entryOff).toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`;
        });
        requestAnimationFrame(floatTick);
      }
      requestAnimationFrame(floatTick);
    };
  })();

  function showResult() {
    // Garante que o clone mobile do crachá está visível
    const crachaMWrap = document.getElementById('cracha-mobile-wrap');
    if (crachaMWrap) crachaMWrap.style.display = 'block';
    // Se a IA respondeu, preenche os campos com os dados reais antes de animar
    if (window._iaResultado) {
      preencherResultadoIA(window._iaResultado, window._iaNome || 'você');
    }

    const nome = (document.getElementById('inputNomeNew') && document.getElementById('inputNomeNew').value.trim()) || 'você';
    const tipo = answers['q1'] || 'mista';
    const tipos = {
      oleosa:   'oleosa',
      mista:    'mista com tendência oleosa',
      normal:   'normal e equilibrada',
      seca:     'seca com tendência a ressecamento',
      sensivel: 'sensível'
    };
    // Se a IA retornou um tituloPerfil, extrai o texto do <em> para o typewriter
    let tipoLabel = tipos[tipo] || tipo;
    if (window._iaResultado && window._iaResultado.tituloPerfil) {
      const match = window._iaResultado.tituloPerfil.match(/<em>(.*?)<\/em>/);
      if (match) tipoLabel = match[1];
    }

    // Atualiza o nome no subtítulo
    const nomeEl = document.getElementById('resultNome');
    if (nomeEl) nomeEl.textContent = nome;

    // Prepara o título para typewriter
    const titleTyped = document.getElementById('result-title-typed');
    const titlePlaceholder = document.getElementById('result-title-placeholder');
    const titleEl = document.getElementById('resultTitle');

    // Atualiza placeholder com conteúdo real para reservar a altura correta
    const placeholderContent = (window._iaResultado && window._iaResultado.tituloPerfil)
      ? window._iaResultado.tituloPerfil
      : 'Seu perfil de pele é<br> <em>' + tipoLabel + '</em>.';
    if (titlePlaceholder) {
      titlePlaceholder.innerHTML = placeholderContent;
      titlePlaceholder.style.display = 'block';
      titlePlaceholder.style.visibility = 'hidden';
    }
    if (titleTyped) {
      titleTyped.innerHTML = '';
      titleTyped.style.display = 'none';
    }

    // Reseta estado de entrada
    const resultName  = document.getElementById('resultTitle');
    const resultSub   = document.getElementById('resultSubtitle');
    const resultBadge = document.getElementById('result-protocolo-badge');
    if (resultName) { resultName.style.opacity = '0'; resultName.style.transition = ''; }
    if (resultSub)  { resultSub.style.visibility = 'hidden'; resultSub.style.opacity = '0'; }
    if (resultBadge) { resultBadge.classList.remove('badge-visible'); }

    goTo('result');

    // ── RADAR: renderiza após o result-overlay estar visível ──
    setTimeout(function() {
      if (typeof window._renderRadar !== 'function') return;
      let scoresArr = window._radarScores;
      if (!scoresArr) {
        const labels = ['Hidratação','Brilho','Firmeza','Textura','Oleosidade','Sensibilidade','Rugas','Manchas'];
        scoresArr = labels.map(function(lbl) {
          let val = 50;
          document.querySelectorAll('.score-pill').forEach(function(pill) {
            const lblEl = pill.querySelector('.score-lbl');
            const valEl = pill.querySelector('.score-val');
            if (lblEl && valEl && lblEl.textContent.trim() === lbl) {
              val = parseInt(valEl.textContent) || 50;
            }
          });
          return val;
        });
      }
      window._renderRadar(scoresArr);
    }, 300);

    // Badge + crachá desktop entram juntos (500ms)
    setTimeout(() => {
      if (resultBadge) resultBadge.classList.add('badge-visible');
      const crachaEl = document.getElementById('result-cracha');
      if (crachaEl) {
        crachaEl.style.transition = 'opacity 0.55s cubic-bezier(0.22,1,0.36,1)';
        crachaEl.style.opacity    = '1';
        // Inicia flutuação imediatamente — o rAF assume o transform desde o início
        if (typeof window._floatAddCracha === 'function') window._floatAddCracha();
        setTimeout(() => {
          if (crachaEl) crachaEl.style.transition = '';
        }, 570);
      }
    }, 500);

    // Typewriter — inicia após fade-in do h2
    setTimeout(() => {
      // Fade-in do h2
      if (resultName) {
        resultName.style.transition = 'opacity 0.55s cubic-bezier(0.22,1,0.36,1)';
        resultName.style.opacity = '1';
      }

      // TW começa junto com o fade-in
      if (titleTyped && titlePlaceholder) {
        const fullHTML = 'Seu perfil de pele é<br> <em>' + tipoLabel + '</em>.';

        function tokenizeResult(html) {
          const tokens = [], re = /<br\s*\/?>|<em>(.*?)<\/em>/g;
          let last = 0, m;
          while ((m = re.exec(html)) !== null) {
            for (const c of html.slice(last, m.index)) tokens.push({ char: c, em: false, raw: false });
            if (m[0].startsWith('<br')) { tokens.push({ char: '<br>', em: false, raw: true }); }
            else { for (const c of m[1]) tokens.push({ char: c, em: true, raw: false }); }
            last = re.lastIndex;
          }
          for (const c of html.slice(last)) tokens.push({ char: c, em: false, raw: false });
          return tokens;
        }

        function buildResultRendered(tokens, count) {
          let out = '', inEm = false;
          for (let i = 0; i < count; i++) {
            const tok = tokens[i];
            if (tok.raw) { if (inEm) { out += '</em>'; inEm = false; } out += tok.char; }
            else if (tok.em) { if (!inEm) { out += '<em>'; inEm = true; } out += tok.char; }
            else {
              if (inEm) { out += '</em>'; inEm = false; }
              const c = tok.char;
              out += c==='<'?'&lt;':c==='>'?'&gt;':c==='&'?'&amp;':c;
            }
          }
          if (inEm) out += '</em>';
          return out;
        }

        const tokens = tokenizeResult(fullHTML);
        const CURSOR = '<span class="tw-cursor">|</span>';
        const CHAR_MS = 38;
        let idx = 0;

        // Mostra o typed sobre o placeholder (placeholder ainda ocupa o espaço)
        titleTyped.style.display = 'block';
        titleTyped.innerHTML = CURSOR;

        const twInterval = setInterval(() => {
          idx++;
          titleTyped.innerHTML = buildResultRendered(tokens, idx) + CURSOR;
          if (idx >= tokens.length) {
            clearInterval(twInterval);
            setTimeout(() => {
              titleTyped.innerHTML = buildResultRendered(tokens, tokens.length);
              // Placeholder some — o typed (position:absolute) não ocupa espaço
              // mas o h2 já tem o texto final visível no typed
              if (titlePlaceholder) titlePlaceholder.style.display = 'none';
              // Agora que o placeholder sumiu, o h2 pode encolher — mas o typed
              // está absolute então o h2 fica com altura 0.
              // Solução: converter typed para position:relative após o TW
              if (titleTyped) {
                titleTyped.style.position = 'relative';
                titleTyped.style.top = '';
                titleTyped.style.left = '';
                titleTyped.style.width = '';
              }
              if (resultName) { setTimeout(() => { resultName.style.transition = ''; }, 580); }

              // Subtítulo e boxes sincronizados — ambos a 200ms após TW
              setTimeout(() => {
                if (resultSub) {
                  resultSub.style.visibility = 'visible';
                  resultSub.style.transition = 'opacity 1.4s ease';
                  resultSub.style.opacity = '1';
                  // Fotos do scanner: fade in sincronizado com subtítulo
                  const photosWrap = document.getElementById('result-photos-wrap');
                  if (photosWrap) {
                    photosWrap.style.opacity = '1';
                  }
                  setTimeout(() => { if (resultSub) resultSub.style.transition = ''; }, 1450);
                }
                // Crachá mobile: fade-in sincronizado com o subtítulo
                const crachaElMSync = document.getElementById('result-cracha-mobile');
                if (crachaElMSync) {
                  crachaElMSync.style.transition = 'opacity 1.4s ease';
                  crachaElMSync.style.opacity = '1';
                  setTimeout(() => { if (crachaElMSync) crachaElMSync.style.transition = ''; }, 1450);
                }
                // Slide-up + fade-in dos boxes começa junto com o subtítulo
                if (typeof window._floatCollectResult === 'function') window._floatCollectResult();
                window.dispatchEvent(new Event('result-boxes-ready'));
              }, 200);

            }, 400);
          }
        }, CHAR_MS);
      }
    }, 1000);

    // Score bars e boxes: disparam quando o typewriter terminar (evento 'result-boxes-ready')
    window.addEventListener('result-boxes-ready', function _onBoxesReady() {
      window.removeEventListener('result-boxes-ready', _onBoxesReady);
      const RESULT_BOX_GAP = 120;
      // Barras: lógica padrão: abaixo de 50% → wine, 50% ou mais → steel
      // Para oleosidade/sensibilidade/rugas/manchas: lógica invertida
      const invertedScores = ['Oleosidade', 'Sensibilidade', 'Rugas', 'Manchas'];
      const fills = document.querySelectorAll('.score-bar-fill');
      fills.forEach((b) => {
        const pill = b.closest('.score-pill');
        const lbl = pill ? pill.querySelector('.score-lbl') : null;
        const isInverted = lbl && invertedScores.includes(lbl.textContent.trim());
        const pct = parseInt(b.dataset.width);
        if (isInverted) {
          b.style.background = pct < 50 ? 'var(--steel)' : 'var(--wine)';
        } else {
          b.style.background = pct < 50 ? 'var(--wine)' : 'var(--steel)';
        }
      });

      document.querySelectorAll('.score-bar-fill').forEach(b => {
        b.style.width = b.dataset.width;
      });

      // Exibe % e tinge apenas os boxes abaixo de 50%
      document.querySelectorAll('.score-pill').forEach(pill => {
        const val = pill.querySelector('.score-val');
        const stars = pill.querySelectorAll('.score-stars .star');
        if (!val) return;
        const pct = parseInt(val.textContent);

        // Garante formato %
        if (!val.textContent.includes('%')) val.textContent = pct + '%';

        // Tinge: abaixo de 50% → wine; demais → marfim
        pill.classList.remove('pill-wine', 'pill-steel');
        if (pct < 50) pill.classList.add('pill-wine');

        // Preenche estrelas conforme %
        const filled = Math.round(pct / 100 * 5);
        stars.forEach((s, i) => {
          setTimeout(() => {
            if (i < filled) s.classList.add('filled');
          }, i * 120);
        });
      });

      // ── Popula box Idade da Pele ──
  
    // Popula fotos do scanner na screen resultado
    (function() {
      const caps = answers && answers['scanner_captures'];
      // Sempre exibe o crachá (com foto real ou placeholder) — display controlado via CSS
      // const frontOnlyWrap2 = document.getElementById('result-photo-front-only-wrap');
      // if (frontOnlyWrap2) frontOnlyWrap2.style.display = 'flex';

      const wrap = document.getElementById('result-photos-wrap');
      if (!wrap) return;
      const map = { front: 'result-photo-front', left: 'result-photo-right', right: 'result-photo-left' };

      Object.entries(map).forEach(([key, id]) => {
        const box = document.getElementById(id);
        if (!box) return;
        const src = caps && caps[key];
        if (src) {
          box.innerHTML = '';
          const img = document.createElement('img');
          img.src = src;
          box.appendChild(img);

          // Sincroniza foto frente para o elemento desktop (col-left)
          if (key === 'front') {
            const desktopBox = document.getElementById('result-photo-front-desktop');
            if (desktopBox) {
              desktopBox.innerHTML = '';
              const imgD = document.createElement('img');
              imgD.src = src;
              desktopBox.appendChild(imgD);
            }
          }
        }
      });
      // Sempre exibe o box — com fotos reais ou com placeholders
      wrap.style.display = 'flex';
    })();

    // ── Carrossel automático das fotos do scanner ──────────────────────
    (function() {
      const wrap  = document.getElementById('result-photos-wrap');
      const track = document.getElementById('result-photos-track');
      if (!wrap || !track) return;

      // Observa quando wrap fica visível (após fade in) para iniciar
      const observer = new MutationObserver(function() {
        if (wrap.style.opacity === '1' && track.children.length >= 3) {
          observer.disconnect();
          startCarousel();
        }
      });
      observer.observe(wrap, { attributes: true, attributeFilter: ['style'] });

      function startCarousel() {
        const cols = Array.from(track.children);
        if (cols.length < 3) return;

        // Clona 2 sets extras para loop visualmente contínuo
        [1, 2].forEach(() => {
          cols.forEach(col => track.appendChild(col.cloneNode(true)));
        });

        const GAP  = 14;
        const SPEED = 28; // px/s

        let pos      = 0;
        let lastTime = null;

        function getItemW() {
          return (track.parentElement.offsetWidth - GAP * 2) / 3;
        }

        function tick(now) {
          if (!lastTime) { lastTime = now; requestAnimationFrame(tick); return; }
          const dt = (now - lastTime) / 1000;
          lastTime = now;
          pos += SPEED * dt;

          const itemW    = getItemW();
          const stepSize = itemW + GAP;

          // DOM rotation: move primeiro filho para o fim sem resetar pos
          // Isso elimina completamente o glitch de reset
          if (pos >= stepSize) {
            pos -= stepSize;
            track.style.transition = 'none';
            track.appendChild(track.children[0]);
          }

          track.style.transform = 'translateX(-' + pos.toFixed(2) + 'px)';
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    })();


    const idadeInput = document.getElementById('inputIdadeNew');
      const idadeReal = idadeInput ? parseInt(idadeInput.value.trim()) : null;

      if (idadeReal && !isNaN(idadeReal)) {
        const fator = 0.10 + Math.random() * 0.10;
        const idadePele = Math.round(idadeReal * (1 + fator));

        document.getElementById('ageReal').textContent = idadeReal;
        document.getElementById('ageSkin').innerHTML = '<em style="color:var(--blush);">' + idadePele + '</em>';

        const diff = idadePele - idadeReal;
        const deltaEl = document.getElementById('ageDelta');
        if (deltaEl) {
          deltaEl.style.display = 'block';
          deltaEl.innerHTML = '* Sua pele aparenta <strong style="color:var(--blush);">' + diff + ' anos a mais</strong> que a sua idade cronológica. Fatores como exposição solar acumulada, estresse oxidativo, baixa hidratação e sono irregular tendem a acelerar o envelhecimento da barreira cutânea - e é exatamente aí que o seu protocolo vai atuar.';
        }
      }
    }); // end result-boxes-ready

  }

  // ── PARTÍCULAS SCREEN AGUARDANDO ──────────────────────────────────────────
  (function aguardandoParticles() {
    const canvas = document.getElementById('aguardando-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const LINK_DIST   = 120;   // distância máxima para desenhar linha
    const N_FREE      = 45;    // partículas livres flutuando
    const N_ATTRACTED = 220;   // partículas atraídas — fluxo contínuo por ~16s
    const TOTAL_DUR   = 20000; // duração total do fluxo em ms (+25%)

    let W, H, cx, cy;          // dimensões e centro de atração
    let opacity = 0, targetOpacity = 0;
    const FADE_SPEED = 0.022;
    let glowFlash = 0;
    let glowStartTime = 0;
    let glowR = 0;             // raio atual do brilho — interpola suavemente

    // Partículas livres (flutuam na tela)
    let free = [];
    // Partículas atraídas (entram voando de fora, ficam no cluster)
    let attracted = [];
    // Cluster de partículas que chegaram ao centro
    let cluster = [];

    function rand(a, b) { return a + Math.random() * (b - a); }
    function wine() { return Math.random() < 0.65; }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      // Se o overlay ainda está display:none, rect tem width=0 — usa window como fallback
      W = canvas.width  = Math.round(rect.width  || window.innerWidth);
      H = canvas.height = Math.round(rect.height || window.innerHeight);
    }

    function updateAttractor() {
      const mobileOffset = window.innerWidth <= 580 ? -70 : 0;
      const el = document.getElementById('particle-attractor');
      if (!el) { cx = W / 2; cy = H / 2 + mobileOffset; return; }
      const er = el.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      // Se o canvas ainda não tem posição real, fallback ao centro
      if (!cr.width) { cx = W / 2; cy = H / 3 + mobileOffset; return; }
      cx = er.left - cr.left + er.width  / 2;
      cy = er.top  - cr.top  + er.height / 2 + mobileOffset;
    }

    function makeFree() {
      const w = wine();
      return {
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4),
        r: rand(1.2, 2.2), wine: w, free: true
      };
    }

    function makeAttracted(i) {
      // Nasce nas bordas da tela (não só ao redor do attractor)
      // para que partículas venham de todas as partes da tela
      const angle = rand(0, Math.PI * 2);
      const dist  = Math.max(W, H) * (0.80 + rand(0, 0.80));
      const w = wine();
      // Stagger distribuído uniformemente ao longo de TOTAL_DUR
      const delay = (i / N_ATTRACTED) * TOTAL_DUR;
      // Ponto de nascimento: distribui por toda a área da tela (não só ao redor do centro)
      const bx = rand(0, W);
      const by = rand(0, H);
      return {
        x: bx, y: by,
        vx: 0, vy: 0,
        r: rand(1.4, 2.6), wine: w,
        delay,
        arrived: false,
        tx: cx + rand(-3, 3),
        ty: cy + rand(-3, 3),
        free: false,
        t0: null
      };
    }

    function init() {
      resize();
      updateAttractor();
      free      = Array.from({ length: N_FREE },      (_, i) => makeFree());
      attracted = Array.from({ length: N_ATTRACTED }, (_, i) => makeAttracted(i));
      cluster   = [];
    }

    // Reinicia as partículas atraídas quando a screen fica ativa
    function resetAttracted(now) {
      glowStartTime = now;
      glowFlash = 0;
      glowR = 0;
      attracted = Array.from({ length: N_ATTRACTED }, (_, i) => makeAttracted(i));
      attracted.forEach(p => { p.t0 = now; });
      cluster = [];
      window._lastRespawnAt = now; // reinicia o timer de respawn
    }

    let wasActive = false;
    let resetPending = false;

    function draw(now) {
      const sc = document.getElementById('screen-aguardando');
      const isActive = sc && sc.classList.contains('active');

      // Quando a screen acaba de ficar ativa, agenda o reset para o próximo frame
      // (garante que o overlay já fez reflow e getBoundingClientRect é válido)
      if (isActive && !wasActive) resetPending = true;
      wasActive = isActive;

      // Executa o reset no frame seguinte, quando o DOM já está pintado
      if (resetPending && isActive) {
        resize();          // redimensiona agora que o overlay está display:flex
        updateAttractor(); // lê posição real do attractor
        resetAttracted(now);
        resetPending = false;
      }

      targetOpacity = isActive ? 1 : 0;
      opacity += (targetOpacity - opacity) * FADE_SPEED;
      if (opacity < 0.003 && !isActive) opacity = 0;

      ctx.clearRect(0, 0, W, H);

      if (opacity < 0.003) { requestAnimationFrame(draw); return; }

      updateAttractor();

      // ── Atualiza partículas livres ──
      for (const p of free) {
        p.vx *= 0.997; p.vy *= 0.997;
        if (Math.abs(p.vx) < 0.1) p.vx += rand(-0.06, 0.06);
        if (Math.abs(p.vy) < 0.1) p.vy += rand(-0.06, 0.06);
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx =  Math.abs(p.vx); }
        if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy =  Math.abs(p.vy); }
        if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }
      }

      // ── Atualiza partículas atraídas ──
      for (const p of attracted) {
        if (p.arrived) continue;
        if (p.t0 === null || now < p.t0 + p.delay) continue; // stagger

        const tdx = p.tx - p.x, tdy = p.ty - p.y;
        const dist = Math.sqrt(tdx * tdx + tdy * tdy);

        if (dist < 1.5) {
          p.arrived = true;
          p.x = p.tx; p.y = p.ty;
          cluster.push(p);
          continue;
        }

        // Aceleração em direção ao target — 25% mais lenta
        const force = Math.min(0.0525 * (dist / 60 + 1), 1.65);
        p.vx += (tdx / dist) * force;
        p.vy += (tdy / dist) * force;
        // Amortecimento forte perto do centro — pousa suavemente
        const damp = dist < 30 ? 0.82 : 0.88;
        p.vx *= damp; p.vy *= damp;
        p.x += p.vx; p.y += p.vy;
      }

      // ── Auto-respawn: injeta novas partículas atraídas a cada 3.5s ──
      if (isActive && !window._lastRespawnAt) window._lastRespawnAt = now;
      if (isActive && now - (window._lastRespawnAt || now) > 3500) {
        window._lastRespawnAt = now;
        const RESPAWN_N = 35;
        const newBatch = Array.from({ length: RESPAWN_N }, (_, i) => {
          const p = makeAttracted(i);
          p.t0 = now;
          p.delay = (i / RESPAWN_N) * 2000; // escalonado em 2s
          p.spawnTime = now; // para fade-in de 2s
          return p;
        });
        attracted.push(...newBatch);
        // Limpa partículas já chegadas para não acumular indefinidamente
        if (attracted.length > 600) {
          attracted = attracted.filter(p => !p.arrived).concat(cluster.slice(-50));
          cluster = cluster.slice(-50);
        }
      }

      // ── Todas as partículas visíveis para linhas ──
      const centerNode = cluster.length > 0 ? [{ x: cx, y: cy, wine: true }] : [];
      const visible = [...free, ...attracted.filter(p => !p.arrived), ...centerNode];

      ctx.globalAlpha = opacity;

      // ── Linhas entre partículas próximas ──
      for (let i = 0; i < visible.length; i++) {
        const a = visible[i];
        const dca = Math.sqrt((a.x-cx)*(a.x-cx) + (a.y-cy)*(a.y-cy));
        // Item 3: fade-out a partir de 100px do centro (era 55px)
        const fadeA = Math.min(Math.max(dca - 100, 0) / 55, 1);
        // Item 2: fade-in do spawn — se p.spawnTime existe, fade de 2s
        const spawnA = (a.spawnTime && now - a.spawnTime < 2000) ? (now - a.spawnTime) / 2000 : 1;
        for (let j = i + 1; j < visible.length; j++) {
          const b = visible[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d > LINK_DIST) continue;
          const dcb   = Math.sqrt((b.x-cx)*(b.x-cx) + (b.y-cy)*(b.y-cy));
          const fadeB = Math.min(Math.max(dcb - 100, 0) / 55, 1);
          const spawnB = (b.spawnTime && now - b.spawnTime < 2000) ? (now - b.spawnTime) / 2000 : 1;
          const fade  = Math.min(fadeA, fadeB) * Math.min(spawnA, spawnB);
          if (fade < 0.01) continue;
          const alpha = (1 - d / LINK_DIST) * 0.48 * fade;
          const w = a.wine && b.wine, s = !a.wine && !b.wine;
          const r = w ? 168 : s ? 74 : 120;
          const g = w ? 85  : s ? 127 : 100;
          const bl= w ? 104 : s ? 165 : 135;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.75;
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      // ── Pontos — fade-out a partir de 100px do centro, fade-in no spawn ──
      for (const p of [...free, ...attracted.filter(p => !p.arrived)]) {
        const dx = p.x - cx, dy = p.y - cy;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        // Item 3: começa a desaparecer a 100px, chega a 0 em ~55px adicionais
        const centerFade = Math.min(Math.max(distToCenter - 100, 0) / 55, 1);
        // Item 2: fade-in de 2s para partículas de respawn
        const spawnFade = (p.spawnTime && now - p.spawnTime < 2000) ? (now - p.spawnTime) / 2000 : 1;
        const fadeAlpha = centerFade * spawnFade;
        if (fadeAlpha < 0.01) continue;
        const r  = p.wine ? 168 : 74;
        const g  = p.wine ? 85  : 127;
        const bl = p.wine ? 104 : 165;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${bl},${(0.85 * fadeAlpha).toFixed(3)})`;
        ctx.fill();
      }

      // ── Brilho central ──
      const screenR    = Math.sqrt(W * W + H * H) / 2;
      const MIN_CORE   = 200;
      // Fase 2 só ativa se: IA respondeu E tela aguardando está visível E não foi disparado ainda
      const aguardandoAtiva = sc && sc.classList.contains('active');
      const iaResolved = window._glowProgress >= 1.0 && aguardandoAtiva;

      let glowRender, glowAlpha;

      if (!iaResolved) {
        const t = now * 0.001;
        const pulse =
          0.38 +
          0.16 * Math.sin(t * 2.80 + 1.1) +
          0.11 * Math.sin(t * 4.20 + 2.4) +
          0.07 * Math.sin(t * 6.10 + 0.7) +
          0.05 * Math.sin(t * 8.50 + 3.2);
        glowRender = Math.max(screenR * pulse, MIN_CORE);
        glowAlpha  = 0.32 + 0.18 * Math.sin(t * 3.10 + 0.5) + 0.10 * Math.sin(t * 5.40 + 1.9);
      } else {
        const GROW_DUR = 2000;
        // Só calcula elapsed se _glowIaResolvedAt foi definido por startAguardando()
        const elapsed2 = (window._glowIaResolvedAt && window._glowIaResolvedAt > 0)
          ? Math.min(now - window._glowIaResolvedAt, GROW_DUR)
          : 0;
        const t2 = elapsed2 / GROW_DUR;
        glowRender = Math.max(screenR * (0.38 + t2 * 0.62), MIN_CORE);
        glowAlpha  = 0.45 + t2 * 0.30 + glowFlash * 0.72;

        // Dispara fadeout + resultado: só se _glowGrowDone === false (explicitamente liberado)
        if (elapsed2 >= GROW_DUR && window._glowGrowDone === false) {
          window._glowGrowDone = true;
          const aguardandoScreen = document.getElementById('screen-aguardando');
          if (aguardandoScreen) aguardandoScreen.classList.add('aguardando-fadeout');
          const headerEl = document.querySelector('header');
          if (headerEl) headerEl.classList.add('aguardando-fadeout');
          setTimeout(() => {
            if (typeof window._aguardandoFlash === 'function') {
              window._aguardandoFlash(() => showResult());
            } else {
              showResult();
            }
          }, 500);
        }
      }

      glowR = glowRender;
      const gR = glowFlash > 0 ? glowR + glowFlash * screenR * 1.2 : glowR;

      if (gR > 0.5 || glowFlash > 0) {
        // Halo externo difuso
        const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, gR * 3.5);
        g1.addColorStop(0,   `rgba(240,212,220,${Math.min(glowAlpha, 1).toFixed(3)})`);
        g1.addColorStop(0.4, `rgba(240,212,220,${Math.min(glowAlpha * 0.5, 1).toFixed(3)})`);
        g1.addColorStop(1,   'rgba(240,212,220,0)');
        ctx.beginPath(); ctx.arc(cx, cy, gR * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g1; ctx.fill();

        // Núcleo concentrado (mínimo MIN_CORE px de raio)
        const coreR     = Math.max(gR, MIN_CORE);
        const coreAlpha = iaResolved ? Math.min(0.82 + glowFlash * 0.30, 1) : Math.min(glowAlpha * 0.85, 1);
        const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        g2.addColorStop(0,    'rgba(253,240,245,1.00)');
        g2.addColorStop(0.20, 'rgba(248,225,232,0.98)');
        g2.addColorStop(0.55, `rgba(240,212,220,${coreAlpha.toFixed(3)})`);
        g2.addColorStop(1,    'rgba(240,212,220,0)');
        ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = g2; ctx.fill();

        // Flash final
        if (glowFlash > 0) {
          ctx.fillStyle = `rgba(240,212,220,${(glowFlash * 0.94).toFixed(3)})`;
          ctx.fillRect(0, 0, W, H);
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); init(); });

    // Expõe o flash para ser chamado quando a última pílula terminar
    window._aguardandoFlash = function(onComplete) {
      const FLASH_DUR    = 1100; // ms do crescimento até o máximo
      const FADEOUT_DUR  = 400;  // ms do fade out após atingir o máximo
      const t0 = performance.now();
      function stepIn(now) {
        glowFlash = Math.min((now - t0) / FLASH_DUR, 1);
        if (glowFlash < 1) {
          requestAnimationFrame(stepIn);
        } else {
          // Atingiu o máximo — inicia fade out
          glowFlash = 1;
          const t1 = performance.now();
          function stepOut(now2) {
            glowFlash = Math.max(1 - (now2 - t1) / FADEOUT_DUR, 0);
            if (glowFlash > 0) {
              requestAnimationFrame(stepOut);
            } else {
              glowFlash = 0;
              if (onComplete) onComplete();
            }
          }
          requestAnimationFrame(stepOut);
        }
      }
      requestAnimationFrame(stepIn);
    };

    init();
    requestAnimationFrame(draw);
  })();

  updateProgress();

  /* ── TYPEWRITER GENÉRICO ─────────────────────────────────────────────────
     Roda em qualquer screen ao entrar (exceto screen 0, que tem o próprio).
     O span.screen-q-typed começa visibility:hidden via CSS.
     Só fica visible quando o timer arranca — nunca aparece estático.
  ── */
  function runScreenTypewriter(screen) {
    if (!screen || screen.id === 'screen-0') return;
    const h2 = screen.querySelector('[data-tw-html]');
    if (!h2) return;
    const typedEl = h2.querySelector('.screen-q-typed');
    if (!typedEl) return;
    const fullHTML = h2.dataset.twHtml;
    if (!fullHTML) return;

    // Se já foi exibido antes, mostra o texto final diretamente (sem typewriter)
    if (h2.dataset.twDone === '1') {
      typedEl.innerHTML = fullHTML;
      typedEl.style.visibility = 'visible';
      return;
    }

    // Cancela timer anterior e reseta estado
    if (typedEl._twTimer) { clearInterval(typedEl._twTimer); typedEl._twTimer = null; }
    typedEl.innerHTML = '';
    typedEl.style.visibility = 'hidden';

    function tokenize(html) {
      const tokens = [], re = /<em>(.*?)<\/em>/g;
      let last = 0, m;
      while ((m = re.exec(html)) !== null) {
        for (const c of html.slice(last, m.index)) tokens.push({ char: c, em: false });
        for (const c of m[1])                       tokens.push({ char: c, em: true  });
        last = re.lastIndex;
      }
      for (const c of html.slice(last)) tokens.push({ char: c, em: false });
      return tokens;
    }

    function buildRendered(tokens, count) {
      let out = '', inEm = false;
      for (let i = 0; i < count; i++) {
        if (tokens[i].em) {
          if (!inEm) { out += '<em>'; inEm = true; }
          out += tokens[i].char;
        } else {
          if (inEm) { out += '</em>'; inEm = false; }
          const c = tokens[i].char;
          out += c==='<'?'&lt;':c==='>'?'&gt;':c==='&'?'&amp;':c;
        }
      }
      if (inEm) out += '</em>';
      return out;
    }

    const tokens  = tokenize(fullHTML);
    const CURSOR  = '<span class="tw-cursor">|</span>';
    const CHAR_MS = 32;
    let   idx     = 0;

    // Pequeno delay (160ms) — garante que a animação de entrada da screen
    // já iniciou antes de mostrar qualquer texto
    setTimeout(() => {
      typedEl.style.visibility = 'visible';
      typedEl.innerHTML = CURSOR;
      typedEl._twTimer = setInterval(() => {
        idx++;
        typedEl.innerHTML = buildRendered(tokens, idx) + CURSOR;
        if (idx >= tokens.length) {
          clearInterval(typedEl._twTimer);
          typedEl._twTimer = null;
          // Remove o cursor imediatamente — evita quebra de linha
          typedEl.innerHTML = buildRendered(tokens, tokens.length);
          h2.dataset.twDone = '1';
        }
      }, CHAR_MS);
    }, 160);
  }

  /* ── FLOAT DO BOX DE FUNDO DAS INTER SCREENS ─────────────────────────────
     O .interblock-bg-box usa position:fixed + transform:translate(-50%,-50%)
     como base. O float adiciona translateY e rotate em cima disso.
     Todo o conteúdo da screen (steps, textos) fica dentro do fluxo normal
     e acompanha o box por serem irmãos no DOM com z-index maior.
     Os círculos têm float próprio e z-index ainda maior.
  ── */
  (function() {
    const PERIOD  = 5800;
    const AMP_Y   = 7;
    const AMP_ROT = 0.18;
    let t0      = performance.now();
    let box       = null;
    let rafId     = null;

    function tick(now) {
      if (!box) return;
      const t   = now - t0;
      const osc = Math.sin(2 * Math.PI * t / PERIOD);
      const y   = AMP_Y * osc;
      const rot = AMP_ROT * Math.sin(2 * Math.PI * t / PERIOD + Math.PI / 4);
      box.style.transform = `translate(-50%, calc(-50% + ${y.toFixed(2)}px)) rotate(${rot.toFixed(3)}deg)`;
      rafId = requestAnimationFrame(tick);
    }

    window.startInterblockBoxFloat = function(screenOrBox) {
      const newBox = screenOrBox.classList.contains('interblock-bg-box')
        ? screenOrBox
        : screenOrBox.querySelector('.interblock-bg-box');
      if (!newBox) return;
      // Cancela float anterior
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      box = newBox;
      // Reseta t0 para que o seno comece em 0 (Y=0, rot=0),
      // garantindo continuidade perfeita com o widgetIn que termina em scale(1) sem deslocamento.
      t0 = performance.now();
      rafId = requestAnimationFrame(tick);
    };
  })();


  /* -----------------------------------------------------------------
     MIST — rolo infinito orgânico, sem divisões ou linhas retas
     Blobs vivem num espaco virtual alto (N_SCREENS x H).
     Nenhum fillRect reto — apenas gradientes radiais gaussianos.
     O fade do topo e desenhado com scanlines + ondulacao senoidal
     para eliminar qualquer aparencia de linha reta.
     ----------------------------------------------------------------- */
  (function initMist() {

    const canvas = document.getElementById('mist-canvas');
    const ctx    = canvas.getContext('2d');

    const N_SCREENS = 36;
    const DRIFT     = 0.00020;
    const OSC_X     = 0.09;
    const OSC_Y     = 0.055;

    let W, H;
    let blobs = [];
    let scrollY = 0, scrollTarget = 0, scrollAnim = null;

    function sh(n) {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    }

    // Alpha de um blob baseado na sua posição Y normalizada no viewport.
    // threshold único por blob [0.28, 0.50] + feather grande = sem linha dura.
    function alphaFactor(pyNorm, threshold) {
      const feather = 0.28;
      const t = (pyNorm - threshold) / feather;
      const s = Math.max(0, Math.min(1, t));
      return s * s * (3 - 2 * s);
    }

    // Cria um blob com os parâmetros dados
    function makeBlob(i, seed, fracY, threshold, rxN, ryN, alphaBase, r, g, b) {
      const s = (n) => sh(seed * 19 + n * 7);
      return {
        fracY, threshold,
        curCx:     0.04 + s(2) * 0.92,
        rxN, ryN,
        alphaBase,
        r, g, b,
        vx:       (s(6) - 0.5) * DRIFT,
        vy:       (s(7) - 0.5) * DRIFT * 0.35,
        oxPhase:   s(8)  * Math.PI * 2,
        oyPhase:   s(9)  * Math.PI * 2,
        oxSpeed:   0.0013 + s(10) * 0.0009,
        oySpeed:   0.0008 + s(11) * 0.0006,
        curCy: 0, rx: 1, ry: 1,
        cyBounceMin: 0, cyBounceMax: 0,
      };
    }

    function generateBlobs() {
      blobs = [];
      const total = N_SCREENS * 10;

      for (let i = 0; i < total; i++) {
        const s = (n) => sh(i * 19 + n * 7);
        const colorRoll = s(1);
        let r, g, b;
        if      (colorRoll < 0.40) { r=168; g= 85; b=104; }
        else if (colorRoll < 0.75) { r= 74; g=127; b=165; }
        else                        { r=200; g=137; b=154; }

        const slice     = i / total * N_SCREENS;
        const cyFrac    = 0.20 + s(0) * 0.95;
        const fracY     = Math.floor(slice) + cyFrac;
        const threshold = 0.28 + s(12) * 0.22;

        blobs.push(makeBlob(i, i, fracY, threshold,
          0.32 + s(3) * 0.26,
          0.24 + s(4) * 0.20,
          0.30 + s(5) * 0.36,
          r, g, b));
      }

      // ── Blobs âncora de base ──────────────────────────────────────────────
      // Para cada página, adiciona 3 blobs na faixa [0.72, 1.00] da janela.
      // Eles garantem que o fundo (onde está o botão "voltar") sempre tenha
      // presença de névoa. threshold baixo [0.55, 0.75] = sempre visíveis
      // na metade inferior, nunca criam linha no topo.
      for (let page = 0; page < N_SCREENS; page++) {
        const anchors = [
          { cxBase: 0.15, cyInPage: 0.78, rxN: 0.48, ryN: 0.26, alpha: 0.42, seed: 3000 + page * 3 + 0 },
          { cxBase: 0.80, cyInPage: 0.84, rxN: 0.45, ryN: 0.24, alpha: 0.46, seed: 3000 + page * 3 + 1 },
          { cxBase: 0.50, cyInPage: 0.92, rxN: 0.50, ryN: 0.22, alpha: 0.32, seed: 3000 + page * 3 + 2 },
        ];
        anchors.forEach((a, ai) => {
          const s = (n) => sh(a.seed * 19 + n * 7);
          const colorRoll = s(1);
          let r, g, b;
          if      (colorRoll < 0.40) { r=168; g= 85; b=104; }
          else if (colorRoll < 0.75) { r= 74; g=127; b=165; }
          else                        { r=200; g=137; b=154; }

          const fracY = page + a.cyInPage;
          // threshold: 0.55–0.72 → blob só aparece na metade inferior do viewport
          const threshold = 0.55 + s(12) * 0.17;

          const bl = makeBlob(0, a.seed, fracY, threshold,
            a.rxN, a.ryN, a.alpha, r, g, b);
          bl.curCx = a.cxBase + (s(2) - 0.5) * 0.12;
          blobs.push(bl);
        });
      }

      // ── 3 blobs extras para screen 0 ────────────────────────────────────
      [
        { cx:0.18, cyFrac:0.65, rxN:0.46, ryN:0.33, alpha:0.50, r:168, g: 85, b:104, thr:0.38, seed:2000 },
        { cx:0.82, cyFrac:0.72, rxN:0.44, ryN:0.31, alpha:0.54, r: 74, g:127, b:165, thr:0.42, seed:2001 },
        { cx:0.50, cyFrac:0.85, rxN:0.52, ryN:0.29, alpha:0.36, r:200, g:137, b:154, thr:0.35, seed:2002 },
      ].forEach(e => {
        const bl = makeBlob(0, e.seed, e.cyFrac, e.thr, e.rxN, e.ryN, e.alpha, e.r, e.g, e.b);
        bl.curCx = e.cx;
        blobs.push(bl);
      });
    }

    function applyDimensions() {
      const totalH = N_SCREENS * H;
      for (const b of blobs) {
        b.rx    = b.rxN * W;
        b.ry    = b.ryN * H;
        b.curCy = b.fracY * H;
        b.cyBounceMin = b.ry;
        b.cyBounceMax = totalH - b.ry;
      }
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      applyDimensions();
    }

    window.addEventListener('resize', resize);
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    generateBlobs();
    applyDimensions();

    let last = 0;
    function draw(ts) {
      const dt = Math.min(ts - last, 50);
      last = ts;

      for (const b of blobs) {
        b.curCx += b.vx * dt;
        b.curCy += b.vy * dt;
        if (b.curCx < 0.02) { b.curCx = 0.02; b.vx =  Math.abs(b.vx); }
        if (b.curCx > 0.98) { b.curCx = 0.98; b.vx = -Math.abs(b.vx); }
        if (b.curCy < b.cyBounceMin) { b.curCy = b.cyBounceMin; b.vy =  Math.abs(b.vy); }
        if (b.curCy > b.cyBounceMax) { b.curCy = b.cyBounceMax; b.vy = -Math.abs(b.vy); }
      }

      ctx.clearRect(0, 0, W, H);

      // Clip: canvas não renderiza além do fim do footer
      const _footer = document.getElementById('site-footer');
      const _footerRect = _footer ? _footer.getBoundingClientRect() : null;
      const _clipH = _footerRect ? Math.min(_footerRect.bottom, H) : H;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, _clipH);
      ctx.clip();

      // 1. Fundo marfim
      ctx.fillStyle = '#F7F2EA';
      ctx.fillRect(0, 0, W, H);

      // 2. Blobs — alpha modulado por posição no viewport
      const viewTop = scrollY;
      const viewBot = scrollY + H;

      for (const b of blobs) {
        const ox = Math.sin(b.oxPhase + b.oxSpeed * ts) * OSC_X;
        const oy = Math.sin(b.oyPhase + b.oySpeed * ts) * OSC_Y;

        const vy = b.curCy + oy * H;
        if (vy + b.ry < viewTop || vy - b.ry > viewBot) continue;

        const py     = vy - viewTop;
        const pyNorm = py / H;
        const factor = alphaFactor(pyNorm, b.threshold);
        if (factor < 0.01) continue;

        const alpha = b.alphaBase * factor;
        const px    = (b.curCx + ox) * W;
        const rr    = Math.max(b.rx, b.ry);

        const grad = ctx.createRadialGradient(px, py, 0, px, py, rr);
        grad.addColorStop(0,    'rgba(' + b.r + ',' + b.g + ',' + b.b + ',' + alpha.toFixed(3) + ')');
        grad.addColorStop(0.42, 'rgba(' + b.r + ',' + b.g + ',' + b.b + ',' + (alpha * 0.35).toFixed(3) + ')');
        grad.addColorStop(1,    'rgba(' + b.r + ',' + b.g + ',' + b.b + ',0)');

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(b.rx / rr, b.ry / rr);
        ctx.translate(-px, -py);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Névoa garantida no fundo — onde o botão Voltar mora ───────────────
      var interBtnCy = Math.min((H * 0.5 + 323 + 20) / H, 0.97);

      // Blobs extras no centro do viewport quando em inter screens
      var interBlobs = [
        { cx: 0.20, cy: 0.92,        rxN: 0.55, ryN: 0.36, a: 0.44, r:168, g: 85, b:104 },
        { cx: 0.78, cy: 0.88,        rxN: 0.52, ryN: 0.34, a: 0.48, r: 74, g:127, b:165 },
        { cx: 0.18, cy: interBtnCy,  rxN: 0.48, ryN: 0.28, a: 0.46, r:168, g: 85, b:104 },
      ];
      if (window.mistInterMode) {
        interBlobs = interBlobs.concat([
          { cx: 0.15, cy: 0.18, rxN: 0.70, ryN: 0.45, a: 0.55, r:168, g: 85, b:104 },
          { cx: 0.82, cy: 0.22, rxN: 0.65, ryN: 0.42, a: 0.52, r: 74, g:127, b:165 },
          { cx: 0.50, cy: 0.50, rxN: 0.80, ryN: 0.55, a: 0.38, r:217, g:168, b:178 },
          { cx: 0.25, cy: 0.62, rxN: 0.55, ryN: 0.38, a: 0.45, r: 74, g:127, b:165 },
          { cx: 0.75, cy: 0.58, rxN: 0.58, ryN: 0.40, a: 0.42, r:168, g: 85, b:104 },
        ]);
      }
      interBlobs.forEach(function(e) {
        const bx  = e.cx * W;
        const by  = e.cy * H;
        const brX = e.rxN * W;
        const brY = e.ryN * H;
        const brr = Math.max(brX, brY);
        const bg  = ctx.createRadialGradient(bx, by, 0, bx, by, brr);
        bg.addColorStop(0,    'rgba(' + e.r + ',' + e.g + ',' + e.b + ',' + e.a + ')');
        bg.addColorStop(0.45, 'rgba(' + e.r + ',' + e.g + ',' + e.b + ',' + (e.a * 0.30).toFixed(3) + ')');
        bg.addColorStop(1,    'rgba(' + e.r + ',' + e.g + ',' + e.b + ',0)');
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(brX / brr, brY / brr);
        ctx.translate(-bx, -by);
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(bx, by, brr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Máscara de marfim no topo — gradiente suave, sem fillRect sólido
      // Durante inter screens a máscara é quase transparente para névoa aparecer
      var maskOpacity = window.mistInterMode ? 0.08 : 1.0;
      var maskOpacity2 = window.mistInterMode ? 0.04 : 0.96;
      var maskOpacity3 = window.mistInterMode ? 0.02 : 0.60;
      const mask = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      mask.addColorStop(0,    'rgba(247,242,234,' + maskOpacity + ')');
      mask.addColorStop(0.25, 'rgba(247,242,234,' + maskOpacity2 + ')');
      mask.addColorStop(0.50, 'rgba(247,242,234,' + maskOpacity3 + ')');
      mask.addColorStop(0.75, 'rgba(247,242,234,0.18)');
      mask.addColorStop(1,    'rgba(247,242,234,0)');
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, W, H * 0.55);

      // Fecha o clip do footer
      ctx.restore();

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    window.goMist = function(dir, targetScreen) {
      if (!H) return;
      const pos = (typeof mistPos!=='undefined' && mistPos[targetScreen]!==undefined)
        ? mistPos[targetScreen]
        : (typeof targetScreen==='number' ? targetScreen : 0);
      scrollTarget  = Math.max(0, Math.min(pos * H, (N_SCREENS - 1) * H));

      // Snap instantâneo — sem animação (para screens puladas condicionalmente)
      if (dir === 'snap') {
        if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = null; }
        scrollY = scrollTarget;
        return;
      }

      if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = null; }

      const startY = scrollY;
      const delta  = scrollTarget - startY;
      if (Math.abs(delta) < 1) return;

      const DUR = 950;
      const t0  = performance.now();
      function animScroll(ts) {
        const p    = Math.min((ts - t0) / DUR, 1);
        // ease-out cúbico — começa rápido e desacelera lentamente no final
        const ease = 1 - Math.pow(1 - p, 3);
        scrollY = startY + delta * ease;
        if (p < 1) scrollAnim = requestAnimationFrame(animScroll);
        else { scrollY = scrollTarget; scrollAnim = null; }
      }
      setTimeout(() => {
        scrollAnim = requestAnimationFrame(animScroll);
      }, 80); // pequeno delay inicial — os elementos da tela saem primeiro
    };

  })();

  // ── RETICÊNCIAS ANIMADAS ────────────────────────────────────────────
  let _dotsInterval = null;
  function startDots() {
    const ids = ['uv-val','hum-val','pol-val'];
    let n = 1;
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.innerHTML = '<span class="loading-dots">.</span>'; }
    });
    clearInterval(_dotsInterval);
    _dotsInterval = setInterval(() => {
      n = (n % 3) + 1;
      const dots = '.'.repeat(n);
      ids.forEach(id => {
        const span = document.getElementById(id)?.querySelector('.loading-dots');
        if (span) span.textContent = dots;
      });
    }, 400);
  }
  function stopDots() { clearInterval(_dotsInterval); _dotsInterval = null; }

  const UF_NAMES = {
    AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia',
    CE:'Ceará', DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás',
    MA:'Maranhão', MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais',
    PA:'Pará', PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí',
    RJ:'Rio de Janeiro', RN:'Rio Grande do Norte', RS:'Rio Grande do Sul',
    RO:'Rondônia', RR:'Roraima', SC:'Santa Catarina', SP:'São Paulo',
    SE:'Sergipe', TO:'Tocantins'
  };

  function loadLocationData() {
    // Garante que o botão começa desabilitado ao entrar na screen 7
    const btn7 = document.getElementById('next-7');
    if (btn7) btn7.disabled = true;
    startDots();
    if (!navigator.geolocation) { showCitySearch(); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const geoRes  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR`);
        const geoData = await geoRes.json();
        const city    = geoData.address.city || geoData.address.town || geoData.address.village || 'Sua cidade';
        const ufSigla = (geoData.address['ISO3166-2-lvl4'] || '').split('-')[1] || geoData.address.state_code || '';
        const estado  = UF_NAMES[ufSigla] || geoData.address.state || ufSigla;
        document.getElementById('city-label').textContent = `${city}, ${estado}`;
        document.getElementById('city-desc').textContent  = 'Localização detectada automaticamente';
        enableNext7();
        await fetchWeatherByCoords(lat, lon);
      } catch(e) {
        stopDots();
        document.getElementById('city-label').textContent = 'Não foi possível obter dados';
        document.getElementById('city-desc').textContent  = 'Verifique sua conexão';
        // não habilita o botão em caso de erro
      }
    }, () => { showCitySearch(); });
  }

  async function fetchWeatherByCoords(lat, lon) {
    try {
      const wxRes  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,uv_index&timezone=auto`);
      const wxData = await wxRes.json();
      const uv  = wxData.current?.uv_index ?? null;
      const hum = wxData.current?.relative_humidity_2m ?? null;
      if (uv  !== null) document.getElementById('uv-val').textContent  = uv;
      if (hum !== null) document.getElementById('hum-val').textContent = hum + '%';
      const aqRes  = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi&timezone=auto`);
      const aqData = await aqRes.json();
      const aqi = aqData.current?.european_aqi ?? null;
      if (aqi !== null) document.getElementById('pol-val').textContent = aqi + ' AQI';
    } catch(e) {
      // Em caso de erro, mantém as reticências (não escreve —)
    }
    stopDots();
  }

  function showCitySearch() {
    document.getElementById('city-search-wrap').style.display = 'block';
    document.getElementById('city-box').style.display         = 'none';
    startDots();
  }

  // ── CITY AUTOCOMPLETE ─────────────────────────────────────────────
  let _cityList = null, _cityTimer = null, _dropActive = -1;

  async function getCityList() {
    if (_cityList) return _cityList;
    try {
      const res  = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
      const data = await res.json();
      _cityList = data.map(m => ({
        nome:   m.nome,
        uf:     m.microrregiao?.mesorregiao?.UF?.sigla || '',
        estado: UF_NAMES[m.microrregiao?.mesorregiao?.UF?.sigla || ''] || ''
      }));
    } catch(e) { _cityList = []; }
    return _cityList;
  }

  function onCityInput(val) {
    clearTimeout(_cityTimer);
    _dropActive = -1;
    const drop = document.getElementById('cityDropdown');
    if (val.length < 1) { drop.innerHTML = ''; drop.classList.remove('open'); return; }
    _cityTimer = setTimeout(async () => {
      const list  = await getCityList();
      const query = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matches = list.filter(c => {
        const n = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return n.startsWith(query);
      }).slice(0, 10);
      if (!matches.length) { drop.innerHTML = ''; drop.classList.remove('open'); return; }
      drop.innerHTML = matches.map((c, i) => {
        const label = `${c.nome}, ${c.estado}`;
        const safeNome   = c.nome.replace(/'/g, "\\'");
        const safeEstado = c.estado.replace(/'/g, "\\'");
        return `<div class="city-option" data-idx="${i}"
          onmousedown="selectCityOption('${safeNome}','${c.uf}','${safeEstado}')">${label}</div>`;
      }).join('');
      drop.classList.add('open');
    }, 180);
  }

  function onCityKey(e) {
    const drop  = document.getElementById('cityDropdown');
    const items = drop.querySelectorAll('.city-option');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[_dropActive]?.classList.remove('active');
      _dropActive = Math.min(_dropActive + 1, items.length - 1);
      items[_dropActive].classList.add('active');
      items[_dropActive].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[_dropActive]?.classList.remove('active');
      _dropActive = Math.max(_dropActive - 1, 0);
      items[_dropActive].classList.add('active');
      items[_dropActive].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && _dropActive >= 0) {
      e.preventDefault();
      items[_dropActive].dispatchEvent(new MouseEvent('mousedown'));
    } else if (e.key === 'Escape') {
      drop.classList.remove('open');
    }
  }

  async function selectCityOption(nome, uf, estado) {
    const input = document.getElementById('citySearchInput');
    const drop  = document.getElementById('cityDropdown');
    input.value = `${nome}, ${estado}`;
    drop.innerHTML = ''; drop.classList.remove('open');
    // Mostra o city-box com a cidade escolhida e aplica tonalização vinho
    const cityBox   = document.getElementById('city-box');
    const cityLabel = document.getElementById('city-label');
    const cityDesc  = document.getElementById('city-desc');
    if (cityBox && cityLabel && cityDesc) {
      cityLabel.textContent = `${nome}, ${estado}`;
      cityDesc.textContent  = 'Localização inserida manualmente';
      cityBox.style.display = '';
    }
    enableNext7();
    startDots();
    try {
      const q    = encodeURIComponent(`${nome}, ${uf}, Brasil`);
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`);
      const data = await res.json();
      if (!data.length) throw new Error('not found');
      await fetchWeatherByCoords(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch(e) {
      stopDots();
      document.getElementById('uv-val').textContent  = '—';
      document.getElementById('hum-val').textContent = '—';
      document.getElementById('pol-val').textContent = '—';
    }
  }
  /* ─── INTRO ENTRANCE ─── */
  (function runIntroEntrance() {
    // Center row 2 by measuring sibling rows
    function centerRow2() {
      if (window.matchMedia('(max-width: 580px)').matches) {
        const row2 = document.querySelector('#intro-box-2')?.closest('.intro-step-row');
        if (row2) row2.style.marginLeft = '0';
        return;
      }
      const row1 = document.querySelector('#intro-box-1')?.closest('.intro-step-row');
      const row2 = document.querySelector('#intro-box-2')?.closest('.intro-step-row');
      if (!row1 || !row2) return;
      const w1 = row1.getBoundingClientRect().width;
      const w2 = row2.getBoundingClientRect().width;
      const offset = (w1 - w2) / 2;
      row2.style.marginLeft = offset > 0 ? offset + 'px' : '0';
    }
    // Run after layout settles
    setTimeout(centerRow2, 100);
    window.addEventListener('resize', centerRow2);

    const isMobile = window.matchMedia('(max-width: 580px)').matches;

    // ── 1. Eyebrow: fade + slide from left ──
    const eyebrow = document.querySelector('#screen-0 .screen-eyebrow');
    eyebrow.style.opacity   = '0';
    eyebrow.style.transform = 'translateX(-28px)';
    eyebrow.style.transition = 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)';
    setTimeout(() => {
      eyebrow.style.opacity   = '1';
      eyebrow.style.transform = 'translateX(0)';
    }, 100);

    // ── 2. Typewriter no título ──
    // Escreve no overlay absoluto — o placeholder invisível reserva o espaço sem reflow
    const typedEl  = document.getElementById('intro-typed');
    const fullHTML = 'Consulte nossa IA e descubra <span class="intro-highlight">qual o <em>protocolo ideal</em></span> <span class="intro-finale">para salvar sua pele.</span>';

    function tokenize(html) {
      const tokens = [];
      const re = /<span class="intro-highlight">(.*?)<\/span>|<span class="intro-finale">(.*?)<\/span>|<em>(.*?)<\/em>/gs;
      let last = 0, m;
      while ((m = re.exec(html)) !== null) {
        for (const c of html.slice(last, m.index)) tokens.push({ char: c, em: false });
        if (m[0].startsWith('<span class="intro-finale"')) {
          tokens.push({ char: '<span class="intro-finale">', em: false, raw: true });
          for (const c of m[2]) tokens.push({ char: c, em: false });
          tokens.push({ char: '</span>', em: false, raw: true });
        } else if (m[0].startsWith('<span class="intro-highlight"')) {
          tokens.push({ char: '<span class="intro-highlight">', em: false, raw: true });
          const re2 = /<em>(.*?)<\/em>/g;
          let last2 = 0, m2;
          while ((m2 = re2.exec(m[1])) !== null) {
            for (const c of m[1].slice(last2, m2.index)) tokens.push({ char: c, em: false });
            for (const c of m2[1]) tokens.push({ char: c, em: true });
            last2 = re2.lastIndex;
          }
          for (const c of m[1].slice(last2)) tokens.push({ char: c, em: false });
          tokens.push({ char: '</span>', em: false, raw: true });
        } else {
          for (const c of m[3]) tokens.push({ char: c, em: true });
        }
        last = re.lastIndex;
      }
      for (const c of html.slice(last)) tokens.push({ char: c, em: false });
      return tokens;
    }

    function buildRendered(tokens, count) {
      let rendered = '', inItalic = false;
      for (let i = 0; i < count; i++) {
        const tok = tokens[i];
        if (tok.raw) {
          if (inItalic) { rendered += '</em>'; inItalic = false; }
          rendered += tok.char;
        } else if (tok.em) {
          if (!inItalic) { rendered += '<em>'; inItalic = true; }
          rendered += tok.char;
        } else {
          if (inItalic) { rendered += '</em>'; inItalic = false; }
          const c = tok.char;
          rendered += c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c;
        }
      }
      if (inItalic) rendered += '</em>';
      return rendered;
    }

    const tokens     = tokenize(fullHTML);
    const CURSOR     = '<span class="tw-cursor">|</span>';
    const TYPE_DELAY = 0.6;
    const CHAR_MS    = 38;
    let   charIndex  = 0;

    setTimeout(() => {
      typedEl.innerHTML = CURSOR;

      const interval = setInterval(() => {
        charIndex++;
        const rendered = buildRendered(tokens, charIndex);
        typedEl.innerHTML = rendered + CURSOR;

        if (charIndex >= tokens.length) {
          clearInterval(interval);
          setTimeout(() => {
            typedEl.innerHTML = buildRendered(tokens, tokens.length);
            document.getElementById('intro-placeholder').style.visibility = 'hidden';
          }, 900);
        }
      }, CHAR_MS);
    }, TYPE_DELAY * 1000);

    // ── 3. Subtítulos: fade in quando typewriter chega em 'protocolo' (char 28) ──
    const PARA_INDEX = 28;
    const SUB_DELAY  = TYPE_DELAY * 1000 + PARA_INDEX * CHAR_MS;
    setTimeout(() => {
      const sub1 = document.querySelector('#screen-0 .intro-sub-1'); if (sub1) sub1.classList.add('sub-visible');
    }, SUB_DELAY);
    setTimeout(() => {
      const sub2 = document.querySelector('#screen-0 .intro-sub-2'); if (sub2) sub2.classList.add('sub-visible');
    }, SUB_DELAY + 220);

    // ── 4. Boxes: o transform de entrada é controlado pelo float loop via tick.
    //    Aqui só fazemos o fade-in de opacidade e expõe o timing para o float loop.
    const FULL_BOX_START = TYPE_DELAY * 1000 + tokens.length * CHAR_MS + 200;
    const BOX_START = SUB_DELAY + Math.round((FULL_BOX_START - SUB_DELAY) * 0.25);
    const BOX_GAP   = 120;
    const BOX_DUR   = 520;

    // Expõe o timestamp absoluto do início do box-1 para o float loop
    window._introBoxStart = performance.now() + BOX_START;

    [1, 2, 3].forEach((n, i) => {
      const box = document.getElementById('intro-box-' + n);
      setTimeout(() => {
        box.style.transition = `opacity ${BOX_DUR}ms cubic-bezier(0.22,1,0.36,1)`;
        box.style.opacity    = '1';
        setTimeout(() => { box.style.transition = ''; }, BOX_DUR + 50);
      }, BOX_START + i * BOX_GAP);
    });

    // ── 5. Botão: surge ao mesmo tempo que o último box ──
    const BTN_START = BOX_START + 2 * BOX_GAP;
    setTimeout(() => {
      document.getElementById('intro-btn').classList.add('btn-visible');
      setTimeout(() => {
        document.getElementById('intro-btn').classList.add('btn-ready');
      }, 540);
    }, BTN_START);

  })();

  // ── FLOAT LOOP GLOBAL ────────────────────────────────────────────────────
  (function globalFloatLoop() {

    const BASE_Y  = 6;
    const PERIODS = [5200, 6100, 4800, 5700, 6400, 4600, 5500, 6800, 4900];
    const AMPS    = [6, 8, 7, 9, 6, 8, 7, 6, 9];
    const ROTS    = [0.28, -0.22, 0.18, -0.30, 0.24, -0.18, 0.26, -0.20, 0.22];

    let params = [];
    const t0   = performance.now();

    function transformAt(p, t) {
      const osc = Math.sin(2 * Math.PI * t / p.period + p.phase);
      const y   = BASE_Y - p.amp * (osc * 0.5 + 0.5);
      const rot = p.rotAmp * Math.sin(2 * Math.PI * t / p.period + p.rotPhase);
      return `translateY(${y.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`;
    }

    function makeParam(el, i) {
      const idx   = i % 9;
      const phase = -Math.PI / 2 + i * (Math.PI * 2 / 9);
      return { el, period: PERIODS[idx], amp: AMPS[idx],
               phase, rotAmp: ROTS[idx], rotPhase: phase + Math.PI / 4,
               ampX: 0, periodX: PERIODS[idx] * 1.3, phaseX: phase + Math.PI / 3 };
    }
    function makeParamWithX(el, i) {
      const p = makeParam(el, i);
      p.ampX    = [4, 5, 3][i % 3];   // amplitude X orgânica
      p.periodX = [7100, 5800, 6600][i % 3]; // período X diferente de Y
      return p;
    }

    // Expõe para uso externo (ex: showResult iniciar flutuação do crachá imediatamente)
    window._floatAddCracha = function() {
      const crachaEl = document.getElementById('result-cracha');
      if (!crachaEl) return;
      // Remove entradas anteriores do crachá para evitar duplicata
      params = params.filter(p => p.el.id !== 'result-cracha' && p.el.id !== 'result-cracha-mobile');
      const pC = makeParamWithX(crachaEl, 0);
      pC.entryStart = 0; pC.entryDur = 0; pC.entryFromY = 0; pC.easeK = 5.5;
      params.push(pC);
    };

    // Chamado pelo goTo APÓS a animação CSS de entrada terminar (500ms)
    // Nesse ponto a screen está totalmente visível e sem transforms CSS ativos.
    window._floatCollect = function(activeScreen, forward) {
      params.forEach(p => { p.el.style.transform = ''; p.el.style.opacity = ''; });
      params = [];
      if (!activeScreen) return;

      const els = Array.from(activeScreen.querySelectorAll('.option, .input-wrap, #city-box, .photo-slot, .intro-card'));

      // Nas screens interblocos: o box flutua. Garantir que steps estejam visíveis.
      if (activeScreen.classList.contains('interblock')) {
        activeScreen.querySelectorAll('.interblock-step').forEach(el => {
          el.style.opacity = '1'; el.style.transition = ''; el.style.transform = '';
        });
        // Mostra btn-back no header, configura destino
        const backBtn  = document.getElementById('interblock-back-btn');
        if (backBtn) {
          const dest = activeScreen.id === 'screen-inter1' ? 7 : activeScreen.id === 'screen-inter2' ? 16 : 23;
          backBtn.onclick = () => goTo(dest);
          backBtn.style.display = 'flex';
        }
        // Fade-in nos badges ✅
        activeScreen.querySelectorAll('.interblock-badge').forEach(b => {
          b.classList.add('badge-visible');
          b.classList.remove('sub-visible');
          void b.offsetHeight;
          setTimeout(() => b.classList.add('sub-visible'), 200);
        });
        return;
      }

      const targets = els;

      if (!targets.length) return;

      const VH      = window.innerHeight;
      const ENTRY_D = 520;
      const EASE_K  = 5.5;
      const STAGGER = 60;
      // forward (avançar): entra de baixo para cima (+Y → 0)
      // backward (voltar): entra de cima para baixo (-Y → 0)
      const fromY   = (forward !== false ? 1 : -1) * VH * 0.55;

      targets.forEach(el => { el.style.opacity = '0'; el.style.transition = ''; el.style.pointerEvents = 'none'; });
      void activeScreen.offsetHeight;

      const now = performance.now();
      params = targets.map((el, i) => {
        const p      = makeParam(el, i);
        p.entryStart = now + i * STAGGER;
        p.entryDur   = ENTRY_D;
        p.entryFromY = fromY;
        p.easeK      = EASE_K;
        // interblock-step: apenas entrada, sem flutuação
        if (el.classList.contains('interblock-step')) p.entryOnly = true;
        // Fade-in começa junto com o slide
        setTimeout(() => {
          el.style.transition = `opacity ${ENTRY_D}ms cubic-bezier(0.4,0,0.2,1)`;
          el.style.opacity    = '1';
          el.style.pointerEvents = '';
          setTimeout(() => { el.style.transition = ''; }, ENTRY_D + 16);
        }, i * STAGGER);
        return p;
      });

      // Fade-in do subtítulo (screen-hint) e multi-hint após os options
      const hint = activeScreen.querySelector('.screen-hint');
      if (hint) { hint.classList.remove('sub-visible'); void hint.offsetHeight; setTimeout(() => hint.classList.add('sub-visible'), 180); }
      const mhint = activeScreen.querySelector('.multi-hint');
      if (mhint) { mhint.classList.remove('sub-visible'); void mhint.offsetHeight; setTimeout(() => mhint.classList.add('sub-visible'), 240); }
    };

    // ── Float + slide-up nos boxes da screen resultado ──────────────────────
    window._floatCollectResult = function() {
      // Limpa params anteriores (exceto crachá — já está flutuando, não resetar)
      params.forEach(p => {
        if (p.el.id === 'result-cracha' || p.el.id === 'result-cracha-mobile') return;
        p.el.style.transform = ''; p.el.style.opacity = '';
      });
      params = [];

      const sc = document.getElementById('screen-result');
      if (!sc) return;

      const targets = Array.from(sc.querySelectorAll('.score-pill, .result-section, .result-cta'));

      // Adiciona o crachá ao float — usa o elemento interno #result-cracha
      // pois o wrapper pode estar display:none até as fotos carregarem
      const crachaInner = document.getElementById('result-cracha');
      if (crachaInner) targets.unshift(crachaInner);
      // Clone mobile do crachá — também entra no float
      const crachaInnerM = document.getElementById('result-cracha-mobile');
      if (crachaInnerM) targets.push(crachaInnerM);

      if (!targets.length) return;

      const ENTRY_D = 520;
      const EASE_K  = 5.5;
      const fromY   = 32;

      const customDelays = {
        'result-cracha':            0,
        'radar-chart-wrap-mobile':  0,
        'box-avaliacao-ia':         560,
        'box-dicas-inteligentes':   630,
        'box-idade-pele':           700,
        'box-produto-essencial':    770,
        'box-protocolo-completo':   840,
        'box-combinam':             910,
        'result-cta-box':           980,
        'box-dicas-inteligentes-mobile': 630,
        'box-produto-essencial-mobile':  770,
        'box-combinam-mobile':           910,
      };

      targets.forEach(el => {
        if (el.id === 'result-cracha' || el.id === 'result-cracha-mobile') return;
        el.style.opacity    = '0';
        el.style.transition = '';
        el.style.transform  = `translateY(${fromY}px)`;
      });

      const now = performance.now();
      let scorePillIdx = 0;
      params = targets.map((el, i) => {
        const p = makeParamWithX(el, i);

        if (el.id === 'result-cracha' || el.id === 'result-cracha-mobile') {
          // Crachá: só flutua, não anima entrada (já foi feita via showResult)
          p.entryStart = now;
          p.entryDur   = 0;
          p.entryFromY = 0;
          p.easeK      = EASE_K;
          return p;
        }

        // Score pills: stagger 70ms sequencial
        let delay;
        if (el.classList.contains('score-pill')) {
          delay = scorePillIdx * 70;
          scorePillIdx++;
        } else if (el.id && customDelays[el.id] !== undefined) {
          delay = customDelays[el.id];
        } else {
          delay = i * 70; // fallback
        }

        p.entryStart = now + delay;
        p.entryDur   = ENTRY_D;
        p.entryFromY = fromY;
        p.easeK      = EASE_K;
        setTimeout(() => {
          el.style.transition = `opacity ${ENTRY_D}ms cubic-bezier(0.4,0,0.2,1)`;
          el.style.opacity    = '1';
          setTimeout(() => { el.style.transition = ''; }, ENTRY_D + 16);
        }, delay);
        return p;
      });
    };

    function tick(now) {
      const t = now - t0;
      for (const p of params) {
        const offset = entryOffset(p, now);
        if (p.entryOnly) {
          // Solo entrada — sem flutuação depois
          if (offset !== 0) p.el.style.transform = `translateY(${offset.toFixed(2)}px)`;
          else p.el.style.transform = '';
        } else {
          const osc    = Math.sin(2 * Math.PI * t / p.period + p.phase);
          const floatY = BASE_Y - p.amp * (osc * 0.5 + 0.5);
          const rot    = p.rotAmp * Math.sin(2 * Math.PI * t / p.period + p.rotPhase);
          const floatX = p.ampX ? p.ampX * Math.sin(2 * Math.PI * t / p.periodX + p.phaseX) : 0;
          const isMobileIntroBox = window.innerWidth <= 580 && p.el.id && p.el.id.startsWith('intro-box-');
          const mobileOffsetY = isMobileIntroBox ? -5 : 0;
          const mobileScale   = isMobileIntroBox ? ' scale(0.85)' : '';
          p.el.style.transform = `translateX(${floatX.toFixed(2)}px) translateY(${(floatY + offset + mobileOffsetY).toFixed(2)}px) rotate(${rot.toFixed(3)}deg)${mobileScale}`;
        }
      }
      requestAnimationFrame(tick);
    }

    // Screen 0: boxes entram controlados pelo tick com offset decrescente.
    const pollScreen0 = () => {
      const boxes    = [1,2,3].map(n => document.getElementById('intro-box-' + n));
      const boxStart = window._introBoxStart;
      if (!boxes.every(b => b) || !boxStart) { setTimeout(pollScreen0, 50); return; }

      const VH      = window.innerHeight;
      const ENTRY_D = 520;
      const EASE_K  = 5.5;
      const BOX_GAP = 120;

      params.forEach(p => { p.el.style.transform = ''; });
      params = [];

      params = boxes.map((el, i) => {
        const p      = makeParam(el, i);
        p.entryStart = boxStart + i * BOX_GAP;
        p.entryDur   = ENTRY_D;
        p.entryFromY = VH * 1.05;
        p.easeK      = EASE_K;
        // Fade-in começa quando o box começa a subir
        const fadeAt = Math.max(0, p.entryStart - performance.now());
        setTimeout(() => {
          el.style.transition = `opacity ${ENTRY_D}ms cubic-bezier(0.4,0,0.2,1)`;
          el.style.opacity    = '1';
          setTimeout(() => { el.style.transition = ''; }, ENTRY_D + 16);
        }, fadeAt);
        return p;
      });

      // Dots entram sincronizados com os boxes (mesmo stagger)
      [1,2,3].forEach((n, i) => {
        const dot  = document.getElementById('intro-dot-' + n);
        const wrap = dot?.closest('.interblock-dot-wrap');
        if (!dot || !wrap) return;
        wrap.style.opacity = '0';
        dot.style.transform = `translateY(${VH * 1.05}px)`;
        const p = makeParamWithX(dot, i);
        p.entryStart = boxStart + i * BOX_GAP;
        p.entryDur   = ENTRY_D;
        p.entryFromY = VH * 1.05;
        p.easeK      = EASE_K;
        const fadeAt = Math.max(0, p.entryStart - performance.now());
        setTimeout(() => {
          wrap.style.transition = `opacity ${ENTRY_D}ms cubic-bezier(0.4,0,0.2,1)`;
          wrap.style.opacity    = '1';
          setTimeout(() => { wrap.style.transition = ''; }, ENTRY_D + 16);
        }, fadeAt);
        params.push(p);
      });
    };

    // entryOffset: slide-up que decai exponencialmente até 0
    function entryOffset(p, now) {
      const elapsed = now - p.entryStart;
      if (!p.entryStart || elapsed >= p.entryDur) return 0;
      if (elapsed <= 0) return p.entryFromY;
      return p.entryFromY * Math.exp(-p.easeK * (elapsed / p.entryDur));
    }

    // Expõe função para re-animar screen 0 ao voltar
    window._floatResetScreen0 = function(isForward) {
      const boxes = [1,2,3].map(n => document.getElementById('intro-box-' + n));
      if (!boxes.every(b => b)) return;
      const VH    = window.innerHeight;
      const fromY = isForward ? VH * 1.05 : -VH * 1.05;
      const ENTRY_D = 520, EASE_K = 5.5, GAP = 120;
      const now   = performance.now();
      params.forEach(p => { p.el.style.transform = ''; });
      params = [];
      // Reset visual
      boxes.forEach(el => { el.style.opacity='0'; el.style.transition=''; });
      [1,2,3].forEach(n => {
        const w = document.getElementById('intro-dot-'+n)?.closest('.interblock-dot-wrap');
        if (w) { w.style.opacity='0'; w.style.transition=''; }
      });
      // Anima boxes
      params = boxes.map((el, i) => {
        const p = makeParam(el, i);
        p.entryStart = now + i * GAP;
        p.entryDur = ENTRY_D; p.entryFromY = fromY; p.easeK = EASE_K;
        const at = Math.max(0, p.entryStart - performance.now());
        setTimeout(() => {
          el.style.transition = `opacity ${ENTRY_D}ms cubic-bezier(0.4,0,0.2,1)`;
          el.style.opacity = '1';
          setTimeout(() => { el.style.transition=''; }, ENTRY_D+16);
        }, at);
        return p;
      });
      // Anima dots
      [1,2,3].forEach((n, i) => {
        const dot  = document.getElementById('intro-dot-'+n);
        const wrap = dot?.closest('.interblock-dot-wrap');
        if (!dot || !wrap) return;
        dot.style.transform = `translateY(${fromY}px)`;
        const p = makeParamWithX(dot, i);
        p.entryStart = now + i * GAP;
        p.entryDur = ENTRY_D; p.entryFromY = fromY; p.easeK = EASE_K;
        const at = Math.max(0, p.entryStart - performance.now());
        setTimeout(() => {
          wrap.style.transition = `opacity ${ENTRY_D}ms cubic-bezier(0.4,0,0.2,1)`;
          wrap.style.opacity = '1';
          setTimeout(() => { wrap.style.transition=''; }, ENTRY_D+16);
        }, at);
        params.push(p);
      });
    };

    setTimeout(pollScreen0, 100);

    requestAnimationFrame(tick);

  })();

  /* ── INTERBLOCOS: float dos círculos ── */
  (function interblockFloat() {
    const PERIODS_Y = [5400, 6200, 4900];
    const PERIODS_X = [7100, 5800, 6600]; // período diferente para X → trajetória orgânica
    const AMPS_Y    = [7, 9, 6];
    const AMPS_X    = [4, 5, 3];          // movimento lateral mais sutil
    const ROTS      = [0.25, -0.20, 0.22];
    const t0        = performance.now();

    const GROUPS = [
      ['idot-1-1','idot-1-2','idot-1-3'],
      ['idot-2-1','idot-2-2','idot-2-3'],
      ['idot-3-1','idot-3-2','idot-3-3'],
    ];

    function tick(now) {
      const t = now - t0;
      GROUPS.forEach((group, gi) => {
        group.forEach((id, i) => {
          const el = document.getElementById(id);
          if (!el) return;
          const target = el.closest('.interblock-dot-wrap') || el;
          const y   = AMPS_Y[i] * Math.sin(2 * Math.PI * t / PERIODS_Y[i] + i * 1.8);
          const x   = AMPS_X[i] * Math.sin(2 * Math.PI * t / PERIODS_X[i] + i * 2.5);
          const rot = ROTS[i]   * Math.sin(2 * Math.PI * t / PERIODS_Y[i] + i * 2.1);
          target.style.transform = `translateX(${x.toFixed(2)}px) translateY(${y.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`;
        });
      });
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  })();

  /* ── HOLOFOTE DO CURSOR COM RASTRO ──────────────────────────────────────── */
  (function cursorSpotlight() {
    const TRAIL_LIFE = 750; // ms que cada ponto do rastro permanece visível

    // Canvas do rastro — fica abaixo de todos os elementos da página
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position:      'fixed',
      inset:         '0',
      pointerEvents: 'none',
      zIndex:        '0',
      opacity:       '0',
      transition:    'opacity 0.4s ease',
    });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Div do holofote principal — também abaixo dos elementos
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:      'fixed',
      inset:         '0',
      pointerEvents: 'none',
      zIndex:        '0',
      mixBlendMode:  'overlay',
      opacity:       '0',
      transition:    'opacity 0.5s ease',
    });
    document.body.appendChild(el);

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let cx = -9999, cy = -9999;
    let mainRaf = null;
    let visible = false;
    const trail = []; // { x, y, t }

    // Pinta o holofote principal no cursor — opacidade reduzida para não sobrecarregar
    function paintMain() {
      el.style.background =
        `radial-gradient(circle 300px at ${cx}px ${cy}px,` +
        `rgba(255,255,210,0.28) 0%,`  +
        `rgba(255,255,210,0.16) 25%,` +
        `rgba(255,255,210,0.06) 60%,` +
        `rgba(255,255,210,0.01) 85%,` +
        `transparent 100%)`;
      mainRaf = null;
    }

    // Loop do rastro — roda enquanto houver pontos vivos
    function trailLoop() {
      const now = performance.now();

      // Descarta pontos mortos
      while (trail.length && now - trail[0].t >= TRAIL_LIFE) trail.shift();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of trail) {
        const age  = now - p.t;                    // 0 → TRAIL_LIFE ms
        const life = 1 - age / TRAIL_LIFE;         // 1 → 0 linear
        const ease = life * life * (3 - 2 * life); // smoothstep: decaimento suave

        const radius  = 260 * ease;                // raio encolhe
        const alpha   = 0.18 * ease;               // opacidade suave — não acumula demais

        if (radius < 2 || alpha < 0.002) continue;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0,    `rgba(255,255,200,${(alpha).toFixed(3)})`);
        grad.addColorStop(0.35, `rgba(255,255,200,${(alpha * 0.55).toFixed(3)})`);
        grad.addColorStop(0.7,  `rgba(255,255,200,${(alpha * 0.18).toFixed(3)})`);
        grad.addColorStop(1,    `rgba(255,255,200,0)`);

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (trail.length > 0) requestAnimationFrame(trailLoop);
    }

    document.addEventListener('mousemove', e => {
      cx = e.clientX; cy = e.clientY;

      // Adiciona ponto ao rastro (throttle ~16 ms = 60 fps)
      const now = performance.now();
      if (!trail.length || now - trail[trail.length - 1].t >= 16) {
        const wasEmpty = trail.length === 0;
        trail.push({ x: cx, y: cy, t: now });
        if (wasEmpty) requestAnimationFrame(trailLoop); // arranca o loop
      }

      if (!visible) {
        visible = true;
        el.style.opacity     = '1';
        canvas.style.opacity = '1';
      }
      if (!mainRaf) mainRaf = requestAnimationFrame(paintMain);
    });

    document.addEventListener('mouseleave', () => {
      visible = false;
      el.style.opacity     = '0';
      canvas.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      visible = true;
      el.style.opacity     = '1';
      canvas.style.opacity = '1';
    });
  })();


  /* ══════════════════════════════════════════════════════════════════
     SCANNER FACIAL 3D — Topographic / Satellite
     Visual: mesh de pele, linha de scan, partículas, HUD dinâmico
     Fluxo: frente → esquerda → direita → close (estilo Face ID)
  ══════════════════════════════════════════════════════════════════ */

  (function() {
    const STEPS = [
      { key: 'front', icon: '🫵',  text: 'Olhe diretamente para a câmera', yawRange: [-18, 18],  holdMs: 2000, label: 'FRENTE' },
      { key: 'left',  icon: '👈',  text: 'Vire para a esquerda',         yawRange: [20, 55],   holdMs: 1800, label: 'LADO DIREITO' },
      { key: 'right', icon: '👉',  text: 'Vire para a direita',          yawRange: [-55, -20], holdMs: 1800, label: 'LADO ESQUERDO' },
      { key: 'close', icon: '🙋‍♀️',  text: 'Aproxime o rosto da câmera',      sizeMin: 0.38,        holdMs: 1800, label: 'DE PERTO' },
    ];

    const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

    let stepIdx      = 0;
    let holdStart    = null;
    let capturing    = false;
    let rafId        = null;
    let fxRafId      = null;
    let stream       = null;
    let modelsLoaded = false;
    let faceApiReady = false;
    let scanActive   = false;
    const captures   = {};

    // Referências DOM
    const overlay    = document.getElementById('scanner-overlay');
    const video      = document.getElementById('scanner-video');
    const canvasHide = document.getElementById('scanner-canvas');
    const fxCanvas   = document.getElementById('scanner-fx-canvas');
    const svg        = document.getElementById('scanner-svg');
    const maskEll    = document.getElementById('mask-ellipse');
    const guideEll   = document.getElementById('guide-ellipse');
    const arcEll     = document.getElementById('arc-ellipse');
    const svgScanLine= document.getElementById('svg-scan-line');
    const scanLine   = document.getElementById('scan-line');
    const instIcon   = document.getElementById('scanner-inst-icon');
    const instText   = document.getElementById('scanner-inst-text');
    const progWrap   = document.getElementById('scanner-progress-wrap');
    const progBar    = document.getElementById('scanner-progress-bar');
    const flash      = document.getElementById('scanner-flash');
    const blocked    = document.getElementById('scanner-blocked');
    const stepLabel  = document.getElementById('scanner-step-label');
    const statusDot  = document.getElementById('scanner-status-dot');

    // HUD refs
    const hudDepth = document.getElementById('hud-depth');
    const hudConf  = document.getElementById('hud-conf');
    const hudPores = document.getElementById('hud-pores');
    const hudHydra = document.getElementById('hud-hydra');
    const hudOily  = document.getElementById('hud-oily');
    const hudZones = document.getElementById('hud-zones');
    const hudPts   = document.getElementById('hud-pts');
    const hudAcc   = document.getElementById('hud-acc');

    // FX Canvas context
    let fxCtx = null;

    // ── HUD LIVE DATA ────────────────────────────────────────────────
    let hudTimer = null;
    let hudZoneCount = 0;
    let hudPtCount = 0;

    function startHudAnimation(faceDetected) {
      if (hudTimer) return;
      hudTimer = setInterval(() => {
        if (!faceDetected && !scanActive) return;
        const conf = faceDetected ? (78 + Math.floor(Math.random() * 18)) : 0;
        if (hudConf)  hudConf.textContent  = 'CONF: '    + (faceDetected ? conf + '%' : '—%');
        if (hudDepth) hudDepth.textContent = 'PROF: '    + (faceDetected ? (8 + Math.random()*4).toFixed(1) + 'mm' : '—');
        if (faceDetected && hudPtCount < 468) {
          hudPtCount  = Math.min(468, hudPtCount + Math.floor(Math.random() * 24));
          hudZoneCount = Math.min(7, Math.floor(hudPtCount / 68));
        }
        if (hudPts)   hudPts.textContent   = 'PONTOS: '    + (faceDetected ? hudPtCount : 0);
        if (hudZones) hudZones.textContent = 'ZONAS: '     + (faceDetected ? hudZoneCount + '/7' : '0/7');
        if (hudAcc)   hudAcc.textContent   = 'PRECISÃO: '  + (faceDetected ? (conf - 3 + Math.floor(Math.random()*6)) + '%' : '—');
        if (faceDetected && Math.random() < 0.3) {
          if (hudPores) hudPores.textContent = 'POROS: '      + ['BAIXO','MÉDIO','ALTO'][Math.floor(Math.random()*3)];
          if (hudHydra) hudHydra.textContent = 'HIDRATAÇÃO: '     + (Math.floor(Math.random()*40+45)) + '%';
          if (hudOily)  hudOily.textContent  = 'OLEOSIDADE: ' + ['BAIXA','MÉDIA','ALTA'][Math.floor(Math.random()*3)];
        }
      }, 280);
    }
    function stopHudAnimation() {
      if (hudTimer) { clearInterval(hudTimer); hudTimer = null; }
    }
    function resetHud() {
      hudPtCount = 0; hudZoneCount = 0;
      if (hudConf)  hudConf.textContent  = 'CONF: —%';
      if (hudDepth) hudDepth.textContent = 'PROF: —';
      if (hudPts)   hudPts.textContent   = 'PONTOS: 0';
      if (hudZones) hudZones.textContent = 'ZONAS: 0/7';
      if (hudAcc)   hudAcc.textContent   = 'PRECISÃO: —';
      if (hudPores) hudPores.textContent = 'POROS: —';
      if (hudHydra) hudHydra.textContent = 'HIDRATAÇÃO: —';
      if (hudOily)  hudOily.textContent  = 'OLEOSIDADE: —';
    }

    // ── FX CANVAS resize ────────────────────────────────────────────
    function resizeFxCanvas() {
      if (!fxCanvas) return;
      fxCanvas.width  = window.innerWidth;
      fxCanvas.height = window.innerHeight;
      fxCtx = fxCanvas.getContext('2d');
    }

    // ── LANDMARK MESH ENGINE ─────────────────────────────────────────
    // Armazena os 68 landmarks da última detecção em coordenadas de tela
    let lastLandmarks = null; // array de {x,y} em pixels da tela
    let meshAlpha = 0;        // fade-in suave da mesh

    // Converte um ponto landmark (coords de vídeo) para coords de tela
    function lmToScreen(pt) {
      const vw = video.videoWidth  || video.clientWidth  || 1;
      const vh = video.videoHeight || video.clientHeight || 1;
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const videoAspect  = vw / vh;
      const screenAspect = sw / sh;
      let drawW, drawH, offsetX = 0, offsetY = 0;
      if (videoAspect > screenAspect) {
        drawH = sh; drawW = sh * videoAspect; offsetX = -(drawW - sw) / 2;
      } else {
        drawW = sw; drawH = sw / videoAspect; offsetY = -(drawH - sh) / 2;
      }
      const scaleX = drawW / vw;
      const scaleY = drawH / vh;
      // Espelho horizontal
      return {
        x: offsetX + (vw - pt.x) * scaleX,
        y: offsetY + pt.y * scaleY,
      };
    }

    // Atualiza landmarks a partir de uma detecção face-api
    function updateLandmarks(detection) {
      if (!detection || !detection.landmarks) { lastLandmarks = null; return; }
      const pts = detection.landmarks.positions;
      lastLandmarks = pts.map(p => lmToScreen(p));
    }

    // Conexões anatômicas para o mesh (índices dos 68 landmarks)
    const MESH_CONNECTIONS = [
      // Contorno do rosto (0-16)
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],
      [10,11],[11,12],[12,13],[13,14],[14,15],[15,16],
      // Sobrancelha esquerda (17-21)
      [17,18],[18,19],[19,20],[20,21],
      // Sobrancelha direita (22-26)
      [22,23],[23,24],[24,25],[25,26],
      // Nariz – ponte (27-30)
      [27,28],[28,29],[29,30],
      // Nariz – base (31-35)
      [31,32],[32,33],[33,34],[34,35],[30,35],[30,31],
      // Olho esquerdo (36-41)
      [36,37],[37,38],[38,39],[39,40],[40,41],[41,36],
      // Olho direito (42-47)
      [42,43],[43,44],[44,45],[45,46],[46,47],[47,42],
      // Boca externa (48-59)
      [48,49],[49,50],[50,51],[51,52],[52,53],[53,54],
      [54,55],[55,56],[56,57],[57,58],[58,59],[59,48],
      // Boca interna (60-67)
      [60,61],[61,62],[62,63],[63,64],[64,65],[65,66],[66,67],[67,60],
      // Cruzamentos nariz↔olhos
      [21,27],[22,27],
      // Canto olho↔contorno
      [36,0],[45,16],
    ];

    // Triângulos de mesh para preenchimento
    const MESH_TRIS = [
      // Testa
      [17,0,1],[17,18,1],[18,19,2],[19,20,3],[20,21,4],[21,27,4],
      [22,27,13],[22,23,12],[23,24,11],[24,25,10],[25,26,9],[26,16,9],
      // Bochechas
      [0,36,1],[1,36,37],[1,37,2],[2,38,3],[3,38,39],[39,29,4],
      [16,45,15],[15,45,44],[15,44,14],[14,44,43],[43,42,13],[42,29,13],
      // Nariz
      [31,32,30],[32,33,30],[33,34,35],[34,35,30],
      // Mento
      [7,8,57],[57,8,56],[8,9,56],[8,55,9],[55,54,9],
    ];

    // Partículas de análise: geradas nos pontos de landmark
    const meshPts = []; // { x, y, life, maxLife, r, type }
    let meshPhase = 0;

    function spawnLandmarkPts(lms) {
      if (!lms || meshPts.length > 200) return;
      // Spawn em landmarks aleatórios — regiões de interesse
      const keyPoints = [
        // olhos
        36,37,38,39,40,41, 42,43,44,45,46,47,
        // nariz
        30,31,33,35,
        // boca
        48,51,54,57,60,64,
        // contorno
        0,4,8,12,16,
        // sobrancelhas
        19,24,
      ];
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const idx = keyPoints[Math.floor(Math.random() * keyPoints.length)];
        if (idx >= lms.length) continue;
        const pt = lms[idx];
        // Pequeno offset aleatório
        const jitter = 4;
        meshPts.push({
          x: pt.x + (Math.random() - 0.5) * jitter,
          y: pt.y + (Math.random() - 0.5) * jitter,
          life: 0,
          maxLife: 50 + Math.floor(Math.random() * 80),
          r: 1.2 + Math.random() * 2.2,
          type: Math.random() < 0.5 ? 'wine' : 'steel',
        });
      }
    }

    // Linhas topográficas agora seguem curvas de zona facial reais
    const topoLines = [];

    function spawnZoneLine(lms) {
      if (!lms || topoLines.length > 14) return;
      // Escolhe uma zona facial real para traçar
      const zones = [
        // Arco sobrancelha esq
        [17,18,19,20,21],
        // Arco sobrancelha dir
        [26,25,24,23,22],
        // Contorno nariz
        [31,32,33,34,35,30,29,28,27],
        // Contorno olho esq
        [36,37,38,39,40,41],
        // Contorno olho dir
        [42,43,44,45,46,47],
        // Arco superior lábio
        [48,49,50,51,52,53,54],
        // Arco inferior lábio
        [54,55,56,57,58,59,48],
        // Contorno rosto top
        [0,1,2,3,4,5,6,7],
        // Contorno rosto bot
        [10,11,12,13,14,15,16],
        // Meia face horizontal (testa)
        [17,19,21,27,22,24,26],
        // Meia face horizontal (bochechas)
        [1,36,29,45,15],
        // Linha mento
        [6,7,8,9,10],
      ];
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const pts = zone
        .filter(i => i < lms.length)
        .map(i => ({ x: lms[i].x, y: lms[i].y }));
      if (pts.length < 2) return;

      topoLines.push({
        pts,
        progress: 0,
        speed: 0.018 + Math.random() * 0.022,
        type: Math.random() < 0.65 ? 'wine' : 'steel',
        opacity: 0.35 + Math.random() * 0.40,
        maxLife: 70 + Math.floor(Math.random() * 60),
        life: 0,
      });
    }

    // Fallback se não há landmarks: spawn genérico dentro do oval
    function spawnMeshPts(cx, cy, rw, rh) {
      if (meshPts.length > 180) return;
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rad   = Math.random();
        const px = cx + Math.cos(angle) * rw * rad * 0.9;
        const py = cy + Math.sin(angle) * rh * rad * 0.9;
        meshPts.push({
          x: px, y: py, life: 0,
          maxLife: 60 + Math.floor(Math.random() * 90),
          r: 1 + Math.random() * 2.5,
          type: Math.random() < 0.7 ? 'wine' : 'steel',
        });
      }
    }

    function spawnTopoLine(cx, cy, rw, rh) {
      if (topoLines.length > 12) return;
      const frac = 0.15 + Math.random() * 0.7;
      const lineY = cy - rh + frac * rh * 2;
      const rel = (lineY - cy) / rh;
      const hw  = rw * Math.sqrt(Math.max(0, 1 - rel * rel)) * 0.92;
      const pts = [];
      const segs = 20 + Math.floor(Math.random() * 10);
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = cx - hw + t * hw * 2;
        const wave = Math.sin(t * Math.PI * (2 + Math.random())) * rh * 0.04;
        pts.push({ x, y: lineY + wave });
      }
      topoLines.push({
        pts, progress: 0,
        speed: 0.012 + Math.random() * 0.016,
        type: Math.random() < 0.65 ? 'wine' : 'steel',
        opacity: 0.25 + Math.random() * 0.35,
        maxLife: 80 + Math.floor(Math.random() * 60),
        life: 0,
      });
    }

    // Helpers de cor da paleta
    function wineColor(alpha) { return `rgba(168,85,104,${alpha.toFixed(3)})`; }
    function wineLight(alpha) { return `rgba(210,120,148,${alpha.toFixed(3)})`; }
    function steelColor(alpha){ return `rgba(74,127,165,${alpha.toFixed(3)})`; }
    function typeColor(type, alpha) {
      return type === 'wine' ? wineColor(alpha) : steelColor(alpha);
    }

    // Loop de efeitos FX
    let fxFaceBox = null;
    let fxFrame = 0;

    // Paleta: azul neon (steel) + vinho como acento
    function cyanColor(alpha)  { return `rgba(46,169,214,${alpha.toFixed(3)})`; }
    function cyanLight(alpha)  { return `rgba(120,210,240,${alpha.toFixed(3)})`; }
    function cyanGlow(alpha)   { return `rgba(20,130,180,${alpha.toFixed(3)})`; }
    function accentColor(alpha){ return `rgba(210,120,148,${alpha.toFixed(3)})`; }
    function whiteGlow(alpha)  { return `rgba(210,240,255,${alpha.toFixed(3)})`; }
    function wineNeon(alpha)    { return `rgba(168,85,104,${alpha.toFixed(3)})`; }
    function wineNeonGlow(alpha){ return `rgba(138,58,82,${alpha.toFixed(3)})`; }

    // Contorno facial suavizado: interpola entre os pontos do contorno (0-16)
    function drawFaceContour(lms, alpha) {
      const pts = [];
      for (let i = 0; i <= 16; i++) pts.push(lms[i]);
      // Fecha pela testa (17→26 invertido)
      for (let i = 26; i >= 17; i--) pts.push(lms[i]);

      fxCtx.save();
      fxCtx.beginPath();
      fxCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i+1].x) / 2;
        const my = (pts[i].y + pts[i+1].y) / 2;
        fxCtx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      fxCtx.closePath();
      fxCtx.strokeStyle = cyanColor(alpha * 0.85);
      fxCtx.lineWidth = 1.5;
      fxCtx.shadowColor = cyanGlow(alpha * 0.6);
      fxCtx.shadowBlur = 12;
      fxCtx.stroke();
      fxCtx.shadowBlur = 0;
      fxCtx.restore();
    }

    // Curva suavizada para uma região (olho, sobrancelha, boca, nariz)
    function drawSmoothRegion(pts, alpha, lineW, color, glowColor, close) {
      if (pts.length < 2) return;
      fxCtx.save();
      fxCtx.beginPath();
      fxCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i+1].x) / 2;
        const my = (pts[i].y + pts[i+1].y) / 2;
        fxCtx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      fxCtx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
      if (close) fxCtx.closePath();
      fxCtx.strokeStyle = color(alpha);
      fxCtx.lineWidth = lineW;
      fxCtx.shadowColor = glowColor(alpha * 0.5);
      fxCtx.shadowBlur = 8;
      fxCtx.stroke();
      fxCtx.shadowBlur = 0;
      fxCtx.restore();
    }

    // Grid de mesh estrutural — do queixo até a linha frontal do cabelo
    // cx,cy,rw,rh = bounding box da face detectada em coordenadas de tela
    function drawStructuralGrid(lms, alpha, cx, cy, rw, rh) {
      if (lms.length < 31) return;

      // ── Referências ──────────────────────────────────────────────────
      const chin = lms[8];

      // Têmporas (landmarks 0 e 16) — âncora das bordas do rosto
      const tmA = lms[0], tmB = lms[16];
      const templeLeftX  = Math.min(tmA.x, tmB.x);
      const templeRightX = Math.max(tmA.x, tmB.x);
      const templeY      = (tmA.y + tmB.y) / 2;

      // ── Sobrancelhas: Y médio ────────────────────────────────────────
      const browAvgY = ([17,18,19,20,21,22,23,24,25,26]
        .map(i => lms[i].y).reduce((a,b)=>a+b,0)) / 10;

      // ── Hairline Y via ponta do nariz ────────────────────────────────
      const noseTipY   = lms[30].y;
      const browToNose = noseTipY - browAvgY;          // distância robusta, positiva
      const hairlineY  = browAvgY - browToNose * 0.845; // ~84.5% acima das sobrancelhas (+30%)

      // ── Semi-elipse para a testa ──────────────────────────────────────
      // Centro = (arcCX, templeY): nível das têmporas, centro horizontal
      // rx = metade da largura entre têmporas + 4% de margem
      // ry = distância vertical têmporas → hairline  (altura real da testa)
      // Equação: x = arcCX ± rx * sqrt(1 - ((y - templeY)/ry)²)
      // Na altura das têmporas (y=templeY): largura = rx*2 (plena)
      // No hairline (y=hairlineY, dy=-ry): largura = 0 (ponto topo do arco)
      // → forma de semielipse natural, sem trapézio
      const arcCX = (templeLeftX + templeRightX) / 2;
      const arcRX = (templeRightX - templeLeftX) / 2 * 1.04;
      const arcRY = Math.max(templeY - hairlineY, 1) * 1.15; // +15% de altura na testa

      // ── Fundo: queixo ────────────────────────────────────────────────
      const gridTop    = templeY - arcRY; // topo real da elipse expandida
      const gridBottom = chin.y;

      // ── Bordas para cada Y ───────────────────────────────────────────
      // Pré-calcula envelope de largura máxima acumulada de cima para baixo.
      // Isso evita que a malha "afunile" na altura do nariz, onde os landmarks
      // do contorno (bochechas) estão recuados em relação ao nariz projetado.
      function rawEdgeAtY(y) {
        function scanSide(idxs, sy) {
          const pts = idxs.map(i => lms[i]);
          for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i+1];
            const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
            if (sy >= lo && sy <= hi && hi > lo)
              return a.x + (sy - a.y) / (b.y - a.y) * (b.x - a.x);
          }
          return null;
        }
        function ellipseEdge(sy) {
          const t    = (sy - templeY) / arcRY;
          const sin2 = Math.max(0, 1 - t * t);
          const xSpan = arcRX * Math.sqrt(sin2);
          return { lx: arcCX - xSpan, rx: arcCX + xSpan };
        }
        const BLEND = arcRY * 0.18;
        if (y <= templeY - BLEND) {
          return ellipseEdge(y);
        }
        if (y >= templeY + BLEND) {
          const rawL = scanSide([0,1,2,3,4,5,6,7,8],       y) ?? templeLeftX;
          const rawR = scanSide([16,15,14,13,12,11,10,9,8], y) ?? templeRightX;
          return { lx: Math.min(rawL, rawR), rx: Math.max(rawL, rawR) };
        }
        const blend  = (y - (templeY - BLEND)) / (2 * BLEND);
        const smooth = blend * blend * (3 - 2 * blend);
        const eEdge  = ellipseEdge(y);
        const rawL   = scanSide([0,1,2,3,4,5,6,7,8],       y) ?? templeLeftX;
        const rawR   = scanSide([16,15,14,13,12,11,10,9,8], y) ?? templeRightX;
        const cLx    = Math.min(rawL, rawR);
        const cRx    = Math.max(rawL, rawR);
        return {
          lx: eEdge.lx * (1 - smooth) + cLx * smooth,
          rx: eEdge.rx * (1 - smooth) + cRx * smooth,
        };
      }

      // Envelope de janela deslizante: para cada Y, usa o máximo lx/rx
      // encontrado numa janela de ±15% da altura do rosto ao redor desse Y.
      // Isso evita afunilamento no nariz sem contaminar regiões distantes.
      const ENV_STEPS = 120;
      const rawCache = [];
      for (let si = 0; si <= ENV_STEPS; si++) {
        const sy = gridTop + (gridBottom - gridTop) * (si / ENV_STEPS);
        rawCache.push(rawEdgeAtY(sy));
      }
      const WIN = Math.round(ENV_STEPS * 0.15); // janela de ±15%
      const envCache = [];
      for (let si = 0; si <= ENV_STEPS; si++) {
        const lo = Math.max(0, si - WIN);
        const hi = Math.min(ENV_STEPS, si + WIN);
        let winLx = rawCache[si].lx, winRx = rawCache[si].rx;
        for (let j = lo; j <= hi; j++) {
          winLx = Math.min(winLx, rawCache[j].lx);
          winRx = Math.max(winRx, rawCache[j].rx);
        }
        // Clamp final: nunca além do máximo histórico acima (evita extravasar abaixo)
        const maxAboveLx = rawCache.slice(0, si + 1).reduce((m, r) => Math.min(m, r.lx), rawCache[0].lx);
        const maxAboveRx = rawCache.slice(0, si + 1).reduce((m, r) => Math.max(m, r.rx), rawCache[0].rx);
        envCache.push({
          lx: Math.max(winLx, maxAboveLx),
          rx: Math.min(winRx, maxAboveRx),
        });
      }

      function edgeAtY(y) {
        const idx     = Math.round((y - gridTop) / (gridBottom - gridTop) * ENV_STEPS);
        const clamped = Math.max(0, Math.min(ENV_STEPS, idx));
        return envCache[clamped];
      }

      fxCtx.save();

      // ── 1 & 2. Malha interna — recriada do zero com base no contorno unificado ──
      const N_H = 37;
      const N_V = 26;
      const VSTEPS = 80;

      // Altura total: de gridTop (hairline) até gridBottom (queixo)
      // gridTop e gridBottom já definidos acima
      const faceH = gridBottom - gridTop;

      // Distribuição senoidal: converte índice 0→1 em posição 0→1 mais densa no centro
      // sin remapeado: f(t) = (1 - cos(π*t)) / 2  → começa lento, acelera no meio, termina lento
      function sineMap(t) { return (1 - Math.cos(Math.PI * t)) / 2; }

      // ── 0. HEATMAP TÉRMICO ancorado nos landmarks reais ───────────────
      // Cada zona usa distância gaussiana ao landmark real — segue o rosto ao virar.

      const lmNoseTip   = lms[30];
      const lmGlabela   = lms[27];
      const lmForeheadC = { x: lms[27].x, y: lms[27].y - (lms[30].y - lms[27].y) * 0.9 };
      const lmCanthoL   = lms[39];
      const lmCanthoR   = lms[42];
      const lmCheekL    = lms[3];
      const lmCheekR    = lms[13];
      const lmMouthC    = { x: (lms[51].x+lms[57].x)/2, y: (lms[51].y+lms[57].y)/2 };
      const lmChinC     = lms[8];
      const lmTempleL   = lms[0];
      const lmTempleR   = lms[16];
      const refDist     = Math.hypot(lmGlabela.x - lmNoseTip.x, lmGlabela.y - lmNoseTip.y) || 1;

      function gaussLM(px, py, lm, sigma) {
        const d2 = ((px - lm.x)**2 + (py - lm.y)**2) / (refDist * refDist);
        return Math.exp(-d2 / (2 * sigma * sigma));
      }

      function thermalAtPx(px, py) {
        const glabela  = gaussLM(px, py, lmGlabela,   0.45) * 0.95;
        const forehead = gaussLM(px, py, lmForeheadC, 0.70) * 0.80;
        const canthoL  = gaussLM(px, py, lmCanthoL,   0.28) * 0.90;
        const canthoR  = gaussLM(px, py, lmCanthoR,   0.28) * 0.90;
        const mouth    = gaussLM(px, py, lmMouthC,    0.38) * 0.82;
        const cheekL   = gaussLM(px, py, lmCheekL,    0.55) * 0.55;
        const cheekR   = gaussLM(px, py, lmCheekR,    0.55) * 0.55;
        const noseTip  = gaussLM(px, py, lmNoseTip,   0.22) * -0.40;
        const chin     = gaussLM(px, py, lmChinC,     0.50) * -0.20;
        const templeL  = gaussLM(px, py, lmTempleL,   0.40) * -0.15;
        const templeR  = gaussLM(px, py, lmTempleR,   0.40) * -0.15;
        const raw = glabela + forehead + canthoL + canthoR + mouth +
                    cheekL + cheekR + noseTip + chin + templeL + templeR;
        return Math.max(0, Math.min(1, raw));
      }

      function thermalColor(v, a) {
        let r, g, b;
        if (v < 0.25)      { const t = v/0.25;       r=0;              g=Math.round(t*180);          b=255; }
        else if (v < 0.5)  { const t = (v-0.25)/0.25; r=0;             g=180+Math.round(t*75);       b=Math.round(255*(1-t)); }
        else if (v < 0.75) { const t = (v-0.5)/0.25;  r=Math.round(t*255); g=255;                   b=0; }
        else               { const t = (v-0.75)/0.25; r=255;           g=Math.round(255*(1-t));      b=0; }
        return `rgba(${r},${g},${b},${a.toFixed(3)})`;
      }

      // Função que constrói o path do contorno real (landmarks + elipse)
      // Usada tanto para clip do heatmap quanto para o stroke do contorno.
      function buildContourPath() {
        const leftLms  = [];
        for (let i = 8; i >= 0; i--) leftLms.push(lms[i]);
        const rightLms = [];
        for (let i = 16; i >= 8; i--) rightLms.push(lms[i]);
        const p0  = lms[0], p16 = lms[16];
        const eCX = (p0.x + p16.x) / 2;
        const eCY = (p0.y + p16.y) / 2;
        const eRX = Math.abs(p16.x - p0.x) / 2;
        const eRY = arcRY;
        const angStart = Math.atan2((p0.y  - eCY) / eRY, (p0.x  - eCX) / eRX);
        const angEnd   = Math.atan2((p16.y - eCY) / eRY, (p16.x - eCX) / eRX);
        let a0 = angStart, a1 = angEnd;
        if (a1 > a0) a1 -= Math.PI * 2;
        const arcPts = [];
        for (let si = 0; si <= 60; si++) {
          const ang = a0 + (a1 - a0) * (si / 60);
          arcPts.push({ x: eCX + eRX * Math.cos(ang), y: eCY + eRY * Math.sin(ang) });
        }
        fxCtx.beginPath();
        leftLms.forEach((p, i) => i === 0 ? fxCtx.moveTo(p.x, p.y) : fxCtx.lineTo(p.x, p.y));
        arcPts.forEach(p => fxCtx.lineTo(p.x, p.y));
        rightLms.forEach(p => fxCtx.lineTo(p.x, p.y));
        fxCtx.closePath();
      }

      // Pinta célula por célula usando px real do centro para consultar thermalAtPx
      // Usa edgeAtY (envelope) para cantos — sem bug da linha dupla no nariz.
      // O clip pelo contorno real impede qualquer extravasamento.
      const hRows = [0, ...Array.from({length: N_H-1}, (_,i) => sineMap((i+1)/N_H)), 1];
      const hVts  = [0, ...Array.from({length: N_V-1}, (_,i) => sineMap((i+1)/N_V)), 1];

      fxCtx.save();
      buildContourPath();
      fxCtx.clip();  // tudo que for desenhado daqui em diante fica dentro do contorno

      for (let hi = 0; hi < hRows.length - 1; hi++) {
        const y0 = gridTop + faceH * hRows[hi];
        const y1 = gridTop + faceH * hRows[hi + 1];
        const yMid = (y0 + y1) / 2;
        const { lx: lx0, rx: rx0 } = edgeAtY(y0);
        const { lx: lx1, rx: rx1 } = edgeAtY(y1);
        if (rx0 - lx0 < 4 || rx1 - lx1 < 4) continue;

        for (let vi = 0; vi < hVts.length - 1; vi++) {
          const vt0   = hVts[vi];
          const vt1   = hVts[vi + 1];
          const vtMid = (vt0 + vt1) / 2;

          const x00 = lx0 + (rx0 - lx0) * vt0;
          const x01 = lx0 + (rx0 - lx0) * vt1;
          const x10 = lx1 + (rx1 - lx1) * vt0;
          const x11 = lx1 + (rx1 - lx1) * vt1;

          const pxMid = lx0 + (rx0 - lx0) * vtMid;
          const v    = thermalAtPx(pxMid, yMid);
          const heat = thermalColor(v, alpha * 0.18);

          fxCtx.beginPath();
          fxCtx.moveTo(x00, y0);
          fxCtx.lineTo(x01, y0);
          fxCtx.lineTo(x11, y1);
          fxCtx.lineTo(x10, y1);
          fxCtx.closePath();
          fxCtx.fillStyle = heat;
          fxCtx.fill();
        }
      }
      fxCtx.restore(); // remove o clip

      // ── Horizontais ────────────────────────────────────────────────
      // Usa rawEdgeAtY — respeita o contorno exato, sem extravasamento
      for (let hi = 1; hi < N_H; hi++) {
        const t  = sineMap(hi / N_H);
        const gy = gridTop + faceH * t;
        const { lx, rx } = rawEdgeAtY(gy);
        if (rx <= lx + 4) continue;
        fxCtx.beginPath();
        fxCtx.moveTo(lx, gy);
        fxCtx.lineTo(rx, gy);
        fxCtx.strokeStyle = cyanColor(alpha * 0.22);
        fxCtx.lineWidth   = 0.5;
        fxCtx.stroke();
      }

      // ── Verticais ──────────────────────────────────────────────────
      for (let vi = 1; vi < N_V; vi++) {
        const vt = sineMap(vi / N_V);
        fxCtx.beginPath();
        let started = false;
        for (let si = 0; si <= VSTEPS; si++) {
          const sy = gridTop + faceH * (si / VSTEPS);
          const { lx, rx } = edgeAtY(sy);
          if (rx <= lx + 4) continue;
          const sx = lx + (rx - lx) * vt;
          if (!started) { fxCtx.moveTo(sx, sy); started = true; }
          else           { fxCtx.lineTo(sx, sy); }
        }
        fxCtx.strokeStyle = cyanColor(alpha * 0.18);
        fxCtx.lineWidth   = 0.5;
        fxCtx.stroke();
      }

      // ── 3. Contorno externo ──
      {
        buildContourPath();
        fxCtx.strokeStyle = cyanColor(alpha * 0.85);
        fxCtx.lineWidth   = 1.5;
        fxCtx.shadowColor = cyanGlow(alpha * 0.55);
        fxCtx.shadowBlur  = 10;
        fxCtx.stroke();
        fxCtx.shadowBlur  = 0;
      }

      fxCtx.restore();


    }

    // Pontos de landmark com glow
    function drawLandmarkDots(lms, alpha) {
      const keyPts  = [8, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57];
      const midPts  = [17,18,19,20,21,22,23,24,25,26,
                       28,29,31,32,34,35,
                       37,38,40,41,43,44,46,47,
                       49,50,52,53,55,56,58,59,60,64];
      fxCtx.save();
      // Pontos menores (todos)
      for (let i = 0; i < lms.length; i++) {
        if (keyPts.includes(i) || midPts.includes(i)) continue;
        const pt = lms[i];
        fxCtx.beginPath();
        fxCtx.arc(pt.x, pt.y, 1.0 * meshAlpha, 0, Math.PI * 2);
        fxCtx.fillStyle = wineNeon(alpha * 0.35);
        fxCtx.fill();
      }
      // Pontos médios
      for (const i of midPts) {
        if (i >= lms.length) continue;
        const pt = lms[i];
        fxCtx.beginPath();
        fxCtx.arc(pt.x, pt.y, 1.6 * meshAlpha, 0, Math.PI * 2);
        fxCtx.fillStyle = cyanLight(alpha * 0.55);
        fxCtx.fill();
      }
      // Pontos-chave com glow + círculo de targeting
      for (const i of keyPts) {
        if (i >= lms.length) continue;
        const pt = lms[i];
        // Glow
        fxCtx.beginPath();
        fxCtx.arc(pt.x, pt.y, 5 * meshAlpha, 0, Math.PI * 2);
        fxCtx.fillStyle = cyanColor(alpha * 0.12);
        fxCtx.fill();
        // Ponto central
        fxCtx.beginPath();
        fxCtx.arc(pt.x, pt.y, 2.2 * meshAlpha, 0, Math.PI * 2);
        fxCtx.fillStyle = whiteGlow(alpha * 0.9);
        fxCtx.shadowColor = cyanGlow(alpha * 0.8);
        fxCtx.shadowBlur = 6;
        fxCtx.fill();
        fxCtx.shadowBlur = 0;
        // Anel externo
        fxCtx.beginPath();
        fxCtx.arc(pt.x, pt.y, 6 * meshAlpha, 0, Math.PI * 2);
        fxCtx.strokeStyle = cyanColor(alpha * 0.5);
        fxCtx.lineWidth = 0.7;
        fxCtx.stroke();
      }
      fxCtx.restore();
    }

    // Linha de scan sweeper (percorre os landmarks ao cruzar)
    function drawSweepLine(lms, cx, cy, rw, rh, alpha) {
      meshPhase = (meshPhase + 0.005) % 1;
      const sweepY = cy - rh * 1.0 + meshPhase * rh * 2.0;
      fxCtx.save();

      if (lms) {
        // Linha de scan segue o contorno facial na altura do sweep
        const ptsNear = lms.filter(p => Math.abs(p.y - sweepY) < rh * 0.12);
        if (ptsNear.length >= 2) {
          ptsNear.sort((a,b) => a.x - b.x);
          const leftX  = ptsNear[0].x;
          const rightX = ptsNear[ptsNear.length-1].x;
          const grad = fxCtx.createLinearGradient(leftX, 0, rightX, 0);
          grad.addColorStop(0,    'rgba(46,169,214,0)');
          grad.addColorStop(0.15, cyanColor(alpha * 0.5));
          grad.addColorStop(0.5,  whiteGlow(alpha * 0.9));
          grad.addColorStop(0.85, cyanColor(alpha * 0.5));
          grad.addColorStop(1,    'rgba(46,169,214,0)');
          fxCtx.beginPath();
          fxCtx.moveTo(leftX, sweepY);
          fxCtx.lineTo(rightX, sweepY);
          fxCtx.strokeStyle = grad;
          fxCtx.lineWidth = 1.2;
          fxCtx.shadowColor = cyanGlow(alpha * 0.7);
          fxCtx.shadowBlur = 10;
          fxCtx.stroke();
          fxCtx.shadowBlur = 0;
          // Pontos iluminados ao cruzar
          for (const pt of ptsNear) {
            const dist = Math.abs(pt.y - sweepY);
            const brightness = 1 - dist / (rh * 0.12);
            fxCtx.beginPath();
            fxCtx.arc(pt.x, pt.y, 3.5 * brightness, 0, Math.PI * 2);
            fxCtx.fillStyle = whiteGlow(brightness * alpha);
            fxCtx.shadowColor = cyanGlow(brightness * alpha);
            fxCtx.shadowBlur = 8;
            fxCtx.fill();
            fxCtx.shadowBlur = 0;
          }
        }
      } else {
        // Fallback sem landmarks
        const relY = (sweepY - cy) / rh;
        if (Math.abs(relY) < 1) {
          const hw = rw * Math.sqrt(Math.max(0, 1 - relY * relY));
          const grad = fxCtx.createLinearGradient(cx - hw, 0, cx + hw, 0);
          grad.addColorStop(0,   'rgba(168,85,104,0)');
          grad.addColorStop(0.3, cyanColor(0.4));
          grad.addColorStop(0.5, whiteGlow(0.7));
          grad.addColorStop(0.7, cyanColor(0.4));
          grad.addColorStop(1,   'rgba(168,85,104,0)');
          fxCtx.beginPath();
          fxCtx.moveTo(cx - hw, sweepY);
          fxCtx.lineTo(cx + hw, sweepY);
          fxCtx.strokeStyle = grad;
          fxCtx.lineWidth = 1.2;
          fxCtx.shadowColor = cyanGlow(0.5);
          fxCtx.shadowBlur = 10;
          fxCtx.stroke();
          fxCtx.shadowBlur = 0;
        }
      }
      fxCtx.restore();
    }

    function fxLoop() {
      if (!fxCtx) { fxRafId = requestAnimationFrame(fxLoop); return; }
      fxFrame++;
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

      if (!fxFaceBox) { fxRafId = requestAnimationFrame(fxLoop); return; }
      const { cx, cy, rw, rh } = fxFaceBox;

      const hasLM = lastLandmarks && lastLandmarks.length >= 68;

      // Fade-in suave
      meshAlpha = Math.min(1, meshAlpha + 0.022);
      const a = meshAlpha;

      // Suprimir oval SVG quando mesh está ativa
      if (guideEll && arcEll) {
        if (hasLM && a > 0.4) {
          guideEll.classList.add('mesh-active');
          arcEll.classList.add('mesh-active');
        } else {
          guideEll.classList.remove('mesh-active');
          arcEll.classList.remove('mesh-active');
        }
      }

      if (hasLM) {
        const lms = lastLandmarks;

        // 1. Grid estrutural (camada base)
        drawStructuralGrid(lms, a, cx, cy, rw, rh);

        // 2. Regiões anatômicas com linha suave
        // Sobrancelhas
        drawSmoothRegion([17,18,19,20,21].map(i=>lms[i]), a * 0.9, 1.2, cyanColor, cyanGlow, false);
        drawSmoothRegion([26,25,24,23,22].map(i=>lms[i]), a * 0.9, 1.2, cyanColor, cyanGlow, false);
        // Olhos (fechados, distintos do grid — mantidos)
        drawSmoothRegion([36,37,38,39,40,41,36].map(i=>lms[i]), a * 0.95, 1.3, cyanLight, cyanGlow, true);
        drawSmoothRegion([42,43,44,45,46,47,42].map(i=>lms[i]), a * 0.95, 1.3, cyanLight, cyanGlow, true);
        // Nariz
        drawSmoothRegion([27,28,29,30].map(i=>lms[i]), a * 0.8, 1.0, cyanColor, cyanGlow, false);
        drawSmoothRegion([31,32,33,34,35].map(i=>lms[i]), a * 0.8, 1.0, cyanColor, cyanGlow, false);
        // Boca externa
        drawSmoothRegion([48,49,50,51,52,53,54,55,56,57,58,59,48].map(i=>lms[i]), a * 0.9, 1.2, cyanColor, cyanGlow, true);
        // Boca interna
        drawSmoothRegion([60,61,62,63,64,65,66,67,60].map(i=>lms[i]), a * 0.7, 0.8, cyanColor, cyanGlow, true);

        // Limpa topoLines do fallback para não sobrepor ao grid de landmarks
        topoLines.length = 0;

        // 3. (Contorno unificado já desenhado dentro de drawStructuralGrid)

        // 4. Pontos de landmark
        drawLandmarkDots(lms, a);

        // 5. Linha de scan sweeper
        if (scanActive) drawSweepLine(lms, cx, cy, rw, rh, a);

      } else {
        // Sem landmarks: partículas e topo fallback
        if (fxFrame % 3  === 0) spawnMeshPts(cx, cy, rw, rh);
        if (fxFrame % 18 === 0) spawnTopoLine(cx, cy, rw, rh);

        // Partículas
        for (let i = meshPts.length - 1; i >= 0; i--) {
          const p = meshPts[i];
          p.life++;
          const lifeRatio = p.life / p.maxLife;
          const fade = lifeRatio < 0.15 ? lifeRatio / 0.15 : lifeRatio > 0.75 ? (1 - lifeRatio) / 0.25 : 1;
          if (fade < 0.02 || p.life >= p.maxLife) { meshPts.splice(i, 1); continue; }
          fxCtx.beginPath();
          fxCtx.arc(p.x, p.y, p.r * fade * 2, 0, Math.PI * 2);
          fxCtx.fillStyle = cyanColor(fade * 0.12);
          fxCtx.fill();
          fxCtx.beginPath();
          fxCtx.arc(p.x, p.y, p.r * fade, 0, Math.PI * 2);
          fxCtx.fillStyle = cyanLight(fade * 0.65);
          fxCtx.fill();
        }
        // Linhas topo
        for (let i = topoLines.length - 1; i >= 0; i--) {
          const t = topoLines[i];
          t.progress = Math.min(1, t.progress + t.speed);
          t.life++;
          const fade = t.life > t.maxLife - 20 ? (t.maxLife - t.life) / 20 : Math.min(1, t.progress * 5);
          const alpha = t.opacity * fade;
          if (alpha < 0.01 || t.life >= t.maxLife) { topoLines.splice(i, 1); continue; }
          const visible = Math.floor(t.progress * t.pts.length);
          if (visible < 2) continue;
          fxCtx.beginPath();
          fxCtx.moveTo(t.pts[0].x, t.pts[0].y);
          for (let j = 1; j < visible; j++) fxCtx.lineTo(t.pts[j].x, t.pts[j].y);
          fxCtx.strokeStyle = cyanColor(alpha * 0.6);
          fxCtx.lineWidth = 0.8;
          fxCtx.shadowColor = cyanGlow(alpha * 0.3);
          fxCtx.shadowBlur = 4;
          fxCtx.stroke();
          fxCtx.shadowBlur = 0;
        }
        if (scanActive) drawSweepLine(null, cx, cy, rw, rh, 1);
      }

      fxRafId = requestAnimationFrame(fxLoop);
    }


    // ── Carrega face-api.js dinamicamente ───────────────────────────
    function loadFaceApi() {
      return new Promise((resolve, reject) => {
        if (window.faceapi) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    async function loadModels() {
      if (modelsLoaded) return;
      await loadFaceApi();
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL);
      modelsLoaded = true;
    }

    // ── Converte bbox de vídeo → coordenadas da tela (px) ───────────
    function videoBoxToScreen(box) {
      const vw = video.videoWidth  || video.clientWidth  || 1;
      const vh = video.videoHeight || video.clientHeight || 1;
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      // Video é object-fit:cover + scaleX(-1) (espelho)
      // Calcula a área de vídeo visível na tela
      const videoAspect  = vw / vh;
      const screenAspect = sw / sh;
      let drawW, drawH, offsetX = 0, offsetY = 0;
      if (videoAspect > screenAspect) {
        drawH = sh; drawW = sh * videoAspect; offsetX = -(drawW - sw) / 2;
      } else {
        drawW = sw; drawH = sw / videoAspect; offsetY = -(drawH - sh) / 2;
      }
      // Espelho: x invertido
      const scaleX = drawW / vw;
      const scaleY = drawH / vh;
      const screenX = offsetX + (vw - box.x - box.width) * scaleX;
      const screenY = offsetY + box.y * scaleY;
      const screenRW = box.width  * scaleX / 2;
      const screenRH = box.height * scaleY / 2;
      return {
        cx: screenX + screenRW,
        cy: screenY + screenRH,
        rw: screenRW,
        rh: screenRH,
      };
    }

    // ── Oval SVG: mapeamento vídeo → % viewBox ───────────────────────
    function setOval(cx, cy, rx, ry) {
      const vw = video.videoWidth  || video.clientWidth  || 1;
      const vh = video.videoHeight || video.clientHeight || 1;
      const isMobile = window.innerWidth <= 580;
      const cxPct = (1 - cx / vw) * 100;
      const cyPct = (cy / vh) * 100;
      const rxPct = (rx / vw) * 100;
      const ryPct = (ry / vh) * 100 * (isMobile ? 0.75 : 1);
      [maskEll, guideEll, arcEll].forEach(el => {
        el.setAttribute('cx', cxPct.toFixed(2));
        el.setAttribute('cy', cyPct.toFixed(2));
        el.setAttribute('rx', rxPct.toFixed(2));
        el.setAttribute('ry', ryPct.toFixed(2));
      });
    }

    function resetOval() {
      const isMobile = window.innerWidth <= 580;
      const defaultRx = isMobile ? '55' : '17.6';
      const defaultRy = isMobile ? '29.25' : '30';
      [maskEll, guideEll, arcEll].forEach(el => {
        el.setAttribute('cx', '50'); el.setAttribute('cy', '50');
        el.setAttribute('rx', defaultRx); el.setAttribute('ry', defaultRy);
      });
      arcEll.setAttribute('stroke-dasharray', '0 1000');
      progBar.style.width = '0%';
      progWrap.classList.remove('visible');
      guideEll.classList.remove('face-in');
      guideEll.style.stroke = '';
      arcEll.style.stroke   = 'rgba(0,0,0,0)';
    }

    function ellipsePerimeter(rx, ry) {
      const a = Math.max(rx, ry), b = Math.min(rx, ry);
      const h = Math.pow((a - b) / (a + b), 2);
      return Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
    }

    // ── Instrução ───────────────────────────────────────────────────
    function setInstruction(icon, text, isCountdown) {
      if (instIcon) instIcon.textContent = icon;
      if (instText) instText.textContent = text;
      const box = document.getElementById('scanner-inst-box');
      if (box) {
        if (isCountdown) box.classList.add('inst-countdown');
        else             box.classList.remove('inst-countdown');
      }
    }

    // ── Dots de progresso ───────────────────────────────────────────
    function updateDots() {
      for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('sdot-' + i);
        dot.className = 'sdot' + (i < stepIdx ? ' done' : i === stepIdx ? ' active' : '');
      }
    }

    // ── Verifica pose ───────────────────────────────────────────────
    function checkPose(detection, step) {
      if (!detection) return false;
      const { box } = detection.detection;
      const vw = video.videoWidth  || video.clientWidth;
      const vh = video.videoHeight || video.clientHeight;
      const faceFrac = box.width / vw;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const offX = Math.abs((cx / vw) - 0.5);
      const offY = Math.abs((cy / vh) - 0.48);

      if (step.key === 'close') return faceFrac >= step.sizeMin;

      const lm = detection.landmarks;
      if (!lm) return offX < 0.18 && offY < 0.20;
      const pts = lm.positions;
      const noseTip = pts[30], lEye = pts[36], rEye = pts[45];
      const eyeWidth = rEye.x - lEye.x;
      const noseMid  = (lEye.x + rEye.x) / 2;
      const yawEstimate = ((noseTip.x - noseMid) / (eyeWidth || 1)) * 90;
      const [yMin, yMax] = step.yawRange;
      return yawEstimate >= yMin && yawEstimate <= yMax && offY < 0.22;
    }

    // ── Captura frame ────────────────────────────────────────────────
    function captureFrame() {
      const cvs = canvasHide;
      cvs.width  = video.videoWidth;
      cvs.height = video.videoHeight;
      const ctx  = cvs.getContext('2d');
      ctx.save();
      ctx.translate(cvs.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      ctx.restore();
      return cvs.toDataURL('image/jpeg', 0.88);
    }

    // ── Contagem regressiva 3-2-1 antes da captura ──────────────────
    let _countdownTimer = null;
    let _countdownActive = false;

    function startCountdown(step) {
      if (_countdownActive) return;
      _countdownActive = true;
      const counts = ['3', '2', '1'];
      let i = 0;
      const interval = step.holdMs / counts.length;

      setInstruction('⏱️', counts[0], true);

      _countdownTimer = setInterval(() => {
        i++;
        if (!_countdownActive) { clearInterval(_countdownTimer); _countdownTimer = null; return; }
        if (i < counts.length) {
          setInstruction('⏱️', counts[i], true);
        } else {
          clearInterval(_countdownTimer);
          _countdownTimer = null;
        }
      }, interval);
    }

    function cancelCountdown() {
      _countdownActive = false;
      if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }
    }

    // ── Flash de captura ─────────────────────────────────────────────
    function doFlash(cb) {
      flash.classList.add('flashing');
      setTimeout(() => { flash.classList.remove('flashing'); if (cb) cb(); }, 180);
    }

    // ── Avança para o próximo step ───────────────────────────────────
    function nextStep() {
      stepIdx++;
      holdStart = null;
      capturing = false;
      cancelCountdown();
      progBar.style.width = '0%';
      progWrap.classList.remove('visible');
      arcEll.setAttribute('stroke-dasharray', '0 1000');
      guideEll.classList.remove('face-in');
      guideEll.style.stroke = '';
      arcEll.style.stroke   = 'rgba(0,0,0,0)';
      if (statusDot) statusDot.classList.remove('locked');

      meshPts.length = 0;
      topoLines.length = 0;
      meshPhase = 0;
      lastLandmarks = null;
      meshAlpha = 0;

      if (stepIdx >= STEPS.length) {
        finishScanner();
        return;
      }

      const step = STEPS[stepIdx];
      setInstruction(step.icon, step.text);
      stepLabel.textContent = step.label;
      updateDots();
    }

    // ── Finaliza scanner ─────────────────────────────────────────────
    function finishScanner() {
      stopCamera();
      overlay.style.display = 'none';
      answers['scanner_captures'] = captures;
      updateScreen24State();
      goTo(24);
    }

    // ── Loop principal de detecção ───────────────────────────────────
    async function detectionLoop() {
      if (!faceApiReady || video.paused || video.ended) {
        rafId = requestAnimationFrame(detectionLoop);
        return;
      }

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.40 });
      let detection = null;
      try {
        detection = await faceapi.detectSingleFace(video, opts).withFaceLandmarks(true);
      } catch(e) {}

      const step = STEPS[stepIdx];

      if (!detection) {
        holdStart = null;
        capturing = false;
        scanActive = false;
        fxFaceBox = null;
        lastLandmarks = null;
        meshAlpha = 0;
        resetOval();
        setInstruction('🙆‍♀️', 'Posicione seu rosto no centro');
        stepLabel.textContent = step.label;
        if (statusDot) statusDot.classList.remove('locked');
        startHudAnimation(false);
        rafId = requestAnimationFrame(detectionLoop);
        return;
      }

      scanActive = true;
      startHudAnimation(true);
      updateLandmarks(detection);

      const { box } = detection.detection;
      const pad = 0.20;
      const cx  = box.x + box.width  / 2;
      const cy  = box.y + box.height / 2;
      const rx  = box.width  / 2 * (1 + pad);
      const ry  = box.height / 2 * (1 + pad * 0.6);

      // Atualiza fxFaceBox com coordenadas de tela (rh com 75% da altura só no mobile)
      const paddedBox = { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 };
      const rawFxBox = videoBoxToScreen(paddedBox);
      const isMobileFx = window.innerWidth <= 580;
      fxFaceBox = { ...rawFxBox, rh: rawFxBox.rh * (isMobileFx ? 0.75 : 1) };

      const onTarget = checkPose(detection, step);

      if (onTarget) {
        guideEll.classList.add('face-in');
        if (statusDot) statusDot.classList.add('locked');
        if (!holdStart) {
          holdStart = performance.now();
          // Inicia contagem regressiva 3-2-1
          startCountdown(step);
        }
        const elapsed = performance.now() - holdStart;

        // Arco: mantido invisível (substituído pela contagem regressiva)
        arcEll.setAttribute('stroke-dasharray', '0 1000');
        arcEll.style.stroke = 'rgba(0,0,0,0)';

        if (elapsed >= step.holdMs && !capturing) {
          capturing = true;
          const img = captureFrame();
          captures[step.key] = img;
          setOval(cx, cy, rx, ry);
          doFlash(() => nextStep());
        }
      } else {
        guideEll.classList.remove('face-in');
        if (statusDot) statusDot.classList.remove('locked');
        holdStart = null;
        capturing = false;
        cancelCountdown();
        progBar.style.width = '0%';
        progWrap.classList.remove('visible');
        arcEll.setAttribute('stroke-dasharray', '0 1000');
        arcEll.style.stroke = 'rgba(0,0,0,0)';
        guideEll.style.stroke = '';
  
        setInstruction(step.icon, step.text);
      }

      setOval(cx, cy, rx, ry);
      rafId = requestAnimationFrame(detectionLoop);
    }

    // ── Inicia câmera e scanner ──────────────────────────────────────
    async function startScanner() {
      stepIdx   = 0;
      holdStart = null;
      capturing = false;
      cancelCountdown();
      scanActive = false;
      fxFaceBox = null;
      meshPts.length = 0;
      topoLines.length = 0;
      meshPhase = 0;
      lastLandmarks = null;
      meshAlpha = 0;
      Object.keys(captures).forEach(k => delete captures[k]);

      overlay.style.display = 'flex';
      blocked.classList.remove('visible');
      resetOval();
      resetHud();
      const scanTop = document.getElementById('scanner-top');

      // Atualiza resolução real da tela no HUD
      const hudRes = document.getElementById('hud-res');
      if (hudRes) hudRes.textContent = 'RES: ' + window.screen.width + '×' + window.screen.height;

      resizeFxCanvas();
      window.addEventListener('resize', resizeFxCanvas);

      const step = STEPS[0];
      setInstruction(step.icon, step.text);
      stepLabel.textContent = step.label;
      updateDots();

      // Inicia FX loop
      if (fxRafId) cancelAnimationFrame(fxRafId);
      fxRafId = requestAnimationFrame(fxLoop);

      // Câmera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        video.srcObject = stream;
        await new Promise(r => video.onloadedmetadata = r);
        video.play();

      } catch(e) {
        sessionStorage.setItem('dermai_return', '24');
        blocked.classList.add('visible');
        return;
      }

      // Carrega modelos
      try {
        await loadModels();
        faceApiReady = true;
      } catch(e) {
        faceApiReady = false;
      }

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(detectionLoop);
    }

    function stopCamera() {
      if (rafId)   { cancelAnimationFrame(rafId);   rafId   = null; }
      if (fxRafId) { cancelAnimationFrame(fxRafId); fxRafId = null; }
      stopHudAnimation();
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
      faceApiReady = false;
      scanActive = false;
      fxFaceBox = null;
      video.srcObject = null;
      window.removeEventListener('resize', resizeFxCanvas);
    }

    window._startScanner = startScanner;
    window._stopScanner  = stopCamera;

  })();



