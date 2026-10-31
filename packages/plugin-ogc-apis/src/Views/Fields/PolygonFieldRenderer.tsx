import { Feature, FeatureCollection } from "geojson";
import { reaction, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import {
  CommonStrata,
  Terria,
  UserDrawing,
  ViewState
} from "terriajs-plugin-api";
import isDefined from "terriajs/lib/Core/isDefined";
import Result from "terriajs/lib/Core/Result";
import featureDataToGeoJson from "terriajs/lib/Map/PickedFeatures/featureDataToGeoJson";
import GeoJsonCatalogItem from "terriajs/lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import TerriaFeature from "terriajs/lib/Models/Feature/Feature";
import MapInteractionMode from "terriajs/lib/Models/MapInteractionMode";
import { toLatLonDegrees } from "../../Core/toLatLonDegrees";

export async function pickPolygon(viewState: ViewState): Promise<Cartesian3[]> {
  return new Promise((resolve) => {
    const terria = viewState.terria;

    const userDrawing = new UserDrawing({
      terria,
      messageHeader: "Draw polygon",
      onDrawingComplete: ({ points }) => {
        // Close polygon
        resolve(points.length > 0 ? [...points, points[0]] : []);
        viewState.openAddData();
      },
      onCleanUp: function () {
        viewState.openAddData();
      }
    });

    userDrawing.enterDrawMode();
  });
}

export async function pickExistingPolygon({
  viewState,
  message
}: {
  viewState: ViewState;
  message: string;
}): Promise<Feature[]> {
  return new Promise((resolve) => {
    const terria = viewState.terria;
    let disposeReaction: (() => void) | undefined;

    const closePickMode = () => {
      disposeReaction?.();
      disposeReaction = undefined;
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
    };

    const mapInteractionMode = new MapInteractionMode({
      message,
      onCancel: () => closePickMode()
    });

    runInAction(() => {
      terria.pickedFeatures = undefined;
      viewState.explorerPanelIsVisible = false;
      terria.mapInteractionModeStack.push(mapInteractionMode);
    });

    disposeReaction = reaction(
      () => mapInteractionMode?.pickedFeatures,
      async (pickedFeatures) => {
        if (!pickedFeatures) {
          return;
        }

        await pickedFeatures.allFeaturesAvailablePromise;
        const geojsonItems = pickedFeatures?.features
          .map((f) => terriaFeatureToGeoJson(terria, f))
          .filter(isDefined);

        const result = Result.combine(
          await Promise.all(geojsonItems.map((it) => it.loadMapItems())),
          "Failed to load picked polygons"
        );

        let features: Feature[] = [];
        if (!result.error) {
          features = geojsonItems
            .map((it) => it.readyData?.features)
            .flat()
            .filter((f) => isDefined(f));
        }

        if (features.length > 0) {
          closePickMode();
          resolve(features);
        }
      }
    );
  });
}

function terriaFeatureToGeoJson(
  terria: Terria,
  feature: TerriaFeature
): GeoJsonCatalogItem | undefined {
  let geojson: Feature | FeatureCollection | undefined;

  if (feature.data) {
    geojson = featureDataToGeoJson(feature.data);
    // Note featureDataToGeoJson will only ever have a single feature
    // Add an id to it
    const firstFeature = geojson?.features[0];
    if (
      firstFeature &&
      firstFeature?.id === undefined &&
      feature.id !== undefined
    ) {
      firstFeature.id = feature.id;
    }
  } else if (feature.polygon) {
    const positions = feature.polygon.hierarchy
      ?.getValue(terria.timelineClock.currentTime)
      .positions.map(toLatLonDegrees);

    const properties = feature.properties
      ? feature.properties.getValue(terria.timelineClock.currentTime)
      : undefined;

    geojson = {
      id: feature.id,
      type: "Feature",
      properties,
      geometry: {
        coordinates: [[positions]],
        type: "MultiPolygon"
      }
    };
  }

  const catalogItem = new GeoJsonCatalogItem(undefined, terria);
  catalogItem.setTrait(CommonStrata.user, "geoJsonData", geojson as any);
  return catalogItem;
}

export function polygonFeature(points: Cartesian3[]): Feature {
  const coordinates = points.map(toLatLonDegrees);
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    },
    properties: {}
  };
}

export function featureCollection(
  features: Feature[]
): FeatureCollection | undefined {
  return features.length > 0
    ? {
        type: "FeatureCollection",
        features
      }
    : undefined;
}
