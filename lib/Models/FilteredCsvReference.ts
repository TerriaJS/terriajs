import {
  computed,
  toJS,
  observable,
  IObservableValue,
  IComputedValue,
  extendObservable,
  action,
  runInAction,
  autorun,
  reaction
} from "mobx";
import { createTransformer } from "mobx-utils";
import filterOutUndefined from "../Core/filterOutUndefined";
import {
  isJsonObject,
  isJsonString,
  JsonArray,
  JsonObject
} from "../Core/Json";
import loadJson from "../Core/loadJson";
import TerriaError from "../Core/TerriaError";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import MagdaDistributionFormatTraits from "../Traits/MagdaDistributionFormatTraits";
import MagdaReferenceTraits from "../Traits/MagdaReferenceTraits";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import { BaseModel } from "./Model";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import Terria from "./Terria";
import updateModelFromJson from "./updateModelFromJson";
import ModelTraits from "../Traits/ModelTraits";
import StratumOrder from "./StratumOrder";
import Csv from "../Table/Csv";
import CsvCatalogItem from "./CsvCatalogItem";
import FilteredCsvReferenceTraits, {
  FilterTraits
} from "../Traits/FilteredCsvReferenceTraits";
import Concept from "../Map/Concept";
import { uniq, extend } from "lodash-es";
import { Model } from "cesium";
import isDefined from "../Core/isDefined";

export default class FilteredCsvReference extends UrlMixin(
  ReferenceMixin(CreateModel(FilteredCsvReferenceTraits))
) {
  static readonly type = "filtered-csv";

  get type() {
    return FilteredCsvReference.type;
  }

  private _stopReloadingCsv?: () => void;

  @observable private _originalCsvData: string[][] = [];

  @computed private get csvData(): string[][] {
    // Apply the filters one after another
    return this.filters.reduce((csvData, filter) => {
      if (filter.column !== undefined && filter.value !== undefined) {
        // Find the correctly named column
        const index = csvData.findIndex(column => column[0] === filter.column);
        if (index === -1) {
          return csvData;
        }
        // Find all the rows with the matching value
        const filterRows = new Set(
          csvData[index]
            .map((_, i) => i)
            .filter(i => csvData[index][i] === filter.value)
        );
        // Keep header and matching rows
        return csvData.map(column =>
          column.filter((_, i) => i === 0 || filterRows.has(i))
        );
      }
      return csvData;
    }, this._originalCsvData);
  }

  uniqueColumnValues = createTransformer((column: string[]) =>
    uniq(column.slice(1))
  );

  filterColumnConcepts = createTransformer((column: string[]) => {
    const columnName = column[0];
    const uniqueValues = this.uniqueColumnValues(column);

    return new FilterColumnConcept(
      column[0],
      uniqueValues.map(val => {
        const filterIndex = this.filters.findIndex(
          filter => filter.column === columnName && filter.value === val
        );
        const isActiveComputed = computed(() =>
          isDefined(
            this.filters.find(
              filter => filter.column === columnName && filter.value === val
            )
          )
        );
        return new FilterValueConcept(
          val,
          isActiveComputed,
          action((active: boolean) => {
            console.log(
              `${JSON.stringify({
                column: columnName,
                value: val
              })} set to ${active}`
            );
            if (isActiveComputed.get() !== active) {
              const userFilters = this.getTrait(CommonStrata.user, "filters");
              if (active) {
                console.log("No existing filter");
                this.setTrait(CommonStrata.user, "filters", [
                  ...(userFilters || []),
                  { column: columnName, value: val }
                ]);
              } else {
                const userFiltersIndex =
                  userFilters &&
                  userFilters.findIndex(
                    filter =>
                      filter.column === columnName && filter.value === val
                  );
                if (
                  isDefined(userFilters) &&
                  isDefined(userFiltersIndex) &&
                  userFiltersIndex !== -1
                ) {
                  // Remove the filter from the user strata
                  this.setTrait(CommonStrata.user, "filters", [
                    ...userFilters.slice(0, userFiltersIndex),
                    ...userFilters.slice(userFiltersIndex + 1)
                  ]);
                } else {
                  // Filter is in a different strata. Panic!
                  console.log(
                    `Can't turn off this filter: ${JSON.stringify({
                      column: columnName,
                      value: val
                    })}`
                  );
                }
              }
            }
          })
        );
      })
    );
  });

  @computed get concepts() {
    return this._originalCsvData.map(column =>
      this.filterColumnConcepts(column)
    );
  }

  // constructor(
  //   id: string | undefined,
  //   terria: Terria,
  //   sourceReference?: BaseModel,
  //   strata?: Map<string, StratumFromTraits<ModelTraits>>
  // ) {
  //   super(id, terria, sourceReference, strata);
  // }

  protected async forceLoadReference(
    previousTarget: CsvCatalogItem | undefined
  ): Promise<BaseModel | undefined> {
    const that = this;
    if (this.url !== undefined) {
      let item = previousTarget;
      if (item === undefined) {
        item = new CsvCatalogItem(this.uniqueId, this.terria, this);
        runInAction(() => {
          extendObservable(item!, {
            get concepts() {
              return that.concepts;
            }
          });

          item!.csvData = computed(() => this.csvData);
          this._stopReloadingCsv && this._stopReloadingCsv();
          this._stopReloadingCsv = reaction(
            () => this.csvData,
            csvData => {
              console.log("Reloading CSV");
              item!.loadMapItems();
            }
          );
        });
      }
      const data = await Csv.parseUrl(
        proxyCatalogItemUrl(this, this.url, "1d"),
        true
      );
      runInAction(() => {
        this._originalCsvData = data;
      });
      if (this.csvItemConfig) {
        updateModelFromJson(
          item,
          CommonStrata.override,
          this.csvItemConfig,
          true
        );
      }
      return item;
    } else {
      throw new TerriaError({
        sender: this,
        title: "No CSV available",
        message:
          "The CSV catalog item cannot be loaded because it was not configured " +
          "with a `url` or `csvString` property."
      });
    }
  }
}

class FilterValueConcept {
  readonly id: string;
  readonly isSelectable = true;
  readonly hasChildren = false;
  @observable isVisible = true;
  parent?: FilterColumnConcept;
  constructor(
    readonly name: string,
    private readonly _isActive:
      | IComputedValue<boolean>
      | IObservableValue<boolean>,
    readonly setActive: (active: boolean) => void
  ) {
    this.id = name;
  }

  @computed get isActive() {
    return this._isActive.get();
  }

  toggleActive() {
    if (this.parent && !this.parent.allowMultiple) {
      this.parent.deactivateAllChildren();
      this.setActive(!this.isActive);
    }
  }
}

class FilterColumnConcept {
  readonly id: string;
  readonly isSelectable = false; // I think this is correct
  readonly hasChildren = true;
  @observable isVisible = true;
  @observable isOpen = true;
  readonly allowMultiple = false;
  constructor(readonly name: string, readonly items: FilterValueConcept[]) {
    this.id = name;
    items.forEach(item => {
      item.parent = this;
    });
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  deactivateAllChildren() {
    this.items.forEach(item => item.setActive(false));
  }
}
