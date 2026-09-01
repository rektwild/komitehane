# Payload → n8n haber alımı

Bu akış yalnızca taslak haber oluşturur. Yayınlama ve kapak görseli ekleme
işlemleri Komitehane admin panelinde yapılır. Yazı gövdesindeki anlamlı
noktalara en fazla üç adet isteğe bağlı `articleImage` bloğu eklenebilir;
kapak görseli akış tarafından otomatik seçilmez.

## Ön koşullar

- Payload admin panelinde `blog-bot` adlı kullanıcı oluşturulmalı ve rolü
  `automation` seçilmelidir.
- Kullanıcının API key'i n8n Credentials içinde server-side saklanmalıdır.
- En az bir kategori admin tarafından oluşturulmalıdır. Workflow eksik kategori
  bulursa durur; kategori oluşturmaz.
- n8n isteklerinde `localhost` yerine `https://komitehane.com` kullanılmalıdır.
- n8n içinde Pexels için bir `Header Auth` credential oluşturulmalıdır.
  Header adı `Authorization`, değeri Pexels API key'inin kendisi olmalıdır.
  API anahtarlarını workflow JSON'una veya repository'ye yazmayın.

Görsel resolver workflow'u `Komitehane - Resolve Blog Images` adıyla oluşturulur.
Credential'lar kaydedildikten sonra önce resolver'ı, sonra ana workflow'u publish
edin. Credential'lar yoksa ana workflow görselleri atlayıp yazıyı yine taslak
olarak kaydeder.

HTTP Request node için kimlik doğrulama başlığı:

```text
Authorization: users API-Key <PAYLOAD_API_KEY>
Content-Type: application/json
```

API key'i workflow JSON'una, Set node'una veya repository içindeki `.env`
dosyasına yazmayın.

## Slug ve locale kuralları

Slug'lar küçük harfli, URL güvenli ve her locale için benzersiz olmalıdır.
Türkçe ve İngilizce alanlar aynı Payload belgesinde tutulur; eksik çeviriyle
yayın yapılmaz.

### 1. Kategoriyi bul

```http
GET /api/categories?locale=tr&depth=0&limit=1&where[slug][equals]=tus
```

`docs[0]` yoksa workflow hata verip durur. Bulunan `id`, article isteğinde
`category` değeri olarak kullanılır.

### 2. Etiketleri bul veya oluştur

Her tag için hem `tr` hem `en` slug'ını arayın. İki locale'de farklı kayıtlar
bulunursa workflow çakışma hatasıyla durmalıdır. Tek bir kayıt bulunursa onun
ID'sini kullanın; eksik locale'i aynı ID üzerinde `PATCH` ile tamamlayın.

Örnek Türkçe arama:

```http
GET /api/tags?locale=tr&depth=0&limit=1&where[slug][equals]=farmakoloji
```

Hiç kayıt bulunamazsa iki locale'i ayrı isteklerle oluşturun. İlk istekten dönen
`id`, ikinci istekte kullanılmalıdır:

```http
POST /api/tags?locale=tr
{
  "name": "Farmakoloji",
  "slug": "farmakoloji"
}
```

```http
PATCH /api/tags/{id}?locale=en
{
  "name": "Pharmacology",
  "slug": "pharmacology"
}
```

`createdBy` alanını göndermeyin; Payload bunu API key sahibine otomatik atar.
Tag araması/oluşturması aynı workflow tekrarlandığında önce yapılır; mevcut
tag varsa yeni kayıt açılmaz.

## Taslak article oluşturma/güncelleme

Türkçe taslak:

```http
POST /api/articles?locale=tr&draft=true
```

```json
{
  "title": "TUS'ta farmakolojiye nasıl çalışılır?",
  "slug": "tusta-farmakolojiye-nasil-calisilir",
  "excerpt": "Farmakoloji tekrarını planlamak için kısa rehber.",
  "content": {
    "root": {
      "type": "root",
      "format": "",
      "indent": 0,
      "version": 1,
      "direction": null,
      "children": [
        {
          "type": "paragraph",
          "format": "",
          "indent": 0,
          "version": 1,
          "children": [
            {
              "type": "text",
              "detail": 0,
              "format": 0,
              "mode": "normal",
              "style": "",
              "text": "İçerik burada yer alır.",
              "version": 1
            }
          ]
        }
      ]
    }
  },
  "category": 1,
  "tags": [1, 2]
}
```

`category` ve `tags` değerleri Payload ID'leridir; örnekteki ID'leri gerçek
istekte değiştirin. `heroImage`, `author`, `_status` ve `publishedAt`
göndermeyin. `draft=true` sayesinde kapak görseli olmadan taslak kaydedilir ve
`author` automation kullanıcısına atanır.

İngilizce alanları aynı article ID'si üzerinde tamamlayın:

```http
PATCH /api/articles/{articleId}?locale=en&draft=true
```

