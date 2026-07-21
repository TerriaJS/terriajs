import { TerriaErrorSeverity } from "../Core/TerriaError";
import defined from "terriajs-cesium/Source/Core/defined";

// The set of origins allowed to send start data to this application: the
// application's own origin, plus any explicitly configured by the operator.
function getAllowedOrigins(terria, window) {
  const allowedOrigins = [];

  // Same-origin is always allowed.
  const selfOrigin = window.location && window.location.origin;
  if (selfOrigin) {
    allowedOrigins.push(selfOrigin);
  }

  // Operator-configured cross-origin embedders.
  const configured =
    terria.configParameters &&
    terria.configParameters.parentMessageAllowedOrigins;
  if (Array.isArray(configured)) {
    configured.forEach(function (origin) {
      if (typeof origin === "string" && allowedOrigins.indexOf(origin) === -1) {
        allowedOrigins.push(origin);
      }
    });
  }

  return allowedOrigins;
}

const updateApplicationOnMessageFromParentWindow = function (terria, window) {
  const allowedOrigins = getAllowedOrigins(terria, window);

  window.addEventListener(
    "message",
    async function (event) {
      const origin = event.origin;

      // Only accept messages from an allowed origin. The frame relationship
      // (window.parent / window.opener) is deliberately NOT trusted: a page that
      // frames or opens TerriaJS is the parent/opener, so trusting it would let
      // any such page inject start data. Same-origin is always allowed; other
      // origins must be listed in `config.parentMessageAllowedOrigins`.
      if (!defined(origin) || allowedOrigins.indexOf(origin) === -1) {
        return;
      }

      // Ignore react devtools
      if (/^react-devtools/gi.test(event.data.source)) {
        return;
      }

      (
        await terria.updateFromStartData(
          event.data,
          "Start data from message from parent window",
          TerriaErrorSeverity.Error
        )
      ).raiseError(terria);
    },
    false
  );

  // Tell the parent/opener we are ready to receive start data. Post to each
  // allowed origin explicitly (never "*") so the "ready" signal is only
  // delivered to an intended recipient.
  if (window.parent !== window) {
    allowedOrigins.forEach(function (origin) {
      window.parent.postMessage("ready", origin);
    });
  }

  if (window.opener) {
    allowedOrigins.forEach(function (origin) {
      window.opener.postMessage("ready", origin);
    });
  }
};

export default updateApplicationOnMessageFromParentWindow;
