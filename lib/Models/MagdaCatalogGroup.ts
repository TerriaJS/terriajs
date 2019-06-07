import { observable, runInAction } from "mobx";
import JsonValue, { isJsonObject } from "../Core/Json";
import loadJson from "../Core/loadJson";
import makeRealPromise from "../Core/makeRealPromise";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MagdaMixin from "../ModelMixins/MagdaMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import MagdaCatalogGroupTraits from "../Traits/MagdaCatalogGroupTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import MagdaCatalogItem from "./MagdaCatalogItem";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import Terria from "./Terria";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import GroupMixin from "../ModelMixins/GroupMixin";
import magdaRecordToCatalogMemberDefinition from "./magdaRecordToCatalogMember";

export default class MagdaCatalogGroup extends MagdaMixin(
  GroupMixin(
    ReferenceMixin(
      UrlMixin(CatalogMemberMixin(CreateModel(MagdaCatalogGroupTraits)))
    )
  )
) {
  static readonly type = "magda-group";
  get type() {
    return MagdaCatalogGroup.type;
  }

  @observable
  private _reference: BaseModel | undefined;

  constructor(id: string, terria: Terria) {
    super(id, terria);

    this.setTrait(
      CommonStrata.defaults,
      "distributionFormats",
      MagdaCatalogItem.defaultDistributionFormats
    );
  }

  get dereferenced(): BaseModel | undefined {
    return this._reference;
  }

  protected get loadReferencePromise(): Promise<void> {
    return Promise.resolve().then(() => {
      const recordUri = this.buildRecordUri(this.groupId, {
        optionalAspects: ["group", "terria"],
        dereference: true
      });

      if (recordUri === undefined) {
        throw new TerriaError({
          sender: this,
          title: "MagdaCatalogGroup cannot load",
          message:
            "MagdaCatalogGroup requires that `url` and `groupId` be specified."
        });
      }

      const proxiedUrl = proxyCatalogItemUrl(this, recordUri.toString(), "1d");

      const loadPromise = makeRealPromise<JsonValue>(loadJson(proxiedUrl));
      return loadPromise.then(groupJson => {
        if (!isJsonObject(groupJson) || !isJsonObject(groupJson.aspects)) {
          return;
        }

        const terria = isJsonObject(groupJson.aspects.terria)
          ? groupJson.aspects.terria
          : {};
        const group = isJsonObject(groupJson.aspects.group)
          ? groupJson.aspects.group
          : {};

        const groupDefinition = {
          id: this.id + ":dereferenced",
          name: this.name,
          type: terria.type ? terria.type : "group",
          members: Array.isArray(group.members) ? group.members.map((member: any) => magdaRecordToCatalogMemberDefinition(member, {
            definition: this.definition,
            distributionFormats: this.distributionFormats
          })) : [],
          // TODO: merge the terria definition with our traits definition, don't just choose one or the other.
          ...(isJsonObject(terria.definition)
            ? terria.definition
            : this.definition)
        };

        const dereferenced = upsertModelFromJson(
          CatalogMemberFactory,
          this.terria,
          this.id,
          undefined,
          CommonStrata.definition,
          groupDefinition
        );

        runInAction(() => {
          this._reference = dereferenced;
        });
      });
    });
  }

  protected get loadMetadataPromise(): Promise<void> {
    return this.loadReference();
  }

  protected get loadMembersPromise(): Promise<void> {
    return this.loadReference();
  }
}
