import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import markerIcon from "./Chart/markerIcon.js";

import MappableMixin from "../../ModelMixins/MappableMixin";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";
import CreateModel from "../../Models/Definition/CreateModel";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import { computed, makeObservable } from "mobx";

class MeasurablePanelMarkerModel extends MappableMixin(
  CreateModel(MappableTraits)
) {
  readonly markerDataSource: CustomDataSource;

  constructor(uniqueId: string, terria: Terria) {
    super(uniqueId, terria);
    makeObservable(this);
    this.markerDataSource = new CustomDataSource("MeasurablePanelMarker");
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed get mapItems() {
    return [this.markerDataSource];
  }
}

export default class MeasurablePanelManager {
  private static markerModel: MeasurablePanelMarkerModel | null = null;
  private static terria: Terria;
  private static pointerOverChart = false;

  static initialize(terria: Terria) {
    MeasurablePanelManager.terria = terria;
  }

  static setPointerOverChart(value: boolean) {
    MeasurablePanelManager.pointerOverChart = value;
  }

  static isPointerOverChart() {
    return MeasurablePanelManager.pointerOverChart;
  }

  private static initializeModel() {
    if (!MeasurablePanelManager.markerModel && MeasurablePanelManager.terria) {
      MeasurablePanelManager.markerModel = new MeasurablePanelMarkerModel(
        createGuid(),
        MeasurablePanelManager.terria
      );
      MeasurablePanelManager.terria.overlays.add(
        MeasurablePanelManager.markerModel
      );
    }
  }

  static addMarker(position: Cartographic) {
    const isCesium2D =
      MeasurablePanelManager.terria?.mainViewer.viewerMode ===
      ViewerMode.Cesium2D;
    MeasurablePanelManager.initializeModel();
    if (!MeasurablePanelManager.markerModel) return;
    MeasurablePanelManager.removeAllMarkers();

    MeasurablePanelManager.markerModel.markerDataSource.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          Cartographic.toCartesian(position)
        ),
        billboard: {
          image: markerIcon,
          scale: 1.5,
          heightReference: isCesium2D
            ? HeightReference.NONE
            : HeightReference.CLAMP_TO_GROUND,
          eyeOffset: isCesium2D
            ? Cartesian3.ZERO
            : new Cartesian3(0.0, 0.0, 50.0)
        }
      })
    );

    MeasurablePanelManager.notifyRepaint();
  }

  static removeAllMarkers() {
    if (MeasurablePanelManager.markerModel) {
      MeasurablePanelManager.markerModel.markerDataSource.entities.removeAll();
      MeasurablePanelManager.notifyRepaint();
    }
  }

  private static notifyRepaint() {
    MeasurablePanelManager.terria.currentViewer.notifyRepaintRequired();
  }
}
