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
const W=()=>ld('facttok_wd_requests',[]);
const pend=u=>W().filter(w=>w.userEmail===u.email&&w.status==='pending').reduce((a,w)=>a+w.coins,0);
const mailAdmin=(subject,message)=>fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({service_id:EJ.s,template_id:EJ.t,user_id:EJ.k,template_params:{subject:subject,message:message,to_email:CONFIG.adminGmail,reply_to:CONFIG.adminGmail}})})
 .then(r=>r.text().then(t=>({ok:r.ok,t:t}))).catch(e=>({ok:false,t:String(e)}));
const BASE=location.href.split('#')[0].split('?')[0];

function ensureModal(){
 if(g('ftwModal'))return;
 const m=document.createElement('div');m.className='modal';m.id='ftwModal';
 m.innerHTML='<div class="sheet"><h3><span>Withdraw coins <small style="color:#9a9a9a;font-weight:400">v3</small></span><button onclick="closeM(\'ftwModal\')">✕</button></h3><div id="ftwBody"></div></div>';
 document.body.appendChild(m);
}

function drawWd(){
 const u=currentUser,b=g('ftwBody');
 if(!u.ftwPin||mode==='change'){
  const has=!!u.ftwPin;
  b.innerHTML=`<p class="m">${has?'Change your withdrawal PIN.':'Withdraw karne ke liye pehle apna Withdrawal PIN banayen (4-6 digits). Har withdrawal par ye PIN lagega.'}</p>
  ${has?'<input id="ftwP0" type="password" inputmode="numeric" maxlength="6" placeholder="Current PIN">':''}
  <input id="ftwP1" type="password" inputmode="numeric" maxlength="6" placeholder="New PIN (4-6 digits)">
  <input id="ftwP2" type="password" inputmode="numeric" maxlength="6" placeholder="Confirm new PIN">
  <button class="pri" onclick="ftwSetPin()">Save PIN</button>${has?'<button style="width:100%;margin-top:8px" onclick="ftwMode(\'main\')">Cancel</button>':''}`;
  return;
 }
 const mine=W().filter(w=>w.userEmail===u.email).slice(-5).reverse();
 b.innerHTML=`<p>Balance: <b>${u.coins||0} FT</b> <span class="m">(pending: ${pend(u)} FT)</span></p>
 <input id="ftwAmt" data-f="amt" autocomplete="off" type="number" min="${MIN}" placeholder="Coins to withdraw (min ${MIN})">
 <select id="ftwAcc" data-f="acc"><option>Easypaisa</option><option>JazzCash</option></select>
 <input id="ftwNum" data-f="num" name="ftw_acc_no" autocomplete="off" inputmode="tel" placeholder="Your account number">
 <input id="ftwName" data-f="name" name="ftw_acc_nm" autocomplete="off" placeholder="Account holder name">
 <input id="ftwPinIn" data-f="pin" autocomplete="new-password" type="password" inputmode="numeric" maxlength="6" placeholder="Withdrawal PIN">
 <button class="pri" onclick="ftwSubmit()">Submit withdrawal</button>
 <button style="width:100%;margin-top:8px" onclick="ftwMode('change')">Change PIN</button>
 <p class="m" style="margin-top:10px">Coins admin ke Accept karne ke baad hi aap ke account se kat'te hain.</p>
 ${mine.length?'<h3 style="margin-top:12px">Recent requests</h3>'+mine.map(w=>`<div class="cm">${w.coins} FT - ${esc(w.accountType)} - <b>${w.status}</b></div>`).join(''):''}`;
}
window.ftwMode=m=>{mode=m;drawWd()};
window.ftwOpen=()=>{ensureModal();mode='main';drawWd();openM('ftwModal')};

window.ftwSetPin=async function(){
 const u=currentUser,p1=g('ftwP1').value,p2=g('ftwP2').value;
 if(u.ftwPin){const p0=g('ftwP0').value;if(await hash(u.email,p0)!==u.ftwPin)return toast('Current PIN is wrong')}
 if(!/^\d{4,6}$/.test(p1))return toast('PIN must be 4-6 digits');
 if(p1!==p2)return toast('PINs do not match');
 u.ftwPin=await hash(u.email,p1);saveAll();mode='main';toast('Withdrawal PIN saved');drawWd();
};

