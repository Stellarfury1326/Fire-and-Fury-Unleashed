/* FIRE AND FURY — Firebase backend (replaces Supabase). Loaded by index.html after the main script. */
(function(){
"use strict";
firebase.initializeApp({
  apiKey:"AIzaSyDWku-ryArTwVtDbpWkHnmR8j0owLHkZTk",
  authDomain:"fire-and-fury-unleashed.firebaseapp.com",
  projectId:"fire-and-fury-unleashed",
  storageBucket:"fire-and-fury-unleashed.firebasestorage.app",
  messagingSenderId:"580835069993",
  appId:"1:580835069993:web:1c626dc5134e9e3ccd0c38"
});
const auth=firebase.auth(), db=firebase.firestore();
const TS=()=>firebase.firestore.FieldValue.serverTimestamp();
const W=(n,f)=>{window[n]=f};
const prof=uid=>db.collection("profiles").doc(uid);
const wrap=u=>({id:u.uid,email:u.email,is_anonymous:false,user_metadata:{username:u.displayName||""}});
const cn=s=>String(s||"").trim().replace(/\s+/g," ").slice(0,24);
const err=e=>({"auth/invalid-credential":"Wrong email or password.","auth/email-already-in-use":"That email is already registered.","auth/weak-password":"Password is too weak.","auth/invalid-email":"That email address is not valid.","auth/too-many-requests":"Too many tries. Wait a minute and try again.","auth/requires-recent-login":"Please log out, log back in, then try again."}[e&&e.code]||(e&&e.message)||String(e));
let unsubReq=null, signingUp=false, lastScoreSend=0;
const stopReq=()=>{if(unsubReq){unsubReq();unsubReq=null}};

/* ---------- basics ---------- */
W("multiplayerBackendReady",()=>!!window.firebase);
W("ensureSupabaseClient",async()=>firebase);

/* ---------- avatars (stored as small images inside Firestore) ---------- */
W("isAvatarImage",v=>/^data:image\/(jpeg|webp|png);base64,/.test(String(v||""))&&String(v).length<60000);
W("syncAvatarToProfile",async v=>{if(ffUser&&ffUser.id)prof(ffUser.id).update({avatar:v}).catch(console.warn)});
W("setPlayerAvatar",function(value,opts){
  opts=opts||{sync:true};
  const c=String(value||"").trim(); if(!c)return;
  finalAvatar=isAvatarImage(c)?c:Array.from(c).slice(0,2).join("");
  loadFinalAvatarImage(finalAvatar);
  const ps=safeReadProfiles(), p=ps[activePlayer]||{runs:[]};
  p.avatar=finalAvatar; ps[activePlayer]=p; safeWriteProfiles(ps);
  const pv=$("avatarPreview");
  if(pv)pv.innerHTML="Current avatar: "+(isAvatarImage(finalAvatar)?avatarMarkup(finalAvatar,72):'<span style="font-size:2.2rem">'+escapeHistoryText(finalAvatar)+"</span>");
  if(opts.sync!==false)syncAvatarToProfile(finalAvatar);
  refreshOpenPanels();
});
W("uploadCustomAvatar",async function(input){
  const f=input&&input.files&&input.files[0]; if(!f)return;
  if(!ffUser||!ffUser.id){setAvatarUploadStatus("🔐 Please log in first.");input.value="";return}
  if(!/^image\//.test(f.type)){setAvatarUploadStatus("❌ Please choose an image.");input.value="";return}
  try{
    setAvatarUploadStatus("⏳ Preparing your avatar…");
    let url="";
    for(const s of [160,112,80]){
      const b=await resizeAvatarImage(f,s);
      url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b)});
      if(url.length<55000)break;
    }
    if(url.length>=55000)throw new Error("Image is too large");
    await prof(ffUser.id).update({avatar:url});
    setPlayerAvatar(url,{sync:false});
    setAvatarUploadStatus("✅ Avatar changed successfully.");
  }catch(e){setAvatarUploadStatus("❌ Avatar upload failed: "+err(e))}
  finally{input.value=""}
});

