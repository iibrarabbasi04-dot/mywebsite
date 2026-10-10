/* =====================================================================
   FACT TOK - ft-sync.js
   Asli login (Firebase Auth) + sab users ke accounts, videos, likes,
   comments, follow aur inbox DM (Firestore) + video upload (Cloudinary).

   Load karna: app.html ke BAAD  ->  <script type="module" src="ft-sync.js"></script>
   Zaroori: Firebase Console -> Authentication -> Sign-in method -> Email/Password ON
   Collections (naye, purani collections ko nahi chhedte):
     ftProfiles, ftPrivate, ftVideos, ftComments, ftMessages
   ===================================================================== */
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,sendEmailVerification} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,collection,doc,setDoc,updateDoc,addDoc,deleteDoc,onSnapshot,query,where,orderBy,limit,serverTimestamp,arrayUnion,arrayRemove} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ---------- SETTINGS (yahan apni values daalein) ---------- */
const USER_CFG=window.FT_SYNC_CONFIG||{};
const CFG={
  firebase:Object.assign({apiKey:'AIzaSyAcANvtsP53lRuPGxtJ6Aj0WfyzOEf1M6Y',authDomain:'fact-tok-ec4a6.firebaseapp.com',projectId:'fact-tok-ec4a6',storageBucket:'fact-tok-ec4a6.firebasestorage.app',messagingSenderId:'321067437666',appId:'1:321067437666:web:7f60b64a26795391f98b3b'},USER_CFG.firebase||{}),
  cloudName:USER_CFG.cloudName||'pyg48o7d',  // Cloudinary Cloud name
  uploadPreset:USER_CFG.uploadPreset||'x4lkul6v',    // <-- yahan inverted commas ke andar apna UNSIGNED upload preset ka naam likhein
  adminEmail:'iibrarabbasi04@gmail.com',
  emailjs:{service:'service_jzossp4',template:'template_bplg84h',key:'Fyjs5ef_WAzoK3sQP'}
};

const $=id=>document.getElementById(id);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const digits=s=>String(s||'').replace(/\D/g,'');
const phoneMail=(cc,ph)=>'p'+digits(cc)+digits(ph)+'@phone.facttok.app';
const LS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const say=m=>{try{toast(m)}catch(e){console.log(m)}};

const ERR={
  'auth/email-already-in-use':'Ye account pehle se maujood hai. Log in karein.',
  'auth/invalid-credential':'Email/phone ya password galat hai.',
  'auth/invalid-login-credentials':'Email/phone ya password galat hai.',
  'auth/wrong-password':'Password galat hai.',
  'auth/user-not-found':'Is naam ka account nahi mila. Pehle Sign up karein.',
  'auth/weak-password':'Password kam az kam 6 characters ka rakhein.',
  'auth/invalid-email':'Email sahi nahi hai.',
  'auth/network-request-failed':'Internet check karein.',
  'auth/too-many-requests':'Bohat koshishein ho gayin, thori der baad try karein.',
  'auth/operation-not-allowed':'Firebase Console mein Email/Password sign-in ON nahi hai.',
  'permission-denied':'Cloud ne permission nahi di (Firestore rules check karein).'
};
const friendly=e=>ERR[e&&e.code]||('Masla: '+((e&&e.message)||e));

const state={uid:null,authUser:null,isAdminAcct:false,adminUid:null,ready:false,authSeq:0,signup:null,adopt:null,
  dirtyProfile:false,dirtyPriv:false,lastProfile:'',lastPriv:'',pend:new Map(),up:new Set(),failAt:new Map(),
  unsubs:[],sig:'',dm:null,errShown:false,adminAsked:false,
  cache:{profiles:new Map(),videos:new Map(),comments:[],priv:null,privAll:new Map(),msgIn:new Map(),msgOut:new Map()}};
let legacy={users:LS('facttok_legacy_users',[]),videos:LS('facttok_legacy_videos',[])};
const saveLegacy=()=>{LSset('facttok_legacy_users',legacy.users);LSset('facttok_legacy_videos',legacy.videos)};

/* admin ki pehchaan: sirf wohi account jis ka profile mein admin:true ho (rules ke zariye, verified Gmail) */
const keyOf=uid=>(state.adminUid&&uid===state.adminUid)?CONFIG.adminGmail:uid;
const uidOf=key=>key===CONFIG.adminGmail?state.adminUid:key;
const myKey=()=>keyOf(state.uid);

let app=getApps()[0];
if(!app&&CFG.firebase.apiKey)app=initializeApp(CFG.firebase);   // facttok-cloud.js ki wohi app dobara use hoti hai

