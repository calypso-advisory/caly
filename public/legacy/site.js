(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var pages = [].slice.call(document.querySelectorAll('main[data-page]'));
  var navLinks = [].slice.call(document.querySelectorAll('#nav a'));
  var nav = document.getElementById('nav'), menuBtn = document.getElementById('menuBtn');
  var shell = document.getElementById('hdrShell'), bar = document.getElementById('progress');
  var pending = null, current = null;

  /* split words */
  [].forEach.call(document.querySelectorAll('[data-words]'), function(el){
    var words = el.textContent.split(/(\s+)/); el.textContent = '';
    var i = 0;
    words.forEach(function(w){
      if(/^\s+$/.test(w)){ el.appendChild(document.createTextNode(w)); return; }
      var s = document.createElement('span'); s.className = 'wd'; s.style.setProperty('--i', i++); s.textContent = w; el.appendChild(s);
      if(w.indexOf('tempête') === 0) s.classList.add('storm-word');
    });
  });
  [].forEach.call(document.querySelectorAll('[data-scrub]'), function(el){
    var words = el.textContent.split(/\s+/); el.textContent = '';
    words.forEach(function(w, k){
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w; el.appendChild(s);
      if(k < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* reveal */
  if(!reduce && 'IntersectionObserver' in window){
    root.classList.add('anim');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    [].forEach.call(document.querySelectorAll('[data-reveal],[data-words]'), function(el){ io.observe(el); });
  }

  /* pages are real URLs now: mark the current one in the menu, and pre-select a situation passed as ?s=N */
  (function(){
    var path = location.pathname.replace(/\/+$/, '') || '/';
    navLinks.forEach(function(a){ var h = a.getAttribute('href'); if(h === path && !a.classList.contains('btn')) a.setAttribute('aria-current', 'page'); });
    var q = /[?&]s=(\d)/.exec(location.search); if(q){ var r = document.getElementById('s' + q[1]); if(r) r.checked = true; }
  })();
  function go(id){ location.href = '/faire-le-point' + (pending !== null ? '?s=' + pending : ''); }
  [].forEach.call(document.querySelectorAll('[data-sit]'), function(b){ b.addEventListener('click', function(){ pending = b.getAttribute('data-sit'); go(); }); });
  menuBtn.addEventListener('click', function(){ var o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o ? 'true' : 'false'); });

  /* scroll-driven: progress, header, parallax, scrub, timeline */
  var ticking = false;
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight, dh = document.documentElement.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (dh > 0 ? y / dh : 0) + ')';
      document.body.classList.toggle('scrolled', y > 30);
      if(reduce) return;
      var scope = document.querySelector('main:not([hidden])');
      var els = [].slice.call(scope.querySelectorAll('[data-speed]')).concat([].slice.call(document.querySelectorAll('footer [data-speed]')));
      els.forEach(function(el){
        var r = el.getBoundingClientRect(); if(r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      [].forEach.call(scope.querySelectorAll('[data-scrub]:not(.sk-scrub)'), function(el){
        var r = el.getBoundingClientRect();
        var p = clamp((vh * .82 - r.top) / (vh * .55), 0, 1);
        var ws = el.querySelectorAll('.w'), n = ws.length;
        for(var i = 0; i < n; i++){ ws[i].style.opacity = (.14 + .86 * clamp(p * n - i, 0, 1)).toFixed(3); }
      });
      var sc = scope.querySelector('#scene');
      if(sc){
        var rs = sc.getBoundingClientRect();
        var ps = clamp((vh * .4 - rs.top) / (rs.height - vh * .6), 0, 1);
        var e = ps < .5 ? 2 * ps * ps : 1 - Math.pow(-2 * ps + 2, 2) / 2;
        var pp = clamp(e * 1.15, 0, 1);
        sc.style.setProperty('--p', pp.toFixed(4));
        sc.style.setProperty('--ts', (.94 + .06 * pp).toFixed(4));
      }
      var cs = scope.querySelector('#compass');
      if(cs && !reduce){
        var rc = cs.getBoundingClientRect();
        var settle = clamp((vh - rc.top) / (vh * 1.6), 0, 1);
        var P = clamp(-rc.top / (rc.height - vh), 0, 1);
        function seg(v, a, b){ var x = clamp((v - a) / (b - a), 0, 1); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
        var ec = 1 - Math.pow(1 - settle, 3);
        cs.style.setProperty('--cp', ec.toFixed(4));
        cs.style.setProperty('--tr', seg(P, .2, .33).toFixed(4));
        var c1 = seg(P, .34, .5), c2 = seg(P, .5, .66), c3 = seg(P, .66, .82);
        cs.style.setProperty('--c1', c1.toFixed(4)); cs.style.setProperty('--c2', c2.toFixed(4)); cs.style.setProperty('--c3', c3.toFixed(4));
        var rt = clamp(c2 * .5 + c3 * .5, 0, 1);
        document.getElementById('routeLine').setAttribute('stroke-dashoffset', (1 - rt).toFixed(4));
        window.__compassP = settle; window.__compassC = [c1, c2, c3];
      }
      var fs = scope.querySelector('#finale');
      if(fs && !reduce){
        var rf = fs.getBoundingClientRect();
        var G = clamp((vh - rf.top) / rf.height, 0, 1);
        var fx = clamp((G - .02) / .7, 0, 1), fpv = fx * fx * (3 - 2 * fx);
        var flv = clamp((G - .64) / .14, 0, 1); flv = flv * flv * (3 - 2 * flv);
        fs.style.setProperty('--fp', fpv.toFixed(4)); fs.style.setProperty('--fl', flv.toFixed(4));
        fs.querySelector('.fix').classList.toggle('locked', flv > .99);
        window.__finaleP = fpv;
      }
      var ws = scope.querySelector('#water');
      if(ws){ var rw = ws.getBoundingClientRect(); window.__waterP = clamp(-rw.top / (rw.height - vh), 0, 1); window.__waterVis = rw.top < vh && rw.bottom > 0; }
      var tl = scope.querySelector('#timeline');
      if(tl){
        var r = tl.getBoundingClientRect();
        var p = clamp((vh * .75 - r.top) / (r.height * .7), 0, 1);
        document.getElementById('tlLine').setAttribute('stroke-dashoffset', (1 - p).toFixed(3));
        [].forEach.call(tl.querySelectorAll('.tl-step'), function(s, i){ s.classList.toggle('lit', p >= i / 2 - .02); });
      }
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  if(reduce){ [].forEach.call(document.querySelectorAll('.tl-step'), function(s){ s.classList.add('lit'); }); var l = document.getElementById('tlLine'); if(l) l.setAttribute('stroke-dashoffset','0'); }

  /* pointer: tilt, spotlight, magnetic */
  if(!reduce && window.matchMedia('(pointer:fine)').matches){
    document.addEventListener('pointermove', function(e){
      [].forEach.call(document.querySelectorAll('main:not([hidden]) .tilt'), function(v){
        var r = v.getBoundingClientRect(); if(r.bottom < 0 || r.top > innerHeight) return;
        var dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        v.style.transform = 'rotateY(' + (dx * 14).toFixed(2) + 'deg) rotateX(' + (-dy * 10).toFixed(2) + 'deg)';
      });
    }, {passive:true});
    [].forEach.call(document.querySelectorAll('.spot'), function(t){
      t.addEventListener('pointermove', function(e){ var r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    });
    [].forEach.call(document.querySelectorAll('.mag'), function(b){
      b.addEventListener('pointermove', function(e){ var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .15).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + 'px)'; });
      b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
    });
  }

  /* copy */
  var copyBtn = document.getElementById('copyBtn');
  if(copyBtn) copyBtn.addEventListener('click', function(){
    var el = document.getElementById('email');
    function sel(){ var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    try{ navigator.clipboard.writeText(el.textContent).then(function(){ copyBtn.textContent = 'Copié'; setTimeout(function(){ copyBtn.textContent = 'Copier'; }, 1800); }, sel); }catch(e){ sel(); }
  });

  /* form */
  (function(){
    var form = document.getElementById('form'); if(!form) return;
    var notice = document.getElementById('notice'), btn = form.querySelector('button[type=submit]'), busy = false;
    function say(msg, ok){ notice.textContent = msg; notice.hidden = false; notice.classList.toggle('ok', !!ok); notice.classList.toggle('ko', !ok); }
    form.addEventListener('submit', function(e){
      e.preventDefault(); if(busy) return;
      var nom = document.getElementById('nom'), mail = document.getElementById('mail'), ok = true;
      document.getElementById('err-nom').textContent = ''; document.getElementById('err-mail').textContent = '';
      if(!nom.value.trim()){ document.getElementById('err-nom').textContent = 'Indiquez votre nom pour que nous puissions vous recontacter.'; ok = false; }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())){ document.getElementById('err-mail').textContent = 'Indiquez une adresse e-mail valide, par exemple nom@entreprise.fr.'; ok = false; }
      if(!ok){ (nom.value.trim() ? mail : nom).focus(); return; }
      var sit = form.querySelector('input[name=situation]:checked');
      var data = { situation: sit ? sit.value : '', message: document.getElementById('msg').value, nom: nom.value, societe: document.getElementById('societe').value, email: mail.value, telephone: document.getElementById('tel').value, website: (document.getElementById('website') || {}).value || '' };
      busy = true; btn.setAttribute('aria-busy', 'true'); btn.disabled = true; notice.hidden = true;
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok: r.ok, j: j }; }); })
        .then(function(res){
          if(res.ok){ form.reset(); say('Merci. Votre demande nous est bien parvenue. Un membre de l\'équipe revient vers vous sous 24 heures ouvrées.', true); }
          else say(res.j && res.j.error === 'invalid' ? 'Certains champs ne sont pas valides. Vérifiez votre nom et votre adresse e-mail.' : 'L\'envoi n\'a pas abouti. Vous pouvez réessayer dans un instant, ou écrire directement à contact@calypso-advisory.com.', false);
        })
        .catch(function(){ say('L\'envoi n\'a pas abouti. Vérifiez votre connexion, ou écrivez directement à contact@calypso-advisory.com.', false); })
        .then(function(){ busy = false; btn.removeAttribute('aria-busy'); btn.disabled = false; });
    });
  })();

  /* storm around « tempête » : starts after a few seconds or at the first scroll, calms as the visitor scrolls away */
  (function(){
    var canvas = document.getElementById('storm'); if(!canvas || reduce || !canvas.getContext) return;
    var hero = canvas.parentElement, ctx = canvas.getContext('2d');
    var word = document.querySelector('.storm-word');
    var w = 0, h = 0, drops = [], clouds = [], bolts = [], started = false, visible = true, running = false;
    var intensity = 0, last = 0, nextBolt = 0, flash = 0;
    function rnd(a, b){ return a + Math.random() * (b - a); }
    function newDrop(any){ return {x: rnd(0, w * 1.25), y: any ? rnd(0, h) : rnd(-60, -10), l: rnd(10, 26), v: rnd(420, 760), a: rnd(.07, .26)}; }
    function size(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drops = []; var n = Math.round(w * h / 4200); for(var i = 0; i < n; i++) drops.push(newDrop(true));
      clouds = []; for(var j = 0; j < 8; j++) clouds.push({x: rnd(w * .35, w * 1.15), y: rnd(-h * .1, h * .5), r: rnd(200, 420), vx: -rnd(5, 14), a: rnd(.35, .7)});
    }
    function mid(x1, y1, x2, y2, d, out){
      if(d < 4){ out.push([x2, y2]); return; }
      var mx = (x1 + x2) / 2 + rnd(-d, d), my = (y1 + y2) / 2 + rnd(-d * .3, d * .3);
      mid(x1, y1, mx, my, d / 2, out); mid(mx, my, x2, y2, d / 2, out);
    }
    function spawn(){
      var x = rnd(w * .56, w * .94), y2 = rnd(h * .42, h * .78), main = [[x, -10]];
      mid(x, -10, x + rnd(-90, 90), y2, 90, main);
      var branches = [];
      for(var k = 0; k < 3; k++){
        var p = main[Math.floor(rnd(main.length * .2, main.length * .7))];
        var br = [[p[0], p[1]]]; mid(p[0], p[1], p[0] + rnd(-140, 140), p[1] + rnd(60, 180), 40, br); branches.push(br);
      }
      bolts.push({main: main, branches: branches, t: 0});
    }
    function path(pts){ ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for(var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
    function alphaAt(t){ if(t < .06) return 1; if(t < .12) return .15; if(t < .2) return .85; if(t < .26) return .3; return Math.max(0, .7 - (t - .26) / .45); }
    function frame(ts){
      if(!running) return;
      var dt = last ? Math.min((ts - last) / 1000, .05) : .016; last = ts;
      var heroP = Math.min(1, window.scrollY / Math.max(1, h * .9));
      var target = started ? (1 - heroP) * (w < 720 ? .65 : 1) : 0;
      intensity += (target - intensity) * Math.min(1, dt * 1.2);
      ctx.clearRect(0, 0, w, h);
      /* clouds */
      for(var i = 0; i < clouds.length; i++){
        var c = clouds[i]; c.x += c.vx * dt; if(c.x < w * .2 - c.r) c.x = w + c.r;
        var g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        var lit = flash * .55;
        g.addColorStop(0, 'rgba(' + Math.round(34 + 120 * lit) + ',' + Math.round(52 + 130 * lit) + ',' + Math.round(68 + 140 * lit) + ',' + (c.a * intensity).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(20,34,46,0)');
        ctx.fillStyle = g; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
      if(flash > .01){ ctx.fillStyle = 'rgba(175,200,220,' + (.1 * flash * intensity).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h); }
      /* rain */
      var n = Math.floor(drops.length * intensity);
      ctx.lineWidth = 1; ctx.lineCap = 'round';
      for(var k = 0; k < drops.length; k++){
        var d = drops[k]; d.y += d.v * dt; d.x -= d.v * .2 * dt;
        if(d.y > h + 20){ drops[k] = newDrop(false); continue; }
        if(k >= n) continue;
        ctx.strokeStyle = 'rgba(165,188,202,' + (d.a * (1 + flash)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * .2, d.y - d.l); ctx.stroke();
      }
      /* lightning */
      if(started && intensity > .45 && ts > nextBolt){ spawn(); nextBolt = ts + rnd(3800, 8000); }
      flash = 0;
      for(var b = bolts.length - 1; b >= 0; b--){
        var bo = bolts[b]; bo.t += dt; var a = alphaAt(bo.t) * intensity;
        if(bo.t > 1){ bolts.splice(b, 1); continue; }
        flash = Math.max(flash, a);
        ctx.save(); ctx.shadowColor = 'rgba(185,215,240,.95)'; ctx.shadowBlur = 22;
        ctx.strokeStyle = 'rgba(240,246,250,' + a.toFixed(3) + ')'; ctx.lineWidth = 1.7; path(bo.main);
        ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(220,234,244,' + (a * .7).toFixed(3) + ')';
        for(var q = 0; q < bo.branches.length; q++) path(bo.branches[q]);
        ctx.restore();
      }
      if(word) word.classList.toggle('flash', flash > .55);
      requestAnimationFrame(frame);
    }
    function update(){
      var should = visible && !document.hidden && !hero.closest('main').hidden;
      if(should && !running){ running = true; last = 0; requestAnimationFrame(frame); }
      else if(!should){ running = false; if(word) word.classList.remove('flash'); }
    }
    function start(){
      if(started) return; started = true;
      canvas.classList.add('on'); hero.classList.add('storm-on');
      nextBolt = performance.now() + 900;
    }
    size(); window.addEventListener('resize', size); window.addEventListener('load', size); if(document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    if('IntersectionObserver' in window){ new IntersectionObserver(function(e){ visible = e[0].isIntersecting; update(); }).observe(hero); }
    document.addEventListener('visibilitychange', update);
    window.addEventListener('hashchange', function(){ setTimeout(update, 50); });
    setTimeout(start, 2600);
    window.addEventListener('scroll', function once(){ start(); window.removeEventListener('scroll', once); }, {passive:true});
    update();
  })();


  /* water: seen through the glass of a tank. The water rises on screen over the text; once everything is under, the camera rises to skim the surface: the text rests in the depth and a beacon floats up between the waves */
  (function(){
    var sec = document.getElementById('water'), can = document.getElementById('waterCanvas'); if(!sec || !can) return;
    var cap = document.getElementById('waterCap'); if(cap) cap.style.display = 'none';
    if(reduce || typeof THREE === 'undefined'){ can.style.display = 'none'; return; }
    var renderer; try{ renderer = new THREE.WebGLRenderer({canvas: can, antialias: true, alpha: true}); }catch(e){ can.style.display = 'none'; return; }
    renderer.setClearColor(0x000000, 0);
    var txt = document.getElementById('waterText'), map = document.getElementById('uwMap'), turb = document.getElementById('uwTurb');
    var cta = document.getElementById('waterCta'), sky = sec.querySelector('.w-sky');
    var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xF2F2EE, 60, 560);
    var camera = new THREE.PerspectiveCamera(50, 1, .5, 2000);
    var R = 70, XN = 160, X0 = -240, X1 = 240, zs = [], i, j;
    for(i = 0; i < R; i++) zs.push(-Math.pow(i / (R - 1), 1.8) * 620);
    var rowPos = new Float32Array((R - 1) * XN * 6), colXs = [];
    for(var cx = -230; cx <= 230; cx += 11.5) colXs.push(cx);
    var colPos = new Float32Array(colXs.length * (R - 1) * 6), edgePos = new Float32Array(XN * 6);
    function lineObj(arr, color, op){ var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3)); var m = new THREE.LineBasicMaterial({color: color, transparent: true, opacity: op, fog: true, depthWrite: false}); var l = new THREE.LineSegments(g, m); scene.add(l); return {g: g, m: m, l: l}; }
    var rows = lineObj(rowPos, 0x6F8C9C, .5), cols = lineObj(colPos, 0x6F8C9C, .16);
    var fPos = new Float32Array((XN + 1) * 2 * 3), fIdx = [];
    for(i = 0; i < XN; i++){ var a0 = i * 2; fIdx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
    var fG = new THREE.BufferGeometry(); fG.setAttribute('position', new THREE.BufferAttribute(fPos, 3)); fG.setIndex(fIdx);
    var uni = {uTime: {value: 0}, uRes: {value: new THREE.Vector2(1, 1)}, uLevel: {value: -30}, uGap: {value: 0}, uSlit: {value: 0}, uClear: {value: 0}};
    var face = new THREE.Mesh(fG, new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthTest: false, depthWrite: false,
      vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: [
        'uniform float uTime; uniform vec2 uRes; uniform float uLevel; uniform float uGap; uniform float uSlit; uniform float uClear; varying float vY;',
        'float caustic(vec2 uv, float t){',
        '  vec2 p = mod(uv * 6.28318 * 1.6, 6.28318) - 250.; vec2 i = p; float c = 1.; float inten = .005;',
        '  for(int n = 0; n < 4; n++){ float tt = t * (1. - (3.5 / float(n + 1))); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1. / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten))); }',
        '  c /= 4.; c = 1.17 - pow(c, 1.4); return clamp(pow(abs(c), 8.), 0., 1.);',
        '}',
        'void main(){',
        '  vec2 uv = gl_FragCoord.xy / uRes; vec2 q = vec2(uv.x * uRes.x / uRes.y, uv.y);',
        '  float below = max(0., uLevel - vY), depth = clamp(below / 34., 0., 1.), glow = exp(-below * 1.1);',
        '  vec3 deep = mix(vec3(.13,.31,.41), vec3(.04,.12,.18), depth);',
        '  float c = caustic(q * .9 + vec2(0., uTime * .02), uTime * .35) * (1. - depth * .75);',
        '  float ax = q.x * .95 + vY * .012;',
        '  float rays = pow(max(0., sin(ax * 19. + uTime * .25) * sin(ax * 7.3 - uTime * .17) * .5 + .5), 5.) * (1. - depth) * .55;',
        '  vec3 col = deep + vec3(.78, .92, 1.) * (c * .9 + rays * .6) + vec3(.85, .94, .98) * glow * .5;',
        '  float alpha = clamp(.40 + depth * .3 + c * .32 + rays * .16 + glow * .22, 0., .88);',
        '  float dx = abs(uv.x - .5) * uRes.x / uRes.y;',
                '  float px = 1. / uRes.y;',
                                                                '  col = mix(col, mix(vec3(.05,.13,.18), vec3(.02,.06,.09), depth) + vec3(.6,.75,.85) * (c * .25 + rays * .15), uClear * .85); alpha = mix(alpha, .62 + depth * .25 + glow * .15, uClear);',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    }));
    face.renderOrder = 5; scene.add(face);
    var sUni = {uTime: {value: 0}, uL: {value: 0}, uAmp: {value: 1}, uOn: {value: 0}, uCam: {value: new THREE.Vector3()}};
    var sG = new THREE.PlaneGeometry(480, 640, 120, 90); sG.rotateX(-Math.PI / 2); sG.translate(0, 0, -320);
    var sea = new THREE.Mesh(sG, new THREE.ShaderMaterial({
      uniforms: sUni, transparent: true, depthWrite: false,
      vertexShader: [
        'uniform float uTime; uniform float uL; uniform float uAmp; varying vec3 vW; varying vec3 vN;',
        'float wv(float x, float z){ return uAmp * (.55 * sin(x * .058 + z * .034 + uTime * 1.05) + .3 * sin(-x * .11 + z * .071 + uTime * 1.65) + .15 * sin(x * .21 - z * .13 + uTime * 2.5)); }',
        'void main(){ vec3 p = position; p.y = uL + wv(p.x, p.z); float e = .6; vec3 tx = vec3(2. * e, wv(p.x + e, p.z) - wv(p.x - e, p.z), 0.); vec3 tz = vec3(0., wv(p.x, p.z + e) - wv(p.x, p.z - e), 2. * e); vN = normalize(cross(tz, tx)); vW = p; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }'
      ].join('\n'),
      fragmentShader: [
        'uniform float uOn; uniform vec3 uCam; varying vec3 vW; varying vec3 vN;',
        'void main(){',
        '  vec3 v = normalize(uCam - vW); float fr = pow(1. - max(dot(v, vN), 0.), 3.);',
        '  float far = clamp(-vW.z / 620., 0., 1.);',
        '  vec3 deep = vec3(.025, .075, .11), skyc = vec3(.22, .30, .36);',
        '  vec3 col = mix(deep, skyc, clamp(fr * 1.1 + far * .45, 0., 1.));',
        '  vec3 h = normalize(v + normalize(vec3(.3, .35, -1.)));',
        '  col += vec3(.95, .83, .6) * pow(max(dot(vN, h), 0.), 420.) * .5 + vec3(.6,.7,.78) * pow(max(dot(vN, h), 0.), 30.) * .05;',
        '  float fog = smoothstep(.55, 1., far);',
        '  col = mix(col, vec3(.16, .25, .31), fog);',
        '  gl_FragColor = vec4(col, uOn * .96);',
        '}'
      ].join('\n')
    }));
    sea.renderOrder = 1; scene.add(sea);
    rows.l.renderOrder = 2; cols.l.renderOrder = 2;

    var edge = lineObj(edgePos, 0xF4F8FA, .95); edge.m.linewidth = 1; edge.l.renderOrder = 6; edge.m.fog = false; edge.m.depthTest = false;

    var W = 0, H = 0;
    function size(){ var box = sec.querySelector('.scrolly-in'); W = box.clientWidth; H = box.clientHeight; var dpr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); uni.uRes.value.set(W * dpr, H * dpr); }
    size(); window.addEventListener('resize', size);
    function lerp(a, b, t){ return a + (b - a) * t; }
    function cl(v, a, b){ return Math.max(a, Math.min(b, v)); }
    function sm(v, a, b){ var x = cl((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
    function wave(x, z, t, amp){ return amp * (.55 * Math.sin(x * .058 + z * .034 + t * 1.05) + .3 * Math.sin(-x * .11 + z * .071 + t * 1.65) + .15 * Math.sin(x * .21 - z * .13 + t * 2.5)); }
    var cAbove = new THREE.Color(0x6F8C9C), cBelow = new THREE.Color(0xDDEAF0), tmp = new THREE.Color(), v = new THREE.Vector3();
    var visTop = Math.tan(25 * Math.PI / 180) * 40, twin = null, twinW = [], origW = [];

    var broken = false;
    function frame(ts){
      if(broken) return;
      requestAnimationFrame(frame);
      try{ step(ts); }catch(err){ broken = true; sec.classList.remove('wgl'); can.style.display = 'none'; if(twin) twin.remove(); txt.style.clipPath = ''; txt.style.opacity = ''; if(window.console) console.warn('water scene disabled', err); }
    }
    function step(ts){
      if(!window.__waterVis || sec.closest('main').hidden || document.hidden) return;
      var t = ts / 1000, p = window.__waterP || 0;
      /* 1. the level climbs from below the screen to above it */
      var rise = cl(p / .52, 0, 1), eased = rise * rise * (3 - 2 * rise) * .35 + rise * .65;
      var L = lerp(-visTop - 4, visTop + 6, eased), amp = lerp(.9, 3.1, rise) * (1 - .78 * sm(p, .6, .9));
      var k = 0, x, z, y0, y1, dx = (X1 - X0) / XN;
      for(i = 1; i < R; i++){ z = zs[i]; y0 = L + wave(X0, z, t, amp);
        for(j = 0; j < XN; j++){ x = X0 + j * dx; y1 = L + wave(x + dx, z, t, amp);
          rowPos[k++] = x; rowPos[k++] = y0; rowPos[k++] = z; rowPos[k++] = x + dx; rowPos[k++] = y1; rowPos[k++] = z; y0 = y1; } }
      rows.g.attributes.position.needsUpdate = true;
      k = 0;
      for(var c = 0; c < colXs.length; c++){ x = colXs[c]; y0 = L + wave(x, zs[0], t, amp);
        for(i = 0; i < R - 1; i++){ y1 = L + wave(x, zs[i + 1], t, amp);
          colPos[k++] = x; colPos[k++] = y0; colPos[k++] = zs[i]; colPos[k++] = x; colPos[k++] = y1; colPos[k++] = zs[i + 1]; y0 = y1; } }
      cols.g.attributes.position.needsUpdate = true;
      k = 0; var e = 0;
      for(j = 0; j <= XN; j++){ x = X0 + j * dx; var yt = L + wave(x, 0, t, amp);
        fPos[k++] = x; fPos[k++] = yt; fPos[k++] = 0; fPos[k++] = x; fPos[k++] = L - 400; fPos[k++] = 0;
        if(j < XN){ var yn = L + wave(x + dx, 0, t, amp); edgePos[e++] = x; edgePos[e++] = yt; edgePos[e++] = .01; edgePos[e++] = x + dx; edgePos[e++] = yn; edgePos[e++] = .01; } }
      fG.attributes.position.needsUpdate = true; edge.g.attributes.position.needsUpdate = true;
      /* 2. the camera rises to skim the surface and looks down a little */
      var cam = sm(p, .55, .78);
      var u = cl((L + 2) / 4, 0, 1);
      tmp.copy(cAbove).lerp(cBelow, u).lerp(new THREE.Color(0xA9BCC8), cam); rows.m.color.copy(tmp); cols.m.color.copy(tmp);
      rows.m.opacity = lerp(.45 + .25 * u, .07, cam); cols.m.opacity = lerp(.14 + .1 * u, .0, cam);
      var rv = 1 - sm(cam, .03, .25) + sm(cam, .55, .9); rows.m.opacity *= rv; cols.m.opacity *= rv;
      scene.fog.color.set(0xF2F2EE).lerp(new THREE.Color(0x27404F), cam); scene.fog.near = lerp(60, 120, cam); scene.fog.far = lerp(560, 640, cam);
      uni.uTime.value = t; uni.uLevel.value = L; uni.uClear.value = cam;
      var camY = lerp(0, L + 7, cam), lookY = lerp(0, L - 26, cam);
      camera.position.set(Math.sin(t * .3) * .5, camY + Math.sin(t * .8) * .12, 40); camera.lookAt(0, lookY, -100);
      sUni.uTime.value = t; sUni.uL.value = L; sUni.uAmp.value = amp; sUni.uOn.value = sm(cam, .58, .92); sUni.uCam.value.copy(camera.position);
      sky.style.opacity = sm(cam, .2, .8).toFixed(3); edge.m.opacity = .95 - .55 * cam;
      renderer.render(scene, camera);
      /* the text: only its submerged part wavers; once the camera is up, it rests in the depth, laid back, darker */
      v.set(0, L, 0).project(camera);
      var waterY = (1 - v.y) / 2 * H;
      if(!twin){
        twin = txt.cloneNode(true); twin.removeAttribute('id'); twin.setAttribute('aria-hidden', 'true');
        [].forEach.call(twin.querySelectorAll('[data-reveal],[data-words]'), function(n){ n.removeAttribute('data-reveal'); n.removeAttribute('data-words'); n.classList.add('in'); });
        [].forEach.call(twin.querySelectorAll('a'), function(n){ n.setAttribute('tabindex', '-1'); });
        twin.style.position = 'absolute'; twin.style.margin = '0'; twin.style.pointerEvents = 'none'; twin.style.filter = 'url(#underwater)'; twin.style.zIndex = '1';
        txt.parentNode.insertBefore(twin, txt.nextSibling);
        twinW = [].slice.call(twin.querySelectorAll('.w')); origW = [].slice.call(txt.querySelectorAll('.w'));
      }
      twin.style.left = txt.offsetLeft + 'px'; twin.style.top = txt.offsetTop + 'px'; twin.style.width = txt.offsetWidth + 'px';
      for(i = 0; i < origW.length && i < twinW.length; i++) twinW[i].style.opacity = origW[i].style.opacity;
      var tTop = txt.offsetTop, tH = txt.offsetHeight || 1;
      if(cam < .01){
        var cut = cl(waterY - tTop, 0, tH);
        txt.style.clipPath = 'inset(0 0 ' + (tH - cut).toFixed(1) + 'px 0)';
        twin.style.clipPath = 'inset(' + cut.toFixed(1) + 'px 0 0 0)';
        twin.style.transform = ''; twin.style.opacity = '';
      } else {
        txt.style.clipPath = 'inset(0 0 100% 0)'; twin.style.clipPath = 'none';
        var goal = waterY + H * .1 - tTop;
        twin.style.transformOrigin = '30% 0%';
        twin.style.transform = 'translateY(' + (goal * cam).toFixed(1) + 'px) rotateX(' + (cam * 42).toFixed(2) + 'deg) scale(' + (1 - cam * .3).toFixed(3) + ')';
        twin.style.opacity = (1 - cam * .2).toFixed(3); twin.classList.toggle('w-deep', cam > .35);
      }
      map.setAttribute('scale', (12 * (amp / 3.1)).toFixed(2));
      turb.setAttribute('baseFrequency', (0.011 + Math.sin(t * .6) * .002).toFixed(4) + ' ' + (0.03 + Math.cos(t * .5) * .004).toFixed(4));
      /* 3. the beacon comes up between the waves on the right and rides the swell */
      var em = sm(p, .72, .9);
      var xs = (W <= 720 ? .5 : .69) * W, wx = ((xs / W) * 2 - 1) * Math.tan(25 * Math.PI / 180) * camera.aspect * 58, wz = -22;
      var hy = L + wave(wx, wz, t, amp);
      v.set(wx, hy, wz).project(camera);
      var sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H;
      var slope = (wave(wx + 2, wz, t, amp) - wave(wx - 2, wz, t, amp)) / 4;
      var bw = cta.offsetWidth || 320, bh = bw * 290 / 380, anchorY = bh * (236 / 290);
      var sink = (1 - em) * bh * .55;
      cta.style.opacity = em > 0 ? Math.min(1, em * 1.6).toFixed(3) : '0';
      cta.style.filter = em < .99 ? 'blur(' + ((1 - em) * 5).toFixed(1) + 'px)' : '';
      cta.style.transform = 'translate(' + (sx - bw / 2).toFixed(1) + 'px,' + (sy - anchorY + sink).toFixed(1) + 'px) rotate(' + '0' + 'deg)';
      cta.style.pointerEvents = em > .6 ? 'auto' : 'none'; cta.tabIndex = em > .6 ? 0 : -1;
    }
    sec.classList.add('wgl');
    requestAnimationFrame(frame);
  })();

  /* compass dial in layers: ticks, cardinals and a rim pointer that settles on north */
  (function(){
    var ring = document.getElementById('dialRing'); if(!ring) return;
    var html = '<circle r="345" fill="none" stroke="#C9C7BE" stroke-width="1"/><circle r="300" fill="none" stroke="#D6D6CF" stroke-width="1"/>';
    for(var a = 0; a < 360; a += 5){
      var big = a % 30 === 0, r1 = big ? 300 : 318, rad = (a - 90) * Math.PI / 180;
      html += '<line x1="' + (Math.cos(rad) * r1).toFixed(1) + '" y1="' + (Math.sin(rad) * r1).toFixed(1) + '" x2="' + (Math.cos(rad) * 345).toFixed(1) + '" y2="' + (Math.sin(rad) * 345).toFixed(1) + '" stroke="' + (big ? '#8E8A7C' : '#C9C7BE') + '" stroke-width="' + (big ? 1.5 : 1) + '"/>';
    }
    ring.innerHTML = html;
    var card = '';
    [['N',0],['E',90],['S',180],['O',270]].forEach(function(l){ var rad = (l[1] - 90) * Math.PI / 180; card += '<text x="' + (Math.cos(rad) * 281).toFixed(1) + '" y="' + (Math.sin(rad) * 281 + 8).toFixed(1) + '" text-anchor="middle" font-family="EB Garamond, Georgia, serif" font-size="24" fill="' + (l[0] === 'N' ? '#7A5E33' : '#8E8A7C') + '">' + l[0] + '</text>'; });
    document.getElementById('dialCard').innerHTML = card;
    var needle = document.getElementById('needle'), sec = document.getElementById('compass');
    if(reduce) return;
    if(window.matchMedia('(pointer:fine)').matches){
      sec.addEventListener('pointermove', function(e){ sec.style.setProperty('--mx', ((e.clientX / innerWidth) - .5).toFixed(3)); sec.style.setProperty('--my', ((e.clientY / innerHeight) - .5).toFixed(3)); }, {passive:true});
      sec.addEventListener('pointerleave', function(){ sec.style.setProperty('--mx', 0); sec.style.setProperty('--my', 0); });
    }
    function frame(ts){
      requestAnimationFrame(frame);
      if(sec.closest('main').hidden) return;
      var p = window.__compassP || 0, t = ts / 1000, d = 1 - p;
      var swing = 150 * Math.pow(d, 1.1) * Math.cos(d * 10) + d * 16 * Math.sin(t * 1.4);
      var cc = window.__compassC || [0,0,0];
      var target = -90 * cc[0] - 90 * cc[1] - 90 * cc[2];
      var rest = p > .97 ? .7 * Math.sin(t * 1.1) : 0;
      needle.setAttribute('transform', 'rotate(' + (swing + target + rest).toFixed(2) + ')');
    }
    requestAnimationFrame(frame);
  })();

  /* yacht scene */
  (function(){
    var sec = document.getElementById('yacht'); if(!sec) return;
    var cards = [].slice.call(sec.querySelectorAll('.ycard')), head = sec.querySelector('.y-head'), hint = sec.querySelector('.y-hint');
    var can = document.getElementById('yachtCanvas');
    function fallback(){ sec.classList.add('static'); }
    if(reduce || typeof THREE === 'undefined'){ fallback(); return; }
    var renderer;
    try{ renderer = new THREE.WebGLRenderer({canvas: can, antialias: true, alpha: true}); }catch(e){ fallback(); return; }
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0D2232, 170, 640);
    var camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
    function M(c, o){ return new THREE.LineBasicMaterial({color: c, transparent: true, opacity: o, fog: true, depthWrite: false}); }
    function geo(arr){ var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return g; }

    /* ---- a designer's sketch: few flowing lines, pencil doubling, light hatching ---- */
    var F = [], S = [], J = [], Hh = [];
    var jr = (function(seed){ return function(){ seed = (seed * 48271) % 2147483647; return seed / 2147483647 - .5; }; })(11);
    function sg(arr, a, b){ arr.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
    function pl(arr, pts){ for(var i = 1; i < pts.length; i++) sg(arr, pts[i - 1], pts[i]); }
    function sk(pts, amt){ /* pencil: a second, slightly wandering stroke */
      var off = [jr() * amt, jr() * amt, jr() * amt], out = [];
      for(var i = 0; i < pts.length; i++){ var w = Math.sin(i * .35 + off[0] * 9) * amt * .6; out.push([pts[i][0] + off[0], pts[i][1] + off[1] + w, pts[i][2] + off[2]]); }
      pl(J, out);
    }
    function sline(arr, pts, amt){ pl(arr, pts); sk(pts, amt == null ? .22 : amt); }
    function dk(x){ return 7.4 + 4.2 * Math.pow((x + 66) / 131, 2.3); }
    function kl(x){
      if(x > 56) return lerp2(0, dk(66), (x - 56) / 10);
      if(x > 38) return -2.8 + 2.8 * Math.pow((x - 38) / 18, 1.6);
      if(x < -52) return -2.8 + 5.4 * Math.pow((-52 - x) / 14, 1.5);
      return -2.8;
    }
    function lerp2(a, b, t){ return a + (b - a) * t; }
    function bw(x){ var r = 1 - Math.pow((x + 8) / 74, 2); return 9.6 * Math.pow(Math.max(0, r), .62); }
    function pt(x, s, side){ var k = kl(x), d = dk(x), y = k + (d - k) * s, z = bw(x) * Math.pow(Math.sin(s * Math.PI / 2), .7); return [x, y, z * side]; }
    var x, s, side, i, j, n;
    /* sheer, waterline, highlight and profile curves */
    for(side = -1; side <= 1; side += 2){
      var sh = [], wl = [], hl = [], lo = [];
      for(x = -66; x <= 66.01; x += .8){
        sh.push(pt(x, 1, side)); hl.push(pt(x, .62, side)); lo.push(pt(x, .22, side));
        var k0 = kl(x), d0 = dk(x), s0 = (0 - k0) / (d0 - k0); if(s0 >= 0 && s0 <= 1) wl.push(pt(x, s0, side));
      }
      sline(S, sh, .18); sline(S, wl, .14); pl(F, hl); pl(F, lo);
      /* rub rail just under the sheer */
      var rr = []; for(x = -64; x <= 62; x += .8) rr.push(pt(x, .9, side)); pl(F, rr);
    }
    /* keel / stem profile on the centreline */
    var prof = []; for(x = -66; x <= 66.01; x += .6) prof.push([x, kl(x), 0]); sline(S, prof, .16);
    /* rounded stern in plan, at deck and waterline */
    [1, .45].forEach(function(sv){ var arc = []; for(j = 0; j <= 24; j++){ var a = -Math.PI / 2 + j / 24 * Math.PI, p = pt(-66, sv, 1); arc.push([-66 - Math.cos(a) * 2.2 * sv, p[1], Math.sin(a) * p[2]]); } sline(sv === 1 ? S : F, arc, .12); });
    /* a few ghost sections */
    [-40, -12, 18, 42].forEach(function(xx){ for(side = -1; side <= 1; side += 2){ var sc = []; for(s = 0; s <= 1.001; s += .08) sc.push(pt(xx, s, side)); pl(Hh, sc); } });
    /* hatching in the hull's shadow (visible side) */
    for(x = -60; x <= 50; x += 1.15){ var a0 = pt(x, .08, 1), a1 = pt(x + 1.8, .42, 1); sg(Hh, a0, a1); }
    /* portholes, a fine dotted row */
    for(x = -50; x <= 34; x += 3.4){ for(side = -1; side <= 1; side += 2){ var c0 = pt(x, .7, side); sg(F, c0, [c0[0] + .9, c0[1], c0[2]]); } }
    /* streamlined decks: rounded plans, raked fronts, window bands */
    function deckPlan(xa, xb, hw, y, rake){
      var out = [], L = (xb - xa) / 2, xc = (xa + xb) / 2;
      for(j = 0; j <= 64; j++){
        var a = j / 64 * Math.PI * 2, cx = Math.cos(a), sn = Math.sin(a);
        var px = xc + L * Math.sign(cx) * Math.pow(Math.abs(cx), .42), pz = hw * Math.sign(sn) * Math.pow(Math.abs(sn), .5);
        if(px > xc) px -= rake * (px - xc) / L; /* taper the front */
        out.push([px, y, pz]);
      }
      return out;
    }
    var decks = [[-57, 30, 7.4, 9.8, 12.9, 2.5], [-51, 18, 6.3, 12.9, 15.8, 3], [-43, 4, 5.2, 15.8, 18.2, 3.2]];
    decks.forEach(function(d){
      var lo2 = deckPlan(d[0], d[1], d[2], d[3], 0), hi2 = deckPlan(d[0] + 1.5, d[1] - d[5], d[2] - .5, d[4], 1.5);
      sline(S, hi2, .14); pl(F, lo2);
      /* raked front struts */
      [0, 4, 8, 60, 56].forEach(function(ix){ sg(F, lo2[ix], hi2[ix]); });
      /* window band */
      for(side = -1; side <= 1; side += 2){
        var band = [], band2 = [], ym = d[3] + (d[4] - d[3]) * .55;
        for(x = d[0] + 3; x <= d[1] - d[5] - 1; x += .8){ var zz = (d[2] - .25) * side; band.push([x, ym, zz]); band2.push([x, ym - .9, zz]); }
        pl(F, band); pl(Hh, band2);
      }
    });
    /* radar dome */
    [[0, 1], [1, 0]].forEach(function(o){ var ring = []; for(j = 0; j <= 40; j++){ var a = j / 40 * Math.PI * 2; ring.push([-30 + Math.cos(a) * 1.8 * (o[0] || .35 + .65 * o[1]), 20 + Math.sin(a) * 1.8, Math.cos(a) * 1.8 * o[1]]); } pl(F, ring); });
    /* bow instrument mast */
    var rx = 46, rb = dk(rx); sline(F, [[rx, rb, 0], [rx - .6, rb + 13, 0]], .1); sg(F, [rx - 2.2, rb + 10, 0], [rx + 1.4, rb + 10, 0]);
    /* masts, platforms, rigging */
    var masts = [{x: -30, top: 104, chord: 28}, {x: 8, top: 116, chord: 32}, {x: 44, top: 128, chord: 35}];
    var gF = geo(F), gS = geo(S), gJ = geo(J), gH = geo(Hh), nF = F.length / 3, nS = S.length / 3, nJ = J.length / 3, nH = Hh.length / 3;
    var boat = new THREE.Group(); scene.add(boat);
    boat.add(new THREE.LineSegments(gF, M(0xD9CFBC, .42)), new THREE.LineSegments(gS, M(0xF4EEE2, .88)), new THREE.LineSegments(gJ, M(0xE8DCC4, .2)), new THREE.LineSegments(gH, M(0xCBBFA8, .14)));
    var refl = new THREE.Group(); refl.scale.y = -1; scene.add(refl);
    refl.add(new THREE.LineSegments(gF, M(0x86A7B7, .05)), new THREE.LineSegments(gS, M(0x9DB6C3, .09)));
    /* masts: each one rises from the deck on its own, then its platform and rigging fade in */
    var mastRigs = masts.map(function(m){
      var base = dk(m.x), hgt = m.top - base, sp = [], fp = [], hp = [], jp = [], j2;
      sg(sp, [0, 0, 0], [0, hgt, 0]); sg(fp, [.45, 0, 0], [.18, hgt, 0]);
      var jit = []; for(j2 = 0; j2 <= 24; j2++) jit.push([jr() * .1, hgt * j2 / 24, jr() * .1]); pl(jp, jit);
      var pole = new THREE.Group(); pole.position.set(m.x, base, 0); pole.scale.y = .001; boat.add(pole);
      var mS = M(0xF4EEE2, .88), mF = M(0xD9CFBC, .42), mJ = M(0xE8DCC4, .2);
      pole.add(new THREE.LineSegments(geo(sp), mS), new THREE.LineSegments(geo(fp), mF), new THREE.LineSegments(geo(jp), mJ));
      var ring1 = [], ring2 = [];
      for(j2 = 0; j2 <= 72; j2++){ var a = j2 / 72 * Math.PI * 2; ring1.push([m.x + Math.cos(a) * 7.6, 23, Math.sin(a) * 5.4]); ring2.push([m.x + Math.cos(a) * 6.2, 23.6, Math.sin(a) * 4.4]); }
      var rf = [], rh = []; pl(rf, ring1); pl(rh, ring2);
      for(j2 = 0; j2 < 12; j2++){ var a2 = j2 / 12 * Math.PI * 2; sg(rh, [m.x, 23, 0], [m.x + Math.cos(a2) * 7.6, 23, Math.sin(a2) * 5.4]); }
      [[-6, 7], [-6, -7], [9, 0]].forEach(function(r){ sg(rh, [m.x, m.top - 4, 0], [m.x + r[0], dk(m.x + r[0]), r[1]]); });
      var rF = M(0xD9CFBC, 0), rH = M(0xCBBFA8, 0);
      boat.add(new THREE.LineSegments(geo(rf), rF), new THREE.LineSegments(geo(rh), rH));
      return {pole: pole, rF: rF, rH: rH};
    });

    /* sails: bowed leech, curved foot, soft seams */
    function bez(p0, p1, p2, t){ var u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1], 0]; }
    var sails = masts.map(function(m){
      var g = new THREE.Group(); g.position.set(m.x, 0, 0); boat.add(g);
      var base = 27, top = m.top - 3, c = m.chord;
      var head = [0, top, 0], clew = [-c, base, 0], tack = [0, base, 0];
      var lctl = [-c * .74, base + (top - base) * .46, 0], fctl = [-c * .5, base - 2.2, 0];
      var leech = [], foot = [];
      for(n = 0; n <= 40; n++){ leech.push(bez(head, lctl, clew, n / 40)); foot.push(bez(tack, fctl, clew, n / 40)); }
      var o = [], so = [], seams = [];
      pl(o, [tack, head]); pl(o, leech); pl(o, foot);
      var tmp = []; for(n = 0; n <= 40; n++){ var p = leech[n]; tmp.push([p[0] + jr() * .15, p[1] + jr() * .15, 0]); } pl(so, tmp);
      for(i = 1; i < 10; i++){ var lp = leech[Math.round(i / 10 * 40)], yy = lp[1], arc = []; for(n = 0; n <= 16; n++){ var tt = n / 16; arc.push([lp[0] * tt, yy - Math.sin(tt * Math.PI) * .7, 0]); } pl(seams, arc); }
      for(i = 1; i < 5; i++){ var fp = foot[Math.round(i / 5 * 40)], ln = []; for(n = 0; n <= 20; n++){ var tt2 = n / 20; ln.push([head[0] + (fp[0] - head[0]) * tt2 + Math.sin(tt2 * Math.PI) * -.8, head[1] + (fp[1] - head[1]) * tt2, 0]); } pl(seams, ln); }
      var fillPts = []; for(n = 0; n < 40; n++){ fillPts.push(tack[0], tack[1], 0, leech[n][0], leech[n][1], 0, leech[n + 1][0], leech[n + 1][1], 0); }
      for(n = 0; n < 40; n++){ fillPts.push(tack[0], tack[1], 0, foot[n + 1][0], foot[n + 1][1], 0, foot[n][0], foot[n][1], 0); }
      var fill = new THREE.Mesh(geo(fillPts), new THREE.MeshBasicMaterial({color: 0xE2D2B0, transparent: true, opacity: .06, side: THREE.DoubleSide, depthWrite: false, fog: true}));
      var outline = new THREE.LineSegments(geo(o), M(0xD8B98A, .95)), soft = new THREE.LineSegments(geo(so), M(0xE8D2A8, .3)), sm = new THREE.LineSegments(geo(seams), M(0xE2D2B0, .26));
      g.add(fill, outline, soft, sm);
      g.scale.x = .001;
      return {g: g, fill: fill, outline: outline, seams: sm, soft: soft, m: m, base: base, top: top};
    });

    /* sea: periodic dashed swell and a wake */
    var sea = [], period = 360;
    var rnd = (function(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(7);
    for(var z = -520; z <= 300; z += 7){
      var patt = [], xx = 0; while(xx < period){ var len = 2 + rnd() * 9; patt.push([xx, len]); xx += len + 8 + rnd() * 22; }
      for(var rep = -3; rep < 3; rep++) patt.forEach(function(p){ var x0 = rep * period + p[0]; sea.push(x0, 0, z, x0 + p[1], 0, z); });
    }
    var seaG = new THREE.Group(); scene.add(seaG);
    seaG.add(new THREE.LineSegments(geo(sea), M(0x6E8FA2, .2)));
    var wake = []; for(side = -1; side <= 1; side += 2){ for(i = 0; i < 5; i++){ var sp = i * 1.8; sg(wake, [-68, 0, side * (4 + sp)], [-260, 0, side * (34 + sp * 5)]); } }
    var wakeL = new THREE.LineSegments(geo(wake), M(0xA9C0CD, .16)); scene.add(wakeL);

    /* sizing */
    var W = 0, H = 0;
    function size(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = sec.clientWidth; H = window.innerHeight;
      renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }
    size(); window.addEventListener('resize', size);

    function cl(v, a, b){ return Math.max(a, Math.min(b, v)); }
    function sm(v, a, b){ var t = cl((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
    function lerp(a, b, t){ return a + (b - a) * t; }
    var v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
    function proj(p){ v3.copy(p).project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }

    var visible = false;
    if('IntersectionObserver' in window){ new IntersectionObserver(function(e){ visible = e[0].isIntersecting; }).observe(sec); } else visible = true;

    function frame(ts){
      requestAnimationFrame(frame);
      if(!visible || sec.closest('main').hidden || document.hidden) return;
      var t = ts / 1000, r = sec.getBoundingClientRect(), vh = window.innerHeight;
      var draw = cl((vh - r.top) / (vh * 1.25), 0, 1);
      var P = cl(-r.top / (r.height - vh), 0, 1);
      var mobile = W < 760 || W / H < .9;
      var orbit = sm(P, .08, .4);
      var sp = mobile ? [sm(P, .44, .56), sm(P, .62, .72), sm(P, .78, .88)] : [sm(P, .42, .55), sm(P, .58, .71), sm(P, .74, .87)];
      var tanH = Math.tan(camera.fov * Math.PI / 360);
      /* framing */
      var fullD = Math.max((150 / 2) / (tanH * camera.aspect), (134 / 2) / tanH);
      var tx = lerp(22, 0, orbit), ty = lerp(46, 58, orbit), D = lerp(fullD * 1.02, fullD, orbit);
      var th = (1 - orbit) * .95, elev = lerp(-.1, .0, orbit);
      if(mobile){
        /* portrait: the boat seen nearly bow-on (narrow and tall), masts rising one behind the other; then the camera swings to profile and settles on each sail in turn */
        var intro = 1 - sm(P, .26, .46), f = sm(P, .56, .62) + sm(P, .72, .78);
        var fi = Math.min(2, Math.floor(f)), ff = f - fi, cx = function(k){ return masts[k].x - masts[k].chord * .42; };
        var sx = fi < 2 ? lerp(cx(fi), cx(fi + 1), ff) : cx(2);
        var zD = Math.max(((masts[Math.round(f)].chord + 18) / 2) / (tanH * camera.aspect), (150 / 2) / tanH);
        var bD = Math.max((44 / 2) / (tanH * camera.aspect), (176 / 2) / tanH);
        tx = lerp(sx, 6, intro); ty = lerp(50, 66, intro); D = lerp(zD, bD, intro);
        th = lerp(0, 1.18, intro) + Math.sin(t * .2) * .02 * intro; elev = lerp(0, -.05, intro);
      }
      camera.position.set(tx + D * Math.sin(th), ty + D * elev, D * Math.cos(th));
      camera.lookAt(tx, ty, 0);
      /* life */
      var bob = Math.sin(t * .8) * .35, roll = Math.sin(t * .55) * .006;
      boat.position.y = bob; boat.rotation.x = roll; refl.position.y = -bob; refl.rotation.x = -roll;
      seaG.position.x = -((t * 7) % period);
      /* sketch draws itself */
      var nf = Math.floor(nF * draw / 2) * 2, ns = Math.floor(nS * cl(draw * 1.15 - .1, 0, 1) / 2) * 2;
      var G2 = (vh - r.top) / vh;
      mastRigs.forEach(function(mr, k){
        var gr = sm(G2, .95 + k * .32, 1.35 + k * .32);
        mr.pole.scale.y = Math.max(.001, gr);
        var rfade = sm(gr, .75, 1); mr.rF.opacity = .42 * rfade; mr.rH.opacity = .14 * rfade;
      });
      gF.setDrawRange(0, nf); gS.setDrawRange(0, ns); gJ.setDrawRange(0, Math.floor(nJ * cl(draw * 1.1 - .1, 0, 1) / 2) * 2); gH.setDrawRange(0, Math.floor(nH * cl(draw * 1.3 - .3, 0, 1) / 2) * 2);
      /* sails */
      sails.forEach(function(sl, k){
        var e = sp[k];
        sl.g.scale.x = Math.max(.001, e);
        sl.fill.material.opacity = .06 * e; sl.outline.material.opacity = .95 * cl(e * 3, 0, 1); sl.seams.material.opacity = .26 * e; sl.soft.material.opacity = .3 * e;
      });
      renderer.render(scene, camera);
      /* overlay */
      
      if(hint) hint.style.opacity = (1 - sm(P, .02, .1)).toFixed(3);
      cards.forEach(function(card, k){
        var sl = sails[k], e = sp[k];
        if(mobile){
          var next = sp[k + 1] || 0, op = e * (1 - sm(next, .0, .35));
          card.style.opacity = op.toFixed(3);
          card.style.transform = 'translate(' + (W / 2) + 'px,' + (H - 34) + 'px) translate(-50%,-100%) translateY(' + ((1 - e) * 24).toFixed(1) + 'px)';
        } else {
          v4.set(sl.m.x - sl.m.chord * .4, sl.base + (sl.top - sl.base) * .24, 1); boat.localToWorld(v4);
          var p0 = proj(v4); v4.x += 10; var p1 = proj(v4); var ppu = Math.abs(p1[0] - p0[0]) / 10;
          var sc = cl(ppu / 7.6, .82, 1.12);
          card.style.opacity = e.toFixed(3);
          card.style.filter = e < .98 ? 'blur(' + ((1 - e) * 6).toFixed(1) + 'px)' : '';
          card.style.transform = 'translate(' + p0[0].toFixed(1) + 'px,' + p0[1].toFixed(1) + 'px) translate(-50%,-50%) translateY(' + ((1 - e) * 26).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
        }
      });
    }
    requestAnimationFrame(frame);
  })();

  /* finale seabed: bathymetric contour lines across the whole screen, drifting slowly, sliding a little with the scroll, fading behind the text */
  (function(){
    var cv = document.getElementById('seabed'); if(!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), sec = document.getElementById('finale'), W = 0, H = 0;
    function size(){ var dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', size);
    var CELL = 26, LEVELS = []; for(var lv = -1.8; lv <= 1.81; lv += .26) LEVELS.push(lv);
    function field(x, y, t){ return Math.sin(x * .0042 + 1.3 * Math.sin(y * .0031 + t * .05)) + Math.sin(y * .0058 - x * .0021 + t * .04) + .6 * Math.sin((x + y) * .0088 + t * .07) + .35 * Math.sin(x * .013 - y * .011 - t * .03); }
    function draw(ts){
      var t = ts / 1000, r = sec.getBoundingClientRect(), off = -r.top * .18;
      var cols = Math.ceil(W / CELL) + 1, rows = Math.ceil(H / CELL) + 1, vals = new Float32Array(cols * rows), i, j;
      for(j = 0; j < rows; j++) for(i = 0; i < cols; i++) vals[j * cols + i] = field(i * CELL, j * CELL + off, t);
      ctx.clearRect(0, 0, W, H);
      LEVELS.forEach(function(L, li){
        var gold = li % 4 === 1;
        ctx.beginPath();
        for(j = 0; j < rows - 1; j++) for(i = 0; i < cols - 1; i++){
          var a = vals[j * cols + i], b = vals[j * cols + i + 1], c = vals[(j + 1) * cols + i + 1], d = vals[(j + 1) * cols + i];
          var idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
          if(idx === 0 || idx === 15) continue;
          var x0 = i * CELL, y0 = j * CELL;
          var top = [x0 + CELL * (L - a) / (b - a), y0], right = [x0 + CELL, y0 + CELL * (L - b) / (c - b)], bot = [x0 + CELL * (L - d) / (c - d), y0 + CELL], left = [x0, y0 + CELL * (L - a) / (d - a)];
          var segs;
          switch(idx){
            case 1: case 14: segs = [left, bot]; break;
            case 2: case 13: segs = [bot, right]; break;
            case 3: case 12: segs = [left, right]; break;
            case 4: case 11: segs = [top, right]; break;
            case 6: case 9: segs = [top, bot]; break;
            case 7: case 8: segs = [left, top]; break;
            case 5: segs = [left, top, bot, right]; break;
            case 10: segs = [left, bot, top, right]; break;
          }
          for(var q = 0; q < segs.length; q += 2){ ctx.moveTo(segs[q][0], segs[q][1]); ctx.lineTo(segs[q + 1][0], segs[q + 1][1]); }
        }
        ctx.strokeStyle = gold ? 'rgba(216,185,138,.16)' : 'rgba(132,168,186,.11)';
        ctx.lineWidth = gold ? .8 : .7;
        if(gold) ctx.setLineDash([2, 5]); else ctx.setLineDash([]);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      /* keep the text side quiet and the edges soft */
      ctx.save(); ctx.globalCompositeOperation = 'destination-in';
      var gx = ctx.createLinearGradient(0, 0, W, 0); gx.addColorStop(0, 'rgba(0,0,0,.25)'); gx.addColorStop(.45, 'rgba(0,0,0,.45)'); gx.addColorStop(.7, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,.9)');
      ctx.fillStyle = gx; ctx.fillRect(0, 0, W, H);
      var gy = ctx.createLinearGradient(0, 0, 0, H); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(.15, 'rgba(0,0,0,1)'); gy.addColorStop(.85, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gy; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    var lastDraw = 0;
    function frame(ts){ requestAnimationFrame(frame); if(sec.closest('main').hidden) return; var r = sec.getBoundingClientRect(); if(r.bottom < 0 || r.top > window.innerHeight) return; if(ts - lastDraw < 32) return; lastDraw = ts; draw(ts); }
    if(reduce){ draw(1000); window.addEventListener('resize', function(){ draw(1000); }); }
    else requestAnimationFrame(frame);
  })();
  /* finale sonar: fine seabed contours, rings, a rotating sweep; echoes light up as it passes and appear one by one with the scroll; at the end the sweep settles upward into a beam */
  (function(){
    var cv = document.getElementById('sonar'); if(!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), sec = document.getElementById('finale'), W = 0, H = 0, S = 0;
    function size(){ var dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; S = Math.min(W, H); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', size);
    var TAU = Math.PI * 2;
    /* echoes: angle (0 = up, clockwise), distance as a share of the radius */
    var echoes = [[-.95, .62], [.62, .78], [2.2, .55], [-2.35, .84], [1.35, .36]].map(function(e){ return {a: e[0], r: e[1], hit: -99}; });
    var beamDots = [.42, .7];
    function norm(a){ a = a % TAU; return a < 0 ? a + TAU : a; }
    var sweep = 0, last = 0;
    function draw(ts, still){
      var t = ts / 1000, dt = last ? Math.min((ts - last) / 1000, .05) : .016; last = ts;
      var p = reduce ? 1 : (window.__finaleP == null ? 1 : window.__finaleP);
      var cx = W / 2, cy = H / 2, R = S * .47, r0 = S * .128;
      ctx.clearRect(0, 0, W, H);
      /* seabed contours: soft, sinuous, clipped to a fading disc */
      ctx.save();
      var g = ctx.createRadialGradient(cx, cy, R * .2, cx, cy, R * 1.08); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      for(var li = 0; li < 16; li++){
        var yb = cy - R + li * (2 * R / 15), gold = li % 5 === 2;
        ctx.beginPath();
        for(var x = cx - R * 1.1; x <= cx + R * 1.1; x += 6){
          var y = yb + Math.sin(x * .011 + li * .9 + t * .12) * 14 + Math.sin(x * .027 - li * .5 - t * .08) * 7;
          if(x === cx - R * 1.1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        var dist = Math.abs(yb - cy) / R;
        ctx.strokeStyle = gold ? 'rgba(216,185,138,' + (.26 * (1 - dist * .7)).toFixed(3) + ')' : 'rgba(150,180,196,' + (.13 * (1 - dist * .6)).toFixed(3) + ')';
        ctx.lineWidth = gold ? .9 : .7; if(gold) ctx.setLineDash([3, 5]); else ctx.setLineDash([]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      /* range rings */
      for(var k = 1; k <= 6; k++){
        var rr = r0 + (R - r0) * k / 6;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU);
        ctx.strokeStyle = 'rgba(238,241,240,' + (k === 6 ? .22 : .1 + (k % 2) * .04).toFixed(3) + ')';
        ctx.lineWidth = k === 6 ? 1 : .8; if(k === 3) ctx.setLineDash([2, 6]); ctx.stroke(); ctx.setLineDash([]);
      }
      for(var tk = 0; tk < 72; tk++){ var ang = tk / 72 * TAU, big = tk % 6 === 0; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.lineTo(cx + Math.cos(ang) * (R + (big ? 9 : 4)), cy + Math.sin(ang) * (R + (big ? 9 : 4))); ctx.strokeStyle = 'rgba(238,241,240,' + (big ? .35 : .16) + ')'; ctx.lineWidth = .8; ctx.stroke(); }
      /* pings: waves leaving the emitter */
      for(var pi = 0; pi < 3; pi++){
        var ph = ((t * .32 + pi / 3) % 1), pr = r0 + (R - r0) * ph;
        ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.strokeStyle = 'rgba(216,201,168,' + (.32 * (1 - ph)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.stroke();
      }
      /* sweep: turns, slows and settles pointing up as the scroll ends */
      var settle = Math.max(0, Math.min(1, (p - .78) / .2)); settle = settle * settle * (3 - 2 * settle);
      var spin = still ? 0 : dt * (1.1 * (1 - settle) + .05);
      sweep = norm(sweep + spin);
      var target = TAU * Math.ceil(sweep / TAU) , shown = settle > 0 ? sweep + (0 - norm(sweep) + (norm(sweep) > Math.PI ? TAU : 0)) * settle : sweep;
      var lead = shown - Math.PI / 2;
      var trail = .9 * (1 - settle * .75);
      for(var sl = 0; sl < 36; sl++){
        var a1 = lead - trail * sl / 36, a2 = lead - trail * (sl + 1) / 36;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a2, a1); ctx.closePath();
        ctx.fillStyle = 'rgba(120,160,180,' + (.16 * Math.pow(1 - sl / 36, 1.8)).toFixed(4) + ')'; ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(lead) * r0, cy + Math.sin(lead) * r0); ctx.lineTo(cx + Math.cos(lead) * R, cy + Math.sin(lead) * R);
      ctx.strokeStyle = 'rgba(232,210,168,.75)'; ctx.lineWidth = 1.1; ctx.stroke();
      /* echoes appear one by one with the scroll and flare when the sweep passes */
      var shownCount = Math.min(echoes.length, Math.floor(p * echoes.length * 1.15 + .3));
      echoes.forEach(function(e, i){
        if(i >= shownCount) return;
        var d = norm((shown) - e.a); if(d < spin * 1.5 + .02 || still) e.hit = t;
        var age = t - e.hit, f = Math.max(.28, Math.exp(-age * .55));
        var ex = cx + Math.cos(e.a - Math.PI / 2) * R * e.r, ey = cy + Math.sin(e.a - Math.PI / 2) * R * e.r;
        var halo = ctx.createRadialGradient(ex, ey, 0, ex, ey, 18); halo.addColorStop(0, 'rgba(240,210,150,' + (.5 * f).toFixed(3) + ')'); halo.addColorStop(1, 'rgba(240,210,150,0)');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(ex, ey, 18, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(246,226,184,' + (.55 + .45 * f).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(ex, ey, 3.2, 0, TAU); ctx.fill();
        if(age < 1.6){ ctx.beginPath(); ctx.arc(ex, ey, 4 + age * 16, 0, TAU); ctx.strokeStyle = 'rgba(240,210,150,' + (.5 * (1 - age / 1.6)).toFixed(3) + ')'; ctx.lineWidth = .8; ctx.stroke(); }
      });
      /* the settled beam, straight up, with its two marks */
      if(settle > 0){
        var bl = settle;
        var gb = ctx.createLinearGradient(cx, cy - r0, cx, cy - R * 1.02); gb.addColorStop(0, 'rgba(246,226,184,' + (.9 * bl).toFixed(3) + ')'); gb.addColorStop(1, 'rgba(246,226,184,0)');
        ctx.strokeStyle = gb; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, cy - r0); ctx.lineTo(cx, cy - R * 1.02); ctx.stroke();
        beamDots.forEach(function(bd){ var by = cy - (r0 + (R - r0) * bd); ctx.fillStyle = 'rgba(246,226,184,' + bl.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(cx, by, 3, 0, TAU); ctx.fill(); });
      }
      /* emitter ring hugging the button */
      ctx.beginPath(); ctx.arc(cx, cy, r0 * 1.12, 0, TAU); ctx.strokeStyle = 'rgba(216,201,168,.45)'; ctx.lineWidth = 1; ctx.stroke();
    }
    function frame(ts){ requestAnimationFrame(frame); if(sec.closest('main').hidden) return; var r = sec.getBoundingClientRect(); if(r.bottom < 0 || r.top > window.innerHeight) return; draw(ts, false); }
    if(reduce){ draw(1000, true); window.addEventListener('resize', function(){ draw(1000, true); }); }
    else requestAnimationFrame(frame);
  })();

  /* lighthouse scene */
  (function(){
    var sec = document.getElementById('lh'); if(!sec) return;
    var can = document.getElementById('lhCanvas'), bcv = document.getElementById('lhBeam'), bctx = bcv.getContext('2d');
    var renderer = null; if(typeof THREE !== 'undefined'){ try{ renderer = new THREE.WebGLRenderer({canvas: can, antialias: true, alpha: true}); }catch(e){ renderer = null; } }
    if(!renderer){ can.style.display = 'none'; bcv.style.display = 'none'; }
    if(renderer){
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0C2131, 260, 700);
    var camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
    function M(c, o){ return new THREE.LineBasicMaterial({color: c, transparent: true, opacity: o, fog: true, depthWrite: false}); }
    function geo(arr){ var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return g; }
    var S = [], F = [], J = [], Hh = [];
    var jr = (function(seed){ return function(){ seed = (seed * 48271) % 2147483647; return seed / 2147483647 - .5; }; })(23);
    function sg(arr, a, b){ arr.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
    function pl(arr, pts){ for(var i = 1; i < pts.length; i++) sg(arr, pts[i - 1], pts[i]); }
    function sk(pts, amt){ var o = [jr() * amt, jr() * amt, jr() * amt], out = []; for(var i = 0; i < pts.length; i++) out.push([pts[i][0] + o[0], pts[i][1] + o[1], pts[i][2] + o[2]]); pl(J, out); }
    function ring(r, y, n, a0, a1){ var p = []; a0 = a0 || 0; a1 = a1 == null ? Math.PI * 2 : a1; for(var i = 0; i <= n; i++){ var a = a0 + (a1 - a0) * i / n; p.push([Math.cos(a) * r, y, Math.sin(a) * r]); } return p; }
    var i, j, y, a;
    /* tower: tapered, slightly curved */
    var TH = 60; function rad(y){ return 7 - 2.4 * Math.pow(y / TH, .9); }
    for(j = 0; j < 14; j++){ a = j / 14 * Math.PI * 2; var gen = []; for(y = 0; y <= TH; y += 3) gen.push([Math.cos(a) * rad(y), y, Math.sin(a) * rad(y)]); if(j % 7 === 0){ pl(S, gen); sk(gen, .12); } else pl(Hh, gen); }
    [0, 60].forEach(function(yy){ var r1 = ring(rad(yy), yy, 64); pl(S, r1); sk(r1, .1); });
    for(y = 6; y < TH; y += 6) pl(Hh, ring(rad(y), y, 48));
    /* two hatched bands */
    [[17, 23], [37, 43]].forEach(function(bd){
      pl(F, ring(rad(bd[0]), bd[0], 56)); pl(F, ring(rad(bd[1]), bd[1], 56));
      for(j = 0; j < 40; j++){ a = j / 40 * Math.PI * 2; var a2 = a + .16; sg(Hh, [Math.cos(a) * rad(bd[0]), bd[0], Math.sin(a) * rad(bd[0])], [Math.cos(a2) * rad(bd[1]), bd[1], Math.sin(a2) * rad(bd[1])]); }
    });
    /* door and windows (front, +z) */
    var door = []; for(i = 0; i <= 16; i++){ var t = i / 16 * Math.PI; door.push([Math.cos(t) * 1.5, 3.4 + Math.sin(t) * 1.5, rad(4) + .05]); } door.unshift([1.5, 0, rad(0)]); door.push([-1.5, 0, rad(0)]); pl(F, door);
    [12, 29, 48].forEach(function(wy){ var r = rad(wy) + .05; pl(F, [[-.6, wy, r], [.6, wy, r], [.6, wy + 2.2, r], [-.6, wy + 2.2, r], [-.6, wy, r]]); });
    /* gallery + railing */
    pl(S, ring(6.8, 60.4, 72)); pl(F, ring(6.8, 61.2, 72)); pl(F, ring(6.6, 63.6, 72));
    for(j = 0; j < 24; j++){ a = j / 24 * Math.PI * 2; sg(Hh, [Math.cos(a) * 6.7, 61.2, Math.sin(a) * 6.7], [Math.cos(a) * 6.6, 63.6, Math.sin(a) * 6.6]); }
    for(j = 0; j < 10; j++){ a = j / 10 * Math.PI * 2; sg(Hh, [Math.cos(a) * rad(56), 56, Math.sin(a) * rad(56)], [Math.cos(a) * 6.5, 60.4, Math.sin(a) * 6.5]); }
    /* lantern room */
    pl(F, ring(3.7, 61.2, 48)); pl(S, ring(3.7, 67.6, 48));
    for(j = 0; j < 10; j++){ a = j / 10 * Math.PI * 2; sg(F, [Math.cos(a) * 3.7, 61.2, Math.sin(a) * 3.7], [Math.cos(a) * 3.7, 67.6, Math.sin(a) * 3.7]); }
    /* dome, spire */
    for(j = 0; j < 12; j++){ a = j / 12 * Math.PI * 2; var mer = []; for(i = 0; i <= 10; i++){ var t2 = i / 10 * Math.PI / 2; mer.push([Math.cos(a) * 4.1 * Math.cos(t2), 67.6 + Math.sin(t2) * 3.4, Math.sin(a) * 4.1 * Math.cos(t2)]); } pl(j % 3 ? Hh : F, mer); }
    pl(S, ring(4.1, 67.6, 48)); sg(S, [0, 71, 0], [0, 75, 0]); pl(F, ring(.5, 75, 16));
    /* rocky base: irregular contour loops */
    for(i = 0; i < 6; i++){ var rr = 8.5 + i * 2.3, yb = -i * .9, loop = []; for(j = 0; j <= 72; j++){ a = j / 72 * Math.PI * 2; var n = rr * (1 + .12 * Math.sin(a * 3 + i) + .08 * Math.sin(a * 7 - i * 2)); loop.push([Math.cos(a) * n, yb + Math.sin(a * 5 + i) * .5, Math.sin(a) * n * .8]); } pl(i < 2 ? F : Hh, loop); }
    var gS = geo(S), gF = geo(F), gJ = geo(J), gH = geo(Hh), nS = S.length / 3, nF = F.length / 3, nJ = J.length / 3, nH = Hh.length / 3;
    var tower = new THREE.Group(); scene.add(tower);
    /* bottom-up drawing: a clipping plane rises with a point of light on the axis */
    renderer.localClippingEnabled = true;
    var clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), -6);
    function MC(c, o){ var m = M(c, o); m.clippingPlanes = [clip]; return m; }
    tower.add(new THREE.LineSegments(gS, MC(0xF4EEE2, .9)), new THREE.LineSegments(gF, MC(0xD9CFBC, .5)), new THREE.LineSegments(gJ, MC(0xE8DCC4, .22)), new THREE.LineSegments(gH, MC(0xCBBFA8, .18)));
    var axisPos = new Float32Array(6), axisG = new THREE.BufferGeometry(); axisG.setAttribute('position', new THREE.BufferAttribute(axisPos, 3));
    var axisM = new THREE.LineBasicMaterial({color: 0xF4EEE2, transparent: true, opacity: .9, depthWrite: false});
    scene.add(new THREE.LineSegments(axisG, axisM));
    var refl = new THREE.Group(); refl.scale.y = -1; refl.position.y = -9; scene.add(refl);
    var rM1 = M(0x86A7B7, .08), rM2 = M(0x86A7B7, .05); refl.add(new THREE.LineSegments(gS, rM1), new THREE.LineSegments(gF, rM2));
    /* sea */
    var sea = [], period = 300; var rnd = (function(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(5);
    for(var z = -420; z <= 200; z += 6){ var xx = 0, patt = []; while(xx < period){ var len = 2 + rnd() * 8; patt.push([xx, len]); xx += len + 8 + rnd() * 20; } for(var rep = -3; rep < 3; rep++) patt.forEach(function(p){ var x0 = rep * period + p[0]; if(Math.abs(x0) < 14 && Math.abs(z) < 14) return; sea.push(x0, -4.6, z, x0 + p[1], -4.6, z); }); }
    var seaG = new THREE.Group(); scene.add(seaG); seaG.add(new THREE.LineSegments(geo(sea), M(0x6E8FA2, .22)));
    /* lantern glow sprite */
    var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gx = gc.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,236,196,1)'); gr.addColorStop(.25, 'rgba(240,210,150,.55)'); gr.addColorStop(1, 'rgba(240,210,150,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending})); glow.position.set(0, 64.4, 0); glow.scale.set(22, 22, 1); scene.add(glow);
    var pen = new THREE.Sprite(new THREE.SpriteMaterial({map: glow.material.map, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending})); pen.scale.set(5, 5, 1); scene.add(pen);

    }
    /* ---------- carousel ---------- */
    var cards = [].slice.call(sec.querySelectorAll('.lc')), N = cards.length, active = 0, lastScrollIdx = -1;
    var count = document.getElementById('lhCount'), car = document.getElementById('lhCar');
    function setActive(k){
      active = (k + N) % N;
      cards.forEach(function(c, i){ var d = i - active; if(d > N / 2) d -= N; if(d < -N / 2) d += N; c.style.setProperty('--d', d); c.classList.toggle('on', d === 0); c.classList.toggle('far', Math.abs(d) > 1); c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true'); var go = c.querySelector('.lc-go'); go.tabIndex = d === 0 ? 0 : -1; });
      count.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    }
    setActive(0);
    document.getElementById('lhPrev').addEventListener('click', function(){ setActive(active - 1); });
    document.getElementById('lhNext').addEventListener('click', function(){ setActive(active + 1); });
    cards.forEach(function(c, i){ c.addEventListener('click', function(e){ if(!c.classList.contains('on')){ e.preventDefault(); setActive(i); } }); });
    car.addEventListener('keydown', function(e){ if(e.key === 'ArrowRight'){ setActive(active + 1); e.preventDefault(); } else if(e.key === 'ArrowLeft'){ setActive(active - 1); e.preventDefault(); } });
    var tx0 = null; car.addEventListener('touchstart', function(e){ tx0 = e.touches[0].clientX; }, {passive: true});
    car.addEventListener('touchend', function(e){ if(tx0 == null) return; var dx = e.changedTouches[0].clientX - tx0; if(Math.abs(dx) > 40) setActive(active + (dx < 0 ? 1 : -1)); tx0 = null; });
    var list = document.getElementById('lhList'), allBtn = document.getElementById('lhAll');
    function openList(o){ list.hidden = !o; allBtn.setAttribute('aria-expanded', o ? 'true' : 'false'); if(o) list.querySelector('button[data-sit]').focus(); else allBtn.focus(); }
    allBtn.addEventListener('click', function(){ openList(true); });
    document.getElementById('lhClose').addEventListener('click', function(){ openList(false); });
    list.addEventListener('keydown', function(e){ if(e.key === 'Escape') openList(false); });
    list.addEventListener('click', function(e){ if(e.target === list) openList(false); });

    function cl(v, a, b){ return Math.max(a, Math.min(b, v)); }
    function sm(v, a, b){ var x = cl((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
    function lerp(a, b, t){ return a + (b - a) * t; }
    var desktop = function(){ return window.innerWidth > 720 && !reduce; };
    if(!renderer || reduce){ sec.classList.add('static'); return; }

    var W = 0, H = 0, dpr = 1, off = 0;
    function size(){ dpr = Math.min(window.devicePixelRatio || 1, 2); W = sec.querySelector('.lh-in').clientWidth; H = sec.querySelector('.lh-in').clientHeight; renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); bcv.width = W * dpr; bcv.height = H * dpr; bctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', size);
    var ptr = null, aim = null, v3 = new THREE.Vector3();
    sec.addEventListener('pointermove', function(e){ if(e.pointerType !== 'mouse') return; var b = sec.querySelector('.lh-in').getBoundingClientRect(); ptr = [e.clientX - b.left, e.clientY - b.top]; });
    sec.addEventListener('pointerleave', function(){ ptr = null; });
    var visible = true; if('IntersectionObserver' in window) new IntersectionObserver(function(e){ visible = e[0].isIntersecting; }).observe(sec);
    var broken = false;
    function frame(ts){ if(broken) return; requestAnimationFrame(frame); try{ step(ts); }catch(err){ broken = true; sec.classList.add('static'); can.style.display = 'none'; bcv.style.display = 'none'; sec.style.setProperty('--ui', 1); if(window.console) console.warn('lighthouse disabled', err); } }
    function step(ts){
      if(!visible || sec.closest('main').hidden || document.hidden) return;
      var t = ts / 1000, r = sec.getBoundingClientRect(), vh = window.innerHeight, dk = desktop();
      var draw, ign, mv, ui, P = 0;
      if(true){
        P = cl(-r.top / (r.height - vh), 0, 1);
        draw = sm(P, 0, .2); ign = sm(P, .24, .3); mv = sm(P, .3, .42); ui = sm(P, .38, .47);
        /* the scroll walks through the six situations once the carousel is up */
        var si = Math.min(N - 1, Math.floor(sm(P, .48, .96) * N * .999));
        if(si !== lastScrollIdx){ lastScrollIdx = si; if(P > .48) setActive(si); }
      } else { draw = 1; ign = 1; mv = 1; ui = 1; }
      sec.style.setProperty('--ui', ui.toFixed(3)); sec.style.setProperty('--uipe', ui > .5 ? 'auto' : 'none');
      /* the pen rises from the bottom of the screen along the axis; close up and frontal, the camera follows it,
         then pulls back while turning a little around the tower, then moves off to the right */
      var hPen = lerp(-7, 76, draw);
      clip.constant = hPen;
      axisPos[0] = 0; axisPos[1] = -400; axisPos[2] = 0; axisPos[3] = 0; axisPos[4] = hPen; axisPos[5] = 0; axisG.attributes.position.needsUpdate = true;
      axisM.opacity = .9 * (1 - sm(P, .2, .3)) ;
      pen.position.set(0, hPen, 0); pen.material.opacity = (1 - sm(P, .19, .23)) * (.8 + .2 * Math.sin(t * 5));
      rM1.opacity = .08 * draw; rM2.opacity = .05 * draw;
      var back = sm(P, .12, .3);
      var az = lerp(0, .5, back) + lerp(0, .12, mv) + Math.sin(t * .15) * .015 * back;
      var frac = lerp(2.3, .7, back);
      var D = (84 / 2) / Math.tan(15 * Math.PI / 180) / lerp(frac, dk ? .42 : .34, mv);
      var lookY = lerp(Math.max(0, Math.min(62, hPen - 8)), 38, back);
      camera.position.set(Math.sin(az) * D, lookY + D * lerp(.05, .04, back) * (1 - mv) + D * .02 * mv, Math.cos(az) * D);
      camera.lookAt(0, lookY, 0);
      var shift = dk ? lerp(0, -.3, mv) : lerp(0, -.4, mv), up = dk ? lerp(0, .06, mv) : lerp(0, .02, mv);
      camera.setViewOffset(W, H, shift * W, up * H, W, H);
      seaG.position.x = -((t * 5) % period);

      glow.material.opacity = ign * (.85 + .15 * Math.sin(t * 2.2));
      renderer.render(scene, camera);
      /* beam: from the lantern to the lit situation, or toward the pointer */
      v3.set(0, 64.4, 0).project(camera);
      var lx = (v3.x + 1) / 2 * W, ly = (1 - v3.y) / 2 * H;
      var ac = cards[active].getBoundingClientRect(), bx = sec.querySelector('.lh-in').getBoundingClientRect();
      var target;
      if(ui > .3){ target = [ac.left - bx.left + ac.width / 2, ac.top - bx.top + ac.height / 2]; if(ptr && dk){ target = [lerp(target[0], ptr[0], .55), lerp(target[1], ptr[1], .55)]; } }
      else { var sweep = Math.sin(t * .6) * .5 - .3; target = [lx + Math.cos(Math.PI + sweep) * W * .6, ly + Math.sin(Math.PI + sweep) * H * .25 + H * .05]; }
      if(!aim) aim = target.slice(); aim[0] += (target[0] - aim[0]) * .1; aim[1] += (target[1] - aim[1]) * .1;
      bctx.clearRect(0, 0, W, H);
      if(ign > .01){
        var ang = Math.atan2(aim[1] - ly, aim[0] - lx), len = Math.hypot(aim[0] - lx, aim[1] - ly) * (ui > .3 ? 1.15 : 1), spread = ui > .3 ? Math.min(.2, (ac.width * .42) / Math.max(1, len)) : .06;
        var grd = bctx.createLinearGradient(lx, ly, lx + Math.cos(ang) * len, ly + Math.sin(ang) * len);
        grd.addColorStop(0, 'rgba(255,236,196,' + (.6 * ign).toFixed(3) + ')'); grd.addColorStop(.6, 'rgba(240,214,160,' + (.18 * ign).toFixed(3) + ')'); grd.addColorStop(1, 'rgba(240,214,160,0)');
        bctx.fillStyle = grd; bctx.beginPath(); bctx.moveTo(lx, ly);
        bctx.lineTo(lx + Math.cos(ang - spread) * len, ly + Math.sin(ang - spread) * len);
        bctx.quadraticCurveTo(lx + Math.cos(ang) * len * 1.05, ly + Math.sin(ang) * len * 1.05, lx + Math.cos(ang + spread) * len, ly + Math.sin(ang + spread) * len);
        bctx.closePath(); bctx.fill();
        bctx.strokeStyle = 'rgba(255,236,196,' + (.28 * ign).toFixed(3) + ')'; bctx.lineWidth = 1;
        bctx.beginPath(); bctx.moveTo(lx, ly); bctx.lineTo(lx + Math.cos(ang - spread) * len * .85, ly + Math.sin(ang - spread) * len * .85); bctx.moveTo(lx, ly); bctx.lineTo(lx + Math.cos(ang + spread) * len * .85, ly + Math.sin(ang + spread) * len * .85); bctx.stroke();
      }
    }
    requestAnimationFrame(frame);
  })();

  /* ===== inner pages: shared fine-line sketch engine ===== */
  function skCl(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function skSm(v, a, b){ var x = skCl((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function skLerp(a, b, t){ return a + (b - a) * t; }
  function sketchScene(id, def){
    var sec = document.getElementById(id); if(!sec) return;
    var box = sec.querySelector('.sk-in'), can = sec.querySelector('.sk-gl');
    var items = [].slice.call(sec.querySelectorAll('[data-at]'));
    var words = [].slice.call(sec.querySelectorAll('.sk-scrub .w'));
    var deck = items.filter(function(el){ return el.classList.contains('sk-card'); }).sort(function(x, y){ return parseFloat(x.getAttribute('data-at')) - parseFloat(y.getAttribute('data-at')); });
    var isStatic = reduce;
    function goStatic(){ sec.classList.add('static'); items.forEach(function(el){ el.classList.add('in'); }); words.forEach(function(w){ w.style.opacity = 1; }); }
    if(isStatic) goStatic();
    var renderer = null;
    if(typeof THREE !== 'undefined'){ try{ renderer = new THREE.WebGLRenderer({canvas: can, antialias: true, alpha: true}); }catch(e){ renderer = null; } }
    if(!renderer){ can.style.display = 'none'; goStatic(); return; }
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(def.fov || 30, 1, 1, 6000);
    var bg = new THREE.Color(0x0A1B28), v3 = new THREE.Vector3();
    var seed = def.seed || 11;
    function rnd(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function jr(){ return rnd() - .5; }
    var groups = [];
    function G(color, op, t0, t1, opt){
      opt = opt || {};
      var g = {c: new THREE.Color(color), op: op, t0: t0, t1: t1, A: [], B: [], fade: opt.fade || def.fade || null, parent: opt.parent || scene, jit: opt.jit == null ? .3 : opt.jit, ghost: opt.ghost == null ? .38 : opt.ghost, k: null};
      g.s = function(a, b){ g.A.push(a[0], a[1], a[2], b[0], b[1], b[2]); return g; };
      g.l = function(pts, jit){
        var i, j = jit == null ? g.jit : jit;
        for(i = 1; i < pts.length; i++) g.s(pts[i - 1], pts[i]);
        if(j > 0 && pts.length > 1){
          var o = [jr() * j, jr() * j, jr() * j], d = [jr() * j * .8, jr() * j * .8, jr() * j * .8], n = pts.length - 1;
          for(i = 1; i < pts.length; i++){
            var p = pts[i - 1], q = pts[i], u = (i - 1) / n, w = i / n;
            g.B.push(p[0] + o[0] + d[0] * u, p[1] + o[1] + d[1] * u, p[2] + o[2] + d[2] * u, q[0] + o[0] + d[0] * w, q[1] + o[1] + d[1] * w, q[2] + o[2] + d[2] * w);
          }
        }
        return g;
      };
      /* straight line, subdivided so fades and progressive drawing stay smooth */
      g.ln = function(a, b, n, jit){ var pts = [], i; n = n || 12; for(i = 0; i <= n; i++) pts.push([skLerp(a[0], b[0], i / n), skLerp(a[1], b[1], i / n), skLerp(a[2], b[2], i / n)]); return g.l(pts, jit); };
      /* dashed polyline: keeps every other chunk of a finely sampled path */
      g.dash = function(pts, on, off, jit){
        var out = [], acc = 0, draw = true, i, seg = [pts[0]];
        for(i = 1; i < pts.length; i++){
          var p = pts[i - 1], q = pts[i], L = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); acc += L;
          if(draw) seg.push(q);
          if(acc >= (draw ? on : off)){ acc = 0; if(draw && seg.length > 1) out.push(seg); draw = !draw; seg = [q]; }
        }
        if(draw && seg.length > 1) out.push(seg);
        out.forEach(function(s){ g.l(s, jit == null ? 0 : jit); });
        return g;
      };
      groups.push(g); return g;
    }
    function build(g){
      [[g.A, 1], [g.B, g.ghost]].forEach(function(pair, idx){
        var arr = pair[0]; if(!arr.length) return;
        var pos = new Float32Array(arr), col = new Float32Array(arr.length), tmp = new THREE.Color();
        for(var i = 0; i < arr.length; i += 3){
          var f = g.fade ? skCl(g.fade(arr[i], arr[i + 1], arr[i + 2]), 0, 1) : 1;
          tmp.copy(bg).lerp(g.c, f); col[i] = tmp.r; col[i + 1] = tmp.g; col[i + 2] = tmp.b;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        var m = new THREE.LineBasicMaterial({vertexColors: true, transparent: true, opacity: g.op * pair[1], depthWrite: false});
        var ls = new THREE.LineSegments(geo, m); g.parent.add(ls);
        if(idx === 0){ g.main = ls; g.nA = arr.length / 3; } else { g.ghostL = ls; g.nB = arr.length / 3; }
      });
    }
    function drawG(g, P){
      var k = g.k != null ? g.k : skCl((P - g.t0) / Math.max(1e-4, g.t1 - g.t0), 0, 1);
      if(g.main){ var c = Math.floor(k * g.nA / 2) * 2; g.main.geometry.setDrawRange(0, c); g.main.visible = c > 0; }
      if(g.ghostL){ var c2 = Math.floor(k * g.nB / 2) * 2; g.ghostL.geometry.setDrawRange(0, c2); g.ghostL.visible = c2 > 0; }
    }
    var gcv = document.createElement('canvas'); gcv.width = gcv.height = 128;
    var gx = gcv.getContext('2d'), grd = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,238,204,1)'); grd.addColorStop(.22, 'rgba(240,212,158,.5)'); grd.addColorStop(1, 'rgba(240,212,158,0)');
    gx.fillStyle = grd; gx.fillRect(0, 0, 128, 128);
    var glowTex = new THREE.CanvasTexture(gcv);
    function glow(s, parent){ var sp = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0, blending: THREE.AdditiveBlending})); sp.scale.set(s, s, 1); (parent || scene).add(sp); return sp; }
    var W = 0, H = 0, sx = 0, sy = 0;
    function applyShift(){ if(!W) return; camera.setViewOffset(W, H, -sx * W, -sy * H, W, H); camera.updateProjectionMatrix(); }
    function size(){ W = box.clientWidth; H = box.clientHeight; if(!W || !H) return; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); applyShift(); }
    var api = {
      scene: scene, camera: camera, G: G, glow: glow, rnd: rnd, jr: jr, sm: skSm, cl: skCl, lerp: skLerp, sec: sec, isStatic: isStatic,
      W: function(){ return W; }, H: function(){ return H; }, mobile: function(){ return (W || window.innerWidth) <= 720; },
      shift: function(x, y){ if(x !== sx || y !== sy){ sx = x; sy = y; applyShift(); } },
      proj: function(v){ v3.copy(v).project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H, v3.z]; },
      ring: function(r, y, n, a0, a1){ var p = [], i; a0 = a0 || 0; a1 = a1 == null ? Math.PI * 2 : a1; for(i = 0; i <= n; i++){ var a = a0 + (a1 - a0) * i / n; p.push([Math.cos(a) * r, y, Math.sin(a) * r]); } return p; },
      circXY: function(r, z, n, cx, cy, a0, a1){ var p = [], i; cx = cx || 0; cy = cy || 0; a0 = a0 || 0; a1 = a1 == null ? Math.PI * 2 : a1; for(i = 0; i <= n; i++){ var a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]); } return p; }
    };
    try{ def.build(api); groups.forEach(build); }catch(err){ can.style.display = 'none'; goStatic(); if(window.console) console.warn(id + ' disabled', err); return; }
    var broken = false, P = isStatic ? 1 : 0;
    function frame(ts){
      if(broken) return; requestAnimationFrame(frame);
      if(sec.closest('main').hidden) return;
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      if(r.bottom < 0 || r.top > vh) return;
      if(!isStatic) P = skCl(-r.top / Math.max(1, r.height - vh), -.2, 1);
      if(W !== box.clientWidth || H !== box.clientHeight) size();
      if(!W || !H) return;
      try{
        if(def.mUpdate && api.mobile()) def.mUpdate(P, ts / 1000, api); else def.update(P, ts / 1000, api);
        for(var i = 0; i < groups.length; i++) drawG(groups[i], P);
        renderer.render(scene, camera);
        if(!isStatic){
          var mob = api.mobile();
          items.forEach(function(el, idx){
            var at = parseFloat(el.getAttribute('data-at')), on = P >= at;
            /* on a phone, stacked cards come into focus one at a time: each gives way to the next, the last one stays */
            if(mob && el.classList.contains('sk-card')){ var nx = deck[deck.indexOf(el) + 1]; if(nx && P >= parseFloat(nx.getAttribute('data-at'))) on = false; }
            el.classList.toggle('in', on);
          });
          var n = words.length; for(var j = 0; j < n; j++) words[j].style.opacity = (.14 + .86 * skCl((P - .02) / .3 * n - j, 0, 1)).toFixed(3);
        }
      }catch(err){ broken = true; can.style.display = 'none'; goStatic(); if(window.console) console.warn(id + ' disabled', err); }
    }
    requestAnimationFrame(frame);
  }
  function skLabel(el, x, y, op, ax, ay){ el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(' + ax + '%,' + ay + '%)'; el.style.opacity = op.toFixed(3); }

  /* Nos audits: a sea chart on which the position is fixed, then the route traced */
  sketchScene('skAudits', {
    seed: 17,
    fade: function(x, y, z){ var r = Math.hypot(x, z * 1.25); return .3 + .7 * (1 - skSm(r, 80, 165)); },
    build: function(a){
      var i, j, x, z;
      /* frame with graduated border */
      var fr = a.G(0xD9CFBC, .5, -.18, .06, {jit: .25});
      [[122, 82], [117, 77]].forEach(function(d){ fr.l([[-d[0], 0, -d[1]], [d[0], 0, -d[1]], [d[0], 0, d[1]], [-d[0], 0, d[1]], [-d[0], 0, -d[1]]].reduce(function(acc, p, k, arr){ if(k === 0) return [p]; var q = arr[k - 1]; for(var s = 1; s <= 16; s++) acc.push([skLerp(q[0], p[0], s / 16), 0, skLerp(q[2], p[2], s / 16)]); return acc; }, [])); });
      var tk = a.G(0xD9CFBC, .32, -.1, .1, {jit: 0});
      for(x = -112; x <= 112; x += 8){ var L = (x / 8) % 2 ? 2.4 : 5; tk.s([x, 0, -77], [x, 0, -77 - L]); tk.s([x, 0, 77], [x, 0, 77 + L]); }
      for(z = -72; z <= 72; z += 8){ var L2 = (z / 8) % 2 ? 2.4 : 5; tk.s([-117, 0, z], [-117 - L2, 0, z]); tk.s([117, 0, z], [117 + L2, 0, z]); }
      var gr = a.G(0x8EA2AF, .15, -.14, .1, {jit: 0});
      [-78, -39, 0, 39, 78].forEach(function(xx){ gr.ln([xx, 0, -77], [xx, 0, 77], 20); });
      [-38, 0, 38].forEach(function(zz){ gr.ln([-117, 0, zz], [117, 0, zz], 28); });
      /* coast along the top edge, with a small harbour */
      function coastZ(x){ return -54 + 6 * Math.sin(x * .05) + 3 * Math.sin(x * .13 + 1) + 1.4 * Math.sin(x * .37) + (Math.abs(x - 14) < 9 ? 7 * Math.cos((x - 14) / 9 * Math.PI / 2) : 0); }
      var coast = a.G(0xF4EEE2, .78, -.1, .16), hach = a.G(0xCBBFA8, .22, .0, .2, {jit: 0}), cont = a.G(0x7E9CAE, .36, -.02, .22);
      var cpts = []; for(x = -117; x <= 117; x += 1.5) cpts.push([x, 0, coastZ(x)]); coast.l(cpts, .35);
      for(x = -114; x <= 114; x += 2.6){ var cz = coastZ(x); hach.s([x, 0, cz - .6], [x + .6, 0, cz - 2.6 - 1.4 * Math.abs(Math.sin(x * .7))]); }
      [6, 12].forEach(function(off, k){ var pp = []; for(x = -117; x <= 117; x += 1.2) pp.push([x, 0, coastZ(x) + off + 1.5 * Math.sin(x * .09 + k)]); cont.dash(pp, k ? 2.2 : 4, 2); });
      /* islands with dashed depth contours */
      var isl = [[-52, 8, 15, .4], [34, 24, 11, 1.7], [66, -20, 8, 3.1]];
      function islPt(c, ang, s){ var R = c[2] * s * (1 + .18 * Math.sin(3 * ang + c[3]) + .09 * Math.sin(7 * ang + 2 * c[3]) + .05 * Math.sin(13 * ang)); return [c[0] + Math.cos(ang) * R, 0, c[1] + Math.sin(ang) * R * .82]; }
      isl.forEach(function(c){
        var loop = []; for(j = 0; j <= 90; j++) loop.push(islPt(c, j / 90 * Math.PI * 2, 1)); coast.l(loop, .3);
        for(j = 0; j < 30; j++){ var an = j / 30 * Math.PI * 2, p0 = islPt(c, an, .92), p1 = islPt(c, an + .08, .72); hach.s(p0, p1); }
        [1.35, 1.75].forEach(function(s, k){ var lp = []; for(var m = 0; m <= 120; m++) lp.push(islPt(c, m / 120 * Math.PI * 2, s)); cont.dash(lp, k ? 2 : 3.5, 1.8); });
      });
      /* soundings */
      var snd = a.G(0x9DB1BD, .3, .14, .25, {jit: 0}), placed = 0, guard = 0;
      while(placed < 26 && guard++ < 400){
        x = -105 + a.rnd() * 210; z = -35 + a.rnd() * 105;
        if(isl.some(function(c){ return Math.hypot(x - c[0], (z - c[1]) / .82) < c[2] * 1.9; })) continue;
        snd.s([x - .9, 0, z], [x + .9, 0, z]); snd.s([x, 0, z - .9], [x, 0, z + .9]); placed++;
      }
      /* compass rose, bottom left */
      var rose = a.G(0xD9CFBC, .55, .1, .27, {jit: .2}), rc = [-64, 0, 60];
      function rp(r, an){ return [rc[0] + Math.sin(an) * r, 0, rc[2] - Math.cos(an) * r]; }
      [17, 15, 13.4].forEach(function(r){ var lp = []; for(j = 0; j <= 96; j++) lp.push(rp(r, j / 96 * Math.PI * 2)); rose.l(lp); });
      for(j = 0; j < 64; j++){ var an2 = j / 64 * Math.PI * 2; rose.s(rp(15, an2), rp(j % 8 ? 16 : 17, an2)); }
      for(j = 0; j < 8; j++){ var a0 = j / 8 * Math.PI * 2, len = j % 2 ? 8.5 : 13, wd = j % 2 ? .1 : .16; rose.l([rp(1.6, a0 - Math.PI / 4 * 1.0), rp(len, a0), rp(1.6, a0 + Math.PI / 4 * 1.0)], 0); rose.s(rp(0, 0), rp(len * .96, a0)); }
      /* landmarks (small standing triangles) and bearing lines to the fix */
      var F = [-4, 0, 56], marks = [[-52, 8], [34, 24], [66, -20]];
      var bear = a.G(0xD8C9A8, .78, .27, .43, {jit: .2}), amer = a.G(0xF4EEE2, .8, .22, .3, {jit: 0});
      marks.forEach(function(m){
        amer.l([[m[0] - 1.6, 0, m[1]], [m[0], 4.2, m[1]], [m[0] + 1.6, 0, m[1]], [m[0] - 1.6, 0, m[1]]]);
        var dx = F[0] - m[0], dz = F[2] - m[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
        bear.ln([m[0] + ux * 3, 0, m[1] + uz * 3], [F[0] + ux * 14, 0, F[2] + uz * 14], 30);
      });
      var fix = a.G(0xF4EEE2, .95, .41, .47, {jit: .15}); var fl = []; for(j = 0; j <= 40; j++){ var fa = j / 40 * Math.PI * 2; fl.push([F[0] + Math.cos(fa) * 3.2, 0, F[2] + Math.sin(fa) * 3.2]); } fix.l(fl);
      fix.s([F[0] - 5.5, 0, F[2]], [F[0] - 1.2, 0, F[2]]); fix.s([F[0] + 1.2, 0, F[2]], [F[0] + 5.5, 0, F[2]]);
      this.fixGlow = a.glow(16); this.fixGlow.position.set(F[0], .3, F[2]);
      /* the route, dashed, then channel buoys */
      var ctrl = [[-4, 56], [6, 40], [-6, 22], [-10, 4], [2, -18], [13, -34], [14, coastZ(14) + 3]].map(function(p){ return new THREE.Vector3(p[0], 0, p[1]); });
      var curve = new THREE.CatmullRomCurve3(ctrl), rpts = curve.getPoints(240).map(function(v){ return [v.x, 0, v.z]; });
      var route = a.G(0xE6D3AC, .95, .5, .68, {jit: 0}); route.dash(rpts, 2.4, 1.6);
      var buoy = a.G(0xF4EEE2, .85, .7, .86, {jit: 0}), bm = a.G(0xD8C9A8, .5, .7, .86, {jit: 0});
      [.2, .38, .56, .74].forEach(function(u, k){
        var p = curve.getPoint(u), tn = curve.getTangent(u), side = k % 2 ? 1 : -1, nx = -tn.z * side * 6, nz = tn.x * side * 6, bx = p.x + nx, bz = p.z + nz;
        buoy.l([[bx, 0, bz], [bx, 5, bz]]);
        if(k % 2) buoy.l([[bx - 1.3, 5, bz], [bx, 7.2, bz], [bx + 1.3, 5, bz], [bx - 1.3, 5, bz]]); else buoy.l([[bx - 1.2, 5, bz], [bx - 1.2, 7, bz], [bx + 1.2, 7, bz], [bx + 1.2, 5, bz], [bx - 1.2, 5, bz]]);
        var el = []; for(j = 0; j <= 24; j++){ var ea = j / 24 * Math.PI * 2; el.push([bx + Math.cos(ea) * 1.8, 0, bz + Math.sin(ea) * 1.8]); } bm.l(el);
      });
      this.tgt = new THREE.Vector3(0, 0, 8);
    },
    mUpdate: function(P, t, a){
      /* portrait: looking north up the chart, from low to almost overhead; the route climbs the screen */
      var e = skSm(P, 0, .92), tg = this.tgt, cam = a.camera;
      var el = skLerp(.4, 1.0, e), dist = skLerp(220, 380, e), az = skLerp(-.3, 0, e) + .015 * Math.sin(t * .2);
      var cx = skLerp(-10, 8, e), cz = skLerp(40, 6, e);
      cam.position.set(cx + dist * Math.cos(el) * Math.sin(az), dist * Math.sin(el), cz + dist * Math.cos(el) * Math.cos(az));
      cam.up.set(0, 1, 0); cam.lookAt(cx, 0, cz);
      a.shift(0, skLerp(-.04, -.1, e));
      this.fixGlow.material.opacity = skSm(P, .42, .47) * (.7 + .3 * Math.sin(t * 2.4));
    },
    update: function(P, t, a){
      var e = skSm(P, 0, .92);
      var el = skLerp(.16, 1.02, e), dist = skLerp(150, 262, e), az = skLerp(-.62, .1, e) + .02 * Math.sin(t * .2);
      var tg = this.tgt, cam = a.camera;
      cam.position.set(tg.x + dist * Math.cos(el) * Math.sin(az), tg.y + dist * Math.sin(el), tg.z + dist * Math.cos(el) * Math.cos(az));
      cam.up.set(0, 1, 0); cam.lookAt(tg);
      var w = a.W(); a.shift(w > 1020 ? skLerp(.02, -.03, skSm(P, .2, .5)) : 0, skLerp(.06, .1, e));
      this.fixGlow.material.opacity = skSm(P, .42, .47) * (.7 + .3 * Math.sin(t * 2.4));
    }
  });

  /* Cockpit: a ship's wheel drawn, spun, brought to rest; eight handles, eight domains */
  sketchScene('skWheel', {
    seed: 29,
    build: function(a){
      var rig = new THREE.Group(), wheel = new THREE.Group(); rig.add(wheel); a.scene.add(rig); this.rig = rig; this.wheel = wheel;
      var o = {parent: wheel}, j, k;
      var hub = a.G(0xF4EEE2, .85, -.16, -.02, {parent: wheel, jit: .18}), hubF = a.G(0xD9CFBC, .45, -.12, .02, {parent: wheel, jit: 0});
      [[7.5, 2], [7.5, -2], [4.6, 2.6], [2, 3.4]].forEach(function(d){ hub.l(a.circXY(d[0], d[1], 48)); });
      for(j = 0; j < 16; j++){ var ha = j / 16 * Math.PI * 2; hubF.s([Math.cos(ha) * 7.5, Math.sin(ha) * 7.5, 2], [Math.cos(ha) * 7.5, Math.sin(ha) * 7.5, -2]); }
      var sp = a.G(0xF4EEE2, .82, -.08, .12, {parent: wheel, jit: .22}), handle = a.G(0xF4EEE2, .8, .12, .3, {parent: wheel, jit: .18}), hx = a.G(0xCBBFA8, .35, .16, .32, {parent: wheel, jit: 0});
      var rim = a.G(0xF4EEE2, .85, .02, .2, {parent: wheel, jit: .3}), rimF = a.G(0xD9CFBC, .4, .06, .24, {parent: wheel, jit: 0});
      this.ang = [];
      for(k = 0; k < 8; k++){
        var an = Math.PI - k * Math.PI / 4, c = Math.cos(an), s = Math.sin(an), nx = -s, ny = c; this.ang.push(an);
        var P2 = function(r, off, z){ return [c * r + nx * off, s * r + ny * off, z || 0]; };
        /* spoke: tapering double line from hub to rim */
        [1, -1].forEach(function(sd){ var pts = []; for(var r = 7.5; r <= 34; r += 1.5) pts.push(P2(r, sd * skLerp(1.05, .7, (r - 7.5) / 26.5), 0)); sp.l(pts); });
        /* turned handle beyond the rim */
        var prof = function(u){ return u < .08 ? .95 : u < .5 ? .95 + .75 * Math.sin((u - .08) / .42 * Math.PI) * .9 : u < .66 ? .7 : u < .98 ? .7 + .62 * Math.sin((u - .66) / .32 * Math.PI) : .25; };
        [1, -1].forEach(function(sd){ var pts = []; for(var u = 0; u <= 1.0001; u += .04) pts.push(P2(38 + u * 14, sd * prof(u), 0)); handle.l(pts); });
        handle.s(P2(52, -.25, 0), P2(52, .25, 0));
        [.08, .5, .66].forEach(function(u){ var w = prof(u); hx.s(P2(38 + u * 14, -w, 0), P2(38 + u * 14, w, 0)); });
      }
      [[34, 1.5], [34, -1.5], [38, 1.5], [38, -1.5]].forEach(function(d){ rim.l(a.circXY(d[0], d[1], 128)); });
      rimF.l(a.circXY(36, 1.7, 128), 0);
      for(j = 0; j < 48; j++){ var ra = j / 48 * Math.PI * 2; rimF.s([Math.cos(ra) * 34, Math.sin(ra) * 34, 1.5], [Math.cos(ra) * 34, Math.sin(ra) * 34, -1.5]); rimF.s([Math.cos(ra) * 38, Math.sin(ra) * 38, 1.5], [Math.cos(ra) * 38, Math.sin(ra) * 38, -1.5]); }
      /* label orbit and small index marks (not part of the spinning wheel) */
      var orb = a.G(0x8EA2AF, .2, .4, .56, {parent: rig, jit: 0}); orb.dash(a.circXY(60, 0, 360), 1.6, 2.4);
      var idx = a.G(0xD8C9A8, .6, .46, .6, {parent: rig, jit: 0});
      this.ang.forEach(function(an){ idx.s([Math.cos(an) * 57.5, Math.sin(an) * 57.5, 0], [Math.cos(an) * 62.5, Math.sin(an) * 62.5, 0]); });
      this.hubGlow = a.glow(18, wheel); this.hubGlow.position.set(0, 0, 3.5); this.topGlow = a.glow(22, this.rig); this.topGlow.position.set(0, 54, 2);
      this.labs = [].slice.call(a.sec.querySelectorAll('.sk-lab'));
      this.tmp = new THREE.Vector3(); this.ctr = new THREE.Vector3();
    },
    mUpdate: function(P, t, a){
      /* portrait: the wheel turns one handle to the top at a time, and names it */
      var cam = a.camera, H = a.H(), W = a.W();
      cam.position.set(0, 0, 560); cam.lookAt(0, 0, 0);
      a.shift(0, .13);
      var e = skSm(P, -.1, .3);
      this.rig.rotation.y = skLerp(-1.0, 0, e); this.rig.rotation.x = skLerp(.42, 0, e);
      var kf = skCl((P - .34) / .075, 0, 7.999), k0 = Math.floor(kf), fr = kf - k0, ke = k0 + skSm(fr, 0, .45);
      if(P < .34) ke = 0;
      var spin = 1 - skSm(P, -.12, .32);
      this.wheel.rotation.z = -Math.PI / 2 + ke * Math.PI / 4 - spin * spin * 3.4;
      this.hubGlow.material.opacity = skSm(P, .3, .38) * .5;
      this.topGlow.material.opacity = skSm(P, .33, .37) * (.55 + .12 * Math.sin(t * 2));
      this.ctr.set(0, 0, 0); this.rig.localToWorld(this.ctr); var c = a.proj(this.ctr);
      this.tmp.set(0, 54, 0); this.rig.localToWorld(this.tmp); var top = a.proj(this.tmp);
      var capY = c[1] + (c[1] - top[1]) + 34;
      for(var k = 0; k < this.labs.length; k++){
        var op = P < .33 ? 0 : skSm(kf, k - .7, k - .55) * (k === 7 ? 1 : 1 - skSm(kf, k + .3, k + .42));
        if(k === 0) op = skSm(P, .33, .37) * (1 - skSm(kf, .3, .42));
        skLabel(this.labs[k], W / 2, capY + (1 - op) * 10, op, -50, 0);
      }
    },
    update: function(P, t, a){
      var cam = a.camera, w = a.W(), wide = w > 1020;
      cam.position.set(0, 0, wide ? 430 : 480); cam.lookAt(0, 0, 0);
      a.shift(wide ? .16 : 0, .05);
      var e = skSm(P, 0, .5);
      this.rig.rotation.y = skLerp(-1.0, -.1, e); this.rig.rotation.x = skLerp(.42, .05, e);
      var spin = 1 - skSm(P, -.12, .54);
      this.wheel.rotation.z = -spin * spin * 3.4 + .018 * Math.sin(t * .7) * skSm(P, .56, .7);
      this.hubGlow.material.opacity = skSm(P, .5, .6) * .55; this.topGlow.material.opacity = 0;
      this.ctr.set(0, 0, 0); this.rig.localToWorld(this.ctr); var c = a.proj(this.ctr);
      for(var k = 0; k < this.labs.length; k++){
        var an = this.ang[k], lt = .5 + k * .045;
        this.tmp.set(Math.cos(an) * 67, Math.sin(an) * 67, 0); this.rig.localToWorld(this.tmp);
        var p = a.proj(this.tmp), dx = p[0] - c[0], dy = p[1] - c[1];
        var ax = dx > 20 ? 0 : dx < -20 ? -100 : -50, ay = dy > 20 ? 0 : dy < -20 ? -100 : -50;
        skLabel(this.labs[k], p[0], p[1], skSm(P, lt, lt + .05), ax, ay);
      }
    }
  });

  /* Notre approche: celestial navigation, four fixed stars and the trails around the pole */
  sketchScene('skStars', {
    seed: 41, fov: 34,
    build: function(a){
      var R = 600, eye = new THREE.Vector3(0, 12, 0), D2R = Math.PI / 180;
      function dir(az, alt){ return new THREE.Vector3(Math.sin(az * D2R) * Math.cos(alt * D2R), Math.sin(alt * D2R), -Math.cos(az * D2R) * Math.cos(alt * D2R)); }
      function at(v, r){ return [eye.x + v.x * (r || R), eye.y + v.y * (r || R), eye.z + v.z * (r || R)]; }
      this.eye = eye;
      /* sea: sparse dashes thinning toward the horizon, and the horizon line */
      var sea = a.G(0x6E8FA2, .32, -.2, .02, {jit: 0, fade: function(x, y, z){ return 1 - skSm(-z, 120, 900) * .8; }});
      var z, x;
      for(z = -40; z > -1000; z -= Math.max(3, -z * .045)){
        var off = a.rnd() * 30;
        for(x = -900 + off; x < 900; x += 14 + a.rnd() * 40){ var L = (1.5 + a.rnd() * 5) * (1 + -z / 300); sea.s([x, 0, z], [x + L, 0, z]); }
      }
      var hz = a.G(0xD9CFBC, .4, -.18, -.02, {jit: .4}); hz.ln([-1400, 0, -1100], [1400, 0, -1100], 60);
      /* background stars: tiny crosses */
      var st = a.G(0xE8E1D2, .5, .08, .3, {jit: 0}), st2 = a.G(0xE8E1D2, .22, .1, .34, {jit: 0});
      for(var i = 0; i < 190; i++){
        var az = -48 + a.rnd() * 96, alt = 1.5 + Math.pow(a.rnd(), .8) * 44, v = dir(az, alt), c = at(v), s = .5 + a.rnd() * 1.1;
        var u = new THREE.Vector3(Math.cos(az * D2R), 0, Math.sin(az * D2R)), w = new THREE.Vector3().crossVectors(v, u);
        var g = a.rnd() < .25 ? st : st2;
        g.s([c[0] - u.x * s, c[1] - u.y * s, c[2] - u.z * s], [c[0] + u.x * s, c[1] + u.y * s, c[2] + u.z * s]);
        g.s([c[0] - w.x * s, c[1] - w.y * s, c[2] - w.z * s], [c[0] + w.x * s, c[1] + w.y * s, c[2] + w.z * s]);
      }
      /* star trails around the pole: arcs grow together (segments interleaved) */
      var MOB = window.innerWidth <= 720; this.MOB = MOB;
      var pole = MOB ? dir(0, 22.5) : dir(5, 24), pu = new THREE.Vector3(0, 1, 0).cross(pole).normalize(), pv = new THREE.Vector3().crossVectors(pole, pu).normalize();
      var trail = a.G(0xCFC6B4, .2, .12, .62, {jit: 0}), arcs = [], steps = 40, n;
      for(n = 0; n < 26; n++){ arcs.push({rho: (2.4 + n * 1.25 + a.rnd() * .8) * D2R, ph: a.rnd() * Math.PI * 2, span: .45 + a.rnd() * .35}); }
      function onArc(ar, f){ var ph = ar.ph + ar.span * f, cr = Math.cos(ar.rho), sr = Math.sin(ar.rho); var v = new THREE.Vector3().copy(pole).multiplyScalar(cr).addScaledVector(pu, sr * Math.cos(ph)).addScaledVector(pv, sr * Math.sin(ph)); return at(v, R * 1.02); }
      for(var sidx = 0; sidx < steps; sidx++) arcs.forEach(function(ar){ trail.s(onArc(ar, sidx / steps), onArc(ar, (sidx + 1) / steps)); });
      /* the four marks and the pole, joined by a fine sand line */
      var S = (MOB ? [[-3.6, 2.5], [3.6, 7.5], [-3.4, 12.5], [3.4, 17.5]] : [[-19, 4.5], [-8, 10], [3, 15], [13, 20]]).map(function(p){ return dir(p[0], p[1]); }); S.push(pole);
      this.S = S.map(function(v){ var p = at(v); return new THREE.Vector3(p[0], p[1], p[2]); });
      for(n = 0; n < 4; n++){ var tn = .44 + n * .085; a.G(0xD8C9A8, .7, tn + .01, tn + .085, {jit: .6}).ln(at(S[n]), at(S[n + 1]), 24); }
      var self = this; this.glows = [];
      S.forEach(function(v, k){
        var tk = .44 + k * .085, spark = a.G(0xF4EEE2, .9, tk - .025, tk + .01, {jit: 0});
        var c = at(v), u = new THREE.Vector3(0, 1, 0).cross(v).normalize(), w = new THREE.Vector3().crossVectors(v, u).normalize(), big = k === 4 ? 1.5 : 1;
        [[u, 6 * big], [w, 6 * big]].forEach(function(p){ spark.s([c[0] - p[0].x * p[1], c[1] - p[0].y * p[1], c[2] - p[0].z * p[1]], [c[0] + p[0].x * p[1], c[1] + p[0].y * p[1], c[2] + p[0].z * p[1]]); });
        var d1 = u.clone().add(w).normalize(), d2 = u.clone().sub(w).normalize();
        [d1, d2].forEach(function(d){ var L = 2.2 * big; spark.s([c[0] - d.x * L, c[1] - d.y * L, c[2] - d.z * L], [c[0] + d.x * L, c[1] + d.y * L, c[2] + d.z * L]); });
        var gl = a.glow(k === 4 ? 44 : 30); gl.position.set(c[0], c[1], c[2]); self.glows.push(gl);
      });
      this.cards = [].slice.call(a.sec.querySelectorAll('.sk-star'));
    },
    mUpdate: function(P, t, a){
      /* portrait: the eye lifts from the sea to a column of four marks; each one is named in turn */
      var cam = a.camera, W = a.W();
      cam.position.copy(this.eye); cam.rotation.order = 'YXZ';
      var e = skSm(P, .06, .46);
      cam.rotation.x = skLerp(-.16, .235, e); cam.rotation.y = .004 * Math.sin(t * .15);
      a.shift(0, 0);
      for(var k = 0; k < 5; k++){
        var tk = .44 + k * .085;
        this.glows[k].material.opacity = skSm(P, tk - .02, tk + .03) * (k === 4 ? .95 : .7) * (.85 + .15 * Math.sin(t * 1.7 + k));
        if(k < 4){
          var op = skSm(P, tk + .005, tk + .035) * (k < 3 ? 1 - skSm(P, tk + .07, tk + .082) : 1);
          skLabel(this.cards[k], parseFloat(getComputedStyle(this.cards[k].parentNode).paddingLeft) || 20, a.H() - 22 + (1 - op) * 10, op, 0, -100);
        }
      }
    },
    update: function(P, t, a){
      var cam = a.camera, w = a.W(), wide = w > 1020;
      cam.position.copy(this.eye); cam.rotation.order = 'YXZ';
      var e = skSm(P, .06, .46);
      cam.rotation.x = skLerp(-.12, .215, e); cam.rotation.y = skLerp(.1, -.02, e) + .006 * Math.sin(t * .15);
      a.shift(wide ? .05 : 0, 0);
      for(var k = 0; k < 5; k++){
        var tk = .44 + k * .085;
        this.glows[k].material.opacity = skSm(P, tk - .02, tk + .03) * (k === 4 ? .95 : .7) * (.85 + .15 * Math.sin(t * 1.7 + k));
        if(k < 4){ var p = a.proj(this.S[k]); skLabel(this.cards[k], p[0] + 22, p[1] + 16, skSm(P, tk, tk + .05), 0, 0); }
      }
    }
  });

  /* Professionnels: two ropes, each with its own bight, hooked into one another */
  sketchScene('skKnot', {
    seed: 53,
    build: function(a){
      var rig = new THREE.Group(); a.scene.add(rig); this.rig = rig;
      var ga = new THREE.Group(), gb = new THREE.Group(); rig.add(ga, gb); this.ga = ga; this.gb = gb;
      var RAD = 2.1;
      function ropeA(){ var p = [], x, th; for(x = -150; x < 16; x += 2) p.push(new THREE.Vector3(x, 16, 0)); for(th = 90; th >= -90; th -= 5){ var r = th * Math.PI / 180; p.push(new THREE.Vector3(16 + Math.cos(r) * 16, Math.sin(r) * 16, 5.2 * Math.sin(2 * r) * Math.pow(Math.cos(r), .35))); } for(x = 14; x >= -150; x -= 2) p.push(new THREE.Vector3(x, -16, 0)); return p; }
      function ropeB(){ var p = [], x, th; function bump(x){ return Math.exp(-Math.pow((x - 30) / 12, 2)) * 2.4; } for(x = 150; x > -16; x -= 2) p.push(new THREE.Vector3(x, 7.5, -bump(x))); for(th = 90; th <= 270; th += 6){ var r = th * Math.PI / 180; p.push(new THREE.Vector3(-16 + Math.cos(r) * 7.5, Math.sin(r) * 7.5, 0)); } for(x = -14; x <= 150; x += 2) p.push(new THREE.Vector3(x, -7.5, bump(x))); return p; }
      var fade = function(x){ return 1 - skSm(Math.abs(x), 70, 138); };
      function rope(pts, parent, t0, t1, col){
        var curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .2), N = 900, len = curve.getLength();
        var side = a.G(col, .88, t0, t1, {parent: parent, jit: .25, fade: fade}), lay = a.G(col, .4, t0 + .02, t1 + .02, {parent: parent, jit: 0, fade: fade});
        var prev = null, lastH = 0, Z = new THREE.Vector3(0, 0, 1);
        function surf(u, phi){ var c = curve.getPointAt(u), T = curve.getTangentAt(u), Nn = new THREE.Vector3().crossVectors(Z, T).normalize(), B = new THREE.Vector3().crossVectors(T, Nn).normalize(); return c.addScaledVector(Nn, RAD * Math.cos(phi)).addScaledVector(B, RAD * Math.sin(phi)); }
        var s1 = [], s2 = [];
        for(var i = 0; i <= N; i++){ var u = i / N; s1.push(surf(u, 0).toArray()); s2.push(surf(u, Math.PI).toArray()); }
        side.l(s1); side.l(s2, .25);
        var pitch = 2.5 / len, du = 2.1 / len;
        for(var u2 = 0; u2 < 1 - du; u2 += pitch){ var h = []; for(var q = 0; q <= 6; q++){ var f = q / 6; h.push(surf(Math.min(1, u2 + du * f), .2 + (Math.PI - .4) * f).toArray()); } lay.l(h, 0); }
        /* invisible body so each rope hides what passes behind it */
        var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 600, RAD * .96, 10, false), new THREE.MeshBasicMaterial({colorWrite: false}));
        tube.renderOrder = -1; parent.add(tube);
      }
      rope(ropeA(), ga, 0, .3, 0xF4EEE2);
      rope(ropeB(), gb, .06, .36, 0xE3D6BC);
      /* whippings where each rope enters */
      var wh = a.G(0xD8C9A8, .5, .3, .4, {parent: rig, jit: 0});
      [[-84, 16], [-84, -16]].forEach(function(p){ for(var q = 0; q < 5; q++) wh.s([p[0] + q * .9, p[1] - RAD, 0], [p[0] + q * .9, p[1] + RAD, 0]); });
      this.whB = a.G(0xD8C9A8, .5, .32, .42, {parent: gb, jit: 0});
      var wb = this.whB; [[82, 7.5], [82, -7.5]].forEach(function(p){ for(var q = 0; q < 4; q++) wb.s([p[0] + q * .9, p[1] - RAD, p[1] > 0 ? 0 : 0], [p[0] + q * .9, p[1] + RAD, 0]); });
      this.knotGlow = a.glow(60, rig); this.knotGlow.position.set(8, 0, 4);
    },
    mUpdate: function(P, t, a){
      /* portrait: the two ropes arrive from the top and the bottom and hook in the middle of the screen */
      var cam = a.camera;
      cam.position.set(0, 0, 225); cam.lookAt(0, 0, 0);
      a.shift(0, -.02);
      var e = skSm(P, 0, .55), s2 = skSm(P, .14, .54);
      this.rig.rotation.set(skLerp(.8, .06, e), skLerp(.5, .04, e), Math.PI / 2);
      this.rig.position.set(0, -6, 0);
      this.ga.position.x = skLerp(-38, 0, s2); this.gb.position.x = skLerp(50, 0, s2);
      this.knotGlow.material.opacity = skSm(P, .5, .6) * (.22 + .05 * Math.sin(t * 1.5));
    },
    update: function(P, t, a){
      var cam = a.camera, w = a.W(), wide = w > 1020;
      cam.position.set(0, 0, wide ? 215 : 300); cam.lookAt(0, 0, 0);
      a.shift(0, .1);
      var e = skSm(P, 0, .55), s = skSm(P, .14, .54);
      this.rig.rotation.y = skLerp(.95, .08, e); this.rig.rotation.x = skLerp(-.5, -.06, e); this.rig.rotation.z = skLerp(-.08, 0, e);
      this.rig.position.set(-8, 0, 0);
      this.ga.position.x = skLerp(-34, 0, s); this.gb.position.x = skLerp(46, 0, s);
      this.knotGlow.material.opacity = skSm(P, .5, .6) * (.22 + .05 * Math.sin(t * 1.5));
    }
  });

  /* Le cabinet: a wake seen from above, which settles and holds its heading */
  sketchScene('skWake', {
    seed: 67,
    build: function(a){
      var x, i;
      function zp(x){ var u = x + 170; return 38 * Math.sin(u * .028) * Math.exp(-u / 110); }
      this.zp = zp;
      var sea = this.sea = a.G(0x6E8FA2, .28, -.2, -.02, {jit: 0, fade: function(x, y, z){ return 1 - skSm(Math.hypot(x - 20, z * 1.6), 150, 330); }});
      for(var z = -170; z <= 170; z += 5.5){ var off = a.rnd() * 24; for(x = -330 + off; x < 360; x += 12 + a.rnd() * 30){ if(Math.abs(z - zp(x)) < 7 && x > -170 && x < 150) continue; sea.s([x, 0, z], [x + 1.5 + a.rnd() * 5, 0, z]); } }
      var head = a.G(0xD8C9A8, .45, .5, .74, {jit: 0}); var hp = []; for(x = -60; x <= 230; x += 1) hp.push([x, 0, 0]); head.dash(hp, 3, 3);
      var track = [], lft = [], rgt = [];
      for(x = -170; x <= 150; x += 1){
        var z0 = zp(x), dz = (zp(x + .5) - zp(x - .5)), L = Math.hypot(1, dz), nx = -dz / L, nz = 1 / L, wd = 1.3 + (150 - x) * .018;
        track.push([x, 0, z0]); lft.push([x + nx * wd, 0, z0 + nz * wd]); rgt.push([x - nx * wd, 0, z0 - nz * wd]);
      }
      var fadeW = function(x){ return .35 + .65 * skSm(x, -170, 60); };
      a.G(0xF4EEE2, .7, .04, .72, {jit: .3, fade: fadeW}).l(lft); a.G(0xF4EEE2, .7, .04, .72, {jit: .3, fade: fadeW}).l(rgt);
      a.G(0xCBBFA8, .25, .04, .72, {jit: 0, fade: fadeW}).l(track);
      /* the boat and its Kelvin wake, carried together */
      var boat = new THREE.Group(); a.scene.add(boat); this.boat = boat;
      var hull = a.G(0xF4EEE2, .95, -.14, -.04, {parent: boat, jit: .15}), hp2 = [];
      for(i = 0; i <= 20; i++){ var u = i / 20; hp2.push([-4 + 11 * u, 0, u < .4 ? 2.1 + .2 * Math.sin(u / .4 * Math.PI / 2) : 2.3 * Math.cos((u - .4) / .6 * Math.PI / 2)]); }
      hull.l(hp2); hull.l(hp2.map(function(p){ return [p[0], p[1], -p[2]]; }).reverse()); hull.s([-4, 0, -2.2], [-4, 0, 2.2]);
      hull.l([[-2.2, 0, -1], [1.6, 0, -1], [1.6, 0, 1], [-2.2, 0, 1], [-2.2, 0, -1]], 0);
      var kel = a.G(0xE8DCC4, .5, .06, .72, {parent: boat, jit: 0, fade: function(x){ return 1 - skSm(-x, 6, 44); }});
      [1, -1].forEach(function(sd){ var pts = []; for(var d = 0; d <= 44; d += 1) pts.push([-4 - d, 0, sd * (2 + d * .354)]); kel.l(pts); });
      [10, 19, 28, 37].forEach(function(d){ var pts = []; for(var q = -8; q <= 8; q++){ var f = q / 8; pts.push([-4 - d + Math.abs(f) * d * .08 - (1 - f * f) * 1.2, 0, f * d * .3]); } kel.l(pts); });
      this.bglow = a.glow(14, boat); this.bglow.position.set(2, .5, 0);
      this.tg = new THREE.Vector3();
    },
    mUpdate: function(P, t, a){
      /* portrait: seen from above, the boat climbs the screen; below it the wake meanders, then runs straight */
      var cam = a.camera;
      var f = skCl((P - .04) / .68, 0, 1), bx = -170 + 320 * f, zp = this.zp, bz = zp(bx), dz = zp(bx + .5) - zp(bx - .5);
      this.boat.position.set(bx, 0, bz); this.boat.rotation.y = -Math.atan2(dz, 1);
      this.bglow.material.opacity = skSm(P, -.06, .02) * (.35 + .1 * Math.sin(t * 2));
      var e = skSm(P, 0, .9), el = skLerp(1.05, 1.42, e), dist = skLerp(250, 300, e);
      var tx = bx - 6 + skSm(P, .72, 1) * 30, tz = bz * .35;
      if(this.sea.main) this.sea.main.rotation.y = Math.PI / 2;
      cam.up.set(1, 0, 0);
      cam.position.set(tx - dist * Math.cos(el), dist * Math.sin(el), tz);
      cam.lookAt(tx, 0, tz);
      a.shift(0, .2);
    },
    update: function(P, t, a){
      var cam = a.camera, w = a.W(), wide = w > 1020;
      var f = skCl((P - .04) / .68, 0, 1), bx = -170 + 320 * f, zp = this.zp, bz = zp(bx), dz = zp(bx + .5) - zp(bx - .5);
      this.boat.position.set(bx, 0, bz); this.boat.rotation.y = -Math.atan2(dz, 1);
      this.bglow.material.opacity = skSm(P, -.06, .02) * (.35 + .1 * Math.sin(t * 2));
      var e = skSm(P, 0, .9), el = skLerp(.5, 1.25, e), fin = skSm(P, .7, .98), dist = skLerp(skLerp(250, 300, e), 460, fin), az = skLerp(-.4, 0, e);
      this.tg.set(skLerp(bx - 40, 10, fin), 0, skLerp(bz * .5, 0, fin));
      cam.position.set(this.tg.x + dist * Math.cos(el) * Math.sin(az), dist * Math.sin(el), this.tg.z + dist * Math.cos(el) * Math.cos(az));
      if(this.sea.main) this.sea.main.rotation.y = 0;
      cam.up.set(0, 1, 0); cam.lookAt(this.tg);
      a.shift(wide ? skLerp(.2, -.02, fin) : 0, 0);
    }
  });

  /* Faire le point: a fine chart behind the title, three bearings meeting on the position */
  (function(){
    var cv = document.getElementById('fpChart'); if(!cv) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, start = null, main = cv.closest('main');
    function size(){ var dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function part(pts, f){ if(f <= 0) return; var tot = 0, i, L = []; for(i = 1; i < pts.length; i++){ var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } var goal = tot * f, acc = 0; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for(i = 1; i < pts.length; i++){ if(acc + L[i - 1] >= goal){ var k = (goal - acc) / L[i - 1]; ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); break; } acc += L[i - 1]; ctx.lineTo(pts[i][0], pts[i][1]); } ctx.stroke(); }
    function draw(k, t){
      ctx.clearRect(0, 0, W, H); if(!W) return;
      var i, x, y, F = [W * (W > 720 ? .72 : .7), H * .56];
      ctx.lineWidth = 1;
      /* graticule */
      ctx.strokeStyle = 'rgba(142,162,175,.13)';
      for(x = F[0] % 140; x < W; x += 140) part([[x, 0], [x, H]], skSm(k, 0, .35));
      for(y = F[1] % 140; y < H; y += 140) part([[0, y], [W, y]], skSm(k, .05, .4));
      ctx.strokeStyle = 'rgba(216,201,168,.28)';
      for(x = 0; x < W; x += 14) part([[x, H - 1], [x, H - 1 - ((x / 14) % 5 ? 4 : 9)]], skSm(k, .1, .3));
      /* depth contours */
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(126,156,174,.26)';
      for(i = 0; i < 6; i++){ var pts = []; for(x = W * .3; x <= W + 20; x += 8){ pts.push([x, H * (.12 + i * .15) + 26 * Math.sin(x * .006 + i * 1.3) + 12 * Math.sin(x * .017 + i)]); } part(pts, skSm(k, .08 + i * .03, .5 + i * .03)); }
      ctx.setLineDash([]);
      /* landmarks and bearings */
      var L3 = [[W * .5, H * .1], [W * 1.02, H * .18], [W * .6, H * 1.05]];
      L3.forEach(function(p, j){
        var dx = F[0] - p[0], dy = F[1] - p[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, f = skSm(k, .35 + j * .1, .6 + j * .1);
        ctx.strokeStyle = 'rgba(216,201,168,.6)'; part([[p[0], p[1]], [F[0] + ux * 70, F[1] + uy * 70]], f);
        ctx.strokeStyle = 'rgba(216,201,168,.22)'; part([[p[0] + 1.2, p[1] - .8], [F[0] + ux * 70 + 1.5, F[1] + uy * 70 - 1]], f * .96);
        ctx.strokeStyle = 'rgba(244,238,226,.8)'; part([[p[0] - 6, p[1] + 5], [p[0], p[1] - 6], [p[0] + 6, p[1] + 5], [p[0] - 6, p[1] + 5]], skSm(k, .3 + j * .1, .38 + j * .1));
      });
      /* the position */
      var fk = skSm(k, .82, .96);
      if(fk > 0){
        var circ = []; for(i = 0; i <= 48; i++){ var an = i / 48 * Math.PI * 2 - Math.PI / 2; circ.push([F[0] + Math.cos(an) * 11, F[1] + Math.sin(an) * 11]); }
        ctx.strokeStyle = 'rgba(244,238,226,.95)'; part(circ, fk);
        var g = ctx.createRadialGradient(F[0], F[1], 0, F[0], F[1], 60); var gl = fk * (.26 + .06 * Math.sin(t * 2.2));
        g.addColorStop(0, 'rgba(255,236,196,' + gl.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,236,196,0)');
        ctx.fillStyle = g; ctx.fillRect(F[0] - 60, F[1] - 60, 120, 120);
        ctx.fillStyle = 'rgba(244,238,226,' + fk.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(F[0], F[1], 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    var last = 0;
    function frame(ts){
      requestAnimationFrame(frame);
      if(main.hidden){ start = null; return; }
      if(W !== cv.clientWidth || H !== cv.clientHeight) size();
      if(start === null) start = ts;
      var k = reduce ? 1 : skCl((ts - start) / 3200, 0, 1);
      if(k >= 1 && ts - last < 60) return; last = ts;
      draw(k, ts / 1000);
    }
    requestAnimationFrame(frame);
  })();

  onScroll();
})();
