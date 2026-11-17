import type {Article} from "@/payload-types";
import type {NewsLocale} from "@/lib/news/types";

const sampleImage = "/fixtures/article-formatting-sample.png";

type FixtureCopy = {
  title: string;
  excerpt: string;
  heroAlt: string;
  sectionTitle: string;
  intro: string;
  followUp: string;
  listTitle: string;
  listItems: [string, string, string];
  quote: string;
  imageAlt: string;
  imageCaption: string;
  imageNote: string;
  uploadAlt: string;
  uploadCaption: string;
  closingTitle: string;
  closing: string;
  referencesTitle: string;
  references: Array<{label: string; href: string; detail: string}>;
  referencesNote: string;
};

const copy = {
  tr: {
    title: "Kurul sınavı, alıntı ve kaynakça örneği",
    excerpt:
      "Bölüm ritmi, satır içi görsel, alıntı ve kaynakça aynı yazı ölçüsünü kullanır. Bu sayfa yerel bir biçim örneğidir.",
    heroAlt: "Kurul çalışmasını temsil eden örnek görsel",
    sectionTitle: "Kurul notu tek başına sonucu göstermez",
    intro:
      "Bir kurul puanı, yıl sonu notunun yalnızca bir parçasıdır. Ağırlık, baraj ve final alt sınırı fakültenin güncel belgesinde ayrı ayrı durur.",
    followUp:
      "Arkadaşınızın “ortalama yetiyor” yorumunu, kendi yönetmeliğinizin yerine koymayın. Aynı sayı başka bir fakültede başka bir koşula bağlı olabilir.",
    listTitle: "Hesaptan önce kontrol",
    listItems: [
      "Kurul için açıklanan notu kullanın.",
      "Dönem sonu katkı yüzdesini, kurul içindeki ders yüzdesiyle karıştırmayın.",
      "Final alt sınırını matematiksel sonuçtan ayrı okuyun.",
    ],
    quote:
      "Hesaplanan sonuç bir senaryodur; devam, baraj ve final alt sınırı ayrıca incelenmeden geçti veya kaldı denmez.",
    imageAlt: "Not hesabından önce bakılacak girdileri gösteren örnek görsel",
    imageCaption: "Girdiler, ek koşullar ve resmî sonuç aynı karede durmalı.",
    imageNote: "Şema: Özgün editoryal kontrol listesi. Hesaplama çıktısı resmî öğrenci işleri sonucunun yerine geçmez.",
    uploadAlt: "Çalışma masasında açık duran notlar",
    uploadCaption: "Satır içi yüklenen görsel, blok görselle aynı başlık aralığını kullanır.",
    closingTitle: "Aracı bir senaryo olarak okuyun",
    closing:
      "Komitehane hesaplayıcısı açıklanan ağırlıkların matematiksel sonucunu gösterir. Fakülte duyurusu değiştiyse belgeyi yeniden kontrol edin.",
    referencesTitle: "Kaynaklar ve editoryal not",
    references: [
      {
        label: "Zonguldak Bülent Ecevit Üniversitesi Tıp Fakültesi Yönetmeliği",
        href: "https://www.resmigazete.gov.tr/eskiler/2026/02/20260213-8.htm",
        detail: "özellikle md. 4, 12 ve 16.",
      },
      {
        label: "SDÜ Tıp Fakültesi Eğitim-Öğretim ve Sınav Yönergesi",
        href: "https://tip.sdu.edu.tr/assets/uploads/sites/101/files/sdu-tip-fakultesi-egitim-ogretim-ve-sinav-yonergesi-17062026.pdf",
        detail: "özellikle md. 15, 16 ve 23.",
      },
    ],
    referencesNote:
      "Kaynaklar 7 Kasım 2026, Türkiye saati itibarıyla kontrol edildi. Bu metin bir biçim örneğidir; mevzuat değişebilir.",
  },
  en: {
    title: "Board exam, quotation, and references sample",
    excerpt:
      "Section rhythm, inline images, quotations, and the bibliography share one measure. This page is a local formatting fixture.",
    heroAlt: "Sample image representing board-exam study",
    sectionTitle: "A board score does not show the whole result",
    intro:
      "A committee score is only one part of the year-end grade. Weight, a course threshold, and the final-exam floor each live in the faculty’s current document.",
    followUp:
      "Do not replace your own regulation with a classmate’s “the average is enough.” The same number can sit under a different rule at another faculty.",
    listTitle: "Check this before calculating",
    listItems: [
      "Use the score published for that board.",
      "Do not mix the year-end contribution with a course percentage inside the board.",
      "Read the final-exam floor separately from the mathematical result.",
    ],
    quote:
      "The calculated result is a scenario. Attendance, thresholds, and the final-exam floor still have to be read before anyone says pass or fail.",
    imageAlt: "Sample image showing the inputs to check before a grade calculation",
    imageCaption: "Inputs, extra conditions, and the official result belong in the same frame.",
    imageNote:
      "Diagram: original editorial checklist. A calculation does not replace the registrar’s result.",
    uploadAlt: "Notes open on a desk",
    uploadCaption: "An uploaded inline image uses the same caption gap as an image block.",
    closingTitle: "Read the tool as a scenario",
    closing:
      "The Komitehane calculator shows the mathematical result of the weights you enter. If the faculty notice changed, check the document again.",
    referencesTitle: "References",
    references: [
      {
        label: "Zonguldak Bülent Ecevit University Faculty of Medicine regulation",
        href: "https://www.resmigazete.gov.tr/eskiler/2026/02/20260213-8.htm",
        detail: "especially articles 4, 12, and 16.",
      },
      {
        label: "SDU Faculty of Medicine education and examination directive",
        href: "https://tip.sdu.edu.tr/assets/uploads/sites/101/files/sdu-tip-fakultesi-egitim-ogretim-ve-sinav-yonergesi-17062026.pdf",
        detail: "especially articles 15, 16, and 23.",
      },
    ],
    referencesNote:
      "References were checked on 7 November 2026, Turkey time. This text is a formatting fixture; the rules can change.",
  },
} as const satisfies Record<NewsLocale, FixtureCopy>;

