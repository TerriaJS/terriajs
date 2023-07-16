import { Resource } from "cesium";

function loadText(urlOrResource, headers = undefined) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchText({
    headers: headers
  });
}

export default loadText;
