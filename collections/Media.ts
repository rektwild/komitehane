import type {CollectionConfig} from "payload";

import {authenticated} from "@/collections/access";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: "alt",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true,
      required: true,
    },
  ],
  upload: {
    crop: true,
    focalPoint: true,
    mimeTypes: ["image/*"],
    imageSizes: [
      {
        name: "card",
        width: 720,
        height: 540,
        position: "centre",
      },
      {
        name: "hero",
        width: 1440,
        height: 810,
        position: "centre",
      },
    ],
  },
};
