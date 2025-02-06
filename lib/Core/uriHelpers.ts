import type URI from "urijs";

export const getUriWithoutPath = (anyUri: URI) => {
  if (!anyUri) {
    return undefined;
  }
  const port = anyUri.port();
  const portToConcat = port ? `:${port}` : "";
  const uriWithoutPath = `${anyUri.protocol()}://${anyUri.hostname()}${portToConcat}/`;
  return uriWithoutPath;
};
