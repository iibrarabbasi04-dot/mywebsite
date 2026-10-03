/* FACT TOK extras: camera effects+makeup, payment screenshot, withdrawal, live gifts, official ID, For You ranking */
(function(){
Object.assign(CONFIG,{withdrawRatePerCoin:.8,minWithdraw:500,giftHostSharePct:70});
const ins=(id,pos,h)=>$(id).insertAdjacentHTML(pos,h);
document.head.insertAdjacentHTML('beforeend','<style>#giftModal,#withdrawModal{z-index:95}.sb{position:absolute;right:10px;top:64px;display:flex;flex-direction:column;gap:10px;z-index:3}.sb button{width:44px;height:44px;border-radius:50%;padding:0;background:#0008;font-size:12px;font-weight:800}#camC{position:absolute;left:0;top:0}</style>');

/* ===== new camera effects (old filters removed) ===== */
const NE=[
{n:'Normal',f:''},{n:'Pari',f:'contrast(1.1) saturate(1.2) brightness(1.1)',o:'blush',b:.6,m:{l:'rgba(255,90,150,.45)',b:'rgba(255,120,160,.3)'}},
{n:'Glow',f:'brightness(1.12) saturate(1.15)',o:'glow'},{n:'Clean',f:'brightness(1.08) contrast(1.05) saturate(1.1)'},
{n:'Soft',f:'brightness(1.1) contrast(.92) saturate(1.05)',o:'glow'},{n:'Rose',f:'saturate(1.2) brightness(1.05)',t:'rgba(255,90,140,.18)'},
{n:'Peach',f:'saturate(1.15) brightness(1.08)',t:'rgba(255,170,120,.2)'},{n:'Golden',f:'sepia(.35) saturate(1.4) brightness(1.05)',t:'rgba(255,190,60,.15)',o:'vig'},
{n:'Sunset',f:'saturate(1.5) contrast(1.1)',t:'rgba(255,100,40,.22)'},{n:'Cool',f:'saturate(1.1) hue-rotate(10deg)',t:'rgba(60,140,255,.18)'},
{n:'Ice',f:'brightness(1.1) saturate(.9) hue-rotate(15deg)',t:'rgba(150,220,255,.22)'},{n:'Cinema',f:'contrast(1.3) saturate(.85) brightness(.95)',t:'rgba(0,90,110,.15)',o:'bars'},
{n:'Noir',f:'grayscale(1) contrast(1.4)',o:'vig'},{n:'Film',f:'sepia(.25) contrast(1.05) saturate(.9)',o:'grain'},
{n:'Fade',f:'contrast(.8) brightness(1.15) saturate(.7)'},{n:'Pastel',f:'saturate(.8) brightness(1.18) contrast(.9)',t:'rgba(200,180,255,.2)'},
{n:'Dream',f:'brightness(1.12) saturate(1.3)',o:'glow',t:'rgba(255,150,255,.15)'},{n:'Cyber',f:'contrast(1.25) saturate(1.6) hue-rotate(-25deg)',t:'rgba(0,255,230,.12)',o:'scan'},
{n:'Neon',f:'contrast(1.3) saturate(2) hue-rotate(290deg)',o:'glow'},{n:'Glitch',f:'contrast(1.2) saturate(1.3)',o:'glitch'},
{n:'VHS',f:'saturate(1.3) contrast(1.1) blur(.6px)',o:'vhs'},{n:'Sparkle',f:'brightness(1.08) saturate(1.2)',o:'spark'},
{n:'Hearts',f:'saturate(1.2)',t:'rgba(255,60,120,.12)',o:'hearts'},{n:'Vivid',f:'saturate(1.8) contrast(1.15)'},
{n:'Pink Makeup',f:'brightness(1.08) saturate(1.15)',m:{l:'rgba(255,60,120,.55)',b:'rgba(255,110,150,.35)',e:'rgba(255,150,200,.35)'}},
{n:'Red Lips',f:'contrast(1.08) saturate(1.1)',m:{l:'rgba(215,15,40,.65)',b:'rgba(255,120,120,.2)'}},
{n:'Nude',f:'brightness(1.06)',m:{l:'rgba(200,120,110,.5)',b:'rgba(230,150,130,.28)',e:'rgba(190,140,120,.3)'}},
{n:'Glam',f:'contrast(1.12) saturate(1.2)',m:{l:'rgba(180,20,60,.6)',b:'rgba(255,130,100,.3)',e:'rgba(255,190,70,.45)'}},
{n:'Plum',f:'contrast(1.1) saturate(1.15)',m:{l:'rgba(110,20,90,.6)',b:'rgba(190,80,140,.3)',e:'rgba(120,60,170,.4)'}},
{n:'Korean',f:'brightness(1.12) saturate(1.05)',m:{l:'rgba(255,110,110,.45)',b:'rgba(255,150,140,.32)',e:'rgba(240,170,150,.3)'}}];
FILTERS.length=0;NE.forEach(e=>FILTERS.push(Object.assign({css:e.f},e)));
for(let i=0;FILTERS.length<216;i++)FILTERS.push({n:'FT '+(FILTERS.length+1),css:`hue-rotate(${(i*37)%360}deg) saturate(${90+(i%7)*18}%) contrast(${92+(i%5)*7}%) brightness(${92+(i%4)*6}%)${i%9===0?' grayscale(.6)':''}${i%11===0?' sepia(.5)':''}`});

/* ===== camera: canvas + face tracking + quality ===== */
const QL=[['HD',1280],['FHD',1920],['4K',3840],['8K',7680]];let qi=1,camRun=0,beautyOn=true,lm=null,faceM=null,faceTry=0,liveHost='';
const OL=[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185],IL=[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191],LE=[33,246,161,160,159,158,157,173,133],RE=[263,466,388,387,386,385,384,398,362],
OV=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const SPK=Array.from({length:40},()=>({x:Math.random(),y:Math.random(),s:Math.random()*8+3,v:Math.random()*.003+.001,p:Math.random()*6}));
$('camV').classList.add('ghost');
ins('camV','afterend','<canvas id="camC" width="720" height="1280" style="width:100%;height:100%;object-fit:cover"></canvas><div class="sb"><button id="bBtn" onclick="toggleBeauty()">✨</button><button id="qBtn" onclick="cycleQ()">FHD</button></div>');
function P(i){const C=$('camC'),v=$('camV'),q=lm[i],W=C.width,Ht=C.height,s=Math.max(W/v.videoWidth,Ht/v.videoHeight),x=q.x*v.videoWidth*s+(W-v.videoWidth*s)/2;return[facing==='user'?W-x:x,q.y*v.videoHeight*s+(Ht-v.videoHeight*s)/2]}
async function initFace(){try{const M='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',{FaceLandmarker:F,FilesetResolver:R}=await import(M+'/vision_bundle.mjs'),fs=await R.forVisionTasks(M+'/wasm');
 faceM=await F.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1})}catch(e){toast('Face tracking did not load (check internet)')}}
