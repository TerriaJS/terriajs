import { computed, makeObservable } from "mobx";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import {
  NcWMSGetMetadataStratumTraits,
  WebMapServiceAvailablePaletteTraits
} from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import StratumOrder from "../../Definition/StratumOrder";

export default class NcWMSGetMetadataStratum extends LoadableStratum(
  NcWMSGetMetadataStratumTraits
) {
  static stratumName = "ncWMSGetMetadata";

  constructor(readonly url: string, readonly metadata: any) {
    super();
    makeObservable(this);
  }

  static async load(
    url: string,
    metadata?: any
  ): Promise<NcWMSGetMetadataStratum> {
    if (url) {
      const response = await fetch(url);
      const _metadata = await response.json();
      metadata = _metadata;
    }
    return new NcWMSGetMetadataStratum(url, metadata);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new NcWMSGetMetadataStratum(this.url, this.metadata) as this;
  }
  @computed
  get showPalettes() {
    return this.availablePalettes.length > 0;
  }

  @computed
  get availablePalettes() {
    const paletteResult = this.metadata.palettes.map((palette: any) => ({
      name: palette,
      title: palette,
      abstract: palette
    }));

    return paletteResult;
  }

  @computed
  get noPaletteStyles() {
    return this.metadata.noPaletteStyles;
  }

  @computed
  get defaultPalette() {
    return this.metadata.defaultPalette;
  }
}

StratumOrder.addLoadStratum(NcWMSGetMetadataStratum.stratumName);
