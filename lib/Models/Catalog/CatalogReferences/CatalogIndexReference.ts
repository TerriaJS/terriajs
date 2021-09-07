import filterOutUndefined from "../../../Core/filterOutUndefined";
import flatten from "../../../Core/flatten";
import TerriaError from "../../../Core/TerriaError";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../../ModelMixins/ReferenceMixin";
import CatalogIndexReferenceTraits from "../../../Traits/TraitsClasses/CatalogIndexReferenceTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";

export default class CatalogIndexReference extends ReferenceMixin(
  CreateModel(CatalogIndexReferenceTraits)
) {
  protected readonly weakReference = true;
  static readonly type = "catalog-index-reference";

  get type() {
    return CatalogIndexReference.type;
  }

  protected async forceLoadReference(
    previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    if (this.uniqueId === undefined) {
      return;
    }

    // If member already exists - return it
    let member = this.terria.getModelById(BaseModel, this.uniqueId);
    if (member) {
      return member;
    }

    const errors: TerriaError[] = [];

    const findContainers = (model: CatalogIndexReference): string[] => {
      const knownContainerUniqueIds: string[] = [
        ...model.memberKnownContainerUniqueIds,
        ...flatten(
          filterOutUndefined(
            model.memberKnownContainerUniqueIds.map(parentId => {
              const parent = this.terria.catalogIndex?.get(parentId);
              if (parent) {
                return findContainers(parent);
              }
            })
          )
        )
      ];
      return knownContainerUniqueIds;
    };

    const containers = findContainers(this).reverse();

    // No member exists, so try to load containers (parent groups)
    if (containers) {
      for (let i = 0; i < containers.length; i++) {
        const containerId = containers[i];
        let container = this.terria.getModelById(BaseModel, containerId);
        if (!container) {
          errors.push(
            TerriaError.from(`Failed to find containerID ${containerId}`)
          );
        }

        if (ReferenceMixin.isMixedInto(container)) {
          (await container.loadReference()).pushErrorTo(
            errors,
            `Failed to load reference ${container.uniqueId}`
          );
          container = container.target ?? container;
        }

        if (GroupMixin.isMixedInto(container)) {
          (await container.loadMembers()).pushErrorTo(
            errors,
            `Failed to load group ${container.uniqueId}`
          );
        }
      }
    }

    // Does member exist now? - return it
    member = this.terria.getModelById(BaseModel, this.uniqueId);
    if (member) {
      // member.sourceReference = target.sourceReference
      return member;
    }

    // No member exists - throw error
    throw TerriaError.combine(
      errors,
      `Failed to find member ${this.uniqueId}`
    ) ?? TerriaError.from(`Failed to find member ${this.uniqueId}`);
  }
}
