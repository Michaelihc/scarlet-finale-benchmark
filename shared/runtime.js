import * as THREE from 'three';
import {GLTFLoader} from './lib/GLTFLoader.js';
import {DRACOLoader} from './lib/DRACOLoader.js';
import {OrbitControls} from './lib/OrbitControls.js';

const A=window.BENCHMARK_ASSETS||{};
const stage=document.getElementById('stage'),$=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
stage.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x172534);scene.fog=new THREE.Fog(0x172534,110,380);
const camera=new THREE.PerspectiveCamera(50,1,.15,1200);camera.position.set(65,38,-65);
const lights=new THREE.Group();scene.add(lights);
lights.add(new THREE.HemisphereLight(0xd4e5ff,0x566475,2.0));
const sun=new THREE.DirectionalLight(0xffede0,3.1);sun.position.set(-60,120,-80);lights.add(sun);
const fill=new THREE.DirectionalLight(0xaccbff,1.4);fill.position.set(70,45,45);lights.add(fill);
const effects=new THREE.Group();effects.name='CANDIDATE_EFFECTS';scene.add(effects);
const controls=new OrbitControls(camera,renderer.domElement);controls.enabled=false;controls.enableDamping=true;controls.target.set(0,2,-8);
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
const draco=new DRACOLoader();
if(A.dracoJS){draco._loadLibrary=async(_name,type)=>type==='arraybuffer'?Uint8Array.from(atob(A.dracoWasm),c=>c.charCodeAt(0)).buffer:A.dracoJS;}
else draco.setDecoderPath(new URL('./lib/draco/',import.meta.url).href);
const loader=new GLTFLoader().setDRACOLoader(draco);
const gltf=await loader.loadAsync(A.model||'./assets/surface15.glb');
const map=gltf.scene;map.name='LOCKED_SURFACE15';
const mapMeshes=[];
const colors={terrain:0xb8c7d4,cliff:0x687784,road:0x333d47,gate_a:0x909ba6,gate_b:0x84949f,cassie:0x8d999f,garage:0x829096,spawn:0x87949a,struct:0x8d989e,tunnel:0x7b8790};
map.traverse(o=>{if(!o.isMesh)return;const name=o.name;const key=Object.keys(colors).find(k=>name.startsWith(k+'__')||name.startsWith(k+'_cut__'))||'struct';
 o.geometry.computeVertexNormals();
 const glass=name.includes('__glass');o.material=new THREE.MeshStandardMaterial({color:colors[key],roughness:.92,side:THREE.DoubleSide,transparent:glass,opacity:glass?.25:1,depthWrite:!glass});
 if(name.includes('__light')){o.material.color.set(0xcbd9e4);o.material.emissive.set(0x607080);o.material.emissiveIntensity=.4;}
 if(glass)o.renderOrder=2;mapMeshes.push(o);
});
scene.add(map);map.updateMatrixWorld(true);
// The asset is glTF-handed, in metres. Unity prefab-local (x,y,z) maps to scene (-x,y,z).
// Native game world Y is prefab-local Y + 300; this viewer deliberately stays prefab-local.
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const landmarks={gateA:V(18.95,1.21,.91),gateB:V(-30.97,.98,-3.31),gateARoof:V(30,10,8),
 courtyard:V(0,1,-10),rift:V(22,24,-3),cassieEntrance:V(8.72,2.57,10.07),roadEntry:V(22,-4,-60),
 anchorSites:[V(10,0,-9),V(-3,0,-15),V(13,0,-20)],
 coalitionEntries:[V(-19,0,-14),V(-15,0,-20),V(17,-1,-35)]};
const ray=new THREE.Raycaster();
const groundCache=window.SURFACE_GROUND_CACHE||{};
window.__groundSamples=groundCache;
function groundY(x,z){const key=JSON.stringify([x,z]);if(Object.prototype.hasOwnProperty.call(groundCache,key))return groundCache[key];ray.set(V(x,18,z),V(0,-1,0));const h=ray.intersectObjects(mapMeshes,false).find(h=>h.face&&Math.abs(h.face.normal.y)>.45);const value=h?h.point.y:null;groundCache[key]=value;return value;}
for(const p of [...landmarks.anchorSites,...landmarks.coalitionEntries]){const y=groundY(p.x,p.z);if(y!==null)p.y=y+.03;}
const duration=263.2214;
const api={THREE,scene,camera,renderer,effects,landmarks,map,groundY,duration,lights};
const storyboard=window.createStoryboard(api);
if(!storyboard||typeof storyboard.update!=='function')throw Error('createStoryboard must return update(time,ending)');
let time=0,playing=false,last=performance.now(),free=false;
const audio=new Audio(A.score||'./assets/final-action.mp3');audio.preload='metadata';
let mediaProblem='';
audio.addEventListener('error',()=>{mediaProblem=' · audio load error';});
function setPlaying(value){playing=value;$('play').textContent=playing?'Pause':'Play';last=performance.now();
 if(playing){audio.currentTime=time;audio.playbackRate=+$('speed').value;audio.play().catch(e=>{mediaProblem=' · audio: '+e.name;});}else audio.pause();}
function seek(value){time=Math.max(0,Math.min(duration,value));audio.currentTime=time;}
$('play').onclick=()=>{if(time>=duration)seek(0);setPlaying(!playing);};
$('restart').onclick=()=>seek(0);
$('timeline').oninput=e=>seek(+e.target.value);
$('ending').onchange=()=>{};
$('speed').onchange=()=>audio.playbackRate=+$('speed').value;
$('free').onclick=()=>{free=!free;controls.enabled=free;controls.target.copy(landmarks.rift);$('free').textContent=free?'Resume storyboard camera':'Inspect camera';};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|SELECT|BUTTON/.test(e.target.tagName)){e.preventDefault();setPlaying(!playing);}});
function draw(now){requestAnimationFrame(draw);const dt=Math.min(.1,(now-last)/1000);last=now;if(playing){time=Math.min(duration,time+dt*(+$('speed').value));if(!audio.paused&&Math.abs(audio.currentTime-time)>.35)time=audio.currentTime;if(time>=duration)setPlaying(false);}
 const pos=camera.position.clone(),quat=camera.quaternion.clone();storyboard.update(time,$('ending').value);
 if(free){camera.position.copy(pos);camera.quaternion.copy(quat);controls.update();}
 const caption=storyboard.caption?.(time,$('ending').value)||{};$('shot-title').textContent=caption.title||'Scarlet finale';$('shot-copy').textContent=caption.text||'';
 $('timeline').value=time;$('time').textContent=Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0');
 $('status').textContent='15.0 map · '+mapMeshes.length+' meshes · '+(playing?'playing':'paused')+' · '+$('ending').value+mediaProblem;
 renderer.render(scene,camera);
}
window.__benchmark={ready:true,api,storyboard,audio,get time(){return time;},get playing(){return playing;},seek,setPlaying,
 setEnding(value){$('ending').value=value;},mapBounds:new THREE.Box3().setFromObject(map),mapMeshCount:mapMeshes.length};
$('status').textContent='Ready';requestAnimationFrame(draw);
