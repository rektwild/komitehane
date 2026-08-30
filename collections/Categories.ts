import type {CollectionConfig} from "payload";

import {categoryWrite} from "@/collections/access";
import {normalizeSlug} from "@/collections/slug";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
  },
  access: {
    create: categoryWrite,
    delete: categoryWrite,
    read: () => true,
    update: categoryWrite,
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
