/**
 * Tıp programs at KKTC universities placed by ÖSYM 2026 (Tablo-4,
 * https://dokuman.osym.gov.tr/web/2026/7/tablo-4-hohu0j-30164357.xls). The
 * research export left KKTC institutions out of scope; they are catalogued
 * (inactive) like every other medical program. No grading rule is included.
 */
export const KKTC_MEDICAL = [
  {university: "Yakın Doğu Üniversitesi", faculty: "Tıp Fakültesi", programs: [{name: "Tıp", slug: "tip"}, {name: "Tıp (İngilizce)", slug: "tip-ingilizce"}]},
  {university: "Girne Üniversitesi", faculty: "Tıp Fakültesi", programs: [{name: "Tıp", slug: "tip"}]},
  {university: "Doğu Akdeniz Üniversitesi", faculty: "Tıp Fakültesi", programs: [{name: "Tıp (İngilizce) (UOLP-Marmara Üniversitesi)", slug: "tip-ingilizce-uolp-marmara-universitesi"}]},
] as const;