function szCam(){const v=$('camV'),src=Math.max(v.videoWidth||0,v.videoHeight||0)||QL[qi][1],h=Math.min(QL[qi][1],src)&~1,C=$('camC');C.height=h;C.width=Math.round(h*9/16)&~1;if(src<QL[qi][1]-8)toast('Camera max is '+src+'px - recording at that quality')}
window.cycleQ=()=>{qi=(qi+1)%4;$('qBtn').innerText=QL[qi][0];startCam()};
window.toggleBeauty=()=>{beautyOn=!beautyOn;toast(beautyOn?'Beauty on':'Beauty off')};
window.startCam=async()=>{stopCam();try{const h=QL[qi][1];stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:h},height:{ideal:Math.round(h*9/16)}},audio:true});const v=$('camV');v.srcObject=stream;await v.play();szCam();if(!faceTry){faceTry=1;initFace()}if(!camRun){camRun=1;requestAnimationFrame(camLoop)}}catch(e){toast('Live camera needs https. Tap the red button to record with your phone camera')}};
window.setCamF=i=>{camF=i;markOn('#camStrip',i)};
function camLoop(){if(!stream||!$('camScreen').classList.contains('on')){camRun=0;return}try{draw()}catch(e){}requestAnimationFrame(camLoop)}
function draw(){const C=$('camC'),c=C.getContext('2d'),v=$('camV'),W=C.width,Ht=C.height,e=FILTERS[camF]||{},t=performance.now();if(!v.videoWidth)return;
 const dv=()=>{const s=Math.max(W/v.videoWidth,Ht/v.videoHeight),w=v.videoWidth*s,h=v.videoHeight*s;c.save();if(facing==='user'){c.translate(W,0);c.scale(-1,1)}c.drawImage(v,(W-w)/2,(Ht-h)/2,w,h);c.restore()};
 lm=null;if(faceM&&v.readyState>1){try{lm=faceM.detectForVideo(v,t).faceLandmarks[0]||null}catch(_){}}
 c.filter=e.css||'none';dv();c.filter='none';
 const bs=(e.b||0)+(beautyOn?.5:0);
 if(bs>0){c.save();c.beginPath();if(lm){OV.map(P).forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath()}else c.ellipse(W/2,Ht*.42,W*.38,Ht*.3,0,0,7);c.clip();c.globalAlpha=Math.min(.75,bs*.7);c.filter='blur('+W/80+'px) brightness(1.12)';dv();c.restore();c.filter='none'}
 if(e.t){c.fillStyle=e.t;c.fillRect(0,0,W,Ht)}
 if(e.m&&lm){const m=e.m,A=P(33),B=P(263),d=Math.hypot(A[0]-B[0],A[1]-B[1]),sub=a=>{a.map(P).forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath()};
  if(m.e)[LE,RE].forEach(a=>{const u=a.map(P);c.save();c.filter='blur('+d/30+'px)';c.fillStyle=m.e;c.beginPath();u.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));u.slice().reverse().forEach(([x,y])=>c.lineTo(x,y-d*.14));c.closePath();c.fill();c.restore()});
  if(m.b)[205,425].forEach(i=>{const[x,y]=P(i),g=c.createRadialGradient(x,y,0,x,y,d*.32);g.addColorStop(0,m.b);g.addColorStop(1,m.b.replace(/[\d.]+\)$/,'0)'));c.fillStyle=g;c.fillRect(x-d,y-d,d*2,d*2)});
  if(m.l){c.save();c.filter='blur('+d/40+'px)';c.fillStyle=m.l;c.beginPath();sub(OL);sub(IL);c.fill('evenodd');c.restore()}}
 const o=e.o;
 if(o==='blush'&&!lm){c.fillStyle='rgba(255,105,150,.16)';[.33,.67].forEach(x=>{c.beginPath();c.ellipse(W*x,Ht*.47,W*.09,Ht*.04,0,0,7);c.fill()})}
 if(o==='glow'){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.35;c.filter='blur('+W/50+'px) brightness(1.1)';dv();c.restore();c.filter='none'}
 if(o==='vig'||o==='bars'){const g=c.createRadialGradient(W/2,Ht/2,W*.35,W/2,Ht/2,Ht*.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=g;c.fillRect(0,0,W,Ht)}
 if(o==='bars'){c.fillStyle='#000';c.fillRect(0,0,W,Ht*.1);c.fillRect(0,Ht*.9,W,Ht*.1)}
 if(o==='grain')for(let i=0;i<250;i++){c.fillStyle=`rgba(255,255,255,${Math.random()*.12})`;c.fillRect(Math.random()*W,Math.random()*Ht,2,2)}
 if(o==='scan'||o==='vhs'){c.fillStyle='rgba(0,0,0,.18)';for(let y=0;y<Ht;y+=Math.max(4,W/120))c.fillRect(0,y,W,2)}
 if(o==='vhs'){c.fillStyle='rgba(255,255,255,.12)';c.fillRect(0,(t/6)%Ht,W,14)}
 if(o==='glitch'&&Math.random()<.35){const tc=document.createElement('canvas');tc.width=W;tc.height=Ht;tc.getContext('2d').drawImage(C,0,0);for(let i=0;i<3;i++){const y=Math.random()*Ht,h=20+Math.random()*80,d=(Math.random()-.5)*50;c.drawImage(tc,0,y,W,h,d,y,W,h)}c.fillStyle='rgba(255,0,60,.12)';c.fillRect(0,0,W,Ht)}
 if(o==='spark')SPK.forEach(p=>{const a=.5+.5*Math.sin(t*.004+p.p),x=p.x*W,y=((p.y-t*p.v)%1+1)%1*Ht,r=p.s*a*2*W/720;c.fillStyle=`rgba(255,244,170,${a})`;c.beginPath();for(let i=0;i<8;i++){const q=i*Math.PI/4,d=i%2?r*.3:r;c.lineTo(x+Math.cos(q)*d,y+Math.sin(q)*d)}c.fill()});
 if(o==='hearts'){c.fillStyle='rgba(255,60,120,.8)';SPK.slice(0,18).forEach(p=>{const x=p.x*W+Math.sin(t*.002+p.p)*20,y=((p.y-t*p.v*1.2)%1+1)%1*Ht,r=p.s*3*W/720;c.beginPath();c.moveTo(x,y+r*.3);c.bezierCurveTo(x-r,y-r*.5,x-r*.5,y-r*1.2,x,y-r*.5);c.bezierCurveTo(x+r*.5,y-r*1.2,x+r,y-r*.5,x,y+r*.3);c.fill()})}}
