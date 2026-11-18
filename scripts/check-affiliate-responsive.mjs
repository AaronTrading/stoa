import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const base=process.env.STOA_PREVIEW_URL||'http://127.0.0.1:4173';
const sizes=[['mobile',375,812],['tablette',820,1180],['bureau',1440,960]];
const browser=await chromium.launch({headless:true});
const results=[];
try{
  for(const [name,width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},javaScriptEnabled:false,colorScheme:'dark'});
    await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,route=>route.abort());
    const page=await context.newPage();
    const response=await page.goto(`${base}/affiliation`,{waitUntil:'domcontentloaded'});
    assert.ok(response?.ok(),`${name}: la page ne répond pas correctement`);
    await page.evaluate(()=>{document.documentElement.classList.remove('academy-access-pending');document.documentElement.classList.add('stoa-dark');document.body.classList.add('academy-experience');document.querySelector('.site-header').style.display='none';});
    const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,mainWidth:document.querySelector('main')?.getBoundingClientRect().width||0,bodyClass:document.body.className,headerDisplay:getComputedStyle(document.querySelector('.site-header')).display,offenders:[...document.querySelectorAll('body *')].map(node=>({tag:node.tagName,className:String(node.className||''),right:Math.round(node.getBoundingClientRect().right),width:Math.round(node.getBoundingClientRect().width)})).filter(item=>item.right>innerWidth+2).sort((a,b)=>b.right-a.right).slice(0,8)}));
    await page.screenshot({path:`test-results/affiliation-${name}.png`,fullPage:true});
    if(metrics.scrollWidth>metrics.clientWidth+1)console.error(JSON.stringify(metrics,null,2));
    assert.ok(metrics.scrollWidth<=metrics.clientWidth+1,`${name}: débordement horizontal ${metrics.scrollWidth}/${metrics.clientWidth} ${JSON.stringify(metrics.offenders)}`);
    assert.ok(metrics.mainWidth>0&&metrics.mainWidth<=metrics.clientWidth+1,`${name}: largeur principale invalide`);
    results.push({name,width,height,...metrics});
    await context.close();
  }
}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));
