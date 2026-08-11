import { isJsonObject } from "terriajs/lib/Core/Json";
import { OgcProcessOutputDescription } from "./OgcProcess";

function toOutputDefinition(
  output: unknown,
  outputDefinition?: OgcProcessOutputDescription
): any {
  if (!isJsonObject(output)) {
    return;
  }

  const mediaType =
    output.mediaType ?? outputDefinition?.schema?.contentMediaType;

  if (mediaType === "application/geo+json") {
    return {
      type: "geojson",
      geoJsonData: output.value,
      opacity: 0.5
    };
  }
}

export default { toOutputDefinition };
