import type {CollectionConfig} from "payload";

import {authenticated} from "@/collections/access";
import {normalizeSlug} from "@/collections/slug";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: "name",
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
      hooks: {
        beforeValidate: [normalizeSlug],
      },
    },
  ],
};
