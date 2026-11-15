// Scarlet King finale storyboard for the real SCP:SL 15.0 Surface map.
// Every frame is a pure function of (time, ending). All shot beats are documented in SHOTS (caption()).
// Added visuals are built from SL-style primitives only: cubes, spheres, cylinders, capsules, planes and lights.
window.createStoryboard = function (api) {
  const { THREE, scene, camera, effects, landmarks, groundY, duration, lights } = api;

  // ---------------------------------------------------------------- helpers
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const win = (t, a, b, fi, fo) => sstep(a, a + fi, t) * (1 - sstep(b - fo, b, t));
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const fract = x => x - Math.floor(x);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const tmpV = V(0, 0, 0), tmpV2 = V(0, 0, 0), tmpV3 = V(0, 0, 0), segD = V(0, 0, 0), UPZ = V(0, 0, 1);
  const dummy = new THREE.Object3D();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const tmpC = new THREE.Color();

  // Ground heights sampled offline from the same surface15.glb with the same rule as api.groundY
  // (first upward-facing surface below local Y=18), 1 m grid, x -34..26, z -62..12.
  const GRID = '4e4f50524f48372828262525252423232222212020212325262526262726262627282b2d2e2e2e2d2c3f646d6d6d6d6d6d3f332b2b2b2b2b2e2c2b2b2b4d4e3c4a4845282827252424242323222221212122232425262525252625252527292c2e2f2e2e2d2c3f646d6d6d6d6d6d3f2e2b2b2b2b2b2e2c2b2b2b2a433e3e3e2d2a29282623232322222223222325262526262625252526252526282b2e2f2f2f2e2d2c3f646d6d6d6d6d6d4b2f2c2c2c2c2c332d2c2c2c513c403a393c2c2a2927252222212224242425272726272726262627262525272b2d3030302f2e2d2c3f646d6d6d6d6d6d5b302d2d2d2d2d342e2d2d2d524e413c342b292a2a282624212122232325262626262725262727282526282a2d303131302f2e2d2c3f646d6d6d6d6d6d3f312e2e2e2e2e302f2e2e2e524f4a403828282a2a2825242021212324262828262626252527282725262a2e30323131302f2e2d2c3f646d6d6d6d6d6d3f322f2f2f2f2f35302f2f2f514f4b27272a29292a2725242121222425262827262626252526272526282d3032323231302f2e2d2c3f646d6d6d6d6d6d3f322f2f2f2f2f36302f2f2f5f27273b312b29282928252321222324252627272727262626262627282c303333333231302f2e2d2c3f646d6d6d6d6d6d3f3330303030303731303030682645412731292828292724212223242526262728272725252626282b30333433333231302f2e2d2c3f646d6d6d6d6d6d3f34313131313133323131316d6c6a675d3a2d292a2a27232122232525262728282927252424262a2f33353434333231302f2e2d2c3f646d6d6d6d6d6d3f35323232323234333232326f6f6e6b2461552f2b2827262223242526252828282827242425282e3335353534333231302f2e2d2c3f646d6d6d6d6d6d3f363333333333353433333371706f6e6c6823382928272522232425262727282828272424262d333636363534333231302f2e2d2d3f646d6d6d6d6d6d3f373434343434363534343471706f6e6e6b212033292725212324252727272828282725252b32363736363534333231302f2e2d2d3f646464646464645b383535353535373635353571706f6e6e6c675b372c27262222232527272728282826262a3236383737363534333231302f2e2e2d3f646464646464645b39363636363638373636366f6f6f6e6c6a204b202a282722212324252727282828282b313638383837363534333231302f2e2e2d3f646464646464643f3a36363636363a37363636716f236422214c33212b2926222021232325272828292c31363939383737363534333231302f2f2e2d3f646464646464643f3b37373737383a383737376f6d645e232222352d2a26251f1f202122232426282c3136393a39383737363534333231302f2f2e2d3f646464646464643f3b38383838393b39383838676424234d2322302c29261e1e1e1f2021222325293036393b3a3938383736353433323130302f2e2d3f646464646464643f3a393939393939393939395e5124243433322f2a29201f1e1e1f20212223262d353a3c3b3a3938383736353433323130302f2e2d3f646464646464643f3b3a3a3a3a3a3a3a3a3a3a555225253c3923302c22221f1f1f1f1f2122242aff393c3c3b3a3939383736353433323131302f2e2d3f64646464646464403c3b3b3b3b3b3b3b3b3b3b555149413d3b372e2d25222120202020212310ff393c3d3c3b3a3a39383736353433323231302f2e2d3f64646464646464403d3c3c3c3c3c3c3c3c3c3c574544413f3b352d2d2d272221212122231110383d3e3d3c3b3a3a39383736353433323231302f2e2d3f64646464646464403e3c3c3c3c3c3c3c3c3c3c5854403f3d39342d2c2c2923232323232711103d3f3e3d3c3b3b3a39383736353433333231302f2e2d3f646464646464645a3e3d3d3d3d3d3d3d3d3d3d57533d3c3b392e2c2b2525242424242711103d3f3f3e3d3c3b3b3a39383736353434333231302f2e2d3f646464646464643f3f3d3d3d3d3d3d3d3d3d3d52483c3b382f2b292626262525252713113c40403f3e3d3c3c3b3a393837363534343d40404040515240646464646464643f3f3d3d3d3d3d3d3d3d3d3d263b38362c2a282727272626262715133c4041403f3e3d3c3c3b3a39434e535758505050564f4f4f54513f3f3f3f3f3f3f3f3f3d3d3d3d3d3d3d3d3e3d3a3634292826262627272625272a1412404241403f3e3d413c44545a5243424040403f3f3e3f3f3e3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d4a5734272527272726262727262629303a40434241403f3e4345455444434342403f3f3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3d3d3d3d3d3d3d3d3d3d3d575728262426272727262726262814134043434241403f575d544543434243403f3e3e3d3d3d3e3e3e3e3e3e3e3e3e3e3e3e3d3d3d3d3d3d3d3d3d3d57575729242425262626272525262b133f43444342415a565b47464443424241403f3e3e3e3d3d3e3e3e3e3e3e3e3e3e3e3e3e3d3d3d3d3d3d3d3d3d3d57575729232324242425262526291413434544435a5856484847454442424141403f4c4c4b3e3d3e3e3e3e3e3e3e3e3e3e3e3e3d3d3d3d3d3d3d3d3d5757573d262122232425272626291413434645485e5a4a49494746444342424141404d4c4c4b3e3e3e3e3e3e3e3e3e3e3e3e3e3e3d3d3d3d3d3d3d3d3d3d574a3d23242122232426272a31144346495e5e4b4b4a49484644444343424241404d4d4c4b3e3e3e3e3e3e3e3e3e3e3e3e3e3e3d3d3d3d3d3d3d3d3d3d3d3e3f212421222223252930144b4a5a60494c4b4b4a48474545444443434241404e403f3f3f3f3f3e3e3e3e3e3e424242403e3e4445453f3f3f3f3f3f3f3f3f212222222224272eff4b5f5b4aff4c4c654b4a484646454544444342434241403f3f3f6f717171717171717171716f717171707070545e5d5e5f4e53542021222222252b50686249484b4c4c4c4c4b4a474646464545444344435a42403f3f3f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d7474723f3f3f3f3f503f3f2121222223276368644f4f4b4c4c4b4b4a4a49474746464645454a45444443423f3f3f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d74746f39383b3a3b3b373822212223245368524e4e4e4e4c4c4b4a4a494848474747464647464646454645403f3f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d74746f373438343139383822222224526852524e4e4e4d4c4b4b4a4a49484848474747464747474848494946463f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f424242333337192f2122225369525252524e4d4d4c4c4b4a4a4949484848484747484849494b4c4c46463f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f42424233312b232f20215361535252524d4d4d4d4c4c4b4b4a4a4949494848484949494a4b4d4f4f453f3f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f424242221e201e2f727272727473524d4d4d4d6c504e4c4b4b4a4a49494949494a4a4a4b4d4f5152453f3f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f6f424226211f1f2f7070707070734d4d4d4d4d50504c4c4c4b4b4a4a4a4a4a4a4a4b4b4c4e5052533f3f3f6f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f6f434325211f1e2f707070707070724d4d4d50504d4d4c4c4c4c4b4b4a4a4a4a4a4c4f4d4f5053533f3f416f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f6f464626211f1f2f70707070707070724d50504d4d4d4d4d4e4e4c4b4b4b4b4b4b4d674d4f5153543f3f426f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f6f48483232321e2e707070707070707072734d5a5a4d4d4e4e4e4f4c4c4c4c4c4c4c4e4e4f5153543f3f426f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f6f4b4b3333333332707070707070707070725a5a5a4d52524e4e4e4e4c4c4c4c4c4d504f505152533f3f426f6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6f6f4e4e393735203470707070707070707070725a4d5252524e4e4e4e4e4d4d4d4d4d4e50515152526161616f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f684f3342296e3770707070707070707070707252525252527d7e7d4e4e4d4d4d4e4e4f4f5e5e516e5e6e5151515050505051505050505151515153515151515251515152707070707070707070707070747352527d7d7b7d7d4e4e4e4e4e4f4f5d5e5e5e5e505050505050505050505050505050516f51515151515151515151527070707070707070707070707272527d7d7b7b7b7d544f4e4e4f4f505d5e5e5e5e5d515050505050505050505050505050505151517c7c7c7c7c7c7c7c70707070707070707070707070727d7d7b7b7b7b7b7d7e504f4f505050505d5e5e5d505050505050505050505050505050505151587c7c7c7c817c8181707070707070707070707070707d7d7b7b7b7b7b7b7b7d7c50505050505050505050505050505050505050505050505050505051587c7c7c7c817c81817475707070707070707070707d7d7b7b7b7b7b7b7b7b7b8e8e505050505050505050505050505050505050505050505050505051517c7c7c7c817c818177787878787870707070707d7d7b7b7b7b7b7b7b7b7b8e8e8e8e5150505050505050505050505050505050505050505050505051517c7c7c7c7c7c7c7c7a7a7b7b7c7d7d7e82707d7d7b7b7b7b7b7b7b7b7b8e8e8e8e8e8e51515150505050505151516f516d5151515050505050505051517c7c7c7c7c7c7c7c7d7d7e8780807084827d7d7b7b7b7b7b7b7b7b7b8e8e8e8e8e8e8e51747550505050507575745151525152515050505050505065797c7c7c7c7c7c7c7c7081868a8987858687ff7b7b7b7b7b7b7b7b7b7b7b8e8e8e8e8e7c51757474747474747575515757515151515050505050505065687c7c7c7c7c7c7c7c8a89898b8a8f888885867a7b7b7b7b7b7b7b7b7b7b7b8e8e8e7b7c52747272727272727275695151515251515050505050505065687c7c7c7c7c7c7c7c9696949494939487898c86ff7b7b7b7b7b7b7b7b7b7b7b8e7b7b7c74747272727272727274747474747475515050505050505065687c7c7c7c7c7c7c7cff999fa1a0a0a09594ff918bff7b7b7b7b7b7b7b7b7b7b7b7b7b7c72797979727272727272727272727274515050505050505065687c7c81817c7c7c7cffa2a2a1a4658bff8fa0908e88837b7b7b7b7b7b7b7b7b7b7b7b7c72727272727272727272727272727274515050505050505065687c7c81817c7c7c7c3d656767676767a18e8eff8e8e84837b7b7b7b7b7b7b7b7b7b7b7c72727272727272727272727272727274525050505050505065687c7c81817c7c7c7c6e616767676767675fffffffffff91837e7b7b7b7b7b7b7b7b7b7c72727272727272727272727272727274545050505050505065687c7c81817c7c7c7c6e6e616767676767675fffffffff989182807c7b7b7b7b7b7b7b7c72727272727272727272727272727275565050505050505065687c7c7c7c7c8e8e8e6e6e6e61676767676767ffffffff4c4c9182817b7b7b7b7b7b7b7c72727272727272727272727272727275585050505050505065687c7c8e8e8e8e94946e6e6e6e61676767666565656565654c8b8a86847b7b7b7b7b7b7c72727878787872727272727272727274585050505050505053758e8e8e8e8e8e8e8e6e6e6e6e6e616565656565656565654f4f8e828184817b7b7b7b7c79797979797978787872727272727274585050505050505055558f8f8f8f8f8f8f8f6e6e6e6e6e6eff65656565656565654f4f9d90908585867b7b7b7c79797a7a7a7a79797978727272727274584f4f4f4f4f4f4f57578f8f8f8f8f8f8f8f6e6e6e6e6e73734f7b657b656565654f4fffffff918e7b867b7b7c7a7a7a7a7a7a7a7a7a799f9f9e9f9f9e584e4e4e4e4e4e4e58588f8f8f8f8f8f8f8f6e6e6e6e7c7c7c7c7c7c7c7c7c7c7c7c7c7c7ca09190907b867d7c7b7b7b7a7b7b7b7b7a9e9e9e9e9e9e9e584c4c4c4c4c4c4c58588f8f8f8f8f8f8f8f6e6e6e737c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7ca39292908b89837d807683817f7d7c7b9e9e9e9e9e9e9e584a4a5858584a4a58588f8f8f8f8f8f8f8f6e6e73737c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c9d90938f7e897b7a89878684727f7d9e9e9e9e9e9e9e71474856565648486a6a8e8e8e8e8e8e8e8e6eff73737c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7b7c9c8082828d8c8d7a788b85827f9e9e9e9e9e9e9e716c45547254456c6f6f8e8e8e8e8e8e8e8effff73737c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7fff83859a938f85968f8c7785829e9e9e9e9e9e9e747474747474747474748e8e8e8e8e8e8e8e';
  const GX0 = -34, GZ0 = -62, GW = 61, GH = 75;
  const gridAt = (ix, iz) => {
    ix = clamp(ix, 0, GW - 1); iz = clamp(iz, 0, GH - 1);
    const v = parseInt(GRID.substr((iz * GW + ix) * 2, 2), 16);
    return v === 255 ? null : v / 5 - 15;
  };
  const gcache = new Float32Array(GW * GH);
  for (let iz = 0; iz < GH; iz++) for (let ix = 0; ix < GW; ix++) { const g = gridAt(ix, iz); gcache[iz * GW + ix] = g === null ? 1 : g; }
  function gy(x, z) {
    const fx = clamp(x - GX0, 0, GW - 1.001), fz = clamp(z - GZ0, 0, GH - 1.001);
    const ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, w = fz - iz;
    const a = gcache[iz * GW + ix], b = gcache[iz * GW + ix + 1], c = gcache[(iz + 1) * GW + ix], d = gcache[(iz + 1) * GW + ix + 1];
    // avoid blending across walls: if the cell is not flat use nearest sample
    if (Math.max(a, b, c, d) - Math.min(a, b, c, d) > 1.2) return gcache[Math.round(fz) * GW + Math.round(fx)];
    return lerp(lerp(a, b, u), lerp(c, d, u), w);
  }
  const safeGround = (x, z, fallback) => { let y = null; try { y = groundY(x, z); } catch (e) { y = null; } return (y === null || Math.abs(y - fallback) > 1.5) ? fallback : y; };

  // ---------------------------------------------------------------- key places
  const RIFT = landmarks.rift.clone();                       // (22,24,-3) above Gate A
  const GATE_A = landmarks.gateA.clone();
  const RITUAL = V(13, 0, -2); RITUAL.y = safeGround(13, -2, gy(13, -2));   // the lane outside Gate A
  const BEACON = RITUAL.clone();
  const ANCH = landmarks.anchorSites.map(p => p.clone());      // plaza, courtyard, garage roof
  const KING_BASE = V(30, 8, 9);                                // behind the rift, on the Gate A block
  const GATEB_SHAFT = V(-34, 15, -3), GATEA_SHAFT = V(27, 12, 2);

  // ---------------------------------------------------------------- timeline
  const T = { riftOpen: 25.68, wiped: 33.0, king: 37.0, rain: 44.4, mtf: 49.69, scp: 66.69, chaos: 73.35, goc: 79.02,
    a1: 83.69, a2: 92.35, a3: 96.02, push: 107.69, mtf2: 112.0, beacon: 117.35, auth: 124.02, calm: 130.36,
    reach: 141.0, charge: 152.0, strike: 157.69, show: 165.0, tug: 172.85, tip: 187.01, end: 192.0, hit: 203.01, after: 212.02 };

  // ---------------------------------------------------------------- shots (camera + captions)
  const SHOTS = /*SHOTS*/[
{"t":0,"title":"1 · The last ritual","text":"Dusk over the real 15.0 Surface. Cultists ring a blood sigil in the lane outside Gate A while the facility below falls silent.","p0":[-16,27,-48],"p1":[-7,20,-35],"l0":[12,3,-4],"l1":[13,2,-3],"fov":[46,44]},
{"t":9.5,"title":"2 · The circle chants","text":"Eight cultists bow around the candle ring. The sigil pulses faster with every verse.","orb":{"c":[13,1,-2],"r":[8,7],"h":[3.6,2.6],"a":[-125,-62]},"l0":[13,1.4,-2],"l1":[13,1.8,-2],"fov":[48,46]},
{"t":17,"title":"3 · Something answers","text":"A red pillar climbs from the sigil past the Gate A roofline. The sky above the elevator starts to turn.","p0":[0,9,-15],"p1":[1,8.6,-14],"l0":[14,3,-2],"l1":[21,21,-3],"fov":[52,56]},
{"t":25.68,"title":"4 · The rift tears open","text":"On the first hit the sky above Gate A splits: a wheel of crimson shards around a black core.","p0":[-6,14,-33],"p1":[-2,15,-29],"l0":[19,17,-3],"l1":[20,19,-3],"fov":[52,50],"shake":0.35},
{"t":33.0,"title":"5 · The facility is gone","text":"CASSIE cuts out mid-sentence. Fire vents from both elevator shafts: the underground is wiped out and the surface is the last battlefield.","p0":[18,60,-22],"p1":[12,54,-30],"l0":[0,0,-8],"l1":[2,2,-8],"fov":[50,52],"shake":0.25},
{"t":37.0,"title":"6 · The Scarlet King stirs","text":"Behind the rift a crowned silhouette presses against the edge of reality.","p0":[6,2.8,-11],"p1":[7,2.6,-10],"l0":[21,25,-3],"l1":[22,27,-3],"fov":[58,54]},
{"t":44.4,"title":"7 · The faithful return","text":"Three pulses, three eyes. Red columns drop from the rift and cultists respawn in the lane, endlessly.","p0":[-4,6,-14],"p1":[-1,6.4,-12],"l0":[13,4,-3],"l1":[13,5,-2],"fov":[50,50],"shake":0.2},
{"t":49.69,"title":"8 · Wave 1 · MTF Epsilon-11","text":"Nine-Tailed Fox push up the access road from the surface checkpoint, blue IFF strobes on.","p0":[22,-0.4,-58],"p1":[20,-0.2,-44],"l0":[16,-1.2,-30],"l1":[10,-1,-28],"fov":[50,50]},
{"t":58.0,"title":"9 · First contact","text":"MTF take the west plaza and open fire on cultists pouring out of the Gate A lane.","p0":[-15,12,-25],"p1":[-12,11,-23],"l0":[10,4,-4],"l1":[7,2,-10],"fov":[50,50]},
{"t":66.69,"title":"10 · The SCPs choose a side","text":"Gate A glows red. SCP-173, 096, 939 and 049 walk out of the dead facility and join the cult; SCP-106 rises in the courtyard.","p0":[6,4,-10],"p1":[8,3.5,-7.5],"l0":[19,2,1],"l1":[16,1.8,-1],"fov":[52,50]},
{"t":73.35,"title":"11 · Wave 2 · Chaos Insurgency","text":"Chaos arrive from the Gate B side and fall in beside the MTF. Old enemies, one target, no friendly fire.","p0":[-4,5,-27],"p1":[-6,4.6,-24],"l0":[-20,1.5,-21],"l1":[-12,1.4,-18],"fov":[52,50]},
{"t":79.02,"title":"12 · Wave 3 · GOC strike team","text":"White-armoured GOC climb the road carrying Scranton Reality Anchors and a targeting beacon.","p0":[0,1,-33],"p1":[2,1,-33.5],"l0":[16,-1,-38],"l1":[12,-1,-32],"fov":[50,48]},
{"t":83.69,"title":"13 · Anchor one: Gate A plaza","text":"The first Scranton Reality Anchor unfolds at the mouth of the lane. Its blue field pushes the cult back.","p0":[1.5,3.6,-10],"p1":[3,3,-12],"l0":[10,2.2,-9],"l1":[10,2.4,-8],"fov":[50,48]},
{"t":92.35,"title":"14 · Three anchors, one perimeter","text":"Anchors two and three come online in the courtyard and on the garage roof; blue tethers lock them into a triangle.","p0":[-25,25,-27],"p1":[-22,27,-23],"l0":[5,4,-12],"l1":[6,4,-12],"fov":[50,50]},
{"t":100.84,"title":"15 · Shoulder to shoulder","text":"MTF, Chaos and GOC hold the line together. Every tracer goes at a cultist or an SCP, never at an ally.","p0":[-12,2.2,-16.5],"p1":[-11,2.2,-16],"l0":[-3,1.6,-15],"l1":[-2,1.6,-14.5],"fov":[48,48],"shake":0.15},
{"t":102.68,"title":"16 · SCP-939 lunges","text":"The beast tests the anchor field and recoils from the blue light.","p0":[3,2.4,-11],"p1":[4,2.3,-10.5],"l0":[11,1.4,-6],"l1":[11,1.5,-6],"fov":[50,50],"shake":0.3},
{"t":104.03,"title":"17 · Fire discipline","text":"GOC guard the beacon case behind the line while the plaza trades fire with the lane.","p0":[-9,3,-27],"p1":[-8,3,-26],"l0":[-3,1.8,-18],"l1":[-2,1.8,-17],"fov":[50,50],"shake":0.15},
{"t":105.35,"title":"18 · The sky fights back","text":"Lightning from the rift hammers the anchor perimeter. The fields hold.","p0":[-13,14,-27],"p1":[-12,14.5,-26],"l0":[8,8,-10],"l1":[9,9,-9],"fov":[54,54],"shake":0.4},
{"t":107.69,"title":"19 · Push to the objective","text":"The coalition advances as one line toward the shared objective: the ritual site under the rift (cyan marker).","p0":[-11,7,-12.5],"p1":[0,6,-10.5],"l0":[6,2.5,-11],"l1":[13,2,-3],"fov":[50,50],"shake":0.1},
{"t":117.35,"title":"20 · Beacon planted","text":"A GOC operative plants the targeting beacon on the sigil. Its uplink climbs into the storm.","p0":[9.5,2.3,-11.5],"p1":[10,2.4,-10.8],"l0":[13,3,-2],"l1":[13,12,-2],"fov":[54,58]},
{"t":124.02,"title":"21 · Strike authorised","text":"High above the storm the GOC thaumaturgic disk writes itself into the sky, ring by ring.","p0":[4,2.4,-11.5],"p1":[4.5,2.4,-11],"l0":[10,40,-8],"l1":[12,70,-9],"fov":[62,62]},
{"t":130.36,"title":"22 · The calm before","text":"The guns ease off for a breath. The disk descends, the anchors hum, the rift breathes.","orb":{"c":[10,0,-8],"r":[56,52],"h":[40,44],"a":[248,276]},"l0":[12,18,-6],"l1":[12,24,-6],"fov":[50,50]},
{"t":141.0,"title":"23 · The King reaches","text":"Two arms push out of the rift toward the disk. Red disturbances ripple across the ground.","p0":[7,5.5,-13],"p1":[9,5,-11.5],"l0":[21,27,-3],"l1":[20,30,-4],"fov":[60,62],"shake":0.2},
{"t":152.0,"title":"24 · Charge","text":"The disk's glyph rings spin up and its underside floods with gold.","p0":[-8,40,-38],"p1":[-4,44,-32],"l0":[12,64,-9],"l1":[12,66,-8],"fov":[54,50]},
{"t":157.69,"title":"25 · The strike bends","text":"CENTREPIECE. The GOC strike fires at the beacon, but halfway down it bends sideways and pours into the rift.","p0":[54,28,-50],"p1":[50,30,-44],"l0":[16,36,-8],"l1":[17,34,-7],"fov":[56,56],"shake":0.3},
{"t":165.0,"title":"26 · Light show","text":"The surface turns into a storm: lightning, red disturbances, and a vortex of cloud and ash spinning around the rift.","orb":{"c":[8,6,-8],"r":[50,46],"h":[34,30],"a":[292,342]},"l0":[16,18,-6],"l1":[16,20,-6],"fov":[52,52],"shake":0.2},
{"t":172.85,"title":"27 · Tug of war","text":"Blue tethers from all three anchors grab the bent beam while red tendrils from the rift pull the other way.","p0":[2,26,-27],"p1":[6,28,-24],"l0":[20,26,-4],"l1":[21,26,-4],"fov":[54,52],"shake":0.35},
{"t":180.35,"title":"28 · Everyone fights","text":"On the ground MTF, Chaos and GOC hold the plaza against the last waves while lightning strikes around them.","p0":[-8,3.2,-9.2],"p1":[-4,3.2,-9.2],"l0":[13,3.5,-8],"l1":[14,4,-7],"fov":[52,52],"shake":0.4},
{"t":187.01,"title":"29 · The balance tips","text":"The bend point shudders. Everything depends on which way the strike falls.","p0":[8,20,-18],"p1":[10,21,-15],"l0":[22,25,-3],"l1":[22,25,-3],"fov":[52,48],"shake":0.4},
{"t":192.0,"e":"human","title":"30H · Anchors lock","text":"Human ending. The three fields merge into one blue dome; the strike straightens and drives the disk down onto the rift.","p0":[-15,22,-41],"p1":[-11,24,-37],"l0":[12,14,-8],"l1":[14,18,-6],"fov":[52,50],"shake":0.2},
{"t":203.01,"e":"human","title":"31H · The seal","text":"The disk lands in the rift like a lid. A white flash and the wound in the sky folds shut. The King shatters.","p0":[2,10,-22],"p1":[4,12,-20],"l0":[21,23,-3],"l1":[22,24,-3],"fov":[60,56],"shake":0.6},
{"t":212.02,"e":"human","title":"32H · The storm breaks","text":"With no rift to return to, the cultists and SCPs crumble. The vortex unwinds and cold dawn light returns.","p0":[2,3,-10],"p1":[-14,30,-28],"l0":[13,3,-3],"l1":[16,12,-4],"fov":[52,50]},
{"t":228.0,"e":"human","title":"33H · The coalition holds","text":"MTF, Chaos and GOC gather around the spent beacon. The anchors keep humming under a sealed sky.","orb":{"c":[13,1,-2],"r":[8.5,7.5],"h":[2.6,3.4],"a":[-140,-55]},"l0":[13,1.8,-3],"l1":[13,2.2,-3],"fov":[50,48]},
{"t":248.0,"e":"human","title":"34H · Surface secured","text":"Human victory. The rift is sealed and the Scarlet King is shut out, for now.","p0":[18,60,-22],"p1":[24,74,-34],"l0":[4,0,-8],"l1":[6,0,-8],"fov":[50,50]},
{"t":192.0,"e":"cult","title":"30C · The rift feeds","text":"Cult ending. The rift opens wider and drinks the beam. The disk is dragged sideways and its glyph rings tear apart.","p0":[54,28,-50],"p1":[47,27,-42],"l0":[17,32,-6],"l1":[19,30,-5],"fov":[56,58],"shake":0.4},
{"t":203.01,"e":"cult","title":"31C · Engulfed","text":"The rift swallows the GOC disk whole. A red implosion; the anchors overload and topple.","p0":[2,10,-22],"p1":[0,9,-24],"l0":[21,24,-3],"l1":[22,26,-3],"fov":[60,64],"shake":0.7},
{"t":212.02,"e":"cult","title":"32C · Reality collapses","text":"Gravity fails. Fragments of the surface tear loose and spiral up; the coalition is lifted into the red.","orb":{"c":[8,4,-8],"r":[48,44],"h":[30,34],"a":[232,300]},"l0":[16,14,-6],"l1":[18,22,-5],"fov":[52,56],"shake":0.3},
{"t":228.0,"e":"cult","title":"33C · The Scarlet King","text":"The King climbs fully out of the rift and towers over Gate A, crown ablaze.","p0":[6,2.6,-12],"p1":[3,2.6,-13.5],"l0":[22,30,-3],"l1":[22,38,-3],"fov":[66,70],"shake":0.25},
{"t":248.0,"e":"cult","title":"34C · Reality undone","text":"Cult victory. The Surface Zone is pulled toward the rift and the Scarlet King's reign begins.","p0":[18,60,-22],"p1":[16,88,-28],"l0":[14,10,-6],"l1":[20,22,-4],"fov":[50,58],"shake":0.3}
]/*END*/;
  const TRACK = { human: [], cult: [] };
  for (const s of SHOTS) { if (!s.e || s.e === 'human') TRACK.human.push(s); if (!s.e || s.e === 'cult') TRACK.cult.push(s); }
  for (const k in TRACK) TRACK[k].forEach((s, i, a) => { s['t1_' + k] = i + 1 < a.length ? a[i + 1].t : duration + 0.001; });
  function shotAt(t, e) { const a = TRACK[e]; let s = a[0]; for (const x of a) if (t >= x.t) s = x; return s; }

  // ---------------------------------------------------------------- materials
  const addMat = (c, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const stdMat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8, metalness: .05 }, o));
  const BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 16, 12), SPH_LO = new THREE.SphereGeometry(1, 8, 6);
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 16, 1), CYL_Z = CYL.clone().rotateX(PI / 2);
  const inst = (geo, mat, n, colors) => {
    const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) m.setMatrixAt(i, ZERO);
    if (colors) { for (let i = 0; i < n; i++) m.setColorAt(i, tmpC.set(0xffffff)); m.instanceColor.setUsage(THREE.DynamicDrawUsage); }
    effects.add(m); return m;
  };
  const setI = (m, i, x, y, z, rx, ry, rz, sx, sy, sz) => { dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); };
  // oriented segment from a to b (box or Z-cylinder geometry)
  const setSeg = (m, i, a, b, w) => {
    segD.subVectors(b, a); const len = segD.length(); if (len < 1e-4) { m.setMatrixAt(i, ZERO); return; }
    dummy.position.addVectors(a, b).multiplyScalar(.5); dummy.quaternion.setFromUnitVectors(UPZ, segD.multiplyScalar(1 / len));
    dummy.scale.set(w, w, len); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  };
  const flagUpdate = (...ms) => { for (const m of ms) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } };

  // ---------------------------------------------------------------- environment
  const hemi = lights.children.find(l => l.isHemisphereLight), dirs = lights.children.filter(l => l.isDirectionalLight);
  const base = {
    bg: scene.background && scene.background.isColor ? scene.background.clone() : new THREE.Color(0x172534),
    hemiI: hemi ? hemi.intensity : 2, hemiC: hemi ? hemi.color.clone() : new THREE.Color(0xd4e5ff), hemiG: hemi ? hemi.groundColor.clone() : new THREE.Color(0x566475),
    dir: dirs.map(d => ({ i: d.intensity, c: d.color.clone() }))
  };
  if (!scene.fog) scene.fog = new THREE.Fog(base.bg.getHex(), 110, 380);
  const C_HEMI_RED = new THREE.Color(0xffb0b0), C_HEMI_CULT = new THREE.Color(0xff5040);
  const C_DREAD = new THREE.Color(0x1d0b14), C_STORM = new THREE.Color(0x14060d), C_DAWN = new THREE.Color(0x7d9ab8), C_CULT = new THREE.Color(0x4a0309), C_VOID = new THREE.Color(0x0b0002);
  const riftLight = new THREE.PointLight(0xff1a1a, 0, 140, 1.2); riftLight.position.copy(RIFT); effects.add(riftLight);
  const flashLight = new THREE.PointLight(0xbfd8ff, 0, 120, 1.1); effects.add(flashLight);
  const diskLight = new THREE.PointLight(0xffe2a0, 0, 160, 1.1); effects.add(diskLight);
  const anchorLight = new THREE.PointLight(0x4fb4ff, 0, 40, 1.3); anchorLight.position.set(6, 5, -14); effects.add(anchorLight);
  const ritualLight = new THREE.PointLight(0xff2a10, 0, 22, 1.4); ritualLight.position.set(RITUAL.x, RITUAL.y + 1.5, RITUAL.z); effects.add(ritualLight);

  // ---------------------------------------------------------------- ritual sigil, candles, pillar
  const sigil = inst(BOX, addMat(0xffffff), 34, true);
  const candles = inst(CYL, stdMat(0xe8dcc0), 12), flames = inst(SPH_LO, addMat(0xffffff), 12, true);
  const pillar = new THREE.Mesh(CYL_Z, addMat(0xff2020, .55)); pillar.frustumCulled = false; effects.add(pillar);
  const pillarCore = new THREE.Mesh(CYL_Z, addMat(0xffc0a0, .8)); pillarCore.frustumCulled = false; effects.add(pillarCore);
  const objective = new THREE.Mesh(CYL, addMat(0x30e0ff, .35)); objective.frustumCulled = false; effects.add(objective);

  // ---------------------------------------------------------------- rift
  const rift = new THREE.Group(); rift.position.copy(RIFT); effects.add(rift);
  rift.lookAt(V(4, 8, -26)); // face the plaza/courtyard cameras, tilted down
  const RQ = rift.quaternion.clone(), RN = V(0, 0, 1).applyQuaternion(RQ);
  const riftCore = new THREE.Mesh(CYL_Z, new THREE.MeshBasicMaterial({ color: 0x060002, toneMapped: false })); rift.add(riftCore);
  const riftHalo = new THREE.Mesh(SPH, addMat(0xff1020, .55)); rift.add(riftHalo);
  const riftInner = new THREE.Mesh(SPH, addMat(0xff5030, .5)); rift.add(riftInner);
  const shards = inst(BOX, stdMat(0x3a0006, { emissive: 0xff1010, emissiveIntensity: 1.6 }), 96); effects.remove(shards); rift.add(shards);
  const arms = inst(BOX, addMat(0xffffff), 84, true); effects.remove(arms); rift.add(arms);
  const seam = new THREE.Mesh(BOX, addMat(0xffffff, 1)); rift.add(seam);
  const blast = new THREE.Mesh(SPH, addMat(0xffffff, .6)); blast.frustumCulled = false; effects.add(blast);

  // ---------------------------------------------------------------- Scarlet King (huge primitives)
  const king = new THREE.Group(); effects.add(king);
  const kingMat = stdMat(0x2a0306, { emissive: 0x5a0010, emissiveIntensity: .7, transparent: true, opacity: 0, depthWrite: false });
  const kingDark = stdMat(0x120103, { emissive: 0x200004, transparent: true, opacity: 0, depthWrite: false });
  const kingEyeMat = addMat(0xffc840, 1), crownMat = stdMat(0x5a0a0a, { emissive: 0xff2a10, emissiveIntensity: 1.4, transparent: true, opacity: 0 });
  const kp = (geo, mat, x, y, z, sx, sy, sz, rx = 0, rz = 0, parent = king) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, 0, rz); parent.add(m); return m; };
  kp(new THREE.CylinderGeometry(.55, 1, 1, 12), kingMat, 0, 10, 0, 6, 20, 6);         // robe
  kp(BOX, kingDark, 0, 20.5, 0, 12, 3, 4);                                              // shoulders
  kp(SPH, kingDark, 0, 24.3, 0, 2.6, 3, 2.6);                                           // head
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; kp(BOX, crownMat, Math.sin(a) * 2.3, 27.6, Math.cos(a) * 2.3, .55, 4 + (i % 2) * 1.6, .55, Math.cos(a) * .35, -Math.sin(a) * .35); }
  kp(new THREE.CylinderGeometry(2.6, 2.6, .8, 14), crownMat, 0, 26.2, 0, 1, 1, 1);
  const eyes = [kp(SPH_LO, kingEyeMat, -1, 24.8, 2.25, .45, .3, .3), kp(SPH_LO, kingEyeMat, 1, 24.8, 2.25, .45, .3, .3), kp(SPH_LO, kingEyeMat, 0, 25.9, 2.35, .35, .45, .3)];
  const kingArms = [-1, 1].map(sd => {
    const g = new THREE.Group(); g.position.set(sd * 6, 20.5, 0); king.add(g);
    kp(CYL, kingMat, 0, -8, 0, .9, 16, .9, 0, 0, g);
    for (let c = -1; c <= 1; c++) kp(BOX, crownMat, c * .6, -17.2, .4, .3, 3, .3, .3, c * .25, g);
    return g;
  });
  const kingDebris = inst(BOX, stdMat(0x3a0408, { emissive: 0xff2010, emissiveIntensity: .8 }), 70);

  // ---------------------------------------------------------------- storm, ash, lightning, disturbances
  const clouds = inst(SPH_LO, new THREE.MeshLambertMaterial({ color: 0x3b2a3a, transparent: true, opacity: .45, depthWrite: false }), 110);
  const PN = 2600, pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(PN * 3), pAttr = new Float32Array(PN * 4);
  for (let i = 0; i < PN; i++) { pAttr[i * 4] = 3 + 75 * Math.sqrt(hash(i * 3.1)); pAttr[i * 4 + 1] = hash(i * 5.7) * TAU; pAttr[i * 4 + 2] = hash(i * 9.3); pAttr[i * 4 + 3] = .5 + hash(i * 1.9); }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('seed', new THREE.BufferAttribute(pAttr, 4));
  const ashMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uPhase: { value: 0 }, uT: { value: 0 }, uC: { value: RIFT.clone() }, uAmt: { value: 0 }, uCol: { value: new THREE.Color(1, .3, .2) }, uSize: { value: 1 }, uLift: { value: 0 } },
    vertexShader: `attribute vec4 seed;uniform float uPhase,uT,uAmt,uSize,uLift;uniform vec3 uC;varying float vA;
void main(){float r=seed.x;float a=seed.y+uPhase*seed.w*(28.0/(r+6.0));float h=fract(seed.z-uT*0.04*seed.w-uLift*seed.w);
float rr=r*(1.0-0.35*uLift*h);vec3 p=vec3(uC.x+cos(a)*rr,mix(-6.0,uC.y+22.0,h),uC.z+sin(a)*rr);
p.y+=sin(a*3.0+uT)*1.5;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
gl_PointSize=uSize*(0.6+seed.w)*220.0/max(1.0,-mv.z);vA=uAmt*step(fract(seed.z*7.0),uAmt*1.2)*smoothstep(0.0,0.1,h)*(1.0-smoothstep(0.85,1.0,h));}`,
    fragmentShader: `uniform vec3 uCol;varying float vA;void main(){vec2 d=gl_PointCoord-0.5;float f=1.0-smoothstep(0.2,0.5,length(d));if(f<=0.0||vA<=0.0)discard;gl_FragColor=vec4(uCol*f*vA,1.0);}`
  });
  const ash = new THREE.Points(pGeo, ashMat); ash.frustumCulled = false; effects.add(ash);
  const BOLTS = 7, BSEG = 12;
  const bolts = inst(BOX, addMat(0xffffff), BOLTS * BSEG + BOLTS * 4, true);
  const rings = inst(BOX, addMat(0xffffff), 7 * 28, true);
  const glitch = inst(BOX, addMat(0xffffff), 60, true);
  const frags = inst(BOX, stdMat(0x9eacb8, { emissive: 0x400008, emissiveIntensity: .6 }), 90);
  const smokeFire = inst(SPH_LO, addMat(0xffffff), 48, true);
  const smoke = inst(SPH_LO, new THREE.MeshLambertMaterial({ color: 0x241a1c, transparent: true, opacity: .6, depthWrite: false }), 48);
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(0xff2010, 0)); doorGlow.position.set(GATE_A.x - .25, GATE_A.y + 1.3, GATE_A.z); doorGlow.rotation.y = -PI / 2; doorGlow.scale.set(2.6, 2.6, 1); effects.add(doorGlow);

  // ---------------------------------------------------------------- anchors, beacon
  const anchorParts = ANCH.map((p, i) => {
    const g = new THREE.Group(); g.position.copy(p); effects.add(g);
    const body = new THREE.Group(); g.add(body);
    kp(CYL, stdMat(0x39424c, { metalness: .5 }), 0, .15, 0, .75, .3, .75, 0, 0, body);
    kp(BOX, stdMat(0xc9d2da, { metalness: .4, roughness: .4 }), 0, 1.4, 0, .45, 2.2, .45, 0, 0, body);
    const bandMat = stdMat(0x0a2030, { emissive: 0x40b8ff, emissiveIntensity: 2 });
    for (let k = 0; k < 3; k++) kp(CYL, bandMat, 0, .8 + k * .7, 0, .5, .08, .5, 0, 0, body);
    const coil = kp(CYL, stdMat(0x88b8d8, { emissive: 0x2080ff, emissiveIntensity: 1.5, metalness: .6 }), 0, 2.85, 0, .34, .5, .34, 0, 0, body);
    const field = new THREE.Mesh(SPH, addMat(0x3aa0ff, .13)); g.add(field);
    const shell = new THREE.Mesh(SPH, addMat(0x80d0ff, .06)); shell.material.side = THREE.BackSide; g.add(shell);
    const floor = new THREE.Mesh(CYL, addMat(0x40b0ff, .25)); g.add(floor);
    return { g, body, coil, field, shell, floor, bandMat, deploy: [T.a1, T.a2, T.a3][i] };
  });
  const tethers = inst(CYL_Z, addMat(0xffffff), 6, true);
  const beacon = new THREE.Group(); beacon.position.copy(BEACON); effects.add(beacon);
  kp(BOX, stdMat(0xe0e6ea, { metalness: .4 }), 0, .25, 0, .6, .5, .6, 0, 0, beacon);
  kp(CYL, stdMat(0x2a3036), 0, 1.0, 0, .04, 1.2, .04, 0, 0, beacon);
  const beaconLamp = kp(SPH_LO, addMat(0x40f0ff, 1), 0, 1.65, 0, .14, .14, .14, 0, 0, beacon);
  const uplink = new THREE.Mesh(CYL_Z, addMat(0x40e8ff, .5)); uplink.frustumCulled = false; effects.add(uplink);

  // ---------------------------------------------------------------- GOC strike disk & beam
  const disk = new THREE.Group(); effects.add(disk);
  const diskMat = stdMat(0xf4ead0, { emissive: 0xffcf70, emissiveIntensity: .6, metalness: .3, roughness: .35 });
  kp(CYL, diskMat, 0, 0, 0, 12, .7, 12, 0, 0, disk);
  kp(CYL, stdMat(0x2a2a30, { metalness: .6 }), 0, .45, 0, 7, .4, 7, 0, 0, disk);
  const diskGlow = kp(SPH, addMat(0xffc860, .5), 0, -.6, 0, 13, 1.2, 13, 0, 0, disk);
  const glyphs = inst(BOX, stdMat(0xfff0c0, { emissive: 0xffc040, emissiveIntensity: 2 }), 100); effects.remove(glyphs); disk.add(glyphs);
  const BEAMN = 36, SPARKN = 70;
  const beam = inst(CYL_Z, addMat(0xffffff), BEAMN * 2, true);
  const sparks = inst(BOX, addMat(0xffffff), SPARKN, true);
  const tendrils = inst(BOX, addMat(0xffffff), 3 * 10, true);
  const impact = new THREE.Mesh(SPH, addMat(0xffd080, .6)); impact.frustumCulled = false; effects.add(impact);

  // ---------------------------------------------------------------- actors (instanced capsule figures)
  const bodyGeo = new THREE.CapsuleGeometry(.26, .9, 4, 10).translate(0, .73, 0);
  const headGeo = new THREE.SphereGeometry(.17, 12, 8).translate(0, 1.6, 0);
  const gunGeo = new THREE.BoxGeometry(.07, .08, .6).translate(.16, 1.15, .3);
  const tagGeo = new THREE.BoxGeometry(.14, .07, .14).translate(0, 1.86, 0);
  const FAC = {
    mtf: { body: 0x1f2f48, head: 0x34465f, tag: 0x3aa0ff, tracer: 0xffe3a0 },
    chaos: { body: 0x3b4227, head: 0x23271a, tag: 0x50ff60, tracer: 0xfff0a0 },
    goc: { body: 0xd9dee3, head: 0x8fa6b8, tag: 0xe8ffff, tracer: 0x90f0ff },
    cult: { body: 0x6e0c14, head: 0x1c0306, tag: 0xff2020, tracer: 0xff3020 }
  };
  const actors = [];
  const pathLen = pts => { let L = 0; const c = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); c.push(L); } return { pts, c, L }; };
  const onPath = (P, s, out) => { s = clamp(s, 0, P.L); let i = 1; while (i < P.pts.length - 1 && P.c[i] < s) i++; const a = P.pts[i - 1], b = P.pts[i], seg = P.c[i] - P.c[i - 1]; const u = seg > 0 ? (s - P.c[i - 1]) / seg : 1; out.x = lerp(a[0], b[0], u); out.z = lerp(a[1], b[1], u); return out; };
  const ROAD = [[20, -50], [19, -45], [17, -35], [9, -30.5], [1, -29.5], [-4, -24], [-8, -17], [-8.3, -13]];
  const WEST = [[-29, -22.5], [-22, -22], [-14, -19], [-9.5, -15.5], [-8.3, -13]];
  const holdSlots = [], pushSlots = [], gocHold = [];
  for (const z of [-7.7, -8.85, -10]) for (const x of [-9, -7.5, -6, -4.5, -3, -1.5]) holdSlots.push([x, z]);
  for (const z of [-12.5, -14, -15.5, -17]) for (const x of [-10.5, -8.8]) gocHold.push([x, z]);
  for (const z of [-7.3, -8.6, -10, -11.4, -12.8]) for (const x of [11, 12.4, 13.8, 15.2, 16.6]) pushSlots.push([x, z]);
  pushSlots.push([8.2, -11], [8.2, -12.4], [6.6, -10.8], [6.6, -12.2], [5, -11.5], [9.6, -11.6], [9.6, -12.9]);
  const addCo = (fac, i, enter, path, hold, push, extra = {}) => actors.push(Object.assign({ side: 0, fac, id: actors.length, enter, path: pathLen(path.concat([hold])), hold, push, speed: 4.4 + hash(actors.length * 7.7) * .5, ph: hash(actors.length * 3.3) }, extra));
  let pi = 0;
  const pushOrder = pushSlots.map((p, i) => i).sort((a, b) => hash(a * 13.7) - hash(b * 13.7));
  for (let i = 0; i < 10; i++) addCo('mtf', i, T.mtf + i * .45, ROAD.concat([[-7, -11]]), holdSlots[i], pushSlots[pushOrder[pi++]], i === 3 ? { die: 103.4 } : {});
  for (let i = 0; i < 8; i++) addCo('chaos', i, T.chaos + i * .5, WEST.concat([[-7, -11]]), holdSlots[10 + i], pushSlots[pushOrder[pi++]], i === 2 ? { die: 89.2 } : {});
  for (let i = 0; i < 8; i++) addCo('goc', i, T.goc + i * .45, ROAD.slice(0, 7), gocHold[i], pushSlots[pushOrder[pi++]], i === 0 ? { carrier: true } : {});
  for (let i = 0; i < 6; i++) { const ps = pushSlots[pushOrder[pi++]]; addCo('mtf', 10 + i, T.mtf2 + i * .4, ROAD.concat([[-6, -10.5]]), ps, ps, { wave2: true }); }
  const NCO = actors.length;
  for (let i = 0; i < 8; i++) actors.push({ side: 1, fac: 'cult', id: actors.length, ritual: i, ph: hash(i * 2.9) });
  for (let i = 0; i < 32; i++) actors.push({ side: 1, fac: 'cult', id: actors.length, slot: i, P: 9 + 8 * hash(i * 4.1 + 1), off: hash(i * 8.3 + 2), ph: hash(i * 6.1) });
  const NA = actors.length;
  const bodies = inst(bodyGeo, stdMat(0xffffff, { roughness: .7 }), NA, true), heads = inst(headGeo, stdMat(0xffffff, { roughness: .6 }), NA, true);
  const guns = inst(gunGeo, stdMat(0x15181c, { metalness: .5 }), NA), tags = inst(tagGeo, addMat(0xffffff), NA, true);
  actors.forEach((a, i) => { const f = FAC[a.fac]; bodies.setColorAt(i, tmpC.set(f.body)); heads.setColorAt(i, tmpC.set(f.head)); tags.setColorAt(i, tmpC.set(f.tag)); });
  const cultCols = inst(CYL_Z, addMat(0xffffff), 32, true);
  const tracers = inst(BOX, addMat(0xffffff), 140, true), muzzles = inst(SPH_LO, addMat(0xffffff), 140, true);
  const ST = actors.map(() => ({ vis: false, x: 0, y: 0, z: 0, yaw: 0, fall: 0, sc: 1, fight: false, lift: 0 }));

  // ---------------------------------------------------------------- SCPs (primitive figures, cult-aligned red aura)
  const scpAura = addMat(0xff1a10, .22);
  const mkScp = (build) => { const g = new THREE.Group(); effects.add(g); build(g); const aura = kp(SPH_LO, scpAura, 0, 1.1, 0, 1.1, 1.4, 1.1, 0, 0, g); return { g, aura }; };
  const scps = [
    { name: '173', kf: [[67.6, 18.3, .9], [70, 14, -3], [84, 11, -6], [104, 12.5, -4], [125, 12, 1], [190, 11.5, -1]], step: true, build: g => { kp(new THREE.CapsuleGeometry(.36, 1.1, 4, 10), stdMat(0xc2b08c), 0, .95, 0, 1, 1, 1, 0, 0, g); kp(SPH_LO, stdMat(0x7a2a18), .2, 1.7, .25, .14, .1, .05, 0, 0, g); kp(SPH_LO, stdMat(0x7a2a18), -.18, 1.65, .27, .12, .14, .05, 0, 0, g); } },
    { name: '096', kf: [[68.6, 18.3, 1.5], [71, 15, 0], [86, 12, -4.5], [118, 14.5, 2], [175, 13, 3]], build: g => { kp(new THREE.CapsuleGeometry(.2, 1.6, 4, 8), stdMat(0xe8e2da), 0, 1.25, 0, 1, 1, 1, 0, 0, g); kp(SPH_LO, stdMat(0xefe8e0), 0, 2.25, .05, .19, .24, .19, 0, 0, g); kp(CYL, stdMat(0xe8e2da), .33, 1.35, .1, .06, 1.5, .06, .2, .15, g); kp(CYL, stdMat(0xe8e2da), -.33, 1.35, .1, .06, 1.5, .06, .2, -.15, g); } },
    { name: '939', kf: [[69.6, 18.3, .2], [72, 13, -5], [102.6, 12, -6.5], [103.4, 9.6, -9.6], [104.4, 12, -6.2], [140, 13.5, 0], [190, 12, 1]], build: g => { kp(BOX, stdMat(0x8a1f1f), 0, .8, 0, .6, .5, 1.8, 0, 0, g); kp(BOX, stdMat(0x701515, { emissive: 0x500000 }), 0, .95, 1.15, .35, .3, .7, 0, 0, g); for (const [x, z] of [[-.25, -.7], [.25, -.7], [-.25, .7], [.25, .7]]) kp(CYL, stdMat(0x5a1010), x, .35, z, .07, .7, .07, 0, 0, g); } },
    { name: '049', kf: [[70.6, 18.3, 1.2], [73, 15, 2], [110, 14.5, 3], [190, 14, 4]], build: g => { kp(new THREE.CapsuleGeometry(.3, 1.1, 4, 10), stdMat(0x111114), 0, .85, 0, 1, 1, 1, 0, 0, g); kp(SPH_LO, stdMat(0xe6e1d6), 0, 1.65, .05, .17, .2, .17, 0, 0, g); kp(BOX, stdMat(0xe6e1d6), 0, 1.6, .2, .05, .05, .22, 0, 0, g); kp(CYL, stdMat(0x111114), 0, 1.86, 0, .26, .05, .26, 0, 0, g); } },
    { name: '106', kf: [[71.0, -7.5, -17.5], [78.9, -7.5, -17.5], [78.95, 15, 4.5], [190, 14.5, 5]], sink: [[71, 73.5, 1], [77, 78.9, 0], [79, 82, 1]], build: g => { kp(new THREE.CapsuleGeometry(.3, 1.1, 4, 10), stdMat(0x1a1410, { roughness: 1 }), 0, .85, 0, 1, 1, 1, .25, 0, g); kp(SPH_LO, stdMat(0x241a14), 0, 1.55, .25, .2, .22, .2, 0, 0, g); } }
  ].map(s => Object.assign(s, mkScp(s.build)));
  const puddles = scps.filter(s => s.name === '106').map(() => { const m = new THREE.Mesh(CYL, new THREE.MeshBasicMaterial({ color: 0x050302, transparent: true, opacity: .9, depthWrite: false })); effects.add(m); return m; });

  // ---------------------------------------------------------------- screen overlay (flash / fades)
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
  overlay.renderOrder = 9999; overlay.frustumCulled = false; effects.add(overlay);

  // ================================================================= state functions
  const cultEnd = e => e === 'cult';
  function riftRadius(t, e) {
    let r = .25 * sstep(19, 25.6, t) + 5.8 * sstep(25.6, 27.6, t) + 3 * sstep(27.6, 45, t) + 2 * sstep(45, 157, t) + .6 * Math.sin(t * 2.3) * sstep(157, 160, t);
    if (t > T.end) {
      if (cultEnd(e)) r += 5 * sstep(192, 203, t) + 6 * sstep(203, 212, t) + 14 * sstep(212, 258, t);
      else r = r * (1 - .3 * sstep(192, 203, t)) * (1 - sstep(203.01, 209.5, t));
    }
    return Math.max(0, r);
  }
  function stormAmt(t, e) {
    let s = .55 * sstep(20, 32, t) + .3 * sstep(150, 165, t);
    if (t > T.hit) s = cultEnd(e) ? s + .15 * sstep(203, 215, t) : s * (1 - sstep(206, 226, t));
    return s;
  }
  function stormPhase(t, e) { return .025 * t + 5 * sstep(150, 215, t) + (cultEnd(e) ? 14 * sstep(200, 263, t) : -2 * sstep(205, 230, t)); }
  function fireRate(t, e) {
    if (t < 52) return 0;
    let f = 1 - .75 * win(t, T.calm, T.charge, 1.5, 2) + .25 * sstep(157, 160, t);
    if (t > T.hit) f *= 1 - sstep(T.hit, T.hit + 3, t);
    return f;
  }
  function lightningAmt(t, e) {
    let a = .9 * win(t, 25.6, 31, .1, 3) + .25 * sstep(30, 34, t) + .7 * win(t, 105.3, 108.5, .1, 1) + .7 * sstep(156, 158, t);
    if (t > T.hit) a = cultEnd(e) ? a + .3 : a * (1 - sstep(205, 214, t));
    return Math.min(1.2, a);
  }
  function disturbAmt(t, e) {
    let a = .6 * win(t, 33, 48, 1, 4) + .5 * win(t, 141, 158, 2, 1) + .9 * sstep(157, 160, t);
    if (t > T.hit) a = cultEnd(e) ? a + .3 : a * (1 - sstep(204, 209, t));
    return a;
  }
  function diskState(t, e, out) {
    out.vis = t > T.auth; out.s = sstep(T.auth, T.calm, t); out.y = lerp(96, 70, sstep(T.auth, T.charge, t)); out.pos = out.pos || V(0, 0, 0); out.q = out.q || new THREE.Quaternion();
    out.pos.set(12 + Math.sin(t * .3) * .4, out.y, -8); out.q.identity(); out.red = 0; out.charge = sstep(T.charge, T.strike, t);
    if (t > T.end) {
      const u = sstep(T.end, T.hit, t);
      if (cultEnd(e)) {
        const sp = (1 - u) * 6; tmpV.set(Math.cos(t * 1.7) * sp, Math.sin(t * 1.3) * sp * .5, Math.sin(t * 1.7) * sp);
        out.pos.lerp(RIFT, u * u).add(tmpV.multiplyScalar(u)); out.s *= lerp(1, .12, u); out.red = u;
        out.q.setFromEuler(new THREE.Euler(Math.sin(t * 2.1) * .6 * u, t * u, Math.cos(t * 1.7) * .5 * u)); if (t > T.hit + .6) out.vis = false;
      } else {
        tmpV.copy(RIFT).addScaledVector(RN, 2.2); out.pos.lerp(tmpV, u); out.q.slerpQuaternions(out.q.identity(), DISK_RIFT_Q, u); out.s *= lerp(1, .75, u);
        if (t > T.hit) { out.s *= clamp(riftRadius(t, e) / 7.6, 0, 1); if (out.s < .01) out.vis = false; }
      }
    }
    return out;
  }
  const DISK_RIFT_Q = RQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), PI / 2));
  const DS = {};
  function kingState(t, e) {
    let s = lerp(.2, .45, sstep(37, 45, t)) + .1 * sstep(45, 157, t), op = .55 * sstep(37, 45, t) + .1 * sstep(140, 160, t), reach = sstep(141, 152, t);
    if (t > T.end) {
      if (cultEnd(e)) { s += .65 * sstep(205, 242, t); op = lerp(op, .97, sstep(203, 230, t)); reach = 1 + sstep(203, 230, t); }
      else { op *= 1 - sstep(T.hit, T.hit + .35, t); reach *= 1 - sstep(192, 203, t); }
    }
    return { s, op, reach };
  }

  // per-actor state ---------------------------------------------------------
  const P2 = { x: 0, z: 0 };
  function coState(a, t, e, st) {
    st.vis = false; st.fall = 0; st.sc = 1; st.fight = false; st.lift = 0;
    if (t < a.enter) return;
    st.vis = true;
    const s = (t - a.enter) * a.speed; let x, z, moving = s < a.path.L;
    onPath(a.path, s, P2); x = P2.x; z = P2.z;
    let tx = 13, tz = -3; // default facing: the lane
    st.fight = !moving || a.path.L - s < 12;
    if (!moving) {
      st.fight = true;
      const tp = T.push + a.ph * 2.5 + (a.fac === 'goc' ? 1.2 : 0);
      if (!a.wave2 && t > tp) {
        const d = Math.hypot(a.push[0] - a.hold[0], a.push[1] - a.hold[1]), u = clamp((t - tp) * 3.0 / Math.max(d, .1), 0, 1);
        if (a.fac === 'goc' && a.hold[1] < -11) { // route through the plaza gap
          const mid = [-7.5, -11]; const u1 = clamp(u * 2, 0, 1), u2 = clamp(u * 2 - 1, 0, 1);
          x = u < .5 ? lerp(a.hold[0], mid[0], u1) : lerp(mid[0], a.push[0], u2); z = u < .5 ? lerp(a.hold[1], mid[1], u1) : lerp(mid[1], a.push[1], u2);
        } else { x = lerp(a.hold[0], a.push[0], u); z = lerp(a.hold[1], a.push[1], u); }
        moving = u < 1; st.fight = !moving || u > .6;
      }
      if (!moving) { x += Math.sin(t * .9 + a.ph * 20) * .25; z += Math.cos(t * .7 + a.ph * 9) * .15; }
      if (a.carrier && t > T.beacon - 3 && t < T.beacon + 4) {
        const go = sstep(T.beacon - 3, T.beacon - .3, t) * (1 - sstep(T.beacon + 1.5, T.beacon + 4, t));
        x = lerp(x, BEACON.x - .7, go); z = lerp(z, BEACON.z - .9, go); st.sc = 1 - .3 * win(t, T.beacon - .6, T.beacon + 1.3, .3, .3); st.fight = go < .1;
      }
    }
    st.x = x; st.z = z; st.y = gy(x, z);
    if (moving) { onPath(a.path, s + .5, P2); st.yaw = Math.atan2(P2.x - x, P2.z - z); if (s >= a.path.L) st.yaw = Math.atan2(a.push[0] - a.hold[0], a.push[1] - a.hold[1]); }
    else st.yaw = Math.atan2(tx - x, tz - z);
    if (a.die && t > a.die) { st.fall = sstep(a.die, a.die + .6, t); st.fight = false; if (t > a.die + 14) st.vis = false; }
    if (t > T.after - 4) { // endings
      if (cultEnd(e)) {
        const t0 = T.hit + 4 + a.ph * 20, u = sstep(t0, t0 + 9, t);
        st.lift = u; st.fight = false; if (u >= 1) st.vis = false;
      } else if (t > 216) { st.fight = false; st.yaw = Math.atan2(BEACON.x - st.x, BEACON.z - st.z); st.y += Math.max(0, Math.sin((t + a.ph * 3) * 5)) * .12 * win(t, 216, 236, 1, 4); }
    }
  }
  const LZ = { x: 0, z: 0 }, EZ = { x: 0, z: 0 };
  function landEngage(seed, s0) {
    const h1 = hash(seed * 1.31), h2 = hash(seed * 2.17), h3 = hash(seed * 3.71), h4 = hash(seed * 4.33);
    if (s0 < T.a1) { LZ.x = 10.6 + 4.8 * h1; LZ.z = -6 + 11 * h2; EZ.x = 3.5 + 6 * h3; EZ.z = -8 - 4.2 * h4; }
    else if (s0 < T.push + 3) { LZ.x = 10.6 + 4.8 * h1; LZ.z = -3 + 9 * h2; EZ.x = 10.6 + 4.8 * h3; EZ.z = -6.5 + 2 * h4; }
    else { LZ.x = 10.6 + 4.8 * h1; LZ.z = 2 + 5.5 * h2; EZ.x = 10.6 + 4.8 * h3; EZ.z = .5 + 4.5 * h4; }
  }
  function cultState(a, t, e, st) {
    st.vis = false; st.fall = 0; st.sc = 1; st.fight = false; st.lift = 0; st.col = -1;
    const human = !cultEnd(e);
    if (a.ritual !== undefined) {
      const ang = a.ritual / 8 * TAU, rx = RITUAL.x + Math.sin(ang) * 2.6, rz = RITUAL.z + Math.cos(ang) * 3.6;
      const die = 54 + a.ritual * 1.7;
      if (t > die + 1.2) return;
      st.vis = true;
      if (t < T.mtf) { st.x = rx; st.z = rz; st.yaw = Math.atan2(RITUAL.x - rx, RITUAL.z - rz); st.bow = .45 * Math.max(0, Math.sin(t * (1.6 + t * .04) + a.ritual)) * (1 - sstep(24, 26, t)); }
      else { const u = sstep(T.mtf, T.mtf + 4, t); landEngage(a.id * 7 + 1, 0); st.x = lerp(rx, EZ.x, u); st.z = lerp(rz, EZ.z, u); st.yaw = Math.atan2(-1, -.6); st.fight = u > .7; st.bow = 0; }
      st.y = gy(st.x, st.z); if (t > die) { st.fall = sstep(die, die + .5, t); st.sc = 1 - sstep(die + .5, die + 1.2, t); st.fight = false; }
      return;
    }
    st.bow = 0;
    const P = a.P, T0 = T.rain + a.off * P * .6, k = Math.floor((t - T0) / P);
    if (k < 0) return;
    const s0 = T0 + k * P, age = t - s0;
    const endSpawn = human ? T.hit - 1.5 : 252;
    if (s0 > endSpawn) return;
    landEngage(a.slot * 31 + k * 7.3, s0);
    let life = P * .8;
    if (s0 + life > T.hit + 3 && human) life = Math.max(1.6, T.hit + 3 + a.ph * 5 - s0);
    if (age > life + 1.2) return;
    st.vis = true;
    if (age < 1.3) { // descending in a red column
      const u = sstep(0, 1.3, age); st.x = lerp(RIFT.x, LZ.x, u); st.z = lerp(RIFT.z, LZ.z, u); st.y = lerp(RIFT.y, gy(LZ.x, LZ.z), Math.sqrt(u)); st.sc = .4 + .6 * u; st.yaw = a.ph * TAU; st.col = 1 - u * .6;
    } else {
      const d = Math.hypot(EZ.x - LZ.x, EZ.z - LZ.z), u = clamp((age - 1.3) * 3.3 / Math.max(.1, d), 0, 1);
      st.x = lerp(LZ.x, EZ.x, u) + (u >= 1 ? Math.sin(t * 1.3 + a.ph * 9) * .3 : 0); st.z = lerp(LZ.z, EZ.z, u); st.y = gy(st.x, st.z);
      st.yaw = Math.atan2(EZ.x - LZ.x, EZ.z - LZ.z); st.fight = u > .85 && (human || t < T.hit);
      if (age < 2) st.col = (2 - age) / .7 * .4;
    }
    if (age > life) { st.fall = sstep(life, life + .5, age); st.sc *= 1 - sstep(life + .5, life + 1.2, age); st.fight = false; }
    if (!human && t > T.hit) { st.fight = false; st.y += Math.max(0, Math.sin(t * 4 + a.ph * 7)) * .15; st.yaw = Math.atan2(RIFT.x - st.x, RIFT.z - st.z); }
  }
  function kfPos(kf, t, out) {
    if (t <= kf[0][0]) { out.x = kf[0][1]; out.z = kf[0][2]; return; }
    for (let i = 1; i < kf.length; i++) if (t < kf[i][0]) { const u = (t - kf[i - 1][0]) / (kf[i][0] - kf[i - 1][0]); out.x = lerp(kf[i - 1][1], kf[i][1], u); out.z = lerp(kf[i - 1][2], kf[i][2], u); out.dx = kf[i][1] - kf[i - 1][1]; out.dz = kf[i][2] - kf[i - 1][2]; return; }
    const l = kf[kf.length - 1]; out.x = l[1]; out.z = l[2];
  }
  const SP = { x: 0, z: 0, dx: 0, dz: 0 };

  // ================================================================= update
  const disturbCenters = [RITUAL, ANCH[0], ANCH[1], V(-2, 1, -20), V(5, 1, -10), V(14, 1, 3), GATE_A, V(-12, 1, -18)];
  const boltA = V(0, 0, 0), boltB = V(0, 0, 0), pA = V(0, 0, 0), pB = V(0, 0, 0), Dp = V(0, 0, 0), Ep = V(0, 0, 0), Cp = V(0, 0, 0);
  const bez = (s, out) => { const m = 1 - s; return out.set(m * m * Dp.x + 2 * m * s * Cp.x + s * s * Ep.x, m * m * Dp.y + 2 * m * s * Cp.y + s * s * Ep.y, m * m * Dp.z + 2 * m * s * Cp.z + s * s * Ep.z); };
  let lastFov = -1;

  function update(time, ending) {
    const t = clamp(+time || 0, 0, duration), e = ending === 'cult' ? 'cult' : 'human', cult = e === 'cult';

    // ---------------- camera
    const S = shotAt(t, e), t1 = S['t1_' + e], u0 = clamp((t - S.t) / Math.max(.01, t1 - S.t), 0, 1), u = lerp(u0, u0 * u0 * (3 - 2 * u0), .65);
    if (S.orb) { const o = S.orb, r = lerp(o.r[0], o.r[1], u), h = lerp(o.h[0], o.h[1], u), ang = lerp(o.a[0], o.a[1], u) * PI / 180; camera.position.set(o.c[0] + Math.cos(ang) * r, o.c[1] + h, o.c[2] + Math.sin(ang) * r); }
    else camera.position.set(lerp(S.p0[0], S.p1[0], u), lerp(S.p0[1], S.p1[1], u), lerp(S.p0[2], S.p1[2], u));
    tmpV.set(lerp(S.l0[0], S.l1[0], u), lerp(S.l0[1], S.l1[1], u), lerp(S.l0[2], S.l1[2], u));
    const hitShake = Math.exp(-Math.max(0, t - T.riftOpen) * 2) * (t > T.riftOpen ? 1 : 0) + (t > T.strike ? Math.exp(-(t - T.strike) * 1.5) : 0) + (t > T.hit ? Math.exp(-(t - T.hit) * 1.2) * 1.5 : 0);
    const sh = ((S.shake || 0) + hitShake + .3 * lightningAmt(t, e)) * .12;
    if (sh > 0) {
      camera.position.x += (Math.sin(t * 23.1) + Math.sin(t * 37.7)) * sh; camera.position.y += (Math.sin(t * 29.3) + Math.sin(t * 17.9)) * sh * .7; camera.position.z += (Math.sin(t * 31.7) + Math.sin(t * 13.3)) * sh;
      tmpV.x += Math.sin(t * 19.7) * sh * 2; tmpV.y += Math.sin(t * 27.1) * sh * 2;
    }
    camera.lookAt(tmpV);
    const fov = lerp(S.fov[0], S.fov[1], u);
    if (Math.abs(fov - lastFov) > 1e-3 || camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); lastFov = fov; }

    // ---------------- environment & lighting
    const dread = sstep(14, 30, t), storm = stormAmt(t, e);
    const bg = scene.background && scene.background.isColor ? scene.background : (scene.background = new THREE.Color());
    bg.copy(base.bg).lerp(C_DREAD, dread).lerp(C_STORM, sstep(150, 165, t) * .8);
    let hemiI = lerp(base.hemiI, base.hemiI * .55, dread), sunI = 1 - .55 * dread - .15 * sstep(150, 165, t);
    const sunCol = tmpC.setRGB(1, 1, 1);
    if (t > T.hit) {
      if (cult) { const u = sstep(T.hit, 230, t); bg.lerp(C_CULT, u).lerp(C_VOID, sstep(240, 262, t)); hemiI *= lerp(1, .8, u); sunCol.setRGB(1, lerp(1, .25, u), lerp(1, .2, u)); sunI = lerp(sunI, .9, u); }
      else { const u = sstep(208, 232, t); bg.lerp(C_DAWN, u); hemiI = lerp(hemiI, base.hemiI * 1.05, u); sunI = lerp(sunI, 1.1, u); sunCol.setRGB(1, lerp(1, .82, u), lerp(1, .66, u)); }
    }
    if (hemi) { hemi.intensity = hemiI; hemi.color.copy(base.hemiC).lerp(cult && t > T.hit ? C_HEMI_CULT : C_HEMI_RED, cult && t > T.hit ? .7 * sstep(T.hit, 225, t) : .25 * dread * (1 - (t > T.hit ? sstep(208, 230, t) : 0))); }
    dirs.forEach((d, i) => { d.intensity = base.dir[i].i * sunI; d.color.copy(base.dir[i].c).multiply(sunCol); });
    const fogNear = lerp(110, 70, storm) * (cult ? lerp(1, .5, sstep(212, 262, t)) : 1), fogFar = lerp(380, 300, storm) * (cult ? lerp(1, .6, sstep(212, 262, t)) : 1);
    if (scene.fog) { scene.fog.color.copy(bg); if (scene.fog.isFog) { scene.fog.near = fogNear; scene.fog.far = fogFar; } }

    // ---------------- ritual
    const ritualOn = 1 - sstep(108, 118, t), chant = .5 + .5 * Math.sin(t * (2 + t * .12));
    const sig = (.35 + .65 * sstep(0, 25, t) * (.6 + .4 * chant)) * ritualOn * (t > 26 ? .6 : 1);
    for (let i = 0; i < 34; i++) {
      if (sig <= .01) { sigil.setMatrixAt(i, ZERO); continue; }
      let x, z, len, yaw;
      if (i < 24) { const a = (i + .5) / 24 * TAU; x = RITUAL.x + Math.sin(a) * 2.4; z = RITUAL.z + Math.cos(a) * 2.4; len = .66; yaw = a + PI / 2; }
      else if (i < 29) { const a0 = (i - 24) / 5 * TAU, a1 = a0 + 2 / 5 * TAU; const x0 = Math.sin(a0) * 2.3, z0 = Math.cos(a0) * 2.3, x1 = Math.sin(a1) * 2.3, z1 = Math.cos(a1) * 2.3; x = RITUAL.x + (x0 + x1) / 2; z = RITUAL.z + (z0 + z1) / 2; len = Math.hypot(x1 - x0, z1 - z0); yaw = Math.atan2(x1 - x0, z1 - z0); }
      else { const a = (i - 29) / 5 * TAU + t * .5; x = RITUAL.x + Math.sin(a) * 1.0; z = RITUAL.z + Math.cos(a) * 1.0; len = .5; yaw = a; }
      setI(sigil, i, x, RITUAL.y + .04, z, 0, yaw, 0, .09, .03, len); sigil.setColorAt(i, tmpC.setRGB(sig, .08 * sig, .05 * sig));
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, x = RITUAL.x + Math.sin(a) * 1.9, z = RITUAL.z + Math.cos(a) * 2.9;
      if (ritualOn < .02) { candles.setMatrixAt(i, ZERO); flames.setMatrixAt(i, ZERO); continue; }
      setI(candles, i, x, RITUAL.y + .18, z, 0, 0, 0, .06, .36, .06);
      const fl = (.7 + .3 * Math.sin(t * 13 + i * 2.1)) * ritualOn; setI(flames, i, x, RITUAL.y + .42, z, 0, 0, 0, .05 * fl + .01, .09 * fl + .01, .05 * fl + .01); flames.setColorAt(i, tmpC.setRGB(1, .55, .2));
    }
    ritualLight.intensity = 25 * sig * (.7 + .3 * chant) + 40 * win(t, 17, 27, 2, 1.5);
    const pil = win(t, 17, 28.5, 1, 2.5);
    pillar.visible = pillarCore.visible = pil > .01;
    if (pillar.visible) {
      pA.set(RITUAL.x, RITUAL.y, RITUAL.z);
      if (t < T.riftOpen) pB.set(RITUAL.x, RITUAL.y + 4 + 60 * sstep(17, 25, t), RITUAL.z); else pB.copy(RIFT);
      setSeg({ setMatrixAt: (i, m) => { pillar.matrix.copy(m); } }, 0, pA, pB, 1);
      pillar.matrixAutoUpdate = false; pillarCore.matrixAutoUpdate = false;
      pillar.matrix.copy(dummy.matrix); dummy.scale.set(.9 * pil, .9 * pil, dummy.scale.z); dummy.updateMatrix(); pillar.matrix.copy(dummy.matrix);
      dummy.scale.set(.25 * pil, .25 * pil, dummy.scale.z); dummy.updateMatrix(); pillarCore.matrix.copy(dummy.matrix);
      pillar.material.opacity = .45 * pil * (.7 + .3 * chant);
    }
    const obj = win(t, T.push, T.beacon + 1, 1, 1);
    objective.visible = obj > .01; if (objective.visible) { objective.position.set(BEACON.x, BEACON.y + 20, BEACON.z); objective.scale.set(.55, 40, .55); objective.material.opacity = .28 * obj * (.7 + .3 * Math.sin(t * 6)); }

    // ---------------- rift
    const R = riftRadius(t, e), sealing = !cult && t > T.hit;
    rift.visible = R > .02 || (sealing && t < 214);
    const pulse = .5 + .5 * Math.sin(t * 3.1) * Math.sin(t * 1.7 + 1);
    riftCore.scale.set(R, R, .1); riftCore.visible = R > .02;
    riftHalo.scale.set(R * 1.55, R * 1.55, R * .18); riftHalo.material.opacity = .32 + .2 * pulse + (cult && t > T.hit ? .2 : 0); riftHalo.visible = R > .02;
    riftInner.scale.set(R * 1.08, R * 1.08, R * .1); riftInner.material.opacity = .35 + .3 * pulse; riftInner.visible = R > .02;
    riftInner.material.color.setRGB(1, sealing ? .9 : .32, sealing ? .8 : .18);
    for (let i = 0; i < 96; i++) {
      if (R < .05) { shards.setMatrixAt(i, ZERO); continue; }
      const ring = i % 3, a = hash(i * 1.7) * TAU + t * (.25 + ring * .12) * (ring === 1 ? -1 : 1), rr = R * (1.02 + .14 * ring + .1 * hash(i * 2.3));
      const sc = R / 9 * (.8 + .7 * hash(i * 5.1));
      setI(shards, i, Math.cos(a) * rr, Math.sin(a) * rr, (hash(i * 3.3) - .5) * R * .25, hash(i) * 3, 0, a + PI / 2 + hash(i * 7.1), .32 * sc, (1.4 + 1.6 * hash(i * 9.7)) * sc, .26 * sc);
    }
    for (let i = 0; i < 84; i++) {
      if (R < .05) { arms.setMatrixAt(i, ZERO); continue; }
      const arm = i % 6, k = Math.floor(i / 6), f = fract(k / 14 - t * .18), a = arm / 6 * TAU + Math.log(1 + f * 6) * 1.6 + t * .35, rr = R * 1.9 * (1 - f) + R * .2;
      setI(arms, i, Math.cos(a) * rr, Math.sin(a) * rr, -.2, 0, 0, a, .25 * R / 9, .9 * R / 9, .25);
      arms.setColorAt(i, tmpC.setRGB(1, sealing ? .9 : .15, sealing ? .9 : .1).multiplyScalar(.9 * f * (1 - f) * 4 * clamp(R / 4, 0, 1)));
    }
    const seamA = sealing ? win(t, 207, 214, .5, 4) : 0; seam.visible = seamA > .01; seam.scale.set(lerp(18, 2, sstep(207, 214, t)), .25 * seamA + .02, .2); seam.material.opacity = seamA;
    riftLight.intensity = R > .05 ? (90 + 90 * pulse) * clamp(R / 9, 0, 2.2) : 0; riftLight.color.setRGB(1, sealing ? .9 : .1, sealing ? .8 : .08);
    // blasts: rift opening, human seal flash, cult implosion
    let bl = 0, bs = 0; blast.position.copy(RIFT);
    if (t > T.riftOpen && t < T.riftOpen + 2.5) { const u = (t - T.riftOpen) / 2.5; bl = (1 - u) * .7; bs = 4 + 30 * u; blast.material.color.setRGB(1, .2, .15); }
    if (t > T.hit && t < T.hit + 4) { const u = (t - T.hit) / 4; if (cult) { bl = .9 * (1 - u); bs = lerp(40, 2, Math.sqrt(u)); blast.material.color.setRGB(1, .1, .06); } else { bl = (1 - u) * .9; bs = 6 + 70 * u; blast.material.color.setRGB(1, .97, .9); } }
    blast.visible = bl > .01; blast.scale.setScalar(bs); blast.material.opacity = bl;

    // ---------------- Scarlet King
    const K = kingState(t, e);
    king.visible = K.op > .01;
    if (king.visible) {
      king.position.copy(KING_BASE).lerp(RIFT, .25 * (1 - sstep(37, 60, t))); king.position.y += Math.sin(t * .6) * .4 * K.s;
      if (cult) king.position.lerp(tmpV.set(27, 6, 6), sstep(205, 240, t));
      king.scale.setScalar(K.s * (1 + .02 * Math.sin(t * 2.2))); king.rotation.set(0, Math.atan2(4 - king.position.x, -14 - king.position.z), 0);
      kingMat.opacity = K.op * (.8 + .2 * pulse); kingDark.opacity = Math.min(1, K.op * 1.2); crownMat.opacity = Math.min(1, K.op * 1.4);
      crownMat.emissiveIntensity = 1 + pulse + (cult && t > T.hit ? 2 : 0);
      const eyeHits = [44.397, 44.884, 45.349]; eyes.forEach((m, i) => { m.visible = t > eyeHits[i]; m.scale.y = (i === 2 ? .45 : .3) * (1 - .9 * Math.max(0, Math.sin(t * .7 + i) - .97) * 30); });
      kingEyeMat.opacity = Math.min(1, K.op * 2);
      kingArms.forEach((g, i) => { g.rotation.x = -(.15 + 1.75 * Math.min(1, K.reach)) + .12 * Math.sin(t * 1.3 + i); g.rotation.z = (i ? -1 : 1) * (.15 + .25 * Math.min(1, K.reach) + .3 * Math.max(0, K.reach - 1)); });
    }
    const deb = !cult && t > T.hit && t < T.hit + 14;
    const kS0 = kingState(T.hit - .01, e).s;
    for (let i = 0; i < 70; i++) {
      if (!deb) { kingDebris.setMatrixAt(i, ZERO); continue; }
      const age = t - T.hit, s0 = kS0;
      const ox = (hash(i * 1.1) - .5) * 10 * s0, oy = (5 + hash(i * 2.2) * 25) * s0, oz = (hash(i * 3.3) - .5) * 6 * s0;
      const vx = (hash(i * 4.4) - .5) * 9, vz = (hash(i * 5.5) - .5) * 9, vy = 3 + hash(i * 6.6) * 6;
      const y = KING_BASE.y + oy + vy * age - 4.9 * age * age, sc = (.6 + hash(i * 7.7)) * 1.4 * s0 * (1 - sstep(4, 14, age));
      if (y < 0) { kingDebris.setMatrixAt(i, ZERO); continue; }
      setI(kingDebris, i, KING_BASE.x + ox + vx * age, y, KING_BASE.z + oz + vz * age, age * 3 * hash(i), age * 2, 0, sc, sc, sc);
    }

    // ---------------- storm clouds & ash vortex
    const ph = stormPhase(t, e);
    for (let i = 0; i < 110; i++) {
      if (storm < .02) { clouds.setMatrixAt(i, ZERO); continue; }
      const r0 = 20 + 70 * hash(i * 2.1) * (sealing ? 1 + 1.5 * sstep(208, 226, t) : 1), a = hash(i * 3.7) * TAU + ph * 22 / (r0 + 8), y = 44 + 18 * hash(i * 5.3) - 8 * (1 - storm);
      const x = RIFT.x + Math.cos(a) * r0, z = RIFT.z + Math.sin(a) * r0;
      const near = Math.hypot(x - camera.position.x, y - camera.position.y, z - camera.position.z);
      const sc = (6 + 8 * hash(i * 7.9)) * storm * sstep(8, 22, near);
      setI(clouds, i, x, y, z, 0, a, 0, sc * 1.6, sc * .45, sc);
    }
    clouds.material.color.setHex(cult && t > T.hit ? 0x4a1418 : 0x3b2a3a); clouds.material.opacity = .42 * Math.min(1, storm * 1.4);
    const U = ashMat.uniforms; U.uPhase.value = ph; U.uT.value = t; U.uAmt.value = clamp(.25 + storm * 1.1, 0, 1) * (sealing ? 1 - .7 * sstep(210, 230, t) : 1);
    U.uLift.value = cult ? sstep(203, 263, t) * 2.5 : 0; U.uSize.value = t < 20 ? .6 : 1;
    U.uCol.value.setRGB(1, 1, 1).lerp(tmpC.setRGB(1, .28, .12), sstep(20, 30, t)).lerp(tmpC.setRGB(1, .85, .55), sealing ? sstep(206, 216, t) : 0);
    ash.visible = U.uAmt.value > .01;

    // ---------------- facility wiped out (fire columns, glowing doors)
    const fire = win(t, T.wiped - .5, 52, .6, 8);
    for (let i = 0; i < 48; i++) {
      if (fire < .01) { smoke.setMatrixAt(i, ZERO); smokeFire.setMatrixAt(i, ZERO); continue; }
      const src = i < 24 ? GATEA_SHAFT : GATEB_SHAFT, age = fract(t * .3 + (i % 24) / 24), dx = Math.sin(i * 3.1) * 2 * age, dz = Math.cos(i * 2.3) * 2 * age;
      const y = src.y + age * 34, sc = (1.5 + age * 6) * fire;
      setI(smoke, i, src.x + dx + age * 4, y + 3, src.z + dz, 0, i, 0, sc, sc * .8, sc);
      const fs = (2.6 * (1 - age)) * fire; setI(smokeFire, i, src.x + dx * .5, src.y + age * 10, src.z + dz * .5, 0, 0, 0, fs, fs * 1.4, fs);
      smokeFire.setColorAt(i, tmpC.setRGB(1, .35 + .3 * (1 - age), .1).multiplyScalar(1 - age));
    }
    doorGlow.material.opacity = .85 * win(t, 33, 80, .5, 5) * (.6 + .4 * Math.sin(t * 9));

    // ---------------- lightning
    const LA = lightningAmt(t, e); let flash = 0; flashLight.intensity = 0;
    for (let k = 0; k < BOLTS; k++) {
      const per = .55 + .45 * hash(k * 9.1), n = Math.floor((t + k * .37) / per), lt = (t + k * .37) - n * per, sd = k * 101 + n * 7.31;
      const on = LA > 0 && hash(sd) < LA * .75 && lt < .24;
      for (let j = 0; j < BSEG + 4; j++) { const idx = k * BSEG + j; if (!on) bolts.setMatrixAt(j < BSEG ? idx : BOLTS * BSEG + k * 4 + j - BSEG, ZERO); }
      if (!on) continue;
      const a = hash(sd * 1.3) * TAU, typ = hash(sd * 2.7);
      boltA.set(RIFT.x + Math.cos(a) * (R * .9 + 2), RIFT.y + Math.sin(a) * R * .4 + 2, RIFT.z + Math.sin(a) * (R * .9 + 2));
      if (typ < .25) boltA.set(RIFT.x + (hash(sd * 5.1) - .5) * 70, 52, RIFT.z + (hash(sd * 6.1) - .5) * 60);
      const tgt = typ < .5 ? ANCH[Math.floor(hash(sd * 3.9) * 3)] : disturbCenters[Math.floor(hash(sd * 4.9) * disturbCenters.length)];
      boltB.set(tgt.x + (hash(sd * 7.7) - .5) * 6, tgt.y + (t > T.a3 && typ < .5 && !cult ? 3.5 : 0), tgt.z + (hash(sd * 8.8) - .5) * 6);
      const fade = 1 - lt / .24, red = hash(sd * 9.9) < (t > 150 ? .55 : .3) || (cult && t > T.hit);
      tmpC.setRGB(red ? 1 : .75, red ? .2 : .85, red ? .15 : 1).multiplyScalar(1.6 * fade);
      pA.copy(boltA);
      for (let j = 1; j <= BSEG; j++) {
        const u = j / BSEG, w = Math.sin(u * PI) * 3.2;
        pB.copy(boltA).lerp(boltB, u); if (j < BSEG) { pB.x += (hash(sd + j * 1.7) - .5) * w; pB.y += (hash(sd + j * 2.9) - .5) * w * .6; pB.z += (hash(sd + j * 3.3) - .5) * w; }
        setSeg(bolts, k * BSEG + j - 1, pA, pB, .22 * fade + .05); bolts.setColorAt(k * BSEG + j - 1, tmpC);
        if (j === 5 || j === 8) { // branches
          for (let b = 0; b < 2; b++) { const bi = BOLTS * BSEG + k * 4 + (j === 5 ? 0 : 2) + b; tmpV.copy(pB).add(tmpV2.set((hash(sd + j + b * 5) - .5) * 8, -2 - hash(sd + b) * 4, (hash(sd + j * 2 + b) - .5) * 8)); setSeg(bolts, bi, pB, tmpV, .1 * fade + .03); bolts.setColorAt(bi, tmpC); }
        }
        pA.copy(pB);
      }
      if (fade > flash) { flash = fade; flashLight.position.copy(boltB).y += 4; flashLight.color.copy(tmpC).multiplyScalar(1 / Math.max(.01, 1.6 * fade)); }
    }
    flashLight.intensity = 260 * flash; bg.lerp(tmpC.setRGB(.55, .5, .7), .25 * flash);

    // ---------------- red disturbances (expanding cube rings) and glitch cubes
    const DA = disturbAmt(t, e);
    for (let r = 0; r < 7; r++) {
      const per = 2.8 + r * .23, n = Math.floor((t + r * .71) / per), u = ((t + r * .71) - n * per) / per, sd = r * 37 + n * 3.1;
      let on = DA > 0 && hash(sd) < DA, c = disturbCenters[Math.floor(hash(sd * 1.9) * disturbCenters.length)], rad = 1 + 11 * u, inten = (1 - u) * 1.3;
      let cr = 1, cg = .12, cb = .1;
      if (r === 6 && t > T.hit && t < T.hit + 5) { on = true; c = RITUAL; const v = (t - T.hit) / 5; rad = 2 + 60 * v; inten = 1.6 * (1 - v); if (!cult) { cr = .8; cg = .95; cb = 1; } }
      if (r === 5 && t > T.riftOpen && t < T.riftOpen + 4) { on = true; c = RITUAL; const v = (t - T.riftOpen) / 4; rad = 2 + 40 * v; inten = 1.4 * (1 - v); }
      for (let i = 0; i < 28; i++) {
        const idx = r * 28 + i; if (!on) { rings.setMatrixAt(idx, ZERO); continue; }
        const a = i / 28 * TAU, x = c.x + Math.cos(a) * rad, z = c.z + Math.sin(a) * rad;
        setI(rings, idx, x, gy(x, z) + .25 + Math.sin(a * 3 + t * 6) * .15, z, 0, -a, 0, .25, .25 + .5 * (1 - u), rad * TAU / 28 * .7);
        rings.setColorAt(idx, tmpC.setRGB(cr, cg, cb).multiplyScalar(inten));
      }
    }
    const GA = clamp(DA * .8 + (cult ? sstep(205, 225, t) : 0), 0, 1.2);
    for (let i = 0; i < 60; i++) {
      const n = Math.floor(t * 1.4 + hash(i) * 5), sd = i * 13 + n * 1.7;
      if (GA <= 0 || hash(sd) > GA * .7) { glitch.setMatrixAt(i, ZERO); continue; }
      const x = -24 + 48 * hash(sd * 2.1), z = -32 + 40 * hash(sd * 3.1), y = gy(x, z) + 1 + 14 * hash(sd * 4.1), s = .4 + 1.6 * hash(sd * 5.1);
      setI(glitch, i, x, y, z, t * hash(sd), t * .7, 0, s, s * (hash(sd * 6.1) > .5 ? .2 : 1), s); glitch.setColorAt(i, tmpC.setRGB(1, .08, .1).multiplyScalar(.6 + .6 * Math.sin(t * 20 + i)));
    }
    for (let i = 0; i < 90; i++) {
      const t0 = 209 + hash(i * 2.7) * 40;
      if (!cult || t < t0) { frags.setMatrixAt(i, ZERO); continue; }
      const u = sstep(t0, t0 + 12 + 6 * hash(i), t), x0 = -26 + 52 * hash(i * 3.7), z0 = -36 + 44 * hash(i * 4.7), y0 = gy(x0, z0);
      const sw = (1 - u) * 6, a = t * (.8 + hash(i)) + i;
      const x = lerp(x0, RIFT.x, u * u) + Math.cos(a) * sw * u, y = lerp(y0, RIFT.y, u) + Math.sin(u * PI) * 6, z = lerp(z0, RIFT.z, u * u) + Math.sin(a) * sw * u;
      const s = (.6 + 1.8 * hash(i * 5.7)) * (1 - sstep(.85, 1, u));
      setI(frags, i, x, y, z, t * hash(i * 6.1), t * hash(i * 7.1), 0, s, s * .5, s);
    }

    // ---------------- anchors & tethers
    const anchorTops = [];
    let anchorGlow = 0;
    anchorParts.forEach((A, i) => {
      const dt = t - A.deploy; A.g.visible = dt > 0;
      const top = tmpV.copy(A.g.position); top.y += 3; anchorTops.push(top.clone());
      if (!A.g.visible) return;
      const rise = sstep(0, 1.2, dt); A.body.scale.set(1, rise, 1); A.coil.rotation.y = t * 6;
      let F = 6 * sstep(1, 4, dt), op = 1, red = 0, topple = 0;
      if (t > T.end) {
        if (!cult) { F = lerp(F, 24, sstep(192, 202, t)); F = lerp(F, 7, sstep(206, 214, t)); }
        else { red = sstep(192, 203, t); op = 1 - .6 * red * (Math.sin(t * 30 + i) > 0 ? 1 : 0); F *= 1 - sstep(T.hit, T.hit + 1.5, t); topple = sstep(T.hit + .5 + i * .4, T.hit + 1.5 + i * .4, t); }
      }
      const wob = 1 + .03 * Math.sin(t * 4 + i) - .08 * flash;
      A.field.scale.setScalar(Math.max(.01, F * wob)); A.shell.scale.setScalar(Math.max(.01, F * wob * 1.01)); A.field.visible = A.shell.visible = F > .05;
      A.field.material.opacity = .12 * op; A.field.material.color.setRGB(lerp(.23, 1, red), lerp(.63, .1, red), lerp(1, .1, red)); A.shell.material.color.copy(A.field.material.color);
      A.floor.scale.set(F, .03, F); A.floor.position.y = .05; A.floor.visible = F > .05; A.floor.material.opacity = .2 * op;
      A.bandMat.emissive.setRGB(lerp(.25, 1, red), lerp(.72, .1, red), lerp(1, .05, red)); A.bandMat.emissiveIntensity = (1.5 + Math.sin(t * 5 + i)) * (1 - .9 * topple);
      A.body.rotation.set(topple * 1.45, 0, topple * .3 * (i - 1)); anchorGlow += F / 6;
    });
    anchorLight.intensity = 30 * Math.min(anchorGlow, 3) * (cult && t > T.hit ? 0 : 1) + (t > 192 && !cult ? 120 * win(t, 192, 210, 3, 6) : 0);
    // tethers: anchor triangle, then anchors -> strike beam during the tug of war
    diskState(t, e, DS);
    let beamOn = DS.vis && t > T.strike && t < T.hit + (cult ? .3 : 0);
    if (beamOn) {
      const grow = sstep(T.strike, T.strike + 1.4, t), bend = sstep(T.strike + .7, T.strike + 3.3, t);
      tmpV.set(0, -1, 0).applyQuaternion(DS.q); Dp.copy(DS.pos).addScaledVector(tmpV, .6 * DS.s);
      Ep.copy(Dp).lerp(BEACON, grow); Ep.lerp(RIFT, bend);
      Cp.copy(Dp).lerp(BEACON, .5 * grow + .1 * bend);
      if (t > T.tug) Cp.add(tmpV2.set(Math.sin(t * 2.3) * 2.5, Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.9) * 2.5).multiplyScalar(sstep(T.tug, T.tug + 2, t)));
      if (t > T.end) Cp.lerp(tmpV2.copy(Dp).lerp(Ep, .5), sstep(T.end, T.hit, t));
    }
    const tri = t > T.a3 + 3 && !(cult && t > T.hit) ? 1 : 0, tug = beamOn ? win(t, T.tug, T.hit, 1.5, .5) : 0;
    for (let i = 0; i < 6; i++) {
      if (i < 3) {
        if (!tri) { tethers.setMatrixAt(i, ZERO); continue; }
        setSeg(tethers, i, anchorTops[i], anchorTops[(i + 1) % 3], .08 + .03 * Math.sin(t * 7 + i)); tethers.setColorAt(i, tmpC.setRGB(.3, .7, 1).multiplyScalar(.8 + .4 * Math.sin(t * 5 + i) - .5 * flash));
      } else {
        if (tug < .01) { tethers.setMatrixAt(i, ZERO); continue; }
        bez(.55, tmpV); tmpV2.copy(anchorTops[i - 3]).lerp(tmpV, tug); setSeg(tethers, i, anchorTops[i - 3], tmpV2, .22); tethers.setColorAt(i, tmpC.setRGB(.35, .8, 1).multiplyScalar(1.4));
      }
    }

    // ---------------- beacon & uplink
    beacon.visible = t > T.beacon && !(cult && t > T.hit + 2);
    beaconLamp.scale.setScalar(.12 + .06 * Math.sin(t * 10));
    const up = t > T.beacon + .5 && t < T.strike + 1 ? sstep(T.beacon + .5, T.beacon + 2, t) : 0; uplink.visible = up > 0;
    if (up > 0) { pA.copy(BEACON).y += 1.6; pB.set(BEACON.x, lerp(BEACON.y + 2, DS.vis ? DS.pos.y : 90, up), BEACON.z); setSeg({ setMatrixAt: () => {} }, 0, pA, pB, .12 + .05 * Math.sin(t * 12)); uplink.matrixAutoUpdate = false; uplink.matrix.copy(dummy.matrix); uplink.material.opacity = .55 * up; }

    // ---------------- strike disk & beam
    disk.visible = DS.vis && DS.s > .005;
    if (disk.visible) {
      disk.position.copy(DS.pos); disk.quaternion.copy(DS.q); disk.scale.setScalar(DS.s);
      diskMat.emissiveIntensity = .5 + 2.5 * DS.charge + (beamOn ? 1 : 0); diskMat.emissive.setRGB(1, lerp(.8, .15, DS.red), lerp(.45, .1, DS.red));
      diskGlow.material.opacity = .25 + .5 * DS.charge; diskGlow.material.color.setRGB(1, lerp(.78, .15, DS.red), lerp(.4, .1, DS.red));
      const spin = .2 * t + 3 * sstep(T.charge, T.strike, t) * (t - T.charge) * .5 + (t > T.strike ? (t - T.strike) * 1.4 : 0);
      for (let i = 0; i < 100; i++) {
        const outer = i < 64, n = outer ? 64 : 36, k = outer ? i : i - 64, a = k / n * TAU + (outer ? spin : -spin * 1.3), rr = outer ? 13.6 : 8.4;
        const assemble = sstep(T.auth + (k / n) * 4, T.auth + 1 + (k / n) * 4, t);
        let strip = 0; if (DS.red > 0) strip = sstep(hash(i * 3.3) * .8, hash(i * 3.3) * .8 + .2, DS.red);
        if (assemble <= 0 || strip >= 1) { glyphs.setMatrixAt(i, ZERO); continue; }
        const lift = strip * 10;
        setI(glyphs, i, Math.cos(a) * rr * (1 + strip), -.2 - lift * .3, Math.sin(a) * rr * (1 + strip), strip * 4, -a, 0, (outer ? .7 : .5) * assemble, (outer ? .35 : .5) * assemble, (outer ? 1.3 : .8) * assemble);
      }
    }
    diskLight.intensity = disk.visible ? (40 + 260 * DS.charge + (beamOn ? 200 : 0)) * DS.s : 0; diskLight.position.copy(DS.pos || RIFT).y -= 6;
    diskLight.color.setRGB(1, lerp(.88, .2, DS.red || 0), lerp(.62, .12, DS.red || 0));
    for (let i = 0; i < BEAMN; i++) {
      if (!beamOn) { beam.setMatrixAt(i, ZERO); beam.setMatrixAt(i + BEAMN, ZERO); continue; }
      const s0 = i / BEAMN, s1 = (i + 1) / BEAMN; bez(s0, pA); bez(s1, pB);
      const w = (1.5 + .4 * Math.sin(t * 20 + i * .7)) * (1 - .3 * s0) * (t > T.end ? 1 - .5 * sstep(T.end, T.hit, t) : 1);
      setSeg(beam, i, pA, pB, w); setSeg(beam, i + BEAMN, pA, pB, w * 2.4);
      const corrupt = sstep(.55, 1, s0) * (cult ? 1 : .7);
      beam.setColorAt(i, tmpC.setRGB(1, lerp(.95, .3, corrupt), lerp(.75, .2, corrupt))); beam.setColorAt(i + BEAMN, tmpC.setRGB(.45, lerp(.32, .05, corrupt), lerp(.12, .04, corrupt)));
    }
    for (let i = 0; i < SPARKN; i++) {
      if (!beamOn) { sparks.setMatrixAt(i, ZERO); continue; }
      const s = fract(i / SPARKN + t * .55), a = i * 2.4 + t * 6; bez(s, pA); const rr = 2.2 + 1.2 * Math.sin(i);
      setI(sparks, i, pA.x + Math.cos(a) * rr, pA.y + Math.sin(a * .7) * rr * .6, pA.z + Math.sin(a) * rr, a, a * .5, 0, .35, .35, .35);
      sparks.setColorAt(i, tmpC.setRGB(1, lerp(.9, .2, s), lerp(.5, .1, s)).multiplyScalar(1.5));
    }
    const tend = beamOn ? win(t, T.tug, T.hit, 1.5, .3) * (cult ? 1.4 : 1) : 0;
    for (let i = 0; i < 30; i++) {
      if (tend < .01) { tendrils.setMatrixAt(i, ZERO); continue; }
      const k = Math.floor(i / 10), j = i % 10, a0 = k / 3 * TAU + t * .4;
      bez(.5 + .05 * k, tmpV2); tmpV.copy(RIFT).addScaledVector(tmpV3.set(Math.cos(a0), Math.sin(a0) * .4, Math.sin(a0)), R);
      const u0 = j / 10, u1 = (j + 1) / 10;
      pA.copy(tmpV).lerp(tmpV2, u0 * tend); pA.y += Math.sin(u0 * PI * 2 + t * 5 + k) * 1.5;
      pB.copy(tmpV).lerp(tmpV2, u1 * tend); pB.y += Math.sin(u1 * PI * 2 + t * 5 + k) * 1.5;
      setSeg(tendrils, i, pA, pB, .45 * (1 - u0 * .6)); tendrils.setColorAt(i, tmpC.setRGB(1, .08, .06).multiplyScalar(1.3));
    }
    impact.visible = beamOn && t > T.strike + 1.5; if (impact.visible) { impact.position.copy(Ep); impact.scale.setScalar(3 + 1.5 * Math.sin(t * 13)); impact.material.color.setRGB(1, cult && t > T.end ? .2 : .55, .3); }

    // ---------------- actors
    const coPos = [], cuPos = [];
    for (let i = 0; i < NA; i++) {
      const a = actors[i], st = ST[i];
      if (a.side === 0) coState(a, t, e, st); else cultState(a, t, e, st);
      if (!st.vis || st.sc <= .01) { bodies.setMatrixAt(i, ZERO); heads.setMatrixAt(i, ZERO); guns.setMatrixAt(i, ZERO); tags.setMatrixAt(i, ZERO); continue; }
      let y = st.y, x = st.x, z = st.z, rx = -(st.bow || 0) - st.fall * 1.45, sc = st.sc;
      if (st.lift > 0) { const u = st.lift; x = lerp(x, RIFT.x, u * u * .6); z = lerp(z, RIFT.z, u * u * .6); y += u * u * 22; rx += u * 4; sc *= 1 - u; }
      if (!cult && a.side === 1 && t > T.hit) { const cr = sstep(T.hit + .5 + a.ph * 4, T.hit + 2.5 + a.ph * 4, t); sc *= 1 - cr; y -= cr * .6; }
      if (sc <= .01) { bodies.setMatrixAt(i, ZERO); heads.setMatrixAt(i, ZERO); guns.setMatrixAt(i, ZERO); tags.setMatrixAt(i, ZERO); continue; }
      setI(bodies, i, x, y + st.fall * .25, z, rx, st.yaw, 0, sc, sc, sc);
      heads.setMatrixAt(i, dummy.matrix); guns.setMatrixAt(i, dummy.matrix); tags.setMatrixAt(i, dummy.matrix);
      const strobe = a.side === 0 ? .6 + .4 * (Math.sin(t * 8 + a.ph * 30) > .6 ? 1 : 0) : .8; const c = FAC[a.fac].tag;
      tags.setColorAt(i, tmpC.set(c).multiplyScalar(strobe * (1 - st.fall)));
      if (st.fight && st.fall < .1) (a.side === 0 ? coPos : cuPos).push(i);
    }
    // SCPs
    const scpTargets = [];
    scps.forEach(S => {
      kfPos(S.kf, t, SP); let vis = t >= S.kf[0][0], sink = 0;
      if (S.sink) for (const [t0, t1, dir] of S.sink) if (t >= t0 && t < t1) sink = dir ? 1 - sstep(t0, t1, t) : sstep(t0, t1, t);
      if (S.name === '106' && t >= 78.9 && t < 79) sink = 1;
      let x = SP.x, z = SP.z;
      if (S.step) { const n = Math.floor(t * 1.6); kfPos(S.kf, n / 1.6, SP); x = SP.x; z = SP.z; }
      let y = gy(x, z) - sink * 2.1, sc = 1, extra = 0;
      if (t > T.hit) { if (!cult) { const u = sstep(T.hit + 1, T.hit + 6, t); sc = 1 - u; y -= u; } else { sc = 1 + .3 * sstep(T.hit, 220, t); extra = 1; } }
      if (S.name === '939' && t > 102.6 && t < 104.6) y += Math.sin(clamp((t - 102.6) / .8, 0, 1) * PI) * 1.4;
      S.g.visible = vis && sc > .01; if (!S.g.visible) return;
      S.g.position.set(x, y, z); S.g.scale.setScalar(sc);
      S.g.rotation.y = Math.atan2(4 - x, -11 - z); S.aura.material.opacity = (.16 + .1 * Math.sin(t * 4)) * (1 + extra);
      if (sink < .5 && t > S.kf[0][0] + 2) scpTargets.push(S.g.position);
    });
    puddles.forEach(p => { const S = scps[4]; const on = win(t, 70, 84, 1, 1); p.visible = on > .01 && S.g.visible; p.position.set(S.g.position.x, gy(S.g.position.x, S.g.position.z) + .03, S.g.position.z); p.scale.set(1.3 * on, .02, 1.3 * on); });
    // cult respawn columns
    let ci = 0;
    for (let i = NCO; i < NA && ci < 32; i++) {
      const st = ST[i]; if (!st.vis || !(st.col > 0)) continue;
      pB.set(st.x, st.y, st.z); setSeg(cultCols, ci, RIFT, pB, .5 + .3 * st.col); cultCols.setColorAt(ci, tmpC.setRGB(1, .1, .08).multiplyScalar(st.col)); ci++;
    }
    for (; ci < 32; ci++) cultCols.setMatrixAt(ci, ZERO);

    // ---------------- tracers (each shooter fires only at the nearest hostile: no friendly fire)
    const FR = fireRate(t, e); let ti = 0;
    const shoot = (i, enemiesIdx, enemiesV, col) => {
      if (ti >= 140) return;
      const a = actors[i], st = ST[i], rate = (a.side === 0 ? 2.4 : 1.4) * FR; if (rate <= 0) return;
      const ph = a.ph * 7, slotT = (t + ph) * rate, n = Math.floor(slotT), lt = (slotT - n) / rate;
      if (hash(a.id * 17.3 + n * 1.13) > .6 || lt > .2) return;
      let best = null, bd = 1e9;
      for (const j of enemiesIdx) { const s = ST[j], d = (s.x - st.x) ** 2 + (s.z - st.z) ** 2; if (d < bd) { bd = d; best = tmpV2.set(s.x, s.y + 1.2, s.z); } }
      for (const p of enemiesV) { const d = (p.x - st.x) ** 2 + (p.z - st.z) ** 2; if (d < bd) { bd = d; best = tmpV2.set(p.x, p.y + 1, p.z); } }
      if (!best || bd > 900) return;
      pA.set(st.x + Math.cos(st.yaw) * .16, st.y + 1.18, st.z - Math.sin(st.yaw) * .16);
      best.x += (hash(n * 3.1 + a.id) - .5) * .8; best.y += (hash(n * 4.1 + a.id) - .5) * .6;
      const u = lt / .2; tmpV.copy(pA).lerp(best, Math.min(1, u + .25)); tmpV3.copy(pA).lerp(best, u);
      setSeg(tracers, ti, tmpV3, tmpV, .045); tracers.setColorAt(ti, tmpC.set(col).multiplyScalar(1.8));
      if (u < .35) { setI(muzzles, ti, pA.x + Math.sin(st.yaw) * .5, pA.y, pA.z + Math.cos(st.yaw) * .5, 0, 0, 0, .14, .14, .14); muzzles.setColorAt(ti, tmpC.set(col).multiplyScalar(2)); } else muzzles.setMatrixAt(ti, ZERO);
      ti++;
    };
    for (const i of coPos) shoot(i, cuPos, scpTargets, FAC[actors[i].fac].tracer);
    for (const i of cuPos) shoot(i, coPos, [], FAC.cult.tracer);
    for (; ti < 140; ti++) { tracers.setMatrixAt(ti, ZERO); muzzles.setMatrixAt(ti, ZERO); }

    flagUpdate(sigil, candles, flames, shards, arms, kingDebris, clouds, bolts, rings, glitch, frags, smoke, smokeFire, tethers, glyphs, beam, sparks, tendrils, bodies, heads, guns, tags, cultCols, tracers, muzzles);

    // ---------------- overlay: flashes and final fade
    let oa = 0; const oc = tmpC.setRGB(0, 0, 0);
    const fl = (t0, d, a, r, g, b) => { if (t >= t0 && t < t0 + d) { const v = a * (1 - (t - t0) / d); if (v > oa) { oa = v; oc.setRGB(r, g, b); } } };
    fl(T.riftOpen, 1.2, .55, 1, .1, .08); fl(T.strike, 1.0, .5, 1, .95, .8); fl(44.397, .3, .25, 1, .2, .1); fl(44.884, .3, .25, 1, .2, .1); fl(45.349, .3, .25, 1, .2, .1);
    if (cult) { fl(T.hit, 2.2, .85, 1, .05, .05); } else { fl(T.hit, 2.6, .95, 1, 1, 1); }
    fl(T.wiped, 1.0, .35, 1, .4, .1);
    const fadeIn = 1 - sstep(0, 2.5, t); if (fadeIn > oa) { oa = fadeIn; oc.setRGB(0, 0, 0); }
    const fadeOut = sstep(duration - 5, duration - .2, t) * .92; if (fadeOut > oa) { oa = fadeOut; if (cult) oc.setRGB(.15, 0, 0); else oc.setRGB(0, 0, 0); }
    overlay.visible = oa > .003;
    if (overlay.visible) {
      overlay.material.color.copy(oc); overlay.material.opacity = oa;
      camera.getWorldDirection(tmpV2); overlay.position.copy(camera.position).addScaledVector(tmpV2, .3); overlay.quaternion.copy(camera.quaternion);
      const hgt = 2 * .3 * Math.tan(camera.fov * PI / 360) * 1.3; overlay.scale.set(hgt * Math.max(camera.aspect || 1.8, .5), hgt, 1);
    }
  }

  function caption(time, ending) {
    const e = ending === 'cult' ? 'cult' : 'human', S = shotAt(clamp(+time || 0, 0, duration), e);
    return { title: S.title, text: S.text };
  }
  update(0, 'human');
  return { update, caption };
};
