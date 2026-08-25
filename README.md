# Komitehane

Komitehane — modern, çok dilli bir web uygulaması.

Next.js 16.3.0 (App Router, Turbopack) + React 19 + Tailwind CSS v4 + shadcn/ui + next-intl + Payload CMS 3.88.

## Komutlar

- `pnpm dev` — geliştirme sunucusu
- `pnpm lint` — ESLint
- `pnpm build` — production build (TypeScript kontrolü dahil)
- `pnpm build:vercel` — önce PostgreSQL migration'larını, ardından production build'i çalıştırır
- `pnpm start` — production sunucusu
- `pnpm payload:types` — Payload koleksiyon tiplerini üretir
- `pnpm payload:importmap` — Payload admin import map'ini üretir
- `pnpm payload:migrate:create <ad>` — yeni PostgreSQL migration'ı üretir
- `pnpm payload:migrate` — bekleyen migration'ları uygular
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

## Haberler ve Payload CMS

- Yönetim paneli `/admin`, REST API `/api`, haberler `/tr/haberler` ve `/en/news` altındadır.
- `users`, `media`, `categories` ve `articles` koleksiyonları `collections/` altında tanımlıdır.
- Haberler taslak/sürüm, TR/EN yerelleştirme, Vercel Blob görselleri ve PostgreSQL migration'ları kullanır.
- Gerekli ortam değişkenleri: `DATABASE_URL`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_MEDIA_HOSTNAME` ve production'da `NEXT_PUBLIC_SITE_URL`.
- İlk kurulumda `pnpm payload:migrate` çalıştırın, `/admin` üzerinden ilk yöneticiyi oluşturun; ardından kategori, medya ve iki dilde haber ekleyin.
- Preview ve production deployment'larında ayrı PostgreSQL ve Blob kaynakları kullanın.

## Yapı

- `app/[locale]/` — yerelleştirilmiş sayfalar ve düzen
- `components/` — UI bileşenleri
- `config/` — site yapılandırması
- `i18n/` — next-intl yapılandırması
- `lib/seo/` — SEO yardımcıları (metadata, JSON-LD, IndexNow)
- `lib/news/` — Payload Local API tabanlı, normalize edilmiş haber veri katmanı
- `collections/`, `payload.config.ts`, `migrations/` — CMS şeması ve migration'lar
