export const ITEMS = {log:{name:'原木',color:0xb27543,icon:'▰'},plank:{name:'木板',color:0xe5ba72,icon:'▤'},grain:{name:'小麦',color:0xf4cb58,icon:'✦'},flour:{name:'小麦粉',color:0xf3e8bf,icon:'◈'},bread:{name:'パン',color:0xd58c3f,icon:'◒'},ore:{name:'鉄鉱石',color:0x7f93a0,icon:'◆'},iron:{name:'鉄材',color:0xb4c8cc,icon:'▬'},gear:{name:'歯車',color:0xd3aa63,icon:'⚙'}};
export const TYPES = {
 lumber:{name:'伐採所',icon:'♠',category:'production',cost:45,time:4,out:'log',description:'森のそばで原木を切り出します。',terrain:'forest'},
 farm:{name:'小麦農場',icon:'♧',category:'production',cost:55,time:5,out:'grain',description:'黄金色の小麦を育てます。'},
 mine:{name:'採掘場',icon:'◆',category:'production',cost:75,time:5,out:'ore',description:'岩場から鉄鉱石を採掘します。',terrain:'rock',research:1},
 belt:{name:'コンベア',icon:'⇢',category:'logistics',cost:4,description:'矢印の方向へ品物を1個ずつ搬送。曲がり角では R で向きを変更。'},
 market:{name:'集荷所',icon:'⚑',category:'logistics',cost:40,description:'木板・パン・歯車を街へ届け、資金と成長を生みます。'},
 sawmill:{name:'製材所',icon:'▤',category:'processing',cost:65,time:4,input:'log',out:'plank',description:'原木を暮らしに役立つ木板へ。'},
 mill:{name:'風車製粉所',icon:'✣',category:'processing',cost:70,time:4,input:'grain',out:'flour',description:'風の力で小麦を挽きます。'},
 bakery:{name:'パン工房',icon:'◒',category:'processing',cost:80,time:5,input:'flour',out:'bread',description:'小麦粉から焼きたてのパンを。'},
 furnace:{name:'製鉄所',icon:'♨',category:'processing',cost:90,time:5,input:'ore',out:'iron',research:1,description:'鉱石を溶かし、丈夫な鉄材に。'},
 workshop:{name:'機械工房',icon:'⚙',category:'processing',cost:100,time:6,input:'iron',out:'gear',research:1,description:'鉄材から街を動かす歯車をつくります。'},
 road:{name:'小径',icon:'≋',category:'logistics',cost:2,description:'街を彩る石畳の小径。物流はコンベアを使います。'}
};
export const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
export const SIZE=25;
export function terrain(x,z){
 if(x<0||z<0||x>=SIZE||z>=SIZE) return {kind:'void',h:-1};
 const river=19+Math.sin(z*.4)*1.1;
 if(Math.abs(x-river)<1.05) return {kind:'water',h:-.32};
 if((x<2&&z<3)||(x>22&&z>22))return {kind:'water',h:-.32};
 const hill=z<5?Math.max(0,Math.floor((5-z)/2))*.4:0;
 const kind=(x<6&&z<13)?'forest':(z<8&&x>10&&x<18)?'rock':'grass';
 return {kind,h:hill};
}
export function createBuilding(type,x,z,dir=0){return {id:`${x},${z}`,type,x,z,dir,level:1,input:0,output:0,progress:0,working:false,item:null,travel:0,produced:0};}
export function initialState(){
 const s={version:1,coins:420,xp:0,research:0,time:0,delivered:{plank:0,bread:0,gear:0},produced:{},buildings:[],paused:false,speed:1};
 const add=(t,x,z,d=0)=>s.buildings.push(createBuilding(t,x,z,d));
 add('lumber',3,10);add('sawmill',6,10);add('market',9,10);[4,5,7,8].forEach(x=>add('belt',x,10));
 add('farm',3,15);add('mill',6,15);add('bakery',9,15);add('market',12,15);[4,5,7,8,10,11].forEach(x=>add('belt',x,15));
 add('road',10,10);add('road',12,13);add('road',12,14);
 return s;
}
export const levelOf=s=>s.xp>=260?4:s.xp>=110?3:s.xp>=30?2:1;
export function canPlace(s,type,x,z){
 const t=TYPES[type],land=terrain(x,z);if(!t)return '建物を選んでください';
 if(land.kind==='void'||land.kind==='water')return '水面には建設できません';
 if(x>=11&&x<=15&&z>=8&&z<=12)return '街の広場です';
 if(s.buildings.some(b=>b.x===x&&b.z===z))return 'すでに建物があります';
 if(t.research&&!s.research)return '「鉄の時代」の研究が必要です';
 if(t.terrain&&land.kind!==t.terrain)return t.terrain==='forest'?'森林のマスに建設してください':'北側の岩場に建設してください';
 if(s.coins<t.cost)return '資金が足りません';return null;
}
export function place(s,type,x,z,dir){const error=canPlace(s,type,x,z);if(error)return {error};const b=createBuilding(type,x,z,dir);s.coins-=TYPES[type].cost;s.buildings.push(b);return {building:b};}
export function remove(s,id){const i=s.buildings.findIndex(b=>b.id===id);if(i<0)return false;const b=s.buildings[i];s.coins+=Math.floor(TYPES[b.type].cost*.5);s.buildings.splice(i,1);return true;}
export function upgrade(s,id){const b=s.buildings.find(b=>b.id===id);if(!b||!TYPES[b.type].time||b.level>=3)return false;const cost=40*b.level;if(s.coins<cost)return false;s.coins-=cost;b.level++;return true;}
export function research(s){if(s.research||s.delivered.plank<5||s.delivered.bread<5||s.coins<120)return false;s.coins-=120;s.research=1;return true;}
export function accepts(b,item){if(!b)return false;if(b.type==='belt')return !b.item;if(b.type==='market')return ['plank','bread','gear'].includes(item)&&b.input<8;return TYPES[b.type].input===item&&b.input<5;}
export function step(s,dt){
 s.time+=dt;const map=new Map(s.buildings.map(b=>[b.id,b]));
 function send(b,item){const [dx,dz]=DIRS[b.dir],dest=map.get(`${b.x+dx},${b.z+dz}`);if(!accepts(dest,item)||Math.abs(terrain(b.x,b.z).h-terrain(dest.x,dest.z).h)>.41)return false;if(dest.type==='belt'){dest.item=item;dest.travel=0;}else if(dest.type==='market'){s.delivered[item]++;s.xp+=item==='gear'?4:item==='bread'?2:1;s.coins+=item==='gear'?12:item==='bread'?7:4;dest.produced++;dest.progress=1;}else dest.input++;return true;}
 // Process belts from a snapshot; a newly received item never teleports through several belts.
 const moving=s.buildings.filter(b=>b.type==='belt'&&b.item).map(b=>({b,item:b.item}));
 for(const {b,item} of moving){b.travel=Math.min(1,b.travel+dt*1.2);if(b.travel>=1&&send(b,item)){b.item=null;b.travel=0;}}
 for(const b of s.buildings){const t=TYPES[b.type];if(!t.time){if(b.type==='market')b.progress=Math.max(0,b.progress-dt);continue;}
 if(b.output>0&&send(b,t.out))b.output--;
 if(!b.working&&b.output<3&&(!t.input||b.input>0)){if(t.input)b.input--;b.working=true;b.progress=0;}
 if(b.working){b.progress+=dt*(1+(b.level-1)*.6)/t.time;if(b.progress>=1){b.progress=0;b.working=false;b.output++;b.produced++;s.produced[t.out]=(s.produced[t.out]||0)+1;}}
 }
}
export function status(b){const t=TYPES[b.type];if(b.type==='belt')return b.item?'搬送中':'搬入待ち';if(b.type==='market')return '街へ供給中';if(b.type==='road')return '街の小径';if(b.output>=3)return '搬出先が詰まっています';if(b.working)return '生産中';return t.input?'原材料を待っています':'稼働準備中';}
export function serialize(s){return JSON.stringify(s);}
export function deserialize(raw){const s=JSON.parse(raw);if(s.version!==1||!Array.isArray(s.buildings)||!Number.isFinite(s.coins)||!Number.isFinite(s.xp)||!s.delivered||s.buildings.some(b=>!TYPES[b.type]||!Number.isInteger(b.dir)||b.dir<0||b.dir>3||!Number.isFinite(b.x)||!Number.isFinite(b.z)))throw Error('保存データを読み込めません');s.paused=false;return s;}
