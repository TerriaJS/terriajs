const defined = require("terriajs-cesium/Source/Core/defined").default;
const loadWithXhr = require("../Core/loadWithXhr");
const TerriaError = require("../Core/TerriaError");

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
    .then(function(result) {
      const tokenResponse = JSON.parse(result);

      if (!defined(tokenResponse.token)) {
        throw new TerriaError({
          title: "Token Error",
          message:
            "<p>The token server responded with an invalid token.</p><p>Please report it by " +
            'sending an email to <a href="mailto:' +
            terria.supportEmail +
            '">' +
            terria.supportEmail +
            "</a>.</p>"
        });
      }

      return tokenResponse.token;
    })
    .otherwise(() => {
      throw new TerriaError({
        title: "Token Error",
        message:
          "<p>Unable to request a token from the token server.</p><p>Please report it by " +
          'sending an email to <a href="mailto:' +
          terria.supportEmail +
          '">' +
          terria.supportEmail +
          "</a>.</p>"
      });
    });
}

module.exports = getToken;
