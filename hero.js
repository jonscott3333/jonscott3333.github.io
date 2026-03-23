(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Continent polygons [lon, lat], clockwise ── */
  const LAND = [
    /* North America */
    [[-168,54],[-140,70],[-95,72],[-70,68],[-55,52],[-53,46],[-66,44],
     [-70,41],[-75,39],[-80,32],[-81,25],[-90,29],[-97,26],[-105,19],
     [-87,15],[-83,9],[-85,11],[-90,14],[-92,15],[-105,22],[-110,24],
     [-118,32],[-122,37],[-124,48],[-130,55],[-140,58],[-152,58],[-168,54]],
    /* South America */
    [[-82,8],[-77,8],[-75,11],[-62,12],[-50,3],[-35,-5],[-35,-9],
     [-38,-15],[-40,-22],[-45,-28],[-49,-32],[-52,-34],[-58,-38],
     [-62,-42],[-65,-55],[-68,-56],[-73,-50],[-75,-42],[-75,-35],
     [-72,-18],[-70,-10],[-80,-2],[-80,1],[-77,8],[-82,8]],
    /* Europe */
    [[-9,36],[-8,44],[-2,44],[3,43],[7,44],[13,44],[14,40],[16,37],
     [18,40],[20,42],[24,41],[28,43],[30,46],[28,50],[32,52],[26,56],
     [24,58],[22,60],[25,65],[28,70],[20,72],[14,72],[5,70],[-2,65],
     [-8,58],[-6,52],[-6,48],[-4,48],[-2,44],[-9,36]],
    /* Africa */
    [[-17,15],[-15,20],[-13,27],[-5,35],[0,37],[5,37],[12,37],[18,37],
     [25,37],[32,31],[37,22],[43,12],[44,11],[45,2],[42,-2],[40,-10],
     [35,-18],[35,-25],[32,-30],[27,-35],[18,-35],[12,-30],[10,-18],
     [8,-5],[2,5],[0,10],[-5,15],[-17,15]],
    /* Asia (main body incl. Indian subcontinent) */
    [[26,42],[28,50],[32,52],[38,55],[50,55],[60,65],[80,72],[100,72],
     [120,72],[140,68],[165,62],[170,55],[168,50],[145,43],[135,35],
     [130,32],[122,24],[114,22],[108,12],[103,2],[100,5],[100,13],
     [95,28],[90,25],[88,22],[80,10],[77,8],[72,18],[68,24],[62,22],
     [56,24],[50,30],[44,37],[38,42],[34,37],[28,43],[26,42]],
    /* Australia */
    [[114,-22],[117,-32],[122,-35],[130,-34],[138,-36],[147,-38],
     [151,-32],[153,-26],[152,-18],[145,-16],[138,-12],[130,-12],
     [128,-15],[122,-18],[114,-22]],
    /* Greenland */
    [[-70,76],[-25,84],[-18,77],[-20,70],[-45,60],[-55,62],[-70,76]],
  ];

  /* ── Financial hub coordinates [lon, lat] ── */
  const HUBS = [
    [-74,   41   ],  // New York
    [  0,   51   ],  // London
    [  8.7, 50   ],  // Frankfurt
    [ 55.3, 25.2 ],  // Dubai
    [103.8,  1.3 ],  // Singapore
    [139.7, 35.7 ],  // Tokyo
    [-46.6,-23.5 ],  // São Paulo
  ];

  /* ── Arcs [hubIndex A, hubIndex B] ── */
  const ARCS = [
    [0, 1],  // New York  ↔ London
    [1, 2],  // London    ↔ Frankfurt
    [1, 3],  // London    ↔ Dubai
    [3, 4],  // Dubai     ↔ Singapore
    [4, 5],  // Singapore ↔ Tokyo
    [0, 6],  // New York  ↔ São Paulo
  ];

  /* ── Mercator projection ── */
  function project(lon, lat, W, H) {
    return [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
  }

  /* ── Ray-casting point-in-polygon ── */
  function pip(px, py, poly, W, H) {
    let inside = false;
    const n = poly.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = project(poly[i][0], poly[i][1], W, H);
      const [xj, yj] = project(poly[j][0], poly[j][1], W, H);
      if ((yi > py) !== (yj > py) &&
          px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  function isLand(px, py, W, H) {
    return LAND.some(poly => pip(px, py, poly, W, H));
  }

  /* ── Main draw ── */
  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0c1628';
    ctx.fillRect(0, 0, W, H);

    // Dot grid
    const SP = Math.round(Math.max(14, W / 88));
    for (let x = SP * 0.5; x < W; x += SP) {
      for (let y = SP * 0.5; y < H; y += SP) {
        const land = isLand(x, y, W, H);
        ctx.globalAlpha = land ? 0.50 : 0.10;
        ctx.fillStyle  = land ? '#93c5fd' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(x, y, land ? 1.6 : 1.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Hub screen positions
    const pts = HUBS.map(([lo, la]) => project(lo, la, W, H));

    // Connection arcs
    ctx.lineWidth = 1.2;
    ARCS.forEach(([a, b]) => {
      const [x1, y1] = pts[a], [x2, y2] = pts[b];
      const d   = Math.hypot(x2 - x1, y2 - y1);
      const cpx = (x1 + x2) / 2;
      const cpy = (y1 + y2) / 2 - d * 0.22;

      // Fade arc near endpoints
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0,    'rgba(147,197,253,0.0)');
      g.addColorStop(0.25, 'rgba(147,197,253,0.45)');
      g.addColorStop(0.75, 'rgba(147,197,253,0.45)');
      g.addColorStop(1,    'rgba(147,197,253,0.0)');
      ctx.strokeStyle = g;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cpx, cpy, x2, y2);
      ctx.stroke();
    });

    // Hub glow + dot
    pts.forEach(([x, y]) => {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
      glow.addColorStop(0, 'rgba(147,197,253,0.6)');
      glow.addColorStop(1, 'rgba(147,197,253,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle   = '#e0f2ff';
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  /* ── Resize handler ── */
  function resize() {
    const el = canvas.parentElement;
    canvas.width  = el.offsetWidth;
    canvas.height = el.offsetHeight;
    draw();
  }

  window.addEventListener('resize', resize);
  resize();
}());
