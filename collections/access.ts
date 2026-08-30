import type {Access, FieldAccess, PayloadRequest, Where} from "payload";

import {relationshipId} from "@/collections/relationship";

export const userRoles = ["founder", "editor", "writer"] as const;
export type UserRole = (typeof userRoles)[number];

type RoleBearingUser = {
  id: number | string;
  role?: unknown;
} | null | undefined;

function getRole(user: unknown): UserRole | null {
  if (!user || typeof user !== "object") return null;

  const role = (user as {role?: unknown}).role;
  return typeof role === "string" && userRoles.includes(role as UserRole)
    ? (role as UserRole)
    : null;
}

export function isFounderUser(user: unknown): boolean {
  return getRole(user) === "founder";
}

export function isEditorUser(user: unknown): boolean {
  return getRole(user) === "editor";
}

export function isWriterUser(user: unknown): boolean {
  return getRole(user) === "writer";
}

export function isEditorialUser(user: unknown): boolean {
  return isFounderUser(user) || isEditorUser(user);
}

export function sameUser(user: RoleBearingUser, id: number | string | undefined): boolean {
  return Boolean(user && id !== undefined && String(user.id) === String(id));
}

export function ownerWhere(field: string, id: number | string): Where {
  return {[field]: {equals: id}};
}

export const authenticated: Access = ({req: {user}}) => Boolean(user);

export const authenticatedAdmin = ({req: {user}}: Parameters<Access>[0]) =>
  Boolean(user);

export function publishedWhere(): Where {
  return {
    and: [
      {_status: {equals: "published"}},
      {publishedAt: {less_than_equal: new Date().toISOString()}},
    ],
  };
}

export const publishedOrAuthenticated: Access = ({req: {user}}) => {
  if (user) return true;
  return publishedWhere();
};

export const articleRead: Access = ({req: {user}}) => {
  if (!user) return publishedWhere();
  if (isEditorialUser(user)) return true;
  if (isWriterUser(user)) return ownerWhere("author", user.id);
  return false;
};

export const articleCreate: Access = authenticated;

export const articleUpdate: Access = ({req: {user}}) => {
  if (!user) return false;
  if (isEditorialUser(user)) return true;
  if (isWriterUser(user)) return ownerWhere("author", user.id);
  return false;
};

export const articleDelete: Access = ({req: {user}}) => {
  if (!user) return false;
  if (isEditorialUser(user)) return true;
  if (isWriterUser(user)) {
    return {
      and: [
        ownerWhere("author", user.id),
        {_status: {equals: "draft"}},
      ],
    };
  }
  return false;
};

export const articleReadVersions: Access = ({req: {user}}) => {
  if (!user) return false;
  if (isEditorialUser(user)) return true;
  if (isWriterUser(user)) {
    // Version access queries the generated `version` group directly.
    return ownerWhere("version.author", user.id);
  }
  return false;
};

export const mediaRead: Access = ({req: {user}}) => {
  if (!user || isEditorialUser(user) || isWriterUser(user)) return true;
  return false;
};

export const mediaCreate: Access = authenticated;

async function ownsMedia({
  id,
  req,
  user,
}: {
  id: number | string;
  req: PayloadRequest;
  user: RoleBearingUser;
}): Promise<boolean> {
  const media = await req.payload.findByID({
    collection: "media",
    depth: 0,
    id,
    overrideAccess: true,
    req,
  });

  return sameUser(user, relationshipId(media.uploadedBy));
}

export const mediaUpdate: Access = async ({id, req}) => {
  const {user} = req;
  if (!user) return false;
  if (isEditorialUser(user)) return true;
  if (isWriterUser(user)) {
    if (id !== undefined) return ownsMedia({id, req, user});
    return ownerWhere("uploadedBy", user.id);
  }
  return false;
};

export const mediaDelete: Access = mediaUpdate;

export const categoryWrite: Access = ({req: {user}}) =>
  Boolean(user && isEditorialUser(user));

// Names and roles are intentionally public so depth-1 article relationships can
// be rendered. The email field has its own field-level read access.
export const userRead: Access = () => true;

export const userCreate: Access = async ({req}) => {
  if (req.user) return isFounderUser(req.user);

  const {totalDocs} = await req.payload.count({
    collection: "users",
    overrideAccess: true,
    req,
  });

  return totalDocs === 0;
};

export const userUpdate: Access = ({id, req}) => {
  if (!req.user) return false;
  if (isFounderUser(req.user)) return true;
  return id === undefined ? false : ownerWhere("id", req.user.id);
};

export const userDelete: Access = ({id, req: {user}}) => {
  if (!user || !isFounderUser(user)) return false;

  // Payload asks collection access without an id when it builds the admin
  // list/bulk operation permissions. The beforeDelete hook still rejects a
  // bulk request that includes the Founder account itself.
  if (id === undefined) return true;

  return !sameUser(user, id);
};

export const roleCreate: FieldAccess = ({req: {user}}) =>
  !user || isFounderUser(user);

// Payload's admin permission resolver does not pass the document id to
// field-level access callbacks. The collection update access and the
// setUserRole hook enforce the target/self distinction on the server, so this
// field permission must be role-based to keep the role control available when
// a Founder edits another user.
export const roleUpdate: FieldAccess = ({req: {user}}) => isFounderUser(user);

export const founderFieldAccess: FieldAccess = ({req: {user}}) =>
  isFounderUser(user);

export const firstUserOrAuthenticated: Access = userCreate;

export function isRequestUser(req: PayloadRequest, id: number | string | undefined): boolean {
  return sameUser(req.user, id);
}
