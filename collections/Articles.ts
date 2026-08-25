import type {CollectionConfig} from "payload";

import {authenticated, publishedOrAuthenticated} from "@/collections/access";
import {
  rememberDeletedArticle,
  setPublishedAt,
  submitDeletedArticle,
  submitPublishedArticle,
} from "@/collections/article-hooks";
import {normalizeSlug} from "@/collections/slug";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "publishedAt", "_status", "updatedAt"],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  hooks: {
    beforeChange: [setPublishedAt],
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
          name: "authorName",
          type: "text",
          required: true,
        },
        {
          name: "authorRole",
          type: "select",
          options: [
            {label: "Founder", value: "founder"},
            {label: "Editör", value: "editor"},
            {label: "Yazar", value: "writer"},
          ],
          defaultValue: "writer",
          admin: {
            description: "Yazarın görevi",
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
    {
      type: "row",
      fields: [
        {
          name: "isTrending",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "trendingOrder",
          type: "number",
          min: 0,
          defaultValue: 0,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.isTrending),
          },
        },
        {
          name: "isPopular",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "popularOrder",
          type: "number",
          min: 0,
          defaultValue: 0,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.isPopular),
          },
        },
      ],
    },
  ],
};
