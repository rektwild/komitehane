import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
} from "payload";
import {APIError} from "payload";

import {isFounderUser, sameUser} from "@/collections/access";

export const setUserRole: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === "update") {
    const currentRole = originalDoc?.role;
    const requestedRole = data.role;
    const isSelfUpdate = sameUser(req.user, originalDoc?.id);

    if (isSelfUpdate || !isFounderUser(req.user)) {
      if (
        requestedRole !== undefined &&
        currentRole !== undefined &&
        requestedRole !== currentRole
      ) {
        throw new APIError("Users cannot change their own role.", 403);
      }

      return currentRole === undefined ? data : {...data, role: currentRole};
    }

    if (requestedRole === "founder") {
      throw new APIError("Only the first account can be Founder.", 403);
    }

    return data;
  }

  if (operation !== "create") return data;

  const {totalDocs} = await req.payload.count({
    collection: "users",
    overrideAccess: true,
    req,
  });

  // The first account is the bootstrap owner of the installation. Every later
  // account may only be Editor or Writer, and defaults to Writer.
  if (totalDocs === 0) return {...data, role: "founder"};
  if (data.role === "founder") {
    throw new APIError("Only the first account can be Founder.", 403);
  }

  if (
    isFounderUser(req.user) &&
    (data.role === "editor" || data.role === "writer" || data.role === "automation")
  ) {
    return data;
  }

  return {...data, role: "writer"};
};

export const reassignLinkedUserRecords: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const founder = req.user;
  if (!founder || !isFounderUser(founder)) {
    throw new APIError("Only a Founder can delete users.", 403);
  }

  if (sameUser(founder, id)) {
    throw new APIError("The Founder account cannot be deleted.", 403);
  }

  // Use Payload's database adapter directly so ownership transfer cannot
  // publish a draft or create a synthetic article version during deletion.
  await req.payload.db.updateMany({
    collection: "articles",
    data: {author: founder.id},
    req,
    returning: false,
    where: {author: {equals: id}},
  });

  await req.payload.db.updateMany({
    collection: "media",
    data: {uploadedBy: founder.id},
    req,
    returning: false,
    where: {uploadedBy: {equals: id}},
  });

  await req.payload.db.updateMany({
    collection: "tags",
    data: {createdBy: founder.id},
    req,
    returning: false,
    where: {createdBy: {equals: id}},
  });
};
