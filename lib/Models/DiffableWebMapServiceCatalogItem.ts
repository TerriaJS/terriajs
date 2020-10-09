import { computed, runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import filterOutUndefined from "../Core/filterOutUndefined";
import DiffableMixin from "../ModelMixins/DiffableMixin";
import DiffableWebMapServiceCatalogItemTraits from "../Traits/DiffableWebMapServiceCatalogItemTraits";
import LegendTraits from "../Traits/LegendTraits";
import CommonStrata from "./CommonStrata";
import createStratumInstance from "./createStratumInstance";
import ExtendModel from "./ExtendModel";
import LoadableStratum from "./LoadableStratum";
import { ImageryParts } from "./Mappable";
import { BaseModel } from "./Model";
import { SelectableDimension } from "./SelectableDimensions";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";
import URI from "urijs";

const dateFormat = require("dateformat");

class DiffStratum extends LoadableStratum(
  DiffableWebMapServiceCatalogItemTraits
) {
  constructor(readonly catalogItem: DiffableWebMapServiceCatalogItem) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new DiffStratum(model as DiffableWebMapServiceCatalogItem) as this;
  }

  @computed
  get legends() {
    if (this.catalogItem.isShowingDiff && this.diffLegendUrl) {
      let urlMimeType;
      try {
        urlMimeType =
          new URL(this.diffLegendUrl).searchParams.get("format") || undefined;
      } catch {}
      return [
        createStratumInstance(LegendTraits, {
          url: this.diffLegendUrl,
          urlMimeType
        })
      ];
    }
    return undefined;
  }

  @computed
  get diffLegendUrl() {
    const diffStyleId = this.catalogItem.diffStyleId;
    const firstDate = this.catalogItem.firstDiffDate;
    const secondDate = this.catalogItem.secondDiffDate;
    if (diffStyleId && firstDate && secondDate) {
      return this.catalogItem.getLegendUrlForStyle(
        diffStyleId,
        JulianDate.fromIso8601(firstDate),
        JulianDate.fromIso8601(secondDate)
      );
    }
    return undefined;
  }

  @computed
  get disableDateTimeSelector() {
    return this.catalogItem.isShowingDiff;
  }

  @computed
  get shortReport() {
    const catalogItem = this.catalogItem;
    if (catalogItem.isShowingDiff) {
      const format = "yyyy/mm/dd";
      const d1 = dateFormat(catalogItem.firstDiffDate, format);
      const d2 = dateFormat(catalogItem.secondDiffDate, format);
      return `Showing difference image computed for ${catalogItem.diffStyleId} style on dates ${d1} and ${d2}`;
    }
  }
}

/**
 * A custom WMS catalog item that supports diffing imagery from two dates.
 */
export default class DiffableWebMapServiceCatalogItem extends DiffableMixin(
  ExtendModel(WebMapServiceCatalogItem, DiffableWebMapServiceCatalogItemTraits)
) {
  static readonly type = "diffable-wms";

  get type() {
    return DiffableWebMapServiceCatalogItem.type;
  }

  protected forceLoadMetadata(): Promise<void> {
    return super.forceLoadMetadata().then(stratum => {
      const diffStratum = new DiffStratum(this);
      runInAction(() =>
        this.strata.set(DiffableMixin.diffStratumName, diffStratum)
      );
    });
  }

  @computed
  get canDiffImages(): boolean {
    const hasValidDiffStyles = this.availableDiffStyles.some(diffStyle =>
      this.styleSelectableDimensions?.[0]?.options?.find(
        style => style.id === diffStyle
      )
    );
    return hasValidDiffStyles === true;
  }

  showDiffImage(
    firstDate: JulianDate,
    secondDate: JulianDate,
    diffStyleId: string
  ) {
    if (this.canDiffImages === false) {
      return;
    }

    // A helper to get the diff tag given a date string
    const firstDateStr = this.getTagForTime(firstDate);
    const secondDateStr = this.getTagForTime(secondDate);
    this.setTrait(CommonStrata.user, "firstDiffDate", firstDateStr);
    this.setTrait(CommonStrata.user, "secondDiffDate", secondDateStr);
    this.setTrait(CommonStrata.user, "diffStyleId", diffStyleId);
    this.setTrait(CommonStrata.user, "isShowingDiff", true);
  }

  clearDiffImage() {
    this.setTrait(CommonStrata.user, "firstDiffDate", undefined);
    this.setTrait(CommonStrata.user, "secondDiffDate", undefined);
    this.setTrait(CommonStrata.user, "diffStyleId", undefined);
    this.setTrait(CommonStrata.user, "isShowingDiff", false);
  }

  getLegendUrlForStyle(
    styleId: string,
    firstDate?: JulianDate,
    secondDate?: JulianDate
  ) {
    const firstTag = firstDate && this.getTagForTime(firstDate);
    const secondTag = secondDate && this.getTagForTime(secondDate);
    const time = filterOutUndefined([firstTag, secondTag]).join(",");
    const layerName = this.availableStyles.find(style =>
      style.styles.some(s => s.name === styleId)
    )?.layerName;
    const uri = URI(
      `${this.url}?service=WMS&version=1.1.0&request=GetLegendGraphic&format=image/png&transparent=True`
    )
      .addQuery("layer", encodeURIComponent(layerName || ""))
      .addQuery("styles", encodeURIComponent(styleId));
    if (time) {
      uri.addQuery("time", time);
    }
    return uri.toString();
  }

  @computed
  private get _diffImageryParts(): ImageryParts | undefined {
    const diffStyleId = this.diffStyleId;
    if (
      this.firstDiffDate === undefined ||
      this.secondDiffDate === undefined ||
      diffStyleId === undefined
    ) {
      return;
    }
    const time = `${this.firstDiffDate},${this.secondDiffDate}`;
    const imageryProvider = this._createImageryProvider(time);
    if (imageryProvider) {
      return {
        imageryProvider,
        alpha: this.opacity,
        show: this.show !== undefined ? this.show : true
      };
    }
    return undefined;
  }

  @computed
  get parameters() {
    return {
      ...super.parameters,
      ...(this.isShowingDiff && this.diffStyleId
        ? { styles: this.diffStyleId }
        : {})
    };
  }

  @computed
  get styleSelectableDimensions(): SelectableDimension[] {
    return super.styleSelectableDimensions.map(dim => ({
      ...dim,
      disable: this.isShowingDiff
    }));
  }

  @computed
  get mapItems() {
    return this.isShowingDiff === true
      ? this._diffImageryParts
        ? [this._diffImageryParts]
        : []
      : super.mapItems;
  }
}
