import type {CollectionConfig} from "payload";

import {
  authenticatedAdmin,
  isFounderUser,
  roleCreate,
  roleUpdate,
  sameUser,
  userCreate,
  userDelete,
  userEmailRead,
  userRead,
  userUpdate,
} from "@/collections/access";
import {ensureUserSlug} from "@/collections/slug";
import {reassignLinkedUserRecords, setUserRole} from "@/collections/user-hooks";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    useAPIKey: true,
  },
  admin: {
    useAsTitle: "name",
  },
  access: {
    admin: authenticatedAdmin,
    create: userCreate,
    delete: userDelete,
    read: userRead,
    update: userUpdate,
  },
  hooks: {
    beforeChange: [setUserRole],
    beforeDelete: [reassignLinkedUserRecords],
  },
  fields: [
    // Overrides Payload's generated auth email field (merged by name) to add
    // field-level read access; the rest of its config stays Payload's default.
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true,
      access: {
        read: userEmailRead,
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [ensureUserSlug],
      },
      admin: {
        description:
          "Herkese açık yazar profili adresi (ör. /tr/yazarlar/ad-soyad). Boş bırakılırsa addan üretilir; sonradan değiştirmek eski bağlantıları bozar.",
      },
    },
    {
      name: "bio",
      type: "textarea",
      localized: true,
      maxLength: 600,
      admin: {
        description:
          "Yazar profilinde ve yapılandırılmış veride gösterilen kısa biyografi. Uzmanlık, eğitim veya rolü yalnızca doğru bilgilerle yazın.",
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "writer",
      options: [
        {label: "Founder", value: "founder"},
        {label: "Editor", value: "editor"},
        {label: "Writer", value: "writer"},
        {label: "Automation", value: "automation"},
      ],
      filterOptions: ({options}) =>
        options.filter(
          (option) => typeof option === "string" ? option !== "founder" : option.value !== "founder",
        ),
      access: {
        create: roleCreate,
        update: roleUpdate,
      },
      admin: {
        condition: (data, _siblingData, {user}) =>
          Boolean(user) && (!isFounderUser(user) || !sameUser(user, data.id)),
        description: "Yetki ve herkese açık yazar rolü.",
      },
    },
    {
      name: "enableAPIKey",
      type: "checkbox",
      access: {
        read: ({req: {user}}) => isFounderUser(user),
        update: ({req: {user}}) => isFounderUser(user),
      },
    },
    {
      name: "apiKey",
      type: "text",
      access: {
        read: ({req: {user}}) => isFounderUser(user),
        update: ({req: {user}}) => isFounderUser(user),
      },
    },
  ],
};
