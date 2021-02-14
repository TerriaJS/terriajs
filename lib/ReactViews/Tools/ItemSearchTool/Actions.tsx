import React, { useEffect } from "react";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import { ItemSearchResult } from "../../../Models/ItemSearchProvider";

export type HideAllResultsProps = {
  item: SearchableItemMixin.Instance;
  results: ItemSearchResult[];
};

export const HideAllResults: React.FC<HideAllResultsProps> = props => {
  const { item, results } = props;
  useEffect(() => {
    const disposer = item.hideItemSearchResults(results);
    return disposer;
  }, [item, results]);
  return null;
};

export type HighlightResultsProps = {
  item: SearchableItemMixin.Instance;
  results: ItemSearchResult | ItemSearchResult[];
};

export const HighlightResults: React.FC<HighlightResultsProps> = props => {
  useEffect(() => {
    const item = props.item;
    const results = Array.isArray(props.results)
      ? props.results
      : [props.results];
    if (results.length === 1) zoomToResult(item, results[0]);
    const disposer = item.highlightItemSearchResults(results);
    return disposer;
  }, [props.item, props.results]);

  return null;
};

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
