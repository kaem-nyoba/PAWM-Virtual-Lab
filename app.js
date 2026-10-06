/* Sportslab — no server, build step, or runtime dependencies. */
(() => {
  'use strict';
  const P = SportsPhysics;
  const $ = id => document.getElementById(id);
  const canvas = $('court'), display = canvas.getContext('2d');
  const VIEW = 640;
  const pixel = document.createElement('canvas'); pixel.width = VIEW; pixel.height = 260;
  const ctx = pixel.getContext('2d');
  const scenery = document.createElement('canvas'); scenery.width = VIEW; scenery.height = 260;
  const bg = scenery.getContext('2d');
  let SCALE = 28;
  const FLOOR = 217, ORIGIN = 18;
  const colors = ['#ffe394', '#b5ddff'];
  const storageKey = 'sportslab.experiments.v1';
  const levels = [
    { name: 'Tembakan pertama', distance: 5, hint: true, description: 'Masukkan bola dari jarak 5 m. Prediksi lintasan membantumu.' },
    { name: 'Mundur selangkah', distance: 8, hint: true, description: 'Sekarang jaraknya 8 m. Sesuaikan sudut dan kecepatan.' },
    { name: 'Percaya eksperimenmu', distance: 10, hint: false, description: 'Tembakan 10 m tanpa prediksi. Gunakan catatan eksperimenmu.' }
  ];
  let parameters = { angle: 48, speed: 9.6, distance: 8, height: 1.9 };
  let mode = 'lab', level = 0, attempts = 0, levelPassed = false;
  let shot = null, flightTime = 0, running = false, paused = false, lastFrame = null;
  let trail = [], selected = [], records = [], savedShot = false, flashUntil = 0;
  let storageAvailable = true;
  let steps = 0, baseHeight = 1.9;
  const wx = x => ORIGIN + x * SCALE;
  const wy = y => FLOOR - y * SCALE;
  const round = (value, digits = 2) => Number(value).toFixed(digits);
  const resultLabels = { score: 'Masuk!', rim: 'Kena ring', board: 'Kena papan', ground: 'Ke lantai' };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function cloud(x, y, size = 1) {
    bg.save(); bg.translate(x, y); bg.scale(size, size);
    const parts = [[0,12,72,12],[9,5,15,19],[19,-3,20,24],[39,3,18,20],[55,10,20,13],[4,19,78,5]];
    for (const p of parts) rect(bg, ...p, '#b8dee0');
    for (const p of [[4,11,65,10],[12,4,12,15],[22,-4,13,22],[38,2,14,19],[55,11,13,8],[9,17,64,4]]) rect(bg,...p,'#e3f0e6');
    for (const p of [[24,-5,10,8],[15,5,8,5],[39,1,11,6],[7,12,13,4]]) rect(bg,...p,'#f4f8e7');
    bg.restore();
  }
  function hill(x, y, width, height, color, highlight) {
    for (let r = 0; r < height; r += 5) {
      const extent = width * Math.sqrt(r / height);
      rect(bg, x - extent, y + r, extent * 2, 5, color);
      rect(bg, x - extent, y + r, Math.max(5, extent * .45), 5, highlight);
    }
  }
  function tree(x, y, size = 1) {
    bg.save(); bg.translate(x,y); bg.scale(size,size);
    rect(bg,-2,-5,5,24,'#687147');
    for (const [rx,ry,rw,rh,c] of [[-13,-17,27,10,'#416d48'],[-17,-29,33,13,'#477c4c'],[-12,-40,25,13,'#578e51'],[-7,-49,15,12,'#639c56'],[-10,-34,10,11,'#83b45e'],[-5,-44,7,9,'#9ac76c'],[-12,-20,9,9,'#5b9450']]) rect(bg,rx,ry,rw,rh,c);
    bg.restore();
  }
  function drawScenery() {
    rect(bg,0,0,480,260,'#92cdda');
    rect(bg,0,0,480,36,'#83c5d6'); rect(bg,0,36,480,37,'#8acada'); rect(bg,0,73,480,42,'#98d0d9'); rect(bg,0,115,480,80,'#addad9');
    // A stepped sun and clouds, all authored as crisp rectangles.
    rect(bg,329,22,25,36,'#e8be60');rect(bg,323,28,37,24,'#e8be60');rect(bg,326,25,31,30,'#f5d37a');rect(bg,330,29,23,22,'#fff0ab');rect(bg,334,26,15,27,'#fff0ab');
    cloud(63,43,.85);cloud(221,24,.63);cloud(399,56,.9);cloud(-31,95,.7);cloud(145,88,.58);
    hill(15,129,128,67,'#87b49b','#99c6a6');hill(272,119,133,72,'#83b39b','#9ac7a5');hill(431,102,137,91,'#76a38d','#8db69b');
    // Distant lookout tower ties the park scenery to the reference's adventure world.
    rect(bg,428,96,26,61,'#849fa3');rect(bg,433,96,7,61,'#9bb3af');rect(bg,423,93,36,7,'#748f96');
    rect(bg,423,87,6,7,'#849fa3');rect(bg,437,87,7,7,'#849fa3');rect(bg,452,87,7,7,'#849fa3');
    rect(bg,438,108,8,15,'#57747f');rect(bg,440,105,4,5,'#57747f');rect(bg,438,137,8,20,'#617d83');
    rect(bg,442,70,2,17,'#688b85');rect(bg,444,71,14,7,'#de9470');rect(bg,453,75,5,6,'#de9470');
    for(let i=0;i<5;i++){rect(bg,429+(i%2)*5,102+i*10,5,2,'#7d989d');rect(bg,448,106+i*10,5,2,'#9bb4b0');}
    hill(87,160,152,35,'#739755','#92af65');hill(322,146,144,49,'#729858','#8eac66');
    tree(30,184,.75);tree(83,172,.57);tree(417,179,.93);tree(462,187,.67);tree(298,170,.45);
    // Fence, field and scattered grass behind the court.
    rect(bg,0,188,480,10,'#719254');rect(bg,0,193,480,3,'#9bb967');
    for(let x=0;x<480;x+=21){rect(bg,x,182,2,14,'#6b8060');rect(bg,x,185,20,2,'#a8b79a');}
    rect(bg,0,198,480,35,'#b4a679');rect(bg,0,198,480,3,'#d2c596');rect(bg,0,231,480,5,'#8c805b');
    // Court lines drawn in the same frontal projection as the experiment.
    rect(bg,20,202,439,1,'#e4dcc0');rect(bg,20,227,439,1,'#e4dcc0');rect(bg,20,202,1,25,'#e4dcc0');rect(bg,458,202,1,26,'#e4dcc0');
    rect(bg,237,202,1,26,'#e4dcc0');rect(bg,327,205,66,1,'#e4dcc0');rect(bg,327,224,66,1,'#e4dcc0');rect(bg,327,205,1,20,'#e4dcc0');
    bg.strokeStyle='#ddd2ae';bg.lineWidth=1;bg.beginPath();bg.ellipse(238,214,19,9,0,0,Math.PI*2);bg.stroke();
    for(let x=1;x<480;x+=7){if(x%3===0)rect(bg,x,232,5,2,'#b0c375');if(x%5===0)rect(bg,x,235,4,3,'#71884d');}
    rect(bg,0,237,480,23,'#89724e');rect(bg,0,237,480,4,'#5c7440');
    for(let x=0;x<480;x+=20){rect(bg,x,241,17,8,'#a18958');rect(bg,x+3,249,17,7,'#967b51');rect(bg,x+11,243,4,3,'#b49a65');}
    // Bench, flowers and a little park lamp.
    rect(bg,178,182,40,4,'#b98d5f');rect(bg,178,188,40,4,'#cda471');rect(bg,183,191,3,6,'#6c7253');rect(bg,210,191,3,6,'#6c7253');
    for(const x of [11,103,272,397,449]){rect(bg,x,192,1,6,'#507847');rect(bg,x-2,190,5,3,x%2?'#e9cf89':'#de9a82');}
    rect(bg,65,146,2,46,'#617b70');rect(bg,60,143,12,3,'#647a72');rect(bg,62,137,8,6,'#f1dfaa');rect(bg,61,135,10,2,'#647a72');
    // Extend the park behind the floating controls, then brighten its palette.
    bg.drawImage(scenery,479,0,1,260,480,0,160,260);tree(560,188,.7);tree(620,185,.9);
    const pixels=bg.getImageData(0,0,VIEW,260);
    for(let i=0;i<pixels.data.length;i+=4){const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
      if(b>r*1.05&&b>g*.95){pixels.data[i]=Math.max(30,r-43);pixels.data[i+1]=Math.min(245,g+8);pixels.data[i+2]=Math.min(255,b+37);}
      else if(g>r*1.08&&g>b*1.03){pixels.data[i]=Math.max(30,r-24);pixels.data[i+1]=Math.min(220,g+22);pixels.data[i+2]=Math.max(25,b-15);}
      else if(r>g&&g>b){pixels.data[i]=Math.min(255,r+34);pixels.data[i+1]=Math.min(225,g+11);pixels.data[i+2]=Math.max(25,b-8);}
    }bg.putImageData(pixels,0,0);
  }
  function drawHoop(front = false) {
    const x = wx(P.HOOP.x), y = wy(P.HOOP.y), bx = wx(P.HOOP.boardX);
    if (!front) {
      rect(ctx,bx+5,wy(P.HOOP.boardTop),4,FLOOR-wy(P.HOOP.boardTop),'#596f67');rect(ctx,bx+9,wy(P.HOOP.boardTop),3,FLOOR-wy(P.HOOP.boardTop),'#7b8a77');
      rect(ctx,bx-2,wy(P.HOOP.boardTop),4,(P.HOOP.boardTop-P.HOOP.boardBottom)*SCALE,'#e8e4cb');rect(ctx,bx-2,wy(P.HOOP.boardTop),2,34,'#fff7dc');
      rect(ctx,bx-2,y-12,3,13,'#bc7553');rect(ctx,x+5,y-1,bx-x-5,3,'#915d45');
      rect(ctx,bx-2,FLOOR-2,19,4,'#637667');
      ctx.strokeStyle='#f9edce';ctx.lineWidth=1;
      for(let i=-5;i<=5;i+=3){ctx.beginPath();ctx.moveTo(x+i,y+2);ctx.lineTo(x+i*.5,y+13);ctx.stroke();}
      for(const yy of [5,9,13]){ctx.beginPath();ctx.moveTo(x-5+yy*.2,y+yy);ctx.lineTo(x+5-yy*.2,y+yy);ctx.stroke();}
    }
    rect(ctx,x-P.HOOP.halfWidth*SCALE,y-1,P.HOOP.halfWidth*SCALE*2,2,front?'#dd824a':'#b9663f');
    if(front){rect(ctx,x-P.HOOP.halfWidth*SCALE-1,y,2,2,'#eda365');rect(ctx,x+P.HOOP.halfWidth*SCALE-1,y,2,2,'#eda365');}
  }
  function drawPlayer() {
    const x = wx(P.HOOP.x - parameters.distance), y = wy(steps*.6);
    const releaseY = y - (parameters.height-steps*.6) * 28;
    const throwing = shot && (running || paused) && flightTime < .25;
    ctx.save();ctx.translate(x,y);ctx.scale(SCALE/28,SCALE/28);ctx.translate(-x,-y);
    // A small hand-authored pixel athlete; no downloaded assets.
    rect(ctx,x-11,y-3,21,3,'#93845f');
    rect(ctx,x-8,y-19,6,16,'#b88b64');rect(ctx,x+2,y-19,6,16,'#b88b64');
    rect(ctx,x-10,y-5,9,4,'#efe9ce');rect(ctx,x+1,y-5,11,4,'#efe9ce');rect(ctx,x-10,y-2,10,2,'#546b63');rect(ctx,x+1,y-2,12,2,'#546b63');
    rect(ctx,x-9,y-27,18,10,'#274f4b');rect(ctx,x-9,y-27,3,10,'#7b9d6c');
    rect(ctx,x-9,y-42,17,17,'#f2a85e');rect(ctx,x-7,y-41,3,15,'#ffd080');rect(ctx,x+5,y-38,3,11,'#ce8048');
    rect(ctx,x-3,y-38,5,8,'#f7e7b5');rect(ctx,x-2,y-37,2,5,'#e79852');
    rect(ctx,x-10,y-49,20,10,'#bf946b');rect(ctx,x-8,y-55,15,14,'#d6aa79');rect(ctx,x+5,y-49,4,7,'#e3ba86');
    rect(ctx,x-9,y-57,15,5,'#3c4a42');rect(ctx,x-11,y-54,4,9,'#3c4a42');rect(ctx,x+6,y-53,3,5,'#3c4a42');rect(ctx,x+4,y-48,2,2,'#334a42');
    rect(ctx,x-13,y-38,5,13,'#c79a6e');rect(ctx,x-13,y-27,8,4,'#d7ad7a');
    rect(ctx,x+7,y-39,6,6,'#dbad79');
    const hy = throwing ? releaseY - 9 : releaseY + 1;
    rect(ctx,x+9,hy+2,5,Math.max(4,y-35-hy),'#d6aa79');rect(ctx,x+3,hy,10,5,'#e5ba85');
    ctx.restore();
  }
  function drawBall(x, y, rotation = 0) {
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(SCALE/28,SCALE/28);
    rect(ctx,-3,-4,6,8,'#624d39');rect(ctx,-4,-3,8,6,'#624d39');rect(ctx,-3,-3,6,6,'#e78a3e');rect(ctx,-2,-3,3,2,'#ffbd69');rect(ctx,1,1,2,2,'#b76531');
    ctx.strokeStyle='#80502f';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(3,0);ctx.moveTo(Math.sin(rotation)*2,-3);ctx.lineTo(-Math.sin(rotation)*2,3);ctx.stroke();ctx.restore();
  }
  function drawPath(p, color, dash = true, alpha = .8) {
    const duration = P.metrics(p).time;
    ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=1.2;if(dash)ctx.setLineDash([2,4]);ctx.beginPath();
    for(let t=0;t<=duration+.025;t+=.025){const pt=P.position(p,Math.min(t,duration));if(t===0)ctx.moveTo(wx(pt.x),wy(pt.y));else ctx.lineTo(wx(pt.x),wy(pt.y));}ctx.stroke();ctx.restore();
  }
  function arrow(x,y,dx,dy,color,label) {
    const endX=x+dx,endY=y+dy;const a=Math.atan2(dy,dx);
    ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(endX,endY);ctx.moveTo(endX-5*Math.cos(a-.5),endY-5*Math.sin(a-.5));ctx.lineTo(endX,endY);ctx.lineTo(endX-5*Math.cos(a+.5),endY-5*Math.sin(a+.5));ctx.stroke();
    ctx.fillStyle=color;ctx.font='7px system-ui';ctx.fillText(label,endX+3,endY-3);
  }
  function render() {
    const visible=[parameters,...selected.map(id=>records.find(r=>r.id===id)?.parameters).filter(Boolean)];
    const maxHeight=Math.max(6.8,...visible.map(p=>P.metrics(p).height));
    const maxX=Math.max(15,...visible.map(p=>P.HOOP.x-p.distance+P.metrics(p).range));
    const nextScale=Math.min(28,(FLOOR-23)/maxHeight,(480-ORIGIN-18)/maxX);
    if(Math.abs(nextScale-SCALE)>.001){SCALE=nextScale;updateDragTarget();}
    ctx.clearRect(0,0,VIEW,260);ctx.drawImage(scenery,0,0);
    if($('grid').checked){ctx.save();ctx.strokeStyle='#fff';ctx.globalAlpha=.2;ctx.lineWidth=.5;for(let x=0;x<=(480-ORIGIN)/SCALE;x++){ctx.beginPath();ctx.moveTo(wx(x),20);ctx.lineTo(wx(x),FLOOR);ctx.stroke();}for(let y=1;y<=(FLOOR-20)/SCALE;y++){ctx.beginPath();ctx.moveTo(0,wy(y));ctx.lineTo(480,wy(y));ctx.stroke();ctx.font='7px system-ui';ctx.fillStyle='#244638';ctx.globalAlpha=.7;ctx.fillText(y+' m',5,wy(y)-2);ctx.globalAlpha=.2;}ctx.restore();}
    for(let i=0;i<selected.length;i++){const record=records.find(r=>r.id===selected[i]);if(record)drawPath(record.parameters,colors[i],false,.85);}
    if($('trajectory').checked)drawPath(parameters,'#fff7c1',true,.8);
    drawHoop();
    for(let i=0;i<steps;i++){const x=wx(P.HOOP.x-parameters.distance),top=wy((i+1)*.6),h=.6*SCALE;rect(ctx,x-17*SCALE/28,top,34*SCALE/28,h,'#184fbe');rect(ctx,x-16*SCALE/28,top,32*SCALE/28,3*SCALE/28,'#8de3ff');rect(ctx,x-14*SCALE/28,top+5*SCALE/28,27*SCALE/28,h-7*SCALE/28,'#3285ff');rect(ctx,x+8*SCALE/28,top+5*SCALE/28,4*SCALE/28,h-7*SCALE/28,'#1162e2');}
    drawPlayer();
    if(trail.length){ctx.strokeStyle='#ffdb84';ctx.lineWidth=1.4;ctx.beginPath();trail.forEach((p,i)=>{if(i===0)ctx.moveTo(wx(p.x),wy(p.y));else ctx.lineTo(wx(p.x),wy(p.y));});ctx.stroke();}
    const at=shot?P.position(shot.parameters,flightTime):P.position(parameters,0);
    drawBall(wx(at.x),wy(at.y),flightTime*8);drawHoop(true);
    if($('vectors').checked){arrow(wx(at.x),wy(at.y),at.vx*3,0,'#fff0ac','vₓ');arrow(wx(at.x),wy(at.y),0,-at.vy*3,'#edf6fc','vᵧ');}
    if(!shot){const x=wx(P.HOOP.x-parameters.distance),y=wy(parameters.height);ctx.strokeStyle='#f7e6a5';ctx.globalAlpha=.7;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,17,-parameters.angle*Math.PI/180,0);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='#334e39';ctx.font='7px system-ui';ctx.fillText(parameters.angle+'°',x+19,y-3);}
    if(performance.now()<flashUntil){ctx.fillStyle='#fff7b1';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText('SWISH!',wx(P.HOOP.x),wy(P.HOOP.y)-22);ctx.textAlign='left';const k=(flashUntil-performance.now())/1600;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;rect(ctx,wx(P.HOOP.x)+Math.cos(a)*(25+(1-k)*12),wy(P.HOOP.y)+Math.sin(a)*20-(1-k)*12,2,2,i%2?'#f9d488':'#eaf3b2');}}
    display.imageSmoothingEnabled=false;display.clearRect(0,0,canvas.width,canvas.height);display.drawImage(pixel,0,0,canvas.width,canvas.height);
  }
  function updateDragTarget() {
    const bounds=canvas.getBoundingClientRect(),wrap=$('canvas-wrap').getBoundingClientRect();
    const x=wx(P.HOOP.x-parameters.distance)/VIEW*bounds.width;
    const target=$('player-drag');const athleteScale=SCALE/28;
    const targetWidth=Math.max(32,36*athleteScale/VIEW*bounds.width),targetHeight=Math.max(40,63*athleteScale/260*bounds.height);
    target.style.left=(bounds.left-wrap.left+x-targetWidth/2)+'px';
    target.style.top=(bounds.top-wrap.top+wy(steps*.6)/260*bounds.height-targetHeight)+'px';
    target.style.width=targetWidth+'px';target.style.height=targetHeight+'px';
    target.draggable=mode==='lab'&&!running&&!paused;target.style.pointerEvents=mode==='lab'&&!running&&!paused?'auto':'none';
    target.setAttribute('aria-disabled',String(!target.draggable));
    const zone=$('step-zone');zone.style.left=(bounds.left-wrap.left+x-30)+'px';zone.style.top=(bounds.top-wrap.top+wy(steps*.6)/260*bounds.height-8)+'px';zone.style.width='60px';
    zone.hidden=mode!=='lab'||running||paused;
  }
  function updateMetrics() {const m=P.metrics(parameters);$('metric-time').value=round(m.time);$('metric-height').value=round(m.height);$('metric-range').value=round(m.range);$('metric-live').value=round(flightTime);}
  function updateRange(id) {const input=$(id);input.style.setProperty('--fill',((Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100)+'%');}
  function syncControls() {
    for(const [id,key]of[['angle','angle'],['speed','speed'],['distance','distance']]){$(id).value=parameters[key];$(id+'-number').value=parameters[key];updateRange(id);}
    $('height').value=parameters.height;$('world-distance').textContent=round(parameters.distance,1)+' m ke ring';updateMetrics();updateDragTarget();render();
  }
  function feedback(text,type='') {$('feedback-text').textContent=text.length>105?text.split(/(?<=[.!?])\s/)[0]:text;$('feedback').className='feedback'+(type?' '+type:'');$('feedback').querySelector('.feedback-icon').textContent=type==='success'?'✓':type==='miss'?'↗':'✦';}
  function updateButtons() {
    $('launch').disabled=running||paused;$('pause').disabled=!running&&!paused;
    $('pause').innerHTML=paused?'<span aria-hidden="true">▶</span> Lanjut':'<span aria-hidden="true">Ⅱ</span> Jeda';
    $('parameters').disabled=running||paused;
    const locked=mode==='game';$('distance').disabled=locked||running||paused;$('distance-number').disabled=locked||running||paused;$('height').disabled=locked||running||paused;
    $('save').disabled=!shot||!shot.complete||savedShot;
    $('next-challenge').disabled=!levelPassed;
    $('next-challenge').textContent=level===2?'Main lagi ↺':'Tantangan berikutnya →';updateDragTarget();
    $('step-tray').hidden=mode!=='lab';$('step-add').disabled=running||paused||steps>=4;$('step-remove').disabled=running||paused||steps===0;$('step-block').draggable=mode==='lab'&&!running&&!paused&&steps<4;$('step-block').setAttribute('aria-disabled',String(!$('step-block').draggable));$('step-count').value=steps;
  }
  function resetFlight(message=true) {running=false;paused=false;shot=null;flightTime=0;trail=[];lastFrame=null;savedShot=false;flashUntil=0;updateMetrics();updateButtons();if(message)feedback(mode==='game'?levels[level].description:'Siap bereksperimen? Atur lemparan, lalu lihat ke mana bola melaju.');render();}
  function changeParameter(key,value) {
    if(running||paused)return;
    const constraints={angle:[10,80,0],speed:[3,18,1],distance:[3,11,1],height:[1+steps*.6,2.5+steps*.6,1]};
    const [min,max,digits]=constraints[key];if(!Number.isFinite(value)){syncControls();return;}
    parameters[key]=Number(clamp(value,min,max).toFixed(digits));resetFlight(false);syncControls();feedback('Parameter diperbarui. Buat prediksimu, lalu coba lemparan baru.');
    if(key==='height')baseHeight=parameters.height-steps*.6;
  }
  for(const [id,key]of[['angle','angle'],['speed','speed'],['distance','distance']]){
    $(id).addEventListener('input',e=>changeParameter(key,Number(e.target.value)));
    $(id+'-number').addEventListener('change',e=>changeParameter(key,e.target.value===''?NaN:Number(e.target.value)));
  }
  $('height').addEventListener('change',e=>changeParameter('height',e.target.value===''?NaN:Number(e.target.value)));
  for(const id of ['trajectory','vectors','grid'])$(id).addEventListener('change',render);
  $('slow').addEventListener('change',()=>{$('speed-badge').textContent=$('slow').checked?'0.35×':'1×';});
  function launch() {
    if(running||paused)return;
    const copy={...parameters};shot={parameters:copy,metrics:P.metrics(copy),outcome:P.outcome(copy),complete:false};flightTime=0;trail=[P.position(copy,0)];running=true;paused=false;savedShot=false;lastFrame=null;
    if(mode==='game'){attempts++;$('attempts-label').textContent=attempts+' percobaan';}
    feedback('Bola melaju! Amati gerak horizontal dan vertikalnya.');updateButtons();
  }
  $('launch').addEventListener('click',launch);
  $('pause').addEventListener('click',()=>{if(!shot||shot.complete)return;paused=!paused;running=!paused;lastFrame=null;updateButtons();feedback(paused?'Simulasi dijeda. Perhatikan posisi bola dan arah kecepatannya.':'Simulasi dilanjutkan.');});
  $('reset').addEventListener('click',()=>resetFlight());
  function finishShot() {
    running=false;shot.complete=true;const out=shot.outcome;
    if(out.type==='score'){
      flashUntil=performance.now()+1800;feedback('Masuk! Bola melewati ring saat turun. Catat hasilnya dan coba tembakan dari jarak lain.','success');
      if(mode==='game'){levelPassed=true;feedback(level===2?'Hebat! Ketiga tantangan selesai. Kamu menemukan lintasan dengan eksperimenmu sendiri.':'Masuk! Tantangan selesai. Catat lemparanmu, lalu lanjut ke jarak berikutnya.','success');}
    }else if(out.type==='rim')feedback('Hampir! Bola menyentuh tepi ring. Coba ubah kecepatan sedikit agar pusat bola melewati bukaan.','miss');
    else if(out.type==='board')feedback('Bola mengenai papan. Coba kurangi kecepatan atau ubah sudut agar bola turun tepat di atas ring.','miss');
    else{
      const t=P.descendingAtHeight(shot.parameters,P.HOOP.y);
      if(t===null)feedback('Bola belum mencapai tinggi ring. Tambah komponen kecepatan vertikal dengan menaikkan sudut atau kecepatan.','miss');
      else if(P.position(shot.parameters,t).x<P.HOOP.x)feedback('Lemparan terlalu pendek saat bola turun ke tinggi ring. Coba tambah kecepatan awal.','miss');
      else feedback('Bola melewati ring terlalu jauh. Coba kurangi kecepatan awal dan perhatikan perubahan lintasannya.','miss');
    }
    updateButtons();
  }
  function tick(now) {
    if(running&&shot){const dt=lastFrame===null?0:Math.min((now-lastFrame)/1000,.1)*($('slow').checked?.35:1);flightTime=Math.min(flightTime+dt,shot.outcome.time);trail.push(P.position(shot.parameters,flightTime));if(trail.length>1200)trail.shift();$('metric-live').value=round(flightTime);if(flightTime>=shot.outcome.time)finishShot();render();}
    else if(now<flashUntil)render();
    lastFrame=now;requestAnimationFrame(tick);
  }
  function setMode(next) {
    mode=next;resetFlight(false);$('lab-mode').classList.toggle('selected',mode==='lab');$('game-mode').classList.toggle('selected',mode==='game');$('lab-mode').setAttribute('aria-pressed',String(mode==='lab'));$('game-mode').setAttribute('aria-pressed',String(mode==='game'));
    $('challenge-hud').hidden=mode!=='game';$('challenge-next-wrap').hidden=mode!=='game';$('canvas-tip').hidden=mode==='game';
    if(mode==='game'){level=0;startLevel();}else{$('mode-description').textContent='Ubah satu parameter. Amati perbedaannya.';$('trajectory').disabled=false;feedback('Mode laboratorium: atur parameter dan bandingkan hasil eksperimen.');updateButtons();render();}
  }
  function startLevel() {const current=levels[level];attempts=0;levelPassed=false;steps=0;baseHeight=1.9;parameters.distance=current.distance;parameters.height=1.9;$('trajectory').checked=current.hint;$('trajectory').disabled=!current.hint;$('level-label').textContent='TANTANGAN '+(level+1)+' / 3';$('challenge-goal').textContent=current.name;$('attempts-label').textContent='0 percobaan';$('mode-description').textContent=current.description;resetFlight(false);syncControls();feedback(current.description);updateButtons();}
  $('lab-mode').addEventListener('click',()=>setMode('lab'));$('game-mode').addEventListener('click',()=>setMode('game'));
  $('next-challenge').addEventListener('click',()=>{if(!levelPassed)return;level=level===2?0:level+1;startLevel();});

  // HTML5 native drag-and-drop on desktop, Pointer Events for touch devices.
  const player=$('player-drag'),wrap=$('canvas-wrap');let pointerDragging=false;
  function movePlayer(clientX) {if(mode!=='lab'||running||paused)return;const b=canvas.getBoundingClientRect();const x=(clientX-b.left)/b.width*VIEW;const world=(x-ORIGIN)/SCALE;changeParameter('distance',P.HOOP.x-world);}
  player.addEventListener('dragstart',e=>{if(mode!=='lab'||running||paused){e.preventDefault();return;}e.dataTransfer.setData('text/plain','sportslab-player');e.dataTransfer.effectAllowed='move';feedback('Geser pemain ke posisi baru, lalu lepaskan.');});
  wrap.addEventListener('dragover',e=>{if(mode==='lab'&&!running&&!paused&&Array.from(e.dataTransfer.types).includes('text/plain')){e.preventDefault();e.dataTransfer.dropEffect=e.dataTransfer.effectAllowed==='copy'?'copy':'move';}});
  wrap.addEventListener('drop',e=>{const kind=e.dataTransfer.getData('text/plain');if(kind==='sportslab-player'){e.preventDefault();movePlayer(e.clientX);}else if(kind==='sportslab-step'){e.preventDefault();dropStep(e.clientX,e.clientY);}});
  player.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||mode!=='lab'||running||paused)return;pointerDragging=true;player.setPointerCapture(e.pointerId);e.preventDefault();});
  player.addEventListener('pointermove',e=>{if(pointerDragging)movePlayer(e.clientX);});
  player.addEventListener('pointerup',()=>{pointerDragging=false;});player.addEventListener('pointercancel',()=>{pointerDragging=false;});
  player.addEventListener('keydown',e=>{if(mode!=='lab'||running||paused)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();changeParameter('distance',parameters.distance+(e.key==='ArrowLeft'?.2:-.2));}});
  window.addEventListener('resize',updateDragTarget);document.addEventListener('fullscreenchange',()=>{updateDragTarget();render();});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(wrap.requestFullscreen)await wrap.requestFullscreen();else feedback('Layar penuh tidak tersedia di browser ini. Lapangan tetap dapat digunakan.');}catch{feedback('Browser tidak dapat membuka layar penuh. Lapangan tetap dapat digunakan.');}});

  function changeSteps(delta){if(mode!=='lab'||running||paused)return;const count=clamp(steps+delta,0,4);if(count===steps)return;steps=count;parameters.height=Number((baseHeight+steps*.6).toFixed(1));resetFlight(false);syncControls();updateButtons();feedback(steps?'Lebih tinggi! '+steps+' balok, pelepasan '+round(parameters.height,1)+' m. Coba lintasan baru.':'Kembali ke lantai. Siap lempar lagi?');}
  function dropStep(clientX,clientY){const b=canvas.getBoundingClientRect();const playerX=b.left+wx(P.HOOP.x-parameters.distance)/VIEW*b.width;if(clientY>=b.top&&clientY<=b.bottom&&Math.abs(clientX-playerX)<Math.max(60,b.width*.065))changeSteps(1);else feedback('Tarik balok ke pemain. Atau klik ＋ di kotak balok.');wrap.classList.remove('dragging-step');}
  const block=$('step-block');let draggingBlock=false,blockOrigin={x:0,y:0};
  block.addEventListener('dragstart',e=>{if(!block.draggable){e.preventDefault();return;}e.dataTransfer.setData('text/plain','sportslab-step');e.dataTransfer.effectAllowed='copy';wrap.classList.add('dragging-step');feedback('Lepaskan balok di bawah pemain ↑');});
  block.addEventListener('dragend',()=>wrap.classList.remove('dragging-step'));
  block.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();changeSteps(1);}});
  block.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||!block.draggable)return;draggingBlock=true;blockOrigin={x:e.clientX,y:e.clientY};block.setPointerCapture(e.pointerId);wrap.classList.add('dragging-step');e.preventDefault();});
  block.addEventListener('pointermove',e=>{if(draggingBlock)block.style.transform='translate('+(e.clientX-blockOrigin.x)+'px,'+(e.clientY-blockOrigin.y)+'px)';});
  block.addEventListener('pointerup',e=>{if(!draggingBlock)return;draggingBlock=false;block.style.transform='';dropStep(e.clientX,e.clientY);});
  block.addEventListener('pointercancel',()=>{draggingBlock=false;block.style.transform='';wrap.classList.remove('dragging-step');});
  $('step-add').addEventListener('click',()=>changeSteps(1));$('step-remove').addEventListener('click',()=>changeSteps(-1));

  function validRecord(r) {return r&&typeof r.id==='string'&&r.parameters&&Object.keys(parameters).every(k=>Number.isFinite(r.parameters[k]))&&r.parameters.angle>=10&&r.parameters.angle<=80&&r.parameters.speed>=3&&r.parameters.speed<=18&&r.parameters.distance>=3&&r.parameters.distance<=11&&r.parameters.height>=1&&r.parameters.height<=4.9&&Object.hasOwn(resultLabels,r.result);}
  try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(data))records=data.filter(validRecord).slice(-100).map(r=>({...r,metrics:P.metrics(r.parameters)}));}catch{storageAvailable=false;}
  function persist() {try{localStorage.setItem(storageKey,JSON.stringify(records));return true;}catch{storageAvailable=false;return false;}}
  function renderRecords() {
    $('record-count').textContent=records.length;$('empty-notebook').hidden=records.length>0;$('table-wrap').hidden=records.length===0;$('export').disabled=records.length===0;$('clear-records').disabled=records.length===0;
    const tbody=$('records');tbody.replaceChildren();
    records.forEach((r,index)=>{const tr=document.createElement('tr');const compare=document.createElement('td');const input=document.createElement('input');input.type='checkbox';input.checked=selected.includes(r.id);input.setAttribute('aria-label','Bandingkan percobaan '+(index+1));input.addEventListener('change',()=>{if(input.checked){if(selected.length===2){input.checked=false;$('comparison-note').textContent='Pilih maksimal dua percobaan. Lepas salah satu pilihan untuk membandingkan yang lain.';return;}selected.push(r.id);}else selected=selected.filter(id=>id!==r.id);renderRecords();render();});compare.append(input);tr.append(compare);
      const values=['#'+String(index+1).padStart(2,'0'),r.parameters.angle+'°',round(r.parameters.speed,1)+' m/s',round(r.parameters.distance,1)+' m',round(r.parameters.height,1)+' m',round(r.metrics.time)+' s',round(r.metrics.height)+' m',round(r.metrics.range)+' m'];
      values.forEach((value,i)=>{const cell=document.createElement('td');if(i===0&&selected.includes(r.id)){const swatch=document.createElement('span');swatch.className='comparison-swatch';swatch.style.background=colors[selected.indexOf(r.id)];cell.append(swatch);}cell.append(document.createTextNode(value));tr.append(cell);});
      const result=document.createElement('td'),tag=document.createElement('span');tag.className='result-tag'+(r.result==='score'?' score':'');tag.textContent=resultLabels[r.result];result.append(tag);tr.append(result);tbody.append(tr);
    });
    $('comparison-note').textContent=selected.length?'Lintasan pilihan ditampilkan di lapangan: '+selected.map((id,i)=>(i===0?'kuning':'biru')+' = percobaan '+(records.findIndex(r=>r.id===id)+1)).join(', ')+'.':storageAvailable?'Catatan disimpan di browser ini. Waktu dan jangkauan tabel merupakan nilai teoretis hingga lantai.':'Penyimpanan browser tidak tersedia. Catatan hanya bertahan selama halaman terbuka; ekspor CSV untuk menyimpannya.';
  }
  $('save').addEventListener('click',()=>{if(!shot||!shot.complete||savedShot)return;const id=typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);records.push({id,parameters:{...shot.parameters},metrics:{...shot.metrics},result:shot.outcome.type});if(records.length>100){const removed=records.shift();selected=selected.filter(id=>id!==removed.id);}savedShot=true;persist();renderRecords();updateButtons();feedback('Hasil dicatat! Pilih dua percobaan di buku eksperimen untuk membandingkan lintasannya.');});
  $('export').addEventListener('click',()=>{if(!records.length)return;const rows=[['Percobaan','Sudut (derajat)','Kecepatan awal (m/s)','Jarak ring (m)','Tinggi awal (m)','Waktu teoretis hingga lantai (s)','Tinggi maksimum (m)','Jangkauan teoretis hingga lantai (m)','Hasil']];records.forEach((r,i)=>rows.push([i+1,r.parameters.angle,r.parameters.speed,r.parameters.distance,r.parameters.height,round(r.metrics.time,4),round(r.metrics.height,4),round(r.metrics.range,4),resultLabels[r.result]]));const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='sportslab-eksperimen.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('clear-records').addEventListener('click',()=>$('clear-dialog').showModal());$('clear-dialog').addEventListener('close',()=>{if($('clear-dialog').returnValue==='confirm'){records=[];selected=[];persist();renderRecords();render();feedback('Buku eksperimen dikosongkan. Mulai percobaan baru kapan saja.');}});
  document.querySelector('.arena-card').append(document.querySelector('.controls-card'));
  document.querySelector('.playback-actions').append($('save'));$('save').textContent='＋ Catat';
  document.querySelector('.scene-label strong').textContent='Basket playground';
  for(const link of document.querySelectorAll('nav a'))link.addEventListener('click',e=>{const target=link.getAttribute('href');if(target==='#notebook'||target==='#guide'){e.preventDefault();document.querySelector(target).classList.toggle('is-open');if(document.querySelector(target).classList.contains('is-open'))document.querySelector(target).scrollIntoView({behavior:'smooth',block:'start'});}});
  $('save').addEventListener('click',()=>{if(savedShot)$('notebook').classList.add('is-open');});
  drawScenery();syncControls();renderRecords();updateButtons();requestAnimationFrame(tick);
})();