(async function main(){
  if(!(await appReady())){console.warn('ft-sync: app.html ka data nahi mila');return}
  await cloudModuleReady();
  if(!app){say('Cloud sync band: Firebase config (apiKey/appId) nahi mila');console.warn('ft-sync: FT_SYNC_CONFIG.firebase.apiKey chahiye');return}
  const auth=getAuth(app),db=getFirestore(app);

  /* ---------- 1) Purane (local) accounts ko alag rakhna ---------- */
  stashLegacy();

  /* ---------- 2) App ke functions ka cloud version ---------- */
  window.saveAll=function(){
    try{
      const me=state.uid&&currentUser;
      sv('facttok_users',me?[currentUser]:[]);
      sv('facttok_videos',videos.filter(v=>!v.ftCloud&&me&&v.owner===myKey()));
      if(me)sv('facttok_current_user',currentUser);
    }catch(e){}
    try{syncOut()}catch(e){console.error('ft-sync syncOut',e)}
  };
  window.verifyOtp=()=>{};window.resendOtp=()=>{};
  try{$('otpArea').style.display='none'}catch(e){}
  window.signupPhone=()=>doSignup('p');
  window.signupGmail=()=>doSignup('g');
  window.loginPhone=()=>{const cc=$('liCC').value,ph=digits($('liPhone').value),p=$('liPassP').value;
    if(ph.length<7)return alert('Phone number sahi likhein');
    doLogin(phoneMail(cc,ph),p,u=>u.phone===ph&&u.cc===cc&&u.pass===p)};
  window.loginGmail=()=>{const e=$('liEmail').value.trim().toLowerCase(),p=$('liPassG').value;
    if(!/^\S+@\S+\.\S+$/.test(e))return alert('Sahi Gmail likhein');
    doLogin(e,p,u=>u.email===e&&u.pass===p)};
  window.logout=async()=>{try{await signOut(auth)}catch(e){}localStorage.removeItem('facttok_current_user');location.reload()};
  addResetLink();

  /* ---------- 3) Signup / Login ---------- */
  function busy(b){document.querySelectorAll('#authBox .pri').forEach(x=>x.disabled=b)}
  async function makeProfile(uid,p,priv){
    const base=(p.name||'user').toLowerCase().replace(/[^a-z0-9]/g,'')||'user';
    const username=(p.username||(base+Math.floor(100+Math.random()*900))).slice(0,30);
    await setDoc(doc(db,'ftProfiles',uid),{uid,name:String(p.name||'User').slice(0,40),username,usernameLower:username.toLowerCase(),
      bio:String(p.bio||'').slice(0,160),dp:p.dp||'',private:!!p.private,allowDownload:p.allowDownload!==false,
      followingList:[],verified:false,banned:false,admin:false,createdAt:serverTimestamp()});
    await setDoc(doc(db,'ftPrivate',uid),{uid,email:priv.email||'',phone:priv.phone||'',cc:priv.cc||'',saved:[],reposts:[],createdAt:serverTimestamp()});
    return username;
  }
  async function doSignup(mode){
    const g=mode==='g',name=$(g?'suNameG':'suNameP').value.trim(),p1=$(g?'suPassG':'suPassP').value,p2=$(g?'suCPassG':'suCPassP').value;
    if(!name)return alert('Enter your name');if(p1.length<6)return alert('Password must be 6+ characters');if(p1!==p2)return alert('Passwords do not match');
    let authEmail,phone='',cc='';
    if(g){authEmail=$('suEmailG').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(authEmail))return alert('Enter a valid Gmail')}
    else{phone=digits($('suPhone').value);cc=$('suCC').value;if(phone.length<7)return alert('Enter a valid phone number');authEmail=phoneMail(cc,phone)}
    busy(true);
    state.signup=(async()=>{
      const cred=await createUserWithEmailAndPassword(auth,authEmail,p1);
      const username=await makeProfile(cred.user.uid,{name},{email:g?authEmail:'',phone,cc});
      if(g)sendEmailVerification(cred.user).catch(()=>{});
      notifyAdmin('NEW USER REGISTERED','Name: '+name+'\nUsername: @'+username+'\n'+(g?'Gmail: '+authEmail:'Phone: '+cc+' '+phone));
      return cred;
    })();
    try{await state.signup;say('Account ban gaya')}
    catch(e){state.signup=null;if(!String(e.code||'').startsWith('auth/')){try{await signOut(auth)}catch(x){}}alert(friendly(e))}
    finally{busy(false)}
  }
  async function doLogin(authEmail,pass,legacyTest){
    if(!pass)return alert('Password likhein');
    busy(true);
    try{
      try{await signInWithEmailAndPassword(auth,authEmail,pass)}
      catch(e){
        const nouser=['auth/user-not-found','auth/invalid-credential','auth/invalid-login-credentials'].includes(e.code);
        const lg=nouser&&legacy.users.find(legacyTest);
        if(!lg)throw e;
        /* purana account: wohi password se cloud account bana kar migrate */
        state.signup=(async()=>{
          const cred=await createUserWithEmailAndPassword(auth,authEmail,pass);
          const isPhone=/@phone\.facttok$/.test(lg.email);
          await makeProfile(cred.user.uid,{name:lg.name,username:lg.username,bio:lg.bio,dp:lg.dp,private:lg.private,allowDownload:lg.allowDownload},
            {email:isPhone?'':lg.email,phone:lg.phone,cc:lg.cc});
          state.adopt={oldKey:lg.email};
          return cred;
        })();
        try{await state.signup;say('Purana account cloud par aa gaya')}
        catch(e2){state.signup=null;throw (e2.code==='auth/email-already-in-use'?{code:'auth/wrong-password'}:e2)}
      }
    }catch(e){alert(friendly(e))}
    finally{busy(false)}
  }
  function addResetLink(){
    const box=$('liG');if(!box||$('ftReset'))return;
    const b=document.createElement('button');b.id='ftReset';b.type='button';b.textContent='Password bhool gaye?';
    b.style.cssText='background:none;color:#1ed760;width:100%;margin-top:8px';
    b.onclick=async()=>{const e=$('liEmail').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(e))return alert('Pehle upar Gmail likhein');
      try{await sendPasswordResetEmail(auth,e);alert('Reset link '+e+' par bhej diya (Spam bhi check karein)')}catch(x){alert(friendly(x))}};
    box.appendChild(b);
  }
  function notifyAdmin(subject,message){
    try{fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({service_id:CFG.emailjs.service,template_id:CFG.emailjs.template,user_id:CFG.emailjs.key,template_params:{subject,message}})}).catch(()=>{})}catch(e){}
  }

  /* ---------- 4) Auth state ---------- */
  function loginScreen(){
    try{currentUser=null}catch(e){}
    document.querySelectorAll('.modal').forEach(m=>m.classList.remove('on'));
    $('appBox').hidden=true;$('authBox').hidden=false;
  }
  onAuthStateChanged(auth,async user=>{
    const seq=++state.authSeq;stopCloud();state.ready=false;
    if(!user){state.uid=null;state.authUser=null;loginScreen();return}
    if(state.signup){try{await state.signup}catch(e){return}}
    if(seq!==state.authSeq)return;
    state.authUser=user;state.uid=user.uid;
    try{await user.reload();if((user.email||'').toLowerCase()===CFG.adminEmail)await user.getIdToken(true)}catch(e){}
    await startCloud(user,seq);
  });
  function stopCloud(){state.unsubs.forEach(u=>{try{u()}catch(e){}});state.unsubs=[];
    const c=state.cache;c.profiles=new Map();c.videos=new Map();c.comments=[];c.priv=null;c.privAll=new Map();c.msgIn=new Map();c.msgOut=new Map();
    state.pend.clear();state.dirtyProfile=state.dirtyPriv=false;state.lastProfile=state.lastPriv='';state.adminUid=null;state.isAdminAcct=false}
  function onErr(err){console.error('ft-sync',err);if(!state.errShown){state.errShown=true;say(friendly(err));setTimeout(()=>state.errShown=false,8000)}}
  function listen(q,fn){return new Promise(res=>{let first=true;
    const un=onSnapshot(q,snap=>{try{fn(snap)}catch(e){console.error(e)}if(first){first=false;res()}else schedule()},err=>{onErr(err);if(first){first=false;res()}});
    state.unsubs.push(un)})}
  const toMs=t=>t&&t.toMillis?t.toMillis():(typeof t==='number'?t:Date.now());

  async function startCloud(user,seq){
    const uid=user.uid,c=state.cache,mailLC=(user.email||'').toLowerCase();
    const adminOK=mailLC===CFG.adminEmail&&user.emailVerified===true;
    state.isAdminAcct=adminOK;
    if(mailLC===CFG.adminEmail&&!user.emailVerified&&!state.adminAsked){state.adminAsked=true;
      sendEmailVerification(user).catch(()=>{});alert('Admin Gmail verify nahi hai. Aap ke Gmail par verification link bheja hai: use khol kar dobara login karein, tab admin panel chalega.')}
    const jobs=[
      listen(collection(db,'ftProfiles'),s=>{c.profiles=new Map();s.forEach(d=>c.profiles.set(d.id,d.data()))}),
      listen(query(collection(db,'ftVideos'),orderBy('createdAt','desc'),limit(100)),s=>{c.videos=new Map();s.forEach(d=>c.videos.set(d.id,d.data({serverTimestamps:'estimate'})))}),
      listen(query(collection(db,'ftComments'),orderBy('ts','desc'),limit(600)),s=>{c.comments=[];s.forEach(d=>{const x=d.data({serverTimestamps:'estimate'});c.comments.push({id:d.id,videoId:x.videoId,uid:x.uid,u:x.u,t:x.t,ts:toMs(x.ts)})});c.comments.sort((a,b)=>a.ts-b.ts)}),
      listen(doc(db,'ftPrivate',uid),s=>{c.priv=s.exists()?s.data():null}),
      listen(query(collection(db,'ftMessages'),where('to','==',uid)),s=>{c.msgIn=new Map();s.forEach(d=>c.msgIn.set(d.id,msgOf(d)))}),
      listen(query(collection(db,'ftMessages'),where('from','==',uid)),s=>{c.msgOut=new Map();s.forEach(d=>c.msgOut.set(d.id,msgOf(d)))})
    ];
    if(adminOK)jobs.push(listen(collection(db,'ftPrivate'),s=>{c.privAll=new Map();s.forEach(d=>c.privAll.set(d.id,d.data()))}));
    await Promise.race([Promise.all(jobs),wait(15000)]);
    if(seq!==state.authSeq)return;
    if(!c.profiles.has(uid)){
      try{await makeProfile(uid,{name:(user.displayName||mailLC.split('@')[0]||'User')},{email:/@phone\.facttok\.app$/.test(mailLC)?'':mailLC});
        c.profiles.set(uid,{uid,name:mailLC.split('@')[0]||'User',username:'user'+Math.floor(100+Math.random()*900),bio:'',dp:'',followingList:[]})}catch(e){onErr(e)}
    }
    const mine=c.profiles.get(uid)||{};
    if(adminOK&&mine.admin!==true){try{await updateDoc(doc(db,'ftProfiles',uid),{admin:true});mine.admin=true}catch(e){console.error(e)}}
    if(mine.banned){alert('Ye account ban hai');try{await signOut(auth)}catch(e){}return}
    state.ready=true;
    rebuild();
    adoptLegacy();
    try{enterApp()}catch(e){console.error(e);alert('Feed load nahi hui: '+e.message)}
    refreshUI(true);
    syncOut();
  }
  const msgOf=d=>{const x=d.data({serverTimestamps:'estimate'});return{id:d.id,from:x.from,to:x.to,text:x.text,ts:toMs(x.ts)}};

  /* ---------- 5) Cloud data se local arrays banana ---------- */
  let rbT=null;
  function schedule(){clearTimeout(rbT);rbT=setTimeout(()=>{if(!state.ready)return;rebuild();refreshUI(false)},150)}
  function rebuild(){
    const c=state.cache,me=state.uid;if(!me)return;
    const found=[...c.profiles].find(([id,p])=>p.admin===true);
    state.adminUid=found?found[0]:(state.isAdminAcct?me:null);
    const mk=myKey(),priv=c.priv||{};
    const fc=new Map();c.profiles.forEach(p=>(p.followingList||[]).forEach(t=>fc.set(t,(fc.get(t)||0)+1)));
    const byKey=new Map(users.map(u=>[u.email,u]));users.length=0;
    c.profiles.forEach((p,uid)=>{
      const k=keyOf(uid),u=byKey.get(k)||{},isMe=uid===me;
      const f={id:uid,email:k,name:p.name||'User',username:p.username||'user',phone:'',cc:'',pass:'',followers:fc.get(uid)||0,verified:!!p.verified,banned:!!p.banned};
      if(!(isMe&&state.dirtyProfile))Object.assign(f,{bio:p.bio||'',dp:p.dp||'',private:!!p.private,allowDownload:p.allowDownload!==false,followingList:(p.followingList||[]).map(keyOf)});
      if(isMe&&!state.dirtyPriv){f.saved=Array.isArray(priv.saved)?priv.saved.slice():[];f.reposts=Array.isArray(priv.reposts)?priv.reposts.slice():[]}
      Object.assign(u,f);normU(u);users.push(u);
    });
    currentUser=users.find(u=>u.email===mk)||currentUser;
    /* videos */
    const local=videos.filter(v=>!v.ftCloud&&v.owner===mk).map(v=>(v.owner=mk,v));
    const byId=new Map(videos.map(v=>[String(v.id),v]));
    const cloud=[];
    c.videos.forEach((d,id)=>{
      const n=Number(id);if(!isFinite(n))return;
      const v=byId.get(id)||{};
      const likedBy=(d.likedBy||[]).map(keyOf);
      Object.assign(v,{id:n,owner:keyOf(d.owner),caption:d.caption||'',tags:d.tags||'',loc:d.loc||'',src:d.url||'',blobId:'',vis:d.vis||'all',
        allowComments:d.allowComments!==false,allowDownload:d.allowDownload!==false,bg:d.bg||'#111',likedBy,likes:likedBy.length,ftCloud:true,_ms:toMs(d.createdAt)});
      if(d.fx)v.fx=d.fx;else delete v.fx;
      if(state.pend.has(id)){const want=state.pend.get(id),has=v.likedBy.includes(mk);
        if(want&&!has){v.likedBy.push(mk);v.likes++}else if(!want&&has){v.likedBy=v.likedBy.filter(x=>x!==mk);v.likes--}}
      v.comments=c.comments.filter(x=>x.videoId===id).map(x=>({u:x.u,t:x.t,id:x.id,uid:x.uid}));
      cloud.push(v);
    });
    const localKeep=local.filter(v=>!c.videos.has(String(v.id)));
    videos.length=0;videos.push(...localKeep.map(normV),...cloud.map(normV));
  }
  function adoptLegacy(){
    const a=state.adopt;if(!a)return;state.adopt=null;
    const mine=legacy.videos.filter(v=>v.owner===a.oldKey);
    legacy.videos=legacy.videos.filter(v=>v.owner!==a.oldKey);legacy.users=legacy.users.filter(u=>u.email!==a.oldKey);saveLegacy();
    mine.forEach(v=>{v.owner=myKey();v.ftCloud=false;videos.unshift(normV(v))});
    if(mine.length)say(mine.length+' purani videos cloud par ja rahi hain');
    try{window.saveAll()}catch(e){}
  }
  function refreshUI(force){
    if(!state.ready||!currentUser)return;
    const mk=myKey();
    const sig=videos.map(v=>v.id+':'+v.owner+':'+v.src+':'+v.caption+':'+v.vis).join('|')+'#'+users.map(u=>u.email+u.name+u.username+(u.dp||'').length+(u.verified?1:0)+(u.banned?1:0)).join('|')+'#'+(currentUser.followingList||[]).join(',');
    if(force||sig!==state.sig){state.sig=sig;const f=$('feed'),top=f?f.scrollTop:0;
      if(!$('appBox').hidden){try{renderFeed()}catch(e){console.error(e)}if(f)f.scrollTop=top}}
    else videos.forEach(v=>{
      const b=$('likeBtn'+v.id);if(b)b.innerHTML=(v.likedBy.includes(mk)?'❤️':'🤍')+'<small>'+fmt(v.likes)+'</small>';
      const cm=document.querySelector('button[onclick="openComments('+v.id+')"] small');if(cm)cm.textContent=v.comments.length});
    try{if($('commentModal').classList.contains('on')&&selId!=null&&vid(selId))drawComments()}catch(e){}
    try{updCoins()}catch(e){}
    updBadge();if(state.dm)dmRender();
    if(currentUser&&currentUser.banned){alert('Ye account ban kar diya gaya hai');signOut(auth).then(()=>{localStorage.removeItem('facttok_current_user');location.reload()})}
  }

  /* ---------- 6) Local badlaav ko cloud par bhejna ---------- */
  const stable=o=>JSON.stringify(o);
  function syncOut(){
    if(!state.ready||!state.uid||!currentUser)return;
    const uid=state.uid,mk=myKey(),me=currentUser,c=state.cache;
    /* profile */
    if(me.dp&&String(me.dp).startsWith('data:')&&CFG.cloudName&&CFG.uploadPreset&&!state.dpUp){
      state.dpUp=true;
      cloudUpload(dataBlob(me.dp),'dp.jpg').then(j=>{me.dp=j.secure_url;try{window.saveAll()}catch(e){}}).catch(e=>console.error('dp upload',e)).finally(()=>state.dpUp=false);
      return;
    }
    const prof={name:String(me.name||'User').slice(0,40),username:me.username,usernameLower:String(me.username||'').toLowerCase(),bio:String(me.bio||'').slice(0,160),dp:me.dp||'',
      private:!!me.private,allowDownload:me.allowDownload!==false,followingList:(me.followingList||[]).map(uidOf).filter(x=>x&&c.profiles.has(x)&&x!==uid)};
    const pj=stable(prof),rp=c.profiles.get(uid)||{},rj=stable({name:rp.name,username:rp.username,usernameLower:rp.usernameLower,bio:rp.bio||'',dp:rp.dp||'',private:!!rp.private,allowDownload:rp.allowDownload!==false,followingList:rp.followingList||[]});
    if(pj!==rj&&pj!==state.lastProfile&&(prof.dp.length<200000)){
      state.lastProfile=pj;state.dirtyProfile=true;
      updateDoc(doc(db,'ftProfiles',uid),prof).catch(e=>{state.lastProfile='';onErr(e)}).finally(()=>{state.dirtyProfile=false;schedule()});
    }
    /* saved / reposts */
    const pv={saved:(me.saved||[]).slice(0,2000),reposts:(me.reposts||[]).slice(0,2000)},vj=stable(pv),cp=c.priv||{},cj=stable({saved:cp.saved||[],reposts:cp.reposts||[]});
    if(vj!==cj&&vj!==state.lastPriv){state.lastPriv=vj;state.dirtyPriv=true;
      updateDoc(doc(db,'ftPrivate',uid),pv).catch(e=>{state.lastPriv='';onErr(e)}).finally(()=>{state.dirtyPriv=false;schedule()})}
    /* likes */
    c.videos.forEach((d,id)=>{
      const v=videos.find(x=>String(x.id)===id);if(!v)return;
      const has=v.likedBy.includes(mk),remote=(d.likedBy||[]).includes(uid),pend=state.pend.get(id),cur=pend!==undefined?pend:remote;
      if(has===cur)return;
      state.pend.set(id,has);
      updateDoc(doc(db,'ftVideos',id),{likedBy:has?arrayUnion(uid):arrayRemove(uid)}).catch(onErr).finally(()=>{if(state.pend.get(id)===has)state.pend.delete(id);schedule()});
    });
    /* nayi videos */
    videos.filter(v=>!v.ftCloud&&v.owner===mk&&v.vis!=='me'&&!c.videos.has(String(v.id))&&!state.up.has(v.id)&&(state.failAt.get(v.id)||0)<Date.now()-60000).forEach(pushVideo);
  }
  async function pushVideo(v){
    const uid=state.uid;state.up.add(v.id);
    try{
      let url=v.src||'';
      if(v.blobId){const b=await idbGet(v.blobId);if(!b)throw new Error('Video file is device par nahi mili');url=await uploadVideoBlob(b,v.id)}
      else if(url.startsWith('data:'))url=await uploadVideoBlob(dataBlob(url),v.id);
      if(url&&!/^https:\/\//.test(url))throw new Error('Video link https:// se shuru hona chahiye');
      const id=String(v.id);
      await setDoc(doc(db,'ftVideos',id),{owner:uid,caption:String(v.caption||'').slice(0,300),tags:String(v.tags||'').slice(0,200),loc:String(v.loc||'').slice(0,80),url,
        vis:v.vis==='me'?'me':'all',allowComments:v.allowComments!==false,allowDownload:v.allowDownload!==false,fx:v.fx?JSON.parse(JSON.stringify(v.fx)):null,bg:String(v.bg||'#111').slice(0,120),likedBy:[],createdAt:serverTimestamp()});
      say('Video sab ko dikhne lagi');
    }catch(e){console.error('upload',e);state.failAt.set(v.id,Date.now());say('Upload nahi hui: '+(e.message||e))}
    finally{state.up.delete(v.id)}
  }
  async function uploadVideoBlob(blob,id){
    const j=await cloudUpload(blob,'video-'+id+'.webm',p=>say('Video upload '+p+'%'));
    /* har phone par chalne ke liye mp4 (h264) mein convert karke dena */
    return j.resource_type==='video'?j.secure_url.replace('/upload/','/upload/f_mp4,vc_h264,ac_aac,q_auto/').replace(/\.\w+$/,'.mp4'):j.secure_url;
  }
  function dataBlob(u){const m=/^data:([^;]+);base64,(.*)$/.exec(u);if(!m)throw new Error('bad data url');const bin=atob(m[2]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:m[1]})}
  function cloudUpload(blob,name,onPct){
    return new Promise((res,rej)=>{
      if(!CFG.cloudName||!CFG.uploadPreset)return rej(new Error('Cloudinary Cloud name / upload preset set nahi'));
      const fd=new FormData();fd.append('file',blob,name||'file');fd.append('upload_preset',CFG.uploadPreset);
      const x=new XMLHttpRequest();x.open('POST','https://api.cloudinary.com/v1_1/'+CFG.cloudName+'/auto/upload');
      x.upload.onprogress=e=>{if(e.lengthComputable&&onPct)onPct(Math.round(e.loaded/e.total*100))};
      x.onload=()=>{try{const j=JSON.parse(x.responseText);if(x.status>=200&&x.status<300&&j.secure_url)res(j);else rej(new Error((j.error&&j.error.message)||('HTTP '+x.status)))}catch(e){rej(e)}};
      x.onerror=()=>rej(new Error('Network error'));x.send(fd);
    });
  }

  /* ---------- 7) Comments, ban/tick, profile ke buttons ---------- */
  /* purana "New video" form saveAll nahi bulata, is liye khud bulwate hain */
  const _pv=window.postVideo;
  if(_pv)window.postVideo=function(){_pv.apply(this,arguments);[80,1500,4000].forEach(ms=>setTimeout(()=>{try{window.saveAll()}catch(e){}},ms))};
  const _post=window.postComment;
  window.postComment=function(){
    const t=$('cmInput').value.trim();if(!t)return;const v=vid(selId);
    if(!state.ready||!v||!v.ftCloud)return _post();
    addDoc(collection(db,'ftComments'),{videoId:String(v.id),uid:state.uid,u:currentUser.username,t:t.slice(0,300),ts:serverTimestamp()}).catch(onErr);
    $('cmInput').value='';
  };
  const _del=window.ftDelCm;
  window.ftDelCm=function(i){
    const v=vid(selId),cm=v&&v.comments[i];
    if(!cm||!cm.id)return _del&&_del(i);
    if(!confirm('Ye comment delete karein?'))return;
    deleteDoc(doc(db,'ftComments',cm.id)).then(()=>say('Comment delete ho gaya')).catch(onErr);
  };
  /* admin: users tab (cloud se), ban aur blue tick. Orders/Messages tabs facttok-cloud.js ke hain */
  const _adm=window.renderAdmin;
  window.renderAdmin=function(t){
    t=t||admTab;
    if(t!=='users'||!state.isAdminAcct)return _adm&&_adm(t);
    admTab='users';const c=state.cache;
    const rows=[...c.profiles].map(([uid,p])=>{const pr=c.privAll.get(uid)||{},k=keyOf(uid),contact=pr.email||(((pr.cc||'')+' '+(pr.phone||'')).trim());
      return `<div class="adm">${esc(p.name)} @${esc(p.username)}${p.verified?' ✅':''}<br>${esc(contact)} ${p.banned?'(banned)':''}${uid===state.adminUid?'':`<div class="row"><button onclick="banUser('${esc(k)}')">${p.banned?'Unban':'Ban'}</button><button onclick="verifyUser('${esc(k)}')">${p.verified?'Remove tick':'Blue tick'}</button></div>`}</div>`}).join('');
    $('admBody').innerHTML=rows||'<p class="m">Nothing here.</p>';
  };
  window.banUser=async key=>{
    const id=uidOf(key);if(!id||id===state.adminUid||!state.isAdminAcct)return;
    const next=!(state.cache.profiles.get(id)||{}).banned;
    try{await updateDoc(doc(db,'ftProfiles',id),{banned:next});
      /* facttok-cloud.js ka "bans" signal bhi: banned user foran logout ho jata hai */
      if(next)await setDoc(doc(db,'bans',id),{at:Date.now()});else await deleteDoc(doc(db,'bans',id))}
    catch(e){onErr(e)}
    window.renderAdmin('users');
  };
  window.verifyUser=async key=>{
    const id=uidOf(key);if(!id||!state.isAdminAcct)return;
    try{await updateDoc(doc(db,'ftProfiles',id),{verified:!(state.cache.profiles.get(id)||{}).verified})}catch(e){onErr(e)}
    window.renderAdmin('users');
  };
  const _su=window.showUser;
  window.showUser=function(){
    _su&&_su.apply(this,arguments);
    try{
      const u=viewing;if(!u||!state.ready||u.email===myKey())return;
      let b=[...document.querySelectorAll('#profBody button')].find(x=>/Message/.test(x.textContent));
      if(!b){const fb=document.querySelector('#profBody>button.pri');if(!fb)return;b=document.createElement('button');b.textContent='✉️ Message';b.style.cssText='width:100%;margin-top:6px';fb.after(b)}
      b.onclick=()=>{closeM('profileModal');openChat(u.email)};
    }catch(e){console.error(e)}
  };

  /* ft-social.js (share sheet / follower lists) in functions ke zariye cloud se judta hai */
  window.ftCloud={on:()=>!!state.ready,users:()=>users,chat:k=>openChat(k),
    send:async(k,t)=>{const other=uidOf(k);if(!other||!state.uid||!t)return false;
      try{await addDoc(collection(db,'ftMessages'),{from:state.uid,to:other,pair:[state.uid,other].sort().join('_'),text:String(t).slice(0,500),ts:serverTimestamp()});return true}catch(e){onErr(e);return false}}};

  /* ---------- 8) Inbox / Direct Message ---------- */
  const _openInbox=window.openInbox;
  window.openInbox=()=>{if(!state.ready)return _openInbox&&_openInbox();dmOpen('list')};
  window.openChat=openChat;
  window.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('nav button[onclick="openInbox()"]');
    if(b&&state.ready){e.stopPropagation();e.preventDefault();window.openInbox()}
  },true);
  function openChat(key){const id=uidOf(key);if(!state.ready)return say('Pehle login karein');
    if(!id||id===state.uid)return say('Is user ko message nahi ho sakta');dmOpen('chat',id)}
  const css=document.createElement('style');
  css.textContent='.ftdm{position:fixed;inset:0;z-index:99998;background:#000;display:flex;flex-direction:column;max-width:480px;margin:0 auto}.ftdm-h{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #2a2a2a;font-size:16px}.ftdm-h button{background:none;padding:6px 10px;font-size:18px}.ftdm-l{flex:1;overflow:auto}.ftdm-r{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #161616;cursor:pointer}.ftdm-r .nm{flex:1;min-width:0}.ftdm-r .nm div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ftdm-av{width:46px;height:46px;flex:0 0 46px;border-radius:50%;overflow:hidden;background:#1ed760;color:#000;font-weight:800;display:grid;place-items:center}.ftdm-av .dp{width:100%;height:100%}.ftdm-un{background:#fe2c55;color:#fff;border-radius:20px;padding:2px 8px;font-size:12px;font-weight:800}.ftdm-m{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:6px}.ftdm-m .b{max-width:78%;padding:9px 12px;border-radius:16px;word-break:break-word;line-height:1.35}.ftdm-m .b small{display:block;opacity:.6;font-size:10px;margin-top:3px}.ftdm-m .me{align-self:flex-end;background:#1ed760;color:#000}.ftdm-m .th{align-self:flex-start;background:#1f1f1f}.ftdm-in{display:flex;gap:8px;padding:10px;border-top:1px solid #2a2a2a}.ftdm-in input{margin:0;flex:1}.ftdm-in button{width:auto;margin:0}.ftbadge{position:absolute;top:-2px;right:2px;background:#fe2c55;color:#fff;border-radius:20px;padding:1px 6px;font-size:10px;font-weight:800}';
  document.head.appendChild(css);
  const readKey=o=>'ftread_'+state.uid+'_'+o,readAt=o=>+localStorage.getItem(readKey(o))||0,markRead=o=>{try{localStorage.setItem(readKey(o),String(Date.now()))}catch(e){}};
  const allMsgs=()=>[...state.cache.msgIn.values(),...state.cache.msgOut.values()];
  const thread=o=>allMsgs().filter(m=>(m.from===o&&m.to===state.uid)||(m.from===state.uid&&m.to===o)).sort((a,b)=>a.ts-b.ts);
  function convs(){const g=new Map();allMsgs().forEach(m=>{const o=m.from===state.uid?m.to:m.from;const x=g.get(o)||{other:o,last:null,unread:0};
    if(!x.last||m.ts>x.last.ts)x.last=m;if(m.to===state.uid&&m.ts>readAt(o)&&!(state.dm&&state.dm.mode==='chat'&&state.dm.other===o))x.unread++;g.set(o,x)});
    return [...g.values()].sort((a,b)=>b.last.ts-a.last.ts)}
  function updBadge(){
    try{const n=convs().reduce((a,x)=>a+x.unread,0),b=document.querySelector('nav button[onclick="openInbox()"]');if(!b)return;
      b.style.position='relative';let s=b.querySelector('.ftbadge');
      if(!n){if(s)s.remove();return}if(!s){s=document.createElement('span');s.className='ftbadge';b.appendChild(s)}s.textContent=n>99?'99+':n}catch(e){}}
  const hm=ms=>{const d=new Date(ms),t=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});return d.toDateString()===new Date().toDateString()?t:d.toLocaleDateString([],{day:'numeric',month:'short'})+' '+t};
  const avatar=u=>`<div class="ftdm-av">${u&&u.dp?`<img class="dp" src="${esc(u.dp)}" alt="">`:'FT'}</div>`;
  function dmOpen(mode,other){state.dm={mode,other};if(!$('ftdm')){const o=document.createElement('div');o.id='ftdm';o.className='ftdm';document.body.appendChild(o)}else $('ftdm').dataset.chat='';dmRender()}
  function dmClose(){const o=$('ftdm');if(o)o.remove();state.dm=null;updBadge()}
  function dmRender(){const d=state.dm,o=$('ftdm');if(!d||!o)return;d.mode==='chat'?renderChat(o,d.other):renderList(o)}
  function renderList(o){
    o.dataset.chat='';
    const rows=convs().map(x=>{const u=getU(keyOf(x.other))||{name:'User',username:'user'};
      return `<div class="ftdm-r" data-o="${esc(x.other)}">${avatar(u)}<div class="nm"><b>${esc(u.name)}</b><div class="m">${x.last.from===state.uid?'Aap: ':''}${esc(x.last.text)}</div></div><div class="m" style="text-align:right;font-size:11px">${hm(x.last.ts)}${x.unread?`<div><span class="ftdm-un">${x.unread}</span></div>`:''}</div></div>`}).join('');
    o.innerHTML=`<div class="ftdm-h"><b style="flex:1">Inbox</b><button id="ftdmX">✕</button></div><div class="ftdm-l"><div class="ftdm-r" id="ftdmSys"><div class="ftdm-av">FT</div><div class="nm"><b>FACT TOK</b><div class="m">Notifications aur Support</div></div></div>${rows||'<p class="m" style="padding:24px;text-align:center">Abhi koi message nahi. Kisi ki profile khol kar Message dabayein.</p>'}</div>`;
    o.onclick=e=>{if(e.target.closest('#ftdmX'))return dmClose();if(e.target.closest('#ftdmSys')){dmClose();return _openInbox&&_openInbox()}
      const r=e.target.closest('[data-o]');if(r)dmOpen('chat',r.dataset.o)};
  }
  function renderChat(o,other){
    const u=getU(keyOf(other))||{name:'User',username:'user'};
    if(o.dataset.chat!==other){
      o.dataset.chat=other;
      o.innerHTML=`<div class="ftdm-h"><button id="ftdmB">←</button>${avatar(u)}<b style="flex:1;min-width:0">${esc(u.name)}<div class="m" style="font-size:12px;font-weight:400">@${esc(u.username)}</div></b><button id="ftdmX">✕</button></div><div class="ftdm-m" id="ftdmMsgs"></div><div class="ftdm-in"><input id="ftdmIn" maxlength="500" placeholder="Message likhein..."><button class="pri" id="ftdmSend">Send</button></div>`;
      const send=async()=>{const inp=$('ftdmIn'),t=inp.value.trim();if(!t)return;inp.value='';
        try{await addDoc(collection(db,'ftMessages'),{from:state.uid,to:other,pair:[state.uid,other].sort().join('_'),text:t.slice(0,500),ts:serverTimestamp()})}catch(e){inp.value=t;onErr(e)}};
      o.onclick=e=>{if(e.target.closest('#ftdmX'))dmClose();else if(e.target.closest('#ftdmB'))dmOpen('list');else if(e.target.closest('#ftdmSend'))send()};
      $('ftdmIn').onkeydown=e=>{if(e.key==='Enter')send()};
    }
    const box=$('ftdmMsgs'),arr=thread(other);
    box.innerHTML=arr.map(m=>`<div class="b ${m.from===state.uid?'me':'th'}">${esc(m.text)}<small>${hm(m.ts)}</small></div>`).join('')||'<p class="m" style="text-align:center;margin-top:30px">Pehla message bhejein</p>';
    box.scrollTop=box.scrollHeight;markRead(other);
  }

  /* ---------- 9) Purane accounts ko alag rakhna ---------- */
  function stashLegacy(){
    if(localStorage.getItem('facttok_legacy_done'))return;
    const demo=e=>/@facttok\.demo$/.test(e||'');
    legacy.users=users.filter(u=>u&&u.pass&&!demo(u.email)&&typeof u.email==='string').map(u=>JSON.parse(JSON.stringify(u)));
    legacy.videos=videos.filter(v=>v&&!demo(v.owner)&&v.owner).map(v=>JSON.parse(JSON.stringify(v)));
    saveLegacy();LSset('facttok_legacy_done',1);
    users.length=0;videos.length=0;
    try{localStorage.removeItem('facttok_current_user')}catch(e){}
    try{currentUser=null}catch(e){}
  }
})();

/* facttok-cloud.js (coins/orders/support chat) pehle load ho jaye, phir hum uske upar chalte hain */
async function cloudModuleReady(){
  const has=[...document.scripts].some(x=>/facttok-cloud/.test(x.src||''));
  if(!has)return;
  for(let i=0;i<80;i++){if(typeof window.approve==='function')return;await wait(100)}
}
async function appReady(){
  for(let i=0;i<150;i++){
    try{if(typeof users!=='undefined'&&typeof saveAll==='function'&&$('appName')&&$('appName').innerText)return true}catch(e){}
    await wait(100);
  }
  return false;
}