window.ftwSubmit=async function(){
 const u=currentUser;
 if(u.ftwLock&&Date.now()<u.ftwLock)return toast('Too many wrong PINs. Try again in '+Math.ceil((u.ftwLock-Date.now())/60000)+' min');
 const bd=g('ftwBody'),f=k=>{const e=bd.querySelector('[data-f="'+k+'"]');return e?String(e.value||''):''};
 const amt=Math.floor(+f('amt')),acc=f('acc'),num=f('num').trim(),nm=f('name').trim(),pin=f('pin');
 if(!amt)return toast('Pehle coins likhein (kam se kam '+MIN+' FT)');
 if(amt<MIN)return toast('Minimum withdrawal is '+MIN+' FT');
 if(amt+pend(u)>(u.coins||0))return toast('Not enough coins');
 if(!num)return toast('Account number khali hai');
 if(!nm)return toast('Account holder name khali hai');
 if(await hash(u.email,pin)!==u.ftwPin){u.ftwFail=(u.ftwFail||0)+1;if(u.ftwFail>=5){u.ftwLock=Date.now()+5*60000;u.ftwFail=0}saveAll();return toast('Wrong PIN')}
 u.ftwFail=0;
 const w={id:Date.now(),userEmail:u.email,userName:u.name,username:u.username,coins:amt,accountType:acc,accountNumber:num,accountName:nm,status:'pending',date:new Date().toISOString()};
 const a=W();a.push(w);sv('facttok_wd_requests',a);saveAll();
 mailAdmin('WITHDRAWAL REQUEST '+amt+' FT FROM '+u.email,
  'New withdrawal request\nRequest ID: '+w.id+'\nUser: '+u.name+' (@'+u.username+')\nEmail/ID: '+u.email+'\nCoins: '+amt+' FT\nAccount: '+acc+' - '+num+'\nHolder name: '+nm+'\nUser balance now: '+(u.coins||0)+' FT\nStatus: pending\n\nAPPROVE (coins cut honge):\n'+BASE+'?ftwd=approve&id='+w.id+'\n\nREJECT:\n'+BASE+'?ftwd=reject&id='+w.id+'\n\n(Link admin Gmail se login karke kholen.)')
  .then(r=>{if(!r.ok)alert('Admin email send nahi hui.\nEmailJS ka jawab:\n'+r.t)});
 toast('Withdrawal request sent to admin');drawWd();
};

/* ---------- Admin: Withdrawals tab ---------- */
function renderWd(){
 const h=W().slice().reverse().map(w=>`<div class="adm"><b>${esc(w.userName)}</b> ${esc(w.userEmail)}<br>${w.coins} FT - ${esc(w.accountType)} ${esc(w.accountNumber)} (${esc(w.accountName)})<br>Status: ${w.status}${w.status==='pending'?`<div class="row"><button class="pri" onclick="ftwAct(${w.id},'approved')">Accept</button><button onclick="ftwAct(${w.id},'rejected')" style="margin-top:6px">Reject</button></div>`:''}</div>`).join('');
 g('admBody').innerHTML=h||'<p class="m">No withdrawal requests.</p>';
}
window.ftwAct=function(id,s){
 if(!currentUser||currentUser.email!==CONFIG.adminGmail)return toast('Access denied');
 const a=W(),w=a.find(x=>x.id===id);if(!w||w.status!=='pending')return;
 const u=getU(w.userEmail);
 if(s==='approved'){
  if(!u)return toast('User not found');
  if((u.coins||0)<w.coins)return toast('User does not have enough coins');
  u.coins-=w.coins;
 }
 w.status=s;sv('facttok_wd_requests',a);
 if(u){(u.inbox=u.inbox||[]).push('Your withdrawal of '+w.coins+' FT was '+s+'.')}
 saveAll();if(u&&u.email===currentUser.email)updCoins();renderWd();
 toast(s==='approved'?'Accepted - coins deducted':'Rejected');
};

/* ---------- Balance screen: Withdraw button ---------- */
function hook(){
 const sh=g('balanceModal').querySelector('.sheet');let found=false;
 sh.querySelectorAll('button').forEach(b=>{if(b.id!=='ftwBtn'&&/withdraw/i.test(b.textContent)){found=true;b.removeAttribute('onclick');b.onclick=e=>{e.preventDefault();e.stopPropagation();ftwOpen()}}});
 if(!found&&!g('ftwBtn')){
  const b=document.createElement('button');b.id='ftwBtn';b.className='pri';b.style.cssText='background:#2a2a2a;color:#fff';b.textContent='Withdraw coins';b.onclick=ftwOpen;
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

/* ---------- Email link se Approve/Reject ---------- */
(function(){
 const q=new URLSearchParams(location.search),act=q.get('ftwd'),id=+q.get('id');
 if(!act||!id||!/^(approve|reject)$/.test(act))return;
 let n=0;const tm=setInterval(()=>{
  n++;if(n>1800){clearInterval(tm);return}
  try{
   if(typeof currentUser==='undefined'||!currentUser||g('appBox').hidden)return;
   clearInterval(tm);
   try{history.replaceState(null,'',BASE)}catch(e){}
   if(currentUser.email!==CONFIG.adminGmail)return alert('Ye link sirf admin Gmail account se chalta hai.');
   const w=W().find(x=>x.id===id);
   if(!w)return alert('Ye withdrawal request is phone/browser mein nahi mili.\nUser jis device par hai wahi data hai.');
   if(w.status!=='pending')return alert('Ye request pehle hi '+w.status+' ho chuki hai.');
   if(confirm((act==='approve'?'APPROVE':'REJECT')+' withdrawal?\n'+w.userName+' - '+w.coins+' FT\n'+w.accountType+' '+w.accountNumber))window.ftwAct(id,act==='approve'?'approved':'rejected');
  }catch(e){}
 },1000);
})();

let tries=0;
const t=setInterval(()=>{
 tries++;
 try{if(typeof getU==='function'&&typeof saveAll==='function'&&window.openBalance&&window.renderAdmin&&g('adminModal')&&g('balanceModal')){clearInterval(t);setup()}}catch(e){}
 if(tries>150)clearInterval(t);
},100);
})();