İstek gövdesinde İngilizce `title`, `slug`, `excerpt` ve Lexical `content`
bulunmalıdır. `category` ve `tags` ortak alanlar olduğu için aynı değerlerle
gönderilebilir; `heroImage`, `author` ve yayın alanları yine gönderilmemelidir.

`content` düz metin, Markdown veya HTML değildir. Her locale için Payload
Lexical JSON olmalıdır. İstekten önce n8n Code node'unda en az şu doğrulamayı
yapın:

```js
const content = $json.content;

if (
  !content ||
  content.root?.type !== 'root' ||
  !Array.isArray(content.root.children)
) {
  throw new Error('content must be a Payload Lexical document');
}

return item;
```

### Gövde içi görseller

n8n, model çıktısındaki işaretleri görsel sağlayıcılarından çözdükten sonra
Lexical `articleImage` bloklarına dönüştürür. Görsel seçimi yapılmayan veya
çözülemeyen bir işaret metinden çıkarılır; bu nedenle görsel API'leri
ulaşılamadığında taslak metin olarak kaydedilmeye devam eder.

İşaret formatı:

```text
[[IMAGE:image-1]]
```

Payload Lexical bloğunun örnek şekli:

```json
{
  "type": "block",
  "version": 2,
  "fields": {
    "id": "inline-image-1",
    "blockType": "articleImage",
    "provider": "pexels",
    "media": 42,
    "mediaUrl": "https://cdn.example.com/media/article-image.jpg",
    "alt": "Farmakoloji çalışırken kullanılan notlar",
    "caption": "Konu tekrarını görsel notlarla desteklemek.",
    "sourcePhotoId": "pexels-photo-id",
    "sourcePageUrl": "https://www.pexels.com/photo/example/",
    "photographerName": "Photographer",
    "photographerUrl": "https://www.pexels.com/@photographer"
  }
}
```

Pexels görselleri Payload Media'ya yüklenir; `media` ilişkisi ve kaynak
bilgileri saklanır. `sourcePhotoId`, `sourcePageUrl`, `photographerName` ve
`photographerUrl` alanları doldurulur. Frontend'de görünür fotoğraf kredisi
gösterilir.

Payload Media upload isteği `multipart/form-data` olmalıdır. Binary dosya
`file` alanında gönderilir; `alt`, `sourceProvider`, `sourcePhotoId`,
`sourcePageUrl`, `photographerName` ve `photographerUrl` gibi metadata alanları
tek tek form alanları olarak değil, JSON-stringified `_payload` alanı içinde
gönderilmelidir. Türkçe alt metin için upload URL'si `?locale=tr` kullanılır;
İngilizce alt metin oluşturulan Media kaydına sonrasında `?locale=en` ile
`PATCH` edilir. Multipart isteğinde `Content-Type` başlığını elle vermeyin;
n8n boundary bilgisini kendisi eklemelidir.

Resolver aynı Pexels fotoğrafı daha önce Media'ya kaydedilmişse dosya adından
mevcut kaydı bulup yeniden kullanır; böylece tekrar denemeler `filename`
benzersizlik hatası üretmez. Tüm görsel slotları tamamlandıktan sonra resolver
ana workflow'a tek bir aggregate sonuç öğesi döndürür.

n8n görsel çözücü alt akışının girdileri:

```json
{
  "imageMode": "auto",
  "imagePlanTr": [
    {
      "id": "image-1",
      "searchQuery": "medical student pharmacology notes",
      "alt": "Farmakoloji notlarıyla çalışan tıp öğrencisi",
      "caption": "Görsel tekrar sürecini destekleyen çalışma notları."
    }
  ],
  "imagePlanEn": [],
  "articleMarkdown": "...\n[[IMAGE:image-1]]\n...",
  "englishArticleMarkdown": "...\n[[IMAGE:image-1]]\n..."
}
```

Çözücü çıktısında `articleMarkdownWithImages`,
`englishArticleMarkdownWithImages`, `imageAssets`, `imageCount` ve
`imageWarnings` alanları bulunur. `imageAssets` içindeki Pexels kaydı Payload
Media ID'sini ve kaynak kredisi bilgilerini taşır. İçerik gönderilmeden önce
bu alanlar `articleImage` bloklarına dönüştürülmelidir.

## Tekrar deneme ve idempotency

POST işleminden önce aynı Türkçe slug için mevcut taslağı arayın:

```http
GET /api/articles?locale=tr&depth=0&draft=true&limit=1&where[slug][equals]=tusta-farmakolojiye-nasil-calisilir
```

Kayıt varsa yeni POST yerine dönen `id` ile Türkçe ve İngilizce PATCH çalıştırın.
Bu kontrol, POST başarılı olduktan sonra ağ hatası yaşanırsa duplicate article
oluşmasını engeller.

n8n HTTP Request node yalnızca `408`, `429` ve `5xx` cevaplarını retry etmelidir.
`401`, `403` ve doğrulama kaynaklı `4xx` cevapları retry edilmeden workflow'u
durdurmalıdır. Automation key ile publish/delete denenmez; publish işlemi admin
panelinden yapılır.
