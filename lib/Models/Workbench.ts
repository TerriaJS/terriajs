import i18next from "i18next";
import { action, computed, observable } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import TerriaError from "../Core/TerriaError";
import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import TimeFilterMixin from "../ModelMixins/TimeFilterMixin";
import CommonStrata from "../Models/CommonStrata";
import Chartable from "./Chartable";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";

interface WorkbenchItem extends BaseModel {
  supportsReordering?: boolean;
  keepOnTop?: boolean;
}

export default class Workbench {
  private readonly _items = observable.array<WorkbenchItem>();

  /**
   * Gets or sets the list of items on the workbench.
   */
  @computed
  get items(): readonly WorkbenchItem[] {
    return this._items.map(dereferenceModel);
  }
  set items(items: readonly WorkbenchItem[]) {
    this._items.spliceWithArray(0, this._items.length, items.slice());
  }

  /**
   * Gets the unique IDs of the items in the workbench.
   */
  @computed
  get itemIds(): readonly string[] {
    return filterOutUndefined(this._items.map(item => item.uniqueId));
  }

  /**
   * Gets the unique IDs of the items in the workbench.
   */
  @computed
  get shouldExpandAll(): boolean {
    return this._items.every(item => !(<any>item).isOpenInWorkbench);
  }

  /**
   * Checks if the workbench contains time-based WMS
   */
  @computed
  get hasTimeWMS(): boolean {
    return this._items.some(
      item =>
        item.type === "wms" &&
        TimeFilterMixin.isMixedInto(item) &&
        item.discreteTimesAsSortedJulianDates?.length
    );
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
    this._items.clear();
  }

  /**
   * Collapses all models from the workbench.
   */
  @action
  collapseAll() {
    this._items.map(item => {
      item.setTrait(CommonStrata.user, "isOpenInWorkbench", false);
    });
  }

  /**
   * Expands all models from the workbench.
   */
  @action
  expandAll() {
    this._items.map(item => {
      item.setTrait(CommonStrata.user, "isOpenInWorkbench", true);
    });
  }

  /**
   * Adds an item to the workbench. If the item is already present, this method does nothing.
   * Note that the model's dereferenced equivalent may appear in the {@link Workbench#items} list
   * rather than the model itself.
   * @param item The model to add.
   */
  @action
  private insertItem(item: WorkbenchItem, index: number = 0) {
    if (this.contains(item)) {
      return;
    }

    const targetItem: WorkbenchItem = dereferenceModel(item);

    // Keep reorderable data sources (e.g.: imagery layers) below non-orderable ones (e.g.: GeoJSON).
    if (targetItem.supportsReordering) {
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

    if (!targetItem.keepOnTop) {
      while (
        index < this.items.length &&
        this.items[index].keepOnTop &&
        this.items[index].supportsReordering === targetItem.supportsReordering
      ) {
        ++index;
      }
    } else {
      while (
        index > 0 &&
        this.items.length > 0 &&
        this.items[index - 1].keepOnTop &&
        this.items[index - 1].supportsReordering ===
          targetItem.supportsReordering
      ) {
        --index;
      }
    }

    // Make sure the reference, rather than the target, is added to the items list.
    const referenceItem = item.sourceReference ? item.sourceReference : item;
    this._items.splice(index, 0, referenceItem);
  }

  /**
   * Adds or removes a model to/from the workbench. If the model is a reference,
   * it will also be dereferenced. If, after dereferencing, the item turns out not to
   * be {@link Mappable} or {@link Chartable} but it is a {@link GroupMixin}, it will
   * be removed from the workbench. If it is mappable, `loadMapItems` will be called.
   * If it is chartable, `loadChartItems` will be called.
   *
   * @param item The item to add to or remove from the workbench.
   */
  public async add(item: BaseModel | BaseModel[]): Promise<void> {
    if (Array.isArray(item)) {
      return await Promise.all(item.map(i => this.add(i))).then(
        () => undefined
      );
    }

    this.insertItem(item);

    try {
      if (ReferenceMixin.is(item)) {
        await item.loadReference();

        const target = item.target;
        if (
          target &&
          GroupMixin.isMixedInto(target) &&
          !Mappable.is(target) &&
          !Chartable.is(target)
        ) {
          this.remove(item);
        } else if (target) {
          return this.add(target);
        }
      }

      if (Mappable.is(item)) {
        await item.loadMapItems();
      }

      if (Chartable.is(item)) {
        await item.loadChartItems();
      }
    } catch (e) {
      this.remove(item);
      throw e instanceof TerriaError
        ? e
        : new TerriaError({
            title: i18next.t("workbench.addItemErrorTitle"),
            message: i18next.t("workbench.addItemErrorMessage")
          });
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

  /**
   * Used to re-order the workbench list.
   * @param item The model to be moved.
   * @param newIndex The new index to shift the model to.
   */
  @action
  moveItemToIndex(item: BaseModel, newIndex: number) {
    if (!this.contains(item)) {
      return;
    }
    this._items.splice(this.indexOf(item), 1);
    this._items.splice(newIndex, 0, item);
  }
}

function dereferenceModel(model: BaseModel): BaseModel {
  if (ReferenceMixin.is(model) && model.target !== undefined) {
    return model.target;
  }
  return model;
}
