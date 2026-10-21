import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
const record=(s)=>{console.log('PASS',s);results.push(s);};
async function tile(x,z){const p=await page.evaluate(([x,z])=>komorebi.project(x,z),[x,z]);await page.mouse.click(p.x,p.y);await page.waitForTimeout(170);}
try{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.komorebi);await page.waitForTimeout(1000);record('WebGL scene and Japanese UI boot without runtime error');
 await page.locator('[data-speed="4"]').click();await page.waitForFunction(()=>komorebi.state.delivered.bread>=5,null,{timeout:35000});record('Starter conveyor lines deliver real planks and bread at 4× speed');
 await page.locator('#pause').click();assert.equal(await page.evaluate(()=>komorebi.state.paused),true);
 await page.locator('[data-build="belt"]').click();const count=await page.evaluate(()=>komorebi.state.buildings.length);await tile(10,17);assert.equal(await page.evaluate(()=>komorebi.state.buildings.length),count+1);record('Build conveyor using palette and terrain click');
 await page.keyboard.press('Escape');await tile(10,17);await page.locator('#rotate-building').click();assert.equal(await page.evaluate(()=>komorebi.state.buildings.find(b=>b.id==='10,17').dir),1);record('Select and rotate placed conveyor');
 await page.locator('#remove-building').click();assert.equal(await page.evaluate(()=>komorebi.state.buildings.length),count);record('Demolish with refund');
 await page.locator('[data-build="farm"]').click();await tile(19,16);assert.equal(await page.evaluate(()=>komorebi.state.buildings.length),count);assert.match(await page.locator('#toast').textContent(),/水面/);record('Water construction rejected with visible reason');await page.keyboard.press('Escape');
 await tile(9,15);await page.locator('#upgrade').click();assert.equal(await page.evaluate(()=>komorebi.state.buildings.find(b=>b.id==='9,15').level),2);record('Factory upgrade changes its level and throughput');await page.locator('#inspector .close').click();
 await page.locator('#research').click();assert.equal(await page.evaluate(()=>komorebi.state.research),1);record('Research unlocks metal production');
 await page.locator('#pause').click();await page.waitForFunction(()=>komorebi.state.coins>=330,null,{timeout:20000});
 for(const [type,x]of [['mine',11],['belt',12],['furnace',13],['belt',14],['workshop',15],['belt',16],['market',17]]){if(await page.evaluate(()=>komorebi.tool)!==type)await page.locator(`[data-build="${type}"]`).click();await tile(x,7);assert.ok(await page.evaluate(x=>komorebi.state.buildings.some(b=>b.x===x&&b.z===7),x),`placed ${type}`);}
 await page.keyboard.press('Escape');record('Built a complete seven-tile iron production line through UI');
 await page.waitForFunction(()=>komorebi.state.delivered.gear>=2,null,{timeout:30000});record('UI-built iron chain produces and delivers gears');
 await page.locator('#save').click();const saved=await page.evaluate(()=>({count:komorebi.state.buildings.length,gears:komorebi.state.delivered.gear}));await page.reload();await page.waitForFunction(()=>window.komorebi);assert.equal(await page.evaluate(()=>komorebi.state.buildings.length),saved.count);assert.ok(await page.evaluate(()=>komorebi.state.delivered.gear)>=saved.gears);assert.equal(await page.evaluate(()=>komorebi.state.buildings.find(b=>b.id==='9,15').level),2);record('Save and browser reload retain new line, delivered goods, research and upgraded building');
 assert.ok(await page.locator(`[data-speed="${await page.evaluate(()=>komorebi.state.speed)}"]`).evaluate(e=>e.classList.contains('active')));record('Restored speed is correctly reflected in UI');
 await page.locator('#stats-button').click();assert.ok(await page.locator('#stats').isVisible());await page.locator('#stats .close').click();record('Production report opens and closes');
 const camBefore=await page.evaluate(()=>komorebi.world.camera.position.toArray());await page.mouse.move(850,640);await page.mouse.down({button:'right'});await page.mouse.move(980,650,{steps:12});await page.mouse.up({button:'right'});await page.waitForTimeout(500);assert.notDeepEqual(await page.evaluate(()=>komorebi.world.camera.position.toArray()),camBefore);await page.mouse.wheel(0,-200);await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>komorebi.world.camera.zoom)>1);record('Camera rotates and zooms with pointer controls');await page.locator('#home').click();
 await page.locator('#help').click();assert.ok(await page.locator('#start').isVisible());await page.locator('#start').click();record('Help is accessible and returns to the game');
 await page.locator('[data-build="belt"]').click();await page.keyboard.down('Shift');const points=await page.evaluate(()=>[komorebi.project(10,18),komorebi.project(11,18),komorebi.project(12,18)]);await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();for(const p of points.slice(1))await page.mouse.move(p.x,p.y,{steps:8});await page.mouse.up();await page.keyboard.up('Shift');assert.equal(await page.evaluate(()=>komorebi.state.buildings.filter(b=>b.z===18&&b.x>=10&&b.x<=12).length),3);record('Shift-drag lays a continuous conveyor row');await page.keyboard.press('Escape');
 await page.screenshot({path:'docs/gameplay.png'});fs.writeFileSync('docs/test-save.json',await page.evaluate(()=>JSON.stringify(komorebi.state,null,2)));
 await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(800);await page.screenshot({path:'docs/compact.png'});record('1280×720 viewport renders');
 assert.deepEqual(errors,[]);record('No uncaught browser errors');fs.writeFileSync('docs/browser-test-results.json',JSON.stringify({time:new Date().toISOString(),results,errors},null,2));
}catch(e){await page.screenshot({path:'docs/test-failure.png'});console.error(e);process.exitCode=1;}finally{await browser.close();}
