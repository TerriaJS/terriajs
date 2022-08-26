import { action, computed, observable } from "mobx";
import isDefined from "../../Core/isDefined";
import { CompositeBarItemController } from "./CompositeBarItemController";

export type ScreenSize = "small" | "medium" | "any";

export enum CompositeOrientation {
  HORIZONTAL,
  VERTICAL
}

export interface ICompositeBarOptions {
  readonly orientation: CompositeOrientation;
  readonly compositeSize: number;
  readonly overflowActionWidth: number;
  readonly overflowActionHeight: number;
  readonly preventLoopNavigation?: boolean;
}

export interface ICompositeBarItem<
  ItemController extends CompositeBarItemController
> {
  id: string;
  name: string;
  title?: string;
  screenSize?: ScreenSize;
  order?: number;
  controller: ItemController;
}

export abstract class CompositeBarModel<
  CompositeBarItem extends ICompositeBarItem<CompositeBarItemController>
> {
  @observable
  private _items: CompositeBarItem[] = [];
  private readonly options?: ICompositeBarOptions;

  protected constructor(
    items?: CompositeBarItem[],
    options?: ICompositeBarOptions
  ) {
    if (options) {
      this.options = options;
    }
    if (items) {
      this.setItems(items);
    }
  }

  @computed
  get items(): CompositeBarItem[] {
    return this._items;
  }

  @computed
  get visibleItems(): CompositeBarItem[] {
    return this.items.filter((item) => item.controller.visible);
  }

  get pinnedItems(): CompositeBarItem[] {
    return this.items.filter(
      (item) => item.controller.visible && item.controller.pinned
    );
  }

  setItems(items: CompositeBarItem[]) {
    const result: CompositeBarItem[] = [];
    if (!this.items || this.items.length === 0) {
      this._items = items.map((item) => {
        return this.createCompositeBarItem(item);
      });
    } else {
      const existingItems = this.items;
      for (const newItem of items) {
        const existingItem = existingItems.filter(
          ({ id }) => id === newItem.id
        )[0];
        if (existingItem) {
          existingItem.controller = newItem.controller;
          existingItem.name = newItem.name;
          existingItem.title = newItem.title;
          existingItem.screenSize = newItem.screenSize;
          result.push(existingItem);
        } else {
          result.push(this.createCompositeBarItem(newItem));
        }
      }
      this._items = result;
    }
  }

  @action.bound
  protected add(newItem: CompositeBarItem, requestedIndex?: number) {
    const existingItem = this.findItem(newItem.id);
    if (existingItem) {
      existingItem.name = newItem.name;
      existingItem.controller = newItem.controller;
      existingItem.title = newItem.title;
      existingItem.screenSize = newItem.screenSize;
      existingItem.order = newItem.order;
    } else {
      const item = this.createCompositeBarItem(newItem);
      if (isDefined(requestedIndex)) {
        let index = 0;
        let rIndex = requestedIndex;
        while (rIndex > 0 && index < this.items.length) {
          if (this.items[index++].controller.visible) {
            rIndex--;
          }
        }

        this.items.splice(index, 0, item);
      } else if (!isDefined(item.order)) {
        this.items.push(item);
      } else {
        let index = 0;
        while (
          index < this.items.length &&
          typeof this.items[index].order === "number" &&
          (this.items[index].order as number) < item.order
        ) {
          index++;
        }
        this.items.splice(index, 0, item);
      }
    }
  }

  @action
  remove(id: string): void {
    for (let index = 0; index < this.items.length; index++) {
      if (this.items[index].id === id) {
        this.items.splice(index, 1);
        return;
      }
    }
  }

  @action.bound
  hide(id: string): void {
    for (const item of this.items) {
      if (item.id === id) {
        if (item.controller.visible) {
          item.controller.setVisible(false);
          return;
        }
        return;
      }
    }
  }

  @action.bound
  show(id: string): void {
    for (const item of this.items) {
      if (item.id === id) {
        if (!item.controller.visible) {
          item.controller.setVisible(true);
          return;
        }
        return;
      }
    }
  }

  @action
  disable(id: string): void {
    for (const item of this.items) {
      if (item.id === id) {
        if (!item.controller.disabled) {
          item.controller.disabled = true;
          return;
        }
        return;
      }
    }
  }

  @action
  enable(id: string): void {
    for (const item of this.items) {
      if (item.id === id) {
        if (item.controller.disabled) {
          item.controller.disabled = false;
          return;
        }
        return;
      }
    }
  }

  @action
  move(compositeId: string, toCompositeId: string): void {
    const fromIndex = this.findIndex(compositeId);
    const toIndex = this.findIndex(toCompositeId);

    // Make sure both items are known to the model
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const sourceItem = this.items.splice(fromIndex, 1)[0];
    this.items.splice(toIndex, 0, sourceItem);
  }

  @action
  setPinned(id: string, pinned: boolean): void {
    for (const item of this.items) {
      if (item.id === id) {
        if (item.controller.pinned !== pinned) {
          item.controller.pinned = pinned;
          return;
        }
        return;
      }
    }
  }

  @action.bound
  setCollapsed(id: string, collapsed: boolean): void {
    const item = this.findItem(id);
    if (item) {
      item.controller.collapsed = collapsed;
    }
  }

  findItem(id: string): CompositeBarItem | undefined {
    return this.items.filter((item) => item.id === id)[0];
  }

  protected createCompositeBarItem(item: CompositeBarItem): CompositeBarItem {
    return item;
  }

  private findIndex(id: string): number {
    for (let index = 0; index < this.items.length; index++) {
      if (this.items[index].id === id) {
        return index;
      }
    }
    return -1;
  }
}
