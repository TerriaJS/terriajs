import { observable, computed, action } from "mobx";
import { BaseModel } from "./Model";
import isDefined from "../Core/isDefined";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";

export default class Workbench {
  @observable
  private readonly _items: BaseModel[] = [];

  /**
   * Gets the list of items on the workbench.
   */
  @computed
  get items(): readonly BaseModel[] {
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
  add(item: BaseModel) {
    if (!this.contains(item)) {
      this._items.push(item);
    }
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
