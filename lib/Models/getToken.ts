import defined from "terriajs-cesium/Source/Core/defined";
import loadWithXhr from "../Core/loadWithXhr";
import TerriaError from "../Core/TerriaError";
import i18next from "i18next";
import Terria from "./Terria";

function getToken(terria: Terria, tokenUrl: string, url: string) {
  const options = {
    url: tokenUrl,
    method: "POST" as const,
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      url: url
    })
  };

  return loadWithXhr(options)
    .then(function (result) {
      const tokenResponse = JSON.parse(result);

      if (!defined(tokenResponse.token)) {
        throw new TerriaError({
          title: i18next.t("models.getToken.errorTitle"),
          message: i18next.t("models.getToken.invalidToken", {
            email:
              '<a href="mailto:' +
              terria.supportEmail +
              '">' +
              terria.supportEmail +
              "</a>."
          })
        });
      }

      return tokenResponse.token;
    })
    .catch(() => {
      throw new TerriaError({
        title: i18next.t("models.getToken.errorTitle"),
        message: i18next.t("models.getToken.unableToRequest", {
          email:
            '<a href="mailto:' +
            terria.supportEmail +
            '">' +
            terria.supportEmail +
            "</a>."
        })
      });
    });
}

export default getToken;
