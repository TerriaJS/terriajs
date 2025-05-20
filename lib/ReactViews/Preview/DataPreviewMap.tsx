"use strict";
import classNames from "classnames";
import {
  action,
  makeObservable,
  computed as mobxComputed,
  observable
} from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import filterOutUndefined from "../../Core/filterOutUndefined";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { ImageryParts } from "../../ModelMixins/MappableMixin";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import CreateModel from "../../Models/Definition/CreateModel";
import { ModelConstructorParameters } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";
import TerriaViewer from "../../ViewModels/TerriaViewer";
import Styles from "./data-preview-map.scss";

type PreviewedItem = MappableMixin.Instance & CatalogMemberMixin.Instance;

// AdaptForPreviewMap class remains largely the same
class AdaptForPreviewMap extends MappableMixin(CreateModel(MappableTraits)) {
  @observable previewed: PreviewedItem | undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  async forceLoadMapItems() {}

  @mobxComputed
  get mapItems() {
    return (
      this.previewed?.mapItems.map((m) =>
        ImageryParts.is(m)
          ? {
              ...m,
              alpha: m.alpha !== 0.0 ? 1.0 : 0.0,
              show: true
            }
          : m
      ) ?? []
    );
  }
}

interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

const createBoundingRectangleCatalogItem = (
  terria: Terria,
  bbox: BBox,
  id = "__preview-data-extent"
) => {
  const rectangleCatalogItem = new GeoJsonCatalogItem(id, terria);

  rectangleCatalogItem.setTrait(CommonStrata.user, "geoJsonData", {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          stroke: "#08ABD5",
          "stroke-width": 2,
          "stroke-opacity": 1
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [bbox.west, bbox.south],
            [bbox.west, bbox.north],
            [bbox.east, bbox.north],
            [bbox.east, bbox.south],
            [bbox.west, bbox.south]
          ]
        }
      }
    ]
  });
  rectangleCatalogItem.loadMapItems();
  return rectangleCatalogItem;
};

interface DataPreviewMapProps {
  terria: Terria;
  previewed?: PreviewedItem;
  showMap?: boolean;
}

