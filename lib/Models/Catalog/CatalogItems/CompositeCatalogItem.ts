import i18next from "i18next";
import { action, autorun, computed, runInAction } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import Result from "../../../Core/Result";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import ModelReference from "../../../Traits/ModelReference";
import CompositeCatalogItemTraits from "../../../Traits/TraitsClasses/CompositeCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";

export default class CompositeCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CompositeCatalogItemTraits))
) {
  static readonly type = "composite";

  private _visibilityDisposer = autorun(() => {
    this.syncVisibilityToMembers();
  });

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
      members.map((id) =>
        ModelReference.isRemoved(id)
          ? undefined
          : this.terria.getModelById(BaseModel, id)
      )
    );
  }

  protected async forceLoadMetadata(): Promise<void> {
    const members = this.memberModels.filter(CatalogMemberMixin.isMixedInto);
    // Avoid calling loadX functions in a computed context
    await Promise.resolve();
    Result.combine(
      await Promise.all(
        members.map(async (model) => await model.loadMetadata())
      ),
      "Failed to load composite catalog items metadata"
    ).throwIfError();
  }

  async forceLoadMapItems(): Promise<void> {
    const members = this.memberModels.filter(MappableMixin.isMixedInto);
    // Avoid calling loadX functions in a computed context
    await Promise.resolve();
    Result.combine(
      await Promise.all(members.map((model) => model.loadMapItems())),
      "Failed to load composite catalog items mapItems"
    ).throwIfError();
  }

  syncVisibilityToMembers() {
    const { show } = this;
    this.memberModels.forEach((model) => {
      runInAction(() => {
        model.setTrait(CommonStrata.underride, "show", show);
      });
    });
  }

  @computed get mapItems() {
    const result: MapItem[] = [];
    this.memberModels.filter(MappableMixin.isMixedInto).forEach((model) => {
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

  dispose() {
    super.dispose();
    this._visibilityDisposer();
  }
}
