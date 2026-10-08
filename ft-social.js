/* ===== FT SOCIAL add-on (alag file): Following/Followers list, Total likes, Send-to share + real icons, Inbox, Profile, Chat, ⚡ menu =====
   Isay index.html ke saath ek hi folder me upload karo. index.html isay khud load karti hai. */
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return '&#'+c.charCodeAt(0)+';'})}
  function J(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
  function users(){var u=J('facttok_users');if(!u)return [];return Array.isArray(u)?u:Object.keys(u).map(function(k){var x=u[k];if(x&&typeof x==='object'&&!x.email&&!x.id)x.id=k;return x})}
  function kid(u){return u&&(u.email||u.id||u.username||u.name)}
  function ky(z){return z&&z.email||z}
  function me(){
    var c=window.currentUser||window.me||window.CURRENT_USER||window.user,ks=['facttok_me','facttok_current','facttok_user','facttok_session','facttok_login'];
    for(var i=0;i<ks.length&&!c;i++)c=J(ks[i])||localStorage.getItem(ks[i]);
    if(typeof c==='string')c={email:c};
    if(c){var f=users().filter(function(u){return kid(u)===kid(c)})[0];if(f)c=f}
    return c||{};
  }
  function find(x){if(x&&typeof x==='object')return x;var f=users().filter(function(u){return kid(u)===x||u.username===x})[0];return f||{name:String(x).replace(/^group:/,'')}}
  function lst(m,t){
    var a=m[t];
    if(!Array.isArray(a)){
      if(t==='followers')a=users().filter(function(u){return (u.following||[]).some(function(z){return ky(z)===kid(m)})});
      else if(t==='friends'){var fl=lst(m,'followers').map(kid);a=(m.following||[]).filter(function(z){return fl.indexOf(ky(z))>-1})}
      else a=[];
    }
    return a.map(find);
  }
  function av(u,s){var im=u.avatar||u.photo||u.dp||u.pic;return '<div style="width:'+s+'px;height:'+s+'px;border-radius:50%;flex:none;background:#7b3fe4 '+(im?'url('+esc(im)+') center/cover':'')+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:'+(s*.4)+'px">'+(im?'':esc(String(u.name||u.username||'?').charAt(0).toUpperCase()))+'</div>'}
  function tz(m){if(typeof window.toast==='function')window.toast(m);else alert(m)}
  function cp(){var l=location.href;if(navigator.clipboard)navigator.clipboard.writeText(l).then(function(){tz('Link copy ho gaya')},function(){prompt('Link:',l)});else prompt('Link:',l)}

  var st=document.createElement('style');
  st.textContent='#ftX{position:fixed;inset:0;z-index:99990;background:#fff;color:#111;font-family:sans-serif;display:flex;flex-direction:column}#ftX .h{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;font-weight:700;font-size:18px}#ftX .t{display:flex;border-bottom:1px solid #ddd}#ftX .t div{flex:1;text-align:center;padding:12px 4px;color:#888;font-weight:600;font-size:14px}#ftX .t .on{color:#111;border-bottom:2px solid #111}#ftX input{margin:10px 16px;padding:12px 14px;border:0;border-radius:10px;background:#f1f1f2;font-size:15px}#ftX .l{flex:1;overflow:auto}#ftX .r{display:flex;align-items:center;gap:12px;padding:9px 16px}#ftX .n{flex:1;min-width:0}#ftX .n b,#ftX .n small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ftX .n small{color:#777}#ftX .b{border:0;border-radius:8px;padding:9px 16px;font-weight:700;background:#efefef;color:#111}#ftX .b.p{background:#fe2c55;color:#fff}';
  document.head.appendChild(st);

  function toggle(m,k){
    var a=Array.isArray(m.following)?m.following:(m.following=[]),i=a.map(ky).indexOf(k);
    if(i>-1)a.splice(i,1);else a.push(k);
    try{var raw=J('facttok_users');if(Array.isArray(raw)){raw.forEach(function(u){if(kid(u)===kid(m))u.following=a});localStorage.setItem('facttok_users',JSON.stringify(raw))}}catch(e){}
  }
  function openList(tab){
    var m=me(),old=document.getElementById('ftX');if(old)old.remove();
    var el=document.createElement('div');el.id='ftX';document.body.appendChild(el);
    var T=['following','followers','friends'],q='',sort=0,mg=false;
    function draw(){
      var fo=lst(m,'following').map(kid),fl=lst(m,'followers').map(kid);
      var h='<div class="h"><span id="ftXb" style="font-size:24px">←</span><span>'+esc(m.username||m.name||'Profile')+'</span><span style="width:24px"></span></div><div class="t">';
      T.forEach(function(t){h+='<div data-t="'+t+'" class="'+(t===tab?'on':'')+'">'+t.charAt(0).toUpperCase()+t.slice(1)+' '+lst(m,t).length+'</div>'});
      h+='</div><input id="ftXq" placeholder="Search" value="'+esc(q)+'"><div style="display:flex;justify-content:space-between;padding:0 16px 8px;font-weight:700"><span data-so>Sort by '+['Default','A-Z','Z-A'][sort]+' ▾</span>'+(tab==='following'?'<span data-mg>'+(mg?'Done':'Manage')+'</span>':'')+'</div><div class="l">';
      var a=lst(m,tab).filter(function(u){return (String(u.name||'')+' '+String(u.username||'')).toLowerCase().indexOf(q.toLowerCase())>-1});
      if(sort)a.sort(function(x,y){var r=String(x.name||x.username).localeCompare(String(y.name||y.username));return sort===1?r:-r});
      if(!a.length)h+='<p style="text-align:center;color:#888;padding:40px">Abhi koi nahi</p>';
      a.forEach(function(u){
        var f=fo.indexOf(kid(u))>-1,fr=f&&fl.indexOf(kid(u))>-1;
        h+='<div class="r">'+av(u,52)+'<div class="n"><b>'+esc(u.name||u.username||'User')+'</b><small>'+(u.username?'@'+esc(u.username):'')+'</small></div><button class="b'+(f?'':' p')+'" data-k="'+esc(kid(u))+'">'+(mg&&f?'Unfollow':fr?'Friends':f?'Following':tab==='followers'?'Follow back':'Follow')+'</button><span data-more style="font-size:20px;padding:0 6px;color:#555">•••</span></div>';
      });
      el.innerHTML=h+'</div>';
      el.querySelector('#ftXb').onclick=function(){el.remove()};
      [].forEach.call(el.querySelectorAll('.t div'),function(d){d.onclick=function(){tab=d.getAttribute('data-t');draw()}});
      var qi=el.querySelector('#ftXq');
      qi.oninput=function(){q=qi.value;var p=qi.selectionStart;draw();var n=el.querySelector('#ftXq');n.focus();n.setSelectionRange(p,p)};
      [].forEach.call(el.querySelectorAll('.b'),function(b){b.onclick=function(){toggle(m,b.getAttribute('data-k'));draw()}});
      [].forEach.call(el.querySelectorAll('.r'),function(r,i){r.onclick=function(ev){if(!ev.target.closest('button'))openProfile(a[i])}});
      el.querySelector('[data-so]').onclick=function(){sort=(sort+1)%3;draw()};
      var mgb=el.querySelector('[data-mg]');if(mgb)mgb.onclick=function(){mg=!mg;draw()};
      [].forEach.call(el.querySelectorAll('[data-more]'),function(x,i){x.onclick=function(ev){ev.stopPropagation();if(confirm('Message bhejna hai? (Cancel = profile kholo)'))openChat(a[i]);else openProfile(a[i])}});
    }
    draw();
  }
  function likes(n){
    var d=document.createElement('div'),u=me();
    d.style.cssText='position:fixed;inset:0;z-index:99995;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
    d.innerHTML='<div style="width:78%;background:#fff;color:#111;border-radius:20px;text-align:center;overflow:hidden;font-family:sans-serif"><div style="font-size:56px;padding-top:22px">❤️</div><h2>Total likes</h2><p style="padding:0 20px 20px;color:#666">'+esc(u.username||u.name||'User')+' received a total of '+esc(n)+' likes across all videos</p><div style="border-top:1px solid #ddd;padding:16px;font-weight:700">OK</div></div>';
    d.onclick=function(){d.remove()};document.body.appendChild(d);
  }
  /* profile par 204 Following / 1,052 Followers / 14.8K Likes dabane par */
  document.addEventListener('click',function(e){
    try{
      var n=e.target,i=0;if(!n.closest||n.closest('#ftX,#ftPf,#ftIn,#ftCh'))return;
      while(n&&n!==document.body&&i<3){
        var s=(n.textContent||'').trim(),r=/^(?:([\d.,]+\s?[KMkm]?)\s*(Following|Followers|Likes)|(Following|Followers|Likes)\s*([\d.,]+\s?[KMkm]?))$/i.exec(s);
        if(r&&s.length<24){e.stopPropagation();e.preventDefault();var w=(r[2]||r[3]).toLowerCase();if(w==='likes')likes(r[1]||r[4]);else openList(w);return}
        n=n.parentElement;i++;
      }
    }catch(x){}
  },true);

  /* share menu me "Send to" (users ki row) + extra options (Copy link, Telegram, SMS, Email, More) */
  function share(){
    var all=document.querySelectorAll('div,span,p,button,li,a,b'),w=null,sh=null;
    for(var i=0;i<all.length&&!sh;i++){
      var e=all[i];
      if(e.children.length||e.getAttribute('data-ftx')||(e.textContent||'').trim().toLowerCase()!=='whatsapp')continue;
      e.setAttribute('data-ftx','1');
      var p=e;for(var j=0;j<7&&p.parentElement&&p.parentElement!==document.body;j++){p=p.parentElement;if(/report/i.test(p.textContent||''))break}
      if(/report/i.test(p.textContent||'')&&!p.querySelector('[data-ftsend]')&&!p.closest('#ftX'))sh=p;
    }
    if(!sh)return;
    var us=users().slice(0,12),h=document.createElement('div'),L=encodeURIComponent(location.href);
    h.setAttribute('data-ftsend','1');h.style.cssText='padding:10px 14px;border-bottom:1px solid #8884';
    h.innerHTML='<div style="text-align:center;font-weight:700;font-size:18px;padding:4px">Send to</div><div style="display:flex;gap:14px;overflow-x:auto;padding:10px 0">'+us.map(function(u,k){return '<div data-u="'+k+'" style="text-align:center;min-width:64px;font-size:12px">'+av(u,52)+'<div style="margin-top:4px;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(u.name||u.username||'User')+'</div></div>'}).join('')+'</div>';
    [].forEach.call(h.querySelectorAll('[data-u]'),function(d){d.onclick=function(){var u=us[+d.getAttribute('data-u')];if(typeof window.ftSendDM==='function')window.ftSendDM(u,location.href);else{cp();tz('Link copy kar ke '+(u.name||'user')+' ko bhej do')}}});
    sh.insertBefore(h,sh.firstChild);
    var ex=[[bi('','8885','🔗'),'Copy link',cp],[bi('telegram','26A5E4','✈️'),'Telegram',function(){window.open('https://t.me/share/url?url='+L)}],[bi('googlemessages','1A73E8','💬'),'SMS',function(){location.href='sms:?body='+L}],[bi('gmail','EA4335','✉️'),'Email',function(){location.href='mailto:?body='+L}],[bi('','1E90FF','⋯'),'More',function(){if(navigator.share)navigator.share({url:location.href}).catch(function(){});else cp()}]];
    var row=document.createElement('div');row.style.cssText='display:flex;gap:14px;overflow-x:auto;padding:12px 14px';
    ex.forEach(function(o){var b=document.createElement('div');b.style.cssText='text-align:center;min-width:64px;font-size:12px';b.innerHTML=o[0]+o[1];b.onclick=o[2];row.appendChild(b)});
    sh.appendChild(row);sh.appendChild(mkRow(ACT));
  }

  /* ===== Real brand icons (share list), Inbox, Profile, Chat ===== */
  function bi(s,c,f,d){return '<span style="display:flex;width:52px;height:52px;border-radius:50%;background:#'+c+';align-items:center;justify-content:center;margin:0 auto 4px;font-size:24px">'+(s?'<img src="https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/'+s+'.svg" width="28" height="28" style="'+(d?'':'filter:invert(1)')+'" onload="this.nextSibling.remove()" onerror="this.remove()">':'')+'<span>'+f+'</span></span>'}
  var BR={'whatsapp':['whatsapp','25D366','🟢'],'facebook':['facebook','1877F2','📘'],'instagram':['instagram','E4405F','📸'],'twitter':['x','000000','🐦'],'x':['x','000000','✖️'],'telegram':['telegram','26A5E4','✈️'],'snapchat':['snapchat','FFFC00','👻',1],'messenger':['messenger','0084FF','💬'],'email':['gmail','EA4335','✉️'],'sms':['googlemessages','1A73E8','💬']};
  function brands(){
    [].forEach.call(document.querySelectorAll('[data-ftsend]'),function(h){
      var sh=h.parentElement;if(!sh)return;
      [].forEach.call(sh.querySelectorAll('div,span,p,button,li,a,b'),function(e){
        if(e.children.length||e.getAttribute('data-ftb')||h.contains(e))return;
        var b=BR[(e.textContent||'').trim().toLowerCase()];if(!b)return;
        e.setAttribute('data-ftb','1');
        var p=e.parentElement;if(!p||p.querySelector('img,svg'))return;
        var t=document.createElement('span');t.innerHTML=bi(b[0],b[1],b[2],b[3]);
        p.insertBefore(t.firstChild,e);
        if(getComputedStyle(p).display.indexOf('flex')>-1){p.style.flexDirection='column';p.style.alignItems='center'}
      });
    });
  }
  function dms(){return J('ft_dm')||{}}
  function isFr(m,u){return lst(m,'following').map(kid).indexOf(kid(u))>-1&&lst(m,'followers').map(kid).indexOf(kid(u))>-1}
  function sendDM(u,t){
    var m=me(),d=dms(),k=kid(u),a=d[k]||(d[k]=[]),rep=a.some(function(x){return !x.me});
    if(!isFr(m,u)&&!rep&&a.length>=1){tz('Jab tak wo reply na kare, sirf 1 message bhej sakte ho');return false}
    a.push({me:1,t:t,ts:Date.now()});
    try{localStorage.setItem('ft_dm',JSON.stringify(d))}catch(e){}
    return true;
  }
  window.ftSendDM=function(u,l){if(sendDM(u,l))tz('Bhej diya')};
  function page(id,z,bot){
    var o=document.getElementById(id);if(o)o.remove();
    o=document.createElement('div');o.id=id;
    o.style.cssText='position:fixed;left:0;right:0;top:0;bottom:'+(bot||0)+'px;z-index:'+z+';background:#fff;color:#111;font-family:sans-serif;overflow:auto;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px)';
    document.body.appendChild(o);return o;
  }
  function on(o,s,f){[].forEach.call(o.querySelectorAll(s),function(x){x.onclick=function(e){f(x,e)}})}
  function nm(u){return esc(u.name||u.username||'User')}
  function openChat(u){
    var m=me(),k=kid(u),o=page('ftCh',99994,0);
    function draw(){
      var a=dms()[k]||[],fr=isFr(m,u),rep=a.some(function(x){return !x.me}),lock=!fr&&!rep&&a.length>=1;
      o.innerHTML='<div style="display:flex;align-items:center;gap:12px;padding:12px 14px"><span data-b style="font-size:28px">‹</span>'+av(u,34)+'<b style="flex:1;font-size:17px">'+nm(u)+'</b><span style="font-size:20px">•••</span></div>'+
      '<div style="flex:1;overflow:auto;padding:14px;text-align:center"><div style="display:flex;justify-content:center;margin-top:30px">'+av(u,96)+'</div><h3 style="margin:14px 0 4px">'+nm(u)+'</h3><div style="color:#777;font-size:14px;margin-bottom:20px">'+lst(u,'following').length+' following · '+lst(u,'followers').length+' followers</div>'+
      a.map(function(x){return '<div style="display:flex;justify-content:'+(x.me?'flex-end':'flex-start')+';margin:6px 0"><span style="max-width:75%;padding:9px 13px;border-radius:16px;background:'+(x.me?'#fe2c55':'#f1f1f2')+';color:'+(x.me?'#fff':'#111')+';text-align:left;word-break:break-word">'+esc(x.t)+'</span></div>'}).join('')+'</div>'+
      '<div style="border-top:1px solid #ddd;padding:12px 16px">'+(fr||rep?'':'<div style="margin-bottom:10px"><b style="font-size:16px">Send message request to '+nm(u)+'</b><div style="color:#888;font-size:13px">You can only send one direct message until the user replies.</div></div>')+'<div style="display:flex;gap:8px"><input id="ftMi" '+(lock?'disabled ':'')+'placeholder="Message..." style="flex:1;border:0;border-radius:22px;background:#f1f1f2;padding:13px 16px;font-size:15px"><button id="ftMs" style="border:0;background:none;font-size:22px">➤</button></div></div>';
      var i=o.querySelector('#ftMi');
      o.querySelector('[data-b]').onclick=function(){o.remove()};
      o.querySelector('#ftMs').onclick=function(){var t=i.value.trim();if(t&&sendDM(u,t))draw();else if(lock)tz('Jab tak wo reply na kare, sirf 1 message bhej sakte ho')};
      o.children[1].scrollTop=o.children[1].scrollHeight;
    }
    draw();
  }
  function openProfile(u){
    var m=me(),o=page('ftPf',99993,0),sug=false;
    function draw(){
      var f=lst(m,'following').map(kid).indexOf(kid(u))>-1,V=u.videos||u.posts||[],fo=lst(m,'following').map(kid);
      var sg=users().filter(function(x){return kid(x)!==kid(u)&&kid(x)!==kid(m)&&fo.indexOf(kid(x))<0}).slice(0,8);
      var bt='border:0;border-radius:6px;padding:14px;font-size:17px;font-weight:700;background:#efefef;color:#111;';
      var sx='<div style="color:#888;font-size:14px">';
      o.innerHTML='<div style="display:flex;justify-content:space-between;padding:14px 16px;font-size:24px"><span data-b>←</span><span>🔔 &nbsp;↪</span></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 20px;gap:12px"><div style="min-width:0"><div style="font-size:28px;font-weight:800;word-break:break-word">'+nm(u)+'</div><div style="color:#888;margin-bottom:14px">'+(u.username?'@'+esc(u.username):'')+'</div><div style="display:flex;gap:18px"><div><b style="font-size:22px">'+lst(u,'following').length+'</b>'+sx+'Following</div></div><div><b style="font-size:22px">'+lst(u,'followers').length+'</b>'+sx+'Followers</div></div><div><b style="font-size:22px">'+esc(u.likes||0)+'</b>'+sx+'Likes</div></div></div></div>'+av(u,96)+'</div>'+
      '<div style="display:flex;gap:10px;padding:18px 20px">'+(f?'<button data-m style="flex:1;'+bt+'">Message</button><button data-f style="flex:1;'+bt+'">Following ▾</button><button data-s style="'+bt+'width:54px;padding:0">⟳</button>':'<button data-f style="flex:1;'+bt+'background:#fe2c55;color:#fff">Follow</button><button data-m style="flex:1;'+bt+'">Message</button><button data-s style="'+bt+'width:54px;padding:0">👤+</button>')+'</div><div style="display:flex;border-bottom:1px solid #eee;font-size:22px;text-align:center"><div style="flex:1;padding:10px;border-bottom:2px solid #111">▥▾</div><div style="flex:1;padding:10px;color:#888">🔁</div></div>'+
      ((f||sug)&&sg.length?'<div style="padding:0 20px 10px"><b>Suggested accounts</b><div style="display:flex;gap:14px;overflow-x:auto;padding:10px 0">'+sg.map(function(x,i){return '<div data-p="'+i+'" style="text-align:center;min-width:70px;font-size:12px">'+av(x,60)+'<div style="margin-top:4px;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+nm(x)+'</div></div>'}).join('')+'</div></div>':'')+
      (V.length?'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border-top:1px solid #eee">'+V.map(function(v){var t=v.thumb||v.poster||v.cover||'';return '<div style="aspect-ratio:3/4;background:#222 '+(t?'url('+esc(t)+') center/cover':'')+';color:#fff;display:flex;align-items:flex-end;padding:8px;font-weight:700;font-size:14px">▷ '+esc(v.views||0)+'</div>'}).join('')+'</div>':'<p style="text-align:center;color:#888;padding:30px">Abhi koi video nahi</p>');
      o.querySelector('[data-b]').onclick=function(){o.remove()};
      o.querySelector('[data-f]').onclick=function(){if(f&&!confirm('Unfollow karna hai?'))return;toggle(m,kid(u));draw()};
      o.querySelector('[data-m]').onclick=function(){openChat(u)};
      o.querySelector('[data-s]').onclick=function(){sug=!sug;draw()};
      on(o,'[data-p]',function(x){openProfile(sg[+x.getAttribute('data-p')])});
    }
    draw();
  }
  var navEl=null;
  function inbox(bot){
    var m=me(),all=users().filter(function(u){return kid(u)!==kid(m)}),fl=lst(m,'followers'),d=dms(),ks=Object.keys(d),o=page('ftIn',99980,bot);
    var h='<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;font-size:24px"><span data-fl>👥</span><b style="font-size:20px">Inbox <span style="color:#1ed760;font-size:13px">●</span></b><span>🔍</span></div><div style="display:flex;gap:14px;overflow-x:auto;padding:34px 14px 16px"><div style="text-align:center;min-width:76px;font-size:13px;position:relative"><div style="position:absolute;top:-24px;left:0;background:#fff;border-radius:12px;padding:4px 8px;color:#888;font-size:12px;box-shadow:0 1px 4px #0003">What\'s up?</div>'+av(m,64)+'<div style="margin-top:4px">Create</div></div>'+all.slice(0,10).map(function(u,i){return '<div data-p="'+i+'" style="text-align:center;min-width:76px;font-size:13px"><div style="padding:3px;border-radius:50%;background:linear-gradient(45deg,#20d5ec,#1ed760);display:inline-block">'+av(u,60)+'</div><div style="margin-top:4px;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+nm(u)+'</div></div>'}).join('')+'</div>';
    if(fl.length)h+='<div data-fl style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#f1f1f2">'+av(fl[0],56)+'<div style="flex:1;font-size:16px"><b>'+nm(fl[0])+'</b>'+(fl.length>1?' and '+(fl.length-1)+' others':'')+' started following you</div><span style="background:#fe2c55;color:#fff;border-radius:12px;padding:3px 8px;font-size:13px">'+fl.length+'</span></div>';
    h+='<div data-fl style="display:flex;align-items:center;gap:14px;padding:14px 16px"><div style="width:56px;height:56px;border-radius:50%;background:#fe2c55;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px">⚡</div><b style="font-size:17px">Activity &amp; new followers</b></div>';
    ks.forEach(function(k,i){var u=find(k),a=d[k],l=a[a.length-1];h+='<div data-c="'+i+'" style="display:flex;align-items:center;gap:14px;padding:12px 16px">'+av(u,56)+'<div style="min-width:0"><div style="font-size:17px">'+nm(u)+'</div><div style="color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(l.t)+' · '+new Date(l.ts||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div><span style="margin-left:auto;font-size:22px">📷</span></div>'});
    if(!ks.length)h+='<p style="text-align:center;color:#888;padding:30px">Abhi koi chat nahi - kisi ki profile se Message karo</p>';
    o.innerHTML=h;
    on(o,'[data-fl]',function(){openList('followers')});
    on(o,'[data-p]',function(x){openProfile(all[+x.getAttribute('data-p')])});
    on(o,'[data-c]',function(x){openChat(find(ks[+x.getAttribute('data-c')]))});
  }
  /* bottom nav ke "Inbox" par dabane se ye Inbox khulta hai; dusre tab par band */
  document.addEventListener('click',function(e){
    try{
      var n=e.target,x=n,i;if(!n.closest)return;
      for(i=0;i<4&&x&&x!==document.body;i++,x=x.parentElement){
        if((function(t){return t.length<14&&/inbox$/i.test(t)})((x.textContent||'').trim())){
          var nv=x.parentElement,j=0;
          while(nv&&nv!==document.body&&j<5&&['fixed','sticky'].indexOf(getComputedStyle(nv).position)<0){nv=nv.parentElement;j++}
          navEl=(nv&&nv!==document.body)?nv:null;
          inbox(navEl?Math.max(0,window.innerHeight-navEl.getBoundingClientRect().top):64);return;
        }
      }
      var ib=document.getElementById('ftIn');
      if(ib&&navEl&&navEl.contains(n))ib.remove();
    }catch(er){}
  },true);

  /* ===== Build marker + hamesha nazar aane wala ⚡ menu (app ke DOM par depend nahi) ===== */
  var BUILD='FT add-ons v4 (09-Oct)';
  function note(t){
    var d=document.createElement('div');
    d.textContent=t;
    d.style.cssText='position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:100001;background:#1ed760;color:#000;font:700 13px sans-serif;padding:8px 14px;border-radius:20px';
    document.body.appendChild(d);setTimeout(function(){d.remove()},4000);
  }
  function fab(){
    if(!document.body||document.getElementById('ftFab'))return;
    var f=document.createElement('div');f.id='ftFab';f.textContent='⚡';
    f.style.cssText='position:fixed;left:6px;top:46%;z-index:99970;width:38px;height:38px;border-radius:50%;background:#1ed760;color:#000;display:flex;align-items:center;justify-content:center;font-size:18px;opacity:.85;box-shadow:0 2px 8px #0008';
    f.onclick=menu;document.body.appendChild(f);
  }
  function menu(){
    var o=page('ftMn',99996,0);
    o.style.background='rgba(0,0,0,.6)';o.style.justifyContent='flex-end';
    o.innerHTML='<div style="background:#fff;border-radius:18px 18px 0 0;padding:14px 16px 24px"><b style="font-size:18px">FACT TOK menu</b><div style="color:#888;font-size:12px;margin-bottom:8px">'+BUILD+'</div>'+
    [['inbox','📥 Inbox'],['followers','👥 Followers'],['following','➡️ Following'],['likes','❤️ Total likes'],['me','👤 Meri profile'],['diag','🔧 Diagnose'],['x','✖ Band karo']].map(function(a){return '<div data-a="'+a[0]+'" style="padding:14px 4px;border-top:1px solid #eee;font-size:16px">'+a[1]+'</div>'}).join('')+'</div>';
    o.onclick=function(e){if(e.target===o)o.remove()};
    on(o,'[data-a]',function(x){
      var a=x.getAttribute('data-a'),mm=me();o.remove();
      if(a==='inbox'){
        inbox(0);var ib=document.getElementById('ftIn'),c=document.createElement('div');
        c.textContent='✖ Band karo';c.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 18px;border-radius:20px;font-size:14px';
        c.onclick=function(){ib.remove()};ib.appendChild(c);
      }
      else if(a==='followers'||a==='following')openList(a);
      else if(a==='likes')likes(mm.likes||0);
      else if(a==='me')openProfile(mm);
      else if(a==='diag')alert(BUILD+'\nUsers: '+users().length+'\nMe: '+(kid(mm)||'nahi mila')+'\nStorage keys: '+Object.keys(localStorage).join(', '));
    });
  }
  fab();note(BUILD+' ✓');

  /* ===== Share sheet ki 2nd row (screenshot jaisi) ===== */
  function soon(){tz('Ye feature jald aayega')}
  function cam(){if(typeof window.openCamera==='function')window.openCamera();else soon()}
  function mkGroup(){
    var n=prompt('Group ka naam:');if(!n)return;
    var d=dms();d['group:'+n]=[{me:1,t:'Group "'+n+'" ban gaya',ts:Date.now()}];
    try{localStorage.setItem('ft_dm',JSON.stringify(d))}catch(e){}
    tz('Group ban gaya - Inbox me dekho');
  }
  function toStory(){
    var a=J('ft_story')||[];a.push({u:kid(me()),l:location.href,ts:Date.now()});
    try{localStorage.setItem('ft_story',JSON.stringify(a))}catch(e){}
    tz('Story me add ho gaya');
  }
  var ACT=[['➕','Add to Story',toStory],['👥','Duet',cam],['▯','Stitch',cam],['👪','Create group',mkGroup],['▶️','Set as wallpaper',soon],['🏷️','Create sticker',soon],['GIF','Share as GIF',soon],['💔','Not interested',function(){tz('Theek hai, aisi videos kam dikhengi')}]];
  function mkRow(a){
    var r=document.createElement('div');r.style.cssText='display:flex;gap:14px;overflow-x:auto;padding:12px 14px';
    a.forEach(function(o){var b=document.createElement('div');b.style.cssText='text-align:center;min-width:64px;font-size:12px';b.innerHTML=bi('','8883',o[0])+o[1];b.onclick=o[2];r.appendChild(b)});
    return r;
  }
  var pend=0;
  try{new MutationObserver(function(){if(pend)return;pend=1;setTimeout(function(){pend=0;try{share();brands();fab()}catch(e){}},200)}).observe(document.body,{childList:true,subtree:true})}catch(e){}
})();
