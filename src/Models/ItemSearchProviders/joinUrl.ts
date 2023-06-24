import URI from "urijs";

export default function joinUrl(rootUrl: string, url: string) {
  const uri = URI(url);
  return uri.is("absolute") ? url : uri.absoluteTo(rootUrl).toString();
}
