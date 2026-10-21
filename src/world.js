import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {terrain,SIZE,ITEMS,DIRS,levelOf} from './sim.js';
const C={wood:0x79563c,timber:0xa27850,cream:0xf3e2b8,plaster:0xe9d5a7,roof:0x4d7b77,roofDark:0x3e6663,red:0xb66d4f,brick:0xae7658,stone:0xbac2af,dark:0x3e5149,window:0xeebd68,metal:0x6b8380};
const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c);}
const boxG=new THREE.BoxGeometry(1,1,1);const cylG=new THREE.CylinderGeometry(1,1,1,12);const sphereG=new THREE.IcosahedronGeometry(1,1);
function mesh(g,geo,color,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function box(g,c,x,y,z,w,h,d){return mesh(g,boxG,c,x,y,z,w,h,d);}
function cyl(g,c,x,y,z,r,h,r2=r){return mesh(g,r===r2?cylG:new THREE.CylinderGeometry(r2/r,1,1,12),c,x,y,z,r,h,r);}
function ball(g,c,x,y,z,r,s=1){return mesh(g,sphereG,c,x,y,z,r,r*s,r);}
function roof(g,x,y,z,w,h,d,color=C.roof){
 const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});const m=mesh(g,geo,color,x,y,z-d/2);
 box(g,C.roofDark,x,y+.015,z,w+.035,.04,d+.015);box(g,color,x,y+h,z,.055,.045,d+.04);return m;
}
function windowPane(g,x,y,z,w=.13){box(g,C.wood,x,y,z,w+.035,.19,.025);box(g,C.window,x,y,z+.018,w,.15,.018);box(g,C.wood,x,y,z+.032,.018,.16,.015);}
function house(g,{x=0,z=0,w=.68,d=.59,h=.52,color=C.roof,chimney=false}={}){
 box(g,C.stone,x,.055,z,w+.1,.11,d+.1);box(g,C.plaster,x,h/2+.1,z,w,h,d);roof(g,x,h+.1,z,w+.13,.29,d+.14,color);
 for(const dx of [-w/2+.02,w/2-.02])box(g,C.wood,x+dx,h/2+.1,z+d/2+.015,.035,h,.035);
 box(g,C.wood,x,h*.56+.1,z+d/2+.02,w,.035,.035);box(g,C.wood,x-.13,.26,z+d/2+.02,.14,.31,.035);windowPane(g,x+.16,.4,z+d/2+.024);
 box(g,C.timber,x,.12,z+d/2+.09,.25,.07,.13);
 // Side window and timber trim make all camera orientations readable.
 box(g,C.window,x+w/2+.012,.4,z,.022,.16,.15);box(g,C.wood,x+w/2+.025,.4,z,.02,.015,.16);
 if(chimney){box(g,C.brick,x+w*.26,h+.32,z-.1,.12,.42,.14);box(g,C.cream,x+w*.26,h+.54,z-.1,.16,.06,.18);g.userData.smoke={x:x+w*.26,y:h+.59,z:z-.1};}
}
function fence(g,x,z,len,axis='x'){for(let i=0;i<=len/.2;i++){const dx=axis==='x'?i*.2:0,dz=axis==='z'?i*.2:0;box(g,0xd3c49c,x+dx,.18,z+dz,.035,.3,.035);}box(g,0xcfbb8e,x+(axis==='x'?len/2:0),.2,z+(axis==='z'?len/2:0),axis==='x'?len:.026,.045,axis==='z'?len:.026);}
function tree(g,x,y,z,seed=0,scale=1){const t=new THREE.Group();t.position.set(x,y,z);t.scale.setScalar(scale);g.add(t);cyl(t,C.wood,0,.38,0,.055,.76);if(seed%3===0){for(let i=0;i<3;i++){mesh(t,new THREE.ConeGeometry(.36-i*.06,.54,7),[0x426e57,0x558566,0x689374][i],0,.55+i*.24,0);}}else{ball(t,[0x6f965e,0x7f9c60,0x92a365,0xb0b778][seed%4],0,.85,0,.4,1.1);ball(t,0x819e62,-.18,.7,.08,.27);ball(t,0x94aa6d,.17,.88,.05,.28);}return t;}
function rock(g,x,y,z,scale=1){const m=mesh(g,new THREE.DodecahedronGeometry(1),0x9ea99e,x,y+scale*.18,z,scale*.3,scale*.32,scale*.29);m.rotation.set(.1,x,.2);return m;}
function log(g,x,y,z,s=.2){const m=cyl(g,C.wood,x,y,z,.07,s);m.rotation.z=Math.PI/2;const a=cyl(g,0xe3bd7c,x+s/2+.001,y,z,.055,.008);a.rotation.z=Math.PI/2;}
export function makeBuilding(type,dir=0,level=1){
 const g=new THREE.Group();g.userData.type=type;
 if(type==='belt'){
 box(g,0x566660,0,.1,0,.98,.12,.42);box(g,0x465c54,0,.18,0,.96,.06,.35);
 for(let i=-4;i<=4;i++)box(g,0xa59772,i*.11,.22,0,.075,.025,.33);
 for(const z of [-.24,.24]){box(g,C.timber,0,.22,z,1,.07,.055);for(const x of [-.36,.36])box(g,C.wood,x,.07,z,.055,.16,.055);}
 for(const z of [-.16,.16])box(g,0xd7bc69,.37,.26,z,.065,.025,.065);
 const arrow=new THREE.Shape();arrow.moveTo(-.1,-.07);arrow.lineTo(.02,-.07);arrow.lineTo(.02,-.13);arrow.lineTo(.17,0);arrow.lineTo(.02,.13);arrow.lineTo(.02,.07);arrow.lineTo(-.1,.07);arrow.closePath();const m=mesh(g,new THREE.ShapeGeometry(arrow),0xf2df9d,0,.242,0);m.rotation.x=-Math.PI/2;
 g.rotation.y=-dir*Math.PI/2;return g;
 }
 if(type==='road'){box(g,0xd4ceb2,0,.018,0,.98,.035,.98);for(let i=0;i<3;i++)for(let j=0;j<3;j++)box(g,(i+j)%2?0xd8d2b9:0xc9c8b1,(i-1)*.3,.045,(j-1)*.3,.28,.035,.28);return g;}
 box(g,0xb9b99a,0,.025,0,.92,.05,.92);
 if(type==='lumber'){
 house(g,{x:-.13,z:-.1,w:.48,d:.47,h:.43,color:0x778961});
 for(let i=0;i<4;i++)log(g,.2,.13+Math.floor(i/2)*.12,.2+(i%2)*.13,.34);
 const saw=cyl(g,0xa8b6af,.12,.43,.4,.13,.026);saw.rotation.x=Math.PI/2;box(g,C.wood,.12,.21,.39,.4,.07,.1);box(g,C.wood,-.05,.1,.39,.04,.2,.04);
 }else if(type==='farm'){
 box(g,0x8c7951,0,.065,0,.84,.06,.82);
 for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++){const xx=x*.115,zz=z*.11;box(g,0xbb9553,xx,.13,zz,.016,.14,.016);const wheat=mesh(g,sphereG,0xe9c66c,xx,.23+((x+z)%2)*.02,zz,.035,.09,.035);wheat.rotation.z=.15;}
 fence(g,-.42,-.42,.8);fence(g,-.42,-.42,.8,'z');box(g,C.wood,.31,.46,.23,.035,.7,.035);box(g,C.wood,.31,.65,.23,.24,.025,.025);ball(g,0xe9d9ac,.31,.76,.23,.065);mesh(g,new THREE.ConeGeometry(.1,.1,8),C.red,.31,.81,.23);box(g,0x728d8b,.31,.61,.23,.13,.15,.06);
 }else if(type==='sawmill'){
 house(g,{x:-.14,z:-.04,w:.48,d:.6,h:.45,color:0x597d75});box(g,C.timber,.26,.25,.1,.3,.08,.7);for(const z of [-.2,.35])box(g,C.wood,.26,.13,z,.06,.25,.05);
 for(let i=0;i<3;i++)box(g,0xd6af70,.27,.33+i*.035,.05,.25,.025,.5);const blade=cyl(g,0xb9c6b8,.25,.44,-.18,.15,.02);blade.rotation.x=Math.PI/2;g.userData.spin=blade;
 }else if(type==='mill'){
 cyl(g,C.cream,0,.5,0,.28,.95,.19);cyl(g,C.stone,0,.12,0,.32,.14);mesh(g,new THREE.ConeGeometry(.32,.44,8),C.roof,0,1.15,0);windowPane(g,0,.52,.25,.1);box(g,C.wood,0,.21,.28,.13,.28,.035);
 const rotor=new THREE.Group();rotor.position.set(0,.95,.36);g.add(rotor);for(let i=0;i<4;i++){const arm=new THREE.Group();arm.rotation.z=i*Math.PI/2;rotor.add(arm);box(arm,C.wood,0,.32,0,.035,.68,.035);box(arm,0xece4c3,.075,.4,.01,.13,.42,.025);for(let j=0;j<4;j++)box(arm,C.timber,.075,.23+j*.105,.028,.14,.014,.015);}ball(rotor,C.wood,0,0,.025,.07);g.userData.rotor=rotor;
 }else if(type==='bakery'){
 house(g,{w:.69,d:.59,h:.55,color:C.red,chimney:true});for(let i=0;i<6;i++){const a=box(g,i%2?0xe5b57b:0xf6e4bc,-.25+i*.1,.43,.39,.1,.055,.23);a.rotation.x=.1;}box(g,C.timber,0,.22,.44,.65,.06,.14);for(let i=0;i<3;i++)ball(g,0xc9964e,-.18+i*.16,.29,.45,.065,.6);
 }else if(type==='market'){
 for(const x of [-.32,.32])for(const z of [-.28,.28])box(g,C.wood,x,.33,z,.045,.65,.045);
 for(let i=0;i<7;i++)roof(g,-.3+i*.1,.65,0,.105,.16,.76,i%2?0xf6e9c8:0xcb8f60);
 box(g,C.timber,0,.2,0,.68,.08,.5);for(const x of [-.2,.12]){box(g,0xa07f4b,x,.31,.07,.25,.15,.24);for(let i=0;i<3;i++)ball(g,x<0?0xd2a254:0x9eb45e,x-.07+i*.07,.42,.07,.05);}
 box(g,C.wood,.38,.55,-.28,.025,1.1,.025);box(g,0xf0d18b,.47,1,-.28,.2,.15,.02);
 }else if(type==='mine'){
 rock(g,-.2,0,-.15,1.5);rock(g,.22,0,-.18,1);box(g,C.dark,0,.23,.16,.4,.4,.18);box(g,C.timber,0,.44,.3,.53,.1,.09);for(const x of [-.23,.23])box(g,C.timber,x,.24,.3,.08,.4,.08);
 for(const x of [-.13,.13])box(g,C.metal,x,.08,.32,.025,.025,.6);box(g,C.metal,0,.19,.35,.25,.16,.23);rock(g,0,.22,.34,.5);
 }else if(type==='furnace'){
 house(g,{w:.55,d:.6,h:.53,color:0x697c74});cyl(g,C.brick,.25,.65,-.16,.13,1.3,.09);cyl(g,C.cream,.25,1.29,-.16,.12,.08);box(g,C.dark,0,.26,.32,.26,.25,.02);box(g,0xeaa04b,0,.24,.337,.19,.16,.02);g.userData.smoke={x:.25,y:1.36,z:-.16};
 }else if(type==='workshop'){
 house(g,{w:.7,d:.6,h:.65,color:0x547d82,chimney:true});const cog=cyl(g,0xd4b56b,.05,.53,.337,.13,.035);cog.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const a=i/8*Math.PI*2;box(g,0xd4b56b,.05+Math.sin(a)*.14,.53+Math.cos(a)*.14,.34,.06,.06,.04);}box(g,C.dark,.05,.53,.36,.055,.055,.02);
 }
 if(level>1){for(let i=0;i<level-1;i++)ball(g,0xf3d58b,-.3+i*.13,.14,.46,.045);}
 // Every machine has a readable output port on its chosen side.
 if(type!=='market'&&type!=='road'){const p=new THREE.Group();p.rotation.y=-dir*Math.PI/2;g.add(p);box(p,0xd5ae5a,.45,.1,0,.15,.07,.25);box(p,0x3f6b58,.5,.145,0,.07,.02,.12);}
 return g;
}
function itemModel(type){const g=new THREE.Group(),c=ITEMS[type].color;if(type==='log'){log(g,0,.05,0,.23);}else if(type==='plank'){for(let i=0;i<3;i++)box(g,c,0,.02+i*.035,0,.23,.025,.15);}else if(type==='bread'){ball(g,c,0,.06,0,.12,.65);for(let i=-1;i<=1;i++)box(g,0xf1cd83,i*.06,.13,0,.015,.008,.09);}else if(type==='flour'||type==='grain'){ball(g,c,0,.08,0,.1,1.2);cyl(g,0x9a8353,0,.17,0,.035,.04);}else if(type==='ore'){rock(g,0,0,0,.4);}else if(type==='iron'){box(g,c,0,.06,0,.22,.08,.13);}else{cyl(g,c,0,.07,0,.115,.07);cyl(g,0x627c70,0,.11,0,.045,.01);}return g;}
function mergeStatic(group){const buckets=new Map();group.updateMatrixWorld(true);group.traverseVisible(o=>{if(o.isMesh){const key=o.material;if(!buckets.has(key))buckets.set(key,[]);const geom=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();buckets.get(key).push(geom.applyMatrix4(o.matrixWorld));}});const result=new THREE.Group();for(const [m,geos]of buckets){const merged=mergeGeometries(geos);const mesh=new THREE.Mesh(merged,m);mesh.castShadow=true;mesh.receiveShadow=true;result.add(mesh);geos.forEach(g=>g.dispose());}return result;}
function optimizeBuilding(model){const data=model.userData;for(const key of ['rotor','spin'])if(data[key])data[key].removeFromParent();const result=mergeStatic(model);result.userData=data;for(const key of ['rotor','spin'])if(data[key])result.add(data[key]);return result;}
export class World{
 constructor(canvas,state){
 this.canvas=canvas;this.state=state;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.setClearColor(0xc9dcd1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
 this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog(0xc9dcd1,45,85);
 this.camera=new THREE.OrthographicCamera(-15,15,10,-10,.1,150);this.camera.position.set(23,27,29);
 this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(-.5,0,0);this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.minZoom=.65;this.controls.maxZoom=3;this.controls.maxPolarAngle=Math.PI*.43;this.controls.minPolarAngle=.23;this.controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};this.controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};this.controls.screenSpacePanning=false;
 this.scene.add(new THREE.HemisphereLight(0xfff1d7,0x719a85,2.5));const sun=new THREE.DirectionalLight(0xffe3b7,3.5);sun.position.set(-14,25,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;this.scene.add(sun);
 this.mapRoot=new THREE.Group();this.scene.add(this.mapRoot);this.models=new Map();this.items=new Map();this.terrainMeshes=[];this.decor=new Map();this.smoke=[];this.waterLines=[];this.time=0;this.buildTerrain();this.buildTown();this.sync();
 this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.selection=new THREE.Group();const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.97,.06,.97)),new THREE.LineBasicMaterial({color:0xf7df8a}));this.selection.add(border);this.selection.visible=false;this.scene.add(this.selection);this.ghost=null;this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);const half=14;this.camera.left=-half*w/h;this.camera.right=half*w/h;this.camera.top=half;this.camera.bottom=-half;this.camera.updateProjectionMatrix();}
 home(){this.camera.position.set(23,27,29);this.controls.target.set(-.5,0,0);this.camera.zoom=1;this.camera.updateProjectionMatrix();}
 buildTerrain(){
 const land=new THREE.Group(),details=new THREE.Group();const random=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 for(let x=0;x<SIZE;x++)for(let z=0;z<SIZE;z++){
 const t=terrain(x,z),xx=x-12,zz=z-12;const water=t.kind==='water';const c=water?0x79b5ae:[0x9fb381,0xa8b987,0xa1b783,0xacc18d,0xa4b987][Math.floor(random(x,z)*5)];
 box(land,0x9f9879,xx,(t.h-1)/2-.03,zz,.998,t.h+1,.998);box(land,0xc3b99a,xx,t.h-.15,zz,1,.16,1);const tile=box(land,c,xx,t.h-.035,zz,1,.09,1);
 if(water){tile.material=new THREE.MeshStandardMaterial({color:0x72b4ad,roughness:.24,metalness:.15});for(let i=0;i<2;i++){const line=box(this.mapRoot,0xa5d4c8,xx-.2+i*.35,t.h+.025,zz+random(z,x+i)*.6-.3,.2+random(x+i,z)*.3,.008,.018);line.castShadow=false;this.waterLines.push(line);}}
 if(!water&&random(x,z)>.62){for(let j=0;j<3;j++){const px=xx+random(x+j,z+1)*.7-.35,pz=zz+random(x,z+j+2)*.7-.35;box(details,0x839e6b,px,t.h+.035,pz,.014,.08,.014);if(random(x+j,z)>.7)ball(details,0xe8d69d,px,t.h+.08,pz,.022);}}
 const occupied=this.state.buildings.some(b=>b.x===x&&b.z===z);
 if(!water&&!occupied&&!(x>=10&&x<=16&&z>=8&&z<=13)){
 const d=new THREE.Group();if(t.kind==='forest'&&random(x,z)>.14){tree(d,xx-.12,t.h,zz,Math.floor(random(z,x)*10),.8+random(x,z)*.5);if(random(z,x)>.6)tree(d,xx+.3,t.h,zz+.25,2,.6);}else if(t.kind==='rock'&&random(x,z)>.3){rock(d,xx,t.h,zz,.8+random(z,x));rock(d,xx+.25,t.h,zz+.2,.5);}else if((z<4||x>21||z>21||x<2)&&random(x,z)>.32)tree(d,xx,t.h,zz,Math.floor(random(x,z)*10),.7+random(z,x)*.6);
 if(d.children.length){this.decor.set(`${x},${z}`,d);}
 }
 }
 this.land=mergeStatic(land);this.scene.add(this.land);this.terrainMeshes=this.land.children;this.scene.add(mergeStatic(details));
 // A quiet lake surrounds the cutaway landscape.
 const lake=mesh(this.scene,new THREE.CylinderGeometry(27,28,1,80),0xb3cec2,0,-1.6,0,1,1,1);lake.castShadow=false;
 const deep=mesh(this.scene,new THREE.PlaneGeometry(250,250),0xc9dcd1,0,-2.15,0);deep.rotation.x=-Math.PI/2;deep.castShadow=false;
 // Wooden footbridge on the river, with a turning water wheel.
 const bridge=new THREE.Group();bridge.position.set(7,.1,5);for(let i=0;i<16;i++)box(bridge,0xb79a6d,(i-7.5)*.16,.12,0,.145,.1,.72);for(const z of [-.4,.4]){box(bridge,C.wood,0,.46,z,2.7,.045,.045);for(const x of [-1.25,0,1.25])box(bridge,C.wood,x,.27,z,.06,.55,.06);}this.mapRoot.add(bridge);
 const wheel=new THREE.Group();wheel.position.set(6.3,.15,4.15);for(let i=0;i<10;i++){const a=i*Math.PI/5;const paddle=box(wheel,C.wood,Math.sin(a)*.46,Math.cos(a)*.46,0,.2,.08,.3);paddle.rotation.z=-a;const spoke=box(wheel,C.timber,Math.sin(a)*.24,Math.cos(a)*.24,0,.025,.49,.035);spoke.rotation.z=-a;}for(const z of [-.16,.16]){const ring=mesh(wheel,new THREE.TorusGeometry(.46,.025,5,24),C.wood,0,0,z);}this.wheel=wheel;this.mapRoot.add(wheel);
 // Scattered lilies, shoreline pebbles and a small moored boat.
 for(let z=0;z<25;z+=3){const x=19+Math.sin(z*.4);const lily=cyl(this.mapRoot,0x7f9c71,x-12,-.25,z-12,.13,.012);ball(this.mapRoot,0xf0dbac,x-12,-.22,z-12,.04,.4);}
 const boat=new THREE.Group();boat.position.set(7.4,-.19,3.4);box(boat,C.wood,0,0,0,.32,.12,.7);box(boat,0xc8a575,0,.07,0,.28,.015,.55);for(const z of [-.18,.18])box(boat,C.wood,0,.1,z,.32,.04,.08);boat.rotation.y=.2;this.mapRoot.add(boat);
 }
 buildTown(){
 if(this.town)this.scene.remove(this.town);const g=new THREE.Group();g.position.set(1,0,-2);this.scene.add(g);this.town=g;const lv=levelOf(this.state);this.townLevel=lv;
 box(g,0xc7c7a8,0,.025,0,4.6,.06,4.5);for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){if((x+z)%3===0)box(g,0xd6d4b7,x*.49,.066,z*.49,.45,.02,.45);}
 const hall=new THREE.Group();g.add(hall);hall.position.set(0,.08,-.6);house(hall,{w:1.3,d:.95,h:1.05,color:0x4a7d7c});box(hall,C.cream,0,1.1,0,.45,1.25,.45);roof(hall,0,1.72,0,.57,.42,.57);windowPane(hall,0,1.47,.242,.19);cyl(hall,0xd8bc6e,0,2.22,0,.03,.19);ball(hall,0xf0d080,0,2.33,0,.07);
 for(const [x,z,c] of [[-1.4,-1.2,0xb47e59],[1.45,-1,0x7c9271],[-1.4,1,0x6a8b80]]){const h=new THREE.Group();h.position.set(x,.08,z);house(h,{w:.78,d:.7,h:.65,color:c,chimney:true});g.add(h);}
 const fountain=new THREE.Group();fountain.position.set(.1,.08,1.1);g.add(fountain);cyl(fountain,0xb0b8a7,0,.09,0,.43,.16);cyl(fountain,0x7bbaaf,0,.18,0,.34,.02);cyl(fountain,C.stone,0,.3,0,.09,.3);ball(fountain,0xd1d6bc,0,.48,0,.12);this.fountain=fountain;
 for(const [x,z] of [[-2,-2],[2,-2],[2,1.8],[-2,1.8]]){cyl(g,C.dark,x,.46,z,.025,.83);box(g,0xe8ca7e,x,.91,z,.12,.17,.12);roof(g,x,1,z,.17,.08,.17,C.dark);}
 for(let i=0;i<5;i++){const x=-.85+i*.43;const flag=mesh(g,new THREE.ConeGeometry(.085,.17,3),[0xd3a368,0x799c8b,0xe4ce91][i%3],x,1.04-Math.sin(i/4*Math.PI)*.12,1.9);flag.rotation.z=Math.PI;}box(g,C.wood,0,1.08,1.9,2,.012,.012);
 for(const x of [-.75,.85]){box(g,C.timber,x,.19,.45,.45,.06,.15);for(const dx of [-.16,.16])box(g,C.dark,x+dx,.1,.45,.025,.18,.025);}
 if(lv>=2){const h=new THREE.Group();h.position.set(1.45,.08,1);house(h,{w:.8,d:.7,h:.7,color:C.red});g.add(h);for(let i=0;i<4;i++)ball(g,0xd5a863,1.7,.16,-.15+i*.18,.07,.5);}
 if(lv>=3){const h=new THREE.Group();h.position.set(-.7,.08,-1.7);house(h,{w:.55,d:.5,h:.9,color:C.roof});g.add(h);tree(g,1.7,.08,.1,1,.65);}
 if(lv>=4){const h=new THREE.Group();h.position.set(.9,.08,-1.7);house(h,{w:.55,d:.55,h:1.1,color:0x546f83});g.add(h);}
 this.people=[];for(let i=0;i<4+lv*2;i++){const p=new THREE.Group();cyl(p,[0x7d9d96,0xc59561,0xc48165,0xe0cf9a][i%4],0,.13,0,.055,.18);ball(p,0xe5bf91,0,.26,0,.058);mesh(p,new THREE.ConeGeometry(.07,.06,8),i%2?C.wood:C.roof,0,.32,0);g.add(p);this.people.push({mesh:p,phase:i*1.72});}
 for(const p of this.people)p.mesh.removeFromParent();g.position.set(0,0,0);const batch=mergeStatic(g);batch.position.set(1,0,-2);for(const p of this.people)batch.add(p.mesh);this.scene.remove(g);this.scene.add(batch);this.town=batch;
 }
 sync(){
 const ids=new Set(this.state.buildings.map(b=>b.id));for(const [id,m]of this.models){if(!ids.has(id)){this.scene.remove(m);this.models.delete(id);}}
 for(const b of this.state.buildings){let m=this.models.get(b.id);if(m&&(m.userData.dir!==b.dir||m.userData.level!==b.level)){this.scene.remove(m);this.models.delete(b.id);m=null;}if(!m){m=optimizeBuilding(makeBuilding(b.type,b.dir,b.level));m.position.set(b.x-12,terrain(b.x,b.z).h+.02,b.z-12);m.userData.dir=b.dir;m.userData.level=b.level;this.scene.add(m);this.models.set(b.id,m);const d=this.decor.get(b.id);if(d)d.visible=false;}}
 for(const [id,d]of this.decor)d.visible=!ids.has(id);
 if(this.decorBatch){this.scene.remove(this.decorBatch);this.decorBatch.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}const decoration=new THREE.Group();for(const d of this.decor.values())decoration.add(d);this.decorBatch=mergeStatic(decoration);this.scene.add(this.decorBatch);
 if(levelOf(this.state)!==this.townLevel)this.buildTown();
 }
 pick(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hits=this.ray.intersectObjects(this.terrainMeshes);if(!hits.length)return null;const p=hits[0].point;const x=Math.round(p.x+12),z=Math.round(p.z+12);if(x<0||x>=25||z<0||z>=25)return null;return {x,z};}
 highlight(x,z){this.selection.visible=x!==null;if(x!==null)this.selection.position.set(x-12,terrain(x,z).h+.12,z-12);}
 showGhost(type,x,z,dir,valid){
 if(!this.grid){const vertices=[];for(let xx=0;xx<SIZE;xx++)for(let zz=0;zz<SIZE;zz++){const t=terrain(xx,zz);if(t.kind==='water')continue;for(const [ax,az,bx,bz]of [[-.5,-.5,.5,-.5],[.5,-.5,.5,.5],[.5,.5,-.5,.5],[-.5,.5,-.5,-.5]])vertices.push(xx-12+ax,t.h+.023,zz-12+az,xx-12+bx,t.h+.023,zz-12+bz);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));this.grid=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x5b7965,transparent:true,opacity:.2,depthWrite:false}));this.scene.add(this.grid);}
 this.grid.visible=!!type;
 if(!type||x===null){if(this.ghost)this.ghost.visible=false;return;}
 if(!this.ghost||this.ghost.userData.ghostType!==type||this.ghost.userData.ghostDir!==dir){if(this.ghost){this.scene.remove(this.ghost);this.ghost.traverse(o=>{if(o.isMesh)o.material.dispose();});}const g=makeBuilding(type,dir);g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.55;o.userData.baseColor=o.material.color.clone();o.castShadow=false;}});g.userData.ghostType=type;g.userData.ghostDir=dir;this.scene.add(g);this.ghost=g;}
 const g=this.ghost;g.visible=true;g.position.set(x-12,terrain(x,z).h+.04,z-12);g.traverse(o=>{if(o.isMesh)o.material.color.copy(o.userData.baseColor).lerp(new THREE.Color(valid?0x9cd1a0:0xe07761),.65);});
 }
 icon(type){const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xfff3d8,0x809681,3));const l=new THREE.DirectionalLight(0xffffff,4);l.position.set(-3,6,4);scene.add(l);const m=makeBuilding(type);scene.add(m);const cam=new THREE.OrthographicCamera(-.9,.9,1.05,-.55,.1,10);cam.position.set(2.2,2.2,3);cam.lookAt(0,.4,0);const r=this.renderer;const oldSize=r.getSize(new THREE.Vector2()),oldColor=r.getClearColor(new THREE.Color());r.setSize(128,100,false);r.setClearColor(0x000000,0);r.render(scene,cam);const url=r.domElement.toDataURL('image/png');r.setSize(oldSize.x,oldSize.y,false);r.setClearColor(oldColor,1);return url;}
 update(dt,realTime){
 this.time=realTime;this.controls.update();const target=this.controls.target;target.x=THREE.MathUtils.clamp(target.x,-13,13);target.z=THREE.MathUtils.clamp(target.z,-13,13);
 if(levelOf(this.state)!==this.townLevel)this.buildTown();
 const alive=new Set();for(const b of this.state.buildings){const m=this.models.get(b.id);if(!m)continue;if(m.userData.rotor)m.userData.rotor.rotation.z-=dt*.55*(b.working?1:.25);if(m.userData.spin)m.userData.spin.rotation.y+=dt*3;
 if(b.type==='belt'&&b.item){alive.add(b.id);let entry=this.items.get(b.id);if(!entry||entry.type!==b.item){if(entry)this.scene.remove(entry.mesh);entry={type:b.item,mesh:itemModel(b.item)};this.scene.add(entry.mesh);this.items.set(b.id,entry);}const [dx,dz]=DIRS[b.dir];entry.mesh.position.set(b.x-12+dx*(b.travel-.5)*.8,terrain(b.x,b.z).h+.29,b.z-12+dz*(b.travel-.5)*.8);entry.mesh.rotation.y=-b.dir*Math.PI/2;}
 if(m.userData.smoke&&b.working&&Math.random()<dt*2){const p=m.userData.smoke;const mesh=new THREE.Mesh(sphereG,new THREE.MeshBasicMaterial({color:0xf2eddb,transparent:true,opacity:.3,depthWrite:false}));mesh.position.set(m.position.x+p.x,m.position.y+p.y,m.position.z+p.z);mesh.scale.setScalar(.065);this.scene.add(mesh);this.smoke.push({mesh,life:0});}
 }
 for(const [id,e]of this.items)if(!alive.has(id)){this.scene.remove(e.mesh);this.items.delete(id);}
 for(let i=this.smoke.length-1;i>=0;i--){const p=this.smoke[i];p.life+=dt;p.mesh.position.y+=dt*.19;p.mesh.position.x+=dt*.07;p.mesh.scale.setScalar(.06+p.life*.055);p.mesh.material.opacity=Math.max(0,.28-p.life*.085);if(p.life>3.3){this.scene.remove(p.mesh);p.mesh.material.dispose();this.smoke.splice(i,1);}}
 this.wheel.rotation.z-=dt*.3;for(let i=0;i<this.waterLines.length;i++){const w=this.waterLines[i];w.scale.x=.7+Math.sin(realTime*.8+i)*.3;}
 for(const {mesh,phase}of this.people){const t=realTime*.1+phase;mesh.position.set(Math.sin(t)*1.1,.08+Math.abs(Math.sin(realTime*4+phase))*.015,Math.cos(t)*1.35);mesh.rotation.y=-t;}
 this.renderer.render(this.scene,this.camera);
 }
 project(x,z){const p=new THREE.Vector3(x-12,terrain(x,z).h+.1,z-12).project(this.camera);return {x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight};}
}


