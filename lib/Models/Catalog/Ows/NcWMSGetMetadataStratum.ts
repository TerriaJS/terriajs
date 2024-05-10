import { computed, makeObservable, runInAction } from "mobx";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import WebMapServiceCatalogItemTraits, {
  WebMapServiceAvailablePaletteTraits,
  WebMapServiceAvailableStyleTraits
} from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import UrlReference from "../CatalogReferences/UrlReference";
import { Complete } from "../../../Core/TypeModifiers";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import { SelectableDimensionEnum } from "../../SelectableDimensions/SelectableDimensions";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";
import isDefined from "../../../Core/isDefined";
import StratumOrder from "../../Definition/StratumOrder";

export default class NcWMSGetMetadataStratum extends LoadableStratum(
  WebMapServiceCatalogItemTraits
) {
  static stratumName = "ncWMSGetMetadata";
  static availablePalettes: Complete<{
    name?: string | undefined;
    title?: string | undefined;
    abstract?: string | undefined;
  }>[];

  static async load(
    catalogItem: WebMapServiceCatalogItem,
    availablePalettes?: StratumFromTraits<WebMapServiceAvailablePaletteTraits>[]
  ): Promise<NcWMSGetMetadataStratum> {
    const paletteResult: StratumFromTraits<WebMapServiceAvailablePaletteTraits>[] =
      [];

    const url = catalogItem
      .uri!.clone()
      .setSearch({
        service: "WMS",
        version: catalogItem.useWmsVersion130 ? "1.3.0" : "1.1.1",
        request: "GetMetadata",
        item: "layerDetails",
        layerName: catalogItem.layersArray[0]
      })
      .toString();

    if (url) {
      const paletteUrl = proxyCatalogItemUrl(catalogItem, url);
      const response = await fetch(paletteUrl);
      const data = await response.json();
      const palettes = data.palettes;
      palettes.forEach((palette: any) => {
        paletteResult.push({
          name: palette,
          title: palette,
          abstract: palette
        });
      });
    }

    const stratum = new NcWMSGetMetadataStratum(catalogItem, availablePalettes);
    console.log(stratum);
    return stratum;
  }

  constructor(
    readonly catalogItem: WebMapServiceCatalogItem,
    availablePalettes?: StratumFromTraits<WebMapServiceAvailablePaletteTraits>[]
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
    StratumFromTraits<WebMapServiceAvailablePaletteTraits>[]
  > {
    const paletteResult: StratumFromTraits<WebMapServiceAvailablePaletteTraits>[] =
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
          abstract: palette
        });
      });
    }

    return paletteResult;
  }
}

StratumOrder.addLoadStratum(NcWMSGetMetadataStratum.stratumName);
