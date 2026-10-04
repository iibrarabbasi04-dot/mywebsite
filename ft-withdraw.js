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
 body:JSON.stringify({service_id:EJ.s,template_id:EJ.t,user_id:EJ.k,template_params:{subject:subject,message:message}})}).then(r=>r.ok).catch(()=>false);

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
