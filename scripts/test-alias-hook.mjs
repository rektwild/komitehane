export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) {
    return nextResolve(specifier, context);
  }

  const name = specifier.slice(2);
  const file = /\.[a-z]+$/i.test(name) ? name : `${name}.ts`;
  return nextResolve(new URL(`../${file}`, import.meta.url).href, context);
}
