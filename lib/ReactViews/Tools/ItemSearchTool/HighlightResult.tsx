import React, { useEffect } from "react";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import HeadingPitchRange from "terriajs-cesium/Source/Core/HeadingPitchRange";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import Cesium from "../../../Models/Cesium";
import ItemSearchProvider, {
  ItemSearchResult
} from "../../../Models/ItemSearchProvider";
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
  const terria = item.terria;
  terria.currentViewer.zoomTo(result.zoomToTarget as any, undefined as any);
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
