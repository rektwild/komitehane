import type {CollectionConfig} from "payload";

import {
  authenticated,
  authenticatedAdmin,
  firstUserOrAuthenticated,
} from "@/collections/access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
  },
  access: {
    admin: authenticatedAdmin,
    create: firstUserOrAuthenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
  ],
};
