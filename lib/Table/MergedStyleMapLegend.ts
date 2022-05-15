import { computed } from "mobx";
import isDefined from "../Core/isDefined";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import LegendTraits, {
  LegendItemTraits
} from "../Traits/TraitsClasses/LegendTraits";

export class MergedStyleMapLegend extends LoadableStratum(LegendTraits) {
  /**
   *
   * @param catalogItem
   * @param index index of column in catalogItem (if -1 or undefined, then default style will be used)
   */
  constructor(
    readonly legends: StratumFromTraits<LegendTraits>[],
    readonly legendItemOverrides: Partial<LegendItemTraits> = {}
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new MergedStyleMapLegend(this.legends) as this;
  }

  @computed get title() {
    return this.legends.find(l => l.title)?.title;
  }

  @computed
  get items(): StratumFromTraits<LegendItemTraits>[] {
    let items: StratumFromTraits<LegendItemTraits>[] = [];

    this.legends.forEach(legend => {
      legend.items?.forEach(currentItem => {
        const existingItemIndex = items.findIndex(
          item => item.title && item.title === currentItem.title
        );
        const existingItem = items[existingItemIndex];
        if (!existingItem) {
          items.push(
            createStratumInstance(LegendItemTraits, {
              ...this.legendItemOverrides,
              ...currentItem
            })
          );
        } else {
          console.log(currentItem);
          items[existingItemIndex] = {
            ...this.legendItemOverrides,
            ...existingItem,
            ...Object.entries(currentItem).reduce<Partial<LegendItemTraits>>(
              (acc, [key, value]) => {
                if (isDefined(value)) {
                  acc[key as keyof LegendItemTraits] = value as any;
                }
                return acc;
              },
              {}
            )
          };
        }
      });
    });

    return items;
  }
}
