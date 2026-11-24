/* Scenes of the campaign pages. Loaded after three.js and site.js.
   Kept apart from site.js, which is regenerated from the maquette; this file is not.
   Same fine-line drawing as the scenes of the site (pencil doubling, progressive tracing), plus what a camera
   needs to travel through a landscape: a haze that follows it, bodies that hide what passes behind them,
   and an opening that draws itself with time, since the scene is also the hero of its page. */
(function(){
  if(typeof window === 'undefined' || !window.requestAnimationFrame) return;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var D2R = Math.PI / 180;
  function cl(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function sm(v, a, b){ var x = cl((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, t){ return a + (b - a) * t; }

  /* ---------- the drawing engine ---------- */
  function stage(id, def){
    var sec = document.getElementById(id); if(!sec) return;
    var box = sec.querySelector('.pz-stage'), can = sec.querySelector('.pz-gl'); if(!box || !can) return;
    var renderer = null;
    if(typeof THREE !== 'undefined'){ try{ renderer = new THREE.WebGLRenderer({canvas: can, antialias: true, alpha: true}); }catch(e){ renderer = null; } }
    if(!renderer){ can.style.display = 'none'; return; }
    var live = !reduce;
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(def.fov || 30, 1, def.near || 2, def.far || 12000);
    var bg = new THREE.Color(def.bg || 0x0A1B28), v3 = new THREE.Vector3();
    var seed = def.seed || 11;
    function rnd(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function jr(){ return rnd() - .5; }
    var groups = [];
    /* a family of lines: k is how much of it is traced (0 to 1), o its presence (0 to 1) */
    function G(color, op, opt){
      opt = opt || {};
      var g = {c: new THREE.Color(color), op: op, A: [], B: [], fade: opt.fade || null, parent: opt.parent || scene, jit: opt.jit == null ? .3 : opt.jit, ghost: opt.ghost == null ? .38 : opt.ghost, fog: opt.fog !== false, k: opt.k == null ? 1 : opt.k, o: 1, t: opt.t || null};
      g.s = function(a, b){ g.A.push(a[0], a[1], a[2], b[0], b[1], b[2]); return g; };
      /* polyline, with a second, slightly wandering pencil stroke */
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
      g.ln = function(a, b, n, jit){ var pts = [], i; n = n || 12; for(i = 0; i <= n; i++) pts.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n), lerp(a[2], b[2], i / n)]); return g.l(pts, jit); };
      g.dash = function(pts, on, off, jit){
        var out = [], acc = 0, draw = true, i, seg = [pts[0]];
        for(i = 1; i < pts.length; i++){
          var p = pts[i - 1], q = pts[i]; acc += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
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
          var f = g.fade ? cl(g.fade(arr[i], arr[i + 1], arr[i + 2]), 0, 1) : 1;
          tmp.copy(bg).lerp(g.c, f); col[i] = tmp.r; col[i + 1] = tmp.g; col[i + 2] = tmp.b;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        var m = new THREE.LineBasicMaterial({vertexColors: true, transparent: true, opacity: g.op * pair[1], depthWrite: false, fog: g.fog});
        var ls = new THREE.LineSegments(geo, m); ls.frustumCulled = false; g.parent.add(ls);
        if(idx === 0){ g.main = ls; g.nA = arr.length / 3; } else { g.ghostL = ls; g.nB = arr.length / 3; }
      });
      g.A = g.B = null;
    }
    function drawG(g){
      var k = cl(g.k, 0, 1), o = cl(g.o, 0, 1), c;
      if(g.main){ c = Math.floor(k * g.nA / 2) * 2; g.main.geometry.setDrawRange(0, c); g.main.visible = c > 0 && o > .003; g.main.material.opacity = g.op * o; }
      if(g.ghostL){ c = Math.floor(k * g.nB / 2) * 2; g.ghostL.geometry.setDrawRange(0, c); g.ghostL.visible = c > 0 && o > .003; g.ghostL.material.opacity = g.op * g.ghost * o; }
    }
    function tex(draw, w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return new THREE.CanvasTexture(c); }
    function sprite(map, sx, sy, opt){
      opt = opt || {};
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({map: map, transparent: true, depthWrite: false, depthTest: opt.depth !== false, opacity: 0, blending: THREE.AdditiveBlending, fog: false}));
      sp.scale.set(sx, sy, 1); (opt.parent || scene).add(sp); return sp;
    }
    var W = 0, H = 0, sx = 0, sy = 0;
    function applyShift(){ if(!W) return; camera.setViewOffset(W, H, -sx * W, -sy * H, W, H); camera.updateProjectionMatrix(); }
    function size(){ W = box.clientWidth; H = box.clientHeight; if(!W || !H) return; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); applyShift(); }
    var api = {
      scene: scene, camera: camera, G: G, tex: tex, sprite: sprite, rnd: rnd, jr: jr, sec: sec, live: live,
      W: function(){ return W; }, H: function(){ return H; },
      /* a phone, or a tablet held upright: the words go above and below, the drawing between them (same rule as landing.css) */
      mobile: function(){ var w = W || window.innerWidth, h = H || window.innerHeight; return w <= 720 || (w <= 1100 && h > w); },
      shift: function(x, y){ if(x !== sx || y !== sy){ sx = x; sy = y; applyShift(); } },
      proj: function(v){ v3.copy(v).project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H, v3.z]; }
    };
    var broken = false, t0 = null, drawn = false;
    function fail(err){ broken = true; can.style.display = 'none'; sec.classList.remove('live'); if(window.console) console.warn(id + ' disabled', err); }
    try{ def.build(api); groups.forEach(build); }catch(err){ fail(err); return; }
    /* the pinned, scroll-driven layout only exists once the drawing does; without it the page stays a plain one */
    if(live) sec.classList.add('live');
    function frame(ts){
      if(broken) return; requestAnimationFrame(frame);
      if(document.hidden) return;
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      if(r.bottom < -40 || r.top > vh + 40) return;
      var resized = false;
      if(W !== box.clientWidth || H !== box.clientHeight){ size(); resized = true; }
      if(!W || !H) return;
      if(!live && drawn && !resized) return;   /* reduced motion: one still image, redrawn only when the frame changes size */
      var P = live ? cl(-r.top / Math.max(1, r.height - vh), 0, 1) : 0;
      if(t0 === null) t0 = ts;
      try{
        def.update(P, ts / 1000, api, live ? (ts - t0) / 1000 : 99);
        for(var i = 0; i < groups.length; i++) drawG(groups[i]);
        renderer.render(scene, camera); drawn = true;
      }catch(err){ fail(err); }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- /rj : « La passe » ----------
     The hearing of the second month is a narrows. Two rocks stand face to face and the light of the far side shows
     between them: the slit of light of the brand, become a landscape. They are the rocks only one ship ever passed,
     after sending a dove ahead to try the way. Scrolling: the eye rises until the sea is a chart on which one finds
     oneself, between the judgment and the hearing; it comes back down to the water, facing the narrows; a dove goes
     first; the walls slide past on either side; beyond lie the dawn ahead, the Bear on the left hand, and three routes. */
  var ROCKS = [
    {x: -90, z: 0, rx: 60, rz: 84, H: 268, ph: .6, ty: 2.2, side: -1, gap: 27, lean: 30, l1: .43, l2: .7},
    {x: 84, z: -12, rx: 53, rz: 74, H: 214, ph: 2.3, ty: .4, side: 1, gap: 27, lean: 26, l1: .36, l2: .66}
  ];
  /* outline of a rock with height: a skirt at the water, two ledges, a summit that closes */
  function prof(c, h){
    return (1.22 - .22 * sm(h, 0, .12)) * (1 - .3 * Math.pow(h, 1.3)) * (1 - .1 * sm(h, c.l1 - .012, c.l1 + .012) - .14 * sm(h, c.l2 - .012, c.l2 + .012)) * (1 - .62 * sm(h, .82, 1));
  }
  /* a point of a rock: angle around its axis, height from 0 to 1. Five buttresses run up it; the side facing
     the other rock is cut clean, as if one rock had been split in two */
  function rockPt(c, th, h){
    var p = prof(c, h), but = 2 * Math.abs(Math.sin(2.5 * th + c.ph)) - 1;
    var n = 1 + .15 * but * (1 - .35 * h) + .07 * Math.sin(11 * th + 2 * c.ph + h * 2.4) + .04 * Math.sin(23 * th - h * 5 + c.ph) + .05 * Math.sin(h * 9 + th * 2 + c.ph);
    var cx = c.x - c.side * c.lean * h;
    var x = cx + Math.cos(th) * c.rx * p * n, z = c.z + Math.sin(th) * c.rz * p * n;
    var cut = c.gap + 4.5 * Math.sin(z * .05 + h * 5 + c.ph) + 2.6 * Math.sin(z * .15 - h * 9 + c.ph) + 1.6 * Math.sin(h * 31 + z * .3) + 18 * h * h * h;
    if(c.side < 0){ if(x > -cut) x = -cut; } else if(x < cut) x = cut;
    return [x, h * c.H * (1 + .11 * Math.sin(th + c.ty) * sm(h, .45, 1)) + (h > .02 ? Math.sin(th * 3 + c.ph) * h * 5 : 0), z];
  }
  function spline(cp, step){
    var out = [], i, t;
    for(i = 0; i < cp.length - 1; i++){
      var p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
      var n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for(t = (i ? 1 : 0); t <= n; t++){
        var s = t / n, s2 = s * s, s3 = s2 * s;
        out.push([.5 * (2 * p1[0] + (p2[0] - p0[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * s3), .3,
                  .5 * (2 * p1[1] + (p2[1] - p0[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * s3)]);
      }
    }
    return out;
  }
  function bez(a, b, c, n){ var out = [], i; for(i = 0; i <= n; i++){ var t = i / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], .3, u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]); } return out; }
  function ringPts(cx, cz, r, n){ var out = [], i; for(i = 0; i <= n; i++){ var an = i / n * Math.PI * 2; out.push([cx + Math.cos(an) * r, .3, cz + Math.sin(an) * r]); } return out; }
  /* the Great Bear around the pole, as on the brand mark: right ascension, polar distance, magnitude */
  var BEAR = [[105.76, 16.91, 1.79], [111.63, 21.93, 2.37], [132.66, 22.38, 2.44], [139.43, 18.51, 3.31], [156.30, 19.01, 1.77], [168.95, 20.09, 2.04], [176.96, 26.00, 1.86]], ALCOR = [169.50, 20.04];
  var FIG = [[6, 5], [5, 4], [4, 3], [3, 0], [0, 1], [1, 2], [2, 3]];

  stage('lpPasse', {
    seed: 23, fov: 30, near: 2, far: 12000,
    build: function(a){
      var S = this, sc = a.scene, i, j, k, h, th, x, z;
      sc.fog = new THREE.Fog(0x0A1B28, 340, 2500);
      var mob = a.mobile();   /* a phone frames less of the sea: the routes part further ahead and closer together, the Bear sits nearer the axis */
      S.byP = [];
      function byP(color, op, t, opt){ opt = opt || {}; opt.t = t; opt.k = 0; var g = a.G(color, op, opt); S.byP.push(g); return g; }

      /* several polylines traced together, step by step, so that a rock rises as a whole (each keeps its own pencil double) */
      function together(g, lines, jit){
        var offs = lines.map(function(){ return [a.jr() * jit, a.jr() * jit, a.jr() * jit, a.jr() * jit * .8, a.jr() * jit * .8, a.jr() * jit * .8]; }), most = 0, n, st;
        lines.forEach(function(l){ most = Math.max(most, l.at + l.pts.length); });
        for(st = 1; st < most; st++) for(n = 0; n < lines.length; n++){
          var l = lines[n], q = st - l.at; if(q < 1 || q >= l.pts.length) continue;
          var p0 = l.pts[q - 1], p1 = l.pts[q], o = offs[n], u0 = (q - 1) / (l.pts.length - 1), u1 = q / (l.pts.length - 1);
          g.A.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
          g.B.push(p0[0] + o[0] + o[3] * u0, p0[1] + o[1] + o[4] * u0, p0[2] + o[2] + o[5] * u0, p1[0] + o[0] + o[3] * u1, p1[1] + o[1] + o[4] * u1, p1[2] + o[2] + o[5] * u1);
        }
      }
      /* the two rocks: lines that run up them, a few broken strata, hatching in the shade */
      S.rocks = ROCKS.map(function(c){
        function fd(px){ return .34 + .66 * (1 - sm(Math.abs(px) - c.gap, 0, 130)); }
        var hi = a.G(0xF4EEE2, .8, {fade: fd, k: 0}), lo = a.G(0xCBBFA8, .4, {fade: fd, k: 0}),
            sr = a.G(0xCBBFA8, .36, {jit: .7, fade: fd, k: 0}), ha = a.G(0xB9AE98, .25, {jit: 0, fade: fd, k: 0}),
            fc = a.G(0xF7F0E0, .66, {jit: .45, k: 0}), fs = a.G(0xD9CFBC, .34, {jit: .4, k: 0}), iso = a.G(0xD9CFBC, .5, {jit: .7, fade: fd, k: 0});
        var ST = 50, MER = 58, strong = [], faint = [], pts, lp;
        for(j = 0; j < MER; j++){
          var th0 = (j + .5 * a.jr()) / MER * Math.PI * 2, big = j % 5 === 0, s0 = big ? 0 : Math.floor(a.rnd() * .28 * ST), s1 = big ? ST : Math.floor((.55 + a.rnd() * .45) * ST); pts = [];
          for(k = s0; k <= s1; k++){ h = k / ST; pts.push(rockPt(c, th0 + .03 * Math.sin(h * 14 + j), h)); }
          (big ? strong : faint).push({at: s0, pts: pts});
        }
        together(hi, strong, .6); together(lo, faint, .85);
        /* the water's edge, unbroken */
        lp = []; for(j = 0; j <= 96; j++) lp.push(rockPt(c, j / 96 * Math.PI * 2, .004)); sr.l(lp, .5);
        /* strata: broken arcs at uneven heights, and the two ledges unbroken; laid from the water up, as the rock rises */
        var bands = [[c.l1 + .014, true], [c.l2 + .014, true]];
        for(h = .06 + a.rnd() * .05; h < .93; h += .05 + a.rnd() * .075) bands.push([h, false]);
        bands.sort(function(x1, x2){ return x1[0] - x2[0]; }).forEach(function(bd){
          h = bd[0];
          if(bd[1]){ lp = []; for(j = 0; j <= 96; j++) lp.push(rockPt(c, j / 96 * Math.PI * 2, h)); sr.l(lp, .8); return; }
          th = a.rnd() * 6.28; var end = th + 6.28;
          while(th < end){ var arc = .35 + a.rnd() * 1.0; pts = []; for(var t2 = th; t2 <= Math.min(end, th + arc); t2 += .07) pts.push(rockPt(c, t2, h + .012 * Math.sin(3 * t2 + h * 40))); if(pts.length > 1) sr.l(pts, .7); th += arc + .25 + a.rnd() * .6; }
        });
        /* contour lines, for the eye that looks from above */
        for(i = 1; i <= 12; i++){ lp = []; for(j = 0; j <= 96; j++) lp.push(rockPt(c, j / 96 * Math.PI * 2, i / 13)); iso.l(lp, .7); }
        /* the faces of the cleft catch the light: faults running up them, strata broken across them, a wet band at the water */
        var base = c.side < 0 ? 0 : Math.PI;
        [-.6, -.3, 0, .3, .6].forEach(function(o, n){
          pts = [];
          for(h = (n % 2) * .06; h <= .9 - (n % 3) * .09; h += .02) pts.push(rockPt(c, base + o + .03 * Math.sin(h * 13 + n), h));
          fc.l(pts, .45);
        });
        for(k = 0; k < 46; k++){
          h = .03 + a.rnd() * .82; var o0 = -.72 + a.rnd() * 1.2, o1 = o0 + .1 + a.rnd() * .34, dip = (a.rnd() - .5) * .05; pts = [];
          for(var o2 = o0; o2 <= o1; o2 += .035) pts.push(rockPt(c, base + o2, h + dip * (o2 - o0)));
          if(pts.length > 1) fs.l(pts, .4);
        }
        for(k = 0; k < 16; k++){
          var oo = -.7 + a.rnd() * 1.4, hA = a.rnd() * .7, hB = hA + .05 + a.rnd() * .16; pts = [];
          for(h = hA; h <= hB; h += .012) pts.push(rockPt(c, base + oo + .5 * (h - hA) * (k % 2 ? 1 : -1), h));
          fs.l(pts, .4);
        }
        for(k = 0; k < 40; k++){ var ow = -.78 + k / 40 * 1.56 + a.jr() * .02; fs.s(rockPt(c, base + ow, .004), rockPt(c, base + ow, .014 + a.rnd() * .03)); }
        /* hatching on the side turned away from the light */
        var tA = c.side < 0 ? 1.3 : -.8, tB = c.side < 0 ? 4.0 : 1.85;
        for(k = 0; k < 230; k++){ th = lerp(tA, tB, a.rnd()); h = .04 + a.rnd() * .88; ha.s(rockPt(c, th, h), rockPt(c, th + .045, h - .026 - a.rnd() * .02)); }
        /* fallen blocks at the foot */
        for(k = 0; k < 6; k++){
          th = lerp(tA, tB, (k + a.rnd() * .6) / 6); var bp = rockPt(c, th, 0), br = 5 + a.rnd() * 8, ox = Math.cos(th) * (br + 4 + a.rnd() * 12), oz = Math.sin(th) * (br + 4 + a.rnd() * 12);
          [[1, 0], [.72, .45], [.36, .8]].forEach(function(sq){ lp = []; for(j = 0; j <= 20; j++){ var an = j / 20 * Math.PI * 2; lp.push([bp[0] + ox + Math.cos(an) * br * sq[0] * (1 + .2 * Math.sin(3 * an + k)), br * sq[1], bp[2] + oz + Math.sin(an) * br * sq[0] * .8]); } sr.l(lp, .5); });
        }
        /* a body, drawn in nothing, that hides whatever passes behind the rock */
        var LV = 34, M = 96, pos = [], idx = [];
        for(i = 0; i <= LV; i++){
          var hh2 = i / LV, cx2 = c.x - c.side * c.lean * hh2;
          for(j = 0; j < M; j++){ var q2 = rockPt(c, j / M * Math.PI * 2, hh2), dx = q2[0] - cx2, dz = q2[2] - c.z, r = Math.hypot(dx, dz) || 1, s2 = Math.max(0, 1 - 1.8 / r); pos.push(cx2 + dx * s2, q2[1] - (i === LV ? 1.5 : 0), c.z + dz * s2); }
        }
        for(i = 0; i < LV; i++) for(j = 0; j < M; j++){ var a0 = i * M + j, a1 = i * M + (j + 1) % M, b0 = a0 + M, b1 = a1 + M; idx.push(a0, b0, a1, a1, b0, b1); }
        var topI = LV * M, ci = pos.length / 3; pos.push(c.x - c.side * c.lean, c.H - 2, c.z);
        for(j = 0; j < M; j++) idx.push(topI + j, ci, topI + (j + 1) % M);
        var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); geo.setIndex(idx);
        var body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({colorWrite: false, side: THREE.DoubleSide, fog: false}));
        body.renderOrder = -1; body.frustumCulled = false; sc.add(body);
        return {hi: hi, lo: lo, sr: sr, ha: ha, fc: fc, fs: fs, iso: iso};
      });

      /* shoal lines around each rock: the water's edge from the sea, depth contours from above */
      S.cont = a.G(0x7E9CAE, .42, {jit: 0, k: 0});
      ROCKS.forEach(function(c){
        [1.1, 1.24].forEach(function(s, n){
          var lp = [];
          for(j = 0; j <= 150; j++){ var p = rockPt(c, j / 150 * Math.PI * 2, 0); x = c.x + (p[0] - c.x) * s; z = c.z + (p[2] - c.z) * s; if(c.side < 0) x = Math.min(x, -22 + n * 2); else x = Math.max(x, 22 - n * 2); lp.push([x, .2, z]); }
          S.cont.dash(lp, n ? 3 : 6, 3.4);
        });
      });

      /* a low islet with its daymark: the third landmark of the fix */
      var IS = [-236, 404];
      S.isl = a.G(0xF4EEE2, .7, {jit: .4, k: 0}); S.islLo = a.G(0xCBBFA8, .38, {jit: .5, k: 0});
      for(i = 0; i < 4; i++){
        var rr = 30 - i * 7, lp2 = [];
        for(j = 0; j <= 60; j++){ th = j / 60 * Math.PI * 2; var n2 = rr * (1 + .16 * Math.sin(3 * th + 1 + i) + .08 * Math.sin(7 * th + i * 2)); lp2.push([IS[0] + Math.cos(th) * n2, i * 5.5, IS[1] + Math.sin(th) * n2 * .8]); }
        (i === 0 ? S.isl : S.islLo).l(lp2);
      }
      S.isl.l([[IS[0] - 3.4, 16, IS[1]], [IS[0], 37, IS[1]], [IS[0] + 3.4, 16, IS[1]], [IS[0] - 3.4, 16, IS[1]]], .2); S.isl.s([IS[0], 37, IS[1]], [IS[0], 44, IS[1]]);
      (function(){ var lp = []; for(j = 0; j <= 80; j++){ th = j / 80 * Math.PI * 2; var n3 = 41 * (1 + .14 * Math.sin(3 * th + 1) + .07 * Math.sin(7 * th)); lp.push([IS[0] + Math.cos(th) * n3, .2, IS[1] + Math.sin(th) * n3 * .8]); } S.cont.dash(lp, 5, 3.4); })();

      /* horizon, traced outward from the axis */
      S.hzR = a.G(0xD9CFBC, .36, {jit: 3, fog: false, k: 0}); S.hzL = a.G(0xD9CFBC, .36, {jit: 3, fog: false, k: 0});
      S.hzR.ln([0, 0, -3400], [5600, 0, -3400], 60); S.hzL.ln([0, 0, -3400], [-5600, 0, -3400], 60);

      /* sea: short dashes, the same tile repeated so that it can drift without a seam */
      var PER = 360; S.PER = PER; S.seaG = new THREE.Group(); sc.add(S.seaG);
      S.sea = a.G(0x6E8FA2, .3, {jit: 0, parent: S.seaG});
      var rows = [];
      for(z = 0; z < PER; z += 12){ var patt = [], xx = -1000 + a.rnd() * 30; while(xx < 1000){ var len = 2.5 + a.rnd() * 10; patt.push([xx, len]); xx += len + 12 + a.rnd() * 36; } rows.push([z, patt]); }
      for(var tile = -7; tile <= 3; tile++) rows.forEach(function(r){ r[1].forEach(function(p){ S.sea.s([p[0], 0, tile * PER + r[0]], [p[0] + p[1], 0, tile * PER + r[0]]); }); });
      /* the light on the water, along the axis of the narrows: three families that shimmer out of step */
      S.gl = [a.G(0xF6E9CC, .62, {jit: 0, parent: S.seaG}), a.G(0xF6E9CC, .5, {jit: 0, parent: S.seaG}), a.G(0xEAD9B4, .44, {jit: 0, parent: S.seaG})];
      var glRows = [];
      for(z = 0; z < PER; z += 4.5){ var cnt = 1 + (a.rnd() < .45 ? 1 : 0); for(k = 0; k < cnt; k++){ var gx = (a.rnd() + a.rnd() + a.rnd() - 1.5) * 15, gL = 2.5 + a.rnd() * 11; glRows.push([z + a.rnd() * 3, gx, gL, Math.floor(a.rnd() * 3)]); } }
      for(tile = -7; tile <= 3; tile++) glRows.forEach(function(r){ S.gl[r[3]].s([r[1] - r[2] / 2, .1, tile * PER + r[0]], [r[1] + r[2] / 2, .1, tile * PER + r[0]]); });

      /* stars: tiny crosses, far away */
      function dir(az, alt){ az *= D2R; alt *= D2R; return [Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)]; }
      S.st1 = a.G(0xE8E1D2, .55, {jit: 0, fog: false}); S.st2 = a.G(0xE8E1D2, .26, {jit: 0, fog: false});
      for(i = 0; i < 180; i++){
        var az = -82 + a.rnd() * 164, alt = 2 + Math.pow(a.rnd(), .85) * 46, v = dir(az, alt), R = 6000, s = 4 + a.rnd() * 9;
        var c0 = [v[0] * R, v[1] * R, v[2] * R], u = [Math.cos(az * D2R), 0, Math.sin(az * D2R)], w = [v[1] * u[2] - v[2] * u[1], v[2] * u[0] - v[0] * u[2], v[0] * u[1] - v[1] * u[0]];
        var g = a.rnd() < .28 ? S.st1 : S.st2;
        g.s([c0[0] - u[0] * s, c0[1] - u[1] * s, c0[2] - u[2] * s], [c0[0] + u[0] * s, c0[1] + u[1] * s, c0[2] + u[2] * s]);
        g.s([c0[0] - w[0] * s, c0[1] - w[1] * s, c0[2] - w[2] * s], [c0[0] + w[0] * s, c0[1] + w[1] * s, c0[2] + w[2] * s]);
      }

      /* lights */
      function radial(stops, size){ return a.tex(function(x2, w2){ var gr = x2.createRadialGradient(w2 / 2, w2 / 2, 0, w2 / 2, w2 / 2, w2 / 2); stops.forEach(function(st){ gr.addColorStop(st[0], st[1]); }); x2.fillStyle = gr; x2.fillRect(0, 0, w2, w2); }, size, size); }
      var warm = radial([[0, 'rgba(255,238,204,1)'], [.22, 'rgba(240,212,158,.5)'], [1, 'rgba(240,212,158,0)']], 128);
      var pale = radial([[0, 'rgba(255,250,238,1)'], [.18, 'rgba(246,236,214,.55)'], [1, 'rgba(240,226,196,0)']], 128);
      /* the blade of light between the rocks: a column standing on the horizon, fading as it rises */
      var dawnT = a.tex(function(x2, w2, h2){
        var gh = x2.createLinearGradient(0, 0, w2, 0);
        [[0, 'rgba(232,214,176,0)'], [.26, 'rgba(236,218,182,.14)'], [.4, 'rgba(246,230,198,.56)'], [.5, 'rgba(255,247,230,1)'], [.6, 'rgba(246,230,198,.56)'], [.74, 'rgba(236,218,182,.14)'], [1, 'rgba(232,214,176,0)']].forEach(function(st){ gh.addColorStop(st[0], st[1]); });
        x2.fillStyle = gh; x2.fillRect(0, 0, w2, h2);
        x2.globalCompositeOperation = 'destination-in';
        var gv = x2.createLinearGradient(0, 0, 0, h2);
        [[0, 0], [.2, .14], [.42, .46], [.56, .86], [.6, 1], [.615, .5], [.7, .2], [1, 0]].forEach(function(st){ gv.addColorStop(st[0], 'rgba(0,0,0,' + st[1] + ')'); });
        x2.fillStyle = gv; x2.fillRect(0, 0, w2, h2);
      }, 128, 256);
      var soft = radial([[0, 'rgba(240,222,186,.9)'], [.3, 'rgba(226,206,168,.42)'], [.65, 'rgba(206,196,172,.12)'], [1, 'rgba(206,196,172,0)']], 128);
      S.halo = a.sprite(soft, 1620, 1230); S.halo.position.set(0, 110, -3420);
      S.dawn = a.sprite(dawnT, 450, 1880); S.dawn.position.set(0, 188, -3410);
      S.core = a.sprite(pale, 390, 180); S.core.position.set(0, 10, -3405);

      /* ----- the chart: what the eye reads once it has risen ----- */
      S.grid = byP(0x8EA2AF, .15, [.05, .17], {jit: 0});
      for(x = -800; x <= 800; x += 200) S.grid.ln([x, .2, 900], [x, .2, -700], 16);
      for(z = 900; z >= -700; z -= 200) S.grid.ln([-800, .2, z], [800, .2, z], 16);
      S.snd = byP(0x9DB1BD, .34, [.08, .2], {jit: 0});
      var placed = 0, guard = 0;
      while(placed < 44 && guard++ < 900){
        x = -620 + a.rnd() * 1240; z = -330 + a.rnd() * 1050;
        if(Math.abs(x) < 46 || ROCKS.some(function(c){ return Math.hypot(x - c.x, z - c.z) < 150; }) || Math.hypot(x - IS[0], z - IS[1]) < 62) continue;
        S.snd.s([x - 4.5, .2, z], [x + 4.5, .2, z]); S.snd.s([x, .2, z - 4.5], [x, .2, z + 4.5]); placed++;
      }
      /* north lies to the left: the Bear will be on that hand */
      S.north = byP(0xD9CFBC, .6, [.1, .2], {jit: .5});
      var NO = [330, 470];
      S.north.l(ringPts(NO[0], NO[1], 17, 40)); S.north.ln([NO[0] + 30, .3, NO[1]], [NO[0] - 62, .3, NO[1]], 10);
      S.north.l([[NO[0] - 48, .3, NO[1] - 7], [NO[0] - 62, .3, NO[1]], [NO[0] - 48, .3, NO[1] + 7]], 0); S.north.ln([NO[0], .3, NO[1] - 24], [NO[0], .3, NO[1] + 24], 6);
      /* the judgment, astern: a mooring left behind */
      var J = [-44, 455], F = [-15, 285];
      S.jm = byP(0xF4EEE2, .9, [.1, .15], {jit: .3});
      S.jm.l(ringPts(J[0], J[1], 11, 44)); S.jm.l(ringPts(J[0], J[1], 4, 20), 0);
      [0, 1, 2, 3].forEach(function(n){ var an = n * Math.PI / 2 + Math.PI / 4; S.jm.s([J[0] + Math.cos(an) * 11, .3, J[1] + Math.sin(an) * 11], [J[0] + Math.cos(an) * 17, .3, J[1] + Math.sin(an) * 17]); });
      /* the route from the judgment to the narrows, with its eight weeks */
      var rt = spline([[J[0], J[1] - 13], [-33, 380], [F[0], F[1]], [-3, 170], [0, 70], [0, 0], [0, -70]], 4);
      S.route = byP(0xD8C9A8, .86, [.13, .31], {jit: 0}); S.route.dash(rt, 11, 7);
      S.week = byP(0xD8C9A8, .62, [.14, .31], {jit: 0});
      var acc = 0, tot = 0, nx = 1; for(i = 1; i < rt.length; i++) tot += Math.hypot(rt[i][0] - rt[i - 1][0], rt[i][2] - rt[i - 1][2]);
      var toGap = tot - 70;
      for(i = 1; i < rt.length; i++){
        var pa = rt[i - 1], pb = rt[i], d = Math.hypot(pb[0] - pa[0], pb[2] - pa[2]); acc += d;
        if(nx <= 8 && acc >= toGap * nx / 8 - .01){ var ux = (pb[0] - pa[0]) / d, uz = (pb[2] - pa[2]) / d, tl = nx === 4 || nx === 8 ? 9 : 5.5; S.week.s([pb[0] - uz * tl, .3, pb[2] + ux * tl], [pb[0] + uz * tl, .3, pb[2] - ux * tl]); nx++; }
      }
      /* the fix: three bearings meet where one stands */
      S.brg = byP(0xD8C9A8, .72, [.25, .345], {jit: .6});
      [[-76, 4], [74, -10], IS].forEach(function(mk){ var dx = F[0] - mk[0], dz = F[1] - mk[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L; S.brg.ln([mk[0], .3, mk[1]], [F[0] + ux * 30, .3, F[1] + uz * 30], 30); });
      S.fix = byP(0xF4EEE2, .96, [.33, .37], {jit: .25});
      S.fix.l(ringPts(F[0], F[1], 8.5, 40));
      [0, 1, 2, 3].forEach(function(n){ var an = n * Math.PI / 2; S.fix.s([F[0] + Math.cos(an) * 3, .3, F[1] + Math.sin(an) * 3], [F[0] + Math.cos(an) * 15, .3, F[1] + Math.sin(an) * 15]); });
      S.fixGlow = a.sprite(warm, 70, 70, {depth: false}); S.fixGlow.position.set(F[0], 1, F[1]);

      /* beyond the narrows: three routes */
      S.plan = byP(0xE4D6B6, .85, [.835, .93], {jit: 0, fog: false});
      var pl = []; for(z = -74; z >= -2500; z -= 6) pl.push([0, .3, z]); S.plan.dash(pl, 17, 12);
      S.ces = byP(0xD8C9A8, .8, [.855, .95], {jit: 0, fog: false});
      var FK = mob ? -1000 : -700, CE = mob ? [250, -1950] : [330, -1560], AR = mob ? [-230, -1800] : [-200, -1290];
      S.ces.dash(bez([0, FK], [CE[0] * .12, lerp(FK, CE[1], .52)], CE, 130), 14, 10); S.ces.l(ringPts(CE[0] + 6, CE[1] - 14, 15, 36), 1);
      S.arr = byP(0xD8C9A8, .8, [.875, .96], {jit: 0, fog: false});
      S.arr.dash(bez([0, FK], [AR[0] * .15, lerp(FK, AR[1], .52)], AR, 100), 14, 10); S.arr.l(ringPts(AR[0] - 5, AR[1] - 13, 15, 36), 1); S.arr.s([AR[0] - 23, .3, AR[1] - 13], [AR[0] + 13, .3, AR[1] - 13]);
      S.fork = byP(0xF4EEE2, .9, [.84, .87], {jit: .3, fog: false}); S.fork.l(ringPts(0, FK, 7, 30));

      /* the Bear, low on the left: seven lights and a fine gold wire */
      var eye = [0, mob ? 190 : 150, -246], RB = 6200, azB = mob ? -5.6 : -17, altB = mob ? 7 : 6, scB = mob ? .4 : .56, ym = 18.7;
      function bearAt(b){ var an = (b[0] - 141) * D2R, bx = -b[1] * Math.sin(an) * scB, by = (b[1] * Math.cos(an) - ym) * scB, v2 = dir(azB + bx / Math.cos(altB * D2R), altB - by); return [eye[0] + v2[0] * RB, eye[1] + v2[1] * RB, eye[2] + v2[2] * RB]; }
      var BP = BEAR.map(bearAt);
      S.wire = byP(0xD8C9A8, .78, [.885, .985], {jit: 9, fog: false});
      FIG.forEach(function(e){ S.wire.ln(BP[e[0]], BP[e[1]], 14); });
      S.spark = a.G(0xF4EEE2, .9, {jit: 0, fog: false});
      S.bearGlows = BEAR.map(function(b, n){
        var c1 = BP[n], sz = 16 - 4 * (b[2] - 1.8);
        S.spark.s([c1[0] - sz, c1[1], c1[2]], [c1[0] + sz, c1[1], c1[2]]); S.spark.s([c1[0], c1[1] - sz, c1[2]], [c1[0], c1[1] + sz, c1[2]]);
        var gs = (250 - 60 * (b[2] - 1.8)) * (mob ? .8 : 1), gl = a.sprite(warm, gs, gs, {depth: false}); gl.position.set(c1[0], c1[1], c1[2]); gl.userData.o = 1 - .16 * (b[2] - 1.8); return gl;
      });
      var al = bearAt(ALCOR), alc = a.sprite(pale, 84, 84, {depth: false}); alc.position.set(al[0] + 26, al[1] + 30, al[2]); alc.userData.o = .62; S.bearGlows.push(alc);

      /* the dove that goes first: a few strokes, redrawn every frame */
      S.dvPos = new Float32Array(7 * 2 * 3);
      var dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(S.dvPos, 3));
      S.dove = new THREE.LineSegments(dg, new THREE.LineBasicMaterial({color: 0xFBF6EA, transparent: true, opacity: 0, depthWrite: false, fog: false}));
      S.dove.frustumCulled = false; S.dove.visible = false; sc.add(S.dove);
      S.dvGlow = a.sprite(pale, 11, 11); S.dvT = null; S.dvA = [0, 0, 0];

      /* camera keys: hero, chart, chart nearer, water level, in the narrows, open sea */
      S.KD = [
        {p: [0, 7, 1060], t: [0, 66, 0], f: 30, fog: [380, 2600]},
        {p: [0, 1500, 380], t: [0, 0, 130], fog: [1250, 4600]},
        {p: [0, 1000, 330], t: [0, 0, 60], fog: [820, 3500]},
        {p: [0, 6, 300], t: [0, 50, 0], fog: [220, 2000]},
        {p: [0, 15, -46], t: [0, 40, -600], fog: [220, 2100]},
        {p: [0, 150, -200], t: [-30, 62, -1400], f: 34, fog: [300, 2500]}
      ];
      S.KD.wide = 15; S.KD.sx = [.2, .14, .14, .13, 0, .16]; S.KD.sy = [0, 0, 0, 0, 0, 0];
      S.KM = [
        {p: [0, 9, 1250], t: [0, 60, 0], f: 46, fog: [420, 3000]},
        {p: [0, 1700, 360], t: [0, 0, 220], fog: [1400, 5000]},
        {p: [0, 1150, 300], t: [0, 0, 120], fog: [950, 3800]},
        {p: [0, 6, 330], t: [0, 40, 0], fog: [240, 2100]},
        {p: [0, 16, -46], t: [0, 44, -600], fog: [240, 2200]},
        {p: [0, 190, -200], t: [0, 60, -1400], f: 50, fog: [320, 3000]}
      ];
      S.KM.wide = 12; S.KM.sx = [0, 0, 0, 0, 0, 0]; S.KM.sy = [.18, .06, .06, 0, 0, 0];

      /* what the page says, and where */
      var sec = a.sec;
      S.veil = sec.querySelector('.pz-veil'); S.title = sec.querySelector('.pz-title');
      S.items = [].slice.call(sec.querySelectorAll('.pz-slot > *'));
      S.state = [];
      var V = function(px, py, pz){ return new THREE.Vector3(px, py, pz); };
      var where = {
        jugement: {v: V(J[0] + 22, 0, J[1]), w: function(P){ return sm(P, .13, .17) * (1 - sm(P, .3, .35)); }, ax: 0, ay: -50},
        ici: {v: V(F[0] + 22, 0, F[1]), w: function(P){ return sm(P, .34, .38) * (1 - sm(P, .46, .52)); }, ax: 0, ay: -50},
        audience: mob ? {v: V(0, 0, -150), w: function(P){ return sm(P, .27, .32) * (1 - sm(P, .44, .5)); }, ax: -50, ay: -120}
                      : {v: V(176, 0, -10), w: function(P){ return sm(P, .27, .32) * (1 - sm(P, .44, .5)); }, ax: 0, ay: -50},
        nord: {v: V(NO[0] - 78, 0, NO[1]), w: function(P){ return mob ? 0 : sm(P, .16, .2) * (1 - sm(P, .3, .36)); }, ax: -100, ay: -50},
        plan: {v: V(12, 0, mob ? -1700 : -1250), w: function(P){ return sm(P, .9, .95); }, ax: 0, ay: -50},
        cession: {v: V(CE[0] + 6, 0, CE[1] - 14), w: function(P){ return sm(P, .92, .97); }, ax: mob ? -80 : -50, ay: -230},
        arret: {v: V(AR[0] - 5, 0, AR[1] - 13), w: function(P){ return sm(P, .94, .985); }, ax: mob ? -20 : -50, ay: -230}
      };
      S.labs = [].slice.call(sec.querySelectorAll('.pz-lab')).map(function(el){ var d2 = where[el.getAttribute('data-lab')]; return d2 ? {el: el, v: d2.v, w: d2.w, ax: d2.ax, ay: d2.ay, on: false} : null; }).filter(Boolean);
    },

    update: function(P, t, a, intro){
      var S = this, cam = a.camera, mob = a.mobile(), K = mob ? S.KM : S.KD, still = !a.live, n, c;
      var E = [0, sm(P, .03, .19), sm(P, .30, .43), sm(P, .45, .58), sm(P, .66, .80), sm(P, .80, .92)];
      var p = K[0].p.slice(), q = K[0].t.slice(), fn = K[0].fog[0], ff = K[0].fog[1], shx = K.sx[0], shy = K.sy[0];
      for(n = 1; n <= 5; n++){
        for(c = 0; c < 3; c++){ p[c] = lerp(p[c], K[n].p[c], E[n]); q[c] = lerp(q[c], K[n].t[c], E[n]); }
        fn = lerp(fn, K[n].fog[0], E[n]); ff = lerp(ff, K[n].fog[1], E[n]); shx = lerp(shx, K.sx[n], E[n]); shy = lerp(shy, K.sy[n], E[n]);
      }
      /* a hold is never quite still: one keeps closing on the narrows, then drifting out to sea */
      var swing = Math.sin(Math.PI * E[3]);
      p[0] += (mob ? 100 : 150) * swing; p[2] += 250 * swing;
      p[2] -= 34 * sm(P, .58, .66) * (1 - E[4]) + 46 * sm(P, .92, 1);
      var low = 1 - sm(p[1], 24, 300), roll = 0;
      if(!still){ p[1] += low * (.9 * Math.sin(t * .9) + .45 * Math.sin(t * 1.63 + 1)); p[0] += low * 2.4 * Math.sin(t * .31); roll = low * .006 * Math.sin(t * .7 + .4); }
      cam.position.set(p[0], p[1], p[2]); cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(q[0], q[1], q[2]);
      var fov = lerp(K[0].f, K[5].f, E[5]) + K.wide * Math.sin(Math.PI * E[4]);
      if(Math.abs(fov - cam.fov) > .005){ cam.fov = fov; cam.updateProjectionMatrix(); }
      a.shift(shx, shy);
      a.scene.fog.near = fn; a.scene.fog.far = ff;

      /* opening: the rocks rise from the water, the horizon runs out, then the light comes between them */
      S.rocks.forEach(function(r, i){ var k = sm(intro, .15 + i * .32, 2.2 + i * .32); r.hi.k = r.lo.k = r.sr.k = r.fc.k = r.iso.k = k; r.ha.k = r.fs.k = sm(intro, 1.3 + i * .3, 2.9 + i * .3); });
      S.isl.k = S.islLo.k = sm(P, .04, .13); S.cont.k = sm(intro, .7, 2.3);
      S.hzR.k = S.hzL.k = sm(intro, .1, 1.7);
      var high = sm(p[1], 160, 760);
      /* from above a rock is read by its contours, from the water by the lines that run up it */
      S.rocks.forEach(function(r){ r.iso.o = high; r.lo.o = 1 - .72 * high; r.ha.o = 1 - high; r.sr.o = 1 - .6 * high; });
      S.sea.o = sm(intro, 0, 1.4) * lerp(1, .3, high) * lerp(1, .62, E[5]);
      S.seaG.position.z = still ? 0 : (t * 5) % S.PER;
      for(n = 0; n < 3; n++) S.gl[n].o = sm(intro, 2.1, 3.6) * (1 - high) * (still ? .8 : .55 + .45 * Math.sin(t * (1.7 + n * .55) + n * 2.1));
      S.st1.o = sm(intro, .6, 2.2) * (still ? 1 : .8 + .2 * Math.sin(t * 1.3)); S.st2.o = sm(intro, .9, 2.6) * (still ? 1 : .75 + .25 * Math.sin(t * .8 + 2));
      var dawnIn = sm(intro, 1.25, 3.1), open = sm(P, .70, .90);
      S.dawn.material.opacity = dawnIn * lerp(1, .5, open) * (still ? .92 : .86 + .14 * Math.sin(t * 1.26));
      S.dawn.scale.set(lerp(450, 4200, open), lerp(1880, 1700, open), 1); S.dawn.position.y = .1 * S.dawn.scale.y;
      S.core.material.opacity = dawnIn * lerp(.8, .6, open); S.core.scale.set(lerp(390, 470, open), lerp(180, 150, open), 1);
      S.halo.material.opacity = sm(intro, 1.0, 3.0) * lerp(1, .8, open) * (still ? .5 : .46 + .05 * Math.sin(t * .9)); S.halo.scale.set(lerp(1620, 4200, open), lerp(1230, 1320, open), 1);

      /* the chart is traced as one scrolls, and leaves when the eye comes back down */
      for(n = 0; n < S.byP.length; n++){ var g = S.byP[n]; g.k = cl((P - g.t[0]) / (g.t[1] - g.t[0]), 0, 1); }
      var chart = 1 - sm(P, .46, .56);
      S.grid.o = S.snd.o = S.brg.o = S.week.o = S.jm.o = chart; S.north.o = mob ? 0 : chart; S.fix.o = 1 - sm(P, .5, .58);
      S.route.o = 1 - .5 * sm(P, .5, .6);
      S.fixGlow.material.opacity = sm(P, .34, .38) * (1 - sm(P, .5, .58)) * (still ? .8 : .62 + .38 * Math.sin(t * 2.4));
      var bIn = sm(P, .86, .95); S.spark.o = bIn;
      for(n = 0; n < S.bearGlows.length; n++) S.bearGlows[n].material.opacity = bIn * S.bearGlows[n].userData.o * (still ? 1 : .86 + .14 * Math.sin(t * 1.1 + n * 1.7));

      /* the dove: it leaves when one faces the narrows, and goes through first */
      var dvOn = false;
      if(!still){
        if(S.dvT === null && P > .585 && P < .8){ S.dvT = t; S.dvA = [p[0] + 24, p[1] + 5, p[2] - 44]; }
        if(P < .5) S.dvT = null;
        var u = S.dvT === null ? -1 : (t - S.dvT) / 6.5;
        if(u >= 0 && u <= 1){
          var A = S.dvA, B = [10, 62, 150], C = [0, 96, -180], D = [0, 150, -1150], uu = Math.pow(u, 1.2), w1 = 1 - uu;
          var bp = function(i){ return w1 * w1 * w1 * A[i] + 3 * w1 * w1 * uu * B[i] + 3 * w1 * uu * uu * C[i] + uu * uu * uu * D[i]; };
          var bd = function(i){ return 3 * w1 * w1 * (B[i] - A[i]) + 6 * w1 * uu * (C[i] - B[i]) + 3 * uu * uu * (D[i] - C[i]); };
          var o = [bp(0), bp(1), bp(2)], f = [bd(0), bd(1), bd(2)], fl = Math.hypot(f[0], f[1], f[2]) || 1; f = [f[0] / fl, f[1] / fl, f[2] / fl];
          var r = [-f[2], 0, f[0]], rl = Math.hypot(r[0], r[2]) || 1; r = [r[0] / rl, 0, r[2] / rl];
          var up = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
          var beat = Math.sin(t * 11), lag = Math.sin(t * 11 - .8), sc2 = 1.25, d = S.dvPos, ix = 0;
          var pt = function(fr, rg, u2){ return [o[0] + (f[0] * fr + r[0] * rg + up[0] * u2) * sc2, o[1] + (f[1] * fr + r[1] * rg + up[1] * u2) * sc2, o[2] + (f[2] * fr + r[2] * rg + up[2] * u2) * sc2]; };
          var seg = function(a1, b1){ d[ix++] = a1[0]; d[ix++] = a1[1]; d[ix++] = a1[2]; d[ix++] = b1[0]; d[ix++] = b1[1]; d[ix++] = b1[2]; };
          var head = pt(1.6, 0, .1), tail = pt(-1.5, 0, 0);
          seg(tail, head); seg(tail, pt(-2.5, .55, -.05)); seg(tail, pt(-2.5, -.55, -.05));
          [1, -1].forEach(function(sd){ var el = pt(.2, sd * 2.2, .35 + .95 * beat), tip = pt(-.5, sd * 4.5, .2 + 2.3 * lag); seg(pt(.35, sd * .3, .05), el); seg(el, tip); });
          S.dove.geometry.attributes.position.needsUpdate = true;
          var dop = sm(u, 0, .05) * (1 - sm(u, .7, 1));
          S.dove.material.opacity = dop; S.dvGlow.position.set(o[0], o[1], o[2]); S.dvGlow.material.opacity = dop * .3; dvOn = dop > .003;
        }
      }
      S.dove.visible = dvOn; if(!dvOn) S.dvGlow.material.opacity = 0;

      /* words on the drawing */
      for(n = 0; n < S.labs.length; n++){
        var L = S.labs[n], lo = still ? 0 : L.w(P);
        if(lo <= .004){ if(L.on){ L.el.style.opacity = 0; L.on = false; } continue; }
        var s = a.proj(L.v);
        if(s[2] > 1){ if(L.on){ L.el.style.opacity = 0; L.on = false; } continue; }
        L.el.style.transform = 'translate3d(' + s[0].toFixed(1) + 'px,' + s[1].toFixed(1) + 'px,0) translate(' + L.ax + '%,' + L.ay + '%)'; L.el.style.opacity = lo.toFixed(3); L.on = true;
      }
      if(still) return;
      var flags = [P > .15 && P < .445, P > .05 && P < .15, P > .17 && P < .295, P > .31 && P < .445, P > .565 && P < .665, P > .865];
      if(flags[0] !== S.state[0]){ S.state[0] = flags[0]; if(S.title) S.title.classList.toggle('on', flags[0]); }
      for(n = 0; n < S.items.length; n++) if(flags[n + 1] !== S.state[n + 1]){ S.state[n + 1] = flags[n + 1]; S.items[n].classList.toggle('on', !!flags[n + 1]); }
      var veil = (1 - sm(P, .6, .68)) * lerp(1, .82, E[1]);
      if(S.veil && Math.abs(veil - (S.vl || 0)) > .004){ S.vl = veil; S.veil.style.opacity = veil.toFixed(3); }
    }
  });
})();