function text(value: string, format = 0) {
  return {
    type: "text",
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text: value,
    version: 1,
  };
}

function paragraph(children: Array<ReturnType<typeof text> | ReturnType<typeof link>>) {
  return {
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children,
  };
}

function heading(tag: "h2" | "h3", value: string) {
  return {
    type: "heading",
    tag,
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: [text(value)],
  };
}

function link(url: string, label: string) {
  return {
    type: "link",
    version: 3,
    format: "",
    indent: 0,
    direction: "ltr" as const,
    fields: {
      linkType: "custom",
      newTab: true,
      url,
    },
    children: [text(label)],
  };
}

export function getArticleFormattingFixtureCopy(locale: NewsLocale): FixtureCopy {
  return copy[locale];
}

export function getArticleFormattingFixture(locale: NewsLocale): Article["content"] {
  const item = copy[locale];

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: [
        heading("h2", item.sectionTitle),
        paragraph([text(item.intro)]),
        paragraph([text(item.followUp)]),
        heading("h3", item.listTitle),
        {
          type: "list",
          listType: "bullet",
          tag: "ul",
          start: 1,
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: item.listItems.map((entry, index) => ({
            type: "listitem",
            value: index + 1,
            format: "",
            indent: 0,
            version: 1,
            children: [text(entry)],
          })),
        },
        {
          type: "quote",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: [paragraph([text(item.quote)])],
        },
        {
          type: "block",
          version: 2,
          fields: {
            id: "fixture-image-block",
            blockType: "articleImage",
            provider: "pexels",
            mediaUrl: sampleImage,
            alt: item.imageAlt,
            caption: item.imageCaption,
            sourcePhotoId: "fixture",
            sourcePageUrl: "https://www.pexels.com/photo/fixture/",
            photographerName: "Örnek Fotoğrafçı",
            photographerUrl: "https://www.pexels.com/@ornek",
          },
        },
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: [],
        },
        paragraph([text(item.imageNote, 2)]),
        {
          type: "upload",
          version: 3,
          format: "",
          relationTo: "media",
          fields: {caption: item.uploadCaption},
          value: {
            alt: item.uploadAlt,
            url: sampleImage,
            width: 1200,
            height: 675,
            mimeType: "image/png",
          },
        },
        heading("h2", item.closingTitle),
        paragraph([text(item.closing)]),
        heading("h2", item.referencesTitle),
        ...item.references.map((reference, index) =>
          paragraph([
            text(`[${index + 1}] `),
            link(reference.href, reference.label),
            text(`, ${reference.detail}`),
          ]),
        ),
        paragraph([text(item.referencesNote)]),
      ],
    },
  };
}
