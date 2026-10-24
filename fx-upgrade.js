/* FIRE AND FURY UNLEASHED — visual + controls upgrade (add-on)
   Add ONE line right before </body>, AFTER the main <script>:
   <script src="fx-upgrade.js"></script>                                  */
(function(){
"use strict";
const $=id=>document.getElementById(id);

/* ---------- STYLE ---------- */
const css=`
body.in-game{touch-action:none;overscroll-behavior:none}
.game-wrap{border:0;border-radius:0;box-shadow:none;background:radial-gradient(ellipse at 50% 0%,#2e1009,#0b0403 72%);padding:6px 8px calc(8px + env(safe-area-inset-bottom))}
.game-head{gap:6px}
.game-stat{padding:5px 12px;border-radius:999px;font-weight:800;letter-spacing:.5px;background:linear-gradient(180deg,rgba(66,26,12,.92),rgba(22,9,6,.92));border:1px solid rgba(255,150,60,.5);box-shadow:0 0 12px rgba(255,100,30,.2),inset 0 1px 0 rgba(255,220,160,.18)}
#gameCanvas{border:1px solid rgba(255,165,75,.65);border-radius:14px}
.deck{flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:10px 6px 2px;touch-action:none;user-select:none;-webkit-user-select:none}
.deck .hud-joystick,.deck .hud-fire{position:relative;inset:auto;left:auto;right:auto;bottom:auto;opacity:1}
.deck .hud-joystick{width:min(58vw,300px);height:clamp(84px,14vh,120px);border:2px solid rgba(255,170,80,.55);background:linear-gradient(180deg,#2c130a,#130705);box-shadow:inset 0 0 26px rgba(255,100,30,.2),0 6px 22px rgba(0,0,0,.6)}
.deck .hud-joystick-thumb{width:clamp(56px,11vh,78px);height:clamp(56px,11vh,78px);box-shadow:0 0 18px rgba(255,140,50,.55),0 3px 12px rgba(0,0,0,.5)}
.deck .hud-fire{width:clamp(92px,16vh,132px);height:clamp(92px,16vh,132px);border:3px solid #ffd58a;background:radial-gradient(circle at 35% 30%,#ff9a3c,#c2260a 70%,#5a0f05);box-shadow:0 0 26px rgba(255,100,30,.7),0 8px 20px rgba(0,0,0,.6),inset 0 0 18px rgba(255,230,160,.35);animation:fxPulse 1.6s ease-in-out infinite}
.deck .hud-fire:active{transform:scale(.92);filter:brightness(1.25)}
.deck .hud-fire.off{opacity:.2;pointer-events:none;animation:none}
@keyframes fxPulse{50%{box-shadow:0 0 44px rgba(255,130,40,.95),0 8px 20px rgba(0,0,0,.6),inset 0 0 18px rgba(255,230,160,.35)}}
@media (orientation:portrait){
 .stage{flex:0 0 auto;container-type:normal}
 .stage-inner{width:100%}
 .deck{flex:1 1 auto;padding-bottom:4vh}
 .game-message{display:none}
}
.how-sec{margin:10px 0;padding:10px 12px;border:1px solid rgba(255,170,80,.28);border-radius:12px;background:rgba(30,12,7,.7);line-height:1.5;font-size:.95rem;text-align:left}
.how-sec b{color:#ffd16b}
`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

const vp=document.querySelector("meta[name=viewport]");
if(vp)vp.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";

/* ---------- CONTROLS UNDER THE CANVAS (move: left hand, fire: right hand) ---------- */
const oldControls=document.querySelector(".controls");
const deck=document.createElement("div");
deck.className="deck";deck.setAttribute("aria-label","Game controls");
deck.append($("moveJoystick"),$("fireBtn"));
$("gameMessage").before(deck);
if(oldControls)oldControls.remove();

/* ---------- HOW TO PLAY PANEL ---------- */
const how=document.createElement("div");
how.id="howModal";how.className="ff-modal";how.setAttribute("role","dialog");how.setAttribute("aria-modal","true");
how.innerHTML=`<div class="ff-modal-card"><h2>📖 HOW TO PLAY</h2>
<div class="how-sec"><b>🎮 Controls</b><br>📱 <b>Left thumb:</b> slide the pad left or right to move.<br>🔥 <b>Right thumb:</b> hold FIRE to shoot.<br>⌨️ <b>Keyboard:</b> ← → or A / D to move, SPACE to fire.</div>
<div class="how-sec"><b>🌋 Volcano Rush (45s)</b><br>No shooting. Catch 💧 +100, 🔥 +150, 💨 +200, ☁️ +250 and dodge the falling boulders. Reach <b>2,000 points</b>.</div>
<div class="how-sec"><b>🚀 Rocket Battle (45s)</b><br>You fly a V-2. Shoot 🎯 targets (+200). Scrolls 📜 are worth +500: collect or shoot them.</div>
<div class="how-sec"><b>🔥 Final Fury (60s)</b><br>Shoot or avoid 💥 enemies and boulders. Collect 📜 and 🔥 for points.</div>
<div class="how-sec"><b>❤️ Lives</b><br>You have 3 lives. A hit costs a life, breaks your combo and gives a short shield while you flash.</div>
<div class="how-sec"><b>⚡ Combos &amp; Fury Mode</b><br>Chain hits without getting hurt to build a combo and bonus points. At <b>10 in a row</b> FURY MODE starts: <b>×2 points for 8 seconds</b>.</div>
<div class="ff-row" style="justify-content:center"><button class="btn gold" type="button" id="howClose">GOT IT 🔥</button></div></div>`;
document.body.appendChild(how);
window.openHow=()=>how.classList.add("show");
window.closeHow=()=>how.classList.remove("show");
$("howClose").onclick=closeHow;
how.addEventListener("pointerdown",e=>{if(e.target===how)closeHow()});

function howBtn(){const b=document.createElement("button");b.className="btn";b.type="button";b.textContent="📖 HOW TO PLAY";b.onclick=openHow;return b}
const ht=document.querySelector(".home-tools");if(ht)ht.prepend(howBtn());
const sa=document.querySelector(".start-actions");if(sa)sa.append(howBtn());
const mt=document.querySelector("#missions .section-title");
if(mt){const w=document.createElement("div");w.style.textAlign="center";w.append(howBtn());mt.after(w)}

/* ---------- VFX ---------- */
const vfx={flash:0,rgb:"255,60,20",rings:[]};
const ring=(x,y,rgb,max=90)=>{vfx.rings.push({x,y,r:8,a:1,rgb,max});if(vfx.rings.length>14)vfx.rings.shift()};
const wrap=(name,fn)=>{const o=window[name];window[name]=function(...a){return fn(o,a)}};

wrap("playerHit",(o,a)=>{const before=lives;const r=o(...a);
  if(lives<before){vfx.flash=.55;vfx.rgb="255,40,20";ring(player.x,player.y,"255,70,30",130);try{navigator.vibrate&&navigator.vibrate(70)}catch(_){}}
  return r});
wrap("destroyTarget",(o,a)=>{const r=o(...a);ring(a[0].x,a[0].y,"255,190,70");try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}return r});
wrap("collectObject",(o,a)=>{const r=o(...a);ring(a[0].x,a[0].y,"255,235,130",60);return r});
wrap("startGame",(o,a)=>{const r=o(...a);const f=$("fireBtn");f.style.display="";f.classList.toggle("off",a[0]==="volcano");vfx.rings.length=0;vfx.flash=0;return r});

window.drawBackground=function(){
  const t=performance.now()/1000;
  ctx.fillStyle=getBackgroundGradient(gameType);ctx.fillRect(0,0,GAME_W,GAME_H);
  const col=gameType==="rocket"?"90,120,255":gameType==="volcano"?"255,110,40":"200,70,255";
  const n=ctx.createRadialGradient(GAME_W*.5+Math.sin(t*.2)*80,GAME_H*.35,20,GAME_W*.5,GAME_H*.35,430);
  n.addColorStop(0,`rgba(${col},.24)`);n.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=n;ctx.fillRect(0,0,GAME_W,GAME_H);
  for(let L=0;L<3;L++){
    ctx.fillStyle=`rgba(255,240,220,${.3+L*.25})`;
    const sp=18+L*45,sz=1+L*.8;
    for(let i=0;i<28;i++){
      const x=(i*173+L*61)%GAME_W,y=((i*83+L*131)%GAME_H+t*sp)%GAME_H;
      ctx.fillRect(x,y,sz,sz*(1+L*1.5));
    }
  }
  if(gameType==="volcano"){
    ctx.fillStyle="rgba(255,138,64,.45)";
    ctx.beginPath();ctx.moveTo(0,GAME_H);ctx.lineTo(180,430);ctx.lineTo(310,GAME_H);ctx.fill();
    ctx.fillStyle="rgba(255,170,80,.4)";
    ctx.beginPath();ctx.moveTo(580,GAME_H);ctx.lineTo(720,400);ctx.lineTo(GAME_W,GAME_H);ctx.fill();
  }
  const g=ctx.createLinearGradient(0,GAME_H-120,0,GAME_H);
  g.addColorStop(0,"rgba(255,90,20,0)");g.addColorStop(1,`rgba(255,90,20,${.28+Math.sin(t*3)*.06})`);
  ctx.fillStyle=g;ctx.fillRect(0,GAME_H-120,GAME_W,120);
};

window.drawParticles=function(){
  ctx.save();ctx.globalCompositeOperation="lighter";
  particles.forEach(p=>{
    ctx.globalAlpha=Math.max(0,p.life/p.max)*.9;
    ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();ctx.globalAlpha=1;
};

function vignette(rgb,a){
  const g=ctx.createRadialGradient(GAME_W/2,GAME_H/2,GAME_H*.38,GAME_W/2,GAME_H/2,GAME_W*.65);
  g.addColorStop(0,`rgba(${rgb},0)`);g.addColorStop(1,`rgba(${rgb},${a})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,GAME_W,GAME_H);
}

wrap("draw",(o,a)=>{
  if(gameRunning&&player&&Math.random()<.65&&particles.length<110){
    particles.push({x:player.x+(Math.random()-.5)*8,y:player.y+26,vx:(Math.random()-.5)*45,vy:110+Math.random()*90,
      life:.4,max:.4,color:Math.random()<.5?"#ff9a2e":"#ffe27a",size:2+Math.random()*3});
  }
  o(...a);
  if(!player)return;
  const t=performance.now()/1000;
  if(furyModeRemaining>0){
    vignette("255,100,20",.38+Math.sin(t*8)*.08);
    ctx.save();ctx.strokeStyle="rgba(255,200,120,.28)";ctx.lineWidth=2;
    for(let i=0;i<14;i++){const x=(i*71+t*600)%GAME_W,y=((i*113)+t*900)%GAME_H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+60);ctx.stroke()}
    ctx.restore();
  }
  if(gameRunning&&lives===1)vignette("255,20,10",.3+Math.sin(t*6)*.12);
  for(let i=vfx.rings.length-1;i>=0;i--){
    const r=vfx.rings[i];r.r+=280*.016;r.a-=2.3*.016;
    if(r.a<=0||r.r>r.max){vfx.rings.splice(i,1);continue}
    ctx.save();ctx.globalCompositeOperation="lighter";
    ctx.strokeStyle=`rgba(${r.rgb},${r.a})`;ctx.lineWidth=2+r.a*5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  if(vfx.flash>0){ctx.fillStyle=`rgba(${vfx.rgb},${vfx.flash})`;ctx.fillRect(0,0,GAME_W,GAME_H);vfx.flash=Math.max(0,vfx.flash-.035)}
});
})();
