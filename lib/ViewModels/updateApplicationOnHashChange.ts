import { updateInitSourcesFromUrl } from "../Models/InitSource";
import Terria from "../Models/Terria";

/**
 * Updates the  {@link Terria} when the window's 'hashchange' event is raised.  This allows new init files and
 * "start=" URLs to be loaded just by changing the hash portion of the URL in the browser's address bar.
 *
 * @param  {Terria} terria The Terria instance to update.
 * @param {Window} window The browser's window DOM object.
 */
export default function (terria: Terria, window: Window) {
  window.addEventListener(
    "hashchange",
    async function () {
      try {
        const baseUrl = `${window.location.origin}/${terria.baseUrl}`.replace(
          /(\.\/|\/\.|\.)$/,
          ""
        );

        await updateInitSourcesFromUrl(
          window.location.toString(),
          baseUrl,
          terria
        );

        (await terria.loadInitSources()).throwIfError();
      } catch (e) {
        terria.raiseErrorToUser(e);
      }
    },
    false
  );
}
