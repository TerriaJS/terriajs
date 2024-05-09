import { computed, makeObservable, runInAction } from "mobx";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import WebMapServiceCatalogItemTraits, {
  WebMapServiceAvailableStyleTraits
} from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import UrlReference from "../CatalogReferences/UrlReference";
import { Complete } from "../../../Core/TypeModifiers";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import { SelectableDimensionEnum } from "../../SelectableDimensions/SelectableDimensions";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";
import isDefined from "../../../Core/isDefined";

export default class NcWMSGetMetadataStratum extends LoadableStratum(
  WebMapServiceCatalogItemTraits
) {
  static stratumName = "ncWMSGetMetadata";

  static async load(
    catalogItem: WebMapServiceCatalogItem,
    availablePalettes: string[]
  ): Promise<NcWMSGetMetadataStratum> {
    if (!isDefined(availablePalettes)) {
      const palettes = await new NcWMSGetMetadataStratum(
        catalogItem,
        []
      ).fetchPalettes();
      availablePalettes = palettes.map((palette) => palette.name || "");
    }
    return new NcWMSGetMetadataStratum(catalogItem, availablePalettes);
  }

  constructor(
    readonly catalogItem: WebMapServiceCatalogItem,
    readonly availablePalettes: string[]
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new NcWMSGetMetadataStratum(
      model as WebMapServiceCatalogItem,
      this.availablePalettes
    ) as this;
  }

  async fetchPalettes(): Promise<
    StratumFromTraits<WebMapServiceAvailableStyleTraits>[]
  > {
    const paletteResult: StratumFromTraits<WebMapServiceAvailableStyleTraits>[] =
      [];

    const url = this.catalogItem
      .uri!.clone()
      .setSearch({
        service: "WMS",
        version: this.useWmsVersion130 ? "1.3.0" : "1.1.1",
        request: "GetMetadata",
        item: "layerDetails",
        layerName: this.catalogItem.layersArray[0]
      })
      .toString();

    if (url) {
      const paletteUrl = proxyCatalogItemUrl(this.catalogItem, url);
      const response = await fetch(paletteUrl);
      const data = await response.json();
      const palettes = data.palettes;
      palettes.forEach((palette: any) => {
        paletteResult.push({
          name: palette,
          title: palette,
          abstract: palette,
          legend: this.legends && this.legends[0] // Add null check and default value
        });
      });
    }

    return paletteResult;
  }
}
