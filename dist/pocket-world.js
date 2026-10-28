export const POCKET_WORLD={width:360,height:400};
export const POCKET_STATIONS={patient:{x:121,y:173,label:'Patient'},pump:{x:269,y:214,label:'Infusion'},aline:{x:111,y:307,label:'A-line tray'}};
const obstacles=[{x:42,y:70,w:106,h:79},{x:260,y:118,w:48,h:57},{x:42,y:251,w:104,h:37}];
export function pocketCanWalk(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=16&&x<=344&&y>=35&&y<=385&&!obstacles.some(r=>x>r.x-9&&x<r.x+r.w+9&&y>r.y-9&&y<r.y+r.h+9);}
export function pocketMove(player,x,y,seconds){const n=Math.max(1,Math.hypot(x,y));for(let left=Math.max(0,Math.min(Number(seconds)||0,1));left>.00001;){const dt=Math.min(left,.025),nx=player.x+x/n*145*dt,ny=player.y+y/n*145*dt;if(pocketCanWalk(nx,player.y))player.x=nx;if(pocketCanWalk(player.x,ny))player.y=ny;left-=dt;}}
export function pocketNear(player,target,range=53){const p=typeof target==='string'?POCKET_STATIONS[target]:target;return !!p&&Math.hypot(player.x-p.x,player.y-p.y)<=range;}
export function pocketRoute(player,target){
  const columns=18,rows=20,key=(x,y)=>y*columns+x;
  const cell=p=>{let best=null;for(let y=2;y<rows-1;y++)for(let x=1;x<columns-1;x++){if(!pocketCanWalk(x*20+10,y*20+10))continue;const d=Math.hypot(x*20+10-p.x,y*20+10-p.y);if(!best||d<best.d)best={x,y,d};}return best;};
  const a=cell(player),b=cell(target);if(!a||!b)return [];
  const from=key(a.x,a.y),to=key(b.x,b.y),queue=[from],prior=new Map([[from,null]]);
  for(let i=0;i<queue.length&&!prior.has(to);i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const at=queue[i],x=at%columns+dx,y=Math.floor(at/columns)+dy,k=key(x,y);if(x<1||x>=columns-1||y<2||y>=rows-1||prior.has(k)||!pocketCanWalk(x*20+10,y*20+10))continue;prior.set(k,at);queue.push(k);}
  if(!prior.has(to))return [];const path=[];for(let k=to;k!==null;k=prior.get(k))path.push({x:k%columns*20+10,y:Math.floor(k/columns)*20+10});return path.reverse();
}
