import type {CollectionConfig} from "payload";

import {
  articleCreate,
  articleDelete,
  articleRead,
  articleReadVersions,
  articleUpdate,
  founderFieldAccess,
} from "@/collections/access";
import {
  enforceWriterArticleWorkflow,
  rememberDeletedArticle,
  setPublishedAt,
  setArticleAuthor,
  submitDeletedArticle,
  submitPublishedArticle,
  validateArticleHeroImageAccess,
} from "@/collections/article-hooks";
import {normalizeSlug} from "@/collections/slug";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "category", "publishedAt", "_status", "updatedAt"],
  },
  access: {
    create: articleCreate,
    delete: articleDelete,
    read: articleRead,
    readVersions: articleReadVersions,
    update: articleUpdate,
  },
  hooks: {
    beforeOperation: [enforceWriterArticleWorkflow],
    beforeChange: [setArticleAuthor, validateArticleHeroImageAccess, setPublishedAt],
    afterChange: [submitPublishedArticle],
    beforeDelete: [rememberDeletedArticle],
    afterDelete: [submitDeletedArticle],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 25,
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      required: true,
    },
    {
      name: "slug",
      type: "text",
      localized: true,
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "İlk yayından sonra URL kararlılığı için değiştirilemez.",
      },
      hooks: {
        beforeValidate: [normalizeSlug],
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      localized: true,
      required: true,
      maxLength: 320,
    },
    {
      name: "content",
      type: "richText",
      localized: true,
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "heroImage",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "category",
          type: "relationship",
          relationTo: "categories",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "author",
          type: "relationship",
          relationTo: "users",
          required: true,
          defaultValue: ({req}) => req.user?.id ?? "",
          access: {
            create: founderFieldAccess,
            update: founderFieldAccess,
          },
          admin: {
            description:
              "Founder değiştirebilir; diğer kullanıcılar için giriş yapan kullanıcı otomatik atanır.",
          },
        },
        {
          name: "publishedAt",
          type: "date",
          index: true,
          admin: {
            date: {
              pickerAppearance: "dayAndTime",
            },
          },
        },
      ],
    },
  ],
};
