import type {CollectionBeforeChangeHook} from "payload";

import {relationshipId} from "@/collections/relationship";

export const setTagCreator: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === "create") {
    return req.user ? {...data, createdBy: req.user.id} : data;
  }

  const creatorId = relationshipId(originalDoc?.createdBy);
  return creatorId === undefined ? data : {...data, createdBy: creatorId};
};
