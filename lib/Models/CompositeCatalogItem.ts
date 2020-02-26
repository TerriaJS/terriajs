import CompositeCatalogItemTraits from "../Traits/CompositeCatalogItemTraits";
import CreateModel from "./CreateModel";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import { computed, action } from "mobx";
import Mappable, { MapItem } from "./Mappable";
import i18next from "i18next";
import { BaseModel } from "./Model";
import filterOutUndefined from "../Core/filterOutUndefined";
import ModelReference from "../Traits/ModelReference";
import isDefined from "../Core/isDefined";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";

export default class CompositeCatalogItem
  extends CatalogMemberMixin(CreateModel(CompositeCatalogItemTraits))
  implements Mappable {
  static readonly type = "composite";

  get type() {
    return CompositeCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.composite.name");
  }

  @computed
  get memberModels(): ReadonlyArray<BaseModel> {
    const members = this.members;
    if (members === undefined) {
      return [];
    }

    return filterOutUndefined(
      members.map(id =>
        ModelReference.isRemoved(id)
          ? undefined
          : this.terria.getModelById(BaseModel, id)
      )
    );
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  loadMapItems(): Promise<void> {
    return Promise.all(
      this.memberModels.filter(Mappable.is).map(model => model.loadMapItems())
    ).then(() => {});
  }

  @computed get mapItems() {
    // this.memberModels.forEach(model => {
    //   runInAction(() => {
    //     model.setTrait(CommonStrata.definition, "show", this.show);
    //   });
    // });

    const result: MapItem[] = [];
    this.memberModels.filter(Mappable.is).forEach(model => {
      result.push(...model.mapItems);
    });
    return result;
  }

  @action
  add(stratumId: string, member: BaseModel) {
    if (member.uniqueId === undefined) {
      throw new DeveloperError(
        "A model without a `uniqueId` cannot be added to a composite."
      );
    }

    if (!isDefined(this.terria.getModelById(BaseModel, member.uniqueId))) {
      this.terria.addModel(member);
    }

    const members = this.getTrait(stratumId, "members");
    if (isDefined(members)) {
      members.push(member.uniqueId);
    } else {
      this.setTrait(stratumId, "members", [member.uniqueId]);
    }
  }
}
