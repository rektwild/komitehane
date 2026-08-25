import type {Access, Where} from "payload";

export const authenticated: Access = ({req: {user}}) => Boolean(user);

export const authenticatedAdmin = ({req: {user}}: Parameters<Access>[0]) =>
  Boolean(user);

export const publishedOrAuthenticated: Access = ({req: {user}}) => {
  if (user) return true;

  const publicWhere: Where = {
    and: [
      {_status: {equals: "published"}},
      {publishedAt: {less_than_equal: new Date().toISOString()}},
    ],
  };

  return publicWhere;
};

export const firstUserOrAuthenticated: Access = async ({req}) => {
  if (req.user) return true;

  const {totalDocs} = await req.payload.count({
    collection: "users",
    overrideAccess: true,
  });

  return totalDocs === 0;
};
