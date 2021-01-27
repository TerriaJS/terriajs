import React, { useEffect } from "react";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import LatLonHeight from "../../../Core/LatLonHeight";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import Cesium from "../../../Models/Cesium";
import { ItemSearchResult } from "../../../Models/ItemSearchProvider";
import usePrevious from "../../Hooks/usePrevious";

export type HighlightResultProps = {
  item: SearchableItemMixin.Instance;
  result: ItemSearchResult;
};

const HighlightResult: React.FC<HighlightResultProps> = props => {
  const previousResult = usePrevious(props.result);

  useEffect(() => {
    const { item, result } = props;
    if (previousResult) unhighlightResult(item, previousResult);
    zoomToResult(item, result);
    highlightResult(item, result);
    return () => {
      unhighlightResult(item, result);
    };
  }, [props.result]);

  return null;
};

export default HighlightResult;

function zoomToResult(
  item: SearchableItemMixin.Instance,
  result: ItemSearchResult
): void {
  if (item.zoomToItemSearchResult) {
    item.zoomToItemSearchResult(result);
  } else {
    item.terria.currentViewer.zoomTo(
      result.zoomToTarget as any,
      undefined as any
    );
  }
}

function cesiumZoomToFeature(
  cesium: Cesium,
  zoomTarget: ItemSearchResult["zoomToTarget"]
) {
  if (zoomTarget instanceof BoundingSphere) {
    cesium.scene.camera.flyToBoundingSphere(zoomTarget);
  } else {
    const { latitude, longitude, featureHeight } = zoomTarget;
    if (featureHeight > 20) {
      const cartographic = Cartographic.fromDegrees(longitude, latitude);
      const center = Ellipsoid.WGS84.cartographicToCartesian(cartographic);
      const boundingSphere = new BoundingSphere(center, featureHeight * 2);
      cesium.scene.camera.flyToBoundingSphere(boundingSphere);
    } else {
      sampleTerrainMostDetailed(cesium.scene.terrainProvider, [
        Cartographic.fromDegrees(longitude, latitude)
      ]).then(([preciseCartographic]) => {
        preciseCartographic.height += featureHeight;
        const destination = Ellipsoid.WGS84.cartographicToCartesian(
          preciseCartographic
        );
        cesium.scene.camera.flyTo({ destination });
      });
    }
  }
}

function highlightResult(
  item: SearchableItemMixin.Instance,
  result: ItemSearchResult
) {
  item.selectItemSearchResult(result);
}

function unhighlightResult(
  item: SearchableItemMixin.Instance,
  result: ItemSearchResult
) {
  item.unselectItemSearchResult(result);
}
