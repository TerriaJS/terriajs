import { TerriaPlugin } from "terriajs-plugin-api";
import registerCatalogMembers from "./Models/registerCatalogMembers";
import registerCustomComponentTypes from "./Views/registerCustomComponentTypes";

const plugin: TerriaPlugin = {
  name: "Ogc APIs",
  description: "OGC APIs",
  version: "0.0.1",

  register({ viewState }) {
    registerCatalogMembers();
    registerCustomComponentTypes();
  }
};

export { default as OgcProcessSettings } from "./Models/Ogc/Process/OgcProcessSettings";

export default plugin;
