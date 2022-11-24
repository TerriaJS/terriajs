import isDefined from "../Core/isDefined";
import { TerriaErrorSeverity } from "../Core/TerriaError";
import { addInitSourcesFromStartData } from "../Models/InitSource";
import Terria from "../Models/Terria";

export default function (terria: Terria, window: Window) {
  var allowOrigin: string | undefined;

  window.addEventListener(
    "message",
    async function (event) {
      var origin = event.origin;
      if (!isDefined(origin) && isDefined((event as any).originalEvent)) {
        // For Chrome, the origin property is in the event.originalEvent object.
        origin = (event as any).originalEvent.origin;
      }

      if (
        (!isDefined(allowOrigin) || origin !== allowOrigin) && // allowed origin in url hash parameter
        event.source !== window.parent && // iframe parent
        event.source !== window.opener
      ) {
        // caller of window.open
        return;
      }

      // receive allowOrigin
      if (
        (event.source === window.opener || event.source === window.parent) &&
        event.data.allowOrigin
      ) {
        allowOrigin = event.data.allowOrigin;
        delete event.data.allowOrigin;
      }

      // Ignore react devtools
      if (/^react-devtools/gi.test(event.data.source)) {
        return;
      }

      try {
        await addInitSourcesFromStartData(
          terria,
          event.data,
          "Start data from message from parent window",
          TerriaErrorSeverity.Error
        );
      } catch (e) {
        terria.raiseErrorToUser(e);
      }

      return await terria.loadInitSources();
    },
    false
  );

  if (window.parent !== window) {
    window.parent.postMessage("ready", "*");
  }

  if (window.opener) {
    window.opener.postMessage("ready", "*");
  }
}
