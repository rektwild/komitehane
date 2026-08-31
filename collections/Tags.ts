import type {CollectionConfig} from "payload";

import {
  founderFieldAccess,
  tagCreate,
  tagDelete,
  tagRead,
  tagUpdate,
} from "@/collections/access";
import {setTagCreator} from "@/collections/tag-hooks";
import {normalizeSlug} from "@/collections/slug";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "createdBy", "updatedAt"],
  },
  access: {
    create: tagCreate,
    delete: tagDelete,
    read: tagRead,
    update: tagUpdate,
  },
  hooks: {
    beforeChange: [setTagCreator],
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
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      required: true,
      defaultValue: ({req}) => req.user?.id ?? "",
      access: {
        create: founderFieldAccess,
        update: founderFieldAccess,
      },
      admin: {
        description: "Etiketi oluşturan kullanıcı otomatik atanır.",
      },
    },
  ],
};
