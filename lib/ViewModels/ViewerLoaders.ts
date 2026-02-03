import { observable } from "mobx";
import ViewerMode from "../Models/ViewerMode";
import TerriaViewer from "./TerriaViewer";

/**
 * Async loaders for viewers
 *
 * This is an observable record so that the app responds to changes
 */
const ViewerLoaders = observable({
  [ViewerMode.Leaflet]: (_terriaViewer: TerriaViewer) =>
    import("../Models/Leaflet").then((Leaflet) => Leaflet.default),

  [ViewerMode.Cesium]: (_terriaViewer: TerriaViewer) =>
    import("../Models/Cesium").then((Cesium) => Cesium.default)
});

export default ViewerLoaders;
