import {chromium} from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('docs/frames',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
// Resume the save produced by actual UI testing. No synthetic game state or rendered frames.
const save=fs.readFileSync('docs/test-save.json','utf8');
await page.addInitScript(raw=>localStorage.setItem('komorebi-save-v1',raw),save);
await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.komorebi);await page.waitForTimeout(1200);
await page.locator('[data-speed="1"]').click();
await page.keyboard.press('KeyX');for(const x of [10,11,12]){const p=await page.evaluate(x=>komorebi.project(x,18),x);await page.mouse.click(p.x,p.y);}await page.keyboard.press('Escape');
const timings=[];let last=Date.now();
for(let i=0;i<100;i++){
 if(i===12){const p=await page.evaluate(()=>komorebi.project(9,15));await page.mouse.click(p.x,p.y);}
 if(i===35){await page.locator('#inspector .close').click();await page.mouse.move(750,500);await page.mouse.wheel(0,-180);}
 if(i===65){await page.mouse.move(760,570);await page.mouse.down({button:'right'});await page.mouse.move(810,570,{steps:12});await page.mouse.up({button:'right'});}
 if(i===85){await page.locator('#home').click();}
 await page.screenshot({path:`docs/frames/${String(i).padStart(3,'0')}.png`});const now=Date.now();timings.push(now-last);last=now;await page.waitForTimeout(100);
}
fs.writeFileSync('docs/frames/timing.json',JSON.stringify(timings));
await page.screenshot({path:'docs/gameplay.png'});
const perf=await page.evaluate(()=>new Promise(resolve=>{const times=[];let prev=performance.now();function f(now){times.push(now-prev);prev=now;if(times.length<100)requestAnimationFrame(f);else resolve({frames:100,meanFrameMs:times.reduce((a,b)=>a+b,0)/100,drawCalls:komorebi.world.renderer.info.render.calls,triangles:komorebi.world.renderer.info.render.triangles,viewport:[innerWidth,innerHeight],userAgent:navigator.userAgent});}requestAnimationFrame(f);}));
fs.writeFileSync('docs/performance.json',JSON.stringify(perf,null,2));console.log(perf);await browser.close();
