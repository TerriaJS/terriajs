import { Resource } from "terriajs-cesium";

async function loadText(urlOrResource: string | Resource): Promise<string> {
  const resource = (Resource as any).createIfNeeded(urlOrResource) as Resource;
  const response = resource.fetchText();
  if (response === undefined) {
    throw new Error("Request throttled");
  }
  return response;
}

export default loadText;
