import { BaseModel } from "../Definition/Model";
import { observable, action } from "mobx";
import { defaultValue as defaultValue } from "cesium";
import { defined as defined } from "cesium";
import GroupMixin from "../../ModelMixins/GroupMixin";

export interface SearchResultOptions {
  name?: string;
  tooltip?: string;
  isImportant?: boolean;
  clickAction?: () => void;
  catalogItem?: BaseModel;
  location?: { longitude: number; latitude: number };
}

export default class SearchResult {
  @observable name: string;
  @observable tooltip: string | undefined;
  @observable isImportant: boolean;
  @observable clickAction: (() => void) | undefined;
  @observable catalogItem: BaseModel | undefined;
  @observable isOpen = false;
  @observable type: string = "search_result";
  @observable location: { longitude: number; latitude: number } | undefined;

  constructor(options: SearchResultOptions) {
    this.name = defaultValue(options.name, "Unknown");
    this.tooltip = options.tooltip;
    this.isImportant = defaultValue(options.isImportant, false);
    this.clickAction = options.clickAction;
    this.catalogItem = options.catalogItem;
    this.location = options.location;
  }

  @action
  toggleOpen() {
    if (!defined(this.catalogItem)) {
      return;
    }

    this.isOpen = !this.isOpen;

    // Load this group's items (if we haven't already) when it is opened.
    if (this.isOpen && GroupMixin.isMixedInto(this.catalogItem)) {
      this.catalogItem
        .loadMembers()
        .then((result) => result.raiseError(this.catalogItem!.terria));
    }
  }
}
