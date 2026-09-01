import type {Block} from "payload";

export type ArticleImageMedia = {
  id?: number | string;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type ArticleImageBlockFields = {
  provider?: "pexels" | string | null;
  media?: number | ArticleImageMedia | null;
  mediaUrl?: string | null;
  alt?: string | null;
  caption?: string | null;
  sourcePhotoId?: string | null;
  sourcePageUrl?: string | null;
  photographerName?: string | null;
  photographerUrl?: string | null;
};

export const ArticleImageBlock: Block = {
  slug: "articleImage",
  admin: {
    components: {
      Block: "@/components/payload/article-image-block",
    },
  },
  interfaceName: "ArticleImageBlock",
  labels: {
    plural: "Article images",
    singular: "Article image",
  },
  fields: [
    {
      name: "provider",
      type: "select",
      required: true,
      options: [
        {label: "Pexels", value: "pexels"},
      ],
    },
    {
      name: "media",
      type: "relationship",
      relationTo: "media",
      admin: {
        description: "Pexels görselleri için Payload Media kaydı.",
      },
    },
    {
      name: "mediaUrl",
      type: "text",
      admin: {
        description: "R2 URL snapshot; ilişki populate edilemezse fallback olarak kullanılır.",
      },
    },
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "textarea",
    },
    {
      name: "sourcePhotoId",
      type: "text",
    },
    {
      name: "sourcePageUrl",
      type: "text",
    },
    {
      name: "photographerName",
      type: "text",
    },
    {
      name: "photographerUrl",
      type: "text",
    },
  ],
};
