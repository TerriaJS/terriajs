import { defined } from "cesium";
const loadWithXhr = require("../Core/loadWithXhr");
const TerriaError = require("../Core/TerriaError").default;
import i18next from "i18next";

function getToken(terria, tokenUrl, url) {
  const options = {
    url: tokenUrl,
    method: "POST",
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
