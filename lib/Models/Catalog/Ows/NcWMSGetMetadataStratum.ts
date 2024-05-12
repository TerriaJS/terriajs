import { computed, makeObservable, runInAction } from "mobx";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import WebMapServiceCatalogItemTraits, {
  NcWMSGetMetadataStratumTraits,
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
import { CommonStrata } from "terriajs-plugin-api";

export default class NcWMSGetMetadataStratum extends LoadableStratum(
  NcWMSGetMetadataStratumTraits
) {
  static stratumName = "ncWMSGetMetadata";
  static palettes: WebMapServiceAvailablePaletteTraits[] = [];
  constructor(readonly url: string) {
    super();
    makeObservable(this);
  }

  static async load(url: string): Promise<NcWMSGetMetadataStratum> {
    const paletteResult: WebMapServiceAvailablePaletteTraits[] = [];
    if (url) {
      const response = await fetch(url);
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

    NcWMSGetMetadataStratum.palettes = paletteResult.map((palette) => ({
      name: palette.name,
      title: palette.title,
      abstract: palette.abstract
    })) as Complete<WebMapServiceAvailablePaletteTraits>[];

    const nc = new NcWMSGetMetadataStratum(url);

    console.log(nc);

    return nc;
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new NcWMSGetMetadataStratum(this.url) as this;
  }
}

StratumOrder.addLoadStratum(NcWMSGetMetadataStratum.stratumName);
