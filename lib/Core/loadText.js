import { Resource } from "cesium";

function loadText(urlOrResource, headers) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchText({
    headers: headers
  });
}

export default loadText;
