import express from "express";
import bytes from "bytes";
import packageJson from "../../package.json" with { type: "json" };

// Expose a whitelisted set of configuration attributes to the world. This definitely doesn't include authorisation tokens, local file paths, etc.
// It mirrors the structure of the real config file.
/**
 * Expose a whitelisted set of configuration attributes to the world. This definitely doesn't include authorisation tokens, local file paths, etc.
 * It mirrors the structure of the real config file.
 * @returns {import('./serverconfig').ServerConfigResponse}
 */
export default function (options) {
  const router = express.Router();
  const settings = Object.assign({}, options.settings);
  const safeSettings = {};
  const safeAttributes = [
    "allowProxyFor",
    "newShareUrlPrefix",
    "proxyAllDomains",
    "shareMaxRequestSize"
  ];
  safeAttributes.forEach((key) => (safeSettings[key] = settings[key]));
  safeSettings.version = packageJson.version;
  if (typeof settings.shareUrlPrefixes === "object") {
    safeSettings.shareUrlPrefixes = {};
    Object.keys(settings.shareUrlPrefixes).forEach((key) => {
      safeSettings.shareUrlPrefixes[key] = {
        service: settings.shareUrlPrefixes[key].service
      };
    });
  }
  if (settings.feedback && settings.feedback.additionalParameters) {
    safeSettings.additionalFeedbackParameters =
      settings.feedback.additionalParameters;
  }
  if (settings.shareMaxRequestSize) {
    safeSettings.shareMaxRequestSizeBytes = bytes.parse(
      settings.shareMaxRequestSize
    );
  }

  router.get("/", (_req, res) => {
    res.status(200).send(safeSettings);
  });
  return router;
}