/* ---------- profile, totals, scores, leaderboard ---------- */
W("syncAuthenticatedProfile",async(user,preferred)=>{
  const ref=prof(user.id); let d=null;
  try{const s=await ref.get(); if(s.exists)d=s.data()}catch(e){console.warn("Profile lookup",e)}
  activePlayer=(d&&d.username)||cn(user.user_metadata.username||preferred)||"Player";
  if(d&&d.avatar){finalAvatar=d.avatar;loadFinalAvatarImage(finalAvatar)}
  if(!d)await ref.set({username:activePlayer,usernameLower:activePlayer.toLowerCase(),avatar:finalAvatar,best:0,total:0,games:0});
  ffUser=user; onlineTotals=null;
  renderPlayerHistory(); updateHeader(); refreshOnlineTotals();
});
W("refreshOnlineTotals",async()=>{
  if(!ffUser||!ffUser.id)return null;
  try{
    const d=(await prof(ffUser.id).get()).data()||{};
    onlineTotals={totalPoints:d.total||0,matches:d.games||0};
    updateHeader(); return onlineTotals;
  }catch(e){console.warn(e);return null}
});
const origSave=window.saveCompletedRun;
W("saveCompletedRun",function(reason){
  const sc=Math.max(0,Math.min(Number(score)||0,100000)), bc=Math.max(0,Math.min(Number(bestCombo)||0,500)), mode=gameType;
  origSave(reason);
  if(!ffUser||!ffUser.id)return;
  const uid=ffUser.id, ref=prof(uid);
  db.collection("scores").add({uid,mode,score:sc,bestCombo:bc,createdAt:TS()}).catch(console.warn);
  db.runTransaction(async t=>{
    const d=(await t.get(ref)).data()||{};
    t.update(ref,{best:Math.max(d.best||0,sc),total:(d.total||0)+sc,games:(d.games||0)+1});
  }).then(()=>refreshOnlineTotals()).catch(console.warn);
});
W("fetchOnlineStandings",async()=>{
  const s=await db.collection("profiles").orderBy("best","desc").limit(50).get();
  return s.docs.map(d=>{const x=d.data();return{name:x.username,avatar:x.avatar||"🌋",best:x.best||0,total:x.total||0,games:x.games||0}});
});

/* ---------- accounts ---------- */
W("loginFuryAccount",async()=>{try{
  const email=($("authLoginEmail").value||"").trim().toLowerCase(), pw=$("authLoginPassword").value||"";
  if(!email||!pw){setAuthStatus("📧 Enter your email and 🔑 password.");return}
  setAuthStatus("🔥 Logging you in…");
  const c=await auth.signInWithEmailAndPassword(email,pw);
  await syncAuthenticatedProfile(wrap(c.user));
  await finishAuthenticatedEntry();
}catch(e){setAuthStatus("❌ "+err(e))}});

