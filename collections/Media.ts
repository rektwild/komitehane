import type {CollectionConfig} from "payload";

import {
  mediaCreate,
  mediaDelete,
  mediaRead,
  mediaUpdate,
  founderFieldAccess,
} from "@/collections/access";
import {
  rejectWriterMediaImageEdits,
  setUploadedBy,
} from "@/collections/media-hooks";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: mediaCreate,
    delete: mediaDelete,
    read: mediaRead,
    update: mediaUpdate,
  },
  hooks: {
    beforeChange: [rejectWriterMediaImageEdits, setUploadedBy],
  },
  admin: {
    useAsTitle: "alt",
    components: {
      edit: {
        Upload: "@/components/payload/media-upload",
      },
    },
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true,
      required: true,
    },
    {
      name: "uploadedBy",
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
          "Founder değiştirebilir; diğer kullanıcılar için yükleyen kullanıcı otomatik atanır.",
      },
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
