import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const executablePath=process.env.BROWSER_EXECUTABLE;
if (!executablePath) throw new Error("BROWSER_EXECUTABLE is required");
const mode=process.argv[2];if(!["manual","official"].includes(mode))throw new Error("Expected manual or official mode");
const base=process.env.SEO_AUDIT_BASE_URL || "http://localhost:3000";
const browser=await chromium.launch({executablePath,headless:true,args:["--no-sandbox"]});
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
async function makePage() {
  const context=await browser.newContext();const page=await context.newPage();
  await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.abort());
  return {context,page};
}
async function open(page,path) {const response=await page.goto(base+path,{waitUntil:"domcontentloaded"});assert.equal(response?.status(),200,`Expected 200 for ${path}`);}
async function option(page,selector,value) {await page.waitForFunction(([s,v])=>Boolean(document.querySelector(s)?.querySelector(`option[value="${v}"]`)),[selector,value]);await page.locator(selector).selectOption(value);}
async function numberValue(page,selector,value) {await page.waitForFunction(([s,v])=>Number(document.querySelector(s)?.value?.replace(",","."))===v,[selector,value]);}
async function chooseCommittee(page) {
  await option(page,"#academic-university",id(1));await option(page,"#academic-faculty",id(2));await option(page,"#academic-program",id(3));await option(page,"#academic-class","2");
  await page.getByRole("button",{name:"Resmi oranlara dön"}).waitFor();
}
try {
  if(mode==="manual") {
    const {context,page}=await makePage();
    await context.addInitScript(()=>{const key="komitehane:grade-calculator:committeeGrade:v1";if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,assessmentCount:1,rows:[{grade:"70",weight:"40"}],passingGrade:"60",finalGrade:"50"}));});
    const paths=["/tr/araclar/komite-not-hesaplama","/tr/araclar/komite-minimum-final-notu","/tr/araclar/vize-not-hesaplama","/tr/araclar/vize-minimum-final-notu","/en/tools/committee-grade-calculator","/en/tools/committee-minimum-final-grade","/en/tools/midterm-grade-calculator","/en/tools/midterm-minimum-final-grade"];
    for(const path of paths)await open(page,path);
    await open(page,paths[0]);await page.getByText("Akademik veri kullanılamıyor",{exact:false}).waitFor();
    await numberValue(page,"#calculator-committeeGrade-assessment-0-grade",70);await numberValue(page,"#calculator-committeeGrade-final-grade",50);
    assert.ok(await page.evaluate(()=>localStorage.getItem("komitehane:grade-calculator:committeeGrade:v1")),"Legacy input must be preserved");
    await page.locator("#calculator-committeeGrade-assessment-0-grade").fill("80");await page.locator("#calculator-committeeGrade-assessment-0-weight").fill("40");await page.locator("#calculator-committeeGrade-final-grade").fill("60");
    await page.locator('form button[type="submit"]').click();await page.locator('[aria-labelledby="calculator-committeeGrade-result-title"]').getByText("68",{exact:true}).waitFor();
    await context.close();
    const privateContext=await browser.newContext();await privateContext.addInitScript(()=>{Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked")}})});const privatePage=await privateContext.newPage();
    await privatePage.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.abort());await open(privatePage,paths[0]);await privatePage.getByText("Akademik veri kullanılamıyor",{exact:false}).waitFor();
    await privatePage.locator("#calculator-committeeGrade-assessment-0-grade").fill("80");await privatePage.locator("#calculator-committeeGrade-assessment-0-weight").fill("40");await privatePage.locator("#calculator-committeeGrade-final-grade").fill("60");
    await privatePage.locator('form button[type="submit"]').click();await privatePage.locator('[aria-labelledby="calculator-committeeGrade-result-title"]').getByText("68",{exact:true}).waitFor();await privateContext.close();
    console.log("Browser: eight generic tools, legacy input recovery, manual calculation and unavailable localStorage passed.");
  } else {
    const {context,page}=await makePage();await open(page,"/tr/araclar/komite-not-hesaplama");
    await page.waitForFunction(v=>Boolean(document.querySelector(`#academic-university option[value="${v}"]`)),id(1));
    await page.locator("#calculator-committeeGrade-assessment-0-grade").fill("80");await page.locator("#calculator-committeeGrade-final-grade").fill("60");
    await chooseCommittee(page);await numberValue(page,"#calculator-committeeGrade-assessment-0-weight",40);await numberValue(page,"#calculator-committeeGrade-final-weight",60);
    await page.getByRole("button",{name:"Manuel notlarımı taşı"}).click();await page.locator('form button[type="submit"]').click();
    await page.locator('[aria-labelledby="calculator-committeeGrade-result-title"]').getByText("68",{exact:true}).waitFor();
    await page.locator("#calculator-committeeGrade-assessment-0-weight").fill("45");await page.locator("#calculator-committeeGrade-final-weight").fill("55");await page.getByText("Değiştirilmiş kişisel oranlar").waitFor();
    await page.reload({waitUntil:"domcontentloaded"});await chooseCommittee(page);await numberValue(page,"#calculator-committeeGrade-assessment-0-weight",45);await numberValue(page,"#calculator-committeeGrade-final-weight",55);
    await page.getByRole("button",{name:"Resmi oranlara dön"}).click();await numberValue(page,"#calculator-committeeGrade-assessment-0-weight",40);await numberValue(page,"#calculator-committeeGrade-final-weight",60);
    await page.evaluate(()=>{const key=[...Array(localStorage.length)].map((_,i)=>localStorage.key(i)).find(k=>k?.startsWith("komitehane:calculator:v2:committeeGrade:00000000-0000-4000-8000-000000000003:") && !k.endsWith(":manual"));if(!key)throw new Error("No saved current version");const old=JSON.parse(localStorage.getItem(key));old.rows[0].weight="39";old.finalWeight="61";old.updatedAt=Date.now()+1000;localStorage.setItem(key.slice(0,key.lastIndexOf(":")+1)+"00000000-0000-4000-8000-000000000099",JSON.stringify(old));});
    await page.getByRole("button",{name:"Önceki sürümdeki ayarlarımı getir"}).click();await numberValue(page,"#calculator-committeeGrade-assessment-0-weight",39);await numberValue(page,"#calculator-committeeGrade-final-weight",61);
    await page.getByRole("button",{name:"Resmi oranlara dön"}).click();await numberValue(page,"#calculator-committeeGrade-final-weight",60);
    await page.getByRole("link",{name:"Üniversiteye özel sayfayı aç"}).click();await page.waitForURL("**/tr/araclar/komite-not-hesaplama/fictional-test/faculty/program/2-sinif");
    await page.locator('button[aria-label="Dil seçin"]:visible').first().click();await page.getByRole("menuitem",{name:"English"}).click();await page.waitForURL("**/en/tools/committee-grade-calculator");
    await open(page,"/tr/araclar/vize-minimum-final-notu");await option(page,"#academic-university",id(1));await option(page,"#academic-faculty",id(102));await option(page,"#academic-program",id(103));await option(page,"#academic-class","2");await option(page,"#academic-period","FALL");await option(page,"#academic-course",id(104));
    await page.getByRole("button",{name:"Resmi oranlara dön"}).waitFor();await numberValue(page,"#calculator-midtermMinimumFinal-assessment-0-weight",35);await numberValue(page,"#calculator-midtermMinimumFinal-final-weight",65);
    await context.close();console.log("Browser: official committee and course rules, overrides, persistence, version recovery, reset, URL and locale fallback passed.");
  }
} finally {await browser.close();}