window.toggleRec=()=>{if(camMode==='live')return startLive();if(mr&&mr.state==='recording')return mr.stop();if(!stream||!window.MediaRecorder)return $('capFile').click();chunks=[];recSec=0;
 try{const cs=$('camC').captureStream(30);stream.getAudioTracks().forEach(t=>cs.addTrack(t));mr=new MediaRecorder(cs,{videoBitsPerSecond:[3e6,6e6,25e6,60e6][qi]})}catch(e){return $('capFile').click()}
 mr.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 mr.onstop=()=>{clearInterval(recTm);$('recBtn').classList.remove('on');$('recT').innerText='';openEditor(new Blob(chunks,{type:mr.mimeType||'video/webm'}),0,recSec)};
 mr.start();$('recBtn').classList.add('on');recTm=setInterval(()=>{recSec++;$('recT').innerText='● '+recSec+'s';if(recSec>=60)mr.stop()},1000)};

/* ===== payment screenshot ===== */
const shrink=f=>new Promise(r=>{if(!f)return r('');const im=new Image(),fr=new FileReader();fr.onload=()=>{im.onload=()=>{const k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.6))};im.onerror=()=>r('');im.src=fr.result};fr.readAsDataURL(f)});
ins('coinOrderSubmit','beforebegin','<label class="m">Payment screenshot</label><input id="coinShot" type="file" accept="image/*">');
ins('coinOrderSubmit','afterend','<button class="pri" style="background:var(--l);color:#fff" onclick="openWd()">💸 Withdraw coins</button>');
const _so=window.submitCoinOrder;
window.submitCoinOrder=async()=>{const f=$('coinShot').files[0];if(!f)return toast('Upload your payment screenshot first');const shot=await shrink(f);if(!shot)return toast('Could not read the screenshot');const n=ld('facttok_coin_orders',[]).length;_so();const a=ld('facttok_coin_orders',[]);if(a.length>n){a[a.length-1].shot=shot;sv('facttok_coin_orders',a);$('coinShot').value=''}};

