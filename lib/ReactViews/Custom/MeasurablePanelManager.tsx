import BillboardCollection from "terriajs-cesium/Source/Scene/BillboardCollection";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import Terria from "../../Models/Terria";
import markerIcon from "./Chart/markerIcon.js";

export default class MeasurablePanelManager {
  private static billboardCollection: BillboardCollection | null = null;
  private static terria: Terria;

  static initialize(terria: Terria) {
    MeasurablePanelManager.terria = terria;
  }

  private static initializeCollection() {
    if (
      !MeasurablePanelManager.billboardCollection &&
      MeasurablePanelManager.terria.cesium?.scene
    ) {
      MeasurablePanelManager.billboardCollection = new BillboardCollection({
        scene: MeasurablePanelManager.terria.cesium.scene
      });
      MeasurablePanelManager.terria.cesium.scene.primitives.add(
        MeasurablePanelManager.billboardCollection
      );
    }
  }

  static addMarker(position: Cartographic) {
    MeasurablePanelManager.initializeCollection();
    if (!MeasurablePanelManager.billboardCollection) return;
    MeasurablePanelManager.removeAllMarkers();
    MeasurablePanelManager.billboardCollection.add({
      position: Cartographic.toCartesian(position),
      scale: 1.5,
      image: markerIcon,
      eyeOffset: new Cartesian3(0.0, 0.0, -50.0),
      heightReference: HeightReference.CLAMP_TO_GROUND,
      id: "chartPointPlaceholder"
    });

    MeasurablePanelManager.notifyRepaint();
  }

  static removeAllMarkers() {
    if (MeasurablePanelManager.billboardCollection) {
      MeasurablePanelManager.billboardCollection.removeAll();
      MeasurablePanelManager.notifyRepaint();
    }
  }

  private static notifyRepaint() {
    MeasurablePanelManager.terria.currentViewer.notifyRepaintRequired();
  }
}
