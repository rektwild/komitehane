import {APIError, type CollectionBeforeChangeHook} from "payload";

import {isFounderUser, isWriterUser} from "@/collections/access";
import {relationshipId} from "@/collections/relationship";

const imageEditKeys = [
  "crop",
  "focalPoint",
  "widthInPixels",
  "heightInPixels",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExplicitImageEdits(value: unknown): boolean {
  if (typeof value === "string") {
    try {
      return hasExplicitImageEdits(JSON.parse(value));
    } catch {
      return true;
    }
  }

  if (Array.isArray(value)) return value.some(hasExplicitImageEdits);
  if (!isRecord(value)) return false;

  return imageEditKeys.some(
    (key) => Object.prototype.hasOwnProperty.call(value, key) && value[key] != null,
  );
}

function valuesMatch(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left == null || right == null) return false;

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  return (
    Number.isFinite(leftNumber) &&
    Number.isFinite(rightNumber) &&
    leftNumber === rightNumber
  );
}

export const rejectWriterMediaImageEdits: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!isWriterUser(req.user) || operation !== "update") return data;

  const incomingData = isRecord(data) ? data : {};
  const originalData = isRecord(originalDoc) ? originalDoc : {};
  const uploadEdits = isRecord(req.query) ? req.query.uploadEdits : undefined;
  const focalPointChanged = ["focalX", "focalY"].some(
    (key) =>
      Object.prototype.hasOwnProperty.call(incomingData, key) &&
      !valuesMatch(incomingData[key], originalData[key]),
  );

  if (
    hasExplicitImageEdits(uploadEdits) ||
    hasExplicitImageEdits(incomingData) ||
    focalPointChanged
  ) {
    throw new APIError("Writers cannot edit media images.", 403);
  }

  return data;
};

export const setUploadedBy: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === "create") {
    const requestedUploader = relationshipId(data.uploadedBy);
    if (isFounderUser(req.user) && requestedUploader !== undefined) {
      return {...data, uploadedBy: requestedUploader};
    }

    return req.user ? {...data, uploadedBy: req.user.id} : data;
  }

  const uploadedById = relationshipId(originalDoc?.uploadedBy);
  const requestedUploader = relationshipId(data.uploadedBy);
  if (isFounderUser(req.user) && requestedUploader !== undefined) {
    return {...data, uploadedBy: requestedUploader};
  }

  return uploadedById === undefined ? data : {...data, uploadedBy: uploadedById};
};
