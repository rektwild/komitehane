import {afterEach,describe,expect,it,vi} from "vitest";
import {academicConnection} from "../../scripts/academic/connections";
afterEach(()=>vi.unstubAllEnvs());
describe("academic test database safety guard",()=>{
  it("refuses nonlocal servers and incorrect database names before connecting",()=>{
    vi.stubEnv("ACADEMIC_TEST_DATABASE_URL","postgresql://test:test@example.test/komitehane_academic_test");
    expect(()=>academicConnection("test")).toThrow("TEST_DATABASE_MUST_BE_LOCAL");
    vi.stubEnv("ACADEMIC_TEST_DATABASE_URL","postgresql://test:test@127.0.0.1/blog");
    expect(()=>academicConnection("test")).toThrow("TEST_DATABASE_MUST_BE_LOCAL");
  });
  it("requires a verified CA for writer connections",()=>{
    vi.stubEnv("ACADEMIC_WRITER_DATABASE_URL","postgresql://test:test@127.0.0.1/komitehane_academic");
    vi.stubEnv("ACADEMIC_POSTGRES_CA_CERT_BASE64","");
    expect(()=>academicConnection("writer")).toThrow("ACADEMIC_POSTGRES_CA_CERT_BASE64_REQUIRED");
  });
});
