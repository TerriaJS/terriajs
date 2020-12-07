import { action, computed, observable } from "mobx";
import isDefined from "../../../Core/isDefined";
import ViewerMode from "./../../../Models/ViewerMode";

type Location = "TOP" | "BOTTOM";
type ScreenSize = "small" | "medium";

export const OverflowItemId = "overflowItem";

type MapNavigationItemBase = {
  /** Unique identifier of navigation item. */
  id: string;
  /** Name of the navigation item. */
  name: string;
  /** Title of the navigation item. */
  title?: string;
  /** Glyph icon for the navigation item. */
  glyph?: any;
  /** The location of the item. */
  location: Location;
  /** Wheter item is visible at all. */
  hideItem: boolean;
  /** Custom renderer. */
  render?: React.ReactNode;
  order?: number;
  /** Set the viewer this navigation item should be available.
   * Leave undefined if it should be visible in both viewers.
   */
  viewerMode?: ViewerMode;
  /** On which screen size this navigation item should be available.
   * Leave undefined if it should be visible on all screen sizes. */
  screenSize?: ScreenSize;
  /** MapIconButton props.*/
  mapIconButtonProps?: { [spread: string]: any };
  /** Height of the element. This is only a fallback if we can't determine the height. The height should be correctly calculated for all non collapsed items on initial render. */
  height: number;
  /** Width of the element. This is only a fallback if we can't determine the width. The height should be correctly calculated for all non collapsed items on initial render. */
  width: number;
  /** ReactRef for the navigation item. */
  itemRef: React.RefObject<HTMLDivElement>;
};

export type MapNavigationItem =
  | (MapNavigationItemBase & {
      /** If true item won't be collapsed. */
      pinned: true;
      /** If true item will be shown as collapsed by default. */
      forceCollapsed?: false;
      /** On click action for the button */
      onClick?: (props?: { [sprad: string]: any }) => void;
    })
  | (MapNavigationItemBase & {
      /** If true item won't be collapsed. */
      pinned: false;
      /** If true item will be shown as collapsed by default. */
      forceCollapsed?: boolean;
      /** On click action for the button */
      onClick: (props?: { [sprad: string]: any }) => void;
    });

export type MapNavigationItemExtended = MapNavigationItem & {
  collapsed?: boolean;
};

export default class MapNavigationModel {
  @observable
  activeItem?: MapNavigationItemExtended;

  @observable
  private _items: MapNavigationItemExtended[] = [];

  constructor(items?: MapNavigationItem[]) {
    if (items) {
      this.setItems(items);
    }
  }

  @computed
  get items(): MapNavigationItemExtended[] {
    return this._items;
  }

  /**
   * This will set the list of navigation items.
   * If there is no existing navigation items we just set new ones.
   * If there are existing items we check every by id, and update if it already exist.
   * Existing ones won't be added to the list if not already there.
   *
   * @param items[] array of navigation items
   */
  setItems(items: MapNavigationItem[]) {
    const result: MapNavigationItemExtended[] = [];
    if (!this.items || this.items.length === 0) {
      this._items = items.map((item: MapNavigationItemExtended) => {
        item.collapsed = item.forceCollapsed || false;
        return item;
      });
    } else {
      const existingItems = this.items;
      for (let index = 0; index < items.length; index++) {
        const newItem: MapNavigationItemExtended = items[index];
        const existingItem = existingItems.filter(
          ({ id }) => id === newItem.id
        )[0];
        if (existingItem) {
          existingItem.pinned = newItem.pinned;
          existingItem.forceCollapsed = newItem.forceCollapsed;
          existingItem.glyph = newItem.glyph;
          existingItem.hideItem = newItem.hideItem;
          existingItem.height = newItem.height;
          existingItem.width = newItem.width;
          existingItem.mapIconButtonProps = newItem.mapIconButtonProps;
          existingItem.onClick = newItem.onClick;

          result.push(existingItem);
        } else {
          newItem.collapsed = newItem.forceCollapsed || false;
          result.push(newItem);
        }
      }
      this._items = result;
    }
  }

  /**
   * Filters the list of the items for pinned items.
   * @returns {MapNavigationItemExtended[]} List of navigation items that won't be collapsed.
   */
  @computed
  get pinnedItems(): MapNavigationItemExtended[] {
    return this.items.filter(item => !item.hideItem && item.pinned);
  }

  /**
   * Filters list of the items for items that should be shown in navigation bar.
   * @returns {MapNavigationItemExtended[]} List of navigation items that should be visible
   */
  @computed
  get enabledItems(): MapNavigationItemExtended[] {
    return this.items.filter(item => !item.hideItem && !item.forceCollapsed);
  }

  /**
   * Filters the list of the items and remove, hidden and collapsed items.
   * @returns {MapNavigationItemExtended[]} List of navigation items to show in navigation bar.
   */
  @computed
  get visibleItems(): MapNavigationItemExtended[] {
    return this.items.filter(
      item => !item.hideItem && !item.forceCollapsed && !item.collapsed
    );
  }

  /**
   * Filters the list of the items and returns the list of items to show as collapsed.
   * @returns {MapNavigationItemExtended[]} List of collapsed navigation items.
   */
  @computed
  get collapsedItems(): MapNavigationItemExtended[] {
    return this.items.filter(
      item => !item.hideItem && (item.collapsed || item.forceCollapsed)
    );
  }

