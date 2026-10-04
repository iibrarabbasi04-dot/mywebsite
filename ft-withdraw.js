/* FACT TOK - Withdrawal add-on
   1) Withdraw se pehle user ko apna Withdrawal PIN banana/dalna parta hai
   2) Request submit hote hi admin ki mail par notification jati hai (EmailJS)
   3) Coins tab kat'te hain jab admin "Accept" karta hai (Admin > Withdrawals) */
(function(){
const MIN=100; /* ek withdrawal ke kam se kam coins - yahan se badal sakte hain */
const EJ={s:'service_jzossp4',t:'template_bplg84h',k:'Fyjs5ef_WAzoK3sQP'};
const g=id=>document.getElementById(id);
let mode='main';

async function hash(email,pin){
 try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ft:'+email+':'+pin));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
 catch(e){return 'x'+btoa(unescape(encodeURIComponent('ft:'+email+':'+pin)))}}
const W=()=>ld('facttok_withdrawals',[]);
const pend=u=>W().filter(w=>w.userEmail===u.email&&w.status==='pending').reduce((a,w)=>a+w.coins,0);
const mailAdmin=(subject,message)=>fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({service_id:EJ.s,template_id:EJ.t,user_id:EJ.k,template_params:{subject:subject,message:message}})}).then(r=>r.ok).catch(()=>false);

function ensureModal(){
 if(g('wdModal'))return;
 const m=document.createElement('div');m.className='modal';m.id='wdModal';
 m.innerHTML='<div class="sheet"><h3><span>Withdraw coins</span><button onclick="closeM(\'wdModal\')">✕</button></h3><div id="wdBody"></div></div>';
 document.body.appendChild(m);
}

function drawWd(){
 const u=currentUser,b=g('wdBody');
 if(!u.wdPin||mode==='change'){
  const has=!!u.wdPin;
  b.innerHTML=`<p class="m">${has?'Change your withdrawal PIN.':'Withdraw karne ke liye pehle apna Withdrawal PIN banayen (4-6 digits). Har withdrawal par ye PIN lagega.'}</p>
  ${has?'<input id="wdP0" type="password" inputmode="numeric" maxlength="6" placeholder="Current PIN">':''}
  <input id="wdP1" type="password" inputmode="numeric" maxlength="6" placeholder="New PIN (4-6 digits)">
  <input id="wdP2" type="password" inputmode="numeric" maxlength="6" placeholder="Confirm new PIN">
  <button class="pri" onclick="ftWdSetPin()">Save PIN</button>${has?'<button style="width:100%;margin-top:8px" onclick="ftWdMode(\'main\')">Cancel</button>':''}`;
  return;
 }
 const mine=W().filter(w=>w.userEmail===u.email).slice(-5).reverse();
 b.innerHTML=`<p>Balance: <b>${u.coins||0} FT</b> <span class="m">(pending: ${pend(u)} FT)</span></p>
 <input id="wdAmt" type="number" min="${MIN}" placeholder="Coins to withdraw (min ${MIN})">
 <select id="wdAcc"><option>Easypaisa</option><option>JazzCash</option></select>
 <input id="wdNum" inputmode="tel" placeholder="Your account number">
 <input id="wdName" placeholder="Account holder name">
 <input id="wdPin" type="password" inputmode="numeric" maxlength="6" placeholder="Withdrawal PIN">
 <button class="pri" onclick="ftWdSubmit()">Submit withdrawal</button>
 <button style="width:100%;margin-top:8px" onclick="ftWdMode('change')">Change PIN</button>
 <p class="m" style="margin-top:10px">Coins admin ke Accept karne ke baad hi aap ke account se kat'te hain.</p>
 ${mine.length?'<h3 style="margin-top:12px">Recent requests</h3>'+mine.map(w=>`<div class="cm">${w.coins} FT - ${esc(w.accountType)} - <b>${w.status}</b></div>`).join(''):''}`;
}
window.ftWdMode=m=>{mode=m;drawWd()};
window.ftWdOpen=()=>{ensureModal();mode='main';drawWd();openM('wdModal')};

window.ftWdSetPin=async function(){
 const u=currentUser,p1=g('wdP1').value,p2=g('wdP2').value;
 if(u.wdPin){const p0=g('wdP0').value;if(await hash(u.email,p0)!==u.wdPin)return toast('Current PIN is wrong')}
 if(!/^\d{4,6}$/.test(p1))return toast('PIN must be 4-6 digits');
 if(p1!==p2)return toast('PINs do not match');
 u.wdPin=await hash(u.email,p1);saveAll();mode='main';toast('Withdrawal PIN saved');drawWd();
};

