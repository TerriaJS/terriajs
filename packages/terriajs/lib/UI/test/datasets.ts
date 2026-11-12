import { runInAction } from "mobx";
import UrlTemplateImageryCatalogItem from "../../Models/Catalog/CatalogItems/UrlTemplateImageryCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import type Terria from "../../Models/Terria";
import { TILES } from "./tiles";

/** Adds datasets to the map's workbench, by name, drawn from the test tile server */
export const addDatasets = async (
  terria: Terria,
  names: readonly string[]
): Promise<UrlTemplateImageryCatalogItem[]> => {
  const items = names.map((name) => {
    const item = new UrlTemplateImageryCatalogItem(`dataset-${name}`, terria);
    runInAction(() => {
      item.setTrait(CommonStrata.user, "name", name);
      item.setTrait(CommonStrata.user, "url", `${TILES}/{z}/{x}/{y}.png`);
    });
    // One of the map's models, as a catalogue's are, found by its id
    terria.addModel(item);
    return item;
  });
  for (const item of items) {
    await terria.workbench.add(item);
  }
  return items;
};
