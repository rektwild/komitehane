import {afterEach,describe,expect,it,vi} from "vitest";

type Rule={userAgent?:string|string[];allow?:string|string[];disallow?:string|string[]};

async function loadRobots(allowTraining:boolean) {
  vi.resetModules();
  vi.doMock("@/config/site",()=>({
    allowModelTrainingCrawlers:allowTraining,
    isIndexableEnvironment:true,
    siteConfig:{locales:["tr","en"]},
    siteUrl:"https://komitehane.example",
  }));
  vi.doMock("@/lib/seo/urls",()=>({absoluteUrl:(path:string)=>`https://komitehane.example${path}`}));
  const {default:robots}=await import("../../app/robots");
  const rules=robots().rules as Rule[];
  return (agent:string)=>rules.find(rule=>rule.userAgent===agent);
}

afterEach(()=>{vi.doUnmock("@/config/site");vi.doUnmock("@/lib/seo/urls");});

describe("robots policy",()=>{
  it("allows search, AI answer engines and Google-Extended on public content",async()=>{
    const rule=await loadRobots(false);
    for (const agent of ["Googlebot","bingbot","Google-Extended","OAI-SearchBot","ChatGPT-User","PerplexityBot","Claude-SearchBot","Claude-User","Applebot","Amzn-SearchBot","DuckAssistBot"]) {
      expect(rule(agent)?.allow,agent).toBe("/");
      expect(rule(agent)?.disallow,agent).toContain("/admin/");
    }
  });
  it("blocks model-training crawlers by default",async()=>{
    const rule=await loadRobots(false);
    for (const agent of ["GPTBot","ClaudeBot","CCBot","Applebot-Extended","meta-externalagent","FacebookBot","Bytespider","Amazonbot","cohere-training-data-crawler","AI2Bot","Ai2Bot-Dolma"]) {
      expect(rule(agent),agent).toEqual({userAgent:agent,disallow:"/"});
    }
  });
  it("opens training crawlers only when explicitly allowed",async()=>{
    const rule=await loadRobots(true);
    expect(rule("GPTBot")?.allow).toBe("/");
    expect(rule("CCBot")?.allow).toBe("/");
  });
});