window.ftWdSubmit=async function(){
 const u=currentUser;
 if(u.wdLock&&Date.now()<u.wdLock)return toast('Too many wrong PINs. Try again in '+Math.ceil((u.wdLock-Date.now())/60000)+' min');
 const amt=Math.floor(+g('wdAmt').value),acc=g('wdAcc').value,num=g('wdNum').value.trim(),nm=g('wdName').value.trim(),pin=g('wdPin').value;
 if(!(amt>=MIN))return toast('Minimum withdrawal is '+MIN+' FT');
 if(amt+pend(u)>(u.coins||0))return toast('Not enough coins');
 if(!num||!nm)return toast('Enter account number and name');
 if(await hash(u.email,pin)!==u.wdPin){u.wdFail=(u.wdFail||0)+1;if(u.wdFail>=5){u.wdLock=Date.now()+5*60000;u.wdFail=0}saveAll();return toast('Wrong PIN')}
 u.wdFail=0;
 const w={id:Date.now(),userEmail:u.email,userName:u.name,username:u.username,coins:amt,accountType:acc,accountNumber:num,accountName:nm,status:'pending',date:new Date().toISOString()};
 const a=W();a.push(w);sv('facttok_withdrawals',a);saveAll();
 mailAdmin('WITHDRAWAL REQUEST '+amt+' FT FROM '+u.email,
  'New withdrawal request\nRequest ID: '+w.id+'\nUser: '+u.name+' (@'+u.username+')\nEmail/ID: '+u.email+'\nCoins: '+amt+' FT\nAccount: '+acc+' - '+num+'\nHolder name: '+nm+'\nUser balance now: '+(u.coins||0)+' FT\nStatus: pending\n\nAccept/Reject karne ke liye app mein Admin > Withdrawals kholen.')
  .then(ok=>{if(!ok)toast('Request saved, but admin email could not be sent')});
 toast('Withdrawal request sent to admin');drawWd();
};

/* ---------- Admin: Withdrawals tab ---------- */
function renderWd(){
 const h=W().slice().reverse().map(w=>`<div class="adm"><b>${esc(w.userName)}</b> ${esc(w.userEmail)}<br>${w.coins} FT - ${esc(w.accountType)} ${esc(w.accountNumber)} (${esc(w.accountName)})<br>Status: ${w.status}${w.status==='pending'?`<div class="row"><button class="pri" onclick="ftWdAct(${w.id},'approved')">Accept</button><button onclick="ftWdAct(${w.id},'rejected')" style="margin-top:6px">Reject</button></div>`:''}</div>`).join('');
 g('admBody').innerHTML=h||'<p class="m">No withdrawal requests.</p>';
}
window.ftWdAct=function(id,s){
 if(!currentUser||currentUser.email!==CONFIG.adminGmail)return toast('Access denied');
 const a=W(),w=a.find(x=>x.id===id);if(!w||w.status!=='pending')return;
 const u=getU(w.userEmail);
 if(s==='approved'){
  if(!u)return toast('User not found');
  if((u.coins||0)<w.coins)return toast('User does not have enough coins');
  u.coins-=w.coins;
 }
 w.status=s;sv('facttok_withdrawals',a);
 if(u){(u.inbox=u.inbox||[]).push('Your withdrawal of '+w.coins+' FT was '+s+'.')}
 saveAll();if(u&&u.email===currentUser.email)updCoins();renderWd();
 toast(s==='approved'?'Accepted - coins deducted':'Rejected');
};

/* ---------- Balance screen: Withdraw button ---------- */
function hook(){
 const sh=g('balanceModal').querySelector('.sheet');let found=false;
 sh.querySelectorAll('button').forEach(b=>{if(b.id!=='ftWdBtn'&&/withdraw/i.test(b.textContent)){found=true;b.removeAttribute('onclick');b.onclick=e=>{e.preventDefault();e.stopPropagation();ftWdOpen()}}});
 if(!found&&!g('ftWdBtn')){
  const b=document.createElement('button');b.id='ftWdBtn';b.className='pri';b.style.cssText='background:#2a2a2a;color:#fff';b.textContent='Withdraw coins';b.onclick=ftWdOpen;
  const ref=g('coinOrderSubmit');if(ref&&ref.parentNode)ref.parentNode.insertBefore(b,ref.nextSibling);else sh.appendChild(b);
 }
}

function setup(){
 if(window.__ftwd)return;window.__ftwd=1;
 const _ob=window.openBalance;
 window.openBalance=function(){_ob.apply(this,arguments);hook()};
 const row=g('adminModal').querySelector('.row');
 const nb=document.createElement('button');nb.textContent='Withdrawals';nb.onclick=()=>renderAdmin('wd');row.appendChild(nb);
 const _ra=window.renderAdmin;
 window.renderAdmin=function(t){if(t==='wd'){renderWd();return}return _ra.apply(this,arguments)};
}

let tries=0;
const t=setInterval(()=>{
 tries++;
 try{if(typeof getU==='function'&&typeof saveAll==='function'&&window.openBalance&&window.renderAdmin&&g('adminModal')&&g('balanceModal')){clearInterval(t);setup()}}catch(e){}
 if(tries>150)clearInterval(t);
},100);
})();
