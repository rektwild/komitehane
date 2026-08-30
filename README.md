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
- Haberler taslak/sürüm, TR/EN yerelleştirme, Cloudflare R2 görselleri ve PostgreSQL migration'ları kullanır.
- Gerekli ortam değişkenleri: runtime için pooled `DATABASE_URL`, migration için direct `DATABASE_URL_UNPOOLED`, `PAYLOAD_SECRET`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`, `NEXT_PUBLIC_MEDIA_HOSTNAME` ve production'da `NEXT_PUBLIC_SITE_URL`.
- Neon kullanırken uygulama trafiği için `DATABASE_URL` (pooler), Payload migration'ları için `DATABASE_URL_UNPOOLED` (direct) tanımlayın. `pnpm payload:migrate` ve `pnpm build:vercel` migration aşamasında direct URL'yi otomatik seçer.
- İlk kurulumda `pnpm payload:migrate` çalıştırın, `/admin` üzerinden ilk yöneticiyi oluşturun; ardından kategori, medya ve iki dilde haber ekleyin.
- `R2_ENDPOINT` S3 API endpoint'idir; `R2_PUBLIC_URL` public medya custom domain'idir. `NEXT_PUBLIC_MEDIA_HOSTNAME`, `R2_PUBLIC_URL` içindeki hostname ile aynı olmalıdır.
- Preview ve production deployment'larında ayrı PostgreSQL ve R2 bucket/token kaynakları kullanın. Production'da `r2.dev` yerine custom domain kullanın.

### Cloudflare R2 kurulumu

- Preview ve production için ayrı R2 bucket ve bucket-scope Object Read & Write API token oluşturun.
- `R2_ENDPOINT` değerini `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, `R2_PUBLIC_URL` değerini ise public custom domain olarak ayarlayın.
- Admin panelinden browser upload'ları için bucket CORS'unda yalnızca uygulama origin'lerini, `PUT` metodunu, `Content-Type`/`Content-Length` header'larını ve `ETag` expose ayarını tanımlayın.
- Mevcut Vercel Blob medya dosyaları otomatik kopyalanmaz. R2 deployment'ına geçişte görselleri `/admin` üzerinden yeniden yükleyip ilgili haberlerin `heroImage` alanlarını yeniden bağlayın; geçiş tamamlanana kadar eski Blob kaynağını silmeyin.
- Bu hesapta oluşturulan bucket'lar: `komitehane-media-preview` ve `komitehane-media-production`. Preview bucket'ının geçici `r2.dev` adresi `https://pub-a49c41a31fce465e8db3bfd407e18dc6.r2.dev`'dir; production'da custom domain kullanın.
- Local preview CORS politikası `infra/cloudflare/r2-cors.preview.json` içindedir ve `npx wrangler r2 bucket cors set komitehane-media-preview --file infra/cloudflare/r2-cors.preview.json` ile uygulanır. Production origin'i belirlendikten sonra production bucket'ına ayrı, exact-origin bir politika uygulayın.

## Yapı

- `app/[locale]/` — yerelleştirilmiş sayfalar ve düzen
- `components/` — UI bileşenleri
- `config/` — site yapılandırması
- `i18n/` — next-intl yapılandırması
- `lib/seo/` — SEO yardımcıları (metadata, JSON-LD, IndexNow)
- `lib/news/` — Payload Local API tabanlı, normalize edilmiş haber veri katmanı
- `collections/`, `payload.config.ts`, `migrations/` — CMS şeması ve migration'lar
