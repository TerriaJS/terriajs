import { observable, runInAction, toJS } from "mobx";
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

  constructor(id: string, terria: Terria) {
    super(id, terria);

    this.setTrait(
      CommonStrata.defaults,
      "distributionFormats",
      MagdaCatalogItem.defaultDistributionFormats
    );
  }

  protected forceLoadReference(
    previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    return new Promise(resolve => {
      const url = this.url;
      const recordUri = this.buildMagdaRecordUri({
        id: this.groupId,
        optionalAspects: ["group", "terria"],
        dereference: true
      });

      if (url === undefined || recordUri === undefined) {
        throw new TerriaError({
          sender: this,
          title: "MagdaCatalogGroup cannot load",
          message:
            "MagdaCatalogGroup requires that `url` and `groupId` be specified."
        });
      }

      const proxiedUrl = proxyCatalogItemUrl(this, recordUri.toString(), "1d");

      const terria = this.terria;
      const id = this.globalId;
      const name = this.name;
      const definition = toJS(this.definition);
      const distributionFormats = this.preparedDistributionFormats;

      const jsonPromise = makeRealPromise<JsonValue>(loadJson(proxiedUrl));
      const loadPromise = jsonPromise.then(groupJson => {
        if (!isJsonObject(groupJson) || !isJsonObject(groupJson.aspects)) {
          return;
        }

        const terriaAspect = isJsonObject(groupJson.aspects.terria)
          ? groupJson.aspects.terria
          : {};
        const groupAspect = isJsonObject(groupJson.aspects.group)
          ? groupJson.aspects.group
          : {};

        const groupDefinition: any = {
          id: id,
          name: name,
          type:
            typeof terriaAspect.type === "string" ? terriaAspect.type : "group",
          members: Array.isArray(groupAspect.members)
            ? groupAspect.members.map((member: any) =>
                magdaRecordToCatalogMemberDefinition({
                  magdaBaseUrl: url,
                  record: member,
                  definition: definition,
                  distributionFormats: distributionFormats
                })
              )
            : []
        };

        // If the `terria` aspect has `members`, remove any that are simple
        // strings. We need the actual member definitions, which we'll get from
        // the dereferenced `group` aspect.
        // TODO: merge the terria definition with our traits definition, don't just choose one or the other.
        const terriaDefinition = isJsonObject(terriaAspect.definition)
          ? terriaAspect.definition
          : definition;
        if (terriaDefinition !== undefined) {
          Object.keys(terriaDefinition).forEach(key => {
            const value = terriaDefinition[key];
            if (key === "members" && Array.isArray(value)) {
              value.forEach(member => {
                if (typeof member !== "string") {
                  groupDefinition.members.push(member);
                }
              });
            } else {
              groupDefinition[key] = value;
            }
          });
        }

        const dereferenced =
          previousTarget && previousTarget.type === groupDefinition.type
            ? previousTarget
            : CatalogMemberFactory.create(groupDefinition.type, id, terria);

        // TODO: if this model already exists, should we replace
        // its definition stratum entirely rather than updating it?
        upsertModelFromJson(
          CatalogMemberFactory,
          terria,
          id,
          dereferenced,
          CommonStrata.definition,
          groupDefinition
        );

        if (GroupMixin.isMixedInto(dereferenced)) {
          return dereferenced.loadMembers().then(() => dereferenced);
        } else if (CatalogMemberMixin.isMixedInto(dereferenced)) {
          return dereferenced.loadMetadata().then(() => dereferenced);
        }
        return Promise.resolve(dereferenced);
      });
      resolve(loadPromise);
    });
  }

  protected forceLoadMetadata(): Promise<void> {
    return this.loadReference();
  }

  protected get loadMembersPromise(): Promise<void> {
    return this.loadReference();
  }
}
