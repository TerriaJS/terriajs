import { observable, computed, action } from "mobx";

import { BaseModel } from "./Model";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";

interface WorkbenchItem extends BaseModel {
  supportsReordering?: boolean;
  keepOnTop?: boolean;
}

export default class Workbench {
  @observable
  private readonly _items: WorkbenchItem[] = [];

  /**
   * Gets the list of items on the workbench.
   */
  @computed
  get items(): readonly WorkbenchItem[] {
    return this._items.map(dereferenceModel);
  }

  /**
   * Removes a model or its dereferenced equivalent from the workbench.
   * @param item The model.
   */
  @action
  remove(item: BaseModel) {
    const index = this.indexOf(item);
    if (index >= 0) {
      this._items.splice(index, 1);
    }
  }

  /**
   * Removes all models from the workbench.
   */
  @action
  removeAll() {
    this._items.length = 0;
  }

  /**
   * Adds an item to the workbench. If the item is already present, this method does nothing.
   * Note that the model's dereferenced equivalent may appear in the {@link Workbench#items} list
   * rather than the model itself.
   * @param item The model to add.
   */
  @action
  add(item: WorkbenchItem, index: number = 0) {
    if (this.contains(item)) {
      return;
    }

    // Keep reorderable data sources (e.g.: imagery layers) below non-orderable ones (e.g.: GeoJSON).
    if (item.supportsReordering) {
      while (
        index < this.items.length &&
        !this.items[index].supportsReordering
      ) {
        ++index;
      }
    } else {
      while (
        index > 0 &&
        this.items.length > 0 &&
        this.items[index - 1].supportsReordering
      ) {
        --index;
      }
    }

    if (!item.keepOnTop) {
      while (
        index < this.items.length &&
        this.items[index].keepOnTop &&
        this.items[index].supportsReordering === item.supportsReordering
      ) {
        ++index;
      }
    } else {
      while (
        index > 0 &&
        this.items.length > 0 &&
        this.items[index - 1].keepOnTop &&
        this.items[index - 1].supportsReordering === item.supportsReordering
      ) {
        --index;
      }
    }

    this._items.splice(index, 0, item);
  }

  /**
   * Determines if a given model or its dereferenced equivalent exists in the workbench list.
   * @param item The model.
   * @returns True if the model or its dereferenced equivalent exists on the workbench; otherwise, false.
   */
  contains(item: BaseModel) {
    return this.indexOf(item) >= 0;
  }

  /**
   * Returns the index of a given model or its dereferenced equivalent in the workbench list.
   * @param item The model.
   * @returns The index of the model or its dereferenced equivalent, or -1 if neither exist on the workbench.
   */
  indexOf(item: BaseModel) {
    return this.items.findIndex(
      model =>
        model === item || dereferenceModel(model) === dereferenceModel(item)
    );
  }
}

function dereferenceModel(model: BaseModel): BaseModel {
  if (ReferenceMixin.is(model) && model.dereferenced !== undefined) {
    return model.dereferenced;
  }
  return model;
}
