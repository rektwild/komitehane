import {describe,expect,it,vi} from "vitest";
vi.mock("@/config/site",()=>({isIndexableEnvironment:true,siteUrl:"https://komitehane.example"}));
vi.mock("@/lib/news/data",()=>({getNewsSitemapEntries:vi.fn().mockResolvedValue([{updatedAt:"2026-01-01T00:00:00Z",translations:[{locale:"tr",slug:"test-news"}]}])}));
vi.mock("@/lib/academic/repositories/catalog",()=>({landingCandidates:vi.fn().mockResolvedValue([{universitySlug:"fictional",facultySlug:"faculty",programSlug:"program",classYear:2,system:"COMMITTEE"}])}));
vi.mock("@/i18n/navigation",()=>({getPathname:({href,locale}:{href:string|{pathname:string;params:{slug:string}};locale:string})=>typeof href==="string"?`/${locale}${href === "/" ? "" : href}`:`/${locale}/haberler/${href.params.slug}`}));
vi.mock("@/lib/seo/metadata",()=>({getAlternateLanguages:vi.fn().mockResolvedValue({})}));
import sitemap from "../../app/sitemap";
describe("academic sitemap",()=>{
  it("includes the four general tools, eligible academic paths and existing news",async()=>{
    const entries=await sitemap();const urls=entries.map(entry=>entry.url);
    expect(urls.filter(url=>url.includes("/fictional/")).length).toBe(4);
    expect(urls.some(url=>url.endsWith("/tr/haberler/test-news"))).toBe(true);
    expect(urls.some(url=>url.includes("/tr/araclar/komite-not-hesaplama/fictional/"))).toBe(true);
    expect(urls.some(url=>url.includes("/fictional/") && url.includes("vize"))).toBe(false);
  });
});
