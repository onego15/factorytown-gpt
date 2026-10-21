import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1280,height:720}});
await p.goto('http://127.0.0.1:5173');await p.waitForFunction(()=>window.komorebi);await p.waitForTimeout(600);
const stats=await p.locator('#stats-button').boundingBox(),dock=await p.locator('.build-dock').boundingBox();assert.ok(stats.y+stats.height<dock.y,'left panel must end above build dock');
const xy=await p.evaluate(()=>komorebi.project(9,15));await p.mouse.click(xy.x,xy.y);const panel=await p.locator('#inspector').boundingBox();assert.ok(panel.y+panel.height<dock.y,'inspector must end above build dock');await p.locator('#upgrade').click();assert.equal(await p.evaluate(()=>komorebi.state.buildings.find(b=>b.id==='9,15').level),2);await p.screenshot({path:'docs/compact.png'});console.log('PASS 720px layout: objective, report button, inspector and upgrade remain accessible');await b.close();
