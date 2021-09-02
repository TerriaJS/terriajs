import { action, computed } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import isDefined from "../../Core/isDefined";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import ModelReference from "../../Traits/ModelReference";
import {
  BaseMapsTraits,
  BaseMapTraits
} from "../../Traits/TraitsClasses/BaseMapTraits";
import BingMapsCatalogItem from "../Catalog/CatalogItems/BingMapsCatalogItem";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import { BaseModel } from "../Definition/Model";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import filterOutUndefined from "./../../Core/filterOutUndefined";
import { defaultBaseMaps } from "./defaultBaseMaps";

export class BaseMapModel extends CreateModel(BaseMapTraits) {}

export class BaseMapsModel extends CreateModel(BaseMapsTraits) {
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
    if (!this.enabledBaseMaps) {
      return this.items;
    }

    for (const id of this.enabledBaseMaps) {
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
    return this.loadFromJson(CommonStrata.definition, {
      items: defaultBaseMaps(this.terria)
    });
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
    if (items !== undefined) {
      const { items: itemsTrait } = this.traits;
      const newItemsIds = itemsTrait.fromJson(this, stratumId, items);
      newItemsIds.pushErrorTo(errors)?.forEach((member: BaseMapModel) => {
        const existingItem = this.items.find(
          baseMap => baseMap.item === member.item
        );
        if (existingItem) {
          // object array trait doesn't automatically update model item
          existingItem.setTrait(stratumId, "image", member.image);
        } else {
          this.add(stratumId, member);
        }
      });
    }

    updateModelFromJson(this, stratumId, rest).pushErrorTo(errors);

    return new Result(
      undefined,
      TerriaError.combine(
        errors,
        `Failed to add members from JSON for model \`${this.uniqueId}\``
      )
    );
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
