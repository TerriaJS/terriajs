import {
  createPluginContext,
  TerriaPluginModule,
  ViewState
} from "terriajs-plugin-api";
import TerriaError from "terriajs/lib/Core/TerriaError";

/**
 * Load plugin modules.
 *
 * @param viewState - The {@link ViewState} instance
 * @param getPluginsList - A function returning an array of promises for plugin modules (i.e the value exported from plugins.ts)
 */
async function loadPlugins(
  viewState: ViewState,
  getPluginsList: () => Promise<TerriaPluginModule>[]
): Promise<void> {
  try {
    const pluginsList = getPluginsList();
    const loadPromises = pluginsList.map((promise) => {
      const pluginContext = createPluginContext(viewState);
      return promise
        .then(({ default: plugin }) => {
          try {
            plugin.register(pluginContext);
          } catch (ex) {
            TerriaError.from(ex, {
              title: `Error when registering plugin "${plugin.name}"`
            }).log();
          }
        })
        .catch((ex) => {
          TerriaError.from(ex, {
            title: `Error when loading a plugin`
          }).log();
        });
    });
    await Promise.all(loadPromises);
  } catch (err) {
    return Promise.reject(err);
  }
}

export default loadPlugins;