/* ===== withdrawal + live gifts (modals) ===== */
const GIFTS=[['🌹','Rose',1],['❤️','Heart',5],['👑','Crown',50],['🚀','Rocket',100]];
ins('uploadModal','beforebegin',`<div class="modal" id="withdrawModal"><div class="sheet"><h3>Withdraw<button onclick="closeM('withdrawModal')">✕</button></h3><p class="m" id="wdInfo"></p><select id="wdAcc"><option>Easypaisa</option><option>JazzCash</option></select><input id="wdName" placeholder="Account holder name"><input id="wdNum" placeholder="Account number" inputmode="numeric"><input id="wdCoins" type="number" placeholder="Coins to withdraw" oninput="wdCalc()"><p>You get: Rs <b id="wdRs">0</b></p><button class="pri" onclick="submitWithdraw()">Request withdrawal</button></div></div>
<div class="modal" id="giftModal"><div class="sheet"><h3>Send a gift<button onclick="closeM('giftModal')">✕</button></h3><div class="grid" id="giftGrid" style="grid-template-columns:repeat(4,1fr)"></div></div></div>`);
$('giftGrid').innerHTML=GIFTS.map((g,i)=>`<div onclick="sendGift(${i})" style="aspect-ratio:auto;padding:12px 4px;text-align:center;font-size:30px;cursor:pointer">${g[0]}<br><small>${g[1]}<br>${g[2]} FT</small></div>`).join('');
ins('liveIn','afterend','<button style="margin:5px 0;flex:0 0 52px" onclick="openM(\'giftModal\')">🎁</button>');
window.openWd=()=>{closeM('balanceModal');$('wdInfo').innerText='Balance: '+(currentUser.coins||0)+' FT. 1 FT = Rs '+CONFIG.withdrawRatePerCoin+'. Minimum '+CONFIG.minWithdraw+' FT. Admin pays after approval.';openM('withdrawModal')};
window.wdCalc=()=>$('wdRs').innerText=Math.floor((+$('wdCoins').value||0)*CONFIG.withdrawRatePerCoin);
window.submitWithdraw=()=>{const c=Math.floor(+$('wdCoins').value),name=$('wdName').value.trim(),num=$('wdNum').value.trim();
 if(c<CONFIG.minWithdraw)return toast('Minimum withdrawal is '+CONFIG.minWithdraw+' FT');if(c>(currentUser.coins||0))return toast('Not enough coins');if(!name||num.length<8)return toast('Enter account name and number');
 currentUser.coins-=c;const w={id:Date.now(),userEmail:currentUser.email,userName:name,acc:$('wdAcc').value,num,coins:c,rs:Math.floor(c*CONFIG.withdrawRatePerCoin),status:'pending',date:new Date().toISOString()};
 const a=ld('facttok_withdrawals',[]);a.push(w);sv('facttok_withdrawals',a);saveAll();updCoins();
 mail('WITHDRAWAL '+c+' FT FROM '+w.userEmail,'Name: '+name+'\nAccount: '+w.acc+' '+num+'\nCoins: '+c+'\nPay: Rs '+w.rs);closeM('withdrawModal');toast('Withdrawal request sent to admin')};
