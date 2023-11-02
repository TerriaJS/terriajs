import { action } from "mobx";
import { ReactNode } from "react";
import isDefined from "../../Core/isDefined";
import Terria from "../../Models/Terria";
import {
  CompositeBarModel,
  ICompositeBarItem,
  ICompositeBarOptions
} from "../CompositeBar/CompositeBarModel";
import MapNavigationItemController from "./MapNavigationItemController";

export const OVERFLOW_ITEM_ID = "overflow-item";
export type NavigationItemLocation = "TOP" | "BOTTOM";

export interface IMapNavigationItem
  extends ICompositeBarItem<MapNavigationItemController> {
  location: NavigationItemLocation;
  noExpand?: boolean;
  render?: ReactNode;
}

export default class MapNavigationModel extends CompositeBarModel<IMapNavigationItem> {
  constructor(
    protected readonly terria: Terria,
    items?: IMapNavigationItem[],
    options?: ICompositeBarOptions
  ) {
    super(items, options);
  }

  @action.bound
  addItem(newItem: IMapNavigationItem, requestedIndex?: number) {
    const elementConfig = this.terria.elements.get(newItem.id);
    if (elementConfig && isDefined(elementConfig.visible)) {
      newItem.controller.setVisible(elementConfig.visible);
    }
    super.add(newItem, requestedIndex);
  }

  protected createCompositeBarItem(
    item: IMapNavigationItem
  ): IMapNavigationItem {
    return item;
  }
}
