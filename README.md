# Komitehane

Komitehane — modern, çok dilli bir web uygulaması.

Next.js 16.3.0 (App Router, Turbopack) + React 19 + Tailwind CSS v4 + shadcn/ui + next-intl.

## Komutlar

- `pnpm dev` — geliştirme sunucusu
- `pnpm lint` — ESLint
- `pnpm build` — production build (TypeScript kontrolü dahil)
- `pnpm start` — production sunucusu
- `pnpm seo:audit` — SEO denetimi (çalışan sunucu gerektirir, bkz. `docs/SEO.md`)

pnpm kullanılır; npm/yarn çalıştırılmaz.

## Uluslararasılaştırma

- Yerel ayarlar `i18n/routing.ts` içinde tanımlıdır
- Çeviriler `messages/<locale>.json` içindedir; arayüz dizeleri UI bileşenlerine hardcode edilmez
- Mesaj düzenledikten sonra `pnpm exec next typegen` çalıştırın
- Yerelleştirilmiş sayfalarda `@/i18n/navigation` yardımcıları kullanılır (`next/link` değil)

## SEO

- Spesifikasyon: `docs/SEO.md`
- Dizinleme `config/site.ts` içindeki `isIndexableEnvironment` ile denetlenir
- `pnpm seo:audit` ile doğrulama yapılır

## Yapı

- `app/[locale]/` — yerelleştirilmiş sayfalar ve düzen
- `components/` — UI bileşenleri
- `config/` — site yapılandırması
- `i18n/` — next-intl yapılandırması
- `lib/seo/` — SEO yardımcıları (metadata, JSON-LD, IndexNow)