W("createFuryAccount",async()=>{
  try{
    const username=cn($("authSignupUsername").value), email=($("authSignupEmail").value||"").trim().toLowerCase();
    const pw=$("authSignupPassword").value||"", cf=$("authSignupConfirm").value||"";
    if(username.length<2){setAuthStatus("👤 Player name must be at least 2 characters.");return}
    if(/[\/*%\\]/.test(username)){setAuthStatus("👤 Player names can't contain / * % or \\ characters.");return}
    if(!email.includes("@")){setAuthStatus("📧 Enter a valid email address.");return}
    if(pw.length<6){setAuthStatus("🔑 Password must be at least 6 characters.");return}
    if(pw!==cf){setAuthStatus("🔑 Passwords do not match.");return}
    const lower=username.toLowerCase();
    setAuthStatus("🔎 Checking that the player name is free…");
    if((await db.collection("usernames").doc(lower).get()).exists){setAuthStatus("👤 That player name is already taken.");return}
    setAuthStatus("🚀 Creating your account…");
    signingUp=true;
    const c=await auth.createUserWithEmailAndPassword(email,pw);
    try{
      await c.user.updateProfile({displayName:username});
      const b=db.batch();
      b.set(db.collection("usernames").doc(lower),{uid:c.user.uid});
      b.set(prof(c.user.uid),{username,usernameLower:lower,avatar:"🌋",best:0,total:0,games:0});
      await b.commit();
    }catch(e){await c.user.delete().catch(()=>{});throw new Error("That player name was just taken. Try another.")}
    await syncAuthenticatedProfile(wrap(c.user),username);
    await finishAuthenticatedEntry();
    setAuthStatus("🔥 Account created!");
  }catch(e){setAuthStatus("❌ "+err(e))}
  finally{signingUp=false}
});

W("sendFuryPasswordReset",async()=>{try{
  const email=($("authLoginEmail").value||"").trim().toLowerCase();
  if(!email){setAuthStatus("📧 Enter your email first, then choose Forgot password.");return}
  await auth.sendPasswordResetEmail(email);
  setAuthStatus("📨 If that email is registered, a reset link has been sent.");
}catch(e){setAuthStatus("❌ "+err(e))}});

function resetLocalSession(){
  ffUser=null; onlineTotals=null; activePlayer="Guest"; finalAvatar="🌋"; finalAvatarImage=null;
}
W("logoutFuryAccount",async()=>{
  try{await auth.signOut()}catch(e){console.warn(e)}
  await leaveMatch(); stopReq(); resetLocalSession();
  const pw=$("authLoginPassword"); if(pw)pw.value="";
  closeAuthGate(); show("home"); renderPlayerHistory(); updateHeader();
  setAuthStatus("🚪 Logged out. Log in or sign up to play.");
});
W("deleteFuryAccount",async()=>{
  if(!ffUser||!ffUser.id){alert("No account is signed in.");return}
  const name=activePlayer, uid=ffUser.id;
  if(!confirm('DELETE means DELETE.\n\nThis permanently deletes the account for "'+name+'" with its profile, scores and avatar. This cannot be undone.\n\nChoose Cancel if you only want to log out.'))return;
  try{
    const sc=await db.collection("scores").where("uid","==",uid).get();
    const b=db.batch(); sc.forEach(d=>b.delete(d.ref)); b.delete(prof(uid)); await b.commit();
    await db.collection("usernames").doc(name.toLowerCase()).delete().catch(()=>{});
    await auth.currentUser.delete();
    const ps=safeReadProfiles(); delete ps[name]; safeWriteProfiles(ps);
    await leaveMatch(); stopReq(); resetLocalSession();
    show("home"); renderPlayerHistory(); $("startScreen").classList.remove("hidden");
    setAuthStatus("🗑️ Account permanently deleted.");
  }catch(e){alert("Account was NOT fully deleted.\n\n"+err(e))}
});

/* restore a saved login when the page opens */
let firstAuth=true;
auth.onAuthStateChanged(async u=>{
  if(firstAuth){
    firstAuth=false;
    if(u&&!signingUp){try{await syncAuthenticatedProfile(wrap(u));subscribeMultiplayerRequests()}catch(e){console.warn(e)}}
  }else if(!u){ffUser=null;onlineTotals=null}
});

/* ---------- multiplayer (Firestore) ---------- */
W("initMultiplayerBackend",async()=>{
  if(!ffUser||!ffUser.id){setMpStatus("🔐 Please log in or create a FIRE & FURY account first.");return false}
  await subscribeMultiplayerRequests();
  setMpStatus("🟢 Online as "+activePlayer+". You can send a challenge request.");
  return true;
});
W("subscribeMultiplayerRequests",async()=>{
  if(!ffUser||!ffUser.id)return;
  stopReq();
  unsubReq=db.collection("matchRequests").where("toUid","==",ffUser.id).where("status","==","pending").onSnapshot(s=>{
    s.docChanges().forEach(ch=>{
      if(ch.type!=="added")return;
      const r=ch.doc.data(), t=r.createdAt&&r.createdAt.toMillis?r.createdAt.toMillis():Date.now();
      if(Date.now()-t>600000)return;
      showIncomingRequest({id:ch.doc.id,from_user:r.fromUid});
      if(!gameRunning)$("multiplayerModal").classList.add("show");
    });
  },e=>setMpStatus("⚠️ Realtime unavailable: "+err(e)));
});
W("sendMultiplayerRequest",async()=>{
  const opp=cn($("mpOpponent").value);
  if(!opp){setMpStatus("Enter the other player's username first.");return}
  if(!await initMultiplayerBackend())return;
  try{
    const u=await db.collection("usernames").doc(opp.toLowerCase()).get();
    if(!u.exists){setMpStatus("❌ That username is not registered online.");return}
    const toUid=u.data().uid;
    if(toUid===ffUser.id){setMpStatus("Choose another player.");return}
    const ref=await db.collection("matchRequests").add({fromUid:ffUser.id,toUid,status:"pending",matchId:null,createdAt:TS()});
    setMpStatus("📨 Request sent to "+opp+". Waiting for acceptance…");
    waitForAcceptedMatch(ref.id);
  }catch(e){setMpStatus("❌ Could not send request: "+err(e))}
});
W("waitForAcceptedMatch",function(id){
  if(!id)return;
  let done=false;
  const un=db.collection("matchRequests").doc(id).onSnapshot(async s=>{
    const r=s.data(); if(!r||done)return;
    if(r.status==="declined"){done=true;un();setMpStatus("❌ Your opponent declined the request.")}
    else if(r.status==="accepted"&&r.matchId){
      done=true;un();
      setMpStatus("✅ Opponent accepted! Opening the match room…");
      await enterOnlineMatch(r.matchId);
      const inc=$("mpIncoming");
      if(inc)inc.innerHTML='<b>✅ Opponent accepted!</b><div class="ff-row">Choose the mission below, then press READY.</div>';
      updateMpReadyButton();
    }
  },e=>setMpStatus("❌ "+err(e)));
  setTimeout(()=>{if(!done){done=true;un();setMpStatus("⌛ The request timed out. Send a new one if you still want to play.")}},120000);
});
W("loadPendingRequest",async()=>{
  try{
    const s=await db.collection("matchRequests").where("toUid","==",ffUser.id).where("status","==","pending").limit(1).get();
    if(!s.empty)showIncomingRequest({id:s.docs[0].id,from_user:s.docs[0].data().fromUid});
    else{const el=$("mpIncoming");if(el)el.textContent="No incoming requests."}
  }catch(e){console.warn(e)}
});
W("showIncomingRequest",async req=>{
  const el=$("mpIncoming"); if(!el||!req)return;
  let name="A player";
  try{const d=(await prof(req.from_user).get()).data();if(d&&d.username)name=d.username}catch(_){}
  el.textContent="";
  const msg=document.createElement("span");
  msg.innerHTML="⚔️ <b>"+escapeHistoryText(name)+"</b> challenged you. ";
  const a=document.createElement("button"); a.className="btn"; a.type="button"; a.textContent="Accept";
  a.addEventListener("click",()=>acceptMultiplayerRequest(req.id));
  const d=document.createElement("button"); d.className="btn"; d.type="button"; d.textContent="Decline";
  d.addEventListener("click",()=>declineMultiplayerRequest(req.id));
  el.append(msg,a,d);
});
W("acceptMultiplayerRequest",async id=>{try{
  const ref=db.collection("matchRequests").doc(id), r=(await ref.get()).data();
  if(!r||r.status!=="pending"){setMpStatus("That request is no longer available.");return}
  const m=await db.collection("matches").add({players:[r.fromUid,ffUser.id],status:"active",createdAt:TS()});
  await ref.update({status:"accepted",matchId:m.id});
  await enterOnlineMatch(m.id);
  const inc=$("mpIncoming");
  if(inc)inc.innerHTML='<b>✅ Request accepted. Match room created.</b><div class="ff-row">Choose the mission below, then press READY.</div>';
  updateMpReadyButton();
}catch(e){setMpStatus("❌ "+err(e))}});
W("declineMultiplayerRequest",async id=>{try{
  await db.collection("matchRequests").doc(id).update({status:"declined"});
  $("mpIncoming").textContent="Request declined.";
}catch(e){setMpStatus("❌ "+err(e))}});

W("leaveMatch",async()=>{
  const un=ffMatch.rawChannel;
  ffMatch={id:null,rawChannel:null,channel:null,ready:false,opponentReady:false,opponentScore:0,opponentCombo:0,opponentDone:false,opponentGone:false,localDone:false,mission:null,opponentMission:null};
  if(typeof un==="function"){try{un()}catch(_){}}
});
W("enterOnlineMatch",async matchId=>{
  if(!ffUser)return;
  if(ffMatch.id===matchId&&ffMatch.rawChannel)return;
  await leaveMatch();
  ffMatch.id=matchId;
  setMpStatus("⚔️ Match found. Both players must press READY.");
  ffMatch.rawChannel=db.collection("matches").doc(matchId).collection("events").orderBy("createdAt").onSnapshot(s=>{
    s.docChanges().forEach(ch=>{
      if(ch.type!=="added")return;
      const d=ch.doc.data(); if(d.uid===ffUser.id)return;
      try{handleRemoteGameEvent(JSON.parse(d.p))}catch(_){}
    });
  },e=>setMpStatus("⚠️ Match connection problem: "+err(e)));
  ffMatch.channel={};
  updateMpBattleBar("🟡 Waiting for both players…");
  await mpSend({kind:"hello",userId:ffUser.id,username:activePlayer,mission:ffMatch.mission});
  setMpStatus("🟢 Match room connected. Press READY to start.");
  updateMpReadyButton();
});
W("mpSend",async payload=>{
  if(!ffMatch.id||!ffMatch.channel)return;
  if(payload.kind==="score"){const n=Date.now();if(n-lastScoreSend<1000)return;lastScoreSend=n}
  try{
    await db.collection("matches").doc(ffMatch.id).collection("events").add({uid:ffUser.id,p:JSON.stringify(payload),createdAt:TS()});
  }catch(e){console.warn("Multiplayer send failed",e)}
});
})();
