import { computed, makeObservable, override } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import AbstractConstructor from "../Core/AbstractConstructor";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import Model, { BaseModel } from "../Models/Definition/Model";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import { SelectableDimensionEnum } from "../Models/SelectableDimensions/SelectableDimensions";
import DiffableTraits from "../Traits/TraitsClasses/DiffableTraits";
import LegendTraits from "../Traits/TraitsClasses/LegendTraits";
import MappableMixin from "./MappableMixin";
import TimeFilterMixin from "./TimeFilterMixin";

export class DiffStratum extends LoadableStratum(DiffableTraits) {
  static stratumName = "diffStratum";
  constructor(readonly catalogItem: DiffableMixin.Instance) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new DiffStratum(model as DiffableMixin.Instance) as this;
  }

  @computed
  get legends() {
    if (this.catalogItem.isShowingDiff && this.diffLegendUrl) {
      const urlMimeType =
        new URL(this.diffLegendUrl).searchParams.get("format") || undefined;
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
  get disableExport() {
    // disable export if showing diff
    // currently there is no way to generate export for the difference layer as
    // it requires 2 time parameters which is not supported in standard WCS
    return this.catalogItem.isShowingDiff;
  }

  @computed
  get disableSplitter() {
    // disable splitter if showing diff
    // currently there is no use splitting the difference layer because
    // most comparable features like style, datetime etc are disabled.
    return this.catalogItem.isShowingDiff;
  }
}

type BaseType = Model<DiffableTraits> & MappableMixin.Instance;

function DiffableMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class DiffableMixin extends TimeFilterMixin(Base) {
    constructor(...args: any[]) {
      super(...args);

      makeObservable(this);

      const diffStratum = new DiffStratum(this);
      this.strata.set(DiffStratum.stratumName, diffStratum);
    }

    abstract get styleSelectableDimensions():
      | SelectableDimensionEnum[]
      | undefined;

    get hasDiffableMixin() {
      return true;
    }

    abstract get canDiffImages(): boolean;

    abstract showDiffImage(
      firstDate: JulianDate,
      secondDate: JulianDate,
      diffStyleId: string
    ): void;

    abstract clearDiffImage(): void;

    abstract getLegendUrlForStyle(
      diffStyleId: string,
      firstDate?: JulianDate,
      secondDate?: JulianDate
    ): string;

    @override
    get canFilterTimeByFeature() {
      // Hides the SatelliteImageryTimeFilterSection for the item if it is
      // currently showing difference image
      return super.canFilterTimeByFeature && !this.isShowingDiff;
    }
  }

  return DiffableMixin;
}

namespace DiffableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof DiffableMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasDiffableMixin;
  }
}

export default DiffableMixin;