const DataPreviewMap: FC<DataPreviewMapProps> = observer((props) => {
  const { t } = useTranslation();
  const { terria, previewed, showMap } = props;

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const isZoomedToExtentRef = useRef(false);

  const homeCamera = useMemo(() => {
    return terria.mainViewer.homeCamera;
  }, [terria]);

  const boundingRectangleCatalogItem = useMemo(() => {
    const rectangle = previewed?.rectangle;
    if (!rectangle) {
      return undefined;
    }
    const { west, south, east, north } = rectangle;

    if (
      west === undefined ||
      south === undefined ||
      east === undefined ||
      north === undefined
    ) {
      return undefined;
    }

    return createBoundingRectangleCatalogItem(
      terria,
      {
        west,
        south,
        east,
        north
      },
      "__preview-data-extent"
    );
  }, [previewed?.rectangle, terria]);

  const zoomedOutBoundingRectangleCatalogItem = useMemo(() => {
    const rectangle = previewed?.rectangle;
    if (!rectangle) {
      return undefined;
    }
    let { west, south, east, north } = rectangle;

    if (
      west === undefined ||
      south === undefined ||
      east === undefined ||
      north === undefined
    ) {
      return undefined;
    }

    // When zoomed out, make sure the dataset rectangle is at least 5% of the width and height
    // the home view, so that it is actually visible.
    const minimumFraction = 0.05;
    const homeView = homeCamera;
    const minimumWidth =
      CesiumMath.toDegrees(homeView.rectangle.width) * minimumFraction;
    if (east - west < minimumWidth) {
      const center = (east + west) * 0.5;
      west = center - minimumWidth * 0.5;
      east = center + minimumWidth * 0.5;
    }

    const minimumHeight =
      CesiumMath.toDegrees(homeView.rectangle.height) * minimumFraction;
    if (north - south < minimumHeight) {
      const center = (north + south) * 0.5;
      south = center - minimumHeight * 0.5;
      north = center + minimumHeight * 0.5;
    }

    return createBoundingRectangleCatalogItem(
      terria,
      {
        west,
        south,
        east,
        north
      },
      "__preview-data-extent-zoomed-out"
    );
  }, [homeCamera, previewed?.rectangle, terria]);

  const previewViewer = useMemo(() => {
    const viewer = new TerriaViewer(
      terria,
      mobxComputed(() => {
        const previewItem = new AdaptForPreviewMap(undefined, terria);
        previewItem.previewed = previewed;
        return filterOutUndefined([
          previewItem,
          boundingRectangleCatalogItem,
          zoomedOutBoundingRectangleCatalogItem
        ]);
      })
    );

    viewer.viewerMode = ViewerMode.Leaflet;
    viewer.disableInteraction = true;
    viewer.homeCamera = homeCamera;

    return viewer;
  }, [
    boundingRectangleCatalogItem,
    homeCamera,
    previewed,
    terria,
    zoomedOutBoundingRectangleCatalogItem
  ]);

  useEffect(() => {
    console.log(
      "Initialising preview map. This might be expensive, so this should only show up when the preview map disappears and reappears"
    );

    const container = mapContainerRef.current;

    const baseMapItems = terria.baseMapsModel.baseMapItems;
    const initPreviewBaseMap = action(() =>
      baseMapItems.find(
        (bm) => bm.item.uniqueId === terria.baseMapsModel.previewBaseMapId
      )
    )();
    if (initPreviewBaseMap) {
      previewViewer.setBaseMap(initPreviewBaseMap.item);
    } else {
      previewViewer.setBaseMap(
        baseMapItems.length > 0 ? baseMapItems[0].item : undefined
      );
    }

    previewViewer.attach(container!);

    return () => {
      console.log("Cleaning up preview map.");
      if (previewViewer.attached) {
        previewViewer.detach();
      }
    };
  }, [
    previewViewer,
    terria.baseMapsModel.baseMapItems,
    terria.baseMapsModel.previewBaseMapId
  ]);

  const toggleZoom = action(() => {
    isZoomedToExtentRef.current = !isZoomedToExtentRef.current;

    if (isZoomedToExtentRef.current) {
      boundingRectangleCatalogItem?.setTrait(
        CommonStrata.override,
        "show",
        true
      );
      zoomedOutBoundingRectangleCatalogItem?.setTrait(
        CommonStrata.override,
        "show",
        false
      );
      if (previewed) {
        previewViewer?.currentViewer.zoomTo(previewed);
      }
    } else {
      boundingRectangleCatalogItem?.setTrait(
        CommonStrata.override,
        "show",
        false
      );
      zoomedOutBoundingRectangleCatalogItem?.setTrait(
        CommonStrata.override,
        "show",
        true
      );
      previewViewer.currentViewer.zoomTo(previewViewer?.homeCamera);
    }
  });

  const previewBadgeState = useMemo(() => {
    if (previewed?.isLoading) return "loading";
    if (
      previewed?.loadMetadataResult?.error ||
      previewed?.loadMapItemsResult?.error
    )
      return "dataPreviewError";

    if (
      (!previewed?.mapItems || previewed.mapItems.length === 0) &&
      !boundingRectangleCatalogItem
    )
      return "noPreviewAvailable";
    return "dataPreview";
  }, [
    boundingRectangleCatalogItem,
    previewed?.isLoading,
    previewed?.loadMapItemsResult?.error,
    previewed?.loadMetadataResult?.error,
    previewed?.mapItems
  ]);

  const previewBadgeLabels: Record<string, string> = {
    loading: t("preview.loading"),
    noPreviewAvailable: t("preview.noPreviewAvailable"),
    dataPreview: t("preview.dataPreview"),
    dataPreviewError: t("preview.dataPreviewError")
  };

  return (
    <div className={Styles.map} onClick={toggleZoom}>
      {showMap ? (
        <div
          className={classNames(Styles.terriaPreview)}
          ref={mapContainerRef}
          key="terria-preview-map" // Ensures DOM is recreated if map needs clean state on show/hide
        />
      ) : (
        <div
          className={classNames(Styles.terriaPreview, Styles.placeholder)}
          key="terria-preview-placeholder"
        />
      )}
      <label className={Styles.badge}>
        {previewBadgeLabels[previewBadgeState] || ""}
      </label>
    </div>
  );
});

export default DataPreviewMap;
