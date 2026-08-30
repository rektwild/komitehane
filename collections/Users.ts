import type {CollectionConfig} from "payload";

import {
  authenticatedAdmin,
  isFounderUser,
  roleCreate,
  roleUpdate,
  sameUser,
  userCreate,
  userDelete,
  userRead,
  userUpdate,
} from "@/collections/access";
import {reassignLinkedUserRecords, setUserRole} from "@/collections/user-hooks";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
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
    {
      name: "name",
      type: "text",
      required: true,
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
  ],
};
