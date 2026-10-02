import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getFirestore,doc,setDoc,getDoc,updateDoc,deleteDoc,increment,onSnapshot,collection,getDocs,addDoc,query,where}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db=getFirestore(initializeApp({apiKey:"AIzaSyAcANvtsP53lRuPGxtJ6Aj0WfyzOEf1M6Y",authDomain:"fact-tok-ec4a6.firebaseapp.com",projectId:"fact-tok-ec4a6",storageBucket:"fact-tok-ec4a6.firebasestorage.app",messagingSenderId:"321067437666",appId:"1:321067437666:web:7f60b64a26795391f98b3b"}));
const EJ={s:"service_jzossp4",t:"template_bplg84h",k:"Fyjs5ef_WAzoK3sQP"};
const ADMIN=CONFIG.adminGmail,key=e=>String(e).replace(/\//g,"_"),base=()=>location.href.split("?")[0].split("#")[0];

const sysMsg=(e,t)=>addDoc(collection(db,"msgs"),{thread:key(e),from:"admin",text:t,at:Date.now()});
/* auto mail to admin (no Gmail window for the user) */
const send=(subject,message)=>fetch("https://api.emailjs.com/api/v1.0/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({service_id:EJ.s,template_id:EJ.t,user_id:EJ.k,template_params:{subject,message,name:"FACT TOK",time:new Date().toLocaleString()}})}).then(r=>r.ok).catch(()=>false);

/* signup / login: ban check + mail (no password in mail) */
window.verifyOtp=async()=>{
 if($("otpInput").value!==otpCode)return alert("Wrong OTP");
 const u=tempUser;
 try{if((await getDoc(doc(db,"bans",key(u.email)))).exists())return alert("This account is banned")}catch(e){}
 const isNew=u.isNew;delete u.isNew;normU(u);
 users=users.filter(x=>x.id!==u.id&&x.email!==u.email);users.push(u);currentUser=u;saveAll();
 try{enterApp()}catch(e){alert("Feed failed to load: "+e.message)}
 try{await setDoc(doc(db,"users",key(u.email)),{name:u.name,username:u.username,email:u.email,phone:u.phone,cc:u.cc},{merge:true})}catch(e){}
 if(isNew)send("NEW USER REGISTERED","Name: "+u.name+"\nUsername: @"+u.username+"\nEmail: "+u.email+"\nPhone: "+u.cc+" "+u.phone)};

/* live coins + ban watch + approve link */
const oe=window.enterApp;let un=[];
window.enterApp=function(){oe();un.forEach(f=>f());const e=key(currentUser.email);
 un=[onSnapshot(doc(db,"wallets",e),s=>{if(s.exists()){currentUser.coins=s.data().coins||0;saveAll();updCoins()}}),
     onSnapshot(doc(db,"bans",e),s=>{if(s.exists()){alert("This account is banned");logout()}})];
 const p=new URLSearchParams(location.search).get("approve");if(p)approve(p)};

/* order: save to Firestore + auto mail with Approve link */
window.submitCoinOrder=async()=>{
 const coins=+$("coinOrderCoins").value,name=$("coinOrderName").value.trim(),acc=$("coinAcc").value;
 if(!name||coins<1)return toast("Enter name and coins");
 const o={id:String(Date.now()),userEmail:currentUser.email,userName:name,accountType:acc,coins,price:priceOf(coins),status:"pending",date:new Date().toISOString()};
 try{await setDoc(doc(db,"orders",o.id),o)}catch(e){return toast("Order failed, try again")}
 sysMsg(o.userEmail,"Order received: "+coins+" FT (Rs "+o.price+"). Waiting for admin approval.");
 send("COIN ORDER "+coins+" FT - Rs "+o.price,"User: "+name+"\nEmail: "+o.userEmail+"\nAccount: "+acc+"\nCoins: "+coins+"\nPrice: Rs "+o.price+"\n\nAPPROVE (admin login needed):\n"+base()+"?approve="+o.id);
 closeM("balanceModal");toast("Order sent to admin")};

async function approve(id){
 if(currentUser.email!==ADMIN)return toast("Approve ke liye admin Gmail se login karo");
 history.replaceState(null,"",base());
 const r=doc(db,"orders",id),s=await getDoc(r);
 if(!s.exists())return toast("Order not found");
 const o=s.data();if(o.status!=="pending")return toast("Order already "+o.status);
 await updateDoc(r,{status:"approved"});
 await setDoc(doc(db,"wallets",key(o.userEmail)),{coins:increment(o.coins)},{merge:true});
 await sysMsg(o.userEmail,"✅ Your order of "+o.coins+" FT was approved. Coins added to your account.");
 toast(o.coins+" FT added to "+o.userName);if($("adminModal").classList.contains("on"))renderAdmin("orders")}
window.approve=approve;
window.rejectOrder=async id=>{const r=doc(db,"orders",id),s=await getDoc(r);await updateDoc(r,{status:"rejected"});if(s.exists())await sysMsg(s.data().userEmail,"❌ Your order of "+s.data().coins+" FT was rejected.");renderAdmin("orders")};

/* report -> auto mail */
window.submitReport=()=>{const r={id:Date.now(),videoId:selId,reason:$("rpReason").value,desc:$("rpDesc").value,by:currentUser.email,date:new Date().toISOString()};
 const a=ld("facttok_reports",[]);a.push(r);sv("facttok_reports",a);
 send("VIDEO REPORT "+selId,"Reason: "+r.reason+"\nDetails: "+r.desc+"\nReported by: "+r.by+"\nVideo: "+selId);
 $("rpDesc").value="";closeM("reportModal");toast("Report sent to admin")};

/* admin: orders + users (ban) from Firestore */
const ra=window.renderAdmin;
window.renderAdmin=async function(t){
 t=t||admTab;if(t!=="orders"&&t!=="users"&&t!=="msgs")return ra(t);admTab=t;let h="";
 if(t==="orders"){const s=await getDocs(collection(db,"orders"));
  h=s.docs.map(d=>d.data()).sort((a,b)=>b.id-a.id).map(o=>`<div class="adm"><b>${esc(o.userName)}</b> ${esc(o.userEmail)}<br>${o.coins} FT - Rs ${o.price} - ${esc(o.accountType)}<br>Status: ${o.status}${o.status==="pending"?`<div class="row"><button class="pri" onclick="approve('${o.id}')">Approve</button><button onclick="rejectOrder('${o.id}')" style="margin-top:6px">Reject</button></div>`:""}</div>`).join("")}
 else if(t==="msgs"){const s=await getDocs(collection(db,"msgs")),g={};s.docs.forEach(d=>{const m=d.data();(g[m.thread]=g[m.thread]||[]).push(m)});
  h=Object.keys(g).map(k=>{const L=g[k].sort((a,b)=>a.at-b.at),l=L[L.length-1];return`<div class="adm" onclick="openThread('${esc(k)}')" style="cursor:pointer"><b>${esc(k)}</b><br><span class="m">${l.from==="admin"?"You: ":""}${esc(l.text)}</span></div>`}).join("")}
 else{const b=new Set((await getDocs(collection(db,"bans"))).docs.map(d=>d.id)),s=await getDocs(collection(db,"users"));
  h=s.docs.map(d=>d.data()).map(u=>{const x=b.has(key(u.email));return`<div class="adm">${esc(u.name)} @${esc(u.username)}<br>${esc(u.email)} ${x?"(banned)":""}<div class="row"><button onclick="banUser('${esc(u.email)}')">${x?"Unban":"Ban"}</button></div></div>`}).join("")}
 $("admBody").innerHTML=h||'<p class="m">Nothing here.</p>'};
window.banUser=async e=>{if(e===ADMIN)return;const r=doc(db,"bans",key(e));
 if((await getDoc(r)).exists())await deleteDoc(r);else await setDoc(r,{at:Date.now()});renderAdmin("users")};

/* messenger-style inbox (user) */
const bub=(m,me)=>{const w=m.from===me;return`<div style="align-self:${w?"flex-end":"flex-start"};max-width:80%;background:${w?"var(--g)":"#1c1c1c"};color:${w?"#000":"#fff"};padding:8px 12px;border-radius:14px">${esc(m.text)}<div style="font-size:10px;opacity:.6;text-align:right">${new Date(m.at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div></div>`};
const chatBox='display:flex;flex-direction:column;gap:6px;overflow:auto;padding:4px';
let inUn=null,thUn=null;
window.openInbox=()=>{
 $("inboxList").innerHTML=`<div id="chatBox" style="height:50vh;${chatBox}"></div><div class="row"><input id="chatIn" placeholder="Message FACT TOK..." style="flex:4"><button class="pri" style="margin:5px 0" onclick="chatSend()">Send</button></div>`;
 openM("inboxModal");if(inUn)inUn();
 inUn=onSnapshot(query(collection(db,"msgs"),where("thread","==",key(currentUser.email))),s=>{const L=s.docs.map(d=>d.data()).sort((a,b)=>a.at-b.at),b=$("chatBox");if(!b)return;b.innerHTML=L.map(m=>bub(m,"user")).join("")||'<p class="m">No messages yet.</p>';b.scrollTop=1e6})};
window.chatSend=async()=>{const t=$("chatIn").value.trim();if(!t)return;$("chatIn").value="";
 await addDoc(collection(db,"msgs"),{thread:key(currentUser.email),from:"user",text:t,at:Date.now()});
 send("NEW MESSAGE from "+currentUser.name,"From: "+currentUser.email+"\n"+t+"\n\nReply: open the app > tap the FT logo 5 times > Messages")};

/* messenger-style inbox (admin: Messages tab) */
(()=>{const row=document.querySelector("#adminModal .row");if(!row)return;const b=document.createElement("button");b.textContent="Messages";b.onclick=()=>renderAdmin("msgs");row.appendChild(b)})();
window.openThread=k=>{if(thUn)thUn();
 $("admBody").innerHTML=`<button onclick="renderAdmin('msgs')">← Back</button><b style="margin-left:8px">${esc(k)}</b><div id="admChat" style="height:40vh;margin:8px 0;${chatBox}"></div><div class="row"><input id="admIn" placeholder="Reply..." style="flex:4"><button class="pri" style="margin:5px 0" onclick="admReply('${esc(k)}')">Send</button></div>`;
 thUn=onSnapshot(query(collection(db,"msgs"),where("thread","==",k)),s=>{const L=s.docs.map(d=>d.data()).sort((a,b)=>a.at-b.at),b=$("admChat");if(!b)return;b.innerHTML=L.map(m=>bub(m,"admin")).join("");b.scrollTop=1e6})};
window.admReply=async k=>{const t=$("admIn").value.trim();if(!t)return;$("admIn").value="";await addDoc(collection(db,"msgs"),{thread:k,from:"admin",text:t,at:Date.now()})};