  /**
   * Add a new navigation item to the list of items.
   * If there is an navigation item with same ID we update it, otherwise we add it to requested position or at the end of the list
   * @param {MapNavigationItem} itemToAdd A navigation item that should be added.
   * @param {number} requestedIndex A position that navigation item should be added.
   */
  @action.bound
  addItem(itemToAdd: MapNavigationItem, requestedIndex?: number): void {
    let item: MapNavigationItemExtended = this.findItem(itemToAdd.id);
    // item found update it with new props
    if (item) {
      item.name = itemToAdd.name;
      item.hideItem = itemToAdd.hideItem || true;
      item.pinned = itemToAdd.pinned || false;
      item.glyph = itemToAdd.glyph;
      item.location = itemToAdd.location;
      item.render = itemToAdd.render;
      item.forceCollapsed = itemToAdd.forceCollapsed;
      item.collapsed = itemToAdd.forceCollapsed || false;
      item.mapIconButtonProps = itemToAdd.mapIconButtonProps;
      if (isDefined(itemToAdd.title)) {
        item.title = itemToAdd.title || itemToAdd.name;
      }
      if (isDefined(itemToAdd.order)) {
        item.order = itemToAdd.order;
      }
    } else {
      item = itemToAdd;
      item.collapsed = itemToAdd.forceCollapsed || false;
      if (isDefined(requestedIndex)) {
        // add an item to requested position
        let index = 0;
        let rIndex = requestedIndex;
        while (rIndex > 0 && index < this.items.length) {
          if (!this.items[index++].hideItem) {
            rIndex--;
          }
        }
        this.items.splice(index, 0, item);
      } else if (!isDefined(itemToAdd.order)) {
        // add item to the end of the list
        this.items.push(item);
      } else {
        // add item to the position defined by its order
        let index = 0;
        while (
          index < this.items.length &&
          typeof this.items[index].order === "number" &&
          this.items[index].order! < itemToAdd.order
        ) {
          index++;
        }
        this.items.splice(index, 0, item);
      }
    }
  }

  /**
   * Removes the navigation item from the list.
   * @param {string} id - ID of the navigation item that should be removed.
   */
  @action.bound
  removeItem(id: string): void {
    for (let index = 0; index < this.items.length; index++) {
      if (this.items[index].id === id) {
        this.items.splice(index, 1);
      }
    }
  }

  /**
   * Hides the navigation item from the UI.
   * @param {string} id - ID of the navigation item that should be hidden.
   */
  @action.bound
  hideItem(id: string) {
    const item = this.findItem(id);
    if (item) item.hideItem = true;
  }

  /**
   * Collapse the navigation item from the UI.
   * @param {string} id - ID of the navigation item that should be hidden.
   */
  @action.bound
  collapseItem(id: string) {
    const item = this.findItem(id);
    if (item && !item.pinned) item.collapsed = true;
  }

  /**
   * Set the navigation item as the active one.
   * @param {string} id - ID of the navigation item that should be activate.
   */
  @action.bound
  activateItem(id: string) {
    const item = this.findItem(id);
    if (item) this.activeItem = item;
  }

  /**
   * Deactivates the navigation item..
   */
  @action.bound
  deactivateItem() {
    this.activeItem = undefined;
  }

  /**
   * Uncollapse the navigation item from the UI.
   * @param {string} id - ID of the navigation item that should be hidden.
   */
  @action.bound
  uncollapseItem(id: string) {
    const item = this.findItem(id);
    if (item && !item.forceCollapsed) item.collapsed = false;
  }

  /**
   * Moves the item and place it to the location of another item.
   * @param itemId ID of the item to be moved.
   * @param toItemId ID of the item the item should take position of.
   */
  @action.bound
  moveItem(itemId: string, toItemId: string): void {
    const fromIndex = this.findIndex(itemId);
    const toIndex = this.findIndex(toItemId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const sourceItem = this.items.splice(fromIndex, 1)[0];
    this.items.splice(toIndex, 0, sourceItem);
  }

  /**
   * Set item to be pinned. This means that this item won't be collapsed.
   * @param id ID of the item to be pinned.
   * @param pinned
   */
  @action.bound
  setPinned(id: string, pinned: boolean) {
    const item = this.findItem(id);
    if (item) {
      if (item.forceCollapsed) {
        console.error("Setting pinned for forceCollapsed item.");
      }
      if (item.collapsed && !item.forceCollapsed) {
        item.collapsed = false;
      }
      item.pinned = pinned;
    }
  }

  /**
   * Finds the navigation item by id.
   * @param {string} id - ID of the navigation item
   * @returns {MapNavigationItemExtended}
   */
  private findItem(id: string): MapNavigationItemExtended {
    return this.items.filter(item => item.id === id)[0];
  }

  /**
   * Determines the position of the item in the list.
   * @param id - ID of the navigation item
   * @returns {number} - Position of naigation item or -1 if not found.
   */
  private findIndex(id: string): number {
    for (let index = 0; index < this.items.length; index++) {
      if (this.items[index].id === id) {
        return index;
      }
    }
    return -1;
  }
}