window.wdAct=(id,s)=>{const a=ld('facttok_withdrawals',[]),w=a.find(x=>x.id===id);if(!w||w.status!=='pending')return;w.status=s;sv('facttok_withdrawals',a);const u=getU(w.userEmail);
 if(u){if(s==='rejected')u.coins=(u.coins||0)+w.coins;(u.inbox=u.inbox||[]).push('Your withdrawal of '+w.coins+' FT was '+(s==='paid'?'paid (Rs '+w.rs+')':'rejected, coins returned')+'.')}saveAll();if(u&&u.email===currentUser.email)updCoins();renderAdmin('wd')};
window.sendGift=i=>{const g=GIFTS[i];if((currentUser.coins||0)<g[2])return toast('Not enough FT coins - buy coins in Balance');currentUser.coins-=g[2];const h=getU(liveHost)||currentUser;h.coins=(h.coins||0)+Math.floor(g[2]*CONFIG.giftHostSharePct/100);saveAll();updCoins();
 $('liveChat').insertAdjacentHTML('beforeend',`<div style="color:#ffd84d"><b>@${esc(currentUser.username)}</b> sent ${g[0]} ${g[1]}</div>`);$('liveChat').scrollTop=1e6;closeM('giftModal');toast(g[0]+' '+g[1]+' sent')};
