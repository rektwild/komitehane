"use client";

import {Upload, useAuth, useConfig, useDocumentInfo} from "@payloadcms/ui";

export default function MediaUpload() {
  const {initialState} = useDocumentInfo();
  const {user} = useAuth<{id?: number | string; role?: unknown}>();
  const {getEntityConfig} = useConfig();
  const mediaConfig = getEntityConfig({collectionSlug: "media"});
  const uploadConfig = mediaConfig.upload;

  if (!uploadConfig) return null;

  const canAdjustImage = Boolean(user && user.role !== "writer");

  return (
    <Upload
      collectionSlug="media"
      initialState={initialState}
      uploadConfig={
        canAdjustImage
          ? uploadConfig
          : {
              ...uploadConfig,
              crop: false,
              focalPoint: false,
            }
      }
    />
  );
}
