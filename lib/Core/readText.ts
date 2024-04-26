import i18next from "i18next";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";

function readText(file: Blob): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    if (typeof file === "undefined") {
      throw new DeveloperError(i18next.t("core.readText.fileRequired"));
    }

    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function (event) {
      const allText = event.target?.result;
      resolve((allText ?? undefined) as string | undefined);
    };
    reader.onerror = function (e) {
      reject(e);
    };
  });
}

export default readText;