const _sl=window.startLive;window.startLive=()=>{liveHost=currentUser.email;_sl()};

/* ===== admin: screenshots + withdrawals ===== */
document.querySelector('#adminModal .row').insertAdjacentHTML('beforeend','<button onclick="renderAdmin(\'wd\')">Withdraw</button>');
const _ra=window.renderAdmin;
window.renderAdmin=function(t){if(t==='wd'){admTab='wd';$('admBody').innerHTML=ld('facttok_withdrawals',[]).slice().reverse().map(w=>`<div class="adm"><b>${esc(w.userName)}</b> ${esc(w.userEmail)}<br>${w.coins} FT = Rs ${w.rs} to ${esc(w.acc)} ${esc(w.num)}<br>Status: ${w.status}${w.status==='pending'?`<div class="row"><button class="pri" onclick="wdAct(${w.id},'paid')">Mark paid</button><button onclick="wdAct(${w.id},'rejected')" style="margin-top:6px">Reject</button></div>`:''}</div>`).join('')||'<p class="m">Nothing here.</p>';return}
 _ra(t);if(admTab==='orders'){const o=ld('facttok_coin_orders',[]).slice().reverse();document.querySelectorAll('#admBody .adm').forEach((d,i)=>{if(o[i]&&o[i].shot)d.insertAdjacentHTML('beforeend','<img src="'+o[i].shot+'" style="width:100%;border-radius:8px;margin-top:6px">')})}};

/* ===== For You: 4K/8K first, copies blocked ===== */
async function vmeta(b){let q=0,h='';try{const el=document.createElement('video');el.preload='metadata';el.src=URL.createObjectURL(b);await new Promise((a,z)=>{el.onloadedmetadata=a;el.onerror=z});const L=Math.max(el.videoWidth,el.videoHeight);q=L>=7680?3:L>=3840?2:L>=1920?1:0;URL.revokeObjectURL(el.src)}catch(e){}
 try{const n=b.size,s=1<<20,bufs=await Promise.all([b.slice(0,s),b.slice(Math.max(0,n/2-s/2),n/2+s/2),b.slice(Math.max(0,n-s))].map(p=>p.arrayBuffer())),all=new Uint8Array(bufs.reduce((a,x)=>a+x.byteLength,0));let o=0;bufs.forEach(x=>{all.set(new Uint8Array(x),o);o+=x.byteLength});h=n+'-'+[...new Uint8Array(await crypto.subtle.digest('SHA-256',all))].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){}return{q,hash:h}}
function rankFY(l){const hi=l.filter(v=>v.q>=2||!(v.src||v.blobId)).sort((a,b)=>(b.q||0)-(a.q||0)||b.id-a.id),lo=l.filter(v=>!hi.includes(v)),o=[];let j=0;hi.forEach((v,i)=>{o.push(v);if((i+1)%5===0&&lo[j])o.push(lo[j++])});return hi.length?o:lo}
const _rf=window.renderFeed;
window.renderFeed=function(){if(tab==='foryou'&&!$('search').value.trim()){const b=videos;videos=rankFY(b);try{_rf()}finally{videos=b}}else _rf()};
const _pf=window.postFinal;
window.postFinal=async()=>{if(!E)return;const m=await vmeta(E.blob);if(m.hash&&videos.some(x=>x.hash===m.hash))return toast('This video is already on FACT TOK - copies are not allowed');const n=videos.length;await _pf();if(videos.length>n){Object.assign(videos[0],{q:m.q,hash:m.hash});saveAll();if(m.q>=2)toast('4K+ video - boosted on For You')}};
})();
