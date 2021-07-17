import { action, computed, observable } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import isDefined from "../../Core/isDefined";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import {
  BaseMapsTraits,
  BaseMapTraits
} from "../../Traits/TraitsClasses/BaseMapTraits";
import ModelReference from "../../Traits/ModelReference";
import BingMapsCatalogItem from "../BingMapsCatalogItem";
import CommonStrata from "../CommonStrata";
import CreateModel from "../CreateModel";
import { BaseModel } from "../Model";
import Terria from "../Terria";
import updateModelFromJson from "../updateModelFromJson";
import filterOutUndefined from "./../../Core/filterOutUndefined";
import { defaultBaseMaps } from "./defaultBaseMaps";

export class BaseMapModel extends CreateModel(BaseMapTraits) {}

export class BaseMapsModel extends CreateModel(BaseMapsTraits) {
  private readonly _defaultBaseMaps: BaseMapModel[] = [];
  private readonly _baseMapItems = observable.array<BaseMapModel>();
  /**
   * List of the basemaps to show in setting panel
   */
  @computed
  get baseMapItems() {
    return filterOutUndefined(
      this.filterBaseMapItems().map(({ item, image }) =>
        !item || ModelReference.isRemoved(item)
          ? undefined
          : {
              image: image,
              item: this.terria.getModelById(BaseModel, item)
            }
      )
    );
  }

  private filterBaseMapItems() {
    const items = this.items;
    const baseMaps: BaseMapModel[] = [];
    if (!this.useBaseMaps) {
      return this.items;
    }

    for (const id of this.useBaseMaps) {
      const baseMap = items?.find(baseMap => baseMap.item === id);
      if (baseMap?.item && !ModelReference.isRemoved(baseMap.item)) {
        baseMaps.push(baseMap);
      }
    }

    return baseMaps;
  }

  // Can't do this in constructor since {@link CatalogMemberFactory} doesn't
  // have any values at the moment of initializing Terria class.
  initializeDefaultBaseMaps(): Result {
    if (this._defaultBaseMaps.length === 0 && this.items.length === 0) {
      this._defaultBaseMaps.push(...defaultBaseMaps(this.terria));
      return this.loadFromJson(CommonStrata.definition, <any>{
        items: this._defaultBaseMaps
      });
    }
    return Result.none();
  }

  @action
  private add(stratumId: string, baseMap: BaseMapModel) {
    if (baseMap.item === undefined) {
      throw new DeveloperError(
        "A model without a `uniqueId` cannot be added to a group."
      );
    }

    const resolvedItem = this.terria.getModelById(BaseModel, <any>baseMap.item);
    if (resolvedItem instanceof BingMapsCatalogItem) {
      addBingMapsKey(resolvedItem, this.terria);
    }

    const items = this.getTrait(stratumId, "items");
    if (isDefined(items)) {
      items.push(baseMap);
    } else {
      this.setTrait(stratumId, "items", [baseMap]);
    }
  }

  @action
  loadFromJson(stratumId: CommonStrata, newBaseMaps: any): Result {
    const errors: TerriaError[] = [];
    const { items, ...rest } = newBaseMaps;
    const { items: itemsTrait } = this.traits;
    const newItemsIds = itemsTrait.fromJson(this, stratumId, items);

    newItemsIds
      .catchError(error => {
        errors.push(error);
      })
      ?.forEach((member: BaseMapModel) => {
        this.add(stratumId, member);
      });

    updateModelFromJson(this, stratumId, rest).catchError(error => {
      errors.push(error);
    });

    if (newItemsIds.error)
      return Result.error(
        TerriaError.from(
          errors,
          `Failed to add members from JSON for model \`${this.uniqueId}\``
        )
      );

    return Result.none();
  }
}

function addBingMapsKey(item: BingMapsCatalogItem, terria: Terria) {
  if (!item.key) {
    item.setTrait(
      CommonStrata.defaults,
      "key",
      terria.configParameters.bingMapsKey
    );
  }
}
