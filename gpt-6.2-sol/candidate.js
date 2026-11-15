window.createStoryboard = function (api) {
  const {THREE:T,scene,camera,renderer,effects,landmarks:L,groundY,duration} = api;
  const V = (x=0,y=0,z=0)=>new T.Vector3(x,y,z), C = c=>new T.Color(c);
  const tau=Math.PI*2, clamp=x=>Math.max(0,Math.min(1,x)), mix=(a,b,u)=>a+(b-a)*u;
  const smooth=(a,b,x)=>{let u=clamp((x-a)/(b-a));return u*u*(3-2*u);};
  const fract=x=>x-Math.floor(x), rand=i=>fract(Math.sin(i*127.1+19.73)*43758.5453123);
  const pulse=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));
  const Y=V(0,1,0), zero=V(), src=L.rift.clone();
  const group=(parent=effects)=>{const o=new T.Group();parent.add(o);return o;};
  const basic=(color,opacity=1,add=false)=>new T.MeshBasicMaterial({color,opacity,transparent:opacity<1||add,
    side:T.DoubleSide,depthWrite:opacity===1&&!add,blending:add?T.AdditiveBlending:T.NormalBlending,toneMapped:false});
  const armor=(color,emissive=0,ei=0)=>new T.MeshStandardMaterial({color,emissive,emissiveIntensity:ei,roughness:.63,metalness:.27,flatShading:true});
  const box=new T.BoxGeometry(1,1,1), ball=new T.IcosahedronGeometry(1,0);
  const cyl=new T.CylinderGeometry(1,1,1,12), cone=new T.CylinderGeometry(.12,1,1,5), oct=new T.OctahedronGeometry(1);
  const mesh=(p,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{
    const o=new T.Mesh(g,m);p.add(o);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;
  };
  const link=(o,a,b,r=1,d=r)=>{
    o.position.copy(a).lerp(b,.5); dp.subVectors(b,a);const len=dp.length();
    if(len>1e-6)o.quaternion.setFromUnitVectors(Y,dp.multiplyScalar(1/len));
    o.scale.set(r,len,d);
  };
  const dp=V();
  function ring(p,r,w,m,start=0,arc=tau){
    const o=mesh(p,new T.RingGeometry(r-w*.5,r+w*.5,Math.max(4,Math.ceil(86*arc/tau)),1,start,arc),m);
    return o;
  }
  function flat(p,r,w,m,start,arc){const o=ring(p,r,w,m,start,arc);o.rotation.x=-Math.PI/2;return o;}
  function line(p,n,color,opacity=1,add=true){
    const g=new T.BufferGeometry(), a=new Float32Array(n*3);
    g.setAttribute('position',new T.BufferAttribute(a,3).setUsage(T.DynamicDrawUsage));
    const m=new T.LineBasicMaterial({color,opacity,transparent:true,depthWrite:false,toneMapped:false,
      blending:add?T.AdditiveBlending:T.NormalBlending});
    const o=new T.Line(g,m);p.add(o);o.frustumCulled=false;return {o,m,a,n,g};
  }
  function put(a,i,x,y,z){a[i*3]=x;a[i*3+1]=y;a[i*3+2]=z;}
  const touch=o=>o.g.attributes.position.needsUpdate=true;
  const hair=(p,a,b,color,op=.9)=>{
    const o=line(p,2,color,op);a.toArray(o.a,0);b.toArray(o.a,3);touch(o);return o;
  };
  const clean=0x8df3ff, ivory=0xffe5a4, hot=0xff2859;
  const pale=C(clean), gold=C(ivory), red=C(hot);
  const originalLights=[];
  scene.traverse(o=>{if(o.isLight && Number.isFinite(o.intensity))originalLights.push([o,o.intensity]);});
  scene.background=C(0x101e30);
  scene.fog=new T.FogExp2(0x172338,.008);
  const fill=new T.HemisphereLight(0xb2d7ff,0x524052,.8);effects.add(fill);
  const moon=new T.DirectionalLight(0xc3ddff,1.45);moon.position.set(-16,36,-30);effects.add(moon);
  const rLight=new T.PointLight(0xff2455,0,55,2); rLight.position.copy(src).add(V(-5,-6,-5));effects.add(rLight);
  const bLight=new T.PointLight(0xffd4a1,0,76,2);effects.add(bLight);
  const gateLight=new T.PointLight(0xff3449,0,24,2);gateLight.position.set(14,4,-5);effects.add(gateLight);
  const skyBase=C(0x142638), skyRed=C(0x2b0b23), skyEnd=C(0x324c62), skyVoid=C(0x100713);
  const fogBase=C(0x28394c), fogRed=C(0x42152d);
  const flareCanvas=document.createElement('canvas');flareCanvas.width=flareCanvas.height=128;
  const fc=flareCanvas.getContext('2d');
  const gr=fc.createRadialGradient(64,64,0,64,64,64);
  [[0,1],[.09,.76],[.22,.36],[.48,.10],[.76,.022],[1,0]].forEach(([x,y])=>gr.addColorStop(x,'rgba(255,255,255,'+y+')'));
  fc.fillStyle=gr;fc.fillRect(0,0,128,128);
  const glowTex=new T.CanvasTexture(flareCanvas);
  function flare(p,c){
    const m=new T.SpriteMaterial({map:glowTex,color:c,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,toneMapped:false});
    const o=new T.Sprite(m);p.add(o);return o;
  }

  // Gate A rite. The hardware and snowfield in every shot are the supplied Surface.
  const rite=group(), riteX=14.6, riteZ=-5.0;
  const ground=(x,z,guess=1,range=2.8)=>{
    const q=groundY(x,z);return q!==null&&Number.isFinite(q)&&Math.abs(q-guess)<range?q:guess;
  };
  rite.position.set(riteX,ground(riteX,riteZ,1)+.055,riteZ);
  const ritualMat=basic(0xff385a,.85,true), ritualPale=basic(0xffa291,.8,true);
  flat(rite,2.75,.072,ritualMat);flat(rite,2.5,.028,ritualPale);
  const riteWheel=group(rite);
  for(let i=0;i<12;i++){
    const a=i*tau/12;
    flat(riteWheel,2.99,.13,ritualMat,a+.045,.18);
    const g=mesh(rite,oct,ritualPale,2.76*Math.cos(a),.095,2.76*Math.sin(a),.105,.23,.105);
    g.rotation.y=-a;
  }
  for(let i=0;i<3;i++){
    const a=i*tau/3,b=a+tau/3;
    hair(rite,V(Math.cos(a)*2.49,.04,Math.sin(a)*2.49),V(Math.cos(b)*2.49,.04,Math.sin(b)*2.49),0xf36176);
  }
  const breach=group();breach.position.copy(L.gateA);
  const shockMat=basic(0xff624c,.35,true), shock=flat(breach,1,.10,shockMat);
  const breachGlow=flare(breach,0xff3b3e);breachGlow.position.y=1.7;

  // Rift: an opaque, ragged negative-space aperture with thin, bright strata.
  const rift=group();rift.position.copy(src);rift.rotation.y=-2.44;
  const N=112, layers=[0,.46,.79,.947,.988,1.013], sgeo=new T.BufferGeometry();
  const spos=new Float32Array((N+1)*layers.length*3), scol=new Float32Array(spos.length), si=[];
  const grad=[0x03060d,0x0c0714,0x210a1d,0x520e31,0xab1645,0x260919].map(C);
  for(let j=0;j<layers.length;j++)for(let i=0;i<=N;i++){
    const a=i/N*tau, k=j*(N+1)+i, c=grad[j];
    const f=.72+.28*Math.sin(a*11+j+Math.cos(a*3)*2)**2;
    put(scol,k,c.r*f,c.g*f,c.b*f);
    if(j&&i){const h=k-N-1;si.push(h-1,h,k-1,h,k,k-1);}
  }
  sgeo.setIndex(si);sgeo.setAttribute('position',new T.BufferAttribute(spos,3).setUsage(T.DynamicDrawUsage));
  sgeo.setAttribute('color',new T.BufferAttribute(scol,3));
  const skin=mesh(rift,sgeo,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false}));skin.frustumCulled=false;
  const rims=Array.from({length:6},(_,i)=>line(rift,N+1,[0xffd2d0,0xff4161,0xf32359,0xa31855,0xff6c83,0x742754][i],.8));
  const valve=group(rift);
  const glass=basic(0xff315e,.48,true), softRed=basic(0xca1f53,.23,true);
  for(let i=0;i<21;i++){
    const a=i*tau/21;
    ring(valve,8.13,.075,i%3===0?glass:softRed,a,.085+(i%4)*.054);
    if(i%3===0){
      const x=Math.cos(a)*8.17,y=Math.sin(a)*8.17;
      const g=mesh(valve,oct,glass,x,y,0,.12,.33,.04);g.rotation.z=a-Math.PI/2;
      ring(valve,8.68,.025,softRed,a-.07,.46);
    }
  }
  valve.scale.x=.84;
  const rimGlow=flare(rift,0xff174d);rimGlow.position.z=-2;
  const wound=flare(rift,0xff4e53);wound.position.set(0,1,-.15);
  const fallBeams=Array.from({length:5},(_,i)=>line(effects,35,[0xfd2654,0x892b66,0xff4959][i%3],.5));

  // The King is a primitive-built apparition: charcoal mass, a seven-spired crown and a lit mask.
  const king=group(rift);king.position.z=.7;
  const obsidian=armor(0x170a19,0x2d071b,.73), carmine=armor(0x5a102b,0xb70b38,.37);
  const maskMat=armor(0x38162a,0xff2352,.23), eyeMat=basic(0xffc0ae), scar=basic(0xff4164,.82,true);
  mesh(king,ball,obsidian,0,-2.35,0,3.1,5.1,1.35).rotation.z=.13;
  mesh(king,ball,carmine,0,.15,.19,2.67,2.76,1.23);
  for(let i=0;i<7;i++){
    const d=i-3;
    mesh(king,cone,i%2?carmine:obsidian,d*.7,-3.1+Math.abs(d)*.37,.46,.54,5.6,1.0).rotation.z=-d*.15;
  }
  const head=group(king);head.position.set(0,2.64,.48);
  mesh(head,ball,obsidian,0,.12,0,1.19,1.46,.74);
  mesh(head,oct,maskMat,0,-.07,.59,.81,1.13,.47);
  mesh(head,oct,scar,0,-.22,1.06,.065,.63,.04);
  const eyes=flare(head,0xff5465);eyes.position.set(0,.29,1);eyes.scale.set(3.8,1.55,1);
  for(const s of [-1,1]){
    mesh(head,box,eyeMat,s*.425,.29,1.0,.54,.088,.04).rotation.z=s*.25;
    const cheek=mesh(head,box,scar,s*.42,-.15,.93,.052,.42,.037);cheek.rotation.z=s*-.33;
  }
  const crown=group(head);crown.position.y=.95;
  mesh(crown,cyl,carmine,0,0,0,1.25,.27,.8);
  const crownLo=V(), crownHi=V();
  for(let i=-3;i<=3;i++){
    crownLo.set(i*.34,-.03,.47-Math.abs(i)*.121);
    crownHi.set(i*.62,1.45+(i===0?.65:Math.abs(i)*.18),crownLo.z-.13);
    link(mesh(crown,cone,i%2===0?carmine:obsidian),crownLo,crownHi,.24,.24);
    const tip=mesh(crown,oct,scar,crownHi.x,crownHi.y,crownHi.z,.09,.19,.09);tip.rotation.z=-i*.15;
  }
  const arms=[];
  for(const s of [-1,1]){
    const shoulder=group(king);shoulder.position.set(s*1.79,.88,.13);
    mesh(shoulder,ball,carmine,s*.37,.03,0,1.35,.9,.96);
    link(mesh(shoulder,cone,obsidian),V(s*.32,.28,0),V(s*1.52,1.61,-.24),.67,.8);
    link(mesh(shoulder,cone,carmine),V(s*.56,-.24,0),V(s*1.49,-1.82,.16),.65,.61);
    const elbow=group(shoulder);elbow.position.set(s*1.49,-1.7,.18);
    link(mesh(elbow,cone,obsidian),V(),V(s*1.12,-1.73,.38),.63,.53);
    mesh(elbow,ball,carmine,s*1.08,-1.58,.43,.42,.42,.44);
    for(let f=0;f<3;f++)link(mesh(elbow,cone,obsidian),V(s*(.79+f*.26),-1.62,.47),V(s*(.86+f*.32),-2.42,.73),.145,.16);
    arms.push({shoulder,elbow,s});
  }
  const ribShape=[];
  for(let i=0;i<5;i++)for(const s of [-1,1])
    ribShape.push(hair(king,V(s*.12,1.07-i*.44,1.43),V(s*(1.64-i*.15),1.43-i*.61,1.07),i%2?0x8d2241:0xf24763,.77));
  const heart=mesh(king,oct,scar,0,.34,1.5,.19,.5,.075);

  // Storm lanes and stepped lightning. The staircase of each bolt is sampled from absolute time.
  const storm=[];
  for(let i=0;i<25;i++)storm.push(line(effects,66,i%6===0?0xec4e7b:i%3===0?0x774f90:0x75405e,.25));
  const lightning=Array.from({length:8},(_,i)=>({
    core:line(effects,18,i%3===0?0xd2eaff:0xffa0ae),
    branch:line(effects,10,i%3===0?0x849cfc:0xfb3765),i
  }));
  function cloudPoints(n,seed,color,size){
    const g=new T.BufferGeometry(),a=new Float32Array(n*3);
    g.setAttribute('position',new T.BufferAttribute(a,3).setUsage(T.DynamicDrawUsage));
    const m=new T.PointsMaterial({color,size,map:glowTex,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
    const o=new T.Points(g,m);o.frustumCulled=false;effects.add(o);
    const data=Array.from({length:n},(_,i)=>[rand(i*7+seed),rand(i*7+1+seed),rand(i*7+2+seed),rand(i*7+3+seed)]);
    return {o,g,a,m,n,data};
  }
  const embers=cloudPoints(510,71,0xff395e,.77), snow=cloudPoints(340,923,0xc0dbf5,.25), sparks=cloudPoints(160,355,0xffe6bc,.68);
  const shards=new T.InstancedMesh(oct,armor(0x371629,0xa52543,.46),76);shards.instanceMatrix.setUsage(T.DynamicDrawUsage);
  effects.add(shards);shards.frustumCulled=false;
  const dummy=new T.Object3D();

  // SRA geometry and the three-way link.
  const machinery=armor(0x263846,0x112029,.34), shell=armor(0xb2ccce), mustard=armor(0xefbd55);
  const anchorCore=basic(clean), anchorHaze=basic(0x50dcfa,.15,true);
  const anchors=L.anchorSites.map((p,i)=>{
    const o=group();o.position.copy(p);
    const base=mesh(o,cyl,machinery,0,.14,0,1.15,.24,1.15);
    mesh(o,cyl,shell,0,.32,0,.53,.32,.53);
    mesh(o,cyl,machinery,0,.93,0,.34,1.33,.34);
    mesh(o,cyl,shell,0,1.58,0,.54,.23,.54);
    mesh(o,cyl,anchorCore,0,1.724,0,.38,.045,.38);
    for(let k=0;k<3;k++){
      const a=k*tau/3, g=group(o);g.rotation.y=a;
      mesh(g,box,machinery,.87,.12,0,.65,.22,.37);
      mesh(g,box,mustard,1.02,.24,0,.22,.035,.34);
      link(mesh(g,box,shell),V(.24,.91,0),V(.98,.22,0),.16,.17);
      mesh(g,box,anchorCore,.33,1.17,0,.04,.53,.15);
    }
    for(let j=0;j<3;j++)mesh(o,cyl,j===1?anchorCore:shell,0,.60+j*.32,0,.40,.049,.40);
    const rot=group(o);rot.position.y=1.95;
    for(let j=0;j<6;j++){
      flat(rot,.88,.075,anchorCore,j*tau/6,.49);
      const a=j*tau/6;mesh(rot,oct,anchorCore,Math.cos(a)*.87,0,Math.sin(a)*.87,.074,.14,.074);
    }
    const aMat=basic(clean,.6,true), field=flat(o,1,.035,aMat);field.position.y=.11;
    const field2=flat(o,1,.045,aMat);field2.position.y=.14;
    const col=mesh(o,cyl,anchorHaze,0,3.5,0,.44,3.6,.44);
    const g=flare(o,clean);g.position.y=1.89;
    return {o,rot,field,field2,aMat,col,g,base,i,p,on:[64.4,77.6,96.015][i]};
  });
  const anchorLinks=anchors.map((a,i)=>({base:line(effects,26,0x42aac4,.54),flow:line(effects,9,0xcefbff,.9),a,b:anchors[(i+1)%3]}));
  const convergence=anchors.map(()=>line(effects,32,0x78e8ff,.68));

  // Bake ground support along short routes. High roof hits are not treated as street height.
  function route(knots){
    const pts=[];
    for(let i=0;i<knots.length-1;i++){
      const a=knots[i],b=knots[i+1], n=Math.max(3,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.64));
      for(let j=0;j<n+(i===knots.length-2?1:0);j++){
        const u=j/n,x=mix(a[0],b[0],u),z=mix(a[2],b[2],u),y=mix(a[1],b[1],u);
        pts.push(V(x,ground(x,z,y,1.85),z));
      }
    }
    return pts;
  }
  const entry=L.coalitionEntries;
  const R=[
    [[entry[0].x,entry[0].y,entry[0].z],[-12,1.2,-13],[-4,1.2,-12],[6,1.05,-9],[10,1.05,-9]],
    [[entry[1].x,entry[1].y,entry[1].z],[-11,.5,-18],[-6,1.15,-16],[-3,1.41,-15],[3,1,-12]],
    [[entry[2].x,entry[2].y,entry[2].z],[15,-1.7,-27],[13,-.3,-18],[10,1.05,-12],[9,1.05,-9]],
    [[14.6,1,-5],[12.7,1,-7],[10,1,-8],[7.1,1,-9.5],[3.4,1,-11]],
    [[16.6,1,-3.2],[14,1,-5.5],[12,1,-7.5],[8,1,-11],[3.5,1,-12.5]]
  ];
  const actorList=[];
  const tmpA=V(),tmpB=V();
  function walk(o,u,offset){
    const p=(o.path.length-1)*clamp(u), i=Math.min(o.path.length-2,Math.floor(p));
    o.pos.copy(o.path[i]).lerp(o.path[i+1],p-i);
    tmpA.copy(o.path[Math.min(i+3,o.path.length-1)]).sub(o.path[Math.max(i-2,0)]);tmpA.y=0;tmpA.normalize();
    o.pos.x+=tmpA.z*offset;o.pos.z-=tmpA.x*offset;
    o.yaw=Math.atan2(tmpA.x,tmpA.z);
  }
  function figure(f,id,r,start,kind){
    return {f,id,path:r,start,kind,pos:V(),yaw:0,run:0,on:false};
  }
  for(let f=0;f<3;f++)for(let k=0;k<11;k++){
    const row=k%4, side=(k%3-1)*.77+(k>=8?.35:0);
    const knots=R[f].map((p,i)=>[p[0]+side*(f===2?.77:.48),p[1],p[2]+side*(f===2?.21:.84)]);
    const o=figure(f,k,route(knots),[27.9,31.02,36.9][f]+Math.floor(k/4)*20.1+row*.78,'human');
    o.row=row;o.offset=side;actorList.push(o);
  }
  const cultRoute=[route(R[3]),route(R[4])], cultists=[];
  for(let i=0;i<15;i++){
    const o=figure(3,i,cultRoute[i%2],5.1+i*1.67,'cult');
    cultists.push(o);actorList.push(o);
  }
  for(let i=0;i<6;i++){
    const a=i*tau/6, x=riteX+2.13*Math.cos(a),z=riteZ+2.13*Math.sin(a);
    const o=figure(3,i,null,0,'rite');o.pos.set(x,ground(x,z,rite.position.y),z);o.yaw=Math.atan2(riteX-x,riteZ-z);actorList.push(o);
  }
  const scps=[
    figure(4,0,route([[18,1,-3],[14,1,-6],[10,1,-8],[5,1,-11]]),78.75,'beast'),
    figure(5,1,route([[17,1,-4],[13,1,-6],[10,1,-8],[7,1,-11]]),84.2,'wraith'),
    figure(4,2,route([[17.7,1,-2],[13,1,-4.7],[10,1,-7],[7,1,-10]]),108.2,'beast')
  ];
  actorList.push(...scps);
  const actorBatches={};
  function batch(key,g,isGlow=false){
    const m=isGlow?new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}):armor(0xffffff);
    const o=new T.InstancedMesh(g,m,actorList.length*20);o.instanceMatrix.setUsage(T.DynamicDrawUsage);
    o.frustumCulled=false;o.count=0;effects.add(o);actorBatches[key]={o,n:0};return o;
  }
  batch('b',box);batch('c',cyl);batch('h',ball);batch('t',cone);batch('e',box,true);
  const scheme=[
    [0x283b54,0x447cec,0x98b9e9,0xa4d2ff],
    [0x334a4d,0xc3d9da,0x4bb7ae,0x99fff0],
    [0x38392a,0x857747,0xdcad53,0xffd178],
    [0x291019,0x701c37,0xa82242,0xff506e],
    [0x551028,0x851c36,0xb83a4d,0xff9179],
    [0x4a4351,0xc4bac6,0x291e32,0xff3d57]
  ].map(a=>a.map(C));
  const dark=C(0x1b202a), black=C(0x100f18);
  const root=new T.Matrix4(), segmat=new T.Matrix4(), unit=V(1,1,1), actorQuat=new T.Quaternion(), mScale=V();
  function part(key,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
    const a=actorBatches[key],i=a.n++;
    dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
    segmat.multiplyMatrices(root,dummy.matrix);a.o.setMatrixAt(i,segmat);a.o.setColorAt(i,color);
  }
  function limb(key,color,a,b,thick,depth=thick){
    const bt=actorBatches[key],i=bt.n++;
    link(dummy,a,b,thick,depth);dummy.updateMatrix();segmat.multiplyMatrices(root,dummy.matrix);
    bt.o.setMatrixAt(i,segmat);bt.o.setColorAt(i,color);
  }
  const A=V(),B=V();
  function drawActor(o,t){
    const ph=t*(o.kind==='beast'?12:10.6)+o.id*1.87, [cloth,plate,trim,lume]=scheme[o.f];
    const gait=Math.sin(ph)*o.run, bob=Math.abs(Math.cos(ph))*.08*o.run;
    A.copy(o.pos);A.y+=bob;
    actorQuat.setFromAxisAngle(Y,o.yaw);
    mScale.setScalar(o.scale||1);root.compose(A,actorQuat,mScale);
    if(o.kind==='beast'){
      part('h',cloth,0,.8,0,.56,.37,1.03,.15);
      part('h',plate,0,.64,.86,.39,.29,.61,-.21);
      part('e',lume,.19,.72,1.27,.088,.057,.03);part('e',lume,-.19,.72,1.27,.088,.057,.03);
      for(let s=-1;s<=1;s+=2)for(let q=-1;q<=1;q+=2){
        const f=q*.61, p=gait*s*q;
        limb('b',plate,A.set(s*.36,.78,f),B.set(s*.61,.42,f+.33*p),.21,.23);
        limb('b',cloth,A.set(s*.61,.42,f+.33*p),B.set(s*.66,.07,f+.45*p+.18),.18,.19);
      }
      for(let i=0;i<3;i++)part('t',trim,0,1.08-i*.025,-.22+i*.28,.12,.33,.16,-.54);
      return;
    }
    if(o.kind==='wraith'){
      part('t',cloth,0,.83,0,.48,1.4,.33);
      part('h',plate,0,1.72,0,.34,.57,.25);
      part('h',plate,0,2.4,.03,.23,.3,.22);
      part('e',lume,0,2.445,.225,.25,.046,.025);
      for(let s=-1;s<=1;s+=2){
        limb('c',plate,A.set(s*.27,1.96,.03),B.set(s*.62,1.36,.19+gait*s*.2),.093);
        limb('c',plate,A.set(s*.62,1.36,.19+gait*s*.2),B.set(s*.57,.82,.48+gait*s*.28),.059);
        part('t',trim,s*.44,1.75,-.08,.18,.48,.19,0,0,-s*.62);
      }return;
    }
    const cult=o.f===3;
    const bend=o.kind==='rite'?.26+.13*Math.sin(t*1.4):0;
    part(cult?'t':'b',cloth,0,.84,0,cult?.33:.36,cult?.68:.29,cult?.24:.27,bend);
    part(cult?'h':'b',plate,0,1.205,.02,cult?.31:.49,.48,cult?.24:.29,bend);
    part('b',cult?trim:dark,0,.97,.055,cult?.39:.46,.097,.30);
    if(cult){
      part('t',cloth,0,1.68,.015,.202,.48,.188,-.22+bend);
      part('h',black,0,1.577,.122,.14,.14,.09,bend);
      part('e',lume,0,1.589,.203,.135,.034,.02);
      part('e',lume,0,1.21,.246,.043,.237,.026,.1,0,.12);
    }else{
      part('h',cloth,0,1.603,.018,.165,.162,.143);
      part('h',plate,0,1.684,-.012,.201,.147,.186);
      part('b',dark,0,1.618,.14,.263,.09,.071);
      part('e',lume,0,1.628,.182,.225,.032,.021);
      part('b',cloth,0,1.23,-.208,.35,.39,.194);
      part('b',trim,0,1.26,-.315,.18,.043,.021);
    }
    for(let s=-1;s<=1;s+=2){
      const l=gait*s, f=bend? .01:l*.27;
      limb('b',cloth,A.set(s*.118,.86,0),B.set(s*.143,.46,f*.67),.18,.19);
      limb('b',plate,A.set(s*.143,.46,f*.67),B.set(s*.146,.15,f),.158,.148);
      part('b',black,s*.146,.09,f+.049,.18,.15,.29);
      const aim=cult?(o.kind==='rite'?.55:.19):.32;
      part('h',trim,s*.27,1.389,.031,.133,.117,.14);
      limb('b',cloth,A.set(s*.27,1.37,.02),B.set(s*.33,1.13,aim*.63-gait*s*.115),.151,.145);
      limb('b',plate,A.set(s*.33,1.13,aim*.63-gait*s*.115),B.set(s*.18,1.24+bend*.57,aim+.097),.121,.124);
    }
    if(!cult){
      part('b',dark,.115,1.271,.45,.104,.095,.53);
      part('b',trim,.115,1.29,.68,.047,.055,.076);
    }
  }

  // Disk and strike volumes. Concentric segment geometry, not a decal over the scene.
  const diskHome=V(-11.2,39,-13.5), disk=group(), diskFace=group(disk);diskFace.rotation.x=Math.PI/2;
  const dMat=basic(0xffe8b5,.86,true), dCool=basic(0xa8f5ff,.7,true), dShade=basic(0x263044,.72), dFill=basic(0x323c50,.64);
  const dGlass=basic(0xffbf76,.22,true), dNodes=[];
  const diskPlate=mesh(diskFace,new T.CircleGeometry(5.5,64),dFill);diskPlate.position.z=-.07;
  ring(diskFace,5.63,.45,dShade);ring(diskFace,5.94,.045,dCool);ring(diskFace,5.44,.09,dMat);
  const dial1=group(diskFace),dial2=group(diskFace),dial3=group(diskFace);
  for(let i=0;i<16;i++){
    const a=i*tau/16;
    ring(dial1,6.37,.14,i%4===0?dCool:dMat,a+.045,.20);
    ring(dial1,6.71,.045,dCool,a,.14);
    ring(dial2,4.71,i%2===0?.28:.115,i%2===0?dMat:dGlass,a+.013,.29);
    ring(dial2,3.72,.065,dCool,a,.24);
    const tick=mesh(dial1,box,i%4===0?dCool:dMat,6.44*Math.cos(a),6.44*Math.sin(a),.07,.49,.072,.09);
    tick.rotation.z=a;
    if(i%2===0){
      const d=mesh(dial2,oct,dCool,4.11*Math.cos(a),4.11*Math.sin(a),.12,.21,.21,.14);
      dNodes.push(d);
      hair(dial3,V(1.36*Math.cos(a),1.36*Math.sin(a),.09),V(3.66*Math.cos(a+.29),3.66*Math.sin(a+.29),.09),ivory,.8);
    }
  }
  ring(dial3,2.62,.12,dMat);ring(dial3,2.83,.032,dCool);ring(dial3,1.38,.125,dMat);
  mesh(dial3,oct,dMat,0,0,.3,1.26,1.26,1.11).rotation.z=Math.PI/4;
  const diskGlow=flare(disk,0xffdea4);diskGlow.position.y=-.35;
  const forecast=Array.from({length:10},()=>line(effects,2,0x70cde4,.7));
  const bGlow=flare(effects,0xffe0b8), knotGlow=flare(effects,0xff7c71);
  const beamCore=basic(0xfff3d7,.97,true), beamSheath=basic(0x95d8ff,.25,true), beamFire=basic(0xffb75f,.42,true);
  const BN=88, BS=10;
  function tube(mat){
    const a=new Float32Array((BN+1)*BS*3),g=new T.BufferGeometry(),ind=[];
    for(let i=0;i<BN;i++)for(let j=0;j<BS;j++){
      const k=i*BS+j,h=i*BS+(j+1)%BS;ind.push(k,h,k+BS,h,h+BS,k+BS);
    }
    g.setIndex(ind);g.setAttribute('position',new T.BufferAttribute(a,3).setUsage(T.DynamicDrawUsage));
    const o=mesh(effects,g,mat);o.frustumCulled=false;return {a,g,o};
  }
  const tubes=[tube(beamCore),tube(beamFire),tube(beamSheath)];
  const braids=Array.from({length:10},(_,i)=>line(effects,BN+1,i%3===0?clean:i%3===1?ivory:0xff9a69,.9));
  const P0=V(),P1=V(),P2=V(),P3=V(), endHit=V(), tipHit=V(), pBeam=V(), nBeam=V(), qBeam=V(), tan=V(), worldZ=V(0,0,1);
  function cubic(out,u){
    const v=1-u;return out.copy(P0).multiplyScalar(v*v*v).addScaledVector(P1,3*v*v*u).addScaledVector(P2,3*v*u*u).addScaledVector(P3,u*u*u);
  }
  function drawBeam(reach,t,power,taint){
    const colors=[0xfff6da,0xffa44f,0x7edbff], endColors=[0xff749a,0xfd174e,0xa14bce];
    for(let j=0;j<3;j++){
      const o=tubes[j];o.o.visible=reach>.001&&power>.002;
      o.o.material.color.setHex(colors[j]).lerp(tmpColor.setHex(endColors[j]),taint);
      o.o.material.opacity=[.92,.36,.16][j]*power;
    }
    for(let j=0;j<braids.length;j++){
      const b=braids[j];b.o.visible=reach>.001&&power>.002;
      b.m.color.setHex(j%3===0?clean:j%3===1?ivory:0xff9e6a).lerp(red,.95*taint);
      b.m.opacity=power*(j%3===0?.83:.64);
    }
    if(reach<=.001||power<=.002)return;
    for(let i=0;i<=BN;i++){
      const ii=i/BN,u=ii*reach,v=1-u;
      cubic(pBeam,u);
      tan.subVectors(P1,P0).multiplyScalar(v*v).addScaledVector(tmpA.subVectors(P2,P1),2*u*v).addScaledVector(tmpA.subVectors(P3,P2),u*u).normalize();
      nBeam.crossVectors(tan,worldZ).normalize();qBeam.crossVectors(tan,nBeam).normalize();
      const n=(.63+.38*Math.sin(Math.PI*ii)+.32*pulse(ii,.94,.09))*(.76+.24*power);
      const wave=1+.17*Math.sin(18*u-11*t)+.085*Math.sin(77*u-21*t);
      const tap=.22+.78*smooth(0,.1,1-ii);
      for(let j=0;j<BS;j++){
        const a=j/BS*tau,ca=Math.cos(a),sa=Math.sin(a);
        for(let h=0;h<3;h++){
          const r=n*wave*tap*[.29,.71,1.28][h];
          tmpB.copy(pBeam).addScaledVector(nBeam,r*ca).addScaledVector(qBeam,r*sa);
          put(tubes[h].a,i*BS+j,tmpB.x,tmpB.y,tmpB.z);
        }
      }
      for(let j=0;j<braids.length;j++){
        const a=j*tau/braids.length+(j%2===0?1:-1)*(10*u+t*1.26)+.37*Math.sin(t*3+j+29*u);
        const r=n*tap*(1.07+.35*Math.sin(15*u-t*6+j)+.04*j);
        tmpB.copy(pBeam).addScaledVector(nBeam,r*Math.cos(a)).addScaledVector(qBeam,r*Math.sin(a));
        put(braids[j].a,i,tmpB.x,tmpB.y,tmpB.z);
      }
    }
    tubes.forEach(touch);braids.forEach(touch);
  }
  const tmpColor=C(0);
  const seal=group();seal.position.copy(src);seal.rotation.y=rift.rotation.y;
  const sealMat=basic(ivory,.9,true), stitch=[];
  for(let i=0;i<10;i++)stitch.push(ring(seal,1,.011,sealMat,i*tau/10,.29));
  const seam=mesh(seal,oct,sealMat,0,0,.1,.14,3.4,.058);
  const sealGlow=flare(seal,0xffe3b0);
  const fractures=Array.from({length:31},(_,i)=>({
    l:line(effects,9,i%4===0?0xf7a5ba:i%2===0?0xbc2a67:0x5e326d,.73),a:rand(i+544)*tau,r:3+rand(i+655)*33, h:rand(i+111)*16
  }));
  const tracers=Array.from({length:34},(_,i)=>({l:line(effects,3,clean,1),g:flare(effects,clean),i}));
  const impactRings=Array.from({length:4},(_,i)=>{
    const m=basic(hot,.42,true),o=flat(effects,1,.017,m);o.position.set(12,2+i*.32,-5);return {m,o};
  });

  // Editorial framing. The caption supplied by the player stays clear at bottom left.
  const cuts=[
    [0,'GATE A / RITUAL','01  /  The Last Seal','The rite is already in progress. The last seal breaks on the opening accents.',[0,9,-15],[.7,9.7,-15.2],[17,7.4,-2],[18,10.9,-1],50],
    [8.85,'GATE A / ELEVATED','02  /  Something Answers','The Scarlet King takes shape inside the tear. The first acolytes spill out beneath him.',[-9,15,-24],[-5,16,-24],[18,16,-2],[20,18,-2],51],
    [25.681,'SURFACE / HIGH','03  /  Surface Only','C.A.S.S.I.E. goes dark. The underground facility is lost; all surviving forces converge on the Surface.',[18,56,-23],[16,48,-26],[4,5,-8],[4,7,-8],58],
    [39.683,'GATE A / FRONTAGE','04  /  One Front','MTF, GOC and Chaos enter the same fight. Blue, ice and amber squads fire past one another, never at one another.',[0,9.6,-15.7],[.8,10.2,-16.5],[12,3.6,-6],[13,4.7,-5],48],
    [54.8,'COURTYARD / OVERWATCH','05  /  Make a Line','Fresh squads cross the courtyard while the first anchor team takes the east emplacement.',[-15,12,-25],[-12.6,12.4,-24.5],[5.8,2.1,-10],[7.9,3.1,-8.3],47],
    [66.688,'COURTYARD / ANCHOR A','06  /  Scranton A','The first Scranton Reality Anchor locks. The coalition turns the firing line into a protected work zone.',[.2,9.1,-15.9],[1.4,9.8,-16.2],[9.8,3.4,-9.5],[11,4.5,-7],43],
    [79.018,'GATE A / CONTACT','07  /  Anomalous Allies','Two SCP silhouettes break through on the cult’s side. More acolytes drop from the aperture to replace the fallen.',[-.2,9,-15.4],[-1.7,11.7,-18.2],[14.6,3.8,-5.6],[14.4,7.7,-5.0],53],
    [92.346,'SURFACE / TRIANGLE','08  /  Three Points of Reality','The high Scranton unit comes online. The three emitters share one lock across the courtyard.',[17,43,-25],[11,37,-27],[5.8,4.8,-10],[6.5,6,-9],51],
    [107.694,'COURTYARD / HOLD','09  /  Hold for the GOC','The cult continues to respawn. All three human forces hold the same anchor perimeter while the GOC prepares its strike.',[-11,13,-24],[-7.3,14,-24],[9,6.2,-6],[11,8.4,-5],50],
    [124.018,'AIRSPACE / ACQUISITION','10  /  Thaumaturgic Disk','The GOC strike disk assembles above the courtyard. Its range marks still point straight down.',[-8,16,-40],[-4,17,-40],[2,23,-9],[4,22,-8],57],
    [140.2,'AIRSPACE / AIM LINE','11  /  Vertical Solution','The disk steadies over the vertical aim line. A competing pull gathers inside the rift above Gate A.',[8,22,-40],[6,20,-41],[6,19,-7],[7,20,-7],58],
    [157.687,'AIRSPACE / STRIKE','12  /  The Bent Strike','The GOC fires. The falling lance veers before it touches the Surface and curves into the open rift.',[-1.5,16,-42],[2.5,17.7,-43],[6.2,19.8,-6],[8.5,20.4,-5],61],
    [172.849,'GATE A / INTAKE','13  /  Feeding the Mouth','The aperture catches the strike. The King leans through the collision as scarlet lightning rolls across the canyon.',[.2,15,-28],[2.6,16.5,-29],[17.4,19,-4],[18.8,20,-4],55],
    [185.017,'AIRSPACE / CONTESTED','14  /  Reality Under Load','The anchors hold the gate in place. Filaments from the disk and the rift fight for control of the same channel.',[8,28,-43],[6,23,-42],[7.9,18,-6],[8.8,19.5,-6],57],
    [203.012,'AIRSPACE / CRITICAL','','',[-1,16,-42],[2,19,-43],[8,20,-6],[11,20,-5],60],
    [212.021,'GATE A / RESOLUTION','','',[4,20,-37],[6,24,-39],[16,19,-4],[16,19,-5],57],
    [230.7,'SURFACE / AFTERMATH','','',[17,50,-25],[15,45,-27],[5,5,-8],[8,8,-7],58],
    [248.2,'GATE A / FINAL FRAME','','',[-10,16,-30],[-7,17.5,-31],[15,10,-4],[17,12,-3],51]
  ];
  const endings={
    human:[
      ['15  /  The Anchors Hold','The GOC retakes the channel. Cold light from the three Scranton anchors pins the mouth open for the sealing strike.'],
      ['16  /  Stitch the Sky','The bent lance folds the two sides of the aperture together. The King and his respawning cult are cut off.'],
      ['17  /  All Clear, Surface','The disk goes dark. The human factions stand down together while the anchors stabilize the scar.'],
      ['HUMAN VICTORY  /  Gate A Sealed','The rift is closed. The underground facility is gone, but the Surface is still here.']
    ],
    cult:[
      ['15  /  The Current Reverses','Scarlet contamination races back up the GOC channel. The anchors lose their common lock.'],
      ['16  /  The Disk Is Swallowed','The rift drags the strike disk off axis, pulls it into the mouth, and consumes it ring by ring.'],
      ['17  /  Reality Collapse','The aperture outgrows the battlefield. Fractures hang over the real Surface as the last Scranton signals die.'],
      ['CULT VICTORY  /  No Stable Surface','The Scarlet King remains. The surviving telemetry can no longer agree on what is real.']
    ]
  };
  function indexAt(t){let i=cuts.length-1;while(i>0&&t<cuts[i][0])i--;return i;}
  const cameraTarget=V();
  const uiCanvas=document.createElement('canvas');uiCanvas.width=1600;uiCanvas.height=670;
  const ux=uiCanvas.getContext('2d'), uiTex=new T.CanvasTexture(uiCanvas);uiTex.colorSpace=T.SRGBColorSpace;
  uiTex.minFilter=T.LinearFilter;uiTex.generateMipmaps=false;
  const screenVert='varying vec2 uvScreen; void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const grade=new T.ShaderMaterial({
    uniforms:{flash:{value:0},ruin:{value:0},fade:{value:0},stamp:{value:0}},
    vertexShader:screenVert,
    fragmentShader:`varying vec2 uvScreen; uniform float flash,ruin,fade,stamp;
      void main(){
        vec2 p=2.*uvScreen-1.;
        float v=smoothstep(.32,1.45,length(p*vec2(.93,.8)));
        float grit=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+stamp)*43758.5453);
        float a=.24*v+ruin*(.11+.15*v)+.027*grit+fade;
        vec3 c=mix(vec3(.018,.027,.052),vec3(.15,.004,.048),ruin);
        gl_FragColor=vec4(mix(c,vec3(1.,.83,.74),flash),clamp(a+flash*.20,0.,.88));
      }`,
    depthTest:false,depthWrite:false,transparent:true
  });
  const plane=new T.PlaneGeometry(2,2), vignette=mesh(effects,plane,grade);
  vignette.frustumCulled=false;vignette.renderOrder=1000;
  const ui=mesh(effects,plane,new T.ShaderMaterial({
    uniforms:{plate:{value:uiTex}},vertexShader:screenVert,
    fragmentShader:'uniform sampler2D plate; varying vec2 uvScreen; void main(){gl_FragColor=texture2D(plate,uvScreen); #include <colorspace_fragment>\n}'.replace('; #',';\n #'),
    depthTest:false,depthWrite:false,transparent:true,toneMapped:false
  }));ui.frustumCulled=false;ui.renderOrder=1001;
  let uiKey='';
  function paint(t,i,cult){
    const h=Math.min(1550,Math.max(370,Math.round(1600/(camera.aspect||2.4))));
    const k=[Math.floor(t*5),i,cult,h].join(':');
    if(k===uiKey)return;uiKey=k;
    if(uiCanvas.height!==h)uiCanvas.height=h;
    ux.clearRect(0,0,1600,h);
    const accent=t>=212&&!cult?'#9cf4f7':'#ff668c', bg='rgba(9,14,25,.67)';
    const rr=(x,y,w,b,c)=>{ux.fillStyle=c;ux.fillRect(x,y,w,b);};
    const text=(s,x,y,f,c,align='left')=>{ux.font=f;ux.fillStyle=c;ux.textAlign=align;ux.fillText(s,x,y);};
    rr(27,23,316,64,bg);rr(27,23,3,64,accent);
    text('S U R F A C E   /   1 5 . 0',44,44,'600 12px monospace',accent);
    text('SCARLET PROTOCOL',43,72,'bold 24px sans-serif','#f5f5fa');
    ux.strokeStyle='rgba(205,225,243,.52)';ux.lineWidth=1;
    for(const x of [18,1582])for(const y of [15,h-15]){
      const s=x<100?1:-1,d=y<100?1:-1;
      ux.beginPath();ux.moveTo(x+12*s,y);ux.lineTo(x,y);ux.lineTo(x,y+12*d);ux.stroke();
    }
    rr(1318,23,255,52,bg);rr(1570,23,3,52,accent);
    const m=Math.floor(t/60), s=(t-m*60).toFixed(1).padStart(4,'0');
    text('CAM '+String(i+1).padStart(2,'0')+'   /   0'+m+':'+s,1557,43,'600 13px monospace',accent,'right');
    text(cuts[i][1],1557,63,'600 12px monospace','#e6eff6','right');
    const x=1304,y=h-66;
    rr(x,y,269,43,bg);rr(x,y,269,1,'rgba(207,227,242,.4)');
    if(t<25.681){
      text('GATE A   /   RITUAL TELEMETRY',x+12,y+24,'600 12px monospace','#ffd4de');
    }else if(t<61){
      [[0,'MTF','#80aaff'],[78,'GOC','#92f7ec'],[156,'CHAOS','#ffc76c']].forEach(([dx,a,c])=>{
        rr(x+12+dx,y+16,6,6,c);text(a,x+25+dx,y+23,'600 12px monospace',c);
      });
    }else if(t<248.2){
      const status=t>=225&&cult?'SRA   /   NO SIGNAL':t>=211&&cult?'SRA   /   LOST LOCK':t>=222?'SRA   /   STABLE':'SCRANTON ARRAY';
      text(status,x+12,y+25,'600 12px monospace','#e9f3fa');
      for(let j=0;j<3;j++){
        const on=t>=anchors[j].on&&!(cult&&t>210+j*3);
        rr(x+191+j*19,y+16,12,7,on?'#9cf4f7':cult&&t>208?'#9c284b':'#526376');
      }
    }else text(cult?'OUTCOME  /  REALITY LOST':'OUTCOME  /  RIFT SEALED',x+12,y+25,'bold 13px monospace',accent);
    rr(x,y+42,269*clamp(t/duration),1.2,accent);
    uiTex.needsUpdate=true;
  }

  function update(time,ending){
    const t=Math.max(0,Math.min(duration,time)), cult=ending==='cult', ci=indexAt(t), cut=cuts[ci];
    const shotEnd=ci+1<cuts.length?cuts[ci+1][0]:duration, u=smooth(cut[0],shotEnd,t);
    camera.position.fromArray(cut[4]).lerp(tmpA.fromArray(cut[5]),u);
    cameraTarget.fromArray(cut[6]).lerp(tmpA.fromArray(cut[7]),u);
    const taint=cult?smooth(203.012,222,t):0, ruin=cult?smooth(223,248,t):0;
    const positive=!cult?smooth(203.012,218,t):0;
    const close=!cult?smooth(213,224,t):0;
    const swallow=cult?smooth(210,225.1,t):0;
    const grow=smooth(3.344,20,t), manifest=smooth(10,36,t);
    const high=smooth(146,163,t)*(1-smooth(219,236,t));
    const hit=pulse(t,25.681,.53), e0=pulse(t,3.344,.4), e1=pulse(t,157.687,.48);
    const e2=pulse(t,173.012,.67), e3=pulse(t,203.012,.55), e4=pulse(t,212.021,.48);
    const resolve=pulse(t,cult?225.05:222.75,.72);
    const accent=Math.max(hit,e1,e2,e3,e4,resolve,e0*.7);
    const rPower=grow*(1-close);
    const sway=.053*Math.sin(t*1.7)+.028*Math.sin(t*3.9);
    camera.position.x+=Math.sin(t*1.27)*(.049+.12*high);
    camera.position.y+=Math.cos(t*.87)*(.033+.09*high)+accent*.10*Math.sin(t*19);
    camera.lookAt(cameraTarget);
    camera.rotateZ(high*.011*Math.sin(t*.54)+(cult?-.095*smooth(221,241,t):0));
    const fov=cut[8]+.65*Math.sin(Math.PI*u);
    if(Math.abs(camera.fov-fov)>.0001){camera.fov=fov;camera.updateProjectionMatrix();}

    scene.background.copy(skyBase).lerp(skyRed,clamp(rPower*.64+high*.16)).lerp(cult?skyVoid:skyEnd,cult?ruin*.9:close*.94);
    scene.fog.color.copy(fogBase).lerp(fogRed,clamp(rPower*.48+high*.2+ruin*.2));
    scene.fog.density=.0065+high*.0024+ruin*.004;
    originalLights.forEach(([l,intensity])=>l.intensity=intensity*(.61-.17*rPower+.21*close-.19*ruin));
    fill.intensity=.69+.2*close-.25*ruin;
    moon.intensity=1.3-.2*rPower+.39*close-.52*ruin+.23*accent;
    moon.color.setHex(0xb9d9ff).lerp(tmpColor.setHex(0xdb6a8e),ruin*.85);
    rLight.intensity=(rPower*(620+high*650+110*accent))*(1.0+ruin*.22);
    gateLight.intensity=(86+280*e0)*(1-smooth(17,41,t))+530*hit+160*ruin;
    grade.uniforms.flash.value=accent*.32;
    grade.uniforms.ruin.value=ruin;
    grade.uniforms.fade.value=.21*smooth(duration-2.1,duration,t);
    grade.uniforms.stamp.value=Math.floor(t*20)*.023;

    rite.visible=t<35;riteWheel.rotation.y=t*.20;
    ritualMat.opacity=.87*(1-smooth(9,34,t))+.12*e0;
    ritualPale.opacity=.76*(1-smooth(9,34,t));
    const shockU=smooth(25.42,31.8,t);
    shock.visible=t>=25.42&&t<31.8;shock.scale.setScalar(.3+shockU*26);shockMat.opacity=.75*(1-shockU);
    breachGlow.scale.set(6+9*hit,9+17*hit,1);breachGlow.material.opacity=hit*.82+.19*pulse(t,4.27,.9);

    rift.visible=t<224.2||cult;
    rift.position.copy(src);rift.position.y+=2.1*swallow+ruin*.64;
    const openingX=Math.max(.018,rPower*(1+sway));
    rift.scale.set(openingX*(1+1.43*swallow+.53*ruin)*(1-.63*positive*close),
      (.38+.62*grow)*(1-.88*close)*(1+.87*swallow+.46*ruin),1);
    for(let i=0;i<=N;i++){
      const a=i/N*tau, c=Math.cos(a), s=Math.sin(a);
      const b=1+.061*Math.sin(a*7+t*.92)+.037*Math.cos(a*13-t*1.3)+.031*Math.sin(a*22+t*2.05);
      const xx=6.24*c*b, yy=7.74*s*b;
      for(let j=0;j<layers.length;j++){
        const q=layers[j];
        put(spos,j*(N+1)+i,q*xx+(1-q)*.23*Math.sin(a*2),q*yy,.04*Math.sin(a*5+j)-.19*(1-q));
      }
      for(let j=0;j<rims.length;j++){
        const q=[.987,1.006,1.034,1.09,.899,1.15][j]+.017*Math.sin(a*(5+j)+t*(1+j*.11));
        put(rims[j].a,i,xx*q,yy*q,.11+j*.027);
      }
    }
    sgeo.attributes.position.needsUpdate=true;
    rims.forEach((o,j)=>{
      touch(o);o.m.opacity=(.93-j*.102)*(.56+.44*grow)*(1-.42*close)+high*.09;
      o.m.color.setHex([0xffd2d0,0xff4161,0xf32359,0xa31855,0xff6c83,0x742754][j]).lerp(gold,positive*.94);
    });
    valve.rotation.z=-t*.075;valve.position.z=.42;
    glass.opacity=.52*rPower+.1*high;softRed.opacity=.23*rPower;
    rimGlow.scale.set(25+17*swallow,27+20*swallow,1);rimGlow.material.opacity=.26*rPower+.18*high;
    wound.scale.set(4+5*e0,12+6*e0,1);wound.material.opacity=.86*(1-grow)+.14*high;
    king.visible=t>8&&close<.84;
    king.position.set(.39*Math.sin(t*.29),-1.8+1.6*manifest+.43*Math.sin(t*.61),.43+1.2*manifest+1.36*high+.77*ruin);
    king.scale.setScalar(.45+.63*manifest+.16*high+.22*ruin);
    king.rotation.y=.12*Math.sin(t*.39)-high*.14;
    head.rotation.y=.23*Math.sin(t*.42)+.16*high;
    head.rotation.z=.071*Math.sin(t*.52);
    eyes.material.opacity=.78+.22*accent;
    heart.scale.y=.5+.23*high+.09*Math.sin(t*5);
    for(const a of arms){
      a.shoulder.rotation.z=a.s*(.12+.13*Math.sin(t*.72+a.s)+.38*high+.38*ruin-.43*positive*close);
      a.shoulder.rotation.x=-.13-.3*high-.21*Math.cos(t*.45+a.s);
      a.elbow.rotation.z=a.s*(.28+.25*Math.sin(t*.84+a.s));
      a.elbow.rotation.x=-.22-.25*high;
    }
    for(let j=0;j<fallBeams.length;j++){
      const b=fallBeams[j], f=fract(t*.17+j*.198), op=Math.sin(f*Math.PI);
      b.o.visible=t>9&&rPower>.05;
      b.m.opacity=.46*op*rPower*(1-ruin*.4);
      for(let i=0;i<b.n;i++){
        const k=i/(b.n-1), v=clamp(f-k*.52);
        put(b.a,i,mix(src.x-2.9+j*.44,14.4+j*.52,v)+.53*Math.sin(k*17+j+t*4),
          mix(23+j*.42,2,v)+.69*Math.sin(k*18+t*3),mix(src.z-1.5,-6+j*.53,v));
      }touch(b);
    }

    for(let j=0;j<storm.length;j++){
      const o=storm[j], rad=13+rand(j+18)*33, drift=t*(.09+rand(j+48)*.16)+j*1.187;
      o.o.visible=t>3&&rPower>.025;
      o.m.opacity=(.15+high*.38+ruin*.1)*rPower*(.65+rand(j+41)*.35);
      for(let k=0;k<o.n;k++){
        const f=k/(o.n-1),a=drift+f*(1.0+rand(j+11)*1.5),r=rad*(.78+.22*f)*(1+.13*ruin);
        put(o.a,k,src.x+Math.cos(a)*r,17+rad*.58+1.7*Math.sin(a*3+j)+2*Math.cos(f*6+t*.71),src.z+Math.sin(a)*r*.82);
      }touch(o);
    }
    for(const b of lightning){
      const j=b.i, freq=.47+j*.037, clock=t*freq+j*.321, tick=Math.floor(clock);
      const v=fract(clock), flick=Math.exp(-v*25);
      const op=rPower*(.27+.63*high+.30*ruin)*Math.max(flick,accent*(j%2===0?.7:.39));
      b.core.o.visible=b.branch.o.visible=t>23&&op>.074;
      b.core.m.opacity=op;b.branch.m.opacity=op*.74;
      if(!b.core.o.visible)continue;
      const a=rand(tick*31+j*91)*tau, r=10+rand(tick*11+j*61)*23;
      for(let k=0;k<18;k++){
        const q=k/17, z=Math.sin(q*Math.PI), f=tick*18+k+j*388;
        put(b.core.a,k,src.x+Math.cos(a)*r*(1-q*.87)+(rand(f)-.5)*z*5.0,
          mix(38+rand(j)*12,18+rand(j+7)*16,q)+(rand(f+170)-.5)*z*5.4,
          src.z+Math.sin(a)*r*(1-q*.87)+(rand(f+230)-.5)*z*4.2);
      }
      const k0=7*3;
      for(let k=0;k<10;k++){
        const q=k/9, w=rand(tick*27+k+j*21)-.5;
        put(b.branch.a,k,b.core.a[k0]+q*(Math.cos(a+.8)*8+w*4),b.core.a[k0+1]-q*(5+w*3),b.core.a[k0+2]+q*(Math.sin(a+.8)*8-w*4));
      }touch(b.core);touch(b.branch);
    }
    snow.m.opacity=.51-.23*high-.30*ruin;
    embers.m.opacity=.68*rPower;embers.o.visible=rPower>.012;
    for(let k=0;k<snow.n;k++){
      const [a,b,c,d]=snow.data[k];
      put(snow.a,k,-32+fract(a+t*.012)*71,1+fract(b-t*.024)*41,-49+fract(c+t*.006)*67+Math.sin(t*.36+k)*d);
    }touch(snow);
    if(embers.o.visible)for(let k=0;k<embers.n;k++){
      const [a,b,c,d]=embers.data[k], r=(2+27*a)*(1+.42*swallow), v=t*(.12+d*.61)/(1+.023*r)+b*tau;
      const z=fract(c+t*(.023+.025*d));
      put(embers.a,k,src.x+Math.cos(v)*r,5+z*42+(1-r/39)*Math.cos(v*2)*3,src.z+Math.sin(v)*r*.86);
    }touch(embers);
    shards.visible=rPower>.03;
    if(shards.visible){
      for(let i=0;i<76;i++){
        const a=i*2.399+t*(.08+.31*rand(i+9)), r=(7.4+rand(i+46)*13.0)*(1+swallow*.88);
        dummy.position.set(src.x+Math.cos(a)*r,src.y+(rand(i+135)-.5)*(18+18*swallow)+1.7*Math.sin(a*1.37),src.z+Math.sin(a)*r*.68);
        const d=(.1+rand(i+78)**3*.58)*(rPower+.66*ruin);
        dummy.scale.set(d*.49,d*(1.7+rand(i+70)),d*.33);dummy.rotation.set(a*.9,t*.36+i,a);
        dummy.updateMatrix();shards.setMatrixAt(i,dummy.matrix);
      }shards.instanceMatrix.needsUpdate=true;
    }

    for(const a of anchors){
      const lock=smooth(a.on,a.on+3.2,t)*(cult?1-smooth(209+a.i*2.8,216+a.i*2.7,t):1);
      a.lock=lock;
      a.o.visible=t>a.on-8;
      a.rot.visible=a.col.visible=lock>.008;
      a.rot.rotation.y=t*(.72+a.i*.13);a.rot.position.y=1.97+.1*Math.sin(t*2.1+a.i);
      a.col.scale.y=(2.7+4.4*high)*lock;a.col.position.y=1.78+a.col.scale.y*.5;
      const w=fract(t*.54+a.i*.21);
      a.field.scale.setScalar(1+w*(1.4+high));a.field2.scale.setScalar(1.14+high*.88);
      a.aMat.opacity=lock*(.53+.21*Math.sin(t*4+a.i)+.17*accent);
      a.g.scale.set(4.4+high*2,4.6+high*2,1);a.g.material.opacity=lock*(.48+.38*high);
    }
    for(let j=0;j<3;j++){
      const l=anchorLinks[j], a=l.a.p,b=l.b.p, str=Math.min(l.a.lock,l.b.lock);
      l.base.o.visible=l.flow.o.visible=str>.003;
      l.base.m.opacity=str*(.32+.42*high);l.flow.m.opacity=str*.86;
      for(let k=0;k<26;k++){
        const u=k/25;put(l.base.a,k,mix(a.x,b.x,u),mix(a.y,b.y,u)+2.12+2.3*Math.sin(u*Math.PI),mix(a.z,b.z,u));
      }
      for(let k=0;k<9;k++){
        const u=fract(t*.57+j/3)*.89+k/8*.11;
        put(l.flow.a,k,mix(a.x,b.x,u),mix(a.y,b.y,u)+2.18+2.3*Math.sin(u*Math.PI),mix(a.z,b.z,u));
      }touch(l.base);touch(l.flow);
      const co=convergence[j],on=high*anchors[j].lock*(.39+.61*positive);
      co.o.visible=on>.07;co.m.opacity=on*.84;
      for(let k=0;k<co.n;k++){
        const u=k/(co.n-1), w=Math.sin(u*Math.PI);
        put(co.a,k,mix(a.x,src.x-2,u)+w*(-1.4+j*.6),mix(a.y+2,src.y,u)+w*(.9+2.5*positive),mix(a.z,src.z-1,u)+.3*w*Math.sin(t*3+k*.83));
      }touch(co);
    }

    const arriving=smooth(124.018,137,t), diskFade=cult?1-smooth(221.5,225.25,t):1-smooth(222.1,233,t);
    disk.visible=arriving*diskFade>.002;
    disk.position.copy(diskHome).lerp(src,swallow);disk.position.y+=(1-arriving)*3+Math.sin(t*.77)*.29+swallow*2.1;
    disk.position.z+=swallow*(1-swallow)*4.2;
    disk.rotation.set(swallow*1.23,swallow*(-1.33),swallow*1.08+.044*Math.sin(t*.44)*high);
    disk.scale.setScalar((.32+.68*arriving)*Math.max(.01,diskFade)*(1+.07*high+.10*Math.sin(t*3)*taint));
    const lit=arriving*diskFade;
    dMat.opacity=.94*lit;dCool.opacity=.77*lit;dGlass.opacity=.24*lit;dFill.opacity=.78*lit;dShade.opacity=lit*.83;
    dMat.color.setHex(ivory).lerp(red,taint);dCool.color.setHex(clean).lerp(tmpColor.setHex(0xe74684),taint);
    dFill.color.setHex(0x323c50).lerp(tmpColor.setHex(0x431027),taint);
    dial1.rotation.z=t*.35+swallow*4;dial2.rotation.z=-t*.53-swallow*5;dial3.rotation.z=t*.23;
    diskGlow.scale.set(15+8*high,11+7*high,1);
    diskGlow.material.color.setHex(0xffdea4).lerp(red,taint);diskGlow.material.opacity=lit*(.42+.49*high);
    bLight.position.copy(disk.position);bLight.position.y-=9;bLight.intensity=lit*(340+high*1250);
    bLight.color.setHex(0xffd4a1).lerp(red,taint);
    const aim=arriving*(1-smooth(157.687,159.42,t));
    for(let j=0;j<forecast.length;j++){
      const o=forecast[j], a=fract(j/10+t*.18), h=mix(disk.position.y-1,3,a);
      o.o.visible=aim>.004;o.m.opacity=aim*.57;
      put(o.a,0,disk.position.x,h,disk.position.z);put(o.a,1,disk.position.x,h-1.48,disk.position.z);touch(o);
    }
    P0.copy(disk.position);P0.y-=.55;
    const bend=smooth(158.33,162.7,t);
    P1.copy(P0);P1.y=mix(P0.y-11,6.4,bend);P1.z+=taint*swallow*9.2;
    P2.set(mix(P0.x,10.5,bend),mix(14,10.2+2*sway,bend),mix(P0.z,-18,bend));
    endHit.copy(rift.position).add(V(-.14,1.12,-.67));
    P3.set(P0.x,6,P0.z).lerp(endHit,bend);
    const rest=swallow*.97;
    P1.lerp(P0,rest);P2.lerp(endHit,rest);
    const reach=smooth(157.687,163.05,t);
    const power=smooth(157.687,159.9,t)*diskFade*(1-(cult?.0:.99)*smooth(219.25,224.2,t));
    drawBeam(reach,t,power,taint);
    cubic(tipHit,reach);
    bGlow.position.copy(tipHit);bGlow.material.color.setHex(0xffe8b2).lerp(red,taint);
    bGlow.scale.set(5.4+9.3*high+6.1*positive,5.3+9*high+5*accent,1);
    bGlow.material.opacity=power*(.69+.30*accent);
    cubic(knotGlow.position,.49);knotGlow.scale.set(7.3,6.7,1);knotGlow.material.opacity=.36*power;
    sparks.o.visible=power>.012||resolve>.03;
    sparks.m.opacity=Math.max(power,resolve)*.88;sparks.m.color.setHex(0xffe6bc).lerp(red,taint);
    if(sparks.o.visible)for(let k=0;k<sparks.n;k++){
      const [a,b,c,d]=sparks.data[k];
      const q=fract(a+t*(.19+d*.46)*(taint>.6?-1:1))*reach;
      cubic(pBeam,q);
      const r=.27+b*b*(2.15+resolve*8), theta=c*tau+q*18+t*(d-.4)*2.45;
      put(sparks.a,k,pBeam.x+Math.cos(theta)*r,pBeam.y+r*Math.sin(theta),pBeam.z+Math.cos(theta*1.11)*r*.8);
    }touch(sparks);
    seal.visible=!cult&&t>208&&t<248;
    if(seal.visible){
      const ps=smooth(208,222.75,t), fade=1-smooth(227,247,t);
      sealMat.opacity=fade*(.72+.22*accent)*ps;
      const spread=2.3+10*smooth(222.75,226.9,t);
      for(let i=0;i<stitch.length;i++){
        stitch[i].scale.set(spread,spread*.99,1);
        stitch[i].rotation.z=i*.014+t*.26;
        stitch[i].visible=t>220.7&&t<231;
      }
      seam.scale.set(.052+.21*resolve,(1.3+5.3*ps)*fade,.14);
      sealGlow.scale.set(5+21*resolve,13+21*resolve,1);sealGlow.material.opacity=ps*fade*(.33+.65*resolve);
    }
    for(let j=0;j<impactRings.length;j++){
      const o=impactRings[j], e=cult?224.4:222.7, w=clamp((t-e-j*.26)/5.8);
      o.o.visible=w>0&&w<1;
      o.o.scale.setScalar(2+w*(27+j*3));o.m.opacity=(1-w)*.64;
      o.m.color.setHex(cult?hot:ivory);
    }
    for(let j=0;j<fractures.length;j++){
      const f=fractures[j], appear=cult?smooth(218+j*.31,228+j*.43,t):0;
      f.l.o.visible=appear>.01;f.l.m.opacity=appear*(.66+.27*Math.sin(t*(1.6+j*.07)));
      if(!f.l.o.visible)continue;
      for(let k=0;k<9;k++){
        const u=k/8,w=Math.sin(u*Math.PI), a=f.a+(rand(k+j*23)-.5)*.32*w;
        const r=f.r+u*(5.8+f.r*.38)*appear;
        put(f.l.a,k,src.x+Math.cos(a)*r,4+f.h+u*(2.3+f.h*.37)+(rand(k+j*5+30)-.5)*w*4+ruin*Math.sin(a+t*.19)*2.3,src.z+Math.sin(a)*r*.88);
      }touch(f.l);
    }

    for(const a of Object.values(actorBatches))a.n=0;
    for(const o of actorList){
      o.on=false;o.scale=1;
      if(o.kind==='rite'){
        o.on=t<8.3&&t<4.7+o.id*.57;o.run=.06;
        o.scale=1-.18*smooth(4.3+o.id*.57,5+o.id*.57,t);
      }else if(o.kind==='human'){
        const elapsed=t-o.start;
        o.on=elapsed>=0&&(!cult||t<227+rand(o.id+o.f*42)*13);
        const charge=smooth(0,16+o.f*3,elapsed);
        const sweep= .060*Math.sin(t*.21+o.id*1.3)*smooth(17,25,elapsed);
        const location=.80+.16*(o.row/3);
        walk(o,charge*location+sweep,.25*Math.sin(o.id*2));
        const facing=o.yaw;
        const adv=1-smooth(13,22,elapsed);
        const target=cultists[(o.id+o.f*5)%cultists.length].pos;
        // Facing uses a scripted point so it has no dependency on the previously evaluated frame.
        const aimX=14.2+2*Math.sin(t*.4+o.id*.7), aimZ=-6.2+Math.sin(t*.5+o.id);
        const desired=Math.atan2(aimX-o.pos.x,aimZ-o.pos.z);
        const turn=Math.atan2(Math.sin(desired-facing),Math.cos(desired-facing));
        o.yaw=facing+(1-adv)*turn+(cult?ruin*.91:close*.3)*Math.sin(o.id*1.8+t*.32);
        o.run=(adv*.88+.12)*(1-.85*close)+.66*ruin;
        o.scale=.96+.081*rand(o.id+o.f*52);
      }else if(o.kind==='cult'){
        const e=t-o.start, cycle=17.4+(o.id%4)*1.43;
        const phase=fract(e/cycle)*cycle, stop=!cult&&t>214+rand(o.id+32)*8;
        o.on=e>=0&&!stop&&phase<cycle-1.0&&rPower>.02;
        o.scale=(.61+.39*smooth(0,1.05,phase))*(1-.72*smooth(cycle-2.2,cycle-1,phase));
        if(phase<3.8){
          const f=clamp(phase/3.8), g=f*f, dest=o.path[0];
          o.pos.set(mix(src.x-2.7-.12*(o.id%4),dest.x,f),mix(src.y-3.4+(o.id%3)*.37,dest.y,g),mix(src.z-2.94,dest.z,g*.76+f*.24));
          o.yaw=-1.8+.39*Math.sin(t*2+o.id);o.run=.49;
        }else{
          walk(o,smooth(3.8,cycle-2,phase),.54*Math.sin(o.id*1.76));o.run=.91;
        }
      }else{
        const e=t-o.start;
        o.on=e>=0&&(!cult?t<217+o.id*2:t<244+o.id*3);
        const c=smooth(0,6,e);
        walk(o,.1+.8*c+.065*c*Math.sin(t*.9+o.id),Math.sin(o.id*3.1)*.81+(o.kind==='wraith'?.7:0));
        o.run=.85-.5*c;
        o.scale=(o.kind==='beast'?1.13:1.06)*(.23+.77*smooth(0,1.6,e))*(1-(cult?0:.94)*smooth(212,220,t));
      }
      if(o.on)drawActor(o,t);
    }
    for(const a of Object.values(actorBatches)){
      a.o.count=a.n;a.o.instanceMatrix.needsUpdate=true;
      if(a.o.instanceColor)a.o.instanceColor.needsUpdate=true;
    }

    for(let j=0;j<tracers.length;j++){
      const tr=tracers[j], rate=1.07+rand(j+31)*.87, k=t*rate+j*.679, f=fract(k), it=Math.floor(k);
      const human=actorList[(j+Math.floor(rand(it+j*12)*32))%33];
      const enemy=cultists[Math.floor(rand(it*7+j*61)*cultists.length)];
      const reply=j%5===0;
      const a=reply?enemy:human,b=reply?human:enemy;
      const live=t>37&&t<(cult?222.8:216.5)&&a.on&&b.on&&f<.21&&enemy.pos.y<6&&a.pos.distanceToSquared(b.pos)>6;
      tr.l.o.visible=tr.g.visible=live;
      if(!live)continue;
      const q=clamp(f/.18), tail=Math.max(0,q-.36);
      const color=reply?0xff345c:[0x92c7ff,0x9affec,0xffd28c][a.f];
      tr.l.m.color.setHex(color);tr.l.m.opacity=.93*(1-smooth(.16,.21,f));
      const u0=tail,u1=(tail+q)*.5,u2=q;
      for(let i=0;i<3;i++){
        const f2=i===0?u0:i===1?u1:u2;
        put(tr.l.a,i,mix(a.pos.x,b.pos.x,f2),mix(a.pos.y+1.29,b.pos.y+1.05,f2),mix(a.pos.z,b.pos.z,f2));
      }touch(tr.l);
      tr.g.position.fromArray(tr.l.a,f<.037?0:6);
      tr.g.scale.setScalar(f<.037?.78:.47);tr.g.material.color.setHex(color);
      tr.g.material.opacity=f<.037?.89:q>.87?.62:.38;
    }
    paint(t,ci,cult);
  }
  return {
    update,
    caption(time,ending){
      const i=indexAt(time), row=cuts[i];
      if(i<14)return {title:row[2],text:row[3]};
      const out=endings[ending==='cult'?'cult':'human'][i-14];
      return {title:out[0],text:out[1]};
    }
  };
};